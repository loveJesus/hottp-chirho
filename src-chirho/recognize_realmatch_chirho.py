#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Tests the hypothesis: Barthélemy's Hebrew is a CONSISTENT printed typeface,
so a few real exemplars per letter characterise the class — and the prior
~0.69 ceiling was blunt IoU + synthetic→real transfer, NOT data scarcity.

Method: leave-one-glyph-out over the real single-letter scan crops
(bitmap-font-v3-chirho). Classify each held-out glyph by the nearest OTHER
real exemplar, in a combined (normalised-image-IoU + shape-feature)
distance, AFTER hard structural EXCLUSION gates prune impossible letters
(closed-loop present/absent, ≥2 components, strong descender zone). No
synthetic, no Opus.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/recognize_realmatch_chirho.py
"""
import os
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

from recognize_gbt_chirho import features_chirho   # reuse shape features

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
# Default exemplar set is the clean traced bitmap-font-v3 real scan crops.
# Override with RM_FONT_DIR_CHIRHO to point the real-exemplar witness at a
# richer set (e.g. bitmap-font-chirho has 8-17x more crops for starved
# confusable letters ר/ד/כ) — to be MEASURED on the WLC gold set, not
# assumed clean.
FONT_DIR_CHIRHO = Path(os.environ.get(
    "RM_FONT_DIR_CHIRHO",
    str(PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-chirho")))
INK_THRESH_CHIRHO = 200
NORM_CHIRHO = 36  # common box for image similarity
# structural-feature weight vs image-IoU in the match distance. Look-alike
# confusions (ך/ר, נ/ב, ש/ט) have near-identical ink so image-IoU alone
# under-uses the shape features that separate them — swept for the best.
FEATW_CHIRHO = float(os.environ.get("REALMATCH_FEATW_CHIRHO", "0.25"))

# Hebrew letters that are NEVER closed-loop / NEVER multi-component /
# that DO descend. Gates are conservative (only near-deterministic ones).
LOOP_LETTERS_CHIRHO = set("סםפףעצץ")          # may legitimately enclose a hole
DESC_LETTERS_CHIRHO = set("ךןףץק")             # descend well below the baseline


def norm_ink_chirho(gray_chirho):
    ink_chirho = gray_chirho < INK_THRESH_CHIRHO
    ys_chirho, xs_chirho = np.where(ink_chirho)
    if ys_chirho.size == 0:
        return None
    crop_chirho = ink_chirho[ys_chirho.min():ys_chirho.max() + 1,
                             xs_chirho.min():xs_chirho.max() + 1].astype(np.uint8) * 255
    im_chirho = Image.fromarray(crop_chirho).resize((NORM_CHIRHO, NORM_CHIRHO), Image.BILINEAR)
    return (np.asarray(im_chirho) > 110)


def gate_info_chirho(gray_chirho):
    ink_chirho = gray_chirho < INK_THRESH_CHIRHO
    ys_chirho, xs_chirho = np.where(ink_chirho)
    h_chirho = ys_chirho.max() - ys_chirho.min() + 1
    bg_chirho, n_bg_chirho = ndimage.label(~ink_chirho)
    border_chirho = set(bg_chirho[0, :]) | set(bg_chirho[-1, :]) | set(bg_chirho[:, 0]) | set(bg_chirho[:, -1])
    n_holes_chirho = sum(1 for k_chirho in range(1, n_bg_chirho + 1) if k_chirho not in border_chirho)
    lab_chirho, nc_chirho = ndimage.label(ink_chirho)
    sizes_chirho = sorted((int((lab_chirho == k_chirho).sum()) for k_chirho in range(1, nc_chirho + 1)), reverse=True) or [1]
    big_comp_chirho = sum(1 for s_chirho in sizes_chirho if s_chirho > 0.12 * sizes_chirho[0])
    bot_frac_chirho = float((ys_chirho >= ys_chirho.min() + 0.72 * h_chirho).mean())
    return {"holesChirho": n_holes_chirho, "compsChirho": big_comp_chirho,
            "botChirho": bot_frac_chirho}


def excluded_chirho(cand_letter_chirho, g_chirho):
    # Hard, near-deterministic structural impossibilities only.
    if g_chirho["holesChirho"] >= 1 and cand_letter_chirho not in LOOP_LETTERS_CHIRHO:
        return True
    if g_chirho["holesChirho"] == 0 and cand_letter_chirho in set("סם"):
        return True  # samekh / final-mem MUST enclose a loop
    if g_chirho["compsChirho"] >= 2 and cand_letter_chirho not in set("הקאשצ"):
        return True  # only these legitimately split into parts
    # NOTE: removed the bottom-third-occupancy "descender" gate — it
    # mis-fired on flat-BASED letters (bet/gimel/kaf/tsadi have a baseline
    # foot, not a descender) and forced them to ן (ב→ן ×6). A real
    # descender is TALL (extends below the body), not bottom-heavy; that's
    # captured by image/feature matching already, so no hard gate here.
    return False


def main_chirho():
    glyphs_chirho = []
    for cp_dir_chirho in sorted(FONT_DIR_CHIRHO.glob("U+*")):
        letter_chirho = chr(int(cp_dir_chirho.name[2:], 16))
        for png_chirho in sorted(cp_dir_chirho.glob("*.png")):
            gray_chirho = np.asarray(Image.open(png_chirho).convert("L"))
            ni_chirho = norm_ink_chirho(gray_chirho)
            fe_chirho = features_chirho(gray_chirho)
            if ni_chirho is None or fe_chirho is None:
                continue
            glyphs_chirho.append({
                "letterChirho": letter_chirho,
                "imgChirho": ni_chirho,
                "featChirho": fe_chirho,
                "gateChirho": gate_info_chirho(gray_chirho),
            })
    n_chirho = len(glyphs_chirho)
    feats_chirho = np.stack([g_chirho["featChirho"] for g_chirho in glyphs_chirho])
    fstd_chirho = feats_chirho.std(axis=0) + 1e-6

    correct_chirho = 0
    gated_correct_chirho = 0
    conf_chirho = Counter()
    per_chirho = {}
    for i_chirho in range(n_chirho):
        gi_chirho = glyphs_chirho[i_chirho]
        best_j_chirho, best_d_chirho = -1, 1e18
        for j_chirho in range(n_chirho):
            if j_chirho == i_chirho:
                continue
            gj_chirho = glyphs_chirho[j_chirho]
            if excluded_chirho(gj_chirho["letterChirho"], gi_chirho["gateChirho"]):
                continue
            img_d_chirho = float((gi_chirho["imgChirho"] != gj_chirho["imgChirho"]).mean())
            feat_d_chirho = float(np.abs(
                (gi_chirho["featChirho"] - gj_chirho["featChirho"]) / fstd_chirho).mean())
            d_chirho = img_d_chirho + 0.25 * feat_d_chirho
            if d_chirho < best_d_chirho:
                best_d_chirho, best_j_chirho = d_chirho, j_chirho
        if best_j_chirho < 0:  # everything excluded — fall back ungated
            for j_chirho in range(n_chirho):
                if j_chirho == i_chirho:
                    continue
                gj_chirho = glyphs_chirho[j_chirho]
                img_d_chirho = float((gi_chirho["imgChirho"] != gj_chirho["imgChirho"]).mean())
                if img_d_chirho < best_d_chirho:
                    best_d_chirho, best_j_chirho = img_d_chirho, j_chirho
        pred_chirho = glyphs_chirho[best_j_chirho]["letterChirho"]
        true_chirho = gi_chirho["letterChirho"]
        per_chirho.setdefault(true_chirho, [0, 0])
        per_chirho[true_chirho][1] += 1
        if pred_chirho == true_chirho:
            correct_chirho += 1
            per_chirho[true_chirho][0] += 1
        else:
            conf_chirho[(true_chirho, pred_chirho)] += 1

    print(f"Leave-one-glyph-out, real→real + exclusion gates:")
    print(f"  accuracy {correct_chirho}/{n_chirho} = {correct_chirho / n_chirho:.3f}")
    print(f"  baselines — IoU-argmax 0.683 · GBT-on-synthetic 0.695")
    print("\nper-letter (correct/total):")
    print("  " + "  ".join(f"{k_chirho}{v_chirho[0]}/{v_chirho[1]}"
                            for k_chirho, v_chirho in sorted(per_chirho.items())))
    print("\ntop confusions:")
    for (a_chirho, b_chirho), c_chirho in conf_chirho.most_common(10):
        print(f"  {a_chirho}->{b_chirho} x{c_chirho}")


if __name__ == "__main__":
    main_chirho()
