// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify the non-Latin expert review server rejects unsafe direct POSTs.
 *
 * The check runs the real server with a disposable policy path so guard
 * regressions cannot mutate production expert-confirmation state.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createServer as createNetServerChirho } from "net";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO,
  VISION_TIER_EXPERT_CONFIRMATION_REVIEWED_ISSUES_CHIRHO,
  type VisionTierExpertConfirmationFileChirho,
} from "./vision-tier-expert-confirmation-policy-chirho.ts";

const MODULE_CHIRHO = "check-vision-tier-expert-review-server-guards-chirho";
const EXPERT_REVIEW_GUIDANCE_SNIPPETS_CHIRHO = [
  "Current codepoints",
  "Greek omicron",
  "rough breathing",
  "Greek final sigma",
  "Hebrew letter alef",
  "Dagesh/mappiq/shuruk",
  "Dry-run after exact script-reader transcription",
  "Apply after dry-run verification",
  "Exact supplied text for command",
  "This helper field only updates the copied command; it does not save, apply, confirm, or certify.",
  "bun run apply-expert-supplied-vision-text-chirho",
  "--expected-source-sha256-chirho",
  "--expected-packet-sha256-chirho",
  "Copy command",
  "Quickstart",
  "/quickstart-chirho",
  "Recommended expert lanes",
  "Blank Syriac handoff",
  "script-chirho=hebrew-chirho",
  "script-chirho=hebrew-chirho&source-chirho=explicit-span-chirho",
  "script-chirho=hebrew-chirho&source-chirho=d1-derived-chirho",
  "script-chirho=greek-chirho&source-chirho=pass-c-ocr-span-chirho",
  "script-chirho=greek-chirho&source-chirho=explicit-span-chirho",
  "script-chirho=syriac-chirho&source-chirho=explicit-span-chirho",
  "script-chirho=syriac-chirho&source-chirho=pass-c-ocr-span-chirho",
  "script-chirho=arabic-chirho&source-chirho=explicit-span-chirho",
  "text-state-chirho=nonblank-chirho",
  "Target span",
  "Confirm only if you can certify this script's exact letters and relevant marks against the printed line.",
  "If this is outside your competence or uncertain, use Report issue for crop/source/segmentation problems or Skip.",
  "This item has no current text. Do not confirm an empty transcription",
  "blank text means supply only the script text inside the red box, not neighboring punctuation or context",
  "Confirm needs exact-certification checkbox",
  "Report issue needs an issue flag",
];
const EXPERT_QUICKSTART_SNIPPETS_CHIRHO = [
  "Vision-Tier Expert Confirmation Quickstart Chirho",
  "Confirm Only If",
  "Report Issue",
  "Blank Text",
  "expert-supplied text",
];

interface ExpertReviewStateItemChirho {
  idChirho: string;
  reviewerChirho: string;
  scriptChirho: string;
  visionSourceChirho: string;
  volumeChirho: number;
  currentTextChirho: string;
  sourcePathChirho: string;
  packetPathChirho: string;
  markdownPathChirho: string;
  spanXMinPxChirho: number;
  spanWidthPxChirho: number;
  lineWidthPxChirho: number;
  markerLeftPctChirho: number;
  markerWidthPctChirho: number;
  textIsBlankChirho?: boolean;
}

interface ExpertReviewStateResponseChirho {
  okChirho?: boolean;
  errorChirho?: string;
  itemsChirho?: ExpertReviewStateItemChirho[];
}

interface ExpertReviewPostResponseChirho {
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
  throw new Error(`temporary expert review server did not become ready: ${lastErrorChirho}`);
}

async function processOutputChirho(processChirho: Bun.Subprocess): Promise<string> {
  const stdoutChirho =
    processChirho.stdout instanceof ReadableStream ? await new Response(processChirho.stdout).text() : "";
  const stderrChirho =
    processChirho.stderr instanceof ReadableStream ? await new Response(processChirho.stderr).text() : "";
  return [stdoutChirho, stderrChirho].filter((valueChirho) => valueChirho.length > 0).join("\n");
}

function displayGuardForItemChirho(itemChirho: ExpertReviewStateItemChirho): Record<string, unknown> {
  return {
    expectedScriptChirho: itemChirho.scriptChirho,
    expectedReviewerChirho: itemChirho.reviewerChirho,
    expectedVisionSourceChirho: itemChirho.visionSourceChirho,
    expectedCurrentTextChirho: itemChirho.currentTextChirho,
    expectedSourcePathChirho: itemChirho.sourcePathChirho,
    expectedPacketPathChirho: itemChirho.packetPathChirho,
    expectedMarkdownPathChirho: itemChirho.markdownPathChirho,
    expectedSpanXMinPxChirho: itemChirho.spanXMinPxChirho,
    expectedSpanWidthPxChirho: itemChirho.spanWidthPxChirho,
    expectedLineWidthPxChirho: itemChirho.lineWidthPxChirho,
  };
}

async function postJsonChirho(
  portChirho: number,
  pathChirho: string,
  bodyChirho: Record<string, unknown>
): Promise<{ responseChirho: Response; dataChirho: ExpertReviewPostResponseChirho }> {
  const responseChirho = await fetch(`http://127.0.0.1:${portChirho}${pathChirho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyChirho),
  });
  const dataChirho = (await responseChirho.json()) as ExpertReviewPostResponseChirho;
  return { responseChirho, dataChirho };
}

async function stateItemChirho(portChirho: number): Promise<ExpertReviewStateItemChirho> {
  const responseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/state-chirho`);
  const dataChirho = (await responseChirho.json()) as ExpertReviewStateResponseChirho;
  assertCheckChirho(responseChirho.ok, `state request failed: ${responseChirho.status}`);
  assertCheckChirho(dataChirho.okChirho === true, `state request returned not-ok: ${String(dataChirho.errorChirho ?? "")}`);
  const itemChirho = dataChirho.itemsChirho?.find(
    (candidateChirho) =>
      typeof candidateChirho.currentTextChirho === "string" &&
      candidateChirho.currentTextChirho.trim().length > 0 &&
      candidateChirho.textIsBlankChirho !== true
  );
  if (itemChirho === undefined) throw new Error("expert review queue has no nonblank item for guard check");
  assertCheckChirho(
    Number.isFinite(itemChirho.markerLeftPctChirho) &&
      Number.isFinite(itemChirho.markerWidthPctChirho) &&
      itemChirho.markerWidthPctChirho > 0,
    "expert review queue item lacks a usable span marker"
  );
  return itemChirho;
}

async function assertExpertReviewGuidanceHtmlChirho(portChirho: number): Promise<void> {
  const responseChirho = await fetch(`http://127.0.0.1:${portChirho}/`);
  const htmlChirho = await responseChirho.text();
  assertCheckChirho(responseChirho.ok, `expert page request failed: ${responseChirho.status}`);
  for (const snippetChirho of EXPERT_REVIEW_GUIDANCE_SNIPPETS_CHIRHO) {
    assertCheckChirho(
      htmlChirho.includes(snippetChirho),
      `expert review server HTML is missing guidance snippet: ${snippetChirho}`
    );
  }
}

async function assertExpertQuickstartEndpointChirho(portChirho: number): Promise<void> {
  const responseChirho = await fetch(`http://127.0.0.1:${portChirho}/quickstart-chirho`);
  const markdownChirho = await responseChirho.text();
  assertCheckChirho(responseChirho.ok, `expert quickstart request failed: ${responseChirho.status}`);
  for (const snippetChirho of EXPERT_QUICKSTART_SNIPPETS_CHIRHO) {
    assertCheckChirho(
      markdownChirho.includes(snippetChirho),
      `expert quickstart is missing snippet: ${snippetChirho}`
    );
  }
}

async function blankStateItemChirho(portChirho: number): Promise<ExpertReviewStateItemChirho | null> {
  const responseChirho = await fetch(`http://127.0.0.1:${portChirho}/api-chirho/state-chirho`);
  const dataChirho = (await responseChirho.json()) as ExpertReviewStateResponseChirho;
  assertCheckChirho(responseChirho.ok, `blank-state request failed: ${responseChirho.status}`);
  assertCheckChirho(dataChirho.okChirho === true, `blank-state request returned not-ok: ${String(dataChirho.errorChirho ?? "")}`);
  return dataChirho.itemsChirho?.find(
    (candidateChirho) =>
      typeof candidateChirho.currentTextChirho === "string" &&
      candidateChirho.currentTextChirho.trim().length === 0 &&
      candidateChirho.textIsBlankChirho === true
  ) ?? null;
}

function assertPlaceholderRejectedChirho(paramsChirho: {
  labelChirho: string;
  responseChirho: Response;
  dataChirho: ExpertReviewPostResponseChirho;
  policyPathChirho: string;
}): void {
  assertCheckChirho(
    paramsChirho.responseChirho.status === 400,
    `${paramsChirho.labelChirho} expected HTTP 400, got ${paramsChirho.responseChirho.status}`
  );
  assertCheckChirho(paramsChirho.dataChirho.okChirho === false, `${paramsChirho.labelChirho} unexpectedly returned ok`);
  assertCheckChirho(
    String(paramsChirho.dataChirho.errorChirho ?? "").includes("template placeholder"),
    `${paramsChirho.labelChirho} failed for wrong reason: ${String(paramsChirho.dataChirho.errorChirho ?? "")}`
  );
  assertCheckChirho(!existsSync(paramsChirho.policyPathChirho), `${paramsChirho.labelChirho} wrote a policy file`);
}

function assertRejectedWithoutPolicyChirho(paramsChirho: {
  labelChirho: string;
  responseChirho: Response;
  dataChirho: ExpertReviewPostResponseChirho;
  policyPathChirho: string;
  expectedErrorChirho: string;
}): void {
  assertCheckChirho(
    paramsChirho.responseChirho.status === 400,
    `${paramsChirho.labelChirho} expected HTTP 400, got ${paramsChirho.responseChirho.status}`
  );
  assertCheckChirho(paramsChirho.dataChirho.okChirho === false, `${paramsChirho.labelChirho} unexpectedly returned ok`);
  assertCheckChirho(
    String(paramsChirho.dataChirho.errorChirho ?? "").includes(paramsChirho.expectedErrorChirho),
    `${paramsChirho.labelChirho} failed for wrong reason: ${String(paramsChirho.dataChirho.errorChirho ?? "")}`
  );
  assertCheckChirho(!existsSync(paramsChirho.policyPathChirho), `${paramsChirho.labelChirho} wrote a policy file`);
}

function policyFileChirho(pathChirho: string): VisionTierExpertConfirmationFileChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as VisionTierExpertConfirmationFileChirho;
}

async function mainChirho(): Promise<void> {
  const tempDirChirho = mkdtempSync(join(tmpdir(), "expert-review-server-guard-chirho-"));
  const policyPathChirho = join(tempDirChirho, "expert-confirmations-chirho.json");
  const portChirho = await freePortChirho();
  const processChirho = Bun.spawn(
    [
      process.execPath,
      "run",
      "src-chirho/vision-tier-expert-review-server-chirho.ts",
      `--port=${portChirho}`,
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
    await assertExpertReviewGuidanceHtmlChirho(portChirho);
    await assertExpertQuickstartEndpointChirho(portChirho);
    const itemChirho = await stateItemChirho(portChirho);
    const blankItemChirho = await blankStateItemChirho(portChirho);
    const commonBodyChirho = {
      idChirho: itemChirho.idChirho,
      reviewerChirho: "dr-smith-human-reviewer-chirho",
      reviewerRoleChirho: itemChirho.reviewerChirho,
      ...displayGuardForItemChirho(itemChirho),
    };
    if (blankItemChirho !== null) {
      const blankConfirmResultChirho = await postJsonChirho(portChirho, "/api-chirho/confirm-chirho", {
        idChirho: blankItemChirho.idChirho,
        reviewerChirho: "dr-smith-human-reviewer-chirho",
        reviewerRoleChirho: blankItemChirho.reviewerChirho,
        ...displayGuardForItemChirho(blankItemChirho),
        rationaleChirho: "server guard check should reject confirming an intentionally blank expert item",
        certifyExactChirho: true,
      });
      assertRejectedWithoutPolicyChirho({
        labelChirho: "blank confirm",
        responseChirho: blankConfirmResultChirho.responseChirho,
        dataChirho: blankConfirmResultChirho.dataChirho,
        policyPathChirho,
        expectedErrorChirho: "blank currentTextChirho cannot be confirmed",
      });
    }
    const staleDisplayResultChirho = await postJsonChirho(portChirho, "/api-chirho/confirm-chirho", {
      ...commonBodyChirho,
      expectedCurrentTextChirho: `${itemChirho.currentTextChirho} stale-display-guard-chirho`,
      rationaleChirho: "server guard check should reject stale displayed expert text",
      certifyExactChirho: true,
    });
    assertCheckChirho(
      staleDisplayResultChirho.responseChirho.status === 409,
      `stale display expected HTTP 409, got ${staleDisplayResultChirho.responseChirho.status}`
    );
    assertCheckChirho(staleDisplayResultChirho.dataChirho.okChirho === false, "stale display unexpectedly returned ok");
    assertCheckChirho(
      String(staleDisplayResultChirho.dataChirho.errorChirho ?? "").includes("Expert review item is stale"),
      `stale display failed for wrong reason: ${String(staleDisplayResultChirho.dataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(!existsSync(policyPathChirho), "stale display wrote a policy file");
    const missingCertifyResultChirho = await postJsonChirho(portChirho, "/api-chirho/confirm-chirho", {
      ...commonBodyChirho,
      rationaleChirho: "server guard check should reject missing exact-certification acknowledgement",
      certifyExactChirho: false,
    });
    assertRejectedWithoutPolicyChirho({
      labelChirho: "missing confirm acknowledgement",
      responseChirho: missingCertifyResultChirho.responseChirho,
      dataChirho: missingCertifyResultChirho.dataChirho,
      policyPathChirho,
      expectedErrorChirho: "certifyExactChirho acknowledgement is required",
    });
    const wrongRoleResultChirho = await postJsonChirho(portChirho, "/api-chirho/confirm-chirho", {
      ...commonBodyChirho,
      reviewerRoleChirho: itemChirho.reviewerChirho === "Hebrew/WLC reviewer" ? "Syriac reader" : "Hebrew/WLC reviewer",
      rationaleChirho: "server guard check should reject a cross-lane reviewer role",
      certifyExactChirho: true,
    });
    assertRejectedWithoutPolicyChirho({
      labelChirho: "wrong confirm reviewer role",
      responseChirho: wrongRoleResultChirho.responseChirho,
      dataChirho: wrongRoleResultChirho.dataChirho,
      policyPathChirho,
      expectedErrorChirho: "reviewerRoleChirho must be",
    });
    const genericConfirmResultChirho = await postJsonChirho(portChirho, "/api-chirho/confirm-chirho", {
      ...commonBodyChirho,
      reviewerChirho: "human-chirho",
      rationaleChirho: "server guard check should reject generic expert confirmation reviewer",
      certifyExactChirho: true,
    });
    assertRejectedWithoutPolicyChirho({
      labelChirho: "generic confirm reviewer",
      responseChirho: genericConfirmResultChirho.responseChirho,
      dataChirho: genericConfirmResultChirho.dataChirho,
      policyPathChirho,
      expectedErrorChirho: "must identify the explicit reviewer, not generic human-chirho",
    });
    const confirmWithIssueFlagsResultChirho = await postJsonChirho(portChirho, "/api-chirho/confirm-chirho", {
      ...commonBodyChirho,
      rationaleChirho: "server guard check should reject confirming while issue flags are present",
      certifyExactChirho: true,
      issueFlagsChirho: ["uncertain-chirho"],
    });
    assertRejectedWithoutPolicyChirho({
      labelChirho: "confirm with issue flags",
      responseChirho: confirmWithIssueFlagsResultChirho.responseChirho,
      dataChirho: confirmWithIssueFlagsResultChirho.dataChirho,
      policyPathChirho,
      expectedErrorChirho: "confirm-chirho cannot include issue flags",
    });
    const genericIssueResultChirho = await postJsonChirho(portChirho, "/api-chirho/issue-chirho", {
      ...commonBodyChirho,
      reviewerChirho: "human-chirho",
      rationaleChirho: "server guard check should reject generic expert issue reviewer",
      issueFlagsChirho: ["uncertain-chirho"],
    });
    assertRejectedWithoutPolicyChirho({
      labelChirho: "generic issue reviewer",
      responseChirho: genericIssueResultChirho.responseChirho,
      dataChirho: genericIssueResultChirho.dataChirho,
      policyPathChirho,
      expectedErrorChirho: "must identify the explicit reviewer, not generic human-chirho",
    });
    const confirmResultChirho = await postJsonChirho(portChirho, "/api-chirho/confirm-chirho", {
      ...commonBodyChirho,
      rationaleChirho: "<why these exact items are confirmed>",
      certifyExactChirho: true,
    });
    assertPlaceholderRejectedChirho({
      labelChirho: "placeholder confirm rationale",
      responseChirho: confirmResultChirho.responseChirho,
      dataChirho: confirmResultChirho.dataChirho,
      policyPathChirho,
    });
    const missingIssueFlagsResultChirho = await postJsonChirho(portChirho, "/api-chirho/issue-chirho", {
      ...commonBodyChirho,
      rationaleChirho: "server guard check should reject issue reports with no issue flag",
      issueFlagsChirho: [],
    });
    assertRejectedWithoutPolicyChirho({
      labelChirho: "missing issue flags",
      responseChirho: missingIssueFlagsResultChirho.responseChirho,
      dataChirho: missingIssueFlagsResultChirho.dataChirho,
      policyPathChirho,
      expectedErrorChirho: "at least one issue flag is required",
    });
    const nonArrayIssueFlagsResultChirho = await postJsonChirho(portChirho, "/api-chirho/issue-chirho", {
      ...commonBodyChirho,
      rationaleChirho: "server guard check should reject non-array expert issue flags",
      issueFlagsChirho: "uncertain-chirho",
    });
    assertRejectedWithoutPolicyChirho({
      labelChirho: "non-array issue flags",
      responseChirho: nonArrayIssueFlagsResultChirho.responseChirho,
      dataChirho: nonArrayIssueFlagsResultChirho.dataChirho,
      policyPathChirho,
      expectedErrorChirho: "issueFlagsChirho must be an array",
    });
    const unknownIssueFlagResultChirho = await postJsonChirho(portChirho, "/api-chirho/issue-chirho", {
      ...commonBodyChirho,
      rationaleChirho: "server guard check should reject unknown expert issue flags",
      issueFlagsChirho: ["uncertain-typo-chirho"],
    });
    assertRejectedWithoutPolicyChirho({
      labelChirho: "unknown issue flag",
      responseChirho: unknownIssueFlagResultChirho.responseChirho,
      dataChirho: unknownIssueFlagResultChirho.dataChirho,
      policyPathChirho,
      expectedErrorChirho: "unsupported issue flag: uncertain-typo-chirho",
    });
    const issueWithCertifyExactResultChirho = await postJsonChirho(portChirho, "/api-chirho/issue-chirho", {
      ...commonBodyChirho,
      rationaleChirho: "server guard check should reject issue reporting with exact-certification acknowledgement",
      issueFlagsChirho: ["uncertain-chirho"],
      certifyExactChirho: true,
    });
    assertRejectedWithoutPolicyChirho({
      labelChirho: "issue with exact-certification acknowledgement",
      responseChirho: issueWithCertifyExactResultChirho.responseChirho,
      dataChirho: issueWithCertifyExactResultChirho.dataChirho,
      policyPathChirho,
      expectedErrorChirho: "issue-chirho cannot include certifyExactChirho=true",
    });
    const issueResultChirho = await postJsonChirho(portChirho, "/api-chirho/issue-chirho", {
      ...commonBodyChirho,
      rationaleChirho: "<why this issue is recorded>",
      issueFlagsChirho: ["uncertain-chirho"],
    });
    assertPlaceholderRejectedChirho({
      labelChirho: "placeholder issue rationale",
      responseChirho: issueResultChirho.responseChirho,
      dataChirho: issueResultChirho.dataChirho,
      policyPathChirho,
    });
    const staleIssueDisplayResultChirho = await postJsonChirho(portChirho, "/api-chirho/issue-chirho", {
      ...commonBodyChirho,
      expectedCurrentTextChirho: `${itemChirho.currentTextChirho} stale-issue-display-guard-chirho`,
      rationaleChirho: "server guard check should reject stale displayed expert issue context",
      issueFlagsChirho: ["uncertain-chirho"],
    });
    assertCheckChirho(
      staleIssueDisplayResultChirho.responseChirho.status === 409,
      `stale issue display expected HTTP 409, got ${staleIssueDisplayResultChirho.responseChirho.status}`
    );
    assertCheckChirho(staleIssueDisplayResultChirho.dataChirho.okChirho === false, "stale issue display unexpectedly returned ok");
    assertCheckChirho(
      String(staleIssueDisplayResultChirho.dataChirho.errorChirho ?? "").includes("Expert review item is stale"),
      `stale issue display failed for wrong reason: ${String(staleIssueDisplayResultChirho.dataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(!existsSync(policyPathChirho), "stale issue display wrote a policy file");
    const validConfirmResultChirho = await postJsonChirho(portChirho, "/api-chirho/confirm-chirho", {
      ...commonBodyChirho,
      rationaleChirho: "server guard check confirms one exact non-Latin item in a disposable policy file",
      certifyExactChirho: true,
    });
    assertCheckChirho(
      validConfirmResultChirho.responseChirho.ok,
      `valid confirm POST failed: ${validConfirmResultChirho.responseChirho.status} ${String(validConfirmResultChirho.dataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(existsSync(policyPathChirho), "valid confirm POST did not write disposable policy file");
    let policyFileAfterConfirmChirho = policyFileChirho(policyPathChirho);
    assertCheckChirho(policyFileAfterConfirmChirho.policiesChirho?.length === 1, "valid confirm POST wrote wrong policy count");
    assertCheckChirho(
      policyFileAfterConfirmChirho.policiesChirho?.[0]?.decisionChirho === VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO,
      "valid confirm POST did not write a confirmed policy"
    );
    const validIssueResultChirho = await postJsonChirho(portChirho, "/api-chirho/issue-chirho", {
      ...commonBodyChirho,
      rationaleChirho: "server guard check records an uncertainty issue with a concrete non-template reason",
      issueFlagsChirho: ["uncertain-chirho"],
    });
    assertCheckChirho(
      validIssueResultChirho.responseChirho.ok,
      `valid issue POST failed: ${validIssueResultChirho.responseChirho.status} ${String(validIssueResultChirho.dataChirho.errorChirho ?? "")}`
    );
    assertCheckChirho(existsSync(policyPathChirho), "valid issue POST did not write disposable policy file");
    const policyFileAfterIssueChirho = policyFileChirho(policyPathChirho);
    assertCheckChirho(policyFileAfterIssueChirho.policiesChirho?.length === 1, "valid issue POST wrote wrong policy count");
    assertCheckChirho(
      policyFileAfterIssueChirho.policiesChirho?.[0]?.decisionChirho === VISION_TIER_EXPERT_CONFIRMATION_REVIEWED_ISSUES_CHIRHO,
      "valid issue POST did not supersede the earlier confirmation with an issue"
    );
    const validReconfirmResultChirho = await postJsonChirho(portChirho, "/api-chirho/confirm-chirho", {
      ...commonBodyChirho,
      rationaleChirho: "server guard check reconfirms after a disposable issue record is resolved",
      certifyExactChirho: true,
    });
    assertCheckChirho(
      validReconfirmResultChirho.responseChirho.ok,
      `valid reconfirm POST failed: ${validReconfirmResultChirho.responseChirho.status} ${String(validReconfirmResultChirho.dataChirho.errorChirho ?? "")}`
    );
    const policyFileAfterReconfirmChirho = policyFileChirho(policyPathChirho);
    assertCheckChirho(policyFileAfterReconfirmChirho.policiesChirho?.length === 1, "valid reconfirm POST wrote wrong policy count");
    assertCheckChirho(
      policyFileAfterReconfirmChirho.policiesChirho?.[0]?.decisionChirho === VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO,
      "valid reconfirm POST did not supersede the earlier issue with a confirmation"
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
  console.log(`[${MODULE_CHIRHO}] expert review server guards passed`);
}

if (import.meta.main) {
  mainChirho().catch((errorChirho) => {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  });
}
