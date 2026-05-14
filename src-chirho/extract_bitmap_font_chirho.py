#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Bitmap-font extraction from real Barthélemy Hebrew word crops.

For each canonical-recon Hebrew training pair, segment the word image into
per-character regions using horizontal projection profile (gaps between
letters appear as local minima in column-ink density). Order the segments
RIGHT-TO-LEFT (Hebrew reading order) and label each with the corresponding
character from the canonical text.

Result: a library at workspace-chirho/bitmap-font-chirho/<char>/<sample>.png
that holds REAL pixel samples of each Hebrew letter as rendered in the
Barthélemy scan font — independent of any synthetic font.

This is a prototype: the segmentation heuristic is rough (it doesn't handle
nikkud splitting from base consonants perfectly), but the extracted glyphs
still capture the actual font's character shapes, which closes the synthetic
domain gap.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/extract_bitmap_font_chirho.py
"""

import os
import sqlite3
import sys
from pathlib import Path
from collections import defaultdict

from PIL import Image
import numpy as np

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
OUT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-chirho"

# Strip nikkud + cantillation to keep the character library focused on the
# base consonants, which are the cleanest shapes in horizontal projection.
NIKKUD_RANGES_CHIRHO = [
    (0x0591, 0x05BD),
    (0x05BF, 0x05C7),
]


def strip_nikkud_chirho(text_chirho: str) -> str:
    out_chirho = []
    for ch_chirho in text_chirho:
        cp_chirho = ord(ch_chirho)
        if any(a_chirho <= cp_chirho <= b_chirho for a_chirho, b_chirho in NIKKUD_RANGES_CHIRHO):
            continue
        out_chirho.append(ch_chirho)
    return "".join(out_chirho)


def binarize_chirho(img_chirho: Image.Image) -> np.ndarray:
    """Convert to grayscale + Otsu threshold. Returns a uint8 mask where 1=ink."""
    arr_chirho = np.asarray(img_chirho.convert("L"), dtype=np.uint8)
    # Otsu's threshold via numpy
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


def find_letter_cuts_chirho(mask_chirho: np.ndarray, n_target_chirho: int) -> list:
    """Use horizontal projection profile to find inter-letter gaps. Returns
    n_target+1 x-coords [0, c1, c2, ..., width] dividing the image into
    n_target regions. Heuristic: find local minima in column ink density,
    take the n_target-1 lowest minima."""
    col_density_chirho = mask_chirho.sum(axis=0)  # ink count per column
    width_chirho = mask_chirho.shape[1]
    if width_chirho < n_target_chirho * 2 or n_target_chirho < 2:
        # Too narrow or single char — just slice evenly
        step_chirho = width_chirho / n_target_chirho
        return [int(i_chirho * step_chirho) for i_chirho in range(n_target_chirho)] + [width_chirho]

    # Smooth the density to reduce noise from nikkud
    kernel_chirho = max(3, width_chirho // (n_target_chirho * 6))
    smoothed_chirho = np.convolve(col_density_chirho, np.ones(kernel_chirho) / kernel_chirho, mode="same")

    # Candidate cut points: columns that are local minima within a window.
    candidates_chirho = []
    window_chirho = max(2, width_chirho // (n_target_chirho * 3))
    for x_chirho in range(window_chirho, width_chirho - window_chirho):
        left_min_chirho = smoothed_chirho[x_chirho - window_chirho:x_chirho].min()
        right_min_chirho = smoothed_chirho[x_chirho + 1:x_chirho + window_chirho + 1].min()
        if smoothed_chirho[x_chirho] <= left_min_chirho and smoothed_chirho[x_chirho] <= right_min_chirho:
            candidates_chirho.append((float(smoothed_chirho[x_chirho]), x_chirho))

    # Pick n_target-1 cuts: lowest density first, but enforce a minimum gap
    # between cuts to avoid double-cutting within a single inter-letter space.
    candidates_chirho.sort()
    min_gap_chirho = width_chirho // (n_target_chirho * 2)
    chosen_chirho = []
    for _, x_chirho in candidates_chirho:
        if all(abs(x_chirho - c_chirho) >= min_gap_chirho for c_chirho in chosen_chirho):
            chosen_chirho.append(x_chirho)
        if len(chosen_chirho) >= n_target_chirho - 1:
            break
    chosen_chirho.sort()
    return [0] + chosen_chirho + [width_chirho]


def main_chirho():
    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    rows_chirho = conn_chirho.execute(
        """SELECT crop_path_chirho, text_chirho
             FROM training_pairs_chirho
             WHERE script_chirho = 'hebrew-chirho'
               AND source_chirho IN ('canonical-recon-chirho', 'human-chirho')"""
    ).fetchall()
    conn_chirho.close()

    print(f"Found {len(rows_chirho)} canonical/human Hebrew training pairs")

    extracted_chirho = defaultdict(list)
    skipped_chirho = 0
    OUT_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)

    for path_chirho, text_chirho in rows_chirho:
        if not os.path.exists(path_chirho):
            skipped_chirho += 1
            continue
        consonants_chirho = strip_nikkud_chirho(text_chirho)
        if len(consonants_chirho) == 0 or len(consonants_chirho) > 12:
            skipped_chirho += 1
            continue
        try:
            img_chirho = Image.open(path_chirho)
            mask_chirho = binarize_chirho(img_chirho)
        except Exception:
            skipped_chirho += 1
            continue
        # Hebrew is RTL: leftmost pixel column is the LAST character in the text.
        # Reverse the consonant string so chars_in_order[i] corresponds to the
        # i-th left-to-right pixel region.
        chars_in_order_chirho = consonants_chirho[::-1]
        cuts_chirho = find_letter_cuts_chirho(mask_chirho, len(chars_in_order_chirho))
        for i_chirho, ch_chirho in enumerate(chars_in_order_chirho):
            x0_chirho = cuts_chirho[i_chirho]
            x1_chirho = cuts_chirho[i_chirho + 1]
            if x1_chirho - x0_chirho < 5:
                continue
            crop_chirho = img_chirho.crop((x0_chirho, 0, x1_chirho, img_chirho.height))
            # Tight-bbox the crop to drop horizontal whitespace gutters but keep
            # full vertical context (including descenders).
            crop_mask_chirho = np.asarray(crop_chirho.convert("L"), dtype=np.uint8) < 128
            cols_with_ink_chirho = np.where(crop_mask_chirho.any(axis=0))[0]
            if cols_with_ink_chirho.size == 0:
                continue
            cl_chirho = max(0, int(cols_with_ink_chirho.min()) - 1)
            cr_chirho = min(crop_chirho.width, int(cols_with_ink_chirho.max()) + 2)
            tight_chirho = crop_chirho.crop((cl_chirho, 0, cr_chirho, crop_chirho.height))
            extracted_chirho[ch_chirho].append(tight_chirho)

    # Persist library
    for ch_chirho, samples_chirho in extracted_chirho.items():
        char_dir_chirho = OUT_DIR_CHIRHO / f"U+{ord(ch_chirho):04X}"
        char_dir_chirho.mkdir(parents=True, exist_ok=True)
        for idx_chirho, img_chirho in enumerate(samples_chirho):
            img_chirho.save(char_dir_chirho / f"sample-{idx_chirho:03d}-chirho.png", optimize=True)

    print()
    print("Bitmap font library:")
    for ch_chirho in sorted(extracted_chirho.keys()):
        print(f"  {ch_chirho} (U+{ord(ch_chirho):04X}): {len(extracted_chirho[ch_chirho])} samples")
    print(f"\nskipped: {skipped_chirho}")
    print(f"saved to: {OUT_DIR_CHIRHO}")


if __name__ == "__main__":
    main_chirho()
