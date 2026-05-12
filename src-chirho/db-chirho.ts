// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { PROGRESS_DB_PATH_CHIRHO, SPEC_DIR_CHIRHO } from "./config-chirho.ts";
import * as schemaChirho from "./schema-db-chirho.ts";
import { mkdirSync, existsSync } from "fs";

/** Ensure spec-chirho directory exists */
if (!existsSync(SPEC_DIR_CHIRHO)) {
  mkdirSync(SPEC_DIR_CHIRHO, { recursive: true });
}

/** Raw bun:sqlite connection */
export const sqliteChirho = new Database(PROGRESS_DB_PATH_CHIRHO, {
  create: true,
});

/** Enable WAL mode for performance */
sqliteChirho.run("PRAGMA journal_mode = WAL");
sqliteChirho.run("PRAGMA foreign_keys = ON");

/** Drizzle ORM instance */
export const dbChirho = drizzle(sqliteChirho, { schema: schemaChirho });

/** Initialize all tables */
export function initDbChirho(): void {
  sqliteChirho.run(`
    CREATE TABLE IF NOT EXISTS steps_taken_chirho (
      id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_code_chirho TEXT NOT NULL,
      timestamp_start_chirho TEXT NOT NULL,
      timestamp_end_chirho TEXT,
      action_taken_chirho TEXT NOT NULL,
      result_of_action_chirho TEXT,
      overview_of_result_chirho TEXT
    )
  `);

  sqliteChirho.run(`
    CREATE TABLE IF NOT EXISTS pages_chirho (
      id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
      volume_number_chirho INTEGER NOT NULL,
      page_number_chirho INTEGER NOT NULL,
      french_text_chirho TEXT,
      image_path_chirho TEXT,
      snippet_count_chirho INTEGER DEFAULT 0,
      status_chirho TEXT NOT NULL DEFAULT 'pending-chirho',
      created_at_chirho TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at_chirho TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(volume_number_chirho, page_number_chirho)
    )
  `);

  sqliteChirho.run(`
    CREATE TABLE IF NOT EXISTS snippets_chirho (
      id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id_chirho INTEGER NOT NULL REFERENCES pages_chirho(id_chirho),
      snippet_index_chirho INTEGER NOT NULL,
      x_min_chirho REAL,
      y_min_chirho REAL,
      x_max_chirho REAL,
      y_max_chirho REAL,
      garbled_text_chirho TEXT,
      image_path_chirho TEXT,
      r2_key_chirho TEXT,
      suggested_text_chirho TEXT,
      accepted_text_chirho TEXT,
      script_type_chirho TEXT DEFAULT 'unknown-chirho',
      status_chirho TEXT NOT NULL DEFAULT 'pending-chirho',
      created_at_chirho TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at_chirho TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ─── Scanline-based pipeline tables ───

  sqliteChirho.run(`
    CREATE TABLE IF NOT EXISTS scanlines_chirho (
      id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id_chirho INTEGER NOT NULL REFERENCES pages_chirho(id_chirho),
      line_index_chirho INTEGER NOT NULL,
      x_min_chirho REAL,
      y_min_chirho REAL,
      width_chirho REAL,
      height_chirho REAL,
      pdftotext_chirho TEXT,
      reconstructed_text_chirho TEXT,
      image_r2_key_chirho TEXT,
      words_json_chirho TEXT,
      segment_count_chirho INTEGER DEFAULT 0,
      status_chirho TEXT NOT NULL DEFAULT 'pending-chirho',
      UNIQUE(page_id_chirho, line_index_chirho)
    )
  `);

  sqliteChirho.run(`
    CREATE TABLE IF NOT EXISTS segments_chirho (
      id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
      scanline_id_chirho INTEGER NOT NULL REFERENCES scanlines_chirho(id_chirho),
      segment_index_chirho INTEGER NOT NULL,
      word_start_index_chirho INTEGER,
      word_end_index_chirho INTEGER,
      x_min_px_chirho REAL,
      width_px_chirho REAL,
      pdftotext_chirho TEXT,
      ocr_text_chirho TEXT,
      accepted_text_chirho TEXT,
      script_type_chirho TEXT DEFAULT 'unknown-chirho',
      image_r2_key_chirho TEXT,
      status_chirho TEXT NOT NULL DEFAULT 'pending-chirho',
      UNIQUE(scanline_id_chirho, segment_index_chirho)
    )
  `);

  sqliteChirho.run(`
    CREATE TABLE IF NOT EXISTS known_words_chirho (
      id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
      word_chirho TEXT NOT NULL,
      category_chirho TEXT NOT NULL DEFAULT 'unknown-chirho',
      volume_number_chirho INTEGER NOT NULL DEFAULT 0,
      status_chirho TEXT NOT NULL DEFAULT 'agent-pending-chirho',
      source_page_id_chirho INTEGER,
      source_line_index_chirho INTEGER,
      confirmed_at_chirho TEXT,
      confirmed_by_chirho TEXT,
      added_at_chirho TEXT NOT NULL DEFAULT (datetime('now')),
      added_by_chirho TEXT,
      notes_chirho TEXT
    )
  `);
  // Be idempotent on existing tables that predate the tier migration.
  addColumnIfMissingChirho("known_words_chirho", "status_chirho", "TEXT NOT NULL DEFAULT 'agent-pending-chirho'");
  addColumnIfMissingChirho("known_words_chirho", "source_page_id_chirho", "INTEGER");
  addColumnIfMissingChirho("known_words_chirho", "source_line_index_chirho", "INTEGER");
  addColumnIfMissingChirho("known_words_chirho", "confirmed_at_chirho", "TEXT");
  addColumnIfMissingChirho("known_words_chirho", "confirmed_by_chirho", "TEXT");
  sqliteChirho.run(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_known_words_word_vol_chirho
       ON known_words_chirho(word_chirho, volume_number_chirho)`
  );
  sqliteChirho.run(
    `CREATE INDEX IF NOT EXISTS idx_known_words_word_chirho
       ON known_words_chirho(word_chirho)`
  );

  sqliteChirho.run(`
    CREATE TABLE IF NOT EXISTS volume_profiles_chirho (
      id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
      volume_number_chirho INTEGER NOT NULL UNIQUE,
      profile_name_chirho TEXT,
      garbled_threshold_chirho REAL DEFAULT 0.4,
      detection_strategy_chirho TEXT DEFAULT 'garbled-score-chirho',
      font_hints_json_chirho TEXT,
      notes_chirho TEXT
    )
  `);

  // Add reconstructed_text_chirho column to pages if missing
  addColumnIfMissingChirho(
    "pages_chirho",
    "reconstructed_text_chirho",
    "TEXT"
  );

  // Pass A columns — page-level line-approval tracking
  addColumnIfMissingChirho(
    "pages_chirho",
    "lines_approved_at_chirho",
    "TEXT"
  );
  addColumnIfMissingChirho(
    "pages_chirho",
    "lines_rejection_note_chirho",
    "TEXT"
  );
}

/** Safely add a column if it doesn't already exist */
function addColumnIfMissingChirho(
  tableNameChirho: string,
  columnNameChirho: string,
  columnTypeChirho: string
): void {
  try {
    sqliteChirho.run(
      `ALTER TABLE ${tableNameChirho} ADD COLUMN ${columnNameChirho} ${columnTypeChirho}`
    );
  } catch (_errChirho) {
    // Column already exists — this is fine
  }
}

/** Log a step to the progress DB */
export function logStepStartChirho(
  agentCodeChirho: string,
  actionTakenChirho: string
): number {
  const resultChirho = sqliteChirho.run(
    `INSERT INTO steps_taken_chirho (agent_code_chirho, timestamp_start_chirho, action_taken_chirho)
     VALUES (?, datetime('now'), ?)`,
    [agentCodeChirho, actionTakenChirho]
  );
  return Number(resultChirho.lastInsertRowid);
}

/** Complete a step log entry */
export function logStepEndChirho(
  idChirho: number,
  resultOfActionChirho: string,
  overviewOfResultChirho: string
): void {
  sqliteChirho.run(
    `UPDATE steps_taken_chirho
     SET timestamp_end_chirho = datetime('now'),
         result_of_action_chirho = ?,
         overview_of_result_chirho = ?
     WHERE id_chirho = ?`,
    [resultOfActionChirho, overviewOfResultChirho, idChirho]
  );
}
