#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Synthetic Latin/French + symbol/siglum crops, mirroring the renderer in
generate_synthetic_hebrew_chirho.py so all three classes get matched
scan-like degradation (blur, noise, slight rotation, paper tint).

Sources:
  - Latin/French words: real reconstructed-text tokens from
    pages_chirho.reconstructed_text_chirho (pp 148-152), pure-latin only,
    deduped. ~600 unique tokens. Each rendered ~1-2x with a font/size variation
    to reach the target count.
  - Sigla: a fixed manifold of textual-witness markers from the apparatus
    (*M, *G, *S, *T, *V, [A]-[K], M, G, V, T, S, single digits, etc.) rendered
    many times with variation.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/generate_synthetic_latin_symbol_chirho.py \\
        --latin-count=1000 --symbol-count=500
"""

import argparse
import os
import random
import re
import sqlite3
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
PROGRESS_DB_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
OUT_LATIN_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "synthetic-chirho" / "latin-chirho"
OUT_SYMBOL_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "synthetic-chirho" / "symbol-chirho"

LATIN_FONT_CANDIDATES_CHIRHO = [
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman Italic.ttf",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/System/Library/Fonts/Supplemental/Palatino.ttc",
    "/System/Library/Fonts/Supplemental/Cochin.ttc",
    "/Library/Fonts/Arial Unicode.ttf",
]
LATIN_FONTS_CHIRHO = [p_chirho for p_chirho in LATIN_FONT_CANDIDATES_CHIRHO if os.path.exists(p_chirho)]

POINT_SIZE_RANGE_CHIRHO = (24, 36)
ROTATION_RANGE_DEG_CHIRHO = (-1.5, 1.5)
SCALE_JITTER_RANGE_CHIRHO = (0.92, 1.08)
BLUR_SIGMA_RANGE_CHIRHO = (0.3, 0.9)
NOISE_STD_RANGE_CHIRHO = (2.0, 8.0)
PAPER_TINT_RANGE_CHIRHO = (235, 250)
INK_DARKNESS_RANGE_CHIRHO = (0, 25)
PAD_PX_CHIRHO = 6

SIGLA_CHIRHO = [
    # Textual-witness markers from the critical apparatus
    "*M", "*G", "*S", "*T", "*V", "*L", "*A",
    "[A]", "[B]", "[C]", "[D]", "[E]", "[F]", "[G]", "[H]", "[I]", "[J]", "[K]",
    "M", "G", "V", "T", "S", "L", "A", "B", "C",
    "MGV", "MGVT", "MG", "GT", "MS", "VT",
    # Reference markers
    "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.",
    "1Q", "4Q", "11Q", "4QSama", "MurXII",
    # Verse/chapter markers
    "1,1", "2,3", "3,11", "6,23", "2,4",
    # Punctuation runs
    "//", ":", ";", ",", ".",
]


def render_text_chirho(
    text_chirho: str,
    font_list_chirho: list,
    direction_chirho: str = "ltr",
) -> Image.Image:
    font_path_chirho = random.choice(font_list_chirho)
    point_size_chirho = random.randint(*POINT_SIZE_RANGE_CHIRHO)
    font_chirho = ImageFont.truetype(font_path_chirho, point_size_chirho)

    dummy_img_chirho = Image.new("L", (10, 10), 255)
    dummy_draw_chirho = ImageDraw.Draw(dummy_img_chirho)
    bbox_chirho = dummy_draw_chirho.textbbox((0, 0), text_chirho, font=font_chirho)
    text_w_chirho = max(8, bbox_chirho[2] - bbox_chirho[0])
    text_h_chirho = max(8, bbox_chirho[3] - bbox_chirho[1])

    canvas_w_chirho = text_w_chirho + PAD_PX_CHIRHO * 2
    canvas_h_chirho = text_h_chirho + PAD_PX_CHIRHO * 2

    paper_chirho = random.randint(*PAPER_TINT_RANGE_CHIRHO)
    ink_chirho = random.randint(*INK_DARKNESS_RANGE_CHIRHO)

    img_chirho = Image.new("L", (canvas_w_chirho, canvas_h_chirho), paper_chirho)
    draw_chirho = ImageDraw.Draw(img_chirho)
    draw_chirho.text(
        (PAD_PX_CHIRHO - bbox_chirho[0], PAD_PX_CHIRHO - bbox_chirho[1]),
        text_chirho,
        font=font_chirho,
        fill=ink_chirho,
    )

    angle_chirho = random.uniform(*ROTATION_RANGE_DEG_CHIRHO)
    img_chirho = img_chirho.rotate(angle_chirho, fillcolor=paper_chirho, resample=Image.BILINEAR)

    scale_chirho = random.uniform(*SCALE_JITTER_RANGE_CHIRHO)
    if abs(scale_chirho - 1.0) > 0.01:
        new_w_chirho = max(8, int(img_chirho.width * scale_chirho))
        new_h_chirho = max(8, int(img_chirho.height * scale_chirho))
        img_chirho = img_chirho.resize((new_w_chirho, new_h_chirho), Image.BILINEAR)

    blur_chirho = random.uniform(*BLUR_SIGMA_RANGE_CHIRHO)
    img_chirho = img_chirho.filter(ImageFilter.GaussianBlur(radius=blur_chirho))

    arr_chirho = np.asarray(img_chirho, dtype=np.float32)
    noise_chirho = np.random.normal(0, random.uniform(*NOISE_STD_RANGE_CHIRHO), arr_chirho.shape)
    arr_chirho = np.clip(arr_chirho + noise_chirho, 0, 255).astype(np.uint8)
    img_chirho = Image.fromarray(arr_chirho, mode="L")
    return img_chirho


def collect_latin_words_chirho(progress_conn_chirho, target_count_chirho: int) -> list:
    """Pull pure-Latin tokens from reconstructed_text + canonical training pairs;
    dedupe; if not enough, repeat-sample to reach target_count."""
    seen_chirho = set()
    pool_chirho = []

    # Source 1: reconstructed text from all pages we've processed
    cur_chirho = progress_conn_chirho.execute(
        "SELECT reconstructed_text_chirho FROM pages_chirho WHERE reconstructed_text_chirho IS NOT NULL"
    )
    for (recon_chirho,) in cur_chirho.fetchall():
        for tok_chirho in re.split(r"\s+", recon_chirho or ""):
            t_chirho = re.sub(r"[.,;:!?()\[\]\"'‘’“”]", "", tok_chirho).strip()
            if len(t_chirho) < 3 or len(t_chirho) > 25:
                continue
            # Pure Latin (with French diacritics)
            if not re.fullmatch(r"[a-zA-ZÀ-ÿ'\-]+", t_chirho):
                continue
            if t_chirho in seen_chirho:
                continue
            seen_chirho.add(t_chirho)
            pool_chirho.append(t_chirho)

    # Source 2: canonical training pairs that came in as Latin
    cur_chirho = progress_conn_chirho.execute(
        "SELECT DISTINCT text_chirho FROM training_pairs_chirho WHERE script_chirho IN ('latin-chirho','latin-non-french-chirho')"
    )
    for (tok_chirho,) in cur_chirho.fetchall():
        t_chirho = (tok_chirho or "").strip()
        if t_chirho and t_chirho not in seen_chirho:
            seen_chirho.add(t_chirho)
            pool_chirho.append(t_chirho)

    print(f"  Latin word pool: {len(pool_chirho)} distinct tokens")

    random.shuffle(pool_chirho)
    # Repeat-sample if pool is smaller than target
    selected_chirho = []
    while len(selected_chirho) < target_count_chirho:
        for w_chirho in pool_chirho:
            selected_chirho.append(w_chirho)
            if len(selected_chirho) >= target_count_chirho:
                break
        random.shuffle(pool_chirho)
    return selected_chirho


def main_chirho():
    parser_chirho = argparse.ArgumentParser()
    parser_chirho.add_argument("--latin-count", type=int, default=1000)
    parser_chirho.add_argument("--symbol-count", type=int, default=500)
    parser_chirho.add_argument("--seed", type=int, default=42)
    args_chirho = parser_chirho.parse_args()

    if not LATIN_FONTS_CHIRHO:
        print("No Latin fonts found", file=sys.stderr)
        sys.exit(1)
    print(f"Latin fonts: {LATIN_FONTS_CHIRHO}")

    random.seed(args_chirho.seed)
    np.random.seed(args_chirho.seed)

    OUT_LATIN_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)
    OUT_SYMBOL_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)

    progress_conn_chirho = sqlite3.connect(PROGRESS_DB_CHIRHO)
    progress_conn_chirho.execute("PRAGMA foreign_keys = OFF")

    cur_chirho = progress_conn_chirho.execute(
        "SELECT MIN(word_id_chirho) FROM training_pairs_chirho WHERE source_chirho LIKE 'synthetic-%-chirho'"
    )
    row_chirho = cur_chirho.fetchone()
    next_synth_id_chirho = -1 if row_chirho[0] is None else row_chirho[0] - 1

    # ===== Latin =====
    print(f"=== Latin (target {args_chirho.latin_count}) ===")
    words_chirho = collect_latin_words_chirho(progress_conn_chirho, args_chirho.latin_count)
    for i_chirho, w_chirho in enumerate(words_chirho):
        try:
            img_chirho = render_text_chirho(w_chirho, LATIN_FONTS_CHIRHO)
        except Exception as e_chirho:
            continue
        out_path_chirho = OUT_LATIN_DIR_CHIRHO / f"latin-syn-{i_chirho:05d}-chirho.png"
        img_chirho.save(out_path_chirho, optimize=True)
        progress_conn_chirho.execute(
            """INSERT OR IGNORE INTO training_pairs_chirho
                (word_id_chirho, scanline_id_chirho, page_id_chirho, vol_chirho, page_num_chirho,
                 line_idx_chirho, word_idx_chirho,
                 x_min_chirho, y_min_chirho, x_max_chirho, y_max_chirho,
                 crop_path_chirho, text_chirho, script_chirho, source_chirho,
                 certainty_chirho, tesseract_was_chirho)
               VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?, ?, 'latin-chirho', 'synthetic-latin-chirho', NULL, NULL)""",
            (next_synth_id_chirho, img_chirho.width, img_chirho.height, str(out_path_chirho), w_chirho),
        )
        next_synth_id_chirho -= 1
        if (i_chirho + 1) % 200 == 0:
            progress_conn_chirho.commit()
            print(f"  Latin {i_chirho + 1} / {len(words_chirho)}")

    # ===== Symbols =====
    print(f"=== Symbol (target {args_chirho.symbol_count}) ===")
    for i_chirho in range(args_chirho.symbol_count):
        sigil_chirho = random.choice(SIGLA_CHIRHO)
        try:
            img_chirho = render_text_chirho(sigil_chirho, LATIN_FONTS_CHIRHO)
        except Exception:
            continue
        out_path_chirho = OUT_SYMBOL_DIR_CHIRHO / f"symbol-syn-{i_chirho:05d}-chirho.png"
        img_chirho.save(out_path_chirho, optimize=True)
        progress_conn_chirho.execute(
            """INSERT OR IGNORE INTO training_pairs_chirho
                (word_id_chirho, scanline_id_chirho, page_id_chirho, vol_chirho, page_num_chirho,
                 line_idx_chirho, word_idx_chirho,
                 x_min_chirho, y_min_chirho, x_max_chirho, y_max_chirho,
                 crop_path_chirho, text_chirho, script_chirho, source_chirho,
                 certainty_chirho, tesseract_was_chirho)
               VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?, ?, 'symbol-chirho', 'synthetic-symbol-chirho', NULL, NULL)""",
            (next_synth_id_chirho, img_chirho.width, img_chirho.height, str(out_path_chirho), sigil_chirho),
        )
        next_synth_id_chirho -= 1
        if (i_chirho + 1) % 100 == 0:
            progress_conn_chirho.commit()
            print(f"  Symbol {i_chirho + 1} / {args_chirho.symbol_count}")

    progress_conn_chirho.commit()
    progress_conn_chirho.close()
    print("done")


if __name__ == "__main__":
    main_chirho()
