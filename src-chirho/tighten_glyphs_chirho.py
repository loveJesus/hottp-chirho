#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Re-crop every stored v3 glyph PNG to hug its ink (non-white) pixels on BOTH
axes. The polygon bounding box is NOT a reliable position anchor (slanted
edges, irregular shapes), so the user's model is pixel-driven: a glyph's
footprint = its actual ink extent. Leftmost ink is the leftmost position;
width is the ink width.

Non-destructive: the untouched originals are copied once to
workspace-chirho/bitmap-font-v3-raw-chirho/ before anything is rewritten
(disk is cheap, re-annotation is not — [[feedback-persist-human-data]]).
Sidecar JSONs (future glyphs) keep their original word-crop-coordinate
position fields untouched; only glyphHeight/glyphWidth are refreshed.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/tighten_glyphs_chirho.py
"""
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
FONT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-chirho"
RAW_BACKUP_DIR_CHIRHO = (
    PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-raw-chirho"
)
INK_THRESH_CHIRHO = 200
PAD_PX_CHIRHO = 1


def main_chirho():
    if not FONT_DIR_CHIRHO.exists():
        print("no font dir")
        return

    if not RAW_BACKUP_DIR_CHIRHO.exists():
        shutil.copytree(FONT_DIR_CHIRHO, RAW_BACKUP_DIR_CHIRHO)
        print(f"backed up originals -> {RAW_BACKUP_DIR_CHIRHO}")
    else:
        print(f"raw backup already exists ({RAW_BACKUP_DIR_CHIRHO}); not re-backing up")

    tightened_chirho = 0
    skipped_chirho = 0
    for cp_dir_chirho in sorted(FONT_DIR_CHIRHO.glob("U+*")):
        for png_chirho in sorted(cp_dir_chirho.glob("*.png")):
            img_chirho = Image.open(png_chirho).convert("L")
            arr_chirho = np.asarray(img_chirho)
            ys_chirho, xs_chirho = np.where(arr_chirho < INK_THRESH_CHIRHO)
            if ys_chirho.size == 0:
                skipped_chirho += 1
                continue
            x0_chirho = max(0, int(xs_chirho.min()) - PAD_PX_CHIRHO)
            y0_chirho = max(0, int(ys_chirho.min()) - PAD_PX_CHIRHO)
            x1_chirho = min(arr_chirho.shape[1], int(xs_chirho.max()) + 1 + PAD_PX_CHIRHO)
            y1_chirho = min(arr_chirho.shape[0], int(ys_chirho.max()) + 1 + PAD_PX_CHIRHO)
            already_tight_chirho = (
                x0_chirho == 0
                and y0_chirho == 0
                and x1_chirho == arr_chirho.shape[1]
                and y1_chirho == arr_chirho.shape[0]
            )
            cropped_chirho = img_chirho.crop((x0_chirho, y0_chirho, x1_chirho, y1_chirho))
            cropped_chirho.save(png_chirho, optimize=True)
            if not already_tight_chirho:
                tightened_chirho += 1

            sidecar_chirho = png_chirho.with_suffix(".json")
            if sidecar_chirho.exists():
                try:
                    meta_chirho = json.loads(sidecar_chirho.read_text())
                    meta_chirho["glyphHeightChirho"] = cropped_chirho.height
                    meta_chirho["glyphWidthChirho"] = cropped_chirho.width
                    meta_chirho["inkTightenedChirho"] = True
                    sidecar_chirho.write_text(
                        json.dumps(meta_chirho, ensure_ascii=False, indent=2)
                    )
                except Exception:
                    pass

    print(f"tightened {tightened_chirho} glyphs; {skipped_chirho} blank skipped")
    print("composer's runtime ink_tight_crop is now a no-op for these (fine).")


if __name__ == "__main__":
    main_chirho()
