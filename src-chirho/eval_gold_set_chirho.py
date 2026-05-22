#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
First HONEST end-to-end measurement on the non-circular gold set.

Per gold word crop:
  1. cull dots/dashes (nikud, maqaf)  -> ink body only
  2. connected components, RIGHT-TO-LEFT by centroid-x
  3. MERGE x-adjacent components into glyph clusters — Hebrew he/qof/
     shin/alef are legitimately multi-part, naive CC would shatter them
  4. each cluster -> branching_predictor predict_glyph:
        single -> its letter ;  joined/wide -> '?' (a real BIGRAM that
        our single-glyph stage cannot yet read — counted, not hidden)
  5. assemble predicted consonant skeleton (finals folded to base, to
     match WLC-normalised gold) and score vs goldConsonantsChirho.

Honest metrics:
  - exact whole-word skeleton match (the real bar)
  - char accuracy via edit distance
  - BIGRAM-BLOCKED rate = gold words with >=1 '?'  (data-grounded size
    of the unsolved segmentation/bigram problem — the thing to build next)
  - on the FULLY-single words (no '?'), exact + char acc = the honest
    single-glyph end-to-end accuracy on trustworthy non-circular data.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 -u \\
        src-chirho/eval_gold_set_chirho.py [--tier=STRICT|OK|ALL] [--n=80]
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

from branching_predictor_chirho import (
    load_models_chirho, predict_glyph_chirho, cull_marks_chirho,
    STROKE_SPEC_CHIRHO,
)

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
GOLD_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "gold-set-chirho"
CORPUS_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "hebrew-corpus-chirho"
FINAL_TO_BASE_CHIRHO = {"ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ"}
MERGE_GAP_FRAC_CHIRHO = 0.22       # x-gap < frac*median width => same glyph


def fold_chirho(s_chirho):
    return "".join(FINAL_TO_BASE_CHIRHO.get(c_chirho, c_chirho) for c_chirho in s_chirho)


def edit_dist_chirho(a_chirho, b_chirho):
    d_chirho = list(range(len(b_chirho) + 1))
    for i_chirho, ca_chirho in enumerate(a_chirho, 1):
        prev_chirho = d_chirho[0]
        d_chirho[0] = i_chirho
        for j_chirho, cb_chirho in enumerate(b_chirho, 1):
            cur_chirho = d_chirho[j_chirho]
            d_chirho[j_chirho] = min(
                d_chirho[j_chirho] + 1, d_chirho[j_chirho - 1] + 1,
                prev_chirho + (ca_chirho != cb_chirho))
            prev_chirho = cur_chirho
    return d_chirho[-1]


def _vcrop_gray_chirho(bool_slice_chirho):
    """Tight-crop a boolean ink slice in BOTH axes -> 0/255 gray (fixes
    the 'vertical whitespace not cropped' defect)."""
    ys_chirho, xs_chirho = np.where(bool_slice_chirho)
    if ys_chirho.size == 0:
        return None
    t_chirho = bool_slice_chirho[ys_chirho.min():ys_chirho.max() + 1,
                                 xs_chirho.min():xs_chirho.max() + 1]
    return np.where(t_chirho, 0, 255).astype(np.uint8)


def segments_valley_rtl_chirho(gray_chirho, valley_rel_chirho=0.95,
                               min_glyph_w_chirho=5):
    """Cut at VALLEYS (local minima that dip >= (1-valley_rel) below BOTH
    neighbouring letter-body peaks — the user's 'below 95%'), and include
    each valley's low-column SPACE in BOTH glyphs it separates (the
    connecting ink belongs to both letters; a hard cut mutilates both).
    Vertically tight per glyph. RTL."""
    clean_chirho, _, _ = cull_marks_chirho(gray_chirho)
    ys_chirho, xs_chirho = np.where(clean_chirho)
    if xs_chirho.size == 0:
        return []
    x0_chirho, x1_chirho = xs_chirho.min(), xs_chirho.max()
    y0_chirho, y1_chirho = ys_chirho.min(), ys_chirho.max()
    sub_chirho = clean_chirho[y0_chirho:y1_chirho + 1, x0_chirho:x1_chirho + 1]
    h_chirho = max(1, sub_chirho.shape[0])
    cf_chirho = sub_chirho.sum(axis=0) / h_chirho
    w_chirho = cf_chirho.shape[0]
    if w_chirho < 2 * min_glyph_w_chirho:
        g_chirho = _vcrop_gray_chirho(sub_chirho)
        return [g_chirho] if g_chirho is not None else []

    # local minima (plateau-aware)
    mins_chirho = []
    c_chirho = 1
    while c_chirho < w_chirho - 1:
        if cf_chirho[c_chirho] <= cf_chirho[c_chirho - 1] and \
                cf_chirho[c_chirho] <= cf_chirho[c_chirho + 1]:
            c2_chirho = c_chirho
            while c2_chirho + 1 < w_chirho and \
                    cf_chirho[c2_chirho + 1] == cf_chirho[c_chirho]:
                c2_chirho += 1
            mins_chirho.append((c_chirho + c2_chirho) // 2)
            c_chirho = c2_chirho + 1
        else:
            c_chirho += 1

    accepted_chirho = []          # (vlo, vhi, center)
    for mi_chirho in mins_chirho:
        l0_chirho = accepted_chirho[-1][2] + 1 if accepted_chirho else 0
        left_peak_chirho = cf_chirho[l0_chirho:mi_chirho + 1].max() \
            if mi_chirho >= l0_chirho else cf_chirho[mi_chirho]
        right_peak_chirho = cf_chirho[mi_chirho:].max()
        ref_chirho = min(left_peak_chirho, right_peak_chirho)
        if ref_chirho <= 0:
            continue
        if cf_chirho[mi_chirho] < valley_rel_chirho * ref_chirho:
            lvl_chirho = valley_rel_chirho * ref_chirho
            vlo_chirho = mi_chirho
            while vlo_chirho - 1 >= 0 and cf_chirho[vlo_chirho - 1] < lvl_chirho:
                vlo_chirho -= 1
            vhi_chirho = mi_chirho
            while vhi_chirho + 1 < w_chirho and cf_chirho[vhi_chirho + 1] < lvl_chirho:
                vhi_chirho += 1
            # reject splits that would make either side too narrow
            prev_edge_chirho = accepted_chirho[-1][1] if accepted_chirho else 0
            if (vlo_chirho - prev_edge_chirho) >= min_glyph_w_chirho:
                accepted_chirho.append((vlo_chirho, vhi_chirho, mi_chirho))

    bounds_chirho = []            # (start, end) inclusive, valleys SHARED
    if not accepted_chirho:
        bounds_chirho = [(0, w_chirho - 1)]
    else:
        bounds_chirho.append((0, accepted_chirho[0][1]))
        for k_chirho in range(1, len(accepted_chirho)):
            bounds_chirho.append((accepted_chirho[k_chirho - 1][0],
                                  accepted_chirho[k_chirho][1]))
        bounds_chirho.append((accepted_chirho[-1][0], w_chirho - 1))

    out_chirho = []
    for s_chirho, e_chirho in bounds_chirho:
        g_chirho = _vcrop_gray_chirho(sub_chirho[:, s_chirho:e_chirho + 1])
        if g_chirho is not None:
            out_chirho.append((s_chirho, g_chirho))
    out_chirho.sort(key=lambda t_chirho: -t_chirho[0])      # RTL
    return [g_chirho for _x_chirho, g_chirho in out_chirho]


def segments_proj_rtl_chirho(gray_chirho, gap_thresh_chirho=0.04,
                             min_gap_run_chirho=2):
    """The user's method: cut at FULL-HEIGHT near-empty columns. Between
    two letters a column is empty top-to-bottom; inside he/qof the roof
    bridges it (column still has ink) so multi-part letters stay whole
    and only TRUE touching pairs survive as one (=> bigram). RTL."""
    clean_chirho, _, _ = cull_marks_chirho(gray_chirho)
    ys_chirho, xs_chirho = np.where(clean_chirho)
    if xs_chirho.size == 0:
        return []
    x0_chirho, x1_chirho = xs_chirho.min(), xs_chirho.max()
    y0_chirho, y1_chirho = ys_chirho.min(), ys_chirho.max()
    sub_chirho = clean_chirho[y0_chirho:y1_chirho + 1, x0_chirho:x1_chirho + 1]
    h_chirho = max(1, sub_chirho.shape[0])
    colfrac_chirho = sub_chirho.sum(axis=0) / h_chirho
    is_gap_chirho = colfrac_chirho < gap_thresh_chirho
    w_chirho = sub_chirho.shape[1]
    segs_chirho = []
    i_chirho = 0
    while i_chirho < w_chirho:
        if is_gap_chirho[i_chirho]:
            i_chirho += 1
            continue
        j_chirho = i_chirho
        run_chirho = 0
        while j_chirho < w_chirho and run_chirho < min_gap_run_chirho:
            if is_gap_chirho[j_chirho]:
                run_chirho += 1
            else:
                run_chirho = 0
            j_chirho += 1
        end_chirho = j_chirho - run_chirho
        col_slice_chirho = sub_chirho[:, i_chirho:end_chirho]
        if col_slice_chirho.any():
            segs_chirho.append(
                (i_chirho,
                 np.where(col_slice_chirho, 0, 255).astype(np.uint8)))
        i_chirho = j_chirho
    segs_chirho.sort(key=lambda t_chirho: -t_chirho[0])      # RTL
    return [g_chirho for _x_chirho, g_chirho in segs_chirho]


def clusters_rtl_chirho(gray_chirho, merge_chirho=True):
    """cull marks -> CC -> (optional) merge x-adjacent -> cluster gray
    crops, right-to-left."""
    clean_chirho, _, _ = cull_marks_chirho(gray_chirho)
    lab_chirho, n_chirho = ndimage.label(clean_chirho)
    if n_chirho == 0:
        return []
    boxes_chirho = []
    for k_chirho in range(1, n_chirho + 1):
        ys_chirho, xs_chirho = np.where(lab_chirho == k_chirho)
        boxes_chirho.append([xs_chirho.min(), xs_chirho.max(),
                             ys_chirho.min(), ys_chirho.max(), {k_chirho}])
    widths_chirho = [b_chirho[1] - b_chirho[0] + 1 for b_chirho in boxes_chirho]
    med_w_chirho = float(np.median(widths_chirho)) if widths_chirho else 8.0
    gap_chirho = max(2.0, MERGE_GAP_FRAC_CHIRHO * med_w_chirho)
    boxes_chirho.sort(key=lambda b_chirho: b_chirho[0])
    if not merge_chirho:
        gap_chirho = -1                                       # raw CC, no merge
    merged_chirho = [boxes_chirho[0]]
    for b_chirho in boxes_chirho[1:]:
        m_chirho = merged_chirho[-1]
        if b_chirho[0] <= m_chirho[1] + gap_chirho:           # x-adjacent
            m_chirho[1] = max(m_chirho[1], b_chirho[1])
            m_chirho[0] = min(m_chirho[0], b_chirho[0])
            m_chirho[2] = min(m_chirho[2], b_chirho[2])
            m_chirho[3] = max(m_chirho[3], b_chirho[3])
            m_chirho[4] |= b_chirho[4]
        else:
            merged_chirho.append(b_chirho)
    merged_chirho.sort(key=lambda b_chirho: -b_chirho[0])      # RTL
    out_chirho = []
    for x0_chirho, x1_chirho, y0_chirho, y1_chirho, ks_chirho in merged_chirho:
        mask_chirho = np.isin(lab_chirho, list(ks_chirho))
        sub_chirho = mask_chirho[y0_chirho:y1_chirho + 1, x0_chirho:x1_chirho + 1]
        g_chirho = np.where(sub_chirho, 0, 255).astype(np.uint8)
        out_chirho.append(g_chirho)
    return out_chirho


def main_chirho():
    tier_chirho, n_lim_chirho, merge_chirho = "STRICT", 80, True
    seg_chirho, gap_chirho, minrun_chirho = "valley", 0.04, 2
    vrel_chirho, minw_chirho = 0.95, 5
    for a_chirho in sys.argv[1:]:
        if a_chirho.startswith("--tier="):
            tier_chirho = a_chirho.split("=", 1)[1].upper()
        if a_chirho.startswith("--n="):
            n_lim_chirho = int(a_chirho.split("=", 1)[1])
        if a_chirho == "--nomerge":
            merge_chirho = False
        if a_chirho.startswith("--seg="):
            seg_chirho = a_chirho.split("=", 1)[1]
        if a_chirho.startswith("--gap="):
            gap_chirho = float(a_chirho.split("=", 1)[1])
        if a_chirho.startswith("--minrun="):
            minrun_chirho = int(a_chirho.split("=", 1)[1])
        if a_chirho.startswith("--vrel="):
            vrel_chirho = float(a_chirho.split("=", 1)[1])
        if a_chirho.startswith("--minw="):
            minw_chirho = int(a_chirho.split("=", 1)[1])
    man_chirho = json.loads(
        (GOLD_DIR_CHIRHO / "manifest-chirho.json").read_text())["goldChirho"]
    if tier_chirho != "ALL":
        man_chirho = [m_chirho for m_chirho in man_chirho
                      if m_chirho["tierChirho"] == f"GOLD_{tier_chirho}"]
    man_chirho = man_chirho[:n_lim_chirho]
    spec_chirho = STROKE_SPEC_CHIRHO if isinstance(STROKE_SPEC_CHIRHO, dict) else {}
    if not spec_chirho:
        raw_chirho = json.loads((PROJECT_ROOT_CHIRHO / "spec-chirho"
                                 / "hebrew-stroke-counts-chirho.json").read_text())
        spec_chirho = {k_chirho: v_chirho["countChirho"]
                       for k_chirho, v_chirho in raw_chirho["lettersChirho"].items()}
    models_chirho = load_models_chirho()
    print(f"gold tier={tier_chirho} n={len(man_chirho)} models={len(models_chirho)} "
          f"seg={seg_chirho} gap={gap_chirho} minrun={minrun_chirho}")

    def segment_chirho(g_chirho):
        if seg_chirho == "valley":
            return segments_valley_rtl_chirho(g_chirho, vrel_chirho, minw_chirho)
        if seg_chirho == "proj":
            return segments_proj_rtl_chirho(g_chirho, gap_chirho, minrun_chirho)
        return clusters_rtl_chirho(g_chirho, merge_chirho)

    exact_chirho = 0
    tot_ed_chirho = tot_len_chirho = 0
    blocked_chirho = 0
    pure_n_chirho = pure_exact_chirho = 0
    pure_ed_chirho = pure_len_chirho = 0
    seg_per_word_chirho = []
    blocked_letters_chirho = [0]
    blob_sizes_chirho = []
    for idx_chirho, m_chirho in enumerate(man_chirho):
        p_chirho = CORPUS_DIR_CHIRHO / m_chirho["cropChirho"]
        if not p_chirho.exists():
            continue
        gray_chirho = np.asarray(Image.open(p_chirho).convert("L"))
        gold_chirho = fold_chirho(m_chirho["goldConsonantsChirho"])
        pred_chars_chirho = []
        has_block_chirho = False
        segs_chirho = segment_chirho(gray_chirho)
        seg_per_word_chirho.append(len(segs_chirho))
        dbg_chirho = []
        for cg_chirho in segs_chirho:
            r_chirho = predict_glyph_chirho(cg_chirho, models_chirho, spec_chirho)
            ah_chirho, aw_chirho = cg_chirho.shape
            if r_chirho["branchChirho"] in ("joined", "sliver"):
                # estimate how many letters this unresolved blob holds
                # (width / typical single-letter width ~= 0.62*height) so
                # the metric reflects real bigram/trigram load, not 1 '?'.
                est_chirho = max(1, round(aw_chirho / max(1.0, 0.62 * ah_chirho)))
                if r_chirho["branchChirho"] == "sliver":
                    est_chirho = 1
                pred_chars_chirho.append("?" * est_chirho)
                has_block_chirho = True
                blocked_letters_chirho[0] += est_chirho
                blob_sizes_chirho.append(est_chirho)
                dbg_chirho.append(
                    f"[{aw_chirho}x{ah_chirho} {r_chirho['branchChirho'][:1].upper()}"
                    f"~{est_chirho}]")
            else:
                pred_chars_chirho.append(fold_chirho(r_chirho["vfitChirho"]))
                dbg_chirho.append(f"{aw_chirho}x{ah_chirho}:{r_chirho['vfitChirho']}")
        pred_chirho = "".join(pred_chars_chirho)
        if idx_chirho < 6:
            print(f"  W{idx_chirho} gold={m_chirho['goldConsonantsChirho']} "
                  f"nseg={len(segs_chirho)} pred={pred_chirho}  {dbg_chirho}")
        ed_chirho = edit_dist_chirho(pred_chirho, gold_chirho)
        tot_ed_chirho += ed_chirho
        tot_len_chirho += len(gold_chirho)
        if pred_chirho == gold_chirho:
            exact_chirho += 1
        if has_block_chirho:
            blocked_chirho += 1
        else:
            pure_n_chirho += 1
            pure_ed_chirho += ed_chirho
            pure_len_chirho += len(gold_chirho)
            if pred_chirho == gold_chirho:
                pure_exact_chirho += 1

    n_chirho = len(man_chirho)
    avg_seg_chirho = sum(seg_per_word_chirho) / max(1, len(seg_per_word_chirho))
    avg_goldlen_chirho = tot_len_chirho / max(1, n_chirho)
    print(f"\n  avg segments/word {avg_seg_chirho:.1f} vs avg gold length "
          f"{avg_goldlen_chirho:.1f}  (<<gold => UNDER-cutting; "
          f">>gold => OVER-cutting)")
    if blob_sizes_chirho:
        from collections import Counter as _C_chirho
        bs_chirho = _C_chirho(blob_sizes_chirho)
        print(f"  unresolved blobs: {len(blob_sizes_chirho)} holding ~"
              f"{blocked_letters_chirho[0]} letters "
              f"({blocked_letters_chirho[0] / max(1, tot_len_chirho):.0%} of all "
              f"gold letters) — size hist {dict(sorted(bs_chirho.items()))} "
              f"(1=stuck single, 2=bigram, 3+=trigram+) <- the combination "
              f"problem to solve next")
    print("=== HONEST end-to-end on NON-CIRCULAR gold ===")
    print(f"  whole-word exact: {exact_chirho}/{n_chirho} = "
          f"{exact_chirho / max(1, n_chirho):.3f}")
    print(f"  char accuracy (1 - editdist/goldlen): "
          f"{1 - tot_ed_chirho / max(1, tot_len_chirho):.3f}")
    print(f"  BIGRAM-BLOCKED (>=1 '?'): {blocked_chirho}/{n_chirho} = "
          f"{blocked_chirho / max(1, n_chirho):.0%}  "
          f"<- data-grounded size of the unsolved segmentation problem")
    if pure_n_chirho:
        print(f"\n  on FULLY-single words (no bigram block), n={pure_n_chirho}:")
        print(f"    exact {pure_exact_chirho}/{pure_n_chirho} = "
              f"{pure_exact_chirho / pure_n_chirho:.3f}   char acc "
              f"{1 - pure_ed_chirho / max(1, pure_len_chirho):.3f}  "
              f"<- honest single-glyph end-to-end accuracy")
    print("\nNOTE: segmentation merge is heuristic; '?' rate is reported, "
          "not hidden. This is the FIRST trustworthy number — anchors the "
          "back-prop calibration the architecture needs.")


if __name__ == "__main__":
    main_chirho()
