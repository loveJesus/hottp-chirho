#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Compose synthetic Hebrew word images from the human-annotated v3 glyph library
(workspace-chirho/bitmap-font-v3-chirho/U+XXXX/*.png).

Pipeline per synthesized word:
  1. Sample a WLC word from spec-chirho/wlc-chirho.sqlite.
  2. Strip nikkud + sin/shin dot — we have no annotations for those, so the
     synthesized image is consonants-only Hebrew (still unambiguously
     "Hebrew script" for classifier purposes).
  3. Skip the word if any consonant is missing from the glyph library.
  4. For each consonant (text reversed for left-to-right pixel layout, since
     Hebrew is RTL), sample a glyph variant at random.
  5. Normalize all glyph heights to a consistent baseline. Letters sit on the
     baseline, with consistent baseline-line.
  6. Lay out left-to-right with random per-gap spacing. With probability
     `--glue-prob` per adjacent pair, the gap is reduced to a small negative
     (overlap) — matching the touching-letter patterns seen in real scans.
  7. Add scan-like degradation: paper tint, ink darkness jitter, light
     gaussian noise + blur, slight rotation.
  8. Save and insert a row into training_pairs_chirho with
     source='synthetic-hebrew-real-glyphs-chirho'.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/compose_synthetic_hebrew_v2_chirho.py --count=1000
"""

import argparse
import os
import random
import sqlite3
import sys
from pathlib import Path
from collections import defaultdict

from PIL import Image, ImageFilter
import numpy as np

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
WLC_DB_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "wlc-chirho.sqlite"
PROGRESS_DB_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
GLYPH_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-chirho"
OUT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "synthetic-chirho" / "hebrew-real-glyphs-chirho"

NIKKUD_RANGES_CHIRHO = [(0x0591, 0x05BD), (0x05BF, 0x05C7)]
HEBREW_LETTER_RANGE_CHIRHO = (0x05D0, 0x05EA)

TARGET_HEIGHT_CHIRHO = 40   # All glyphs normalized to this consonant-body height.
GAP_RANGE_CHIRHO = (-3, 6)  # Pixel gap between adjacent glyphs (negative = overlap).
ROTATION_RANGE_CHIRHO = (-1.2, 1.2)
SCALE_JITTER_RANGE_CHIRHO = (0.92, 1.08)
BLUR_SIGMA_RANGE_CHIRHO = (0.3, 0.9)
NOISE_STD_RANGE_CHIRHO = (2.0, 8.0)
PAPER_TINT_RANGE_CHIRHO = (235, 250)
PER_GLYPH_PAD_CHIRHO = 3


def strip_nikkud_chirho(text_chirho: str) -> str:
    return "".join(ch_chirho for ch_chirho in text_chirho if not any(a_chirho <= ord(ch_chirho) <= b_chirho for a_chirho, b_chirho in NIKKUD_RANGES_CHIRHO))


def consonants_only_chirho(text_chirho: str) -> str:
    return "".join(ch_chirho for ch_chirho in text_chirho if HEBREW_LETTER_RANGE_CHIRHO[0] <= ord(ch_chirho) <= HEBREW_LETTER_RANGE_CHIRHO[1])


def load_glyph_library_chirho() -> dict:
    """Returns {character: [{'imgChirho': PIL.Image, 'polyTopFracChirho': 0-1,
    'polyBottomFracChirho': 0-1}]}. Glyphs are scaled to a common reference
    word-crop height so per-glyph vertical position (relative to baseline) is
    preserved across the library — final-nun descenders, yod tops, lamed
    ascenders all stay at their correct line-position.

    If the sidecar .json exists (newer v3 glyphs saved with full word-crop
    height), we use polyTop/polyBottom + wordCropHeight. Older tight-cropped
    glyphs fall back to default centered placement."""
    import os as os_chirho
    import json as json_chirho
    library_chirho: dict = {}
    if not GLYPH_DIR_CHIRHO.exists():
        return library_chirho
    for cp_dir_chirho in GLYPH_DIR_CHIRHO.iterdir():
        if not cp_dir_chirho.is_dir() or not cp_dir_chirho.name.startswith("U+"):
            continue
        try:
            cp_chirho = int(cp_dir_chirho.name[2:], 16)
        except ValueError:
            continue
        ch_chirho = chr(cp_chirho)
        glyphs_chirho = []
        for png_chirho in cp_dir_chirho.glob("*.png"):
            img_chirho = Image.open(png_chirho).convert("L")
            sidecar_chirho = png_chirho.with_suffix(".json")
            poly_top_frac_chirho = 0.0
            poly_bottom_frac_chirho = 1.0
            has_position_chirho = False
            if os_chirho.path.exists(sidecar_chirho):
                try:
                    with open(sidecar_chirho) as f_chirho:
                        meta_chirho = json_chirho.load(f_chirho)
                    h_chirho = float(meta_chirho.get("wordCropHeightChirho", img_chirho.height))
                    if h_chirho > 0:
                        poly_top_frac_chirho = meta_chirho.get("polyTopChirho", 0) / h_chirho
                        poly_bottom_frac_chirho = meta_chirho.get("polyBottomChirho", h_chirho) / h_chirho
                        has_position_chirho = True
                except Exception:
                    pass
            # Scale to common word-crop reference height TARGET_HEIGHT_CHIRHO,
            # preserving aspect ratio
            scale_chirho = TARGET_HEIGHT_CHIRHO / img_chirho.height
            new_w_chirho = max(4, int(round(img_chirho.width * scale_chirho)))
            img_chirho = img_chirho.resize((new_w_chirho, TARGET_HEIGHT_CHIRHO), Image.BILINEAR)
            glyphs_chirho.append({
                "imgChirho": img_chirho,
                "polyTopFracChirho": poly_top_frac_chirho,
                "polyBottomFracChirho": poly_bottom_frac_chirho,
                "hasPositionChirho": has_position_chirho,
            })
        if glyphs_chirho:
            library_chirho[ch_chirho] = glyphs_chirho
    return library_chirho


def sample_wlc_words_chirho(n_chirho: int, library_chars_chirho: set) -> list:
    """Sample WLC words whose consonants are all covered by our glyph library.
    Over-sample then filter (faster than rejection in a loop)."""
    conn_chirho = sqlite3.connect(WLC_DB_CHIRHO)
    rows_chirho = conn_chirho.execute(
        "SELECT raw_word_chirho FROM words_chirho ORDER BY RANDOM() LIMIT ?",
        (n_chirho * 4,),
    ).fetchall()
    conn_chirho.close()
    selected_chirho = []
    seen_chirho = set()
    for (raw_chirho,) in rows_chirho:
        consonants_chirho = consonants_only_chirho(strip_nikkud_chirho(raw_chirho or ""))
        if not (2 <= len(consonants_chirho) <= 10):
            continue
        if any(ch_chirho not in library_chars_chirho for ch_chirho in consonants_chirho):
            continue
        if consonants_chirho in seen_chirho:
            continue
        seen_chirho.add(consonants_chirho)
        selected_chirho.append(consonants_chirho)
        if len(selected_chirho) >= n_chirho:
            break
    return selected_chirho


def compose_word_image_chirho(consonants_chirho: str, library_chirho: dict, glue_prob_chirho: float) -> Image.Image:
    """Lay glyphs out left-to-right (text reversed for RTL). All glyphs share
    the same reference word-crop height (TARGET_HEIGHT_CHIRHO), so simply
    pasting them at y=0 preserves the per-glyph vertical position relative to
    the line baseline. Older tight-cropped glyphs without sidecar metadata
    fall back to bottom-aligned placement."""
    # Hebrew is RTL: first consonant in text is on the right of the image,
    # so we reverse the text for left-to-right pixel composition.
    chars_in_pixel_order_chirho = consonants_chirho[::-1]
    sampled_chirho = [random.choice(library_chirho[ch_chirho]) for ch_chirho in chars_in_pixel_order_chirho]

    # All glyphs already normalized to TARGET_HEIGHT_CHIRHO in load_glyph_library.
    line_h_chirho = TARGET_HEIGHT_CHIRHO
    positions_chirho = []
    x_chirho = PER_GLYPH_PAD_CHIRHO
    for i_chirho, glyph_info_chirho in enumerate(sampled_chirho):
        img_chirho = glyph_info_chirho["imgChirho"]
        # Hebrew block letters hang from a TOPLINE, not a Latin baseline.
        # Both the sidecar-positioned glyphs (full-strip, paste at y=0) and the
        # legacy tight-cropped glyphs are top-aligned. For legacy glyphs this
        # keeps descenders (ך ן ף ץ ק) hanging below the consonant body and
        # short letters (yod) up near the topline — the correct Hebrew shape.
        y_chirho = 0
        positions_chirho.append((x_chirho, y_chirho))
        x_chirho += img_chirho.width
        if i_chirho < len(sampled_chirho) - 1:
            if random.random() < glue_prob_chirho:
                gap_chirho = random.randint(-4, -1)
            else:
                gap_chirho = random.randint(*GAP_RANGE_CHIRHO)
            x_chirho += gap_chirho

    canvas_w_chirho = x_chirho + PER_GLYPH_PAD_CHIRHO
    canvas_h_chirho = line_h_chirho + PER_GLYPH_PAD_CHIRHO * 2
    paper_chirho = random.randint(*PAPER_TINT_RANGE_CHIRHO)
    canvas_chirho = Image.new("L", (canvas_w_chirho, canvas_h_chirho), paper_chirho)

    # Paste each glyph using its ink as an alpha mask.
    for i_chirho, (glyph_info_chirho, pos_chirho) in enumerate(zip(sampled_chirho, positions_chirho)):
        g_chirho = glyph_info_chirho["imgChirho"]
        gx_chirho, gy_chirho = pos_chirho
        arr_chirho = np.asarray(g_chirho, dtype=np.uint8)
        alpha_chirho = 255 - arr_chirho
        canvas_chirho.paste(
            Image.new("L", g_chirho.size, random.randint(0, 25)),
            (gx_chirho, gy_chirho + PER_GLYPH_PAD_CHIRHO),
            mask=Image.fromarray(alpha_chirho, "L"),
        )

    # Slight rotation
    angle_chirho = random.uniform(*ROTATION_RANGE_CHIRHO)
    canvas_chirho = canvas_chirho.rotate(angle_chirho, fillcolor=paper_chirho, resample=Image.BILINEAR, expand=False)

    # Scale jitter
    scale_chirho = random.uniform(*SCALE_JITTER_RANGE_CHIRHO)
    if abs(scale_chirho - 1.0) > 0.01:
        new_w_chirho = max(8, int(canvas_chirho.width * scale_chirho))
        new_h_chirho = max(8, int(canvas_chirho.height * scale_chirho))
        canvas_chirho = canvas_chirho.resize((new_w_chirho, new_h_chirho), Image.BILINEAR)

    # Light blur
    canvas_chirho = canvas_chirho.filter(ImageFilter.GaussianBlur(radius=random.uniform(*BLUR_SIGMA_RANGE_CHIRHO)))

    # Noise
    arr_chirho = np.asarray(canvas_chirho, dtype=np.float32)
    noise_chirho = np.random.normal(0, random.uniform(*NOISE_STD_RANGE_CHIRHO), arr_chirho.shape)
    arr_chirho = np.clip(arr_chirho + noise_chirho, 0, 255).astype(np.uint8)
    return Image.fromarray(arr_chirho, mode="L")


def main_chirho():
    parser_chirho = argparse.ArgumentParser()
    parser_chirho.add_argument("--count", type=int, default=500)
    parser_chirho.add_argument("--glue-prob", type=float, default=0.35,
                               help="Per-adjacent-pair probability of overlap (mimics touching letters in real scans)")
    parser_chirho.add_argument("--seed", type=int, default=42)
    args_chirho = parser_chirho.parse_args()

    random.seed(args_chirho.seed)
    np.random.seed(args_chirho.seed)

    library_chirho = load_glyph_library_chirho()
    if not library_chirho:
        print(f"No glyphs found in {GLYPH_DIR_CHIRHO}", file=sys.stderr)
        sys.exit(1)
    print(f"Loaded glyph library: {len(library_chirho)} letters")
    for ch_chirho in sorted(library_chirho.keys()):
        print(f"  {ch_chirho} (U+{ord(ch_chirho):04X}): {len(library_chirho[ch_chirho])} samples")

    words_chirho = sample_wlc_words_chirho(args_chirho.count, set(library_chirho.keys()))
    print(f"Sampled {len(words_chirho)} WLC words whose consonants are fully covered")

    OUT_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)
    progress_conn_chirho = sqlite3.connect(PROGRESS_DB_CHIRHO)
    progress_conn_chirho.execute("PRAGMA foreign_keys = OFF")
    cur_chirho = progress_conn_chirho.execute(
        "SELECT MIN(word_id_chirho) FROM training_pairs_chirho WHERE source_chirho LIKE 'synthetic-%-chirho'"
    )
    row_chirho = cur_chirho.fetchone()
    next_synth_id_chirho = -1 if row_chirho[0] is None else row_chirho[0] - 1

    inserted_chirho = 0
    failed_chirho = 0
    for i_chirho, word_chirho in enumerate(words_chirho):
        try:
            img_chirho = compose_word_image_chirho(word_chirho, library_chirho, args_chirho.glue_prob)
        except Exception as e_chirho:
            failed_chirho += 1
            if failed_chirho <= 3:
                print(f"  compose failed for {word_chirho!r}: {e_chirho}")
            continue
        out_path_chirho = OUT_DIR_CHIRHO / f"heb-real-{i_chirho:05d}-chirho.png"
        img_chirho.save(out_path_chirho, optimize=True)
        progress_conn_chirho.execute(
            """INSERT OR IGNORE INTO training_pairs_chirho
                (word_id_chirho, scanline_id_chirho, page_id_chirho, vol_chirho, page_num_chirho,
                 line_idx_chirho, word_idx_chirho,
                 x_min_chirho, y_min_chirho, x_max_chirho, y_max_chirho,
                 crop_path_chirho, text_chirho, script_chirho, source_chirho,
                 certainty_chirho, tesseract_was_chirho)
               VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?, ?, 'hebrew-chirho', 'synthetic-hebrew-real-glyphs-chirho', NULL, NULL)""",
            (next_synth_id_chirho, img_chirho.width, img_chirho.height, str(out_path_chirho), word_chirho),
        )
        next_synth_id_chirho -= 1
        inserted_chirho += 1
        if (i_chirho + 1) % 100 == 0:
            progress_conn_chirho.commit()
            print(f"  {i_chirho + 1} / {len(words_chirho)} composed")

    progress_conn_chirho.commit()
    progress_conn_chirho.close()
    print(f"done: {inserted_chirho} composed, {failed_chirho} failed")
    print(f"saved to: {OUT_DIR_CHIRHO}")


if __name__ == "__main__":
    main_chirho()
