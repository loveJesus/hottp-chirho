#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
LOOK, don't theorise: for a few gold words, show the per-column ink
profile, which columns are 'gap', the segment [start:end] ranges the
projection cutter actually emits, and the TIGHT ink bbox INSIDE each
emitted segment — so we can see directly whether (a) contiguous
whitespace runs are collapsed into ONE boundary, (b) leading/trailing
whitespace is cropped off each glyph, (c) glyphs are tight in BOTH axes.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 -u \\
        src-chirho/inspect_segmentation_chirho.py [--n=3] [--gap=0.10]
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

from branching_predictor_chirho import cull_marks_chirho
from eval_gold_set_chirho import segments_proj_rtl_chirho

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
GOLD_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "gold-set-chirho"
CORPUS_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "hebrew-corpus-chirho"
OUT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "seg-inspect-chirho"


def tight_bbox_chirho(gray_chirho):
    ink_chirho = np.asarray(gray_chirho) < 200
    ys_chirho, xs_chirho = np.where(ink_chirho)
    if xs_chirho.size == 0:
        return None
    return (int(xs_chirho.min()), int(xs_chirho.max()),
            int(ys_chirho.min()), int(ys_chirho.max()),
            ink_chirho.shape[1], ink_chirho.shape[0])


def main_chirho():
    n_chirho, gap_chirho = 3, 0.10
    for a_chirho in sys.argv[1:]:
        if a_chirho.startswith("--n="):
            n_chirho = int(a_chirho.split("=", 1)[1])
        if a_chirho.startswith("--gap="):
            gap_chirho = float(a_chirho.split("=", 1)[1])
    OUT_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)
    man_chirho = [m_chirho for m_chirho in json.loads(
        (GOLD_DIR_CHIRHO / "manifest-chirho.json").read_text())["goldChirho"]
        if m_chirho["tierChirho"] == "GOLD_STRICT"][:n_chirho]

    for m_chirho in man_chirho:
        p_chirho = CORPUS_DIR_CHIRHO / m_chirho["cropChirho"]
        if not p_chirho.exists():
            continue
        gray_chirho = np.asarray(Image.open(p_chirho).convert("L"))
        clean_chirho, n_marks_chirho, _ = cull_marks_chirho(gray_chirho)
        ys_chirho, xs_chirho = np.where(clean_chirho)
        x0_chirho, x1_chirho = xs_chirho.min(), xs_chirho.max()
        y0_chirho, y1_chirho = ys_chirho.min(), ys_chirho.max()
        sub_chirho = clean_chirho[y0_chirho:y1_chirho + 1, x0_chirho:x1_chirho + 1]
        h_chirho = max(1, sub_chirho.shape[0])
        colfrac_chirho = sub_chirho.sum(axis=0) / h_chirho
        is_gap_chirho = colfrac_chirho < gap_chirho

        print(f"\n=== {m_chirho['cropChirho']}  gold={m_chirho['goldConsonantsChirho']}"
              f"  marks_culled={n_marks_chirho}  ink-bbox={sub_chirho.shape[1]}w"
              f"x{sub_chirho.shape[0]}h  gap_thresh={gap_chirho} ===")
        col_str_chirho = "".join(
            "." if g_chirho else ("#" if f_chirho > 0.30 else "+")
            for g_chirho, f_chirho in zip(is_gap_chirho, colfrac_chirho))
        print("  cols(.=gap +=thin #=ink): " + col_str_chirho)

        segs_chirho = segments_proj_rtl_chirho(gray_chirho, gap_chirho, 2)
        print(f"  emitted {len(segs_chirho)} segments (shown RTL as cut):")
        for k_chirho, sg_chirho in enumerate(segs_chirho):
            bb_chirho = tight_bbox_chirho(sg_chirho)
            sh_chirho = sg_chirho.shape
            if bb_chirho is None:
                print(f"    seg{k_chirho}: EMPTY ({sh_chirho[1]}x{sh_chirho[0]})")
                continue
            bx0_chirho, bx1_chirho, by0_chirho, by1_chirho, sw_chirho, shh_chirho = bb_chirho
            lead_chirho = bx0_chirho
            trail_chirho = sw_chirho - 1 - bx1_chirho
            vtop_chirho = by0_chirho
            vbot_chirho = shh_chirho - 1 - by1_chirho
            print(f"    seg{k_chirho}: sliced {sw_chirho}x{shh_chirho}  "
                  f"ink {bx1_chirho - bx0_chirho + 1}x{by1_chirho - by0_chirho + 1}  "
                  f"| H-whitespace lead={lead_chirho} trail={trail_chirho}  "
                  f"V-whitespace top={vtop_chirho} bot={vbot_chirho}"
                  + ("  <-- WHITESPACE NOT CROPPED" if max(
                      lead_chirho, trail_chirho, vtop_chirho, vbot_chirho) > 1
                     else "  ok-tight-H" if (lead_chirho <= 1 and trail_chirho <= 1)
                     else ""))
        # annotated PNG: original + red cut columns
        vis_chirho = Image.fromarray(
            np.where(sub_chirho, 0, 255).astype(np.uint8)).convert("RGB")
        px_chirho = vis_chirho.load()
        run_chirho = 0
        for cx_chirho in range(sub_chirho.shape[1]):
            if is_gap_chirho[cx_chirho]:
                run_chirho += 1
                for cy_chirho in range(sub_chirho.shape[0]):
                    px_chirho[cx_chirho, cy_chirho] = (255, 210, 210)
            else:
                run_chirho = 0
        outp_chirho = OUT_DIR_CHIRHO / f"seg-{m_chirho['cropChirho']}"
        vis_chirho.save(outp_chirho)
        print(f"  annotated -> {outp_chirho}")


if __name__ == "__main__":
    main_chirho()
