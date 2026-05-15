#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Helper invoked by polygon-annotate-server-chirho.ts.

Reads a JSON payload on stdin describing one word's polygon annotations:
{
  "batchDirChirho":    "...",
  "fontDirChirho":     "...",
  "wordIdChirho":      <int>,
  "cropFileChirho":    "word-XYZ-chirho.png",
  "volChirho":         <int>,
  "imageScaleChirho":  <float, the canvas/image ratio>,
  "polygonsChirho":    [{"letterChirho": "ב", "pointsChirho": [[x, y], ...]}, ...]
}

For each polygon: build a binary mask via PIL.ImageDraw.polygon(), apply it
to the word crop (paint everything outside the polygon WHITE), tight-crop
to the ink extent, and save to fontDir/U+XXXX/word-W-poly-N-chirho.png.

Writes a JSON status line to stdout: {"savedChirho": N}.
"""

import json
import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw
import numpy as np


def main_chirho():
    payload_chirho = json.load(sys.stdin)
    batch_dir_chirho = Path(payload_chirho["batchDirChirho"])
    font_dir_chirho = Path(payload_chirho["fontDirChirho"])
    word_id_chirho = int(payload_chirho["wordIdChirho"])
    crop_file_chirho = payload_chirho["cropFileChirho"]
    vol_chirho = int(payload_chirho["volChirho"])
    scale_chirho = float(payload_chirho.get("imageScaleChirho", 1.0))
    polygons_chirho = payload_chirho["polygonsChirho"]

    src_chirho = batch_dir_chirho / crop_file_chirho
    if not src_chirho.exists():
        print(json.dumps({"savedChirho": 0, "errorChirho": f"source not found: {src_chirho}"}), file=sys.stdout)
        sys.exit(1)

    img_chirho = Image.open(src_chirho).convert("L")
    w_chirho, h_chirho = img_chirho.size

    saved_chirho = 0
    for poly_i_chirho, poly_chirho in enumerate(polygons_chirho):
        letter_chirho = poly_chirho["letterChirho"]
        cp_chirho = ord(letter_chirho)
        # Canvas coords are at scale_chirho × image coords. Divide back down.
        image_points_chirho = [
            (max(0.0, min(w_chirho - 0.5, p_chirho[0] / scale_chirho)), max(0.0, min(h_chirho - 0.5, p_chirho[1] / scale_chirho)))
            for p_chirho in poly_chirho["pointsChirho"]
        ]
        if len(image_points_chirho) < 3:
            continue

        # Build the polygon mask
        mask_chirho = Image.new("L", img_chirho.size, 0)
        ImageDraw.Draw(mask_chirho).polygon(image_points_chirho, fill=255)
        mask_arr_chirho = np.asarray(mask_chirho)

        # Apply mask: keep pixels inside the polygon, set outside to white (paper).
        arr_chirho = np.asarray(img_chirho, dtype=np.uint8).copy()
        arr_chirho[mask_arr_chirho == 0] = 255
        masked_chirho = Image.fromarray(arr_chirho, mode="L")

        # Horizontal-tight, vertical-full crop: keep polygon pixels at their
        # ORIGINAL y within the word-crop so the composer can place letters at
        # their proper baseline. Final-nun's descender stays in the bottom-band,
        # yod's body stays in the top-band, etc. We only trim left/right whitespace.
        ys_chirho, xs_chirho = np.where(mask_arr_chirho > 0)
        if xs_chirho.size == 0 or ys_chirho.size == 0:
            continue
        bx0_chirho = max(0, int(xs_chirho.min()) - 1)
        bx1_chirho = min(w_chirho, int(xs_chirho.max()) + 2)
        # Vertical extent: keep the full word-crop height. The polygon's actual
        # y-band is recorded in a sidecar JSON so the composer knows where the
        # ink lives within the strip (without needing to re-detect it).
        glyph_chirho = masked_chirho.crop((bx0_chirho, 0, bx1_chirho, h_chirho))
        poly_top_chirho = int(ys_chirho.min())
        poly_bottom_chirho = int(ys_chirho.max())

        out_dir_chirho = font_dir_chirho / f"U+{cp_chirho:04X}"
        out_dir_chirho.mkdir(parents=True, exist_ok=True)
        out_stem_chirho = f"vol-{vol_chirho}-word-{word_id_chirho}-poly-{poly_i_chirho:02d}-chirho"
        out_path_chirho = out_dir_chirho / f"{out_stem_chirho}.png"
        glyph_chirho.save(out_path_chirho, optimize=True)
        meta_path_chirho = out_dir_chirho / f"{out_stem_chirho}.json"
        with open(meta_path_chirho, "w") as mf_chirho:
            json.dump({
                "wordIdChirho": word_id_chirho,
                "volChirho": vol_chirho,
                "letterChirho": letter_chirho,
                "wordCropHeightChirho": h_chirho,
                "wordCropWidthChirho": w_chirho,
                "polyTopChirho": poly_top_chirho,
                "polyBottomChirho": poly_bottom_chirho,
                "polyXMinChirho": bx0_chirho,
                "polyXMaxChirho": bx1_chirho,
                "polyHeightChirho": poly_bottom_chirho - poly_top_chirho,
                "glyphHeightChirho": glyph_chirho.height,
                "glyphWidthChirho": glyph_chirho.width,
            }, mf_chirho, ensure_ascii=False, indent=2)
        saved_chirho += 1

    print(json.dumps({"savedChirho": saved_chirho}))


if __name__ == "__main__":
    main_chirho()
