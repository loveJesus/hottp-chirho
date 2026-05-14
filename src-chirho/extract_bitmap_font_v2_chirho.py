#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
v2 of the bitmap-font extractor.

Strategy shift after v1 produced rough merged-glyph crops:

  1. For each canonical-Hebrew training pair, binarize and run connected-
     component analysis on the ink pixels.
  2. Group small components vertically with their nearest tall consonant
     (nikkud + cantillation snap to their letter).
  3. If the resulting consonant-cluster count equals the number of
     non-nikkud characters in the canonical text, the word is CLEANLY
     SEPARABLE — extract each cluster as a per-character labeled glyph.
  4. If not, record it as a GLUE event: the components-per-letter ratio
     tells us how often this letter (or letter pair) is touching its
     neighbor. We don't extract from glue events, but we tally them as
     statistical signal for the synthesis composer.

Outputs:
  - workspace-chirho/bitmap-font-v2-chirho/U+<hex>/sample-N-chirho.png
    Clean per-character glyphs only.
  - workspace-chirho/bitmap-font-v2-chirho/_stats-chirho.json
    Per-letter gluing rate (how often a letter ends up merged with a
    neighbor across all source words).

The composer can later sample glyphs and reintroduce gluing with
frequencies that match what we saw in real Barthélemy text.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/extract_bitmap_font_v2_chirho.py
"""

import json
import os
import sqlite3
import sys
from pathlib import Path
from collections import defaultdict, Counter

from PIL import Image
import numpy as np
from scipy import ndimage

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
OUT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v2-chirho"
STATS_PATH_CHIRHO = OUT_DIR_CHIRHO / "_stats-chirho.json"

NIKKUD_RANGES_CHIRHO = [(0x0591, 0x05BD), (0x05BF, 0x05C7)]
HEBREW_LETTER_RANGE_CHIRHO = (0x05D0, 0x05EA)


def strip_nikkud_chirho(text_chirho: str) -> str:
    return "".join(ch_chirho for ch_chirho in text_chirho if not any(a_chirho <= ord(ch_chirho) <= b_chirho for a_chirho, b_chirho in NIKKUD_RANGES_CHIRHO))


def keep_hebrew_only_chirho(text_chirho: str) -> str:
    return "".join(ch_chirho for ch_chirho in text_chirho if HEBREW_LETTER_RANGE_CHIRHO[0] <= ord(ch_chirho) <= HEBREW_LETTER_RANGE_CHIRHO[1])


def otsu_binarize_chirho(arr_chirho: np.ndarray) -> np.ndarray:
    hist_chirho, _ = np.histogram(arr_chirho.flatten(), bins=256, range=(0, 256))
    total_chirho = arr_chirho.size
    sum_total_chirho = float((np.arange(256) * hist_chirho).sum())
    sum_bg_chirho = 0.0
    w_bg_chirho = 0
    var_max_chirho = 0.0
    best_t_chirho = 127
    for t_chirho in range(256):
        w_bg_chirho += hist_chirho[t_chirho]
        if w_bg_chirho == 0:
            continue
        w_fg_chirho = total_chirho - w_bg_chirho
        if w_fg_chirho == 0:
            break
        sum_bg_chirho += t_chirho * hist_chirho[t_chirho]
        mean_bg_chirho = sum_bg_chirho / w_bg_chirho
        mean_fg_chirho = (sum_total_chirho - sum_bg_chirho) / w_fg_chirho
        var_chirho = w_bg_chirho * w_fg_chirho * (mean_bg_chirho - mean_fg_chirho) ** 2
        if var_chirho > var_max_chirho:
            var_max_chirho = var_chirho
            best_t_chirho = t_chirho
    return (arr_chirho < best_t_chirho).astype(np.uint8)


def cluster_components_chirho(mask_chirho: np.ndarray) -> list:
    """Connected-component labeling, then merge tiny components into their
    nearest tall component (nikkud/cantillation -> their base letter).
    Returns list of (x_min, x_max, mask_bool) clusters, ordered left-to-right."""
    labeled_chirho, n_chirho = ndimage.label(mask_chirho)
    if n_chirho == 0:
        return []

    # Per-component bbox + height
    components_chirho = []
    h_total_chirho = mask_chirho.shape[0]
    for label_chirho in range(1, n_chirho + 1):
        ys_chirho, xs_chirho = np.where(labeled_chirho == label_chirho)
        if len(xs_chirho) == 0:
            continue
        components_chirho.append({
            "labelChirho": label_chirho,
            "xMinChirho": int(xs_chirho.min()),
            "xMaxChirho": int(xs_chirho.max()),
            "yMinChirho": int(ys_chirho.min()),
            "yMaxChirho": int(ys_chirho.max()),
            "heightChirho": int(ys_chirho.max() - ys_chirho.min() + 1),
        })

    # Letters are tall (>= 30% of image height). Nikkud + small punct are short.
    LETTER_HEIGHT_FRAC_CHIRHO = 0.30
    threshold_chirho = h_total_chirho * LETTER_HEIGHT_FRAC_CHIRHO
    letters_chirho = [c_chirho for c_chirho in components_chirho if c_chirho["heightChirho"] >= threshold_chirho]
    smalls_chirho = [c_chirho for c_chirho in components_chirho if c_chirho["heightChirho"] < threshold_chirho]
    letters_chirho.sort(key=lambda c_chirho: c_chirho["xMinChirho"])

    # Snap each small to its nearest-by-x-centroid letter
    cluster_masks_chirho = [labeled_chirho == c_chirho["labelChirho"] for c_chirho in letters_chirho]
    for sm_chirho in smalls_chirho:
        sm_cx_chirho = (sm_chirho["xMinChirho"] + sm_chirho["xMaxChirho"]) / 2.0
        best_idx_chirho = 0
        best_dist_chirho = float("inf")
        for i_chirho, l_chirho in enumerate(letters_chirho):
            l_cx_chirho = (l_chirho["xMinChirho"] + l_chirho["xMaxChirho"]) / 2.0
            d_chirho = abs(sm_cx_chirho - l_cx_chirho)
            if d_chirho < best_dist_chirho:
                best_dist_chirho = d_chirho
                best_idx_chirho = i_chirho
        if letters_chirho:
            cluster_masks_chirho[best_idx_chirho] = cluster_masks_chirho[best_idx_chirho] | (labeled_chirho == sm_chirho["labelChirho"])

    # Recompute bboxes from merged masks
    out_chirho = []
    for mask_i_chirho in cluster_masks_chirho:
        ys_chirho, xs_chirho = np.where(mask_i_chirho)
        if len(xs_chirho) == 0:
            continue
        out_chirho.append({
            "xMinChirho": int(xs_chirho.min()),
            "xMaxChirho": int(xs_chirho.max()),
            "yMinChirho": int(ys_chirho.min()),
            "yMaxChirho": int(ys_chirho.max()),
            "maskChirho": mask_i_chirho,
        })
    out_chirho.sort(key=lambda c_chirho: c_chirho["xMinChirho"])
    return out_chirho


def main_chirho():
    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    rows_chirho = conn_chirho.execute(
        """SELECT crop_path_chirho, text_chirho, vol_chirho
             FROM training_pairs_chirho
             WHERE script_chirho = 'hebrew-chirho'
               AND source_chirho IN ('canonical-recon-chirho', 'human-chirho')"""
    ).fetchall()
    conn_chirho.close()
    print(f"Found {len(rows_chirho)} Hebrew training pairs")

    OUT_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)

    extracted_chirho = defaultdict(list)
    glue_letter_count_chirho = Counter()    # letter -> times appeared in a glued word
    glue_total_count_chirho = Counter()     # letter -> total appearances
    clean_word_count_chirho = 0
    glued_word_count_chirho = 0
    skipped_chirho = 0

    for path_chirho, text_chirho, vol_chirho in rows_chirho:
        if not os.path.exists(path_chirho):
            skipped_chirho += 1
            continue
        consonants_chirho = keep_hebrew_only_chirho(strip_nikkud_chirho(text_chirho))
        n_letters_chirho = len(consonants_chirho)
        if n_letters_chirho == 0 or n_letters_chirho > 14:
            skipped_chirho += 1
            continue

        try:
            img_chirho = Image.open(path_chirho).convert("L")
            arr_chirho = np.asarray(img_chirho, dtype=np.uint8)
            mask_chirho = otsu_binarize_chirho(arr_chirho)
            clusters_chirho = cluster_components_chirho(mask_chirho)
        except Exception:
            skipped_chirho += 1
            continue

        # Hebrew is RTL — image's leftmost cluster corresponds to LAST consonant.
        letters_rtl_chirho = consonants_chirho[::-1]

        for ch_chirho in consonants_chirho:
            glue_total_count_chirho[ch_chirho] += 1

        if len(clusters_chirho) == n_letters_chirho:
            # Clean separation — extract per-character
            clean_word_count_chirho += 1
            for i_chirho, cluster_chirho in enumerate(clusters_chirho):
                ch_chirho = letters_rtl_chirho[i_chirho]
                if not (HEBREW_LETTER_RANGE_CHIRHO[0] <= ord(ch_chirho) <= HEBREW_LETTER_RANGE_CHIRHO[1]):
                    continue
                cx0_chirho = max(0, cluster_chirho["xMinChirho"] - 1)
                cx1_chirho = min(img_chirho.width, cluster_chirho["xMaxChirho"] + 2)
                glyph_crop_chirho = img_chirho.crop((cx0_chirho, 0, cx1_chirho, img_chirho.height))
                extracted_chirho[ch_chirho].append((vol_chirho, glyph_crop_chirho))
        else:
            # Glued word — every letter in it counts as having glued at least once
            glued_word_count_chirho += 1
            for ch_chirho in consonants_chirho:
                glue_letter_count_chirho[ch_chirho] += 1

    # Persist glyph library, grouped by codepoint and volume
    for ch_chirho, samples_chirho in extracted_chirho.items():
        cp_chirho = ord(ch_chirho)
        char_dir_chirho = OUT_DIR_CHIRHO / f"U+{cp_chirho:04X}"
        char_dir_chirho.mkdir(parents=True, exist_ok=True)
        for idx_chirho, (vol_chirho, glyph_chirho) in enumerate(samples_chirho):
            glyph_chirho.save(char_dir_chirho / f"vol-{vol_chirho}-sample-{idx_chirho:03d}-chirho.png", optimize=True)

    # Compute glue rates and persist stats
    glue_rates_chirho = {}
    for ch_chirho, total_chirho in glue_total_count_chirho.items():
        glued_chirho = glue_letter_count_chirho.get(ch_chirho, 0)
        glue_rates_chirho[f"U+{ord(ch_chirho):04X}"] = {
            "characterChirho": ch_chirho,
            "totalAppearancesChirho": total_chirho,
            "appearancesInGluedWordsChirho": glued_chirho,
            "glueRateChirho": glued_chirho / total_chirho if total_chirho > 0 else 0.0,
        }
    stats_chirho = {
        "cleanWordCountChirho": clean_word_count_chirho,
        "gluedWordCountChirho": glued_word_count_chirho,
        "perCharacterChirho": glue_rates_chirho,
    }
    with open(STATS_PATH_CHIRHO, "w") as f_chirho:
        json.dump(stats_chirho, f_chirho, indent=2, ensure_ascii=False)

    print()
    print(f"Clean source words: {clean_word_count_chirho}")
    print(f"Glued source words: {glued_word_count_chirho}")
    print(f"Skipped: {skipped_chirho}")
    print()
    print("Per-character library (clean glyphs only):")
    for ch_chirho in sorted(extracted_chirho.keys()):
        print(f"  {ch_chirho} (U+{ord(ch_chirho):04X}): {len(extracted_chirho[ch_chirho])} samples")
    print()
    print("Glue rate by letter (how often this letter appears in a merged-component word):")
    for cp_str_chirho, info_chirho in sorted(glue_rates_chirho.items(), key=lambda kv_chirho: -kv_chirho[1]["glueRateChirho"]):
        rate_chirho = info_chirho["glueRateChirho"]
        print(f"  {info_chirho['characterChirho']} ({cp_str_chirho}): {info_chirho['appearancesInGluedWordsChirho']}/{info_chirho['totalAppearancesChirho']} = {rate_chirho:.2f}")
    print()
    print(f"Saved to: {OUT_DIR_CHIRHO}")
    print(f"Stats: {STATS_PATH_CHIRHO}")


if __name__ == "__main__":
    main_chirho()
