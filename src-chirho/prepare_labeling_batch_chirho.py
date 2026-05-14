#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Build a batch of words for the active-labeling UI.

Picks N unlabeled words (those without a training_pairs_chirho row), crops
each from its page image, runs the v3 ONNX classifier to predict script,
and writes everything as a JSON manifest plus PNG crops under
workspace-chirho/labeling-batches-chirho/<run_id>/.

The Bun-side labeling server reads this directory.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/prepare_labeling_batch_chirho.py --count=200 --vol=1
"""

import argparse
import json
import os
import subprocess
import sqlite3
import sys
import time
from pathlib import Path

import onnxruntime as ort
from PIL import Image
import numpy as np

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
ONNX_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "models-chirho" / "script-classifier-v3-chirho.onnx"
BATCHES_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "labeling-batches-chirho"
IMAGES_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "images-chirho"

IMAGE_SIZE_CHIRHO = 32
CROP_PAD_PX_CHIRHO = 4
CLASS_NAMES_CHIRHO = ["latin", "hebrew", "greek", "symbol"]
SCRIPT_KEY_BY_CLASS_CHIRHO = ["latin-chirho", "hebrew-chirho", "greek-chirho", "symbol-chirho"]


def preprocess_chirho(img_path_chirho: str) -> np.ndarray:
    img_chirho = Image.open(img_path_chirho).convert("L")
    img_chirho = img_chirho.resize((IMAGE_SIZE_CHIRHO, IMAGE_SIZE_CHIRHO), Image.BILINEAR)
    arr_chirho = np.asarray(img_chirho, dtype=np.float32) / 255.0
    arr_chirho = (arr_chirho - 0.5) / 0.5
    return arr_chirho[np.newaxis, np.newaxis, :, :]


def softmax_chirho(logits_chirho: np.ndarray) -> np.ndarray:
    e_chirho = np.exp(logits_chirho - logits_chirho.max(axis=1, keepdims=True))
    return e_chirho / e_chirho.sum(axis=1, keepdims=True)


def main_chirho():
    parser_chirho = argparse.ArgumentParser()
    parser_chirho.add_argument("--count", type=int, default=200)
    parser_chirho.add_argument("--vol", type=int, default=None)
    parser_chirho.add_argument("--page", type=int, default=None)
    parser_chirho.add_argument("--unsure-only", action="store_true",
                               help="Only include words where top-1 confidence < 0.85 (most informative for labeling)")
    args_chirho = parser_chirho.parse_args()

    if not os.path.exists(ONNX_PATH_CHIRHO):
        print(f"Model not found at {ONNX_PATH_CHIRHO}", file=sys.stderr)
        sys.exit(1)

    sess_chirho = ort.InferenceSession(str(ONNX_PATH_CHIRHO))
    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)

    # Pull unlabeled words (those without a training_pairs_chirho row)
    where_chirho = []
    params_chirho = []
    if args_chirho.vol is not None:
        where_chirho.append("p.volume_number_chirho = ?")
        params_chirho.append(args_chirho.vol)
    if args_chirho.page is not None:
        where_chirho.append("p.page_number_chirho = ?")
        params_chirho.append(args_chirho.page)
    where_clause_chirho = (" AND " + " AND ".join(where_chirho)) if where_chirho else ""

    rows_chirho = conn_chirho.execute(
        f"""SELECT w.id_chirho, w.scanline_id_chirho, w.word_index_chirho,
                   w.x_min_chirho, w.y_min_chirho, w.x_max_chirho, w.y_max_chirho,
                   w.original_ocr_text_chirho, w.current_text_chirho,
                   p.id_chirho AS page_id, p.volume_number_chirho, p.page_number_chirho,
                   s.line_index_chirho
              FROM words_chirho w
              JOIN scanlines_chirho s ON s.id_chirho = w.scanline_id_chirho
              JOIN pages_chirho p ON p.id_chirho = s.page_id_chirho
              WHERE w.id_chirho NOT IN (SELECT word_id_chirho FROM training_pairs_chirho WHERE source_chirho IN ('canonical-recon-chirho','human-chirho'))
                {where_clause_chirho}
              ORDER BY p.volume_number_chirho, p.page_number_chirho, s.line_index_chirho, w.word_index_chirho""",
        params_chirho,
    ).fetchall()
    print(f"Found {len(rows_chirho)} candidate unlabeled words")

    if len(rows_chirho) == 0:
        print("No words to label!")
        sys.exit(0)

    run_id_chirho = f"batch-{int(time.time())}-chirho"
    out_dir_chirho = BATCHES_DIR_CHIRHO / run_id_chirho
    out_dir_chirho.mkdir(parents=True, exist_ok=True)

    items_chirho = []
    processed_chirho = 0
    skipped_chirho = 0

    for row_chirho in rows_chirho:
        if processed_chirho >= args_chirho.count:
            break
        (w_id_chirho, sl_id_chirho, w_idx_chirho, x_min_chirho, y_min_chirho,
         x_max_chirho, y_max_chirho, orig_chirho, curr_chirho,
         page_id_chirho, vol_chirho, page_num_chirho, line_idx_chirho) = row_chirho

        page_img_chirho = IMAGES_DIR_CHIRHO / f"vol-{vol_chirho}-chirho" / f"page-{page_num_chirho:04d}-chirho.png"
        if not page_img_chirho.exists():
            skipped_chirho += 1
            continue

        crop_name_chirho = f"word-{w_id_chirho}-chirho.png"
        crop_path_chirho = out_dir_chirho / crop_name_chirho
        x_chirho = max(0, x_min_chirho - CROP_PAD_PX_CHIRHO)
        y_chirho = max(0, y_min_chirho - CROP_PAD_PX_CHIRHO)
        w_chirho = (x_max_chirho - x_min_chirho) + CROP_PAD_PX_CHIRHO * 2
        h_chirho = (y_max_chirho - y_min_chirho) + CROP_PAD_PX_CHIRHO * 2
        subprocess.run([
            "magick", str(page_img_chirho),
            "-crop", f"{int(w_chirho)}x{int(h_chirho)}+{int(x_chirho)}+{int(y_chirho)}",
            "+repage", str(crop_path_chirho),
        ], check=True, capture_output=True)

        # Inference
        try:
            x_input_chirho = preprocess_chirho(str(crop_path_chirho))
        except Exception:
            skipped_chirho += 1
            continue
        logits_chirho = sess_chirho.run(None, {"input": x_input_chirho})[0]
        probs_chirho = softmax_chirho(logits_chirho)[0]
        top_class_chirho = int(np.argmax(probs_chirho))
        top_conf_chirho = float(probs_chirho[top_class_chirho])

        if args_chirho.unsure_only and top_conf_chirho >= 0.85:
            os.remove(crop_path_chirho)
            skipped_chirho += 1
            continue

        items_chirho.append({
            "wordIdChirho": w_id_chirho,
            "scanlineIdChirho": sl_id_chirho,
            "pageIdChirho": page_id_chirho,
            "volChirho": vol_chirho,
            "pageNumChirho": page_num_chirho,
            "lineIdxChirho": line_idx_chirho,
            "wordIdxChirho": w_idx_chirho,
            "bboxChirho": {
                "xMinChirho": x_min_chirho,
                "yMinChirho": y_min_chirho,
                "xMaxChirho": x_max_chirho,
                "yMaxChirho": y_max_chirho,
            },
            "cropFileChirho": crop_name_chirho,
            "tesseractTextChirho": curr_chirho or orig_chirho or "",
            "predictedClassChirho": CLASS_NAMES_CHIRHO[top_class_chirho],
            "predictedScriptChirho": SCRIPT_KEY_BY_CLASS_CHIRHO[top_class_chirho],
            "predictedConfidenceChirho": top_conf_chirho,
            "allProbsChirho": {CLASS_NAMES_CHIRHO[i_chirho]: float(probs_chirho[i_chirho]) for i_chirho in range(4)},
        })
        processed_chirho += 1
        if (processed_chirho % 50) == 0:
            print(f"  {processed_chirho} / {args_chirho.count}")

    manifest_chirho = {
        "runIdChirho": run_id_chirho,
        "modelChirho": "script-classifier-v3-chirho",
        "classNamesChirho": CLASS_NAMES_CHIRHO,
        "createdAtChirho": time.strftime("%Y-%m-%d %H:%M:%S"),
        "itemsChirho": items_chirho,
    }
    with open(out_dir_chirho / "manifest-chirho.json", "w") as f_chirho:
        json.dump(manifest_chirho, f_chirho, indent=2)
    print(f"wrote {len(items_chirho)} items to {out_dir_chirho}")
    print(f"skipped: {skipped_chirho}")
    conn_chirho.close()


if __name__ == "__main__":
    main_chirho()
