#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Active-shape propagation: turn the human-drawn spine(s) for a letter into an
ALGORITHMIC ductus MODEL, then fit that model to every other instance of the
same letter (the "wiggle"). This is the active-learning loop.

Per letter with >=1 saved exemplar (glyph_spines_chirho):
  1. Normalize each exemplar's control points into its glyph's INK bbox
     (unit [0,1] coords) and arc-length-resample every stroke to a fixed
     point count -> a shape vector.
  2. MODEL = per-(stroke,point) mean across exemplars; per-point stddev =
     a weight (low stddev = structurally fixed, trust the model; high =
     varies, lean on the glyph's own ink).
  3. FIT to each non-exemplar variant: place the model in that glyph's ink
     bbox, then move each control point toward the nearest point on the
     variant's skeleton, blended by the model weight (shape-prior
     regularised) so the stroke COUNT + topology stay canonical but the
     curve hugs this glyph's actual ink.
Result overwrites that variant's entry in seeds-chirho.json so the editor
shows a correctly-structured, glyph-fitted spine. Saved human spines are
never overwritten. Re-run after saving more exemplars (loop tightens).

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/propagate_spines_chirho.py
"""
import json
import sqlite3
from collections import defaultdict
from pathlib import Path

import math

import numpy as np
from PIL import Image

from glyph_strokes_chirho import (
    INK_THRESH_CHIRHO,
    UPSCALE_CHIRHO,
    prune_spurs_chirho,
    zhang_suen_thin_chirho,
)

PEN_SEARCH_CHIRHO = (-1.0, 1.5, 0.25)  # range/step around EDT pen to coverage-pick

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
FONT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-chirho"
SEEDS_PATH_CHIRHO = (
    PROJECT_ROOT_CHIRHO / "workspace-chirho" / "glyph-spines-chirho" / "seeds-chirho.json"
)
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
SNAP_FRAC_CHIRHO = 0.22        # max snap radius as a fraction of glyph diagonal


def ink_bbox_chirho(gray_chirho):
    ink_chirho = gray_chirho < INK_THRESH_CHIRHO
    ys_chirho, xs_chirho = np.where(ink_chirho)
    if ys_chirho.size == 0:
        return 0, 0, gray_chirho.shape[1], gray_chirho.shape[0]
    return (int(xs_chirho.min()), int(ys_chirho.min()),
            int(xs_chirho.max() - xs_chirho.min() + 1),
            int(ys_chirho.max() - ys_chirho.min() + 1))


def resample_chirho(pts_chirho, n_chirho):
    """Arc-length resample a polyline to exactly n points."""
    pts_chirho = np.asarray(pts_chirho, dtype=float)
    if len(pts_chirho) == 1:
        return np.repeat(pts_chirho, n_chirho, axis=0)
    seg_chirho = np.hypot(*(np.diff(pts_chirho, axis=0).T))
    cum_chirho = np.concatenate([[0.0], np.cumsum(seg_chirho)])
    total_chirho = cum_chirho[-1] or 1.0
    targets_chirho = np.linspace(0.0, total_chirho, n_chirho)
    out_chirho = []
    for t_chirho in targets_chirho:
        k_chirho = int(np.searchsorted(cum_chirho, t_chirho))
        k_chirho = max(1, min(k_chirho, len(pts_chirho) - 1))
        seg_len_chirho = cum_chirho[k_chirho] - cum_chirho[k_chirho - 1] or 1.0
        f_chirho = (t_chirho - cum_chirho[k_chirho - 1]) / seg_len_chirho
        out_chirho.append(pts_chirho[k_chirho - 1] * (1 - f_chirho) + pts_chirho[k_chirho] * f_chirho)
    return np.asarray(out_chirho)


def skeleton_pts_chirho(gray_chirho):
    binary_chirho = (gray_chirho < INK_THRESH_CHIRHO).astype(np.uint8)
    h_chirho, w_chirho = binary_chirho.shape
    up_chirho = Image.fromarray((binary_chirho * 255).astype(np.uint8)).resize(
        (w_chirho * UPSCALE_CHIRHO, h_chirho * UPSCALE_CHIRHO), Image.BICUBIC
    )
    up_bin_chirho = (np.asarray(up_chirho) > 110).astype(np.uint8)
    skel_chirho = prune_spurs_chirho(zhang_suen_thin_chirho(up_bin_chirho))
    ys_chirho, xs_chirho = np.where(skel_chirho == 1)
    if ys_chirho.size == 0:
        return np.zeros((0, 2))
    return np.stack([xs_chirho / UPSCALE_CHIRHO, ys_chirho / UPSCALE_CHIRHO], axis=1)


def build_models_chirho():
    """codepoint -> {'strokesChirho': [ (n,2) unit-coord mean ... ],
                     'weightChirho': [ (n,) 0..1 trust-the-model ... ]}"""
    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    try:
        rows_chirho = conn_chirho.execute(
            "SELECT codepoint_chirho, filename_chirho, strokes_json_chirho "
            "FROM glyph_spines_chirho"
        ).fetchall()
    except sqlite3.OperationalError:
        return {}
    finally:
        conn_chirho.close()

    by_cp_chirho = defaultdict(list)
    for cp_chirho, fn_chirho, sj_chirho in rows_chirho:
        png_chirho = FONT_DIR_CHIRHO / f"U+{cp_chirho}" / fn_chirho
        if not png_chirho.exists():
            continue
        gray_chirho = np.asarray(Image.open(png_chirho).convert("L"))
        bx_chirho, by_chirho, bw_chirho, bh_chirho = ink_bbox_chirho(gray_chirho)
        strokes_chirho = json.loads(sj_chirho)
        norm_chirho = []
        for st_chirho in strokes_chirho:
            if len(st_chirho) < 2:
                continue
            # Keep the human's RAW control points (their count is
            # intentional) — just normalise into the ink box.
            u_chirho = np.asarray(
                [[(px_chirho - bx_chirho) / max(1, bw_chirho),
                  (py_chirho - by_chirho) / max(1, bh_chirho)]
                 for px_chirho, py_chirho in st_chirho],
                dtype=float,
            )
            norm_chirho.append(u_chirho)
        if norm_chirho:
            by_cp_chirho[cp_chirho].append(norm_chirho)

    models_chirho = {}
    for cp_chirho, exemplars_chirho in by_cp_chirho.items():
        counts_chirho = [len(e_chirho) for e_chirho in exemplars_chirho]
        k_chirho = max(set(counts_chirho), key=counts_chirho.count)
        kept_chirho = [e_chirho for e_chirho in exemplars_chirho if len(e_chirho) == k_chirho]
        strokes_mean_chirho, weight_chirho = [], []
        for s_idx_chirho in range(k_chirho):
            # Target point count = the FEWEST the human used for this stroke
            # across exemplars (their deliberate simplification — a stale
            # 9-point auto-seed saved by accident must not drag the count up
            # via a median), never below 3 so Catmull splines.
            ns_chirho = [len(e_chirho[s_idx_chirho]) for e_chirho in kept_chirho]
            tn_chirho = max(3, int(min(ns_chirho)))
            res_chirho = np.stack(
                [resample_chirho(e_chirho[s_idx_chirho], tn_chirho) for e_chirho in kept_chirho],
                axis=0,
            )
            mean_chirho = res_chirho.mean(axis=0)
            std_chirho = res_chirho.std(axis=0).mean(axis=1) if len(kept_chirho) > 1 \
                else np.zeros(tn_chirho)
            # low std -> structurally fixed -> trust model (weight high)
            w_chirho = 1.0 / (1.0 + 6.0 * std_chirho)
            strokes_mean_chirho.append(mean_chirho)
            weight_chirho.append(w_chirho)
        models_chirho[cp_chirho] = {
            "strokesChirho": strokes_mean_chirho,
            "weightChirho": weight_chirho,
            "nExemplarsChirho": len(kept_chirho),
        }
    return models_chirho


def fit_model_chirho(model_chirho, gray_chirho):
    bx_chirho, by_chirho, bw_chirho, bh_chirho = ink_bbox_chirho(gray_chirho)
    skel_chirho = skeleton_pts_chirho(gray_chirho)
    diag_chirho = float(np.hypot(*gray_chirho.shape)) or 1.0
    snap_r_chirho = SNAP_FRAC_CHIRHO * diag_chirho
    out_strokes_chirho = []
    for mean_chirho, w_chirho in zip(model_chirho["strokesChirho"], model_chirho["weightChirho"]):
        pts_chirho = []
        for i_chirho in range(len(mean_chirho)):
            u_chirho, v_chirho = mean_chirho[i_chirho]
            placed_chirho = np.array([bx_chirho + u_chirho * bw_chirho,
                                      by_chirho + v_chirho * bh_chirho])
            if skel_chirho.shape[0]:
                d_chirho = np.hypot(skel_chirho[:, 0] - placed_chirho[0],
                                    skel_chirho[:, 1] - placed_chirho[1])
                j_chirho = int(np.argmin(d_chirho))
                if d_chirho[j_chirho] <= snap_r_chirho:
                    # blend toward ink; less if this point is structurally
                    # fixed (high model weight) -> shape-prior regularised.
                    alpha_chirho = 0.75 * (1.0 - w_chirho[i_chirho])
                    placed_chirho = (1 - alpha_chirho) * placed_chirho \
                        + alpha_chirho * skel_chirho[j_chirho]
            pts_chirho.append([round(float(placed_chirho[0]), 2),
                               round(float(placed_chirho[1]), 2)])
        out_strokes_chirho.append(pts_chirho)
    return out_strokes_chirho


def coverage_iou_chirho(strokes_chirho, ink_chirho, r_chirho):
    """IoU of the round-brush stroke fill vs the scan ink (the 'cyan' match)."""
    h_chirho, w_chirho = ink_chirho.shape
    cov_chirho = np.zeros((h_chirho, w_chirho), dtype=bool)
    r2_chirho = r_chirho * r_chirho
    for st_chirho in strokes_chirho:
        for i_chirho in range(len(st_chirho) - 1):
            x0_chirho, y0_chirho = st_chirho[i_chirho]
            x1_chirho, y1_chirho = st_chirho[i_chirho + 1]
            seg_chirho = max(1, int(math.hypot(x1_chirho - x0_chirho, y1_chirho - y0_chirho)))
            for t_chirho in range(seg_chirho + 1):
                f_chirho = t_chirho / seg_chirho
                cx_chirho = x0_chirho + (x1_chirho - x0_chirho) * f_chirho
                cy_chirho = y0_chirho + (y1_chirho - y0_chirho) * f_chirho
                xa_chirho = max(0, int(cx_chirho - r_chirho))
                xb_chirho = min(w_chirho - 1, int(cx_chirho + r_chirho))
                ya_chirho = max(0, int(cy_chirho - r_chirho))
                yb_chirho = min(h_chirho - 1, int(cy_chirho + r_chirho))
                for yy_chirho in range(ya_chirho, yb_chirho + 1):
                    for xx_chirho in range(xa_chirho, xb_chirho + 1):
                        if (xx_chirho + 0.5 - cx_chirho) ** 2 + (yy_chirho + 0.5 - cy_chirho) ** 2 <= r2_chirho:
                            cov_chirho[yy_chirho, xx_chirho] = True
    inter_chirho = int((cov_chirho & ink_chirho).sum())
    union_chirho = int((cov_chirho | ink_chirho).sum()) or 1
    return inter_chirho / union_chirho


def pick_pen_chirho(strokes_chirho, gray_chirho, base_r_chirho):
    """1-D search for the pen radius that best fills the ink (max IoU)."""
    ink_chirho = gray_chirho < INK_THRESH_CHIRHO
    lo_chirho, hi_chirho, step_chirho = PEN_SEARCH_CHIRHO
    best_r_chirho, best_iou_chirho = base_r_chirho, -1.0
    r_chirho = max(0.8, base_r_chirho + lo_chirho)
    while r_chirho <= base_r_chirho + hi_chirho + 1e-6:
        iou_chirho = coverage_iou_chirho(strokes_chirho, ink_chirho, r_chirho)
        if iou_chirho > best_iou_chirho:
            best_iou_chirho, best_r_chirho = iou_chirho, r_chirho
        r_chirho += step_chirho
    return round(best_r_chirho, 2)


def main_chirho():
    models_chirho = build_models_chirho()
    if not models_chirho:
        print("No human exemplars in glyph_spines_chirho yet. Correct one "
              "spine per letter in the editor (S to save), then re-run.")
        return
    if not SEEDS_PATH_CHIRHO.exists():
        print("seeds-chirho.json missing; run export_spines_chirho.py first.")
        return
    seeds_chirho = json.loads(SEEDS_PATH_CHIRHO.read_text())
    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    saved_keys_chirho = {
        f"U+{r_chirho[0]}/{r_chirho[1]}"
        for r_chirho in conn_chirho.execute(
            "SELECT codepoint_chirho, filename_chirho FROM glyph_spines_chirho"
        ).fetchall()
    }
    conn_chirho.close()

    updated_chirho = 0
    for key_chirho in list(seeds_chirho.keys()):
        cp_chirho = key_chirho.split("/")[0][2:]
        if cp_chirho not in models_chirho or key_chirho in saved_keys_chirho:
            continue
        png_chirho = FONT_DIR_CHIRHO / key_chirho
        if not png_chirho.exists():
            continue
        gray_chirho = np.asarray(Image.open(png_chirho).convert("L"))
        fitted_chirho = fit_model_chirho(models_chirho[cp_chirho], gray_chirho)
        # Keep exactly the model's point count (= the human's, >=3) — no RDP
        # collapse: the user's chosen number of points per stroke is itself
        # the right amount, and Catmull needs >=3 to spline.
        fitted_chirho = [
            [[round(float(px_chirho), 2), round(float(py_chirho), 2)]
             for px_chirho, py_chirho in st_chirho]
            for st_chirho in fitted_chirho if len(st_chirho) >= 2
        ]
        base_pen_chirho = float(seeds_chirho[key_chirho].get("penRadiusChirho", 2.0))
        seeds_chirho[key_chirho]["strokesChirho"] = fitted_chirho
        seeds_chirho[key_chirho]["penRadiusChirho"] = pick_pen_chirho(
            fitted_chirho, gray_chirho, base_pen_chirho
        )
        seeds_chirho[key_chirho]["modelFittedChirho"] = True
        updated_chirho += 1

    SEEDS_PATH_CHIRHO.write_text(json.dumps(seeds_chirho, ensure_ascii=False, indent=1))
    print(f"Models from exemplars: " + ", ".join(
        f"U+{cp_chirho}(×{m_chirho['nExemplarsChirho']})"
        for cp_chirho, m_chirho in sorted(models_chirho.items())
    ))
    print(f"Fitted {updated_chirho} variant seeds. Saved human spines untouched. "
          f"Reload the editor to review; correct & save more to tighten the loop.")


if __name__ == "__main__":
    main_chirho()
