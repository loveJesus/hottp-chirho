// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Pages the intake must never produce: the certification working set, plus any
 * page the local progress database shows human or pipeline work on
 * (reviewer events, segments or human-confirmed words). The union fails
 * safe: a page in doubt stays out of the intake.
 *
 * The progress database is opened read-only. A later D1 load separately
 * checks production for pages and events before writing anything.
 *
 * Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
 */

import { Database } from "bun:sqlite";
import { existsSync } from "fs";

import { pageKeyChirho, workingSetKeysChirho } from "./intake-config-chirho.ts";

export interface ProtectedPagesChirho {
  keysChirho: Set<string>;
  workingSetCountChirho: number;
  /** Protected only because of progress-database work, outside the working set. */
  extraKeysChirho: string[];
}

const WORKED_PAGES_SQL_CHIRHO = `
  SELECT p.volume_number_chirho AS vol_chirho, p.page_number_chirho AS page_chirho
    FROM pages_chirho p
   WHERE EXISTS (SELECT 1 FROM events_chirho e WHERE e.page_id_chirho = p.id_chirho)
      OR EXISTS (SELECT 1 FROM segments_chirho g
                   JOIN scanlines_chirho s ON s.id_chirho = g.scanline_id_chirho
                  WHERE s.page_id_chirho = p.id_chirho)
      OR EXISTS (SELECT 1 FROM words_chirho w
                   JOIN scanlines_chirho s ON s.id_chirho = w.scanline_id_chirho
                  WHERE s.page_id_chirho = p.id_chirho AND w.is_human_confirmed_chirho = 1)`;

export function protectedPagesChirho(progressDbPathChirho: string): ProtectedPagesChirho {
  if (!existsSync(progressDbPathChirho)) {
    throw new Error(
      `progress database not found at ${progressDbPathChirho}; refusing to guess which pages are protected`
    );
  }
  const keysChirho = workingSetKeysChirho();
  const workingSetCountChirho = keysChirho.size;
  const extraKeysChirho: string[] = [];
  const dbChirho = new Database(progressDbPathChirho, { readonly: true });
  try {
    const rowsChirho = dbChirho.query(WORKED_PAGES_SQL_CHIRHO).all() as Array<{
      vol_chirho: number;
      page_chirho: number;
    }>;
    for (const rChirho of rowsChirho) {
      const keyChirho = pageKeyChirho(rChirho.vol_chirho, rChirho.page_chirho);
      if (!keysChirho.has(keyChirho)) {
        keysChirho.add(keyChirho);
        extraKeysChirho.push(keyChirho);
      }
    }
  } finally {
    dbChirho.close();
  }
  return { keysChirho, workingSetCountChirho, extraKeysChirho };
}
