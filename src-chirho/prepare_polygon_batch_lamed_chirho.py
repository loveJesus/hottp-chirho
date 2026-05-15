#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Pick a polygon-annotation batch of Hebrew words that CONTAIN LAMED (ל) and
have NO parentheses/brackets in the OCR text. Annotating these in the new
polygon system (which records each polygon's y-band via sidecar JSON) lets
compose_synthetic_hebrew_v2_chirho.py MEASURE how far lamed's top rises above
the shared topline of full-body letters — instead of guessing ASCENDER_H.

Each chosen word should also carry a few full-body letters alongside the
lamed so the relative measurement is meaningful (a word that is only lameds
gives no topline reference).

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/prepare_polygon_batch_lamed_chirho.py --max-words=18
"""

import argparse
import json
import os
import shutil
import sqlite3
import sys
import time
from pathlib import Path

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
BATCHES_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "polygon-batches-chirho"

LAMED_CHIRHO = "ל"
NIKKUD_RANGES_CHIRHO = [(0x0591, 0x05BD), (0x05BF, 0x05C7)]
HEBREW_LETTER_RANGE_CHIRHO = (0x05D0, 0x05EA)
# Reject any word whose OCR text contains these (parens/brackets confuse both
# the polygon drawing and the baseline measurement).
FORBIDDEN_CHARS_CHIRHO = set("()[]{}<>")


def strip_nikkud_chirho(text_chirho: str) -> str:
    return "".join(ch_chirho for ch_chirho in text_chirho if not any(a_chirho <= ord(ch_chirho) <= b_chirho for a_chirho, b_chirho in NIKKUD_RANGES_CHIRHO))


def hebrew_letters_chirho(text_chirho: str) -> str:
    return "".join(ch_chirho for ch_chirho in text_chirho if HEBREW_LETTER_RANGE_CHIRHO[0] <= ord(ch_chirho) <= HEBREW_LETTER_RANGE_CHIRHO[1])


def main_chirho():
    parser_chirho = argparse.ArgumentParser()
    parser_chirho.add_argument("--max-words", type=int, default=18)
    args_chirho = parser_chirho.parse_args()

    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    rows_chirho = conn_chirho.execute(
        """SELECT word_id_chirho, crop_path_chirho, text_chirho, vol_chirho, page_num_chirho, line_idx_chirho
             FROM training_pairs_chirho
             WHERE script_chirho = 'hebrew-chirho'
               AND source_chirho IN ('canonical-recon-chirho', 'human-chirho')"""
    ).fetchall()
    conn_chirho.close()

    candidates_chirho = []
    for w_id_chirho, crop_path_chirho, text_chirho, vol_chirho, page_num_chirho, line_idx_chirho in rows_chirho:
        if not os.path.exists(crop_path_chirho):
            continue
        t_chirho = text_chirho or ""
        if any(c_chirho in FORBIDDEN_CHARS_CHIRHO for c_chirho in t_chirho):
            continue
        consonants_chirho = hebrew_letters_chirho(strip_nikkud_chirho(t_chirho))
        if LAMED_CHIRHO not in consonants_chirho:
            continue
        # Need at least 2 non-lamed Hebrew letters for a topline reference.
        non_lamed_chirho = [c_chirho for c_chirho in consonants_chirho if c_chirho != LAMED_CHIRHO]
        if len(non_lamed_chirho) < 2:
            continue
        distinct_chirho = len(set(consonants_chirho))
        candidates_chirho.append({
            "wordIdChirho": w_id_chirho,
            "cropPathChirho": crop_path_chirho,
            "textChirho": t_chirho,
            "consonantsChirho": consonants_chirho,
            "distinctChirho": distinct_chirho,
            "volChirho": vol_chirho,
            "pageNumChirho": page_num_chirho,
            "lineIdxChirho": line_idx_chirho,
        })

    if not candidates_chirho:
        print("No paren-free lamed-containing words found.")
        sys.exit(0)

    # Prefer words with more distinct letters (richer topline reference) and a
    # moderate length (3-7 letters: enough context, easy to polygon).
    candidates_chirho.sort(
        key=lambda c_chirho: (c_chirho["distinctChirho"], -abs(len(c_chirho["consonantsChirho"]) - 5)),
        reverse=True,
    )
    selected_chirho = candidates_chirho[: args_chirho.max_words]

    run_id_chirho = f"polygons-lamed-{int(time.time())}-chirho"
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
            "consonantsChirho": s_chirho["consonantsChirho"],
            "lettersChirho": sorted(set(s_chirho["consonantsChirho"])),
            "volChirho": s_chirho["volChirho"],
            "pageNumChirho": s_chirho["pageNumChirho"],
            "lineIdxChirho": s_chirho["lineIdxChirho"],
            "focusLettersChirho": [LAMED_CHIRHO],
        })

    manifest_chirho = {
        "runIdChirho": run_id_chirho,
        "createdAtChirho": time.strftime("%Y-%m-%d %H:%M:%S"),
        "purposeChirho": "Measure lamed ascender rise: annotate lamed + full-body letters in each word (no parens) so the composer learns the real topline relationship.",
        "itemsChirho": items_chirho,
    }
    with open(out_dir_chirho / "manifest-chirho.json", "w") as f_chirho:
        json.dump(manifest_chirho, f_chirho, indent=2, ensure_ascii=False)
    print(f"Wrote {len(items_chirho)} lamed-containing paren-free words to {out_dir_chirho}")
    for it_chirho in items_chirho:
        print(f"  vol{it_chirho['volChirho']} p{it_chirho['pageNumChirho']} line{it_chirho['lineIdxChirho']} :: \"{it_chirho['textChirho']}\"")


if __name__ == "__main__":
    main_chirho()
