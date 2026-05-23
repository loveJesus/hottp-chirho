#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Visual verification montage for the CRNN word OCR: a grid where each cell
shows the REAL word crop with the model's reading underneath, so results
can be eyeballed (not just trusted as numbers).

Two kinds:
  --kind heldout : reads a per-test-word preds JSON (crop, gold, pred,
                   correct, seenInTrain) dumped by train_word_ocr_chirho.py
                   --dump-preds. Shows CRNN read + WLC-gold + ✓/✗ (green/red),
                   so held-out reads are visually checkable against truth.
  --kind silver  : reads triage-chirho.json AUTO un-gold records. Shows the
                   CRNN read on UNSEEN corpus crops (no gold to compare).

Hebrew is drawn right-to-left (PIL+libraqm direction="rtl").

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/make_ocr_montage_chirho.py --kind heldout \\
        --preds /tmp/ocr_testpreds.json --out workspace-chirho/word-ocr-chirho/montage-heldout-chirho.png
"""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
CORPUS_DIR_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho"
                     / "hebrew-corpus-chirho")
TRIAGE_PATH_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho" / "word-ocr-chirho"
                      / "triage-chirho.json")
HEBREW_FONT_CANDIDATES_CHIRHO = [
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
    str(PROJECT_ROOT_CHIRHO / "workspace-chirho" / "synthetic-fonts-chirho"
        / "FrankRuhlLibre.ttf"),
]
CROP_H_CHIRHO = 52          # scaled crop height in a cell
CELL_W_CHIRHO = 240
CELL_H_CHIRHO = 118
PAD_CHIRHO = 8
GREEN_CHIRHO = (60, 200, 120)
RED_CHIRHO = (235, 90, 90)
GREY_CHIRHO = (150, 160, 175)
WHITE_CHIRHO = (235, 235, 240)


def load_font_chirho(size_chirho):
    for path_chirho in HEBREW_FONT_CANDIDATES_CHIRHO:
        if Path(path_chirho).exists():
            return ImageFont.truetype(path_chirho, size_chirho)
    return ImageFont.load_default()


def scaled_crop_chirho(crop_name_chirho):
    p_chirho = CORPUS_DIR_CHIRHO / crop_name_chirho
    if not p_chirho.exists():
        return None
    im_chirho = Image.open(p_chirho).convert("L")
    w_chirho, h_chirho = im_chirho.size
    if h_chirho == 0:
        return None
    nw_chirho = max(1, min(CELL_W_CHIRHO - 2 * PAD_CHIRHO,
                           round(w_chirho * CROP_H_CHIRHO / h_chirho)))
    return im_chirho.resize((nw_chirho, CROP_H_CHIRHO), Image.BILINEAR).convert("RGB")


def draw_rtl_chirho(draw_chirho, xy_chirho, text_chirho, font_chirho, fill_chirho):
    try:
        draw_chirho.text(xy_chirho, text_chirho, font=font_chirho,
                         fill=fill_chirho, direction="rtl", anchor="ra")
    except Exception:
        # no libraqm: approximate by reversing for visual order
        draw_chirho.text(xy_chirho, text_chirho[::-1], font=font_chirho,
                         fill=fill_chirho, anchor="ra")


def main_chirho():
    ap_chirho = argparse.ArgumentParser()
    ap_chirho.add_argument("--kind", choices=["heldout", "silver"],
                           default="heldout", dest="kind_chirho")
    ap_chirho.add_argument("--preds", default="/tmp/ocr_testpreds.json",
                           dest="preds_chirho")
    ap_chirho.add_argument("--out", required=True, dest="out_chirho")
    ap_chirho.add_argument("--cols", type=int, default=6, dest="cols_chirho")
    ap_chirho.add_argument("--max", type=int, default=48, dest="max_chirho")
    ap_chirho.add_argument("--tess-hebrew-only", action="store_true",
                           dest="tess_hebrew_only_chirho",
                           help="silver: keep only tess-Hebrew crops (the "
                                "is-Hebrew-gated silver the app would use)")
    args_chirho = ap_chirho.parse_args()

    items_chirho = []  # (crop, readingText, goldText|None, correct|None)
    if args_chirho.kind_chirho == "heldout":
        recs_chirho = json.loads(Path(args_chirho.preds_chirho).read_text())["predsChirho"]
        # show the wrong ones first (most informative), then correct
        recs_chirho = sorted(recs_chirho, key=lambda r_chirho: r_chirho["correctChirho"])
        for r_chirho in recs_chirho[:args_chirho.max_chirho]:
            items_chirho.append((r_chirho["cropChirho"], r_chirho["predChirho"],
                                 r_chirho["goldChirho"], r_chirho["correctChirho"]))
    else:
        tri_chirho = json.loads(TRIAGE_PATH_CHIRHO.read_text())["recordsChirho"]
        auto_ungold_chirho = [r_chirho for r_chirho in tri_chirho
                              if r_chirho["bucketChirho"] == "AUTO"
                              and not r_chirho["inGoldChirho"]
                              and (not args_chirho.tess_hebrew_only_chirho
                                   or r_chirho.get("tessHebrewChirho"))]
        for r_chirho in auto_ungold_chirho[:args_chirho.max_chirho]:
            items_chirho.append((r_chirho["cropChirho"], r_chirho["readingChirho"],
                                 None, None))

    cols_chirho = args_chirho.cols_chirho
    rows_chirho = (len(items_chirho) + cols_chirho - 1) // cols_chirho
    header_h_chirho = 40
    W_chirho = cols_chirho * CELL_W_CHIRHO
    H_chirho = header_h_chirho + rows_chirho * CELL_H_CHIRHO
    canvas_chirho = Image.new("RGB", (W_chirho, H_chirho), (16, 16, 24))
    draw_chirho = ImageDraw.Draw(canvas_chirho)
    label_font_chirho = load_font_chirho(15)
    head_font_chirho = load_font_chirho(18)
    small_font_chirho = load_font_chirho(12)

    n_correct_chirho = sum(1 for it_chirho in items_chirho if it_chirho[3])
    if args_chirho.kind_chirho == "heldout":
        head_chirho = (f"CRNN held-out reads — wrong first · "
                       f"{n_correct_chirho}/{len(items_chirho)} shown correct · "
                       f"green=match red=miss (top line CRNN, bottom WLC-gold)")
    else:
        head_chirho = ("CRNN reads on UNSEEN un-gold corpus crops "
                       "(AUTO/silver tier) — read shown under each crop")
    draw_chirho.text((PAD_CHIRHO, 10), head_chirho, font=head_font_chirho,
                     fill=WHITE_CHIRHO)

    for i_chirho, (crop_chirho, read_chirho, gold_chirho, correct_chirho) \
            in enumerate(items_chirho):
        r_chirho, c_chirho = divmod(i_chirho, cols_chirho)
        x0_chirho = c_chirho * CELL_W_CHIRHO
        y0_chirho = header_h_chirho + r_chirho * CELL_H_CHIRHO
        crop_img_chirho = scaled_crop_chirho(crop_chirho)
        if crop_img_chirho is not None:
            cx_chirho = x0_chirho + (CELL_W_CHIRHO - crop_img_chirho.width) // 2
            canvas_chirho.paste(crop_img_chirho, (cx_chirho, y0_chirho + PAD_CHIRHO))
        right_chirho = x0_chirho + CELL_W_CHIRHO - PAD_CHIRHO
        ty_chirho = y0_chirho + PAD_CHIRHO + CROP_H_CHIRHO + 6
        read_color_chirho = (GREEN_CHIRHO if correct_chirho
                             else RED_CHIRHO if correct_chirho is False
                             else WHITE_CHIRHO)
        draw_rtl_chirho(draw_chirho, (right_chirho, ty_chirho), read_chirho,
                        label_font_chirho, read_color_chirho)
        if gold_chirho is not None:
            mark_chirho = "✓" if correct_chirho else "✗"
            draw_chirho.text((x0_chirho + PAD_CHIRHO, ty_chirho), mark_chirho,
                             font=label_font_chirho, fill=read_color_chirho)
            draw_rtl_chirho(draw_chirho, (right_chirho, ty_chirho + 20),
                            gold_chirho, small_font_chirho, GREY_CHIRHO)

    out_path_chirho = Path(args_chirho.out_chirho)
    out_path_chirho.parent.mkdir(parents=True, exist_ok=True)
    canvas_chirho.save(out_path_chirho)
    print(f"montage: {len(items_chirho)} cells -> {out_path_chirho}")


if __name__ == "__main__":
    main_chirho()
