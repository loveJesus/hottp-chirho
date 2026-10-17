# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Measure the vol 5 Hebrew decoder against the reviewed spans and the WLC.

Reviewed spans bind phrase texts in reading order rather than to their own
boxes, so the comparison is per line: spans as a multiset, then every
reviewed Hebrew word against the line's decoded words. Where the pointing
differs on pointed print, the WLC arbitrates: is either reading attested
with those consonants? Unpointed print that the reviewed text points is
counted apart, since the WLC would always favour the pointed form. The
reviewed spans are unconfirmed vision text, not ground truth. Read only.

CLI: workspace-chirho/pdf-fonts-venv-chirho/bin/python \\
       src-chirho/corpus-intake-chirho/vol5_fonts_chirho/measure_vol5_hebrew_chirho.py [--examples=12]

Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
"""
import argparse
import json
import re
import sqlite3
import sys
import unicodedata
from functools import lru_cache
from pathlib import Path

import pikepdf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from decode_hebrew_chirho import PROJECT_ROOT_CHIRHO, VOL5_PDF_CHIRHO, decode_page_hebrew_chirho, load_metrics_chirho  # noqa: E402

SPANS_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "spans-chirho" / "vol-5-chirho"
PROGRESS_DB_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
WLC_DB_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "wlc-chirho.sqlite"
# The working set's vol 5 rows are 1.5 times too large (the legacy pdftohtml scale).
LEGACY_TO_PT_CHIRHO = (2.0 / 3.0) * 72.0 / 300.0
POINT_CHARS_CHIRHO = frozenset(chr(c_chirho) for c_chirho in range(0x05B0, 0x05BD)) | {"\u05C1", "\u05C2", "\u05C7"}


def consonants_chirho(text_chirho: str) -> str:
    return "".join(c_chirho for c_chirho in text_chirho if "א" <= c_chirho <= "ת")


def comparable_chirho(text_chirho: str) -> str:
    """Hebrew letters and points only: accents, meteg, maqaf and punctuation dropped,
    since the WLC copy here stores maqaf compounds glued without the maqaf."""
    text_chirho = re.sub(r"[^\u0590-\u05FF\uFB1D-\uFB4F]", "", text_chirho)
    return unicodedata.normalize("NFC", re.sub(r"[\u0591-\u05AF\u05BD\u05BE\u05C0\u05C3]", "", text_chirho))


def main_chirho() -> None:
    parser_chirho = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser_chirho.add_argument("--examples", type=int, default=12)
    args_chirho = parser_chirho.parse_args()
    pdf_chirho = pikepdf.open(VOL5_PDF_CHIRHO)
    metrics_chirho = load_metrics_chirho(pdf_chirho)
    progress_chirho = sqlite3.connect(f"file:{PROGRESS_DB_CHIRHO}?mode=ro", uri=True)
    wlc_chirho = sqlite3.connect(f"file:{WLC_DB_CHIRHO}?mode=ro", uri=True)

    @lru_cache(maxsize=None)
    def wlc_tokens_chirho(consonants_text_chirho: str) -> tuple[str, ...]:
        rows_chirho = wlc_chirho.execute(
            "SELECT DISTINCT normalized_word_chirho FROM words_chirho WHERE consonants_only_chirho LIKE ?",
            (f"%{consonants_text_chirho}%",)).fetchall()
        return tuple(comparable_chirho(word_chirho) for (word_chirho,) in rows_chirho)

    def attested_chirho(word_chirho: str) -> bool:
        """The word as a whole WLC token, or as the first or last part of a glued maqaf compound."""
        form_chirho = comparable_chirho(word_chirho)
        return any(t_chirho == form_chirho or t_chirho.startswith(form_chirho) or t_chirho.endswith(form_chirho)
                   for t_chirho in wlc_tokens_chirho(consonants_chirho(word_chirho)))

    spans_total_chirho = spans_exact_chirho = spans_consonants_chirho = 0
    words_total_chirho = words_exact_chirho = words_consonants_chirho = 0
    pairs_chirho: list[tuple[str, str, str]] = []
    for page_dir_chirho in sorted(SPANS_DIR_CHIRHO.iterdir()):
        page_number_chirho = int(page_dir_chirho.name.split("-")[1])
        page_chirho = pdf_chirho.pages[page_number_chirho - 1]
        height_pt_chirho = float(page_chirho.mediabox[3]) - float(page_chirho.mediabox[1])
        decoded_lines_chirho = decode_page_hebrew_chirho(page_chirho, metrics_chirho)
        boxes_chirho = dict(((r_chirho[0], (r_chirho[1], r_chirho[2])) for r_chirho in progress_chirho.execute(
            """SELECT s.line_index_chirho, s.y_min_chirho, s.height_chirho FROM scanlines_chirho s
                 JOIN pages_chirho p ON p.id_chirho = s.page_id_chirho
                WHERE p.volume_number_chirho = 5 AND p.page_number_chirho = ?""", (page_number_chirho,))))
        for line_file_chirho in sorted(page_dir_chirho.iterdir()):
            span_line_chirho = json.loads(line_file_chirho.read_text(encoding="utf-8"))
            box_chirho = boxes_chirho.get(span_line_chirho["lineIndexChirho"])
            expected_chirho = [unicodedata.normalize("NFC", " ".join(str(s_chirho.get("utf8TextChirho") or "").split()))
                               for s_chirho in span_line_chirho["spansChirho"] if s_chirho["scriptChirho"] == "hebrew-chirho"]
            if box_chirho is None or not expected_chirho:
                continue
            top_pt_chirho = height_pt_chirho - box_chirho[0] * LEGACY_TO_PT_CHIRHO
            bottom_pt_chirho = height_pt_chirho - (box_chirho[0] + box_chirho[1]) * LEGACY_TO_PT_CHIRHO
            decoded_chirho = [p_chirho.text_chirho for l_chirho in decoded_lines_chirho
                              if bottom_pt_chirho <= l_chirho.baseline_pt_chirho <= top_pt_chirho for p_chirho in l_chirho.phrases_chirho]
            remaining_chirho = list(decoded_chirho)
            for e_chirho in expected_chirho:
                spans_total_chirho += 1
                if e_chirho in remaining_chirho:
                    spans_exact_chirho += 1
                    spans_consonants_chirho += 1
                    remaining_chirho.remove(e_chirho)
                    continue
                hit_chirho = next((d_chirho for d_chirho in remaining_chirho if consonants_chirho(d_chirho) == consonants_chirho(e_chirho)), None)
                if hit_chirho is not None:
                    spans_consonants_chirho += 1
                    remaining_chirho.remove(hit_chirho)
            decoded_words_chirho = [w_chirho for d_chirho in decoded_chirho for w_chirho in d_chirho.split()]
            for e_word_chirho in (w_chirho for e_chirho in expected_chirho for w_chirho in e_chirho.split()):
                if not consonants_chirho(e_word_chirho):
                    continue
                words_total_chirho += 1
                if e_word_chirho in decoded_words_chirho:
                    words_exact_chirho += 1
                    words_consonants_chirho += 1
                    decoded_words_chirho.remove(e_word_chirho)
                    continue
                match_chirho = next((d_chirho for d_chirho in decoded_words_chirho if consonants_chirho(d_chirho) == consonants_chirho(e_word_chirho)), None)
                if match_chirho is not None:
                    words_consonants_chirho += 1
                    decoded_words_chirho.remove(match_chirho)
                    pairs_chirho.append((f"p{page_number_chirho} l{span_line_chirho['lineIndexChirho']}", e_word_chirho, match_chirho))

    unpointed_chirho = [p_chirho for p_chirho in pairs_chirho if not (POINT_CHARS_CHIRHO - {"\u05C1", "\u05C2"}) & set(p_chirho[2])]
    pointed_chirho = [p_chirho for p_chirho in pairs_chirho if p_chirho not in unpointed_chirho and comparable_chirho(p_chirho[1]) != comparable_chirho(p_chirho[2])]
    tally_chirho = {"decoder only": [], "reviewed only": [], "both": [], "neither": []}
    for where_chirho, reviewed_chirho, decoded_word_chirho in pointed_chirho:
        decoder_ok_chirho = attested_chirho(decoded_word_chirho)
        reviewed_ok_chirho = attested_chirho(reviewed_chirho)
        key_chirho = "both" if decoder_ok_chirho and reviewed_ok_chirho else "decoder only" if decoder_ok_chirho else "reviewed only" if reviewed_ok_chirho else "neither"
        tally_chirho[key_chirho].append(f"{where_chirho}: decoded {decoded_word_chirho} / reviewed {reviewed_chirho}")

    pct_chirho = lambda a_chirho, b_chirho: f"{100 * a_chirho / max(1, b_chirho):.1f}%"
    print(f"reviewed Hebrew spans: {spans_total_chirho}; exact {spans_exact_chirho} ({pct_chirho(spans_exact_chirho, spans_total_chirho)}); "
          f"consonants {spans_consonants_chirho} ({pct_chirho(spans_consonants_chirho, spans_total_chirho)})")
    print(f"reviewed Hebrew words: {words_total_chirho}; exact {words_exact_chirho} ({pct_chirho(words_exact_chirho, words_total_chirho)}); "
          f"consonants {words_consonants_chirho} ({pct_chirho(words_consonants_chirho, words_total_chirho)})")
    print(f"pointing differences: {len(unpointed_chirho)} unpointed print that the reviewed text points; "
          f"{len(pointed_chirho)} on pointed print, after setting aside accents, meteg and maqaf")
    print("WLC attests: " + ", ".join(f"{k_chirho} {len(v_chirho)}" for k_chirho, v_chirho in tally_chirho.items()))
    for key_chirho in ("reviewed only", "decoder only"):
        for example_chirho in tally_chirho[key_chirho][: args_chirho.examples]:
            print(f"  {key_chirho}: {example_chirho}")


if __name__ == "__main__":
    main_chirho()
