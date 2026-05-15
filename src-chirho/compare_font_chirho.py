#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Visual QA: real scanned Hebrew vs our extracted-glyph "consonant simulator".

For N real labeled Hebrew word crops, strip to consonants, compose the SAME
consonantal string from the v3 bitmap-font + measured metrics, and emit a
side-by-side HTML contact sheet so we can eyeball how close our synthetic
font is to the real Barthélemy scan.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/compare_font_chirho.py --count=100
Then open workspace-chirho/font-compare-chirho/compare-chirho.html
"""

import argparse
import base64
import io
import os
import random
import sqlite3
import sys
from pathlib import Path

from PIL import Image

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
OUT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "font-compare-chirho"

sys.path.insert(0, str(PROJECT_ROOT_CHIRHO / "src-chirho"))
from compose_synthetic_hebrew_v2_chirho import (  # noqa: E402
    load_glyph_library_chirho,
    compose_word_image_chirho,
    strip_nikkud_chirho,
    consonants_only_chirho,
)

FORBIDDEN_CHARS_CHIRHO = set("()[]{}<>" "-–—_/\\|" '"' "'" "‘’“”")


def img_to_data_uri_chirho(img_chirho: Image.Image) -> str:
    buf_chirho = io.BytesIO()
    img_chirho.save(buf_chirho, format="PNG")
    b64_chirho = base64.b64encode(buf_chirho.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64_chirho}"


def main_chirho():
    parser_chirho = argparse.ArgumentParser()
    parser_chirho.add_argument("--count", type=int, default=100)
    parser_chirho.add_argument("--seed", type=int, default=7)
    args_chirho = parser_chirho.parse_args()
    random.seed(args_chirho.seed)

    library_chirho = load_glyph_library_chirho()
    glyph_chars_chirho = set(k_chirho for k_chirho in library_chirho.keys() if not k_chirho.startswith("_"))
    if not glyph_chars_chirho:
        print("Empty glyph library", file=sys.stderr)
        sys.exit(1)
    measured_chirho = library_chirho.get("_measuredChirho")
    print(f"Glyph library: {len(glyph_chars_chirho)} letters; measured metrics: {'yes' if measured_chirho else 'no (using class fallback)'}")

    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    rows_chirho = conn_chirho.execute(
        """SELECT crop_path_chirho, text_chirho, vol_chirho, page_num_chirho
             FROM training_pairs_chirho
             WHERE script_chirho = 'hebrew-chirho'
               AND source_chirho IN ('canonical-recon-chirho', 'human-chirho')
             ORDER BY RANDOM()"""
    ).fetchall()
    conn_chirho.close()

    OUT_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)
    pairs_chirho = []
    for crop_path_chirho, text_chirho, vol_chirho, page_num_chirho in rows_chirho:
        if len(pairs_chirho) >= args_chirho.count:
            break
        if not os.path.exists(crop_path_chirho):
            continue
        t_chirho = text_chirho or ""
        if any(c_chirho in FORBIDDEN_CHARS_CHIRHO for c_chirho in t_chirho):
            continue
        consonants_chirho = consonants_only_chirho(strip_nikkud_chirho(t_chirho))
        if not (2 <= len(consonants_chirho) <= 10):
            continue
        if any(ch_chirho not in glyph_chars_chirho for ch_chirho in consonants_chirho):
            continue
        try:
            real_img_chirho = Image.open(crop_path_chirho).convert("L")
            synth_img_chirho = compose_word_image_chirho(consonants_chirho, library_chirho, glue_prob_chirho=0.35)
        except Exception:
            continue
        pairs_chirho.append({
            "consonantsChirho": consonants_chirho,
            "volChirho": vol_chirho,
            "pageNumChirho": page_num_chirho,
            "realUriChirho": img_to_data_uri_chirho(real_img_chirho),
            "synthUriChirho": img_to_data_uri_chirho(synth_img_chirho),
        })

    if not pairs_chirho:
        print("No comparable words found (consonants must be fully covered by the 24-glyph library)", file=sys.stderr)
        sys.exit(1)

    rows_html_chirho = []
    for i_chirho, p_chirho in enumerate(pairs_chirho):
        rows_html_chirho.append(
            f"<tr>"
            f"<td class='idx'>{i_chirho + 1}</td>"
            f"<td class='heb' dir='rtl'>{p_chirho['consonantsChirho']}</td>"
            f"<td class='loc'>v{p_chirho['volChirho']} p{p_chirho['pageNumChirho']}</td>"
            f"<td class='cell'><img src='{p_chirho['realUriChirho']}' alt='real'></td>"
            f"<td class='cell synth'><img src='{p_chirho['synthUriChirho']}' alt='synth'></td>"
            f"</tr>"
        )

    html_chirho = (
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<title>Font compare — real vs synthetic</title><style>"
        "body{background:#0a0a14;color:#e0e0e0;font-family:system-ui,sans-serif;padding:1rem}"
        "h1{font-size:1rem;color:#c9a84c}"
        ".meta{color:#888;font-size:.8rem;margin-bottom:1rem}"
        "table{border-collapse:collapse;width:100%}"
        "th{position:sticky;top:0;background:#0d0d18;color:#c9a84c;font-size:.8rem;padding:.5rem;border-bottom:1px solid #2a2a4a}"
        "td{border-bottom:1px solid #1a1a2e;padding:.4rem .6rem;vertical-align:middle}"
        ".idx{color:#666;font-size:.75rem}"
        ".heb{font-family:'SBL Hebrew','Noto Serif',serif;font-size:1.3rem;color:#e34a4a;min-width:7rem}"
        ".loc{color:#666;font-size:.7rem}"
        ".cell{background:#fff;border-radius:3px;text-align:center}"
        ".cell img{max-height:54px;display:block;margin:0 auto;image-rendering:-webkit-optimize-contrast}"
        ".cell.synth{background:#fffbe8}"
        "</style></head><body>"
        f"<h1>Real scanned Hebrew vs. our extracted-glyph consonant simulator</h1>"
        f"<p class='meta'>{len(pairs_chirho)} words · left column = real Barthélemy scan crop · "
        f"right column (cream) = composed from {len(glyph_chars_chirho)} extracted glyphs + "
        f"{'measured' if measured_chirho else 'class-fallback'} vertical metrics</p>"
        "<table><thead><tr><th>#</th><th>consonants</th><th>loc</th>"
        "<th>REAL scan</th><th>SYNTHETIC (our font)</th></tr></thead><tbody>"
        + "".join(rows_html_chirho) +
        "</tbody></table></body></html>"
    )
    out_path_chirho = OUT_DIR_CHIRHO / "compare-chirho.html"
    with open(out_path_chirho, "w") as f_chirho:
        f_chirho.write(html_chirho)
    print(f"Wrote {len(pairs_chirho)}-word comparison to {out_path_chirho}")
    print(f"Open it: file://{out_path_chirho}")


if __name__ == "__main__":
    main_chirho()
