// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Measure draft segments against reviewed text: Pass C spans on every
 * progress-database page that has segments (the vols 2-5 pilot pages), and
 * reviewed word scripts on vol 1 pages that carry non-Latin words. Reports
 * how much of the non-Latin text (Hebrew, Greek, Syriac, symbols, unknown)
 * the drafts flag for reading. Candidate recall is the safety number: a
 * non-Latin run the draft calls French would reach a reader looking settled.
 *
 * Read-only on the progress database. Known words were partly harvested from
 * these very pages, so the run is repeated with the known-word set empty.
 *
 * CLI: bun src-chirho/corpus-intake-chirho/draft-recall-chirho.ts [--thresholds=40,60,80] [--misses=12]
 *
 * Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
 */

import { Database } from "bun:sqlite";

import { PROGRESS_DB_PATH_CHIRHO } from "../config-chirho.ts";
import { classifyPageChirho, loadKnownWordsFromChirho, type WordWithBboxChirho } from "../classify-french-chirho.ts";
import { parseCliArgPrefixValueChirho } from "../utils-chirho.ts";
import { draftLineSegmentsChirho, isLatinScriptChirho, type DraftSegmentChirho } from "./draft-segments-chirho.ts";

interface RefSpanChirho { xChirho: number; widthChirho: number; scriptChirho: string }
/** Word-level scripts that mean French or other Latin-script text. */
const WORD_LATIN_SCRIPTS_CHIRHO = ["latin-chirho", "french-chirho", "latin-non-french-chirho"];
const WORD_LATIN_SCRIPTS_SQL_CHIRHO = WORD_LATIN_SCRIPTS_CHIRHO.map((sChirho) => `'${sChirho}'`).join(", ");
interface MeasuredLineChirho {
  volChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  xMinChirho: number;
  widthChirho: number;
  wordsChirho: WordWithBboxChirho[];
  refChirho: RefSpanChirho[];
}

function overlapChirho(aStartChirho: number, aEndChirho: number, bStartChirho: number, bEndChirho: number): number {
  return Math.max(0, Math.min(aEndChirho, bEndChirho) - Math.max(aStartChirho, bStartChirho));
}

function loadLinesChirho(dbChirho: Database): Map<string, MeasuredLineChirho[]> {
  const rowsChirho = dbChirho.query(`
    SELECT p.volume_number_chirho AS vol_chirho, p.page_number_chirho AS page_chirho, s.id_chirho AS line_id_chirho,
           s.line_index_chirho, s.x_min_chirho, s.width_chirho, s.words_json_chirho
      FROM pages_chirho p JOIN scanlines_chirho s ON s.page_id_chirho = p.id_chirho
     WHERE EXISTS (SELECT 1 FROM segments_chirho g JOIN scanlines_chirho s2 ON s2.id_chirho = g.scanline_id_chirho
                    WHERE s2.page_id_chirho = p.id_chirho)
        OR EXISTS (SELECT 1 FROM words_chirho w JOIN scanlines_chirho s2 ON s2.id_chirho = w.scanline_id_chirho
                    WHERE s2.page_id_chirho = p.id_chirho AND w.current_script_chirho NOT IN (${WORD_LATIN_SCRIPTS_SQL_CHIRHO}))
     ORDER BY 1, 2, s.line_index_chirho`).all() as Array<{
    vol_chirho: number; page_chirho: number; line_id_chirho: number; line_index_chirho: number;
    x_min_chirho: number; width_chirho: number; words_json_chirho: string | null;
  }>;
  const segQueryChirho = dbChirho.query(`
    SELECT x_min_px_chirho, width_px_chirho, script_type_chirho FROM segments_chirho
     WHERE scanline_id_chirho = ? ORDER BY segment_index_chirho`);
  // Vol 1 keeps reviewed scripts per word instead of segments.
  const wordQueryChirho = dbChirho.query(`
    SELECT x_min_chirho, x_max_chirho, current_script_chirho FROM words_chirho
     WHERE scanline_id_chirho = ? ORDER BY word_index_chirho`);
  const pagesChirho = new Map<string, MeasuredLineChirho[]>();
  for (const rChirho of rowsChirho) {
    const keyChirho = `${rChirho.vol_chirho}:${rChirho.page_chirho}`;
    let refChirho = (segQueryChirho.all(rChirho.line_id_chirho) as Array<{ x_min_px_chirho: number; width_px_chirho: number; script_type_chirho: string }>)
      .map((gChirho) => ({ xChirho: gChirho.x_min_px_chirho, widthChirho: gChirho.width_px_chirho, scriptChirho: gChirho.script_type_chirho }));
    if (refChirho.length === 0) {
      refChirho = (wordQueryChirho.all(rChirho.line_id_chirho) as Array<{ x_min_chirho: number; x_max_chirho: number; current_script_chirho: string | null }>)
        .map((wChirho) => ({
          xChirho: wChirho.x_min_chirho - rChirho.x_min_chirho,
          widthChirho: wChirho.x_max_chirho - wChirho.x_min_chirho,
          scriptChirho: WORD_LATIN_SCRIPTS_CHIRHO.includes(wChirho.current_script_chirho ?? "latin-chirho") ? "french-chirho" : wChirho.current_script_chirho!,
        }));
    }
    const listChirho = pagesChirho.get(keyChirho) ?? [];
    listChirho.push({
      volChirho: rChirho.vol_chirho, pageChirho: rChirho.page_chirho, lineIndexChirho: rChirho.line_index_chirho,
      xMinChirho: rChirho.x_min_chirho, widthChirho: rChirho.width_chirho,
      wordsChirho: JSON.parse(rChirho.words_json_chirho ?? "[]") as WordWithBboxChirho[], refChirho,
    });
    pagesChirho.set(keyChirho, listChirho);
  }
  return pagesChirho;
}

interface TallyChirho { refSpansChirho: number; flaggedSpansChirho: number; refWidthChirho: number; coveredWidthChirho: number; draftWidthChirho: number; draftTruthWidthChirho: number; draftTilesChirho: number; missesChirho: string[] }
function emptyTallyChirho(): TallyChirho {
  return { refSpansChirho: 0, flaggedSpansChirho: 0, refWidthChirho: 0, coveredWidthChirho: 0, draftWidthChirho: 0, draftTruthWidthChirho: 0, draftTilesChirho: 0, missesChirho: [] };
}
/** Reference spans and flagged spans per reference script, across all volumes. */
type ScriptTallyChirho = Map<string, { refChirho: number; flaggedChirho: number }>;

function tallyLineChirho(tChirho: TallyChirho, scriptsChirho: ScriptTallyChirho, lineChirho: MeasuredLineChirho, draftChirho: DraftSegmentChirho[]): void {
  const flaggedChirho = draftChirho.filter((dChirho) => !isLatinScriptChirho(dChirho.scriptChirho));
  const refNonLatinChirho = lineChirho.refChirho.filter((rChirho) => !isLatinScriptChirho(rChirho.scriptChirho));
  tChirho.draftTilesChirho += flaggedChirho.length;
  for (const rChirho of refNonLatinChirho) {
    const coveredChirho = flaggedChirho.reduce((nChirho, dChirho) =>
      nChirho + overlapChirho(rChirho.xChirho, rChirho.xChirho + rChirho.widthChirho, dChirho.xMinPxChirho, dChirho.xMinPxChirho + dChirho.widthPxChirho), 0);
    tChirho.refSpansChirho++;
    tChirho.refWidthChirho += rChirho.widthChirho;
    tChirho.coveredWidthChirho += coveredChirho;
    const perScriptChirho = scriptsChirho.get(rChirho.scriptChirho) ?? { refChirho: 0, flaggedChirho: 0 };
    scriptsChirho.set(rChirho.scriptChirho, perScriptChirho);
    perScriptChirho.refChirho++;
    if (coveredChirho >= 0.5 * rChirho.widthChirho) perScriptChirho.flaggedChirho++;
    if (coveredChirho >= 0.5 * rChirho.widthChirho) tChirho.flaggedSpansChirho++;
    else tChirho.missesChirho.push(`vol ${lineChirho.volChirho} p${lineChirho.pageChirho} line ${lineChirho.lineIndexChirho} ` +
      `x=${Math.round(rChirho.xChirho)} w=${Math.round(rChirho.widthChirho)} ${rChirho.scriptChirho} covered ${Math.round(coveredChirho)}px`);
  }
  for (const dChirho of flaggedChirho) {
    tChirho.draftWidthChirho += dChirho.widthPxChirho;
    tChirho.draftTruthWidthChirho += refNonLatinChirho.reduce((nChirho, rChirho) =>
      nChirho + overlapChirho(rChirho.xChirho, rChirho.xChirho + rChirho.widthChirho, dChirho.xMinPxChirho, dChirho.xMinPxChirho + dChirho.widthPxChirho), 0);
  }
}

function pctChirho(aChirho: number, bChirho: number): string {
  return bChirho === 0 ? "n/a" : `${((100 * aChirho) / bChirho).toFixed(1)}%`;
}

async function mainChirho(): Promise<void> {
  let thresholdsChirho = [30, 45, 60, 80, 110, 150, Infinity];
  let missesShownChirho = 12;
  for (const aChirho of process.argv.slice(2)) {
    let vChirho: string | null;
    if ((vChirho = parseCliArgPrefixValueChirho(aChirho, "--thresholds=")) !== null) {
      thresholdsChirho = vChirho.split(",").map((tChirho) => (tChirho === "off" ? Infinity : Number(tChirho)));
      if (thresholdsChirho.some((tChirho) => Number.isNaN(tChirho))) throw new Error("--thresholds takes pixel numbers or off");
    }
    else if ((vChirho = parseCliArgPrefixValueChirho(aChirho, "--misses=")) !== null) missesShownChirho = Number(vChirho);
    else throw new Error(`unknown argument: ${aChirho}`);
  }
  const dbChirho = new Database(PROGRESS_DB_PATH_CHIRHO, { readonly: true });
  const pagesChirho = loadLinesChirho(dbChirho);
  for (const knownModeChirho of ["with-known-words", "known-words-empty"] as const) {
    const reasonsByPageChirho = new Map<string, Awaited<ReturnType<typeof classifyPageChirho>>>();
    for (const [keyChirho, linesChirho] of pagesChirho) {
      const volChirho = linesChirho[0]!.volChirho;
      const knownChirho = knownModeChirho === "with-known-words" ? loadKnownWordsFromChirho(dbChirho, volChirho) : new Set<string>();
      reasonsByPageChirho.set(keyChirho, await classifyPageChirho(
        linesChirho.map((lChirho) => ({ lineIndexChirho: lChirho.lineIndexChirho, wordsChirho: lChirho.wordsChirho })), knownChirho));
    }
    console.log(`\n## ${knownModeChirho}: ${pagesChirho.size} pages`);
    console.log("| Gap px | Vol | Non-Latin spans | Flagged | Width recall | Flag precision | Flag tiles |");
    console.log("| --- | --- | --- | --- | --- | --- | --- |");
    for (const gapChirho of thresholdsChirho) {
      const byVolChirho = new Map<number, TallyChirho>();
      const scriptsChirho: ScriptTallyChirho = new Map();
      for (const [keyChirho, linesChirho] of pagesChirho) {
        const verdictsChirho = reasonsByPageChirho.get(keyChirho)!;
        const tChirho = byVolChirho.get(linesChirho[0]!.volChirho) ?? emptyTallyChirho();
        byVolChirho.set(linesChirho[0]!.volChirho, tChirho);
        for (const lChirho of linesChirho) {
          const reasonsChirho = verdictsChirho.filter((vChirho) => vChirho.lineIndexChirho === lChirho.lineIndexChirho)
            .sort((aChirho, bChirho) => aChirho.wordIndexChirho - bChirho.wordIndexChirho).map((vChirho) => vChirho.reasonChirho);
          tallyLineChirho(tChirho, scriptsChirho, lChirho, draftLineSegmentsChirho(lChirho, reasonsChirho, gapChirho));
        }
      }
      const allChirho = emptyTallyChirho();
      for (const [volChirho, tChirho] of [...byVolChirho].sort((aChirho, bChirho) => aChirho[0] - bChirho[0])) {
        console.log(`| ${gapChirho === Infinity ? "off" : gapChirho} | ${volChirho} | ${tChirho.refSpansChirho} | ${tChirho.flaggedSpansChirho} (${pctChirho(tChirho.flaggedSpansChirho, tChirho.refSpansChirho)}) | ` +
          `${pctChirho(tChirho.coveredWidthChirho, tChirho.refWidthChirho)} | ${pctChirho(tChirho.draftTruthWidthChirho, tChirho.draftWidthChirho)} | ${tChirho.draftTilesChirho} |`);
        for (const kChirho of Object.keys(allChirho) as Array<keyof TallyChirho>) {
          if (kChirho === "missesChirho") allChirho.missesChirho.push(...tChirho.missesChirho);
          else allChirho[kChirho] += tChirho[kChirho];
        }
      }
      console.log(`| ${gapChirho === Infinity ? "off" : gapChirho} | all | ${allChirho.refSpansChirho} | ${allChirho.flaggedSpansChirho} (${pctChirho(allChirho.flaggedSpansChirho, allChirho.refSpansChirho)}) | ` +
        `${pctChirho(allChirho.coveredWidthChirho, allChirho.refWidthChirho)} | ${pctChirho(allChirho.draftTruthWidthChirho, allChirho.draftWidthChirho)} | ${allChirho.draftTilesChirho} |`);
      if (gapChirho === thresholdsChirho[Math.floor(thresholdsChirho.length / 2)] && knownModeChirho === "known-words-empty") {
        console.log(`\nBy reference script at gap ${gapChirho}px: ` + [...scriptsChirho].sort()
          .map(([sChirho, cChirho]) => `${sChirho} ${cChirho.flaggedChirho}/${cChirho.refChirho}`).join(", "));
        console.log(`\nMissed spans at gap ${gapChirho}px (first ${missesShownChirho} of ${allChirho.missesChirho.length}):`);
        for (const mChirho of allChirho.missesChirho.slice(0, missesShownChirho)) console.log(`- ${mChirho}`);
        console.log("");
      }
    }
  }
  dbChirho.close();
}

if (import.meta.main) {
  await mainChirho();
}
