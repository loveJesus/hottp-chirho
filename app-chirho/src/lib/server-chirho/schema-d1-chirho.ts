// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

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

/** Individual non-French snippet */
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
  canonicalSourceChirho: text("canonical_source_chirho"),
  canonicalConfidenceChirho: text("canonical_confidence_chirho"),
  canonicalReferenceChirho: text("canonical_reference_chirho"),
  canonicalDistanceChirho: integer("canonical_distance_chirho"),
});

/**
 * Dynamic French-acceptance dictionary supplementing the static Hunspell dict.
 * Populated by Pass C agent / human review; volume_number_chirho = 0 = global.
 */
export const knownWordsChirho = sqliteTable("known_words_chirho", {
  idChirho: integer("id_chirho").primaryKey({ autoIncrement: true }),
  wordChirho: text("word_chirho").notNull(),
  categoryChirho: text("category_chirho").default("unknown-chirho").notNull(),
  volumeNumberChirho: integer("volume_number_chirho").default(0).notNull(),
  /** Tier: agent-pending-chirho | human-confirmed-chirho | flagged-chirho */
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

/** Review action log */
export const reviewsChirho = sqliteTable("reviews_chirho", {
  idChirho: integer("id_chirho").primaryKey({ autoIncrement: true }),
  snippetIdChirho: integer("snippet_id_chirho")
    .notNull()
    .references(() => snippetsChirho.idChirho),
  reviewerChirho: text("reviewer_chirho").notNull(),
  actionChirho: text("action_chirho").notNull(), // accept/edit/reject/re-ocr
  previousTextChirho: text("previous_text_chirho"),
  newTextChirho: text("new_text_chirho"),
  createdAtChirho: text("created_at_chirho")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

/** Per-word row: bbox + OCR underlay + projection columns derived from events */
export const wordsChirho = sqliteTable("words_chirho", {
  idChirho: integer("id_chirho").primaryKey({ autoIncrement: true }),
  scanlineIdChirho: integer("scanline_id_chirho")
    .notNull()
    .references(() => scanlinesChirho.idChirho),
  wordIndexChirho: integer("word_index_chirho").notNull(),
  xMinChirho: real("x_min_chirho"),
  yMinChirho: real("y_min_chirho"),
  xMaxChirho: real("x_max_chirho"),
  yMaxChirho: real("y_max_chirho"),
  originalOcrTextChirho: text("original_ocr_text_chirho"),
  originalOcrScriptChirho: text("original_ocr_script_chirho"),
  currentTextChirho: text("current_text_chirho"),
  currentScriptChirho: text("current_script_chirho"),
  /** 'ocr-chirho' | 'human-chirho' | 'vision-chirho' | 'canonical-chirho' */
  currentSourceChirho: text("current_source_chirho").default("ocr-chirho"),
  isHumanConfirmedChirho: integer("is_human_confirmed_chirho").default(0).notNull(),
  pendingScriptFlagChirho: integer("pending_script_flag_chirho").default(0).notNull(),
  lastEventSeqChirho: integer("last_event_seq_chirho").default(0).notNull(),
  createdAtChirho: text("created_at_chirho")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

/** Append-only event log: every human/AI/canonical correction lands here */
export const eventsChirho = sqliteTable("events_chirho", {
  seqChirho: integer("seq_chirho").primaryKey({ autoIncrement: true }),
  pageIdChirho: integer("page_id_chirho")
    .notNull()
    .references(() => pagesChirho.idChirho),
  scanlineIdChirho: integer("scanline_id_chirho").references(() => scanlinesChirho.idChirho),
  wordIdChirho: integer("word_id_chirho").references(() => wordsChirho.idChirho),
  /** 'word-chirho' | 'scanline-chirho' | 'page-chirho' */
  aggregateTypeChirho: text("aggregate_type_chirho").notNull(),
  /**
   * 'word-text-corrected-chirho' | 'word-script-flagged-chirho' |
   * 'word-script-set-chirho'     | 'word-verified-chirho'       |
   * 'word-vision-applied-chirho' | 'scanline-needs-ai-review-chirho' |
   * 'scanline-verified-chirho'   | 'page-completed-chirho'
   */
  eventTypeChirho: text("event_type_chirho").notNull(),
  payloadJsonChirho: text("payload_json_chirho").notNull(),
  reviewerChirho: text("reviewer_chirho"),
  createdAtChirho: text("created_at_chirho")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

/** Per-page self-contained underlay snapshot (cheap hot-path read) */
export const pageSnapshotsChirho = sqliteTable("page_snapshots_chirho", {
  idChirho: integer("id_chirho").primaryKey({ autoIncrement: true }),
  pageIdChirho: integer("page_id_chirho")
    .notNull()
    .unique()
    .references(() => pagesChirho.idChirho),
  snapshotSeqChirho: integer("snapshot_seq_chirho").default(0).notNull(),
  underlayJsonChirho: text("underlay_json_chirho").notNull(),
  underlayR2KeyChirho: text("underlay_r2_key_chirho"),
  builtAtChirho: text("built_at_chirho")
    .default(sql`(datetime('now'))`)
    .notNull(),
  updatedAtChirho: text("updated_at_chirho")
    .default(sql`(datetime('now'))`)
    .notNull(),
});
