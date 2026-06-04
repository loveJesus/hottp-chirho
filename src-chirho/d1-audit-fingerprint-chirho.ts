// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { Database } from "bun:sqlite";
import { createHash, type Hash } from "crypto";
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const LOCAL_D1_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "app-chirho",
  ".wrangler",
  "state",
  "v3",
  "d1",
  "miniflare-D1DatabaseObject"
);

export interface D1AuditFingerprintChirho {
  dbPathChirho: string;
  pageRowCountChirho: number;
  wordRowCountChirho: number;
  ocrSuggestionRowCountChirho: number;
  sha256Chirho: string;
}

export function latestLocalD1PathChirho(): string | null {
  if (!existsSync(LOCAL_D1_DIR_CHIRHO)) return null;
  const sqliteFilesChirho = readdirSync(LOCAL_D1_DIR_CHIRHO)
    .filter((fileChirho) => fileChirho.endsWith(".sqlite"))
    .map((fileChirho) => join(LOCAL_D1_DIR_CHIRHO, fileChirho))
    .sort((aChirho, bChirho) => statSync(bChirho).mtimeMs - statSync(aChirho).mtimeMs);
  return sqliteFilesChirho[0] ?? null;
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
  const dbChirho = new Database(dbPathChirho, { readonly: true });
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
