#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
"Weighted if-then" letter recogniser = gradient-boosted decision trees over
shape/topology features (the formalisation of the user's intuition; beats
the blunt 0.683 coverage-IoU argmax).

Features per glyph (cheap, scale-robust, target the minimal-pair failures):
  connected-component count (he/qof = detached parts), hole/closed-loop
  count (samekh/final-mem), bbox aspect, ink fill ratio, centroid, ink
  occupancy in top/mid/bottom vertical bands (ascender vs descender vs
  body), skeleton stroke/endpoint/junction counts, skeleton length/diag.

Train on the human-ductus model renders (unlimited, wiggled); TEST strictly
held-out on the REAL single-letter scan crops (bitmap-font-v3-chirho).
Honest comparison vs the 0.683 baseline.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/recognize_gbt_chirho.py
"""
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage
from sklearn.ensemble import HistGradientBoostingClassifier

from glyph_strokes_chirho import (
    zhang_suen_thin_chirho,
    prune_spurs_chirho,
    trace_branches_chirho,
    decompose_strokes_chirho,
)
from compose_synthetic_strokes_chirho import (
    load_stroke_font_chirho,
    render_glyph_ink_chirho,
)

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
FONT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-chirho"
INK_THRESH_CHIRHO = 200
TRAIN_PER_LETTER_CHIRHO = 40


def features_chirho(gray_chirho):
    ink_chirho = (gray_chirho < INK_THRESH_CHIRHO)
    if ink_chirho.sum() < 6:
        return None
    ys_chirho, xs_chirho = np.where(ink_chirho)
    y0_chirho, y1_chirho = ys_chirho.min(), ys_chirho.max()
    x0_chirho, x1_chirho = xs_chirho.min(), xs_chirho.max()
    bh_chirho = (y1_chirho - y0_chirho + 1)
    bw_chirho = (x1_chirho - x0_chirho + 1)
    n_ink_chirho = int(ink_chirho.sum())

    lab_chirho, n_comp_chirho = ndimage.label(ink_chirho)
    comp_sizes_chirho = sorted(
        (int((lab_chirho == k_chirho).sum()) for k_chirho in range(1, n_comp_chirho + 1)),
        reverse=True,
    ) or [0]
    big_comps_chirho = sum(1 for s_chirho in comp_sizes_chirho if s_chirho > 0.10 * comp_sizes_chirho[0])

    # holes = background components fully enclosed by ink (closed loops)
    bg_chirho = ~ink_chirho
    bgl_chirho, n_bg_chirho = ndimage.label(bg_chirho)
    border_lbls_chirho = set(bgl_chirho[0, :]) | set(bgl_chirho[-1, :]) \
        | set(bgl_chirho[:, 0]) | set(bgl_chirho[:, -1])
    n_holes_chirho = sum(
        1 for k_chirho in range(1, n_bg_chirho + 1) if k_chirho not in border_lbls_chirho
    )

    cy_chirho = (ys_chirho.mean() - y0_chirho) / max(1, bh_chirho)
    cx_chirho = (xs_chirho.mean() - x0_chirho) / max(1, bw_chirho)
    t3_chirho = y0_chirho + bh_chirho / 3.0
    t6_chirho = y0_chirho + 2.0 * bh_chirho / 3.0
    top_chirho = float((ys_chirho < t3_chirho).mean())
    mid_chirho = float(((ys_chirho >= t3_chirho) & (ys_chirho < t6_chirho)).mean())
    bot_chirho = float((ys_chirho >= t6_chirho).mean())

    skel_chirho = prune_spurs_chirho(zhang_suen_thin_chirho(ink_chirho.astype(np.uint8)))
    _br_chirho, _sp_chirho, deg_chirho = trace_branches_chirho(skel_chirho)
    degs_chirho = list(deg_chirho.values())
    n_end_chirho = sum(1 for d_chirho in degs_chirho if d_chirho == 1)
    n_jun_chirho = sum(1 for d_chirho in degs_chirho if d_chirho >= 3)
    diag_chirho = float(np.hypot(bh_chirho, bw_chirho)) or 1.0
    n_strokes_chirho = len(decompose_strokes_chirho(skel_chirho, max(3.0, 0.18 * diag_chirho)))
    skel_len_chirho = int((skel_chirho == 1).sum())

    return np.array([
        n_comp_chirho, big_comps_chirho, n_holes_chirho,
        bw_chirho / max(1, bh_chirho),
        n_ink_chirho / max(1, bw_chirho * bh_chirho),
        cx_chirho, cy_chirho, top_chirho, mid_chirho, bot_chirho,
        n_end_chirho, n_jun_chirho, n_strokes_chirho,
        skel_len_chirho / diag_chirho,
    ], dtype=np.float32)


def main_chirho():
    font_chirho = load_stroke_font_chirho()
    if not font_chirho:
        print("no font", file=sys.stderr)
        return
    letters_chirho = sorted(font_chirho)

    xtr_chirho, ytr_chirho = [], []
    for letter_chirho in letters_chirho:
        made_chirho = 0
        for _i_chirho in range(TRAIN_PER_LETTER_CHIRHO * 2):
            if made_chirho >= TRAIN_PER_LETTER_CHIRHO:
                break
            v_chirho = font_chirho[letter_chirho][_i_chirho % len(font_chirho[letter_chirho])]
            try:
                ink_chirho, _y_chirho = render_glyph_ink_chirho(letter_chirho, v_chirho)
                gray_chirho = np.clip(255.0 - ink_chirho * 255.0, 0, 255).astype(np.uint8)
                f_chirho = features_chirho(gray_chirho)
            except Exception:
                f_chirho = None
            if f_chirho is not None:
                xtr_chirho.append(f_chirho)
                ytr_chirho.append(letter_chirho)
                made_chirho += 1
    print(f"train rows: {len(xtr_chirho)} over {len(letters_chirho)} letters")

    xte_chirho, yte_chirho = [], []
    for cp_dir_chirho in sorted(FONT_DIR_CHIRHO.glob("U+*")):
        letter_chirho = chr(int(cp_dir_chirho.name[2:], 16))
        if letter_chirho not in font_chirho:
            continue
        for png_chirho in sorted(cp_dir_chirho.glob("*.png")):
            gray_chirho = np.asarray(Image.open(png_chirho).convert("L"))
            f_chirho = features_chirho(gray_chirho)
            if f_chirho is not None:
                xte_chirho.append(f_chirho)
                yte_chirho.append(letter_chirho)
    print(f"test rows (REAL held-out): {len(xte_chirho)}")

    clf_chirho = HistGradientBoostingClassifier(
        max_depth=4, max_iter=300, learning_rate=0.12, random_state=0,
    )
    clf_chirho.fit(np.array(xtr_chirho), np.array(ytr_chirho))
    pred_chirho = clf_chirho.predict(np.array(xte_chirho))
    yte_arr_chirho = np.array(yte_chirho)
    acc_chirho = float((pred_chirho == yte_arr_chirho).mean())
    print(f"\nGBT real-held-out accuracy: "
          f"{int((pred_chirho == yte_arr_chirho).sum())}/{len(yte_chirho)} = {acc_chirho:.3f}")
    print(f"  baseline (coverage-IoU argmax) was 0.683 — Δ {acc_chirho - 0.683:+.3f}")

    conf_chirho = Counter()
    per_chirho = {}
    for t_chirho, p_chirho in zip(yte_chirho, pred_chirho):
        per_chirho.setdefault(t_chirho, [0, 0])
        per_chirho[t_chirho][1] += 1
        if t_chirho == p_chirho:
            per_chirho[t_chirho][0] += 1
        else:
            conf_chirho[(t_chirho, p_chirho)] += 1
    print("\nper-letter (correct/total):")
    print("  " + "  ".join(f"{k_chirho}{v_chirho[0]}/{v_chirho[1]}"
                            for k_chirho, v_chirho in sorted(per_chirho.items())))
    print("\ntop confusions:")
    for (a_chirho, b_chirho), n_chirho in conf_chirho.most_common(10):
        print(f"  {a_chirho}→{b_chirho} ×{n_chirho}")


if __name__ == "__main__":
    main_chirho()
