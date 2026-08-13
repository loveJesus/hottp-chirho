// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Verify the segment repair approval station end to end on scratch fixtures.
 *
 * Boots the real server on a temporary port with a disposable proposal store,
 * spans dir, scanlines dir, backup root, and SQLite DB, then proves:
 *   - the queue page renders the side-by-side evidence surface,
 *   - approve/reject demand a certifying human with a real rationale,
 *   - apply refuses drafts, stale hashes, tampered before-state, bad tiling,
 *   - a happy apply is backup-first, invalidates exactly the touched
 *     validation rows, preserves untouched ones, and strips stale human
 *     metadata from changed spans,
 *   - the revert CLI restores the exact bytes and tombstones re-reviews of
 *     the applied state.
 */

import { Database } from "bun:sqlite";
import { createHash as createHashChirho } from "crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createServer as createNetServerChirho } from "net";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { reviewServerHeadersHaveNoStoreChirho } from "./review-server-health-chirho.ts";
import { ensurePassCHumanValidationsTableChirho, SEGMENT_REPAIR_INVALIDATED_VERDICT_CHIRHO, SEGMENT_REPAIR_REVERT_INVALIDATED_VERDICT_CHIRHO } from "./segment-repair-apply-chirho.ts";
import {
  SEGMENT_REPAIR_PROPOSAL_SCHEMA_VERSION_CHIRHO,
  type SegmentRepairProposalRecordChirho,
  type SegmentRepairProposalSpanChirho,
} from "./segment-repair-proposals-chirho.ts";
import { renderSpanLineTextChirho } from "./span-line-text-chirho.ts";
import { hashTextChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "check-segment-repair-approval-server-guards-chirho";
const HUMAN_HEADERS_CHIRHO = { "X-Webauth-User": "dr-approval-guard-reviewer-chirho", "Content-Type": "application/json" };
const MACHINE_HEADERS_CHIRHO = { "X-Webauth-User": "gpt-5-codex", "Content-Type": "application/json" };

const failuresChirho: string[] = [];

function checkChirho(labelChirho: string, okChirho: boolean, detailChirho = ""): void {
  if (okChirho) {
    console.log(`[${MODULE_CHIRHO}] PASS ${labelChirho}`);
  } else {
    failuresChirho.push(`${labelChirho}${detailChirho.length > 0 ? `: ${detailChirho}` : ""}`);
    console.error(`[${MODULE_CHIRHO}] FAIL ${labelChirho}${detailChirho.length > 0 ? `: ${detailChirho}` : ""}`);
  }
}

function sha256Chirho(bytesChirho: Buffer | string): string {
  return createHashChirho("sha256").update(bytesChirho).digest("hex");
}

function imageMagickCommandChirho(): string {
  const resultChirho = Bun.spawnSync(["sh", "-lc", "command -v magick || command -v convert"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const commandChirho = resultChirho.stdout.toString().trim().split("\n")[0]?.trim();
  if (resultChirho.exitCode !== 0 || commandChirho === undefined || commandChirho.length === 0) {
    throw new Error('ImageMagick executable not found in $PATH: expected "magick" or "convert"');
  }
  return commandChirho;
}

async function freePortChirho(): Promise<number> {
  return await new Promise((resolveChirho, rejectChirho) => {
    const probeChirho = createNetServerChirho();
    probeChirho.once("error", rejectChirho);
    probeChirho.listen(0, "127.0.0.1", () => {
      const addressChirho = probeChirho.address();
      if (addressChirho === null || typeof addressChirho === "string") {
        rejectChirho(new Error("could not allocate a free port"));
        return;
      }
      const portChirho = addressChirho.port;
      probeChirho.close(() => resolveChirho(portChirho));
    });
  });
}

interface FixtureSpanSeedChirho extends SegmentRepairProposalSpanChirho {
  humanReviewStatusChirho?: string;
}

function spanLineFixtureChirho(
  volumeChirho: number,
  pageChirho: number,
  lineIndexChirho: number,
  lineWidthPxChirho: number,
  spansChirho: FixtureSpanSeedChirho[]
): Record<string, unknown> {
  return {
    schemaVersionChirho: 2,
    volumeChirho,
    pageChirho,
    lineIndexChirho,
    lineWidthPxChirho,
    lineHeightPxChirho: 60,
    agentChirho: "approval-guard-fixture-chirho",
    spansChirho,
  };
}

function proposalFixtureChirho(paramsChirho: {
  proposalIdChirho: string;
  repairKindChirho: SegmentRepairProposalRecordChirho["repairKindChirho"];
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  targetSegmentIndexChirho: number;
  lineWidthPxChirho: number;
  lineImageHashChirho: string;
  oldSpansChirho: SegmentRepairProposalSpanChirho[];
  proposedSpansChirho: SegmentRepairProposalSpanChirho[];
}): SegmentRepairProposalRecordChirho {
  return {
    schemaVersionChirho: SEGMENT_REPAIR_PROPOSAL_SCHEMA_VERSION_CHIRHO,
    proposalIdChirho: paramsChirho.proposalIdChirho,
    statusChirho: "draft-chirho",
    repairKindChirho: paramsChirho.repairKindChirho,
    reviewerChirho: "guard-sweep-machine-chirho",
    rationaleChirho: "Guard fixture proposal drafted from synthetic print evidence.",
    createdAtChirho: new Date().toISOString(),
    itemKeyChirho: `${paramsChirho.volumeChirho}:${paramsChirho.pageChirho}:${paramsChirho.lineIndexChirho}:${paramsChirho.targetSegmentIndexChirho}`,
    volumeChirho: paramsChirho.volumeChirho,
    pageChirho: paramsChirho.pageChirho,
    lineIndexChirho: paramsChirho.lineIndexChirho,
    targetSegmentIndexChirho: paramsChirho.targetSegmentIndexChirho,
    lineWidthPxChirho: paramsChirho.lineWidthPxChirho,
    lineTextBeforeChirho: renderSpanLineTextChirho({ spansChirho: paramsChirho.oldSpansChirho }),
    lineTextPreviewChirho: renderSpanLineTextChirho({ spansChirho: paramsChirho.proposedSpansChirho }),
    lineImageHashChirho: paramsChirho.lineImageHashChirho,
    oldSpansChirho: paramsChirho.oldSpansChirho,
    proposedSpansChirho: paramsChirho.proposedSpansChirho,
    notesChirho: "Guard fixture draft only.",
  };
}

function insertValidationRowChirho(
  dbChirho: Database,
  volumeChirho: number,
  pageChirho: number,
  lineIndexChirho: number,
  segmentIndexChirho: number,
  textChirho: string,
  verdictChirho: string,
  certifyCleanChirho: number
): number {
  const nowChirho = new Date().toISOString();
  const resultChirho = dbChirho
    .prepare(
      `INSERT INTO pass_c_human_validations_chirho
        (volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
         original_text_chirho, original_text_hash_chirho, line_text_chirho, verdict_chirho, certify_clean_chirho,
         corrected_text_chirho, corrected_skeleton_chirho, script_verdict_chirho, issue_flags_chirho, notes_chirho, witness_snapshot_chirho,
         queue_generated_at_chirho, reviewer_chirho, created_at_chirho, updated_at_chirho,
         supersedes_id_chirho, is_current_chirho, schema_version_chirho)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL, NULL, NULL, '[]', 'guard fixture row', NULL, NULL, ?, ?, ?, NULL, 1, 2)`
    )
    .run(
      volumeChirho,
      pageChirho,
      lineIndexChirho,
      segmentIndexChirho,
      textChirho,
      hashTextChirho(textChirho),
      verdictChirho,
      certifyCleanChirho,
      "dr-approval-guard-reviewer-chirho",
      nowChirho,
      nowChirho
    );
  return Number(resultChirho.lastInsertRowid);
}

interface CurrentRowSnapshotChirho {
  id_chirho: number;
  segment_index_chirho: number;
  verdict_chirho: string;
  is_current_chirho: number;
}

function currentRowsForLineChirho(dbChirho: Database, lineIndexChirho: number): CurrentRowSnapshotChirho[] {
  return dbChirho
    .query(
      `SELECT id_chirho, segment_index_chirho, verdict_chirho, is_current_chirho
         FROM pass_c_human_validations_chirho
        WHERE volume_chirho = 9 AND page_chirho = 1 AND line_index_chirho = ?
          AND is_current_chirho = 1
        ORDER BY segment_index_chirho, id_chirho`
    )
    .all(lineIndexChirho) as CurrentRowSnapshotChirho[];
}

async function mainChirho(): Promise<void> {
  const tempRootChirho = mkdtempSync(join(tmpdir(), "segment-repair-approval-guard-chirho-"));
  const spansRootChirho = join(tempRootChirho, "spans-chirho");
  const scanlinesRootChirho = join(tempRootChirho, "scanlines-chirho");
  const backupRootChirho = join(tempRootChirho, "backups-chirho");
  const storePathChirho = join(tempRootChirho, "segment-repair-proposals-guard-chirho.json");
  const dbPathChirho = join(tempRootChirho, "guard-progress-chirho.sqlite");
  const lineDirChirho = join(spansRootChirho, "vol-9-chirho", "page-0001-chirho");
  const scanDirChirho = join(scanlinesRootChirho, "vol-9-chirho", "page-0001-chirho");
  mkdirSync(lineDirChirho, { recursive: true });
  mkdirSync(scanDirChirho, { recursive: true });

  const magickChirho = imageMagickCommandChirho();
  const pngAPathChirho = join(scanDirChirho, "line-000-chirho.png");
  const pngBPathChirho = join(scanDirChirho, "line-001-chirho.png");
  for (const [pngPathChirho, sizeChirho] of [
    [pngAPathChirho, "800x60"],
    [pngBPathChirho, "900x60"],
  ] as const) {
    const genChirho = Bun.spawnSync([magickChirho, "-size", sizeChirho, "xc:white", pngPathChirho]);
    if (genChirho.exitCode !== 0) throw new Error(`could not generate fixture png ${pngPathChirho}`);
  }
  const pngAHashChirho = sha256Chirho(readFileSync(pngAPathChirho));
  const pngBHashChirho = sha256Chirho(readFileSync(pngBPathChirho));

  const lineASpansChirho: FixtureSpanSeedChirho[] = [
    { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 300, scriptChirho: "french-chirho", utf8TextChirho: "mot", humanReviewStatusChirho: "reviewed-issues-chirho" },
    { segmentIndexChirho: 1, xMinPxChirho: 300, widthPxChirho: 500, scriptChirho: "hebrew-chirho", utf8TextChirho: "גבול", humanReviewStatusChirho: "reviewed-clean-chirho" },
  ];
  const lineBSpansChirho: FixtureSpanSeedChirho[] = [
    { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 400, scriptChirho: "hebrew-chirho", utf8TextChirho: "טפח" },
    { segmentIndexChirho: 1, xMinPxChirho: 400, widthPxChirho: 500, scriptChirho: "french-chirho", utf8TextChirho: "texte" },
  ];
  const lineAPathChirho = join(lineDirChirho, "line-000-chirho.json");
  const lineBPathChirho = join(lineDirChirho, "line-001-chirho.json");
  writeFileSync(lineAPathChirho, `${JSON.stringify(spanLineFixtureChirho(9, 1, 0, 800, lineASpansChirho), null, 2)}\n`);
  writeFileSync(lineBPathChirho, `${JSON.stringify(spanLineFixtureChirho(9, 1, 1, 900, lineBSpansChirho), null, 2)}\n`);
  const lineAOriginalBytesChirho = readFileSync(lineAPathChirho, "utf8");

  const bareSpanChirho = (seedChirho: FixtureSpanSeedChirho): SegmentRepairProposalSpanChirho => ({
    segmentIndexChirho: seedChirho.segmentIndexChirho,
    xMinPxChirho: seedChirho.xMinPxChirho,
    widthPxChirho: seedChirho.widthPxChirho,
    scriptChirho: seedChirho.scriptChirho,
    utf8TextChirho: seedChirho.utf8TextChirho,
  });
  const proposalAChirho = proposalFixtureChirho({
    proposalIdChirho: "guard-a-script-text-chirho",
    repairKindChirho: "script-text-chirho",
    volumeChirho: 9,
    pageChirho: 1,
    lineIndexChirho: 0,
    targetSegmentIndexChirho: 1,
    lineWidthPxChirho: 800,
    lineImageHashChirho: pngAHashChirho,
    oldSpansChirho: lineASpansChirho.map(bareSpanChirho),
    proposedSpansChirho: [
      bareSpanChirho(lineASpansChirho[0]!),
      { segmentIndexChirho: 1, xMinPxChirho: 300, widthPxChirho: 500, scriptChirho: "hebrew-chirho", utf8TextChirho: "גדול" },
    ],
  });
  const proposalBChirho = proposalFixtureChirho({
    proposalIdChirho: "guard-b-split-chirho",
    repairKindChirho: "split-chirho",
    volumeChirho: 9,
    pageChirho: 1,
    lineIndexChirho: 1,
    targetSegmentIndexChirho: 0,
    lineWidthPxChirho: 900,
    lineImageHashChirho: pngBHashChirho,
    oldSpansChirho: lineBSpansChirho.map(bareSpanChirho),
    proposedSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 200, scriptChirho: "hebrew-chirho", utf8TextChirho: "ט" },
      { segmentIndexChirho: 1, xMinPxChirho: 200, widthPxChirho: 200, scriptChirho: "hebrew-chirho", utf8TextChirho: "פח" },
      { segmentIndexChirho: 2, xMinPxChirho: 400, widthPxChirho: 500, scriptChirho: "french-chirho", utf8TextChirho: "texte" },
    ],
  });
  const proposalCChirho = proposalFixtureChirho({
    proposalIdChirho: "guard-c-reject-me-chirho",
    repairKindChirho: "script-text-chirho",
    volumeChirho: 9,
    pageChirho: 1,
    lineIndexChirho: 0,
    targetSegmentIndexChirho: 0,
    lineWidthPxChirho: 800,
    lineImageHashChirho: pngAHashChirho,
    oldSpansChirho: lineASpansChirho.map(bareSpanChirho),
    proposedSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 300, scriptChirho: "french-chirho", utf8TextChirho: "mots" },
      bareSpanChirho(lineASpansChirho[1]!),
    ],
  });
  const proposalDChirho: SegmentRepairProposalRecordChirho = {
    ...proposalFixtureChirho({
      proposalIdChirho: "guard-d-bad-tiling-chirho",
      repairKindChirho: "rebox-chirho",
      volumeChirho: 9,
      pageChirho: 1,
      lineIndexChirho: 0,
      targetSegmentIndexChirho: 0,
      lineWidthPxChirho: 800,
      lineImageHashChirho: pngAHashChirho,
      oldSpansChirho: lineASpansChirho.map(bareSpanChirho),
      proposedSpansChirho: [
        bareSpanChirho(lineASpansChirho[0]!),
        bareSpanChirho(lineASpansChirho[1]!),
      ],
    }),
  };
  // Hand-corrupt D's tiling to prove the apply gate re-validates stored data.
  proposalDChirho.proposedSpansChirho = [
    { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 300, scriptChirho: "french-chirho", utf8TextChirho: "mot" },
    { segmentIndexChirho: 1, xMinPxChirho: 350, widthPxChirho: 450, scriptChirho: "hebrew-chirho", utf8TextChirho: "גבול" },
  ];
  // E stays a draft for the whole run: the apply-on-a-draft probe targets it
  // so a leaked approval elsewhere cannot turn the probe into a real apply.
  const proposalEChirho = proposalFixtureChirho({
    proposalIdChirho: "guard-e-forever-draft-chirho",
    repairKindChirho: "script-text-chirho",
    volumeChirho: 9,
    pageChirho: 1,
    lineIndexChirho: 1,
    targetSegmentIndexChirho: 1,
    lineWidthPxChirho: 900,
    lineImageHashChirho: pngBHashChirho,
    oldSpansChirho: lineBSpansChirho.map(bareSpanChirho),
    proposedSpansChirho: [
      bareSpanChirho(lineBSpansChirho[0]!),
      { segmentIndexChirho: 1, xMinPxChirho: 400, widthPxChirho: 500, scriptChirho: "french-chirho", utf8TextChirho: "textes" },
    ],
  });
  writeFileSync(
    storePathChirho,
    `${JSON.stringify(
      {
        schemaVersionChirho: SEGMENT_REPAIR_PROPOSAL_SCHEMA_VERSION_CHIRHO,
        proposalsChirho: [proposalAChirho, proposalBChirho, proposalCChirho, proposalDChirho, proposalEChirho],
      },
      null,
      2
    )}\n`
  );

  const dbChirho = new Database(dbPathChirho);
  ensurePassCHumanValidationsTableChirho(dbChirho);
  const rowLineASeg0Chirho = insertValidationRowChirho(dbChirho, 9, 1, 0, 0, "mot", "reviewed-issues-chirho", 0);
  const rowLineASeg1Chirho = insertValidationRowChirho(dbChirho, 9, 1, 0, 1, "גבול", "reviewed-clean-chirho", 1);
  const rowLineBSeg0Chirho = insertValidationRowChirho(dbChirho, 9, 1, 1, 0, "טפח", "reviewed-clean-chirho", 1);
  const rowLineBSeg1Chirho = insertValidationRowChirho(dbChirho, 9, 1, 1, 1, "texte", "reviewed-issues-chirho", 0);

  const portChirho = await freePortChirho();
  const serverProcChirho = Bun.spawn(
    [
      process.execPath,
      "run",
      join(PROJECT_ROOT_CHIRHO, "src-chirho", "segment-repair-approval-server-chirho.ts"),
      `--port=${portChirho}`,
      `--db=${dbPathChirho}`,
      `--db-backup-chirho=${join(tempRootChirho, "db-backup-chirho.json")}`,
      `--segment-repair-proposals-chirho=${storePathChirho}`,
      `--spans-dir-chirho=${spansRootChirho}`,
      `--scanlines-dir-chirho=${scanlinesRootChirho}`,
      `--backup-root-chirho=${backupRootChirho}`,
    ],
    { stdout: "pipe", stderr: "pipe" }
  );
  const baseChirho = `http://127.0.0.1:${portChirho}`;
  let readyChirho = false;
  for (let attemptChirho = 0; attemptChirho < 100; attemptChirho += 1) {
    try {
      const healthChirho = await fetch(`${baseChirho}/api-chirho/server-health-chirho`);
      if (healthChirho.ok) {
        readyChirho = true;
        break;
      }
    } catch {
      // server still booting
    }
    await Bun.sleep(100);
  }
  if (!readyChirho) {
    const stderrTextChirho = await new Response(serverProcChirho.stderr).text();
    serverProcChirho.kill();
    rmSync(tempRootChirho, { recursive: true, force: true });
    throw new Error(`approval server did not become ready on port ${portChirho}: ${stderrTextChirho}`);
  }

  try {
    const pageResponseChirho = await fetch(`${baseChirho}/`);
    const pageChirho = await pageResponseChirho.text();
    checkChirho("queue page responds 200", pageResponseChirho.status === 200);
    checkChirho("queue page sends no-store headers", reviewServerHeadersHaveNoStoreChirho(pageResponseChirho.headers));
    for (const snippetChirho of [
      "Segment Repair Approval",
      "Awaiting decision",
      "Approve",
      "Reject",
      "Current spans",
      "Proposed spans",
      "Current boxes",
      "Proposed boxes",
      "Line text now:",
      "Line text after apply:",
      "Decision rationale (required)",
      "Approval records a decision only; the data changes when an approved proposal is applied.",
      "old-box-chirho",
      "proposed-box-chirho",
      "span-row-changed-chirho",
      "Apply readiness: the live line still matches this proposal’s before-state.",
    ]) {
      checkChirho(`queue page contains "${snippetChirho}"`, pageChirho.includes(snippetChirho));
    }

    const proposalsResponseChirho = await fetch(`${baseChirho}/api-chirho/proposals-chirho`);
    const proposalsJsonChirho = (await proposalsResponseChirho.json()) as {
      proposalsChirho: Array<{ proposalIdChirho: string; applyRefusalChirho: string | null }>;
    };
    checkChirho("proposals api lists all fixtures", proposalsJsonChirho.proposalsChirho.length === 5);
    const readinessByIdChirho = new Map(
      proposalsJsonChirho.proposalsChirho.map((entryChirho) => [entryChirho.proposalIdChirho, entryChirho.applyRefusalChirho])
    );
    checkChirho("healthy draft A shows ready", readinessByIdChirho.get("guard-a-script-text-chirho") === null);
    checkChirho(
      "hand-corrupted tiling D shows blocked readiness",
      String(readinessByIdChirho.get("guard-d-bad-tiling-chirho") ?? "").includes("proposed spans no longer validate")
    );

    const imageResponseChirho = await fetch(`${baseChirho}/line-image-chirho/guard-a-script-text-chirho`);
    checkChirho("line image endpoint serves the scanline", imageResponseChirho.status === 200);

    async function postChirho(
      pathChirho: string,
      headersChirho: Record<string, string>,
      bodyChirho: Record<string, unknown>
    ): Promise<{ statusChirho: number; jsonChirho: { okChirho?: boolean; errorChirho?: string } }> {
      const responseChirho = await fetch(`${baseChirho}${pathChirho}`, {
        method: "POST",
        headers: headersChirho,
        body: JSON.stringify(bodyChirho),
      });
      return { statusChirho: responseChirho.status, jsonChirho: (await responseChirho.json()) as { okChirho?: boolean; errorChirho?: string } };
    }
    const echoAChirho = {
      proposalIdChirho: "guard-a-script-text-chirho",
      expectedStatusChirho: "draft-chirho",
      expectedLineImageHashChirho: pngAHashChirho,
      expectedProposedSpanCountChirho: 2,
      rationaleChirho: "The print clearly reads gadol; the stored gvul is a sweep artifact.",
    };

    const noReviewerChirho = await postChirho("/api-chirho/approve-chirho", { "Content-Type": "application/json" }, echoAChirho);
    checkChirho(
      "approve without any reviewer identity is rejected",
      noReviewerChirho.statusChirho === 400 && (noReviewerChirho.jsonChirho.errorChirho ?? "").includes("reviewerChirho is required")
    );
    const machineChirho = await postChirho("/api-chirho/approve-chirho", MACHINE_HEADERS_CHIRHO, echoAChirho);
    checkChirho(
      "approve with machine reviewer identity is rejected",
      machineChirho.statusChirho === 400 && (machineChirho.jsonChirho.errorChirho ?? "").includes("cannot certify")
    );
    const emptyRationaleChirho = await postChirho("/api-chirho/approve-chirho", HUMAN_HEADERS_CHIRHO, {
      ...echoAChirho,
      rationaleChirho: "",
    });
    checkChirho("approve without rationale is rejected", emptyRationaleChirho.statusChirho === 400);
    const placeholderChirho = await postChirho("/api-chirho/approve-chirho", HUMAN_HEADERS_CHIRHO, {
      ...echoAChirho,
      rationaleChirho: "<rationale>",
    });
    checkChirho("approve with placeholder rationale is rejected", placeholderChirho.statusChirho === 400);
    const wrongHashChirho = await postChirho("/api-chirho/approve-chirho", HUMAN_HEADERS_CHIRHO, {
      ...echoAChirho,
      expectedLineImageHashChirho: "0000",
    });
    checkChirho("approve with stale display echo is rejected", wrongHashChirho.statusChirho === 409);
    const applyDraftChirho = await postChirho("/api-chirho/apply-chirho", HUMAN_HEADERS_CHIRHO, {
      proposalIdChirho: "guard-e-forever-draft-chirho",
      expectedStatusChirho: "approved-chirho",
      expectedLineImageHashChirho: pngBHashChirho,
      expectedProposedSpanCountChirho: 2,
    });
    checkChirho("apply on a draft is rejected", applyDraftChirho.statusChirho === 409);
    const afterProbesChirho = (await (await fetch(`${baseChirho}/api-chirho/proposals-chirho`)).json()) as {
      proposalsChirho: Array<{ proposalIdChirho: string; statusChirho: string }>;
    };
    checkChirho(
      "no refused probe leaked a state change",
      afterProbesChirho.proposalsChirho.every((entryChirho) => entryChirho.statusChirho === "draft-chirho")
    );

    const approveAChirho = await postChirho("/api-chirho/approve-chirho", HUMAN_HEADERS_CHIRHO, echoAChirho);
    checkChirho("approve A succeeds for a certifying human", approveAChirho.statusChirho === 200 && approveAChirho.jsonChirho.okChirho === true);
    const approvedPageChirho = await (await fetch(`${baseChirho}/`)).text();
    checkChirho(
      'approved card offers "Apply to live data"',
      approvedPageChirho.includes("Apply to live data") &&
        approvedPageChirho.includes("Approved — ready to apply")
    );
    const rejectCChirho = await postChirho("/api-chirho/reject-chirho", HUMAN_HEADERS_CHIRHO, {
      proposalIdChirho: "guard-c-reject-me-chirho",
      expectedStatusChirho: "draft-chirho",
      expectedLineImageHashChirho: pngAHashChirho,
      expectedProposedSpanCountChirho: 2,
      rationaleChirho: "The current French box already matches the print; no repair is needed.",
    });
    checkChirho("reject C succeeds", rejectCChirho.statusChirho === 200);
    const applyRejectedChirho = await postChirho("/api-chirho/apply-chirho", HUMAN_HEADERS_CHIRHO, {
      proposalIdChirho: "guard-c-reject-me-chirho",
      expectedStatusChirho: "approved-chirho",
      expectedLineImageHashChirho: pngAHashChirho,
      expectedProposedSpanCountChirho: 2,
    });
    checkChirho("apply on a rejected proposal is refused", applyRejectedChirho.statusChirho === 409);

    const approveDChirho = await postChirho("/api-chirho/approve-chirho", HUMAN_HEADERS_CHIRHO, {
      proposalIdChirho: "guard-d-bad-tiling-chirho",
      expectedStatusChirho: "draft-chirho",
      expectedLineImageHashChirho: pngAHashChirho,
      expectedProposedSpanCountChirho: 2,
      rationaleChirho: "Approving to prove the apply gate still refuses corrupted tiling.",
    });
    checkChirho("approve D succeeds (decision is allowed; apply must refuse)", approveDChirho.statusChirho === 200);
    const applyDChirho = await postChirho("/api-chirho/apply-chirho", HUMAN_HEADERS_CHIRHO, {
      proposalIdChirho: "guard-d-bad-tiling-chirho",
      expectedStatusChirho: "approved-chirho",
      expectedLineImageHashChirho: pngAHashChirho,
      expectedProposedSpanCountChirho: 2,
    });
    checkChirho(
      "apply refuses non-contiguous proposed tiling",
      applyDChirho.statusChirho === 409 && (applyDChirho.jsonChirho.errorChirho ?? "").includes("proposed spans no longer validate")
    );

    const tamperedLineChirho = lineAOriginalBytesChirho.replace("גבול", "גבim");
    writeFileSync(lineAPathChirho, tamperedLineChirho);
    const applyTamperedSpansChirho = await postChirho("/api-chirho/apply-chirho", HUMAN_HEADERS_CHIRHO, {
      ...echoAChirho,
      expectedStatusChirho: "approved-chirho",
    });
    checkChirho(
      "apply refuses when the live before-state was tampered",
      applyTamperedSpansChirho.statusChirho === 409 && /stale/.test(applyTamperedSpansChirho.jsonChirho.errorChirho ?? "")
    );
    writeFileSync(lineAPathChirho, lineAOriginalBytesChirho);

    const pngAOriginalBytesChirho = readFileSync(pngAPathChirho);
    const tamperPngChirho = Bun.spawnSync([magickChirho, "-size", "800x60", "xc:black", pngAPathChirho]);
    checkChirho("fixture png tamper succeeded", tamperPngChirho.exitCode === 0);
    const applyTamperedImageChirho = await postChirho("/api-chirho/apply-chirho", HUMAN_HEADERS_CHIRHO, {
      ...echoAChirho,
      expectedStatusChirho: "approved-chirho",
    });
    checkChirho(
      "apply refuses a stale line-image hash",
      applyTamperedImageChirho.statusChirho === 409 &&
        (applyTamperedImageChirho.jsonChirho.errorChirho ?? "").includes("stale line-image hash")
    );
    writeFileSync(pngAPathChirho, pngAOriginalBytesChirho);

    const applyAChirho = await postChirho("/api-chirho/apply-chirho", HUMAN_HEADERS_CHIRHO, {
      ...echoAChirho,
      expectedStatusChirho: "approved-chirho",
    });
    checkChirho("apply A succeeds once live state matches", applyAChirho.statusChirho === 200 && applyAChirho.jsonChirho.okChirho === true);
    const lineAAfterChirho = JSON.parse(readFileSync(lineAPathChirho, "utf8")) as {
      spansChirho: Array<Record<string, unknown>>;
    };
    checkChirho("apply A rewrote the target span text", lineAAfterChirho.spansChirho[1]?.utf8TextChirho === "גדול");
    checkChirho(
      "unchanged span keeps its human review metadata",
      lineAAfterChirho.spansChirho[0]?.humanReviewStatusChirho === "reviewed-issues-chirho"
    );
    checkChirho(
      "changed span sheds stale human review metadata",
      lineAAfterChirho.spansChirho[1]?.humanReviewStatusChirho === undefined
    );
    const backupDirAChirho = join(backupRootChirho, "guard-a-script-text-chirho");
    const backupBytesChirho = readFileSync(join(backupDirAChirho, "line-before-chirho.json"), "utf8");
    checkChirho("apply A backup is byte-exact", backupBytesChirho === lineAOriginalBytesChirho);
    const manifestAChirho = JSON.parse(readFileSync(join(backupDirAChirho, "manifest-chirho.json"), "utf8")) as {
      beforeFileSha256Chirho: string;
      afterFileSha256Chirho: string;
      reversePathChirho: string;
      invalidatedValidationIdsChirho: number[];
      preservedValidationIdsChirho: number[];
    };
    checkChirho(
      "manifest before-hash matches the original bytes",
      manifestAChirho.beforeFileSha256Chirho === sha256Chirho(lineAOriginalBytesChirho)
    );
    checkChirho(
      "manifest after-hash matches the live rewritten bytes",
      manifestAChirho.afterFileSha256Chirho === sha256Chirho(readFileSync(lineAPathChirho, "utf8"))
    );
    checkChirho(
      "manifest documents the reverse path",
      manifestAChirho.reversePathChirho.includes("revert-segment-repair-chirho")
    );
    const lineARowsChirho = currentRowsForLineChirho(dbChirho, 0);
    const seg0RowChirho = lineARowsChirho.find((rowChirho) => rowChirho.segment_index_chirho === 0);
    const seg1RowChirho = lineARowsChirho.find((rowChirho) => rowChirho.segment_index_chirho === 1);
    checkChirho(
      "untouched segment keeps its original current validation row",
      seg0RowChirho?.id_chirho === rowLineASeg0Chirho && seg0RowChirho?.verdict_chirho === "reviewed-issues-chirho"
    );
    checkChirho(
      "changed segment's certified row is superseded by an invalidation tombstone",
      seg1RowChirho !== undefined &&
        seg1RowChirho.id_chirho !== rowLineASeg1Chirho &&
        seg1RowChirho.verdict_chirho === SEGMENT_REPAIR_INVALIDATED_VERDICT_CHIRHO
    );
    checkChirho(
      "manifest records the exact invalidated/preserved row ids",
      manifestAChirho.invalidatedValidationIdsChirho.join(",") === String(rowLineASeg1Chirho) &&
        manifestAChirho.preservedValidationIdsChirho.join(",") === String(rowLineASeg0Chirho)
    );

    const approveBChirho = await postChirho("/api-chirho/approve-chirho", HUMAN_HEADERS_CHIRHO, {
      proposalIdChirho: "guard-b-split-chirho",
      expectedStatusChirho: "draft-chirho",
      expectedLineImageHashChirho: pngBHashChirho,
      expectedProposedSpanCountChirho: 3,
      rationaleChirho: "The print shows two words inside the single stored box; the split matches the strokes.",
    });
    checkChirho("approve B succeeds", approveBChirho.statusChirho === 200);
    const applyBChirho = await postChirho("/api-chirho/apply-chirho", HUMAN_HEADERS_CHIRHO, {
      proposalIdChirho: "guard-b-split-chirho",
      expectedStatusChirho: "approved-chirho",
      expectedLineImageHashChirho: pngBHashChirho,
      expectedProposedSpanCountChirho: 3,
    });
    checkChirho("apply B (split) succeeds", applyBChirho.statusChirho === 200);
    const lineBAfterChirho = JSON.parse(readFileSync(lineBPathChirho, "utf8")) as {
      spansChirho: Array<Record<string, unknown>>;
    };
    checkChirho("split produced three spans", lineBAfterChirho.spansChirho.length === 3);
    const lineBRowsChirho = currentRowsForLineChirho(dbChirho, 1);
    checkChirho(
      "split invalidates the split segment's certified row",
      lineBRowsChirho.some(
        (rowChirho) =>
          rowChirho.segment_index_chirho === 0 &&
          rowChirho.verdict_chirho === SEGMENT_REPAIR_INVALIDATED_VERDICT_CHIRHO &&
          rowChirho.id_chirho !== rowLineBSeg0Chirho
      )
    );
    checkChirho(
      "split invalidates the index-shifted segment's row too",
      lineBRowsChirho.some(
        (rowChirho) =>
          rowChirho.segment_index_chirho === 1 &&
          rowChirho.verdict_chirho === SEGMENT_REPAIR_INVALIDATED_VERDICT_CHIRHO &&
          rowChirho.id_chirho !== rowLineBSeg1Chirho
      )
    );

    // A human re-reviews the applied state, then the apply is reverted: that
    // re-review must not silently keep certifying the restored older state.
    const reReviewRowChirho = insertValidationRowChirho(dbChirho, 9, 1, 0, 1, "גדול", "reviewed-clean-chirho", 1);
    const revertDryChirho = Bun.spawnSync([
      process.execPath,
      "run",
      join(PROJECT_ROOT_CHIRHO, "src-chirho", "revert-segment-repair-chirho.ts"),
      `--store-chirho=${storePathChirho}`,
      `--db=${dbPathChirho}`,
      "--proposal-id-chirho=guard-a-script-text-chirho",
    ]);
    checkChirho(
      "revert CLI dry-run prints the manifest and changes nothing",
      revertDryChirho.exitCode === 0 &&
        revertDryChirho.stdout.toString().includes("mode=dry-run-chirho") &&
        readFileSync(lineAPathChirho, "utf8") !== lineAOriginalBytesChirho
    );
    const revertMissingGuardChirho = Bun.spawnSync([
      process.execPath,
      "run",
      join(PROJECT_ROOT_CHIRHO, "src-chirho", "revert-segment-repair-chirho.ts"),
      `--store-chirho=${storePathChirho}`,
      `--db=${dbPathChirho}`,
      "--proposal-id-chirho=guard-a-script-text-chirho",
      "--reviewer-chirho=dr-approval-guard-reviewer-chirho",
      "--rationale-chirho=missing double-entry hash",
      "--apply",
    ]);
    checkChirho("revert CLI refuses --apply without the double-entry hash", revertMissingGuardChirho.exitCode !== 0);
    const revertApplyChirho = Bun.spawnSync([
      process.execPath,
      "run",
      join(PROJECT_ROOT_CHIRHO, "src-chirho", "revert-segment-repair-chirho.ts"),
      `--store-chirho=${storePathChirho}`,
      `--db=${dbPathChirho}`,
      "--proposal-id-chirho=guard-a-script-text-chirho",
      "--reviewer-chirho=dr-approval-guard-reviewer-chirho",
      "--rationale-chirho=guard proves the documented reverse path",
      `--expected-after-sha256-chirho=${manifestAChirho.afterFileSha256Chirho}`,
      "--apply",
    ]);
    checkChirho(
      "revert CLI restores the exact original bytes",
      revertApplyChirho.exitCode === 0 && readFileSync(lineAPathChirho, "utf8") === lineAOriginalBytesChirho
    );
    const lineARowsAfterRevertChirho = currentRowsForLineChirho(dbChirho, 0);
    const seg1AfterRevertChirho = lineARowsAfterRevertChirho.find((rowChirho) => rowChirho.segment_index_chirho === 1);
    checkChirho(
      "revert tombstones the re-review of the applied state",
      seg1AfterRevertChirho !== undefined &&
        seg1AfterRevertChirho.id_chirho !== reReviewRowChirho &&
        seg1AfterRevertChirho.verdict_chirho === SEGMENT_REPAIR_REVERT_INVALIDATED_VERDICT_CHIRHO
    );
    const storeAfterChirho = JSON.parse(readFileSync(storePathChirho, "utf8")) as {
      proposalsChirho: SegmentRepairProposalRecordChirho[];
    };
    const statusByIdChirho = new Map(
      storeAfterChirho.proposalsChirho.map((proposalChirho) => [proposalChirho.proposalIdChirho, proposalChirho.statusChirho])
    );
    checkChirho("store shows A reverted", statusByIdChirho.get("guard-a-script-text-chirho") === "reverted-chirho");
    checkChirho("store shows B applied", statusByIdChirho.get("guard-b-split-chirho") === "applied-chirho");
    checkChirho("store shows C rejected", statusByIdChirho.get("guard-c-reject-me-chirho") === "rejected-chirho");
    checkChirho("no store lock left behind", !existsSync(`${storePathChirho}.lock-chirho`));
  } finally {
    serverProcChirho.kill();
    await serverProcChirho.exited;
    rmSync(tempRootChirho, { recursive: true, force: true });
  }

  if (failuresChirho.length > 0) {
    console.error(`[${MODULE_CHIRHO}] ${failuresChirho.length} guard failure(s)`);
    process.exit(1);
  }
  console.log(`[${MODULE_CHIRHO}] all segment repair approval guards passed`);
}

await mainChirho();
