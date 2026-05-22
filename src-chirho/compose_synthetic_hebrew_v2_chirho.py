#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Compose synthetic Hebrew word images from the human-annotated v3 glyph library
(workspace-chirho/bitmap-font-v3-chirho/U+XXXX/*.png).

Pipeline per synthesized word:
  1. Sample a WLC word from spec-chirho/wlc-chirho.sqlite.
  2. Strip nikkud + sin/shin dot — we have no annotations for those, so the
     synthesized image is consonants-only Hebrew (still unambiguously
     "Hebrew script" for classifier purposes).
  3. Skip the word if any consonant is missing from the glyph library.
  4. For each consonant (text reversed for left-to-right pixel layout, since
     Hebrew is RTL), sample a glyph variant at random.
  5. Normalize all glyph heights to a consistent baseline. Letters sit on the
     baseline, with consistent baseline-line.
  6. Lay out left-to-right with random per-gap spacing. With probability
     `--glue-prob` per adjacent pair, the gap is reduced to a small negative
     (overlap) — matching the touching-letter patterns seen in real scans.
  7. Add scan-like degradation: paper tint, ink darkness jitter, light
     gaussian noise + blur, slight rotation.
  8. Save and insert a row into training_pairs_chirho with
     source='synthetic-hebrew-real-glyphs-chirho'.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/compose_synthetic_hebrew_v2_chirho.py --count=1000
"""

import argparse
import os
import random
import sqlite3
import sys
from pathlib import Path
from collections import defaultdict

from PIL import Image, ImageFilter
import numpy as np

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
WLC_DB_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "wlc-chirho.sqlite"
PROGRESS_DB_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
GLYPH_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-chirho"
OUT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "synthetic-chirho" / "hebrew-real-glyphs-chirho"

NIKKUD_RANGES_CHIRHO = [(0x0591, 0x05BD), (0x05BF, 0x05C7)]
HEBREW_LETTER_RANGE_CHIRHO = (0x05D0, 0x05EA)

TARGET_HEIGHT_CHIRHO = 40   # Consonant "body" height (topline → baseline).
# ASCENDER/DESCENDER zones default to a guess but are OVERRIDDEN below by the
# empirically measured ratios in hebrew-metrics-chirho.json when present
# (measure_hebrew_metrics_chirho.py: lamed rise ~12% of body, finals/qof
# drop ~38% of body — both control-validated, not guessed).
ASCENDER_H_CHIRHO = 16
DESCENDER_H_CHIRHO = 16
# The corpus measurement (ascenderRiseOverBodyChirho ≈ 0.119) UNDER-read
# lamed's rise: loose word crops + lamed not always the topmost ink in its
# word biased it low. User reviewing real-vs-synth: lamed must rise more
# (~15-20% of body more). Use a perceptual, user-validated fraction for the
# ascender; descender (qof/finals) stays corpus-measured — confirmed good.
ASCENDER_RISE_FRAC_CHIRHO = 0.32

def _load_measured_zones_chirho():
    """Override ASCENDER_H / DESCENDER_H from the corpus-measured metrics."""
    import json as _json_chirho
    metrics_path_chirho = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "models-chirho" / "hebrew-metrics-chirho.json"
    if not metrics_path_chirho.exists():
        return False, None
    try:
        with open(metrics_path_chirho) as f_chirho:
            m_chirho = _json_chirho.load(f_chirho)
        global ASCENDER_H_CHIRHO, DESCENDER_H_CHIRHO
        desc_over_body_chirho = m_chirho.get("descenderDropOverBodyChirho")
        # Ascender from the perceptual constant, NOT the under-reading corpus
        # value (see ASCENDER_RISE_FRAC_CHIRHO note above).
        ASCENDER_H_CHIRHO = max(1, int(round(ASCENDER_RISE_FRAC_CHIRHO * TARGET_HEIGHT_CHIRHO)))
        if desc_over_body_chirho is not None:
            DESCENDER_H_CHIRHO = max(1, int(round(desc_over_body_chirho * TARGET_HEIGHT_CHIRHO)))
        return True, m_chirho
    except Exception:
        return False, None

# Hebrew typographic class per letter. Drives vertical placement of legacy
# tight-cropped glyphs (which lost their absolute y). Recovers the correct
# shape from script knowledge instead of needing sidecar position metadata:
#   - 'ascender'  : letter rises above the common topline (only lamed)
#   - 'short'     : small letter sitting high near the topline (yod)
#   - 'descender' : letter drops below the baseline (final forms + qof)
#   - 'full'      : standard body, topline → baseline (everything else)
LETTER_CLASS_CHIRHO = {
    "ל": "ascender",
    "י": "short",
    "ך": "descender", "ן": "descender", "ף": "descender", "ץ": "descender", "ק": "descender",
}
# yod ink height / full-letter ink height, measured from the v3 glyph
# library (n=10 yod: median ink 17px vs 23px median full-letter ink) —
# data-driven, not guessed. Old 0.55 made yod consistently too small.
SHORT_BODY_FRAC_CHIRHO = 0.74

# Apply the corpus-measured ascender/descender zones at import time.
_MEASURED_OK_CHIRHO, _MEASURED_METRICS_CHIRHO = _load_measured_zones_chirho()
# Pixel gap between adjacent glyphs. Tightened from (-3, 6) after ink-tight
# cropping removed each glyph's horizontal padding: a wide range (and stray
# negatives) made spacing look uneven. Small + all-positive = even rhythm;
# intentional touching is handled separately by the glue-overlap branch.
GAP_RANGE_CHIRHO = (2, 5)
# Per-letter default LEFT side-bearing (extra px immediately to the glyph's
# pixel-left). ח has a strong vertical left stroke that butts straight into
# a vertical-edged neighbour (e.g. ה in משפחה) and reads as merged; one
# default pixel separates them. Within the user's "a pixel or so is fine".
LEFT_BEARING_CHIRHO = {"ח": 1}
# Sideways jitter kept to ~1px: at ~150px word width, 1.2° already shifts
# edges ~3px. 0.5° ≈ ~1px — enough life without looking wobbly.
ROTATION_RANGE_CHIRHO = (-0.5, 0.5)
SCALE_JITTER_RANGE_CHIRHO = (0.92, 1.08)
# Lowered from (0.3, 0.9): high sigma over the flat-fill ink read as a
# bleeding felt-tip. The glyph is itself a scan (carries real edge texture),
# so it needs only a whisper of blur.
BLUR_SIGMA_RANGE_CHIRHO = (0.0, 0.4)
# Higher contrast: paper near-pure white, less speckle (the old 235-250 +
# heavy noise read as a gray canvas; user wants white totally white).
NOISE_STD_RANGE_CHIRHO = (1.0, 4.0)
PAPER_TINT_RANGE_CHIRHO = (250, 255)
PER_GLYPH_PAD_CHIRHO = 3


def strip_nikkud_chirho(text_chirho: str) -> str:
    return "".join(ch_chirho for ch_chirho in text_chirho if not any(a_chirho <= ord(ch_chirho) <= b_chirho for a_chirho, b_chirho in NIKKUD_RANGES_CHIRHO))


def consonants_only_chirho(text_chirho: str) -> str:
    return "".join(ch_chirho for ch_chirho in text_chirho if HEBREW_LETTER_RANGE_CHIRHO[0] <= ord(ch_chirho) <= HEBREW_LETTER_RANGE_CHIRHO[1])


def load_glyph_library_chirho() -> dict:
    """Returns {character: [{'imgChirho': PIL.Image, 'polyTopFracChirho': 0-1,
    'polyBottomFracChirho': 0-1}]}. Glyphs are scaled to a common reference
    word-crop height so per-glyph vertical position (relative to baseline) is
    preserved across the library — final-nun descenders, yod tops, lamed
    ascenders all stay at their correct line-position.

    If the sidecar .json exists (newer v3 glyphs saved with full word-crop
    height), we use polyTop/polyBottom + wordCropHeight. Older tight-cropped
    glyphs fall back to default centered placement."""
    import os as os_chirho
    import json as json_chirho
    library_chirho: dict = {}
    if not GLYPH_DIR_CHIRHO.exists():
        return library_chirho
    for cp_dir_chirho in GLYPH_DIR_CHIRHO.iterdir():
        if not cp_dir_chirho.is_dir() or not cp_dir_chirho.name.startswith("U+"):
            continue
        try:
            cp_chirho = int(cp_dir_chirho.name[2:], 16)
        except ValueError:
            continue
        ch_chirho = chr(cp_chirho)
        letter_class_chirho = LETTER_CLASS_CHIRHO.get(ch_chirho, "full")
        glyphs_chirho = []
        for png_chirho in cp_dir_chirho.glob("*.png"):
            img_chirho = Image.open(png_chirho).convert("L")
            sidecar_chirho = png_chirho.with_suffix(".json")
            has_position_chirho = False
            poly_top_frac_chirho = 0.0
            poly_bottom_frac_chirho = 1.0
            if os_chirho.path.exists(sidecar_chirho):
                try:
                    with open(sidecar_chirho) as f_chirho:
                        meta_chirho = json_chirho.load(f_chirho)
                    h_chirho = float(meta_chirho.get("wordCropHeightChirho", img_chirho.height))
                    if h_chirho > 0:
                        poly_top_frac_chirho = meta_chirho.get("polyTopChirho", 0) / h_chirho
                        poly_bottom_frac_chirho = meta_chirho.get("polyBottomChirho", h_chirho) / h_chirho
                        has_position_chirho = True
                except Exception:
                    pass
            # Keep the original glyph (native aspect). compose_word_image_chirho
            # sizes + positions it per its typographic class so legacy
            # tight-cropped glyphs land at the right line position.
            glyphs_chirho.append({
                "imgChirho": img_chirho,
                "charChirho": ch_chirho,
                "letterClassChirho": letter_class_chirho,
                "hasPositionChirho": has_position_chirho,
                "polyTopFracChirho": poly_top_frac_chirho,
                "polyBottomFracChirho": poly_bottom_frac_chirho,
            })
        if glyphs_chirho:
            library_chirho[ch_chirho] = glyphs_chirho

    # Derive a MEASURED per-letter vertical band from sidecar-positioned
    # samples (median polyTopFrac / polyBottomFrac across that letter's
    # annotated glyphs). This replaces the hardcoded ASCENDER/DESCENDER
    # guesses with real measurements — e.g. exactly how far lamed's top
    # rises above the topline, learned from annotated lamed words.
    measured_chirho: dict = {}
    for ch_chirho, gs_chirho in library_chirho.items():
        tops_chirho = [g_chirho["polyTopFracChirho"] for g_chirho in gs_chirho if g_chirho["hasPositionChirho"]]
        bots_chirho = [g_chirho["polyBottomFracChirho"] for g_chirho in gs_chirho if g_chirho["hasPositionChirho"]]
        if tops_chirho and bots_chirho:
            tops_chirho.sort(); bots_chirho.sort()
            measured_chirho[ch_chirho] = {
                "topFracChirho": tops_chirho[len(tops_chirho) // 2],
                "bottomFracChirho": bots_chirho[len(bots_chirho) // 2],
                "nChirho": len(tops_chirho),
            }
    # The full-body letters' median topFrac defines the shared TOPLINE; their
    # median bottomFrac the BASELINE. Lamed's measured topFrac (smaller =
    # higher) tells us its true ascender rise relative to that topline.
    full_tops_chirho = [
        measured_chirho[ch_chirho]["topFracChirho"]
        for ch_chirho in measured_chirho
        if LETTER_CLASS_CHIRHO.get(ch_chirho, "full") == "full"
    ]
    full_bots_chirho = [
        measured_chirho[ch_chirho]["bottomFracChirho"]
        for ch_chirho in measured_chirho
        if LETTER_CLASS_CHIRHO.get(ch_chirho, "full") == "full"
    ]
    if full_tops_chirho and full_bots_chirho:
        full_tops_chirho.sort(); full_bots_chirho.sort()
        library_chirho["_measuredChirho"] = {
            "toplineFracChirho": full_tops_chirho[len(full_tops_chirho) // 2],
            "baselineFracChirho": full_bots_chirho[len(full_bots_chirho) // 2],
            "perLetterChirho": measured_chirho,
        }
    return library_chirho


def sample_wlc_words_chirho(n_chirho: int, library_chars_chirho: set) -> list:
    """Sample WLC words whose consonants are all covered by our glyph library.
    Over-sample then filter (faster than rejection in a loop)."""
    conn_chirho = sqlite3.connect(WLC_DB_CHIRHO)
    rows_chirho = conn_chirho.execute(
        "SELECT raw_word_chirho FROM words_chirho ORDER BY RANDOM() LIMIT ?",
        (n_chirho * 4,),
    ).fetchall()
    conn_chirho.close()
    selected_chirho = []
    seen_chirho = set()
    for (raw_chirho,) in rows_chirho:
        consonants_chirho = consonants_only_chirho(strip_nikkud_chirho(raw_chirho or ""))
        if not (2 <= len(consonants_chirho) <= 10):
            continue
        if any(ch_chirho not in library_chars_chirho for ch_chirho in consonants_chirho):
            continue
        if consonants_chirho in seen_chirho:
            continue
        seen_chirho.add(consonants_chirho)
        selected_chirho.append(consonants_chirho)
        if len(selected_chirho) >= n_chirho:
            break
    return selected_chirho


def ink_tight_crop_chirho(img_chirho, thresh_chirho=200):
    """Crop to the actual ink bounding box. Legacy glyph PNGs carry ~25%
    variable white padding (save_polygons keeps full word-strip height); sizing
    by the stored crop therefore made each letter's real ink inconsistently
    tall (tav too small ~half the time, generally uneven). Normalizing by the
    ink box makes every full letter's INK map to the same body height."""
    arr_chirho = np.asarray(img_chirho.convert("L"))
    ys_chirho, xs_chirho = np.where(arr_chirho < thresh_chirho)
    if ys_chirho.size == 0:
        return img_chirho
    return img_chirho.crop((
        int(xs_chirho.min()), int(ys_chirho.min()),
        int(xs_chirho.max()) + 1, int(ys_chirho.max()) + 1,
    ))


def size_and_anchor_chirho(glyph_info_chirho, measured_ref_chirho):
    """Return (resized_img, y_offset_from_canvas_top).

    Canvas line box:
        y=0 .................. canvas top
        y=ASCENDER_H ......... TOPLINE  (top of full-body letters)
        y=ASCENDER_H+BODY .... BASELINE (bottom of full-body letters)
        y=ASCENDER_H+BODY+DESC bottom

    Preference order:
      1. If we have a MEASURED per-letter band for this char (from
         sidecar-annotated samples), map the letter's measured
         (top→bottom) fraction onto the canvas proportionally to the
         measured shared topline/baseline. This is the data-driven
         placement — lamed's real ascender rise, etc.
      2. Otherwise fall back to the typographic-class heuristic.
    """
    img_chirho = glyph_info_chirho["imgChirho"]
    ch_chirho = glyph_info_chirho["charChirho"]
    cls_chirho = glyph_info_chirho["letterClassChirho"]

    topline_y_chirho = ASCENDER_H_CHIRHO
    body_px_chirho = TARGET_HEIGHT_CHIRHO

    per_letter_chirho = (measured_ref_chirho or {}).get("perLetterChirho", {})
    use_measured_chirho = bool(measured_ref_chirho and ch_chirho in per_letter_chirho)
    if not use_measured_chirho:
        # Class-fallback path: normalize by real ink, not the padded crop, so
        # full letters end up the same height (even baseline) and yod scales
        # to the measured SHORT_BODY_FRAC of that ink.
        img_chirho = ink_tight_crop_chirho(img_chirho)
    src_w_chirho, src_h_chirho = img_chirho.size
    aspect_chirho = src_w_chirho / max(1, src_h_chirho)

    if use_measured_chirho:
        # Data-driven: map measured fraction band onto the canvas.
        topline_frac_chirho = measured_ref_chirho["toplineFracChirho"]
        baseline_frac_chirho = measured_ref_chirho["baselineFracChirho"]
        span_frac_chirho = max(1e-6, baseline_frac_chirho - topline_frac_chirho)
        lt_chirho = per_letter_chirho[ch_chirho]["topFracChirho"]
        lb_chirho = per_letter_chirho[ch_chirho]["bottomFracChirho"]
        # Position relative to topline, scaled so the shared body span = body_px
        top_y_chirho = topline_y_chirho + ((lt_chirho - topline_frac_chirho) / span_frac_chirho) * body_px_chirho
        bot_y_chirho = topline_y_chirho + ((lb_chirho - topline_frac_chirho) / span_frac_chirho) * body_px_chirho
        target_h_chirho = max(4, int(round(bot_y_chirho - top_y_chirho)))
        y_off_chirho = int(round(top_y_chirho))
    elif cls_chirho == "ascender":
        target_h_chirho = ASCENDER_H_CHIRHO + body_px_chirho
        y_off_chirho = 0
    elif cls_chirho == "short":
        target_h_chirho = int(body_px_chirho * SHORT_BODY_FRAC_CHIRHO)
        y_off_chirho = topline_y_chirho
    elif cls_chirho == "descender":
        target_h_chirho = body_px_chirho + DESCENDER_H_CHIRHO
        y_off_chirho = topline_y_chirho
    else:  # full
        target_h_chirho = body_px_chirho
        y_off_chirho = topline_y_chirho

    target_w_chirho = max(4, int(round(target_h_chirho * aspect_chirho)))
    resized_chirho = img_chirho.resize((target_w_chirho, target_h_chirho), Image.BILINEAR)
    return resized_chirho, y_off_chirho


def compose_word_image_chirho(consonants_chirho: str, library_chirho: dict, glue_prob_chirho: float) -> Image.Image:
    """Lay glyphs out left-to-right (text reversed for RTL). Each glyph is
    sized + vertically anchored by its Hebrew typographic class so the shared
    topline of full-body letters is consistent, lamed rises above it, yod
    sits high, and final letters + qof drop below the baseline."""
    measured_ref_chirho = library_chirho.get("_measuredChirho")
    chars_in_pixel_order_chirho = consonants_chirho[::-1]
    sampled_chirho = [random.choice(library_chirho[ch_chirho]) for ch_chirho in chars_in_pixel_order_chirho]

    line_box_h_chirho = ASCENDER_H_CHIRHO + TARGET_HEIGHT_CHIRHO + DESCENDER_H_CHIRHO
    placed_chirho = []  # (resized_img, x, y)
    x_chirho = PER_GLYPH_PAD_CHIRHO
    for i_chirho, glyph_info_chirho in enumerate(sampled_chirho):
        resized_chirho, y_off_chirho = size_and_anchor_chirho(glyph_info_chirho, measured_ref_chirho)
        placed_chirho.append((resized_chirho, x_chirho, y_off_chirho))
        x_chirho += resized_chirho.width
        if i_chirho < len(sampled_chirho) - 1:
            # Yod spacing is ASYMMETRIC (observed in the real scans):
            #   - it hugs the letter on its pixel-LEFT (= the next letter in
            #     RTL reading order): little/no padding there, can tuck under.
            #   - its pixel-RIGHT side (toward the preceding reading-order
            #     letter) keeps a clear gap — a yod is never merged into from
            #     that side.
            # chars_in_pixel_order is reversed text, so glyph i+1 sits to the
            # pixel-LEFT of glyph i.
            this_is_yod_chirho = glyph_info_chirho["charChirho"] == "י"
            next_is_yod_chirho = sampled_chirho[i_chirho + 1]["charChirho"] == "י"
            if next_is_yod_chirho:
                # Yod's pixel-LEFT side: it frequently sits ON TOP of the
                # letter to its left (overlap), but not always — so a wide
                # mostly-negative range: usually tucks over by a few px,
                # occasionally just flush. Never a real positive gap there.
                gap_chirho = random.randint(-5, 1)
            elif this_is_yod_chirho:
                # Yod's pixel-RIGHT side: a few clear pixels, never glued.
                gap_chirho = random.randint(2, 4)
            elif random.random() < glue_prob_chirho:
                gap_chirho = random.randint(-4, -1)
            else:
                gap_chirho = random.randint(*GAP_RANGE_CHIRHO)
            # Default left side-bearing for the glyph about to be placed
            # (i+1 sits to glyph i's pixel-right; the bearing is space on
            # that next glyph's left).
            gap_chirho += LEFT_BEARING_CHIRHO.get(
                sampled_chirho[i_chirho + 1]["charChirho"], 0
            )
            x_chirho += gap_chirho

    canvas_w_chirho = x_chirho + PER_GLYPH_PAD_CHIRHO
    canvas_h_chirho = line_box_h_chirho + PER_GLYPH_PAD_CHIRHO * 2
    paper_chirho = random.randint(*PAPER_TINT_RANGE_CHIRHO)

    # Additive ink: where glyphs overlap (yod over its left neighbour, glued
    # pairs) the ink SUMS — partial/anti-aliased edges darken together — the
    # way overlapping scan ink physically behaves, instead of one paste
    # replacing the other. White areas contribute 0 ink, so paper is kept.
    ink_accum_chirho = np.zeros((canvas_h_chirho, canvas_w_chirho), dtype=np.float32)
    for resized_chirho, gx_chirho, gy_chirho in placed_chirho:
        arr_chirho = np.asarray(resized_chirho, dtype=np.float32)
        # Boost >1 so real ink saturates to true black (clipped by paper-ink
        # below), instead of the old ×0.80 dark-gray. "Blacker than black."
        glyph_ink_chirho = (255.0 - arr_chirho) * 1.20
        py_chirho = gy_chirho + PER_GLYPH_PAD_CHIRHO
        px_chirho = gx_chirho
        gh_chirho, gw_chirho = glyph_ink_chirho.shape
        y0_chirho = max(0, py_chirho)
        y1_chirho = min(canvas_h_chirho, py_chirho + gh_chirho)
        x0_chirho = max(0, px_chirho)
        x1_chirho = min(canvas_w_chirho, px_chirho + gw_chirho)
        if y1_chirho <= y0_chirho or x1_chirho <= x0_chirho:
            continue
        ink_accum_chirho[y0_chirho:y1_chirho, x0_chirho:x1_chirho] += glyph_ink_chirho[
            y0_chirho - py_chirho : y1_chirho - py_chirho,
            x0_chirho - px_chirho : x1_chirho - px_chirho,
        ]
    canvas_arr_chirho = np.clip(paper_chirho - ink_accum_chirho, 0, 255).astype(np.uint8)
    canvas_chirho = Image.fromarray(canvas_arr_chirho, "L")

    # Slight rotation
    angle_chirho = random.uniform(*ROTATION_RANGE_CHIRHO)
    canvas_chirho = canvas_chirho.rotate(angle_chirho, fillcolor=paper_chirho, resample=Image.BILINEAR, expand=False)

    # Scale jitter
    scale_chirho = random.uniform(*SCALE_JITTER_RANGE_CHIRHO)
    if abs(scale_chirho - 1.0) > 0.01:
        new_w_chirho = max(8, int(canvas_chirho.width * scale_chirho))
        new_h_chirho = max(8, int(canvas_chirho.height * scale_chirho))
        canvas_chirho = canvas_chirho.resize((new_w_chirho, new_h_chirho), Image.BILINEAR)

    # Light blur
    canvas_chirho = canvas_chirho.filter(ImageFilter.GaussianBlur(radius=random.uniform(*BLUR_SIGMA_RANGE_CHIRHO)))

    # Noise
    arr_chirho = np.asarray(canvas_chirho, dtype=np.float32)
    noise_chirho = np.random.normal(0, random.uniform(*NOISE_STD_RANGE_CHIRHO), arr_chirho.shape)
    arr_chirho = np.clip(arr_chirho + noise_chirho, 0, 255).astype(np.uint8)

    # Trim the fixed ascender/descender padding band down to the actual ink
    # bbox (+ a small even margin). The composed canvas reserved a tall
    # line-box, so at equal display height the synthetic letters rendered
    # ~15% larger than the tight real word crops. Framing it like a real
    # crop makes letter sizes match. Whole-word bbox (not per-letter), so
    # lamed's rise / final-letter drop are preserved.
    FINAL_MARGIN_PX_CHIRHO = 3
    ink_ys_chirho, ink_xs_chirho = np.where(arr_chirho < 200)
    if ink_ys_chirho.size and ink_xs_chirho.size:
        y0_chirho = max(0, int(ink_ys_chirho.min()) - FINAL_MARGIN_PX_CHIRHO)
        y1_chirho = min(arr_chirho.shape[0], int(ink_ys_chirho.max()) + 1 + FINAL_MARGIN_PX_CHIRHO)
        x0_chirho = max(0, int(ink_xs_chirho.min()) - FINAL_MARGIN_PX_CHIRHO)
        x1_chirho = min(arr_chirho.shape[1], int(ink_xs_chirho.max()) + 1 + FINAL_MARGIN_PX_CHIRHO)
        arr_chirho = arr_chirho[y0_chirho:y1_chirho, x0_chirho:x1_chirho]
    return Image.fromarray(arr_chirho, mode="L")


def main_chirho():
    parser_chirho = argparse.ArgumentParser()
    parser_chirho.add_argument("--count", type=int, default=500)
    parser_chirho.add_argument("--glue-prob", type=float, default=0.35,
                               help="Per-adjacent-pair probability of overlap (mimics touching letters in real scans)")
    parser_chirho.add_argument("--seed", type=int, default=42)
    args_chirho = parser_chirho.parse_args()

    random.seed(args_chirho.seed)
    np.random.seed(args_chirho.seed)

    library_chirho = load_glyph_library_chirho()
    if not library_chirho:
        print(f"No glyphs found in {GLYPH_DIR_CHIRHO}", file=sys.stderr)
        sys.exit(1)
    print(f"Loaded glyph library: {len(library_chirho)} letters")
    for ch_chirho in sorted(library_chirho.keys()):
        print(f"  {ch_chirho} (U+{ord(ch_chirho):04X}): {len(library_chirho[ch_chirho])} samples")

    words_chirho = sample_wlc_words_chirho(args_chirho.count, set(library_chirho.keys()))
    print(f"Sampled {len(words_chirho)} WLC words whose consonants are fully covered")

    OUT_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)
    progress_conn_chirho = sqlite3.connect(PROGRESS_DB_CHIRHO)
    progress_conn_chirho.execute("PRAGMA foreign_keys = OFF")
    cur_chirho = progress_conn_chirho.execute(
        "SELECT MIN(word_id_chirho) FROM training_pairs_chirho WHERE source_chirho LIKE 'synthetic-%-chirho'"
    )
    row_chirho = cur_chirho.fetchone()
    next_synth_id_chirho = -1 if row_chirho[0] is None else row_chirho[0] - 1

    inserted_chirho = 0
    failed_chirho = 0
    for i_chirho, word_chirho in enumerate(words_chirho):
        try:
            img_chirho = compose_word_image_chirho(word_chirho, library_chirho, args_chirho.glue_prob)
        except Exception as e_chirho:
            failed_chirho += 1
            if failed_chirho <= 3:
                print(f"  compose failed for {word_chirho!r}: {e_chirho}")
            continue
        out_path_chirho = OUT_DIR_CHIRHO / f"heb-real-{i_chirho:05d}-chirho.png"
        img_chirho.save(out_path_chirho, optimize=True)
        progress_conn_chirho.execute(
            """INSERT OR IGNORE INTO training_pairs_chirho
                (word_id_chirho, scanline_id_chirho, page_id_chirho, vol_chirho, page_num_chirho,
                 line_idx_chirho, word_idx_chirho,
                 x_min_chirho, y_min_chirho, x_max_chirho, y_max_chirho,
                 crop_path_chirho, text_chirho, script_chirho, source_chirho,
                 certainty_chirho, tesseract_was_chirho)
               VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?, ?, 'hebrew-chirho', 'synthetic-hebrew-real-glyphs-chirho', NULL, NULL)""",
            (next_synth_id_chirho, img_chirho.width, img_chirho.height, str(out_path_chirho), word_chirho),
        )
        next_synth_id_chirho -= 1
        inserted_chirho += 1
        if (i_chirho + 1) % 100 == 0:
            progress_conn_chirho.commit()
            print(f"  {i_chirho + 1} / {len(words_chirho)} composed")

    progress_conn_chirho.commit()
    progress_conn_chirho.close()
    print(f"done: {inserted_chirho} composed, {failed_chirho} failed")
    print(f"saved to: {OUT_DIR_CHIRHO}")


if __name__ == "__main__":
    main_chirho()
