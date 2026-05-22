#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Audit Hebrew training-pair label alignment against the real WLC corpus.

The `canonical-recon-chirho` source claims its labels were derived by
positional alignment against the WLC/BHS-backed reconstructed page text.
Therefore any such label whose CONSONANT SKELETON appears NOWHERE in the
entire Hebrew Bible (wlc-chirho.sqlite) is, by definition, a pipeline
alignment defect — not a legitimate textual variant.

We classify each Hebrew pair's skeleton as:
  exact   matches a WLC word's consonants exactly
  substr  appears as a substring of some verse's consonant stream
          (covers prefixes vav/he/bet/kaf/lamed/mem/shin, maqqef joins)
  ABSENT  appears nowhere -> almost certainly a misaligned/garbled label

We never mutate training_pairs_chirho here (raw human/derived data is
sacrosanct). Read-only quantification + a quarantine candidate list.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/audit_canonical_recon_chirho.py
"""
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
WLC_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "wlc-chirho.sqlite"
SPACE_CHIRHO = chr(32)

sys.path.insert(0, str(PROJECT_ROOT_CHIRHO / "src-chirho"))
from compose_synthetic_hebrew_v2_chirho import (  # noqa: E402
    strip_nikkud_chirho,
    consonants_only_chirho,
)

FINAL_MAP_CHIRHO = {"ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ"}


def normalize_skeleton_chirho(text_chirho: str) -> str:
    cons_chirho = consonants_only_chirho(strip_nikkud_chirho(text_chirho or ""))
    return "".join(FINAL_MAP_CHIRHO.get(ch_chirho, ch_chirho) for ch_chirho in cons_chirho)


def load_wlc_validators_chirho():
    """Return (word_skeletons_set, verse_consonant_blob) from wlc-chirho.sqlite.

    Shared by the audit and by compare_font so "is this label a real WLC
    form?" is computed identically everywhere.
    """
    wlc_conn_chirho = sqlite3.connect(WLC_PATH_CHIRHO)
    word_skeletons_chirho = set()
    for (cons_chirho,) in wlc_conn_chirho.execute(
        "SELECT consonants_only_chirho FROM words_chirho"
    ):
        word_skeletons_chirho.add(normalize_skeleton_chirho(cons_chirho))
    verse_streams_chirho = [
        normalize_skeleton_chirho(row_chirho[0])
        for row_chirho in wlc_conn_chirho.execute(
            "SELECT consonants_only_chirho FROM verses_chirho"
        )
    ]
    wlc_conn_chirho.close()
    return word_skeletons_chirho, SPACE_CHIRHO.join(verse_streams_chirho)


def skeleton_in_wlc_chirho(text_chirho, word_skeletons_chirho, verse_blob_chirho):
    """exact | substr | ABSENT verdict for one label's consonant skeleton."""
    skel_chirho = normalize_skeleton_chirho(text_chirho)
    if not skel_chirho:
        return "ABSENT", skel_chirho
    if skel_chirho in word_skeletons_chirho:
        return "exact", skel_chirho
    if skel_chirho in verse_blob_chirho:
        return "substr", skel_chirho
    return "ABSENT", skel_chirho


def main_chirho():
    word_skeletons_chirho, verse_blob_chirho = load_wlc_validators_chirho()
    print(
        f"WLC: {len(word_skeletons_chirho)} distinct word skeletons loaded."
    )

    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    rows_chirho = conn_chirho.execute(
        """SELECT id_chirho, source_chirho, text_chirho, vol_chirho,
                  page_num_chirho, tesseract_was_chirho, crop_path_chirho
             FROM training_pairs_chirho
            WHERE script_chirho = 'hebrew-chirho'"""
    ).fetchall()
    conn_chirho.close()

    by_source_chirho = defaultdict(lambda: {"exact": 0, "substr": 0, "ABSENT": 0})
    absent_rows_chirho = defaultdict(list)
    for (
        id_chirho,
        source_chirho,
        text_chirho,
        vol_chirho,
        page_num_chirho,
        tess_chirho,
        crop_chirho,
    ) in rows_chirho:
        verdict_chirho, skel_chirho = skeleton_in_wlc_chirho(
            text_chirho, word_skeletons_chirho, verse_blob_chirho
        )
        if not skel_chirho:
            continue
        if verdict_chirho == "ABSENT":
            absent_rows_chirho[source_chirho].append(
                (id_chirho, text_chirho, skel_chirho, vol_chirho,
                 page_num_chirho, tess_chirho, crop_chirho)
            )
        by_source_chirho[source_chirho][verdict_chirho] += 1

    print("\n=== Skeleton-in-WLC verdict by source ===")
    print(f"{'source':<34}{'exact':>7}{'substr':>8}{'ABSENT':>8}{'  absent%':>10}")
    for src_chirho in sorted(by_source_chirho):
        d_chirho = by_source_chirho[src_chirho]
        tot_chirho = d_chirho["exact"] + d_chirho["substr"] + d_chirho["ABSENT"]
        pct_chirho = 100.0 * d_chirho["ABSENT"] / tot_chirho if tot_chirho else 0.0
        print(
            f"{src_chirho:<34}{d_chirho['exact']:>7}{d_chirho['substr']:>8}"
            f"{d_chirho['ABSENT']:>8}{pct_chirho:>9.1f}%"
        )

    for src_chirho in ("canonical-recon-chirho", "human-chirho", "opus-vision-chirho"):
        bad_chirho = absent_rows_chirho.get(src_chirho, [])
        if not bad_chirho:
            continue
        print(f"\n=== ABSENT-from-WLC labels — source={src_chirho} "
              f"({len(bad_chirho)} rows) ===")
        for (id_chirho, text_chirho, skel_chirho, vol_chirho,
             page_chirho, tess_chirho, crop_chirho) in bad_chirho[:40]:
            print(f"  id={id_chirho:<5} v{vol_chirho} p{page_chirho}  "
                  f"label='{text_chirho}'  skel='{skel_chirho}'  "
                  f"tess='{tess_chirho}'  {crop_chirho}")


if __name__ == "__main__":
    main_chirho()
