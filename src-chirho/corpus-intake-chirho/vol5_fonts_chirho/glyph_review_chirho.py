# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Render embedded Greek glyphs beside their proposed Unicode identities.

Source outlines come from the book, reference outlines from a local Unicode
font. This is diagnostic evidence, not a PDF edit or a certification label.
"""
import argparse
import html
import io
import subprocess
from pathlib import Path

import pikepdf
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

from decode_hebrew_chirho import VOL5_PDF_CHIRHO
from greek_tables_chirho import GREEK_MAIN_CHIRHO, GREEK_MAIN_CODES_CHIRHO, GREEK_SECOND_CHIRHO, GREEK_TABLES_CHIRHO


def path_chirho(font_chirho, name_chirho):
    glyphs_chirho = font_chirho.getGlyphSet()
    pen_chirho = SVGPathPen(glyphs_chirho)
    glyphs_chirho[name_chirho].draw(pen_chirho)
    return pen_chirho.getCommands()


def main_chirho():
    parser_chirho = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser_chirho.add_argument("--out-chirho", required=True)
    args_chirho = parser_chirho.parse_args()
    output_chirho = Path(args_chirho.out_chirho)
    output_chirho.mkdir(parents=True, exist_ok=True)
    pdf_chirho = pikepdf.open(VOL5_PDF_CHIRHO)
    reference_chirho = TTFont("/System/Library/Fonts/Supplemental/Times New Roman.ttf")
    reference_map_chirho = reference_chirho.getBestCmap()
    for base_chirho in (GREEK_MAIN_CHIRHO, GREEK_SECOND_CHIRHO):
        font_chirho = next(font_chirho for page_chirho in pdf_chirho.pages for font_chirho in page_chirho.Resources.get("/Font", {}).values()
                          if str(font_chirho.get("/BaseFont", "")).lstrip("/") == base_chirho)
        tt_chirho = TTFont(io.BytesIO(font_chirho.FontDescriptor.FontFile2.read_bytes()))
        tt_chirho.setGlyphOrder([f"glyph{index_chirho:05d}" for index_chirho in range(tt_chirho["maxp"].numGlyphs)])
        cmap_chirho = next(table_chirho for table_chirho in tt_chirho["cmap"].tables if (table_chirho.platformID, table_chirho.platEncID) == (1, 0)).cmap
        items_chirho = sorted(cmap_chirho.items())
        for offset_chirho in range(0, len(items_chirho), 24):
            parts_chirho = ['<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><rect width="100%" height="100%" fill="white"/>']
            for index_chirho, (code_chirho, name_chirho) in enumerate(items_chirho[offset_chirho:offset_chirho + 24]):
                left_chirho, top_chirho = index_chirho % 4 * 400, index_chirho // 4 * 200
                text_chirho = GREEK_TABLES_CHIRHO[base_chirho].get(code_chirho, "�")
                label_chirho = f"{code_chirho:02X}: {' '.join(f'U+{ord(char_chirho):04X}' for char_chirho in text_chirho)}"
                parts_chirho.append(f'<rect x="{left_chirho}" y="{top_chirho}" width="399" height="199" fill="none" stroke="#aaa"/><text x="{left_chirho + 8}" y="{top_chirho + 22}" font-size="18">{html.escape(label_chirho)}</text>')
                parts_chirho.append(f'<text x="{left_chirho + 20}" y="{top_chirho + 46}" font-size="14">Source</text><text x="{left_chirho + 220}" y="{top_chirho + 46}" font-size="14">Unicode</text>')
                scale_chirho = 110 / tt_chirho["head"].unitsPerEm
                parts_chirho.append(f'<path transform="translate({left_chirho + 55},{top_chirho + 150}) scale({scale_chirho},{-scale_chirho})" d="{path_chirho(tt_chirho, name_chirho)}"/>')
                pen_x_chirho = left_chirho + 240
                for char_chirho in text_chirho:
                    ref_name_chirho = reference_map_chirho.get(ord(char_chirho))
                    if ref_name_chirho:
                        scale_chirho = 110 / reference_chirho["head"].unitsPerEm
                        parts_chirho.append(f'<path fill="#235d7b" transform="translate({pen_x_chirho},{top_chirho + 150}) scale({scale_chirho},{-scale_chirho})" d="{path_chirho(reference_chirho, ref_name_chirho)}"/>')
                        pen_x_chirho += reference_chirho["hmtx"][ref_name_chirho][0] * scale_chirho
            parts_chirho.append("</svg>")
            font_dir_chirho = output_chirho / f"{base_chirho.split('+')[0].lower()}-chirho"
            font_dir_chirho.mkdir(exist_ok=True)
            stem_chirho = font_dir_chirho / f"sheet-{offset_chirho // 24 + 1}-chirho"
            stem_chirho.with_suffix(".svg").write_text("\n".join(parts_chirho), encoding="utf-8")
            # These diagnostic SVGs use paths, not browser-only features.
            # Select the internal renderer rather than launching Inkscape.
            subprocess.run(["magick", "MSVG:" + str(stem_chirho.with_suffix(".svg")), str(stem_chirho.with_suffix(".png"))], check=True)
            print(stem_chirho.with_suffix(".png"))


if __name__ == "__main__":
    main_chirho()
