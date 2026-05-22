#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Quick polygon-annotation batch for the 3 still-missing glyphs (ז ף ץ),
sourced from the freshly-mined hebrew-corpus-chirho (NOT training_pairs,
which had none). A couple of visually-confirmed clean crops per letter.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/prepare_missing_from_corpus_chirho.py
Then:
    bun src-chirho/polygon-annotate-server-chirho.ts --batch=<run id printed>
"""
import json
import time
from pathlib import Path

from PIL import Image

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
CORPUS_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "hebrew-corpus-chirho"
IMAGES_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "images-chirho" / "vol-1-chirho"
BATCHES_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "polygon-batches-chirho"
PER_LETTER_CHIRHO = 3
PAD_PX_CHIRHO = 28  # margin around the word so polygons aren't fighting the edge
# (target letter, [confirmed-clean (page, tess-substring) picks])
PICKS_CHIRHO = {
    "ז": [(215, "למזבח"), (248, "ארז"), (225, "פרזות"), (204, "אכז")],
    "ף": [(302, "אלף"), (196, "כתף"), (276, "אף"), (231, "בכף")],
    "ץ": [(258, "הארץ"), (260, "בארץ"), (315, "לחץ"), (175, "הארץ")],
}


def main_chirho():
    man_chirho = json.loads((CORPUS_DIR_CHIRHO / "manifest-chirho.json").read_text())
    run_id_chirho = f"polygons-missing-{int(time.time())}-chirho"
    out_dir_chirho = BATCHES_DIR_CHIRHO / run_id_chirho
    out_dir_chirho.mkdir(parents=True, exist_ok=True)

    items_chirho = []
    for letter_chirho, picks_chirho in PICKS_CHIRHO.items():
        taken_chirho = 0
        for pg_chirho, sub_chirho in picks_chirho:
            if taken_chirho >= PER_LETTER_CHIRHO:
                break
            for m_chirho in man_chirho:
                if taken_chirho >= PER_LETTER_CHIRHO:
                    break
                if m_chirho["pageChirho"] != pg_chirho:
                    continue
                if sub_chirho not in (m_chirho["tessTextChirho"] or ""):
                    continue
                page_img_chirho = IMAGES_DIR_CHIRHO / f"page-{pg_chirho:04d}-chirho.png"
                if not page_img_chirho.exists():
                    continue
                wid_chirho = -abs(hash((m_chirho["cropChirho"]))) % 10_000_000
                dst_name_chirho = f"word-{wid_chirho}-chirho.png"
                if any(it_chirho["cropFileChirho"] == dst_name_chirho for it_chirho in items_chirho):
                    continue
                # Re-crop from the PAGE with padding (the corpus crop is
                # tesseract-tight — no room to draw a polygon).
                bx0_chirho, by0_chirho, bx1_chirho, by1_chirho = m_chirho["bboxChirho"]
                pim_chirho = Image.open(page_img_chirho).convert("L")
                cx0_chirho = max(0, bx0_chirho - PAD_PX_CHIRHO)
                cy0_chirho = max(0, by0_chirho - PAD_PX_CHIRHO)
                cx1_chirho = min(pim_chirho.width, bx1_chirho + PAD_PX_CHIRHO)
                cy1_chirho = min(pim_chirho.height, by1_chirho + PAD_PX_CHIRHO)
                pim_chirho.crop((cx0_chirho, cy0_chirho, cx1_chirho, cy1_chirho)).save(
                    out_dir_chirho / dst_name_chirho, optimize=True)
                items_chirho.append({
                    "wordIdChirho": wid_chirho,
                    "cropFileChirho": dst_name_chirho,
                    "textChirho": m_chirho["tessTextChirho"],
                    "consonantsChirho": m_chirho["tessTextChirho"],
                    "lettersChirho": [letter_chirho],
                    "volChirho": 1,
                    "pageNumChirho": pg_chirho,
                    "lineIdxChirho": 0,
                })
                taken_chirho += 1

    manifest_chirho = {
        "runIdChirho": run_id_chirho,
        "createdAtChirho": time.strftime("%Y-%m-%d %H:%M:%S"),
        "itemsChirho": items_chirho,
        "alphabetCoveredChirho": [],
        "alphabetUncoveredChirho": ["ז", "ף", "ץ"],
    }
    (out_dir_chirho / "manifest-chirho.json").write_text(
        json.dumps(manifest_chirho, ensure_ascii=False, indent=2))
    print(f"Wrote {len(items_chirho)} items -> {out_dir_chirho}")
    by_l_chirho = {}
    for it_chirho in items_chirho:
        by_l_chirho.setdefault(it_chirho["lettersChirho"][0], []).append(
            f"p{it_chirho['pageNumChirho']} {it_chirho['textChirho']}")
    for l_chirho, v_chirho in by_l_chirho.items():
        print(f"  {l_chirho}: {v_chirho}")
    print(f"\nrun id: {run_id_chirho}")


if __name__ == "__main__":
    main_chirho()
