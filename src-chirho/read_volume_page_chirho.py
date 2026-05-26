#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Read EVERY word box of one volume/page with the production CRNN — a
generalization probe + the first stage of minting suggestions for a volume
that has no WLC alignment yet (vols 2-5).

Why this exists: vol-1 is the only WLC-aligned/graded volume, so the held-out
montage only proves the reader on vol-1's vocabulary/typeface. Barthelemy vols
2-5 share the typeface but the model has never seen those pages. Reading an
UNSEEN volume's page and montaging the WLC-plausible reads shows, with NO human
labels, whether the reader generalizes — and yields the exact crop+read pairs a
human reviewer would screen before they become app suggestions.

It crops word boxes straight from the locally re-rendered page (pdftoppm at the
same RENDER_DPI the segmentation used, so D1 boxes line up — verified by extent
check), runs the CRNN, scores each read for WLC-membership (the same automated
plausibility signal as triage_corpus_chirho.py), and writes:
  - <out-crops>/p{page:04d}-x{x}-y{y}-chirho.png   (one per word; montage-named)
  - <out-preds>                                     (predsChirho JSON for the montage)

Render + read + montage (fully local, no prod, no creds):
    bun src-chirho/render-pages-chirho.ts 2 148 148
    PYTORCH_ENABLE_MPS_FALLBACK=1 workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/read_volume_page_chirho.py --vol 2 --page 148 \\
        --image workspace-chirho/images-chirho/vol-2-chirho/page-0148-chirho.png \\
        --out-crops /tmp/vol2-p148-crops-chirho --out-preds /tmp/vol2-p148-preds-chirho.json
    workspace-chirho/classifier-venv-chirho/bin/python3 src-chirho/make_ocr_montage_chirho.py \\
        --kind heldout --corpus-dir /tmp/vol2-p148-crops-chirho \\
        --preds /tmp/vol2-p148-preds-chirho.json --out workspace-chirho/word-ocr-chirho/montage-vol2-p148-chirho.png
"""
import argparse
import json
import sqlite3
import sys
from pathlib import Path

import torch
from PIL import Image

if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from train_word_ocr_chirho import (
    CRNNChirho, NUM_CLASSES_CHIRHO, MODEL_OUT_CHIRHO,
    img_to_tensor_chirho, device_chirho, collate_chirho)
from infer_word_ocr_chirho import decode_with_conf_chirho
from audit_canonical_recon_chirho import (
    load_wlc_validators_chirho, skeleton_in_wlc_chirho)


def fetch_words_chirho(db_path_chirho, vol_chirho, page_chirho):
    """Word boxes for one volume/page, in reading order."""
    conn_chirho = sqlite3.connect(f"file:{db_path_chirho}?mode=ro", uri=True)
    try:
        rows_chirho = conn_chirho.execute(
            """
            SELECT w.id_chirho, w.x_min_chirho, w.y_min_chirho,
                   w.x_max_chirho, w.y_max_chirho
            FROM words_chirho w
            JOIN scanlines_chirho s ON s.id_chirho = w.scanline_id_chirho
            JOIN pages_chirho p ON p.id_chirho = s.page_id_chirho
            WHERE p.volume_number_chirho = ? AND p.page_number_chirho = ?
              AND w.x_min_chirho IS NOT NULL
            ORDER BY s.line_index_chirho, w.word_index_chirho
            """,
            (vol_chirho, page_chirho),
        ).fetchall()
    finally:
        conn_chirho.close()
    return rows_chirho


def main_chirho():
    ap_chirho = argparse.ArgumentParser()
    ap_chirho.add_argument("--vol", type=int, required=True, dest="vol_chirho")
    ap_chirho.add_argument("--page", type=int, required=True, dest="page_chirho")
    ap_chirho.add_argument("--image", required=True, dest="image_chirho")
    ap_chirho.add_argument("--db", dest="db_chirho", default=None,
                           help="local D1 sqlite (default: autodetect miniflare)")
    ap_chirho.add_argument("--out-crops", required=True, dest="out_crops_chirho")
    ap_chirho.add_argument("--out-preds", required=True, dest="out_preds_chirho")
    ap_chirho.add_argument("--auto-conf", type=float, default=0.90,
                           dest="auto_conf_chirho")
    args_chirho = ap_chirho.parse_args()

    db_path_chirho = args_chirho.db_chirho
    if not db_path_chirho:
        root_chirho = Path(__file__).resolve().parent.parent
        hits_chirho = list((root_chirho / "app-chirho" / ".wrangler" / "state"
                            / "v3" / "d1" / "miniflare-D1DatabaseObject").glob("*.sqlite"))
        if not hits_chirho:
            print("no local D1 sqlite found; pass --db")
            return
        db_path_chirho = str(hits_chirho[0])

    if not MODEL_OUT_CHIRHO.exists():
        print(f"no model at {MODEL_OUT_CHIRHO}; train first.")
        return
    dev_chirho = device_chirho()
    ckpt_chirho = torch.load(MODEL_OUT_CHIRHO, map_location=dev_chirho)
    model_chirho = CRNNChirho(NUM_CLASSES_CHIRHO).to(dev_chirho)
    model_chirho.load_state_dict(ckpt_chirho["modelChirho"])
    model_chirho.train(False)
    word_skel_chirho, verse_blob_chirho = load_wlc_validators_chirho()

    page_img_chirho = Image.open(args_chirho.image_chirho).convert("L")
    words_chirho = fetch_words_chirho(db_path_chirho, args_chirho.vol_chirho,
                                      args_chirho.page_chirho)
    print(f"vol-{args_chirho.vol_chirho} p{args_chirho.page_chirho}: "
          f"{len(words_chirho)} word boxes; image {page_img_chirho.size}")

    out_crops_chirho = Path(args_chirho.out_crops_chirho)
    out_crops_chirho.mkdir(parents=True, exist_ok=True)

    # crop every word, name it the way the montage + loader expect
    crops_chirho = []   # (crop_name, PIL_L_crop)
    for (_id_chirho, xmin_chirho, ymin_chirho,
         xmax_chirho, ymax_chirho) in words_chirho:
        box_chirho = (int(round(xmin_chirho)), int(round(ymin_chirho)),
                      int(round(xmax_chirho)), int(round(ymax_chirho)))
        if box_chirho[2] <= box_chirho[0] or box_chirho[3] <= box_chirho[1]:
            continue
        name_chirho = (f"p{args_chirho.page_chirho:04d}"
                       f"-x{box_chirho[0]}-y{box_chirho[1]}-chirho.png")
        crop_chirho = page_img_chirho.crop(box_chirho)
        crop_chirho.save(out_crops_chirho / name_chirho)
        crops_chirho.append((name_chirho, crop_chirho))

    # CRNN read + WLC verdict, batched
    preds_chirho = []   # (name, reading, conf, verdict)
    bs_chirho = 32
    for i_chirho in range(0, len(crops_chirho), bs_chirho):
        chunk_chirho = crops_chirho[i_chirho:i_chirho + bs_chirho]
        items_chirho = [(img_to_tensor_chirho(c_chirho), [1])
                        for _n_chirho, c_chirho in chunk_chirho]
        batch_chirho = collate_chirho(items_chirho)
        if batch_chirho is None:
            continue
        with torch.no_grad():
            logits_chirho = model_chirho(batch_chirho[0].to(dev_chirho))
        for (name_chirho, _c_chirho), (reading_chirho, conf_chirho) in zip(
                chunk_chirho, decode_with_conf_chirho(logits_chirho)):
            verdict_chirho, _ = skeleton_in_wlc_chirho(
                reading_chirho, word_skel_chirho, verse_blob_chirho)
            preds_chirho.append((name_chirho, reading_chirho,
                                 conf_chirho, verdict_chirho))

    n_chirho = len(preds_chirho)
    exact_chirho = [p_chirho for p_chirho in preds_chirho if p_chirho[3] == "exact"]
    substr_chirho = sum(1 for p_chirho in preds_chirho if p_chirho[3] == "substr")
    auto_chirho = [p_chirho for p_chirho in exact_chirho
                   if p_chirho[2] >= args_chirho.auto_conf_chirho
                   and len(p_chirho[1]) >= 2]
    print(f"  read {n_chirho} words | WLC-exact {len(exact_chirho)} "
          f"({len(exact_chirho)/max(1,n_chirho):.2f}) | substr {substr_chirho} | "
          f"AUTO (exact & conf>={args_chirho.auto_conf_chirho} & len>=2) "
          f"{len(auto_chirho)}")

    # montage the AUTO subset (what we'd surface) highest-confidence first;
    # silver-style: no gold (this volume has none), green = reads-as-WLC-word.
    auto_chirho.sort(key=lambda p_chirho: -p_chirho[2])
    recs_chirho = [{
        "cropChirho": name_chirho,
        "predChirho": reading_chirho,
        "goldChirho": None,
        "correctChirho": True,
        "confChirho": round(conf_chirho, 4),
        "verdictChirho": verdict_chirho,
    } for (name_chirho, reading_chirho, conf_chirho, verdict_chirho) in auto_chirho]
    Path(args_chirho.out_preds_chirho).write_text(
        json.dumps({"predsChirho": recs_chirho}, ensure_ascii=False))
    print(f"  wrote {len(recs_chirho)} AUTO preds -> {args_chirho.out_preds_chirho}")


if __name__ == "__main__":
    main_chirho()
