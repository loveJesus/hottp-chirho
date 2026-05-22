#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Mint a NON-circular word-level gold set (the hybrid the user chose:
WLC auto-verify + apex on the residual).

Why non-circular: the only per-word lead we have that is INDEPENDENT of
our image recognisers (vector-fit / image-IoU / structural) is the
tesseract OCR text already stored in the corpus manifest. Tesseract is a
*separate* engine, not one of our witnesses, so labels minted from it do
not leak into an evaluation of our system. Tesseract Hebrew is very noisy
(~85% of skeletons are ABSENT from WLC) — but when a noisy OCR skeleton
still lands EXACTLY on a real Westminster-Leningrad word skeleton, the
longer it is the less likely that is a coincidence, so word length is the
honest confidence axis:

  GOLD_STRICT : exact WLC word skeleton, length >= 5   (trust core)
  GOLD_OK     : exact WLC word skeleton, length == 4    (usable)
  REVIEW      : substr / short-exact / ABSENT           -> apex queue
                (Opus vision or human; NOT spent here)

The gold label is the whole word's consonant string (== the matched WLC
skeleton). Evaluation against it is end-to-end (segmentation + bigram
detection + recognition), exactly the real task — not pre-cut letters.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/mint_gold_set_chirho.py
"""
import json
from collections import Counter
from pathlib import Path

from audit_canonical_recon_chirho import (
    normalize_skeleton_chirho, load_wlc_validators_chirho, skeleton_in_wlc_chirho,
)

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
CORPUS_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "hebrew-corpus-chirho"
GOLD_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "gold-set-chirho"
STRICT_LEN_CHIRHO = 5
OK_LEN_CHIRHO = 4


def tier_chirho(verdict_chirho, skel_chirho):
    if verdict_chirho == "exact" and len(skel_chirho) >= STRICT_LEN_CHIRHO:
        return "GOLD_STRICT"
    if verdict_chirho == "exact" and len(skel_chirho) == OK_LEN_CHIRHO:
        return "GOLD_OK"
    return "REVIEW"


def main_chirho():
    man_chirho = json.loads(
        (CORPUS_DIR_CHIRHO / "manifest-chirho.json").read_text())
    wskel_chirho, vblob_chirho = load_wlc_validators_chirho()
    GOLD_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)

    gold_chirho, review_chirho = [], []
    tier_count_chirho = Counter()
    letter_cov_chirho = Counter()
    for m_chirho in man_chirho:
        tess_chirho = m_chirho.get("tessTextChirho") or ""
        verdict_chirho, skel_chirho = skeleton_in_wlc_chirho(
            tess_chirho, wskel_chirho, vblob_chirho)
        tg_chirho = tier_chirho(verdict_chirho, skel_chirho)
        tier_count_chirho[tg_chirho] += 1
        rec_chirho = {
            "cropChirho": m_chirho["cropChirho"],
            "pageChirho": m_chirho.get("pageChirho"),
            "bboxChirho": m_chirho.get("bboxChirho"),
            "tessTextChirho": tess_chirho,
            "goldConsonantsChirho": skel_chirho,
            "tierChirho": tg_chirho,
            "wlcVerdictChirho": verdict_chirho,
            "lenChirho": len(skel_chirho),
        }
        if tg_chirho.startswith("GOLD"):
            gold_chirho.append(rec_chirho)
            for ch_chirho in skel_chirho:
                letter_cov_chirho[ch_chirho] += 1
        else:
            review_chirho.append(rec_chirho)

    (GOLD_DIR_CHIRHO / "manifest-chirho.json").write_text(json.dumps({
        "createdFromChirho": "hebrew-corpus-chirho + wlc-chirho.sqlite",
        "methodChirho": "tesseract skeleton == exact WLC word skeleton, "
                        "length-tiered (non-circular vs our image models)",
        "tierCountsChirho": dict(tier_count_chirho),
        "goldChirho": gold_chirho,
    }, ensure_ascii=False, indent=2))
    (GOLD_DIR_CHIRHO / "review-queue-chirho.json").write_text(json.dumps({
        "noteChirho": "apex (Opus vision / human) target — NOT auto-labelled",
        "countChirho": len(review_chirho),
        "itemsChirho": review_chirho[:2000],
    }, ensure_ascii=False, indent=2))

    n_strict_chirho = tier_count_chirho["GOLD_STRICT"]
    n_ok_chirho = tier_count_chirho["GOLD_OK"]
    print(f"corpus words: {len(man_chirho)}")
    print(f"  GOLD_STRICT (exact WLC, len>={STRICT_LEN_CHIRHO}): {n_strict_chirho}")
    print(f"  GOLD_OK     (exact WLC, len=={OK_LEN_CHIRHO}):      {n_ok_chirho}")
    print(f"  -> trustworthy gold words total: {len(gold_chirho)}")
    print(f"  REVIEW (apex queue, not spent):  {len(review_chirho)}")
    full_chirho = set("אבגדהוזחטיכךלמםנןסעפףצץקרשת")
    cov_chirho = set(letter_cov_chirho)
    print(f"\ngold letter coverage: {len(cov_chirho & full_chirho)}/27 consonant "
          f"forms; MISSING: {''.join(sorted(full_chirho - cov_chirho)) or 'none'}")
    print("rarest in gold: " + "  ".join(
        f"{c_chirho}:{n_chirho}" for c_chirho, n_chirho
        in sorted(letter_cov_chirho.items(), key=lambda kv: kv[1])[:8]))
    print(f"\nwrote {GOLD_DIR_CHIRHO}/manifest-chirho.json "
          f"(+ review-queue-chirho.json)")
    print("NOTE: trust grows with length; GOLD_STRICT is the core. This is "
          "WORD-level gold — evaluate predicted consonant STRING vs "
          "goldConsonantsChirho (end-to-end, exercises bigram detection).")


if __name__ == "__main__":
    main_chirho()
