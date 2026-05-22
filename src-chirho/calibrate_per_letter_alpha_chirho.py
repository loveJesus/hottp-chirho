#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Per-letter witness-weight calibration (the data-driven "back-prop alpha").

Runs the analysis-by-synthesis word reader twice on the NON-circular WLC
gold set — once with ALPHA=0.0 (synth-only identity) and once with
ALPHA=1.0 (real-exemplar-only identity) — and measures per-letter
identity accuracy under each witness on structure-correct positions.

Derives per-letter alpha by reliability ratio:
    alpha_l = R_real_l / (R_synth_l + R_real_l)
clamped to [0, 1]. Letters lacking signal from one witness fall back to:
  - 1.0 if only real has signal (synth dead -> trust real),
  - 0.0 if only synth has signal,
  - the global ALPHA default if neither has signal.

Writes JSON to workspace-chirho/calibration-chirho/per-letter-alpha-chirho.json
which word_reader_chirho.py loads at startup (per-letter overrides the
global ALPHA_REAL_CHIRHO at scoring time).

This is the "weighted multi-witness back-prop" lever, calibrated from
measurement (not guessed).

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/calibrate_per_letter_alpha_chirho.py [--n=120]
"""
import argparse
import importlib
import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
GOLD_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "gold-set-chirho"
CORPUS_DIR_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho"
                     / "hebrew-corpus-chirho")
CALIB_DIR_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho"
                    / "calibration-chirho")
CALIB_PATH_CHIRHO = CALIB_DIR_CHIRHO / "per-letter-alpha-chirho.json"

# Min struct-correct samples per letter to TRUST that witness's measured
# accuracy. Below this we fall back to the global default for that letter.
MIN_SAMPLES_CHIRHO = 3


def run_gold_pass_chirho(alpha_chirho, tier_chirho, n_lim_chirho):
    """Reload word_reader_chirho with given ALPHA_REAL, run on gold set,
    return per_letter_dict_chirho {letter -> [correct, total]} on
    structure-correct (len(pred)==len(gold)) words."""
    # Force a clean re-import so ALPHA_REAL_CHIRHO is re-read from env
    import os
    os.environ["WR_ALPHA_CHIRHO"] = str(alpha_chirho)
    # Drop any cached word_reader_chirho module
    sys.modules.pop("word_reader_chirho", None)
    import word_reader_chirho as wr_chirho  # noqa: E402
    wr_chirho.ALPHA_REAL_CHIRHO = alpha_chirho  # belt-and-braces
    # Per-letter overrides MUST be empty during calibration: we are
    # measuring base witnesses, not the calibrated reader.
    wr_chirho.PER_LETTER_ALPHA_CHIRHO = {}

    models_chirho = wr_chirho.load_letter_models_chirho()
    wr_chirho._REAL_CHIRHO = wr_chirho.load_real_exemplars_chirho()

    man_chirho = [m_chirho for m_chirho in json.loads(
        (GOLD_DIR_CHIRHO / "manifest-chirho.json").read_text())["goldChirho"]
        if tier_chirho == "ALL"
        or m_chirho["tierChirho"] == f"GOLD_{tier_chirho}"]
    man_chirho = man_chirho[:n_lim_chirho]

    per_letter_chirho = {}
    n_words_chirho = 0
    n_exact_chirho = 0
    tot_ed_chirho = 0
    tot_len_chirho = 0
    for mrec_chirho in man_chirho:
        p_chirho = CORPUS_DIR_CHIRHO / mrec_chirho["cropChirho"]
        if not p_chirho.exists():
            continue
        gray_chirho = np.asarray(Image.open(p_chirho).convert("L"))
        wb_chirho = wr_chirho.normalise_word_chirho(gray_chirho)
        if wb_chirho is None:
            continue
        n_words_chirho += 1
        gold_chirho = wr_chirho.fold_chirho(mrec_chirho["goldConsonantsChirho"])
        pred_chirho, _ = wr_chirho.read_word_chirho(wb_chirho, models_chirho)
        tot_ed_chirho += wr_chirho.edit_dist_chirho(pred_chirho, gold_chirho)
        tot_len_chirho += len(gold_chirho)
        if pred_chirho == gold_chirho:
            n_exact_chirho += 1
        if len(pred_chirho) == len(gold_chirho):
            for g_chirho, pr_chirho in zip(gold_chirho, pred_chirho):
                per_letter_chirho.setdefault(g_chirho, [0, 0])
                per_letter_chirho[g_chirho][1] += 1
                if g_chirho == pr_chirho:
                    per_letter_chirho[g_chirho][0] += 1
    char_acc_chirho = (1 - tot_ed_chirho / max(1, tot_len_chirho))
    return per_letter_chirho, char_acc_chirho, n_exact_chirho, n_words_chirho


def derive_alpha_table_chirho(synth_pl_chirho, real_pl_chirho,
                              global_default_chirho):
    """{letter -> alpha} from measured per-letter reliabilities."""
    table_chirho = {}
    diag_chirho = []
    letters_chirho = sorted(
        set(synth_pl_chirho) | set(real_pl_chirho))
    for letter_chirho in letters_chirho:
        s_chirho = synth_pl_chirho.get(letter_chirho, [0, 0])
        r_chirho = real_pl_chirho.get(letter_chirho, [0, 0])
        s_ok_chirho = s_chirho[1] >= MIN_SAMPLES_CHIRHO
        r_ok_chirho = r_chirho[1] >= MIN_SAMPLES_CHIRHO
        s_rate_chirho = s_chirho[0] / s_chirho[1] if s_chirho[1] else None
        r_rate_chirho = r_chirho[0] / r_chirho[1] if r_chirho[1] else None
        if s_ok_chirho and r_ok_chirho:
            denom_chirho = (s_rate_chirho + r_rate_chirho)
            if denom_chirho <= 0:
                alpha_chirho = global_default_chirho
                reason_chirho = "both dead -> default"
            else:
                alpha_chirho = r_rate_chirho / denom_chirho
                reason_chirho = "both measured (ratio)"
        elif r_ok_chirho and not s_ok_chirho:
            alpha_chirho = 1.0
            reason_chirho = "synth too thin -> real-only"
        elif s_ok_chirho and not r_ok_chirho:
            alpha_chirho = 0.0
            reason_chirho = "real too thin -> synth-only"
        else:
            alpha_chirho = global_default_chirho
            reason_chirho = "both too thin -> default"
        table_chirho[letter_chirho] = round(alpha_chirho, 3)
        diag_chirho.append((letter_chirho, alpha_chirho, s_rate_chirho,
                            s_chirho[1], r_rate_chirho, r_chirho[1],
                            reason_chirho))
    return table_chirho, diag_chirho


def main_chirho():
    ap_chirho = argparse.ArgumentParser()
    ap_chirho.add_argument("--n", type=int, default=120,
                           dest="n_chirho",
                           help="words per pass on gold STRICT (default 120)")
    ap_chirho.add_argument("--default-alpha", type=float, default=1.0,
                           dest="default_alpha_chirho",
                           help="alpha for letters with no signal (default 1.0)")
    args_chirho = ap_chirho.parse_args()

    # Make src-chirho importable so we can use word_reader_chirho.
    src_dir_chirho = str(Path(__file__).resolve().parent)
    if src_dir_chirho not in sys.path:
        sys.path.insert(0, src_dir_chirho)

    print("=== A/B per-witness pass ===")
    print(f"  gold STRICT n={args_chirho.n_chirho}")
    print("  pass 1: ALPHA=0.0 (synth-only identity)")
    synth_pl_chirho, synth_char_chirho, synth_exact_chirho, n1_chirho = \
        run_gold_pass_chirho(0.0, "STRICT", args_chirho.n_chirho)
    print(f"    -> char {synth_char_chirho:.3f}  "
          f"exact {synth_exact_chirho}/{n1_chirho}  "
          f"struct-letters {sum(v[1] for v in synth_pl_chirho.values())}")
    print("  pass 2: ALPHA=1.0 (real-only identity)")
    real_pl_chirho, real_char_chirho, real_exact_chirho, n2_chirho = \
        run_gold_pass_chirho(1.0, "STRICT", args_chirho.n_chirho)
    print(f"    -> char {real_char_chirho:.3f}  "
          f"exact {real_exact_chirho}/{n2_chirho}  "
          f"struct-letters {sum(v[1] for v in real_pl_chirho.values())}")

    table_chirho, diag_chirho = derive_alpha_table_chirho(
        synth_pl_chirho, real_pl_chirho, args_chirho.default_alpha_chirho)

    print("\n=== per-letter alpha (calibrated from measurement) ===")
    print(f"  {'L':2} {'alpha':>6}  "
          f"{'synth':>10}  {'real':>10}  reason")
    for letter_chirho, alpha_chirho, sr_chirho, sn_chirho, rr_chirho, \
            rn_chirho, reason_chirho in diag_chirho:
        sr_s_chirho = f"{sr_chirho:.2f}({sn_chirho})" \
            if sr_chirho is not None else f"-({sn_chirho})"
        rr_s_chirho = f"{rr_chirho:.2f}({rn_chirho})" \
            if rr_chirho is not None else f"-({rn_chirho})"
        print(f"  {letter_chirho:2} {alpha_chirho:6.3f}  "
              f"{sr_s_chirho:>10}  {rr_s_chirho:>10}  {reason_chirho}")

    CALIB_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)
    out_chirho = {
        "noteChirho": "per-letter ALPHA (real-witness weight) derived "
                     "from A/B per-letter accuracy on gold STRICT "
                     "structure-correct positions; the data-driven "
                     "back-prop alpha.",
        "calibrationNChirho": args_chirho.n_chirho,
        "defaultAlphaChirho": args_chirho.default_alpha_chirho,
        "minSamplesChirho": MIN_SAMPLES_CHIRHO,
        "synthCharAccChirho": round(synth_char_chirho, 4),
        "realCharAccChirho": round(real_char_chirho, 4),
        "perLetterAlphaChirho": table_chirho,
        "perLetterAccSynthChirho": {
            l_chirho: ([v_chirho[0], v_chirho[1]])
            for l_chirho, v_chirho in synth_pl_chirho.items()
        },
        "perLetterAccRealChirho": {
            l_chirho: ([v_chirho[0], v_chirho[1]])
            for l_chirho, v_chirho in real_pl_chirho.items()
        },
    }
    CALIB_PATH_CHIRHO.write_text(json.dumps(out_chirho, ensure_ascii=False,
                                            indent=2))
    print(f"\nwrote {CALIB_PATH_CHIRHO} ({len(table_chirho)} letters)")


if __name__ == "__main__":
    main_chirho()
