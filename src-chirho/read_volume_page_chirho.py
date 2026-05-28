#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Read EVERY word box of one volume/page with the production CRNN — a
generalization probe + the first stage of minting suggestions for a volume
that has no WLC alignment yet (vols 2-5).

Why this exists: vol-1 is the only WLC-aligned/graded volume, so the held-out
montage only proves the reader on vol-1's vocabulary/typeface. Barthelemy vols
2-5 share the typeface but the model has never seen those pages. Reading an
UNSEEN volume's page and montaging the WLC-plausible reads shows, with NO human
labels, whether the reader generalizes — and yields the exact crop+read pairs a
human reviewer would screen before they become app suggestions.

It crops word boxes straight from the locally re-rendered page (pdftoppm at the
same RENDER_DPI the segmentation used, so D1 boxes line up — verified by extent
check), runs the CRNN, scores each read for WLC-membership (the same automated
plausibility signal as triage_corpus_chirho.py), and writes:
  - <out-crops>/p{page:04d}-x{x}-y{y}-chirho.png   (one per word; montage-named)
  - <out-preds>                                     (predsChirho JSON for the montage)

Render + read + montage (fully local, no prod, no creds):
    bun src-chirho/render-pages-chirho.ts 2 148 148
    PYTORCH_ENABLE_MPS_FALLBACK=1 workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/read_volume_page_chirho.py --vol 2 --page 148 \\
        --image workspace-chirho/images-chirho/vol-2-chirho/page-0148-chirho.png \\
        --out-crops /tmp/vol2-p148-crops-chirho --out-preds /tmp/vol2-p148-preds-chirho.json
    workspace-chirho/classifier-venv-chirho/bin/python3 src-chirho/make_ocr_montage_chirho.py \\
        --kind heldout --corpus-dir /tmp/vol2-p148-crops-chirho \\
        --preds /tmp/vol2-p148-preds-chirho.json --out workspace-chirho/word-ocr-chirho/montage-vol2-p148-chirho.png
"""
import argparse
import json
import math
import shutil
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from PIL import Image, ImageOps

if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from train_word_ocr_chirho import (
    CRNNChirho, NUM_CLASSES_CHIRHO, MODEL_OUT_CHIRHO,
    img_to_tensor_chirho, device_chirho, collate_chirho)
from infer_word_ocr_chirho import decode_with_conf_chirho
from audit_canonical_recon_chirho import (
    load_wlc_validators_chirho, skeleton_in_wlc_chirho)

# Independent is-Hebrew witness: tesseract with the SAME multi-script stack the
# segmentation pass uses (pass1-extract-lines-chirho.ts). Giving tesseract the
# choice of scripts means real Hebrew reads as Hebrew while French contamination
# reads as Latin — so "did tesseract see Hebrew chars?" is a real screen the
# CRNN cannot provide (it has no "not Hebrew" output and confidently misreads
# French as short WLC-exact Hebrew). See project_cross_volume_generalization.
# Validated on vol-2 p148: מלכת/סרו/בדרכ -> Hebrew (kept); une/en/de (CRNN
# hallucinated as פח/חפ/פנ) -> Latin (rejected).
PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
TESSDATA_BEST_DIR_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho"
                            / "tessdata-best-chirho")
TESS_LANG_STACK_CHIRHO = "fra+heb+grc+lat"
TESS_UPSCALE_CHIRHO = 4     # word crops are ~30px tall; tesseract needs bigger
TESS_PAD_CHIRHO = 30        # white margin; tesseract fails on border-touching text

# Second is-Hebrew witness: the v8 whole-word script CNN, used to RESCUE genuine
# Hebrew the tesseract witness wrongly rejects. On real-scan crops tesseract's FN
# rate is ~31-43% (it drops short/degraded Hebrew as Latin/Greek); v8 reads the
# same crops with ~98% Hebrew recall. We only TRUST a v8 rescue at high
# confidence. The classes separate with a clean gap: contamination the CRNN
# hallucinated (real Latin/Greek) scores P(hebrew) <= ~0.96 (e.g. vol5-p149 "EER"
# 0.952), while genuine Hebrew scores >= ~0.994 (vol4 שד 0.994-0.997 — visually
# Hebrew though tesseract misread it "τὴν"; אלהא, דרכו = 1.0). So threshold 0.98
# sits in the gap with margin for render-resolution jitter: it admits 0/41
# vol5-p149 hallucinations yet keeps the genuine vol4 rescues. (NOTE: 0.995 was
# first proposed to reject שד as "Greek", but visual review showed שד IS Hebrew
# — a correct rescue — and 0.995 risks clipping it; hence 0.98.) Gate KEEP =
# tess-Hebrew OR v8 P(hebrew) >= threshold; both witnesses + the probability are
# recorded in the triage for auditability. (Cracked with Codex/GPT via
# metropoliluya 2026-05-27; see project_cross_volume_generalization. CAVEAT:
# positive set is vol-1-heavy; no trusted cross-volume Hebrew recall set yet.)
V8_MODEL_PATH_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho" / "models-chirho"
                        / "script-classifier-v8-chirho.onnx")
V8_GATE_THRESHOLD_CHIRHO = 0.98
V8_IMAGE_SIZE_CHIRHO = 32
V8_HEBREW_CLASS_CHIRHO = 1   # classes: 0 latin, 1 hebrew, 2 greek, 3 symbol


def load_v8_session_chirho():
    """Lazy-load the v8 ONNX is-Hebrew classifier (CPU is plenty: ~0.01 ms/crop)."""
    if not V8_MODEL_PATH_CHIRHO.exists():
        return None
    return ort.InferenceSession(str(V8_MODEL_PATH_CHIRHO),
                                providers=["CPUExecutionProvider"])


def v8_pheb_chirho(session_chirho, crop_img_chirho):
    """P(hebrew) for a whole word crop from the v8 CNN. crop_img_chirho is a PIL
    grayscale image; matches training preprocessing (Resize 32x32, Normalize 0.5/0.5)."""
    if session_chirho is None:
        return 0.0
    g_chirho = crop_img_chirho.convert("L").resize(
        (V8_IMAGE_SIZE_CHIRHO, V8_IMAGE_SIZE_CHIRHO), Image.LANCZOS)
    arr_chirho = (np.asarray(g_chirho, dtype=np.float32) / 255.0 - 0.5) / 0.5
    arr_chirho = arr_chirho.reshape(1, 1, V8_IMAGE_SIZE_CHIRHO, V8_IMAGE_SIZE_CHIRHO)
    logits_chirho = session_chirho.run(None, {"input": arr_chirho})[0][0]
    exp_chirho = np.exp(logits_chirho - logits_chirho.max())
    return float((exp_chirho / exp_chirho.sum())[V8_HEBREW_CLASS_CHIRHO])

# Vol 5's persisted D1 boxes were produced from `pdftohtml -xml`, whose page
# coordinate space is 892x1263 at Poppler's default 108-ish DPI. Pass A then
# multiplied those XML units by 300/72, treating them as PDF points. The reader
# crops a 300 DPI render, so the old D1 bbox must be scaled back to render
# pixels. Keep crop filenames in the original D1 space because the SQL loader
# resolves word_id by filename x/y against words_chirho.
VOL5_PDFTOHTML_XML_WIDTH_CHIRHO = 892.0
VOL5_PDFTOHTML_XML_HEIGHT_CHIRHO = 1263.0
VOL5_STORED_XML_SCALE_CHIRHO = 300.0 / 72.0


def has_hebrew_chirho(text_chirho):
    """True if any char falls in the Hebrew unicode block (U+0590..U+05FF)."""
    return any("֐" <= c_chirho <= "׿" for c_chirho in (text_chirho or ""))


def tess_text_chirho(crop_path_chirho, tmp_dir_chirho):
    """Run tesseract (multi-script stack, single-line psm) on one word crop and
    return the recognized text — the independent witness for the is-Hebrew gate.

    Two non-obvious requirements, both learned the hard way (0/26 false-reject):
      1. UPSCALE+PAD: a raw ~80x30 word crop yields EMPTY from tesseract; a 4x
         upscale with a white border reads cleanly.
      2. PROJECT-LOCAL temp path: under the agent Bash sandbox, files written to
         /tmp (incl. tempfile.TemporaryDirectory) are NOT readable by the
         tesseract child ("Leptonica: image file not found"), even though Python
         can read them. Writing the temp image inside the repo works. So callers
         MUST pass a tmp_dir_chirho under PROJECT_ROOT_CHIRHO.
    Best-effort: any failure yields '' (treated as non-Hebrew = rejected)."""
    try:
        crop_im_chirho = Image.open(crop_path_chirho).convert("L")
    except Exception:
        return ""
    big_chirho = crop_im_chirho.resize(
        (max(1, crop_im_chirho.width * TESS_UPSCALE_CHIRHO),
         max(1, crop_im_chirho.height * TESS_UPSCALE_CHIRHO)), Image.LANCZOS)
    big_chirho = ImageOps.expand(big_chirho, border=TESS_PAD_CHIRHO, fill=255)
    gate_in_chirho = Path(tmp_dir_chirho) / "gate_in_chirho.png"
    big_chirho.save(gate_in_chirho)
    stem_chirho = str(Path(tmp_dir_chirho) / "gate_out_chirho")
    try:
        subprocess.run(
            ["tesseract", str(gate_in_chirho), stem_chirho,
             "--tessdata-dir", str(TESSDATA_BEST_DIR_CHIRHO),
             "-l", TESS_LANG_STACK_CHIRHO, "--psm", "7", "--dpi", "300"],
            capture_output=True, text=True, timeout=30, check=False)
    except Exception:
        return ""
    txt_path_chirho = Path(stem_chirho + ".txt")
    if txt_path_chirho.exists():
        return txt_path_chirho.read_text(errors="ignore").strip()
    return ""


def fetch_words_chirho(db_path_chirho, vol_chirho, page_chirho):
    """Word boxes for one volume/page, in reading order."""
    conn_chirho = sqlite3.connect(f"file:{db_path_chirho}?mode=ro", uri=True)
    try:
        rows_chirho = conn_chirho.execute(
            """
            SELECT w.id_chirho, w.x_min_chirho, w.y_min_chirho,
                   w.x_max_chirho, w.y_max_chirho
            FROM words_chirho w
            JOIN scanlines_chirho s ON s.id_chirho = w.scanline_id_chirho
            JOIN pages_chirho p ON p.id_chirho = s.page_id_chirho
            WHERE p.volume_number_chirho = ? AND p.page_number_chirho = ?
              AND w.x_min_chirho IS NOT NULL
            ORDER BY s.line_index_chirho, w.word_index_chirho
            """,
            (vol_chirho, page_chirho),
        ).fetchall()
    finally:
        conn_chirho.close()
    return rows_chirho


def should_apply_vol5_calibration_chirho(vol_chirho, words_chirho,
                                         image_size_chirho):
    """True when vol-5 D1 boxes still live in the inflated pdftohtml space."""
    if vol_chirho != 5 or not words_chirho:
        return False
    image_width_chirho, image_height_chirho = image_size_chirho
    max_x_chirho = max(float(row_chirho[3]) for row_chirho in words_chirho)
    max_y_chirho = max(float(row_chirho[4]) for row_chirho in words_chirho)
    return max_x_chirho > image_width_chirho or max_y_chirho > image_height_chirho


def vol5_calibration_scales_chirho(image_size_chirho):
    """Return old-D1-space -> render-pixel affine scales for vol 5."""
    image_width_chirho, image_height_chirho = image_size_chirho
    stored_width_chirho = (
        VOL5_PDFTOHTML_XML_WIDTH_CHIRHO * VOL5_STORED_XML_SCALE_CHIRHO
    )
    stored_height_chirho = (
        VOL5_PDFTOHTML_XML_HEIGHT_CHIRHO * VOL5_STORED_XML_SCALE_CHIRHO
    )
    return (
        image_width_chirho / stored_width_chirho,
        image_height_chirho / stored_height_chirho,
    )


def calibrated_crop_box_chirho(raw_box_chirho, scale_x_chirho, scale_y_chirho,
                               image_size_chirho):
    """Map a raw D1 bbox into page-render pixels and clamp to image bounds."""
    image_width_chirho, image_height_chirho = image_size_chirho
    left_chirho = max(0, math.floor(raw_box_chirho[0] * scale_x_chirho))
    top_chirho = max(0, math.floor(raw_box_chirho[1] * scale_y_chirho))
    right_chirho = min(
        image_width_chirho, math.ceil(raw_box_chirho[2] * scale_x_chirho)
    )
    bottom_chirho = min(
        image_height_chirho, math.ceil(raw_box_chirho[3] * scale_y_chirho)
    )
    return (left_chirho, top_chirho, right_chirho, bottom_chirho)


def main_chirho():
    ap_chirho = argparse.ArgumentParser()
    ap_chirho.add_argument("--vol", type=int, required=True, dest="vol_chirho")
    ap_chirho.add_argument("--page", type=int, required=True, dest="page_chirho")
    ap_chirho.add_argument("--image", required=True, dest="image_chirho")
    ap_chirho.add_argument("--db", dest="db_chirho", default=None,
                           help="local D1 sqlite (default: autodetect miniflare)")
    ap_chirho.add_argument("--out-crops", required=True, dest="out_crops_chirho")
    ap_chirho.add_argument("--out-preds", required=True, dest="out_preds_chirho")
    ap_chirho.add_argument("--auto-conf", type=float, default=0.90,
                           dest="auto_conf_chirho")
    ap_chirho.add_argument("--tess-gate", action=argparse.BooleanOptionalAction,
                           default=True, dest="tess_gate_chirho",
                           help="run the independent tesseract is-Hebrew gate on "
                                "AUTO candidates (default on; --no-tess-gate to "
                                "see the raw WLC-membership contamination)")
    ap_chirho.add_argument("--out-triage", default=None, dest="out_triage_chirho",
                           help="also write a load-ocr-suggestions-chirho.ts "
                                "compatible triage JSON (records w/ tessHebrewChirho)")
    args_chirho = ap_chirho.parse_args()

    db_path_chirho = args_chirho.db_chirho
    if not db_path_chirho:
        root_chirho = Path(__file__).resolve().parent.parent
        hits_chirho = list((root_chirho / "app-chirho" / ".wrangler" / "state"
                            / "v3" / "d1" / "miniflare-D1DatabaseObject").glob("*.sqlite"))
        if not hits_chirho:
            print("no local D1 sqlite found; pass --db")
            return
        db_path_chirho = str(hits_chirho[0])

    if not MODEL_OUT_CHIRHO.exists():
        print(f"no model at {MODEL_OUT_CHIRHO}; train first.")
        return
    dev_chirho = device_chirho()
    ckpt_chirho = torch.load(MODEL_OUT_CHIRHO, map_location=dev_chirho)
    model_chirho = CRNNChirho(NUM_CLASSES_CHIRHO).to(dev_chirho)
    model_chirho.load_state_dict(ckpt_chirho["modelChirho"])
    model_chirho.train(False)
    word_skel_chirho, verse_blob_chirho = load_wlc_validators_chirho()

    page_img_chirho = Image.open(args_chirho.image_chirho).convert("L")
    words_chirho = fetch_words_chirho(db_path_chirho, args_chirho.vol_chirho,
                                      args_chirho.page_chirho)
    print(f"vol-{args_chirho.vol_chirho} p{args_chirho.page_chirho}: "
          f"{len(words_chirho)} word boxes; image {page_img_chirho.size}")

    calibration_scales_chirho = None
    if should_apply_vol5_calibration_chirho(
            args_chirho.vol_chirho, words_chirho, page_img_chirho.size):
        calibration_scales_chirho = vol5_calibration_scales_chirho(
            page_img_chirho.size)
        print("  vol-5 bbox calibration: old-D1 -> render pixels "
              f"x*{calibration_scales_chirho[0]:.6f}, "
              f"y*{calibration_scales_chirho[1]:.6f} "
              "(crop filenames keep old D1 x/y for loader matching)")

    out_crops_chirho = Path(args_chirho.out_crops_chirho)
    out_crops_chirho.mkdir(parents=True, exist_ok=True)

    # crop every word, name it the way the montage + loader expect
    crops_chirho = []   # (crop_name, PIL_L_crop)
    for (_id_chirho, xmin_chirho, ymin_chirho,
         xmax_chirho, ymax_chirho) in words_chirho:
        raw_box_chirho = (int(round(xmin_chirho)), int(round(ymin_chirho)),
                          int(round(xmax_chirho)), int(round(ymax_chirho)))
        if (raw_box_chirho[2] <= raw_box_chirho[0]
                or raw_box_chirho[3] <= raw_box_chirho[1]):
            continue
        crop_box_chirho = raw_box_chirho
        if calibration_scales_chirho is not None:
            crop_box_chirho = calibrated_crop_box_chirho(
                raw_box_chirho,
                calibration_scales_chirho[0],
                calibration_scales_chirho[1],
                page_img_chirho.size,
            )
        if (crop_box_chirho[2] <= crop_box_chirho[0]
                or crop_box_chirho[3] <= crop_box_chirho[1]):
            continue
        name_chirho = (f"p{args_chirho.page_chirho:04d}"
                       f"-x{raw_box_chirho[0]}-y{raw_box_chirho[1]}-chirho.png")
        crop_chirho = page_img_chirho.crop(crop_box_chirho)
        crop_chirho.save(out_crops_chirho / name_chirho)
        crops_chirho.append((name_chirho, crop_chirho))

    # CRNN read + WLC verdict, batched
    preds_chirho = []   # (name, reading, conf, verdict)
    bs_chirho = 32
    for i_chirho in range(0, len(crops_chirho), bs_chirho):
        chunk_chirho = crops_chirho[i_chirho:i_chirho + bs_chirho]
        items_chirho = [(img_to_tensor_chirho(c_chirho), [1])
                        for _n_chirho, c_chirho in chunk_chirho]
        batch_chirho = collate_chirho(items_chirho)
        if batch_chirho is None:
            continue
        with torch.no_grad():
            logits_chirho = model_chirho(batch_chirho[0].to(dev_chirho))
        for (name_chirho, _c_chirho), (reading_chirho, conf_chirho) in zip(
                chunk_chirho, decode_with_conf_chirho(logits_chirho)):
            verdict_chirho, _ = skeleton_in_wlc_chirho(
                reading_chirho, word_skel_chirho, verse_blob_chirho)
            preds_chirho.append((name_chirho, reading_chirho,
                                 conf_chirho, verdict_chirho))

    n_chirho = len(preds_chirho)
    exact_chirho = [p_chirho for p_chirho in preds_chirho if p_chirho[3] == "exact"]
    substr_chirho = sum(1 for p_chirho in preds_chirho if p_chirho[3] == "substr")
    auto_chirho = [p_chirho for p_chirho in exact_chirho
                   if p_chirho[2] >= args_chirho.auto_conf_chirho
                   and len(p_chirho[1]) >= 2]
    print(f"  read {n_chirho} words | WLC-exact {len(exact_chirho)} "
          f"({len(exact_chirho)/max(1,n_chirho):.2f}) | substr {substr_chirho} | "
          f"AUTO (exact & conf>={args_chirho.auto_conf_chirho} & len>=2) "
          f"{len(auto_chirho)}")

    # independent is-Hebrew gate on each AUTO candidate (the small set we'd
    # surface) — NOT all words, to keep the tesseract cost bounded. The CRNN
    # has no "not Hebrew" output, so WLC-membership alone is ~70% French on an
    # unseen volume; only a crop tesseract ALSO reads as Hebrew may be minted.
    auto_chirho.sort(key=lambda p_chirho: -p_chirho[2])
    crop_by_name_chirho = {n_chirho: c_chirho for n_chirho, c_chirho in crops_chirho}
    v8_session_chirho = load_v8_session_chirho()
    # gated tuple: (name, reading, conf, verdict, tess_text, tess_heb, v8_pheb, is_heb)
    gated_chirho = []
    if args_chirho.tess_gate_chirho:
        # temp dir MUST live under the repo (see tess_text_chirho docstring:
        # the sandbox hides /tmp from the tesseract child).
        tess_tmp_chirho = Path(tempfile.mkdtemp(prefix="gate-tmp-",
                                                dir=str(PROJECT_ROOT_CHIRHO)))
        try:
            for (name_chirho, reading_chirho, conf_chirho,
                 verdict_chirho) in auto_chirho:
                tess_text_value_chirho = tess_text_chirho(
                    out_crops_chirho / name_chirho, tess_tmp_chirho)
                tess_heb_chirho = has_hebrew_chirho(tess_text_value_chirho)
                v8_pheb_value_chirho = v8_pheb_chirho(
                    v8_session_chirho, crop_by_name_chirho[name_chirho])
                is_heb_chirho = (tess_heb_chirho
                                 or v8_pheb_value_chirho >= V8_GATE_THRESHOLD_CHIRHO)
                gated_chirho.append((name_chirho, reading_chirho, conf_chirho,
                                     verdict_chirho, tess_text_value_chirho,
                                     tess_heb_chirho, v8_pheb_value_chirho,
                                     is_heb_chirho))
        finally:
            shutil.rmtree(tess_tmp_chirho, ignore_errors=True)
    else:
        gated_chirho = [(name_chirho, reading_chirho, conf_chirho,
                         verdict_chirho, "", True, 1.0, True)
                        for (name_chirho, reading_chirho, conf_chirho,
                             verdict_chirho) in auto_chirho]
    n_tess_chirho = sum(1 for g_chirho in gated_chirho if g_chirho[5])
    n_pass_chirho = sum(1 for g_chirho in gated_chirho if g_chirho[7])
    n_rescued_chirho = sum(1 for g_chirho in gated_chirho
                           if g_chirho[7] and not g_chirho[5])
    print(f"  is-Hebrew gate: {n_pass_chirho}/{len(gated_chirho)} AUTO kept "
          f"(tess {n_tess_chirho} + v8-rescued {n_rescued_chirho} at "
          f"P(heb)>={V8_GATE_THRESHOLD_CHIRHO}); rest = contamination, rejected")

    # montage EVERY AUTO candidate, colored by the gate (green = tesseract also
    # read Hebrew → kept; red = tesseract read non-Hebrew → contamination the
    # gate kills). The tesseract reading is shown as the grey "gold" line so the
    # screen is visually auditable. Wrong-first sort surfaces rejects on top.
    def gate_reason_chirho(tess_heb_chirho, v8_pheb_value_chirho):
        v8_ok_chirho = v8_pheb_value_chirho >= V8_GATE_THRESHOLD_CHIRHO
        if tess_heb_chirho and v8_ok_chirho:
            return "both"
        if tess_heb_chirho:
            return "tess"
        if v8_ok_chirho:
            return "v8-rescue"
        return "reject"

    recs_chirho = [{
        "cropChirho": name_chirho,
        "predChirho": reading_chirho,
        # grey audit line: what tesseract read + v8's Hebrew probability
        "goldChirho": f"{tess_text_value_chirho or '∅'} · v8={v8_pheb_value_chirho:.2f}",
        "correctChirho": is_heb_chirho,   # montage green = kept by the combined gate
        "confChirho": round(conf_chirho, 4),
        "verdictChirho": verdict_chirho,
        "tessHebrewChirho": tess_heb_chirho,
        "v8PHebChirho": round(v8_pheb_value_chirho, 4),
        "isHebrewChirho": is_heb_chirho,
        "gateReasonChirho": gate_reason_chirho(tess_heb_chirho, v8_pheb_value_chirho),
    } for (name_chirho, reading_chirho, conf_chirho, verdict_chirho,
           tess_text_value_chirho, tess_heb_chirho, v8_pheb_value_chirho,
           is_heb_chirho) in gated_chirho]
    Path(args_chirho.out_preds_chirho).write_text(
        json.dumps({"predsChirho": recs_chirho}, ensure_ascii=False))
    print(f"  wrote {len(recs_chirho)} AUTO preds -> {args_chirho.out_preds_chirho}")

    # loader-compatible triage JSON (load-ocr-suggestions-chirho.ts --triage=...).
    # tessHebrewChirho carries the gate the loader REQUIRES; non-Hebrew rows are
    # written too (bucket AUTO) but the loader skips them on the gate.
    if args_chirho.out_triage_chirho:
        triage_recs_chirho = [{
            "cropChirho": name_chirho,
            "pageChirho": args_chirho.page_chirho,
            "readingChirho": reading_chirho,
            "confChirho": round(conf_chirho, 4),
            "wlcVerdictChirho": verdict_chirho,
            "bucketChirho": "AUTO",
            "tessHebrewChirho": tess_heb_chirho,
            "v8PHebChirho": round(v8_pheb_value_chirho, 4),
            # isHebrewChirho is the combined gate the loader keys on (tess OR v8);
            # tessHebrewChirho kept for transparency / back-compat.
            "isHebrewChirho": is_heb_chirho,
            "gateReasonChirho": gate_reason_chirho(tess_heb_chirho, v8_pheb_value_chirho),
        } for (name_chirho, reading_chirho, conf_chirho, verdict_chirho,
               _tess_text_value_chirho, tess_heb_chirho, v8_pheb_value_chirho,
               is_heb_chirho) in gated_chirho]
        Path(args_chirho.out_triage_chirho).write_text(
            json.dumps({"recordsChirho": triage_recs_chirho}, ensure_ascii=False))
        print(f"  wrote {len(triage_recs_chirho)} triage records "
              f"({n_pass_chirho} is-Hebrew, loader-ready) "
              f"-> {args_chirho.out_triage_chirho}")


if __name__ == "__main__":
    main_chirho()
