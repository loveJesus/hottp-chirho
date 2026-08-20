#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Production inference + automated validation for the CRNN word OCR.

Runs the trained model (crnn-chirho.pt) on UN-GOLD corpus crops — real
Barthélemy word images the model has NEVER seen and that are NOT in the
gold set — and measures, with NO human labels, how often the predicted
reading is a real WLC form (exact word / verse-substring). A high
WLC-plausibility rate on unseen crops is a clean production-accuracy
proxy and addresses the held-out-vocabulary caveat from training.

Also emits a per-word CONFIDENCE (mean max-softmax over emitted steps)
so we can see whether low confidence predicts non-WLC reads — the basis
for auto-routing uncertain words to the human review queue.

Run:
    PYTORCH_ENABLE_MPS_FALLBACK=1 \\
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/infer_word_ocr_chirho.py [--n=400]
"""
import argparse
import json
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image
import torch

if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from train_word_ocr_chirho import (
    CRNNChirho, IDX_TO_CHAR_CHIRHO, NUM_CLASSES_CHIRHO, MODEL_OUT_CHIRHO,
    img_to_tensor_chirho, device_chirho, collate_chirho, valid_timesteps_chirho,
    width_bucketed_batches_chirho)
from audit_canonical_recon_chirho import (
    load_wlc_validators_chirho, skeleton_in_wlc_chirho)

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
GOLD_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "gold-set-chirho"
CORPUS_DIR_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho"
                     / "hebrew-corpus-chirho")


def decode_with_conf_chirho(logits_chirho, widths_chirho=None):
    """(B,T,C) -> list of (reading_string, confidence). Confidence =
    mean max-softmax over the timesteps that EMIT a character.

    `widths_chirho` = true pre-padding pixel widths; without it a padded batch
    decodes across its widest member and reads become batch-size dependent
    (see greedy_decode_chirho)."""
    probs_chirho = logits_chirho.softmax(dim=2)
    maxp_chirho, idx_chirho = probs_chirho.max(dim=2)
    idx_np_chirho = idx_chirho.cpu().numpy()
    maxp_np_chirho = maxp_chirho.cpu().numpy()
    out_chirho = []
    for row_index_chirho, (row_chirho, pr_chirho) in enumerate(zip(idx_np_chirho, maxp_np_chirho)):
        if widths_chirho is not None:
            limit_chirho = valid_timesteps_chirho(widths_chirho[row_index_chirho])
            row_chirho, pr_chirho = row_chirho[:limit_chirho], pr_chirho[:limit_chirho]
        prev_chirho, chars_chirho, confs_chirho = 0, [], []
        for t_chirho, v_chirho in enumerate(row_chirho):
            if v_chirho != 0 and v_chirho != prev_chirho:
                chars_chirho.append(IDX_TO_CHAR_CHIRHO.get(int(v_chirho), ""))
                confs_chirho.append(float(pr_chirho[t_chirho]))
            prev_chirho = v_chirho
        visual_chirho = "".join(chars_chirho)
        conf_chirho = float(np.mean(confs_chirho)) if confs_chirho else 0.0
        out_chirho.append((visual_chirho[::-1], conf_chirho))
    return out_chirho


def main_chirho():
    ap_chirho = argparse.ArgumentParser()
    ap_chirho.add_argument("--n", type=int, default=400, dest="n_chirho")
    ap_chirho.add_argument("--show", type=int, default=24, dest="show_chirho")
    ap_chirho.add_argument("--save-pseudo", action="store_true",
                           dest="save_pseudo_chirho",
                           help="write high-confidence WLC-exact reads as "
                                "pseudo-gold (image,text) for self-training")
    ap_chirho.add_argument("--pseudo-conf", type=float, default=0.95,
                           dest="pseudo_conf_chirho",
                           help="min confidence for a pseudo-gold read")
    args_chirho = ap_chirho.parse_args()

    if not MODEL_OUT_CHIRHO.exists():
        print(f"no model at {MODEL_OUT_CHIRHO}; train first.")
        return
    dev_chirho = device_chirho()
    ckpt_chirho = torch.load(MODEL_OUT_CHIRHO, map_location=dev_chirho)
    model_chirho = CRNNChirho(NUM_CLASSES_CHIRHO).to(dev_chirho)
    model_chirho.load_state_dict(ckpt_chirho["modelChirho"])
    model_chirho.train(False)

    # un-gold corpus crops: every corpus png NOT in the gold set
    gold_names_chirho = {r_chirho["cropChirho"] for r_chirho in json.loads(
        (GOLD_DIR_CHIRHO / "manifest-chirho.json").read_text())["goldChirho"]}
    all_crops_chirho = [p_chirho for p_chirho in CORPUS_DIR_CHIRHO.glob("*.png")
                        if p_chirho.name not in gold_names_chirho]
    random.Random(17).shuffle(all_crops_chirho)
    sample_chirho = all_crops_chirho[:args_chirho.n_chirho]
    print(f"un-gold corpus crops: {len(all_crops_chirho)} available, "
          f"scoring {len(sample_chirho)}")

    word_skel_chirho, verse_blob_chirho = load_wlc_validators_chirho()

    preds_chirho = []      # (name, reading, conf, verdict)
    bs_chirho = 32
    tensors_chirho = [img_to_tensor_chirho(Image.open(p_chirho).convert("L"))
                      for p_chirho in sample_chirho]
    # Width-homogeneous batches only — mixed widths make a batched read differ
    # from the same crop read alone (see width_bucketed_batches_chirho).
    for group_chirho, batch_chirho in width_bucketed_batches_chirho(tensors_chirho, bs_chirho):
        chunk_chirho = [sample_chirho[i_chirho] for i_chirho in group_chirho]
        with torch.no_grad():
            logits_chirho = model_chirho(batch_chirho[0].to(dev_chirho), batch_chirho[3])
        for p_chirho, (reading_chirho, conf_chirho) in zip(
                chunk_chirho, decode_with_conf_chirho(logits_chirho, batch_chirho[3])):
            verdict_chirho, _ = skeleton_in_wlc_chirho(
                reading_chirho, word_skel_chirho, verse_blob_chirho)
            preds_chirho.append((p_chirho.name, reading_chirho,
                                 conf_chirho, verdict_chirho))

    n_chirho = len(preds_chirho)
    exact_chirho = sum(1 for _, _, _, v_chirho in preds_chirho
                       if v_chirho == "exact")
    substr_chirho = sum(1 for _, _, _, v_chirho in preds_chirho
                        if v_chirho == "substr")
    absent_chirho = n_chirho - exact_chirho - substr_chirho
    print("\n=== CRNN on UNSEEN un-gold corpus crops (no labels; "
          "WLC-membership = automated plausibility) ===")
    print(f"  n={n_chirho}")
    print(f"  WLC-exact word   : {exact_chirho}/{n_chirho} = "
          f"{exact_chirho / max(1, n_chirho):.3f}")
    print(f"  WLC-substr (verse): {substr_chirho}/{n_chirho} = "
          f"{substr_chirho / max(1, n_chirho):.3f}")
    print(f"  WLC-plausible total: {(exact_chirho + substr_chirho)}/{n_chirho}"
          f" = {(exact_chirho + substr_chirho) / max(1, n_chirho):.3f}")
    print(f"  ABSENT from WLC    : {absent_chirho}/{n_chirho} = "
          f"{absent_chirho / max(1, n_chirho):.3f} (model error OR a real "
          f"non-WLC token: abbreviation, variant, OOV)")

    # confidence separates plausible vs absent?
    plaus_conf_chirho = [c_chirho for _, _, c_chirho, v_chirho in preds_chirho
                         if v_chirho in ("exact", "substr")]
    absent_conf_chirho = [c_chirho for _, _, c_chirho, v_chirho in preds_chirho
                          if v_chirho == "ABSENT"]
    if plaus_conf_chirho and absent_conf_chirho:
        print(f"\n  mean confidence — WLC-plausible {np.mean(plaus_conf_chirho):.3f}"
              f"  vs  ABSENT {np.mean(absent_conf_chirho):.3f}  "
              f"(gap => confidence can gate the review queue)")

    print(f"\n  sample reads (conf | verdict | reading):")
    for name_chirho, reading_chirho, conf_chirho, verdict_chirho in \
            preds_chirho[:args_chirho.show_chirho]:
        print(f"    {conf_chirho:.2f}  {verdict_chirho:6}  {reading_chirho}")

    if args_chirho.save_pseudo_chirho:
        pseudo_chirho = [
            {"cropChirho": name_chirho, "goldConsonantsChirho": reading_chirho,
             "confChirho": round(conf_chirho, 4), "sourceChirho": "crnn-pseudo"}
            for name_chirho, reading_chirho, conf_chirho, verdict_chirho
            in preds_chirho
            if verdict_chirho == "exact"
            and conf_chirho >= args_chirho.pseudo_conf_chirho
            and len(reading_chirho) >= 2]
        out_chirho = (MODEL_OUT_CHIRHO.parent / "pseudo-gold-chirho.json")
        out_chirho.parent.mkdir(parents=True, exist_ok=True)
        out_chirho.write_text(json.dumps(
            {"pseudoGoldChirho": pseudo_chirho,
             "minConfChirho": args_chirho.pseudo_conf_chirho,
             "scoredChirho": n_chirho}, ensure_ascii=False, indent=2))
        print(f"\n  saved {len(pseudo_chirho)} pseudo-gold "
              f"(conf>={args_chirho.pseudo_conf_chirho}, WLC-exact, len>=2) "
              f"-> {out_chirho}")


if __name__ == "__main__":
    main_chirho()
