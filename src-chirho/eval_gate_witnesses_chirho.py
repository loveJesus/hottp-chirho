# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""Problem-2, honest eval: compare is-Hebrew witnesses on TRUSTWORTHY labels.

Witnesses:
  tess  = current production gate (tesseract fra+heb+grc+lat + has_hebrew)
  v8    = whole-word v8 script CNN, class==hebrew
  OR    = tess OR v8 (the proposed hardened gate)

Sets:
  training_pairs_chirho hebrew-chirho / latin-chirho  (curated labels; note v8
      was TRAINED on these, so v8 recall here is an optimistic ceiling)
  vol-5 p149 crops (workspace-chirho/.../probe-vol5-p149-allexact-crops-chirho)
      = held-out, NOT vol-1, dominated by Latin/French -> v8 cross-volume
      false-admit check.
"""
import os
import sqlite3
import sys
import tempfile
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

from read_volume_page_chirho import (
    PROJECT_ROOT_CHIRHO,
    has_hebrew_chirho,
    tess_text_chirho,
)

MODEL_PATH_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho" / "models-chirho"
                     / "script-classifier-v8-chirho.onnx")
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
VOL5_LATIN_DIR_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho" / "word-ocr-chirho"
                         / "probe-vol5-p149-allexact-crops-chirho")
HEBREW_CLASS_CHIRHO = 1


def v8_says_hebrew_chirho(session_chirho, crop_path_chirho):
    im_chirho = Image.open(crop_path_chirho).convert("L").resize((32, 32), Image.LANCZOS)
    arr_chirho = (np.asarray(im_chirho, np.float32) / 255.0 - 0.5) / 0.5
    logits_chirho = session_chirho.run(None, {"input": arr_chirho.reshape(1, 1, 32, 32)})[0][0]
    return int(np.argmax(logits_chirho)) == HEBREW_CLASS_CHIRHO


def eval_paths_chirho(session_chirho, tmp_dir_chirho, paths_chirho, label_chirho, want_hebrew_chirho):
    tess_chirho = v8c_chirho = orc_chirho = n_chirho = 0
    for p_chirho in paths_chirho:
        if not os.path.exists(p_chirho):
            continue
        n_chirho += 1
        t_chirho = has_hebrew_chirho(tess_text_chirho(Path(p_chirho), tmp_dir_chirho))
        v_chirho = v8_says_hebrew_chirho(session_chirho, p_chirho)
        tess_chirho += t_chirho
        v8c_chirho += v_chirho
        orc_chirho += (t_chirho or v_chirho)
    d_chirho = max(1, n_chirho)
    metric_chirho = "recall" if want_hebrew_chirho else "false-admit"
    print(f"\n[{label_chirho}] n={n_chirho}  (says-Hebrew rate; want {'HIGH' if want_hebrew_chirho else 'LOW'} = {metric_chirho})")
    print(f"  tess    : {tess_chirho:4d} ({tess_chirho/d_chirho:.1%})")
    print(f"  v8      : {v8c_chirho:4d} ({v8c_chirho/d_chirho:.1%})")
    print(f"  tess|v8 : {orc_chirho:4d} ({orc_chirho/d_chirho:.1%})")


def main_chirho():
    per_n_chirho = int(sys.argv[1]) if len(sys.argv) > 1 else 150
    session_chirho = ort.InferenceSession(str(MODEL_PATH_CHIRHO), providers=["CPUExecutionProvider"])
    con_chirho = sqlite3.connect(DB_PATH_CHIRHO)

    def pull_chirho(script_chirho):
        rows_chirho = [r_chirho[0] for r_chirho in con_chirho.execute(
            "SELECT crop_path_chirho FROM training_pairs_chirho "
            "WHERE script_chirho=? AND source_chirho != 'human-bad-bbox-chirho' LIMIT ?",
            (script_chirho, per_n_chirho))]
        return rows_chirho

    heb_paths_chirho = pull_chirho("hebrew-chirho")
    lat_paths_chirho = pull_chirho("latin-chirho")
    vol5_latin_chirho = sorted(str(p_chirho) for p_chirho in VOL5_LATIN_DIR_CHIRHO.glob("*.png"))[:per_n_chirho]

    tmp_dir_chirho = Path(tempfile.mkdtemp(prefix="gate-eval-", dir=str(PROJECT_ROOT_CHIRHO)))
    try:
        print("=== TRUSTWORTHY training_pairs (v8 TRAINED here -> v8 recall optimistic) ===")
        eval_paths_chirho(session_chirho, tmp_dir_chirho, heb_paths_chirho, "training_pairs HEBREW", True)
        eval_paths_chirho(session_chirho, tmp_dir_chirho, lat_paths_chirho, "training_pairs LATIN", False)
        print("\n=== HELD-OUT vol-5 p149 (not vol-1; Latin/French-dominated) ===")
        eval_paths_chirho(session_chirho, tmp_dir_chirho, vol5_latin_chirho, "vol5-p149 (mostly Latin)", False)
    finally:
        import shutil
        shutil.rmtree(tmp_dir_chirho, ignore_errors=True)
        con_chirho.close()


if __name__ == "__main__":
    main_chirho()
