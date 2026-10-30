# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Coverage, Greek direction/spacing and conservative source-font selection."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from decode_greek_chirho import decode_greek_group_chirho
from decode_hebrew_chirho import VOL5_PDF_CHIRHO, decode_group_chirho, load_metrics_chirho
from font_tables_chirho import MAIN_SUBSET_CHIRHO, SECOND_SUBSET_CHIRHO, subset_metrics_chirho
from greek_tables_chirho import GREEK_MAIN_CHIRHO, GREEK_SECOND_CHIRHO, GREEK_SUBSETS_CHIRHO
from pdf_glyphs_chirho import GlyphChirho
from test_vol5_fonts_chirho import glyphs_chirho, metrics_chirho


def greek_metrics_chirho():
    return {GREEK_MAIN_CHIRHO: {code_chirho: (0, 400, 500) for code_chirho in range(0x21, 0xAE)},
            GREEK_SECOND_CHIRHO: {32: (0, 0, 250)}}


def test_hebrew_coverage_includes_marks_across_operator_boundaries():
    value_chirho = glyphs_chirho([(MAIN_SUBSET_CHIRHO, ".", 100), (MAIN_SUBSET_CHIRHO, "+", 107.5), (MAIN_SUBSET_CHIRHO, "@", 107.5)], op_size_chirho=2)
    phrases_chirho = decode_group_chirho(value_chirho, metrics_chirho())
    assert phrases_chirho[0].text_chirho == "עָי"
    assert phrases_chirho[0].glyph_seqs_chirho == [0, 1, 2]


def test_orphan_mark_keeps_coverage_but_unattached_mark_does_not_fake_a_letter():
    value_chirho = glyphs_chirho([(MAIN_SUBSET_CHIRHO, "1", 100), (MAIN_SUBSET_CHIRHO, "+", 101), (SECOND_SUBSET_CHIRHO, 32, 108)])
    assert decode_group_chirho(value_chirho, metrics_chirho())[0].glyph_seqs_chirho == [0, 1]
    assert decode_group_chirho(glyphs_chirho([(MAIN_SUBSET_CHIRHO, "+", 100)]), metrics_chirho()) == []


def test_greek_reads_left_to_right_with_spaces_and_every_semantic_glyph_once():
    value_chirho = glyphs_chirho([(GREEK_MAIN_CHIRHO, 0x32, 100), (GREEK_MAIN_CHIRHO, 0x2A, 108), (GREEK_MAIN_CHIRHO, 0x34, 116),
                                (GREEK_MAIN_CHIRHO, 0x35, 124), (GREEK_MAIN_CHIRHO, 0x2F, 132), (GREEK_SECOND_CHIRHO, 32, 140), (GREEK_MAIN_CHIRHO, 0x30, 144)])
    result_chirho = decode_greek_group_chirho(value_chirho, greek_metrics_chirho())
    assert result_chirho[0].text_chirho == "λόγος θ"
    assert result_chirho[0].uncertain_codes_chirho == []
    assert result_chirho[0].glyph_seqs_chirho == [0, 1, 2, 3, 4, 6]


@pytest.mark.parametrize("code_chirho", [0x21, 0x27, 0x66, 0x7F, 0xFE])
def test_greek_unknown_or_unresolved_breathings_are_never_publishable(code_chirho):
    result_chirho = decode_greek_group_chirho(glyphs_chirho([(GREEK_MAIN_CHIRHO, code_chirho, 100)]), greek_metrics_chirho())
    assert result_chirho[0].uncertain_codes_chirho == [code_chirho]


def test_foreign_font_splits_greek_instead_of_disappearing_between_letters():
    result_chirho = decode_greek_group_chirho(glyphs_chirho([(GREEK_MAIN_CHIRHO, 0x25, 100), ("Latin", 65, 110), (GREEK_MAIN_CHIRHO, 0x22, 120)]), greek_metrics_chirho())
    assert [phrase_chirho.text_chirho for phrase_chirho in result_chirho] == ["α", "β"]


@pytest.mark.parametrize("case_chirho,expected_chirho", [("resolved", None), ("unknown", "uncertain-glyph-chirho"), ("foreign", "mixed-or-clipped-chirho"), ("clipped", "mixed-or-clipped-chirho"), ("duplicate", "incomplete-coverage-chirho"), ("latin", "non-target-letter-chirho")])
def test_segment_boundary_holds_unsafe_font_proposals(monkeypatch, case_chirho, expected_chirho):
    import segment_drafts_chirho as drafts_chirho
    class PageChirho:
        mediabox = [0, 0, 100, 100]
        def get(self, key_chirho, default_chirho=None):
            return default_chirho
    value_chirho = GlyphChirho(1, 0, GREEK_MAIN_CHIRHO, 0x25, 2, 80, 10)
    glyph_values_chirho = [value_chirho]
    if case_chirho == "unknown":
        glyph_values_chirho = [GlyphChirho(1, 0, GREEK_MAIN_CHIRHO, 0x21, 2, 80, 10)]
    if case_chirho == "foreign":
        glyph_values_chirho.append(GlyphChirho(2, 0, "Latin", 65, 7, 80, 10))
    if case_chirho == "latin":
        glyph_values_chirho.append(GlyphChirho(2, 0, GREEK_SECOND_CHIRHO, 0x61, 7, 80, 10))
    metrics_value_chirho = greek_metrics_chirho()
    metrics_value_chirho[GREEK_SECOND_CHIRHO][0x61] = (0, 400, 500)
    bounds_chirho = {name_chirho: {code_chirho: (*metric_chirho, -200, 700) for code_chirho, metric_chirho in table_chirho.items()} for name_chirho, table_chirho in metrics_value_chirho.items()}
    raw_chirho = drafts_chirho.raw_glyph_text_chirho(glyph_values_chirho)
    segment_chirho = [0, 0, 0, 0, 0, 20 if case_chirho == "clipped" else 417, raw_chirho, "greek-chirho"]
    source_value_chirho = {"image_width_chirho": 417, "image_height_chirho": 417, "payload_chirho": {"lines_chirho": [[0, 0, 0, 417, 417, "raw", 1]], "segments_chirho": [segment_chirho]}}
    if case_chirho == "duplicate":
        source_value_chirho["payload_chirho"]["segments_chirho"].append([0, 1, *segment_chirho[2:]])
    monkeypatch.setattr(drafts_chirho, "page_glyphs_chirho", lambda page_chirho: glyph_values_chirho)
    monkeypatch.setattr(drafts_chirho, "form_xobjects_with_text_chirho", lambda page_chirho: [])
    proposals_chirho, held_chirho = drafts_chirho.segment_proposals_chirho(PageChirho(), source_value_chirho, metrics_value_chirho, bounds_chirho)
    if expected_chirho:
        assert held_chirho[expected_chirho] == 1
        assert len(proposals_chirho) == (1 if case_chirho == "duplicate" else 0)
    else:
        assert len(proposals_chirho) == 1
        assert proposals_chirho[0]["text_chirho"] == "α"


def test_raw_code_coverage_counts_every_character_but_not_spacing_or_bidi():
    from segment_drafts_chirho import raw_bag_chirho
    assert raw_bag_chirho("a .\u200fÊ") == raw_bag_chirho("Ê.a")
    assert raw_bag_chirho("a .Ê") != raw_bag_chirho("Ê.a.")


@pytest.mark.skipif(not VOL5_PDF_CHIRHO.exists(), reason="source PDF not present")
def test_source_greek_phrases_and_resolved_accents_match_the_print():
    import json
    import pikepdf
    from segment_drafts_chirho import segment_proposals_chirho
    source_chirho = VOL5_PDF_CHIRHO.parents[1] / "corpus-intake-chirho/font-decode-chirho/source-pages-chirho.jsonl"
    if not source_chirho.exists():
        pytest.skip("frozen source projection not present")
    pdf_chirho = pikepdf.open(VOL5_PDF_CHIRHO)
    metrics_value_chirho = load_metrics_chirho(pdf_chirho)
    metrics_value_chirho.update({name_chirho: subset_metrics_chirho(pdf_chirho, name_chirho) for name_chirho in GREEK_SUBSETS_CHIRHO})
    bounds_chirho = {name_chirho: subset_metrics_chirho(pdf_chirho, name_chirho, True) for name_chirho in metrics_value_chirho}
    expected_chirho = {56: "γεννᾶται", 500: "περινοῆσαι"}
    with source_chirho.open(encoding="utf-8") as stream_chirho:
        for row_chirho in stream_chirho:
            page_chirho = json.loads(row_chirho)
            number_chirho = page_chirho["payload_chirho"]["page_chirho"][1]
            if number_chirho not in expected_chirho:
                continue
            proposals_chirho, _ = segment_proposals_chirho(pdf_chirho.pages[number_chirho - 1], page_chirho, metrics_value_chirho, bounds_chirho)
            assert expected_chirho.pop(number_chirho) in [proposal_chirho["text_chirho"] for proposal_chirho in proposals_chirho]
    assert expected_chirho == {}
