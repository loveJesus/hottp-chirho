# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Stream v8 word-crop scores for the scanned volumes into resumable, sharded side files.

Reads the local intake database (immutable) and its page images; writes only
under workspace-chirho/corpus-intake-chirho/script-hints-chirho/. A page record
keeps the model's four class probabilities per intake word, keyed by line and
word index, and no OCR text: raw OCR stays in the intake database, model
output stays here. Shards are written to a .partial file and renamed; a shard
counts as done only when the manifest records its exact pages and SHA-256, so
an interrupted run resumes where it stopped and a damaged shard is redone.
The manifest pins the intake database and model hashes; if either changes,
the run refuses to mix outputs unless --fresh starts over.

CLI: workspace-chirho/classifier-venv-chirho/bin/python3 -I \\
       src-chirho/corpus-intake-chirho/script_hints_chirho/score_shards_chirho.py [--vol=1,2,3,4] [--threads=4] [--limit-shards=N] [--fresh]

Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
"""
import argparse
import gzip
import hashlib
import json
import os
import platform
import sqlite3
import time
from pathlib import Path
from typing import Callable, Iterable

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parents[3]
INTAKE_ROOT_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "corpus-intake-chirho"
INTAKE_DB_CHIRHO = INTAKE_ROOT_CHIRHO / "intake-chirho.sqlite"
OUT_ROOT_CHIRHO = INTAKE_ROOT_CHIRHO / "script-hints-chirho" / "v8-scores-chirho"
MODEL_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "models-chirho" / "script-classifier-v8-chirho.onnx"
SCANNED_VOLUMES_CHIRHO = (1, 2, 3, 4)
SHARD_PAGES_CHIRHO = 200
MAX_BATCH_CHIRHO = 512
MANIFEST_NAME_CHIRHO = "manifest-chirho.json"


def sha256_file_chirho(path_chirho: Path) -> str:
    digest_chirho = hashlib.sha256()
    with open(path_chirho, "rb") as f_chirho:
        for block_chirho in iter(lambda: f_chirho.read(1 << 20), b""):
            digest_chirho.update(block_chirho)
    return digest_chirho.hexdigest()


def shard_name_chirho(volume_chirho: int, first_page_chirho: int) -> str:
    return f"vol-{volume_chirho}-chirho/shard-{first_page_chirho:04d}-chirho.jsonl.gz"


def plan_shards_chirho(pages_by_volume_chirho: dict[int, list[int]], shard_pages_chirho: int = SHARD_PAGES_CHIRHO) -> list[dict]:
    """Group each volume's pages by page // shard_pages; every page lands in exactly one shard."""
    plan_chirho = []
    for volume_chirho in sorted(pages_by_volume_chirho):
        groups_chirho: dict[int, list[int]] = {}
        for page_chirho in sorted(pages_by_volume_chirho[volume_chirho]):
            groups_chirho.setdefault((page_chirho // shard_pages_chirho) * shard_pages_chirho, []).append(page_chirho)
        for first_chirho, pages_chirho in sorted(groups_chirho.items()):
            plan_chirho.append({"name_chirho": shard_name_chirho(volume_chirho, first_chirho), "volume_chirho": volume_chirho, "pages_chirho": pages_chirho})
    return plan_chirho


def load_manifest_chirho(out_root_chirho: Path) -> dict | None:
    path_chirho = out_root_chirho / MANIFEST_NAME_CHIRHO
    return json.loads(path_chirho.read_text(encoding="utf-8")) if path_chirho.exists() else None


def save_manifest_chirho(out_root_chirho: Path, manifest_chirho: dict) -> None:
    temp_chirho = out_root_chirho / (MANIFEST_NAME_CHIRHO + ".partial")
    temp_chirho.write_text(json.dumps(manifest_chirho, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    os.replace(temp_chirho, out_root_chirho / MANIFEST_NAME_CHIRHO)


def shard_is_done_chirho(out_root_chirho: Path, manifest_chirho: dict, shard_chirho: dict) -> bool:
    entry_chirho = manifest_chirho.get("shards_chirho", {}).get(shard_chirho["name_chirho"])
    path_chirho = out_root_chirho / shard_chirho["name_chirho"]
    return (entry_chirho is not None and path_chirho.exists() and entry_chirho["pages_chirho"] == shard_chirho["pages_chirho"]
            and entry_chirho["sha256_chirho"] == sha256_file_chirho(path_chirho))


def run_shards_chirho(plan_chirho: list[dict], score_page_chirho: Callable[[int, int], dict], out_root_chirho: Path,
                      identity_chirho: dict, fresh_chirho: bool = False, limit_shards_chirho: int | None = None,
                      clock_chirho: Callable[[], float] = time.time) -> dict:
    """Score every shard not already done; return the manifest. score_page_chirho(volume, page) -> page record."""
    out_root_chirho.mkdir(parents=True, exist_ok=True)
    manifest_chirho = None if fresh_chirho else load_manifest_chirho(out_root_chirho)
    if manifest_chirho is not None and manifest_chirho["identity_chirho"] != identity_chirho:
        raise RuntimeError("intake database or model changed since these shards were scored; rerun with --fresh")
    if manifest_chirho is None:
        manifest_chirho = {"identity_chirho": identity_chirho, "shards_chirho": {}}
    done_now_chirho = 0
    for shard_chirho in plan_chirho:
        if shard_is_done_chirho(out_root_chirho, manifest_chirho, shard_chirho):
            continue
        if limit_shards_chirho is not None and done_now_chirho >= limit_shards_chirho:
            break
        final_chirho = out_root_chirho / shard_chirho["name_chirho"]
        final_chirho.parent.mkdir(parents=True, exist_ok=True)
        partial_chirho = final_chirho.with_name(final_chirho.name + ".partial")
        started_chirho = clock_chirho()
        words_chirho = 0
        with gzip.open(partial_chirho, "wt", encoding="utf-8", compresslevel=6) as f_chirho:
            for page_chirho in shard_chirho["pages_chirho"]:
                record_chirho = score_page_chirho(shard_chirho["volume_chirho"], page_chirho)
                words_chirho += sum(len(words_l_chirho) for _li_chirho, words_l_chirho in record_chirho["lines_chirho"])
                f_chirho.write(json.dumps(record_chirho, separators=(",", ":")) + "\n")
        os.replace(partial_chirho, final_chirho)
        manifest_chirho["shards_chirho"][shard_chirho["name_chirho"]] = {
            "pages_chirho": shard_chirho["pages_chirho"], "words_chirho": words_chirho, "bytes_chirho": final_chirho.stat().st_size,
            "sha256_chirho": sha256_file_chirho(final_chirho), "seconds_chirho": round(clock_chirho() - started_chirho, 3)}
        save_manifest_chirho(out_root_chirho, manifest_chirho)
        done_now_chirho += 1
    return manifest_chirho


class V8ScorerChirho:
    """The existing v8 ONNX script CNN on intake word boxes. Preprocessing matches its training: grayscale, 32x32 Lanczos, (x/255-0.5)/0.5."""

    def __init__(self, db_chirho: sqlite3.Connection, threads_chirho: int) -> None:
        import numpy as np
        import onnxruntime as ort
        from PIL import Image
        self.np_chirho, self.image_chirho = np, Image
        options_chirho = ort.SessionOptions()
        options_chirho.intra_op_num_threads = threads_chirho
        self.session_chirho = ort.InferenceSession(str(MODEL_CHIRHO), sess_options=options_chirho, providers=["CPUExecutionProvider"])
        self.db_chirho = db_chirho

    def probabilities_chirho(self, crops_chirho: list) -> list[list[float]]:
        np = self.np_chirho
        out_chirho: list[list[float]] = []
        for start_chirho in range(0, len(crops_chirho), MAX_BATCH_CHIRHO):
            batch_chirho = np.stack([(np.asarray(c_chirho.resize((32, 32), self.image_chirho.LANCZOS), dtype=np.float32) / 255.0 - 0.5) / 0.5
                                     for c_chirho in crops_chirho[start_chirho:start_chirho + MAX_BATCH_CHIRHO]]).reshape(-1, 1, 32, 32)
            logits_chirho = self.session_chirho.run(None, {"input": batch_chirho})[0]
            exp_chirho = np.exp(logits_chirho - logits_chirho.max(axis=1, keepdims=True))
            out_chirho += [[round(float(v_chirho), 4) for v_chirho in row_chirho] for row_chirho in exp_chirho / exp_chirho.sum(axis=1, keepdims=True)]
        return out_chirho

    def score_page_chirho(self, volume_chirho: int, page_chirho: int) -> dict:
        rel_chirho, image_sha_chirho = self.db_chirho.execute(
            "SELECT image_rel_path_chirho, image_sha256_chirho FROM intake_pages_chirho WHERE volume_number_chirho=? AND page_number_chirho=?",
            (volume_chirho, page_chirho)).fetchone()
        image_path_chirho = INTAKE_ROOT_CHIRHO / rel_chirho
        if sha256_file_chirho(image_path_chirho) != image_sha_chirho:
            raise RuntimeError(f"page image changed since intake: {volume_chirho}:{page_chirho}")
        with self.image_chirho.open(image_path_chirho) as opened_chirho:
            page_image_chirho = opened_chirho.convert("L")
        lines_chirho, crops_chirho, slots_chirho = [], [], []
        for line_index_chirho, words_json_chirho in self.db_chirho.execute(
                "SELECT line_index_chirho, words_json_chirho FROM intake_lines_chirho WHERE volume_number_chirho=? AND page_number_chirho=? ORDER BY line_index_chirho",
                (volume_chirho, page_chirho)):
            words_chirho = json.loads(words_json_chirho)
            probs_chirho: list = [None] * len(words_chirho)
            for i_chirho, w_chirho in enumerate(words_chirho):
                if w_chirho["xMaxChirho"] > w_chirho["xMinChirho"] and w_chirho["yMaxChirho"] > w_chirho["yMinChirho"]:
                    crops_chirho.append(page_image_chirho.crop((w_chirho["xMinChirho"], w_chirho["yMinChirho"], w_chirho["xMaxChirho"], w_chirho["yMaxChirho"])))
                    slots_chirho.append((probs_chirho, i_chirho))
            lines_chirho.append([line_index_chirho, probs_chirho])
        for (probs_chirho, i_chirho), p_chirho in zip(slots_chirho, self.probabilities_chirho(crops_chirho)):
            probs_chirho[i_chirho] = p_chirho
        page_image_chirho.close()
        return {"volume_chirho": volume_chirho, "page_chirho": page_chirho, "image_sha256_chirho": image_sha_chirho, "lines_chirho": lines_chirho}


def intake_pages_chirho(db_chirho: sqlite3.Connection, volumes_chirho: Iterable[int]) -> dict[int, list[int]]:
    return {v_chirho: [p_chirho for (p_chirho,) in db_chirho.execute(
        "SELECT page_number_chirho FROM intake_pages_chirho WHERE volume_number_chirho=? AND status_chirho='lines-extracted-chirho' ORDER BY 1", (v_chirho,))]
        for v_chirho in volumes_chirho}


def main_chirho() -> None:
    parser_chirho = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser_chirho.add_argument("--vol", default=",".join(map(str, SCANNED_VOLUMES_CHIRHO)))
    parser_chirho.add_argument("--threads", type=int, default=4)
    parser_chirho.add_argument("--limit-shards", type=int, default=None)
    parser_chirho.add_argument("--fresh", action="store_true")
    args_chirho = parser_chirho.parse_args()
    volumes_chirho = [int(v_chirho) for v_chirho in args_chirho.vol.split(",")]
    if not set(volumes_chirho) <= set(SCANNED_VOLUMES_CHIRHO):
        raise SystemExit("v8 scores apply to the scanned volumes 1-4 only")
    import numpy
    import onnxruntime
    import PIL
    db_chirho = sqlite3.connect(f"file:{INTAKE_DB_CHIRHO}?immutable=1", uri=True)
    identity_chirho = {
        "intake_db_sha256_chirho": sha256_file_chirho(INTAKE_DB_CHIRHO),
        "model_sha256_chirho": sha256_file_chirho(MODEL_CHIRHO),
        "model_data_sha256_chirho": sha256_file_chirho(MODEL_CHIRHO.with_name(MODEL_CHIRHO.name + ".data")),
        "versions_chirho": {"python": platform.python_version(), "onnxruntime": onnxruntime.__version__, "numpy": numpy.__version__, "pillow": PIL.__version__},
        "shard_pages_chirho": SHARD_PAGES_CHIRHO,
    }
    scorer_chirho = V8ScorerChirho(db_chirho, args_chirho.threads)
    plan_chirho = plan_shards_chirho(intake_pages_chirho(db_chirho, volumes_chirho))
    started_chirho = time.time()
    manifest_chirho = run_shards_chirho(plan_chirho, scorer_chirho.score_page_chirho, OUT_ROOT_CHIRHO, identity_chirho,
                                        fresh_chirho=args_chirho.fresh, limit_shards_chirho=args_chirho.limit_shards)
    shards_chirho = manifest_chirho["shards_chirho"]
    print(json.dumps({"shards_done_chirho": len(shards_chirho), "shards_planned_chirho": len(plan_chirho),
                      "pages_chirho": sum(len(s_chirho["pages_chirho"]) for s_chirho in shards_chirho.values()),
                      "words_chirho": sum(s_chirho["words_chirho"] for s_chirho in shards_chirho.values()),
                      "bytes_chirho": sum(s_chirho["bytes_chirho"] for s_chirho in shards_chirho.values()),
                      "shard_seconds_chirho": round(sum(s_chirho["seconds_chirho"] for s_chirho in shards_chirho.values()), 1),
                      "this_run_seconds_chirho": round(time.time() - started_chirho, 1)}))


if __name__ == "__main__":
    main_chirho()
