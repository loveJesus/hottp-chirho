# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Decode a Greek baseline left-to-right, retaining source glyph coverage.

Unresolved source shapes are reported, never made publishable by context.
Workflow: spec-chirho/workflows-chirho/corpus-chirho/font-drafts-workflow-chirho.md
"""
import unicodedata

from decode_hebrew_chirho import PhraseChirho, PHRASE_GAP_PT_CHIRHO, WORD_GAP_PT_CHIRHO
from greek_tables_chirho import GREEK_MAIN_CHIRHO, GREEK_SECOND_CHIRHO, GREEK_TABLES_CHIRHO, GREEK_UNCERTAIN_MAIN_CHIRHO


def decode_greek_group_chirho(group_chirho, metrics_chirho):
    phrases_chirho = []
    current_chirho = []
    foreign_chirho = [glyph_chirho.x_chirho for glyph_chirho in group_chirho
                      if glyph_chirho.font_chirho not in GREEK_TABLES_CHIRHO and glyph_chirho.code_chirho != 32]

    def flush_chirho():
        if not current_chirho or not any(item_chirho[1].strip() for item_chirho in current_chirho):
            current_chirho.clear()
            return
        real_chirho = [item_chirho for item_chirho in current_chirho if item_chirho[1].strip()]
        text_chirho = "".join(item_chirho[1] for item_chirho in current_chirho).strip()
        phrases_chirho.append(PhraseChirho(unicodedata.normalize("NFC", text_chirho), real_chirho[0][0].x_chirho,
                                          max(item_chirho[2] for item_chirho in real_chirho),
                                          sorted({item_chirho[0].code_chirho for item_chirho in real_chirho if item_chirho[3]}),
                                          [item_chirho[0].seq_chirho for item_chirho in real_chirho]))
        current_chirho.clear()

    previous_chirho = None
    for glyph_chirho in sorted(group_chirho, key=lambda item_chirho: (item_chirho.x_chirho, item_chirho.seq_chirho)):
        if glyph_chirho.font_chirho not in GREEK_TABLES_CHIRHO:
            continue
        text_chirho = GREEK_TABLES_CHIRHO[glyph_chirho.font_chirho].get(glyph_chirho.code_chirho, "�")
        advance_chirho = metrics_chirho[glyph_chirho.font_chirho].get(glyph_chirho.code_chirho, (0, 0, 0))[2] * glyph_chirho.size_chirho / 1000
        uncertain_chirho = text_chirho == "�" or (glyph_chirho.font_chirho == GREEK_MAIN_CHIRHO and glyph_chirho.code_chirho in GREEK_UNCERTAIN_MAIN_CHIRHO)
        # A standalone accent has no securely established host; hold its phrase.
        uncertain_chirho |= glyph_chirho.font_chirho == GREEK_SECOND_CHIRHO and text_chirho == "´"
        if previous_chirho is not None:
            gap_chirho = glyph_chirho.x_chirho - previous_chirho[2]
            between_chirho = any(previous_chirho[0].x_chirho < x_chirho < glyph_chirho.x_chirho for x_chirho in foreign_chirho)
            if gap_chirho > PHRASE_GAP_PT_CHIRHO or between_chirho:
                flush_chirho()
            elif gap_chirho > WORD_GAP_PT_CHIRHO and current_chirho and not current_chirho[-1][1].endswith(" ") and text_chirho != " ":
                current_chirho.append((glyph_chirho, " ", glyph_chirho.x_chirho, False))
        current_chirho.append((glyph_chirho, text_chirho, glyph_chirho.x_chirho + advance_chirho, uncertain_chirho))
        previous_chirho = current_chirho[-1]
    flush_chirho()
    return phrases_chirho
