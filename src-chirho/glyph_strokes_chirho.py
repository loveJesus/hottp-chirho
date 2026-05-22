#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Stroke / centerline visualizer for the v3 bitmap glyph library.

Phase-1 experiment for the user's idea: instead of treating a glyph as a
blob, "line-draw" it — extract the medial-axis skeleton, split it into
branches at endpoints/junctions, simplify (Ramer-Douglas-Peucker) and smooth
(Catmull-Rom -> cubic Bezier) each branch, and overlay the result on the
bitmap. A per-glyph STROKE SIGNATURE (endpoints / junctions / branches /
total length / length-over-bbox) is computed so we can see how distinctive
each letter's stroke topology is — especially yod, which is hypothesized to
be findable even when its bitmap fuses into a neighbour.

NOTE centerline, not outline: src-chirho/vectorize_glyphs_chirho.py traces
the OUTLINE via potrace (for domain-randomization). This is the medial axis
(for recognition), a different representation.

Output: workspace-chirho/glyph-strokes-chirho/strokes-chirho.html
Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/glyph_strokes_chirho.py
"""
import base64
import io
import math
import statistics as st
from collections import defaultdict
from pathlib import Path

import networkx as nx
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

UPSCALE_CHIRHO = 3  # smoother medial axis: a constant-width pen upscales clean

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
FONT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-chirho"
OUT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "glyph-strokes-chirho"
INK_THRESH_CHIRHO = 200
SCALE_CHIRHO = 11
RDP_EPS_CHIRHO = 1.1
YOD_CP_CHIRHO = "U+05D9"

NEIGHBORS_CHIRHO = [(-1, -1), (-1, 0), (-1, 1), (0, -1),
                    (0, 1), (1, -1), (1, 0), (1, 1)]


def zhang_suen_thin_chirho(binary_chirho: np.ndarray) -> np.ndarray:
    """Zhang-Suen iterative thinning -> 1px skeleton (no skimage needed)."""
    img_chirho = binary_chirho.astype(np.uint8).copy()
    changed_chirho = True
    while changed_chirho:
        changed_chirho = False
        for step_chirho in (0, 1):
            ys_chirho, xs_chirho = np.where(img_chirho == 1)
            to_delete_chirho = []
            for y_chirho, x_chirho in zip(ys_chirho, xs_chirho):
                if (y_chirho == 0 or y_chirho == img_chirho.shape[0] - 1
                        or x_chirho == 0 or x_chirho == img_chirho.shape[1] - 1):
                    continue
                p_chirho = [
                    img_chirho[y_chirho - 1, x_chirho], img_chirho[y_chirho - 1, x_chirho + 1],
                    img_chirho[y_chirho, x_chirho + 1], img_chirho[y_chirho + 1, x_chirho + 1],
                    img_chirho[y_chirho + 1, x_chirho], img_chirho[y_chirho + 1, x_chirho - 1],
                    img_chirho[y_chirho, x_chirho - 1], img_chirho[y_chirho - 1, x_chirho - 1],
                ]
                cChirho = sum(
                    1 for k_chirho in range(8)
                    if p_chirho[k_chirho] == 0 and p_chirho[(k_chirho + 1) % 8] == 1
                )
                nChirho = sum(p_chirho)
                if nChirho < 2 or nChirho > 6 or cChirho != 1:
                    continue
                if step_chirho == 0:
                    if p_chirho[0] * p_chirho[2] * p_chirho[4] != 0:
                        continue
                    if p_chirho[2] * p_chirho[4] * p_chirho[6] != 0:
                        continue
                else:
                    if p_chirho[0] * p_chirho[2] * p_chirho[6] != 0:
                        continue
                    if p_chirho[0] * p_chirho[4] * p_chirho[6] != 0:
                        continue
                to_delete_chirho.append((y_chirho, x_chirho))
            for y_chirho, x_chirho in to_delete_chirho:
                img_chirho[y_chirho, x_chirho] = 0
                changed_chirho = True
    return img_chirho


def trace_branches_chirho(skel_chirho: np.ndarray):
    """Split the skeleton into polyline branches between endpoints/junctions."""
    pts_chirho = set(zip(*np.where(skel_chirho == 1)))

    def nbrs_chirho(pt_chirho):
        y_chirho, x_chirho = pt_chirho
        return [
            (y_chirho + dy_chirho, x_chirho + dx_chirho)
            for dy_chirho, dx_chirho in NEIGHBORS_CHIRHO
            if (y_chirho + dy_chirho, x_chirho + dx_chirho) in pts_chirho
        ]

    deg_chirho = {p_chirho: len(nbrs_chirho(p_chirho)) for p_chirho in pts_chirho}
    specials_chirho = [p_chirho for p_chirho in pts_chirho if deg_chirho[p_chirho] != 2]
    branches_chirho = []
    used_edges_chirho = set()

    def walk_chirho(start_chirho, nxt_chirho):
        path_chirho = [start_chirho, nxt_chirho]
        used_edges_chirho.add(frozenset((start_chirho, nxt_chirho)))
        prev_chirho, cur_chirho = start_chirho, nxt_chirho
        while deg_chirho.get(cur_chirho, 0) == 2:
            cand_chirho = [n_chirho for n_chirho in nbrs_chirho(cur_chirho) if n_chirho != prev_chirho]
            if not cand_chirho:
                break
            nxt2_chirho = cand_chirho[0]
            used_edges_chirho.add(frozenset((cur_chirho, nxt2_chirho)))
            path_chirho.append(nxt2_chirho)
            prev_chirho, cur_chirho = cur_chirho, nxt2_chirho
        return path_chirho

    for sp_chirho in specials_chirho:
        for nb_chirho in nbrs_chirho(sp_chirho):
            if frozenset((sp_chirho, nb_chirho)) in used_edges_chirho:
                continue
            branches_chirho.append(walk_chirho(sp_chirho, nb_chirho))
    # Pure loops (no special node): start anywhere not yet covered.
    covered_chirho = {p_chirho for br_chirho in branches_chirho for p_chirho in br_chirho}
    for p_chirho in pts_chirho:
        if p_chirho in covered_chirho:
            continue
        nb_chirho = nbrs_chirho(p_chirho)
        if nb_chirho and frozenset((p_chirho, nb_chirho[0])) not in used_edges_chirho:
            branches_chirho.append(walk_chirho(p_chirho, nb_chirho[0]))
            covered_chirho |= {q_chirho for q_chirho in branches_chirho[-1]}
    return branches_chirho, specials_chirho, deg_chirho


def prune_spurs_chirho(skel_chirho, max_iter_chirho=12):
    """Iteratively delete short terminal twigs (a branch ending in a degree-1
    endpoint, shorter than a fraction of the glyph diagonal). Bold scan ink
    thinned by Zhang-Suen sprouts spurs at every thick spot; without this the
    topology is pure noise (yod indistinguishable from everything)."""
    # Only kill true thinning HAIRS (~1 native px). Nubs/heels/serifs (dalet's
    # heel, bet's base, tav/mem nub) are short but letter-distinctive — they
    # must survive pruning; the longest-path cover + min-stroke filter handles
    # genuine spurs without erasing these features.
    prune_len_chirho = max(2.0, 1.5 * UPSCALE_CHIRHO)
    cur_chirho = skel_chirho.copy()
    for _it_chirho in range(max_iter_chirho):
        branches_chirho, _sp_chirho, deg_chirho = trace_branches_chirho(cur_chirho)
        removed_chirho = False
        for br_chirho in branches_chirho:
            end_a_chirho = deg_chirho.get(br_chirho[0], 0)
            end_b_chirho = deg_chirho.get(br_chirho[-1], 0)
            terminal_chirho = (end_a_chirho == 1) or (end_b_chirho == 1)
            if not terminal_chirho:
                continue
            if polyline_len_chirho([(x_chirho, y_chirho) for y_chirho, x_chirho in br_chirho]) >= prune_len_chirho:
                continue
            # delete the twig pixels but keep the junction it hangs off
            for (y_chirho, x_chirho) in br_chirho:
                if deg_chirho.get((y_chirho, x_chirho), 0) >= 3:
                    continue
                cur_chirho[y_chirho, x_chirho] = 0
            removed_chirho = True
        if not removed_chirho:
            break
    return cur_chirho


def extend_ends_chirho(pts_chirho, ext_chirho):
    """Push both terminal points outward along the local tangent by ext px.
    Zhang-Suen erodes ~1 pen-radius off every stroke tip, so the raw
    centerline stops short of the ink; a hand-drawn pen stroke runs all the
    way to the mark's end. Extending makes a re-painted stroke fill the ink."""
    if len(pts_chirho) < 2 or ext_chirho <= 0:
        return pts_chirho
    out_chirho = list(pts_chirho)
    x1_chirho, y1_chirho = out_chirho[1]
    x0_chirho, y0_chirho = out_chirho[0]
    dx_chirho, dy_chirho = x0_chirho - x1_chirho, y0_chirho - y1_chirho
    n_chirho = math.hypot(dx_chirho, dy_chirho)
    if n_chirho:
        out_chirho.insert(0, (x0_chirho + dx_chirho / n_chirho * ext_chirho,
                              y0_chirho + dy_chirho / n_chirho * ext_chirho))
    xa_chirho, ya_chirho = out_chirho[-2]
    xb_chirho, yb_chirho = out_chirho[-1]
    dx2_chirho, dy2_chirho = xb_chirho - xa_chirho, yb_chirho - ya_chirho
    n2_chirho = math.hypot(dx2_chirho, dy2_chirho)
    if n2_chirho:
        out_chirho.append((xb_chirho + dx2_chirho / n2_chirho * ext_chirho,
                           yb_chirho + dy2_chirho / n2_chirho * ext_chirho))
    return out_chirho


def rdp_chirho(points_chirho, eps_chirho):
    if len(points_chirho) < 3:
        return points_chirho
    a_chirho = np.array(points_chirho[0], dtype=float)
    b_chirho = np.array(points_chirho[-1], dtype=float)
    ab_chirho = b_chirho - a_chirho
    norm_chirho = np.hypot(*ab_chirho) or 1.0
    max_d_chirho, idx_chirho = 0.0, 0
    for i_chirho in range(1, len(points_chirho) - 1):
        p_chirho = np.array(points_chirho[i_chirho], dtype=float)
        d_chirho = abs(np.cross(ab_chirho, p_chirho - a_chirho)) / norm_chirho
        if d_chirho > max_d_chirho:
            max_d_chirho, idx_chirho = d_chirho, i_chirho
    if max_d_chirho > eps_chirho:
        left_chirho = rdp_chirho(points_chirho[: idx_chirho + 1], eps_chirho)
        right_chirho = rdp_chirho(points_chirho[idx_chirho:], eps_chirho)
        return left_chirho[:-1] + right_chirho
    return [points_chirho[0], points_chirho[-1]]


def catmull_to_bezier_pts_chirho(pts_chirho, samples_chirho=10):
    """Sample a Catmull-Rom spline through pts -> smooth polyline points."""
    if len(pts_chirho) < 3:
        return pts_chirho
    out_chirho = []
    ext_chirho = [pts_chirho[0]] + list(pts_chirho) + [pts_chirho[-1]]
    for i_chirho in range(1, len(ext_chirho) - 2):
        p0_chirho = np.array(ext_chirho[i_chirho - 1], float)
        p1_chirho = np.array(ext_chirho[i_chirho], float)
        p2_chirho = np.array(ext_chirho[i_chirho + 1], float)
        p3_chirho = np.array(ext_chirho[i_chirho + 2], float)
        for s_chirho in range(samples_chirho):
            t_chirho = s_chirho / samples_chirho
            t2_chirho = t_chirho * t_chirho
            t3_chirho = t2_chirho * t_chirho
            pt_chirho = 0.5 * (
                (2 * p1_chirho)
                + (-p0_chirho + p2_chirho) * t_chirho
                + (2 * p0_chirho - 5 * p1_chirho + 4 * p2_chirho - p3_chirho) * t2_chirho
                + (-p0_chirho + 3 * p1_chirho - 3 * p2_chirho + p3_chirho) * t3_chirho
            )
            out_chirho.append((pt_chirho[0], pt_chirho[1]))
    out_chirho.append(tuple(map(float, pts_chirho[-1])))
    return out_chirho


def polyline_len_chirho(pts_chirho):
    return sum(
        math.hypot(pts_chirho[i_chirho + 1][0] - pts_chirho[i_chirho][0],
                   pts_chirho[i_chirho + 1][1] - pts_chirho[i_chirho][1])
        for i_chirho in range(len(pts_chirho) - 1)
    )


PALETTE_CHIRHO = [
    (231, 76, 60), (46, 204, 113), (52, 152, 219), (241, 196, 15),
    (155, 89, 182), (26, 188, 156), (230, 126, 34), (236, 64, 122),
]


def skeleton_graph_chirho(skel_chirho):
    """networkx graph over skeleton pixels, 8-connected, euclidean edge len."""
    g_chirho = nx.Graph()
    pts_chirho = set(zip(*np.where(skel_chirho == 1)))
    for (y_chirho, x_chirho) in pts_chirho:
        g_chirho.add_node((y_chirho, x_chirho))
        for dy_chirho, dx_chirho in NEIGHBORS_CHIRHO:
            q_chirho = (y_chirho + dy_chirho, x_chirho + dx_chirho)
            if q_chirho in pts_chirho:
                g_chirho.add_edge(
                    (y_chirho, x_chirho), q_chirho,
                    weight=math.hypot(dy_chirho, dx_chirho),
                )
    return g_chirho


def _tangent_chirho(branch_pts_chirho, at_start_chirho, k_chirho=4):
    """Unit (dy,dx) pointing OUTWARD from the branch at the given end."""
    n_chirho = len(branch_pts_chirho)
    if n_chirho < 2:
        return (0.0, 0.0)
    if at_start_chirho:
        a_chirho = branch_pts_chirho[0]
        b_chirho = branch_pts_chirho[min(n_chirho - 1, k_chirho)]
    else:
        a_chirho = branch_pts_chirho[-1]
        b_chirho = branch_pts_chirho[max(0, n_chirho - 1 - k_chirho)]
    dy_chirho = a_chirho[0] - b_chirho[0]
    dx_chirho = a_chirho[1] - b_chirho[1]
    l_chirho = math.hypot(dy_chirho, dx_chirho) or 1.0
    return (dy_chirho / l_chirho, dx_chirho / l_chirho)


def decompose_strokes_chirho(skel_chirho, min_stroke_chirho):
    """Recover the DUCTUS as a minimum stroke cover (route-inspection model).

    A stroke = one pen-down→pen-up trail. Pen LIFTS only at a capped end
    (degree-1 terminal); it flows THROUGH junctions/sharp curves picking the
    straightest unused edge. A closed loop with no caps (samekh, closed nun)
    is therefore ONE continuous stroke, not split at its tight bend. Strokes
    ≈ caps / 2 (+ 1 per cap-less loop)."""
    pts_chirho = set(zip(*np.where(skel_chirho == 1)))

    def nbrs_chirho(p_chirho):
        y_chirho, x_chirho = p_chirho
        return [
            (y_chirho + dy_chirho, x_chirho + dx_chirho)
            for dy_chirho, dx_chirho in NEIGHBORS_CHIRHO
            if (y_chirho + dy_chirho, x_chirho + dx_chirho) in pts_chirho
        ]

    used_edge_chirho = set()

    def edge_key_chirho(a_chirho, b_chirho):
        return frozenset((a_chirho, b_chirho))

    deg0_chirho = {p_chirho: len(nbrs_chirho(p_chirho)) for p_chirho in pts_chirho}
    total_edges_chirho = sum(deg0_chirho.values()) // 2

    def walk_from_chirho(start_chirho):
        trail_chirho = [start_chirho]
        cur_chirho = start_chirho
        prev_dir_chirho = None
        while True:
            nxt_opts_chirho = [
                q_chirho for q_chirho in nbrs_chirho(cur_chirho)
                if edge_key_chirho(cur_chirho, q_chirho) not in used_edge_chirho
            ]
            if not nxt_opts_chirho:
                break
            if prev_dir_chirho is None:
                chosen_chirho = nxt_opts_chirho[0]
            else:
                # straightest continuation: max dot with incoming direction
                def cont_score_chirho(q_chirho):
                    vy_chirho = q_chirho[0] - cur_chirho[0]
                    vx_chirho = q_chirho[1] - cur_chirho[1]
                    l_chirho = math.hypot(vy_chirho, vx_chirho) or 1.0
                    return (prev_dir_chirho[0] * vy_chirho / l_chirho
                            + prev_dir_chirho[1] * vx_chirho / l_chirho)
                chosen_chirho = max(nxt_opts_chirho, key=cont_score_chirho)
            used_edge_chirho.add(edge_key_chirho(cur_chirho, chosen_chirho))
            ly_chirho = chosen_chirho[0] - cur_chirho[0]
            lx_chirho = chosen_chirho[1] - cur_chirho[1]
            ln_chirho = math.hypot(ly_chirho, lx_chirho) or 1.0
            prev_dir_chirho = (ly_chirho / ln_chirho, lx_chirho / ln_chirho)
            trail_chirho.append(chosen_chirho)
            cur_chirho = chosen_chirho
        return trail_chirho

    strokes_chirho = []
    # Start at caps (degree-1) first — each open stroke begins at a pen-down
    # cap. Then degree>2 (leftover junction trails), then loops (no caps).
    start_order_chirho = (
        sorted([p_chirho for p_chirho in pts_chirho if deg0_chirho[p_chirho] == 1])
        + sorted([p_chirho for p_chirho in pts_chirho if deg0_chirho[p_chirho] >= 3])
        + sorted(pts_chirho)
    )
    for start_chirho in start_order_chirho:
        if len(used_edge_chirho) >= total_edges_chirho:
            break
        if any(edge_key_chirho(start_chirho, q_chirho) not in used_edge_chirho
               for q_chirho in nbrs_chirho(start_chirho)):
            tr_chirho = walk_from_chirho(start_chirho)
            if len(tr_chirho) >= 2:
                strokes_chirho.append(tr_chirho)

    def plen_chirho(ch_chirho):
        return sum(
            math.hypot(ch_chirho[i_chirho + 1][0] - ch_chirho[i_chirho][0],
                       ch_chirho[i_chirho + 1][1] - ch_chirho[i_chirho][1])
            for i_chirho in range(len(ch_chirho) - 1)
        )

    sig_keep_chirho = [s_chirho for s_chirho in strokes_chirho if plen_chirho(s_chirho) >= min_stroke_chirho]
    return sig_keep_chirho if sig_keep_chirho else strokes_chirho


def _decompose_strokes_legacy_chirho(skel_chirho, min_stroke_chirho):
    """Old angular-continuity pairing (kept for reference; unused)."""
    branches_chirho, _specials_chirho, deg_chirho = trace_branches_chirho(skel_chirho)
    if not branches_chirho:
        return []
    ends_chirho = {}
    node_ends_chirho = defaultdict(list)
    for bi_chirho, br_chirho in enumerate(branches_chirho):
        for side_chirho, at_start_chirho in ((0, True), (1, False)):
            node_chirho = br_chirho[0] if at_start_chirho else br_chirho[-1]
            ends_chirho[(bi_chirho, side_chirho)] = {
                "nodeChirho": node_chirho,
                "tanChirho": _tangent_chirho(br_chirho, at_start_chirho),
            }
            node_ends_chirho[node_chirho].append((bi_chirho, side_chirho))

    pair_chirho = {}
    max_dev_chirho = 60.0  # ≤60° bend stays one stroke; sharper ⇒ pen lift
    for node_chirho, elist_chirho in node_ends_chirho.items():
        if deg_chirho.get(node_chirho, 0) < 3 or len(elist_chirho) < 2:
            continue
        cands_chirho = []
        for i_chirho in range(len(elist_chirho)):
            for j_chirho in range(i_chirho + 1, len(elist_chirho)):
                ui_chirho = ends_chirho[elist_chirho[i_chirho]]["tanChirho"]
                uj_chirho = ends_chirho[elist_chirho[j_chirho]]["tanChirho"]
                dot_chirho = max(-1.0, min(1.0,
                                           ui_chirho[0] * uj_chirho[0]
                                           + ui_chirho[1] * uj_chirho[1]))
                ang_chirho = math.degrees(math.acos(dot_chirho))
                cands_chirho.append((abs(180.0 - ang_chirho),
                                     elist_chirho[i_chirho], elist_chirho[j_chirho]))
        cands_chirho.sort(key=lambda c_chirho: c_chirho[0])
        used_chirho = set()
        for dev_chirho, ei_chirho, ej_chirho in cands_chirho:
            if ei_chirho in used_chirho or ej_chirho in used_chirho:
                continue
            if dev_chirho > max_dev_chirho:
                break
            pair_chirho[ei_chirho] = ej_chirho
            pair_chirho[ej_chirho] = ei_chirho
            used_chirho.add(ei_chirho)
            used_chirho.add(ej_chirho)

    def oriented_chirho(bi_chirho, from_side_chirho):
        br_chirho = branches_chirho[bi_chirho]
        return list(br_chirho) if from_side_chirho == 0 else list(reversed(br_chirho))

    used_branch_chirho = set()
    strokes_chirho = []
    start_keys_chirho = [k_chirho for k_chirho in ends_chirho if k_chirho not in pair_chirho]
    start_keys_chirho += [k_chirho for k_chirho in ends_chirho if k_chirho in pair_chirho]
    for sk_chirho in start_keys_chirho:
        if sk_chirho[0] in used_branch_chirho:
            continue
        chain_chirho = []
        cur_chirho = sk_chirho
        while cur_chirho is not None and cur_chirho[0] not in used_branch_chirho:
            cbi_chirho, cside_chirho = cur_chirho
            used_branch_chirho.add(cbi_chirho)
            pts_chirho = oriented_chirho(cbi_chirho, cside_chirho)
            if chain_chirho and pts_chirho and chain_chirho[-1] == pts_chirho[0]:
                pts_chirho = pts_chirho[1:]
            chain_chirho.extend(pts_chirho)
            nxt_chirho = pair_chirho.get((cbi_chirho, 1 - cside_chirho))
            cur_chirho = nxt_chirho
        if len(chain_chirho) >= 2:
            strokes_chirho.append(chain_chirho)

    def plen_chirho(ch_chirho):
        return sum(
            math.hypot(ch_chirho[i_chirho + 1][0] - ch_chirho[i_chirho][0],
                       ch_chirho[i_chirho + 1][1] - ch_chirho[i_chirho][1])
            for i_chirho in range(len(ch_chirho) - 1)
        )

    sig_chirho = [s_chirho for s_chirho in strokes_chirho if plen_chirho(s_chirho) >= min_stroke_chirho]
    return sig_chirho if sig_chirho else strokes_chirho


def render_glyph_chirho(gray_chirho: np.ndarray):
    h_chirho, w_chirho = gray_chirho.shape
    binary_chirho = (gray_chirho < INK_THRESH_CHIRHO).astype(np.uint8)

    # Pen radius at NATIVE res (true scan stroke half-width).
    edt_chirho = ndimage.distance_transform_edt(binary_chirho)

    # Upscale (smooth) before thinning: a constant-width pen upscales to a
    # clean medial axis, where native-res thinning frayed into twigs.
    up_img_chirho = Image.fromarray((binary_chirho * 255).astype(np.uint8)).resize(
        (w_chirho * UPSCALE_CHIRHO, h_chirho * UPSCALE_CHIRHO), Image.BICUBIC
    )
    up_bin_chirho = (np.asarray(up_img_chirho) > 110).astype(np.uint8)
    skel_up_chirho = prune_spurs_chirho(zhang_suen_thin_chirho(up_bin_chirho))

    diag_up_chirho = math.hypot(*skel_up_chirho.shape) or 1.0
    min_stroke_chirho = max(2.5 * UPSCALE_CHIRHO, 0.10 * diag_up_chirho)
    strokes_up_chirho = decompose_strokes_chirho(skel_up_chirho, min_stroke_chirho)

    skel_ys_chirho, skel_xs_chirho = np.where(skel_up_chirho == 1)
    pen_vals_chirho = (
        edt_chirho[
            np.clip(skel_ys_chirho // UPSCALE_CHIRHO, 0, h_chirho - 1),
            np.clip(skel_xs_chirho // UPSCALE_CHIRHO, 0, w_chirho - 1),
        ]
        if skel_ys_chirho.size else np.array([0.0])
    )

    canvas_chirho = Image.new(
        "RGB", (w_chirho * SCALE_CHIRHO, h_chirho * SCALE_CHIRHO), (255, 255, 255)
    )
    draw_chirho = ImageDraw.Draw(canvas_chirho)
    for y_chirho in range(h_chirho):
        for x_chirho in range(w_chirho):
            if binary_chirho[y_chirho, x_chirho]:
                draw_chirho.rectangle(
                    [x_chirho * SCALE_CHIRHO, y_chirho * SCALE_CHIRHO,
                     (x_chirho + 1) * SCALE_CHIRHO, (y_chirho + 1) * SCALE_CHIRHO],
                    fill=(228, 228, 234),
                )

    pen_r_native_chirho = float(np.median(pen_vals_chirho))
    ext_chirho = pen_r_native_chirho + 1.0

    total_len_chirho = 0.0
    for si_chirho, stroke_chirho in enumerate(strokes_up_chirho):
        # upscaled (y,x) -> native (x,y) float
        pts_xy_chirho = [
            (x_chirho / UPSCALE_CHIRHO, y_chirho / UPSCALE_CHIRHO)
            for (y_chirho, x_chirho) in stroke_chirho
        ]
        simp_chirho = rdp_chirho(pts_xy_chirho, RDP_EPS_CHIRHO)
        simp_chirho = extend_ends_chirho(simp_chirho, ext_chirho)
        smooth_chirho = catmull_to_bezier_pts_chirho(simp_chirho)
        total_len_chirho += polyline_len_chirho(simp_chirho)
        col_chirho = PALETTE_CHIRHO[si_chirho % len(PALETTE_CHIRHO)]

        def sc_chirho(p_chirho):
            return (p_chirho[0] * SCALE_CHIRHO + SCALE_CHIRHO / 2,
                    p_chirho[1] * SCALE_CHIRHO + SCALE_CHIRHO / 2)

        scaled_chirho = [sc_chirho(p_chirho) for p_chirho in smooth_chirho]
        if len(scaled_chirho) >= 2:
            draw_chirho.line(scaled_chirho, fill=col_chirho, width=4, joint="curve")
            # control polygon (faint) + control points (cyan squares) so the
            # underlying bezier control net is visible, plus stroke-end dots.
            ctrl_chirho = [sc_chirho(p_chirho) for p_chirho in simp_chirho]
            if len(ctrl_chirho) >= 2:
                draw_chirho.line(ctrl_chirho, fill=(120, 120, 140), width=1)
            for ci_chirho, cpt_chirho in enumerate(ctrl_chirho):
                is_end_chirho = ci_chirho in (0, len(ctrl_chirho) - 1)
                rr_chirho = 5 if is_end_chirho else 4
                fill_chirho = (220, 20, 60) if is_end_chirho else (0, 200, 220)
                if is_end_chirho:
                    draw_chirho.ellipse(
                        [cpt_chirho[0] - rr_chirho, cpt_chirho[1] - rr_chirho,
                         cpt_chirho[0] + rr_chirho, cpt_chirho[1] + rr_chirho],
                        fill=fill_chirho,
                    )
                else:
                    draw_chirho.rectangle(
                        [cpt_chirho[0] - rr_chirho, cpt_chirho[1] - rr_chirho,
                         cpt_chirho[0] + rr_chirho, cpt_chirho[1] + rr_chirho],
                        fill=fill_chirho,
                    )

    bbox_diag_chirho = math.hypot(h_chirho, w_chirho) or 1.0
    sig_chirho = {
        "strokesChirho": len(strokes_up_chirho),
        "lenChirho": round(total_len_chirho, 1),
        "lenOverDiagChirho": round(total_len_chirho / bbox_diag_chirho, 2),
        "aspectChirho": round(w_chirho / max(1, h_chirho), 2),
        "penRadiusChirho": round(float(np.median(pen_vals_chirho)), 2),
        "penIqrChirho": round(
            float(np.percentile(pen_vals_chirho, 75)
                  - np.percentile(pen_vals_chirho, 25)), 2
        ),
    }
    return canvas_chirho, sig_chirho


def data_uri_chirho(img_chirho):
    buf_chirho = io.BytesIO()
    img_chirho.save(buf_chirho, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf_chirho.getvalue()).decode()


def main_chirho():
    OUT_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)
    by_letter_chirho = defaultdict(list)
    yod_sigs_chirho = []
    other_strokes_chirho = []
    for cp_dir_chirho in sorted(FONT_DIR_CHIRHO.glob("U+*")):
        for png_chirho in sorted(cp_dir_chirho.glob("*.png")):
            gray_chirho = np.asarray(Image.open(png_chirho).convert("L"))
            try:
                img_chirho, sig_chirho = render_glyph_chirho(gray_chirho)
            except Exception as e_chirho:
                print(f"skip {png_chirho.name}: {e_chirho}")
                continue
            by_letter_chirho[cp_dir_chirho.name].append(
                (png_chirho.name, data_uri_chirho(img_chirho), sig_chirho)
            )
            if cp_dir_chirho.name == YOD_CP_CHIRHO:
                yod_sigs_chirho.append(sig_chirho)
            else:
                other_strokes_chirho.append(sig_chirho["strokesChirho"])

    all_pens_chirho = [
        s_chirho["penRadiusChirho"]
        for lst_chirho in by_letter_chirho.values()
        for (_n_chirho, _u_chirho, s_chirho) in lst_chirho
    ]
    pen_report_chirho = (
        f"pen radius across all glyphs: median {round(st.median(all_pens_chirho), 2)} "
        f"px, range {min(all_pens_chirho)}–{max(all_pens_chirho)} "
        f"(tight range ⇒ uniform round-nib pen, as observed)"
        if all_pens_chirho else ""
    )

    order_chirho = [YOD_CP_CHIRHO] + sorted(
        k_chirho for k_chirho in by_letter_chirho if k_chirho != YOD_CP_CHIRHO
    )
    sections_chirho = []
    for cp_chirho in order_chirho:
        if cp_chirho not in by_letter_chirho:
            continue
        letter_chirho = chr(int(cp_chirho[2:], 16))
        cards_chirho = []
        for name_chirho, uri_chirho, sig_chirho in by_letter_chirho[cp_chirho]:
            cards_chirho.append(
                f"<div class='card-chirho'><img src='{uri_chirho}'>"
                f"<div class='sig-chirho'>strokes {sig_chirho['strokesChirho']} · "
                f"len/diag {sig_chirho['lenOverDiagChirho']} · "
                f"pen {sig_chirho['penRadiusChirho']}±{sig_chirho['penIqrChirho']}</div>"
                f"<div class='fn-chirho'>{name_chirho}</div></div>"
            )
        hi_chirho = " yod-chirho" if cp_chirho == YOD_CP_CHIRHO else ""
        sections_chirho.append(
            f"<section class='{hi_chirho}'><h2>{letter_chirho} "
            f"<span class='cp-chirho'>{cp_chirho}</span> "
            f"<span class='n-chirho'>{len(by_letter_chirho[cp_chirho])}</span></h2>"
            f"<div class='grid-chirho'>{''.join(cards_chirho)}</div></section>"
        )

    yod_line_chirho = ""
    if yod_sigs_chirho:
        ys_chirho = [s_chirho["strokesChirho"] for s_chirho in yod_sigs_chirho]
        yl_chirho = [s_chirho["lenOverDiagChirho"] for s_chirho in yod_sigs_chirho]
        yod_line_chirho = (
            f"yod (n={len(yod_sigs_chirho)}): strokes median "
            f"{st.median(ys_chirho)} (others median "
            f"{st.median(other_strokes_chirho) if other_strokes_chirho else '-'}), "
            f"len/diag median {st.median(yl_chirho)} — is yod a single clean stroke?"
        )

    html_chirho = (
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<title>Glyph strokes</title><style>"
        "body{background:#0a0a14;color:#e0e0e0;font-family:system-ui;margin:0;padding:1rem}"
        "h1{font-size:1rem;color:#c9a84c}.meta-chirho{color:#8ab;font-size:.8rem;margin:.3rem 0 1rem}"
        "section{border-top:1px solid #2a2a4a;padding:.6rem 0;margin-bottom:1rem}"
        "section.yod-chirho{background:#15240f;border:1px solid #4a7a1c;border-radius:8px;padding:.6rem}"
        "h2{font-size:1.5rem;margin:.2rem 0}.cp-chirho{font-size:.7rem;color:#666}.n-chirho{font-size:.7rem;color:#888}"
        ".grid-chirho{display:flex;flex-wrap:wrap;gap:.6rem}"
        ".card-chirho{background:#11111e;border:1px solid #222;border-radius:6px;padding:.3rem;width:140px;text-align:center}"
        ".card-chirho img{width:130px;height:auto;background:#fff;border-radius:3px}"
        ".sig-chirho{font-size:.6rem;color:#9cf;margin:.2rem 0}"
        ".fn-chirho{font-size:.5rem;color:#667;word-break:break-all}"
        "</style></head><body><h1>Glyph stroke / centerline extraction</h1>"
        f"<p class='meta-chirho'>skeleton (Zhang-Suen) → branches → RDP → Catmull-Rom. "
        f"each colour = one hand-drawn stroke (ductus); red dot = stroke end, "
        f"cyan square = bezier control point, faint line = control polygon. "
        f"ends extended ~1 pen-radius to reach the ink. {pen_report_chirho}"
        f"<br>{yod_line_chirho}</p>"
        + "".join(sections_chirho)
        + "</body></html>"
    )
    out_path_chirho = OUT_DIR_CHIRHO / "strokes-chirho.html"
    out_path_chirho.write_text(html_chirho)
    print(f"Wrote {out_path_chirho}")
    if yod_line_chirho:
        print(yod_line_chirho)


if __name__ == "__main__":
    main_chirho()
