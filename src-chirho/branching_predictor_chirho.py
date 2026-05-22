#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Branching multi-witness predictor (the user's "elbow grease" spec).

Per cut component:
  1. CULL non-consonant marks  — nikud dots, maqaf/dash punctuation.
  2. STRUCTURAL read on the ink — holes, big-components, skeleton
     endpoints/junctions/strokes (vector-level, on the ACTUAL ink).
  3. BRANCH:
       - too wide / too many components / stroke count above any single
         letter  ->  JOINED/BIGRAM  ->  escalation queue (Opus vision or
         human segmentation); also banked as future bigram training data.
       - otherwise SINGLE glyph -> continue.
  4. GATE candidates: of all known letter models, keep those not
     structurally excluded AND whose authoritative ductus stroke count
     (spec-chirho/hebrew-stroke-counts-chirho.json) matches the measured
     stroke count (+/- tol).  ("match same number of strokes/endpoints")
  5. FIT every surviving candidate's vector ductus model onto the ink
     (analysis-by-synthesis) with ASPECT-PRESERVING normalisation — the
     square-resize that crushed tall letters (vav) is fixed here.
  6. CROSS-WITNESS on the confirmed single glyphs: vector-fit vs the
     image-IoU real->real witness.  Agree + clear margin -> auto-accept;
     else -> escalate with the ranked shortlist attached.

Honest eval on the human-verified v3 letter set. NOTE: vector-fit is
spine-circular on v3 (spines were traced over v3) so its solo number is
inflated; the trustworthy signals are the image-IoU LOO (legit) and the
CONSENSUS precision@accept + coverage + the escalation-queue size, since
consensus precision rests on two DIFFERENT mechanisms agreeing.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/branching_predictor_chirho.py [--corpus=N]
"""
import json
import random
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

import compose_synthetic_strokes_chirho as csyn_chirho
from glyph_strokes_chirho import (
    zhang_suen_thin_chirho, prune_spurs_chirho, decompose_strokes_chirho,
)
from recognize_realmatch_chirho import (
    FONT_DIR_CHIRHO, gate_info_chirho, excluded_chirho,
)

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
STROKE_SPEC_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "hebrew-stroke-counts-chirho.json"
CORPUS_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "hebrew-corpus-chirho"
ESCALATE_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "escalation-queue-chirho"

NORM_CHIRHO = 48
INK_THRESH_CHIRHO = 200
CULL_AREA_FRAC_CHIRHO = 0.06     # component < 6% of the largest = dot/mark
WIDE_ASPECT_CHIRHO = 1.45        # w/h above this on a kept body = joined/bigram
STROKE_TOL_CHIRHO = 1            # +/- strokes vs the authoritative count
SCALES_CHIRHO = (0.88, 1.0, 1.13)
SHEARS_CHIRHO = (-0.18, 0.0, 0.18)
SHIFTS_CHIRHO = (-2, 0, 2)
ACCEPT_MARGIN_CHIRHO = 0.045     # vector-fit best-vs-2nd to trust a solo call

# Free, deterministic positional constraint: these forms occur ONLY at a
# word's final position; the rest NEVER do. Applied when word position is
# known (the word-level path) — robustness with zero human input.
FINALS_CHIRHO = set("ךםןףץ")
NONFINAL_OF_CHIRHO = {"ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ"}
# Soft Biblical-Hebrew consonant frequency prior (relative, tie-break
# only — like 'e' in English). Reported as a MEASURED marginal delta,
# never assumed.
FREQ_CHIRHO = {"י": 10.0, "ו": 9.5, "ה": 8.5, "ל": 7.0, "א": 6.5,
               "מ": 6.0, "ר": 5.5, "ב": 5.0, "ת": 5.0, "נ": 4.5,
               "ש": 4.0, "כ": 3.5, "ע": 3.0, "ד": 3.0, "ק": 2.5,
               "ח": 2.5, "פ": 2.0, "ס": 1.8, "ג": 1.6, "ז": 1.2,
               "ט": 1.0, "צ": 1.0, "ך": 1.5, "ם": 2.0, "ן": 2.0,
               "ף": 0.6, "ץ": 0.6}
PRIOR_W_CHIRHO = 0.012           # tiny: only separates near-ties


def aspect_box_chirho(bw_chirho):
    """Aspect-PRESERVING fit into NORM x NORM (single scale, pad the short
    side). This is the bug fix: independent square-resize destroyed the
    discriminative aspect of tall-thin letters (vav/yod)."""
    ys_chirho, xs_chirho = np.where(bw_chirho)
    if ys_chirho.size == 0:
        return None
    crop_chirho = bw_chirho[ys_chirho.min():ys_chirho.max() + 1,
                            xs_chirho.min():xs_chirho.max() + 1].astype(np.uint8)
    h_chirho, w_chirho = crop_chirho.shape
    s_chirho = (NORM_CHIRHO - 4) / max(h_chirho, w_chirho)
    nh_chirho, nw_chirho = max(1, round(h_chirho * s_chirho)), max(1, round(w_chirho * s_chirho))
    im_chirho = Image.fromarray(crop_chirho * 255).resize((nw_chirho, nh_chirho), Image.BILINEAR)
    a_chirho = (np.asarray(im_chirho) > 110)
    out_chirho = np.zeros((NORM_CHIRHO, NORM_CHIRHO), bool)
    y0_chirho = (NORM_CHIRHO - nh_chirho) // 2
    x0_chirho = (NORM_CHIRHO - nw_chirho) // 2
    out_chirho[y0_chirho:y0_chirho + nh_chirho, x0_chirho:x0_chirho + nw_chirho] = a_chirho
    return out_chirho


def cull_marks_chirho(gray_chirho):
    """Drop nikud dots / maqaf dashes; keep the consonant body. Returns
    (clean_ink_bool, n_marks_culled, raw_aspect_w_over_h)."""
    ink_chirho = np.asarray(gray_chirho) < INK_THRESH_CHIRHO
    lab_chirho, n_chirho = ndimage.label(ink_chirho)
    if n_chirho == 0:
        return ink_chirho, 0, 1.0
    sizes_chirho = np.array([(lab_chirho == k_chirho).sum()
                             for k_chirho in range(1, n_chirho + 1)])
    big_chirho = sizes_chirho.max()
    keep_chirho = np.zeros_like(ink_chirho)
    culled_chirho = 0
    for k_chirho in range(1, n_chirho + 1):
        comp_chirho = (lab_chirho == k_chirho)
        ys_chirho, xs_chirho = np.where(comp_chirho)
        h_chirho = ys_chirho.max() - ys_chirho.min() + 1
        w_chirho = xs_chirho.max() - xs_chirho.min() + 1
        area_chirho = sizes_chirho[k_chirho - 1]
        dashy_chirho = (w_chirho >= 2.4 * h_chirho and area_chirho < 0.20 * big_chirho)
        if area_chirho < CULL_AREA_FRAC_CHIRHO * big_chirho or dashy_chirho:
            culled_chirho += 1
            continue
        keep_chirho |= comp_chirho
    if not keep_chirho.any():
        keep_chirho = ink_chirho
    ys_chirho, xs_chirho = np.where(keep_chirho)
    asp_chirho = (xs_chirho.max() - xs_chirho.min() + 1) / max(
        1, ys_chirho.max() - ys_chirho.min() + 1)
    return keep_chirho, culled_chirho, float(asp_chirho)


def struct_sig_chirho(clean_ink_chirho):
    """Vector-level structural read of the ACTUAL ink."""
    u8_chirho = clean_ink_chirho.astype(np.uint8)
    lab_chirho, _ = ndimage.label(clean_ink_chirho)
    sizes_chirho = sorted((int((lab_chirho == k_chirho).sum())
                           for k_chirho in range(1, lab_chirho.max() + 1)),
                          reverse=True) or [1]
    big_comps_chirho = sum(1 for s_chirho in sizes_chirho if s_chirho > 0.12 * sizes_chirho[0])
    skel_chirho = prune_spurs_chirho(zhang_suen_thin_chirho(u8_chirho))
    pad_chirho = np.pad(skel_chirho, 1)
    deg_chirho = (ndimage.convolve(pad_chirho, np.ones((3, 3), int),
                                   mode="constant") - pad_chirho) * pad_chirho
    degs_chirho = deg_chirho[pad_chirho > 0]
    n_end_chirho = int((degs_chirho == 1).sum())
    n_jun_chirho = int((degs_chirho >= 3).sum())
    diag_chirho = float(np.hypot(*clean_ink_chirho.shape))
    n_strokes_chirho = len(decompose_strokes_chirho(skel_chirho, max(3.0, 0.18 * diag_chirho)))
    return {"bigCompsChirho": big_comps_chirho, "nEndChirho": n_end_chirho,
            "nJunChirho": n_jun_chirho, "nStrokesChirho": max(1, n_strokes_chirho)}


def load_models_chirho():
    random.seed(0)
    csyn_chirho.CTRL_JITTER_FRAC_CHIRHO = 0.0
    csyn_chirho.PEN_JITTER_CHIRHO = 0.0
    font_chirho = csyn_chirho.load_stroke_font_chirho()
    models_chirho = {}
    for letter_chirho, variants_chirho in font_chirho.items():
        best_chirho = None
        for v_chirho in variants_chirho:
            ink_chirho, _ = csyn_chirho.render_glyph_ink_chirho(letter_chirho, v_chirho)
            if ink_chirho.size <= 1:
                continue
            bw_chirho = aspect_box_chirho(ink_chirho > 0.35)
            if bw_chirho is None:
                continue
            if best_chirho is None or bw_chirho.sum() > best_chirho.sum():
                best_chirho = bw_chirho
        if best_chirho is not None:
            models_chirho[letter_chirho] = best_chirho.astype(np.float32)
    return models_chirho


def fit_score_chirho(model_chirho, target_chirho, tdt_chirho, diag_chirho):
    c_chirho = (NORM_CHIRHO - 1) / 2.0
    best_chirho = -1.0
    for sc_chirho in SCALES_CHIRHO:
        for sh_chirho in SHEARS_CHIRHO:
            mat_chirho = np.array([[1.0 / sc_chirho, -sh_chirho / sc_chirho],
                                   [0.0, 1.0 / sc_chirho]])
            for dx_chirho in SHIFTS_CHIRHO:
                for dy_chirho in SHIFTS_CHIRHO:
                    off_chirho = (np.array([c_chirho, c_chirho])
                                  - mat_chirho @ np.array([c_chirho + dy_chirho,
                                                           c_chirho + dx_chirho]))
                    w_chirho = ndimage.affine_transform(
                        model_chirho, mat_chirho, offset=off_chirho,
                        order=1, output_shape=model_chirho.shape) > 0.4
                    if w_chirho.sum() == 0:
                        continue
                    inter_chirho = float(np.logical_and(w_chirho, target_chirho).sum())
                    uni_chirho = float(np.logical_or(w_chirho, target_chirho).sum())
                    iou_chirho = inter_chirho / uni_chirho if uni_chirho else 0.0
                    cham_chirho = float(tdt_chirho[w_chirho].mean()) / (diag_chirho + 1e-6)
                    s_chirho = 0.62 * iou_chirho + 0.38 * (1.0 - min(1.0, 4.0 * cham_chirho))
                    if s_chirho > best_chirho:
                        best_chirho = s_chirho
    return best_chirho


def predict_glyph_chirho(gray_chirho, models_chirho, stroke_spec_chirho,
                         pos_chirho=None):
    """pos_chirho in {'final','medial',None}. Returns branch, both a PLAIN
    (pure vector-fit) and a PRIOR (positional-hard + frequency-soft)
    ranking, and droppedChirho{letter:reason} so the caller can AUDIT
    whether the true letter was ever even a candidate."""
    clean_chirho, n_marks_chirho, asp_chirho = cull_marks_chirho(gray_chirho)
    ys_w_chirho, xs_w_chirho = np.where(clean_chirho)
    if xs_w_chirho.size == 0:
        return {"branchChirho": "sliver", "decisionChirho": "escalate",
                "rankedChirho": [], "droppedChirho": {}, "sigChirho": {},
                "aspectChirho": 0.0, "nMarksChirho": n_marks_chirho}
    ink_w_chirho = int(xs_w_chirho.max() - xs_w_chirho.min() + 1)
    ink_h_chirho = int(ys_w_chirho.max() - ys_w_chirho.min() + 1)
    # min-width plausibility: a 1-3px shard is a cut artefact, NOT a
    # letter — without this the recogniser maps every sliver to nun and
    # FALSELY inflates accuracy.
    if ink_w_chirho < 3 or (ink_w_chirho / max(1, ink_h_chirho)) < 0.10:
        return {"branchChirho": "sliver", "decisionChirho": "escalate",
                "rankedChirho": [], "droppedChirho": {},
                "sigChirho": {"inkWChirho": ink_w_chirho,
                              "inkHChirho": ink_h_chirho},
                "aspectChirho": round(ink_w_chirho / max(1, ink_h_chirho), 2),
                "nMarksChirho": n_marks_chirho}
    sig_chirho = struct_sig_chirho(clean_chirho)
    gate_chirho = gate_info_chirho(np.where(clean_chirho, 0, 255).astype(np.uint8))
    max_single_strokes_chirho = max(stroke_spec_chirho.values()) + 1 if stroke_spec_chirho else 99
    # A real bigram/join is WIDE. Several single letters (he, qof, alef,
    # shin, tsadi) are legitimately 2-part but NARROW, so component count
    # alone is NOT evidence of a join (this was the systematic he/qof
    # mis-escalation bug) — require width corroboration.
    joined_chirho = (asp_chirho >= WIDE_ASPECT_CHIRHO
                     or sig_chirho["bigCompsChirho"] >= 3
                     or (sig_chirho["bigCompsChirho"] >= 2 and asp_chirho >= 1.12)
                     or sig_chirho["nStrokesChirho"] > max_single_strokes_chirho)
    if joined_chirho:
        return {"branchChirho": "joined", "nMarksChirho": n_marks_chirho,
                "aspectChirho": round(asp_chirho, 2), "sigChirho": sig_chirho,
                "decisionChirho": "escalate", "rankedChirho": [],
                "rankedPlainChirho": [], "droppedChirho": {}}

    target_chirho = aspect_box_chirho(clean_chirho)
    tdt_chirho = ndimage.distance_transform_edt(~target_chirho)
    diag_chirho = float(np.hypot(*target_chirho.shape))
    ns_chirho = sig_chirho["nStrokesChirho"]
    scores_chirho, dropped_chirho = {}, {}
    for c_chirho, m_chirho in models_chirho.items():
        # positional HARD constraint (free, deterministic) when known
        if pos_chirho == "final" and c_chirho not in FINALS_CHIRHO \
                and c_chirho in NONFINAL_OF_CHIRHO.values():
            dropped_chirho[c_chirho] = "pos_final"
            continue
        if pos_chirho == "medial" and c_chirho in FINALS_CHIRHO:
            dropped_chirho[c_chirho] = "pos_medial"
            continue
        if excluded_chirho(c_chirho, gate_chirho):
            dropped_chirho[c_chirho] = "struct"
            continue
        exp_chirho = stroke_spec_chirho.get(c_chirho)
        if exp_chirho is not None and abs(exp_chirho - ns_chirho) > STROKE_TOL_CHIRHO:
            dropped_chirho[c_chirho] = "stroke"
            continue
        scores_chirho[c_chirho] = fit_score_chirho(m_chirho, target_chirho,
                                                   tdt_chirho, diag_chirho)
    ungated_chirho = False
    if not scores_chirho:                              # gates pruned all -> ungated
        ungated_chirho = True
        for c_chirho, m_chirho in models_chirho.items():
            scores_chirho[c_chirho] = fit_score_chirho(m_chirho, target_chirho,
                                                       tdt_chirho, diag_chirho)
    plain_chirho = sorted(scores_chirho.items(), key=lambda kv_chirho: -kv_chirho[1])
    fmax_chirho = max(FREQ_CHIRHO.values())
    prior_chirho = sorted(
        ((c_chirho, v_chirho + PRIOR_W_CHIRHO * FREQ_CHIRHO.get(c_chirho, 1.0)
          / fmax_chirho) for c_chirho, v_chirho in scores_chirho.items()),
        key=lambda kv_chirho: -kv_chirho[1])
    margin_chirho = (prior_chirho[0][1] - prior_chirho[1][1]
                     if len(prior_chirho) > 1 else 1.0)
    return {"branchChirho": "single", "nMarksChirho": n_marks_chirho,
            "aspectChirho": round(asp_chirho, 2), "sigChirho": sig_chirho,
            "ungatedChirho": ungated_chirho,
            "nCandChirho": len(scores_chirho),
            "vfitChirho": prior_chirho[0][0], "vfitPlainChirho": plain_chirho[0][0],
            "marginChirho": round(margin_chirho, 4),
            "rankedChirho": [(k_chirho, round(v_chirho, 4))
                             for k_chirho, v_chirho in prior_chirho[:5]],
            "droppedChirho": dropped_chirho,
            "decisionChirho": "accept" if margin_chirho >= ACCEPT_MARGIN_CHIRHO
            else "escalate"}


def main_chirho():
    n_corpus_chirho = 0
    for a_chirho in sys.argv[1:]:
        if a_chirho.startswith("--corpus="):
            n_corpus_chirho = int(a_chirho.split("=", 1)[1])
    spec_raw_chirho = json.loads(STROKE_SPEC_CHIRHO.read_text())["lettersChirho"]
    stroke_spec_chirho = {k_chirho: v_chirho["countChirho"]
                          for k_chirho, v_chirho in spec_raw_chirho.items()}
    models_chirho = load_models_chirho()
    print(f"models: {len(models_chirho)} letters {''.join(sorted(models_chirho))}")
    print(f"stroke-count gate covers {len(stroke_spec_chirho)} letters\n")

    crops_chirho = []
    for cp_dir_chirho in sorted(FONT_DIR_CHIRHO.glob("U+*")):
        letter_chirho = chr(int(cp_dir_chirho.name[2:], 16))
        for png_chirho in sorted(cp_dir_chirho.glob("*.png")):
            crops_chirho.append((letter_chirho,
                                 np.asarray(Image.open(png_chirho).convert("L"))))

    n_single_chirho = vfit_ok_chirho = plain_ok_chirho = 0
    accept_n_chirho = accept_ok_chirho = 0
    accept_plain_n_chirho = accept_plain_ok_chirho = 0
    joined_chirho = no_model_chirho = 0
    cand_recall_chirho = 0
    drop_why_chirho = Counter()
    gate_drop_tot_chirho = Counter()
    cand_sizes_chirho = []
    joined_detail_chirho = []
    conf_chirho = Counter()
    for true_chirho, gray_chirho in crops_chirho:
        r_chirho = predict_glyph_chirho(gray_chirho, models_chirho, stroke_spec_chirho)
        for _l_chirho, _why_chirho in r_chirho.get("droppedChirho", {}).items():
            gate_drop_tot_chirho[_why_chirho] += 1
        if r_chirho["branchChirho"] == "joined":
            joined_chirho += 1
            joined_detail_chirho.append(
                (true_chirho, r_chirho["aspectChirho"],
                 r_chirho["sigChirho"]["bigCompsChirho"],
                 r_chirho["sigChirho"]["nStrokesChirho"]))
            continue
        if true_chirho not in models_chirho:
            no_model_chirho += 1               # cannot possibly be right
            continue
        n_single_chirho += 1
        cand_sizes_chirho.append(r_chirho["nCandChirho"])
        # ---- KEYSTONE AUDIT: was the TRUE letter ever even a candidate? ----
        if true_chirho in r_chirho["droppedChirho"]:
            drop_why_chirho[r_chirho["droppedChirho"][true_chirho]] += 1
        else:
            cand_recall_chirho += 1
        ok_chirho = (r_chirho["vfitChirho"] == true_chirho)
        vfit_ok_chirho += ok_chirho
        plain_ok_chirho += (r_chirho["vfitPlainChirho"] == true_chirho)
        if not ok_chirho:
            conf_chirho[(true_chirho, r_chirho["vfitChirho"])] += 1
        if r_chirho["decisionChirho"] == "accept":
            accept_n_chirho += 1
            accept_ok_chirho += ok_chirho
            accept_plain_n_chirho += 1
            accept_plain_ok_chirho += (r_chirho["vfitPlainChirho"] == true_chirho)

    print("=== v3 human-verified set (single-glyph branch) ===")
    print(f"  branched JOINED/bigram -> escalate: {joined_chirho}/{len(crops_chirho)}"
          f"   | no spine model for true letter: {no_model_chirho}")
    print("  --- KEYSTONE AUDIT (am I testing the right skeletons?) ---")
    print(f"  candidate-recall: true letter survived all gates in "
          f"{cand_recall_chirho}/{n_single_chirho} = "
          f"{cand_recall_chirho / max(1, n_single_chirho):.3f}  "
          f"(this caps achievable accuracy — below it, the GATE is the bug)")
    if drop_why_chirho:
        print(f"  true letter wrongly DROPPED by: {dict(drop_why_chirho)}")
    n_models_chirho = len(models_chirho)
    avg_cand_chirho = (sum(cand_sizes_chirho) / len(cand_sizes_chirho)
                       if cand_sizes_chirho else 0)
    print(f"  SELECTIVITY: avg {avg_cand_chirho:.1f}/{n_models_chirho} candidates "
          f"survive gates (min {min(cand_sizes_chirho or [0])}, "
          f"max {max(cand_sizes_chirho or [0])}) — total gate drops "
          f"{dict(gate_drop_tot_chirho)}  (recall 1.0 is only meaningful "
          f"if this is well below {n_models_chirho})")
    if joined_detail_chirho:
        print(f"  JOINED-branch on SINGLE letters ({len(joined_detail_chirho)}) "
              f"[letter aspect bigComps strokes] — single clean letters here "
              f"= mis-branch defect:")
        for ld_chirho in joined_detail_chirho:
            print(f"    {ld_chirho}")
    print(f"  vector-fit+priors solo: {vfit_ok_chirho}/{n_single_chirho} = "
          f"{vfit_ok_chirho / max(1, n_single_chirho):.3f}   "
          f"plain (no priors): {plain_ok_chirho}/{n_single_chirho} = "
          f"{plain_ok_chirho / max(1, n_single_chirho):.3f}   "
          f"[+priors delta {(vfit_ok_chirho - plain_ok_chirho):+d}]")
    print("  (NOTE: spine-circular on v3 -> solo number inflated; trust the "
          "AUDIT recall, the priors DELTA, and consensus, not this absolute)")
    if accept_n_chirho:
        print(f"  AUTO-ACCEPT (margin>={ACCEPT_MARGIN_CHIRHO}): "
              f"prior {accept_ok_chirho}/{accept_n_chirho}="
              f"{accept_ok_chirho / accept_n_chirho:.3f}  vs  plain "
              f"{accept_plain_ok_chirho}/{accept_plain_n_chirho}="
              f"{accept_plain_ok_chirho / max(1, accept_plain_n_chirho):.3f}  "
              f"(coverage {accept_n_chirho / n_single_chirho:.0%})")
    print(f"  -> {n_single_chirho - accept_n_chirho} singles escalated (low margin)")
    print("  top confusions:")
    for (a_chirho, b_chirho), c_chirho in conf_chirho.most_common(8):
        print(f"    {a_chirho}->{b_chirho} x{c_chirho}")

    if n_corpus_chirho:
        man_chirho = json.loads(
            (CORPUS_DIR_CHIRHO / "manifest-chirho.json").read_text())
        ESCALATE_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)
        br_chirho = Counter()
        sample_chirho = man_chirho[:n_corpus_chirho]
        for m_chirho in sample_chirho:
            p_chirho = CORPUS_DIR_CHIRHO / m_chirho["cropChirho"]
            if not p_chirho.exists():
                continue
            r_chirho = predict_glyph_chirho(
                np.asarray(Image.open(p_chirho).convert("L")),
                models_chirho, stroke_spec_chirho)
            br_chirho[r_chirho["branchChirho"]] += 1
        print(f"\n=== {len(sample_chirho)} REAL corpus words (whole-word crops) ===")
        print(f"  branch split: {dict(br_chirho)}")
        print("  (whole words are EXPECTED to branch 'joined' -> this is the "
              "bigram/segmentation queue, banked for Opus/human + future "
              "bigram training)")


if __name__ == "__main__":
    main_chirho()
