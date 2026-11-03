# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Rules for printed-script hints on the scanned volumes' draft runs (dry run only).

Two machine instruments are kept apart, and neither is a human witness:
W1 is the script of the letters tesseract emitted (raw OCR, which writes
Syriac, sigla and ornaments as Hebrew or Greek letters), and W2 is the
existing v8 word-crop CNN's class probabilities on the printed word image.
Only W2 may suggest a run's printed script; W1 is reported beside it.
Measured basis and gates: spec-chirho/tasklists-chirho/corpus-chirho/26-10-16_13-45-tasklist-full_corpus_intake-chirho.md.

Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
"""
import math
import re

V8_CLASSES_CHIRHO = ("latin", "hebrew", "greek", "symbol")
HEBREW_INDEX_CHIRHO = 1
# A: an unknown run whose width-weighted P(hebrew) reaches this is a printed-Hebrew candidate.
RUN_HEBREW_MIN_CHIRHO = 0.90
# B (exploratory): a word inside a French run with P(hebrew) at least this is a hidden-Hebrew candidate.
WORD_HEBREW_MIN_CHIRHO = 0.98

_HEBREW_LETTER_CHIRHO = re.compile(r"[א-ת]")
_GREEK_LETTER_CHIRHO = re.compile(r"[Ͱ-Ͽἀ-῿]")
_LATIN_LETTER_CHIRHO = re.compile(r"[A-Za-zÀ-ɏ]")


def ocr_letter_script_chirho(text_chirho: str) -> str:
    """W1: the script with the most letters in the OCR text, or 'none'. Never evidence of the print."""
    counts_chirho = {
        "hebrew": len(_HEBREW_LETTER_CHIRHO.findall(text_chirho)),
        "greek": len(_GREEK_LETTER_CHIRHO.findall(text_chirho)),
        "latin": len(_LATIN_LETTER_CHIRHO.findall(text_chirho)),
    }
    best_chirho = max(counts_chirho, key=lambda k_chirho: counts_chirho[k_chirho])
    return best_chirho if counts_chirho[best_chirho] > 0 else "none"


def words_in_run_chirho(words_chirho: list[dict], line_x_chirho: float, run_x_chirho: float, run_width_chirho: float) -> list[int]:
    """Indexes of the line's words whose x-centre falls in the run. Run x is line-local; word boxes are page pixels."""
    left_chirho, right_chirho = line_x_chirho + run_x_chirho, line_x_chirho + run_x_chirho + run_width_chirho
    return [i_chirho for i_chirho, w_chirho in enumerate(words_chirho)
            if left_chirho <= (w_chirho["xMinChirho"] + w_chirho["xMaxChirho"]) / 2 < right_chirho]


def run_mean_chirho(word_probs_chirho: list[list[float]], widths_chirho: list[float]) -> list[float] | None:
    """W2 for a run: class probabilities averaged over its words, weighted by word width. None without measurable words."""
    pairs_chirho = [(p_chirho, w_chirho) for p_chirho, w_chirho in zip(word_probs_chirho, widths_chirho) if p_chirho is not None and w_chirho > 0]
    total_chirho = sum(w_chirho for _p_chirho, w_chirho in pairs_chirho)
    if not pairs_chirho or total_chirho <= 0:
        return None
    return [sum(p_chirho[k_chirho] * w_chirho for p_chirho, w_chirho in pairs_chirho) / total_chirho for k_chirho in range(len(V8_CLASSES_CHIRHO))]


def is_candidate_a_chirho(draft_script_chirho: str, run_probs_chirho: list[float] | None) -> bool:
    """A: an unknown draft run that W2 reads as printed Hebrew. A candidate, never an accepted label."""
    return draft_script_chirho == "unknown-chirho" and run_probs_chirho is not None and run_probs_chirho[HEBREW_INDEX_CHIRHO] >= RUN_HEBREW_MIN_CHIRHO


def candidate_b_words_chirho(draft_script_chirho: str, word_probs_chirho: list[list[float] | None]) -> list[int]:
    """B (exploratory): words of a French draft run that W2 reads as printed Hebrew."""
    if draft_script_chirho != "french-chirho":
        return []
    return [i_chirho for i_chirho, p_chirho in enumerate(word_probs_chirho) if p_chirho is not None and p_chirho[HEBREW_INDEX_CHIRHO] >= WORD_HEBREW_MIN_CHIRHO]


def wilson_chirho(successes_chirho: int, trials_chirho: int, z_chirho: float = 1.959964) -> tuple[float, float]:
    """95% Wilson score interval for a binomial proportion; (0, 1) when there are no trials."""
    if trials_chirho <= 0:
        return (0.0, 1.0)
    p_chirho = successes_chirho / trials_chirho
    denom_chirho = 1 + z_chirho * z_chirho / trials_chirho
    centre_chirho = (p_chirho + z_chirho * z_chirho / (2 * trials_chirho)) / denom_chirho
    half_chirho = z_chirho * math.sqrt(p_chirho * (1 - p_chirho) / trials_chirho + z_chirho * z_chirho / (4 * trials_chirho * trials_chirho)) / denom_chirho
    return (max(0.0, centre_chirho - half_chirho), min(1.0, centre_chirho + half_chirho))
