# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Decode vol 5's Hebrew text layer into Unicode phrases with positions.

Rules, each measured on vol 5's reviewed spans and the WLC:
- Glyphs are grouped by baseline. Within a phrase the page draws glyphs left
  to right, and every mark (a glyph with no advance) is drawn just before
  the letter it belongs to, so a mark attaches to the next Hebrew letter in
  drawing order, across operator boundaries. A mark that meets a space or
  text in another font first attaches to the letter under its ink.
- Precomposed glyphs split into letter plus marks.
- Letters are laid out by x: a space glyph or a gap over WORD_GAP_PT_CHIRHO
  starts a word; text in another font between two Hebrew letters, or a gap
  over PHRASE_GAP_PT_CHIRHO, starts a phrase.
- Each phrase is reversed into reading order, brackets mirror, a holam drawn
  over a quiescent aleph moves to the letter before it, and the text is NFC.

CLI: workspace-chirho/pdf-fonts-venv-chirho/bin/python \\
       src-chirho/corpus-intake-chirho/vol5_fonts_chirho/decode_hebrew_chirho.py --page=149 [--page=150 ...]

Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
"""
import argparse
import json
import sys
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

import pikepdf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from font_tables_chirho import (  # noqa: E402
    CODE_TABLES_CHIRHO, HEBREW_SUBSETS_CHIRHO, HOLAM_CHIRHO, SPACE_CODES_CHIRHO, UNCERTAIN_CODES_CHIRHO, subset_metrics_chirho,
)
from pdf_glyphs_chirho import GlyphChirho, form_xobjects_with_text_chirho, page_glyphs_chirho  # noqa: E402

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parents[3]
VOL5_PDF_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "barthelemy-chirho" / "Barthelemy_2015_Critique_Textuelle_Ancien_Testament.pdf"
RENDER_DPI_CHIRHO = 300
BASELINE_TOLERANCE_PT_CHIRHO = 2.0
WORD_GAP_PT_CHIRHO = 1.5
PHRASE_GAP_PT_CHIRHO = 9.0
MARK_MAX_ADVANCE_UNITS_CHIRHO = 50.0
VOWELS_CHIRHO = frozenset(chr(c_chirho) for c_chirho in range(0x05B0, 0x05BC)) | {"\u05C7"}
MIRROR_CHIRHO = {"(": ")", ")": "(", "[": "]", "]": "["}


@dataclass
class PhraseChirho:
    text_chirho: str
    x0_pt_chirho: float
    x1_pt_chirho: float
    uncertain_codes_chirho: list[int] = field(default_factory=list)


@dataclass
class HebrewLineChirho:
    baseline_pt_chirho: float
    phrases_chirho: list[PhraseChirho]


@dataclass
class _LetterChirho:
    base_chirho: str
    marks_chirho: list[str]
    x_chirho: float
    end_chirho: float
    ink0_chirho: float
    ink1_chirho: float
    uncertain_chirho: list[int]
    space_chirho: bool = False


Metrics = dict[str, dict[int, tuple[float, float, float]]]


def load_metrics_chirho(pdf_chirho: pikepdf.Pdf) -> Metrics:
    return {name_chirho: subset_metrics_chirho(pdf_chirho, name_chirho) for name_chirho in HEBREW_SUBSETS_CHIRHO}


def baseline_groups_chirho(glyphs_chirho: list[GlyphChirho]) -> list[list[GlyphChirho]]:
    """Glyphs grouped by baseline, top of the page first."""
    groups_chirho: list[list[GlyphChirho]] = []
    for glyph_chirho in sorted(glyphs_chirho, key=lambda g_chirho: -g_chirho.y_chirho):
        if groups_chirho and abs(groups_chirho[-1][0].y_chirho - glyph_chirho.y_chirho) <= BASELINE_TOLERANCE_PT_CHIRHO:
            groups_chirho[-1].append(glyph_chirho)
        else:
            groups_chirho.append([glyph_chirho])
    return groups_chirho


def _letters_chirho(group_chirho: list[GlyphChirho], metrics_chirho: Metrics):
    """Letters with their marks, plus x positions of glyphs in other fonts."""
    letters_chirho: list[_LetterChirho] = []
    foreign_chirho: list[float] = []
    orphans_chirho: list[tuple[str, float, int | None]] = []
    pending_chirho: list[tuple[str, float, int | None]] = []
    for glyph_chirho in sorted(group_chirho, key=lambda g_chirho: g_chirho.seq_chirho):
        font_chirho = glyph_chirho.font_chirho
        if font_chirho not in CODE_TABLES_CHIRHO:
            if glyph_chirho.code_chirho != 32:
                foreign_chirho.append(glyph_chirho.x_chirho)
                orphans_chirho.extend(pending_chirho)
                pending_chirho = []
            continue
        scale_chirho = glyph_chirho.size_chirho / 1000.0
        ink0_chirho, ink1_chirho, advance_chirho = metrics_chirho[font_chirho].get(glyph_chirho.code_chirho, (0.0, 0.0, 0.0))
        uncertain_chirho = glyph_chirho.code_chirho if glyph_chirho.code_chirho in UNCERTAIN_CODES_CHIRHO[font_chirho] else None
        text_chirho = CODE_TABLES_CHIRHO[font_chirho].get(glyph_chirho.code_chirho)
        if text_chirho is None:
            text_chirho, uncertain_chirho = "\uFFFD", glyph_chirho.code_chirho
        if glyph_chirho.code_chirho in SPACE_CODES_CHIRHO[font_chirho]:
            letters_chirho.append(_LetterChirho(" ", [], glyph_chirho.x_chirho, glyph_chirho.x_chirho + advance_chirho * scale_chirho,
                                                glyph_chirho.x_chirho, glyph_chirho.x_chirho, [], space_chirho=True))
            orphans_chirho.extend(pending_chirho)
            pending_chirho = []
            continue
        if text_chirho == "":
            continue
        if advance_chirho <= MARK_MAX_ADVANCE_UNITS_CHIRHO:
            center_chirho = glyph_chirho.x_chirho + (ink0_chirho + ink1_chirho) / 2 * scale_chirho
            pending_chirho.append((text_chirho, center_chirho, uncertain_chirho))
            continue
        letters_chirho.append(_LetterChirho(
            text_chirho[0], list(text_chirho[1:]) + [t_chirho for t_chirho, _, _ in pending_chirho],
            glyph_chirho.x_chirho, glyph_chirho.x_chirho + advance_chirho * scale_chirho,
            glyph_chirho.x_chirho + ink0_chirho * scale_chirho, glyph_chirho.x_chirho + ink1_chirho * scale_chirho,
            [u_chirho for _, _, u_chirho in pending_chirho if u_chirho is not None] + ([uncertain_chirho] if uncertain_chirho is not None else [])))
        pending_chirho = []
    orphans_chirho.extend(pending_chirho)
    real_chirho = [l_chirho for l_chirho in letters_chirho if not l_chirho.space_chirho]
    for text_chirho, center_chirho, uncertain_chirho in orphans_chirho:
        if not real_chirho:
            continue
        host_chirho = min(real_chirho, key=lambda l_chirho: 0.0 if l_chirho.ink0_chirho <= center_chirho <= l_chirho.ink1_chirho
                          else min(abs(center_chirho - l_chirho.ink0_chirho), abs(center_chirho - l_chirho.ink1_chirho)))
        host_chirho.marks_chirho.append(text_chirho)
        if uncertain_chirho is not None:
            host_chirho.uncertain_chirho.append(uncertain_chirho)
    letters_chirho.sort(key=lambda l_chirho: l_chirho.x_chirho)
    return letters_chirho, sorted(foreign_chirho)


def _reading_text_chirho(words_chirho: list[list[_LetterChirho]]) -> str:
    logical_words_chirho = []
    for word_chirho in reversed(words_chirho):
        sequence_chirho = list(reversed(word_chirho))
        # A holam drawn over a quiescent aleph belongs to the letter before it.
        for i_chirho in range(1, len(sequence_chirho)):
            letter_chirho, before_chirho = sequence_chirho[i_chirho], sequence_chirho[i_chirho - 1]
            if letter_chirho.base_chirho == "א" and HOLAM_CHIRHO in letter_chirho.marks_chirho and not (VOWELS_CHIRHO & set(before_chirho.marks_chirho)):
                letter_chirho.marks_chirho.remove(HOLAM_CHIRHO)
                before_chirho.marks_chirho.append(HOLAM_CHIRHO)
        logical_words_chirho.append("".join(MIRROR_CHIRHO.get(l_chirho.base_chirho, l_chirho.base_chirho) + "".join(l_chirho.marks_chirho)
                                            for l_chirho in sequence_chirho))
    return unicodedata.normalize("NFC", " ".join(logical_words_chirho))


def decode_group_chirho(group_chirho: list[GlyphChirho], metrics_chirho: Metrics) -> list[PhraseChirho]:
    letters_chirho, foreign_chirho = _letters_chirho(group_chirho, metrics_chirho)
    phrases_chirho: list[list[list[_LetterChirho]]] = []
    words_chirho: list[list[_LetterChirho]] = []
    current_chirho: list[_LetterChirho] = []
    previous_chirho = last_letter_chirho = None
    for item_chirho in letters_chirho:
        if item_chirho.space_chirho:
            if current_chirho:
                words_chirho.append(current_chirho)
                current_chirho = []
            previous_chirho = item_chirho
            continue
        if previous_chirho is not None:
            gap_chirho = item_chirho.x_chirho - previous_chirho.end_chirho
            foreign_between_chirho = last_letter_chirho is not None and any(
                last_letter_chirho.x_chirho < x_chirho < item_chirho.x_chirho for x_chirho in foreign_chirho)
            if gap_chirho > PHRASE_GAP_PT_CHIRHO or foreign_between_chirho:
                if current_chirho:
                    words_chirho.append(current_chirho)
                if words_chirho:
                    phrases_chirho.append(words_chirho)
                words_chirho, current_chirho = [], []
            elif gap_chirho > WORD_GAP_PT_CHIRHO and current_chirho:
                words_chirho.append(current_chirho)
                current_chirho = []
        current_chirho.append(item_chirho)
        previous_chirho = last_letter_chirho = item_chirho
    if current_chirho:
        words_chirho.append(current_chirho)
    if words_chirho:
        phrases_chirho.append(words_chirho)
    out_chirho = []
    for phrase_words_chirho in phrases_chirho:
        flat_chirho = [l_chirho for w_chirho in phrase_words_chirho for l_chirho in w_chirho]
        out_chirho.append(PhraseChirho(
            _reading_text_chirho(phrase_words_chirho),
            min(l_chirho.x_chirho for l_chirho in flat_chirho), max(l_chirho.end_chirho for l_chirho in flat_chirho),
            sorted({u_chirho for l_chirho in flat_chirho for u_chirho in l_chirho.uncertain_chirho})))
    return out_chirho


def decode_page_hebrew_chirho(page_chirho: pikepdf.Page, metrics_chirho: Metrics) -> list[HebrewLineChirho]:
    lines_chirho = []
    for group_chirho in baseline_groups_chirho(page_glyphs_chirho(page_chirho)):
        if not any(g_chirho.font_chirho in CODE_TABLES_CHIRHO for g_chirho in group_chirho):
            continue
        phrases_chirho = decode_group_chirho(group_chirho, metrics_chirho)
        if phrases_chirho:
            lines_chirho.append(HebrewLineChirho(group_chirho[0].y_chirho, phrases_chirho))
    return lines_chirho


def page_report_chirho(pdf_chirho: pikepdf.Pdf, page_number_chirho: int, metrics_chirho: Metrics) -> dict:
    """One page in render pixels (300 dpi, origin top left), ready for the intake."""
    page_chirho = pdf_chirho.pages[page_number_chirho - 1]
    height_pt_chirho = float(page_chirho.mediabox[3]) - float(page_chirho.mediabox[1])
    px_chirho = RENDER_DPI_CHIRHO / 72.0
    lines_chirho = []
    for line_chirho in decode_page_hebrew_chirho(page_chirho, metrics_chirho):
        lines_chirho.append({
            "baseline_y_px_chirho": round((height_pt_chirho - line_chirho.baseline_pt_chirho) * px_chirho, 1),
            "phrases_chirho": [{"text_chirho": p_chirho.text_chirho, "x0_px_chirho": round(p_chirho.x0_pt_chirho * px_chirho, 1),
                                "x1_px_chirho": round(p_chirho.x1_pt_chirho * px_chirho, 1),
                                "uncertain_codes_chirho": p_chirho.uncertain_codes_chirho} for p_chirho in line_chirho.phrases_chirho],
        })
    return {"page_chirho": page_number_chirho, "lines_chirho": lines_chirho,
            "form_xobjects_with_text_chirho": form_xobjects_with_text_chirho(page_chirho)}


def main_chirho() -> None:
    parser_chirho = argparse.ArgumentParser(description="Decode vol 5 Hebrew from the PDF's font codes.")
    parser_chirho.add_argument("--pdf", default=str(VOL5_PDF_CHIRHO))
    parser_chirho.add_argument("--page", type=int, action="append", required=True)
    args_chirho = parser_chirho.parse_args()
    pdf_chirho = pikepdf.open(args_chirho.pdf)
    metrics_chirho = load_metrics_chirho(pdf_chirho)
    for page_number_chirho in args_chirho.page:
        print(json.dumps(page_report_chirho(pdf_chirho, page_number_chirho, metrics_chirho), ensure_ascii=False))


if __name__ == "__main__":
    main_chirho()
