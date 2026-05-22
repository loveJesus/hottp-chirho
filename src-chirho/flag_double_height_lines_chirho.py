#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Double-height-scanline guard. pass1 line segmentation sometimes merges two
text lines into one tall scanline (user: "some lines are double height and
wrong"). Those produce corrupted word crops, so the pure-Hebrew corpus /
glyph hunt must SKIP them.

Read-only: never mutates scanlines (be careful — investigate, don't
destroy). Per page, compute the median scanline height and flag any line
whose height is >= DOUBLE_RATIO × median (likely two lines merged) or
<= SLIVER_RATIO × median (noise strip). Writes an exclusion list the
extraction step consumes.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/flag_double_height_lines_chirho.py [--vol=1]
"""
import argparse
import json
import sqlite3
import statistics
from collections import defaultdict
from pathlib import Path

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
OUT_PATH_CHIRHO = (
    PROJECT_ROOT_CHIRHO / "workspace-chirho" / "line-quality-chirho"
    / "suspect-scanlines-chirho.json"
)
DOUBLE_RATIO_CHIRHO = 1.6
SLIVER_RATIO_CHIRHO = 0.45
MIN_LINES_FOR_MEDIAN_CHIRHO = 4


def main_chirho():
    ap_chirho = argparse.ArgumentParser()
    ap_chirho.add_argument("--vol", type=int, default=1)
    args_chirho = ap_chirho.parse_args()

    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    rows_chirho = conn_chirho.execute(
        """SELECT p_chirho.page_number_chirho, s_chirho.id_chirho,
                  s_chirho.line_index_chirho, s_chirho.height_chirho
             FROM scanlines_chirho s_chirho
             JOIN pages_chirho p_chirho ON p_chirho.id_chirho = s_chirho.page_id_chirho
            WHERE p_chirho.volume_number_chirho = ?
              AND s_chirho.height_chirho IS NOT NULL""",
        (args_chirho.vol,),
    ).fetchall()
    conn_chirho.close()

    by_page_chirho = defaultdict(list)
    for pg_chirho, sid_chirho, li_chirho, h_chirho in rows_chirho:
        by_page_chirho[pg_chirho].append((sid_chirho, li_chirho, float(h_chirho)))

    suspects_chirho = []
    n_double_chirho = n_sliver_chirho = n_total_chirho = 0
    offending_pages_chirho = defaultdict(int)
    for pg_chirho, lines_chirho in by_page_chirho.items():
        n_total_chirho += len(lines_chirho)
        if len(lines_chirho) < MIN_LINES_FOR_MEDIAN_CHIRHO:
            continue
        med_chirho = statistics.median(h_chirho for _s_chirho, _l_chirho, h_chirho in lines_chirho)
        if med_chirho <= 0:
            continue
        for sid_chirho, li_chirho, h_chirho in lines_chirho:
            ratio_chirho = h_chirho / med_chirho
            flag_chirho = None
            if ratio_chirho >= DOUBLE_RATIO_CHIRHO:
                flag_chirho = "double-chirho"
                n_double_chirho += 1
            elif ratio_chirho <= SLIVER_RATIO_CHIRHO:
                flag_chirho = "sliver-chirho"
                n_sliver_chirho += 1
            if flag_chirho:
                offending_pages_chirho[pg_chirho] += 1
                suspects_chirho.append({
                    "pageNumberChirho": pg_chirho,
                    "scanlineIdChirho": sid_chirho,
                    "lineIndexChirho": li_chirho,
                    "heightChirho": round(h_chirho, 1),
                    "pageMedianChirho": round(med_chirho, 1),
                    "ratioChirho": round(ratio_chirho, 2),
                    "flagChirho": flag_chirho,
                })

    OUT_PATH_CHIRHO.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH_CHIRHO.write_text(json.dumps(suspects_chirho, ensure_ascii=False, indent=1))

    print(f"vol{args_chirho.vol}: {n_total_chirho} scanlines with height across "
          f"{len(by_page_chirho)} pages")
    print(f"  flagged: {n_double_chirho} double-height, {n_sliver_chirho} sliver "
          f"({len(suspects_chirho)} total) -> {OUT_PATH_CHIRHO}")
    if offending_pages_chirho:
        worst_chirho = sorted(offending_pages_chirho.items(),
                              key=lambda kv_chirho: -kv_chirho[1])[:10]
        print("  worst pages (page: #suspect lines): "
              + ", ".join(f"{p_chirho}:{c_chirho}" for p_chirho, c_chirho in worst_chirho))
    print("Downstream pure-Hebrew extraction / glyph hunt must skip "
          "scanlineIdChirho in this list.")


if __name__ == "__main__":
    main_chirho()
