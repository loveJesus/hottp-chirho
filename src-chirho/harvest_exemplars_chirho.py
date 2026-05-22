#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Self-supervised CLEAN exemplar harvesting — strengthen the real-exemplar
witness for the starved confusable letters (ר/כ/ד/ג/ש/פ have only 1-2
clean crops in bitmap-font-v3) WITHOUT human labelling, using only the
WLC gold set.

Idea (no human involvement, per the project north star):
  1. Run the analysis-by-synthesis reader on the gold words.
  2. Keep only WHOLE-WORD-EXACT reads (text verified vs WLC) — so each
     placed letter span carries a TRUSTWORTHY label.
  3. CIRCULARITY-BREAKING QUALITY GATE: a harvested span only joins the
     pool if it INDEPENDENTLY matches its own label best (or top-2)
     among the clean v3 exemplars — i.e. it agrees with the reference
     set, not just with the reader's own guess.
  4. Write kept crops to a harvested dir; build a COMBINED dir (v3 +
     harvested) the witness can be pointed at via RM_FONT_DIR_CHIRHO.

Honesty: harvested-from words must be EXCLUDED from any eval set, or the
measurement is contaminated. We harvest from STRICT and the caller tests
on the held-out OK tier.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/harvest_exemplars_chirho.py [--tier=STRICT] [--n=308]
"""
import argparse
import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

import word_reader_chirho as wr_chirho  # noqa: E402
from recognize_realmatch_chirho import (norm_ink_chirho,  # noqa: E402
                                        FONT_DIR_CHIRHO)

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
GOLD_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "gold-set-chirho"
CORPUS_DIR_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho"
                     / "hebrew-corpus-chirho")
# base = whatever exemplar set the witness is CURRENTLY using (respects
# RM_FONT_DIR_CHIRHO), so successive harvest rounds ACCUMULATE.
V3_DIR_CHIRHO = FONT_DIR_CHIRHO
HARVEST_DIR_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho"
                      / "harvested-exemplars-chirho")
COMBINED_DIR_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho"
                       / "bitmap-font-v3-plus-harvest-chirho")
# unfold base letter -> the codepoint dir name we write into (always the
# BASE form; the witness folds finals to base anyway)
GATE_TOPK_CHIRHO = 2          # harvested crop label must rank within top-K
MIN_SPAN_W_CHIRHO = 6         # ignore degenerate sliver spans


def _cp_name_chirho(letter_chirho):
    return f"U+{ord(letter_chirho):04X}"


def _match_rank_chirho(crop_bool_chirho, label_chirho, real_exemplars_chirho):
    """Rank of label among letters by min image mismatch vs v3 exemplars
    (0 = best). Returns (rank, best_letter)."""
    gray_chirho = np.where(crop_bool_chirho, 0, 255).astype(np.uint8)
    ni_chirho = norm_ink_chirho(gray_chirho)
    if ni_chirho is None:
        return 99, None
    costs_chirho = []
    for l_chirho, exs_chirho in real_exemplars_chirho.items():
        if not exs_chirho:
            continue
        d_chirho = min(float((ni_chirho != e_chirho).mean())
                       for e_chirho in exs_chirho)
        costs_chirho.append((d_chirho, l_chirho))
    costs_chirho.sort()
    order_chirho = [l_chirho for _, l_chirho in costs_chirho]
    if label_chirho not in order_chirho:
        return 99, (order_chirho[0] if order_chirho else None)
    return order_chirho.index(label_chirho), order_chirho[0]


def main_chirho():
    global COMBINED_DIR_CHIRHO
    ap_chirho = argparse.ArgumentParser()
    ap_chirho.add_argument("--tier", default="STRICT", dest="tier_chirho")
    ap_chirho.add_argument("--n", type=int, default=308, dest="n_chirho")
    ap_chirho.add_argument("--out-dir", default=str(COMBINED_DIR_CHIRHO),
                           dest="out_dir_chirho",
                           help="combined-set output dir (base is the "
                                "current RM_FONT_DIR witness, so rounds "
                                "accumulate)")
    args_chirho = ap_chirho.parse_args()
    COMBINED_DIR_CHIRHO = Path(args_chirho.out_dir_chirho)

    models_chirho = wr_chirho.load_letter_models_chirho()
    wr_chirho._REAL_CHIRHO = wr_chirho.load_real_exemplars_chirho()
    if wr_chirho.GAMMA_TOPO_CHIRHO > 0.0:
        wr_chirho._TOPO_TEMPLATES_CHIRHO = \
            wr_chirho.build_topo_templates_chirho(wr_chirho._REAL_CHIRHO)
    real_ref_chirho = wr_chirho._REAL_CHIRHO   # the clean v3 reference

    man_chirho = [m_chirho for m_chirho in json.loads(
        (GOLD_DIR_CHIRHO / "manifest-chirho.json").read_text())["goldChirho"]
        if args_chirho.tier_chirho == "ALL"
        or m_chirho["tierChirho"] == f"GOLD_{args_chirho.tier_chirho}"]
    man_chirho = man_chirho[:args_chirho.n_chirho]

    n_exact_chirho = 0
    kept_chirho = {}        # letter -> list of crop bool
    gated_out_chirho = 0
    considered_chirho = 0
    for mrec_chirho in man_chirho:
        p_chirho = CORPUS_DIR_CHIRHO / mrec_chirho["cropChirho"]
        if not p_chirho.exists():
            continue
        gray_chirho = np.asarray(Image.open(p_chirho).convert("L"))
        wb_chirho = wr_chirho.normalise_word_chirho(gray_chirho)
        if wb_chirho is None:
            continue
        gold_chirho = wr_chirho.fold_chirho(mrec_chirho["goldConsonantsChirho"])
        pred_chirho, _, spans_chirho = wr_chirho.read_word_chirho(
            wb_chirho, models_chirho, return_spans_chirho=True)
        if pred_chirho != gold_chirho:
            continue
        n_exact_chirho += 1
        # exact-match word: each placed span is a WLC-verified labelled crop
        for letter_chirho, a_chirho, x_chirho in spans_chirho:
            if x_chirho - a_chirho < MIN_SPAN_W_CHIRHO:
                continue
            span_chirho = wb_chirho[:, a_chirho:x_chirho]
            if span_chirho.sum() < 8:
                continue
            considered_chirho += 1
            # tighten the crop to its own ink bbox (a clean single-glyph crop)
            ys_chirho, xs_chirho = np.where(span_chirho)
            tight_chirho = span_chirho[ys_chirho.min():ys_chirho.max() + 1,
                                       xs_chirho.min():xs_chirho.max() + 1]
            rank_chirho, best_chirho = _match_rank_chirho(
                tight_chirho, letter_chirho, real_ref_chirho)
            if rank_chirho < GATE_TOPK_CHIRHO:
                kept_chirho.setdefault(letter_chirho, []).append(tight_chirho)
            else:
                gated_out_chirho += 1

    print(f"tier={args_chirho.tier_chirho} words={len(man_chirho)} "
          f"exact-match={n_exact_chirho}")
    print(f"spans considered={considered_chirho}  "
          f"kept={sum(len(v_chirho) for v_chirho in kept_chirho.values())}  "
          f"gated-out(noisy)={gated_out_chirho}")
    print("\nharvested clean exemplars per letter:")
    for l_chirho in sorted(kept_chirho):
        v3n_chirho = len(real_ref_chirho.get(l_chirho, []))
        print(f"  {l_chirho}: +{len(kept_chirho[l_chirho])}  (v3 had {v3n_chirho})")

    # write harvested crops + a combined dir (v3 copied, harvested appended)
    if HARVEST_DIR_CHIRHO.exists():
        shutil.rmtree(HARVEST_DIR_CHIRHO)
    if COMBINED_DIR_CHIRHO.exists():
        shutil.rmtree(COMBINED_DIR_CHIRHO)
    shutil.copytree(V3_DIR_CHIRHO, COMBINED_DIR_CHIRHO)
    n_written_chirho = 0
    for letter_chirho, crops_chirho in kept_chirho.items():
        cp_chirho = _cp_name_chirho(letter_chirho)
        hdir_chirho = HARVEST_DIR_CHIRHO / cp_chirho
        cdir_chirho = COMBINED_DIR_CHIRHO / cp_chirho
        hdir_chirho.mkdir(parents=True, exist_ok=True)
        cdir_chirho.mkdir(parents=True, exist_ok=True)
        for i_chirho, crop_chirho in enumerate(crops_chirho):
            img_chirho = Image.fromarray(
                np.where(crop_chirho, 0, 255).astype(np.uint8))
            fn_chirho = f"harvest-{i_chirho:03d}-chirho.png"
            img_chirho.save(hdir_chirho / fn_chirho)
            img_chirho.save(cdir_chirho / fn_chirho)
            n_written_chirho += 1
    print(f"\nwrote {n_written_chirho} harvested crops -> {HARVEST_DIR_CHIRHO}")
    print(f"combined set -> {COMBINED_DIR_CHIRHO}")
    print(f"test it: RM_FONT_DIR_CHIRHO={COMBINED_DIR_CHIRHO} "
          f"on the held-out OK tier")


if __name__ == "__main__":
    main_chirho()
