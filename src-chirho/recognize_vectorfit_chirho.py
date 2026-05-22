#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
The "possible road" the user proposed, made FALSIFIABLE:

  Do NOT extract a vector skeleton bottom-up from the bitmap (that was
  never perfect). Instead take each KNOWN letter's hand-refined vector
  ductus model (workspace-chirho/glyph-spines-chirho, via the stroke
  font), render it, and FIT it onto the real ink with a small affine
  search (uniform scale + shear + shift) that absorbs the systematic
  size/italic mismatch which crushed the old blunt synthetic->real to
  ~0.69. Recognition = the letter whose placed model best reconstructs
  the ink (analysis-by-synthesis).

This script measures ONE honest number: per-letter LOO-equivalent
accuracy of the vector-fit witness on the SAME verified real crops that
anchor the 0.916 image-IoU baseline (bitmap-font-v3-chirho), restricted
to the letters that actually have a vector model (the fair denominator),
plus the confusion structure on the look-alike pairs. No fabrication: if
it does not beat 0.916 it is reported as a witness with a DIFFERENT error
structure (its real multi-witness value), not oversold.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/recognize_vectorfit_chirho.py
"""
import os
import random
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

import compose_synthetic_strokes_chirho as csyn_chirho
from recognize_realmatch_chirho import (
    FONT_DIR_CHIRHO, gate_info_chirho, excluded_chirho,
)

# Spines always load (via the DB) from the v3 PNGs; the CROP scan dir is
# overridable so we can measure on a HELD-OUT set the spines never saw
# (bitmap-font-v2-chirho = independent crops of the same typeface).
CROP_DIR_CHIRHO = Path(os.environ.get("VFIT_CROPS_CHIRHO", str(FONT_DIR_CHIRHO)))

NORM_CHIRHO = 44                       # fit/compare box
SCALES_CHIRHO = (0.90, 1.00, 1.10)     # residual size after bbox-normalisation
SHEARS_CHIRHO = (-0.18, -0.09, 0.0, 0.09, 0.18)   # italic slant of the typeface
SHIFTS_CHIRHO = (-2, 0, 2)             # sub-bbox registration slack (px)
LOOKALIKES_CHIRHO = [("ך", "ר"), ("ר", "ך"), ("נ", "ב"), ("ב", "נ"),
                     ("ש", "ט"), ("ט", "ש"), ("ד", "ר"), ("ר", "ד"),
                     ("ה", "ח"), ("ח", "ה"), ("כ", "ב"), ("ב", "כ")]


def binarize_norm_chirho(gray_chirho):
    """Real crop -> tight-bbox ink, resized into the common NORM box."""
    ink_chirho = np.asarray(gray_chirho) < 200
    ys_chirho, xs_chirho = np.where(ink_chirho)
    if ys_chirho.size == 0:
        return None
    crop_chirho = ink_chirho[ys_chirho.min():ys_chirho.max() + 1,
                             xs_chirho.min():xs_chirho.max() + 1]
    im_chirho = Image.fromarray((crop_chirho * 255).astype(np.uint8)).resize(
        (NORM_CHIRHO, NORM_CHIRHO), Image.BILINEAR)
    return (np.asarray(im_chirho) > 110).astype(np.float32)


def model_base_chirho(letter_chirho, variants_chirho):
    """Render the canonical (jitter-free) vector model into the NORM box."""
    best_chirho = None
    for v_chirho in variants_chirho:
        ink_chirho, _ = csyn_chirho.render_glyph_ink_chirho(letter_chirho, v_chirho)
        if ink_chirho.size <= 1:
            continue
        bw_chirho = (ink_chirho > 0.35)
        ys_chirho, xs_chirho = np.where(bw_chirho)
        if ys_chirho.size == 0:
            continue
        tight_chirho = bw_chirho[ys_chirho.min():ys_chirho.max() + 1,
                                 xs_chirho.min():xs_chirho.max() + 1]
        im_chirho = Image.fromarray((tight_chirho * 255).astype(np.uint8)).resize(
            (NORM_CHIRHO, NORM_CHIRHO), Image.BILINEAR)
        m_chirho = (np.asarray(im_chirho) > 110).astype(np.float32)
        if best_chirho is None or m_chirho.sum() > best_chirho.sum():
            best_chirho = m_chirho
    return best_chirho


def fit_score_chirho(model_chirho, target_chirho):
    """Best reconstruction over the small affine family. Score blends IoU
    (mass agreement) with a symmetric chamfer term (graded near-miss, what
    actually separates look-alikes), both in [0,1], higher = better fit."""
    tdt_chirho = ndimage.distance_transform_edt(1 - target_chirho)
    diag_chirho = float(np.hypot(*target_chirho.shape))
    c_chirho = (NORM_CHIRHO - 1) / 2.0
    best_chirho = -1.0
    for sc_chirho in SCALES_CHIRHO:
        for sh_chirho in SHEARS_CHIRHO:
            mat_chirho = np.array([[1.0 / sc_chirho, -sh_chirho / sc_chirho],
                                   [0.0, 1.0 / sc_chirho]])
            for dx_chirho in SHIFTS_CHIRHO:
                for dy_chirho in SHIFTS_CHIRHO:
                    off_chirho = (np.array([c_chirho, c_chirho])
                                  - mat_chirho @ np.array([c_chirho + dy_chirho,
                                                           c_chirho + dx_chirho]))
                    warp_chirho = ndimage.affine_transform(
                        model_chirho, mat_chirho, offset=off_chirho,
                        order=1, output_shape=model_chirho.shape) > 0.4
                    inter_chirho = float(np.logical_and(warp_chirho, target_chirho > 0).sum())
                    uni_chirho = float(np.logical_or(warp_chirho, target_chirho > 0).sum())
                    if uni_chirho == 0:
                        continue
                    iou_chirho = inter_chirho / uni_chirho
                    if warp_chirho.sum() == 0:
                        continue
                    cham_chirho = float(tdt_chirho[warp_chirho].mean()) / (diag_chirho + 1e-6)
                    s_chirho = 0.65 * iou_chirho + 0.35 * (1.0 - min(1.0, 4.0 * cham_chirho))
                    if s_chirho > best_chirho:
                        best_chirho = s_chirho
    return best_chirho


def main_chirho():
    random.seed(0)
    csyn_chirho.CTRL_JITTER_FRAC_CHIRHO = 0.0
    csyn_chirho.PEN_JITTER_CHIRHO = 0.0
    font_chirho = csyn_chirho.load_stroke_font_chirho()
    models_chirho = {}
    for letter_chirho, variants_chirho in font_chirho.items():
        m_chirho = model_base_chirho(letter_chirho, variants_chirho)
        if m_chirho is not None:
            models_chirho[letter_chirho] = m_chirho
    print(f"vector models available: {len(models_chirho)} letters "
          f"-> {''.join(sorted(models_chirho))}")

    print(f"crops from: {CROP_DIR_CHIRHO.name}")
    crops_chirho = []
    for cp_dir_chirho in sorted(CROP_DIR_CHIRHO.glob("U+*")):
        letter_chirho = chr(int(cp_dir_chirho.name[2:], 16))
        for png_chirho in sorted(cp_dir_chirho.glob("*.png")):
            gray_chirho = Image.open(png_chirho).convert("L")
            nb_chirho = binarize_norm_chirho(gray_chirho)
            if nb_chirho is None:
                continue
            crops_chirho.append({
                "letterChirho": letter_chirho, "normChirho": nb_chirho,
                "gateChirho": gate_info_chirho(np.asarray(gray_chirho)),
            })

    total_chirho = covered_chirho = correct_chirho = 0
    conf_chirho = Counter()
    per_chirho = {}
    look_chirho = {p_chirho: [0, 0] for p_chirho in LOOKALIKES_CHIRHO}
    for cr_chirho in crops_chirho:
        t_chirho = cr_chirho["letterChirho"]
        total_chirho += 1
        if t_chirho not in models_chirho:
            continue                       # fair denominator: model must exist
        covered_chirho += 1
        scores_chirho = {}
        for c_chirho, m_chirho in models_chirho.items():
            if excluded_chirho(c_chirho, cr_chirho["gateChirho"]):
                continue
            scores_chirho[c_chirho] = fit_score_chirho(m_chirho, cr_chirho["normChirho"])
        if not scores_chirho:                      # gates pruned all -> ungated
            scores_chirho = {c_chirho: fit_score_chirho(m_chirho, cr_chirho["normChirho"])
                             for c_chirho, m_chirho in models_chirho.items()}
        pred_chirho = max(scores_chirho, key=scores_chirho.get)
        per_chirho.setdefault(t_chirho, [0, 0])
        per_chirho[t_chirho][1] += 1
        if pred_chirho == t_chirho:
            correct_chirho += 1
            per_chirho[t_chirho][0] += 1
        else:
            conf_chirho[(t_chirho, pred_chirho)] += 1
        for (a_chirho, b_chirho) in LOOKALIKES_CHIRHO:
            if t_chirho == a_chirho and b_chirho in models_chirho:
                look_chirho[(a_chirho, b_chirho)][1] += 1
                if pred_chirho == a_chirho:
                    look_chirho[(a_chirho, b_chirho)][0] += 1

    acc_chirho = correct_chirho / covered_chirho if covered_chirho else 0.0
    print("\nVECTOR-FIT (analysis-by-synthesis) recogniser — HONEST measure")
    print(f"  model-covered accuracy {correct_chirho}/{covered_chirho} = {acc_chirho:.3f}")
    print(f"  coverage {covered_chirho}/{total_chirho} crops "
          f"({covered_chirho / total_chirho:.0%}) have a vector model")
    print(f"  ANCHORS — image-IoU real->real LOO 0.916 · blunt synthetic->real 0.69")
    print("\nper-letter (correct/total, model-covered only):")
    print("  " + "  ".join(f"{k_chirho}{v_chirho[0]}/{v_chirho[1]}"
                            for k_chirho, v_chirho in sorted(per_chirho.items())))
    print("\nlook-alike separation (true kept as itself / total):")
    for (a_chirho, b_chirho), v_chirho in look_chirho.items():
        if v_chirho[1]:
            print(f"  {a_chirho}(vs {b_chirho}) {v_chirho[0]}/{v_chirho[1]}")
    print("\ntop confusions:")
    for (a_chirho, b_chirho), c_chirho in conf_chirho.most_common(12):
        print(f"  {a_chirho}->{b_chirho} x{c_chirho}")


if __name__ == "__main__":
    main_chirho()
