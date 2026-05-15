#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Pick a polygon-annotation batch focused on words that contain the GLYPHS WE'RE
STILL MISSING in the v3 bitmap-font library:

    ז (zayin), ס (samekh), ך (kaf-final), ף (pe-final), ץ (tsadi-final)

Source pool: training_pairs_chirho rows where the user already validated the
word as Hebrew (script_chirho='hebrew-chirho', source IN canonical-recon /
human / opus-vision) AND tesseract decoded at least one of the missing letters
in its text field. Tesseract's text is treated as a hint — the polygon UI's
dropdown is still authoritative.

Greedy: prefer words containing the RAREST missing letters first, then fewer
duplicates per letter.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/prepare_polygon_batch_missing_glyphs_chirho.py --max-words=20
"""

import argparse
import json
import os
import shutil
import sqlite3
import sys
import time
from collections import Counter
from pathlib import Path

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
BATCHES_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "polygon-batches-chirho"

MISSING_LETTERS_CHIRHO = ["ז", "ס", "ך", "ף", "ץ"]


def main_chirho():
    parser_chirho = argparse.ArgumentParser()
    parser_chirho.add_argument("--max-words", type=int, default=20)
    args_chirho = parser_chirho.parse_args()

    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    cur_chirho = conn_chirho.execute(
        """SELECT word_id_chirho, crop_path_chirho, text_chirho, vol_chirho, page_num_chirho, line_idx_chirho
             FROM training_pairs_chirho
             WHERE script_chirho = 'hebrew-chirho'
               AND source_chirho IN ('canonical-recon-chirho', 'human-chirho', 'opus-vision-chirho')"""
    )
    rows_chirho = cur_chirho.fetchall()
    conn_chirho.close()

    # For each row, which missing letters does it contain?
    candidates_chirho = []
    for w_id_chirho, crop_path_chirho, text_chirho, vol_chirho, page_num_chirho, line_idx_chirho in rows_chirho:
        if not os.path.exists(crop_path_chirho):
            continue
        contained_chirho = [m_chirho for m_chirho in MISSING_LETTERS_CHIRHO if text_chirho and m_chirho in text_chirho]
        if not contained_chirho:
            continue
        candidates_chirho.append({
            "wordIdChirho": w_id_chirho,
            "cropPathChirho": crop_path_chirho,
            "textChirho": text_chirho,
            "volChirho": vol_chirho,
            "pageNumChirho": page_num_chirho,
            "lineIdxChirho": line_idx_chirho,
            "containsChirho": contained_chirho,
        })

    if not candidates_chirho:
        print("No candidate words containing missing letters in their tesseract text.")
        sys.exit(0)

    print(f"Source pool: {len(candidates_chirho)} Hebrew-labeled words contain at least one missing letter")
    rarity_chirho = Counter()
    for c_chirho in candidates_chirho:
        for m_chirho in c_chirho["containsChirho"]:
            rarity_chirho[m_chirho] += 1
    print("Per-letter pool size:")
    for m_chirho in MISSING_LETTERS_CHIRHO:
        print(f"  {m_chirho}: {rarity_chirho[m_chirho]} candidate words")

    # Greedy: at each step pick the candidate that covers the rarest still-needed letter.
    needed_chirho = {m_chirho: max(3, args_chirho.max_words // len(MISSING_LETTERS_CHIRHO)) for m_chirho in MISSING_LETTERS_CHIRHO}
    selected_chirho = []
    remaining_chirho = list(candidates_chirho)
    while remaining_chirho and len(selected_chirho) < args_chirho.max_words:
        # Score each candidate by the minimum count of any needed letter it contains.
        def score_chirho(c_chirho):
            return sum(needed_chirho[m_chirho] for m_chirho in c_chirho["containsChirho"] if needed_chirho[m_chirho] > 0)
        remaining_chirho.sort(key=score_chirho, reverse=True)
        best_chirho = remaining_chirho[0]
        if score_chirho(best_chirho) == 0:
            break
        selected_chirho.append(best_chirho)
        for m_chirho in best_chirho["containsChirho"]:
            if needed_chirho[m_chirho] > 0:
                needed_chirho[m_chirho] -= 1
        remaining_chirho.pop(0)

    print(f"\nSelected {len(selected_chirho)} words. Remaining quota:")
    for m_chirho in MISSING_LETTERS_CHIRHO:
        target_chirho = max(3, args_chirho.max_words // len(MISSING_LETTERS_CHIRHO))
        print(f"  {m_chirho}: {target_chirho - needed_chirho[m_chirho]} / {target_chirho}")

    run_id_chirho = f"polygons-missing-{int(time.time())}-chirho"
    out_dir_chirho = BATCHES_DIR_CHIRHO / run_id_chirho
    out_dir_chirho.mkdir(parents=True, exist_ok=True)

    items_chirho = []
    for s_chirho in selected_chirho:
        crop_dst_chirho = out_dir_chirho / f"word-{s_chirho['wordIdChirho']}-chirho.png"
        shutil.copy(s_chirho["cropPathChirho"], crop_dst_chirho)
        items_chirho.append({
            "wordIdChirho": s_chirho["wordIdChirho"],
            "cropFileChirho": crop_dst_chirho.name,
            "textChirho": s_chirho["textChirho"],
            "consonantsChirho": s_chirho["textChirho"],
            "lettersChirho": sorted(set(s_chirho["containsChirho"])),
            "volChirho": s_chirho["volChirho"],
            "pageNumChirho": s_chirho["pageNumChirho"],
            "lineIdxChirho": s_chirho["lineIdxChirho"],
            "focusLettersChirho": s_chirho["containsChirho"],
        })

    manifest_chirho = {
        "runIdChirho": run_id_chirho,
        "createdAtChirho": time.strftime("%Y-%m-%d %H:%M:%S"),
        "purposeChirho": "Polygon-annotate words containing missing glyphs (zayin, samekh, kaf-final, pe-final, tsadi-final)",
        "missingLettersChirho": MISSING_LETTERS_CHIRHO,
        "itemsChirho": items_chirho,
    }
    with open(out_dir_chirho / "manifest-chirho.json", "w") as f_chirho:
        json.dump(manifest_chirho, f_chirho, indent=2, ensure_ascii=False)
    print(f"\nWrote {len(items_chirho)} items to {out_dir_chirho}")


if __name__ == "__main__":
    main_chirho()
