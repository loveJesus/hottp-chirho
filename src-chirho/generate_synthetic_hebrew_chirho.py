#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Generate synthetic Hebrew word crops from the Westminster Leningrad Codex.

For each WLC word: render with a biblical-Hebrew font, apply scan-like
degradation (light blur + gaussian noise + slight rotation + small scale jitter
+ subtle paper-tint background), save as PNG, and insert a row into
training_pairs_chirho with source='synthetic-hebrew-chirho'.

The renderer rotates through a small font palette to mimic the variability
across Barthélemy's five volumes (earlier vols more sans-serif, later more
serif). Adjust the font list if Arial Hebrew Scholar is unavailable.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/generate_synthetic_hebrew_chirho.py --count=1000
"""

import argparse
import os
import random
import sqlite3
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
WLC_DB_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "wlc-chirho.sqlite"
PROGRESS_DB_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
OUT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "synthetic-chirho" / "hebrew-chirho"

# Hebrew fonts on macOS. Arial Hebrew Scholar is the scholarly biblical-Hebrew
# font and is the best match for Barthélemy. The others provide visual
# variability so the CNN doesn't latch onto a single font's quirks.
HEBREW_FONT_CANDIDATES_CHIRHO = [
    # Biblical-Hebrew style fonts downloaded for closer Barthélemy domain match.
    # Frank Ruehl Libre + David Libre are classic blocky/square Hebrew prints
    # that closely match 19th-century scholarly typesetting.
    str(PROJECT_ROOT_CHIRHO / "workspace-chirho" / "synthetic-fonts-chirho" / "FrankRuhlLibre.ttf"),
    str(PROJECT_ROOT_CHIRHO / "workspace-chirho" / "synthetic-fonts-chirho" / "DavidLibre-Regular.ttf"),
    str(PROJECT_ROOT_CHIRHO / "workspace-chirho" / "synthetic-fonts-chirho" / "DavidLibre-Bold.ttf"),
    "/System/Library/Fonts/ArialHB.ttc",                # Arial Hebrew Scholar
    "/System/Library/Fonts/SFHebrew.ttf",               # SF Hebrew
    "/System/Library/Fonts/Supplemental/Raanana.ttc",   # Raanana
    "/System/Library/Fonts/Supplemental/NewPeninimMT.ttc",  # New Peninim MT
]
HEBREW_FONTS_CHIRHO = [p_chirho for p_chirho in HEBREW_FONT_CANDIDATES_CHIRHO if os.path.exists(p_chirho)]

# Scan-relevant rendering parameters. 300 DPI Barthélemy scans show Hebrew
# x-heights around 20-30 px (without nikkud), 35-45 px (with nikkud descenders
# and cantillation). Font point-size 30-36 lands in that range.
POINT_SIZE_RANGE_CHIRHO = (28, 38)
ROTATION_RANGE_DEG_CHIRHO = (-1.5, 1.5)
SCALE_JITTER_RANGE_CHIRHO = (0.92, 1.08)
BLUR_SIGMA_RANGE_CHIRHO = (0.3, 0.9)
NOISE_STD_RANGE_CHIRHO = (2.0, 8.0)
PAPER_TINT_RANGE_CHIRHO = (235, 250)   # near-white but not pure
INK_DARKNESS_RANGE_CHIRHO = (0, 25)    # near-black with slight variability
PAD_PX_CHIRHO = 6


def render_word_chirho(word_chirho: str, idx_chirho: int) -> Image.Image:
    """Render one Hebrew word with random scan-like degradations applied."""
    font_path_chirho = random.choice(HEBREW_FONTS_CHIRHO)
    point_size_chirho = random.randint(*POINT_SIZE_RANGE_CHIRHO)
    font_chirho = ImageFont.truetype(font_path_chirho, point_size_chirho)

    # Measure to determine canvas size
    dummy_img_chirho = Image.new("L", (10, 10), 255)
    dummy_draw_chirho = ImageDraw.Draw(dummy_img_chirho)
    bbox_chirho = dummy_draw_chirho.textbbox((0, 0), word_chirho, font=font_chirho, direction="rtl")
    text_w_chirho = bbox_chirho[2] - bbox_chirho[0]
    text_h_chirho = bbox_chirho[3] - bbox_chirho[1]

    canvas_w_chirho = text_w_chirho + PAD_PX_CHIRHO * 2
    canvas_h_chirho = text_h_chirho + PAD_PX_CHIRHO * 2

    paper_chirho = random.randint(*PAPER_TINT_RANGE_CHIRHO)
    ink_chirho = random.randint(*INK_DARKNESS_RANGE_CHIRHO)

    img_chirho = Image.new("L", (canvas_w_chirho, canvas_h_chirho), paper_chirho)
    draw_chirho = ImageDraw.Draw(img_chirho)
    draw_chirho.text(
        (PAD_PX_CHIRHO - bbox_chirho[0], PAD_PX_CHIRHO - bbox_chirho[1]),
        word_chirho,
        font=font_chirho,
        fill=ink_chirho,
        direction="rtl",
    )

    # Slight rotation
    angle_chirho = random.uniform(*ROTATION_RANGE_DEG_CHIRHO)
    img_chirho = img_chirho.rotate(angle_chirho, fillcolor=paper_chirho, resample=Image.BILINEAR)

    # Scale jitter
    scale_chirho = random.uniform(*SCALE_JITTER_RANGE_CHIRHO)
    if abs(scale_chirho - 1.0) > 0.01:
        new_w_chirho = max(8, int(img_chirho.width * scale_chirho))
        new_h_chirho = max(8, int(img_chirho.height * scale_chirho))
        img_chirho = img_chirho.resize((new_w_chirho, new_h_chirho), Image.BILINEAR)

    # Gaussian blur (ink bleed)
    blur_chirho = random.uniform(*BLUR_SIGMA_RANGE_CHIRHO)
    img_chirho = img_chirho.filter(ImageFilter.GaussianBlur(radius=blur_chirho))

    # Gaussian noise (scan grain)
    arr_chirho = np.asarray(img_chirho, dtype=np.float32)
    noise_chirho = np.random.normal(0, random.uniform(*NOISE_STD_RANGE_CHIRHO), arr_chirho.shape)
    arr_chirho = np.clip(arr_chirho + noise_chirho, 0, 255).astype(np.uint8)
    img_chirho = Image.fromarray(arr_chirho, mode="L")

    return img_chirho


def main_chirho():
    parser_chirho = argparse.ArgumentParser()
    parser_chirho.add_argument("--count", type=int, default=1000)
    parser_chirho.add_argument("--seed", type=int, default=42)
    args_chirho = parser_chirho.parse_args()

    if not HEBREW_FONTS_CHIRHO:
        print("No Hebrew fonts found in the candidate list", file=sys.stderr)
        sys.exit(1)

    print(f"Using fonts: {HEBREW_FONTS_CHIRHO}")

    random.seed(args_chirho.seed)
    np.random.seed(args_chirho.seed)

    OUT_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)

    # Pull N random WLC words with nikkud. Prefer distinct words.
    wlc_conn_chirho = sqlite3.connect(WLC_DB_CHIRHO)
    rows_chirho = wlc_conn_chirho.execute(
        "SELECT raw_word_chirho FROM words_chirho ORDER BY RANDOM() LIMIT ?",
        (args_chirho.count * 2,),  # over-sample, dedupe below
    ).fetchall()
    wlc_conn_chirho.close()

    seen_chirho = set()
    words_chirho = []
    for (raw_chirho,) in rows_chirho:
        w_chirho = raw_chirho.strip()
        if not w_chirho or w_chirho in seen_chirho:
            continue
        seen_chirho.add(w_chirho)
        words_chirho.append(w_chirho)
        if len(words_chirho) >= args_chirho.count:
            break
    print(f"Selected {len(words_chirho)} distinct Hebrew words")

    progress_conn_chirho = sqlite3.connect(PROGRESS_DB_CHIRHO)
    progress_conn_chirho.execute("PRAGMA foreign_keys = OFF")

    # Find the lowest existing synthetic word_id to keep negatives unique.
    cur_chirho = progress_conn_chirho.execute(
        "SELECT MIN(word_id_chirho) FROM training_pairs_chirho WHERE source_chirho LIKE 'synthetic-%-chirho'"
    )
    row_chirho = cur_chirho.fetchone()
    next_synth_id_chirho = -1 if row_chirho[0] is None else row_chirho[0] - 1

    inserted_chirho = 0
    failed_chirho = 0
    for i_chirho, w_chirho in enumerate(words_chirho):
        try:
            img_chirho = render_word_chirho(w_chirho, i_chirho)
        except Exception as e_chirho:
            failed_chirho += 1
            if failed_chirho <= 3:
                print(f"  render failed for {w_chirho!r}: {e_chirho}")
            continue
        out_name_chirho = f"hebrew-syn-{i_chirho:05d}-chirho.png"
        out_path_chirho = OUT_DIR_CHIRHO / out_name_chirho
        img_chirho.save(out_path_chirho, optimize=True)

        progress_conn_chirho.execute(
            """INSERT OR IGNORE INTO training_pairs_chirho
                (word_id_chirho, scanline_id_chirho, page_id_chirho, vol_chirho, page_num_chirho,
                 line_idx_chirho, word_idx_chirho,
                 x_min_chirho, y_min_chirho, x_max_chirho, y_max_chirho,
                 crop_path_chirho, text_chirho, script_chirho, source_chirho,
                 certainty_chirho, tesseract_was_chirho)
               VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?, ?, 'hebrew-chirho', 'synthetic-hebrew-chirho', NULL, NULL)""",
            (next_synth_id_chirho, img_chirho.width, img_chirho.height, str(out_path_chirho), w_chirho),
        )
        next_synth_id_chirho -= 1
        inserted_chirho += 1
        if (inserted_chirho % 200) == 0:
            progress_conn_chirho.commit()
            print(f"  {inserted_chirho} / {len(words_chirho)} rendered")

    progress_conn_chirho.commit()
    progress_conn_chirho.close()
    print(f"done: {inserted_chirho} synthetic Hebrew pairs inserted, {failed_chirho} failed")


if __name__ == "__main__":
    main_chirho()
