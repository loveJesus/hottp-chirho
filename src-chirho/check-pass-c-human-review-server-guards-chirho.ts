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
import { reviewServerHeadersHaveNoStoreChirho } from "./review-server-health-chirho.ts";

const MODULE_CHIRHO = "check-pass-c-human-review-server-guards-chirho";
const TRUSTED_REVIEWER_HEADERS_CHIRHO = {
  "X-Webauth-User": "dr-pass-c-header-reviewer-chirho",
} as const;
const SOURCE_PROGRESS_DB_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite");
const RAW_REVIEW_GUIDANCE_SNIPPETS_CHIRHO = [
  "Clean certification means letters, marks, punctuation, spacing, maqqef, word boundaries, and the red box all match the print.",
  "Target crop - red box is the item",
  "Full line - red box in context",
  "Multiple Hebrew words in one box are fine only when the box intentionally covers exactly those words.",
  "Dots inside letters, mappiq, shuruk, and shin/sin dots are Vowels/niqqud",
  "cantillation/meteg are Accents/meteg",
  "wrong splits, lumped words, spaces, or maqqef are Segmentation",
  "Missing script",
  "Unreadable script",
  "Punct. attach",
  "Segment repair proposal",
  "Split target row",
  "Save draft repair proposal",
  "Geometry OK",
  "I checked the Target crop - red box is the item and Full line - red box in context panels against the print; if no issue boxes are checked and the text is unchanged, this exact span is intentionally reviewed clean.",
  "A clean save requires the checkbox above.",
  "issue review cannot carry the clean-certification checkbox",
  "Check an issue box and write a note if anything is wrong, split, lumped, missing, extra, or uncertain.",
  "clean review needs the clean-certification checkbox",
  "Live codepoints",
  "Suggested codepoints",
  "Review server source:",
  "Hebrew letter alef",
  "Hebrew letter qof",
  "Attribution-blocked row shown read-only. Inspect the Target crop - red box is the item and Full line - red box in context panels; reattribute only if this existing row is genuinely attributable to the named human reviewer.",
  "Attribution re-review mode appends a fresh explicit human review that supersedes the generic row.",
  "Live text changed since this generic row was recorded. Use Attribution re-review by default; reattribute only after rechecking the current live text against the print.",
  "Attribution text state",
  "unchanged-live-text-chirho",
  "changed-live-text-chirho",
  "Guarded reattribution can fix attribution only; it does not certify new text, change the verdict, or change issue flags.",
  "Fresh re-review can replace this generic row; the quick reattribution helper is intentionally omitted.",
  "Originally reviewed text",
  "Current live text",
  "Open Attribution re-review for this item",
  "Reattribute command helper omitted because the live text changed.",
  "Non-certifying pre-review note",
  "This note is a machine-assisted visual aid only. It is not a verdict; certify only from the Target crop - red box is the item and Full line - red box in context panels.",
  "Pre-review",
  "Has note",
  "With pre-review note",
  "pre-review-note-chirho=with-note-chirho",
  "Repeat cluster",
  "Planning aid only; every item still needs exact print certification or an explicit issue.",
  "Open exact-text cluster",
  "exact-text-chirho",
  "Reviewer for command",
  "Rationale for command",
  "These helper fields only update the copied commands; they do not save, apply, or certify.",
  "bun run reattribute-pass-c-human-validations-chirho",
  "--expected-live-text-hash-chirho",
  "Apply after dry run",
  "Copy command",
  "Quickstart",
  "/quickstart-chirho",
  "Session guide",
  "/session-guide-chirho",
  "Recommended raw review order",
  "Vols 3-5 unvalidated",
  "Delimiter notation",
  "No direct read",
  "Confident disagreement",
  "Attribution cleanup",
  "Attribution text",
  "Unchanged live text",
  "Changed live text",
  "Attribution unchanged",
  "Attribution changed re-review",
  "attribution-text-chirho=unchanged-chirho",
  "attribution-text-chirho=changed-chirho",
  "attention-chirho=confident-direct-read-disagreement-chirho",
  "attention-chirho=multi-token-chirho",
  "attention-chirho=delimiter-notation-chirho",
  "attention-chirho=no-direct-read-chirho",
];
const RAW_SESSION_GUIDE_SNIPPETS_CHIRHO = [
  "Hallelujah Review Session Guide Chirho",
  "A clean raw Hebrew save means the red-boxed printed content and stored text match exactly enough for certification",
  "A dot inside a Hebrew letter is usually dagesh or mappiq",
  "Flag `Segmentation` when the box or text has a wrong word boundary",
  "A skipped item is safer than a clean review used to mean \"probably right.\"",
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
  lineSegmentsChirho: Array<{
    segmentIndexChirho: number;
    xMinPxChirho: number;
    widthPxChirho: number;
    scriptChirho: string;
    utf8TextChirho: string;
  }>;
  preReviewNoteChirho: string | null;
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

function assertNoStoreResponseChirho(responseChirho: Response, labelChirho: string): void {
  assertCheckChirho(
    reviewServerHeadersHaveNoStoreChirho(responseChirho.headers),
    `${labelChirho} is missing no-store cache control`
  );
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

async function assertQuickstartEndpointChirho(portChirho: number): Promise<void> {
  const responseChirho = await fetch(`http://127.0.0.1:${portChirho}/quickstart-chirho`);
  const textChirho = await responseChirho.text();
  assertCheckChirho(responseChirho.ok, `quickstart endpoint failed: HTTP ${responseChirho.status}`);
  assertNoStoreResponseChirho(responseChirho, "quickstart endpoint");
  for (const snippetChirho of [
    "Raw Hebrew Human Certification Quickstart Chirho",
    "A dot inside a letter belongs here.",
    "Several Hebrew words in one span are acceptable only when the box intentionally covers exactly those words",
  ]) {
    assertCheckChirho(
      textChirho.includes(snippetChirho),
      `quickstart endpoint is missing expected snippet: ${snippetChirho}`
    );
  }
}

async function assertSessionGuideEndpointChirho(portChirho: number): Promise<void> {
  const responseChirho = await fetch(`http://127.0.0.1:${portChirho}/session-guide-chirho`);
  const textChirho = await responseChirho.text();
  assertCheckChirho(responseChirho.ok, `session guide endpoint failed: HTTP ${responseChirho.status}`);
  assertNoStoreResponseChirho(responseChirho, "session guide endpoint");
  for (const snippetChirho of RAW_SESSION_GUIDE_SNIPPETS_CHIRHO) {
    assertCheckChirho(
      textChirho.includes(snippetChirho),
      `session guide endpoint is missing expected snippet: ${snippetChirho}`
    );
  }
}

async function assertRawReviewImageEndpointsNoStoreChirho(portChirho: number, itemChirho: RawReviewQueueItemChirho): Promise<void> {
  for (const [labelChirho, pathChirho] of [
    ["line image", `/line-image-chirho/${encodeURIComponent(itemChirho.keyChirho)}`],
    ["span image", `/span-image-chirho/${encodeURIComponent(itemChirho.keyChirho)}`],
  ] as const) {
    const responseChirho = await fetch(`http://127.0.0.1:${portChirho}${pathChirho}`);
    assertCheckChirho(responseChirho.ok, `${labelChirho} endpoint failed: HTTP ${responseChirho.status}`);
    assertNoStoreResponseChirho(responseChirho, `${labelChirho} endpoint`);
    await responseChirho.arrayBuffer();
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

function assertPreReviewNotesLoadedChirho(htmlChirho: string): void {
  const notedItemsChirho = queueItemsFromHtmlChirho(htmlChirho).filter(
    (itemChirho) => typeof itemChirho.preReviewNoteChirho === "string" && itemChirho.preReviewNoteChirho.length > 0
  );
  assertCheckChirho(notedItemsChirho.length > 0, "raw review queue did not load any non-certifying pre-review notes");
  assertCheckChirho(
    notedItemsChirho.some((itemChirho) => itemChirho.preReviewNoteChirho?.includes("Human check still needed")),
    "raw review pre-review notes are missing the human-check-needed warning"
  );
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

function latestValidationReviewerChirho(dbPathChirho: string): string {
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const rowChirho = dbChirho
      .query("SELECT reviewer_chirho FROM pass_c_human_validations_chirho ORDER BY id_chirho DESC LIMIT 1")
      .get() as { reviewer_chirho: string } | undefined;
    if (rowChirho === undefined) throw new Error("no validation row found");
    return rowChirho.reviewer_chirho;
  } finally {
    dbChirho.close();
  }
}

async function mainChirho(): Promise<void> {
  const tempDirChirho = mkdtempSync(join(tmpdir(), "pass-c-human-review-guard-chirho-"));
  const dbPathChirho = join(tempDirChirho, "review-guard-chirho.sqlite");
  const backupPathChirho = join(tempDirChirho, "review-guard-backup-chirho.json");
  const segmentRepairProposalsPathChirho = join(tempDirChirho, "segment-repair-proposals-chirho.json");
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
      `--segment-repair-proposals-chirho=${segmentRepairProposalsPathChirho}`,
      "--reviewer=dr-pass-c-server-reviewer-chirho",
    ],
    {
      cwd: PROJECT_ROOT_CHIRHO,
      env: { ...process.env, HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO: "x-webauth-user" },
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  try {
    await waitForServerChirho(portChirho, processChirho);
    const pageResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/`);
    const pageHtmlChirho = await pageResponseChirho.text();
    assertCheckChirho(pageResponseChirho.ok, `raw review page failed: HTTP ${pageResponseChirho.status}`);
    assertNoStoreResponseChirho(pageResponseChirho, "raw review page");
    assertRawReviewGuidanceHtmlChirho(pageHtmlChirho);
    assertPreReviewNotesLoadedChirho(pageHtmlChirho);
    await assertQuickstartEndpointChirho(portChirho);
    await assertSessionGuideEndpointChirho(portChirho);
    const itemChirho = firstQueueItemFromHtmlChirho(pageHtmlChirho);
    await assertRawReviewImageEndpointsNoStoreChirho(portChirho, itemChirho);
    const missingTrustedHeaderResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
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
    const missingTrustedHeaderDataChirho = (await missingTrustedHeaderResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      missingTrustedHeaderResponseChirho.status === 400,
      `expected missing trusted header HTTP 400, got ${missingTrustedHeaderResponseChirho.status}`
    );
    assertCheckChirho(missingTrustedHeaderDataChirho.okChirho === false, "missing trusted header unexpectedly returned ok");
    assertCheckChirho(
      String(missingTrustedHeaderDataChirho.errorChirho ?? "").includes("reviewerChirho is required"),
      `missing trusted header failed for the wrong reason: ${String(missingTrustedHeaderDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "missing trusted header POST persisted a row"
    );
    const attributionBlockedItemChirho = firstAttributionBlockedQueueItemFromHtmlChirho(pageHtmlChirho);
    const attributionBlockedSubmitResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
      body: JSON.stringify({
        keyChirho: attributionBlockedItemChirho.keyChirho,
        issueFlagsChirho: [],
        correctedTextChirho: attributionBlockedItemChirho.liveSpanTextChirho,
        notesChirho: "",
        scriptVerdictChirho: "",
        reviewerChirho: "codex-gpt5-chirho",
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
    const normalItemAttributionSupersedeResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: [],
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "",
        scriptVerdictChirho: "",
        reviewerChirho: "hallelujah-chirho",
        certifyCleanChirho: true,
        supersedeAttributionBlockedChirho: true,
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const normalItemAttributionSupersedeDataChirho = (await normalItemAttributionSupersedeResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      normalItemAttributionSupersedeResponseChirho.status === 400,
      `expected normal-item attribution supersede HTTP 400, got ${normalItemAttributionSupersedeResponseChirho.status}`
    );
    assertCheckChirho(
      normalItemAttributionSupersedeDataChirho.okChirho === false,
      "normal-item attribution supersede unexpectedly returned ok"
    );
    assertCheckChirho(
      String(normalItemAttributionSupersedeDataChirho.errorChirho ?? "").includes("only allowed for attribution-blocked rows"),
      `normal-item attribution supersede failed for the wrong reason: ${String(normalItemAttributionSupersedeDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "normal-item attribution supersede persisted a row"
    );
    const staleDisplayResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
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
    const validProposalSpansChirho = itemChirho.lineSegmentsChirho.map((spanChirho, indexChirho) => ({
      segmentIndexChirho: indexChirho,
      xMinPxChirho: spanChirho.xMinPxChirho,
      widthPxChirho: spanChirho.widthPxChirho,
      scriptChirho: spanChirho.scriptChirho,
      utf8TextChirho: spanChirho.utf8TextChirho,
    }));
    const invalidGeometryProposalResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/segment-repair-proposal-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        reviewStateChirho: "pending-chirho",
        repairKindChirho: "rebox-chirho",
        proposedSpansChirho: validProposalSpansChirho.map((spanChirho, indexChirho) =>
          indexChirho === 0 ? { ...spanChirho, widthPxChirho: spanChirho.widthPxChirho + 1 } : spanChirho
        ),
        rationaleChirho: "guard check proves bad tiling cannot be stored as a draft repair",
        reviewerChirho: "hallelujah-chirho",
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const invalidGeometryProposalDataChirho = (await invalidGeometryProposalResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      invalidGeometryProposalResponseChirho.status === 400,
      `expected invalid repair proposal HTTP 400, got ${invalidGeometryProposalResponseChirho.status}`
    );
    assertCheckChirho(invalidGeometryProposalDataChirho.okChirho === false, "invalid repair proposal unexpectedly returned ok");
    assertCheckChirho(
      String(invalidGeometryProposalDataChirho.errorChirho ?? "").includes("expected"),
      `invalid repair proposal failed for the wrong reason: ${String(invalidGeometryProposalDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(!existsSync(segmentRepairProposalsPathChirho), "invalid repair proposal wrote a proposal file");
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "invalid repair proposal persisted a validation row"
    );
    const readOnlyStateProposalResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/segment-repair-proposal-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        reviewStateChirho: "saved-issues-chirho",
        repairKindChirho: "rebox-chirho",
        proposedSpansChirho: validProposalSpansChirho,
        rationaleChirho: "guard check proves saved issue mode cannot write repair proposals",
        reviewerChirho: "hallelujah-chirho",
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const readOnlyStateProposalDataChirho = (await readOnlyStateProposalResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      readOnlyStateProposalResponseChirho.status === 400,
      `expected read-only-state repair proposal HTTP 400, got ${readOnlyStateProposalResponseChirho.status}`
    );
    assertCheckChirho(readOnlyStateProposalDataChirho.okChirho === false, "read-only-state repair proposal unexpectedly returned ok");
    assertCheckChirho(
      String(readOnlyStateProposalDataChirho.errorChirho ?? "").includes("write-capable review state"),
      `read-only-state repair proposal failed for the wrong reason: ${String(readOnlyStateProposalDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(!existsSync(segmentRepairProposalsPathChirho), "read-only-state repair proposal wrote a proposal file");
    const validProposalResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/segment-repair-proposal-chirho`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cf-Access-Authenticated-User-Email": "forged-cf-reviewer-chirho",
        "X-Webauth-User": "dr-pass-c-header-reviewer-chirho",
      },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        reviewStateChirho: "pending-chirho",
        repairKindChirho: "script-text-chirho",
        proposedSpansChirho: validProposalSpansChirho,
        rationaleChirho: "guard check stores a draft proposal without certifying or mutating span files",
        reviewerChirho: "hallelujah-chirho",
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const validProposalDataChirho = (await validProposalResponseChirho.json()) as {
      okChirho?: boolean;
      proposalChirho?: { statusChirho?: string; reviewerChirho?: string; proposedSpansChirho?: unknown[] };
      errorChirho?: string;
    };
    assertCheckChirho(
      validProposalResponseChirho.ok,
      `valid repair proposal failed: ${validProposalResponseChirho.status} ${String(validProposalDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(validProposalDataChirho.proposalChirho?.statusChirho === "draft-chirho", "valid repair proposal was not stored as draft");
    assertCheckChirho(
      validProposalDataChirho.proposalChirho?.reviewerChirho === "dr-pass-c-header-reviewer-chirho",
      "valid repair proposal did not store trusted proxy reviewer"
    );
    const proposalStoreChirho = JSON.parse(readFileSync(segmentRepairProposalsPathChirho, "utf8")) as {
      proposalsChirho?: unknown[];
    };
    assertCheckChirho(proposalStoreChirho.proposalsChirho?.length === 1, "valid repair proposal did not write one proposal");
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "valid repair proposal persisted a validation row"
    );
    const missingCleanAckResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
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
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
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
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
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
    const issueWithCleanAckResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: ["letters-chirho"],
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "guard check should reject a contradictory issue plus clean acknowledgement",
        scriptVerdictChirho: "",
        reviewerChirho: "hallelujah-chirho",
        certifyCleanChirho: true,
        ...displayGuardForItemChirho(itemChirho),
      }),
    });
    const issueWithCleanAckDataChirho = (await issueWithCleanAckResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      issueWithCleanAckResponseChirho.status === 400,
      `expected issue-with-clean-ack HTTP 400, got ${issueWithCleanAckResponseChirho.status}`
    );
    assertCheckChirho(
      issueWithCleanAckDataChirho.okChirho === false,
      "issue with clean acknowledgement unexpectedly returned ok"
    );
    assertCheckChirho(
      String(issueWithCleanAckDataChirho.errorChirho ?? "").includes("certifyCleanChirho cannot be true when issueFlagsChirho are present"),
      `issue with clean acknowledgement failed for the wrong reason: ${String(issueWithCleanAckDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho,
      "issue with clean acknowledgement persisted a row"
    );
    const editedNoIssueResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
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
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
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
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
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
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
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
    assertCheckChirho(
      latestValidationReviewerChirho(dbPathChirho) === "dr-pass-c-header-reviewer-chirho",
      "valid clean POST stored client-supplied or fallback reviewer instead of trusted proxy reviewer"
    );
    const validIssueResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cf-Access-Authenticated-User-Email": "forged-cf-reviewer-chirho",
        "X-Webauth-User": "dr-pass-c-header-reviewer-chirho",
      },
      body: JSON.stringify({
        keyChirho: itemChirho.keyChirho,
        issueFlagsChirho: ["letters-chirho"],
        correctedTextChirho: itemChirho.liveSpanTextChirho,
        notesChirho: "server guard check records a concrete issue for disposable Pass-C review state",
        scriptVerdictChirho: "",
        reviewerChirho: "human-chirho",
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
      latestValidationReviewerChirho(dbPathChirho) === "dr-pass-c-header-reviewer-chirho",
      "valid issue POST did not store trusted proxy reviewer"
    );
    assertCheckChirho(
      currentNonUndoValidationRowCountChirho(dbPathChirho) === currentNonUndoRowsBeforeChirho + 1,
      "valid clean+issue POSTs left the wrong current non-undo row count"
    );
    const latestGuardChirho = latestValidationGuardFromDbChirho(dbPathChirho);
    const staleUndoResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/undo-last-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
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
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
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
    const validAttributionRereviewResponseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/submit-chirho`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...TRUSTED_REVIEWER_HEADERS_CHIRHO },
      body: JSON.stringify({
        keyChirho: attributionBlockedItemChirho.keyChirho,
        issueFlagsChirho: [],
        correctedTextChirho: attributionBlockedItemChirho.liveSpanTextChirho,
        notesChirho: "",
        scriptVerdictChirho: "",
        reviewerChirho: "hallelujah-chirho",
        certifyCleanChirho: true,
        supersedeAttributionBlockedChirho: true,
        ...displayGuardForItemChirho(attributionBlockedItemChirho),
      }),
    });
    const validAttributionRereviewDataChirho = (await validAttributionRereviewResponseChirho.json()) as {
      okChirho?: boolean;
      errorChirho?: string;
    };
    assertCheckChirho(
      validAttributionRereviewResponseChirho.ok,
      `valid attribution re-review POST failed: ${validAttributionRereviewResponseChirho.status} ${String(validAttributionRereviewDataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(
      validationRowCountChirho(dbPathChirho) === validationRowsBeforeChirho + 4,
      "valid attribution re-review POST did not append one row"
    );
    assertCheckChirho(
      currentNonUndoValidationRowCountChirho(dbPathChirho) === currentNonUndoRowsBeforeChirho,
      "valid attribution re-review changed the current non-undo row count"
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
