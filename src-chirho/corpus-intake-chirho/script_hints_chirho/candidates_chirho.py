# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Derive printed-script hint candidates from the v8 score shards, draw seeded samples, render review sheets, report.

derive: joins the intake database's draft runs (raw OCR, immutable read) with
the score shards (model output), writes candidates-chirho.jsonl.gz (keys and
measurements only) and four seeded samples with review montages:
  a-uniform-chirho       uniform over all A candidates; the only sample that estimates A's precision
  a-syriac-arabic-chirho A candidates on lines that introduce Syriac or Arabic (oversampled challenge)
  a-sigla-chirho         A candidates that are one short word (oversampled challenge)
  b-hidden-hebrew-chirho French runs holding a high-P(hebrew) word (exploratory)
The samples are disjoint; challenge strata are reported apart with their share of A.
report: reads the adjudication file and prints each sample's rate with a 95% Wilson interval.
Adjudication by an agent looking at the scan is machine judgment, not human certification.

CLI: workspace-chirho/classifier-venv-chirho/bin/python3 -I \\
       src-chirho/corpus-intake-chirho/script_hints_chirho/candidates_chirho.py derive|report [--seed=31112]

Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
"""
import argparse
import gzip
import json
import random
import re
import sqlite3
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hint_rules_chirho import (HEBREW_INDEX_CHIRHO, candidate_b_words_chirho, is_candidate_a_chirho,  # noqa: E402
                               ocr_letter_script_chirho, run_mean_chirho, wilson_chirho, words_in_run_chirho)
from score_shards_chirho import INTAKE_DB_CHIRHO, INTAKE_ROOT_CHIRHO, OUT_ROOT_CHIRHO, load_manifest_chirho, sha256_file_chirho  # noqa: E402

HINTS_ROOT_CHIRHO = OUT_ROOT_CHIRHO.parent
SAMPLES_ROOT_CHIRHO = HINTS_ROOT_CHIRHO / "samples-chirho"
SAMPLE_SIZES_CHIRHO = {"a-uniform-chirho": 100, "a-syriac-arabic-chirho": 30, "a-sigla-chirho": 30, "b-hidden-hebrew-chirho": 50}
SYRIAC_ARABIC_CONTEXT_CHIRHO = re.compile(r"\b[Ll]a S\b|\bS (?:offre|porte|lit|a lu|donne)\b|(?i:syr|pesh|\barab|saad)")
VERDICTS_CHIRHO = ("hebrew", "not-hebrew", "unclear")


def challenge_stratum_chirho(candidate_chirho: dict) -> str | None:
    """Fixed order, so a candidate belongs to one stratum at most."""
    if candidate_chirho["words_chirho"] == 1 and len(re.findall(r"\w", candidate_chirho["text_chirho"])) <= 2:
        return "a-sigla-chirho"
    if SYRIAC_ARABIC_CONTEXT_CHIRHO.search(candidate_chirho["line_text_chirho"]):
        return "a-syriac-arabic-chirho"
    return None


def draw_samples_chirho(a_chirho: list[dict], b_chirho: list[dict], seed_chirho: int, sizes_chirho: dict = SAMPLE_SIZES_CHIRHO) -> dict[str, list[dict]]:
    """Seeded and disjoint: the uniform A sample first, then each challenge stratum from what remains, then B."""
    rng_chirho = random.Random(seed_chirho)
    uniform_chirho = rng_chirho.sample(a_chirho, min(sizes_chirho["a-uniform-chirho"], len(a_chirho)))
    taken_chirho = {id(c_chirho) for c_chirho in uniform_chirho}
    samples_chirho = {"a-uniform-chirho": uniform_chirho}
    for stratum_chirho in ("a-syriac-arabic-chirho", "a-sigla-chirho"):
        pool_chirho = [c_chirho for c_chirho in a_chirho if id(c_chirho) not in taken_chirho and challenge_stratum_chirho(c_chirho) == stratum_chirho]
        samples_chirho[stratum_chirho] = rng_chirho.sample(pool_chirho, min(sizes_chirho[stratum_chirho], len(pool_chirho)))
        taken_chirho |= {id(c_chirho) for c_chirho in samples_chirho[stratum_chirho]}
    samples_chirho["b-hidden-hebrew-chirho"] = rng_chirho.sample(b_chirho, min(sizes_chirho["b-hidden-hebrew-chirho"], len(b_chirho)))
    return samples_chirho


def verified_shards_chirho() -> list[Path]:
    manifest_chirho = load_manifest_chirho(OUT_ROOT_CHIRHO)
    if manifest_chirho is None:
        raise SystemExit("no score manifest; run score_shards_chirho.py first")
    paths_chirho = []
    for name_chirho, entry_chirho in sorted(manifest_chirho["shards_chirho"].items()):
        path_chirho = OUT_ROOT_CHIRHO / name_chirho
        if sha256_file_chirho(path_chirho) != entry_chirho["sha256_chirho"]:
            raise SystemExit(f"score shard changed after scoring: {name_chirho}")
        paths_chirho.append(path_chirho)
    return paths_chirho


def derive_chirho(seed_chirho: int) -> None:
    db_chirho = sqlite3.connect(f"file:{INTAKE_DB_CHIRHO}?immutable=1", uri=True)
    a_chirho, b_chirho, runs_chirho, by_w1_chirho = [], [], 0, {}
    out_chirho = gzip.open(HINTS_ROOT_CHIRHO / "candidates-chirho.jsonl.gz.partial", "wt", encoding="utf-8")
    for shard_chirho in verified_shards_chirho():
        for line_chirho in gzip.open(shard_chirho, "rt", encoding="utf-8"):
            page_chirho = json.loads(line_chirho)
            v_chirho, p_chirho = page_chirho["volume_chirho"], page_chirho["page_chirho"]
            probs_by_line_chirho = {li_chirho: probs_chirho for li_chirho, probs_chirho in page_chirho["lines_chirho"]}
            lines_chirho = {li_chirho: (x_chirho, y_chirho, w_chirho, h_chirho, json.loads(wj_chirho), t_chirho) for li_chirho, x_chirho, y_chirho, w_chirho, h_chirho, wj_chirho, t_chirho in db_chirho.execute(
                "SELECT line_index_chirho, x_min_chirho, y_min_chirho, width_chirho, height_chirho, words_json_chirho, pdftotext_chirho FROM intake_lines_chirho WHERE volume_number_chirho=? AND page_number_chirho=?", (v_chirho, p_chirho))}
            for li_chirho, si_chirho, sx_chirho, sw_chirho, script_chirho, text_chirho in db_chirho.execute(
                    "SELECT line_index_chirho, segment_index_chirho, x_min_px_chirho, width_px_chirho, script_type_chirho, pdftotext_chirho FROM intake_segments_chirho WHERE volume_number_chirho=? AND page_number_chirho=?", (v_chirho, p_chirho)):
                runs_chirho += 1
                x_chirho, y_chirho, w_chirho, h_chirho, words_chirho, line_text_chirho = lines_chirho[li_chirho]
                idx_chirho = words_in_run_chirho(words_chirho, x_chirho, sx_chirho, sw_chirho)
                word_probs_chirho = [probs_by_line_chirho[li_chirho][i_chirho] for i_chirho in idx_chirho]
                mean_chirho = run_mean_chirho(word_probs_chirho, [words_chirho[i_chirho]["xMaxChirho"] - words_chirho[i_chirho]["xMinChirho"] for i_chirho in idx_chirho])
                base_chirho = {"key_chirho": [v_chirho, p_chirho, li_chirho, si_chirho], "line_box_chirho": [x_chirho, y_chirho, w_chirho, h_chirho], "run_chirho": [sx_chirho, sw_chirho],
                               "w1_chirho": ocr_letter_script_chirho(text_chirho), "w2_hebrew_chirho": None if mean_chirho is None else round(mean_chirho[HEBREW_INDEX_CHIRHO], 4),
                               "words_chirho": len(idx_chirho), "text_chirho": text_chirho, "line_text_chirho": line_text_chirho}
                added_chirho = []
                if is_candidate_a_chirho(script_chirho, mean_chirho):
                    added_chirho.append({**base_chirho, "set_chirho": "A"})
                    a_chirho.append(added_chirho[-1])
                    by_w1_chirho[base_chirho["w1_chirho"]] = by_w1_chirho.get(base_chirho["w1_chirho"], 0) + 1
                hidden_chirho = candidate_b_words_chirho(script_chirho, word_probs_chirho)
                if hidden_chirho:
                    added_chirho.append({**base_chirho, "set_chirho": "B", "b_words_chirho": [
                        [words_chirho[idx_chirho[k_chirho]][f_chirho] for f_chirho in ("xMinChirho", "yMinChirho", "xMaxChirho", "yMaxChirho")] for k_chirho in hidden_chirho]})
                    b_chirho.append(added_chirho[-1])
                for c_chirho in added_chirho:   # keys and measurements only; raw OCR stays in the intake database
                    out_chirho.write(json.dumps({k_chirho: v_chirho for k_chirho, v_chirho in c_chirho.items() if k_chirho not in ("text_chirho", "line_text_chirho")}, separators=(",", ":")) + "\n")
    out_chirho.close()
    (HINTS_ROOT_CHIRHO / "candidates-chirho.jsonl.gz.partial").replace(HINTS_ROOT_CHIRHO / "candidates-chirho.jsonl.gz")
    strata_chirho = {s_chirho: sum(1 for c_chirho in a_chirho if challenge_stratum_chirho(c_chirho) == s_chirho) for s_chirho in ("a-syriac-arabic-chirho", "a-sigla-chirho")}
    samples_chirho = draw_samples_chirho(a_chirho, b_chirho, seed_chirho)
    summary_chirho = {"seed_chirho": seed_chirho, "runs_chirho": runs_chirho, "a_candidates_chirho": len(a_chirho), "a_by_w1_chirho": by_w1_chirho,
                      "a_strata_chirho": strata_chirho, "b_runs_chirho": len(b_chirho), "b_words_chirho": sum(len(c_chirho["b_words_chirho"]) for c_chirho in b_chirho),
                      "samples_chirho": {}}
    for name_chirho, cases_chirho in samples_chirho.items():
        folder_chirho = SAMPLES_ROOT_CHIRHO / name_chirho
        folder_chirho.mkdir(parents=True, exist_ok=True)
        ids_chirho = [f"{name_chirho}-{n_chirho + 1:03d}" for n_chirho in range(len(cases_chirho))]
        for start_chirho in range(0, len(cases_chirho), 10):
            render_sheet_chirho(db_chirho, list(zip(ids_chirho, cases_chirho))[start_chirho:start_chirho + 10], folder_chirho / f"sheet-{start_chirho // 10 + 1:02d}-chirho.png")
        summary_chirho["samples_chirho"][name_chirho] = [{"id_chirho": i_chirho, "key_chirho": c_chirho["key_chirho"], "w1_chirho": c_chirho["w1_chirho"],
                                                          "w2_hebrew_chirho": c_chirho["w2_hebrew_chirho"], "text_chirho": c_chirho["text_chirho"]} for i_chirho, c_chirho in zip(ids_chirho, cases_chirho)]
    (SAMPLES_ROOT_CHIRHO / "samples-chirho.json").write_text(json.dumps(summary_chirho, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(json.dumps({k_chirho: v_chirho for k_chirho, v_chirho in summary_chirho.items() if k_chirho != "samples_chirho"}))


def render_sheet_chirho(db_chirho: sqlite3.Connection, cases_chirho: list[tuple[str, dict]], out_chirho: Path) -> None:
    """One labelled strip per case: the full line, the run boxed red, B's flagged words boxed blue."""
    strips_chirho = []
    for case_id_chirho, c_chirho in cases_chirho:
        v_chirho, p_chirho, li_chirho, _si_chirho = c_chirho["key_chirho"]
        (rel_chirho,) = db_chirho.execute("SELECT image_rel_path_chirho FROM intake_pages_chirho WHERE volume_number_chirho=? AND page_number_chirho=?", (v_chirho, p_chirho)).fetchone()
        x_chirho, y_chirho, w_chirho, h_chirho = c_chirho["line_box_chirho"]
        sx_chirho, sw_chirho = c_chirho["run_chirho"]
        draw_chirho = ["-stroke", "red", "-strokewidth", "3", "-fill", "none", "-draw", f"rectangle {x_chirho + sx_chirho},{y_chirho} {x_chirho + sx_chirho + sw_chirho},{y_chirho + h_chirho}"]
        for x0_chirho, y0_chirho, x1_chirho, y1_chirho in c_chirho.get("b_words_chirho", []):
            draw_chirho += ["-stroke", "blue", "-draw", f"rectangle {x0_chirho - 3},{y0_chirho - 3} {x1_chirho + 3},{y1_chirho + 3}"]
        strip_chirho = out_chirho.with_name(f"{out_chirho.stem}-{case_id_chirho}.png")
        subprocess.run(["magick", str(INTAKE_ROOT_CHIRHO / rel_chirho), *draw_chirho, "-crop", f"{w_chirho + 20}x{h_chirho + 10}+{max(0, x_chirho - 10)}+{max(0, y_chirho - 5)}", "+repage",
                        "-resize", "1000x>", "-background", "white", "-gravity", "north", "-splice", "0x24", "-gravity", "northwest", "-stroke", "none", "-fill", "black",
                        "-pointsize", "18", "-annotate", "+4+2", f"{case_id_chirho}  {v_chirho}:{p_chirho} line {li_chirho}", str(strip_chirho)], check=True)
        strips_chirho.append(str(strip_chirho))
    subprocess.run(["magick", *strips_chirho, "-background", "white", "-gravity", "west", "-splice", "0x10", "-append", str(out_chirho)], check=True)
    for s_chirho in strips_chirho:
        Path(s_chirho).unlink()


def report_chirho() -> None:
    summary_chirho = json.loads((SAMPLES_ROOT_CHIRHO / "samples-chirho.json").read_text(encoding="utf-8"))
    adjudication_chirho = json.loads((SAMPLES_ROOT_CHIRHO / "adjudication-chirho.json").read_text(encoding="utf-8"))
    verdicts_chirho = adjudication_chirho["verdicts_chirho"]
    a_total_chirho = summary_chirho["a_candidates_chirho"]
    for name_chirho, cases_chirho in summary_chirho["samples_chirho"].items():
        got_chirho = [verdicts_chirho[c_chirho["id_chirho"]] for c_chirho in cases_chirho if c_chirho["id_chirho"] in verdicts_chirho]
        if any(g_chirho not in VERDICTS_CHIRHO for g_chirho in got_chirho):
            raise SystemExit(f"unknown verdict in {name_chirho}")
        judged_chirho = [g_chirho for g_chirho in got_chirho if g_chirho != "unclear"]
        hits_chirho = sum(1 for g_chirho in judged_chirho if g_chirho == "hebrew")
        low_chirho, high_chirho = wilson_chirho(hits_chirho, len(judged_chirho))
        share_chirho = "" if name_chirho in ("a-uniform-chirho", "b-hidden-hebrew-chirho") else f"; stratum is {summary_chirho['a_strata_chirho'][name_chirho]} of {a_total_chirho} A candidates (oversampled, not corpus precision)"
        print(f"{name_chirho}: adjudicated {len(got_chirho)}/{len(cases_chirho)}, unclear {len(got_chirho) - len(judged_chirho)}, "
              f"printed Hebrew {hits_chirho}/{len(judged_chirho)} (95% Wilson {low_chirho:.3f}-{high_chirho:.3f}){share_chirho}")


if __name__ == "__main__":
    parser_chirho = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser_chirho.add_argument("command", choices=("derive", "report"))
    parser_chirho.add_argument("--seed", type=int, default=31112)
    args_chirho = parser_chirho.parse_args()
    derive_chirho(args_chirho.seed) if args_chirho.command == "derive" else report_chirho()
