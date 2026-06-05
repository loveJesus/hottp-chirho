// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Shared append-only store for Latin/symbol vision review decisions.
 *
 * This module is the single integrity path for the CLI recorder and browser
 * reviewer: packet/live assertion, schema, superseding inserts, and backup
 * export all stay anchored to current live span/D1 text.
 */

import { Database } from "bun:sqlite";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { writeJsonAtomicChirho } from "./atomic-json-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  hashTextChirho,
  type LatinSymbolVisionLiveItemChirho,
} from "./latin-symbol-vision-live-items-chirho.ts";
import {
  packetImageHashDriftsChirho,
  packetMarkdownPathDriftsChirho,
  TARGET_LINE_MARKDOWN_PATH_PAIRS_CHIRHO,
  type PacketImageHashFieldsChirho,
} from "./packet-image-fingerprint-chirho.ts";
import { reviewNotesLookPlaceholderChirho } from "./template-placeholder-chirho.ts";

export const LATIN_SYMBOL_PACK_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "latin-symbol-vision-pack-chirho",
  "2026-05-31-chirho"
);
export const LATIN_SYMBOL_PACK_MANIFEST_PATH_CHIRHO = join(
  LATIN_SYMBOL_PACK_DIR_CHIRHO,
  "manifest-chirho.json"
);
export const LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "latin-symbol-vision-reviews-backup-2026-05-31-chirho.json"
);
export const LATIN_SYMBOL_REVIEW_VERDICT_VALUES_CHIRHO = new Set([
  "accepted-clean-chirho",
  "reviewed-issues-chirho",
]);
export const LATIN_SYMBOL_REVIEW_ISSUE_FLAGS_CHIRHO = [
  "letters-chirho",
  "punctuation-chirho",
  "spacing-chirho",
  "wrong-script-chirho",
  "segmentation-chirho",
  "garbled-text-chirho",
  "missing-text-chirho",
  "extra-text-chirho",
  "wrong-language-chirho",
] as const;
export const LATIN_SYMBOL_REVIEW_ISSUE_FLAG_VALUES_CHIRHO = new Set<string>(
  LATIN_SYMBOL_REVIEW_ISSUE_FLAGS_CHIRHO
);

export interface LatinSymbolPacketItemChirho extends PacketImageHashFieldsChirho {
  idChirho: string;
  itemKindChirho: "span-chirho" | "d1-word-chirho";
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number | null;
  wordIndexChirho: number | null;
  scriptChirho: string;
  textChirho: string;
  lineTextChirho: string;
  sourceChirho: string;
  targetMarkdownPathChirho: string;
  lineMarkdownPathChirho: string;
}

export interface LatinSymbolPacketManifestChirho {
  generatedAtChirho?: string;
  itemsChirho?: LatinSymbolPacketItemChirho[];
}

export interface LatinSymbolReviewDbRowChirho {
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
  accept_clean_chirho: number;
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

export interface LatinSymbolReviewRowChirho {
  idChirho: number;
  itemIdChirho: string;
  verdictChirho: string;
  acceptCleanChirho: boolean;
  issueFlagsChirho: string[];
  notesChirho: string | null;
  reviewerChirho: string;
  currentTextHashChirho: string;
  updatedAtChirho: string;
}

export interface SaveLatinSymbolReviewParamsChirho {
  dbChirho: Database;
  manifestChirho: LatinSymbolPacketManifestChirho;
  liveItemChirho: LatinSymbolVisionLiveItemChirho;
  verdictChirho: string;
  acceptCleanChirho: boolean;
  issueFlagsChirho: string[];
  notesChirho: string | null;
  reviewerChirho: string;
}

export function loadLatinSymbolPacketManifestChirho(
  pathChirho = LATIN_SYMBOL_PACK_MANIFEST_PATH_CHIRHO
): LatinSymbolPacketManifestChirho {
  if (!existsSync(pathChirho)) {
    throw new Error(`Latin/symbol packet manifest missing: ${pathChirho}`);
  }
  const manifestChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as LatinSymbolPacketManifestChirho;
  if (!Array.isArray(manifestChirho.itemsChirho)) {
    throw new Error(`Latin/symbol packet manifest malformed: ${pathChirho}`);
  }
  return manifestChirho;
}

export function assertLatinSymbolManifestMatchesLiveChirho(
  manifestChirho: LatinSymbolPacketManifestChirho,
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
    if (
      typeof packetItemChirho.sourcePathChirho !== "string" ||
      typeof packetItemChirho.targetPathChirho !== "string" ||
      typeof packetItemChirho.linePathChirho !== "string" ||
      typeof packetItemChirho.targetMarkdownPathChirho !== "string" ||
      typeof packetItemChirho.lineMarkdownPathChirho !== "string" ||
      typeof packetItemChirho.sourceImageHashChirho !== "string" ||
      typeof packetItemChirho.targetImageHashChirho !== "string" ||
      typeof packetItemChirho.lineImageHashChirho !== "string"
    ) {
      throw new Error(`Latin/symbol packet manifest malformed: ${packetItemChirho.idChirho} image hash fields missing; regenerate make-latin-symbol-vision-pack-chirho`);
    }
    const liveItemChirho = liveByIdChirho.get(packetItemChirho.idChirho);
    if (liveItemChirho === undefined) {
      throw new Error(
        `Latin/symbol packet is stale: ${packetItemChirho.idChirho} is not present in live state; regenerate make-latin-symbol-vision-pack-chirho`
      );
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
    if (liveItemChirho.lineTextChirho !== packetItemChirho.lineTextChirho) {
      throw new Error(`Latin/symbol packet is stale: ${packetItemChirho.idChirho} line text changed; regenerate make-latin-symbol-vision-pack-chirho`);
    }
  }
  const imageDriftsChirho = packetImageHashDriftsChirho(packetItemsChirho);
  if (imageDriftsChirho.length !== 0) {
    throw new Error(
      `Latin/symbol packet is stale: ${imageDriftsChirho.length} image hash drift(s); regenerate make-latin-symbol-vision-pack-chirho`
    );
  }
  const markdownPathDriftsChirho = packetMarkdownPathDriftsChirho(
    packetItemsChirho,
    LATIN_SYMBOL_PACK_DIR_CHIRHO,
    TARGET_LINE_MARKDOWN_PATH_PAIRS_CHIRHO
  );
  if (markdownPathDriftsChirho.length !== 0) {
    throw new Error(
      `Latin/symbol packet is stale: ${markdownPathDriftsChirho.length} markdown image path drift(s); regenerate make-latin-symbol-vision-pack-chirho`
    );
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

export function ensureLatinSymbolReviewSchemaChirho(dbChirho: Database): void {
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
  accept_clean_chirho       INTEGER NOT NULL DEFAULT 0,
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
  if (!columnsChirho.has("accept_clean_chirho")) {
    dbChirho.run("ALTER TABLE latin_symbol_vision_reviews_chirho ADD COLUMN accept_clean_chirho INTEGER NOT NULL DEFAULT 0");
  }
  dbChirho.run(`
CREATE INDEX IF NOT EXISTS idx_lsvr_item_current_chirho
  ON latin_symbol_vision_reviews_chirho(item_id_chirho, is_current_chirho)`);
  dbChirho.run(`
CREATE INDEX IF NOT EXISTS idx_lsvr_verdict_current_chirho
  ON latin_symbol_vision_reviews_chirho(verdict_chirho, is_current_chirho)`);
}

export function normalizeLatinSymbolIssueFlagsChirho(flagsChirho: string[]): string[] {
  const normalizedChirho: string[] = [];
  for (const flagChirho of flagsChirho) {
    if (!LATIN_SYMBOL_REVIEW_ISSUE_FLAG_VALUES_CHIRHO.has(flagChirho)) {
      throw new Error(
        `unknown issue flag ${flagChirho}; allowed=${LATIN_SYMBOL_REVIEW_ISSUE_FLAGS_CHIRHO.join(",")}`
      );
    }
    if (!normalizedChirho.includes(flagChirho)) normalizedChirho.push(flagChirho);
  }
  return normalizedChirho;
}

export function parseLatinSymbolIssueFlagsChirho(valueChirho: unknown): string[] {
  if (!Array.isArray(valueChirho)) {
    throw new Error("issueFlagsChirho must be an array");
  }
  const flagsChirho: string[] = [];
  for (const flagChirho of valueChirho) {
    if (typeof flagChirho !== "string" || flagChirho.length === 0) {
      throw new Error(`unsupported issue flag: ${String(flagChirho)}`);
    }
    flagsChirho.push(flagChirho);
  }
  return normalizeLatinSymbolIssueFlagsChirho(flagsChirho);
}

export function parseStoredLatinSymbolIssueFlagsChirho(valueChirho: string | null): string[] {
  if (!valueChirho) return [];
  try {
    return parseLatinSymbolIssueFlagsChirho(JSON.parse(valueChirho));
  } catch {
    return [];
  }
}

export function currentLatinSymbolReviewRowsChirho(dbChirho: Database): LatinSymbolReviewDbRowChirho[] {
  return dbChirho
    .query(`
      SELECT id_chirho, item_id_chirho, item_kind_chirho, volume_chirho, page_chirho,
             line_index_chirho, segment_index_chirho, word_index_chirho, script_chirho,
             source_chirho, current_text_chirho, current_text_hash_chirho, line_text_chirho,
             verdict_chirho, accept_clean_chirho, issue_flags_chirho, notes_chirho, packet_generated_at_chirho,
             reviewer_chirho, created_at_chirho, updated_at_chirho, supersedes_id_chirho,
             applied_at_chirho, schema_version_chirho
        FROM latin_symbol_vision_reviews_chirho
       WHERE is_current_chirho = 1
         AND verdict_chirho <> 'undo-chirho'
       ORDER BY item_id_chirho, id_chirho`)
    .all() as LatinSymbolReviewDbRowChirho[];
}

export function publicLatinSymbolReviewRowsChirho(dbChirho: Database): LatinSymbolReviewRowChirho[] {
  return currentLatinSymbolReviewRowsChirho(dbChirho).map((rowChirho) => ({
    idChirho: rowChirho.id_chirho,
    itemIdChirho: rowChirho.item_id_chirho,
    verdictChirho: rowChirho.verdict_chirho,
    acceptCleanChirho: rowChirho.accept_clean_chirho === 1,
    issueFlagsChirho: parseStoredLatinSymbolIssueFlagsChirho(rowChirho.issue_flags_chirho),
    notesChirho: rowChirho.notes_chirho,
    reviewerChirho: rowChirho.reviewer_chirho,
    currentTextHashChirho: rowChirho.current_text_hash_chirho,
    updatedAtChirho: rowChirho.updated_at_chirho,
  }));
}

export function writeLatinSymbolReviewBackupChirho(
  dbChirho: Database,
  backupPathChirho: string,
  liveItemsChirho: LatinSymbolVisionLiveItemChirho[],
  manifestChirho: LatinSymbolPacketManifestChirho
): number {
  const rowsChirho = currentLatinSymbolReviewRowsChirho(dbChirho);
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
      acceptCleanChirho: rowChirho.accept_clean_chirho === 1,
      issueFlagsChirho: parseStoredLatinSymbolIssueFlagsChirho(rowChirho.issue_flags_chirho),
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
  writeJsonAtomicChirho(backupPathChirho, backupChirho);
  return rowsChirho.length;
}

export function validLatinSymbolReviewIdsByVerdictChirho(
  dbChirho: Database,
  liveItemsChirho: LatinSymbolVisionLiveItemChirho[],
  verdictChirho: "accepted-clean-chirho" | "reviewed-issues-chirho"
): Set<string> {
  const hashByIdChirho = new Map(
    liveItemsChirho.map((itemChirho) => [itemChirho.idChirho, hashTextChirho(itemChirho.textChirho)])
  );
  const rowsChirho = dbChirho
    .query(`
      SELECT item_id_chirho, current_text_hash_chirho, accept_clean_chirho
        FROM latin_symbol_vision_reviews_chirho
       WHERE is_current_chirho = 1
         AND verdict_chirho = ?`)
    .all(verdictChirho) as Array<{ item_id_chirho: string; current_text_hash_chirho: string; accept_clean_chirho: number }>;
  return new Set(
    rowsChirho
      .filter(
        (rowChirho) =>
          (verdictChirho !== "accepted-clean-chirho" || rowChirho.accept_clean_chirho === 1) &&
          hashByIdChirho.get(rowChirho.item_id_chirho) === rowChirho.current_text_hash_chirho
      )
      .map((rowChirho) => rowChirho.item_id_chirho)
  );
}

export function acceptedCleanLatinSymbolReviewIdsChirho(
  dbChirho: Database,
  liveItemsChirho: LatinSymbolVisionLiveItemChirho[]
): Set<string> {
  return validLatinSymbolReviewIdsByVerdictChirho(dbChirho, liveItemsChirho, "accepted-clean-chirho");
}

export function reviewedIssueLatinSymbolReviewIdsChirho(
  dbChirho: Database,
  liveItemsChirho: LatinSymbolVisionLiveItemChirho[]
): Set<string> {
  return validLatinSymbolReviewIdsByVerdictChirho(dbChirho, liveItemsChirho, "reviewed-issues-chirho");
}

export function verdictForLatinSymbolIssueFlagsChirho(issueFlagsChirho: string[]): string {
  return issueFlagsChirho.length === 0 ? "accepted-clean-chirho" : "reviewed-issues-chirho";
}

export function saveLatinSymbolReviewChirho(paramsChirho: SaveLatinSymbolReviewParamsChirho): LatinSymbolReviewRowChirho {
  const issueFlagsChirho = normalizeLatinSymbolIssueFlagsChirho(paramsChirho.issueFlagsChirho);
  if (!LATIN_SYMBOL_REVIEW_VERDICT_VALUES_CHIRHO.has(paramsChirho.verdictChirho)) {
    throw new Error(`invalid verdict: ${paramsChirho.verdictChirho}`);
  }
  if (paramsChirho.verdictChirho === "accepted-clean-chirho" && issueFlagsChirho.length > 0) {
    throw new Error("accepted-clean-chirho cannot carry issue flags");
  }
  if (paramsChirho.verdictChirho === "accepted-clean-chirho" && paramsChirho.acceptCleanChirho !== true) {
    throw new Error("accepted-clean-chirho requires acceptCleanChirho=true acknowledgement");
  }
  if (paramsChirho.verdictChirho === "reviewed-issues-chirho" && issueFlagsChirho.length === 0) {
    throw new Error("reviewed-issues-chirho requires at least one issue flag");
  }
  const notesChirho =
    typeof paramsChirho.notesChirho === "string" && paramsChirho.notesChirho.trim().length > 0
      ? paramsChirho.notesChirho.trim()
      : null;
  if (paramsChirho.verdictChirho === "reviewed-issues-chirho" && notesChirho === null) {
    throw new Error("reviewed-issues-chirho requires notesChirho");
  }
  if (
    paramsChirho.verdictChirho === "reviewed-issues-chirho" &&
    notesChirho !== null &&
    reviewNotesLookPlaceholderChirho(notesChirho)
  ) {
    throw new Error("reviewed-issues-chirho requires notesChirho to explain the issue, not a template placeholder");
  }
  const nowChirho = new Date().toISOString();
  const currentChirho = paramsChirho.dbChirho
    .query("SELECT id_chirho FROM latin_symbol_vision_reviews_chirho WHERE item_id_chirho = ? AND is_current_chirho = 1 ORDER BY id_chirho DESC LIMIT 1")
    .get(paramsChirho.liveItemChirho.idChirho) as { id_chirho: number } | undefined;
  paramsChirho.dbChirho
    .prepare("UPDATE latin_symbol_vision_reviews_chirho SET is_current_chirho = 0 WHERE item_id_chirho = ? AND is_current_chirho = 1")
    .run(paramsChirho.liveItemChirho.idChirho);
  const currentTextHashChirho = hashTextChirho(paramsChirho.liveItemChirho.textChirho);
  const resultChirho = paramsChirho.dbChirho
    .prepare(`
INSERT INTO latin_symbol_vision_reviews_chirho
  (item_id_chirho, item_kind_chirho, volume_chirho, page_chirho, line_index_chirho,
   segment_index_chirho, word_index_chirho, script_chirho, source_chirho,
   current_text_chirho, current_text_hash_chirho, line_text_chirho, verdict_chirho,
   accept_clean_chirho, issue_flags_chirho, notes_chirho, packet_generated_at_chirho, reviewer_chirho,
   created_at_chirho, updated_at_chirho, supersedes_id_chirho, is_current_chirho, schema_version_chirho)
VALUES
  (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`)
    .run(
      paramsChirho.liveItemChirho.idChirho,
      paramsChirho.liveItemChirho.itemKindChirho,
      paramsChirho.liveItemChirho.volumeChirho,
      paramsChirho.liveItemChirho.pageChirho,
      paramsChirho.liveItemChirho.lineIndexChirho,
      paramsChirho.liveItemChirho.segmentIndexChirho,
      paramsChirho.liveItemChirho.wordIndexChirho,
      paramsChirho.liveItemChirho.scriptChirho,
      paramsChirho.liveItemChirho.sourceChirho,
      paramsChirho.liveItemChirho.textChirho,
      currentTextHashChirho,
      paramsChirho.liveItemChirho.lineTextChirho,
      paramsChirho.verdictChirho,
      paramsChirho.acceptCleanChirho ? 1 : 0,
      JSON.stringify(issueFlagsChirho),
      notesChirho,
      paramsChirho.manifestChirho.generatedAtChirho ?? null,
      paramsChirho.reviewerChirho,
      nowChirho,
      nowChirho,
      currentChirho?.id_chirho ?? null
    );
  return {
    idChirho: Number(resultChirho.lastInsertRowid),
    itemIdChirho: paramsChirho.liveItemChirho.idChirho,
    verdictChirho: paramsChirho.verdictChirho,
    acceptCleanChirho: paramsChirho.acceptCleanChirho,
    issueFlagsChirho,
    notesChirho,
    reviewerChirho: paramsChirho.reviewerChirho,
    currentTextHashChirho,
    updatedAtChirho: nowChirho,
  };
}
