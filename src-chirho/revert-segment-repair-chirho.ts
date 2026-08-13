// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Documented reverse path for an applied segment repair (v2 Phase 4).
 * Workflow doc: spec-chirho/workflows-chirho/segment-repair-apply-lane-chirho.md
 *
 * Dry-run by default: prints the apply manifest and what a revert would do.
 * A real revert requires --apply plus the manifest's after-hash re-typed via
 * --expected-after-sha256-chirho (double-entry guard, mirroring the Pass-C
 * apply CLI idiom), a certifying human --reviewer-chirho, and a rationale.
 *
 *   bun run revert-segment-repair-chirho -- --proposal-id-chirho=<id> \
 *     --reviewer-chirho=<human> --rationale-chirho="why" \
 *     --expected-after-sha256-chirho=<hash from manifest> --apply
 */

import { Database } from "bun:sqlite";

import {
  loadSegmentRepairApplyManifestChirho,
  revertSegmentRepairApplicationChirho,
} from "./segment-repair-apply-chirho.ts";
import {
  loadSegmentRepairProposalStoreChirho,
  SEGMENT_REPAIR_PROPOSAL_STATUS_APPLIED_CHIRHO,
} from "./segment-repair-proposals-chirho.ts";
import { PROGRESS_DB_PATH_CHIRHO, PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { join } from "path";

const MODULE_CHIRHO = "revert-segment-repair-chirho";
const DEFAULT_SEGMENT_REPAIR_PROPOSALS_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "segment-repair-proposals-2026-07-02-chirho.json"
);

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const applyChirho = argsChirho.includes("--apply");
  const storePathChirho =
    parseArgValueChirho(argsChirho, "store-chirho") ?? DEFAULT_SEGMENT_REPAIR_PROPOSALS_PATH_CHIRHO;
  const dbPathChirho = parseArgValueChirho(argsChirho, "db") ?? PROGRESS_DB_PATH_CHIRHO;
  const proposalIdChirho = parseArgValueChirho(argsChirho, "proposal-id-chirho");
  if (proposalIdChirho === undefined) {
    throw new Error("--proposal-id-chirho=<id> is required");
  }
  const storeChirho = loadSegmentRepairProposalStoreChirho(storePathChirho);
  const proposalChirho = storeChirho.proposalsChirho.find(
    (candidateChirho) => candidateChirho.proposalIdChirho === proposalIdChirho
  );
  if (proposalChirho === undefined) {
    throw new Error(`segment repair proposal not found in ${storePathChirho}: ${proposalIdChirho}`);
  }
  if (proposalChirho.statusChirho !== SEGMENT_REPAIR_PROPOSAL_STATUS_APPLIED_CHIRHO) {
    throw new Error(`only applied proposals can be reverted; ${proposalIdChirho} is ${proposalChirho.statusChirho}`);
  }
  if (proposalChirho.applyBackupDirChirho === undefined) {
    throw new Error(`applied proposal has no recorded backup dir: ${proposalIdChirho}`);
  }
  const manifestChirho = loadSegmentRepairApplyManifestChirho(proposalChirho.applyBackupDirChirho);
  console.log(`[${MODULE_CHIRHO}] proposal ${proposalIdChirho} (${proposalChirho.itemKeyChirho})`);
  console.log(`[${MODULE_CHIRHO}] applied ${manifestChirho.appliedAtChirho} by ${manifestChirho.appliedByChirho}`);
  console.log(`[${MODULE_CHIRHO}] line file ${manifestChirho.lineFilePathChirho}`);
  console.log(`[${MODULE_CHIRHO}] before sha256 ${manifestChirho.beforeFileSha256Chirho}`);
  console.log(`[${MODULE_CHIRHO}] after  sha256 ${manifestChirho.afterFileSha256Chirho}`);
  console.log(
    `[${MODULE_CHIRHO}] invalidated validation rows at apply: [${manifestChirho.invalidatedValidationIdsChirho.join(",")}]`
  );
  if (!applyChirho) {
    console.log(`[${MODULE_CHIRHO}] mode=dry-run-chirho; to revert, run:`);
    console.log(`[${MODULE_CHIRHO}]   ${manifestChirho.reversePathChirho} --reviewer-chirho=<human> --rationale-chirho="why"`);
    return;
  }
  const reviewerCliChirho = parseArgValueChirho(argsChirho, "reviewer-chirho") ?? "";
  const rationaleChirho = parseArgValueChirho(argsChirho, "rationale-chirho") ?? "";
  const expectedAfterSha256Chirho = parseArgValueChirho(argsChirho, "expected-after-sha256-chirho");
  if (expectedAfterSha256Chirho === undefined) {
    throw new Error("--apply requires --expected-after-sha256-chirho=<hash> copied from the manifest above");
  }
  const dbChirho = new Database(dbPathChirho);
  const outcomeChirho = revertSegmentRepairApplicationChirho({
    storePathChirho,
    proposalChirho,
    revertReviewerChirho: reviewerCliChirho,
    revertRationaleChirho: rationaleChirho,
    dbChirho,
    expectedAfterSha256Chirho,
  });
  console.log(
    `[${MODULE_CHIRHO}] mode=apply-chirho reverted ${proposalIdChirho}; restored sha256 ${outcomeChirho.restoredFileSha256Chirho}`
  );
  console.log(
    `[${MODULE_CHIRHO}] invalidated validation rows at revert: [${outcomeChirho.invalidatedValidationIdsChirho.join(",")}]`
  );
}

if (import.meta.main) mainChirho();
