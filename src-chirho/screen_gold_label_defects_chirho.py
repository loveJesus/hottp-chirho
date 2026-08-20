#!/usr/bin/env python3
# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""PROTOTYPE — measured 73% accurate, NOT usable as a gate. Do not wire it in.

Goal was an automatic detector for the lamed-for-yod gold defect
(spec-chirho/ocr-witness-chirho/gold-set-label-integrity-2026-08-19-chirho.md).
Lamed is the only Hebrew letter with an ascender, so "a label claiming N lameds
must show N ascenders" looked mechanically checkable from the crop alone.

IT DOES NOT WORK WELL ENOUGH. Grid-searched over band fraction, minimum rise,
column gap and gap tolerance against 30 crops whose printed spelling was
confirmed by hand this session: best exact-count accuracy **22/30 = 0.733**,
erring in BOTH directions. Root causes, in order:

  1. VOCALISATION. Holam and other points sit above the letter body and are
     indistinguishable from an ascender by height alone (דבית reads 2, יבלעם
     over-counts). A usable version must segment and discard nikkud first.
  2. Crop tightness varies, so the x-height band estimate is unstable.
  3. Merged glyphs fuse two lameds into one column run (הגלגל reads 1 of 2).

Kept because the negative result and the calibration set are worth more than a
silent deletion: it tells the next attempt to solve nikkud segmentation FIRST,
and the labelled crops below are reusable.

What actually works, and what every confirmed correction in the ledger used:
re-cut the word from the source page with vertical padding, magnify 6x, and read
the ascenders. Ascender presence and ascender COUNT survived independent
verification by two other agents; no pixel heuristic here reached that bar.

    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/screen_gold_label_defects_chirho.py [--limit=N] [--validate]
"""
import argparse
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
GOLD_MANIFEST_PATH_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho"
                             / "gold-set-chirho" / "manifest-chirho.json")
CORPUS_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "hebrew-corpus-chirho"
INK_THRESHOLD_CHIRHO = 128
MIN_COMPONENT_PIXELS_CHIRHO = 8
# Grid-search optimum over the 30-crop calibration set — still only 0.733 exact.
BAND_INK_FRACTION_CHIRHO = 0.30        # share of peak row-ink that marks the x-height band
MIN_ASCENDER_RISE_CHIRHO = 6           # px ink must clear the band top by to count
ASCENDER_COLUMN_GAP_CHIRHO = 4         # column gap that separates two ascenders
ASCENDER_GAP_TOLERANCE_CHIRHO = 3      # vertical white gap allowed before it reads as bleed


def ink_mask_chirho(crop_path_chirho):
    return np.array(Image.open(crop_path_chirho).convert("L")) < INK_THRESHOLD_CHIRHO


def connected_components_chirho(mask_chirho):
    """8-connected components as (rows, cols) index arrays, noise dropped."""
    seen_chirho = np.zeros_like(mask_chirho, bool)
    components_chirho = []
    height_chirho, width_chirho = mask_chirho.shape
    for row_chirho in range(height_chirho):
        for col_chirho in range(width_chirho):
            if not mask_chirho[row_chirho, col_chirho] or seen_chirho[row_chirho, col_chirho]:
                continue
            queue_chirho = deque([(row_chirho, col_chirho)])
            seen_chirho[row_chirho, col_chirho] = True
            pixels_chirho = []
            while queue_chirho:
                y_chirho, x_chirho = queue_chirho.popleft()
                pixels_chirho.append((y_chirho, x_chirho))
                for dy_chirho in (-1, 0, 1):
                    for dx_chirho in (-1, 0, 1):
                        ny_chirho, nx_chirho = y_chirho + dy_chirho, x_chirho + dx_chirho
                        if (0 <= ny_chirho < height_chirho and 0 <= nx_chirho < width_chirho
                                and mask_chirho[ny_chirho, nx_chirho]
                                and not seen_chirho[ny_chirho, nx_chirho]):
                            seen_chirho[ny_chirho, nx_chirho] = True
                            queue_chirho.append((ny_chirho, nx_chirho))
            if len(pixels_chirho) >= MIN_COMPONENT_PIXELS_CHIRHO:
                components_chirho.append(np.array(pixels_chirho))
    return components_chirho


def count_ascenders_chirho(mask_chirho):
    """Count lamed ascenders: ink rising above the x-height band and connected
    down into it.

    The x-height band is taken from the ROW INK HISTOGRAM, not from a
    component's top — most Hebrew letters are full-height, so a band derived
    from the letter tops would sit inside every glyph and count them all.
    A lamed is the only letter whose ink rises materially above the dense band.

    A run of ascender ink counts only if ink runs CONTINUOUSLY from it down into
    the band. Ink bleeding from the line above floats free, separated by white,
    and is what fooled tesseract into reading lamed for yod in the first place.
    """
    rows_ink_chirho = mask_chirho.sum(axis=1)
    if not rows_ink_chirho.any():
        return 0, []
    ink_rows_chirho = np.nonzero(rows_ink_chirho)[0]
    dense_chirho = rows_ink_chirho.max()
    # band = contiguous rows carrying at least this share of peak ink
    band_rows_chirho = np.nonzero(rows_ink_chirho >= BAND_INK_FRACTION_CHIRHO * dense_chirho)[0]
    if band_rows_chirho.size == 0:
        return 0, []
    band_top_chirho = int(band_rows_chirho.min())
    if band_top_chirho - int(ink_rows_chirho.min()) < MIN_ASCENDER_RISE_CHIRHO:
        return 0, []          # nothing rises meaningfully above the band
    above_chirho = mask_chirho[:band_top_chirho, :]
    columns_chirho = np.nonzero(above_chirho.any(axis=0))[0]
    if columns_chirho.size == 0:
        return 0, []
    runs_chirho, start_chirho, previous_chirho = [], columns_chirho[0], columns_chirho[0]
    for column_chirho in columns_chirho[1:]:
        if column_chirho - previous_chirho > ASCENDER_COLUMN_GAP_CHIRHO:
            runs_chirho.append((start_chirho, previous_chirho))
            start_chirho = column_chirho
        previous_chirho = column_chirho
    runs_chirho.append((start_chirho, previous_chirho))

    ascenders_chirho = []
    for left_chirho, right_chirho in runs_chirho:
        slice_chirho = mask_chirho[:, left_chirho:right_chirho + 1]
        rows_present_chirho = np.nonzero(slice_chirho.any(axis=1))[0]
        # continuity: no white gap between the ascender and the band
        gaps_chirho = np.diff(rows_present_chirho)
        reaches_band_chirho = rows_present_chirho.max() >= band_top_chirho
        unbroken_chirho = gaps_chirho.size == 0 or gaps_chirho.max() <= ASCENDER_GAP_TOLERANCE_CHIRHO
        if reaches_band_chirho and unbroken_chirho:
            ascenders_chirho.append((int(left_chirho), int(right_chirho)))
    return len(ascenders_chirho), ascenders_chirho


def screen_chirho(limit_chirho=None):
    gold_chirho = json.loads(GOLD_MANIFEST_PATH_CHIRHO.read_text())["goldChirho"]
    if limit_chirho:
        gold_chirho = gold_chirho[:limit_chirho]
    findings_chirho = []
    for entry_chirho in gold_chirho:
        crop_path_chirho = CORPUS_DIR_CHIRHO / entry_chirho["cropChirho"]
        if not crop_path_chirho.exists():
            continue
        claimed_chirho = entry_chirho["goldConsonantsChirho"].count("ל")
        observed_chirho, spans_chirho = count_ascenders_chirho(ink_mask_chirho(crop_path_chirho))
        if observed_chirho != claimed_chirho:
            findings_chirho.append({
                "cropChirho": entry_chirho["cropChirho"],
                "goldChirho": entry_chirho["goldConsonantsChirho"],
                "lamedsClaimedChirho": claimed_chirho,
                "ascendersObservedChirho": observed_chirho,
                "verdictChirho": ("gold claims MORE lameds than the print shows"
                                  if claimed_chirho > observed_chirho
                                  else "print shows MORE ascenders than gold claims"),
            })
    return findings_chirho


def main_chirho():
    parser_chirho = argparse.ArgumentParser()
    parser_chirho.add_argument("--limit", type=int, default=None, dest="limit_chirho")
    parser_chirho.add_argument("--validate", action="store_true", dest="validate_chirho",
                               help="score the screen against the confirmed-corrupt ledger")
    args_chirho = parser_chirho.parse_args()
    findings_chirho = screen_chirho(args_chirho.limit_chirho)
    print(f"[screen] gold records flagged on ascender count: {len(findings_chirho)}")
    for finding_chirho in findings_chirho[:40]:
        print(f"  {finding_chirho['cropChirho']:<32} gold={finding_chirho['goldChirho']:<12}"
              f" lameds_claimed={finding_chirho['lamedsClaimedChirho']}"
              f" ascenders_seen={finding_chirho['ascendersObservedChirho']}")
    if args_chirho.validate_chirho:
        confirmed_chirho = {
            "p0150-x1217-y1462-chirho.png", "p0244-x1486-y361-chirho.png",
            "p0291-x378-y1951-chirho.png", "p0342-x636-y1628-chirho.png",
            "p0308-x497-y609-chirho.png", "p0157-x1137-y1422-chirho.png",
            "p0157-x525-y1473-chirho.png", "p0159-x644-y459-chirho.png",
            "p0209-x605-y1690-chirho.png", "p0244-x737-y1309-chirho.png",
            "p0252-x1190-y1749-chirho.png", "p0257-x128-y550-chirho.png",
            "p0310-x930-y1792-chirho.png", "p0332-x369-y2046-chirho.png",
            "p0347-x669-y1898-chirho.png", "p0352-x250-y304-chirho.png",
        }
        lamed_bearing_chirho = {c_chirho for c_chirho in confirmed_chirho}
        flagged_chirho = {f_chirho["cropChirho"] for f_chirho in findings_chirho}
        caught_chirho = lamed_bearing_chirho & flagged_chirho
        print(f"\n[validate] confirmed lamed-class corruptions caught: "
              f"{len(caught_chirho)}/{len(lamed_bearing_chirho)}")
        for crop_chirho in sorted(lamed_bearing_chirho - flagged_chirho):
            print(f"   missed: {crop_chirho}")


if __name__ == "__main__":
    main_chirho()
