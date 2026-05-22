#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Single extraction pass over ALL pass1'd vol-1 scanlines (213 pages). For
every word box in scanlines_chirho.words_json, crop it from the page image
and run the cheap sieve:

  1. French-dictionary DROP — pure-Latin token, length>=6, valid in
     hunspell French → definitely NOT Hebrew, discard. (the
     classify-french rule, mirrored.)
  2. v8 ONNX is-Hebrew gate (~0.99/0.99, ~0.01 ms/crop) on the crop.
  3. Keep the Hebrew-gated words → the pure-Hebrew word-crop CORPUS
     (manifest + saved crops) — the large real dataset the recogniser
     was always starved of.
  4. Weak lead: Hebrew-gated words whose (noisy) tesseract text contains
     ז/ף/ץ → montage to confirm + build the missing exemplars.

Skips scanlines flagged by flag_double_height_lines (double/sliver) so
corrupted lines never enter the corpus. Read-only on the DB.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/extract_hebrew_corpus_chirho.py [--vol=1]
"""
import argparse
import json
import os
import re
import sqlite3
import subprocess
from collections import Counter
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
ONNX_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "models-chirho" / "script-classifier-v8-chirho.onnx"
SUSPECT_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "line-quality-chirho" / "suspect-scanlines-chirho.json"
OUT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "hebrew-corpus-chirho"
CLASS_NAMES_CHIRHO = ["latin", "hebrew", "greek", "symbol"]
S_CHIRHO = 32
LATIN_RE_CHIRHO = re.compile(r"^[A-Za-zÀ-ÿ'’\-]+$")
TARGET_CHARS_CHIRHO = "זףץ"


def french_valid_set_chirho(words_chirho):
    """Return the subset of words hunspell accepts as French (batched)."""
    if not words_chirho:
        return set()
    uniq_chirho = sorted(set(words_chirho))
    try:
        proc_chirho = subprocess.run(
            ["hunspell", "-d", "fr", "-a"],
            input="\n".join(uniq_chirho) + "\n",
            capture_output=True, text=True, timeout=120,
        )
    except Exception:
        return set()
    out_lines_chirho = proc_chirho.stdout.splitlines()
    valid_chirho = set()
    i_chirho = 0
    for ln_chirho in out_lines_chirho:
        ln_chirho = ln_chirho.strip()
        if not ln_chirho or ln_chirho.startswith("@"):
            continue
        if i_chirho >= len(uniq_chirho):
            break
        if ln_chirho[0] in "*+-":   # in dictionary / affix / compound
            valid_chirho.add(uniq_chirho[i_chirho])
        i_chirho += 1
    return valid_chirho


def main_chirho():
    ap_chirho = argparse.ArgumentParser()
    ap_chirho.add_argument("--vol", type=int, default=1)
    args_chirho = ap_chirho.parse_args()
    OUT_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)

    suspect_chirho = set()
    if SUSPECT_PATH_CHIRHO.exists():
        for s_chirho in json.loads(SUSPECT_PATH_CHIRHO.read_text()):
            suspect_chirho.add(s_chirho["scanlineIdChirho"])

    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    rows_chirho = conn_chirho.execute(
        """SELECT s.id_chirho, p.page_number_chirho, p.image_path_chirho, s.words_json_chirho
             FROM scanlines_chirho s JOIN pages_chirho p ON p.id_chirho = s.page_id_chirho
            WHERE p.volume_number_chirho = ? AND s.words_json_chirho IS NOT NULL
            ORDER BY p.page_number_chirho, s.line_index_chirho""",
        (args_chirho.vol,),
    ).fetchall()
    conn_chirho.close()

    # ---- pass over all words, collect candidates ----
    words_all_chirho = []   # (page, img_path, text, x0,y0,x1,y1)
    skipped_lines_chirho = 0
    for sid_chirho, pg_chirho, img_chirho, wj_chirho in rows_chirho:
        if sid_chirho in suspect_chirho:
            skipped_lines_chirho += 1
            continue
        if not img_chirho or not os.path.exists(img_chirho):
            continue
        try:
            words_chirho = json.loads(wj_chirho)
        except Exception:
            continue
        for w_chirho in words_chirho:
            t_chirho = (w_chirho.get("textChirho") or "").strip()
            if not t_chirho:
                continue
            words_all_chirho.append((
                pg_chirho, img_chirho, t_chirho,
                int(w_chirho["xMinChirho"]), int(w_chirho["yMinChirho"]),
                int(w_chirho["xMaxChirho"]), int(w_chirho["yMaxChirho"]),
            ))

    # ---- stage 1: French-dictionary drop ----
    latin_long_chirho = [
        t_chirho for (_pg, _ip, t_chirho, *_b) in words_all_chirho
        if len(t_chirho) >= 6 and LATIN_RE_CHIRHO.match(t_chirho)
    ]
    french_chirho = french_valid_set_chirho(latin_long_chirho)

    sess_chirho = ort.InferenceSession(str(ONNX_PATH_CHIRHO), providers=["CPUExecutionProvider"])
    inp_chirho = sess_chirho.get_inputs()[0].name

    img_cache_chirho = {}
    n_total_chirho = len(words_all_chirho)
    n_french_chirho = 0
    n_hebrew_chirho = 0
    n_other_chirho = 0
    manifest_chirho = []
    target_leads_chirho = []
    pred_counter_chirho = Counter()

    for pg_chirho, img_path_chirho, t_chirho, x0_chirho, y0_chirho, x1_chirho, y1_chirho in words_all_chirho:
        if len(t_chirho) >= 6 and LATIN_RE_CHIRHO.match(t_chirho) and t_chirho in french_chirho:
            n_french_chirho += 1
            continue
        if img_path_chirho not in img_cache_chirho:
            img_cache_chirho[img_path_chirho] = Image.open(img_path_chirho).convert("L")
        pim_chirho = img_cache_chirho[img_path_chirho]
        x0c_chirho, y0c_chirho = max(0, x0_chirho), max(0, y0_chirho)
        x1c_chirho = min(pim_chirho.width, x1_chirho)
        y1c_chirho = min(pim_chirho.height, y1_chirho)
        if x1c_chirho - x0c_chirho < 4 or y1c_chirho - y0c_chirho < 6:
            continue
        crop_chirho = pim_chirho.crop((x0c_chirho, y0c_chirho, x1c_chirho, y1c_chirho))
        arr_chirho = (np.asarray(crop_chirho.resize((S_CHIRHO, S_CHIRHO)), dtype=np.float32)
                      / 255.0).reshape(1, 1, S_CHIRHO, S_CHIRHO)
        logits_chirho = sess_chirho.run(None, {inp_chirho: arr_chirho})[0][0]
        cls_chirho = CLASS_NAMES_CHIRHO[int(np.argmax(logits_chirho))]
        pred_counter_chirho[cls_chirho] += 1
        if cls_chirho != "hebrew":
            n_other_chirho += 1
            continue
        n_hebrew_chirho += 1
        rel_chirho = f"p{pg_chirho:04d}-x{x0_chirho}-y{y0_chirho}-chirho.png"
        crop_chirho.save(OUT_DIR_CHIRHO / rel_chirho, optimize=True)
        manifest_chirho.append({
            "pageChirho": pg_chirho, "cropChirho": rel_chirho, "tessTextChirho": t_chirho,
            "bboxChirho": [x0_chirho, y0_chirho, x1_chirho, y1_chirho],
        })
        if any(c_chirho in t_chirho for c_chirho in TARGET_CHARS_CHIRHO):
            target_leads_chirho.append((rel_chirho, t_chirho, pg_chirho))

    (OUT_DIR_CHIRHO / "manifest-chirho.json").write_text(
        json.dumps(manifest_chirho, ensure_ascii=False, indent=1))

    print(f"scanlines: {len(rows_chirho)} ({skipped_lines_chirho} suspect skipped)")
    print(f"words seen: {n_total_chirho}")
    print(f"  stage1 French-dict dropped: {n_french_chirho}")
    print(f"  stage2 v8 gate → non-Hebrew: {n_other_chirho}  "
          f"({dict(pred_counter_chirho)})")
    print(f"  → HEBREW corpus harvested: {n_hebrew_chirho} word crops "
          f"-> {OUT_DIR_CHIRHO}/ (manifest-chirho.json)")
    print(f"  weak ז/ף/ץ leads (tesseract text, low-confidence): "
          f"{len(target_leads_chirho)}")
    for r_chirho, t_chirho, p_chirho in target_leads_chirho[:20]:
        print(f"     p{p_chirho} '{t_chirho}' {r_chirho}")


if __name__ == "__main__":
    main_chirho()
