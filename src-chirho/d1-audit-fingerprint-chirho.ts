// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { Database, constants } from "bun:sqlite";
import { createHash, type Hash } from "crypto";
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

/**
 * Project-relative home of the local D1 audit database. Exported because the
 * review-station sync has to carry this one file out of an otherwise excluded
 * `.wrangler/` tree: the Latin/symbol and expert stations derive part of their
 * review queue from it and fail closed when it is absent.
 */
export const LOCAL_D1_AUDIT_RELATIVE_DIR_CHIRHO =
  "app-chirho/.wrangler/state/v3/d1/miniflare-D1DatabaseObject";

const LOCAL_D1_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, ...LOCAL_D1_AUDIT_RELATIVE_DIR_CHIRHO.split("/"));

export interface D1AuditFingerprintChirho {
  dbPathChirho: string;
  pageRowCountChirho: number;
  wordRowCountChirho: number;
  ocrSuggestionRowCountChirho: number;
  sha256Chirho: string;
}

/**
 * The single locator for the local D1 audit database. The Latin/symbol and
 * expert live queues, the Markdown export, the Pass-C Hebrew validator and the
 * certification status all read the same file, so they share this rather than
 * each keeping a private copy.
 */
export function latestLocalD1PathChirho(): string | null {
  if (!existsSync(LOCAL_D1_DIR_CHIRHO)) return null;
  const sqliteFilesChirho = readdirSync(LOCAL_D1_DIR_CHIRHO)
    .filter((fileChirho) => fileChirho.endsWith(".sqlite"))
    .map((fileChirho) => join(LOCAL_D1_DIR_CHIRHO, fileChirho))
    .sort((aChirho, bChirho) => statSync(bChirho).mtimeMs - statSync(aChirho).mtimeMs);
  return sqliteFilesChirho[0] ?? null;
}

function immutableSqliteUriChirho(dbPathChirho: string): string {
  const escapedPathChirho = dbPathChirho.replace(
    /[%?#]/g,
    (characterChirho) => `%${characterChirho.charCodeAt(0).toString(16).padStart(2, "0")}`
  );
  return `file:${escapedPathChirho}?immutable=1`;
}

/**
 * Open a local D1 database for reading, including the WAL-mode audit database
 * after Miniflare has closed it.
 *
 * Miniflare leaves the file in WAL mode and removes its -wal and -shm sidecars
 * on the final checkpoint. A read-only connection may not create those
 * sidecars, so a plain read-only open then fails with "unable to open database
 * file", which broke the certification gates locally and would break the
 * Latin/symbol and expert stations on the review host, where sync-out ships the
 * bare file. With no sidecar present, nothing holds the database and every
 * commit is already in the main file, so an immutable open reads exactly the
 * committed state without creating anything. While a sidecar exists, some
 * process (usually `vite dev`) has the file open, so normal WAL locking applies.
 *
 * The immutable open passes SQLITE_OPEN_URI explicitly. macOS Bun uses the
 * system SQLite, which interprets `file:` URIs by default, but Bun on Linux
 * bundles a SQLite built without that default, where `{ readonly: true }`
 * treats the URI as a literal file name and fails, which is what kept the
 * review host's stations down after the first redeploy.
 */
export function openLocalD1ReadonlyChirho(dbPathChirho: string): Database {
  if (existsSync(`${dbPathChirho}-wal`) || existsSync(`${dbPathChirho}-shm`)) {
    return new Database(dbPathChirho, { readonly: true });
  }
  return new Database(immutableSqliteUriChirho(dbPathChirho), constants.SQLITE_OPEN_READONLY | constants.SQLITE_OPEN_URI);
}

function hashRowsChirho(hashChirho: Hash, sectionChirho: string, rowsChirho: unknown[][]): void {
  hashChirho.update(sectionChirho);
  hashChirho.update("\0");
  hashChirho.update(String(rowsChirho.length));
  hashChirho.update("\0");
  for (const rowChirho of rowsChirho) {
    hashChirho.update(JSON.stringify(rowChirho));
    hashChirho.update("\0");
  }
}

export function d1AuditFingerprintForDbPathChirho(dbPathChirho: string | null | undefined): D1AuditFingerprintChirho | null {
  if (dbPathChirho === null || dbPathChirho === undefined || !existsSync(dbPathChirho)) return null;
  const dbChirho = openLocalD1ReadonlyChirho(dbPathChirho);
  try {
    const pageRowsChirho = (
      dbChirho
        .query(
          `SELECT volume_number_chirho, page_number_chirho
             FROM pages_chirho
            ORDER BY volume_number_chirho, page_number_chirho, id_chirho`
        )
        .all() as Array<{ volume_number_chirho: number; page_number_chirho: number }>
    ).map((rowChirho) => [rowChirho.volume_number_chirho, rowChirho.page_number_chirho]);

    const wordRowsChirho = (
      dbChirho
        .query(
          `SELECT p.volume_number_chirho AS volume_chirho,
                  p.page_number_chirho AS page_chirho,
                  sl.line_index_chirho AS line_index_chirho,
                  w.word_index_chirho AS word_index_chirho,
                  w.current_text_chirho AS current_text_chirho,
                  w.current_script_chirho AS current_script_chirho,
                  w.current_source_chirho AS current_source_chirho
             FROM words_chirho w
             JOIN scanlines_chirho sl ON sl.id_chirho = w.scanline_id_chirho
             JOIN pages_chirho p ON p.id_chirho = sl.page_id_chirho
            ORDER BY p.volume_number_chirho, p.page_number_chirho,
                     sl.line_index_chirho, w.word_index_chirho, w.id_chirho`
        )
        .all() as Array<{
          volume_chirho: number;
          page_chirho: number;
          line_index_chirho: number;
          word_index_chirho: number;
          current_text_chirho: string | null;
          current_script_chirho: string | null;
          current_source_chirho: string | null;
        }>
    ).map((rowChirho) => [
      rowChirho.volume_chirho,
      rowChirho.page_chirho,
      rowChirho.line_index_chirho,
      rowChirho.word_index_chirho,
      rowChirho.current_text_chirho,
      rowChirho.current_script_chirho,
      rowChirho.current_source_chirho,
    ]);

    const ocrSuggestionRowsChirho = (
      dbChirho
        .query(
          `SELECT p.volume_number_chirho AS volume_chirho,
                  p.page_number_chirho AS page_chirho,
                  s.suggested_text_chirho AS suggested_text_chirho,
                  s.confidence_chirho AS confidence_chirho,
                  s.crop_chirho AS crop_chirho,
                  s.bucket_chirho AS bucket_chirho
             FROM ocr_suggestions_chirho s
             JOIN pages_chirho p ON p.id_chirho = s.page_id_chirho
            WHERE s.bucket_chirho IN ('AUTO', 'REVIEW')
            ORDER BY p.volume_number_chirho, p.page_number_chirho,
                     s.bucket_chirho, s.crop_chirho, s.suggested_text_chirho,
                     s.confidence_chirho, s.id_chirho`
        )
        .all() as Array<{
          volume_chirho: number;
          page_chirho: number;
          suggested_text_chirho: string;
          confidence_chirho: number;
          crop_chirho: string | null;
          bucket_chirho: string | null;
        }>
    ).map((rowChirho) => [
      rowChirho.volume_chirho,
      rowChirho.page_chirho,
      rowChirho.suggested_text_chirho,
      rowChirho.confidence_chirho,
      rowChirho.crop_chirho,
      rowChirho.bucket_chirho,
    ]);

    const hashChirho = createHash("sha256");
    hashRowsChirho(hashChirho, "pages-chirho", pageRowsChirho);
    hashRowsChirho(hashChirho, "words-current-chirho", wordRowsChirho);
    hashRowsChirho(hashChirho, "ocr-suggestions-auto-review-chirho", ocrSuggestionRowsChirho);

    return {
      dbPathChirho,
      pageRowCountChirho: pageRowsChirho.length,
      wordRowCountChirho: wordRowsChirho.length,
      ocrSuggestionRowCountChirho: ocrSuggestionRowsChirho.length,
      sha256Chirho: hashChirho.digest("hex"),
    };
  } finally {
    dbChirho.close();
  }
}
