// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Non-mutating guard checks for the expert-supplied blank-span CLI.
 *
 * These checks exercise the actual command-line boundary without --apply. They
 * prove machine reviewer attribution is rejected before any target mutation can
 * happen, and, while a blank vision-tier item exists, prove the live dry-run and
 * wrong-role rejection paths still behave as expected.
 */

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  expectedVisionTierReviewerRoleChirho,
} from "./vision-tier-expert-confirmation-policy-chirho.ts";
import {
  visionTierExpertLiveItemsChirho,
  type VisionTierExpertLiveItemChirho,
} from "./vision-tier-expert-live-items-chirho.ts";

const MODULE_CHIRHO = "check-expert-supplied-text-guards-chirho";
const APPLY_SCRIPT_CHIRHO = "apply-expert-supplied-vision-text-chirho";

function textForScriptChirho(scriptChirho: string): string {
  if (scriptChirho === "syriac-chirho") return "ܐ";
  if (scriptChirho === "arabic-chirho") return "ا";
  if (scriptChirho === "hebrew-chirho") return "א";
  if (scriptChirho === "greek-chirho") return "α";
  return "x";
}

function differentRoleChirho(expectedRoleChirho: string): string {
  return expectedRoleChirho === "Syriac reader" ? "Hebrew/WLC reviewer" : "Syriac reader";
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

function assertCommandChirho(conditionChirho: boolean, messageChirho: string): void {
  if (!conditionChirho) throw new Error(messageChirho);
}

function applyArgsChirho(extraArgsChirho: string[]): string[] {
  return [process.execPath, "run", APPLY_SCRIPT_CHIRHO, "--", ...extraArgsChirho];
}

function checkMachineReviewerRejectedBeforeTargetChirho(): void {
  const argsChirho = applyArgsChirho([
    "--id-chirho=v0-p0000-l000-s0",
    "--supplied-text-chirho=x",
    "--reviewer-chirho=codex-gpt5-chirho",
    "--reviewer-role-chirho=Syriac reader",
    "--rationale-chirho=certification guard check only",
  ]);
  const resultChirho = runCommandChirho(argsChirho);
  const combinedOutputChirho = `${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`;
  assertCommandChirho(
    resultChirho.exitCodeChirho !== 0,
    `machine reviewer command unexpectedly succeeded: ${commandTextChirho(argsChirho)}`
  );
  assertCommandChirho(
    combinedOutputChirho.includes("machine reviewer codex-gpt5-chirho cannot certify"),
    `machine reviewer command failed for the wrong reason: ${combinedOutputChirho}`
  );
}

function checkPlaceholderTextRejectedBeforeTargetChirho(): void {
  const argsChirho = applyArgsChirho([
    "--id-chirho=v0-p0000-l000-s0",
    "--supplied-text-chirho=<exact printed text>",
    "--reviewer-chirho=dr-expert-supplied-guard-check-chirho",
    "--reviewer-role-chirho=Syriac reader",
    "--rationale-chirho=certification guard placeholder check only",
  ]);
  const resultChirho = runCommandChirho(argsChirho);
  const combinedOutputChirho = `${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`;
  assertCommandChirho(
    resultChirho.exitCodeChirho !== 0,
    `placeholder command unexpectedly succeeded: ${commandTextChirho(argsChirho)}`
  );
  assertCommandChirho(
    combinedOutputChirho.includes("--supplied-text-chirho must be the exact printed transcription, not a template placeholder"),
    `placeholder command failed for the wrong reason: ${combinedOutputChirho}`
  );
}

function checkPlaceholderReviewerRejectedBeforeTargetChirho(): void {
  const argsChirho = applyArgsChirho([
    "--id-chirho=v0-p0000-l000-s0",
    "--supplied-text-chirho=x",
    "--reviewer-chirho=<explicit-human-reviewer-id-chirho>",
    "--reviewer-role-chirho=Syriac reader",
    "--rationale-chirho=certification guard reviewer placeholder check only",
  ]);
  const resultChirho = runCommandChirho(argsChirho);
  const combinedOutputChirho = `${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`;
  assertCommandChirho(
    resultChirho.exitCodeChirho !== 0,
    `placeholder reviewer command unexpectedly succeeded: ${commandTextChirho(argsChirho)}`
  );
  assertCommandChirho(
    combinedOutputChirho.includes("--reviewer-chirho must identify the explicit reviewer, not template placeholder <explicit-human-reviewer-id-chirho>"),
    `placeholder reviewer command failed for the wrong reason: ${combinedOutputChirho}`
  );
}

function checkPlaceholderRationaleRejectedBeforeTargetChirho(): void {
  const argsChirho = applyArgsChirho([
    "--id-chirho=v0-p0000-l000-s0",
    "--supplied-text-chirho=x",
    "--reviewer-chirho=dr-expert-supplied-guard-check-chirho",
    "--reviewer-role-chirho=Syriac reader",
    "--rationale-chirho=<why this exact text is supplied>",
  ]);
  const resultChirho = runCommandChirho(argsChirho);
  const combinedOutputChirho = `${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`;
  assertCommandChirho(
    resultChirho.exitCodeChirho !== 0,
    `placeholder rationale command unexpectedly succeeded: ${commandTextChirho(argsChirho)}`
  );
  assertCommandChirho(
    combinedOutputChirho.includes("--rationale-chirho must explain why this exact text is supplied, not a template placeholder"),
    `placeholder rationale command failed for the wrong reason: ${combinedOutputChirho}`
  );
}

function blankLiveItemChirho(): VisionTierExpertLiveItemChirho | null {
  return (
    visionTierExpertLiveItemsChirho().find((itemChirho) => {
      if (itemChirho.visionSourceChirho !== "explicit-span-chirho") return false;
      if (itemChirho.currentTextChirho.length !== 0) return false;
      return expectedVisionTierReviewerRoleChirho(itemChirho.scriptChirho) !== null;
    }) ?? null
  );
}

function checkBlankLiveItemDryRunChirho(itemChirho: VisionTierExpertLiveItemChirho): void {
  const expectedRoleChirho = expectedVisionTierReviewerRoleChirho(itemChirho.scriptChirho);
  if (expectedRoleChirho === null) throw new Error(`${itemChirho.idChirho} has no expected reviewer role`);
  const argsChirho = applyArgsChirho([
    `--id-chirho=${itemChirho.idChirho}`,
    `--supplied-text-chirho=${textForScriptChirho(itemChirho.scriptChirho)}`,
    "--reviewer-chirho=dr-expert-supplied-guard-check-chirho",
    `--reviewer-role-chirho=${expectedRoleChirho}`,
    "--rationale-chirho=certification guard dry-run check only",
  ]);
  const resultChirho = runCommandChirho(argsChirho);
  assertCommandChirho(
    resultChirho.exitCodeChirho === 0,
    `blank item dry-run failed: ${commandTextChirho(argsChirho)}\n${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`
  );
  assertCommandChirho(
    resultChirho.stdoutChirho.includes('"modeChirho": "dry-run-chirho"') &&
      resultChirho.stdoutChirho.includes('"statusChirho": "planned-chirho"') &&
      resultChirho.stdoutChirho.includes(`"itemIdChirho": "${itemChirho.idChirho}"`),
    `blank item dry-run did not report planned dry-run status: ${resultChirho.stdoutChirho}`
  );
}

function checkBlankLiveItemWrongRoleChirho(itemChirho: VisionTierExpertLiveItemChirho): void {
  const expectedRoleChirho = expectedVisionTierReviewerRoleChirho(itemChirho.scriptChirho);
  if (expectedRoleChirho === null) throw new Error(`${itemChirho.idChirho} has no expected reviewer role`);
  const argsChirho = applyArgsChirho([
    `--id-chirho=${itemChirho.idChirho}`,
    `--supplied-text-chirho=${textForScriptChirho(itemChirho.scriptChirho)}`,
    "--reviewer-chirho=dr-expert-supplied-guard-check-chirho",
    `--reviewer-role-chirho=${differentRoleChirho(expectedRoleChirho)}`,
    "--rationale-chirho=certification guard wrong-role check only",
  ]);
  const resultChirho = runCommandChirho(argsChirho);
  const combinedOutputChirho = `${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`;
  assertCommandChirho(
    resultChirho.exitCodeChirho !== 0,
    `wrong-role command unexpectedly succeeded: ${commandTextChirho(argsChirho)}`
  );
  assertCommandChirho(
    combinedOutputChirho.includes(`--reviewer-role-chirho must be "${expectedRoleChirho}"`),
    `wrong-role command failed for the wrong reason: ${combinedOutputChirho}`
  );
}

function mainChirho(): void {
  checkMachineReviewerRejectedBeforeTargetChirho();
  checkPlaceholderTextRejectedBeforeTargetChirho();
  checkPlaceholderReviewerRejectedBeforeTargetChirho();
  checkPlaceholderRationaleRejectedBeforeTargetChirho();
  const blankItemChirho = blankLiveItemChirho();
  if (blankItemChirho === null) {
    console.log(`[${MODULE_CHIRHO}] no blank explicit-span vision-tier item is currently live; skipped live blank dry-run checks`);
  } else {
    checkBlankLiveItemDryRunChirho(blankItemChirho);
    checkBlankLiveItemWrongRoleChirho(blankItemChirho);
    console.log(`[${MODULE_CHIRHO}] checked live blank item ${blankItemChirho.idChirho}`);
  }
  console.log(`[${MODULE_CHIRHO}] expert-supplied text CLI guards passed`);
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
