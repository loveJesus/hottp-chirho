#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Automated first-pass detector for bad glyph "cuts" in the v3 bitmap font.

Two failure modes the user has hit:
  * "grabbed a bit of a letter next to it" -> a second sizable connected
    ink component, detached from the main glyph body.
  * "the cut is wrong / clipped" -> heavy ink on the extreme top OR bottom
    edge (the polygon sliced through the letter), or an aspect ratio far
    from that letter's own median.

Writes workspace-chirho/models-chirho/glyph-suspects-chirho.json:
  { "U+05E4/vol-1-word-23388-poly-02-chirho.png":
        {"suspectChirho": true, "reasonsChirho": [...]} , ... }

This only SUGGESTS. The human verdict in the review UI is ground truth
and is what gets persisted ([[feedback-persist-human-data]]).

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/flag_suspect_glyphs_chirho.py
"""
import json
import statistics as st
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
FONT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-chirho"
OUT_PATH_CHIRHO = (
    PROJECT_ROOT_CHIRHO / "workspace-chirho" / "models-chirho" / "glyph-suspects-chirho.json"
)
INK_THRESH_CHIRHO = 160


def analyze_glyph_chirho(path_chirho):
    arr_chirho = np.asarray(Image.open(path_chirho).convert("L"))
    ink_chirho = arr_chirho < INK_THRESH_CHIRHO
    if ink_chirho.sum() == 0:
        return {"reasonsChirho": ["blank"], "aspectChirho": 0.0}
    ys_chirho, xs_chirho = np.where(ink_chirho)
    h_chirho = int(ys_chirho.max() - ys_chirho.min() + 1)
    w_chirho = int(xs_chirho.max() - xs_chirho.min() + 1)
    aspect_chirho = w_chirho / max(1, h_chirho)
    reasons_chirho = []

    labels_chirho, n_chirho = ndimage.label(ink_chirho)
    if n_chirho >= 2:
        sizes_chirho = sorted(
            (int((labels_chirho == k_chirho).sum()) for k_chirho in range(1, n_chirho + 1)),
            reverse=True,
        )
        # A real detached fragment: 2nd component is a meaningful chunk
        # (>12% of the main body), not a speck of scan noise.
        if sizes_chirho[1] > 0.12 * sizes_chirho[0]:
            reasons_chirho.append("detached-fragment")

    top_row_chirho = ink_chirho[ys_chirho.min(), :].sum()
    bot_row_chirho = ink_chirho[ys_chirho.max(), :].sum()
    # Heavy ink spanning the extreme row => the polygon sliced the letter.
    if top_row_chirho > 0.55 * w_chirho:
        reasons_chirho.append("clipped-top")
    if bot_row_chirho > 0.55 * w_chirho:
        reasons_chirho.append("clipped-bottom")

    return {"reasonsChirho": reasons_chirho, "aspectChirho": round(aspect_chirho, 3)}


def main_chirho():
    per_glyph_chirho = {}
    by_letter_aspects_chirho = {}
    for cp_dir_chirho in sorted(FONT_DIR_CHIRHO.glob("U+*")):
        for png_chirho in sorted(cp_dir_chirho.glob("*.png")):
            key_chirho = f"{cp_dir_chirho.name}/{png_chirho.name}"
            info_chirho = analyze_glyph_chirho(png_chirho)
            per_glyph_chirho[key_chirho] = info_chirho
            by_letter_aspects_chirho.setdefault(cp_dir_chirho.name, []).append(
                info_chirho["aspectChirho"]
            )

    # Aspect outlier vs the letter's own median (a glyph that grabbed a
    # neighbor is much wider; a clipped one much shorter/taller).
    for key_chirho, info_chirho in per_glyph_chirho.items():
        cp_chirho = key_chirho.split("/")[0]
        peers_chirho = [a_chirho for a_chirho in by_letter_aspects_chirho[cp_chirho] if a_chirho > 0]
        if len(peers_chirho) >= 3:
            med_chirho = st.median(peers_chirho)
            a_chirho = info_chirho["aspectChirho"]
            if med_chirho > 0 and (a_chirho > 1.7 * med_chirho or a_chirho < 0.55 * med_chirho):
                info_chirho["reasonsChirho"].append("aspect-outlier")
        info_chirho["suspectChirho"] = len(info_chirho["reasonsChirho"]) > 0

    OUT_PATH_CHIRHO.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH_CHIRHO, "w") as f_chirho:
        json.dump(per_glyph_chirho, f_chirho, ensure_ascii=False, indent=2)

    suspects_chirho = {k_chirho: v_chirho for k_chirho, v_chirho in per_glyph_chirho.items() if v_chirho["suspectChirho"]}
    print(f"{len(per_glyph_chirho)} glyphs analyzed; {len(suspects_chirho)} suspect:")
    for k_chirho, v_chirho in sorted(suspects_chirho.items()):
        print(f"  {k_chirho:55s} {','.join(v_chirho['reasonsChirho'])}")
    print(f"\nWrote {OUT_PATH_CHIRHO}")


if __name__ == "__main__":
    main_chirho()
