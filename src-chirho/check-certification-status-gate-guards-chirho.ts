// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify certification status turns unsafe disposable review rows into
 * completion blockers.
 *
 * This uses a disposable SQLite copy and status output directory. It does not
 * mutate production review state.
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PROGRESS_DB_PATH_CHIRHO, PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { latinSymbolVisionLiveItemsChirho } from "./latin-symbol-vision-live-items-chirho.ts";
import {
  ensureLatinSymbolReviewSchemaChirho,
  loadLatinSymbolPacketManifestChirho,
  saveLatinSymbolReviewChirho,
} from "./latin-symbol-vision-review-store-chirho.ts";
import { hashTextChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "check-certification-status-gate-guards-chirho";

interface CertificationStatusForGuardChirho {
  certificationCompleteChirho?: boolean;
  remainingWorkChirho?: string[];
  humanValidationDbChirho?: {
    genericReviewerRowsChirho?: number;
  };
  latinSymbolReviewDbChirho?: {
    genericReviewerRowsChirho?: number;
    staleRowsChirho?: number;
  };
  artifactsChirho?: {
    expertSuppliedVisionTextBackupShapeOkChirho?: boolean;
  };
  structuralChirho?: {
    blankVisionTierHandoffsChirho?: Array<{
      handoffDocumentExistsChirho?: boolean;
      handoffCropExistsChirho?: boolean;
    }>;
  };
  expertSuppliedVisionTextBackupChirho?: {
    shapeErrorsChirho?: string[];
  };
}

function assertCheckChirho(conditionChirho: boolean, messageChirho: string): void {
  if (!conditionChirho) throw new Error(messageChirho);
}

function sqliteStringLiteralChirho(valueChirho: string): string {
  return `'${valueChirho.replaceAll("'", "''")}'`;
}

function copyProgressDbSnapshotChirho(outputPathChirho: string): void {
  const dbChirho = new Database(PROGRESS_DB_PATH_CHIRHO, { readonly: true });
  try {
    dbChirho.query(`VACUUM INTO ${sqliteStringLiteralChirho(outputPathChirho)}`).run();
  } finally {
    dbChirho.close();
  }
}

function forceSingleGenericPassCHumanReviewerChirho(dbPathChirho: string): number | null {
  const dbChirho = new Database(dbPathChirho);
  try {
    const rowChirho = dbChirho
      .query<{ id_chirho: number }, []>(`
        SELECT id_chirho
          FROM pass_c_human_validations_chirho
         WHERE is_current_chirho = 1
           AND verdict_chirho <> 'undo-chirho'
           AND schema_version_chirho >= 2
         ORDER BY id_chirho
         LIMIT 1`)
      .get();
    if (rowChirho === undefined) return null;
    dbChirho
      .prepare(`
        UPDATE pass_c_human_validations_chirho
           SET reviewer_chirho = 'hallelujah-chirho'
         WHERE is_current_chirho = 1
           AND verdict_chirho <> 'undo-chirho'
           AND schema_version_chirho >= 2`)
      .run();
    dbChirho
      .prepare("UPDATE pass_c_human_validations_chirho SET reviewer_chirho = 'human-chirho' WHERE id_chirho = ?")
      .run(rowChirho.id_chirho);
    return rowChirho.id_chirho;
  } finally {
    dbChirho.close();
  }
}

function insertGenericLatinSymbolReviewChirho(dbPathChirho: string): string | null {
  const manifestChirho = loadLatinSymbolPacketManifestChirho();
  const liveItemsChirho = latinSymbolVisionLiveItemsChirho();
  const manifestItemChirho = manifestChirho.itemsChirho?.[0];
  if (manifestItemChirho === undefined) return null;
  const liveItemChirho = liveItemsChirho.find((itemChirho) => itemChirho.idChirho === manifestItemChirho.idChirho);
  if (liveItemChirho === undefined) return null;
  const dbChirho = new Database(dbPathChirho);
  try {
    ensureLatinSymbolReviewSchemaChirho(dbChirho);
    dbChirho
      .prepare(`
        UPDATE latin_symbol_vision_reviews_chirho
           SET reviewer_chirho = 'hallelujah-chirho'
         WHERE is_current_chirho = 1
           AND verdict_chirho <> 'undo-chirho'`)
      .run();
    saveLatinSymbolReviewChirho({
      dbChirho,
      manifestChirho,
      liveItemChirho,
      verdictChirho: "reviewed-issues-chirho",
      acceptCleanChirho: false,
      issueFlagsChirho: ["punctuation-chirho"],
      notesChirho: "disposable status gate guard should reject generic reviewer attribution",
      reviewerChirho: "human-chirho",
    });
    return liveItemChirho.idChirho;
  } finally {
    dbChirho.close();
  }
}

function insertStaleLatinSymbolReviewChirho(dbPathChirho: string): string | null {
  const manifestChirho = loadLatinSymbolPacketManifestChirho();
  const liveItemsChirho = latinSymbolVisionLiveItemsChirho();
  const manifestItemChirho = manifestChirho.itemsChirho?.[1];
  if (manifestItemChirho === undefined) return null;
  const liveItemChirho = liveItemsChirho.find((itemChirho) => itemChirho.idChirho === manifestItemChirho.idChirho);
  if (liveItemChirho === undefined) return null;
  const dbChirho = new Database(dbPathChirho);
  try {
    ensureLatinSymbolReviewSchemaChirho(dbChirho);
    saveLatinSymbolReviewChirho({
      dbChirho,
      manifestChirho,
      liveItemChirho,
      verdictChirho: "accepted-clean-chirho",
      acceptCleanChirho: true,
      issueFlagsChirho: [],
      notesChirho: null,
      reviewerChirho: "hallelujah-chirho",
    });
    dbChirho
      .prepare(`
        UPDATE latin_symbol_vision_reviews_chirho
           SET current_text_hash_chirho = '0000000000000000000000000000000000000000000000000000000000000000'
         WHERE item_id_chirho = ?
           AND is_current_chirho = 1`)
      .run(liveItemChirho.idChirho);
    return liveItemChirho.idChirho;
  } finally {
    dbChirho.close();
  }
}

function writeGenericExpertSuppliedBackupFixtureChirho(pathChirho: string): void {
  const suppliedTextChirho = "ܐ";
  writeFileSync(
    pathChirho,
    `${JSON.stringify(
      {
        john316Chirho:
          "For God so loved the world that he gave his only begotten Son, that whoever believes in him should not perish but have eternal life. John 3:16",
        schemaVersionChirho: 1,
        generatedAtChirho: "2026-06-04T00:00:00.000Z",
        recordsChirho: [
          {
            itemIdChirho: "v3-p0151-l010-s3",
            volumeChirho: 3,
            pageChirho: 151,
            lineIndexChirho: 10,
            segmentIndexChirho: 3,
            scriptChirho: "syriac-chirho",
            previousTextChirho: "",
            suppliedTextChirho,
            suppliedTextHashChirho: hashTextChirho(suppliedTextChirho),
            reviewerChirho: "human-chirho",
            reviewerRoleChirho: "Syriac reader",
            rationaleChirho: "disposable status gate guard should reject generic expert-supplied reviewer attribution",
            appliedAtChirho: "2026-06-04T00:00:00.000Z",
            sourcePathChirho: "workspace-chirho/scanlines-chirho/vol-3-chirho/page-0151-chirho/line-010-chirho.png",
            packetPathChirho:
              "workspace-chirho/expert-confirm-pack-chirho/2026-05-31-chirho/images-chirho/vol-3-page-0151-line-010-chirho.png",
            linePathChirho: "workspace-chirho/spans-chirho/vol-3-chirho/page-0151-chirho/line-010-chirho.json",
          },
        ],
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

function runStatusChirho(
  dbPathChirho: string,
  outDirChirho: string,
  expertSuppliedBackupPathChirho: string,
  syriacBlankHandoffDocumentPathChirho: string,
  syriacBlankHandoffCropPathChirho: string
): void {
  const argsChirho = [
    process.execPath,
    "run",
    "transcription-certification-status-chirho",
    "--",
    `--db=${dbPathChirho}`,
    `--out-dir=${outDirChirho}`,
    `--expert-supplied-backup-chirho=${expertSuppliedBackupPathChirho}`,
    `--syriac-blank-handoff-document-chirho=${syriacBlankHandoffDocumentPathChirho}`,
    `--syriac-blank-handoff-crop-chirho=${syriacBlankHandoffCropPathChirho}`,
  ];
  const resultChirho = Bun.spawnSync(argsChirho, {
    cwd: PROJECT_ROOT_CHIRHO,
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdoutChirho = Buffer.from(resultChirho.stdout).toString("utf8");
  const stderrChirho = Buffer.from(resultChirho.stderr).toString("utf8");
  assertCheckChirho(
    resultChirho.exitCode === 0,
    `status guard command failed with exit ${resultChirho.exitCode}\n${stdoutChirho}\n${stderrChirho}`
  );
}

function readStatusChirho(outDirChirho: string): CertificationStatusForGuardChirho {
  const statusPathChirho = join(outDirChirho, "status-chirho.json");
  assertCheckChirho(existsSync(statusPathChirho), "status guard command did not write status-chirho.json");
  return JSON.parse(readFileSync(statusPathChirho, "utf8")) as CertificationStatusForGuardChirho;
}

function mainChirho(): void {
  const tempDirChirho = mkdtempSync(join(tmpdir(), "certification-status-gate-guard-chirho-"));
  const dbPathChirho = join(tempDirChirho, "progress-chirho.sqlite");
  const outDirChirho = join(tempDirChirho, "status-output-chirho");
  const expertSuppliedBackupPathChirho = join(tempDirChirho, "expert-supplied-backup-chirho.json");
  const missingSyriacBlankHandoffDocumentPathChirho = join(
    tempDirChirho,
    "missing-syriac-blank-handoff-document-chirho.md"
  );
  const missingSyriacBlankHandoffCropPathChirho = join(
    tempDirChirho,
    "missing-syriac-blank-handoff-crop-chirho.png"
  );
  mkdirSync(outDirChirho, { recursive: true });
  try {
    copyProgressDbSnapshotChirho(dbPathChirho);
    writeGenericExpertSuppliedBackupFixtureChirho(expertSuppliedBackupPathChirho);
    const rowIdChirho = forceSingleGenericPassCHumanReviewerChirho(dbPathChirho);
    const latinItemIdChirho = insertGenericLatinSymbolReviewChirho(dbPathChirho);
    const staleLatinItemIdChirho = insertStaleLatinSymbolReviewChirho(dbPathChirho);
    if (rowIdChirho === null) {
      console.log(`[${MODULE_CHIRHO}] no current schema-v2 Pass-C human validation row available; skipped generic reviewer status guard`);
      return;
    }
    runStatusChirho(
      dbPathChirho,
      outDirChirho,
      expertSuppliedBackupPathChirho,
      missingSyriacBlankHandoffDocumentPathChirho,
      missingSyriacBlankHandoffCropPathChirho
    );
    const statusChirho = readStatusChirho(outDirChirho);
    assertCheckChirho(statusChirho.certificationCompleteChirho === false, "generic reviewer status unexpectedly completed certification");
    assertCheckChirho(
      statusChirho.humanValidationDbChirho?.genericReviewerRowsChirho === 1,
      `generic reviewer status reported ${String(statusChirho.humanValidationDbChirho?.genericReviewerRowsChirho)} blocked row(s), expected 1`
    );
    assertCheckChirho(
      (statusChirho.remainingWorkChirho ?? []).some((itemChirho) =>
        itemChirho.includes("1 current Pass-C human validation row(s) use blank/generic/machine reviewer attribution")
      ),
      "generic reviewer status did not add the Pass-C human validation remaining-work blocker"
    );
    if (latinItemIdChirho !== null) {
      assertCheckChirho(
        (statusChirho.latinSymbolReviewDbChirho?.genericReviewerRowsChirho ?? 0) >= 1,
        "generic Latin/symbol reviewer status did not report a blocked row"
      );
      assertCheckChirho(
        (statusChirho.remainingWorkChirho ?? []).some((itemChirho) =>
          itemChirho.includes("Latin/symbol review row(s) use blank/generic/machine reviewer attribution")
        ),
        "generic Latin/symbol reviewer status did not add the remaining-work blocker"
      );
    }
    if (staleLatinItemIdChirho !== null) {
      assertCheckChirho(
        (statusChirho.latinSymbolReviewDbChirho?.staleRowsChirho ?? 0) >= 1,
        "stale Latin/symbol review status did not report a stale row"
      );
      assertCheckChirho(
        (statusChirho.remainingWorkChirho ?? []).some((itemChirho) =>
          itemChirho.includes("Latin/symbol review row(s) are stale against current live span/D1 text")
        ),
        "stale Latin/symbol review status did not add the remaining-work blocker"
      );
    }
    assertCheckChirho(
      statusChirho.artifactsChirho?.expertSuppliedVisionTextBackupShapeOkChirho === false,
      "generic expert-supplied backup status did not fail shape validation"
    );
    assertCheckChirho(
      (statusChirho.expertSuppliedVisionTextBackupChirho?.shapeErrorsChirho ?? []).some((errorChirho) =>
        errorChirho.includes("reviewerChirho must identify the explicit human reviewer")
      ),
      "generic expert-supplied backup status did not report the reviewer shape error"
    );
    assertCheckChirho(
      (statusChirho.remainingWorkChirho ?? []).some((itemChirho) =>
        itemChirho.includes("expert-supplied vision text backup is malformed")
      ),
      "generic expert-supplied backup status did not add the malformed-backup remaining-work blocker"
    );
    assertCheckChirho(
      (statusChirho.structuralChirho?.blankVisionTierHandoffsChirho ?? []).some(
        (handoffChirho) => handoffChirho.handoffDocumentExistsChirho === false
      ),
      "missing blank Syriac handoff document did not show as absent in status"
    );
    assertCheckChirho(
      (statusChirho.structuralChirho?.blankVisionTierHandoffsChirho ?? []).some(
        (handoffChirho) => handoffChirho.handoffCropExistsChirho === false
      ),
      "missing blank Syriac handoff crop did not show as absent in status"
    );
    assertCheckChirho(
      (statusChirho.remainingWorkChirho ?? []).some((itemChirho) =>
        itemChirho.includes("blank expert transcription handoff document(s) are missing")
      ),
      "missing blank Syriac handoff document did not add the remaining-work blocker"
    );
    assertCheckChirho(
      (statusChirho.remainingWorkChirho ?? []).some((itemChirho) =>
        itemChirho.includes("blank expert transcription handoff crop image(s) are missing")
      ),
      "missing blank Syriac handoff crop did not add the remaining-work blocker"
    );
    console.log(
      `[${MODULE_CHIRHO}] generic reviewer status gate guard passed for disposable row ${rowIdChirho}` +
        (latinItemIdChirho === null ? "" : ` and Latin/symbol item ${latinItemIdChirho}`) +
        (staleLatinItemIdChirho === null ? "" : `; stale Latin/symbol item ${staleLatinItemIdChirho}`) +
        "; generic expert-supplied backup blocked; blank Syriac handoff artifacts blocked"
    );
  } finally {
    rmSync(tempDirChirho, { recursive: true, force: true });
  }
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
