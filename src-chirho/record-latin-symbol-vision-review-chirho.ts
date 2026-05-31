// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Record append-only proofread decisions for Latin/symbol vision packet items.
 *
 * Examples:
 *   bun run record-latin-symbol-vision-review-chirho --id=v1-p0148-l036-w6 --verdict=accepted-clean --reviewer=hallelujah-chirho
 *   bun run record-latin-symbol-vision-review-chirho --id=v3-p0148-l005-s0 --verdict=reviewed-issues --issue-flags=punctuation-chirho --notes="check spacing"
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";

import { PROGRESS_DB_PATH_CHIRHO, PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  hashTextChirho,
  latinSymbolVisionLiveItemsChirho,
  type LatinSymbolVisionLiveItemChirho,
} from "./latin-symbol-vision-live-items-chirho.ts";

const MODULE_CHIRHO = "record-latin-symbol-vision-review-chirho";
const LATIN_SYMBOL_PACK_MANIFEST_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "latin-symbol-vision-pack-chirho",
  "2026-05-31-chirho",
  "manifest-chirho.json"
);
const LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "latin-symbol-vision-reviews-backup-2026-05-31-chirho.json"
);
const VERDICT_VALUES_CHIRHO = new Set([
  "accepted-clean-chirho",
  "reviewed-issues-chirho",
]);
const ISSUE_FLAG_VALUES_CHIRHO = new Set([
  "letters-chirho",
  "punctuation-chirho",
  "spacing-chirho",
  "wrong-script-chirho",
  "segmentation-chirho",
  "garbled-text-chirho",
  "missing-text-chirho",
  "extra-text-chirho",
  "wrong-language-chirho",
]);

interface PacketItemChirho {
  idChirho: string;
  itemKindChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number | null;
  wordIndexChirho: number | null;
  scriptChirho: string;
  textChirho: string;
  lineTextChirho: string;
  sourceChirho: string;
}

interface PacketManifestChirho {
  generatedAtChirho?: string;
  itemsChirho?: PacketItemChirho[];
}

interface ReviewDbRowChirho {
  id_chirho: number;
  item_id_chirho: string;
  item_kind_chirho: string;
  volume_chirho: number;
  page_chirho: number;
  line_index_chirho: number;
  segment_index_chirho: number | null;
  word_index_chirho: number | null;
  script_chirho: string;
  source_chirho: string;
  current_text_chirho: string;
  current_text_hash_chirho: string;
  line_text_chirho: string;
  verdict_chirho: string;
  issue_flags_chirho: string | null;
  notes_chirho: string | null;
  packet_generated_at_chirho: string | null;
  reviewer_chirho: string;
  created_at_chirho: string;
  updated_at_chirho: string;
  supersedes_id_chirho: number | null;
  applied_at_chirho: string | null;
  schema_version_chirho: number;
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function normalizeVerdictChirho(valueChirho: string | undefined): string {
  if (valueChirho === "accepted-clean" || valueChirho === "clean") return "accepted-clean-chirho";
  if (valueChirho === "reviewed-issues" || valueChirho === "issues") return "reviewed-issues-chirho";
  if (valueChirho !== undefined && VERDICT_VALUES_CHIRHO.has(valueChirho)) return valueChirho;
  throw new Error("--verdict must be accepted-clean-chirho or reviewed-issues-chirho");
}

function parseIssueFlagsChirho(valueChirho: string | undefined): string[] {
  if (valueChirho === undefined || valueChirho.trim().length === 0) return [];
  const flagsChirho = valueChirho
    .split(",")
    .map((flagChirho) => flagChirho.trim())
    .filter((flagChirho) => flagChirho.length > 0);
  for (const flagChirho of flagsChirho) {
    if (!ISSUE_FLAG_VALUES_CHIRHO.has(flagChirho)) {
      throw new Error(`unknown issue flag ${flagChirho}; allowed=${[...ISSUE_FLAG_VALUES_CHIRHO].join(",")}`);
    }
  }
  return [...new Set(flagsChirho)];
}

function loadManifestChirho(pathChirho: string): PacketManifestChirho {
  if (!existsSync(pathChirho)) {
    throw new Error(`Latin/symbol packet manifest missing: ${pathChirho}`);
  }
  const manifestChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as PacketManifestChirho;
  if (!Array.isArray(manifestChirho.itemsChirho)) {
    throw new Error(`Latin/symbol packet manifest malformed: ${pathChirho}`);
  }
  return manifestChirho;
}

function assertManifestMatchesLiveChirho(
  manifestChirho: PacketManifestChirho,
  liveItemsChirho: LatinSymbolVisionLiveItemChirho[]
): Map<string, LatinSymbolVisionLiveItemChirho> {
  const packetItemsChirho = manifestChirho.itemsChirho ?? [];
  const liveByIdChirho = new Map(liveItemsChirho.map((itemChirho) => [itemChirho.idChirho, itemChirho]));
  if (packetItemsChirho.length !== liveItemsChirho.length) {
    throw new Error(
      `Latin/symbol packet is stale: packet has ${packetItemsChirho.length} item(s), live state has ${liveItemsChirho.length}; regenerate make-latin-symbol-vision-pack-chirho`
    );
  }
  for (const packetItemChirho of packetItemsChirho) {
    const liveItemChirho = liveByIdChirho.get(packetItemChirho.idChirho);
    if (liveItemChirho === undefined) {
      throw new Error(`Latin/symbol packet is stale: ${packetItemChirho.idChirho} is not present in live state; regenerate make-latin-symbol-vision-pack-chirho`);
    }
    if (liveItemChirho.itemKindChirho !== packetItemChirho.itemKindChirho) {
      throw new Error(`Latin/symbol packet is stale: ${packetItemChirho.idChirho} kind changed; regenerate make-latin-symbol-vision-pack-chirho`);
    }
    if (liveItemChirho.scriptChirho !== packetItemChirho.scriptChirho) {
      throw new Error(`Latin/symbol packet is stale: ${packetItemChirho.idChirho} script changed; regenerate make-latin-symbol-vision-pack-chirho`);
    }
    if (liveItemChirho.textChirho !== packetItemChirho.textChirho) {
      throw new Error(`Latin/symbol packet is stale: ${packetItemChirho.idChirho} text changed; regenerate make-latin-symbol-vision-pack-chirho`);
    }
  }
  return liveByIdChirho;
}

function tableColumnsChirho(dbChirho: Database, tableNameChirho: string): string[] {
  const rowChirho = dbChirho
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(tableNameChirho) as { name: string } | undefined;
  if (!rowChirho) return [];
  return (dbChirho.query(`PRAGMA table_info(${tableNameChirho})`).all() as Array<{ name: string }>).map(
    (columnChirho) => columnChirho.name
  );
}

function ensureSchemaChirho(dbChirho: Database): void {
  dbChirho.run(`
CREATE TABLE IF NOT EXISTS latin_symbol_vision_reviews_chirho (
  id_chirho                 INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id_chirho            TEXT NOT NULL,
  item_kind_chirho          TEXT NOT NULL,
  volume_chirho             INTEGER NOT NULL,
  page_chirho               INTEGER NOT NULL,
  line_index_chirho         INTEGER NOT NULL,
  segment_index_chirho      INTEGER,
  word_index_chirho         INTEGER,
  script_chirho             TEXT NOT NULL,
  source_chirho             TEXT NOT NULL,
  current_text_chirho       TEXT NOT NULL,
  current_text_hash_chirho  TEXT NOT NULL,
  line_text_chirho          TEXT NOT NULL,
  verdict_chirho            TEXT NOT NULL,
  issue_flags_chirho        TEXT,
  notes_chirho              TEXT,
  packet_generated_at_chirho TEXT,
  reviewer_chirho           TEXT NOT NULL,
  created_at_chirho         TEXT NOT NULL,
  updated_at_chirho         TEXT NOT NULL,
  supersedes_id_chirho      INTEGER,
  is_current_chirho         INTEGER NOT NULL DEFAULT 1,
  applied_at_chirho         TEXT,
  schema_version_chirho     INTEGER NOT NULL DEFAULT 1
)`);

  const columnsChirho = new Set(tableColumnsChirho(dbChirho, "latin_symbol_vision_reviews_chirho"));
  if (!columnsChirho.has("applied_at_chirho")) {
    dbChirho.run("ALTER TABLE latin_symbol_vision_reviews_chirho ADD COLUMN applied_at_chirho TEXT");
  }
  if (!columnsChirho.has("schema_version_chirho")) {
    dbChirho.run("ALTER TABLE latin_symbol_vision_reviews_chirho ADD COLUMN schema_version_chirho INTEGER NOT NULL DEFAULT 1");
  }
  dbChirho.run(`
CREATE INDEX IF NOT EXISTS idx_lsvr_item_current_chirho
  ON latin_symbol_vision_reviews_chirho(item_id_chirho, is_current_chirho)`);
  dbChirho.run(`
CREATE INDEX IF NOT EXISTS idx_lsvr_verdict_current_chirho
  ON latin_symbol_vision_reviews_chirho(verdict_chirho, is_current_chirho)`);
}

function usageChirho(): string {
  return [
    `Usage: bun run ${MODULE_CHIRHO} --id=<packet-item-id> --verdict=<accepted-clean|reviewed-issues> --reviewer=<reviewer-chirho> [--issue-flags=a,b] [--notes=text]`,
    "",
    "Use --export-backup[=path] to write a committable JSON backup of current review rows.",
    "Use --list-pending to print the first unreviewed packet IDs.",
  ].join("\n");
}

function exportBackupPathChirho(argsChirho: string[]): string | null {
  const explicitPathChirho = parseArgValueChirho(argsChirho, "export-backup");
  if (explicitPathChirho !== undefined) return explicitPathChirho;
  return argsChirho.includes("--export-backup") ? LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO : null;
}

function parseStoredIssueFlagsChirho(valueChirho: string | null): string[] {
  if (!valueChirho) return [];
  try {
    const parsedChirho = JSON.parse(valueChirho) as unknown;
    if (!Array.isArray(parsedChirho)) return [];
    return parsedChirho.filter((flagChirho): flagChirho is string => typeof flagChirho === "string");
  } catch {
    return [];
  }
}

function currentReviewRowsChirho(dbChirho: Database): ReviewDbRowChirho[] {
  return dbChirho
    .query(`
      SELECT id_chirho, item_id_chirho, item_kind_chirho, volume_chirho, page_chirho,
             line_index_chirho, segment_index_chirho, word_index_chirho, script_chirho,
             source_chirho, current_text_chirho, current_text_hash_chirho, line_text_chirho,
             verdict_chirho, issue_flags_chirho, notes_chirho, packet_generated_at_chirho,
             reviewer_chirho, created_at_chirho, updated_at_chirho, supersedes_id_chirho,
             applied_at_chirho, schema_version_chirho
        FROM latin_symbol_vision_reviews_chirho
       WHERE is_current_chirho = 1
         AND verdict_chirho <> 'undo-chirho'
       ORDER BY item_id_chirho, id_chirho`)
    .all() as ReviewDbRowChirho[];
}

function writeBackupChirho(
  dbChirho: Database,
  backupPathChirho: string,
  liveItemsChirho: LatinSymbolVisionLiveItemChirho[],
  manifestChirho: PacketManifestChirho
): void {
  const rowsChirho = currentReviewRowsChirho(dbChirho);
  const liveHashByIdChirho = new Map(liveItemsChirho.map((itemChirho) => [itemChirho.idChirho, hashTextChirho(itemChirho.textChirho)]));
  const backupChirho = {
    john316Chirho:
      "For God so loved the world that he gave his only begotten Son, that whoever believes in him should not perish but have eternal life. John 3:16",
    schemaVersionChirho: 1,
    generatedAtChirho: new Date().toISOString(),
    sourceChirho: "latin_symbol_vision_reviews_chirho current rows",
    packetGeneratedAtChirho: manifestChirho.generatedAtChirho ?? null,
    liveItemCountChirho: liveItemsChirho.length,
    reviewCountChirho: rowsChirho.length,
    reviewsChirho: rowsChirho.map((rowChirho) => ({
      dbIdChirho: rowChirho.id_chirho,
      itemIdChirho: rowChirho.item_id_chirho,
      itemKindChirho: rowChirho.item_kind_chirho,
      volumeChirho: rowChirho.volume_chirho,
      pageChirho: rowChirho.page_chirho,
      lineIndexChirho: rowChirho.line_index_chirho,
      segmentIndexChirho: rowChirho.segment_index_chirho,
      wordIndexChirho: rowChirho.word_index_chirho,
      scriptChirho: rowChirho.script_chirho,
      sourceChirho: rowChirho.source_chirho,
      currentTextChirho: rowChirho.current_text_chirho,
      currentTextHashChirho: rowChirho.current_text_hash_chirho,
      currentHashMatchesLiveChirho: liveHashByIdChirho.get(rowChirho.item_id_chirho) === rowChirho.current_text_hash_chirho,
      lineTextChirho: rowChirho.line_text_chirho,
      verdictChirho: rowChirho.verdict_chirho,
      issueFlagsChirho: parseStoredIssueFlagsChirho(rowChirho.issue_flags_chirho),
      notesChirho: rowChirho.notes_chirho,
      packetGeneratedAtChirho: rowChirho.packet_generated_at_chirho,
      reviewerChirho: rowChirho.reviewer_chirho,
      createdAtChirho: rowChirho.created_at_chirho,
      updatedAtChirho: rowChirho.updated_at_chirho,
      supersedesIdChirho: rowChirho.supersedes_id_chirho,
      appliedAtChirho: rowChirho.applied_at_chirho,
      schemaVersionChirho: rowChirho.schema_version_chirho,
    })),
  };
  mkdirSync(dirname(backupPathChirho), { recursive: true });
  writeFileSync(backupPathChirho, `${JSON.stringify(backupChirho, null, 2)}\n`);
  console.log(`[${MODULE_CHIRHO}] exported ${rowsChirho.length} current review row(s) to ${backupPathChirho}`);
}

function acceptedCleanReviewIdsChirho(
  dbChirho: Database,
  liveItemsChirho: LatinSymbolVisionLiveItemChirho[]
): Set<string> {
  const hashByIdChirho = new Map(
    liveItemsChirho.map((itemChirho) => [itemChirho.idChirho, hashTextChirho(itemChirho.textChirho)])
  );
  const rowsChirho = dbChirho
    .query(`
      SELECT item_id_chirho, current_text_hash_chirho
        FROM latin_symbol_vision_reviews_chirho
       WHERE is_current_chirho = 1
         AND verdict_chirho = 'accepted-clean-chirho'`)
    .all() as Array<{ item_id_chirho: string; current_text_hash_chirho: string }>;
  return new Set(
    rowsChirho
      .filter((rowChirho) => hashByIdChirho.get(rowChirho.item_id_chirho) === rowChirho.current_text_hash_chirho)
      .map((rowChirho) => rowChirho.item_id_chirho)
  );
}

function listPendingChirho(
  dbChirho: Database,
  manifestChirho: PacketManifestChirho,
  liveItemsChirho: LatinSymbolVisionLiveItemChirho[]
): void {
  const acceptedIdsChirho = acceptedCleanReviewIdsChirho(dbChirho, liveItemsChirho);
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
  const manifestChirho = loadManifestChirho(manifestPathChirho);
  const liveItemsChirho = latinSymbolVisionLiveItemsChirho();
  const liveByIdChirho = assertManifestMatchesLiveChirho(manifestChirho, liveItemsChirho);
  const dbChirho = new Database(dbPathChirho);
  ensureSchemaChirho(dbChirho);

  const backupPathChirho = exportBackupPathChirho(argsChirho);
  if (backupPathChirho !== null) {
    writeBackupChirho(dbChirho, backupPathChirho, liveItemsChirho, manifestChirho);
    dbChirho.close();
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
  if (verdictChirho === "accepted-clean-chirho" && issueFlagsChirho.length > 0) {
    dbChirho.close();
    throw new Error("accepted-clean-chirho cannot carry issue flags");
  }
  if (verdictChirho === "reviewed-issues-chirho" && issueFlagsChirho.length === 0) {
    dbChirho.close();
    throw new Error("reviewed-issues-chirho requires at least one --issue-flags value");
  }
  const reviewerChirho = parseArgValueChirho(argsChirho, "reviewer") ?? "human-chirho";
  const notesChirho = parseArgValueChirho(argsChirho, "notes") ?? null;
  const nowChirho = new Date().toISOString();
  const currentChirho = dbChirho
    .query("SELECT id_chirho FROM latin_symbol_vision_reviews_chirho WHERE item_id_chirho = ? AND is_current_chirho = 1 ORDER BY id_chirho DESC LIMIT 1")
    .get(itemChirho.idChirho) as { id_chirho: number } | undefined;
  dbChirho
    .prepare("UPDATE latin_symbol_vision_reviews_chirho SET is_current_chirho = 0 WHERE item_id_chirho = ? AND is_current_chirho = 1")
    .run(itemChirho.idChirho);
  const resultChirho = dbChirho
    .prepare(`
INSERT INTO latin_symbol_vision_reviews_chirho
  (item_id_chirho, item_kind_chirho, volume_chirho, page_chirho, line_index_chirho,
   segment_index_chirho, word_index_chirho, script_chirho, source_chirho,
   current_text_chirho, current_text_hash_chirho, line_text_chirho, verdict_chirho,
   issue_flags_chirho, notes_chirho, packet_generated_at_chirho, reviewer_chirho,
   created_at_chirho, updated_at_chirho, supersedes_id_chirho, is_current_chirho, schema_version_chirho)
VALUES
  (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`)
    .run(
      liveItemChirho.idChirho,
      liveItemChirho.itemKindChirho,
      liveItemChirho.volumeChirho,
      liveItemChirho.pageChirho,
      liveItemChirho.lineIndexChirho,
      liveItemChirho.segmentIndexChirho,
      liveItemChirho.wordIndexChirho,
      liveItemChirho.scriptChirho,
      liveItemChirho.sourceChirho,
      liveItemChirho.textChirho,
      hashTextChirho(liveItemChirho.textChirho),
      liveItemChirho.lineTextChirho,
      verdictChirho,
      JSON.stringify(issueFlagsChirho),
      notesChirho,
      manifestChirho.generatedAtChirho ?? null,
      reviewerChirho,
      nowChirho,
      nowChirho,
      currentChirho?.id_chirho ?? null
    );
  dbChirho.close();
  console.log(
    `[${MODULE_CHIRHO}] saved id=${resultChirho.lastInsertRowid} item=${itemChirho.idChirho} verdict=${verdictChirho}`
  );
}

if (import.meta.main) mainChirho();
