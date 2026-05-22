#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Recognizer FEASIBILITY probe (cheap, falsifiable). Question: do the
human-ductus per-letter models actually DISCRIMINATE real Hebrew letters?

For every real single-letter scan crop in bitmap-font-v3-chirho (labelled by
its U+XXXX dir), fit EVERY letter's ASM model to it and score by ink-
coverage IoU; predicted = argmax. Report accuracy + worst confusions.

Reuses propagate_spines_chirho (build_models / fit_model / coverage). This
is the foundation test for the WLC-constrained word recogniser — only
build that if letters are separable here.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/recognize_probe_chirho.py
"""
import sys
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
from PIL import Image

from propagate_spines_chirho import (
    build_models_chirho,
    fit_model_chirho,
    coverage_iou_chirho,
)

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
FONT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-chirho"
INK_THRESH_CHIRHO = 200
PEN_FRAC_CHIRHO = 0.09


def main_chirho():
    models_chirho = build_models_chirho()
    if not models_chirho:
        print("No exemplars/models. Save spines first.", file=sys.stderr)
        return
    model_cps_chirho = sorted(models_chirho.keys())
    print(f"{len(model_cps_chirho)} letter models")

    total_chirho = 0
    correct_chirho = 0
    confus_chirho = Counter()
    per_letter_chirho = defaultdict(lambda: [0, 0])  # cp -> [correct, total]

    for cp_dir_chirho in sorted(FONT_DIR_CHIRHO.glob("U+*")):
        true_cp_chirho = cp_dir_chirho.name[2:]
        if true_cp_chirho not in models_chirho:
            continue
        for png_chirho in sorted(cp_dir_chirho.glob("*.png")):
            gray_chirho = np.asarray(Image.open(png_chirho).convert("L"))
            ink_chirho = gray_chirho < INK_THRESH_CHIRHO
            if ink_chirho.sum() < 8:
                continue
            r_chirho = max(1.2, PEN_FRAC_CHIRHO * gray_chirho.shape[0])
            best_cp_chirho, best_iou_chirho = None, -1.0
            for cand_cp_chirho in model_cps_chirho:
                try:
                    fitted_chirho = fit_model_chirho(models_chirho[cand_cp_chirho], gray_chirho)
                    iou_chirho = coverage_iou_chirho(fitted_chirho, ink_chirho, r_chirho)
                except Exception:
                    continue
                if iou_chirho > best_iou_chirho:
                    best_iou_chirho, best_cp_chirho = iou_chirho, cand_cp_chirho
            if best_cp_chirho is None:
                continue
            total_chirho += 1
            ok_chirho = best_cp_chirho == true_cp_chirho
            correct_chirho += int(ok_chirho)
            per_letter_chirho[true_cp_chirho][1] += 1
            per_letter_chirho[true_cp_chirho][0] += int(ok_chirho)
            if not ok_chirho:
                confus_chirho[(chr(int(true_cp_chirho, 16)),
                               chr(int(best_cp_chirho, 16)))] += 1

    if total_chirho == 0:
        print("no testable glyphs")
        return
    print(f"\nTemplate-match accuracy: {correct_chirho}/{total_chirho} = "
          f"{correct_chirho / total_chirho:.3f}  (chance ≈ {1/len(model_cps_chirho):.3f})")
    print("\nper-letter (correct/total):")
    for cp_chirho in sorted(per_letter_chirho):
        c_chirho, t_chirho = per_letter_chirho[cp_chirho]
        print(f"  {chr(int(cp_chirho,16))} {c_chirho}/{t_chirho}")
    print("\ntop confusions (true→pred ×n):")
    for (a_chirho, b_chirho), n_chirho in confus_chirho.most_common(12):
        print(f"  {a_chirho}→{b_chirho} ×{n_chirho}")
    print("\nNOTE: mildly optimistic (some test glyphs are where spines were "
          "drawn). A clear signal here ⇒ build the WLC-constrained recogniser; "
          "near-chance ⇒ the template approach won't read consonants.")


if __name__ == "__main__":
    main_chirho()
