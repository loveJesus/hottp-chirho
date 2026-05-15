#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Per-word polygon COLLISION analysis from human annotations.

Each per-glyph sidecar JSON now persists polygonPointsChirho — the raw
polygon vertices the user drew, in word-crop image coords. Group sidecars by
wordId, then do true polygon-polygon intersection (shapely) for every pair of
letters in that word. An intersection means those two letters' inked regions
physically overlap in the scan — i.e. they are touching / merged.

Direction is from polygon centroids: the higher-x centroid is the pixel-RIGHT
letter, which in RTL reading order PRECEDES the pixel-left letter. We report
ordered reading pairs (precedes, follows) + the measured intersection rate
and the median intersection area as a fraction of the smaller polygon.

The composer reads glyph-merge-stats-chirho.json so synthetic gluing matches
the real font's touching behaviour per letter pair, not a flat probability.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/analyze_glyph_overlaps_chirho.py
"""

import json
from collections import defaultdict
from pathlib import Path
from statistics import median

from shapely.geometry import Polygon

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
FONT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-chirho"
OUT_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "models-chirho" / "glyph-merge-stats-chirho.json"


def safe_polygon_chirho(points_chirho):
    if not points_chirho or len(points_chirho) < 3:
        return None
    try:
        poly_chirho = Polygon(points_chirho)
        if not poly_chirho.is_valid:
            poly_chirho = poly_chirho.buffer(0)  # repair self-intersections
        if poly_chirho.is_empty or poly_chirho.area <= 0:
            return None
        return poly_chirho
    except Exception:
        return None


def main_chirho():
    if not FONT_DIR_CHIRHO.exists():
        print("no bitmap-font-v3 dir")
        return

    by_word_chirho = defaultdict(list)
    sidecar_count_chirho = 0
    with_points_chirho = 0
    for cp_dir_chirho in FONT_DIR_CHIRHO.iterdir():
        if not cp_dir_chirho.is_dir() or not cp_dir_chirho.name.startswith("U+"):
            continue
        for json_path_chirho in cp_dir_chirho.glob("*.json"):
            try:
                with open(json_path_chirho) as f_chirho:
                    meta_chirho = json.load(f_chirho)
            except Exception:
                continue
            if "wordIdChirho" not in meta_chirho:
                continue
            sidecar_count_chirho += 1
            pts_chirho = meta_chirho.get("polygonPointsChirho")
            if not pts_chirho:
                continue
            poly_chirho = safe_polygon_chirho(pts_chirho)
            if poly_chirho is None:
                continue
            with_points_chirho += 1
            by_word_chirho[meta_chirho["wordIdChirho"]].append({
                "letterChirho": meta_chirho.get("letterChirho", "?"),
                "polyChirho": poly_chirho,
                "cxChirho": poly_chirho.centroid.x,
            })

    print(f"{sidecar_count_chirho} sidecars; {with_points_chirho} have polygon points; {len(by_word_chirho)} words usable")
    if with_points_chirho == 0:
        print(
            "\nNo polygon-point data yet. Existing glyphs predate this; the\n"
            "save_polygons sidecar now persists polygonPointsChirho. Annotate a\n"
            "fresh polygon batch and re-run — collision stats will populate."
        )
        return

    pair_seen_chirho = defaultdict(int)
    pair_collide_chirho = defaultdict(int)
    pair_area_frac_chirho = defaultdict(list)

    for word_id_chirho, glyphs_chirho in by_word_chirho.items():
        if len(glyphs_chirho) < 2:
            continue
        # True all-pairs polygon collision within the word (not just adjacency —
        # a tall letter can overlap a non-adjacent neighbor too).
        for i_chirho in range(len(glyphs_chirho)):
            for j_chirho in range(i_chirho + 1, len(glyphs_chirho)):
                g1_chirho = glyphs_chirho[i_chirho]
                g2_chirho = glyphs_chirho[j_chirho]
                # Reading order: higher centroid-x is pixel-RIGHT = precedes in RTL.
                if g1_chirho["cxChirho"] >= g2_chirho["cxChirho"]:
                    precedes_chirho, follows_chirho = g1_chirho, g2_chirho
                else:
                    precedes_chirho, follows_chirho = g2_chirho, g1_chirho
                key_chirho = (precedes_chirho["letterChirho"], follows_chirho["letterChirho"])
                pair_seen_chirho[key_chirho] += 1
                try:
                    inter_chirho = g1_chirho["polyChirho"].intersection(g2_chirho["polyChirho"])
                    if (not inter_chirho.is_empty) and inter_chirho.area > 0.5:
                        pair_collide_chirho[key_chirho] += 1
                        smaller_chirho = min(g1_chirho["polyChirho"].area, g2_chirho["polyChirho"].area)
                        if smaller_chirho > 0:
                            pair_area_frac_chirho[key_chirho].append(inter_chirho.area / smaller_chirho)
                except Exception:
                    pass

    stats_chirho = {}
    for pair_chirho, seen_chirho in pair_seen_chirho.items():
        collided_chirho = pair_collide_chirho.get(pair_chirho, 0)
        areas_chirho = pair_area_frac_chirho.get(pair_chirho, [])
        stats_chirho[f"{pair_chirho[0]}{pair_chirho[1]}"] = {
            "precedesReadingChirho": pair_chirho[0],
            "followsReadingChirho": pair_chirho[1],
            "seenChirho": seen_chirho,
            "collidedChirho": collided_chirho,
            "collisionRateChirho": round(collided_chirho / seen_chirho, 3),
            "medianOverlapFracChirho": round(median(areas_chirho), 3) if areas_chirho else 0.0,
        }

    OUT_PATH_CHIRHO.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH_CHIRHO, "w") as f_chirho:
        json.dump({"pairsChirho": stats_chirho, "nWordsChirho": len(by_word_chirho)}, f_chirho, indent=2, ensure_ascii=False)
    print(f"\nWrote merge stats to {OUT_PATH_CHIRHO}")
    ranked_chirho = sorted(stats_chirho.values(), key=lambda s_chirho: -s_chirho["collisionRateChirho"])
    print("\nTop colliding letter pairs (reading order: precedes→follows):")
    for s_chirho in ranked_chirho[:15]:
        print(f"  {s_chirho['precedesReadingChirho']}→{s_chirho['followsReadingChirho']}: "
              f"{s_chirho['collidedChirho']}/{s_chirho['seenChirho']} = {s_chirho['collisionRateChirho']:.0%} "
              f"(median overlap {s_chirho['medianOverlapFracChirho']:.0%} of smaller glyph)")


if __name__ == "__main__":
    main_chirho()
