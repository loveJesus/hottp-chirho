#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Honest real-world validation of the script classifier.

Runs the trained ONNX model against ONLY the real-scan training pairs
(source IN canonical-recon / opus-vision / human), reporting per-class
accuracy. The headline 97% test number from training mixes synthetic
samples; this number reflects what we'd see on actual Barthélemy pages.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/validate_classifier_real_only_chirho.py
"""

import sqlite3
import os
from pathlib import Path
from collections import Counter

import onnxruntime as ort
from PIL import Image
import numpy as np

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
ONNX_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "models-chirho" / "script-classifier-v7-chirho.onnx"
IMAGE_SIZE_CHIRHO = 32
CLASS_NAMES_CHIRHO = ["latin", "hebrew", "greek", "symbol"]
NUM_CLASSES_CHIRHO = 4


def script_to_class_chirho(script_chirho: str) -> int:
    if script_chirho in ("latin-chirho", "latin-non-french-chirho"):
        return 0
    if script_chirho == "hebrew-chirho":
        return 1
    if script_chirho == "greek-chirho":
        return 2
    return 3


def preprocess_chirho(img_path_chirho: str) -> np.ndarray:
    img_chirho = Image.open(img_path_chirho).convert("L")
    img_chirho = img_chirho.resize((IMAGE_SIZE_CHIRHO, IMAGE_SIZE_CHIRHO), Image.BILINEAR)
    arr_chirho = np.asarray(img_chirho, dtype=np.float32) / 255.0
    arr_chirho = (arr_chirho - 0.5) / 0.5  # Normalize(mean=0.5, std=0.5)
    arr_chirho = arr_chirho[np.newaxis, np.newaxis, :, :]  # 1, 1, H, W
    return arr_chirho


def main_chirho():
    if not os.path.exists(ONNX_PATH_CHIRHO):
        print(f"ONNX model not found at {ONNX_PATH_CHIRHO}")
        return

    print(f"Loading ONNX model: {ONNX_PATH_CHIRHO}")
    sess_chirho = ort.InferenceSession(str(ONNX_PATH_CHIRHO))

    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    rows_chirho = conn_chirho.execute(
        """SELECT crop_path_chirho, script_chirho, source_chirho, text_chirho
             FROM training_pairs_chirho
             WHERE source_chirho IN ('canonical-recon-chirho', 'opus-vision-chirho', 'human-chirho')"""
    ).fetchall()
    conn_chirho.close()
    print(f"Loaded {len(rows_chirho)} real-scan pairs (excluding synthetic)")

    by_class_chirho = Counter(script_to_class_chirho(r_chirho[1]) for r_chirho in rows_chirho)
    for ci_chirho in range(NUM_CLASSES_CHIRHO):
        print(f"  class {ci_chirho} ({CLASS_NAMES_CHIRHO[ci_chirho]}): {by_class_chirho.get(ci_chirho, 0)} samples")

    y_true_chirho, y_pred_chirho = [], []
    misses_chirho = []
    for path_chirho, script_chirho, source_chirho, text_chirho in rows_chirho:
        if not os.path.exists(path_chirho):
            continue
        x_chirho = preprocess_chirho(path_chirho)
        logits_chirho = sess_chirho.run(None, {"input": x_chirho})[0]
        pred_chirho = int(np.argmax(logits_chirho, axis=1)[0])
        true_chirho = script_to_class_chirho(script_chirho)
        y_true_chirho.append(true_chirho)
        y_pred_chirho.append(pred_chirho)
        if true_chirho != pred_chirho:
            misses_chirho.append((text_chirho, CLASS_NAMES_CHIRHO[true_chirho], CLASS_NAMES_CHIRHO[pred_chirho], source_chirho))

    correct_chirho = sum(t_chirho == p_chirho for t_chirho, p_chirho in zip(y_true_chirho, y_pred_chirho))
    total_chirho = len(y_true_chirho)
    print()
    print(f"Real-world accuracy: {correct_chirho}/{total_chirho} = {correct_chirho/total_chirho:.3f}")

    cm_chirho = np.zeros((NUM_CLASSES_CHIRHO, NUM_CLASSES_CHIRHO), dtype=int)
    for t_chirho, p_chirho in zip(y_true_chirho, y_pred_chirho):
        cm_chirho[t_chirho][p_chirho] += 1
    print("Confusion matrix (rows=true, cols=pred):")
    print("           " + "  ".join(f"{n_chirho:>7s}" for n_chirho in CLASS_NAMES_CHIRHO))
    for i_chirho in range(NUM_CLASSES_CHIRHO):
        row_sum_chirho = cm_chirho[i_chirho].sum()
        recall_chirho = cm_chirho[i_chirho][i_chirho] / max(1, row_sum_chirho)
        print(f"  true {CLASS_NAMES_CHIRHO[i_chirho]:>6s}  " + "  ".join(f"{cm_chirho[i_chirho][j_chirho]:>7d}" for j_chirho in range(NUM_CLASSES_CHIRHO)) + f"  (recall={recall_chirho:.2f})")

    print()
    print(f"Misclassifications ({len(misses_chirho)}):")
    for text_chirho, true_chirho, pred_chirho, source_chirho in misses_chirho[:20]:
        print(f"  '{text_chirho}'  true={true_chirho}  pred={pred_chirho}  ({source_chirho})")


if __name__ == "__main__":
    main_chirho()
