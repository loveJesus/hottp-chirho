# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Describe repeated, translation-invariant contours in the source Greek font.

No OCR, word-frequency or biblical-neighbour inference: a contour either
matches the embedded outline exactly or remains unidentified. This is private
diagnostic evidence, not a font redistribution or a certified text label.
Workflow: spec-chirho/workflows-chirho/corpus-chirho/font-drafts-workflow-chirho.md
"""
import argparse
import hashlib
import io
import json
import unicodedata
from collections import Counter
from pathlib import Path

import pikepdf
from fontTools.ttLib import TTFont

from decode_hebrew_chirho import VOL5_PDF_CHIRHO
from greek_tables_chirho import GREEK_MAIN_CHIRHO, GREEK_MAIN_CODES_CHIRHO

BASE_CODES_CHIRHO = (0x22, 0x23, 0x24, 0x25, 0x28, 0x29, 0x2B, 0x2C, 0x2D, 0x2F, 0x30, 0x32, 0x34, 0x35,
                    0x37, 0x38, 0x3A, 0x3D, 0x47, 0x49, 0x4D, 0x51, 0x54, 0x56, 0x5D, 0x67, 0x72, 0x76, 0x79,
                    0x81, 0x87, 0x92, 0x95, 0x97, 0x98, 0x9B, 0x9E, 0xA0, 0xAD, 0x26, 0x91, 0xA8)
BODY_TEXT_CHIRHO = {0x26: "α", 0x91: "Η", 0xA8: "Ω"}
BODY_REMOVE_CHIRHO = {0x26: "78ece6ebd11ffe5a5e5a3c8d7f2902fe1c054d419ac9f926e9307701a05ada35", 0x91: "a049df6feac0c5ccbac998e61dfd45b468c8fcd7bb12157ce5c58ff8601b75e7", 0xA8: "a049df6feac0c5ccbac998e61dfd45b468c8fcd7bb12157ce5c58ff8601b75e7"}
# Anchors 21/27/3B/73 independently read in broker #30873; the smaller
# circumflex breathings and capital variants have separate witnesses in #30875.
MARK_SIGNATURES_CHIRHO = {
    "4c6afb06b18c370c6f265580aabe21b936bf4cea9de4934080d02097ec72d1f5": "\u0314",
    "069688fa9d401e2a0209c2bc47f2baa750b62e34cb3b15655f0b9723e5cc4bc4": "\u0313",
    "48fe0e8972e8a713fd9f9fe5caa4fd7b131e6c0c020cc22acf15a30b3023a4e2": "\u0301",
    "78ece6ebd11ffe5a5e5a3c8d7f2902fe1c054d419ac9f926e9307701a05ada35": "\u0300",
    "31e4c1d76b27736b9e13f1f7e03bf9b7ebadec25c8364edaec614d8ff540050d": "\u0300",
    "55648855ecd68c8353261fbc9f028f19812f2e6b4ecb646a29ccab2d365df43d": "\u0342",
    "a79764e662af247dc7c6c348dc86ad36fd0efc04abb7ac0fdeca96ebe3c45194": "\u0342",
    "2c57b4cd5f1d2d9c87e08d1be95083f738d0b552e568ed433b9b1ed33991de62": "\u0345",
    "858475216542821eb52392f2f25a3be1b3319f988d1a74b28675f8823365db94": "\u0313",
    "883f7d7910ebc43ee9eccd2c7919b7af481840eb85e8bec6311072d473584ad4": "\u0314",
    "a049df6feac0c5ccbac998e61dfd45b468c8fcd7bb12157ce5c58ff8601b75e7": "\u0314",
    "dba9ad07d9e3b9e2e2f118fe061517e32c74a238a14fdecb9205a0d28bdae05e": "\u0313",
    "5e083b0d61c32ec17d039c6dcb385945359007a88105684f6e0f2b91b71f8057": "\u0301",
}
DOT_SIGNATURES_CHIRHO = frozenset({"e9e1983250df37fde4be3825f7b6e41e6ffd9828298b767198e9f908aa3ba216", "68199ae287eb5f566ba12cb789ca5e7f96ea4d6bb1380d2aa0b5c65b3f15d7cb"})


def contour_signature_chirho(points_chirho):
    x0_chirho, y0_chirho = min(point_chirho[0] for point_chirho in points_chirho), min(point_chirho[1] for point_chirho in points_chirho)
    relative_chirho = [(point_chirho[0] - x0_chirho, point_chirho[1] - y0_chirho, point_chirho[2] & 1) for point_chirho in points_chirho]
    canonical_chirho = min(tuple(relative_chirho[index_chirho:] + relative_chirho[:index_chirho]) for index_chirho in range(len(relative_chirho)))
    return hashlib.sha256(json.dumps(canonical_chirho, separators=(",", ":")).encode()).hexdigest()


def contours_chirho(font_chirho, name_chirho):
    glyph_chirho = font_chirho["glyf"][name_chirho]
    coordinates_chirho, ends_chirho, flags_chirho = glyph_chirho.getCoordinates(font_chirho["glyf"])
    out_chirho, start_chirho = [], 0
    for end_chirho in ends_chirho:
        points_chirho = [(int(coordinates_chirho[index_chirho][0]), int(coordinates_chirho[index_chirho][1]), int(flags_chirho[index_chirho])) for index_chirho in range(start_chirho, end_chirho + 1)]
        out_chirho.append({"signature_chirho": contour_signature_chirho(points_chirho), "box_chirho": [min(point_chirho[0] for point_chirho in points_chirho), min(point_chirho[1] for point_chirho in points_chirho), max(point_chirho[0] for point_chirho in points_chirho), max(point_chirho[1] for point_chirho in points_chirho)], "points_chirho": points_chirho})
        start_chirho = end_chirho + 1
    return out_chirho


def body_matches_chirho(body_chirho, values_chirho):
    """Require one common translation for every part, including letter holes."""
    if not body_chirho:
        return False
    actual_chirho = Counter((part_chirho["signature_chirho"], *part_chirho["box_chirho"][:2]) for part_chirho in values_chirho)
    for first_chirho in values_chirho:
        if first_chirho["signature_chirho"] != body_chirho[0]["signature_chirho"]:
            continue
        dx_chirho = first_chirho["box_chirho"][0] - body_chirho[0]["box_chirho"][0]
        dy_chirho = first_chirho["box_chirho"][1] - body_chirho[0]["box_chirho"][1]
        required_chirho = Counter((part_chirho["signature_chirho"], part_chirho["box_chirho"][0] + dx_chirho, part_chirho["box_chirho"][1] + dy_chirho) for part_chirho in body_chirho)
        if not required_chirho - actual_chirho:
            return True
    return False


def component_report_chirho(pdf_chirho):
    resource_chirho = next(font_chirho for page_chirho in pdf_chirho.pages for font_chirho in page_chirho.Resources.get("/Font", {}).values() if str(font_chirho.get("/BaseFont", "")).lstrip("/") == GREEK_MAIN_CHIRHO)
    font_chirho = TTFont(io.BytesIO(resource_chirho.FontDescriptor.FontFile2.read_bytes()))
    font_chirho.setGlyphOrder([f"glyph{index_chirho:05d}" for index_chirho in range(font_chirho["maxp"].numGlyphs)])
    cmap_chirho = next(table_chirho.cmap for table_chirho in font_chirho["cmap"].tables if (table_chirho.platformID, table_chirho.platEncID) == (1, 0))
    outlines_chirho = {code_chirho: contours_chirho(font_chirho, name_chirho) for code_chirho, name_chirho in cmap_chirho.items()}
    counts_chirho = {code_chirho: Counter(contour_chirho["signature_chirho"] for contour_chirho in values_chirho) for code_chirho, values_chirho in outlines_chirho.items()}
    bodies_chirho = {code_chirho: [part_chirho for part_chirho in outlines_chirho[code_chirho] if part_chirho["signature_chirho"] != BODY_REMOVE_CHIRHO.get(code_chirho)] for code_chirho in BASE_CODES_CHIRHO}
    body_counts_chirho = {code_chirho: Counter(part_chirho["signature_chirho"] for part_chirho in parts_chirho) for code_chirho, parts_chirho in bodies_chirho.items()}
    rows_chirho = []
    for code_chirho, values_chirho in sorted(outlines_chirho.items()):
        bases_chirho = [base_chirho for base_chirho in BASE_CODES_CHIRHO if body_matches_chirho(bodies_chirho[base_chirho], values_chirho)]
        extra_chirho = []
        if len(bases_chirho) == 1:
            remaining_chirho = counts_chirho[code_chirho] - body_counts_chirho[bases_chirho[0]]
            for value_chirho in values_chirho:
                if remaining_chirho[value_chirho["signature_chirho"]]:
                    extra_chirho.append(value_chirho)
                    remaining_chirho[value_chirho["signature_chirho"]] -= 1
        rows_chirho.append({"code_chirho": code_chirho, "hex_chirho": f"{code_chirho:02X}", "proposed_chirho": GREEK_MAIN_CODES_CHIRHO[code_chirho],
                           "base_codes_chirho": bases_chirho, "base_text_chirho": [BODY_TEXT_CHIRHO.get(base_chirho, GREEK_MAIN_CODES_CHIRHO[base_chirho]) for base_chirho in bases_chirho], "extra_chirho": extra_chirho, "contours_chirho": values_chirho})
    return rows_chirho


def derive_identity_chirho(row_chirho):
    if row_chirho["code_chirho"] in (0x5E, 0x69, 0x89):
        return {0x5E: ";", 0x69: "·", 0x89: "’"}[row_chirho["code_chirho"]]
    if len(row_chirho["base_text_chirho"]) != 1:
        raise ValueError(f"Ambiguous base at {row_chirho['hex_chirho']}")
    marks_chirho, dots_chirho = [], []
    for part_chirho in row_chirho["extra_chirho"]:
        signature_chirho = part_chirho["signature_chirho"]
        if signature_chirho in DOT_SIGNATURES_CHIRHO:
            dots_chirho.append(signature_chirho)
        elif signature_chirho in MARK_SIGNATURES_CHIRHO:
            marks_chirho.append(MARK_SIGNATURES_CHIRHO[signature_chirho])
        else:
            raise ValueError(f"Unidentified contour {signature_chirho}")
    if dots_chirho:
        if len(dots_chirho) != 2 or set(dots_chirho) != DOT_SIGNATURES_CHIRHO:
            raise ValueError("Incomplete diaeresis")
        marks_chirho.append("\u0308")
    if len(marks_chirho) != len(set(marks_chirho)):
        raise ValueError("Repeated/unexplained accent component")
    order_chirho = {"\u0313": 0, "\u0314": 0, "\u0308": 1, "\u0300": 2, "\u0301": 2, "\u0342": 2, "\u0345": 3}
    return unicodedata.normalize("NFC", row_chirho["base_text_chirho"][0] + "".join(sorted(marks_chirho, key=lambda mark_chirho: order_chirho[mark_chirho])))


def main_chirho():
    parser_chirho = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser_chirho.add_argument("--out-chirho", required=True)
    args_chirho = parser_chirho.parse_args()
    output_chirho = Path(args_chirho.out_chirho)
    output_chirho.parent.mkdir(parents=True, exist_ok=True)
    with pikepdf.open(VOL5_PDF_CHIRHO) as pdf_chirho:
        rows_chirho = component_report_chirho(pdf_chirho)
    for row_chirho in rows_chirho:
        row_chirho["derived_chirho"] = derive_identity_chirho(row_chirho)
    output_chirho.write_text(json.dumps(rows_chirho, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for row_chirho in rows_chirho:
        print(f"{row_chirho['hex_chirho']}: {row_chirho['derived_chirho']} " + ", ".join(f"{item_chirho['signature_chirho'][:10]}@{item_chirho['box_chirho']}" for item_chirho in row_chirho["extra_chirho"]))


if __name__ == "__main__":
    main_chirho()
