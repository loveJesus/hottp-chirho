#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Corpus triage with the CRNN word OCR — does TWO of the post-OCR levers
in one pass over the whole Hebrew-corpus:

  (1) BETTER is-Hebrew FILTER. The upstream v8 gate has poor precision
      (~85% of the un-gold residual is actually French/punctuation). A
      crop the CRNN reads as a high-confidence real WLC word IS Hebrew;
      one that reads ABSENT at low confidence is almost certainly not.
  (3) SILVER mint. High-confidence WLC-exact reads are auto-transcribed
      (crop, reading) pairs — a SILVER set for the digital edition and
      the review app. Kept STRICTLY SEPARATE from the WLC-verified gold
      eval anchor (minting gold from the model's own reads would be
      circular); silver is for the edition/app, not for honest eval.

Partitions every corpus crop into:
  AUTO   : conf >= AUTO_CONF and WLC-exact and len>=2  -> silver
  REVIEW : Hebrew-ish (WLC-substr, or tess has Hebrew chars) but not AUTO
  REJECT : ABSENT + low conf + tess non-Hebrew          -> contamination

Writes workspace-chirho/word-ocr-chirho/triage-chirho.json (partition +
per-crop record) and prints a summary.

Run:
    PYTORCH_ENABLE_MPS_FALLBACK=1 \\
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/triage_corpus_chirho.py [--auto-conf 0.90]
"""
import argparse
import json
import sys
from pathlib import Path

from PIL import Image
import torch

if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from train_word_ocr_chirho import (
    CRNNChirho, NUM_CLASSES_CHIRHO, MODEL_OUT_CHIRHO,
    img_to_tensor_chirho, device_chirho, collate_chirho)
from infer_word_ocr_chirho import decode_with_conf_chirho
from audit_canonical_recon_chirho import (
    load_wlc_validators_chirho, skeleton_in_wlc_chirho)

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
CORPUS_DIR_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho"
                     / "hebrew-corpus-chirho")
GOLD_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "gold-set-chirho"
OUT_PATH_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho" / "word-ocr-chirho"
                   / "triage-chirho.json")


def _tess_has_hebrew_chirho(text_chirho):
    return any("א" <= c_chirho <= "ת" for c_chirho in (text_chirho or ""))


def main_chirho():
    ap_chirho = argparse.ArgumentParser()
    ap_chirho.add_argument("--auto-conf", type=float, default=0.90,
                           dest="auto_conf_chirho")
    ap_chirho.add_argument("--reject-conf", type=float, default=0.80,
                           dest="reject_conf_chirho",
                           help="below this AND absent AND tess-non-Hebrew "
                                "-> REJECT as contamination")
    args_chirho = ap_chirho.parse_args()

    if not MODEL_OUT_CHIRHO.exists():
        print(f"no model at {MODEL_OUT_CHIRHO}; train first.")
        return
    dev_chirho = device_chirho()
    ckpt_chirho = torch.load(MODEL_OUT_CHIRHO, map_location=dev_chirho)
    model_chirho = CRNNChirho(NUM_CLASSES_CHIRHO).to(dev_chirho)
    model_chirho.load_state_dict(ckpt_chirho["modelChirho"])
    model_chirho.train(False)

    man_chirho = json.loads(
        (CORPUS_DIR_CHIRHO / "manifest-chirho.json").read_text())
    gold_names_chirho = {r_chirho["cropChirho"] for r_chirho in json.loads(
        (GOLD_DIR_CHIRHO / "manifest-chirho.json").read_text())["goldChirho"]}
    word_skel_chirho, verse_blob_chirho = load_wlc_validators_chirho()

    records_chirho = []
    bs_chirho = 64
    for i_chirho in range(0, len(man_chirho), bs_chirho):
        chunk_chirho = man_chirho[i_chirho:i_chirho + bs_chirho]
        items_chirho, metas_chirho = [], []
        for r_chirho in chunk_chirho:
            p_chirho = CORPUS_DIR_CHIRHO / r_chirho["cropChirho"]
            if not p_chirho.exists():
                continue
            t_chirho = img_to_tensor_chirho(Image.open(p_chirho).convert("L"))
            if t_chirho is None:
                continue
            items_chirho.append((t_chirho, [1]))
            metas_chirho.append(r_chirho)
        batch_chirho = collate_chirho(items_chirho)
        if batch_chirho is None:
            continue
        with torch.no_grad():
            logits_chirho = model_chirho(batch_chirho[0].to(dev_chirho))
        for r_chirho, (reading_chirho, conf_chirho) in zip(
                metas_chirho, decode_with_conf_chirho(logits_chirho)):
            verdict_chirho, _ = skeleton_in_wlc_chirho(
                reading_chirho, word_skel_chirho, verse_blob_chirho)
            tess_heb_chirho = _tess_has_hebrew_chirho(
                r_chirho.get("tessTextChirho", ""))
            if (conf_chirho >= args_chirho.auto_conf_chirho
                    and verdict_chirho == "exact" and len(reading_chirho) >= 2):
                bucket_chirho = "AUTO"
            elif (verdict_chirho == "ABSENT"
                  and conf_chirho < args_chirho.reject_conf_chirho
                  and not tess_heb_chirho):
                bucket_chirho = "REJECT"
            else:
                bucket_chirho = "REVIEW"
            records_chirho.append({
                "cropChirho": r_chirho["cropChirho"],
                "pageChirho": r_chirho.get("pageChirho"),
                "readingChirho": reading_chirho,
                "confChirho": round(conf_chirho, 4),
                "wlcVerdictChirho": verdict_chirho,
                "tessHebrewChirho": tess_heb_chirho,
                "bucketChirho": bucket_chirho,
                "inGoldChirho": r_chirho["cropChirho"] in gold_names_chirho,
            })

    n_chirho = len(records_chirho)
    buckets_chirho = {b_chirho: [r_chirho for r_chirho in records_chirho
                                 if r_chirho["bucketChirho"] == b_chirho]
                      for b_chirho in ("AUTO", "REVIEW", "REJECT")}
    OUT_PATH_CHIRHO.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH_CHIRHO.write_text(json.dumps({
        "autoConfChirho": args_chirho.auto_conf_chirho,
        "rejectConfChirho": args_chirho.reject_conf_chirho,
        "totalChirho": n_chirho,
        "countsChirho": {b_chirho: len(v_chirho)
                         for b_chirho, v_chirho in buckets_chirho.items()},
        "recordsChirho": records_chirho,
    }, ensure_ascii=False, indent=1))

    print(f"=== CRNN corpus triage (n={n_chirho}) ===")
    for b_chirho in ("AUTO", "REVIEW", "REJECT"):
        v_chirho = buckets_chirho[b_chirho]
        print(f"  {b_chirho:7}: {len(v_chirho):5}  "
              f"= {len(v_chirho) / max(1, n_chirho):.3f}")
    silver_chirho = buckets_chirho["AUTO"]
    silver_new_chirho = [r_chirho for r_chirho in silver_chirho
                         if not r_chirho["inGoldChirho"]]
    print(f"\n  SILVER (AUTO) total {len(silver_chirho)}; "
          f"NEW beyond gold: {len(silver_new_chirho)}  "
          f"(auto-transcribed words for the edition/app — NOT eval gold)")
    print(f"  is-Hebrew filter: AUTO+REVIEW = "
          f"{len(buckets_chirho['AUTO']) + len(buckets_chirho['REVIEW'])} "
          f"kept Hebrew-ish, REJECT = {len(buckets_chirho['REJECT'])} "
          f"dropped as contamination")
    print(f"\n  wrote {OUT_PATH_CHIRHO}")
    print("  sample AUTO (silver) reads:")
    for r_chirho in silver_new_chirho[:12]:
        print(f"    {r_chirho['confChirho']:.2f}  {r_chirho['readingChirho']:10}"
              f"  {r_chirho['cropChirho']}")


if __name__ == "__main__":
    main_chirho()
