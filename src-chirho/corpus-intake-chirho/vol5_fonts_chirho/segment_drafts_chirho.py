# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Source-font Unicode proposals, bounded to one frozen source page at a time.

Only complete, unambiguous, single-script segments qualify. Raw text, boxes,
statuses and accepted readings are never changed by this dry-run program.
Workflow: spec-chirho/workflows-chirho/corpus-chirho/font-drafts-workflow-chirho.md
"""
import argparse
import hashlib
import json
import math
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

import pikepdf

from decode_hebrew_chirho import VOL5_PDF_CHIRHO, baseline_groups_chirho, decode_group_chirho, load_metrics_chirho
from decode_greek_chirho import decode_greek_group_chirho
from font_tables_chirho import CODE_TABLES_CHIRHO, MAIN_SUBSET_CHIRHO, subset_metrics_chirho
from greek_tables_chirho import GREEK_MAIN_CHIRHO, GREEK_SUBSETS_CHIRHO, GREEK_TABLES_CHIRHO
from pdf_glyphs_chirho import form_xobjects_with_text_chirho, page_glyphs_chirho

PX_CHIRHO = 300 / 72


def raw_bag_chirho(text_chirho):
    return Counter(char_chirho for char_chirho in unicodedata.normalize("NFC", text_chirho)
                   if not char_chirho.isspace() and char_chirho not in "\u200e\u200f\u202a\u202b\u202c\u202d\u202e\u2066\u2067\u2068\u2069")


def raw_glyph_text_chirho(glyphs_chirho):
    # Hebrew's main range is ASCII identity. Greek's upper codes explicitly
    # map to MacRoman, NOT byte-identical Unicode. The driver verifies every
    # mapped code; the companions explicitly use MacRomanEncoding.
    return "".join(bytes([glyph_chirho.code_chirho]).decode("mac_roman") for glyph_chirho in glyphs_chirho)


def segment_proposals_chirho(page_chirho, source_chirho, metrics_chirho, bounds_chirho):
    if form_xobjects_with_text_chirho(page_chirho):
        return [], Counter({"form-text-chirho": 1})
    glyphs_chirho = page_glyphs_chirho(page_chirho)
    height_chirho = float(page_chirho.mediabox[3]) - float(page_chirho.mediabox[1])
    width_chirho = float(page_chirho.mediabox[2]) - float(page_chirho.mediabox[0])
    if page_chirho.get("/Rotate", 0) != 0 or abs(math.ceil(width_chirho * PX_CHIRHO) - source_chirho["image_width_chirho"]) > 1 or abs(math.ceil(height_chirho * PX_CHIRHO) - source_chirho["image_height_chirho"]) > 1:
        return [], Counter({"page-coordinate-space-chirho": 1})
    line_map_chirho = {line_chirho[0]: line_chirho for line_chirho in source_chirho["payload_chirho"]["lines_chirho"]}
    proposals_chirho, held_chirho = [], Counter()
    used_chirho = set()
    for segment_chirho in source_chirho["payload_chirho"]["segments_chirho"]:
        script_chirho = segment_chirho[7]
        if script_chirho not in ("hebrew-chirho", "greek-chirho"):
            continue
        line_chirho = line_map_chirho[segment_chirho[0]]
        left_chirho = line_chirho[1] + segment_chirho[4]
        right_chirho = left_chirho + segment_chirho[5]
        table_chirho = CODE_TABLES_CHIRHO if script_chirho == "hebrew-chirho" else GREEK_TABLES_CHIRHO
        selected_chirho, foreign_chirho, crossing_chirho = [], False, False
        for glyph_chirho in glyphs_chirho:
            y_chirho = (height_chirho - glyph_chirho.y_chirho) * PX_CHIRHO
            if not line_chirho[2] <= y_chirho < line_chirho[2] + line_chirho[4]:
                continue
            metric_chirho = metrics_chirho.get(glyph_chirho.font_chirho, {}).get(glyph_chirho.code_chirho)
            factor_chirho = glyph_chirho.size_chirho * PX_CHIRHO / 1000
            x_chirho = glyph_chirho.x_chirho * PX_CHIRHO
            ink0_chirho = x_chirho + (metric_chirho[0] if metric_chirho else 0) * factor_chirho
            ink1_chirho = x_chirho + metric_chirho[1] * factor_chirho if metric_chirho else x_chirho + glyph_chirho.advance_pt_chirho * PX_CHIRHO
            center_chirho = (ink0_chirho + ink1_chirho) / 2
            if not left_chirho <= center_chirho < right_chirho:
                continue
            if glyph_chirho.font_chirho not in table_chirho:
                # Even punctuation in a foreign font is not silently discarded.
                foreign_chirho |= glyph_chirho.code_chirho != 32
                continue
            text_chirho = table_chirho[glyph_chirho.font_chirho].get(glyph_chirho.code_chirho)
            if text_chirho in ("", " "):
                selected_chirho.append(glyph_chirho)
                continue
            selected_chirho.append(glyph_chirho)
            crossing_chirho |= metric_chirho is None or ink0_chirho < left_chirho - 1 or ink1_chirho > right_chirho + 1
            outline_chirho = bounds_chirho.get(glyph_chirho.font_chirho, {}).get(glyph_chirho.code_chirho)
            crossing_chirho |= outline_chirho is None or y_chirho - outline_chirho[4] * factor_chirho < line_chirho[2] - 1 or y_chirho - outline_chirho[3] * factor_chirho > line_chirho[2] + line_chirho[4] + 1
        reason_chirho = None
        semantic_chirho = [glyph_chirho for glyph_chirho in selected_chirho if table_chirho[glyph_chirho.font_chirho].get(glyph_chirho.code_chirho) not in ("", " ")]
        groups_chirho = baseline_groups_chirho(selected_chirho)
        if not semantic_chirho:
            reason_chirho = "no-font-glyphs-chirho"
        elif foreign_chirho or crossing_chirho or len(groups_chirho) != 1:
            reason_chirho = "mixed-or-clipped-chirho"
        elif raw_bag_chirho(raw_glyph_text_chirho(selected_chirho)) != raw_bag_chirho(segment_chirho[6]):
            reason_chirho = "raw-code-coverage-chirho"
        else:
            phrases_chirho = (decode_group_chirho if script_chirho == "hebrew-chirho" else decode_greek_group_chirho)(groups_chirho[0], metrics_chirho)
            coverage_chirho = [seq_chirho for phrase_chirho in phrases_chirho for seq_chirho in phrase_chirho.glyph_seqs_chirho]
            expected_chirho = [glyph_chirho.seq_chirho for glyph_chirho in semantic_chirho]
            if any(phrase_chirho.uncertain_codes_chirho for phrase_chirho in phrases_chirho):
                reason_chirho = "uncertain-glyph-chirho"
            elif sorted(coverage_chirho) != sorted(expected_chirho) or used_chirho.intersection(coverage_chirho):
                reason_chirho = "incomplete-coverage-chirho"
            else:
                phrases_chirho.sort(key=lambda phrase_chirho: phrase_chirho.x0_pt_chirho, reverse=script_chirho == "hebrew-chirho")
                text_chirho = " ".join(phrase_chirho.text_chirho for phrase_chirho in phrases_chirho).strip()
                if any(char_chirho.isalpha() and not ("\u0590" <= char_chirho <= "\u05ff" or "\u0370" <= char_chirho <= "\u03ff" or "\u1f00" <= char_chirho <= "\u1fff" or char_chirho in "𝔐𝔙𝔊𝔖𝔗") for char_chirho in text_chirho):
                    reason_chirho = "non-target-letter-chirho"
                elif not text_chirho or "�" in text_chirho or text_chirho == segment_chirho[6] or not re.search("[א-תα-ωΑ-Ω𝔐𝔙𝔊𝔖𝔗]", text_chirho):
                    reason_chirho = "empty-or-unchanged-chirho"
                else:
                    used_chirho.update(coverage_chirho)
                    proposals_chirho.append({"line_index_chirho": segment_chirho[0], "segment_index_chirho": segment_chirho[1],
                                            "text_chirho": text_chirho, "glyph_seqs_chirho": sorted(coverage_chirho), "script_chirho": script_chirho})
        if reason_chirho:
            held_chirho[reason_chirho] += 1
    return proposals_chirho, held_chirho


def main_chirho():
    parser_chirho = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser_chirho.add_argument("--source-chirho", required=True)
    parser_chirho.add_argument("--out-chirho", required=True)
    args_chirho = parser_chirho.parse_args()
    output_chirho = Path(args_chirho.out_chirho)
    if output_chirho.exists():
        raise ValueError("Frozen decode already exists")
    pdf_chirho = pikepdf.open(VOL5_PDF_CHIRHO)
    metrics_chirho = load_metrics_chirho(pdf_chirho)
    metrics_chirho.update({name_chirho: subset_metrics_chirho(pdf_chirho, name_chirho) for name_chirho in GREEK_SUBSETS_CHIRHO})
    bounds_chirho = {name_chirho: subset_metrics_chirho(pdf_chirho, name_chirho, include_vertical_chirho=True) for name_chirho in metrics_chirho}
    found_fonts_chirho = {}
    for page_chirho in pdf_chirho.pages:
        for font_chirho in page_chirho.Resources.get("/Font", {}).values():
            name_chirho = str(font_chirho.get("/BaseFont", "")).lstrip("/")
            if name_chirho in metrics_chirho:
                found_fonts_chirho[name_chirho] = font_chirho
    for name_chirho, font_chirho in found_fonts_chirho.items():
        if name_chirho in (MAIN_SUBSET_CHIRHO, GREEK_MAIN_CHIRHO):
            mapping_chirho = {}
            for start_chirho, end_chirho, destination_chirho in re.findall(rb"<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>", font_chirho.ToUnicode.read_bytes()):
                first_chirho, last_chirho, base_chirho = int(start_chirho, 16), int(end_chirho, 16), int(destination_chirho, 16)
                mapping_chirho.update({code_chirho: chr(base_chirho + code_chirho - first_chirho) for code_chirho in range(first_chirho, last_chirho + 1)})
            if any(mapping_chirho.get(code_chirho) != bytes([code_chirho]).decode("mac_roman") for code_chirho in metrics_chirho[name_chirho]):
                raise ValueError("Main source-code Unicode mapping changed")
        elif "/ToUnicode" in font_chirho or str(font_chirho.get("/Encoding", "")) != "/MacRomanEncoding":
            raise ValueError("Companion source-code encoding changed")
    pdf_hash_chirho = hashlib.sha256(VOL5_PDF_CHIRHO.read_bytes()).hexdigest()
    totals_chirho = Counter()
    seen_chirho = set()
    with open(args_chirho.source_chirho, encoding="utf-8") as input_chirho, output_chirho.open("x", encoding="utf-8") as target_chirho:
        for row_chirho in input_chirho:
            source_chirho = json.loads(row_chirho)
            number_chirho = source_chirho["payload_chirho"]["page_chirho"][1]
            if source_chirho["payload_chirho"]["page_chirho"][0] != 5 or not 1 <= number_chirho <= 1009 or 148 <= number_chirho <= 152 or number_chirho in seen_chirho:
                raise ValueError("Protected/duplicate/out-of-scope page")
            seen_chirho.add(number_chirho)
            proposals_chirho, held_chirho = segment_proposals_chirho(pdf_chirho.pages[number_chirho - 1], source_chirho, metrics_chirho, bounds_chirho)
            target_chirho.write(json.dumps({"page_chirho": number_chirho, "pdf_sha256_chirho": pdf_hash_chirho, "payload_sha256_chirho": source_chirho["payload_sha256_chirho"],
                                           "proposals_chirho": proposals_chirho, "held_chirho": held_chirho}, ensure_ascii=False) + "\n")
            totals_chirho.update(held_chirho)
            totals_chirho["proposals-chirho"] += len(proposals_chirho)
            if number_chirho % 100 == 0:
                print(f"Decoded through page {number_chirho}: {totals_chirho['proposals-chirho']} eligible proposals", file=sys.stderr)
    output_chirho.chmod(0o600)
    print(json.dumps({"pages_chirho": len(seen_chirho), "totals_chirho": totals_chirho}))


if __name__ == "__main__":
    main_chirho()
