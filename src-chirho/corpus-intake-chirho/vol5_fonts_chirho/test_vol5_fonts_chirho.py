# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Tests for the vol 5 Hebrew font decoder.

Run: workspace-chirho/pdf-fonts-venv-chirho/bin/python -m pytest src-chirho/corpus-intake-chirho/vol5_fonts_chirho/ -q

Synthetic cases pin the decoding rules; the page cases need vol 5's PDF and
pin readings checked against the page images.
"""
import sys
import unicodedata
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from decode_hebrew_chirho import VOL5_PDF_CHIRHO, decode_group_chirho  # noqa: E402
from font_tables_chirho import MAIN_SUBSET_CHIRHO, SECOND_SUBSET_CHIRHO  # noqa: E402
from pdf_glyphs_chirho import GlyphChirho  # noqa: E402

LETTER_CHIRHO = (30.0, 440.0, 470.0)  # ink x-min, ink x-max, advance in font units
MARK_CHIRHO = (-40.0, 40.0, 7.0)
SPACE_CHIRHO = (0.0, 0.0, 250.0)
STEP_PT_CHIRHO = 7.52  # one letter at 16 pt


def nfc_chirho(text_chirho: str) -> str:
    return unicodedata.normalize("NFC", text_chirho)


def metrics_chirho():
    main_chirho = {code_chirho: LETTER_CHIRHO for code_chirho in range(0x21, 0x68)}
    for char_chirho in "\"$+,-03<?AOSXZ":  # vowels, dagesh and dots: drawn with no advance
        main_chirho[ord(char_chirho)] = MARK_CHIRHO
    second_chirho = {0x20: SPACE_CHIRHO, 0x28: LETTER_CHIRHO, 0x29: LETTER_CHIRHO, 0x80: LETTER_CHIRHO, 0xE0: LETTER_CHIRHO}
    return {MAIN_SUBSET_CHIRHO: main_chirho, SECOND_SUBSET_CHIRHO: second_chirho}


def glyphs_chirho(spec_chirho, op_size_chirho=4):
    """spec: (font, char or code, x) in drawing order; ops of op_size glyphs each."""
    out_chirho = []
    for i_chirho, (font_chirho, code_chirho, x_chirho) in enumerate(spec_chirho):
        code_value_chirho = code_chirho if isinstance(code_chirho, int) else ord(code_chirho)
        out_chirho.append(GlyphChirho(i_chirho, i_chirho // op_size_chirho, font_chirho, code_value_chirho, x_chirho, 500.0, 16.0))
    return out_chirho


M, S = MAIN_SUBSET_CHIRHO, SECOND_SUBSET_CHIRHO


def test_marks_attach_to_the_next_letter_and_runs_reverse_into_reading_order():
    # Drawn left to right as on vol 5 p149: yod, qamats+ayin, tsere+resh | yod, patah+tsadi, yod, hiriq+lamed, shewa+mem.
    x_chirho = [100.0, 100.0 + STEP_PT_CHIRHO, 100.0 + 2 * STEP_PT_CHIRHO]
    word2_chirho = [130.0 + k_chirho * STEP_PT_CHIRHO for k_chirho in range(5)]
    spec_chirho = [(M, ".", x_chirho[0]), (M, "+", x_chirho[1]), (M, "@", x_chirho[1]), (M, "$", x_chirho[2]), (M, "#", x_chirho[2]),
                   (M, ".", word2_chirho[0]), (M, "3", word2_chirho[1]), (M, "I", word2_chirho[1]), (M, ".", word2_chirho[2]),
                   (M, "0", word2_chirho[3]), (M, "4", word2_chirho[3]), (M, "-", word2_chirho[4]), (M, "8", word2_chirho[4])]
    phrases_chirho = decode_group_chirho(glyphs_chirho(spec_chirho), metrics_chirho())
    assert [p_chirho.text_chirho for p_chirho in phrases_chirho] == [nfc_chirho("מְלִיצַי רֵעָי")]


def test_a_mark_ending_one_run_belongs_to_the_letter_opening_the_next():
    # Vol 5 p65: the holam closes one operator and its sin opens the next, in the other subset.
    spec_chirho = [(M, ".", 100.0), (M, "3", 107.5), (M, "1", 107.5), (M, "-", 115.0), (M, "C", 115.0), (M, "?", 122.5), (S, 0xE0, 122.5)]
    phrases_chirho = decode_group_chirho(glyphs_chirho(spec_chirho, op_size_chirho=6), metrics_chirho())
    assert [p_chirho.text_chirho for p_chirho in phrases_chirho] == [nfc_chirho("שֹׂנְאַי")]


def test_holam_over_a_quiescent_aleph_moves_to_the_letter_before():
    phrases_chirho = decode_group_chirho(glyphs_chirho([(S, 0x80, 100.0), (M, "4", 100.0 + STEP_PT_CHIRHO)]), metrics_chirho())
    assert [p_chirho.text_chirho for p_chirho in phrases_chirho] == [nfc_chirho("לֹא")]


def test_space_glyphs_split_words_and_other_fonts_split_phrases():
    spec_chirho = [(M, "4", 100.0), (S, 0x20, 107.5), (M, "4", 111.5),
                   ("ABCDEF+Junicode-Regular", "/", 122.0), (M, "8", 130.0)]
    phrases_chirho = decode_group_chirho(glyphs_chirho(spec_chirho), metrics_chirho())
    assert [p_chirho.text_chirho for p_chirho in phrases_chirho] == ["ל ל", "מ"]


def test_brackets_drawn_around_a_word_keep_their_reading_direction():
    spec_chirho = [(S, 0x28, 100.0), (M, "1", 100.0 + STEP_PT_CHIRHO), (S, 0x29, 100.0 + 2 * STEP_PT_CHIRHO)]
    phrases_chirho = decode_group_chirho(glyphs_chirho(spec_chirho), metrics_chirho())
    assert [p_chirho.text_chirho for p_chirho in phrases_chirho] == ["(א)"]


def test_unknown_codes_are_flagged_not_guessed():
    phrases_chirho = decode_group_chirho(glyphs_chirho([(M, "1", 100.0), (M, 0x70, 100.0 + STEP_PT_CHIRHO)]), metrics_chirho())
    assert "�" in phrases_chirho[0].text_chirho
    assert 0x70 in phrases_chirho[0].uncertain_codes_chirho


needs_pdf_chirho = pytest.mark.skipif(not VOL5_PDF_CHIRHO.exists(), reason="vol 5 PDF not present")


@pytest.fixture(scope="module")
def vol5_chirho():
    import pikepdf

    from decode_hebrew_chirho import load_metrics_chirho, page_report_chirho
    pdf_chirho = pikepdf.open(VOL5_PDF_CHIRHO)
    metrics_value_chirho = load_metrics_chirho(pdf_chirho)
    return lambda page_chirho: [p_chirho["text_chirho"] for line_chirho in page_report_chirho(pdf_chirho, page_chirho, metrics_value_chirho)["lines_chirho"]
                                for p_chirho in line_chirho["phrases_chirho"]]


@needs_pdf_chirho
@pytest.mark.parametrize("page_chirho, expected_chirho", [
    (51, "וְשָׁאַף צַמִּים חֵילָם"),  # the reviewed span had a qamats and no dagesh
    (54, "אלא במאמר"),  # unpointed in print; the reviewed span added pointing
    (56, "כִּי־אָדָם לְעָמָל יוּלָּד"),
    (56, "וּבְנֵי־רֶשֶׁף יַגְבִּיהוּ עוּף"),  # verse halves stay separate phrases across the '/'
    (65, "שֹׂנְאַי חִנָּם"),
    (148, "מְלִיצִי רֵעִי"),  # J12's conjectured vocalisation, which the reviewed span normalised away
    (149, "מְלִיצַי רֵעָי"),
])
def test_page_readings_checked_against_the_print(vol5_chirho, page_chirho, expected_chirho):
    assert nfc_chirho(expected_chirho) in vol5_chirho(page_chirho)
