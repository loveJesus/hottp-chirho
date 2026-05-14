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
ONNX_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "models-chirho" / "script-classifier-v6-chirho.onnx"
BATCHES_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "labeling-batches-chirho"
IMAGES_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "images-chirho"

IMAGE_SIZE_CHIRHO = 32
# Bumped from 4 to 8 — user reported single-letter crops were cutting off the
# right edge of glyphs (e.g. the "T" on line 36). Tesseract bboxes are tight on
# the ink; we need more pad room for ascenders/serifs at scan DPI.
CROP_PAD_PX_CHIRHO = 8
CLASS_NAMES_CHIRHO = ["latin", "hebrew", "greek", "symbol"]
SCRIPT_KEY_BY_CLASS_CHIRHO = ["latin-chirho", "hebrew-chirho", "greek-chirho", "symbol-chirho"]


def codepoint_class_chirho(text_chirho: str) -> int:
    """Same script-from-codepoints rule the editor uses. Returns -1 for empty
    or ambiguous text (no real script characters)."""
    if not text_chirho:
        return -1
    heb_chirho = grk_chirho = sym_chirho = lat_chirho = 0
    for ch_chirho in text_chirho:
        c_chirho = ord(ch_chirho)
        if 0x0590 <= c_chirho <= 0x05FF:
            heb_chirho += 1
        elif (0x0370 <= c_chirho <= 0x03FF) or (0x1F00 <= c_chirho <= 0x1FFF):
            grk_chirho += 1
        elif (0x0041 <= c_chirho <= 0x024F) or (0x1E00 <= c_chirho <= 0x1EFF):
            lat_chirho += 1
        elif c_chirho < 0x80:  # ascii punctuation/digits
            sym_chirho += 1
    total_real_chirho = heb_chirho + grk_chirho + lat_chirho
    if total_real_chirho == 0:
        return 3  # symbol (no letters, just punctuation/digits/control)
    if heb_chirho >= max(grk_chirho, lat_chirho):
        return 1
    if grk_chirho >= lat_chirho:
        return 2
    return 0


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
    parser_chirho.add_argument("--balanced", action="store_true",
                               help="Sample count/4 per predicted class so every script is represented in the batch")
    parser_chirho.add_argument("--exclude-latin", action="store_true",
                               help="Skip Latin predictions; focus on Hebrew/Greek/Symbol where labels are scarcer")
    parser_chirho.add_argument("--disagree-only", action="store_true",
                               help="Only include words where the CNN prediction disagrees with codepoint-detected script. These are the highest-information labels — confirms reveal whether the model was right despite contradicting OCR text, and rejections reveal model mistakes.")
    parser_chirho.add_argument("--only-script", type=str, default=None,
                               help="Only include predictions of this script (e.g. 'hebrew-chirho'). Useful for binary-validate workflows.")
    parser_chirho.add_argument("--script-min-prob", type=float, default=0.2,
                               help="Looser version of --only-script: include any word where p(target_script) >= threshold, even when argmax differs. Catches plausible candidates the strict classifier was on the fence about.")
    parser_chirho.add_argument("--model", type=str, default="script-classifier-v6-chirho",
                               help="ONNX model basename under workspace-chirho/models-chirho/")
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
    # If --balanced, track per-class count so we can stop when a class hits its quota.
    per_class_quota_chirho = args_chirho.count // 4 if args_chirho.balanced else None
    per_class_count_chirho = {0: 0, 1: 0, 2: 0, 3: 0}
    # Cache of already-generated line strip crops per scanline (avoid re-cropping
    # the same line for every word on that line). Also tracks the line bbox so
    # the UI can highlight which word within the line strip the cell refers to.
    line_crop_cache_chirho: dict = {}

    for row_chirho in rows_chirho:
        if processed_chirho >= args_chirho.count:
            break
        # Balanced mode: stop once all four classes filled, never overshoot one class.
        if args_chirho.balanced and all(per_class_count_chirho[c_chirho] >= per_class_quota_chirho for c_chirho in range(4)):
            break
        (w_id_chirho, sl_id_chirho, w_idx_chirho, x_min_chirho, y_min_chirho,
         x_max_chirho, y_max_chirho, orig_chirho, curr_chirho,
         page_id_chirho, vol_chirho, page_num_chirho, line_idx_chirho) = row_chirho

        page_img_chirho = IMAGES_DIR_CHIRHO / f"vol-{vol_chirho}-chirho" / f"page-{page_num_chirho:04d}-chirho.png"
        if not page_img_chirho.exists():
            skipped_chirho += 1
            continue

        # Generate a line strip crop for this scanline (once, cached). Used by
        # the labeling UI as a hover popup so the user can see context.
        if sl_id_chirho not in line_crop_cache_chirho:
            line_row_chirho = conn_chirho.execute(
                "SELECT x_min_chirho, y_min_chirho, width_chirho, height_chirho FROM scanlines_chirho WHERE id_chirho = ?",
                (sl_id_chirho,),
            ).fetchone()
            if line_row_chirho:
                lx_chirho, ly_chirho, lw_chirho, lh_chirho = line_row_chirho
                line_pad_chirho = 6
                lx_crop_chirho = max(0, lx_chirho - line_pad_chirho)
                ly_crop_chirho = max(0, ly_chirho - line_pad_chirho)
                lw_crop_chirho = lw_chirho + line_pad_chirho * 2
                lh_crop_chirho = lh_chirho + line_pad_chirho * 2
                line_name_chirho = f"line-{sl_id_chirho}-chirho.png"
                line_path_chirho = out_dir_chirho / line_name_chirho
                subprocess.run([
                    "magick", str(page_img_chirho),
                    "-crop", f"{int(lw_crop_chirho)}x{int(lh_crop_chirho)}+{int(lx_crop_chirho)}+{int(ly_crop_chirho)}",
                    "+repage", str(line_path_chirho),
                ], check=True, capture_output=True)
                line_crop_cache_chirho[sl_id_chirho] = {
                    "fileChirho": line_name_chirho,
                    "xMinChirho": lx_chirho,
                    "yMinChirho": ly_chirho,
                    "widthChirho": lw_chirho,
                    "heightChirho": lh_chirho,
                    "padChirho": line_pad_chirho,
                }
            else:
                line_crop_cache_chirho[sl_id_chirho] = None

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
        if args_chirho.exclude_latin and top_class_chirho == 0:
            os.remove(crop_path_chirho)
            skipped_chirho += 1
            continue
        if args_chirho.only_script:
            target_class_chirho = -1
            for ci_chirho, name_chirho in enumerate(SCRIPT_KEY_BY_CLASS_CHIRHO):
                if name_chirho == args_chirho.only_script:
                    target_class_chirho = ci_chirho
                    break
            target_prob_chirho = float(probs_chirho[target_class_chirho]) if target_class_chirho >= 0 else 0.0
            if target_prob_chirho < args_chirho.script_min_prob:
                os.remove(crop_path_chirho)
                skipped_chirho += 1
                continue
        if args_chirho.balanced and per_class_count_chirho[top_class_chirho] >= per_class_quota_chirho:
            os.remove(crop_path_chirho)
            skipped_chirho += 1
            continue
        # Codepoint-disagreement filter: high-info samples where the CNN and the
        # OCR text disagree on script. Cases where they agree are usually
        # already-obvious labels.
        cp_class_chirho = codepoint_class_chirho(curr_chirho or orig_chirho or "")
        if args_chirho.disagree_only and cp_class_chirho == top_class_chirho:
            os.remove(crop_path_chirho)
            skipped_chirho += 1
            continue
        per_class_count_chirho[top_class_chirho] += 1

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
            "codepointClassChirho": CLASS_NAMES_CHIRHO[cp_class_chirho] if cp_class_chirho >= 0 else "unknown",
            "codepointDisagreesChirho": cp_class_chirho != top_class_chirho and cp_class_chirho >= 0,
            "allProbsChirho": {CLASS_NAMES_CHIRHO[i_chirho]: float(probs_chirho[i_chirho]) for i_chirho in range(4)},
            "lineCropChirho": line_crop_cache_chirho.get(sl_id_chirho),
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
