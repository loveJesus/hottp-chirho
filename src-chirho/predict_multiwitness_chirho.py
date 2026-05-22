#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Multi-witness consensus predictor over the mined Hebrew corpus.

Per corpus word: segment into RTL connected components (glyph/bigram
units). Per component, three independent witnesses:
  W1 real→real exemplar match (recognize_realmatch core), candidate score
     down-weighted by 1−(that letter's LOO error) so historically-confused
     letters carry less authority ("weighted branching").
  W2 structural EXCLUSION gates (loop / components / descender) — hard
     veto, prunes the candidate set before W1 scores ("branching").
  W3 tesseract char at the aligned position (independent modality).
Consensus: AUTO-ACCEPT a component only if W1 not-excluded AND W1 margin
strong AND (W3 agrees OR W3 absent & margin very strong); else REVIEW.
Word is auto-accepted only if every component is.

Honest eval on the WLC-verified holdout (known consonant string):
precision@accept + coverage. Back-feed (round 2, accepted→exemplars) is
GATED on measured precision@accept >= BACKFEED_MIN — self-training below
that amplifies error; we measure before trusting.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/predict_multiwitness_chirho.py [--limit=N] [--backfeed]
"""
import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

from recognize_realmatch_chirho import (
    norm_ink_chirho, gate_info_chirho, excluded_chirho, NORM_CHIRHO,
)
from recognize_gbt_chirho import features_chirho
from audit_canonical_recon_chirho import (
    load_wlc_validators_chirho, skeleton_in_wlc_chirho, normalize_skeleton_chirho,
)

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
FONT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-chirho"
CORPUS_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "hebrew-corpus-chirho"
OUT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "multiwitness-chirho"
INK_THRESH_CHIRHO = 200
W1_MARGIN_CHIRHO = 0.10        # min (2nd-best − best) image distance gap
W1_STRONG_CHIRHO = 0.18        # margin to accept without W3 support
BACKFEED_MIN_CHIRHO = 0.97     # only self-train if precision@accept >= this


def load_exemplars_chirho():
    ex_chirho = []
    for cp_dir_chirho in sorted(FONT_DIR_CHIRHO.glob("U+*")):
        letter_chirho = chr(int(cp_dir_chirho.name[2:], 16))
        for png_chirho in sorted(cp_dir_chirho.glob("*.png")):
            g_chirho = np.asarray(Image.open(png_chirho).convert("L"))
            ni_chirho = norm_ink_chirho(g_chirho)
            fe_chirho = features_chirho(g_chirho)
            if ni_chirho is None or fe_chirho is None:
                continue
            ex_chirho.append({"letterChirho": letter_chirho, "imgChirho": ni_chirho,
                              "featChirho": fe_chirho})
    feats_chirho = np.stack([e_chirho["featChirho"] for e_chirho in ex_chirho])
    return ex_chirho, feats_chirho.std(axis=0) + 1e-6


def letter_reliability_chirho(ex_chirho, fstd_chirho):
    """Per-letter LOO accuracy → authority weight (cheap, ~n^2 over ~95)."""
    per_chirho = defaultdict(lambda: [0, 0])
    for i_chirho in range(len(ex_chirho)):
        gi_chirho = ex_chirho[i_chirho]
        best_j_chirho, best_d_chirho = -1, 1e18
        for j_chirho in range(len(ex_chirho)):
            if j_chirho == i_chirho:
                continue
            gj_chirho = ex_chirho[j_chirho]
            d_chirho = float((gi_chirho["imgChirho"] != gj_chirho["imgChirho"]).mean()) \
                + 0.25 * float(np.abs(
                    (gi_chirho["featChirho"] - gj_chirho["featChirho"]) / fstd_chirho).mean())
            if d_chirho < best_d_chirho:
                best_d_chirho, best_j_chirho = d_chirho, j_chirho
        t_chirho = gi_chirho["letterChirho"]
        per_chirho[t_chirho][1] += 1
        if ex_chirho[best_j_chirho]["letterChirho"] == t_chirho:
            per_chirho[t_chirho][0] += 1
    return {k_chirho: (v_chirho[0] / v_chirho[1] if v_chirho[1] else 0.5)
            for k_chirho, v_chirho in per_chirho.items()}


def components_rtl_chirho(gray_chirho):
    ink_chirho = gray_chirho < INK_THRESH_CHIRHO
    lab_chirho, n_chirho = ndimage.label(ink_chirho)
    comps_chirho = []
    for k_chirho in range(1, n_chirho + 1):
        ys_chirho, xs_chirho = np.where(lab_chirho == k_chirho)
        if ys_chirho.size < 12:
            continue
        comps_chirho.append((xs_chirho.mean(),
                             gray_chirho[ys_chirho.min():ys_chirho.max() + 1,
                                         xs_chirho.min():xs_chirho.max() + 1]))
    comps_chirho.sort(key=lambda c_chirho: -c_chirho[0])  # RTL: right first
    return [c_chirho[1] for c_chirho in comps_chirho]


def w1_predict_chirho(comp_gray_chirho, ex_chirho, fstd_chirho, rel_chirho):
    ni_chirho = norm_ink_chirho(comp_gray_chirho)
    fe_chirho = features_chirho(comp_gray_chirho)
    if ni_chirho is None or fe_chirho is None:
        return None
    gate_chirho = gate_info_chirho(comp_gray_chirho)
    scored_chirho = []
    for e_chirho in ex_chirho:
        if excluded_chirho(e_chirho["letterChirho"], gate_chirho):
            continue
        d_chirho = float((ni_chirho != e_chirho["imgChirho"]).mean()) \
            + 0.25 * float(np.abs((fe_chirho - e_chirho["featChirho"]) / fstd_chirho).mean())
        # weighted branching: penalise letters W1 is historically unreliable on
        d_chirho /= max(0.30, rel_chirho.get(e_chirho["letterChirho"], 0.5))
        scored_chirho.append((d_chirho, e_chirho["letterChirho"]))
    if not scored_chirho:
        return None
    scored_chirho.sort()
    best_chirho = scored_chirho[0]
    second_chirho = next((s_chirho for s_chirho in scored_chirho
                          if s_chirho[1] != best_chirho[1]), (best_chirho[0] + 1, "?"))
    return best_chirho[1], second_chirho[0] - best_chirho[0]


def main_chirho():
    ap_chirho = argparse.ArgumentParser()
    ap_chirho.add_argument("--limit", type=int, default=0)
    args_chirho = ap_chirho.parse_args()
    OUT_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)

    ex_chirho, fstd_chirho = load_exemplars_chirho()
    rel_chirho = letter_reliability_chirho(ex_chirho, fstd_chirho)
    print(f"{len(ex_chirho)} exemplars; per-letter authority computed "
          f"(min {min(rel_chirho.values()):.2f}, max {max(rel_chirho.values()):.2f})")

    wsk_chirho, vblob_chirho = load_wlc_validators_chirho()
    man_chirho = json.loads((CORPUS_DIR_CHIRHO / "manifest-chirho.json").read_text())
    if args_chirho.limit:
        man_chirho = man_chirho[: args_chirho.limit]

    results_chirho = []
    n_word_chirho = n_word_accept_chirho = 0
    holdout_total_chirho = holdout_accept_chirho = holdout_accept_correct_chirho = 0
    for m_chirho in man_chirho:
        crop_chirho = CORPUS_DIR_CHIRHO / m_chirho["cropChirho"]
        if not crop_chirho.exists():
            continue
        gray_chirho = np.asarray(Image.open(crop_chirho).convert("L"))
        comps_chirho = components_rtl_chirho(gray_chirho)
        if not comps_chirho:
            continue
        n_word_chirho += 1
        pred_chars_chirho, comp_conf_chirho, all_accept_chirho = [], [], True
        tess_chirho = normalize_skeleton_chirho(m_chirho.get("tessTextChirho", ""))
        for ci_chirho, cg_chirho in enumerate(comps_chirho):
            r1_chirho = w1_predict_chirho(cg_chirho, ex_chirho, fstd_chirho, rel_chirho)
            if r1_chirho is None:
                all_accept_chirho = False
                pred_chars_chirho.append("?")
                continue
            letter_chirho, margin_chirho = r1_chirho
            w3_chirho = (tess_chirho[ci_chirho] if ci_chirho < len(tess_chirho) else None)
            agree_chirho = (w3_chirho is not None and
                            normalize_skeleton_chirho(w3_chirho) == normalize_skeleton_chirho(letter_chirho))
            accept_chirho = (margin_chirho >= W1_MARGIN_CHIRHO and
                             (agree_chirho or margin_chirho >= W1_STRONG_CHIRHO))
            pred_chars_chirho.append(letter_chirho)
            comp_conf_chirho.append(round(margin_chirho, 3))
            if not accept_chirho:
                all_accept_chirho = False
        pred_word_chirho = "".join(pred_chars_chirho)
        if all_accept_chirho:
            n_word_accept_chirho += 1
        # honest holdout eval: words whose tesseract skeleton is WLC-verified
        v_chirho, sk_chirho = skeleton_in_wlc_chirho(
            m_chirho.get("tessTextChirho", ""), wsk_chirho, vblob_chirho)
        if v_chirho != "ABSENT" and sk_chirho:
            holdout_total_chirho += 1
            if all_accept_chirho:
                holdout_accept_chirho += 1
                if normalize_skeleton_chirho(pred_word_chirho) == sk_chirho:
                    holdout_accept_correct_chirho += 1
        results_chirho.append({
            "pageChirho": m_chirho["pageChirho"], "cropChirho": m_chirho["cropChirho"],
            "predChirho": pred_word_chirho, "tessChirho": m_chirho.get("tessTextChirho"),
            "acceptChirho": all_accept_chirho, "compConfChirho": comp_conf_chirho,
        })

    (OUT_DIR_CHIRHO / "predictions-chirho.json").write_text(
        json.dumps(results_chirho, ensure_ascii=False, indent=1))
    cov_chirho = n_word_accept_chirho / max(1, n_word_chirho)
    print(f"\nwords processed: {n_word_chirho}")
    print(f"  auto-accepted (all components consensus): {n_word_accept_chirho} "
          f"({cov_chirho:.1%} coverage) -> review queue: {n_word_chirho - n_word_accept_chirho}")
    if holdout_accept_chirho:
        prec_chirho = holdout_accept_correct_chirho / holdout_accept_chirho
        print(f"\nHONEST holdout (WLC-verified, n={holdout_total_chirho}):")
        print(f"  auto-accepted {holdout_accept_chirho}, exact-correct "
              f"{holdout_accept_correct_chirho}  → precision@accept = {prec_chirho:.3f}")
        print(f"  holdout coverage = {holdout_accept_chirho/max(1,holdout_total_chirho):.1%}")
        print(f"  back-feed gate: precision@accept {prec_chirho:.3f} "
              f"{'>=' if prec_chirho>=BACKFEED_MIN_CHIRHO else '<'} {BACKFEED_MIN_CHIRHO} "
              f"→ self-training {'SAFE' if prec_chirho>=BACKFEED_MIN_CHIRHO else 'UNSAFE (would amplify error)'}")
    else:
        print("\n(no WLC-verified holdout words in this slice — cannot certify precision)")
    print(f"\npredictions -> {OUT_DIR_CHIRHO}/predictions-chirho.json")


if __name__ == "__main__":
    main_chirho()
