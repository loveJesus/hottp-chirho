#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
WLC-lexicon-constrained decoding for the CRNN word OCR, and a measurement
of whether it beats greedy CTC on the held-out gold split.

Greedy CTC picks the most likely char at each step independently; it can
emit a near-miss that is not a real word. Lexicon decoding instead scores
REAL WLC words by their CTC probability against the same logits and keeps
the best — snapping near-misses to the closest real word, and yielding a
principled score (the CTC log-prob of the best WLC word) that doubles as
(a) a confidence and (b) an OOV / non-Hebrew signal (a French crop has no
WLC word that fits its ink well, so its best-WLC score is poor).

Candidate set per crop = WLC words within edit-distance <= MAX_ED of the
greedy read (length-prefiltered), plus the greedy read itself. Each is
CTC-scored with torch's ctc_loss against the crop logits; lowest loss wins.

Reports, on the stable md5 held-out split: greedy exact vs lexicon exact,
and the best-WLC-score separation between real Hebrew (gold) crops and a
sample of French (tess-non-Hebrew) crops.

Run:
    PYTORCH_ENABLE_MPS_FALLBACK=1 \\
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/eval_lexicon_decode_chirho.py [--max-ed=2] [--n-french=120]
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
import torch
import torch.nn.functional as F

if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from train_word_ocr_chirho import (
    CRNNChirho, NUM_CLASSES_CHIRHO, MODEL_OUT_CHIRHO, CHAR_TO_IDX_CHIRHO,
    img_to_tensor_chirho, device_chirho, greedy_decode_chirho,
    load_wlc_vocab_chirho)
from eval_gold_set_chirho import fold_chirho, edit_dist_chirho

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
GOLD_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "gold-set-chirho"
CORPUS_DIR_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho"
                     / "hebrew-corpus-chirho")


def encode_visual_chirho(reading_chirho):
    """reading-order word -> CTC target indices in VISUAL order (reversed)."""
    return [CHAR_TO_IDX_CHIRHO[c_chirho] for c_chirho in reading_chirho[::-1]
            if c_chirho in CHAR_TO_IDX_CHIRHO]


def ctc_loss_for_targets_chirho(logp_chirho, targets_chirho, dev_chirho):
    """Score a list of candidate index-sequences against ONE crop's
    log-probs (T,C). Returns a numpy array of CTC losses (lower = better
    fit). Batches all candidates by repeating the logits."""
    t_chirho = logp_chirho.size(0)
    k_chirho = len(targets_chirho)
    lp_chirho = logp_chirho.unsqueeze(1).expand(t_chirho, k_chirho, -1)  # (T,K,C)
    flat_chirho = torch.cat([torch.tensor(c_chirho, dtype=torch.long)
                             for c_chirho in targets_chirho])
    tgt_lens_chirho = torch.tensor([len(c_chirho) for c_chirho in targets_chirho],
                                   dtype=torch.long)
    in_lens_chirho = torch.full((k_chirho,), t_chirho, dtype=torch.long)
    losses_chirho = F.ctc_loss(
        lp_chirho, flat_chirho, in_lens_chirho, tgt_lens_chirho,
        blank=0, reduction="none", zero_infinity=True)
    return losses_chirho.detach().cpu().numpy()


def main_chirho():
    ap_chirho = argparse.ArgumentParser()
    ap_chirho.add_argument("--max-ed", type=int, default=2, dest="max_ed_chirho")
    ap_chirho.add_argument("--max-cands", type=int, default=60,
                           dest="max_cands_chirho")
    ap_chirho.add_argument("--n-french", type=int, default=120,
                           dest="n_french_chirho")
    args_chirho = ap_chirho.parse_args()

    dev_chirho = device_chirho()
    ckpt_chirho = torch.load(MODEL_OUT_CHIRHO, map_location=dev_chirho)
    model_chirho = CRNNChirho(NUM_CLASSES_CHIRHO).to(dev_chirho)
    model_chirho.load_state_dict(ckpt_chirho["modelChirho"])
    model_chirho.train(False)

    vocab_chirho = load_wlc_vocab_chirho()
    by_len_chirho = {}
    for w_chirho in vocab_chirho:
        by_len_chirho.setdefault(len(w_chirho), []).append(w_chirho)
    print(f"WLC lexicon: {len(vocab_chirho)} words")

    man_chirho = json.loads(
        (GOLD_DIR_CHIRHO / "manifest-chirho.json").read_text())["goldChirho"]

    def is_test_chirho(rec_chirho):
        d_chirho = hashlib.md5(rec_chirho["cropChirho"].encode()).hexdigest()
        return (int(d_chirho[:6], 16) % 1000) / 1000.0 < 0.15
    test_chirho = [r_chirho for r_chirho in man_chirho if is_test_chirho(r_chirho)]

    def logp_for_crop_chirho(path_chirho):
        t_chirho = img_to_tensor_chirho(Image.open(path_chirho).convert("L"))
        if t_chirho is None:
            return None
        with torch.no_grad():
            logits_chirho = model_chirho(t_chirho.unsqueeze(0).to(dev_chirho))
        return logits_chirho[0].log_softmax(-1)            # (T,C)

    def lexicon_decode_chirho(logp_chirho, greedy_chirho):
        cands_chirho = {greedy_chirho}
        lo_chirho = max(1, len(greedy_chirho) - 1)
        for L_chirho in range(lo_chirho, len(greedy_chirho) + 2):
            for w_chirho in by_len_chirho.get(L_chirho, ()):
                if edit_dist_chirho(w_chirho, greedy_chirho) <= args_chirho.max_ed_chirho:
                    cands_chirho.add(w_chirho)
        cand_list_chirho = [c_chirho for c_chirho in cands_chirho
                            if encode_visual_chirho(c_chirho)][:args_chirho.max_cands_chirho]
        if not cand_list_chirho:
            return greedy_chirho, 99.0
        tgts_chirho = [encode_visual_chirho(c_chirho) for c_chirho in cand_list_chirho]
        losses_chirho = ctc_loss_for_targets_chirho(logp_chirho, tgts_chirho, dev_chirho)
        # CTC raw loss has a LENGTH BIAS (shorter targets align cheaper), so
        # raw argmin collapses to short words. Compare per-character loss
        # (length-normalised) — the fair score across different-length words.
        norm_chirho = losses_chirho / np.array([max(1, len(c_chirho))
                                                for c_chirho in cand_list_chirho])
        best_i_chirho = int(np.argmin(norm_chirho))
        return cand_list_chirho[best_i_chirho], float(norm_chirho[best_i_chirho])

    g_exact_chirho = lx_exact_chirho = n_chirho = 0
    g_ed_chirho = lx_ed_chirho = tot_len_chirho = 0
    heb_scores_chirho = []
    for rec_chirho in test_chirho:
        p_chirho = CORPUS_DIR_CHIRHO / rec_chirho["cropChirho"]
        if not p_chirho.exists():
            continue
        logp_chirho = logp_for_crop_chirho(p_chirho)
        if logp_chirho is None:
            continue
        gold_chirho = fold_chirho(rec_chirho["goldConsonantsChirho"])
        greedy_chirho = greedy_decode_chirho(logp_chirho.unsqueeze(0))[0]
        lex_chirho, score_chirho = lexicon_decode_chirho(logp_chirho, greedy_chirho)
        # per-char CTC score (length-normalised) for the is-Hebrew signal
        heb_scores_chirho.append(score_chirho / max(1, len(lex_chirho)))
        n_chirho += 1
        g_exact_chirho += (greedy_chirho == gold_chirho)
        lx_exact_chirho += (lex_chirho == gold_chirho)
        g_ed_chirho += edit_dist_chirho(greedy_chirho, gold_chirho)
        lx_ed_chirho += edit_dist_chirho(lex_chirho, gold_chirho)
        tot_len_chirho += len(gold_chirho)

    print(f"\n=== held-out gold (stable md5 test, n={n_chirho}) ===")
    print(f"  greedy   : exact {g_exact_chirho}/{n_chirho} = "
          f"{g_exact_chirho / max(1, n_chirho):.3f}   "
          f"char {1 - g_ed_chirho / max(1, tot_len_chirho):.3f}")
    print(f"  lexicon  : exact {lx_exact_chirho}/{n_chirho} = "
          f"{lx_exact_chirho / max(1, n_chirho):.3f}   "
          f"char {1 - lx_ed_chirho / max(1, tot_len_chirho):.3f}")

    # is-Hebrew/OOV signal: best-WLC per-char CTC score, Hebrew vs French
    gold_names_chirho = {r_chirho["cropChirho"] for r_chirho in man_chirho}
    corpus_chirho = json.loads(
        (CORPUS_DIR_CHIRHO / "manifest-chirho.json").read_text())
    french_chirho = [r_chirho for r_chirho in corpus_chirho
                     if r_chirho["cropChirho"] not in gold_names_chirho
                     and not any("א" <= c_chirho <= "ת"
                                 for c_chirho in (r_chirho.get("tessTextChirho") or ""))]
    import random as _rnd_chirho
    _rnd_chirho.Random(5).shuffle(french_chirho)
    fr_scores_chirho = []
    for rec_chirho in french_chirho[:args_chirho.n_french_chirho]:
        p_chirho = CORPUS_DIR_CHIRHO / rec_chirho["cropChirho"]
        if not p_chirho.exists():
            continue
        logp_chirho = logp_for_crop_chirho(p_chirho)
        if logp_chirho is None:
            continue
        greedy_chirho = greedy_decode_chirho(logp_chirho.unsqueeze(0))[0]
        _lex_chirho, score_chirho = lexicon_decode_chirho(logp_chirho, greedy_chirho)
        fr_scores_chirho.append(score_chirho / max(1, len(_lex_chirho)))
    print(f"\n=== best-WLC per-char CTC score (lower = better fit) "
          f"as an is-Hebrew/OOV signal ===")
    if heb_scores_chirho:
        print(f"  REAL Hebrew (gold test, n={len(heb_scores_chirho)}): "
              f"median {np.median(heb_scores_chirho):.3f}  "
              f"p90 {np.percentile(heb_scores_chirho, 90):.3f}")
    if fr_scores_chirho:
        print(f"  FRENCH (tess-non-Heb, n={len(fr_scores_chirho)}): "
              f"median {np.median(fr_scores_chirho):.3f}  "
              f"p10 {np.percentile(fr_scores_chirho, 10):.3f}")
        # a threshold at Hebrew p90 — how many French exceed it (separable)?
        if heb_scores_chirho:
            thr_chirho = float(np.percentile(heb_scores_chirho, 90))
            sep_chirho = float(np.mean([s_chirho > thr_chirho
                                        for s_chirho in fr_scores_chirho]))
            print(f"  French scoring WORSE than Hebrew-p90 ({thr_chirho:.3f}): "
                  f"{sep_chirho:.2f}  (higher = better is-Hebrew separation)")


if __name__ == "__main__":
    main_chirho()
