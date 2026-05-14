#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Synthetic polytonic Greek word crops.

Source: a curated list of common LXX/NT-style Greek words (the ones likely to
appear in Barthélemy's apparatus when quoting the Septuagint). Each rendered
with Times New Roman / Georgia / Palatino (all of which have decent polytonic
Greek glyphs on macOS) and the same scan-like degradation pipeline used for
Hebrew/Latin.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/generate_synthetic_greek_chirho.py --count=500
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
PROGRESS_DB_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
OUT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "synthetic-chirho" / "greek-chirho"

GREEK_FONT_CANDIDATES_CHIRHO = [
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman Italic.ttf",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/System/Library/Fonts/Supplemental/Palatino.ttc",
    "/Library/Fonts/Arial Unicode.ttf",
]
GREEK_FONTS_CHIRHO = [p_chirho for p_chirho in GREEK_FONT_CANDIDATES_CHIRHO if os.path.exists(p_chirho)]

POINT_SIZE_RANGE_CHIRHO = (24, 36)
ROTATION_RANGE_DEG_CHIRHO = (-1.5, 1.5)
SCALE_JITTER_RANGE_CHIRHO = (0.92, 1.08)
BLUR_SIGMA_RANGE_CHIRHO = (0.3, 0.9)
NOISE_STD_RANGE_CHIRHO = (2.0, 8.0)
PAPER_TINT_RANGE_CHIRHO = (235, 250)
INK_DARKNESS_RANGE_CHIRHO = (0, 25)
PAD_PX_CHIRHO = 6

# Common LXX / NT Greek words with polytonic accents + breathings. Mix of
# nouns/verbs/articles/prepositions. These exercise rough/smooth breathing,
# acute/grave/circumflex, iota subscripts, and diaeresis.
GREEK_WORDS_CHIRHO = [
    "καὶ", "ὁ", "ἡ", "τὸ", "τοῦ", "τῆς", "τῷ", "τῇ", "τὸν", "τὴν",
    "οἱ", "αἱ", "τὰ", "τῶν", "τοῖς", "ταῖς", "τοὺς", "τὰς",
    "ἐν", "ἐκ", "εἰς", "ἐπὶ", "ὑπὸ", "μετὰ", "διὰ", "παρὰ", "πρὸς", "πρὸ",
    "ἀπὸ", "σὺν", "περὶ", "κατὰ", "ἀνὰ", "ὑπέρ",
    "ἐστιν", "ἦν", "ἔστιν", "εἶναι", "γενέσθαι", "ἐγένετο", "ἔσται",
    "λέγει", "εἶπεν", "λέγων", "λέγουσιν", "ἔλεγεν", "λαλεῖν",
    "θεὸς", "θεοῦ", "θεῷ", "κύριος", "κυρίου", "κυρίῳ", "κύριον",
    "Ἰσραήλ", "Ἰσραηλίτης", "Ἰεροσάλημ", "Σιών",
    "ἄνθρωπος", "ἀνθρώπου", "ἀνθρώπῳ", "ἀνθρώπων", "ἀνθρώποις",
    "υἱὸς", "υἱοῦ", "υἱῷ", "υἱὸν", "υἱοί", "υἱῶν",
    "ψυχή", "ψυχῆς", "ψυχῇ", "ψυχήν", "ψυχαὶ",
    "οὐρανὸς", "οὐρανοῦ", "οὐρανῷ", "γῆ", "γῆς", "γῇ", "γῆν",
    "πᾶς", "πᾶσα", "πᾶν", "πάντες", "πάντα", "πάντων",
    "ἐγὼ", "σὺ", "ἡμεῖς", "ὑμεῖς", "αὐτὸς", "αὐτῷ", "αὐτὸν", "αὐτῶν", "αὐτοῖς",
    "ὅς", "ἥ", "ὅ", "οὗ", "ᾧ", "ὅν", "ὧν",
    "ὅτι", "ὡς", "ἐάν", "εἰ", "ἀλλά", "γὰρ", "δὲ", "μέν", "οὖν", "οὐ", "οὐκ",
    "μή", "νῦν", "ἤδη", "ἐκεῖ", "πᾶσι", "οὕτως", "οὕτω",
    "βασιλεύς", "βασιλέως", "βασιλεῖ", "βασιλέα", "βασιλεῖς",
    "πνεῦμα", "πνεύματος", "πνεύματι", "πνεύματα",
    "λόγος", "λόγου", "λόγῳ", "λόγον", "λόγοι", "λόγων",
    "ζωή", "ζωῆς", "ζωῇ", "ζωήν",
    "ἀγαθὸς", "ἀγαθὴ", "ἀγαθὸν",
    "ἅγιος", "ἁγία", "ἅγιον", "ἁγίου", "ἁγίῳ", "ἁγίων",
    "δόξα", "δόξης", "δόξῃ", "δόξαν",
    "δικαιοσύνη", "δικαιοσύνης", "δικαιοσύνῃ",
    "Φαραώ", "Μωυσῆς", "Ἀβραάμ", "Ἰακώβ", "Δαυίδ", "Ἰωσήφ", "Σαμουήλ",
    "ἤγαγον", "ἐποίησεν", "ἐλάβομεν", "ἤκουσαν", "ἐπορεύθη",
    "ἀγαπᾷ", "ἀγαπᾶν", "ἠγάπησεν", "ἠγάπων",
    "ἀδελφὸς", "ἀδελφοῦ", "ἀδελφῷ", "ἀδελφοί", "ἀδελφῶν",
    "δοῦλος", "δούλου", "δούλῳ", "δοῦλοι",
    "ἔτος", "ἔτη", "ἔτους", "ἡμέρα", "ἡμέρας", "ἡμέρᾳ", "ἡμέραν",
    "νύξ", "νυκτὸς", "νυκτὶ", "νύκτα",
    "πατήρ", "πατρὸς", "πατρὶ", "πατέρα", "πατέρες", "πατέρων",
    "μήτηρ", "μητρὸς", "μητρὶ",
    "γυνὴ", "γυναικὸς", "γυναικὶ", "γυναῖκα", "γυναῖκες",
    "τέκνον", "τέκνου", "τέκνῳ", "τέκνα", "τέκνων",
    "πνεύματος", "καρδία", "καρδίας", "καρδίᾳ", "καρδίαν",
]


def render_greek_chirho(word_chirho: str) -> Image.Image:
    font_path_chirho = random.choice(GREEK_FONTS_CHIRHO)
    point_size_chirho = random.randint(*POINT_SIZE_RANGE_CHIRHO)
    font_chirho = ImageFont.truetype(font_path_chirho, point_size_chirho)

    dummy_img_chirho = Image.new("L", (10, 10), 255)
    dummy_draw_chirho = ImageDraw.Draw(dummy_img_chirho)
    bbox_chirho = dummy_draw_chirho.textbbox((0, 0), word_chirho, font=font_chirho)
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
        word_chirho,
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
    return Image.fromarray(arr_chirho, mode="L")


def main_chirho():
    parser_chirho = argparse.ArgumentParser()
    parser_chirho.add_argument("--count", type=int, default=500)
    parser_chirho.add_argument("--seed", type=int, default=42)
    args_chirho = parser_chirho.parse_args()

    if not GREEK_FONTS_CHIRHO:
        print("No Greek fonts found", file=sys.stderr)
        sys.exit(1)

    print(f"Using fonts: {GREEK_FONTS_CHIRHO}")
    print(f"Source word pool: {len(GREEK_WORDS_CHIRHO)} distinct Greek tokens")
    random.seed(args_chirho.seed)
    np.random.seed(args_chirho.seed)
    OUT_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)

    progress_conn_chirho = sqlite3.connect(PROGRESS_DB_CHIRHO)
    progress_conn_chirho.execute("PRAGMA foreign_keys = OFF")
    cur_chirho = progress_conn_chirho.execute(
        "SELECT MIN(word_id_chirho) FROM training_pairs_chirho WHERE source_chirho LIKE 'synthetic-%-chirho'"
    )
    row_chirho = cur_chirho.fetchone()
    next_synth_id_chirho = -1 if row_chirho[0] is None else row_chirho[0] - 1

    inserted_chirho = 0
    for i_chirho in range(args_chirho.count):
        word_chirho = random.choice(GREEK_WORDS_CHIRHO)
        try:
            img_chirho = render_greek_chirho(word_chirho)
        except Exception:
            continue
        out_path_chirho = OUT_DIR_CHIRHO / f"greek-syn-{i_chirho:05d}-chirho.png"
        img_chirho.save(out_path_chirho, optimize=True)
        progress_conn_chirho.execute(
            """INSERT OR IGNORE INTO training_pairs_chirho
                (word_id_chirho, scanline_id_chirho, page_id_chirho, vol_chirho, page_num_chirho,
                 line_idx_chirho, word_idx_chirho,
                 x_min_chirho, y_min_chirho, x_max_chirho, y_max_chirho,
                 crop_path_chirho, text_chirho, script_chirho, source_chirho,
                 certainty_chirho, tesseract_was_chirho)
               VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?, ?, 'greek-chirho', 'synthetic-greek-chirho', NULL, NULL)""",
            (next_synth_id_chirho, img_chirho.width, img_chirho.height, str(out_path_chirho), word_chirho),
        )
        next_synth_id_chirho -= 1
        inserted_chirho += 1
        if (i_chirho + 1) % 100 == 0:
            progress_conn_chirho.commit()
            print(f"  {i_chirho + 1} / {args_chirho.count}")
    progress_conn_chirho.commit()
    progress_conn_chirho.close()
    print(f"done: {inserted_chirho} synthetic Greek pairs inserted")


if __name__ == "__main__":
    main_chirho()
