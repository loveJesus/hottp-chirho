// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Record append-only proofread decisions for Latin/symbol vision packet items.
 *
 * Examples:
 *   bun run record-latin-symbol-vision-review-chirho --id=v1-p0148-l036-w6 --verdict=accepted-clean --reviewer=hallelujah-chirho --accept-clean-chirho
 *   bun run record-latin-symbol-vision-review-chirho --id=v3-p0148-l005-s0 --verdict=reviewed-issues --issue-flags=punctuation-chirho --notes="check spacing"
 */

import { Database } from "bun:sqlite";

import { PROGRESS_DB_PATH_CHIRHO } from "./config-chirho.ts";
import {
  latinSymbolVisionLiveItemsChirho,
  type LatinSymbolVisionLiveItemChirho,
} from "./latin-symbol-vision-live-items-chirho.ts";
import {
  acceptedCleanLatinSymbolReviewIdsChirho,
  assertLatinSymbolManifestMatchesLiveChirho,
  ensureLatinSymbolReviewSchemaChirho,
  LATIN_SYMBOL_PACK_MANIFEST_PATH_CHIRHO,
  LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO,
  LATIN_SYMBOL_REVIEW_VERDICT_VALUES_CHIRHO,
  loadLatinSymbolPacketManifestChirho,
  normalizeLatinSymbolIssueFlagsChirho,
  saveLatinSymbolReviewChirho,
  writeLatinSymbolReviewBackupChirho,
  type LatinSymbolPacketManifestChirho,
} from "./latin-symbol-vision-review-store-chirho.ts";

const MODULE_CHIRHO = "record-latin-symbol-vision-review-chirho";

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function normalizeVerdictChirho(valueChirho: string | undefined): string {
  if (valueChirho === "accepted-clean" || valueChirho === "clean") return "accepted-clean-chirho";
  if (valueChirho === "reviewed-issues" || valueChirho === "issues") return "reviewed-issues-chirho";
  if (valueChirho !== undefined && LATIN_SYMBOL_REVIEW_VERDICT_VALUES_CHIRHO.has(valueChirho)) return valueChirho;
  throw new Error("--verdict must be accepted-clean-chirho or reviewed-issues-chirho");
}

function parseIssueFlagsChirho(valueChirho: string | undefined): string[] {
  if (valueChirho === undefined || valueChirho.trim().length === 0) return [];
  const flagsChirho = valueChirho
    .split(",")
    .map((flagChirho) => flagChirho.trim())
    .filter((flagChirho) => flagChirho.length > 0);
  return normalizeLatinSymbolIssueFlagsChirho(flagsChirho);
}

function usageChirho(): string {
  return [
    `Usage: bun run ${MODULE_CHIRHO} --id=<packet-item-id> --verdict=<accepted-clean|reviewed-issues> --reviewer=<reviewer-chirho> [--accept-clean-chirho] [--issue-flags=a,b] [--notes=text]`,
    "",
    "Accepted-clean writes require --accept-clean-chirho after checking the target crop and full line against the print.",
    "Use --export-backup[=path] to write a committable JSON backup of current review rows.",
    "Use --list-pending to print the first unreviewed packet IDs.",
  ].join("\n");
}

function exportBackupPathChirho(argsChirho: string[]): string | null {
  const explicitPathChirho = parseArgValueChirho(argsChirho, "export-backup");
  if (explicitPathChirho !== undefined) return explicitPathChirho;
  return argsChirho.includes("--export-backup") ? LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO : null;
}

function listPendingChirho(
  dbChirho: Database,
  manifestChirho: LatinSymbolPacketManifestChirho,
  liveItemsChirho: LatinSymbolVisionLiveItemChirho[]
): void {
  const acceptedIdsChirho = acceptedCleanLatinSymbolReviewIdsChirho(dbChirho, liveItemsChirho);
  const pendingChirho = (manifestChirho.itemsChirho ?? []).filter((itemChirho) => !acceptedIdsChirho.has(itemChirho.idChirho));
  console.log(`[${MODULE_CHIRHO}] pending-not-accepted-clean=${pendingChirho.length}`);
  for (const itemChirho of pendingChirho.slice(0, 40)) {
    console.log(`${itemChirho.idChirho}\t${itemChirho.scriptChirho}\t${itemChirho.textChirho}`);
  }
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const dbPathChirho = parseArgValueChirho(argsChirho, "db") ?? PROGRESS_DB_PATH_CHIRHO;
  const manifestPathChirho = parseArgValueChirho(argsChirho, "manifest") ?? LATIN_SYMBOL_PACK_MANIFEST_PATH_CHIRHO;
  const manifestChirho = loadLatinSymbolPacketManifestChirho(manifestPathChirho);
  const liveItemsChirho = latinSymbolVisionLiveItemsChirho();
  const liveByIdChirho = assertLatinSymbolManifestMatchesLiveChirho(manifestChirho, liveItemsChirho);
  const dbChirho = new Database(dbPathChirho);
  ensureLatinSymbolReviewSchemaChirho(dbChirho);

  const backupPathChirho = exportBackupPathChirho(argsChirho);
  if (backupPathChirho !== null) {
    const rowCountChirho = writeLatinSymbolReviewBackupChirho(dbChirho, backupPathChirho, liveItemsChirho, manifestChirho);
    dbChirho.close();
    console.log(`[${MODULE_CHIRHO}] exported ${rowCountChirho} current review row(s) to ${backupPathChirho}`);
    return;
  }

  if (argsChirho.includes("--list-pending")) {
    listPendingChirho(dbChirho, manifestChirho, liveItemsChirho);
    dbChirho.close();
    return;
  }

  const itemIdChirho = parseArgValueChirho(argsChirho, "id");
  if (!itemIdChirho) {
    dbChirho.close();
    throw new Error(usageChirho());
  }
  const itemChirho = manifestChirho.itemsChirho!.find((candidateChirho) => candidateChirho.idChirho === itemIdChirho);
  if (!itemChirho) {
    dbChirho.close();
    throw new Error(`item not found in packet manifest: ${itemIdChirho}`);
  }
  const liveItemChirho = liveByIdChirho.get(itemChirho.idChirho);
  if (liveItemChirho === undefined) {
    dbChirho.close();
    throw new Error(`item not found in live span/D1 state: ${itemChirho.idChirho}`);
  }
  const verdictChirho = normalizeVerdictChirho(parseArgValueChirho(argsChirho, "verdict"));
  const issueFlagsChirho = parseIssueFlagsChirho(parseArgValueChirho(argsChirho, "issue-flags"));
  if (verdictChirho === "accepted-clean-chirho" && !argsChirho.includes("--accept-clean-chirho")) {
    dbChirho.close();
    throw new Error("--accept-clean-chirho is required for accepted-clean after checking the target crop and full line against the print");
  }
  const reviewerChirho = parseArgValueChirho(argsChirho, "reviewer") ?? "human-chirho";
  const notesChirho = parseArgValueChirho(argsChirho, "notes") ?? null;
  const reviewChirho = saveLatinSymbolReviewChirho({
    dbChirho,
    manifestChirho,
    liveItemChirho,
    verdictChirho,
    issueFlagsChirho,
    notesChirho,
    reviewerChirho,
  });
  dbChirho.close();
  console.log(`[${MODULE_CHIRHO}] saved id=${reviewChirho.idChirho} item=${itemChirho.idChirho} verdict=${verdictChirho}`);
}

if (import.meta.main) mainChirho();
