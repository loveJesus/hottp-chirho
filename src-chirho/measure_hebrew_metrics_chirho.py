#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Measure Hebrew vertical type-metrics empirically from real labeled word crops
— no manual annotation needed.

Idea (user's): in a binarized Hebrew word, scan each column for its top-most
and bottom-most ink pixel.

  * Most columns belong to full-body letters, so the MEDIAN column-top is the
    shared TOPLINE and the MEDIAN column-bottom is the BASELINE.
  * Lamed is the only ascender, so in a lamed-containing word the HIGHEST ink
    (low percentile of column-tops) sits above the topline. The gap is the
    measured ascender rise.
  * Final letters + qof are the descenders, so in those words the LOWEST ink
    (high percentile of column-bottoms) sits below the baseline. The gap is
    the measured descender drop.

All values are reported as fractions of the word-crop content height so they
are scale-independent. compose_synthetic_hebrew_v2_chirho.py reads the output
JSON to place glyphs without guessed constants.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/measure_hebrew_metrics_chirho.py
"""

import json
import os
import sqlite3
import sys
from pathlib import Path
from statistics import median

from PIL import Image
import numpy as np

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
OUT_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "models-chirho" / "hebrew-metrics-chirho.json"

LAMED_CHIRHO = "ל"
DESCENDER_LETTERS_CHIRHO = set("ךןףץק")
NIKKUD_RANGES_CHIRHO = [(0x0591, 0x05BD), (0x05BF, 0x05C7)]
HEBREW_LETTER_RANGE_CHIRHO = (0x05D0, 0x05EA)
# Exclude brackets AND dashes/quotes/slashes — any of these add tall or
# baseline-crossing ink that pollutes the per-column extreme measurement.
FORBIDDEN_CHARS_CHIRHO = set("()[]{}<>" "-–—_/\\|" '"' "'" "‘’“”" ".,:;!?*")
INK_THRESHOLD_CHIRHO = 128


def iqr_trim_chirho(values_chirho):
    """Drop values outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR]. Robust to the few
    crops that slipped through the text filter with stray marks / double lines."""
    if len(values_chirho) < 8:
        return values_chirho
    s_chirho = sorted(values_chirho)
    n_chirho = len(s_chirho)
    q1_chirho = s_chirho[n_chirho // 4]
    q3_chirho = s_chirho[(3 * n_chirho) // 4]
    iqr_chirho = q3_chirho - q1_chirho
    lo_chirho = q1_chirho - 1.5 * iqr_chirho
    hi_chirho = q3_chirho + 1.5 * iqr_chirho
    return [v_chirho for v_chirho in s_chirho if lo_chirho <= v_chirho <= hi_chirho]


def strip_nikkud_chirho(text_chirho: str) -> str:
    return "".join(ch_chirho for ch_chirho in text_chirho if not any(a_chirho <= ord(ch_chirho) <= b_chirho for a_chirho, b_chirho in NIKKUD_RANGES_CHIRHO))


def hebrew_letters_chirho(text_chirho: str) -> str:
    return "".join(ch_chirho for ch_chirho in text_chirho if HEBREW_LETTER_RANGE_CHIRHO[0] <= ord(ch_chirho) <= HEBREW_LETTER_RANGE_CHIRHO[1])


def column_extremes_chirho(img_path_chirho: str):
    """Return (content_top, content_bottom, content_height, col_tops, col_bots)
    in pixel rows. col_tops/col_bots are per-ink-column highest/lowest ink row."""
    img_chirho = Image.open(img_path_chirho).convert("L")
    arr_chirho = np.asarray(img_chirho, dtype=np.uint8)
    ink_chirho = arr_chirho < INK_THRESHOLD_CHIRHO
    if not ink_chirho.any():
        return None
    rows_with_ink_chirho = np.where(ink_chirho.any(axis=1))[0]
    content_top_chirho = int(rows_with_ink_chirho.min())
    content_bottom_chirho = int(rows_with_ink_chirho.max())
    content_h_chirho = content_bottom_chirho - content_top_chirho + 1
    col_tops_chirho = []
    col_bots_chirho = []
    for x_chirho in range(arr_chirho.shape[1]):
        col_chirho = np.where(ink_chirho[:, x_chirho])[0]
        if col_chirho.size == 0:
            continue
        col_tops_chirho.append(int(col_chirho.min()))
        col_bots_chirho.append(int(col_chirho.max()))
    return content_top_chirho, content_bottom_chirho, content_h_chirho, col_tops_chirho, col_bots_chirho


def percentile_chirho(values_chirho, q_chirho):
    if not values_chirho:
        return None
    s_chirho = sorted(values_chirho)
    idx_chirho = min(len(s_chirho) - 1, max(0, int(round(q_chirho * (len(s_chirho) - 1)))))
    return s_chirho[idx_chirho]


def main_chirho():
    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    rows_chirho = conn_chirho.execute(
        """SELECT crop_path_chirho, text_chirho
             FROM training_pairs_chirho
             WHERE script_chirho = 'hebrew-chirho'
               AND source_chirho IN ('canonical-recon-chirho', 'human-chirho')"""
    ).fetchall()
    conn_chirho.close()

    # Per-word, normalized fractions:
    #   topline_frac  = (median_col_top - content_top) / content_h
    #   baseline_frac = (median_col_bottom - content_top) / content_h
    #   ascender_rise = (median_col_top - p05_col_top) / content_h   [lamed words]
    #   descender_drop= (p95_col_bottom - median_col_bottom)/content_h [final words]
    ascender_rises_chirho = []
    descender_drops_chirho = []
    body_top_fracs_chirho = []
    body_bot_fracs_chirho = []
    # CONTROL group: words with NO lamed and NO descender letter. Their
    # highest-ink fraction is the pure topline — used to confirm that the
    # lamed-group's extra rise is real and not a measurement artifact.
    control_top_fracs_chirho = []
    lamed_min_top_fracs_chirho = []
    n_words_chirho = 0
    n_lamed_chirho = 0
    n_desc_chirho = 0
    n_control_chirho = 0

    for crop_path_chirho, text_chirho in rows_chirho:
        if not os.path.exists(crop_path_chirho):
            continue
        t_chirho = text_chirho or ""
        if any(c_chirho in FORBIDDEN_CHARS_CHIRHO for c_chirho in t_chirho):
            continue
        consonants_chirho = hebrew_letters_chirho(strip_nikkud_chirho(t_chirho))
        if len(consonants_chirho) < 2:
            continue
        res_chirho = column_extremes_chirho(crop_path_chirho)
        if res_chirho is None:
            continue
        c_top_chirho, c_bot_chirho, c_h_chirho, col_tops_chirho, col_bots_chirho = res_chirho
        if c_h_chirho < 8 or len(col_tops_chirho) < 4:
            continue
        n_words_chirho += 1

        med_top_chirho = median(col_tops_chirho)
        med_bot_chirho = median(col_bots_chirho)
        body_top_fracs_chirho.append((med_top_chirho - c_top_chirho) / c_h_chirho)
        body_bot_fracs_chirho.append((med_bot_chirho - c_top_chirho) / c_h_chirho)

        has_lamed_chirho = LAMED_CHIRHO in consonants_chirho
        has_desc_chirho = any(d_chirho in consonants_chirho for d_chirho in DESCENDER_LETTERS_CHIRHO)

        if has_lamed_chirho:
            n_lamed_chirho += 1
            p05_top_chirho = percentile_chirho(col_tops_chirho, 0.05)
            rise_chirho = (med_top_chirho - p05_top_chirho) / c_h_chirho
            if rise_chirho >= 0:
                ascender_rises_chirho.append(rise_chirho)
                lamed_min_top_fracs_chirho.append(rise_chirho)

        if has_desc_chirho:
            n_desc_chirho += 1
            p95_bot_chirho = percentile_chirho(col_bots_chirho, 0.95)
            drop_chirho = (p95_bot_chirho - med_bot_chirho) / c_h_chirho
            if drop_chirho > 0:
                descender_drops_chirho.append(drop_chirho)

        if not has_lamed_chirho and not has_desc_chirho:
            # Control: clean full-body-only word. Measure the SAME "rise"
            # metric (median column-top minus the highest column-top) so it is
            # directly comparable to the lamed group. With no ascender, the
            # highest column-top ≈ the median column-top, so control rise → ~0.
            n_control_chirho += 1
            p05_top_chirho = percentile_chirho(col_tops_chirho, 0.05)
            ctrl_rise_chirho = (med_top_chirho - p05_top_chirho) / c_h_chirho
            control_top_fracs_chirho.append(ctrl_rise_chirho)

    if n_words_chirho == 0:
        print("No measurable Hebrew words found", file=sys.stderr)
        sys.exit(1)

    # IQR-trim every aggregate to drop crops that slipped the text filter
    # (double-line scanlines, stray ink) before taking the median.
    body_top_fracs_chirho = iqr_trim_chirho(body_top_fracs_chirho)
    body_bot_fracs_chirho = iqr_trim_chirho(body_bot_fracs_chirho)
    ascender_rises_chirho = iqr_trim_chirho(ascender_rises_chirho)
    descender_drops_chirho = iqr_trim_chirho(descender_drops_chirho)
    control_top_fracs_chirho = iqr_trim_chirho(control_top_fracs_chirho)
    lamed_min_top_fracs_chirho = iqr_trim_chirho(lamed_min_top_fracs_chirho)

    # Both groups now hold the SAME "rise" metric (median_col_top minus
    # 5th-pct col_top, normalized). Control should be ~0 (no ascender); lamed
    # should be clearly positive. Their difference is the lamed-attributable
    # ascender rise, validated against a real no-ascender baseline.
    control_rise_chirho = median(control_top_fracs_chirho) if control_top_fracs_chirho else None
    lamed_rise_chirho = median(lamed_min_top_fracs_chirho) if lamed_min_top_fracs_chirho else None
    rise_vs_control_chirho = None
    if control_rise_chirho is not None and lamed_rise_chirho is not None:
        rise_vs_control_chirho = round(lamed_rise_chirho - control_rise_chirho, 4)

    metrics_chirho = {
        "nWordsChirho": n_words_chirho,
        "nLamedWordsChirho": n_lamed_chirho,
        "nDescenderWordsChirho": n_desc_chirho,
        "nControlWordsChirho": n_control_chirho,
        "bodyTopFracChirho": round(median(body_top_fracs_chirho), 4),
        "bodyBottomFracChirho": round(median(body_bot_fracs_chirho), 4),
        "ascenderRiseFracChirho": round(median(ascender_rises_chirho), 4) if ascender_rises_chirho else None,
        "descenderDropFracChirho": round(median(descender_drops_chirho), 4) if descender_drops_chirho else None,
        # Treatment vs control: control_topline is the pure no-ascender topline;
        # lamed_top is the lamed-group's top-ink. Their gap is the rise that is
        # *attributable to lamed* rather than to measurement noise.
        "controlRiseFracChirho": round(control_rise_chirho, 4) if control_rise_chirho is not None else None,
        "lamedRiseFracChirho": round(lamed_rise_chirho, 4) if lamed_rise_chirho is not None else None,
        "ascenderRiseVsControlFracChirho": rise_vs_control_chirho,
    }
    # Convert to body-relative ratios the composer can apply directly:
    body_span_chirho = max(1e-6, metrics_chirho["bodyBottomFracChirho"] - metrics_chirho["bodyTopFracChirho"])
    if metrics_chirho["ascenderRiseFracChirho"] is not None:
        metrics_chirho["ascenderRiseOverBodyChirho"] = round(metrics_chirho["ascenderRiseFracChirho"] / body_span_chirho, 3)
    if metrics_chirho["descenderDropFracChirho"] is not None:
        metrics_chirho["descenderDropOverBodyChirho"] = round(metrics_chirho["descenderDropFracChirho"] / body_span_chirho, 3)

    OUT_PATH_CHIRHO.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH_CHIRHO, "w") as f_chirho:
        json.dump(metrics_chirho, f_chirho, indent=2, ensure_ascii=False)

    print("Measured Hebrew vertical metrics (from real labeled crops):")
    print(json.dumps(metrics_chirho, indent=2, ensure_ascii=False))
    print(f"\nwrote {OUT_PATH_CHIRHO}")
    print(f"\nInterpretation:")
    if metrics_chirho.get("ascenderRiseOverBodyChirho") is not None:
        print(f"  lamed rises ~{metrics_chirho['ascenderRiseOverBodyChirho']:.0%} of the consonant-body height above the topline")
    if metrics_chirho.get("descenderDropOverBodyChirho") is not None:
        print(f"  final letters / qof drop ~{metrics_chirho['descenderDropOverBodyChirho']:.0%} of body height below the baseline")
    # Treatment-vs-control sanity check
    if rise_vs_control_chirho is not None:
        cr_chirho = metrics_chirho["controlRiseFracChirho"]
        lr_chirho = metrics_chirho["lamedRiseFracChirho"]
        verdict_chirho = (
            "CONFIRMED — lamed words show a real ascender bump vs the no-ascender control"
            if rise_vs_control_chirho > 0.03
            else "WEAK/NULL — lamed bump not clearly above control noise"
        )
        print(f"\nControl comparison (n_control={n_control_chirho}, n_lamed={n_lamed_chirho}):")
        print(f"  control rise frac = {cr_chirho}  (no-ascender words, expect ~0)")
        print(f"  lamed   rise frac = {lr_chirho}  (words containing lamed)")
        print(f"  lamed-attributable rise = {rise_vs_control_chirho}  → {verdict_chirho}")


if __name__ == "__main__":
    main_chirho()
