<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Python environments Chirho

The OCR and model lane runs on Python virtual environments under the ignored
`workspace-chirho/` tree. Those directories are large and machine-local, so the
repository keeps their exact package pins here instead. Every pin is a plain
`==` release from PyPI; there are no editable, local-path or git installs.

| Environment | Python | Pins | Status |
|---|---|---|---|
| `workspace-chirho/classifier-venv-chirho` | 3.14 | `classifier-requirements-chirho.txt` (37, torch 2.12.0) | In use; keep |
| `workspace-chirho/kraken-venv-chirho` | 3.13 | `kraken-requirements-chirho.txt` (73, kraken 7.0.2, torch 2.10.0) | Deleted 2026-09-25 |

## classifier-venv-chirho

This is the runtime of the recognition lane. About forty `src-chirho/*.py`
scripts name it in their usage lines, including CRNN inference
(`infer_word_ocr_chirho.py`), the tesseract is-Hebrew gate with the v8 CNN
second witness (`read_volume_page_chirho.py`), and gold-set minting and
evaluation. Two local annotation servers spawn it directly:
`font-specimen-server-chirho.ts` and `polygon-annotate-server-chirho.ts`.
The review stations and the reader app do not use it.

Model outputs depend on the exact torch build, so rebuild from these pins
rather than from unpinned package names.

## kraken-venv-chirho

This held an experiment with the Kraken OCR engine. It was created on
2026-05-12. No source file, script or progress row ever used it; the CRNN
became the production recognizer instead. L.J. approved deleting unused OCR
toolkits on 2026-09-25, so it was removed to free 1.0 GB. The only models
inside it were the defaults that ship with the packages (Kraken's `blla`
segmenter and torchmetrics' LPIPS weights), which a reinstall restores.

## Rebuilding

Both pin files were checked on 2026-09-25 with a dry-run install against the
Homebrew interpreters: every pin resolved, with zero errors.

```bash
# classifier (Python 3.14)
/opt/homebrew/opt/python@3.14/bin/python3.14 -m venv workspace-chirho/classifier-venv-chirho
workspace-chirho/classifier-venv-chirho/bin/python -m pip install -r spec-chirho/python-envs-chirho/classifier-requirements-chirho.txt

# kraken (Python 3.13), only if the Kraken witness is revived
/opt/homebrew/opt/python@3.13/bin/python3.13 -m venv workspace-chirho/kraken-venv-chirho
workspace-chirho/kraken-venv-chirho/bin/python -m pip install -r spec-chirho/python-envs-chirho/kraken-requirements-chirho.txt
```

`uv pip install --python <venv>/bin/python -r <pins>` does the same, faster.
After any package change inside a kept environment, refresh its pin file with
`<venv>/bin/python -m pip freeze --all`, and keep the header lines.
