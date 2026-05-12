// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/** Agent progress logging table (required by AGENTS.md) */
export const stepsTakenChirho = sqliteTable("steps_taken_chirho", {
  idChirho: integer("id_chirho").primaryKey({ autoIncrement: true }),
  agentCodeChirho: text("agent_code_chirho").notNull(),
  timestampStartChirho: text("timestamp_start_chirho").notNull(),
  timestampEndChirho: text("timestamp_end_chirho"),
  actionTakenChirho: text("action_taken_chirho").notNull(),
  resultOfActionChirho: text("result_of_action_chirho"),
  overviewOfResultChirho: text("overview_of_result_chirho"),
});

/** Page tracking table */
export const pagesChirho = sqliteTable("pages_chirho", {
  idChirho: integer("id_chirho").primaryKey({ autoIncrement: true }),
  volumeNumberChirho: integer("volume_number_chirho").notNull(),
  pageNumberChirho: integer("page_number_chirho").notNull(),
  frenchTextChirho: text("french_text_chirho"),
  imagePathChirho: text("image_path_chirho"),
  snippetCountChirho: integer("snippet_count_chirho").default(0),
  visionTextChirho: text("vision_text_chirho"),
  reconstructedTextChirho: text("reconstructed_text_chirho"),
  linesApprovedAtChirho: text("lines_approved_at_chirho"),
  linesRejectionNoteChirho: text("lines_rejection_note_chirho"),
  statusChirho: text("status_chirho").default("pending-chirho").notNull(),
  createdAtChirho: text("created_at_chirho")
    .default(sql`(datetime('now'))`)
    .notNull(),
  updatedAtChirho: text("updated_at_chirho")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

/** Each text line on a page (scanline-based pipeline) */
export const scanlinesChirho = sqliteTable("scanlines_chirho", {
  idChirho: integer("id_chirho").primaryKey({ autoIncrement: true }),
  pageIdChirho: integer("page_id_chirho")
    .notNull()
    .references(() => pagesChirho.idChirho),
  lineIndexChirho: integer("line_index_chirho").notNull(),
  xMinChirho: real("x_min_chirho"),
  yMinChirho: real("y_min_chirho"),
  widthChirho: real("width_chirho"),
  heightChirho: real("height_chirho"),
  pdftotextChirho: text("pdftotext_chirho"),
  reconstructedTextChirho: text("reconstructed_text_chirho"),
  imageR2KeyChirho: text("image_r2_key_chirho"),
  wordsJsonChirho: text("words_json_chirho"),
  segmentCountChirho: integer("segment_count_chirho").default(0),
  statusChirho: text("status_chirho").default("pending-chirho").notNull(),
});

/** Each word-run within a scanline (French or non-French) */
export const segmentsChirho = sqliteTable("segments_chirho", {
  idChirho: integer("id_chirho").primaryKey({ autoIncrement: true }),
  scanlineIdChirho: integer("scanline_id_chirho")
    .notNull()
    .references(() => scanlinesChirho.idChirho),
  segmentIndexChirho: integer("segment_index_chirho").notNull(),
  wordStartIndexChirho: integer("word_start_index_chirho"),
  wordEndIndexChirho: integer("word_end_index_chirho"),
  xMinPxChirho: real("x_min_px_chirho"),
  widthPxChirho: real("width_px_chirho"),
  pdftotextChirho: text("pdftotext_chirho"),
  ocrTextChirho: text("ocr_text_chirho"),
  acceptedTextChirho: text("accepted_text_chirho"),
  scriptTypeChirho: text("script_type_chirho").default("unknown-chirho"),
  imageR2KeyChirho: text("image_r2_key_chirho"),
  statusChirho: text("status_chirho").default("pending-chirho").notNull(),
});

/**
 * Dynamic French-acceptance dictionary that supplements the static Hunspell
 * dict. The agent (or a human) appends entries during review for proper nouns,
 * abbreviations, scholarly loanwords, and OCR-fix whitelists, so subsequent
 * pages auto-accept them without re-asking the agent.
 *
 * volume_number_chirho = 0 means global; non-zero scopes the entry to a volume.
 */
export const knownWordsChirho = sqliteTable("known_words_chirho", {
  idChirho: integer("id_chirho").primaryKey({ autoIncrement: true }),
  wordChirho: text("word_chirho").notNull(),
  categoryChirho: text("category_chirho").default("unknown-chirho").notNull(),
  volumeNumberChirho: integer("volume_number_chirho").default(0).notNull(),
  /** Tier status: agent-pending-chirho | human-confirmed-chirho | flagged-chirho */
  statusChirho: text("status_chirho").default("agent-pending-chirho").notNull(),
  sourcePageIdChirho: integer("source_page_id_chirho"),
  sourceLineIndexChirho: integer("source_line_index_chirho"),
  confirmedAtChirho: text("confirmed_at_chirho"),
  confirmedByChirho: text("confirmed_by_chirho"),
  addedAtChirho: text("added_at_chirho")
    .default(sql`(datetime('now'))`)
    .notNull(),
  addedByChirho: text("added_by_chirho"),
  notesChirho: text("notes_chirho"),
});

/** Per-volume detection settings */
export const volumeProfilesChirho = sqliteTable("volume_profiles_chirho", {
  idChirho: integer("id_chirho").primaryKey({ autoIncrement: true }),
  volumeNumberChirho: integer("volume_number_chirho").notNull().unique(),
  profileNameChirho: text("profile_name_chirho"),
  garbledThresholdChirho: real("garbled_threshold_chirho").default(0.4),
  detectionStrategyChirho: text("detection_strategy_chirho").default("garbled-score-chirho"),
  fontHintsJsonChirho: text("font_hints_json_chirho"),
  notesChirho: text("notes_chirho"),
});

/** Individual non-French snippet (legacy pipeline) */
export const snippetsChirho = sqliteTable("snippets_chirho", {
  idChirho: integer("id_chirho").primaryKey({ autoIncrement: true }),
  pageIdChirho: integer("page_id_chirho")
    .notNull()
    .references(() => pagesChirho.idChirho),
  snippetIndexChirho: integer("snippet_index_chirho").notNull(),
  xMinChirho: real("x_min_chirho"),
  yMinChirho: real("y_min_chirho"),
  xMaxChirho: real("x_max_chirho"),
  yMaxChirho: real("y_max_chirho"),
  garbledTextChirho: text("garbled_text_chirho"),
  imagePathChirho: text("image_path_chirho"),
  r2KeyChirho: text("r2_key_chirho"),
  suggestedTextChirho: text("suggested_text_chirho"),
  acceptedTextChirho: text("accepted_text_chirho"),
  scriptTypeChirho: text("script_type_chirho").default("unknown-chirho"),
  statusChirho: text("status_chirho").default("pending-chirho").notNull(),
  createdAtChirho: text("created_at_chirho")
    .default(sql`(datetime('now'))`)
    .notNull(),
  updatedAtChirho: text("updated_at_chirho")
    .default(sql`(datetime('now'))`)
    .notNull(),
});
