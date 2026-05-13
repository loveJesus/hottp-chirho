// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Vision word-batch pipeline.
 *
 * Tesseract has plateaued on this scan's font (Hebrew yod/lamed/resh confusions,
 * dropped יהוה, hallucinated French "man" where Hebrew was). Per-word vision
 * with a strict skip filter is the next lever.
 *
 * Filter (skip vision iff ALL hold):
 *   - text length >= 6 (per project rule — shorter tokens could hide Hebrew
 *     misreads like "1?" or "On?")
 *   - text is pure Latin alpha [a-zA-ZÀ-ÿ'-]
 *   - hunspell-fr accepts it (clearly a French word)
 *
 * Everything else → crops into 20-word batches under
 *   workspace-chirho/vision-batches-chirho/vol-V-page-PPPP-chirho/batch-NNN-chirho/
 *
 * Two phases:
 *   bun src-chirho/vision-word-batch-chirho.ts --vol=1 --page=148 --crop
 *     filter + crop + emit prompt.md + words-meta.json per batch
 *
 *   bun src-chirho/vision-word-batch-chirho.ts --vol=1 --page=148 --apply
 *     read batch-NNN-chirho/results-chirho.json files, emit events_chirho rows
 *     (auto-apply word-vision-applied-chirho if certainty >= 0.9; else flag)
 *
 * The agent loop between phases is run by the operator from inside Claude Code —
 * one Agent invocation per batch, reading the prompt + cropped images, writing
 * results-chirho.json back into the batch directory.
 */

import { existsSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { Database } from "bun:sqlite";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { initDbChirho, sqliteChirho } from "./db-chirho.ts";
import { runCmdChirho, ensureDirChirho, logChirho } from "./utils-chirho.ts";
import { findFrenchMissesChirho } from "./dict-check-chirho.ts";

const MODULE_CHIRHO = "vision-word-batch-chirho";

const BATCH_SIZE_CHIRHO = 20;
const SKIP_MIN_LEN_CHIRHO = 6;
const CROP_PAD_PX_CHIRHO = 4; // small bbox padding so Hebrew nikkud isn't clipped
const AUTO_APPLY_CERTAINTY_CHIRHO = 0.9;

interface WordRowChirho {
  id_chirho: number;
  scanline_id_chirho: number;
  word_index_chirho: number;
  x_min_chirho: number;
  y_min_chirho: number;
  x_max_chirho: number;
  y_max_chirho: number;
  current_text_chirho: string | null;
  current_script_chirho: string | null;
  page_id_chirho: number;
  line_index_chirho: number;
}

interface BatchWordEntryChirho {
  batchIdxChirho: number;     // 0-19 inside batch
  wordIdChirho: number;
  scanlineIdChirho: number;
  lineIndexChirho: number;
  wordIndexChirho: number;
  bboxChirho: { xMinChirho: number; yMinChirho: number; xMaxChirho: number; yMaxChirho: number };
  tesseractTextChirho: string;
  declaredScriptChirho: string;
  cropFileChirho: string;     // relative to batch dir
  lineContextChirho: string;  // full text of the scanline this word lives in
}

interface BatchManifestChirho {
  volChirho: number;
  pageNumChirho: number;
  batchNumChirho: number;
  wordsChirho: BatchWordEntryChirho[];
}

function isPureLatinAlphaChirho(textChirho: string): boolean {
  return /^[a-zA-ZÀ-ÿ'-]+$/.test(textChirho);
}

function batchesDirChirho(volChirho: number, pageNumChirho: number): string {
  return join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "vision-batches-chirho",
    `vol-${volChirho}-page-${String(pageNumChirho).padStart(4, "0")}-chirho`
  );
}

async function cropPhaseChirho(volChirho: number, pageNumChirho: number): Promise<void> {
  initDbChirho();

  const pageRowChirho = sqliteChirho
    .query("SELECT id_chirho FROM pages_chirho WHERE volume_number_chirho = ? AND page_number_chirho = ?")
    .get(volChirho, pageNumChirho) as { id_chirho: number } | undefined;
  if (!pageRowChirho) {
    throw new Error(`vol ${volChirho} p${pageNumChirho}: not found`);
  }
  const pageIdChirho = pageRowChirho.id_chirho;

  const pageImagePathChirho = join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "images-chirho",
    `vol-${volChirho}-chirho`,
    `page-${String(pageNumChirho).padStart(4, "0")}-chirho.png`
  );
  if (!existsSync(pageImagePathChirho)) {
    throw new Error(`page image not found: ${pageImagePathChirho}`);
  }

  const wordsChirho = sqliteChirho
    .query(
      `SELECT w.id_chirho, w.scanline_id_chirho, w.word_index_chirho,
              w.x_min_chirho, w.y_min_chirho, w.x_max_chirho, w.y_max_chirho,
              w.current_text_chirho, w.current_script_chirho,
              s.line_index_chirho, s.pdftotext_chirho AS line_text_chirho
         FROM words_chirho w
         JOIN scanlines_chirho s ON s.id_chirho = w.scanline_id_chirho
         WHERE s.page_id_chirho = ?
         ORDER BY s.line_index_chirho, w.word_index_chirho`
    )
    .all(pageIdChirho) as Array<Omit<WordRowChirho, "page_id_chirho"> & { line_text_chirho: string | null }>;

  logChirho(MODULE_CHIRHO, `loaded ${wordsChirho.length} words for vol ${volChirho} p${pageNumChirho}`);

  // ===== filter =====
  const candidateTextsChirho = wordsChirho
    .map((wChirho) => (wChirho.current_text_chirho ?? "").trim())
    .filter((tChirho) => [...tChirho].length >= SKIP_MIN_LEN_CHIRHO && isPureLatinAlphaChirho(tChirho));
  const missesChirho = await findFrenchMissesChirho(candidateTextsChirho);

  interface ToVisionChirho extends Omit<WordRowChirho, "page_id_chirho"> {
    textChirho: string;
    lineTextChirho: string;
  }
  const toVisionChirho: ToVisionChirho[] = [];
  let skippedFrenchChirho = 0;
  let skippedEmptyChirho = 0;
  for (const wChirho of wordsChirho) {
    const tChirho = (wChirho.current_text_chirho ?? "").trim();
    if (tChirho === "") { skippedEmptyChirho++; continue; }
    const isLongPureLatinChirho = [...tChirho].length >= SKIP_MIN_LEN_CHIRHO && isPureLatinAlphaChirho(tChirho);
    const isFrenchHitChirho = isLongPureLatinChirho && !missesChirho.has(tChirho);
    if (isFrenchHitChirho) {
      skippedFrenchChirho++;
      continue;
    }
    toVisionChirho.push({ ...wChirho, textChirho: tChirho, lineTextChirho: wChirho.line_text_chirho ?? "" });
  }
  logChirho(
    MODULE_CHIRHO,
    `filter: ${skippedEmptyChirho} empty + ${skippedFrenchChirho} clear French = ${skippedEmptyChirho + skippedFrenchChirho} skipped; ${toVisionChirho.length} to vision`
  );

  // ===== batch + crop =====
  const outRootChirho = batchesDirChirho(volChirho, pageNumChirho);
  ensureDirChirho(outRootChirho);

  for (let bChirho = 0; bChirho * BATCH_SIZE_CHIRHO < toVisionChirho.length; bChirho++) {
    const batchWordsChirho = toVisionChirho.slice(bChirho * BATCH_SIZE_CHIRHO, (bChirho + 1) * BATCH_SIZE_CHIRHO);
    const batchDirChirho = join(outRootChirho, `batch-${String(bChirho).padStart(3, "0")}-chirho`);
    ensureDirChirho(batchDirChirho);
    const entriesChirho: BatchWordEntryChirho[] = [];

    for (let iChirho = 0; iChirho < batchWordsChirho.length; iChirho++) {
      const wChirho = batchWordsChirho[iChirho]!;
      const xChirho = Math.max(0, wChirho.x_min_chirho - CROP_PAD_PX_CHIRHO);
      const yChirho = Math.max(0, wChirho.y_min_chirho - CROP_PAD_PX_CHIRHO);
      const wPxChirho = (wChirho.x_max_chirho - wChirho.x_min_chirho) + CROP_PAD_PX_CHIRHO * 2;
      const hPxChirho = (wChirho.y_max_chirho - wChirho.y_min_chirho) + CROP_PAD_PX_CHIRHO * 2;
      const cropFileChirho = `word-${String(iChirho).padStart(2, "0")}-chirho.png`;
      const cropPathChirho = join(batchDirChirho, cropFileChirho);
      await runCmdChirho([
        "magick",
        pageImagePathChirho,
        "-crop",
        `${Math.round(wPxChirho)}x${Math.round(hPxChirho)}+${Math.round(xChirho)}+${Math.round(yChirho)}`,
        "+repage",
        cropPathChirho,
      ]);
      entriesChirho.push({
        batchIdxChirho: iChirho,
        wordIdChirho: wChirho.id_chirho,
        scanlineIdChirho: wChirho.scanline_id_chirho,
        lineIndexChirho: wChirho.line_index_chirho,
        wordIndexChirho: wChirho.word_index_chirho,
        bboxChirho: {
          xMinChirho: wChirho.x_min_chirho,
          yMinChirho: wChirho.y_min_chirho,
          xMaxChirho: wChirho.x_max_chirho,
          yMaxChirho: wChirho.y_max_chirho,
        },
        tesseractTextChirho: wChirho.textChirho,
        declaredScriptChirho: wChirho.current_script_chirho ?? "latin-chirho",
        cropFileChirho,
        lineContextChirho: wChirho.lineTextChirho,
      });
    }

    const manifestChirho: BatchManifestChirho = {
      volChirho,
      pageNumChirho,
      batchNumChirho: bChirho,
      wordsChirho: entriesChirho,
    };
    writeFileSync(
      join(batchDirChirho, "words-meta-chirho.json"),
      JSON.stringify(manifestChirho, null, 2),
      "utf8"
    );
    writeFileSync(join(batchDirChirho, "prompt-chirho.md"), buildPromptChirho(entriesChirho), "utf8");
  }

  logChirho(MODULE_CHIRHO, `wrote ${Math.ceil(toVisionChirho.length / BATCH_SIZE_CHIRHO)} batches to ${outRootChirho}`);
}

function buildPromptChirho(entriesChirho: BatchWordEntryChirho[]): string {
  const tessLinesChirho = entriesChirho
    .map((eChirho) => {
      const ctxChirho = eChirho.lineContextChirho.replace(/\s+/g, " ").trim();
      return `  idx ${String(eChirho.batchIdxChirho).padStart(2, " ")}:
    crop file:   ${eChirho.cropFileChirho}
    tesseract:   "${eChirho.tesseractTextChirho}"
    line ${eChirho.lineIndexChirho} reads: "${ctxChirho}"`;
    })
    .join("\n\n");
  return `You are reviewing OCR output from Barthélemy's "Critique textuelle de l'Ancien Testament" — a French scholarly commentary on the Hebrew Old Testament. The text mixes French commentary with embedded Hebrew, Greek, Syriac, Arabic, and Latin (non-French) tokens.

You will read **${entriesChirho.length} word-crop PNG files** from the current directory. Each crop is one isolated word, and the tesseract guess + surrounding line context (from tesseract's full-line OCR) is provided for disambiguation.

Words to identify:

${tessLinesChirho}

For EACH crop, return a JSON object:

  {
    "idx": 0,
    "language": "hebrew" | "greek" | "syriac" | "arabic" | "latin-french" | "latin-non-french" | "symbol" | "unknown",
    "spelling": "the word as you actually see it, in proper Unicode",
    "certainty": 0.0 - 1.0,
    "tesseract_was": "<tesseract's exact guess>",
    "notes": "<optional brief note, blank if none>"
  }

Final output must be a SINGLE JSON object:

  { "results": [ ... 20 items in idx order ... ] }

No prose before or after the JSON.

Calibration notes:
- If tesseract's guess matches the image exactly: certainty 0.95+.
- If tesseract clearly garbled it (Hebrew→Latin like "man", "imi?", "On?") and you can read the real word: produce the correct Unicode with your honest confidence.
- For biblical Hebrew: prefer Masoretic spellings (e.g. יהוה for the tetragrammaton).
- Single-letter sigla like *M, *G, *S, [A], [B], M, G, V, T are textual witnesses — keep them as-is, language "symbol".
- Numbered list markers (1., 2.) → language "symbol".
- Hyphens at line breaks (accusa-, expri-) → keep the trailing dash, language "latin-french".
`;
}

interface VisionResultChirho {
  idx: number;
  language: string;
  spelling: string;
  certainty: number;
  tesseract_was?: string;
  notes?: string;
}

function languageToScriptChirho(langChirho: string): string {
  const mapChirho: Record<string, string> = {
    "hebrew": "hebrew-chirho",
    "greek": "greek-chirho",
    "syriac": "syriac-chirho",
    "arabic": "arabic-chirho",
    "latin-french": "latin-chirho",
    "latin-non-french": "latin-non-french-chirho",
    "symbol": "symbol-chirho",
    "unknown": "unknown-chirho",
  };
  return mapChirho[langChirho] ?? "unknown-chirho";
}

function detectScriptFromTextChirho(textChirho: string): string {
  let hebChirho = 0, grkChirho = 0, syrChirho = 0, arbChirho = 0, latChirho = 0;
  for (const chChirho of textChirho) {
    const cChirho = chChirho.codePointAt(0)!;
    if (cChirho >= 0x0590 && cChirho <= 0x05ff) hebChirho++;
    else if ((cChirho >= 0x0370 && cChirho <= 0x03ff) || (cChirho >= 0x1f00 && cChirho <= 0x1fff)) grkChirho++;
    else if (cChirho >= 0x0700 && cChirho <= 0x074f) syrChirho++;
    else if (cChirho >= 0x0600 && cChirho <= 0x06ff) arbChirho++;
    else if ((cChirho >= 0x0041 && cChirho <= 0x024f) || (cChirho >= 0x1e00 && cChirho <= 0x1eff)) latChirho++;
  }
  const totalChirho = hebChirho + grkChirho + syrChirho + arbChirho + latChirho;
  if (totalChirho === 0) return "symbol-chirho";
  if (hebChirho >= Math.max(grkChirho, syrChirho, arbChirho, latChirho)) return "hebrew-chirho";
  if (grkChirho >= Math.max(syrChirho, arbChirho, latChirho)) return "greek-chirho";
  if (syrChirho >= Math.max(arbChirho, latChirho)) return "syriac-chirho";
  if (arbChirho >= latChirho) return "arabic-chirho";
  return "latin-chirho";
}

/**
 * Canonical-from-recon: for each scanline where tesseract's word count equals
 * the reconstructed-text token count, emit text-corrected events from the
 * canonical reconstruction (positionally aligned). This is the strongest
 * signal we have — reconstruct-text-chirho.ts uses WLC/BHS lookup for the
 * Hebrew, so its tokens are authoritatively correct when alignment holds.
 *
 * Word position alignment failure mode: tesseract and recon split differently
 * on punctuation or merge differently around long runs. When counts disagree
 * we fall through to Opus-vision logic instead.
 */
function applyCanonicalFromReconChirho(pageIdChirho: number): {
  appliedChirho: number;
  skippedLinesChirho: number;
  alignedScanlineIdsChirho: Set<number>;
} {
  const reconRowChirho = sqliteChirho
    .query("SELECT reconstructed_text_chirho FROM pages_chirho WHERE id_chirho = ?")
    .get(pageIdChirho) as { reconstructed_text_chirho: string | null } | undefined;
  const reconLinesChirho = (reconRowChirho?.reconstructed_text_chirho ?? "").split("\n");

  const scanlinesChirho = sqliteChirho
    .query("SELECT id_chirho, line_index_chirho FROM scanlines_chirho WHERE page_id_chirho = ? ORDER BY line_index_chirho")
    .all(pageIdChirho) as Array<{ id_chirho: number; line_index_chirho: number }>;

  let appliedChirho = 0;
  let skippedLinesChirho = 0;
  const alignedScanlineIdsChirho = new Set<number>();
  for (const slChirho of scanlinesChirho) {
    const reconBodyChirho = reconLinesChirho[slChirho.line_index_chirho] ?? "";
    const reconTokensChirho = reconBodyChirho.split(/\s+/).filter((tChirho) => tChirho.length > 0);
    const lineWordsChirho = sqliteChirho
      .query(
        `SELECT id_chirho, word_index_chirho, current_text_chirho, current_script_chirho, is_human_confirmed_chirho
           FROM words_chirho WHERE scanline_id_chirho = ? ORDER BY word_index_chirho`
      )
      .all(slChirho.id_chirho) as Array<{
        id_chirho: number;
        word_index_chirho: number;
        current_text_chirho: string | null;
        current_script_chirho: string | null;
        is_human_confirmed_chirho: number;
      }>;
    if (lineWordsChirho.length !== reconTokensChirho.length) {
      skippedLinesChirho++;
      continue;
    }
    alignedScanlineIdsChirho.add(slChirho.id_chirho);
    for (let pChirho = 0; pChirho < lineWordsChirho.length; pChirho++) {
      const wChirho = lineWordsChirho[pChirho]!;
      if (wChirho.is_human_confirmed_chirho === 1) continue;
      const reconTokChirho = reconTokensChirho[pChirho]!.normalize("NFC");
      const curTextChirho = (wChirho.current_text_chirho ?? "").trim().normalize("NFC");
      if (curTextChirho === reconTokChirho) continue;
      const newScriptChirho = detectScriptFromTextChirho(reconTokChirho);
      sqliteChirho.run(
        `INSERT INTO events_chirho
           (page_id_chirho, scanline_id_chirho, word_id_chirho, aggregate_type_chirho,
            event_type_chirho, payload_json_chirho, reviewer_chirho)
         VALUES (?, ?, ?, 'word-chirho', 'word-text-corrected-chirho', ?, 'canonical-recon-chirho')`,
        [
          pageIdChirho,
          slChirho.id_chirho,
          wChirho.id_chirho,
          JSON.stringify({
            oldTextChirho: wChirho.current_text_chirho,
            newTextChirho: reconTokChirho,
            newScriptChirho,
            viaChirho: "canonical-recon-positional-chirho",
          }),
        ]
      );
      sqliteChirho.run(
        `UPDATE words_chirho
           SET current_text_chirho = ?, current_script_chirho = ?,
               current_source_chirho = 'canonical-chirho',
               pending_script_flag_chirho = 0
           WHERE id_chirho = ? AND is_human_confirmed_chirho = 0`,
        [reconTokChirho, newScriptChirho, wChirho.id_chirho]
      );
      appliedChirho++;
    }
  }
  return { appliedChirho, skippedLinesChirho, alignedScanlineIdsChirho };
}

async function applyPhaseChirho(volChirho: number, pageNumChirho: number): Promise<void> {
  initDbChirho();
  const pageRowChirho = sqliteChirho
    .query("SELECT id_chirho FROM pages_chirho WHERE volume_number_chirho = ? AND page_number_chirho = ?")
    .get(volChirho, pageNumChirho) as { id_chirho: number } | undefined;
  if (!pageRowChirho) throw new Error(`vol ${volChirho} p${pageNumChirho}: not found`);
  const pageIdChirho = pageRowChirho.id_chirho;

  // Canonical-from-recon first: positional alignment for lines where tess word
  // count equals recon token count. This is the gold-standard correction for
  // Hebrew quotations (WLC/BHS lookup) and takes precedence over Opus.
  const canonChirho = applyCanonicalFromReconChirho(pageIdChirho);
  logChirho(
    MODULE_CHIRHO,
    `canonical-from-recon: ${canonChirho.appliedChirho} text-corrected events; ${canonChirho.skippedLinesChirho} lines had count mismatch`
  );
  const alignedScanlineIdsChirho = canonChirho.alignedScanlineIdsChirho;

  const outRootChirho = batchesDirChirho(volChirho, pageNumChirho);
  if (!existsSync(outRootChirho)) throw new Error(`no batches dir: ${outRootChirho}`);
  const batchDirsChirho = readdirSync(outRootChirho).filter((nChirho) => /^batch-\d{3}-chirho$/.test(nChirho)).sort();

  let appliedChirho = 0;
  let flaggedChirho = 0;
  let missingResultsChirho = 0;
  let skippedMatchChirho = 0;

  for (const bdChirho of batchDirsChirho) {
    const batchDirChirho = join(outRootChirho, bdChirho);
    const manifestPathChirho = join(batchDirChirho, "words-meta-chirho.json");
    const resultsPathChirho = join(batchDirChirho, "results-chirho.json");
    if (!existsSync(resultsPathChirho)) {
      logChirho(MODULE_CHIRHO, `WARN no results in ${bdChirho}, skipping`);
      missingResultsChirho++;
      continue;
    }
    const manifestChirho = JSON.parse(await Bun.file(manifestPathChirho).text()) as BatchManifestChirho;
    const resultsRawChirho = JSON.parse(await Bun.file(resultsPathChirho).text()) as { results: VisionResultChirho[] };
    const resultsByIdxChirho = new Map<number, VisionResultChirho>();
    for (const rChirho of resultsRawChirho.results) resultsByIdxChirho.set(rChirho.idx, rChirho);

    // Dual-signal: cross-check Opus suggestions against the page's canonical
    // reconstructed text. Agreement promotes apply regardless of Opus cert.
    //
    // pages.reconstructed_text_chirho is built by reconstruct-text-chirho.ts —
    // an independent pipeline that does line-level OCR plus WLC/BHS lookup for
    // Hebrew quotations. Format: one canonical-text line per scanline, in
    // line-index order (zero-indexed array position equals line_index_chirho).
    //
    // (scanlines.pdftotext_chirho is the raw per-line tesseract output and does
    // NOT contain the corrected canonical text — that was the original
    // mis-direction.)
    const reconRowChirho = sqliteChirho
      .query("SELECT reconstructed_text_chirho FROM pages_chirho WHERE id_chirho = ?")
      .get(pageIdChirho) as { reconstructed_text_chirho: string | null } | undefined;
    const reconLinesChirho = (reconRowChirho?.reconstructed_text_chirho ?? "").split("\n");
    const lineTokensByLineIdxChirho = new Map<number, Set<string>>();
    for (let lIdxChirho = 0; lIdxChirho < reconLinesChirho.length; lIdxChirho++) {
      const bodyChirho = reconLinesChirho[lIdxChirho] ?? "";
      const tokensChirho = new Set<string>();
      for (const tokChirho of bodyChirho.split(/\s+/)) {
        const trimmedChirho = tokChirho.replace(/[.,;:!?()\[\]"'‘’“”]/g, "").trim().normalize("NFC");
        if (trimmedChirho.length > 0) tokensChirho.add(trimmedChirho);
      }
      lineTokensByLineIdxChirho.set(lIdxChirho, tokensChirho);
    }

    for (const wChirho of manifestChirho.wordsChirho) {
      const rChirho = resultsByIdxChirho.get(wChirho.batchIdxChirho);
      if (!rChirho) continue;
      // Skip Opus's input on scanlines that the canonical-from-recon step
      // already handled — recon positional alignment is authoritative and
      // Opus's per-word guess (which lacks page context) would only add noise
      // or, worse, the bag-of-tokens false positive that misplaced ברית onto
      // mna. when the correct answer at that position was יהוה.
      if (alignedScanlineIdsChirho.has(wChirho.scanlineIdChirho)) {
        skippedMatchChirho++;
        continue;
      }
      const newScriptChirho = languageToScriptChirho(rChirho.language);
      const sameTextChirho = (rChirho.spelling ?? "").trim() === wChirho.tesseractTextChirho.trim();
      const sameScriptChirho = newScriptChirho === wChirho.declaredScriptChirho;
      if (sameTextChirho && sameScriptChirho) {
        skippedMatchChirho++;
        continue;
      }
      const certChirho = typeof rChirho.certainty === "number" ? rChirho.certainty : 0;
      // Non-aligned scanlines: no positional recon to cross-check, so use the
      // strict certainty threshold only. Bag-of-tokens dual-signal was unsafe
      // here (could match a different position's token in the same line).
      if (certChirho >= AUTO_APPLY_CERTAINTY_CHIRHO) {
        // Single combined vision-applied event.
        sqliteChirho.run(
          `INSERT INTO events_chirho
             (page_id_chirho, scanline_id_chirho, word_id_chirho, aggregate_type_chirho,
              event_type_chirho, payload_json_chirho, reviewer_chirho)
           VALUES (?, ?, ?, 'word-chirho', 'word-vision-applied-chirho', ?, 'vision-batch-opus-chirho')`,
          [
            pageIdChirho,
            wChirho.scanlineIdChirho,
            wChirho.wordIdChirho,
            JSON.stringify({
              newTextChirho: rChirho.spelling,
              newScriptChirho,
              certaintyChirho: certChirho,
              tesseractWasChirho: wChirho.tesseractTextChirho,
              notesChirho: rChirho.notes ?? "",
            }),
          ]
        );
        // Project onto words_chirho — vision authority only when it disagrees.
        sqliteChirho.run(
          `UPDATE words_chirho
             SET current_text_chirho = ?, current_script_chirho = ?,
                 current_source_chirho = 'vision-chirho',
                 pending_script_flag_chirho = 0
             WHERE id_chirho = ? AND is_human_confirmed_chirho = 0`,
          [rChirho.spelling, newScriptChirho, wChirho.wordIdChirho]
        );
        appliedChirho++;
      } else {
        // Surface as flag for human triage.
        sqliteChirho.run(
          `INSERT INTO events_chirho
             (page_id_chirho, scanline_id_chirho, word_id_chirho, aggregate_type_chirho,
              event_type_chirho, payload_json_chirho, reviewer_chirho)
           VALUES (?, ?, ?, 'word-chirho', 'word-script-flagged-chirho', ?, 'vision-batch-opus-chirho')`,
          [
            pageIdChirho,
            wChirho.scanlineIdChirho,
            wChirho.wordIdChirho,
            JSON.stringify({
              noteChirho: "vision-low-certainty-chirho",
              visionSpellingChirho: rChirho.spelling,
              visionLanguageChirho: rChirho.language,
              certaintyChirho: certChirho,
              tesseractWasChirho: wChirho.tesseractTextChirho,
            }),
          ]
        );
        sqliteChirho.run(
          `UPDATE words_chirho SET pending_script_flag_chirho = 1 WHERE id_chirho = ?`,
          [wChirho.wordIdChirho]
        );
        flaggedChirho++;
      }
    }
  }
  logChirho(
    MODULE_CHIRHO,
    `apply: ${appliedChirho} vision-applied (>=${AUTO_APPLY_CERTAINTY_CHIRHO} certainty), ${flaggedChirho} flagged for human, ${skippedMatchChirho} match-skipped, ${missingResultsChirho} batches missing results`
  );
}

async function mainChirho(): Promise<void> {
  const argsChirho = process.argv.slice(2);
  const volChirho = parseInt(argsChirho.find((aChirho) => aChirho.startsWith("--vol="))?.split("=")[1] ?? "", 10);
  const pageNumChirho = parseInt(argsChirho.find((aChirho) => aChirho.startsWith("--page="))?.split("=")[1] ?? "", 10);
  const doCropChirho = argsChirho.includes("--crop");
  const doApplyChirho = argsChirho.includes("--apply");
  if (!volChirho || !pageNumChirho || (!doCropChirho && !doApplyChirho)) {
    console.error("Usage: bun src-chirho/vision-word-batch-chirho.ts --vol=N --page=X (--crop | --apply)");
    process.exit(1);
  }
  if (doCropChirho) await cropPhaseChirho(volChirho, pageNumChirho);
  if (doApplyChirho) await applyPhaseChirho(volChirho, pageNumChirho);
}

mainChirho().catch((errChirho) => {
  console.error(errChirho);
  process.exit(1);
});
