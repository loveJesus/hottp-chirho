// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Non-mutating guard checks for the Pass-C human validation apply CLI.
 *
 * These checks use temporary SQLite/span fixtures. They prove validation rows
 * with generic or machine reviewer attribution cannot apply reviewed-clean
 * certification state to span files, while a named human reviewer row still can
 * apply under the expected row-count/id guards.
 */

import { Database } from "bun:sqlite";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { hashTextChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "check-pass-c-human-apply-cli-guards-chirho";
const APPLY_SCRIPT_CHIRHO = "apply-pass-c-human-validations-chirho";
const REVIEWED_TEXT_CHIRHO = "א";

interface TempFixtureChirho {
  dirChirho: string;
  dbPathChirho: string;
  backupPathChirho: string;
  spansDirChirho: string;
  spanPathChirho: string;
}

interface SpanLineFixtureChirho {
  spansChirho: Array<{
    segmentIndexChirho: number;
    utf8TextChirho: string;
    provenanceChirho?: string;
    humanValidationIdChirho?: number;
  }>;
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

function fixtureChirho(reviewerChirho: string): TempFixtureChirho {
  const dirChirho = mkdtempSync(join(tmpdir(), "pass-c-human-apply-cli-guard-chirho-"));
  const dbPathChirho = join(dirChirho, "progress-chirho.sqlite");
  const backupPathChirho = join(dirChirho, "pass-c-human-validations-backup-chirho.json");
  const spansDirChirho = join(dirChirho, "spans-chirho");
  const lineDirChirho = join(spansDirChirho, "vol-1-chirho", "page-0001-chirho");
  mkdirSync(lineDirChirho, { recursive: true });
  const spanPathChirho = join(lineDirChirho, "line-001-chirho.json");
  writeFileSync(
    spanPathChirho,
    `${JSON.stringify(
      {
        schemaVersionChirho: 1,
        volumeChirho: 1,
        pageChirho: 1,
        lineIndexChirho: 1,
        spansChirho: [
          {
            segmentIndexChirho: 1,
            xMinPxChirho: 0,
            widthPxChirho: 10,
            scriptChirho: "hebrew-chirho",
            utf8TextChirho: REVIEWED_TEXT_CHIRHO,
          },
        ],
      },
      null,
      2
    )}\n`
  );

  const dbChirho = new Database(dbPathChirho);
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
        verdict_chirho TEXT NOT NULL,
        certify_clean_chirho INTEGER NOT NULL,
        corrected_text_chirho TEXT,
        script_verdict_chirho TEXT,
        issue_flags_chirho TEXT,
        notes_chirho TEXT,
        queue_generated_at_chirho TEXT,
        reviewer_chirho TEXT NOT NULL,
        created_at_chirho TEXT NOT NULL,
        is_current_chirho INTEGER NOT NULL,
        applied_at_chirho TEXT,
        applied_to_file_chirho TEXT,
        updated_at_chirho TEXT,
        schema_version_chirho INTEGER NOT NULL
      )`
    );
    dbChirho
      .prepare(
        `INSERT INTO pass_c_human_validations_chirho
          (volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
           original_text_chirho, original_text_hash_chirho, verdict_chirho, certify_clean_chirho,
           corrected_text_chirho, script_verdict_chirho, issue_flags_chirho, notes_chirho,
           queue_generated_at_chirho, reviewer_chirho, created_at_chirho,
           is_current_chirho, applied_at_chirho, applied_to_file_chirho, updated_at_chirho, schema_version_chirho)
         VALUES (1, 1, 1, 1, ?, ?, 'reviewed-clean-chirho', 1, NULL, NULL, NULL, NULL,
           '2026-06-04T00:00:00.000Z', ?, '2026-06-04T00:00:00.000Z', 1, NULL, NULL, NULL, 2)`
      )
      .run(REVIEWED_TEXT_CHIRHO, hashTextChirho(REVIEWED_TEXT_CHIRHO), reviewerChirho);
  } finally {
    dbChirho.close();
  }

  return { dirChirho, dbPathChirho, backupPathChirho, spansDirChirho, spanPathChirho };
}

function applyArgsChirho(fixtureChirho: TempFixtureChirho, applyChirho: boolean): string[] {
  return [
    process.execPath,
    "run",
    APPLY_SCRIPT_CHIRHO,
    "--",
    `--db=${fixtureChirho.dbPathChirho}`,
    `--backup-chirho=${fixtureChirho.backupPathChirho}`,
    `--spans-dir=${fixtureChirho.spansDirChirho}`,
    "--id=1",
    ...(applyChirho
      ? [
          "--apply",
          "--expected-row-count-chirho=1",
          "--expected-validation-id-chirho=1",
        ]
      : []),
  ];
}

function appliedAtChirho(dbPathChirho: string): string | null {
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const rowChirho = dbChirho
      .query<{ applied_at_chirho: string | null }, []>(
        "SELECT applied_at_chirho FROM pass_c_human_validations_chirho WHERE id_chirho = 1"
      )
      .get();
    return rowChirho?.applied_at_chirho ?? null;
  } finally {
    dbChirho.close();
  }
}

function spanLineChirho(pathChirho: string): SpanLineFixtureChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as SpanLineFixtureChirho;
}

function checkRejectedCleanReviewerChirho(reviewerChirho: string, expectedErrorChirho: string): void {
  const tempChirho = fixtureChirho(reviewerChirho);
  try {
    const argsChirho = applyArgsChirho(tempChirho, true);
    const resultChirho = runCommandChirho(argsChirho);
    const combinedOutputChirho = `${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`;
    assertCheckChirho(
      resultChirho.exitCodeChirho !== 0,
      `${reviewerChirho} apply command unexpectedly succeeded: ${commandTextChirho(argsChirho)}`
    );
    assertCheckChirho(
      combinedOutputChirho.includes(expectedErrorChirho),
      `${reviewerChirho} apply command failed for the wrong reason: ${combinedOutputChirho}`
    );
    assertCheckChirho(appliedAtChirho(tempChirho.dbPathChirho) === null, `${reviewerChirho} row was marked applied`);
    assertCheckChirho(
      spanLineChirho(tempChirho.spanPathChirho).spansChirho[0]?.humanValidationIdChirho === undefined,
      `${reviewerChirho} row mutated the span fixture`
    );
  } finally {
    rmSync(tempChirho.dirChirho, { force: true, recursive: true });
  }
}

function checkHumanCleanAppliesChirho(): void {
  const tempChirho = fixtureChirho("hallelujah-chirho");
  try {
    const argsChirho = applyArgsChirho(tempChirho, true);
    const resultChirho = runCommandChirho(argsChirho);
    assertCheckChirho(
      resultChirho.exitCodeChirho === 0,
      `human apply command failed: ${commandTextChirho(argsChirho)}\n${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`
    );
    assertCheckChirho(appliedAtChirho(tempChirho.dbPathChirho) !== null, "human row was not marked applied");
    const lineChirho = spanLineChirho(tempChirho.spanPathChirho);
    const spanChirho = lineChirho.spansChirho[0];
    assertCheckChirho(spanChirho?.humanValidationIdChirho === 1, "human row did not stamp humanValidationIdChirho");
    assertCheckChirho(spanChirho?.provenanceChirho === "human-chirho", "human row did not stamp human provenance");
  } finally {
    rmSync(tempChirho.dirChirho, { force: true, recursive: true });
  }
}

function mainChirho(): void {
  checkRejectedCleanReviewerChirho(
    "human-chirho",
    "reviewer_chirho must identify the explicit reviewer, not generic human-chirho"
  );
  checkRejectedCleanReviewerChirho(
    "codex-gpt5-chirho",
    "reviewer_chirho must identify a human reviewer; machine reviewer codex-gpt5-chirho cannot certify"
  );
  checkHumanCleanAppliesChirho();
  console.log(`[${MODULE_CHIRHO}] Pass-C human apply CLI guards passed`);
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
