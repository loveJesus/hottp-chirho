#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Recogniser-DRIVEN word reading (analysis-by-synthesis) — the converged
plan after every bottom-up segmentation rule was honestly shown to fail
on Barthelemy's ink-bridged Hebrew.

Idea: do NOT cut the word first. Slide the known letter ductus models
along the word ink RIGHT-TO-LEFT and DP-search the letter SEQUENCE whose
placed models best reconstruct the whole word. Segmentation is implicit
(the placement boundaries); touching letters and bigrams need no gap.
Adjacent placements may OVERLAP a few px so the connecting stroke is
shared by both letters ("the valley belongs to both glyphs").

Honest measurement: predicted consonant string vs the NON-circular WLC
gold set (finals folded to base, as the gold is). No fabrication; first
version is expected to be modest — reported as measured, then iterated.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 -u \\
        src-chirho/word_reader_chirho.py [--n=30] [--tier=STRICT]
"""
import json
import os
import sys
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image

import compose_synthetic_strokes_chirho as csyn_chirho
from branching_predictor_chirho import cull_marks_chirho
from eval_gold_set_chirho import fold_chirho, edit_dist_chirho
from recognize_realmatch_chirho import norm_ink_chirho, FONT_DIR_CHIRHO
from struct_features_chirho import (
    build_letter_templates_chirho, struct_cost_chirho)
from topology_features_chirho import (
    build_letter_templates_chirho as build_topo_templates_chirho,
    topo_cost_chirho)

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
GOLD_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "gold-set-chirho"
CORPUS_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "hebrew-corpus-chirho"
BAND_CHIRHO = 40                     # normalised word/letter band height
STEP_CHIRHO = 2                      # x discretisation
WIDTH_MULTS_CHIRHO = tuple(float(x_chirho) for x_chirho in os.environ.get(
    "WR_WIDTHS_CHIRHO", "0.72,0.88,1.0,1.15,1.32").split(","))
OVERLAP_CHIRHO = 3                   # shared connecting-ink px
LETTER_PENALTY_CHIRHO = float(os.environ.get("WR_LP_CHIRHO", "0.16"))
# Witness 2: image-IoU vs REAL bitmap-font-v3 exemplars — an INDEPENDENT
# signal from the synthetic ductus models (different error structure).
# ALPHA blends it per placement. Default 1.0 = the validated peak on the
# WLC gold n=120 (char 0.461, exact 14/120); synth_term lives in the DP
# for placement/segmentation but is fully out of identity cost. Lower
# values let synth back in for blend experiments.
ALPHA_REAL_CHIRHO = float(os.environ.get("WR_ALPHA_CHIRHO", "1.0"))
# Scale factor on synth_term so it lives on the same cost scale as
# real_term. Empirically synth-only costs ~2.5x real-only costs (same
# word, observed 2.76 vs 1.12). Per-letter alpha CANNOT blend two costs
# on different scales — low-alpha letters get systematically penalised
# regardless of identity. WR_SYNTH_SCALE_CHIRHO defaults to 1.0
# (back-compatible); set to ~0.40 for scale-normalised per-case blend.
SYNTH_SCALE_CHIRHO = float(os.environ.get("WR_SYNTH_SCALE_CHIRHO", "1.0"))
# PER-CASE (per-letter) witness weighting: data-driven override of the
# global ALPHA, calibrated by calibrate_per_letter_alpha_chirho.py from
# measured A/B per-letter accuracy on the WLC gold set.
#
# DEFAULT OFF (2026-05-19): the naive blend (1-alpha)*synth + alpha*real
# regressed char-acc 0.461 -> 0.213 at n=120 because synth_term and
# real_term live on DIFFERENT cost scales (synth ~0.5-1.0, real
# ~0.15-0.45). Letters with low alpha get systematically MORE EXPENSIVE
# regardless of identity, so the DP avoids them. The per-letter SIGNAL is
# real; the BLEND mechanic needs scale-normalization. Enable with
# WR_PER_LETTER_CHIRHO=1 once the scale fix lands.
_CALIB_PATH_CHIRHO = (Path(__file__).resolve().parent.parent
                      / "workspace-chirho" / "calibration-chirho"
                      / "per-letter-alpha-chirho.json")
_USE_PER_LETTER_CHIRHO = os.environ.get("WR_PER_LETTER_CHIRHO", "0") == "1"


def _load_per_letter_alpha_chirho():
    if not _USE_PER_LETTER_CHIRHO or not _CALIB_PATH_CHIRHO.exists():
        return {}
    try:
        obj_chirho = json.loads(_CALIB_PATH_CHIRHO.read_text())
        return {l_chirho: float(a_chirho)
                for l_chirho, a_chirho in
                obj_chirho.get("perLetterAlphaChirho", {}).items()}
    except (json.JSONDecodeError, ValueError, KeyError):
        return {}


PER_LETTER_ALPHA_CHIRHO = _load_per_letter_alpha_chirho()
# Witness 3: STRUCTURAL features (4x4 ink-density grid). Uncorrelated
# with image-IoU (real_term) because it looks at WHERE ink is at coarser
# granularity, not pixel-by-pixel coincidence. Templates built from the
# same bitmap-font-v3 corpus as real exemplars.
# BETA_STRUCT_CHIRHO blends as an ADDITIVE third term (does NOT change
# the alpha-blend between synth and real). Default 0.0 = OFF preserves
# the validated baseline 0.461 char / 14/120 exact on gold n=120.
BETA_STRUCT_CHIRHO = float(os.environ.get("WR_BETA_STRUCT_CHIRHO", "0.0"))
_STRUCT_TEMPLATES_CHIRHO = {}
# Witness 4: TARGETED TOPOLOGY features (hand-picked 7-d, z-scaled L1).
# After the 4x4 grid trade-offed exact for char without breaking the
# dominant ר→כ ×8 identity confusion, this set replaces generic shape
# with features chosen to ENCODE the visual differences between
# confusable pairs (bottom-left corner, top-left corner, bottom strip,
# left strip, hole count, ink-mean-x). Z-scaled per feature so dead
# constant features auto-drop. Validated at n=308 full STRICT: exact
# 25/308 (+1 vs baseline) and ר→כ ×13→×5 (-62%). Char ties baseline at
# scale; the n=120 +0.022 char gain was small-n optimism. The
# architecture thesis is validated — topology errors are decorrelated
# from pixel-IoU so the tie breaks. Default 0.5 = the new validated
# production peak. Set WR_GAMMA_TOPO_CHIRHO=0 to disable.
GAMMA_TOPO_CHIRHO = float(os.environ.get("WR_GAMMA_TOPO_CHIRHO", "0.5"))
_TOPO_TEMPLATES_CHIRHO = {}
FREQ_CHIRHO = {"י": .10, "ו": .095, "ה": .085, "ל": .07, "א": .065,
               "מ": .06, "ר": .055, "ב": .05, "ת": .05, "נ": .045,
               "ש": .04, "כ": .035, "ע": .03, "ד": .03, "ק": .025,
               "ח": .025, "פ": .02, "ס": .018, "ג": .016, "ז": .012,
               "ט": .01, "צ": .01}
FREQ_W_CHIRHO = 0.05


def load_letter_models_chirho():
    csyn_chirho.CTRL_JITTER_FRAC_CHIRHO = 0.0
    csyn_chirho.PEN_JITTER_CHIRHO = 0.0
    font_chirho = csyn_chirho.load_stroke_font_chirho()
    models_chirho = {}
    for letter_chirho, variants_chirho in font_chirho.items():
        f_letter_chirho = fold_chirho(letter_chirho)
        best_chirho = None
        for v_chirho in variants_chirho:
            ink_chirho, _ = csyn_chirho.render_glyph_ink_chirho(letter_chirho, v_chirho)
            if ink_chirho.size <= 1:
                continue
            bw_chirho = ink_chirho > 0.35
            ys_chirho, xs_chirho = np.where(bw_chirho)
            if ys_chirho.size == 0:
                continue
            t_chirho = bw_chirho[ys_chirho.min():ys_chirho.max() + 1,
                                 xs_chirho.min():xs_chirho.max() + 1]
            if best_chirho is None or t_chirho.sum() > best_chirho.sum():
                best_chirho = t_chirho
        if best_chirho is None:
            continue
        # keep the densest model per FOLDED letter (final<->base merge)
        if f_letter_chirho not in models_chirho or \
                best_chirho.sum() > models_chirho[f_letter_chirho].sum():
            models_chirho[f_letter_chirho] = best_chirho
    return models_chirho


def load_real_exemplars_chirho():
    """Folded letter -> list of 36x36 bool norm-ink real glyph crops
    (bitmap-font-v3). Independent witness from the synthetic models."""
    ex_chirho = {}
    for cp_dir_chirho in sorted(FONT_DIR_CHIRHO.glob("U+*")):
        letter_chirho = fold_chirho(chr(int(cp_dir_chirho.name[2:], 16)))
        for png_chirho in sorted(cp_dir_chirho.glob("*.png")):
            g_chirho = np.asarray(Image.open(png_chirho).convert("L"))
            ni_chirho = norm_ink_chirho(g_chirho)
            if ni_chirho is not None:
                ex_chirho.setdefault(letter_chirho, []).append(ni_chirho)
    return ex_chirho


_REAL_CHIRHO = {}


def _realmatch_cost_chirho(letter_chirho, span_bool_chirho):
    """min image mismatch of the span vs letter's REAL exemplars [0,1];
    neutral 0.5 when no exemplars (do not punish/credit blindly)."""
    exs_chirho = _REAL_CHIRHO.get(letter_chirho)
    if not exs_chirho or span_bool_chirho.sum() == 0:
        return 0.5
    g_chirho = np.where(span_bool_chirho, 0, 255).astype(np.uint8)
    ni_chirho = norm_ink_chirho(g_chirho)
    if ni_chirho is None:
        return 0.5
    return min(float((ni_chirho != e_chirho).mean()) for e_chirho in exs_chirho)


def normalise_word_chirho(gray_chirho):
    clean_chirho, _, _ = cull_marks_chirho(gray_chirho)
    ys_chirho, xs_chirho = np.where(clean_chirho)
    if xs_chirho.size == 0:
        return None
    sub_chirho = clean_chirho[ys_chirho.min():ys_chirho.max() + 1,
                              xs_chirho.min():xs_chirho.max() + 1]
    h_chirho, w_chirho = sub_chirho.shape
    nw_chirho = max(1, round(w_chirho * BAND_CHIRHO / h_chirho))
    im_chirho = Image.fromarray((sub_chirho * 255).astype(np.uint8)).resize(
        (nw_chirho, BAND_CHIRHO), Image.BILINEAR)
    return np.asarray(im_chirho) > 110


_MODELS_CHIRHO = {}


@lru_cache(maxsize=4096)
def _stamp_chirho(letter_chirho, w_chirho):
    m_chirho = _MODELS_CHIRHO[letter_chirho]
    im_chirho = Image.fromarray((m_chirho * 255).astype(np.uint8)).resize(
        (max(1, w_chirho), BAND_CHIRHO), Image.BILINEAR)
    return np.asarray(im_chirho) > 110


def read_word_chirho(wordbw_chirho, models_chirho, return_spans_chirho=False):
    """RTL DP analysis-by-synthesis. Returns (predicted_string, cost), or
    (predicted_string, cost, spans) when return_spans_chirho — spans is a
    list of (letter, a, x) placements in reading order (RTL), each the
    column window [a, x) of the normalised word the letter explains."""
    global _MODELS_CHIRHO
    _MODELS_CHIRHO = models_chirho
    w_total_chirho = wordbw_chirho.shape[1]
    nat_w_chirho = {c_chirho: max(6, round(m_chirho.shape[1]
                    * BAND_CHIRHO / m_chirho.shape[0]))
                    for c_chirho, m_chirho in models_chirho.items()}
    word_ink_chirho = wordbw_chirho.sum()

    import sys as _sys_chirho
    _sys_chirho.setrecursionlimit(10000)
    best_cache_chirho = {}

    def solve_chirho(x_chirho):
        # explain columns [0, x); RTL so x is the LEFT frontier moving left
        if x_chirho <= STEP_CHIRHO:
            return 0.0, []
        key_chirho = x_chirho
        if key_chirho in best_cache_chirho:
            return best_cache_chirho[key_chirho]
        best_chirho = (1e9, None)
        region_full_chirho = wordbw_chirho[:, :x_chirho]
        for c_chirho, m_chirho in models_chirho.items():
            for mult_chirho in WIDTH_MULTS_CHIRHO:
                wv_chirho = int(round(nat_w_chirho[c_chirho] * mult_chirho))
                if wv_chirho < 5 or wv_chirho > x_chirho + OVERLAP_CHIRHO:
                    continue
                a_chirho = max(0, x_chirho - wv_chirho)
                span_chirho = wordbw_chirho[:, a_chirho:x_chirho]
                if span_chirho.shape[1] < 4:
                    continue
                stamp_chirho = _stamp_chirho(c_chirho, span_chirho.shape[1])
                inter_chirho = np.logical_and(stamp_chirho, span_chirho).sum()
                union_chirho = np.logical_or(stamp_chirho, span_chirho).sum()
                if union_chirho == 0:
                    continue
                iou_chirho = inter_chirho / union_chirho
                # symmetric: penalise BOTH orphaned word-ink AND spurious
                # model-ink (no big-letter recall bias).
                span_ink_chirho = max(1, span_chirho.sum())
                stamp_ink_chirho = max(1, stamp_chirho.sum())
                miss_chirho = np.logical_and(span_chirho, ~stamp_chirho).sum() \
                    / span_ink_chirho
                spur_chirho = np.logical_and(stamp_chirho, ~span_chirho).sum() \
                    / stamp_ink_chirho
                synth_term_chirho = ((1.0 - iou_chirho)
                                     + 0.30 * miss_chirho
                                     + 0.30 * spur_chirho) \
                                    * SYNTH_SCALE_CHIRHO
                real_term_chirho = _realmatch_cost_chirho(c_chirho, span_chirho)
                # per-case witness weighting overrides the global ALPHA
                # when the calibration table covers this letter
                alpha_l_chirho = PER_LETTER_ALPHA_CHIRHO.get(
                    c_chirho, ALPHA_REAL_CHIRHO)
                local_chirho = (1.0 - alpha_l_chirho) * synth_term_chirho \
                    + alpha_l_chirho * real_term_chirho \
                    + LETTER_PENALTY_CHIRHO \
                    - FREQ_W_CHIRHO * FREQ_CHIRHO.get(c_chirho, 0.0)
                # third witness (structural / 4x4 ink-density grid):
                # additive, uncorrelated with image-IoU; gated OFF by
                # default (BETA=0) so baseline is preserved.
                if BETA_STRUCT_CHIRHO > 0.0 and _STRUCT_TEMPLATES_CHIRHO:
                    local_chirho += BETA_STRUCT_CHIRHO * struct_cost_chirho(
                        c_chirho, span_chirho, _STRUCT_TEMPLATES_CHIRHO)
                # fourth witness (targeted TOPOLOGY): hand-picked features
                # (bottom-left corner, hole count, ink mean-x, ...) z-scaled
                # so each contributes equally. Gated OFF by default.
                if GAMMA_TOPO_CHIRHO > 0.0 and _TOPO_TEMPLATES_CHIRHO:
                    local_chirho += GAMMA_TOPO_CHIRHO * topo_cost_chirho(
                        c_chirho, span_chirho, _TOPO_TEMPLATES_CHIRHO)
                nxt_chirho = a_chirho + OVERLAP_CHIRHO
                if nxt_chirho >= x_chirho:
                    nxt_chirho = a_chirho
                sub_cost_chirho, sub_path_chirho = solve_chirho(
                    (nxt_chirho // STEP_CHIRHO) * STEP_CHIRHO)
                tot_chirho = local_chirho + sub_cost_chirho
                if tot_chirho < best_chirho[0]:
                    best_chirho = (tot_chirho,
                                   [(c_chirho, a_chirho, x_chirho)]
                                   + sub_path_chirho)
        if best_chirho[1] is None:
            best_chirho = (2.0, [])
        best_cache_chirho[key_chirho] = best_chirho
        return best_chirho

    cost_chirho, path_chirho = solve_chirho(
        (w_total_chirho // STEP_CHIRHO) * STEP_CHIRHO)
    # solve() places the RIGHTMOST remaining letter first; in RTL Hebrew the
    # rightmost pixel IS the first letter, so path is ALREADY reading order.
    pred_chirho = "".join(t_chirho[0] for t_chirho in path_chirho)
    if return_spans_chirho:
        return pred_chirho, cost_chirho, path_chirho
    return pred_chirho, cost_chirho


def main_chirho():
    tier_chirho, n_lim_chirho = "STRICT", 30
    for a_chirho in sys.argv[1:]:
        if a_chirho.startswith("--tier="):
            tier_chirho = a_chirho.split("=", 1)[1].upper()
        if a_chirho.startswith("--n="):
            n_lim_chirho = int(a_chirho.split("=", 1)[1])
    global _REAL_CHIRHO, _STRUCT_TEMPLATES_CHIRHO, _TOPO_TEMPLATES_CHIRHO
    models_chirho = load_letter_models_chirho()
    _REAL_CHIRHO = load_real_exemplars_chirho()
    if BETA_STRUCT_CHIRHO > 0.0:
        _STRUCT_TEMPLATES_CHIRHO = build_letter_templates_chirho(_REAL_CHIRHO)
    if GAMMA_TOPO_CHIRHO > 0.0:
        _TOPO_TEMPLATES_CHIRHO = build_topo_templates_chirho(_REAL_CHIRHO)
    n_topo_chirho = sum(1 for k_chirho in _TOPO_TEMPLATES_CHIRHO
                        if not k_chirho.startswith("__"))
    print(f"letter models: {len(models_chirho)} -> {''.join(sorted(models_chirho))}")
    print(f"real-exemplar witness: {len(_REAL_CHIRHO)} letters, "
          f"{sum(len(v_chirho) for v_chirho in _REAL_CHIRHO.values())} crops"
          f"  | ALPHA_real(global)={ALPHA_REAL_CHIRHO}"
          f"  | per-letter alphas: {len(PER_LETTER_ALPHA_CHIRHO)}"
          f"{' (none loaded)' if not PER_LETTER_ALPHA_CHIRHO else ''}"
          f"  | BETA_struct={BETA_STRUCT_CHIRHO}"
          f" (templates {len(_STRUCT_TEMPLATES_CHIRHO)})"
          f"  | GAMMA_topo={GAMMA_TOPO_CHIRHO}"
          f" (templates {n_topo_chirho})")
    man_chirho = [m_chirho for m_chirho in json.loads(
        (GOLD_DIR_CHIRHO / "manifest-chirho.json").read_text())["goldChirho"]
        if tier_chirho == "ALL" or m_chirho["tierChirho"] == f"GOLD_{tier_chirho}"]
    man_chirho = man_chirho[:n_lim_chirho]

    from collections import Counter as _Cnt_chirho
    conf_chirho = _Cnt_chirho()          # (gold_letter, pred_letter) on len-match words
    per_letter_chirho = {}               # gold letter -> [correct, total] (len-match)
    exact_chirho = tot_ed_chirho = tot_len_chirho = 0
    for i_chirho, mrec_chirho in enumerate(man_chirho):
        p_chirho = CORPUS_DIR_CHIRHO / mrec_chirho["cropChirho"]
        if not p_chirho.exists():
            continue
        gray_chirho = np.asarray(Image.open(p_chirho).convert("L"))
        wb_chirho = normalise_word_chirho(gray_chirho)
        if wb_chirho is None:
            continue
        gold_chirho = fold_chirho(mrec_chirho["goldConsonantsChirho"])
        pred_chirho, cost_chirho = read_word_chirho(wb_chirho, models_chirho)
        ed_chirho = edit_dist_chirho(pred_chirho, gold_chirho)
        tot_ed_chirho += ed_chirho
        tot_len_chirho += len(gold_chirho)
        exact_chirho += (pred_chirho == gold_chirho)
        if len(pred_chirho) == len(gold_chirho):     # structure right: isolate identity slips
            for g_chirho, pr_chirho in zip(gold_chirho, pred_chirho):
                per_letter_chirho.setdefault(g_chirho, [0, 0])
                per_letter_chirho[g_chirho][1] += 1
                if g_chirho == pr_chirho:
                    per_letter_chirho[g_chirho][0] += 1
                else:
                    conf_chirho[(g_chirho, pr_chirho)] += 1
        if i_chirho < 12:
            ok_chirho = "OK" if pred_chirho == gold_chirho else f"ed{ed_chirho}"
            print(f"  gold={gold_chirho:<8} pred={pred_chirho:<10} "
                  f"[{ok_chirho}] cost={cost_chirho:.2f}")

    n_chirho = len(man_chirho)
    print("\n=== analysis-by-synthesis word reader · NON-circular gold ===")
    print(f"  whole-word exact : {exact_chirho}/{n_chirho} = "
          f"{exact_chirho / max(1, n_chirho):.3f}")
    print(f"  char accuracy    : "
          f"{1 - tot_ed_chirho / max(1, tot_len_chirho):.3f}  "
          f"(1 - edit/goldlen)")
    print("  anchors: bottom-up valley/proj on same data ~0.15-0.28 char, "
          "0 exact. Honest; iterate, do not over-claim.")
    lm_chirho = sum(v_chirho[1] for v_chirho in per_letter_chirho.values())
    print(f"\n  identity on STRUCTURE-correct (len-match) letters: "
          f"n={lm_chirho}")
    weak_chirho = sorted(((v_chirho[0] / v_chirho[1], g_chirho, v_chirho)
                          for g_chirho, v_chirho in per_letter_chirho.items()
                          if v_chirho[1] >= 2), key=lambda t_chirho: t_chirho[0])
    print("  weakest gold letters (acc · correct/total) — per-case targets:")
    for acc_chirho, g_chirho, v_chirho in weak_chirho[:10]:
        print(f"    {g_chirho}  {acc_chirho:.2f}  {v_chirho[0]}/{v_chirho[1]}")
    print("  top identity confusions (gold->pred):")
    for (g_chirho, pr_chirho), c_chirho in conf_chirho.most_common(10):
        print(f"    {g_chirho}->{pr_chirho} x{c_chirho}")


if __name__ == "__main__":
    main_chirho()
