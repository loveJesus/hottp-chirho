// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify the Pass-C human review server rejects unsafe direct POSTs.
 *
 * The test uses a disposable DB/backup and a temporary server port so a guard
 * regression cannot mutate real review state.
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createServer as createNetServerChirho } from "net";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-pass-c-human-review-server-guards-chirho";
const SOURCE_PROGRESS_DB_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite");
const RAW_REVIEW_GUIDANCE_SNIPPETS_CHIRHO = [
  "Clean certification means letters, marks, punctuation, spacing, maqqef, word boundaries, and the red box all match the print.",
  "Multiple Hebrew words in one box are fine only when the box intentionally covers exactly those words.",
  "Dots inside letters, mappiq, shuruk, and shin/sin dots are Vowels/niqqud",
  "cantillation/meteg are Accents/meteg",
  "wrong splits, lumped words, spaces, or maqqef are Segmentation",
  "I checked the crop and full line against the print; if no issue boxes are checked and the text is unchanged, this exact span is intentionally reviewed clean.",
  "Live codepoints",
  "Suggested codepoints",
  "Hebrew letter alef",
  "Hebrew letter qof",
  "Attribution-blocked row shown read-only. Inspect the crop; reattribute only if this existing row is genuinely attributable to the named human reviewer.",
  "bun run reattribute-pass-c-human-validations-chirho",
  "--expected-live-text-chirho",
  "Apply after dry run",
  "Copy command",
];

interface RawReviewQueueItemChirho {
  keyChirho: string;
  liveSpanTextChirho: string;
  textChirho: string;
  lineTextChirho: string;
  validationStatusChirho: string;
  currentScriptChirho: string;
  originalTextHashChirho: string;
  spanXMinPxChirho: number;
  spanWidthPxChirho: number;
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  lineImageHashChirho: string;
  lineImageWidthPxChirho: number;
  lineImageHeightPxChirho: number;
}

interface LatestValidationGuardChirho {
  expectedLatestValidationIdChirho: number;
  expectedLatestValidationKeyChirho: string;
  expectedLatestValidationReviewerChirho: string;
  expectedLatestValidationUpdatedAtChirho: string;
}

function assertCheckChirho(conditionChirho: boolean, messageChirho: string): void {
  if (!conditionChirho) throw new Error(messageChirho);
}

function freePortChirho(): Promise<number> {
  return new Promise((resolveChirho, rejectChirho) => {
    const serverChirho = createNetServerChirho();
    serverChirho.on("error", rejectChirho);
    serverChirho.listen(0, "127.0.0.1", () => {
      const addressChirho = serverChirho.address();
      if (addressChirho === null || typeof addressChirho === "string") {
        serverChirho.close(() => rejectChirho(new Error("failed to allocate a TCP port")));
        return;
      }
      const portChirho = addressChirho.port;
      serverChirho.close(() => resolveChirho(portChirho));
    });
  });
}

async function waitForServerChirho(portChirho: number, processChirho: Bun.Subprocess): Promise<void> {
  const deadlineChirho = Date.now() + 8000;
  let lastErrorChirho = "not-started-chirho";
  while (Date.now() < deadlineChirho) {
    if (processChirho.exitCode !== null) break;
    try {
      const responseChirho = await fetch(`http://127.0.0.1:${portChirho}/`);
      if (responseChirho.ok) return;
      lastErrorChirho = `HTTP ${responseChirho.status}`;
    } catch (errorChirho) {
      lastErrorChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    }
    await new Promise((resolveChirho) => setTimeout(resolveChirho, 150));
  }
  throw new Error(`temporary Pass-C human review server did not become ready: ${lastErrorChirho}`);
}

async function processOutputChirho(processChirho: Bun.Subprocess): Promise<string> {
  const stdoutChirho =
    processChirho.stdout instanceof ReadableStream ? await new Response(processChirho.stdout).text() : "";
  const stderrChirho =
    processChirho.stderr instanceof ReadableStream ? await new Response(processChirho.stderr).text() : "";
  return [stdoutChirho, stderrChirho].filter((valueChirho) => valueChirho.length > 0).join("\n");
}

function queueItemsFromHtmlChirho(htmlChirho: string): RawReviewQueueItemChirho[] {
  const matchChirho = htmlChirho.match(/const queueChirho = (.*?);\n\s+const queueModeChirho/s);
  if (matchChirho === null) throw new Error("could not find queueChirho JSON in raw review server HTML");
  return JSON.parse(matchChirho[1]!) as RawReviewQueueItemChirho[];
}

function assertRawReviewGuidanceHtmlChirho(htmlChirho: string): void {
  for (const snippetChirho of RAW_REVIEW_GUIDANCE_SNIPPETS_CHIRHO) {
    assertCheckChirho(
      htmlChirho.includes(snippetChirho),
      `raw review server HTML is missing guidance snippet: ${snippetChirho}`
    );
  }
}

function firstQueueItemFromHtmlChirho(htmlChirho: string): RawReviewQueueItemChirho {
  const itemChirho = queueItemsFromHtmlChirho(htmlChirho).find(
    (candidateChirho) => candidateChirho.validationStatusChirho !== "attribution-blocked-chirho"
  );
  if (itemChirho === undefined) throw new Error("raw review queue has no normal item; cannot run guard check");
  return itemChirho;
}

function firstAttributionBlockedQueueItemFromHtmlChirho(htmlChirho: string): RawReviewQueueItemChirho {
  const itemChirho = queueItemsFromHtmlChirho(htmlChirho).find(
    (candidateChirho) => candidateChirho.validationStatusChirho === "attribution-blocked-chirho"
  );
  if (itemChirho === undefined) throw new Error("raw review queue has no attribution-blocked item; cannot run guard check");
  return itemChirho;
}

function displayGuardForItemChirho(itemChirho: RawReviewQueueItemChirho): Record<string, unknown> {
  return {
    expectedLiveSpanTextChirho: itemChirho.liveSpanTextChirho,
    expectedReportTextChirho: itemChirho.textChirho,
    expectedLineTextChirho: itemChirho.lineTextChirho,
    expectedValidationStatusChirho: itemChirho.validationStatusChirho,
    expectedCurrentScriptChirho: itemChirho.currentScriptChirho,
    expectedOriginalTextHashChirho: itemChirho.originalTextHashChirho,
    expectedSpanXMinPxChirho: itemChirho.spanXMinPxChirho,
    expectedSpanWidthPxChirho: itemChirho.spanWidthPxChirho,
    expectedLineWidthPxChirho: itemChirho.lineWidthPxChirho,
    expectedLineHeightPxChirho: itemChirho.lineHeightPxChirho,
    expectedLineImageHashChirho: itemChirho.lineImageHashChirho,
    expectedLineImageWidthPxChirho: itemChirho.lineImageWidthPxChirho,
    expectedLineImageHeightPxChirho: itemChirho.lineImageHeightPxChirho,
  };
}

function sqliteStringLiteralChirho(valueChirho: string): string {
  return `'${valueChirho.replaceAll("'", "''")}'`;
}

function copyProgressDbSnapshotChirho(outputPathChirho: string): void {
  const dbChirho = new Database(SOURCE_PROGRESS_DB_PATH_CHIRHO, { readonly: true });
  try {
    dbChirho.query(`VACUUM INTO ${sqliteStringLiteralChirho(outputPathChirho)}`).run();
  } finally {
    dbChirho.close();
  }
}

function validationRowCountChirho(dbPathChirho: string): number {
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const rowChirho = dbChirho
      .query("SELECT COUNT(*) AS count_chirho FROM pass_c_human_validations_chirho")
      .get() as { count_chirho: number };
    return rowChirho.count_chirho;
  } finally {
    dbChirho.close();
  }
}

function currentNonUndoValidationRowCountChirho(dbPathChirho: string): number {
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const rowChirho = dbChirho
      .query("SELECT COUNT(*) AS count_chirho FROM pass_c_human_validations_chirho WHERE is_current_chirho = 1 AND verdict_chirho <> 'undo-chirho' AND schema_version_chirho >= 2")
      .get() as { count_chirho: number };
    return rowChirho.count_chirho;
  } finally {
    dbChirho.close();
  }
}

function latestValidationGuardFromDbChirho(dbPathChirho: string): LatestValidationGuardChirho {
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const rowChirho = dbChirho
      .query(`
SELECT id_chirho, volume_chirho, page_chirho, line_index_chirho, segment_index_chirho, reviewer_chirho, updated_at_chirho
  FROM pass_c_human_validations_chirho
 WHERE is_current_chirho = 1 AND verdict_chirho <> 'undo-chirho' AND schema_version_chirho >= 2
 ORDER BY updated_at_chirho DESC, id_chirho DESC
 LIMIT 1`)
      .get() as
      | {
          id_chirho: number;
          volume_chirho: number;
          page_chirho: number;
          line_index_chirho: number;
          segment_index_chirho: number;
          reviewer_chirho: string;
          updated_at_chirho: string;
        }
      | undefined;
    if (rowChirho === undefined) throw new Error("no current non-undo validation row in disposable DB");
    return {
      expectedLatestValidationIdChirho: rowChirho.id_chirho,
      expectedLatestValidationKeyChirho: `${rowChirho.volume_chirho}:${rowChirho.page_chirho}:${rowChirho.line_index_chirho}:${rowChirho.segment_index_chirho}`,
      expectedLatestValidationReviewerChirho: rowChirho.reviewer_chirho,
      expectedLatestValidationUpdatedAtChirho: rowChirho.updated_at_chirho,
    };
  } finally {
    dbChirho.close();
  }
}

async function mainChirho(): Promise<void> {
  const tempDirChirho = mkdtempSync(join(tmpdir(), "pass-c-human-review-guard-chirho-"));
  const dbPathChirho = join(tempDirChirho, "review-guard-chirho.sqlite");
  const backupPathChirho = join(tempDirChirho, "review-guard-backup-chirho.json");
  copyProgressDbSnapshotChirho(dbPathChirho);
  const validationRowsBeforeChirho = validationRowCountChirho(dbPathChirho);
  const currentNonUndoRowsBeforeChirho = currentNonUndoValidationRowCountChirho(dbPathChirho);
  const portChirho = await freePortChirho();
  const processChirho = Bun.spawn(
    [
      process.execPath,
      "run",
      "src-chirho/pass-c-human-validate-server-chirho.ts",
      `--port=${portChirho}`,
      `--db=${dbPathChirho}`,
      `--backup=${backupPathChirho}`,
    ],
    {
      cwd: PROJECT_ROOT_CHIRHO,
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  try {
    await waitForServerChirho(portChirho, processChirho);
    const pageHtmlChirho = await fetch(`http://127.0.0.1:${portChirho}/`).then((responseChirho) =>
      responseChirho.text()
    );
    assertRawReviewGuidanceHtmlChirho(pageHtmlChirho);
    const itemChirho = firstQueueItemFromHtmlChirho(pageHtmlChirho);
    const attributionBlockedItemChirho = firstAttributionBlockedQueueItemFromHtmlChirho(pageHtmlChirho);
    const attributionBlockedSubmitResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyChirho: attributionBlockedItemChirho.keyChirho,
        issueFlagsChirho: [],
        correctedTextChirho: attributionBlockedItemChirho.liveSpanTextChirho,
        notesChirho: "",
        scriptVerdictChirho: "",
        reviewerChirho: "hallelujah-chirho",
        certifyCleanChirho: true,
        ...displayGuardForItemChirho(attributionBlockedItemChirho),
      }),
    });
    const attributionBlockedSubmitDataChirho = (await attributionBlockedSubmitResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      attributionBlockedSubmitResponseChirho.status === 400,
      `expected attribution-blocked submit HTTP 400, got ${attributionBlockedSubmitResponseChirho.status}`
    );
    assertCheckChirho(
      attributionBlockedSubmitDataChirho.okChirho === false,
      "attribution-blocked submit unexpectedly returned ok"
    );
    assertCheckChirho(
      String(attributionBlockedSubmitDataChirho.errorChirho ?? "").includes("Attribution-blocked rows are read-only"),
      `attribution-blocked submit failed for the wrong reason: ${String(attributionBlockedSubmitDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "attribution-blocked submit persisted a row"
    );
    const staleDisplayResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: [],
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "",
        scriptVerdictChirho: "",
        reviewerChirho: "hallelujah-chirho",
        certifyCleanChirho: true,
        ...displayGuardForItemChirho(itemChirho),
        expectedLineTextChirho: `${itemChirho.lineTextChirho} stale-display-guard-chirho`,
      }),
    });
    const staleDisplayDataChirho = (await staleDisplayResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      staleDisplayResponseChirho.status === 409,
      `expected stale-display HTTP 409, got ${staleDisplayResponseChirho.status}`
    );
    assertCheckChirho(staleDisplayDataChirho.okChirho === false, "stale-display POST unexpectedly returned ok");
    assertCheckChirho(
      String(staleDisplayDataChirho.errorChirho ?? "").includes("Raw Hebrew review item is stale"),
      `stale-display POST failed for the wrong reason: ${String(staleDisplayDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "stale-display POST persisted a row"
    );
    const missingCleanAckResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: [],
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "",
        scriptVerdictChirho: "",
        reviewerChirho: "hallelujah-chirho",
        certifyCleanChirho: false,
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const missingCleanAckDataChirho = (await missingCleanAckResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      missingCleanAckResponseChirho.status === 400,
      `expected missing-clean-ack HTTP 400, got ${missingCleanAckResponseChirho.status}`
    );
    assertCheckChirho(missingCleanAckDataChirho.okChirho === false, "missing-clean-ack POST unexpectedly returned ok");
    assertCheckChirho(
      String(missingCleanAckDataChirho.errorChirho ?? "").includes("certifyCleanChirho acknowledgement is required"),
      `missing-clean-ack POST failed for the wrong reason: ${String(missingCleanAckDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "missing-clean-ack POST persisted a row"
    );
    const nonArrayIssueFlagsResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: "letters-chirho",
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "",
        scriptVerdictChirho: "",
        reviewerChirho: "hallelujah-chirho",
        certifyCleanChirho: true,
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const nonArrayIssueFlagsDataChirho = (await nonArrayIssueFlagsResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      nonArrayIssueFlagsResponseChirho.status === 400,
      `expected non-array issue flags HTTP 400, got ${nonArrayIssueFlagsResponseChirho.status}`
    );
    assertCheckChirho(nonArrayIssueFlagsDataChirho.okChirho === false, "non-array issue flags POST unexpectedly returned ok");
    assertCheckChirho(
      String(nonArrayIssueFlagsDataChirho.errorChirho ?? "").includes("issueFlagsChirho must be an array"),
      `non-array issue flags POST failed for the wrong reason: ${String(nonArrayIssueFlagsDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "non-array issue flags POST persisted a row"
    );
    const unknownIssueFlagResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: ["letters-typo-chirho"],
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "this unknown flag must not be silently converted to reviewed clean",
        scriptVerdictChirho: "",
        reviewerChirho: "hallelujah-chirho",
        certifyCleanChirho: true,
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const unknownIssueFlagDataChirho = (await unknownIssueFlagResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      unknownIssueFlagResponseChirho.status === 400,
      `expected unknown issue flag HTTP 400, got ${unknownIssueFlagResponseChirho.status}`
    );
    assertCheckChirho(unknownIssueFlagDataChirho.okChirho === false, "unknown issue flag POST unexpectedly returned ok");
    assertCheckChirho(
      String(unknownIssueFlagDataChirho.errorChirho ?? "").includes("unsupported issue flag: letters-typo-chirho"),
      `unknown issue flag POST failed for the wrong reason: ${String(unknownIssueFlagDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "unknown issue flag POST persisted a row"
    );
    const machineCleanResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: [],
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "",
        scriptVerdictChirho: "",
        reviewerChirho: "codex-gpt5-chirho",
        certifyCleanChirho: true,
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const machineCleanDataChirho = (await machineCleanResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      machineCleanResponseChirho.status === 400,
      `expected machine-clean HTTP 400, got ${machineCleanResponseChirho.status}`
    );
    assertCheckChirho(machineCleanDataChirho.okChirho === false, "machine clean POST unexpectedly returned ok");
    assertCheckChirho(
      String(machineCleanDataChirho.errorChirho ?? "").includes("machine reviewer codex-gpt5-chirho cannot certify"),
      `machine clean POST failed for the wrong reason: ${String(machineCleanDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "machine clean POST persisted a row"
    );
    const genericCleanResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: [],
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "",
        scriptVerdictChirho: "",
        reviewerChirho: "human-chirho",
        certifyCleanChirho: true,
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const genericCleanDataChirho = (await genericCleanResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      genericCleanResponseChirho.status === 400,
      `expected generic-clean HTTP 400, got ${genericCleanResponseChirho.status}`
    );
    assertCheckChirho(genericCleanDataChirho.okChirho === false, "generic clean POST unexpectedly returned ok");
    assertCheckChirho(
      String(genericCleanDataChirho.errorChirho ?? "").includes("must identify the explicit reviewer, not generic human-chirho"),
      `generic clean POST failed for the wrong reason: ${String(genericCleanDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "generic clean POST persisted a row"
    );
    const responseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: ["letters-chirho"],
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "guard check should be rejected before persistence",
        scriptVerdictChirho: "",
        reviewerChirho: "codex-gpt5-chirho",
        certifyCleanChirho: false,
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const dataChirho = (await responseChirho.json()) as { okChirho?: boolean; errorChirho?: string };
    assertCheckChirho(responseChirho.status === 400, `expected HTTP 400, got ${responseChirho.status}`);
    assertCheckChirho(dataChirho.okChirho === false, "machine reviewer issue POST unexpectedly returned ok");
    assertCheckChirho(
      String(dataChirho.errorChirho ?? "").includes("machine reviewer codex-gpt5-chirho cannot certify"),
      `machine reviewer issue POST failed for the wrong reason: ${String(dataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "machine reviewer issue POST persisted a row"
    );
    const genericIssueResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: ["letters-chirho"],
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "guard check should reject generic reviewer before persistence",
        scriptVerdictChirho: "",
        reviewerChirho: "human-chirho",
        certifyCleanChirho: false,
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const genericIssueDataChirho = (await genericIssueResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      genericIssueResponseChirho.status === 400,
      `expected generic-issue HTTP 400, got ${genericIssueResponseChirho.status}`
    );
    assertCheckChirho(genericIssueDataChirho.okChirho === false, "generic reviewer issue POST unexpectedly returned ok");
    assertCheckChirho(
      String(genericIssueDataChirho.errorChirho ?? "").includes("must identify the explicit reviewer, not generic human-chirho"),
      `generic reviewer issue POST failed for the wrong reason: ${String(genericIssueDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "generic reviewer issue POST persisted a row"
    );
    const editedNoIssueResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: [],
        correctedTextChirho: `${itemChirho.liveSpanTextChirho} guard-edit-chirho`,
        notesChirho: "",
        scriptVerdictChirho: "",
        reviewerChirho: "hallelujah-chirho",
        certifyCleanChirho: false,
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const editedNoIssueDataChirho = (await editedNoIssueResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      editedNoIssueResponseChirho.status === 400,
      `expected edited-no-issue HTTP 400, got ${editedNoIssueResponseChirho.status}`
    );
    assertCheckChirho(editedNoIssueDataChirho.okChirho === false, "edited-no-issue POST unexpectedly returned ok");
    assertCheckChirho(
      String(editedNoIssueDataChirho.errorChirho ?? "").includes("Text changed; check at least one issue box"),
      `edited-no-issue POST failed for the wrong reason: ${String(editedNoIssueDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "edited-no-issue POST persisted a row"
    );
    const missingNotesResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: ["letters-chirho"],
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "   ",
        scriptVerdictChirho: "",
        reviewerChirho: "hallelujah-chirho",
        certifyCleanChirho: false,
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const missingNotesDataChirho = (await missingNotesResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      missingNotesResponseChirho.status === 400,
      `expected missing-notes HTTP 400, got ${missingNotesResponseChirho.status}`
    );
    assertCheckChirho(missingNotesDataChirho.okChirho === false, "missing-notes issue POST unexpectedly returned ok");
    assertCheckChirho(
      String(missingNotesDataChirho.errorChirho ?? "").includes("notesChirho is required for reviewed-issues"),
      `missing-notes issue POST failed for the wrong reason: ${String(missingNotesDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "missing-notes issue POST persisted a row"
    );
    const placeholderNotesResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: ["letters-chirho"],
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "<why this issue is recorded>",
        scriptVerdictChirho: "",
        reviewerChirho: "hallelujah-chirho",
        certifyCleanChirho: false,
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const placeholderNotesDataChirho = (await placeholderNotesResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      placeholderNotesResponseChirho.status === 400,
      `expected placeholder-notes HTTP 400, got ${placeholderNotesResponseChirho.status}`
    );
    assertCheckChirho(placeholderNotesDataChirho.okChirho === false, "placeholder-notes issue POST unexpectedly returned ok");
    assertCheckChirho(
      String(placeholderNotesDataChirho.errorChirho ?? "").includes("template placeholder"),
      `placeholder-notes issue POST failed for the wrong reason: ${String(placeholderNotesDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "placeholder-notes issue POST persisted a row"
    );
    const validCleanResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: [],
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "",
        scriptVerdictChirho: "",
        reviewerChirho: "hallelujah-chirho",
        certifyCleanChirho: true,
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const validCleanDataChirho = (await validCleanResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      validCleanResponseChirho.ok,
      `valid clean POST failed: ${validCleanResponseChirho.status} ${String(validCleanDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho + 1,
      "valid clean POST did not append one row"
    );
    const validIssueResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: ["letters-chirho"],
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "server guard check records a concrete issue for disposable Pass-C review state",
        scriptVerdictChirho: "",
        reviewerChirho: "hallelujah-chirho",
        certifyCleanChirho: false,
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const validIssueDataChirho = (await validIssueResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      validIssueResponseChirho.ok,
      `valid issue POST failed: ${validIssueResponseChirho.status} ${String(validIssueDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho + 2,
      "valid issue POST did not append one row"
    );
    assertCheckChirho(
      currentNonUndoValidationRowCountChirho(dbPathChirho) === currentNonUndoRowsBeforeChirho + 1,
      "valid clean+issue POSTs left the wrong current non-undo row count"
    );
    const latestGuardChirho = latestValidationGuardFromDbChirho(dbPathChirho);
    const staleUndoResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/undo-last-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...latestGuardChirho,
        expectedLatestValidationIdChirho: latestGuardChirho.expectedLatestValidationIdChirho + 1000,
      }),
    });
    const staleUndoDataChirho = (await staleUndoResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      staleUndoResponseChirho.status === 409,
      `expected stale undo HTTP 409, got ${staleUndoResponseChirho.status}`
    );
    assertCheckChirho(staleUndoDataChirho.okChirho === false, "stale undo unexpectedly returned ok");
    assertCheckChirho(
      String(staleUndoDataChirho.errorChirho ?? "").includes("Raw Hebrew undo target is stale"),
      `stale undo failed for the wrong reason: ${String(staleUndoDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho + 2,
      "stale undo POST appended a row"
    );
    const validUndoResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/undo-last-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(latestGuardChirho),
    });
    const validUndoDataChirho = (await validUndoResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      validUndoResponseChirho.ok,
      `valid undo POST failed: ${validUndoResponseChirho.status} ${String(validUndoDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho + 3,
      "valid undo POST did not append one undo row"
    );
    assertCheckChirho(
      currentNonUndoValidationRowCountChirho(dbPathChirho) === currentNonUndoRowsBeforeChirho,
      "valid undo did not restore the current non-undo row count"
    );
    assertCheckChirho(existsSync(backupPathChirho), "valid POSTs did not refresh disposable backup");
    JSON.parse(readFileSync(backupPathChirho, "utf8"));
  } catch (errorChirho) {
    processChirho.kill();
    await processChirho.exited.catch(() => undefined);
    const outputChirho = await processOutputChirho(processChirho).catch(() => "");
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    throw new Error(outputChirho.length === 0 ? messageChirho : `${messageChirho}\n${outputChirho}`);
  } finally {
    processChirho.kill();
    await processChirho.exited.catch(() => undefined);
    rmSync(tempDirChirho, { recursive: true, force: true });
  }
  console.log(`[${MODULE_CHIRHO}] Pass-C human review server guards passed`);
}

if (import.meta.main) {
  mainChirho().catch((errorChirho) => {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  });
}
