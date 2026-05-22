#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Synthetic Hebrew from the HUMAN-DRAWN ductus (vector pen font), not bitmap
crops. Each consonant = the user's saved Bezier spine (glyph_spines_chirho),
stroked with the measured constant round pen, wiggled for domain
randomisation. Unlimited, clean, perfectly-labelled training data grounded
entirely in human ground truth.

Font source = ONLY saved exemplars (incl. the user's re-adjusted saves);
never the auto-fitted seeds the user did not review. Layout + degradation
reuse the validated bitmap pipeline (compose_synthetic_hebrew_v2) so only
glyph rasterisation changes (bitmap -> pen-stroked spline).

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/compose_synthetic_strokes_chirho.py --count=1000
"""
import argparse
import json
import math
import random
import sqlite3
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

from compose_synthetic_hebrew_v2_chirho import (
    strip_nikkud_chirho,
    consonants_only_chirho,
    sample_wlc_words_chirho,
    LETTER_CLASS_CHIRHO,
    TARGET_HEIGHT_CHIRHO,
    ASCENDER_H_CHIRHO,
    DESCENDER_H_CHIRHO,
    SHORT_BODY_FRAC_CHIRHO,
    GAP_RANGE_CHIRHO,
    LEFT_BEARING_CHIRHO,
    ROTATION_RANGE_CHIRHO,
    NOISE_STD_RANGE_CHIRHO,
    PAPER_TINT_RANGE_CHIRHO,
    PER_GLYPH_PAD_CHIRHO,
    PROGRESS_DB_CHIRHO,
)

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
FONT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-chirho"
OUT_DIR_CHIRHO = (
    PROJECT_ROOT_CHIRHO / "workspace-chirho" / "synthetic-chirho" / "hebrew-strokes-chirho"
)
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
# Sparse 3-4 pt splines: large independent per-point jitter MANGLES the
# letter (proven by no-wiggle vs wiggle A/B). Keep it a whisper — variety
# comes from rotation/scale/pen/noise/spacing, not shape deformation.
CTRL_JITTER_FRAC_CHIRHO = 0.004   # per-control-point wiggle (× glyph height) — truly subpixel
PEN_JITTER_CHIRHO = 0.018         # ± fraction on pen radius (gentle)
# ONE constant nib for every letter (a scribe used a single pen). Set from
# the median measured pen-fraction in load_stroke_font_chirho. Per-variant
# penFrac inflated yod (tiny source glyph) and varied tav — using one
# global nib fixes both.
GLOBAL_PEN_FRAC_CHIRHO = 0.085
# Slightly <1: yod/tav/tsadi all read a touch fat at 1.0 — trim the nib.
PEN_SCALE_CHIRHO = 0.90
SS_CHIRHO = 3  # supersample factor for real (area) antialiasing


def catmull_chirho(pts_chirho, samples_chirho=14):
    if len(pts_chirho) < 3:
        return [tuple(p_chirho) for p_chirho in pts_chirho]
    ext_chirho = [pts_chirho[0]] + list(pts_chirho) + [pts_chirho[-1]]
    out_chirho = []
    for i_chirho in range(1, len(ext_chirho) - 2):
        p0_chirho, p1_chirho = np.array(ext_chirho[i_chirho - 1]), np.array(ext_chirho[i_chirho])
        p2_chirho, p3_chirho = np.array(ext_chirho[i_chirho + 1]), np.array(ext_chirho[i_chirho + 2])
        for s_chirho in range(samples_chirho):
            t_chirho = s_chirho / samples_chirho
            t2_chirho, t3_chirho = t_chirho * t_chirho, t_chirho ** 3
            pt_chirho = 0.5 * (
                (2 * p1_chirho)
                + (-p0_chirho + p2_chirho) * t_chirho
                + (2 * p0_chirho - 5 * p1_chirho + 4 * p2_chirho - p3_chirho) * t2_chirho
                + (-p0_chirho + 3 * p1_chirho - 3 * p2_chirho + p3_chirho) * t3_chirho
            )
            out_chirho.append((float(pt_chirho[0]), float(pt_chirho[1])))
    out_chirho.append(tuple(map(float, pts_chirho[-1])))
    return out_chirho


def load_stroke_font_chirho():
    """letter -> list of {strokesUChirho:[[(u,v)..]..], penFracChirho, aspectChirho}
    in unit [0,1] coords. SAVED human exemplars only."""
    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    try:
        rows_chirho = conn_chirho.execute(
            "SELECT codepoint_chirho, filename_chirho, pen_radius_chirho, strokes_json_chirho "
            "FROM glyph_spines_chirho"
        ).fetchall()
    except sqlite3.OperationalError:
        return {}
    finally:
        conn_chirho.close()
    font_chirho = {}
    for cp_chirho, fn_chirho, pen_chirho, sj_chirho in rows_chirho:
        png_chirho = FONT_DIR_CHIRHO / f"U+{cp_chirho}" / fn_chirho
        if not png_chirho.exists():
            continue
        w_chirho, h_chirho = Image.open(png_chirho).size
        strokes_chirho = json.loads(sj_chirho)
        u_strokes_chirho = []
        for st_chirho in strokes_chirho:
            if len(st_chirho) < 2:
                continue
            u_strokes_chirho.append(
                [(px_chirho / max(1, w_chirho), py_chirho / max(1, h_chirho))
                 for px_chirho, py_chirho in st_chirho]
            )
        if not u_strokes_chirho:
            continue
        letter_chirho = chr(int(cp_chirho, 16))
        font_chirho.setdefault(letter_chirho, []).append({
            "strokesUChirho": u_strokes_chirho,
            "penFracChirho": pen_chirho / max(1, h_chirho),
            "aspectChirho": w_chirho / max(1, h_chirho),
            "nPtsChirho": sum(len(s_chirho) for s_chirho in u_strokes_chirho),
        })
    # Prefer the user's DELIBERATELY-REFINED saves: per letter keep only the
    # variant(s) with the fewest total control points (an unrefined auto-seed
    # saved by accident has many points and must not be sampled over a clean
    # hand-simplified one). If the user never refined a letter, its best
    # available (still the fewest) is used.
    for letter_chirho, variants_chirho in font_chirho.items():
        min_pts_chirho = min(v_chirho["nPtsChirho"] for v_chirho in variants_chirho)
        font_chirho[letter_chirho] = [
            v_chirho for v_chirho in variants_chirho
            if v_chirho["nPtsChirho"] <= min_pts_chirho + 1
        ]
    # ONE nib for the whole alphabet = median measured pen-fraction across
    # all kept variants (a single scribal pen, not per-letter).
    all_pf_chirho = [
        v_chirho["penFracChirho"]
        for vs_chirho in font_chirho.values() for v_chirho in vs_chirho
    ]
    if all_pf_chirho:
        global GLOBAL_PEN_FRAC_CHIRHO
        GLOBAL_PEN_FRAC_CHIRHO = float(np.median(all_pf_chirho))
    return font_chirho


def class_box_chirho(letter_chirho):
    """(target_height, y_offset) in the line box, by typographic class —
    same vertical model as the validated bitmap pipeline."""
    cls_chirho = LETTER_CLASS_CHIRHO.get(letter_chirho, "full")
    body_chirho = TARGET_HEIGHT_CHIRHO
    topline_chirho = ASCENDER_H_CHIRHO
    if cls_chirho == "ascender":
        return ASCENDER_H_CHIRHO + body_chirho, 0
    if cls_chirho == "short":
        return int(body_chirho * SHORT_BODY_FRAC_CHIRHO), topline_chirho
    if cls_chirho == "descender":
        return body_chirho + DESCENDER_H_CHIRHO, topline_chirho
    return body_chirho, topline_chirho


def render_glyph_ink_chirho(letter_chirho, variant_chirho):
    """Return (TIGHT ink_float 0..1, line_box_top_y). Stroked at SS×
    resolution (hard disc) then area-downsampled = true antialiasing. The
    returned ink is cropped to its bbox so layout advances by real glyph
    width (no injected padding)."""
    h_chirho, y_off_chirho = class_box_chirho(letter_chirho)
    w_chirho = max(4, int(round(h_chirho * variant_chirho["aspectChirho"])))
    # Constant nib: GLOBAL_PEN_FRAC × the BODY height (not per-variant penFrac
    # × class height — that inflated yod and varied tav/tsadi).
    pen_chirho = max(0.6, GLOBAL_PEN_FRAC_CHIRHO * TARGET_HEIGHT_CHIRHO * PEN_SCALE_CHIRHO
                     * random.uniform(1 - PEN_JITTER_CHIRHO, 1 + PEN_JITTER_CHIRHO))
    jit_chirho = CTRL_JITTER_FRAC_CHIRHO * h_chirho
    pad_chirho = pen_chirho + 1.0
    s_chirho = SS_CHIRHO
    hs_chirho = int(math.ceil(h_chirho + 2 * pad_chirho)) * s_chirho
    ws_chirho = int(math.ceil(w_chirho + 2 * pad_chirho)) * s_chirho
    mask_chirho = np.zeros((hs_chirho, ws_chirho), dtype=np.uint8)
    pr_chirho = pen_chirho * s_chirho
    pr2_chirho = pr_chirho * pr_chirho

    for stroke_u_chirho in variant_chirho["strokesUChirho"]:
        pts_chirho = [
            ((u_chirho * w_chirho + pad_chirho + random.gauss(0, jit_chirho)) * s_chirho,
             (v_chirho * h_chirho + pad_chirho + random.gauss(0, jit_chirho)) * s_chirho)
            for u_chirho, v_chirho in stroke_u_chirho
        ]
        for cx_chirho, cy_chirho in catmull_chirho(pts_chirho, 18):
            xa_chirho = max(0, int(cx_chirho - pr_chirho))
            xb_chirho = min(ws_chirho - 1, int(cx_chirho + pr_chirho))
            ya_chirho = max(0, int(cy_chirho - pr_chirho))
            yb_chirho = min(hs_chirho - 1, int(cy_chirho + pr_chirho))
            if xb_chirho < xa_chirho or yb_chirho < ya_chirho:
                continue
            ys_chirho, xs_chirho = np.ogrid[ya_chirho:yb_chirho + 1, xa_chirho:xb_chirho + 1]
            d2_chirho = (xs_chirho + 0.5 - cx_chirho) ** 2 + (ys_chirho + 0.5 - cy_chirho) ** 2
            mask_chirho[ya_chirho:yb_chirho + 1, xa_chirho:xb_chirho + 1] |= (d2_chirho <= pr2_chirho)

    hd_chirho, wd_chirho = hs_chirho // s_chirho, ws_chirho // s_chirho
    cov_chirho = (
        mask_chirho[: hd_chirho * s_chirho, : wd_chirho * s_chirho]
        .reshape(hd_chirho, s_chirho, wd_chirho, s_chirho)
        .mean(axis=(1, 3))
        .astype(np.float32)
    )
    ys_chirho, xs_chirho = np.where(cov_chirho > 0.03)
    if ys_chirho.size == 0:
        return np.zeros((1, 1), np.float32), int(round(y_off_chirho))
    y0_chirho, y1_chirho = int(ys_chirho.min()), int(ys_chirho.max()) + 1
    x0_chirho, x1_chirho = int(xs_chirho.min()), int(xs_chirho.max()) + 1
    tight_chirho = cov_chirho[y0_chirho:y1_chirho, x0_chirho:x1_chirho]
    # buffer row r ↔ line-box y = y_off + (r - pad); ink starts at row y0.
    top_line_chirho = int(round(y_off_chirho + (y0_chirho - pad_chirho)))
    return tight_chirho, top_line_chirho


def compose_word_chirho(consonants_chirho, font_chirho, glue_prob_chirho):
    line_box_chirho = ASCENDER_H_CHIRHO + TARGET_HEIGHT_CHIRHO + DESCENDER_H_CHIRHO
    pixel_order_chirho = consonants_chirho[::-1]
    glyphs_chirho = []
    for ch_chirho in pixel_order_chirho:
        variant_chirho = random.choice(font_chirho[ch_chirho])
        ink_chirho, y_off_chirho = render_glyph_ink_chirho(ch_chirho, variant_chirho)
        glyphs_chirho.append((ch_chirho, ink_chirho, y_off_chirho))

    x_chirho = PER_GLYPH_PAD_CHIRHO
    placed_chirho = []
    for i_chirho, (ch_chirho, ink_chirho, y_off_chirho) in enumerate(glyphs_chirho):
        placed_chirho.append((ink_chirho, x_chirho, y_off_chirho))
        x_chirho += ink_chirho.shape[1]
        if i_chirho < len(glyphs_chirho) - 1:
            this_yod_chirho = ch_chirho == "י"
            next_yod_chirho = glyphs_chirho[i_chirho + 1][0] == "י"
            if next_yod_chirho:
                gap_chirho = random.randint(-5, 1)
            elif this_yod_chirho:
                gap_chirho = random.randint(2, 4)
            elif random.random() < glue_prob_chirho:
                gap_chirho = random.randint(-4, -1)
            else:
                gap_chirho = random.randint(*GAP_RANGE_CHIRHO)
            gap_chirho += LEFT_BEARING_CHIRHO.get(glyphs_chirho[i_chirho + 1][0], 0)
            x_chirho += gap_chirho

    canvas_w_chirho = x_chirho + PER_GLYPH_PAD_CHIRHO
    canvas_h_chirho = line_box_chirho + PER_GLYPH_PAD_CHIRHO * 2
    paper_chirho = random.randint(*PAPER_TINT_RANGE_CHIRHO)
    acc_chirho = np.zeros((canvas_h_chirho, canvas_w_chirho), dtype=np.float32)
    for ink_chirho, gx_chirho, gy_chirho in placed_chirho:
        gh_chirho, gw_chirho = ink_chirho.shape
        py_chirho = gy_chirho + PER_GLYPH_PAD_CHIRHO
        y0_chirho = max(0, py_chirho)
        y1_chirho = min(canvas_h_chirho, py_chirho + gh_chirho)
        x0_chirho = max(0, gx_chirho)
        x1_chirho = min(canvas_w_chirho, gx_chirho + gw_chirho)
        if y1_chirho <= y0_chirho or x1_chirho <= x0_chirho:
            continue
        acc_chirho[y0_chirho:y1_chirho, x0_chirho:x1_chirho] += ink_chirho[
            y0_chirho - py_chirho:y1_chirho - py_chirho,
            x0_chirho - gx_chirho:x1_chirho - gx_chirho,
        ]
    arr_chirho = np.clip(paper_chirho - acc_chirho * 255.0, 0, 255).astype(np.uint8)
    img_chirho = Image.fromarray(arr_chirho, "L")
    img_chirho = img_chirho.rotate(
        random.uniform(*ROTATION_RANGE_CHIRHO), fillcolor=paper_chirho,
        resample=Image.BILINEAR, expand=False,
    )
    img_chirho = img_chirho.filter(ImageFilter.GaussianBlur(random.uniform(0.0, 0.4)))
    a_chirho = np.asarray(img_chirho, dtype=np.float32)
    a_chirho += np.random.normal(0, random.uniform(*NOISE_STD_RANGE_CHIRHO), a_chirho.shape)
    a_chirho = np.clip(a_chirho, 0, 255).astype(np.uint8)
    ys_chirho, xs_chirho = np.where(a_chirho < 200)
    if ys_chirho.size and xs_chirho.size:
        m_chirho = 3
        a_chirho = a_chirho[
            max(0, ys_chirho.min() - m_chirho):ys_chirho.max() + 1 + m_chirho,
            max(0, xs_chirho.min() - m_chirho):xs_chirho.max() + 1 + m_chirho,
        ]
    return Image.fromarray(a_chirho, "L")


def main_chirho():
    parser_chirho = argparse.ArgumentParser()
    parser_chirho.add_argument("--count", type=int, default=500)
    parser_chirho.add_argument("--glue-prob", type=float, default=0.35)
    parser_chirho.add_argument("--seed", type=int, default=42)
    args_chirho = parser_chirho.parse_args()
    random.seed(args_chirho.seed)
    np.random.seed(args_chirho.seed)

    font_chirho = load_stroke_font_chirho()
    if not font_chirho:
        print("No saved exemplars in glyph_spines_chirho. Save spines first.", file=sys.stderr)
        sys.exit(1)
    print(f"Stroke font from saved exemplars: {len(font_chirho)} letters")
    for ch_chirho in sorted(font_chirho):
        print(f"  {ch_chirho} U+{ord(ch_chirho):04X}: {len(font_chirho[ch_chirho])} variant(s)")

    words_chirho = sample_wlc_words_chirho(args_chirho.count, set(font_chirho.keys()))
    print(f"Sampled {len(words_chirho)} WLC words fully covered by the saved font")

    OUT_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)
    conn_chirho = sqlite3.connect(PROGRESS_DB_CHIRHO)
    conn_chirho.execute("PRAGMA foreign_keys = OFF")
    row_chirho = conn_chirho.execute(
        "SELECT MIN(word_id_chirho) FROM training_pairs_chirho WHERE source_chirho LIKE 'synthetic-%-chirho'"
    ).fetchone()
    next_id_chirho = -1 if row_chirho[0] is None else row_chirho[0] - 1

    ok_chirho = fail_chirho = 0
    for i_chirho, word_chirho in enumerate(words_chirho):
        try:
            img_chirho = compose_word_chirho(word_chirho, font_chirho, args_chirho.glue_prob)
        except Exception as e_chirho:
            fail_chirho += 1
            if fail_chirho <= 3:
                print(f"  fail {word_chirho!r}: {e_chirho}")
            continue
        out_chirho = OUT_DIR_CHIRHO / f"heb-strokes-{i_chirho:05d}-chirho.png"
        img_chirho.save(out_chirho, optimize=True)
        conn_chirho.execute(
            """INSERT OR IGNORE INTO training_pairs_chirho
                (word_id_chirho, scanline_id_chirho, page_id_chirho, vol_chirho, page_num_chirho,
                 line_idx_chirho, word_idx_chirho, x_min_chirho, y_min_chirho, x_max_chirho, y_max_chirho,
                 crop_path_chirho, text_chirho, script_chirho, source_chirho, certainty_chirho, tesseract_was_chirho)
               VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?, ?, 'hebrew-chirho', 'synthetic-hebrew-strokes-chirho', NULL, NULL)""",
            (next_id_chirho, img_chirho.width, img_chirho.height, str(out_chirho), word_chirho),
        )
        next_id_chirho -= 1
        ok_chirho += 1
        if (i_chirho + 1) % 100 == 0:
            conn_chirho.commit()
            print(f"  {i_chirho + 1}/{len(words_chirho)}")
    conn_chirho.commit()
    conn_chirho.close()
    print(f"done: {ok_chirho} composed, {fail_chirho} failed -> {OUT_DIR_CHIRHO}")


if __name__ == "__main__":
    main_chirho()
