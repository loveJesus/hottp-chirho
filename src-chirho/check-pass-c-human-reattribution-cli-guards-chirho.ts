// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Non-mutating guard checks for the Pass-C human validation reattribution CLI.
 *
 * These checks use a temporary SQLite fixture that points at an existing live
 * span. They prove generic reviewer rows can only be superseded by explicit
 * human attribution under live-text drift guards.
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { scanSpanLinePathsChirho, type SpanLineLikeChirho, type SpanLikeChirho } from "./span-nfc-chirho.ts";
import { hashTextChirho, normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "check-pass-c-human-reattribution-cli-guards-chirho";
const REATTRIBUTION_SCRIPT_CHIRHO = "reattribute-pass-c-human-validations-chirho";

interface LiveSpanFixtureChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  textChirho: string;
}

interface ReattributionFixtureChirho {
  dirChirho: string;
  dbPathChirho: string;
  backupPathChirho: string;
  liveSpanChirho: LiveSpanFixtureChirho;
  liveSpansChirho: LiveSpanFixtureChirho[];
  validationIdsChirho: number[];
}

interface ValidationSummaryRowChirho {
  rowCountChirho: number;
  currentCountChirho: number;
  currentHumanReviewerCountChirho: number;
  currentOriginalTextChirho: string | null;
  reviewerChirho: string | null;
  supersedesIdChirho: number | null;
}

function commandTextChirho(argsChirho: string[]): string {
  return argsChirho.map((argChirho) => (/\s/.test(argChirho) ? JSON.stringify(argChirho) : argChirho)).join(" ");
}

function runCommandChirho(argsChirho: string[]): {
  exitCodeChirho: number;
  stdoutChirho: string;
  stderrChirho: string;
} {
  const resultChirho = Bun.spawnSync(argsChirho, {
    cwd: PROJECT_ROOT_CHIRHO,
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    exitCodeChirho: resultChirho.exitCode,
    stdoutChirho: Buffer.from(resultChirho.stdout).toString("utf8"),
    stderrChirho: Buffer.from(resultChirho.stderr).toString("utf8"),
  };
}

function assertCheckChirho(conditionChirho: boolean, messageChirho: string): void {
  if (!conditionChirho) throw new Error(messageChirho);
}

function findLiveSpanFixturesChirho(countChirho: number): LiveSpanFixtureChirho[] {
  const fixturesChirho: LiveSpanFixtureChirho[] = [];
  for (const pathChirho of scanSpanLinePathsChirho()) {
    const lineChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as SpanLineLikeChirho;
    if (
      typeof lineChirho.volumeChirho !== "number" ||
      typeof lineChirho.pageChirho !== "number" ||
      typeof lineChirho.lineIndexChirho !== "number"
    ) {
      continue;
    }
    for (const spanChirho of lineChirho.spansChirho ?? []) {
      const candidateChirho = spanChirho as SpanLikeChirho & { segmentIndexChirho?: number };
      if (typeof candidateChirho.segmentIndexChirho !== "number") continue;
      if (typeof candidateChirho.utf8TextChirho !== "string") continue;
      const textChirho = normalizeTextForStorageChirho(candidateChirho.utf8TextChirho);
      if (textChirho.trim().length === 0) continue;
      fixturesChirho.push({
        volumeChirho: lineChirho.volumeChirho,
        pageChirho: lineChirho.pageChirho,
        lineIndexChirho: lineChirho.lineIndexChirho,
        segmentIndexChirho: candidateChirho.segmentIndexChirho,
        textChirho,
      });
      if (fixturesChirho.length >= countChirho) return fixturesChirho;
    }
  }
  throw new Error(`could not find ${countChirho} non-empty live span fixture(s)`);
}

function createFixtureChirho(
  rowCountChirho = 1,
  originalTextOverridesChirho: Map<number, string> = new Map()
): ReattributionFixtureChirho {
  const dirChirho = mkdtempSync(join(tmpdir(), "pass-c-human-reattribution-cli-guard-chirho-"));
  const dbPathChirho = join(dirChirho, "progress-chirho.sqlite");
  const backupPathChirho = join(dirChirho, "pass-c-human-validations-backup-chirho.json");
  const liveSpansChirho = findLiveSpanFixturesChirho(rowCountChirho);
  const dbChirho = new Database(dbPathChirho);
  const validationIdsChirho: number[] = [];
  try {
    dbChirho.run(`
      CREATE TABLE pass_c_human_validations_chirho (
        id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
        volume_chirho INTEGER NOT NULL,
        page_chirho INTEGER NOT NULL,
        line_index_chirho INTEGER NOT NULL,
        segment_index_chirho INTEGER NOT NULL,
        original_text_chirho TEXT NOT NULL,
        original_text_hash_chirho TEXT NOT NULL,
        line_text_chirho TEXT,
        verdict_chirho TEXT NOT NULL,
        certify_clean_chirho INTEGER NOT NULL,
        corrected_text_chirho TEXT,
        corrected_skeleton_chirho TEXT,
        script_verdict_chirho TEXT,
        issue_flags_chirho TEXT,
        notes_chirho TEXT,
        witness_snapshot_chirho TEXT,
        queue_generated_at_chirho TEXT,
        reviewer_chirho TEXT NOT NULL,
        created_at_chirho TEXT NOT NULL,
        updated_at_chirho TEXT,
        supersedes_id_chirho INTEGER,
        is_current_chirho INTEGER NOT NULL,
        applied_at_chirho TEXT,
        applied_to_file_chirho TEXT,
        schema_version_chirho INTEGER NOT NULL
      )`
    );
    const insertStmtChirho = dbChirho.prepare(
      `INSERT INTO pass_c_human_validations_chirho
          (volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
           original_text_chirho, original_text_hash_chirho, line_text_chirho, verdict_chirho, certify_clean_chirho,
           corrected_text_chirho, corrected_skeleton_chirho, script_verdict_chirho, issue_flags_chirho, notes_chirho,
           witness_snapshot_chirho, queue_generated_at_chirho, reviewer_chirho, created_at_chirho, updated_at_chirho,
           supersedes_id_chirho, is_current_chirho, applied_at_chirho, applied_to_file_chirho, schema_version_chirho)
         VALUES (?, ?, ?, ?, ?, ?, 'fixture line text chirho', 'reviewed-clean-chirho', 1,
           NULL, NULL, NULL, NULL, 'generic reviewer fixture', NULL, '2026-06-04T00:00:00.000Z',
           'human-chirho', '2026-06-04T00:00:00.000Z', '2026-06-04T00:00:00.000Z',
           NULL, 1, NULL, NULL, 2)`
    );
    for (const [indexChirho, liveSpanChirho] of liveSpansChirho.entries()) {
      const originalTextChirho = originalTextOverridesChirho.get(indexChirho) ?? liveSpanChirho.textChirho;
      const resultChirho = insertStmtChirho.run(
        liveSpanChirho.volumeChirho,
        liveSpanChirho.pageChirho,
        liveSpanChirho.lineIndexChirho,
        liveSpanChirho.segmentIndexChirho,
        originalTextChirho,
        hashTextChirho(originalTextChirho)
      );
      validationIdsChirho.push(Number(resultChirho.lastInsertRowid));
    }
  } finally {
    dbChirho.close();
  }
  return { dirChirho, dbPathChirho, backupPathChirho, liveSpanChirho: liveSpansChirho[0]!, liveSpansChirho, validationIdsChirho };
}

function validationSummaryChirho(dbPathChirho: string): ValidationSummaryRowChirho {
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const rowChirho = dbChirho
      .query(
        `SELECT
           COUNT(*) AS rowCountChirho,
           SUM(CASE WHEN is_current_chirho = 1 THEN 1 ELSE 0 END) AS currentCountChirho,
           SUM(CASE WHEN is_current_chirho = 1 AND reviewer_chirho = 'human-chirho' THEN 1 ELSE 0 END) AS currentHumanReviewerCountChirho,
           MAX(CASE WHEN is_current_chirho = 1 THEN original_text_chirho ELSE NULL END) AS currentOriginalTextChirho,
           MAX(CASE WHEN is_current_chirho = 1 THEN reviewer_chirho ELSE NULL END) AS reviewerChirho,
           MAX(CASE WHEN is_current_chirho = 1 THEN supersedes_id_chirho ELSE NULL END) AS supersedesIdChirho
         FROM pass_c_human_validations_chirho`
      )
      .get() as ValidationSummaryRowChirho;
    return rowChirho;
  } finally {
    dbChirho.close();
  }
}

function reattributeArgsChirho(fixtureChirho: ReattributionFixtureChirho, extraArgsChirho: string[]): string[] {
  return [
    process.execPath,
    "run",
    REATTRIBUTION_SCRIPT_CHIRHO,
    "--",
    `--db-chirho=${fixtureChirho.dbPathChirho}`,
    `--backup-chirho=${fixtureChirho.backupPathChirho}`,
    `--validation-id-chirho=${fixtureChirho.validationIdsChirho[0]}`,
    ...extraArgsChirho,
  ];
}

function reattributeSelectedArgsChirho(
  fixtureChirho: ReattributionFixtureChirho,
  idsChirho: number[],
  extraArgsChirho: string[]
): string[] {
  return [
    process.execPath,
    "run",
    REATTRIBUTION_SCRIPT_CHIRHO,
    "--",
    `--db-chirho=${fixtureChirho.dbPathChirho}`,
    `--backup-chirho=${fixtureChirho.backupPathChirho}`,
    ...idsChirho.map((idChirho) => `--validation-id-chirho=${idChirho}`),
    ...extraArgsChirho,
  ];
}

function reattributeAllGenericArgsChirho(
  fixtureChirho: ReattributionFixtureChirho,
  extraArgsChirho: string[]
): string[] {
  return [
    process.execPath,
    "run",
    REATTRIBUTION_SCRIPT_CHIRHO,
    "--",
    `--db-chirho=${fixtureChirho.dbPathChirho}`,
    `--backup-chirho=${fixtureChirho.backupPathChirho}`,
    "--all-generic-chirho",
    ...extraArgsChirho,
  ];
}

function expectedHashArgsChirho(fixtureChirho: ReattributionFixtureChirho): string[] {
  return fixtureChirho.validationIdsChirho.map((idChirho, indexChirho) => {
    const liveSpanChirho = fixtureChirho.liveSpansChirho[indexChirho]!;
    return `--expected-live-text-hash-chirho=${idChirho}:${hashTextChirho(liveSpanChirho.textChirho)}`;
  });
}

function assertRejectedChirho(
  fixtureChirho: ReattributionFixtureChirho,
  extraArgsChirho: string[],
  expectedMessageChirho: string
): void {
  const argsChirho = reattributeArgsChirho(fixtureChirho, extraArgsChirho);
  assertRejectedCommandChirho(fixtureChirho, argsChirho, expectedMessageChirho);
}

function assertRejectedCommandChirho(
  fixtureChirho: ReattributionFixtureChirho,
  argsChirho: string[],
  expectedMessageChirho: string
): void {
  const beforeChirho = validationSummaryChirho(fixtureChirho.dbPathChirho);
  const resultChirho = runCommandChirho(argsChirho);
  const combinedOutputChirho = `${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`;
  assertCheckChirho(
    resultChirho.exitCodeChirho !== 0,
    `rejected reattribution command unexpectedly succeeded: ${commandTextChirho(argsChirho)}`
  );
  assertCheckChirho(
    combinedOutputChirho.includes(expectedMessageChirho),
    `rejected reattribution command failed for the wrong reason: ${combinedOutputChirho}`
  );
  const afterChirho = validationSummaryChirho(fixtureChirho.dbPathChirho);
  assertCheckChirho(afterChirho.rowCountChirho === beforeChirho.rowCountChirho, "rejected command inserted a row");
  assertCheckChirho(afterChirho.reviewerChirho === beforeChirho.reviewerChirho, "rejected command changed reviewer");
}

function assertSuccessfulApplyChirho(fixtureChirho: ReattributionFixtureChirho): void {
  const argsChirho = reattributeArgsChirho(fixtureChirho, [
    "--reviewer-chirho=hallelujah-chirho",
    "--rationale-chirho=fixture confirms append-only reattribution guard",
    `--expected-live-text-chirho=${fixtureChirho.liveSpanChirho.textChirho}`,
    "--apply-chirho",
  ]);
  const resultChirho = runCommandChirho(argsChirho);
  assertCheckChirho(
    resultChirho.exitCodeChirho === 0,
    `reattribution apply command failed: ${commandTextChirho(argsChirho)}\n${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`
  );
  const summaryChirho = validationSummaryChirho(fixtureChirho.dbPathChirho);
  assertCheckChirho(summaryChirho.rowCountChirho === 2, "successful reattribution did not append one row");
  assertCheckChirho(summaryChirho.currentCountChirho === 1, "successful reattribution left an invalid current-row count");
  assertCheckChirho(summaryChirho.currentHumanReviewerCountChirho === 0, "successful reattribution left generic current rows");
  assertCheckChirho(summaryChirho.reviewerChirho === "hallelujah-chirho", "successful reattribution did not set reviewer");
  assertCheckChirho(summaryChirho.supersedesIdChirho === 1, "successful reattribution did not supersede the old row");
  assertCheckChirho(existsSync(fixtureChirho.backupPathChirho), "successful reattribution did not refresh backup");
}

function assertSuccessfulApplyWithRepairedLiveTextChirho(fixtureChirho: ReattributionFixtureChirho): void {
  const expectedStoredOriginalTextChirho = "stale-original-text-before-repair-chirho";
  const argsChirho = reattributeArgsChirho(fixtureChirho, [
    "--reviewer-chirho=hallelujah-chirho",
    "--rationale-chirho=fixture confirms current live text can guard a repaired row",
    `--expected-live-text-chirho=${fixtureChirho.liveSpanChirho.textChirho}`,
    "--apply-chirho",
  ]);
  const resultChirho = runCommandChirho(argsChirho);
  assertCheckChirho(
    resultChirho.exitCodeChirho === 0,
    `repaired-live-text reattribution apply command failed: ${commandTextChirho(argsChirho)}\n${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`
  );
  const summaryChirho = validationSummaryChirho(fixtureChirho.dbPathChirho);
  assertCheckChirho(summaryChirho.rowCountChirho === 2, "repaired-live-text reattribution did not append one row");
  assertCheckChirho(
    summaryChirho.currentOriginalTextChirho === expectedStoredOriginalTextChirho,
    "repaired-live-text reattribution changed the stored review original text"
  );
  assertCheckChirho(
    summaryChirho.currentHumanReviewerCountChirho === 0,
    "repaired-live-text reattribution left a generic current row"
  );
  assertCheckChirho(summaryChirho.reviewerChirho === "hallelujah-chirho", "repaired-live-text reattribution did not set reviewer");
}

function assertSuccessfulSelectedBatchApplyChirho(fixtureChirho: ReattributionFixtureChirho): void {
  const argsChirho = reattributeSelectedArgsChirho(fixtureChirho, fixtureChirho.validationIdsChirho, [
    "--reviewer-chirho=hallelujah-chirho",
    "--rationale-chirho=fixture confirms selected batch append-only reattribution guard",
    ...expectedHashArgsChirho(fixtureChirho),
    "--apply-chirho",
  ]);
  const resultChirho = runCommandChirho(argsChirho);
  assertCheckChirho(
    resultChirho.exitCodeChirho === 0,
    `selected batch reattribution apply command failed: ${commandTextChirho(argsChirho)}\n${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`
  );
  const summaryChirho = validationSummaryChirho(fixtureChirho.dbPathChirho);
  assertCheckChirho(summaryChirho.rowCountChirho === 4, "selected batch reattribution did not append two rows");
  assertCheckChirho(summaryChirho.currentCountChirho === 2, "selected batch reattribution left an invalid current-row count");
  assertCheckChirho(summaryChirho.currentHumanReviewerCountChirho === 0, "selected batch reattribution left generic current rows");
  assertCheckChirho(summaryChirho.reviewerChirho === "hallelujah-chirho", "selected batch reattribution did not set reviewer");
  assertCheckChirho(summaryChirho.supersedesIdChirho === 2, "selected batch reattribution did not supersede the old rows");
  assertCheckChirho(existsSync(fixtureChirho.backupPathChirho), "selected batch reattribution did not refresh backup");
}

function assertSuccessfulAllGenericApplyChirho(fixtureChirho: ReattributionFixtureChirho): void {
  const argsChirho = reattributeAllGenericArgsChirho(fixtureChirho, [
    "--expected-generic-row-count-chirho=2",
    "--reviewer-chirho=hallelujah-chirho",
    "--rationale-chirho=fixture confirms all generic append-only reattribution guard",
    ...expectedHashArgsChirho(fixtureChirho),
    "--apply-chirho",
  ]);
  const resultChirho = runCommandChirho(argsChirho);
  assertCheckChirho(
    resultChirho.exitCodeChirho === 0,
    `all-generic reattribution apply command failed: ${commandTextChirho(argsChirho)}\n${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`
  );
  const summaryChirho = validationSummaryChirho(fixtureChirho.dbPathChirho);
  assertCheckChirho(summaryChirho.rowCountChirho === 4, "all-generic reattribution did not append two rows");
  assertCheckChirho(summaryChirho.currentCountChirho === 2, "all-generic reattribution left an invalid current-row count");
  assertCheckChirho(summaryChirho.currentHumanReviewerCountChirho === 0, "all-generic reattribution left generic current rows");
  assertCheckChirho(summaryChirho.reviewerChirho === "hallelujah-chirho", "all-generic reattribution did not set reviewer");
  assertCheckChirho(summaryChirho.supersedesIdChirho === 2, "all-generic reattribution did not supersede the old rows");
  assertCheckChirho(existsSync(fixtureChirho.backupPathChirho), "all-generic reattribution did not refresh backup");
}

function mainChirho(): void {
  const machineFixtureChirho = createFixtureChirho();
  try {
    assertRejectedChirho(
      machineFixtureChirho,
      ["--reviewer-chirho=codex-gpt5-chirho", "--rationale-chirho=machine should not reattribute"],
      "--reviewer-chirho must identify a human reviewer; machine reviewer codex-gpt5-chirho cannot certify"
    );
  } finally {
    rmSync(machineFixtureChirho.dirChirho, { recursive: true, force: true });
  }

  const placeholderReviewerFixtureChirho = createFixtureChirho();
  try {
    assertRejectedChirho(
      placeholderReviewerFixtureChirho,
      [
        "--reviewer-chirho=<explicit-human-reviewer-id-chirho>",
        "--rationale-chirho=placeholder reviewer should fail",
      ],
      "--reviewer-chirho must identify the explicit reviewer, not template placeholder <explicit-human-reviewer-id-chirho>"
    );
  } finally {
    rmSync(placeholderReviewerFixtureChirho.dirChirho, { recursive: true, force: true });
  }

  const placeholderRationaleFixtureChirho = createFixtureChirho();
  try {
    assertRejectedChirho(
      placeholderRationaleFixtureChirho,
      [
        "--reviewer-chirho=hallelujah-chirho",
        "--rationale-chirho=<why this existing row is attributable to that reviewer>",
      ],
      "--rationale-chirho must explain the explicit attribution, not a template placeholder"
    );
  } finally {
    rmSync(placeholderRationaleFixtureChirho.dirChirho, { recursive: true, force: true });
  }

  const missingGuardFixtureChirho = createFixtureChirho();
  try {
    assertRejectedChirho(
      missingGuardFixtureChirho,
      [
        "--reviewer-chirho=hallelujah-chirho",
        "--rationale-chirho=missing live guard should fail",
        "--apply-chirho",
      ],
      "--apply-chirho requires --expected-live-text-chirho"
    );
  } finally {
    rmSync(missingGuardFixtureChirho.dirChirho, { recursive: true, force: true });
  }

  const staleGuardFixtureChirho = createFixtureChirho();
  try {
    assertRejectedChirho(
      staleGuardFixtureChirho,
      [
        "--reviewer-chirho=hallelujah-chirho",
        "--rationale-chirho=stale live guard should fail",
        "--expected-live-text-chirho=not-current-live-text-chirho",
        "--apply-chirho",
      ],
      "live text drifted"
    );
  } finally {
    rmSync(staleGuardFixtureChirho.dirChirho, { recursive: true, force: true });
  }

  const selectedMissingHashFixtureChirho = createFixtureChirho(2);
  try {
    assertRejectedCommandChirho(
      selectedMissingHashFixtureChirho,
      reattributeSelectedArgsChirho(selectedMissingHashFixtureChirho, selectedMissingHashFixtureChirho.validationIdsChirho, [
        "--reviewer-chirho=hallelujah-chirho",
        "--rationale-chirho=selected batch missing hash should fail",
        expectedHashArgsChirho(selectedMissingHashFixtureChirho)[0]!,
        "--apply-chirho",
      ]),
      "missing expected live text hash for selected validation id(s)"
    );
  } finally {
    rmSync(selectedMissingHashFixtureChirho.dirChirho, { recursive: true, force: true });
  }

  const allGenericMissingCountFixtureChirho = createFixtureChirho(2);
  try {
    assertRejectedCommandChirho(
      allGenericMissingCountFixtureChirho,
      reattributeAllGenericArgsChirho(allGenericMissingCountFixtureChirho, [
        "--reviewer-chirho=hallelujah-chirho",
        "--rationale-chirho=all generic missing count should fail",
        ...expectedHashArgsChirho(allGenericMissingCountFixtureChirho),
        "--apply-chirho",
      ]),
      "--expected-generic-row-count-chirho is required when applying --all-generic-chirho"
    );
  } finally {
    rmSync(allGenericMissingCountFixtureChirho.dirChirho, { recursive: true, force: true });
  }

  const allGenericMissingHashFixtureChirho = createFixtureChirho(2);
  try {
    assertRejectedCommandChirho(
      allGenericMissingHashFixtureChirho,
      reattributeAllGenericArgsChirho(allGenericMissingHashFixtureChirho, [
        "--expected-generic-row-count-chirho=2",
        "--reviewer-chirho=hallelujah-chirho",
        "--rationale-chirho=all generic missing hashes should fail",
        "--apply-chirho",
      ]),
      "--expected-live-text-hash-chirho is required for every row when applying --all-generic-chirho"
    );
  } finally {
    rmSync(allGenericMissingHashFixtureChirho.dirChirho, { recursive: true, force: true });
  }

  const allGenericWrongCountFixtureChirho = createFixtureChirho(2);
  try {
    assertRejectedCommandChirho(
      allGenericWrongCountFixtureChirho,
      reattributeAllGenericArgsChirho(allGenericWrongCountFixtureChirho, [
        "--expected-generic-row-count-chirho=3",
        "--reviewer-chirho=hallelujah-chirho",
        "--rationale-chirho=all generic wrong count should fail",
        ...expectedHashArgsChirho(allGenericWrongCountFixtureChirho),
        "--apply-chirho",
      ]),
      "generic row count drifted; expected 3, current 2"
    );
  } finally {
    rmSync(allGenericWrongCountFixtureChirho.dirChirho, { recursive: true, force: true });
  }

  const applyFixtureChirho = createFixtureChirho();
  try {
    assertSuccessfulApplyChirho(applyFixtureChirho);
  } finally {
    rmSync(applyFixtureChirho.dirChirho, { recursive: true, force: true });
  }

  const repairedLiveTextApplyFixtureChirho = createFixtureChirho(
    1,
    new Map([[0, "stale-original-text-before-repair-chirho"]])
  );
  try {
    assertSuccessfulApplyWithRepairedLiveTextChirho(repairedLiveTextApplyFixtureChirho);
  } finally {
    rmSync(repairedLiveTextApplyFixtureChirho.dirChirho, { recursive: true, force: true });
  }

  const selectedBatchApplyFixtureChirho = createFixtureChirho(2);
  try {
    assertSuccessfulSelectedBatchApplyChirho(selectedBatchApplyFixtureChirho);
  } finally {
    rmSync(selectedBatchApplyFixtureChirho.dirChirho, { recursive: true, force: true });
  }

  const allGenericApplyFixtureChirho = createFixtureChirho(2);
  try {
    assertSuccessfulAllGenericApplyChirho(allGenericApplyFixtureChirho);
  } finally {
    rmSync(allGenericApplyFixtureChirho.dirChirho, { recursive: true, force: true });
  }

  console.log(`[${MODULE_CHIRHO}] Pass-C human reattribution CLI guards passed`);
}

if (import.meta.main) {
  try {
    mainChirho();
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  }
}
