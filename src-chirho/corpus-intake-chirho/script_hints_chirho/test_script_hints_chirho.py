# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Printed-script hint dry run: rule behaviour, resumable sharding, disjoint seeded samples, batch-invariant scoring.

Run: workspace-chirho/classifier-venv-chirho/bin/python3 -I -m unittest discover -s src-chirho/corpus-intake-chirho/script_hints_chirho -p 'test_*.py'
"""
import gzip
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from candidates_chirho import challenge_stratum_chirho, draw_samples_chirho  # noqa: E402
from hint_rules_chirho import (candidate_b_words_chirho, is_candidate_a_chirho, ocr_letter_script_chirho,  # noqa: E402
                               run_mean_chirho, wilson_chirho, words_in_run_chirho)
from score_shards_chirho import MODEL_CHIRHO, plan_shards_chirho, run_shards_chirho, sha256_file_chirho  # noqa: E402

HEB_CHIRHO = [0.0, 1.0, 0.0, 0.0]
LAT_CHIRHO = [1.0, 0.0, 0.0, 0.0]


class RulesChirho(unittest.TestCase):
    def test_ocr_letters_are_reported_not_trusted_chirho(self):
        self.assertEqual(ocr_letter_script_chirho("ואת"), "hebrew")
        self.assertEqual(ocr_letter_script_chirho("καὶ"), "greek")
        self.assertEqual(ocr_letter_script_chirho("Tax,"), "latin")
        self.assertEqual(ocr_letter_script_chirho("779 ^"), "none")
        # A Hebrew-letter OCR run is not a candidate by itself: only the image witness can propose one.
        self.assertFalse(is_candidate_a_chirho("unknown-chirho", run_mean_chirho([LAT_CHIRHO], [40])))

    def test_runs_are_line_local_and_words_page_absolute_chirho(self):
        words_chirho = [{"xMinChirho": 110, "xMaxChirho": 150}, {"xMinChirho": 300, "xMaxChirho": 340}]
        self.assertEqual(words_in_run_chirho(words_chirho, 100, 0, 100), [0])
        self.assertEqual(words_in_run_chirho(words_chirho, 100, 150, 100), [1])
        self.assertEqual(words_in_run_chirho(words_chirho, 0, 0, 100), [])

    def test_width_weighted_mean_and_unmeasurable_runs_chirho(self):
        self.assertAlmostEqual(run_mean_chirho([HEB_CHIRHO, LAT_CHIRHO], [90, 10])[1], 0.9)
        self.assertIsNone(run_mean_chirho([None], [50]))
        self.assertIsNone(run_mean_chirho([], []))
        self.assertAlmostEqual(run_mean_chirho([HEB_CHIRHO, None], [10, 500])[1], 1.0)

    def test_candidate_sets_respect_draft_script_and_thresholds_chirho(self):
        self.assertTrue(is_candidate_a_chirho("unknown-chirho", [0.05, 0.9, 0.05, 0.0]))
        self.assertFalse(is_candidate_a_chirho("unknown-chirho", [0.11, 0.89, 0.0, 0.0]))
        self.assertFalse(is_candidate_a_chirho("french-chirho", HEB_CHIRHO))
        self.assertEqual(candidate_b_words_chirho("french-chirho", [LAT_CHIRHO, [0.01, 0.98, 0.01, 0.0], None]), [1])
        self.assertEqual(candidate_b_words_chirho("unknown-chirho", [HEB_CHIRHO]), [])

    def test_wilson_interval_chirho(self):
        low_chirho, high_chirho = wilson_chirho(19, 19)
        self.assertAlmostEqual(low_chirho, 0.8318, places=3)
        self.assertAlmostEqual(high_chirho, 1.0, places=9)
        self.assertEqual(wilson_chirho(0, 0), (0.0, 1.0))


class ShardsChirho(unittest.TestCase):
    def setUp(self):
        self.tmp_chirho = tempfile.TemporaryDirectory()
        self.root_chirho = Path(self.tmp_chirho.name)
        self.plan_chirho = plan_shards_chirho({1: [1, 2, 199, 200, 201], 3: [5]}, shard_pages_chirho=200)
        self.identity_chirho = {"intake_db_sha256_chirho": "a", "model_sha256_chirho": "b"}
        self.calls_chirho: list = []

    def tearDown(self):
        self.tmp_chirho.cleanup()

    def scorer_chirho(self, fail_on_chirho=None):
        def score_chirho(volume_chirho, page_chirho):
            if (volume_chirho, page_chirho) == fail_on_chirho:
                raise KeyboardInterrupt
            self.calls_chirho.append((volume_chirho, page_chirho))
            return {"volume_chirho": volume_chirho, "page_chirho": page_chirho, "lines_chirho": [[0, [HEB_CHIRHO]]]}
        return score_chirho

    def test_every_page_lands_in_exactly_one_shard_chirho(self):
        self.assertEqual([s_chirho["pages_chirho"] for s_chirho in self.plan_chirho], [[1, 2, 199], [200, 201], [5]])
        self.assertEqual(self.plan_chirho[1]["name_chirho"], "vol-1-chirho/shard-0200-chirho.jsonl.gz")

    def test_interrupted_run_resumes_without_rescoring_done_shards_chirho(self):
        with self.assertRaises(KeyboardInterrupt):
            run_shards_chirho(self.plan_chirho, self.scorer_chirho(fail_on_chirho=(1, 201)), self.root_chirho, self.identity_chirho)
        self.assertEqual(sorted(json.loads((self.root_chirho / "manifest-chirho.json").read_text())["shards_chirho"]), ["vol-1-chirho/shard-0000-chirho.jsonl.gz"])
        self.calls_chirho.clear()
        manifest_chirho = run_shards_chirho(self.plan_chirho, self.scorer_chirho(), self.root_chirho, self.identity_chirho)
        self.assertEqual(self.calls_chirho, [(1, 200), (1, 201), (3, 5)])
        self.assertEqual(len(manifest_chirho["shards_chirho"]), 3)
        self.assertEqual(list(self.root_chirho.rglob("*.partial")), [])
        rows_chirho = [json.loads(l_chirho) for l_chirho in gzip.open(self.root_chirho / "vol-1-chirho/shard-0200-chirho.jsonl.gz", "rt")]
        self.assertEqual([r_chirho["page_chirho"] for r_chirho in rows_chirho], [200, 201])

    def test_damaged_shard_is_rescored_and_identity_change_refuses_chirho(self):
        run_shards_chirho(self.plan_chirho, self.scorer_chirho(), self.root_chirho, self.identity_chirho)
        damaged_chirho = self.root_chirho / "vol-3-chirho/shard-0000-chirho.jsonl.gz"
        damaged_chirho.write_bytes(damaged_chirho.read_bytes() + b"x")
        self.calls_chirho.clear()
        run_shards_chirho(self.plan_chirho, self.scorer_chirho(), self.root_chirho, self.identity_chirho)
        self.assertEqual(self.calls_chirho, [(3, 5)])
        with self.assertRaises(RuntimeError):
            run_shards_chirho(self.plan_chirho, self.scorer_chirho(), self.root_chirho, {**self.identity_chirho, "model_sha256_chirho": "c"})
        run_shards_chirho(self.plan_chirho, self.scorer_chirho(), self.root_chirho, {**self.identity_chirho, "model_sha256_chirho": "c"}, fresh_chirho=True)


class SamplesChirho(unittest.TestCase):
    def candidates_chirho(self):
        a_chirho = [{"key_chirho": [1, n_chirho, 0, 0], "words_chirho": 1 if n_chirho % 5 == 0 else 3, "text_chirho": "M" if n_chirho % 5 == 0 else "abc def",
                     "line_text_chirho": "La S offre:" if n_chirho % 7 == 0 else "texte"} for n_chirho in range(400)]
        b_chirho = [{"key_chirho": [2, n_chirho, 0, 0]} for n_chirho in range(80)]
        return a_chirho, b_chirho

    def test_samples_are_seeded_disjoint_and_stratified_chirho(self):
        a_chirho, b_chirho = self.candidates_chirho()
        first_chirho = draw_samples_chirho(a_chirho, b_chirho, 31112)
        again_chirho = draw_samples_chirho(a_chirho, b_chirho, 31112)
        self.assertEqual({k_chirho: [c_chirho["key_chirho"] for c_chirho in v_chirho] for k_chirho, v_chirho in first_chirho.items()},
                         {k_chirho: [c_chirho["key_chirho"] for c_chirho in v_chirho] for k_chirho, v_chirho in again_chirho.items()})
        keys_chirho = [tuple(c_chirho["key_chirho"]) for name_chirho in ("a-uniform-chirho", "a-syriac-arabic-chirho", "a-sigla-chirho") for c_chirho in first_chirho[name_chirho]]
        self.assertEqual(len(keys_chirho), len(set(keys_chirho)))
        self.assertTrue(all(challenge_stratum_chirho(c_chirho) == "a-sigla-chirho" for c_chirho in first_chirho["a-sigla-chirho"]))
        self.assertTrue(all(challenge_stratum_chirho(c_chirho) == "a-syriac-arabic-chirho" for c_chirho in first_chirho["a-syriac-arabic-chirho"]))
        self.assertEqual(len(first_chirho["a-uniform-chirho"]), 100)
        self.assertEqual(len(first_chirho["b-hidden-hebrew-chirho"]), 50)


@unittest.skipUnless(MODEL_CHIRHO.exists(), "local v8 model not present")
class BatchInvarianceChirho(unittest.TestCase):
    def test_batched_scores_equal_one_at_a_time_chirho(self):
        import sqlite3
        from PIL import Image, ImageDraw
        from score_shards_chirho import V8ScorerChirho
        scorer_chirho = V8ScorerChirho(sqlite3.connect(":memory:"), threads_chirho=1)
        crops_chirho = []
        for n_chirho in range(7):
            img_chirho = Image.new("L", (40 + 9 * n_chirho, 30), 255)
            ImageDraw.Draw(img_chirho).rectangle((4 + n_chirho, 6, 20 + 3 * n_chirho, 22), fill=0)
            crops_chirho.append(img_chirho)
        batched_chirho = scorer_chirho.probabilities_chirho(crops_chirho)
        single_chirho = [scorer_chirho.probabilities_chirho([c_chirho])[0] for c_chirho in crops_chirho]
        for b_chirho, s_chirho in zip(batched_chirho, single_chirho):
            for x_chirho, y_chirho in zip(b_chirho, s_chirho):
                self.assertAlmostEqual(x_chirho, y_chirho, places=3)
        self.assertEqual(len(sha256_file_chirho(MODEL_CHIRHO)), 64)


if __name__ == "__main__":
    unittest.main()
