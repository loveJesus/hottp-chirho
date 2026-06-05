// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify the Latin/symbol browser review server rejects unsafe direct POSTs.
 *
 * The check runs the real server with disposable DB/backup/policy paths so a
 * guard regression cannot mutate production Latin/symbol review state.
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { createServer as createNetServerChirho } from "net";
import { tmpdir } from "os";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-latin-symbol-review-server-guards-chirho";
const LATIN_SYMBOL_REVIEW_GUIDANCE_SNIPPETS_CHIRHO = [
  "Current codepoints",
  "mathematical alphanumeric symbol",
  "Latin letter with diacritic/extension",
  "not equal sign",
  "Greek final sigma",
  "Dagesh/mappiq/shuruk",
  "Quickstart",
  "/quickstart-chirho",
  "Recommended Latin/symbol lanes",
  "Witness sigla",
  "symbol-risk-chirho=nontrivial-symbol-chirho",
  "volume-chirho=vol-5-chirho",
  "A clean acceptance requires the checkbox below.",
  "Check a flag and write a note for any wrong letter/digit/siglum, punctuation, spacing, crop, split, missing text, or extra text.",
  "I checked the target crop and full line against the print; if no issue flags are checked, this item is intentionally accepted clean.",
  "clean acceptance checkbox required",
  "clean acceptance covers only this target crop and current text, with exact letters/digits/sigla, punctuation, spacing, and segmentation checked against the full line.",
];
const LATIN_SYMBOL_QUICKSTART_SNIPPETS_CHIRHO = [
  "Latin/Symbol Human Review Quickstart Chirho",
  "Symbol Risk",
  "Witness sigla matter",
  "When uncertain, skip or save an issue",
];

interface LatinSymbolReviewStateItemChirho {
  idChirho: string;
  itemKindChirho: string;
  scriptChirho: string;
  sourceChirho: string;
  textChirho: string;
  lineTextChirho: string;
  sourceImageHashChirho: string;
  targetImageHashChirho: string;
  lineImageHashChirho: string;
  targetMarkdownPathChirho: string;
  lineMarkdownPathChirho: string;
}

interface LatinSymbolReviewStateResponseChirho {
  okChirho?: boolean;
  errorChirho?: string;
  itemsChirho?: LatinSymbolReviewStateItemChirho[];
}

interface LatinSymbolReviewPostResponseChirho {
  okChirho?: boolean;
  errorChirho?: string;
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
  throw new Error(`temporary Latin/symbol review server did not become ready: ${lastErrorChirho}`);
}

async function processOutputChirho(processChirho: Bun.Subprocess): Promise<string> {
  const stdoutChirho =
    processChirho.stdout instanceof ReadableStream ? await new Response(processChirho.stdout).text() : "";
  const stderrChirho =
    processChirho.stderr instanceof ReadableStream ? await new Response(processChirho.stderr).text() : "";
  return [stdoutChirho, stderrChirho].filter((valueChirho) => valueChirho.length > 0).join("\n");
}

function reviewRowCountChirho(dbPathChirho: string): number {
  if (!existsSync(dbPathChirho)) return 0;
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const tableRowChirho = dbChirho
      .query<{ countChirho: number }, []>(
        "SELECT COUNT(*) AS countChirho FROM sqlite_master WHERE type = 'table' AND name = 'latin_symbol_vision_reviews_chirho'"
      )
      .get();
    if ((tableRowChirho?.countChirho ?? 0) === 0) return 0;
    const countRowChirho = dbChirho
      .query<{ countChirho: number }, []>("SELECT COUNT(*) AS countChirho FROM latin_symbol_vision_reviews_chirho")
      .get();
    return countRowChirho?.countChirho ?? 0;
  } finally {
    dbChirho.close();
  }
}

async function stateItemChirho(portChirho: number): Promise<LatinSymbolReviewStateItemChirho> {
  const responseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/state-chirho`);
  const dataChirho = (await responseChirho.json()) as LatinSymbolReviewStateResponseChirho;
  assertCheckChirho(responseChirho.ok, `state request failed: ${responseChirho.status}`);
  assertCheckChirho(dataChirho.okChirho === true, `state request returned not-ok: ${String(dataChirho.errorChirho ?? "")}`);
  const itemChirho = dataChirho.itemsChirho?.find((candidateChirho) =>
    [
      candidateChirho.idChirho,
      candidateChirho.itemKindChirho,
      candidateChirho.scriptChirho,
      candidateChirho.sourceChirho,
      candidateChirho.textChirho,
      candidateChirho.lineTextChirho,
      candidateChirho.sourceImageHashChirho,
      candidateChirho.targetImageHashChirho,
      candidateChirho.lineImageHashChirho,
      candidateChirho.targetMarkdownPathChirho,
      candidateChirho.lineMarkdownPathChirho,
    ].every((valueChirho) => typeof valueChirho === "string")
  );
  if (itemChirho === undefined) throw new Error("Latin/symbol review queue has no item for guard check");
  return itemChirho;
}

async function assertLatinSymbolReviewGuidanceHtmlChirho(portChirho: number): Promise<void> {
  const responseChirho = await fetch(`http://127.0.0.1:${portChirho}/`);
  const htmlChirho = await responseChirho.text();
  assertCheckChirho(responseChirho.ok, `Latin/symbol page request failed: ${responseChirho.status}`);
  for (const snippetChirho of LATIN_SYMBOL_REVIEW_GUIDANCE_SNIPPETS_CHIRHO) {
    assertCheckChirho(
      htmlChirho.includes(snippetChirho),
      `Latin/symbol review server HTML is missing guidance snippet: ${snippetChirho}`
    );
  }
}

async function assertLatinSymbolQuickstartEndpointChirho(portChirho: number): Promise<void> {
  const responseChirho = await fetch(`http://127.0.0.1:${portChirho}/quickstart-chirho`);
  const markdownChirho = await responseChirho.text();
  assertCheckChirho(responseChirho.ok, `Latin/symbol quickstart request failed: ${responseChirho.status}`);
  for (const snippetChirho of LATIN_SYMBOL_QUICKSTART_SNIPPETS_CHIRHO) {
    assertCheckChirho(
      markdownChirho.includes(snippetChirho),
      `Latin/symbol quickstart is missing snippet: ${snippetChirho}`
    );
  }
}

function displayGuardForItemChirho(itemChirho: LatinSymbolReviewStateItemChirho): Record<string, unknown> {
  return {
    expectedItemKindChirho: itemChirho.itemKindChirho,
    expectedScriptChirho: itemChirho.scriptChirho,
    expectedSourceChirho: itemChirho.sourceChirho,
    expectedTextChirho: itemChirho.textChirho,
    expectedLineTextChirho: itemChirho.lineTextChirho,
    expectedSourceImageHashChirho: itemChirho.sourceImageHashChirho,
    expectedTargetImageHashChirho: itemChirho.targetImageHashChirho,
    expectedLineImageHashChirho: itemChirho.lineImageHashChirho,
    expectedTargetMarkdownPathChirho: itemChirho.targetMarkdownPathChirho,
    expectedLineMarkdownPathChirho: itemChirho.lineMarkdownPathChirho,
  };
}

async function postReviewChirho(
  portChirho: number,
  bodyChirho: Record<string, unknown>
): Promise<{ responseChirho: Response; dataChirho: LatinSymbolReviewPostResponseChirho }> {
  const responseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/review-chirho`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyChirho),
  });
  const dataChirho = (await responseChirho.json()) as LatinSymbolReviewPostResponseChirho;
  return { responseChirho, dataChirho };
}

function assertReviewRejectedChirho(paramsChirho: {
  labelChirho: string;
  responseChirho: Response;
  dataChirho: LatinSymbolReviewPostResponseChirho;
  dbPathChirho: string;
}): void {
  assertCheckChirho(
    paramsChirho.responseChirho.status === 400,
    `${paramsChirho.labelChirho} expected HTTP 400, got ${paramsChirho.responseChirho.status}`
  );
  assertCheckChirho(paramsChirho.dataChirho.okChirho === false, `${paramsChirho.labelChirho} unexpectedly returned ok`);
  assertCheckChirho(
    reviewRowCountChirho(paramsChirho.dbPathChirho) === 0,
    `${paramsChirho.labelChirho} persisted a review row`
  );
}

async function mainChirho(): Promise<void> {
  const tempDirChirho = mkdtempSync(join(tmpdir(), "latin-symbol-review-server-guard-chirho-"));
  const dbPathChirho = join(tempDirChirho, "latin-symbol-review-guard-chirho.sqlite");
  const backupPathChirho = join(tempDirChirho, "latin-symbol-review-guard-backup-chirho.json");
  const policyPathChirho = join(tempDirChirho, "latin-symbol-acceptance-policy-chirho.json");
  const portChirho = await freePortChirho();
  const processChirho = Bun.spawn(
    [
      process.execPath,
      "run",
      "src-chirho/latin-symbol-vision-review-server-chirho.ts",
      `--port=${portChirho}`,
      `--db=${dbPathChirho}`,
      `--backup=${backupPathChirho}`,
      `--policy=${policyPathChirho}`,
    ],
    {
      cwd: PROJECT_ROOT_CHIRHO,
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  try {
    await waitForServerChirho(portChirho, processChirho);
    await assertLatinSymbolReviewGuidanceHtmlChirho(portChirho);
    await assertLatinSymbolQuickstartEndpointChirho(portChirho);
    const itemChirho = await stateItemChirho(portChirho);
    const commonBodyChirho = {
      idChirho: itemChirho.idChirho,
      reviewerChirho: "dr-latin-symbol-server-guard-chirho",
      ...displayGuardForItemChirho(itemChirho),
    };
    const staleDisplayResultChirho = await postReviewChirho(portChirho, {
      ...commonBodyChirho,
      issueFlagsChirho: [],
      acceptCleanChirho: true,
      expectedLineTextChirho: `${itemChirho.lineTextChirho} stale-display-guard-chirho`,
    });
    assertCheckChirho(
      staleDisplayResultChirho.responseChirho.status === 409,
      `stale display expected HTTP 409, got ${staleDisplayResultChirho.responseChirho.status}`
    );
    assertCheckChirho(staleDisplayResultChirho.dataChirho.okChirho === false, "stale display unexpectedly returned ok");
    assertCheckChirho(
      String(staleDisplayResultChirho.dataChirho.errorChirho ?? "").includes("Latin/symbol review item is stale"),
      `stale display failed for wrong reason: ${String(staleDisplayResultChirho.dataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(reviewRowCountChirho(dbPathChirho) === 0, "stale display POST persisted a review row");
    const missingCleanAckResultChirho = await postReviewChirho(portChirho, {
      ...commonBodyChirho,
      issueFlagsChirho: [],
      acceptCleanChirho: false,
    });
    assertReviewRejectedChirho({
      labelChirho: "missing accepted-clean acknowledgement",
      responseChirho: missingCleanAckResultChirho.responseChirho,
      dataChirho: missingCleanAckResultChirho.dataChirho,
      dbPathChirho,
    });
    assertCheckChirho(
      String(missingCleanAckResultChirho.dataChirho.errorChirho ?? "").includes("acceptCleanChirho acknowledgement is required"),
      `missing accepted-clean acknowledgement failed for wrong reason: ${String(missingCleanAckResultChirho.dataChirho.errorChirho ?? "")}`
    );
    const nonArrayIssueFlagsResultChirho = await postReviewChirho(portChirho, {
      ...commonBodyChirho,
      issueFlagsChirho: "punctuation-chirho",
      acceptCleanChirho: true,
    });
    assertReviewRejectedChirho({
      labelChirho: "non-array issue flags",
      responseChirho: nonArrayIssueFlagsResultChirho.responseChirho,
      dataChirho: nonArrayIssueFlagsResultChirho.dataChirho,
      dbPathChirho,
    });
    assertCheckChirho(
      String(nonArrayIssueFlagsResultChirho.dataChirho.errorChirho ?? "").includes("issueFlagsChirho must be an array"),
      `non-array issue flags failed for wrong reason: ${String(nonArrayIssueFlagsResultChirho.dataChirho.errorChirho ?? "")}`
    );
    const unknownIssueFlagResultChirho = await postReviewChirho(portChirho, {
      ...commonBodyChirho,
      issueFlagsChirho: ["punctuation-typo-chirho"],
      acceptCleanChirho: true,
      notesChirho: "unknown issue flag must not be silently converted to accepted-clean",
    });
    assertReviewRejectedChirho({
      labelChirho: "unknown issue flag",
      responseChirho: unknownIssueFlagResultChirho.responseChirho,
      dataChirho: unknownIssueFlagResultChirho.dataChirho,
      dbPathChirho,
    });
    assertCheckChirho(
      String(unknownIssueFlagResultChirho.dataChirho.errorChirho ?? "").includes("unknown issue flag punctuation-typo-chirho"),
      `unknown issue flag failed for wrong reason: ${String(unknownIssueFlagResultChirho.dataChirho.errorChirho ?? "")}`
    );
    const machineCleanResultChirho = await postReviewChirho(portChirho, {
      ...commonBodyChirho,
      issueFlagsChirho: [],
      reviewerChirho: "codex-gpt5-chirho",
      acceptCleanChirho: true,
    });
    assertReviewRejectedChirho({
      labelChirho: "machine accepted-clean",
      responseChirho: machineCleanResultChirho.responseChirho,
      dataChirho: machineCleanResultChirho.dataChirho,
      dbPathChirho,
    });
    assertCheckChirho(
      String(machineCleanResultChirho.dataChirho.errorChirho ?? "").includes("machine reviewer codex-gpt5-chirho cannot certify"),
      `machine accepted-clean failed for wrong reason: ${String(machineCleanResultChirho.dataChirho.errorChirho ?? "")}`
    );
    const genericCleanResultChirho = await postReviewChirho(portChirho, {
      ...commonBodyChirho,
      issueFlagsChirho: [],
      reviewerChirho: "human-chirho",
      acceptCleanChirho: true,
    });
    assertReviewRejectedChirho({
      labelChirho: "generic accepted-clean",
      responseChirho: genericCleanResultChirho.responseChirho,
      dataChirho: genericCleanResultChirho.dataChirho,
      dbPathChirho,
    });
    assertCheckChirho(
      String(genericCleanResultChirho.dataChirho.errorChirho ?? "").includes("must identify the explicit reviewer, not generic human-chirho"),
      `generic accepted-clean failed for wrong reason: ${String(genericCleanResultChirho.dataChirho.errorChirho ?? "")}`
    );
    const genericIssueResultChirho = await postReviewChirho(portChirho, {
      ...commonBodyChirho,
      issueFlagsChirho: ["punctuation-chirho"],
      reviewerChirho: "human-chirho",
      notesChirho: "server guard check should reject generic reviewer before persistence",
    });
    assertReviewRejectedChirho({
      labelChirho: "generic issue reviewer",
      responseChirho: genericIssueResultChirho.responseChirho,
      dataChirho: genericIssueResultChirho.dataChirho,
      dbPathChirho,
    });
    assertCheckChirho(
      String(genericIssueResultChirho.dataChirho.errorChirho ?? "").includes("must identify the explicit reviewer, not generic human-chirho"),
      `generic issue reviewer failed for wrong reason: ${String(genericIssueResultChirho.dataChirho.errorChirho ?? "")}`
    );
    const placeholderResultChirho = await postReviewChirho(portChirho, {
      ...commonBodyChirho,
      issueFlagsChirho: ["punctuation-chirho"],
      notesChirho: "<why this issue is recorded>",
    });
    assertReviewRejectedChirho({
      labelChirho: "placeholder issue notes",
      responseChirho: placeholderResultChirho.responseChirho,
      dataChirho: placeholderResultChirho.dataChirho,
      dbPathChirho,
    });
    assertCheckChirho(
      String(placeholderResultChirho.dataChirho.errorChirho ?? "").includes("template placeholder"),
      `placeholder issue notes failed for wrong reason: ${String(placeholderResultChirho.dataChirho.errorChirho ?? "")}`
    );
    const missingNotesResultChirho = await postReviewChirho(portChirho, {
      ...commonBodyChirho,
      issueFlagsChirho: ["punctuation-chirho"],
      notesChirho: "   ",
    });
    assertReviewRejectedChirho({
      labelChirho: "missing issue notes",
      responseChirho: missingNotesResultChirho.responseChirho,
      dataChirho: missingNotesResultChirho.dataChirho,
      dbPathChirho,
    });
    assertCheckChirho(
      String(missingNotesResultChirho.dataChirho.errorChirho ?? "").includes("notesChirho is required"),
      `missing issue notes failed for wrong reason: ${String(missingNotesResultChirho.dataChirho.errorChirho ?? "")}`
    );
    const validCleanResultChirho = await postReviewChirho(portChirho, {
      ...commonBodyChirho,
      issueFlagsChirho: [],
      acceptCleanChirho: true,
    });
    assertCheckChirho(
      validCleanResultChirho.responseChirho.ok,
      `valid accepted-clean POST failed: ${validCleanResultChirho.responseChirho.status} ${String(validCleanResultChirho.dataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(reviewRowCountChirho(dbPathChirho) === 1, "valid accepted-clean POST did not write one disposable row");
    const validIssueResultChirho = await postReviewChirho(portChirho, {
      ...commonBodyChirho,
      issueFlagsChirho: ["punctuation-chirho"],
      notesChirho: "server guard check records a concrete punctuation concern for a disposable review row",
    });
    assertCheckChirho(
      validIssueResultChirho.responseChirho.ok,
      `valid issue POST failed: ${validIssueResultChirho.responseChirho.status} ${String(validIssueResultChirho.dataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(reviewRowCountChirho(dbPathChirho) === 2, "valid issue POST did not append one disposable row");
    assertCheckChirho(existsSync(backupPathChirho), "valid issue POST did not refresh disposable backup");
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
  console.log(`[${MODULE_CHIRHO}] Latin/symbol review server guards passed`);
}

if (import.meta.main) {
  mainChirho().catch((errorChirho) => {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  });
}
