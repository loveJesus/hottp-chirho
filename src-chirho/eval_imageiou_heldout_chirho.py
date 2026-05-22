#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
FAIR control for the vector-fit held-out test. Same production setting for
BOTH witnesses: knowledge base = v3 crops, query = the INDEPENDENT v2
crops (spines/exemplars never saw them). This isolates "is the vector-fit
witness weak" from "is v2 just dirtier/harder" — without this control the
0.606-vs-0.916 comparison is not honest.

image-IoU witness: predict each v2 crop by the nearest v3 exemplar
(normalised-image-IoU + 0.25 shape-feature, the same combined distance and
the same hard exclusion gates as recognize_realmatch_chirho).

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/eval_imageiou_heldout_chirho.py
"""
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image

from recognize_gbt_chirho import features_chirho
from recognize_realmatch_chirho import (
    FONT_DIR_CHIRHO, norm_ink_chirho, gate_info_chirho, excluded_chirho,
)

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
V2_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v2-chirho"


def load_set_chirho(dir_chirho):
    out_chirho = []
    for cp_dir_chirho in sorted(dir_chirho.glob("U+*")):
        letter_chirho = chr(int(cp_dir_chirho.name[2:], 16))
        for png_chirho in sorted(cp_dir_chirho.glob("*.png")):
            gray_chirho = np.asarray(Image.open(png_chirho).convert("L"))
            ni_chirho = norm_ink_chirho(gray_chirho)
            fe_chirho = features_chirho(gray_chirho)
            if ni_chirho is None or fe_chirho is None:
                continue
            out_chirho.append({
                "letterChirho": letter_chirho, "imgChirho": ni_chirho,
                "featChirho": fe_chirho, "gateChirho": gate_info_chirho(gray_chirho),
            })
    return out_chirho


def main_chirho():
    base_chirho = load_set_chirho(FONT_DIR_CHIRHO)          # v3 = knowledge
    query_chirho = load_set_chirho(V2_DIR_CHIRHO)            # v2 = held-out
    feats_chirho = np.stack([b_chirho["featChirho"] for b_chirho in base_chirho])
    fstd_chirho = feats_chirho.std(axis=0) + 1e-6
    base_models_chirho = {b_chirho["letterChirho"] for b_chirho in base_chirho}

    total_chirho = covered_chirho = correct_chirho = 0
    conf_chirho = Counter()
    per_chirho = {}
    for q_chirho in query_chirho:
        t_chirho = q_chirho["letterChirho"]
        total_chirho += 1
        if t_chirho not in base_models_chirho:
            continue
        covered_chirho += 1
        best_d_chirho, best_l_chirho = 1e18, None
        for b_chirho in base_chirho:
            if excluded_chirho(b_chirho["letterChirho"], q_chirho["gateChirho"]):
                continue
            img_d_chirho = float((q_chirho["imgChirho"] != b_chirho["imgChirho"]).mean())
            feat_d_chirho = float(np.abs(
                (q_chirho["featChirho"] - b_chirho["featChirho"]) / fstd_chirho).mean())
            d_chirho = img_d_chirho + 0.25 * feat_d_chirho
            if d_chirho < best_d_chirho:
                best_d_chirho, best_l_chirho = d_chirho, b_chirho["letterChirho"]
        if best_l_chirho is None:
            for b_chirho in base_chirho:
                img_d_chirho = float((q_chirho["imgChirho"] != b_chirho["imgChirho"]).mean())
                if img_d_chirho < best_d_chirho:
                    best_d_chirho, best_l_chirho = img_d_chirho, b_chirho["letterChirho"]
        per_chirho.setdefault(t_chirho, [0, 0])
        per_chirho[t_chirho][1] += 1
        if best_l_chirho == t_chirho:
            correct_chirho += 1
            per_chirho[t_chirho][0] += 1
        else:
            conf_chirho[(t_chirho, best_l_chirho)] += 1

    acc_chirho = correct_chirho / covered_chirho if covered_chirho else 0.0
    print("image-IoU witness, knowledge=v3, query=HELD-OUT v2 (fair control)")
    print(f"  accuracy {correct_chirho}/{covered_chirho} = {acc_chirho:.3f}"
          f"   (vector-fit on the SAME v2 = 40/66 = 0.606)")
    print(f"  coverage {covered_chirho}/{total_chirho}")
    print("\nper-letter (correct/total):")
    print("  " + "  ".join(f"{k_chirho}{v_chirho[0]}/{v_chirho[1]}"
                            for k_chirho, v_chirho in sorted(per_chirho.items())))
    print("\ntop confusions:")
    for (a_chirho, b_chirho), c_chirho in conf_chirho.most_common(12):
        print(f"  {a_chirho}->{b_chirho} x{c_chirho}")


if __name__ == "__main__":
    main_chirho()
