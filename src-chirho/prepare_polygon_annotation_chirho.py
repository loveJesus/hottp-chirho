#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Pick a curated set of source Hebrew words to maximize Hebrew-alphabet
coverage, copy their crops + line-context strips into a new batch dir, and
write a manifest the polygon-annotation server consumes.

Greedy set-cover: start with the empty set of "covered letters". Repeatedly
pick the unannotated word whose letters add the most new coverage; stop
when every letter in the source pool's reachable alphabet is covered or
we hit max-words.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/prepare_polygon_annotation_chirho.py --max-words=40
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

NIKKUD_RANGES_CHIRHO = [(0x0591, 0x05BD), (0x05BF, 0x05C7)]
HEBREW_LETTER_RANGE_CHIRHO = (0x05D0, 0x05EA)


def strip_nikkud_chirho(text_chirho: str) -> str:
    return "".join(ch_chirho for ch_chirho in text_chirho if not any(a_chirho <= ord(ch_chirho) <= b_chirho for a_chirho, b_chirho in NIKKUD_RANGES_CHIRHO))


def letters_only_chirho(text_chirho: str) -> set:
    return {ch_chirho for ch_chirho in text_chirho if HEBREW_LETTER_RANGE_CHIRHO[0] <= ord(ch_chirho) <= HEBREW_LETTER_RANGE_CHIRHO[1]}


def main_chirho():
    parser_chirho = argparse.ArgumentParser()
    parser_chirho.add_argument("--max-words", type=int, default=40)
    args_chirho = parser_chirho.parse_args()

    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    rows_chirho = conn_chirho.execute(
        """SELECT word_id_chirho, crop_path_chirho, text_chirho, vol_chirho, page_num_chirho, line_idx_chirho
             FROM training_pairs_chirho
             WHERE script_chirho = 'hebrew-chirho'
               AND source_chirho IN ('canonical-recon-chirho', 'human-chirho')"""
    ).fetchall()
    conn_chirho.close()
    print(f"Source pool: {len(rows_chirho)} Hebrew training pairs")

    # Each row -> available letter set (post nikkud-strip, Hebrew-only)
    pool_chirho = []
    for word_id_chirho, crop_path_chirho, text_chirho, vol_chirho, page_num_chirho, line_idx_chirho in rows_chirho:
        if not os.path.exists(crop_path_chirho):
            continue
        consonants_chirho = strip_nikkud_chirho(text_chirho or "")
        letters_chirho = letters_only_chirho(consonants_chirho)
        if len(letters_chirho) == 0:
            continue
        pool_chirho.append({
            "wordIdChirho": word_id_chirho,
            "cropPathChirho": crop_path_chirho,
            "textChirho": text_chirho,
            "consonantsChirho": consonants_chirho,
            "lettersChirho": letters_chirho,
            "volChirho": vol_chirho,
            "pageNumChirho": page_num_chirho,
            "lineIdxChirho": line_idx_chirho,
        })

    universe_chirho = set()
    for p_chirho in pool_chirho:
        universe_chirho |= p_chirho["lettersChirho"]
    print(f"Reachable alphabet: {len(universe_chirho)} distinct letters")

    # Greedy set cover
    covered_chirho = set()
    selected_chirho = []
    remaining_chirho = list(pool_chirho)
    while remaining_chirho and len(selected_chirho) < args_chirho.max_words:
        remaining_chirho.sort(key=lambda p_chirho: len(p_chirho["lettersChirho"] - covered_chirho), reverse=True)
        best_chirho = remaining_chirho[0]
        new_letters_chirho = best_chirho["lettersChirho"] - covered_chirho
        if len(new_letters_chirho) == 0:
            # No more new coverage available — still keep going if we want broader
            # samples per already-covered letter, but only if word is short and clean.
            if len(selected_chirho) >= args_chirho.max_words // 2:
                break
        selected_chirho.append(best_chirho)
        covered_chirho |= best_chirho["lettersChirho"]
        remaining_chirho.pop(0)
        if len(covered_chirho) >= len(universe_chirho) and len(selected_chirho) >= 8:
            # Got full coverage, optionally pack more for sample density
            for p_chirho in remaining_chirho[:max(0, args_chirho.max_words - len(selected_chirho))]:
                # keep the next-shortest words for sample density per letter
                pass
            # Continue greedily for sample density per letter — pick words that
            # add most coverage to UNDER-SAMPLED letters
            break

    # Optional: also add up to max_words by picking short, clean words to give
    # each letter multiple samples
    letter_sample_count_chirho = {ch_chirho: 0 for ch_chirho in universe_chirho}
    for s_chirho in selected_chirho:
        for ch_chirho in s_chirho["lettersChirho"]:
            letter_sample_count_chirho[ch_chirho] += 1
    remaining_chirho = [p_chirho for p_chirho in pool_chirho if p_chirho["wordIdChirho"] not in {s_chirho["wordIdChirho"] for s_chirho in selected_chirho}]
    while remaining_chirho and len(selected_chirho) < args_chirho.max_words:
        def under_score_chirho(p_chirho):
            return sum(1 for ch_chirho in p_chirho["lettersChirho"] if letter_sample_count_chirho[ch_chirho] < 3)
        remaining_chirho.sort(key=under_score_chirho, reverse=True)
        if under_score_chirho(remaining_chirho[0]) == 0:
            break
        s_chirho = remaining_chirho.pop(0)
        selected_chirho.append(s_chirho)
        for ch_chirho in s_chirho["lettersChirho"]:
            letter_sample_count_chirho[ch_chirho] += 1

    print(f"Selected {len(selected_chirho)} source words; alphabet covered: {len(covered_chirho)}/{len(universe_chirho)}")
    if len(covered_chirho) < len(universe_chirho):
        print(f"  uncovered: {sorted(universe_chirho - covered_chirho)}")

    run_id_chirho = f"polygons-{int(time.time())}-chirho"
    out_dir_chirho = BATCHES_DIR_CHIRHO / run_id_chirho
    out_dir_chirho.mkdir(parents=True, exist_ok=True)

    items_chirho = []
    for i_chirho, s_chirho in enumerate(selected_chirho):
        # Copy the crop file into the batch dir under a stable name
        crop_dst_chirho = out_dir_chirho / f"word-{s_chirho['wordIdChirho']}-chirho.png"
        shutil.copy(s_chirho["cropPathChirho"], crop_dst_chirho)
        items_chirho.append({
            "wordIdChirho": s_chirho["wordIdChirho"],
            "cropFileChirho": crop_dst_chirho.name,
            "textChirho": s_chirho["textChirho"],
            "consonantsChirho": s_chirho["consonantsChirho"],
            "lettersChirho": sorted(list(s_chirho["lettersChirho"])),
            "volChirho": s_chirho["volChirho"],
            "pageNumChirho": s_chirho["pageNumChirho"],
            "lineIdxChirho": s_chirho["lineIdxChirho"],
        })

    manifest_chirho = {
        "runIdChirho": run_id_chirho,
        "createdAtChirho": time.strftime("%Y-%m-%d %H:%M:%S"),
        "itemsChirho": items_chirho,
        "alphabetCoveredChirho": sorted(list(covered_chirho)),
        "alphabetUncoveredChirho": sorted(list(universe_chirho - covered_chirho)),
    }
    with open(out_dir_chirho / "manifest-chirho.json", "w") as f_chirho:
        json.dump(manifest_chirho, f_chirho, indent=2, ensure_ascii=False)
    print(f"Wrote {len(items_chirho)} items to {out_dir_chirho}")
    print()
    print("Per-letter sample count in selection:")
    for ch_chirho in sorted(universe_chirho):
        print(f"  {ch_chirho}: {letter_sample_count_chirho[ch_chirho]}")


if __name__ == "__main__":
    main_chirho()
