# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""Problem-2 eval rig: measure the is-Hebrew gate's FALSE-NEGATIVE rate on real
Hebrew, and save the crops it wrongly rejects as a shared validation set.

The gate today = tesseract multi-script witness (fra+heb+grc+lat) + has_hebrew.
Its known failure mode is vocalized (niqqud) Hebrew being misread as Latin
(e.g. אלהא -> "NT."). We run the EXACT current gate over a sample of real
Hebrew word crops (workspace-chirho/hebrew-corpus-chirho) and record every crop
it rejects -- those false negatives are the set any fix must rescue without
re-admitting the Latin crops the gate currently (correctly) rejects.

Usage:
  PYTORCH_ENABLE_MPS_FALLBACK=1 .../python3 src-chirho/gate_fn_eval_chirho.py [N]
"""
import random
import shutil
import sys
import tempfile
from pathlib import Path

# reuse the REAL gate so we measure exactly what production does
from read_volume_page_chirho import (
    PROJECT_ROOT_CHIRHO,
    has_hebrew_chirho,
    tess_text_chirho,
)

HEBREW_CORPUS_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "hebrew-corpus-chirho"
FN_OUT_DIR_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho" / "word-ocr-chirho"
                     / "gate-fn-crops-chirho")


def main_chirho():
    sample_n_chirho = int(sys.argv[1]) if len(sys.argv) > 1 else 250
    random.seed(316)
    corpus_chirho = sorted(p_chirho for p_chirho in HEBREW_CORPUS_DIR_CHIRHO.glob("*.png"))
    random.shuffle(corpus_chirho)
    sample_chirho = corpus_chirho[:sample_n_chirho]

    if FN_OUT_DIR_CHIRHO.exists():
        shutil.rmtree(FN_OUT_DIR_CHIRHO, ignore_errors=True)
    FN_OUT_DIR_CHIRHO.mkdir(parents=True, exist_ok=True)

    tmp_dir_chirho = Path(tempfile.mkdtemp(prefix="gate-fn-eval-", dir=str(PROJECT_ROOT_CHIRHO)))
    kept_chirho = 0
    fn_chirho = 0
    fn_reads_chirho = []
    try:
        for crop_path_chirho in sample_chirho:
            tess_chirho = tess_text_chirho(crop_path_chirho, tmp_dir_chirho)
            if has_hebrew_chirho(tess_chirho):
                kept_chirho += 1
            else:
                fn_chirho += 1
                shutil.copy(crop_path_chirho, FN_OUT_DIR_CHIRHO / crop_path_chirho.name)
                fn_reads_chirho.append((crop_path_chirho.name, (tess_chirho or "").strip()[:20]))
    finally:
        shutil.rmtree(tmp_dir_chirho, ignore_errors=True)

    n_chirho = max(1, len(sample_chirho))
    print(f"current gate on {len(sample_chirho)} real-Hebrew corpus crops:")
    print(f"  kept (tess saw Hebrew): {kept_chirho} ({kept_chirho/n_chirho:.1%})")
    print(f"  REJECTED (false neg):   {fn_chirho} ({fn_chirho/n_chirho:.1%})")
    print(f"  FN crops saved -> {FN_OUT_DIR_CHIRHO}")
    print("  sample FN tess-reads:")
    for name_chirho, read_chirho in fn_reads_chirho[:25]:
        print(f"    {name_chirho}: tess={read_chirho!r}")


if __name__ == "__main__":
    main_chirho()
