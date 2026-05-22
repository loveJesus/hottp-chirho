#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Export the auto route-inspection stroke decomposition as SEED Bezier spines
for the red/blue/green spine editor. One JSON keyed by "U+XXXX/file.png":

  { "penRadiusChirho": float,            # native scan pen half-width
    "wChirho": int, "hChirho": int,      # native glyph dims
    "strokesChirho": [ [[x,y],...], ... ] }  # control points, native px

The editor loads these as the editable RED spine; the human drags them so
the GREEN brush-fill matches the BLUE scan ink, then saves the corrected
spine as ground truth. Reuses glyph_strokes_chirho (DRY) so the seed is
exactly what the visualizer shows.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/export_spines_chirho.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

from glyph_strokes_chirho import (
    INK_THRESH_CHIRHO,
    UPSCALE_CHIRHO,
    decompose_strokes_chirho,
    prune_spurs_chirho,
    rdp_chirho,
    zhang_suen_thin_chirho,
    RDP_EPS_CHIRHO,
)

import math

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
FONT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-chirho"
OUT_PATH_CHIRHO = (
    PROJECT_ROOT_CHIRHO / "workspace-chirho" / "glyph-spines-chirho" / "seeds-chirho.json"
)
COUNTS_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "hebrew-stroke-counts-chirho.json"


def _load_targets_chirho():
    """letter -> canonical stroke count, from the persisted spec."""
    try:
        spec_chirho = json.loads(COUNTS_PATH_CHIRHO.read_text())
        return {
            k_chirho: v_chirho["countChirho"]
            for k_chirho, v_chirho in spec_chirho.get("lettersChirho", {}).items()
        }
    except Exception:
        return {}


TARGETS_CHIRHO = _load_targets_chirho()


def _slen_chirho(s_chirho):
    return sum(
        math.hypot(s_chirho[i_chirho + 1][0] - s_chirho[i_chirho][0],
                   s_chirho[i_chirho + 1][1] - s_chirho[i_chirho][1])
        for i_chirho in range(len(s_chirho) - 1)
    )


def coerce_to_target_chirho(strokes_chirho, k_chirho):
    """Force exactly k strokes (we KNOW the letter, so don't guess the count).
    Too many: repeatedly merge the shortest stroke into whichever stroke has
    the nearest endpoint (absorb spurs/short trails into a long stroke — the
    nub stays part of a long stroke). Too few: split the longest in half."""
    strokes_chirho = [list(s_chirho) for s_chirho in strokes_chirho if len(s_chirho) >= 2]
    if not strokes_chirho or k_chirho < 1:
        return strokes_chirho
    if len(strokes_chirho) > k_chirho:
        # Keep the k LONGEST trails; discard the short spurs entirely.
        # Merging them into neighbours produced crossing zig-zag strokes —
        # a bad seed. The k longest ≈ the real pen strokes (aleph: diagonal
        # + the two arms); the human refines from there in the editor.
        strokes_chirho.sort(key=_slen_chirho, reverse=True)
        strokes_chirho = strokes_chirho[:k_chirho]
    while len(strokes_chirho) < k_chirho:
        i_chirho = max(range(len(strokes_chirho)),
                       key=lambda z_chirho: _slen_chirho(strokes_chirho[z_chirho]))
        s_chirho = strokes_chirho[i_chirho]
        if len(s_chirho) < 3:
            break
        m_chirho = len(s_chirho) // 2
        strokes_chirho[i_chirho] = s_chirho[: m_chirho + 1]
        strokes_chirho.insert(i_chirho + 1, s_chirho[m_chirho:])
    # Longest first => the dominant stroke is #1 (aleph's medial diagonal,
    # then its two short arms; generally the "primary" pen stroke leads).
    strokes_chirho.sort(key=_slen_chirho, reverse=True)
    return strokes_chirho


def seed_for_glyph_chirho(gray_chirho):
    h_chirho, w_chirho = gray_chirho.shape
    binary_chirho = (gray_chirho < INK_THRESH_CHIRHO).astype(np.uint8)
    edt_chirho = ndimage.distance_transform_edt(binary_chirho)
    up_img_chirho = Image.fromarray((binary_chirho * 255).astype(np.uint8)).resize(
        (w_chirho * UPSCALE_CHIRHO, h_chirho * UPSCALE_CHIRHO), Image.BICUBIC
    )
    up_bin_chirho = (np.asarray(up_img_chirho) > 110).astype(np.uint8)
    skel_up_chirho = prune_spurs_chirho(zhang_suen_thin_chirho(up_bin_chirho))
    diag_up_chirho = float(np.hypot(*skel_up_chirho.shape)) or 1.0
    min_stroke_chirho = max(2.5 * UPSCALE_CHIRHO, 0.10 * diag_up_chirho)
    strokes_up_chirho = decompose_strokes_chirho(skel_up_chirho, min_stroke_chirho)

    skel_ys_chirho, skel_xs_chirho = np.where(skel_up_chirho == 1)
    pen_vals_chirho = (
        edt_chirho[
            np.clip(skel_ys_chirho // UPSCALE_CHIRHO, 0, h_chirho - 1),
            np.clip(skel_xs_chirho // UPSCALE_CHIRHO, 0, w_chirho - 1),
        ]
        if skel_ys_chirho.size else np.array([1.5])
    )
    pen_r_chirho = float(np.median(pen_vals_chirho))

    strokes_out_chirho = []
    for stroke_chirho in strokes_up_chirho:
        pts_xy_chirho = [
            (x_chirho / UPSCALE_CHIRHO, y_chirho / UPSCALE_CHIRHO)
            for (y_chirho, x_chirho) in stroke_chirho
        ]
        simp_chirho = rdp_chirho(pts_xy_chirho, RDP_EPS_CHIRHO)
        # No end-extension in the SEED (that was a fill-fidelity trick that
        # threw points outside the glyph box and confused editing). Clamp
        # every control point into the glyph bounds so the seed is sane.
        strokes_out_chirho.append([
            [round(min(max(float(px_chirho), 0.0), float(w_chirho)), 2),
             round(min(max(float(py_chirho), 0.0), float(h_chirho)), 2)]
            for px_chirho, py_chirho in simp_chirho
        ])
    return {
        "penRadiusChirho": round(pen_r_chirho, 2),
        "wChirho": int(w_chirho),
        "hChirho": int(h_chirho),
        "strokesChirho": strokes_out_chirho,
    }


def main_chirho():
    OUT_PATH_CHIRHO.parent.mkdir(parents=True, exist_ok=True)
    out_chirho = {}
    for cp_dir_chirho in sorted(FONT_DIR_CHIRHO.glob("U+*")):
        for png_chirho in sorted(cp_dir_chirho.glob("*.png")):
            gray_chirho = np.asarray(Image.open(png_chirho).convert("L"))
            key_chirho = f"{cp_dir_chirho.name}/{png_chirho.name}"
            try:
                seed_chirho = seed_for_glyph_chirho(gray_chirho)
                letter_chirho = chr(int(cp_dir_chirho.name[2:], 16))
                tgt_chirho = TARGETS_CHIRHO.get(letter_chirho)
                if tgt_chirho:
                    seed_chirho["strokesChirho"] = coerce_to_target_chirho(
                        seed_chirho["strokesChirho"], tgt_chirho
                    )
                out_chirho[key_chirho] = seed_chirho
            except Exception as e_chirho:
                print(f"skip {key_chirho}: {e_chirho}")
    OUT_PATH_CHIRHO.write_text(json.dumps(out_chirho, ensure_ascii=False, indent=1))
    n_strokes_chirho = sum(len(v_chirho["strokesChirho"]) for v_chirho in out_chirho.values())
    print(f"Wrote {len(out_chirho)} glyph seeds ({n_strokes_chirho} strokes) to {OUT_PATH_CHIRHO}")


if __name__ == "__main__":
    main_chirho()
