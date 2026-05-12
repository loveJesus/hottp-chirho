// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Pull events_chirho from D1 into local user-data-chirho.sqlite mirror.
// Cursor-based incremental sync via WHERE seq_chirho > last_seen.

import { Database as BunDbChirho } from "bun:sqlite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filenameChirho = fileURLToPath(import.meta.url);
const __dirnameChirho = path.dirname(__filenameChirho);
const USER_DATA_DB_PATH_CHIRHO = path.resolve(__dirnameChirho, "..", "spec-chirho", "user-data-chirho.sqlite");
const APP_BASE_URL_CHIRHO = process.env.HOTTP_APP_URL_CHIRHO ?? "https://hottp-chirho.bible.systems";
const BATCH_LIMIT_CHIRHO = 1000;

interface RemoteEventChirho {
  seqChirho: number;
  pageIdChirho: number;
  scanlineIdChirho: number | null;
  wordIdChirho: number | null;
  aggregateTypeChirho: string;
  eventTypeChirho: string;
  payloadJsonChirho: string;
  reviewerChirho: string | null;
  createdAtChirho: string;
}

function ensureSchemaChirho(dbChirho: BunDbChirho): void {
  dbChirho.run(`CREATE TABLE IF NOT EXISTS events_chirho (
      seq_chirho INTEGER PRIMARY KEY,
      page_id_chirho INTEGER NOT NULL,
      scanline_id_chirho INTEGER,
      word_id_chirho INTEGER,
      aggregate_type_chirho TEXT NOT NULL,
      event_type_chirho TEXT NOT NULL,
      payload_json_chirho TEXT NOT NULL,
      reviewer_chirho TEXT,
      created_at_chirho TEXT NOT NULL
    )`);
  dbChirho.run(`CREATE INDEX IF NOT EXISTS events_page_seq_chirho ON events_chirho(page_id_chirho, seq_chirho)`);
  dbChirho.run(`CREATE INDEX IF NOT EXISTS events_word_seq_chirho ON events_chirho(word_id_chirho, seq_chirho) WHERE word_id_chirho IS NOT NULL`);
  dbChirho.run(`CREATE INDEX IF NOT EXISTS events_type_seq_chirho ON events_chirho(event_type_chirho, seq_chirho)`);
  dbChirho.run(`CREATE TABLE IF NOT EXISTS words_proj_chirho (
      word_id_chirho INTEGER PRIMARY KEY,
      page_id_chirho INTEGER NOT NULL,
      scanline_id_chirho INTEGER NOT NULL,
      current_text_chirho TEXT,
      current_script_chirho TEXT,
      current_source_chirho TEXT,
      is_human_confirmed_chirho INTEGER NOT NULL DEFAULT 0,
      pending_script_flag_chirho INTEGER NOT NULL DEFAULT 0,
      last_event_seq_chirho INTEGER NOT NULL DEFAULT 0
    )`);
  dbChirho.run(`CREATE TABLE IF NOT EXISTS sync_state_chirho (
      key_chirho TEXT PRIMARY KEY,
      value_chirho TEXT NOT NULL,
      updated_at_chirho TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
}

function getCursorChirho(dbChirho: BunDbChirho): number {
  const rowChirho = dbChirho.query<{ value_chirho: string }, []>(
    `SELECT value_chirho FROM sync_state_chirho WHERE key_chirho = 'events_cursor_chirho'`,
  ).get();
  if (!rowChirho) return 0;
  return Number.parseInt(rowChirho.value_chirho, 10) || 0;
}

function setCursorChirho(dbChirho: BunDbChirho, valueChirho: number): void {
  dbChirho.run(
    `INSERT INTO sync_state_chirho (key_chirho, value_chirho, updated_at_chirho)
     VALUES ('events_cursor_chirho', ?, datetime('now'))
     ON CONFLICT(key_chirho) DO UPDATE SET value_chirho=excluded.value_chirho, updated_at_chirho=datetime('now')`,
    [valueChirho.toString()],
  );
}

async function fetchEventsChirho(sinceSeqChirho: number): Promise<RemoteEventChirho[]> {
  const urlChirho = new URL("/api-chirho/events-chirho", APP_BASE_URL_CHIRHO);
  urlChirho.searchParams.set("since-seq-chirho", sinceSeqChirho.toString());
  urlChirho.searchParams.set("limit-chirho", BATCH_LIMIT_CHIRHO.toString());
  const respChirho = await fetch(urlChirho.toString());
  if (!respChirho.ok) throw new Error(`fetch events failed: ${respChirho.status} ${await respChirho.text()}`);
  const bodyChirho = (await respChirho.json()) as { eventsChirho: RemoteEventChirho[] };
  return bodyChirho.eventsChirho;
}

function applyEventChirho(dbChirho: BunDbChirho, evChirho: RemoteEventChirho): void {
  dbChirho.run(
    `INSERT OR IGNORE INTO events_chirho (
       seq_chirho, page_id_chirho, scanline_id_chirho, word_id_chirho,
       aggregate_type_chirho, event_type_chirho, payload_json_chirho,
       reviewer_chirho, created_at_chirho
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      evChirho.seqChirho,
      evChirho.pageIdChirho,
      evChirho.scanlineIdChirho,
      evChirho.wordIdChirho,
      evChirho.aggregateTypeChirho,
      evChirho.eventTypeChirho,
      evChirho.payloadJsonChirho,
      evChirho.reviewerChirho,
      evChirho.createdAtChirho,
    ],
  );

  if (evChirho.wordIdChirho == null) return;

  let payloadChirho: Record<string, unknown> = {};
  try { payloadChirho = JSON.parse(evChirho.payloadJsonChirho); } catch {}

  dbChirho.run(
    `INSERT INTO words_proj_chirho (
       word_id_chirho, page_id_chirho, scanline_id_chirho,
       current_text_chirho, current_script_chirho, current_source_chirho,
       is_human_confirmed_chirho, pending_script_flag_chirho, last_event_seq_chirho
     ) VALUES (?, ?, ?, NULL, NULL, 'ocr-chirho', 0, 0, 0)
     ON CONFLICT(word_id_chirho) DO NOTHING`,
    [evChirho.wordIdChirho, evChirho.pageIdChirho, evChirho.scanlineIdChirho ?? 0],
  );

  switch (evChirho.eventTypeChirho) {
    case "word-text-corrected-chirho": {
      const newTextChirho = typeof payloadChirho.newTextChirho === "string" ? payloadChirho.newTextChirho as string : null;
      dbChirho.run(
        `UPDATE words_proj_chirho SET current_text_chirho=?, current_source_chirho='human-chirho',
            is_human_confirmed_chirho=1, last_event_seq_chirho=?
         WHERE word_id_chirho=? AND ? > last_event_seq_chirho`,
        [newTextChirho, evChirho.seqChirho, evChirho.wordIdChirho, evChirho.seqChirho],
      );
      break;
    }
    case "word-script-flagged-chirho": {
      dbChirho.run(
        `UPDATE words_proj_chirho SET pending_script_flag_chirho=1, last_event_seq_chirho=?
         WHERE word_id_chirho=? AND ? > last_event_seq_chirho`,
        [evChirho.seqChirho, evChirho.wordIdChirho, evChirho.seqChirho],
      );
      break;
    }
    case "word-script-set-chirho": {
      const newScriptChirho = typeof payloadChirho.newScriptChirho === "string" ? payloadChirho.newScriptChirho as string : null;
      dbChirho.run(
        `UPDATE words_proj_chirho SET current_script_chirho=?, pending_script_flag_chirho=0,
            current_source_chirho='human-chirho', last_event_seq_chirho=?
         WHERE word_id_chirho=? AND ? > last_event_seq_chirho`,
        [newScriptChirho, evChirho.seqChirho, evChirho.wordIdChirho, evChirho.seqChirho],
      );
      break;
    }
    case "word-verified-chirho": {
      dbChirho.run(
        `UPDATE words_proj_chirho SET is_human_confirmed_chirho=1, last_event_seq_chirho=?
         WHERE word_id_chirho=? AND ? > last_event_seq_chirho`,
        [evChirho.seqChirho, evChirho.wordIdChirho, evChirho.seqChirho],
      );
      break;
    }
    case "word-vision-applied-chirho": {
      const newTextChirho = typeof payloadChirho.newTextChirho === "string" ? payloadChirho.newTextChirho as string : null;
      const newScriptChirho = typeof payloadChirho.newScriptChirho === "string" ? payloadChirho.newScriptChirho as string : null;
      dbChirho.run(
        `UPDATE words_proj_chirho SET current_text_chirho=?, current_script_chirho=?,
            current_source_chirho='vision-chirho', pending_script_flag_chirho=0,
            last_event_seq_chirho=?
         WHERE word_id_chirho=? AND ? > last_event_seq_chirho`,
        [newTextChirho, newScriptChirho, evChirho.seqChirho, evChirho.wordIdChirho, evChirho.seqChirho],
      );
      break;
    }
    default: break;
  }
}

async function mainChirho(): Promise<void> {
  const resetChirho = process.argv.includes("--reset");
  const dbChirho = new BunDbChirho(USER_DATA_DB_PATH_CHIRHO);
  ensureSchemaChirho(dbChirho);

  if (resetChirho) {
    dbChirho.run(`DELETE FROM events_chirho`);
    dbChirho.run(`DELETE FROM words_proj_chirho`);
    dbChirho.run(`DELETE FROM sync_state_chirho`);
    console.log("[sync-from-d1] reset: cleared local mirror");
  }

  let cursorChirho = getCursorChirho(dbChirho);
  let totalChirho = 0;
  console.log(`[sync-from-d1] starting from cursor seq_chirho=${cursorChirho}`);

  for (;;) {
    const batchChirho = await fetchEventsChirho(cursorChirho);
    if (batchChirho.length === 0) break;
    dbChirho.run("BEGIN");
    try {
      for (const evChirho of batchChirho) {
        applyEventChirho(dbChirho, evChirho);
        if (evChirho.seqChirho > cursorChirho) cursorChirho = evChirho.seqChirho;
      }
      setCursorChirho(dbChirho, cursorChirho);
      dbChirho.run("COMMIT");
    } catch (errChirho) {
      dbChirho.run("ROLLBACK");
      throw errChirho;
    }
    totalChirho += batchChirho.length;
    console.log(`[sync-from-d1]   pulled ${batchChirho.length} events, cursor now ${cursorChirho}`);
    if (batchChirho.length < BATCH_LIMIT_CHIRHO) break;
  }

  console.log(`[sync-from-d1] done — ${totalChirho} new events, cursor at ${cursorChirho}`);
}

await mainChirho();
