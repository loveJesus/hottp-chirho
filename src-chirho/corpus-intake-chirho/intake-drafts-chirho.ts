// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Full-corpus intake, Phase 2: draft segments for every extracted intake
 * page that lacks drafts from the current code. The deterministic French
 * classifier runs with known words read from the progress database
 * read-only; nothing outside the intake database is written.
 *
 * CLI:
 *   bun src-chirho/corpus-intake-chirho/intake-drafts-chirho.ts --all [--concurrency=6] [--dry-run]
 *   bun src-chirho/corpus-intake-chirho/intake-drafts-chirho.ts --vol=2,3
 *
 * Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
 */

import { Database } from "bun:sqlite";
import { existsSync } from "fs";

import { PROGRESS_DB_PATH_CHIRHO } from "../config-chirho.ts";
import { classifyPageChirho, loadKnownWordsFromChirho } from "../classify-french-chirho.ts";
import { logChirho, parseCliArgPrefixValueChirho } from "../utils-chirho.ts";
import { DRAFTS_VERSION_CHIRHO, DRAFT_GAP_THRESHOLD_PX_CHIRHO, draftLineSegmentsChirho } from "./draft-segments-chirho.ts";
import { INTAKE_DB_PATH_CHIRHO, INTAKE_VOLUMES_CHIRHO } from "./intake-config-chirho.ts";
import { openIntakeDbChirho, pageLinesForDraftsChirho, pagesNeedingDraftsChirho, recordPageDraftsChirho } from "./intake-db-chirho.ts";

const MODULE_CHIRHO = "corpus-intake-drafts-chirho";
const DEFAULT_DRAFT_CONCURRENCY_CHIRHO = 6;

interface DraftArgsChirho { volumesChirho: number[]; concurrencyChirho: number; dryRunChirho: boolean }

export function parseDraftArgsChirho(argvChirho: string[]): DraftArgsChirho {
  const argsChirho: DraftArgsChirho = { volumesChirho: [], concurrencyChirho: DEFAULT_DRAFT_CONCURRENCY_CHIRHO, dryRunChirho: false };
  let allChirho = false;
  for (const aChirho of argvChirho) {
    let vChirho: string | null;
    if (aChirho === "--all") allChirho = true;
    else if (aChirho === "--dry-run") argsChirho.dryRunChirho = true;
    else if ((vChirho = parseCliArgPrefixValueChirho(aChirho, "--vol=")) !== null) argsChirho.volumesChirho = vChirho.split(",").map(Number);
    else if ((vChirho = parseCliArgPrefixValueChirho(aChirho, "--concurrency=")) !== null) argsChirho.concurrencyChirho = Number(vChirho);
    else throw new Error(`unknown argument: ${aChirho}`);
  }
  if (allChirho === (argsChirho.volumesChirho.length > 0)) throw new Error("pass exactly one of --all or --vol=N[,M]");
  if (allChirho) argsChirho.volumesChirho = [...INTAKE_VOLUMES_CHIRHO];
  if (argsChirho.volumesChirho.some((vChirho) => !INTAKE_VOLUMES_CHIRHO.includes(vChirho))) throw new Error("unknown volume");
  if (!Number.isInteger(argsChirho.concurrencyChirho) || argsChirho.concurrencyChirho < 1) throw new Error("--concurrency must be a positive integer");
  return argsChirho;
}

async function mainChirho(): Promise<void> {
  const argsChirho = parseDraftArgsChirho(process.argv.slice(2));
  if (!existsSync(INTAKE_DB_PATH_CHIRHO)) throw new Error(`no intake database at ${INTAKE_DB_PATH_CHIRHO}; run the intake first`);
  if (!existsSync(PROGRESS_DB_PATH_CHIRHO)) throw new Error(`progress database not found at ${PROGRESS_DB_PATH_CHIRHO}`);
  const dbChirho = openIntakeDbChirho(INTAKE_DB_PATH_CHIRHO);
  const pagesChirho = pagesNeedingDraftsChirho(dbChirho, DRAFTS_VERSION_CHIRHO, argsChirho.volumesChirho);
  const perVolChirho = new Map<number, { pagesChirho: number; segmentsChirho: number; flaggedChirho: number }>();
  for (const pChirho of pagesChirho) {
    const tChirho = perVolChirho.get(pChirho.volumeNumberChirho) ?? { pagesChirho: 0, segmentsChirho: 0, flaggedChirho: 0 };
    tChirho.pagesChirho++;
    perVolChirho.set(pChirho.volumeNumberChirho, tChirho);
  }
  if (argsChirho.dryRunChirho) {
    console.log(JSON.stringify({ dry_run_chirho: true, drafts_version_chirho: DRAFTS_VERSION_CHIRHO,
      pages_needing_drafts_chirho: Object.fromEntries([...perVolChirho].map(([vChirho, tChirho]) => [vChirho, tChirho.pagesChirho])) }, null, 2));
    dbChirho.close();
    return;
  }

  const progressChirho = new Database(PROGRESS_DB_PATH_CHIRHO, { readonly: true });
  const knownByVolChirho = new Map(argsChirho.volumesChirho.map((vChirho) => [vChirho, loadKnownWordsFromChirho(progressChirho, vChirho)]));
  progressChirho.close();
  for (const tChirho of perVolChirho.values()) tChirho.pagesChirho = 0;

  const t0Chirho = performance.now();
  let nextChirho = 0;
  let failedChirho = 0;
  const workerChirho = async (): Promise<void> => {
    for (;;) {
      const pageChirho = pagesChirho[nextChirho++];
      if (!pageChirho) return;
      const { volumeNumberChirho, pageNumberChirho } = pageChirho;
      try {
        const linesChirho = pageLinesForDraftsChirho(dbChirho, volumeNumberChirho, pageNumberChirho);
        const verdictsChirho = await classifyPageChirho(
          linesChirho.map((lChirho) => ({ lineIndexChirho: lChirho.lineIndexChirho, wordsChirho: lChirho.wordsChirho })),
          knownByVolChirho.get(volumeNumberChirho)!
        );
        const draftsChirho = linesChirho.map((lChirho) => {
          const reasonsChirho = verdictsChirho
            .filter((vChirho) => vChirho.lineIndexChirho === lChirho.lineIndexChirho)
            .sort((aChirho, bChirho) => aChirho.wordIndexChirho - bChirho.wordIndexChirho)
            .map((vChirho) => vChirho.reasonChirho);
          return { lineIndexChirho: lChirho.lineIndexChirho, segmentsChirho: draftLineSegmentsChirho(lChirho, reasonsChirho, DRAFT_GAP_THRESHOLD_PX_CHIRHO) };
        });
        const countsChirho = recordPageDraftsChirho(dbChirho, volumeNumberChirho, pageNumberChirho, DRAFTS_VERSION_CHIRHO, draftsChirho);
        const tChirho = perVolChirho.get(volumeNumberChirho)!;
        tChirho.pagesChirho++;
        tChirho.segmentsChirho += countsChirho.segmentCountChirho;
        tChirho.flaggedChirho += countsChirho.flaggedCountChirho;
      } catch (errChirho) {
        failedChirho++;
        logChirho(MODULE_CHIRHO, `FAILED vol ${volumeNumberChirho} p${pageNumberChirho}: ${errChirho instanceof Error ? errChirho.message : errChirho}`);
      }
    }
  };
  await Promise.all(Array.from({ length: argsChirho.concurrencyChirho }, workerChirho));
  dbChirho.close();

  console.log("| Vol | Pages drafted | Segments | Flagged for reading | Flagged share |");
  console.log("| --- | --- | --- | --- | --- |");
  for (const [vChirho, tChirho] of [...perVolChirho].sort((aChirho, bChirho) => aChirho[0] - bChirho[0])) {
    const shareChirho = tChirho.segmentsChirho === 0 ? "n/a" : `${((100 * tChirho.flaggedChirho) / tChirho.segmentsChirho).toFixed(1)}%`;
    console.log(`| ${vChirho} | ${tChirho.pagesChirho} | ${tChirho.segmentsChirho} | ${tChirho.flaggedChirho} | ${shareChirho} |`);
  }
  logChirho(MODULE_CHIRHO, `drafts v${DRAFTS_VERSION_CHIRHO}: ${pagesChirho.length - failedChirho} pages drafted, ${failedChirho} failed, ` +
    `${((performance.now() - t0Chirho) / 1000).toFixed(0)} s`);
  if (failedChirho > 0) process.exitCode = 1;
}

if (import.meta.main) {
  await mainChirho();
}
