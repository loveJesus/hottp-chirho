// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Prepare an exact-item Latin/symbol vision acceptance policy.
 *
 * Default is a dry-run JSON preview with decisionChirho=draft-chirho. Writing an
 * accepted policy requires explicit --decision-chirho=accepted-clean-policy-chirho
 * plus reviewer, rationale, and --accept-clean-chirho. Symbol-labeled items
 * that are not trivial punctuation are excluded by --safe-symbols-only-chirho
 * and cannot be accepted in bulk without an explicit override.
 */

import { existsSync, readFileSync } from "fs";

import { writeJsonAtomicChirho } from "./atomic-json-chirho.ts";
import {
  isMixedSymbolTextChirho,
  isNontrivialSymbolTextChirho,
  latinSymbolVisionLiveItemsChirho,
} from "./latin-symbol-vision-live-items-chirho.ts";
import {
  LATIN_SYMBOL_ACCEPTANCE_POLICY_PATH_CHIRHO,
  LATIN_SYMBOL_POLICY_DECISION_ACCEPTED_CHIRHO,
  LATIN_SYMBOL_POLICY_DECISION_DRAFT_CHIRHO,
  type LatinSymbolAcceptancePolicyChirho,
  type LatinSymbolAcceptancePolicyFileChirho,
} from "./latin-symbol-vision-acceptance-policy-chirho.ts";
import { assertExplicitReviewerAttributionChirho } from "./reviewer-attribution-chirho.ts";
import { hashTextChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "prepare-latin-symbol-vision-acceptance-policy-chirho";

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function splitCsvChirho(valueChirho: string | undefined): string[] {
  return (valueChirho ?? "")
    .split(",")
    .map((partChirho) => partChirho.trim())
    .filter((partChirho) => partChirho.length > 0);
}

function slugChirho(valueChirho: string): string {
  return valueChirho
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function shortItemLabelChirho(itemChirho: { idChirho: string; textChirho: string }): string {
  return `${itemChirho.idChirho}=${JSON.stringify(itemChirho.textChirho)}`;
}

function loadPolicyFileChirho(pathChirho: string): LatinSymbolAcceptancePolicyFileChirho {
  if (!existsSync(pathChirho)) {
    return {
      john316Chirho:
        "For God so loved the world that he gave his only begotten Son, that whoever believes in him should not perish but have eternal life. John 3:16",
      schemaVersionChirho: 1,
      generatedAtChirho: new Date().toISOString(),
      policiesChirho: [],
    };
  }
  return JSON.parse(readFileSync(pathChirho, "utf8")) as LatinSymbolAcceptancePolicyFileChirho;
}

function writePolicyFileChirho(pathChirho: string, fileChirho: LatinSymbolAcceptancePolicyFileChirho): void {
  writeJsonAtomicChirho(pathChirho, fileChirho);
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const writeChirho = argsChirho.includes("--write-chirho");
  const acceptCleanChirho = argsChirho.includes("--accept-clean-chirho");
  const safeSymbolsOnlyChirho = argsChirho.includes("--safe-symbols-only-chirho");
  const allowNontrivialSymbolTextChirho =
    argsChirho.includes("--allow-nontrivial-symbol-text-chirho") ||
    argsChirho.includes("--allow-mixed-symbol-text-chirho");
  const scriptFiltersChirho = new Set(splitCsvChirho(parseArgValueChirho(argsChirho, "script-chirho")));
  const kindFiltersChirho = new Set(splitCsvChirho(parseArgValueChirho(argsChirho, "kind-chirho")));
  const decisionChirho = parseArgValueChirho(argsChirho, "decision-chirho") ?? LATIN_SYMBOL_POLICY_DECISION_DRAFT_CHIRHO;
  const reviewerChirho = parseArgValueChirho(argsChirho, "reviewer-chirho") ?? "";
  const rationaleChirho = parseArgValueChirho(argsChirho, "rationale-chirho") ?? "";
  const outPathChirho = parseArgValueChirho(argsChirho, "out-chirho") ?? LATIN_SYMBOL_ACCEPTANCE_POLICY_PATH_CHIRHO;
  const scriptScopeLabelChirho =
    safeSymbolsOnlyChirho && scriptFiltersChirho.size === 0
      ? "symbol-chirho"
      : scriptFiltersChirho.size === 0
        ? "all-scripts-chirho"
        : [...scriptFiltersChirho].sort().join("-");
  const policyScriptScopeChirho =
    safeSymbolsOnlyChirho && scriptFiltersChirho.size === 0
      ? "symbol-chirho"
      : scriptFiltersChirho.size === 0
        ? "all-chirho"
        : [...scriptFiltersChirho].sort().join(",");
  const scopePartsChirho = [
    scriptScopeLabelChirho,
    kindFiltersChirho.size === 0 ? "all-kinds-chirho" : [...kindFiltersChirho].sort().join("-"),
    safeSymbolsOnlyChirho ? "safe-symbols-only-chirho" : "all-symbol-text-chirho",
  ];
  const policyIdChirho =
    parseArgValueChirho(argsChirho, "policy-id-chirho") ??
    `${scopePartsChirho.map(slugChirho).join("-")}-${new Date().toISOString().slice(0, 10)}-chirho`;

  if (
    decisionChirho !== LATIN_SYMBOL_POLICY_DECISION_DRAFT_CHIRHO &&
    decisionChirho !== LATIN_SYMBOL_POLICY_DECISION_ACCEPTED_CHIRHO
  ) {
    throw new Error(`--decision-chirho must be ${LATIN_SYMBOL_POLICY_DECISION_DRAFT_CHIRHO} or ${LATIN_SYMBOL_POLICY_DECISION_ACCEPTED_CHIRHO}`);
  }
  if (decisionChirho === LATIN_SYMBOL_POLICY_DECISION_ACCEPTED_CHIRHO) {
    if (reviewerChirho.trim().length === 0) throw new Error("--reviewer-chirho is required for accepted policy");
    assertExplicitReviewerAttributionChirho(reviewerChirho, "--reviewer-chirho");
    if (rationaleChirho.trim().length === 0) throw new Error("--rationale-chirho is required for accepted policy");
    if (!acceptCleanChirho) {
      throw new Error(
        "--accept-clean-chirho is required for accepted policy after checking every selected item crop and full line against the print"
      );
    }
  }

  const liveItemsChirho = latinSymbolVisionLiveItemsChirho();
  const nontrivialSymbolItemsChirho = liveItemsChirho.filter(isNontrivialSymbolTextChirho);
  const mixedScriptSymbolItemsChirho = liveItemsChirho.filter(isMixedSymbolTextChirho);
  const selectedItemsChirho = liveItemsChirho.filter((itemChirho) => {
    const scriptOkChirho = scriptFiltersChirho.size === 0 || scriptFiltersChirho.has(itemChirho.scriptChirho);
    const kindOkChirho = kindFiltersChirho.size === 0 || kindFiltersChirho.has(itemChirho.itemKindChirho);
    const symbolSafetyOkChirho =
      !safeSymbolsOnlyChirho ||
      (itemChirho.scriptChirho === "symbol-chirho" && !isNontrivialSymbolTextChirho(itemChirho));
    return scriptOkChirho && kindOkChirho && symbolSafetyOkChirho;
  });
  const selectedNontrivialSymbolItemsChirho = selectedItemsChirho.filter(isNontrivialSymbolTextChirho);
  if (
    decisionChirho === LATIN_SYMBOL_POLICY_DECISION_ACCEPTED_CHIRHO &&
    selectedNontrivialSymbolItemsChirho.length !== 0 &&
    !allowNontrivialSymbolTextChirho
  ) {
    throw new Error(
      "Refusing accepted policy with non-trivial symbol item(s): " +
        selectedNontrivialSymbolItemsChirho.slice(0, 8).map(shortItemLabelChirho).join(", ") +
        ". Use --safe-symbols-only-chirho to keep only trivial punctuation, or --allow-nontrivial-symbol-text-chirho after explicit item review."
    );
  }
  const nowChirho = new Date().toISOString();
  const policyChirho: LatinSymbolAcceptancePolicyChirho = {
    policyIdChirho,
    decisionChirho,
    scopeChirho: `script=${policyScriptScopeChirho}; kind=${kindFiltersChirho.size === 0 ? "all-chirho" : [...kindFiltersChirho].sort().join(",")}; safeSymbolsOnly=${safeSymbolsOnlyChirho}`,
    itemCountChirho: selectedItemsChirho.length,
    itemsChirho: selectedItemsChirho.map((itemChirho) => ({
      itemIdChirho: itemChirho.idChirho,
      itemKindChirho: itemChirho.itemKindChirho,
      scriptChirho: itemChirho.scriptChirho,
      currentTextChirho: itemChirho.textChirho,
      currentTextHashChirho: hashTextChirho(itemChirho.textChirho),
    })),
  };
  if (reviewerChirho.length !== 0) policyChirho.reviewerChirho = reviewerChirho;
  if (rationaleChirho.length !== 0) policyChirho.rationaleChirho = rationaleChirho;
  if (decisionChirho === LATIN_SYMBOL_POLICY_DECISION_ACCEPTED_CHIRHO) {
    policyChirho.acceptedAtChirho = nowChirho;
    policyChirho.acceptCleanChirho = true;
  }

  if (!writeChirho) {
    console.log(JSON.stringify(policyChirho, null, 2));
    if (nontrivialSymbolItemsChirho.length !== 0) {
      console.error(
        `[${MODULE_CHIRHO}] non-trivial symbol item(s) in live set: ${nontrivialSymbolItemsChirho.length}; ` +
          `mixed-script=${mixedScriptSymbolItemsChirho.length}; selected=${selectedNontrivialSymbolItemsChirho.length}; ` +
          `use --safe-symbols-only-chirho for only trivial punctuation`
      );
    }
    console.error(
      `[${MODULE_CHIRHO}] previewed ${selectedItemsChirho.length} item(s); add --write-chirho to merge into ${outPathChirho}`
    );
    return;
  }

  const fileChirho = loadPolicyFileChirho(outPathChirho);
  fileChirho.schemaVersionChirho = 1;
  fileChirho.generatedAtChirho = nowChirho;
  fileChirho.policiesChirho = (fileChirho.policiesChirho ?? []).filter(
    (existingChirho) => existingChirho.policyIdChirho !== policyIdChirho
  );
  fileChirho.policiesChirho.push(policyChirho);
  writePolicyFileChirho(outPathChirho, fileChirho);
  console.log(`[${MODULE_CHIRHO}] wrote policy ${policyIdChirho} with ${selectedItemsChirho.length} item(s) to ${outPathChirho}`);
}

if (import.meta.main) mainChirho();
