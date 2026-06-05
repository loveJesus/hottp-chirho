// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify the Pass-C human review server rejects machine-authored issue rows.
 *
 * The test uses a disposable DB/backup and a temporary server port so a guard
 * regression cannot mutate real review state.
 */

import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createServer as createNetServerChirho } from "net";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-pass-c-human-review-server-guards-chirho";
const SOURCE_PROGRESS_DB_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite");

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

function firstQueueItemFromHtmlChirho(htmlChirho: string): RawReviewQueueItemChirho {
  const matchChirho = htmlChirho.match(/const queueChirho = (.*?);\n\s+const queueModeChirho/s);
  if (matchChirho === null) throw new Error("could not find queueChirho JSON in raw review server HTML");
  const queueChirho = JSON.parse(matchChirho[1]!) as RawReviewQueueItemChirho[];
  const itemChirho = queueChirho[0];
  if (itemChirho === undefined) throw new Error("raw review queue is empty; cannot run guard check");
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

async function mainChirho(): Promise<void> {
  const tempDirChirho = mkdtempSync(join(tmpdir(), "pass-c-human-review-guard-chirho-"));
  const dbPathChirho = join(tempDirChirho, "review-guard-chirho.sqlite");
  const backupPathChirho = join(tempDirChirho, "review-guard-backup-chirho.json");
  copyProgressDbSnapshotChirho(dbPathChirho);
  const validationRowsBeforeChirho = validationRowCountChirho(dbPathChirho);
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
    const itemChirho = firstQueueItemFromHtmlChirho(pageHtmlChirho);
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
