#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
(A) Use WLC similarity to surface candidate scan crops that should CONTAIN
the still-missing glyphs — zayin ז (U+05D6), final-pe ף (U+05E3),
final-tsadi ץ (U+05E5) — so exemplars can be built for them.
(B) Report the size of the "totally Hebrew, no punctuation / no Latin /
no nikkud" word working set (the clean target for autonomous
classification).

Strategy: take Hebrew training pairs with known/approx text; keep only
words whose consonant skeleton is pure-Hebrew AND appears in WLC (so the
label is trustworthy); for each target letter, list words whose WLC
skeleton contains it + which position, and build a montage to eyeball.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/find_missing_glyphs_chirho.py
"""
import os
import sqlite3
from pathlib import Path

from PIL import Image, ImageDraw

from audit_canonical_recon_chirho import (
    load_wlc_validators_chirho,
    skeleton_in_wlc_chirho,
    normalize_skeleton_chirho,
)

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
OUT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "missing-glyph-finder-chirho"
HEB_RANGE_CHIRHO = range(0x05D0, 0x05EB)  # consonants only
TARGETS_CHIRHO = {"ז": "U+05D6", "ף": "U+05E3", "ץ": "U+05E5"}
# final form -> base, to test membership in the (final-normalised) skeleton
FINAL_BASE_CHIRHO = {"ף": "פ", "ץ": "צ"}


def is_pure_hebrew_chirho(text_chirho):
    """True iff every non-space char is a Hebrew consonant (no nikkud, no
    Latin, no digits, no punctuation/parentheses)."""
    t_chirho = (text_chirho or "").strip()
    if len(t_chirho) < 2:
        return False
    for ch_chirho in t_chirho:
        if ch_chirho.isspace():
            return False
        if ord(ch_chirho) not in HEB_RANGE_CHIRHO and ch_chirho not in "ךםןףץ":
            return False
    return True


def main_chirho():
    OUT_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)
    word_sk_chirho, verse_blob_chirho = load_wlc_validators_chirho()

    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    rows_chirho = conn_chirho.execute(
        """SELECT crop_path_chirho, text_chirho, vol_chirho, page_num_chirho, source_chirho
             FROM training_pairs_chirho
            WHERE script_chirho='hebrew-chirho'
              AND source_chirho IN ('canonical-recon-chirho','human-chirho')"""
    ).fetchall()
    conn_chirho.close()

    pure_chirho = []          # broad: all pure-Hebrew words (classification target)
    n_verified_chirho = 0     # WLC-verified subset (for evaluation only)
    for crop_chirho, text_chirho, vol_chirho, pg_chirho, src_chirho in rows_chirho:
        if not is_pure_hebrew_chirho(text_chirho):
            continue
        pure_chirho.append((crop_chirho, text_chirho, vol_chirho, pg_chirho, src_chirho))
        verdict_chirho, _sk_chirho = skeleton_in_wlc_chirho(
            text_chirho, word_sk_chirho, verse_blob_chirho
        )
        if verdict_chirho != "ABSENT":
            n_verified_chirho += 1

    print(f"(B) pure-Hebrew words (broad — classification target): {len(pure_chirho)}")
    print(f"    of which WLC-verified (trustworthy label, for eval): {n_verified_chirho}")

    for letter_chirho, cp_chirho in TARGETS_CHIRHO.items():
        cands_chirho = []
        for crop_chirho, text_chirho, vol_chirho, pg_chirho, src_chirho in pure_chirho:
            if letter_chirho not in (text_chirho or ""):
                continue
            if not os.path.exists(crop_chirho):
                continue
            idx_chirho = text_chirho.index(letter_chirho)
            cands_chirho.append((crop_chirho, text_chirho, idx_chirho,
                                 len(text_chirho.strip()), vol_chirho, pg_chirho, src_chirho))
        cands_chirho.sort(key=lambda c_chirho: c_chirho[3])  # short words first (easier to isolate)
        print(f"\n(A) {letter_chirho} {cp_chirho}: {len(cands_chirho)} candidate crops "
              f"(label literally contains {letter_chirho})")
        for c_chirho in cands_chirho[:15]:
            print(f"   v{c_chirho[4]} p{c_chirho[5]}  '{c_chirho[1]}'  "
                  f"pos {c_chirho[2]}/{c_chirho[3]}  {c_chirho[6]}  {os.path.basename(c_chirho[0])}")

        # montage for visual confirmation
        shown_chirho = cands_chirho[:20]
        if shown_chirho:
            tiles_chirho = []
            for crop_chirho, *_rest_chirho in shown_chirho:
                im_chirho = Image.open(crop_chirho).convert("L")
                s_chirho = 56 / max(1, im_chirho.height)
                tiles_chirho.append(
                    im_chirho.resize((max(1, int(im_chirho.width * s_chirho)), 56))
                )
            w_chirho = max(t_chirho.width for t_chirho in tiles_chirho) + 12
            h_chirho = sum(t_chirho.height for t_chirho in tiles_chirho) + 10 * len(tiles_chirho) + 20
            sheet_chirho = Image.new("L", (w_chirho, h_chirho), 255)
            d_chirho = ImageDraw.Draw(sheet_chirho)
            d_chirho.text((4, 2), f"candidates containing {letter_chirho}", fill=0)
            y_chirho = 18
            for t_chirho in tiles_chirho:
                sheet_chirho.paste(t_chirho, (6, y_chirho))
                y_chirho += t_chirho.height + 10
            out_chirho = OUT_DIR_CHIRHO / f"cands-{cp_chirho}-chirho.png"
            sheet_chirho.save(out_chirho)
            print(f"   montage: {out_chirho}")


if __name__ == "__main__":
    main_chirho()
