// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Non-mutating guard checks for offline policy preparation CLIs.
 *
 * These checks use temporary policy output files. They prove policy writers
 * keep exact-item/count guards, refuse broad unsafe acceptance, and cannot
 * confirm blank expert items.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { expectedItemGuardArgsChirho } from "./expected-item-guard-chirho.ts";
import {
  isNontrivialSymbolTextChirho,
  latinSymbolVisionLiveItemsChirho,
  type LatinSymbolVisionLiveItemChirho,
} from "./latin-symbol-vision-live-items-chirho.ts";
import {
  expectedVisionTierReviewerRoleChirho,
  type VisionTierExpertConfirmationFileChirho,
} from "./vision-tier-expert-confirmation-policy-chirho.ts";
import {
  visionTierExpertLiveItemsChirho,
  type VisionTierExpertLiveItemChirho,
} from "./vision-tier-expert-live-items-chirho.ts";

const MODULE_CHIRHO = "check-policy-preparation-cli-guards-chirho";
const LATIN_POLICY_SCRIPT_CHIRHO = "prepare-latin-symbol-vision-acceptance-policy-chirho";
const EXPERT_POLICY_SCRIPT_CHIRHO = "prepare-vision-tier-expert-confirmation-policy-chirho";

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

function tempPolicyPathChirho(prefixChirho: string): { dirChirho: string; pathChirho: string } {
  const dirChirho = mkdtempSync(join(tmpdir(), `${prefixChirho}-policy-prep-guard-chirho-`));
  return { dirChirho, pathChirho: join(dirChirho, "policy-chirho.json") };
}

function assertRejectedChirho(argsChirho: string[], expectedMessageChirho: string): void {
  const resultChirho = runCommandChirho(argsChirho);
  const combinedOutputChirho = `${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`;
  assertCheckChirho(
    resultChirho.exitCodeChirho !== 0,
    `policy guard command unexpectedly succeeded: ${commandTextChirho(argsChirho)}`
  );
  assertCheckChirho(
    combinedOutputChirho.includes(expectedMessageChirho),
    `policy guard command failed for the wrong reason: ${combinedOutputChirho}`
  );
}

function assertSucceededChirho(argsChirho: string[]): void {
  const resultChirho = runCommandChirho(argsChirho);
  assertCheckChirho(
    resultChirho.exitCodeChirho === 0,
    `policy guard command failed: ${commandTextChirho(argsChirho)}\n${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`
  );
}

function safeSymbolItemsChirho(): LatinSymbolVisionLiveItemChirho[] {
  return latinSymbolVisionLiveItemsChirho().filter(
    (itemChirho) => itemChirho.scriptChirho === "symbol-chirho" && !isNontrivialSymbolTextChirho(itemChirho)
  );
}

function latinAcceptedSafeSymbolArgsChirho(
  outPathChirho: string,
  extraArgsChirho: string[] = [],
  reviewerOverrideChirho = "dr-policy-prep-latin-human-chirho",
  rationaleOverrideChirho = "guard confirms every selected trivial punctuation item was checked clean"
): string[] {
  const itemIdsChirho = safeSymbolItemsChirho().map((itemChirho) => itemChirho.idChirho);
  return [
    process.execPath,
    "run",
    LATIN_POLICY_SCRIPT_CHIRHO,
    "--",
    "--safe-symbols-only-chirho",
    "--decision-chirho=accepted-clean-policy-chirho",
    "--accept-clean-chirho",
    `--reviewer-chirho=${reviewerOverrideChirho}`,
    `--rationale-chirho=${rationaleOverrideChirho}`,
    `--out-chirho=${outPathChirho}`,
    ...expectedItemGuardArgsChirho(itemIdsChirho),
    ...extraArgsChirho,
  ];
}

function checkLatinSafeSymbolWriteChirho(): void {
  const tempChirho = tempPolicyPathChirho("latin-safe-symbol-chirho");
  try {
    const argsChirho = latinAcceptedSafeSymbolArgsChirho(tempChirho.pathChirho, ["--write-chirho"]);
    assertSucceededChirho(argsChirho);
    const fileChirho = JSON.parse(readFileSync(tempChirho.pathChirho, "utf8")) as { policiesChirho?: Array<{ itemCountChirho?: number }> };
    const writtenCountChirho = fileChirho.policiesChirho?.[0]?.itemCountChirho;
    assertCheckChirho(writtenCountChirho === safeSymbolItemsChirho().length, "safe-symbol write used the wrong item count");
  } finally {
    rmSync(tempChirho.dirChirho, { recursive: true, force: true });
  }
}

function checkLatinReviewerRejectedChirho(reviewerChirho: string, expectedMessageChirho: string): void {
  const tempChirho = tempPolicyPathChirho("latin-reviewer-chirho");
  try {
    const argsChirho = latinAcceptedSafeSymbolArgsChirho(tempChirho.pathChirho, ["--write-chirho"], reviewerChirho);
    assertRejectedChirho(argsChirho, expectedMessageChirho);
    assertCheckChirho(!existsSync(tempChirho.pathChirho), "blocked Latin reviewer policy command wrote a file");
  } finally {
    rmSync(tempChirho.dirChirho, { recursive: true, force: true });
  }
}

function checkLatinPlaceholderRationaleRejectedChirho(): void {
  const tempChirho = tempPolicyPathChirho("latin-placeholder-rationale-chirho");
  try {
    const argsChirho = latinAcceptedSafeSymbolArgsChirho(
      tempChirho.pathChirho,
      ["--write-chirho"],
      "dr-policy-prep-latin-human-chirho",
      "<why these items are accepted clean>"
    );
    assertRejectedChirho(argsChirho, "--rationale-chirho must explain the accepted-clean policy, not a template placeholder");
    assertCheckChirho(!existsSync(tempChirho.pathChirho), "placeholder-rationale Latin policy command wrote a file");
  } finally {
    rmSync(tempChirho.dirChirho, { recursive: true, force: true });
  }
}

function checkLatinWrongCountRejectedChirho(): void {
  const tempChirho = tempPolicyPathChirho("latin-wrong-count-chirho");
  try {
    const itemIdsChirho = safeSymbolItemsChirho().map((itemChirho) => itemChirho.idChirho);
    const argsChirho = [
      process.execPath,
      "run",
      LATIN_POLICY_SCRIPT_CHIRHO,
      "--",
      "--safe-symbols-only-chirho",
      "--decision-chirho=accepted-clean-policy-chirho",
      "--accept-clean-chirho",
      "--reviewer-chirho=dr-policy-prep-latin-human-chirho",
      "--rationale-chirho=guard should reject stale selected item count",
      `--out-chirho=${tempChirho.pathChirho}`,
      `--expected-item-count-chirho=${itemIdsChirho.length + 1}`,
      `--expected-item-ids-chirho=${itemIdsChirho.sort().join(",")}`,
      "--write-chirho",
    ];
    assertRejectedChirho(argsChirho, "does not match --expected-item-count-chirho");
    assertCheckChirho(!existsSync(tempChirho.pathChirho), "wrong-count Latin policy command wrote a file");
  } finally {
    rmSync(tempChirho.dirChirho, { recursive: true, force: true });
  }
}

function checkLatinNontrivialSymbolRejectedChirho(): void {
  const argsChirho = [
    process.execPath,
    "run",
    LATIN_POLICY_SCRIPT_CHIRHO,
    "--",
    "--script-chirho=symbol-chirho",
    "--decision-chirho=accepted-clean-policy-chirho",
    "--accept-clean-chirho",
    "--reviewer-chirho=dr-policy-prep-latin-human-chirho",
    "--rationale-chirho=guard should reject nontrivial symbols without explicit override",
  ];
  assertRejectedChirho(argsChirho, "Refusing accepted policy with non-trivial symbol item(s)");
}

function nonblankExpertItemChirho(): VisionTierExpertLiveItemChirho {
  const itemChirho = visionTierExpertLiveItemsChirho().find(
    (candidateChirho) =>
      candidateChirho.visionSourceChirho === "explicit-span-chirho" &&
      candidateChirho.currentTextChirho.trim().length !== 0 &&
      expectedVisionTierReviewerRoleChirho(candidateChirho.scriptChirho) !== null
  );
  if (itemChirho === undefined) throw new Error("no nonblank explicit expert item available for policy guard check");
  return itemChirho;
}

function blankExpertItemChirho(): VisionTierExpertLiveItemChirho | null {
  return (
    visionTierExpertLiveItemsChirho().find(
      (candidateChirho) =>
        candidateChirho.visionSourceChirho === "explicit-span-chirho" &&
        candidateChirho.currentTextChirho.trim().length === 0 &&
        expectedVisionTierReviewerRoleChirho(candidateChirho.scriptChirho) !== null
    ) ?? null
  );
}

function expertConfirmedArgsChirho(
  itemChirho: VisionTierExpertLiveItemChirho,
  outPathChirho: string,
  extraArgsChirho: string[] = [],
  reviewerRoleOverrideChirho?: string,
  reviewerOverrideChirho = "dr-policy-prep-expert-human-chirho",
  rationaleOverrideChirho = "guard confirms the exact printed item after expert visual review"
): string[] {
  const expectedRoleChirho = expectedVisionTierReviewerRoleChirho(itemChirho.scriptChirho);
  if (expectedRoleChirho === null) throw new Error(`${itemChirho.idChirho} has no expected role`);
  const reviewerRoleChirho = reviewerRoleOverrideChirho ?? expectedRoleChirho;
  return [
    process.execPath,
    "run",
    EXPERT_POLICY_SCRIPT_CHIRHO,
    "--",
    "--decision-chirho=confirmed-expert-chirho",
    "--certify-exact-chirho",
    `--id-chirho=${itemChirho.idChirho}`,
    `--reviewer-chirho=${reviewerOverrideChirho}`,
    `--reviewer-role-chirho=${reviewerRoleChirho}`,
    `--rationale-chirho=${rationaleOverrideChirho}`,
    `--out-chirho=${outPathChirho}`,
    ...expectedItemGuardArgsChirho([itemChirho.idChirho]),
    ...extraArgsChirho,
  ];
}

function checkExpertSingleItemWriteChirho(): void {
  const tempChirho = tempPolicyPathChirho("expert-single-chirho");
  const itemChirho = nonblankExpertItemChirho();
  try {
    const argsChirho = expertConfirmedArgsChirho(itemChirho, tempChirho.pathChirho, ["--write-chirho"]);
    assertSucceededChirho(argsChirho);
    const fileChirho = JSON.parse(readFileSync(tempChirho.pathChirho, "utf8")) as VisionTierExpertConfirmationFileChirho;
    assertCheckChirho(fileChirho.policiesChirho?.[0]?.itemsChirho?.[0]?.itemIdChirho === itemChirho.idChirho, "expert policy wrote the wrong item id");
  } finally {
    rmSync(tempChirho.dirChirho, { recursive: true, force: true });
  }
}

function checkExpertReviewerRejectedChirho(reviewerChirho: string, expectedMessageChirho: string): void {
  const tempChirho = tempPolicyPathChirho("expert-reviewer-chirho");
  const itemChirho = nonblankExpertItemChirho();
  try {
    const argsChirho = expertConfirmedArgsChirho(
      itemChirho,
      tempChirho.pathChirho,
      ["--write-chirho"],
      undefined,
      reviewerChirho
    );
    assertRejectedChirho(argsChirho, expectedMessageChirho);
    assertCheckChirho(!existsSync(tempChirho.pathChirho), "blocked expert reviewer policy command wrote a file");
  } finally {
    rmSync(tempChirho.dirChirho, { recursive: true, force: true });
  }
}

function checkExpertPlaceholderRationaleRejectedChirho(): void {
  const tempChirho = tempPolicyPathChirho("expert-placeholder-rationale-chirho");
  const itemChirho = nonblankExpertItemChirho();
  try {
    const argsChirho = expertConfirmedArgsChirho(
      itemChirho,
      tempChirho.pathChirho,
      ["--write-chirho"],
      undefined,
      "dr-policy-prep-expert-human-chirho",
      "<why these exact items are confirmed>"
    );
    assertRejectedChirho(argsChirho, "--rationale-chirho must explain the exact expert confirmation, not a template placeholder");
    assertCheckChirho(!existsSync(tempChirho.pathChirho), "placeholder-rationale expert policy command wrote a file");
  } finally {
    rmSync(tempChirho.dirChirho, { recursive: true, force: true });
  }
}

function checkExpertWrongRoleRejectedChirho(): void {
  const tempChirho = tempPolicyPathChirho("expert-wrong-role-chirho");
  const itemChirho = nonblankExpertItemChirho();
  try {
    const wrongRoleChirho = expectedVisionTierReviewerRoleChirho(itemChirho.scriptChirho) === "Syriac reader"
      ? "Hebrew/WLC reviewer"
      : "Syriac reader";
    const argsChirho = expertConfirmedArgsChirho(itemChirho, tempChirho.pathChirho, ["--write-chirho"], wrongRoleChirho);
    assertRejectedChirho(argsChirho, "--reviewer-role-chirho must be");
    assertCheckChirho(!existsSync(tempChirho.pathChirho), "wrong-role expert policy command wrote a file");
  } finally {
    rmSync(tempChirho.dirChirho, { recursive: true, force: true });
  }
}

function checkExpertBlankItemRejectedChirho(): void {
  const blankItemChirho = blankExpertItemChirho();
  if (blankItemChirho === null) {
    console.log(`[${MODULE_CHIRHO}] no blank expert item is live; skipped blank-confirm rejection check`);
    return;
  }
  const tempChirho = tempPolicyPathChirho("expert-blank-chirho");
  try {
    const argsChirho = expertConfirmedArgsChirho(blankItemChirho, tempChirho.pathChirho, ["--write-chirho"]);
    assertRejectedChirho(argsChirho, "confirmed expert policy cannot certify blank currentTextChirho item(s)");
    assertCheckChirho(!existsSync(tempChirho.pathChirho), "blank expert policy command wrote a file");
  } finally {
    rmSync(tempChirho.dirChirho, { recursive: true, force: true });
  }
}

function mainChirho(): void {
  checkLatinSafeSymbolWriteChirho();
  checkLatinReviewerRejectedChirho(
    "human-chirho",
    "--reviewer-chirho must identify the explicit reviewer, not generic human-chirho"
  );
  checkLatinReviewerRejectedChirho(
    "<explicit-human-reviewer-id-chirho>",
    "--reviewer-chirho must identify the explicit reviewer, not template placeholder <explicit-human-reviewer-id-chirho>"
  );
  checkLatinPlaceholderRationaleRejectedChirho();
  checkLatinWrongCountRejectedChirho();
  checkLatinNontrivialSymbolRejectedChirho();
  checkExpertSingleItemWriteChirho();
  checkExpertReviewerRejectedChirho(
    "human-chirho",
    "--reviewer-chirho must identify the explicit reviewer, not generic human-chirho"
  );
  checkExpertReviewerRejectedChirho(
    "codex-gpt5-chirho",
    "--reviewer-chirho must identify a human reviewer; machine reviewer codex-gpt5-chirho cannot certify"
  );
  checkExpertReviewerRejectedChirho(
    "<explicit-human-reviewer-id-chirho>",
    "--reviewer-chirho must identify the explicit reviewer, not template placeholder <explicit-human-reviewer-id-chirho>"
  );
  checkExpertPlaceholderRationaleRejectedChirho();
  checkExpertWrongRoleRejectedChirho();
  checkExpertBlankItemRejectedChirho();
  console.log(`[${MODULE_CHIRHO}] policy preparation CLI guards passed`);
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
