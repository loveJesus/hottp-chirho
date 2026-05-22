#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Third witness for the analysis-by-synthesis word reader: STRUCTURAL
features. Image-IoU (real_term) and ductus IoU (synth_term) are both
PIXEL-COINCIDENCE signals and share the same visual ambiguity on
identity-confusable pairs (ר↔כ, ה↔ת/ח, ב↔נ; honest measurement
2026-05-19 disproved per-case alpha as a sole lever).

This witness looks at WHERE the ink is at a coarser, position-tolerant
granularity (a 4x4 ink-density grid) so its errors decorrelate from
pixel-coincidence. For each candidate letter we have a TEMPLATE
feature vector (mean over the real-glyph crops); the cost is the mean
L1 distance to the template, in [0, 1].

The reader blends this with synth_term and real_term as a third term
weighted by `BETA_STRUCT_CHIRHO`. Default 0.0 = baseline preserved.

Reads templates from the same bitmap-font-v3 corpus already used for
`recognize_realmatch_chirho.norm_ink_chirho`.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from recognize_realmatch_chirho import norm_ink_chirho, FONT_DIR_CHIRHO  # noqa: E402
from eval_gold_set_chirho import fold_chirho  # noqa: E402

GRID_CHIRHO = 4                    # 4x4 ink-density grid (16-d feature)
NORM_HEIGHT_CHIRHO = 36            # size of norm_ink crops produced by RM


def _grid_features_chirho(norm_ink_bool_chirho):
    """Flat 16-d float vector of ink density per 4x4 grid cell."""
    h_chirho, w_chirho = norm_ink_bool_chirho.shape
    feats_chirho = np.zeros((GRID_CHIRHO, GRID_CHIRHO), dtype=float)
    for i_chirho in range(GRID_CHIRHO):
        r0_chirho = (i_chirho * h_chirho) // GRID_CHIRHO
        r1_chirho = ((i_chirho + 1) * h_chirho) // GRID_CHIRHO
        for j_chirho in range(GRID_CHIRHO):
            c0_chirho = (j_chirho * w_chirho) // GRID_CHIRHO
            c1_chirho = ((j_chirho + 1) * w_chirho) // GRID_CHIRHO
            cell_chirho = norm_ink_bool_chirho[r0_chirho:r1_chirho,
                                               c0_chirho:c1_chirho]
            if cell_chirho.size == 0:
                continue
            feats_chirho[i_chirho, j_chirho] = float(cell_chirho.mean())
    return feats_chirho.flatten()


def extract_features_chirho(span_bool_chirho):
    """Compute 16-d grid features on a candidate placement span.
    Returns None if the span has no ink."""
    if span_bool_chirho.sum() == 0:
        return None
    gray_chirho = np.where(span_bool_chirho, 0, 255).astype(np.uint8)
    n_chirho = norm_ink_chirho(gray_chirho)
    if n_chirho is None:
        return None
    return _grid_features_chirho(n_chirho)


def build_letter_templates_chirho(real_exemplars_chirho):
    """{folded_letter -> mean 16-d feature vector} from the loaded
    real exemplar bool crops (already at norm_ink_chirho scale)."""
    templates_chirho = {}
    for letter_chirho, exs_chirho in real_exemplars_chirho.items():
        vecs_chirho = []
        for n_chirho in exs_chirho:
            vecs_chirho.append(_grid_features_chirho(n_chirho))
        if vecs_chirho:
            templates_chirho[letter_chirho] = np.mean(vecs_chirho, axis=0)
    return templates_chirho


def build_letter_templates_from_disk_chirho():
    """Same as build_letter_templates_chirho but loads from FONT_DIR
    directly (for standalone use without word_reader's preloaded dict)."""
    by_letter_chirho = {}
    for cp_dir_chirho in sorted(FONT_DIR_CHIRHO.glob("U+*")):
        letter_chirho = fold_chirho(chr(int(cp_dir_chirho.name[2:], 16)))
        for png_chirho in sorted(cp_dir_chirho.glob("*.png")):
            g_chirho = np.asarray(Image.open(png_chirho).convert("L"))
            n_chirho = norm_ink_chirho(g_chirho)
            if n_chirho is not None:
                by_letter_chirho.setdefault(letter_chirho, []).append(n_chirho)
    return build_letter_templates_chirho(by_letter_chirho)


def struct_cost_chirho(letter_chirho, span_bool_chirho, templates_chirho):
    """Mean L1 distance between the span's 4x4 grid features and the
    letter's template, in [0, 1]. Returns 0.5 (neutral) when no template
    or no span ink — mirrors realmatch_cost neutral semantics."""
    tmpl_chirho = templates_chirho.get(letter_chirho)
    if tmpl_chirho is None:
        return 0.5
    feats_chirho = extract_features_chirho(span_bool_chirho)
    if feats_chirho is None:
        return 0.5
    return float(np.abs(feats_chirho - tmpl_chirho).mean())


if __name__ == "__main__":
    # quick self-check: build templates and print per-letter L1 vs every
    # other letter — the confusion matrix is the structural-witness's
    # discrimination map (higher off-diagonal = better discriminator).
    tmpls_chirho = build_letter_templates_from_disk_chirho()
    letters_chirho = sorted(tmpls_chirho)
    print(f"templates: {len(letters_chirho)} letters "
          f"({''.join(letters_chirho)})")
    print()
    print("self-similarity matrix (mean L1 between letter templates; "
          "lower = more confusable):")
    print("     " + " ".join(f"{l_chirho:>4}" for l_chirho in letters_chirho))
    for r_chirho in letters_chirho:
        row_chirho = [f"{r_chirho:2}: "]
        for c_chirho in letters_chirho:
            d_chirho = float(np.abs(
                tmpls_chirho[r_chirho] - tmpls_chirho[c_chirho]).mean())
            row_chirho.append(f"{d_chirho:>4.2f}")
        print(" ".join(row_chirho))
    print()
    print("dominant-confusion checks (should be NON-zero; bigger = "
          "structural witness can discriminate them):")
    for pair_chirho in [("ר", "כ"), ("ה", "ת"), ("ה", "ח"),
                        ("ב", "נ"), ("ח", "ת"), ("ש", "ט"),
                        ("ת", "ס"), ("מ", "פ")]:
        a_chirho, b_chirho = pair_chirho
        if a_chirho not in tmpls_chirho or b_chirho not in tmpls_chirho:
            continue
        d_chirho = float(np.abs(
            tmpls_chirho[a_chirho] - tmpls_chirho[b_chirho]).mean())
        print(f"  {a_chirho} vs {b_chirho}: L1 = {d_chirho:.3f}")
