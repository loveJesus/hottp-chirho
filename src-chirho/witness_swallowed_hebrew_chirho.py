#!/usr/bin/env python3
# For God so loved the world, that he gave his only begotten Son,
# that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""
On-demand CRNN witness pass for the swallowed-Hebrew sweep (reviewer UX v2
plan, Phase 5).

The gated witness preds (ocr-preds-chirho) systematically SKIP swallowed
Hebrew: the same detection gate that failed to see the Hebrew also skipped
generating a read for it. This script closes that hole by reading exactly the
crops the sweep flagged: every finding's evidence x-range plus every Hebrew
span with no covering gated read, cut from the scanline PNGs.

Per crop it records: the CRNN reading + confidence, WLC plausibility verdict
(exact / substr / ABSENT), the v8 script-classifier P(hebrew), and a
comparison against the stored span text's consonant skeleton.

Read-only witness: writes ONE JSON artifact (fingerprinted, in the gitignored
workspace tree); never touches spans, proposals, review rows, or gate state.

Run:
    PYTORCH_ENABLE_MPS_FALLBACK=1 \\
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/witness_swallowed_hebrew_chirho.py
"""
import argparse
import datetime
import hashlib
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image
import torch

if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from train_word_ocr_chirho import (
    CRNNChirho, NUM_CLASSES_CHIRHO, MODEL_OUT_CHIRHO,
    img_to_tensor_chirho, device_chirho, collate_chirho)
from infer_word_ocr_chirho import decode_with_conf_chirho
from audit_canonical_recon_chirho import (
    load_wlc_validators_chirho, skeleton_in_wlc_chirho)
from read_volume_page_chirho import load_v8_session_chirho, v8_pheb_chirho

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
SWEEP_DIR_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho"
                    / "swallowed-hebrew-sweep-chirho")
DEFAULT_CANDIDATES_CHIRHO = SWEEP_DIR_CHIRHO / "candidates-2026-07-18-chirho.json"
DEFAULT_OUT_CHIRHO = SWEEP_DIR_CHIRHO / "witness-reads-2026-07-18-chirho.json"
CROP_PAD_PX_CHIRHO = 4
BATCH_SIZE_CHIRHO = 32
HEBREW_SKELETON_RE_CHIRHO = re.compile(r"[֑-ׇ]")
HEBREW_LETTER_RE_CHIRHO = re.compile(r"[^א-ת]")


def hebrew_skeleton_chirho(text_chirho):
    stripped_chirho = HEBREW_SKELETON_RE_CHIRHO.sub("", text_chirho or "")
    return HEBREW_LETTER_RE_CHIRHO.sub("", stripped_chirho)


def sha256_file_chirho(path_chirho):
    return hashlib.sha256(Path(path_chirho).read_bytes()).hexdigest()


def build_targets_chirho(candidates_chirho):
    """Yield one crop target per flagged evidence range / span x-range."""
    targets_chirho = []
    for finding_chirho in candidates_chirho.get("findingsChirho", []):
        ranged_chirho = [
            ev_chirho for ev_chirho in finding_chirho.get("wordEvidenceChirho", [])
            if ev_chirho.get("relXMinChirho") is not None]
        if ranged_chirho:
            for ev_chirho in ranged_chirho:
                targets_chirho.append({
                    "spanKeyChirho": finding_chirho["spanKeyChirho"],
                    "targetKindChirho": "flagged-evidence-chirho",
                    "storedTextChirho": finding_chirho["spanTextChirho"],
                    "evidenceTextChirho": ev_chirho["textChirho"],
                    "relXMinChirho": float(ev_chirho["relXMinChirho"]),
                    "relXMaxChirho": float(ev_chirho["relXMaxChirho"]),
                    "lineWidthPxChirho": finding_chirho["lineWidthPxChirho"],
                    "scanlinePathChirho": finding_chirho["scanlinePathChirho"],
                    "severityChirho": finding_chirho["severityChirho"],
                    "signalsChirho": finding_chirho["signalsChirho"],
                })
        else:
            targets_chirho.append({
                "spanKeyChirho": finding_chirho["spanKeyChirho"],
                "targetKindChirho": "flagged-span-chirho",
                "storedTextChirho": finding_chirho["spanTextChirho"],
                "evidenceTextChirho": None,
                "relXMinChirho": float(finding_chirho["xMinPxChirho"]),
                "relXMaxChirho": float(finding_chirho["xMinPxChirho"]
                                       + finding_chirho["widthPxChirho"]),
                "lineWidthPxChirho": finding_chirho["lineWidthPxChirho"],
                "scanlinePathChirho": finding_chirho["scanlinePathChirho"],
                "severityChirho": finding_chirho["severityChirho"],
                "signalsChirho": finding_chirho["signalsChirho"],
            })
    for span_chirho in candidates_chirho.get("unwitnessedHebrewSpansChirho", []):
        targets_chirho.append({
            "spanKeyChirho": span_chirho["spanKeyChirho"],
            "targetKindChirho": "unwitnessed-hebrew-span-chirho",
            "storedTextChirho": span_chirho["spanTextChirho"],
            "evidenceTextChirho": None,
            "relXMinChirho": float(span_chirho["xMinPxChirho"]),
            "relXMaxChirho": float(span_chirho["xMinPxChirho"]
                                   + span_chirho["widthPxChirho"]),
            "lineWidthPxChirho": span_chirho["lineWidthPxChirho"],
            "scanlinePathChirho": span_chirho["scanlinePathChirho"],
            "severityChirho": None,
            "signalsChirho": [],
        })
    return targets_chirho


def crop_target_chirho(target_chirho, image_cache_chirho):
    """Cut the target x-range (line-width space) from its scanline PNG."""
    path_chirho = PROJECT_ROOT_CHIRHO / target_chirho["scanlinePathChirho"]
    if path_chirho not in image_cache_chirho:
        if not path_chirho.exists():
            image_cache_chirho[path_chirho] = None
        else:
            image_cache_chirho[path_chirho] = Image.open(path_chirho).convert("L")
    image_chirho = image_cache_chirho[path_chirho]
    if image_chirho is None:
        return None, "missing-scanline-chirho"
    scale_chirho = image_chirho.width / max(1.0, float(target_chirho["lineWidthPxChirho"]))
    x0_chirho = int(max(0, target_chirho["relXMinChirho"] * scale_chirho
                        - CROP_PAD_PX_CHIRHO))
    x1_chirho = int(min(image_chirho.width,
                        target_chirho["relXMaxChirho"] * scale_chirho
                        + CROP_PAD_PX_CHIRHO))
    if x1_chirho - x0_chirho < 4:
        return None, "degenerate-crop-chirho"
    wide_chirho = image_chirho.crop((x0_chirho, 0, x1_chirho, image_chirho.height))
    # Scanline PNGs carry the neighbor print lines above and below; the target
    # line is the band at the vertical center. The CRNN trained on tight word
    # boxes (~30px tall), so feed it only that center ink band.
    arr_chirho = np.asarray(wide_chirho, dtype=np.uint8)
    ink_any_chirho = (arr_chirho < 160).any(axis=1)
    bands_chirho = []
    start_chirho = None
    for y_chirho, inked_chirho in enumerate(ink_any_chirho):
        if inked_chirho and start_chirho is None:
            start_chirho = y_chirho
        if not inked_chirho and start_chirho is not None:
            bands_chirho.append((start_chirho, y_chirho))
            start_chirho = None
    if start_chirho is not None:
        bands_chirho.append((start_chirho, len(ink_any_chirho)))
    center_chirho = wide_chirho.height / 2.0
    band_chirho = None
    for candidate_chirho in bands_chirho:
        if candidate_chirho[0] <= center_chirho < candidate_chirho[1]:
            band_chirho = candidate_chirho
            break
    if band_chirho is None and bands_chirho:
        band_chirho = max(
            bands_chirho,
            key=lambda b_chirho: (b_chirho[1] - b_chirho[0])
            - abs((b_chirho[0] + b_chirho[1]) / 2.0 - center_chirho))
    if band_chirho is not None:
        y0_chirho = max(0, band_chirho[0] - 2)
        y1_chirho = min(wide_chirho.height, band_chirho[1] + 3)
        if y1_chirho - y0_chirho >= 8:
            return wide_chirho.crop((0, y0_chirho, wide_chirho.width, y1_chirho)), None
    return wide_chirho, None


def main_chirho():
    ap_chirho = argparse.ArgumentParser()
    ap_chirho.add_argument("--candidates", default=str(DEFAULT_CANDIDATES_CHIRHO),
                           dest="candidates_chirho")
    ap_chirho.add_argument("--out", default=str(DEFAULT_OUT_CHIRHO),
                           dest="out_chirho")
    args_chirho = ap_chirho.parse_args()

    candidates_path_chirho = Path(args_chirho.candidates_chirho)
    candidates_chirho = json.loads(candidates_path_chirho.read_text())
    targets_chirho = build_targets_chirho(candidates_chirho)
    print(f"witness targets: {len(targets_chirho)} "
          f"(from {candidates_path_chirho.name})")

    dev_chirho = device_chirho()
    ckpt_chirho = torch.load(MODEL_OUT_CHIRHO, map_location=dev_chirho)
    model_chirho = CRNNChirho(NUM_CLASSES_CHIRHO).to(dev_chirho)
    model_chirho.load_state_dict(ckpt_chirho["modelChirho"])
    model_chirho.train(False)
    word_skel_chirho, verse_blob_chirho = load_wlc_validators_chirho()
    try:
        ort_session_chirho = load_v8_session_chirho()
    except Exception as exc_chirho:  # v8 witness is optional
        print(f"v8 classifier unavailable ({exc_chirho}); continuing without")
        ort_session_chirho = None

    image_cache_chirho = {}
    records_chirho = []
    pending_chirho = []  # (record, tensor)
    for target_chirho in targets_chirho:
        crop_chirho, skip_chirho = crop_target_chirho(target_chirho, image_cache_chirho)
        record_chirho = dict(target_chirho)
        record_chirho["skipReasonChirho"] = skip_chirho
        record_chirho["crnnReadingChirho"] = None
        record_chirho["crnnConfChirho"] = None
        record_chirho["wlcVerdictChirho"] = None
        record_chirho["v8PHebChirho"] = None
        records_chirho.append(record_chirho)
        if crop_chirho is None:
            continue
        if ort_session_chirho is not None:
            try:
                record_chirho["v8PHebChirho"] = round(
                    float(v8_pheb_chirho(ort_session_chirho, crop_chirho)), 4)
            except Exception:
                record_chirho["v8PHebChirho"] = None
        tensor_chirho = img_to_tensor_chirho(crop_chirho)
        if tensor_chirho is None:
            record_chirho["skipReasonChirho"] = "empty-tensor-chirho"
            continue
        pending_chirho.append((record_chirho, tensor_chirho))

    for start_chirho in range(0, len(pending_chirho), BATCH_SIZE_CHIRHO):
        chunk_chirho = pending_chirho[start_chirho:start_chirho + BATCH_SIZE_CHIRHO]
        batch_chirho = collate_chirho(
            [(tensor_chirho, [1]) for _, tensor_chirho in chunk_chirho])
        if batch_chirho is None:
            continue
        with torch.no_grad():
            logits_chirho = model_chirho(batch_chirho[0].to(dev_chirho))
        for (record_chirho, _), (reading_chirho, conf_chirho) in zip(
                chunk_chirho, decode_with_conf_chirho(logits_chirho)):
            verdict_chirho, _ = skeleton_in_wlc_chirho(
                reading_chirho, word_skel_chirho, verse_blob_chirho)
            record_chirho["crnnReadingChirho"] = reading_chirho
            record_chirho["crnnConfChirho"] = round(conf_chirho, 4)
            record_chirho["wlcVerdictChirho"] = verdict_chirho

    for record_chirho in records_chirho:
        stored_skeleton_chirho = hebrew_skeleton_chirho(record_chirho["storedTextChirho"])
        read_skeleton_chirho = hebrew_skeleton_chirho(record_chirho["crnnReadingChirho"] or "")
        shared_chirho = sum(1 for ch_chirho in set(read_skeleton_chirho)
                            if ch_chirho in stored_skeleton_chirho)
        record_chirho["storedSkeletonChirho"] = stored_skeleton_chirho
        record_chirho["readSkeletonChirho"] = read_skeleton_chirho
        record_chirho["sharedSkeletonCharsChirho"] = shared_chirho
        record_chirho["skeletonEqualChirho"] = (
            len(read_skeleton_chirho) > 0
            and read_skeleton_chirho == stored_skeleton_chirho)

    out_chirho = {
        "schemaVersionChirho": 1,
        "moduleChirho": "witness_swallowed_hebrew_chirho",
        "generatedAtChirho": datetime.datetime.now(
            datetime.timezone.utc).isoformat(),
        "candidatesPathChirho": str(
            candidates_path_chirho.relative_to(PROJECT_ROOT_CHIRHO)),
        "candidatesSha256Chirho": sha256_file_chirho(candidates_path_chirho),
        "candidatesScannerFingerprintChirho": candidates_chirho.get(
            "scannerSourceFingerprintChirho"),
        "candidatesSpanFingerprintChirho": candidates_chirho.get(
            "spanSourceFingerprintChirho"),
        "crnnModelSha256Chirho": sha256_file_chirho(MODEL_OUT_CHIRHO),
        "recordsChirho": records_chirho,
    }
    out_path_chirho = Path(args_chirho.out_chirho)
    out_path_chirho.parent.mkdir(parents=True, exist_ok=True)
    out_path_chirho.write_text(json.dumps(out_chirho, ensure_ascii=False, indent=2))

    read_chirho = [r_chirho for r_chirho in records_chirho
                   if r_chirho["crnnReadingChirho"] is not None]
    hebrew_shaped_chirho = [
        r_chirho for r_chirho in read_chirho
        if (r_chirho["v8PHebChirho"] or 0) >= 0.5]
    print(f"witnessed {len(read_chirho)}/{len(records_chirho)} targets "
          f"(v8 P(heb)>=0.5 on {len(hebrew_shaped_chirho)}) -> {out_path_chirho}")
    for r_chirho in records_chirho:
        if r_chirho["spanKeyChirho"].startswith("3:151:36:"):
            print(f"  sanity {r_chirho['spanKeyChirho']} "
                  f"[{r_chirho['targetKindChirho']}] "
                  f"read={r_chirho['crnnReadingChirho']!r} "
                  f"conf={r_chirho['crnnConfChirho']} "
                  f"wlc={r_chirho['wlcVerdictChirho']} "
                  f"v8PHeb={r_chirho['v8PHebChirho']} "
                  f"storedSkel={r_chirho['storedSkeletonChirho']!r} "
                  f"eq={r_chirho['skeletonEqualChirho']}")


if __name__ == "__main__":
    main_chirho()
