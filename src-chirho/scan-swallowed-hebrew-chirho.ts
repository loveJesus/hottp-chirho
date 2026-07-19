// For God so loved the world, that he gave his only begotten Son,
// that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Read-only sweep for the swallowed-Hebrew defect class (reviewer UX v2 plan,
 * Phase 5).
 *
 * The proven positive is vol 3 p151 L36: printed Hebrew was swallowed by the
 * neighboring French segment as an innocuous small digit-run ("pour 13,"),
 * while the Hebrew segment box carries the wrong word. Span-text-only scans
 * (find-hidden-hebrew-candidates-2026-06-04) miss this class because a 1-2
 * digit garble mid-sentence looks like ordinary prose.
 *
 * This scanner adds word-geometry signals, cross-referencing three witnesses
 * against the stored spans:
 *   - words_chirho word boxes + text (progress DB): digit-run words that
 *     violate French citation grammar inside french/latin spans;
 *   - stored span text: Hebrew codepoints inside non-Hebrew spans, U+FFFD;
 *   - existing CRNN preds (ocr-preds-chirho): Hebrew reads that disagree with
 *     a stored Hebrew span's consonant skeleton;
 *   - pre-review notes: advisory only, NEVER ground truth — a clean-sounding
 *     note on a flagged span is itself reported as a contradiction (the
 *     3:151:36:2 note is the proven false negative).
 *
 * It writes a markdown report and a machine-triage JSON of candidates. It
 * never edits spans, databases, proposals, or certification state.
 */

import { Database } from "bun:sqlite";
import { existsSync, readFileSync, readdirSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

import { writeTextAtomicChirho } from "./atomic-json-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { parseRawHebrewPreReviewNotesChirho } from "./raw-hebrew-pre-review-notes-chirho.ts";
import { renderSpanLineTextChirho } from "./span-line-text-chirho.ts";
import { sourceFingerprintForPathsChirho, type SourceFingerprintChirho } from "./source-fingerprint-chirho.ts";
import { scanSpanLinePathsChirho } from "./span-nfc-chirho.ts";
import { strictBlindScannerSourceFingerprintChirho } from "./strict-blind-scanner-source-fingerprint-chirho.ts";
import { normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "scan-swallowed-hebrew-chirho";
const DEFAULT_REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "swallowed-hebrew-sweep-2026-07-18-chirho.md"
);
const DEFAULT_JSON_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "swallowed-hebrew-sweep-chirho",
  "candidates-2026-07-18-chirho.json"
);
const DEFAULT_DB_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite");
const OCR_PREDS_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "pass-c-hebrew-validation-chirho",
  "ocr-preds-chirho"
);
const PRE_REVIEW_NOTES_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "codex-pre-review-raw-hebrew-2026-06-04-chirho.md"
);
const SCANLINES_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "scanlines-chirho");

const HEBREW_CHAR_RE_CHIRHO = /[֐-׿]/u;
const REPLACEMENT_CHAR_RE_CHIRHO = /�/u;
// A standalone number word, allowing one leading/trailing bracket or punctuation mark.
const DIGIT_WORD_RE_CHIRHO = /^[({[«"']?\d{1,4}[.,;:!?)\]}»"']?$/u;
// Scripture book abbreviations and similar citation heads (Éz, Jr, Ps, 1R, 2Ch, Gn.).
const CITATION_HEAD_RE_CHIRHO = /^[({[]?\d?\s?[A-ZÉÈÎÔ][a-zàâäéèêëîïôöùûüçœ]{0,4}\.?[)\]}]?$/u;
const FRENCH_LOWER_WORD_RE_CHIRHO = /^[a-zàâäéèêëîïôöùûüçœ'’-]+$/u;
// Lowercase heads that legitimately introduce a bare number in this corpus.
// "en" carries verse references ("en 13 et 14"); the swallow formula slot is
// the translation-equivalence head ("pour X", "par X"), which stays flagged.
const EXPECTED_NUMBER_HEAD_SET_CHIRHO = new Set([
  "p", "pp", "col", "cols", "n", "no", "ms", "mss", "fol", "fols",
  "ligne", "lignes", "page", "pages", "verset", "versets", "v", "vv", "vs", "en",
]);
// Connectives that continue a numeric list; look through them to the real head.
const TRANSPARENT_CONNECTIVE_SET_CHIRHO = new Set(["et", "ou"]);
// Followers that mark the number as citation/ordinal/manuscript context.
const ORDINAL_FOLLOWER_SET_CHIRHO = new Set(["e", "es", "ms", "mss"]);
const BOOK_FOLLOWER_RE_CHIRHO = /^[A-Z][a-z]{0,2}\.?$/u;
const PARENTHESIZED_NAME_FOLLOWER_RE_CHIRHO = /^\([A-ZÉÈ]/u;
const YEAR_RE_CHIRHO = /^1\d{3}$/u;
const APPARATUS_SEPARATOR_CHIRHO = "//";
// Advisory-note phrasings that claim the item looks fine; on a flagged span
// this is a contradiction, not an exoneration (3:151:36:2 proved it).
const CLEAN_NOTE_RE_CHIRHO = /no obvious|plausible for the live text|centered on the target word|looks correct|nothing suspicious/iu;
const ORPHAN_DIGIT_SCRIPT_SET_CHIRHO = new Set(["french-chirho", "latin-non-french-chirho"]);
const HEBREW_SCRIPT_CHIRHO = "hebrew-chirho";
const WITNESS_MIN_CONF_CHIRHO = 0.35;

interface SpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
}

interface SpanLineChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  lineWidthPxChirho: number;
  spansChirho: SpanChirho[];
}

interface WordEntryChirho {
  wordIndexChirho: number;
  relXMinChirho: number;
  relXMaxChirho: number;
  textChirho: string;
  scriptChirho: string;
}

interface WitnessPredChirho {
  lineIndexChirho: number;
  wordIndexChirho: number;
  predChirho: string;
  confChirho: number;
  isHebrewChirho: boolean;
}

type SeverityChirho = "high-chirho" | "medium-chirho";

interface WordEvidenceChirho {
  sourceChirho: "word-db-chirho" | "span-text-chirho";
  textChirho: string;
  previousTextChirho: string | null;
  relXMinChirho: number | null;
  relXMaxChirho: number | null;
}

interface FindingChirho {
  spanKeyChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  scriptChirho: string;
  spanTextChirho: string;
  xMinPxChirho: number;
  widthPxChirho: number;
  lineWidthPxChirho: number;
  severityChirho: SeverityChirho;
  signalsChirho: string[];
  wordEvidenceChirho: WordEvidenceChirho[];
  witnessChirho: { predChirho: string; confChirho: number } | null;
  preReviewNoteChirho: string | null;
  renderedLineTextChirho: string;
  spanPathChirho: string;
  scanlinePathChirho: string;
}

interface UnwitnessedHebrewSpanChirho {
  spanKeyChirho: string;
  spanTextChirho: string;
  xMinPxChirho: number;
  widthPxChirho: number;
  lineWidthPxChirho: number;
  scanlinePathChirho: string;
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function lineKeyChirho(volumeChirho: number, pageChirho: number, lineIndexChirho: number): string {
  return `${volumeChirho}:${pageChirho}:${lineIndexChirho}`;
}

function spanKeyChirho(lineChirho: SpanLineChirho, spanChirho: SpanChirho): string {
  return `${lineChirho.volumeChirho}:${lineChirho.pageChirho}:${lineChirho.lineIndexChirho}:${spanChirho.segmentIndexChirho}`;
}

function scanlinePathForLineChirho(lineChirho: SpanLineChirho): string {
  return join(
    SCANLINES_ROOT_CHIRHO,
    `vol-${lineChirho.volumeChirho}-chirho`,
    `page-${String(lineChirho.pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(lineChirho.lineIndexChirho).padStart(3, "0")}-chirho.png`
  );
}

function hebrewSkeletonChirho(textChirho: string): string {
  return textChirho
    .normalize("NFKD")
    .replace(/[֑-ׇ]/gu, "")
    .replace(/[^א-ת]/gu, "");
}

function loadWordMapChirho(dbPathChirho: string): Map<string, WordEntryChirho[]> {
  const wordMapChirho = new Map<string, WordEntryChirho[]>();
  if (!existsSync(dbPathChirho)) return wordMapChirho;
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const rowsChirho = dbChirho
      .query(`
        SELECT p.volume_number_chirho AS volume_chirho,
               p.page_number_chirho AS page_chirho,
               sl.line_index_chirho AS line_index_chirho,
               sl.x_min_chirho AS line_x_min_chirho,
               w.word_index_chirho AS word_index_chirho,
               w.x_min_chirho AS x_min_chirho,
               w.x_max_chirho AS x_max_chirho,
               w.current_text_chirho AS text_chirho,
               w.current_script_chirho AS script_chirho
          FROM words_chirho w
          JOIN scanlines_chirho sl ON sl.id_chirho = w.scanline_id_chirho
          JOIN pages_chirho p ON p.id_chirho = sl.page_id_chirho
         WHERE w.x_min_chirho IS NOT NULL
         ORDER BY p.volume_number_chirho, p.page_number_chirho, sl.line_index_chirho, w.word_index_chirho`)
      .all() as Array<{
        volume_chirho: number;
        page_chirho: number;
        line_index_chirho: number;
        line_x_min_chirho: number | null;
        word_index_chirho: number;
        x_min_chirho: number;
        x_max_chirho: number;
        text_chirho: string | null;
        script_chirho: string | null;
      }>;
    for (const rowChirho of rowsChirho) {
      const keyChirho = lineKeyChirho(rowChirho.volume_chirho, rowChirho.page_chirho, rowChirho.line_index_chirho);
      const lineXMinChirho = Number(rowChirho.line_x_min_chirho ?? 0);
      const entriesChirho = wordMapChirho.get(keyChirho) ?? [];
      entriesChirho.push({
        wordIndexChirho: rowChirho.word_index_chirho,
        relXMinChirho: Number(rowChirho.x_min_chirho) - lineXMinChirho,
        relXMaxChirho: Number(rowChirho.x_max_chirho) - lineXMinChirho,
        textChirho: rowChirho.text_chirho ?? "",
        scriptChirho: rowChirho.script_chirho ?? "",
      });
      wordMapChirho.set(keyChirho, entriesChirho);
    }
  } finally {
    dbChirho.close();
  }
  return wordMapChirho;
}

function loadWitnessMapChirho(): Map<string, WitnessPredChirho[]> {
  const witnessMapChirho = new Map<string, WitnessPredChirho[]>();
  if (!existsSync(OCR_PREDS_DIR_CHIRHO)) return witnessMapChirho;
  for (const fileChirho of readdirSync(OCR_PREDS_DIR_CHIRHO)) {
    const matchChirho = fileChirho.match(/^vol-(\d+)-p(\d+)-preds-chirho\.json$/);
    if (matchChirho === null) continue;
    const volumeChirho = Number.parseInt(matchChirho[1]!, 10);
    const pageChirho = Number.parseInt(matchChirho[2]!, 10);
    const parsedChirho = JSON.parse(readFileSync(join(OCR_PREDS_DIR_CHIRHO, fileChirho), "utf8")) as {
      predsChirho?: Array<Partial<WitnessPredChirho>>;
    };
    for (const predChirho of parsedChirho.predsChirho ?? []) {
      if (typeof predChirho.lineIndexChirho !== "number") continue;
      const keyChirho = lineKeyChirho(volumeChirho, pageChirho, predChirho.lineIndexChirho);
      const entriesChirho = witnessMapChirho.get(keyChirho) ?? [];
      entriesChirho.push({
        lineIndexChirho: predChirho.lineIndexChirho,
        wordIndexChirho: typeof predChirho.wordIndexChirho === "number" ? predChirho.wordIndexChirho : -1,
        predChirho: predChirho.predChirho ?? "",
        confChirho: typeof predChirho.confChirho === "number" ? predChirho.confChirho : 0,
        isHebrewChirho: predChirho.isHebrewChirho === true,
      });
      witnessMapChirho.set(keyChirho, entriesChirho);
    }
  }
  return witnessMapChirho;
}

function loadPreReviewNotesChirho(): Map<string, string> {
  if (!existsSync(PRE_REVIEW_NOTES_PATH_CHIRHO)) return new Map();
  return parseRawHebrewPreReviewNotesChirho(readFileSync(PRE_REVIEW_NOTES_PATH_CHIRHO, "utf8"));
}

function wordsInSpanChirho(wordsChirho: WordEntryChirho[], spanChirho: SpanChirho): WordEntryChirho[] {
  const spanEndChirho = spanChirho.xMinPxChirho + spanChirho.widthPxChirho;
  return wordsChirho.filter((wordChirho) => {
    const centerChirho = (wordChirho.relXMinChirho + wordChirho.relXMaxChirho) / 2;
    return centerChirho >= spanChirho.xMinPxChirho - 1 && centerChirho <= spanEndChirho + 1;
  });
}

function normalizedTokenChirho(textChirho: string): string {
  return textChirho.replace(/[.,;:!?()[\]{}«»"'’]/gu, "").toLowerCase();
}

function digitValueChirho(textChirho: string): string {
  return textChirho.replace(/[^\d]/gu, "");
}

function isExpectedNumberContextChirho(
  digitTextChirho: string,
  previousTextChirho: string | null,
  nextTextChirho: string | null
): boolean {
  if (YEAR_RE_CHIRHO.test(digitValueChirho(digitTextChirho))) return true;
  if (nextTextChirho !== null) {
    const nextChirho = nextTextChirho.trim();
    if (ORDINAL_FOLLOWER_SET_CHIRHO.has(normalizedTokenChirho(nextChirho))) return true;
    if (BOOK_FOLLOWER_RE_CHIRHO.test(nextChirho)) return true;
    if (PARENTHESIZED_NAME_FOLLOWER_RE_CHIRHO.test(nextChirho)) return true;
  }
  if (previousTextChirho === null) return true;
  if (/\d/u.test(previousTextChirho)) return true;
  if (CITATION_HEAD_RE_CHIRHO.test(previousTextChirho)) return true;
  return EXPECTED_NUMBER_HEAD_SET_CHIRHO.has(normalizedTokenChirho(previousTextChirho));
}

function headThroughConnectivesChirho(tokensChirho: (string | null)[], indexChirho: number): string | null {
  let cursorChirho = indexChirho;
  while (cursorChirho >= 0) {
    const tokenChirho = tokensChirho[cursorChirho];
    if (tokenChirho === null || tokenChirho === undefined) return null;
    if (!TRANSPARENT_CONNECTIVE_SET_CHIRHO.has(normalizedTokenChirho(tokenChirho))) return tokenChirho;
    cursorChirho -= 1;
  }
  return null;
}

function orphanDigitEvidenceFromTokensChirho(
  tokensChirho: string[],
  sourceChirho: WordEvidenceChirho["sourceChirho"],
  rangesChirho: Array<{ relXMinChirho: number; relXMaxChirho: number } | null>
): WordEvidenceChirho[] {
  const evidenceChirho: WordEvidenceChirho[] = [];
  for (let indexChirho = 0; indexChirho < tokensChirho.length; indexChirho += 1) {
    const tokenChirho = tokensChirho[indexChirho]!.trim();
    if (!DIGIT_WORD_RE_CHIRHO.test(tokenChirho)) continue;
    const previousTextChirho = headThroughConnectivesChirho(tokensChirho, indexChirho - 1);
    const nextTextChirho = indexChirho + 1 < tokensChirho.length ? tokensChirho[indexChirho + 1]! : null;
    if (isExpectedNumberContextChirho(tokenChirho, previousTextChirho, nextTextChirho)) continue;
    if (previousTextChirho !== null && !FRENCH_LOWER_WORD_RE_CHIRHO.test(previousTextChirho)) continue;
    evidenceChirho.push({
      sourceChirho,
      textChirho: tokenChirho,
      previousTextChirho,
      relXMinChirho: rangesChirho[indexChirho]?.relXMinChirho ?? null,
      relXMaxChirho: rangesChirho[indexChirho]?.relXMaxChirho ?? null,
    });
  }
  return evidenceChirho;
}

function orphanDigitEvidenceFromWordsChirho(
  wordsChirho: WordEntryChirho[],
  spanChirho: SpanChirho
): WordEvidenceChirho[] {
  const orderedChirho = [...wordsChirho].sort((aChirho, bChirho) => aChirho.wordIndexChirho - bChirho.wordIndexChirho);
  const spanEndChirho = spanChirho.xMinPxChirho + spanChirho.widthPxChirho;
  const evidenceChirho = orphanDigitEvidenceFromTokensChirho(
    orderedChirho.map((wordChirho) => wordChirho.textChirho),
    "word-db-chirho",
    orderedChirho.map((wordChirho) => ({ relXMinChirho: wordChirho.relXMinChirho, relXMaxChirho: wordChirho.relXMaxChirho }))
  );
  return evidenceChirho.filter((entryChirho) => {
    const centerChirho = ((entryChirho.relXMinChirho ?? 0) + (entryChirho.relXMaxChirho ?? 0)) / 2;
    return centerChirho >= spanChirho.xMinPxChirho - 1 && centerChirho <= spanEndChirho + 1;
  });
}

function orphanDigitEvidenceFromSpanTextChirho(spanChirho: SpanChirho): WordEvidenceChirho[] {
  const tokensChirho = normalizeTextForStorageChirho(spanChirho.utf8TextChirho).split(/\s+/u).filter(Boolean);
  return orphanDigitEvidenceFromTokensChirho(
    tokensChirho,
    "span-text-chirho",
    tokensChirho.map(() => null)
  );
}

function lineHasHebrewChirho(lineChirho: SpanLineChirho): boolean {
  return lineChirho.spansChirho.some(
    (spanChirho) =>
      spanChirho.scriptChirho === HEBREW_SCRIPT_CHIRHO || HEBREW_CHAR_RE_CHIRHO.test(spanChirho.utf8TextChirho)
  );
}

function witnessDisagreementChirho(
  spanChirho: SpanChirho,
  spanWordsChirho: WordEntryChirho[],
  witnessesChirho: WitnessPredChirho[]
): { predChirho: string; confChirho: number } | null {
  const spanWordIndexesChirho = new Set(spanWordsChirho.map((wordChirho) => wordChirho.wordIndexChirho));
  const storedSkeletonChirho = hebrewSkeletonChirho(spanChirho.utf8TextChirho);
  if (storedSkeletonChirho.length === 0) return null;
  for (const witnessChirho of witnessesChirho) {
    if (!spanWordIndexesChirho.has(witnessChirho.wordIndexChirho)) continue;
    if (!witnessChirho.isHebrewChirho) continue;
    if (witnessChirho.confChirho < WITNESS_MIN_CONF_CHIRHO) continue;
    const witnessSkeletonChirho = hebrewSkeletonChirho(witnessChirho.predChirho);
    if (witnessSkeletonChirho.length === 0) continue;
    const sharedChirho = [...witnessSkeletonChirho].filter((charChirho) => storedSkeletonChirho.includes(charChirho));
    if (sharedChirho.length === 0) {
      return { predChirho: witnessChirho.predChirho, confChirho: witnessChirho.confChirho };
    }
  }
  return null;
}

interface ScanResultChirho {
  findingsChirho: FindingChirho[];
  unwitnessedHebrewSpansChirho: UnwitnessedHebrewSpanChirho[];
  lineCountChirho: number;
  wordCoveredLineCountChirho: number;
}

function scanChirho(dbPathChirho: string): ScanResultChirho {
  const wordMapChirho = loadWordMapChirho(dbPathChirho);
  const witnessMapChirho = loadWitnessMapChirho();
  const preReviewNotesChirho = loadPreReviewNotesChirho();
  const findingsChirho: FindingChirho[] = [];
  const unwitnessedHebrewSpansChirho: UnwitnessedHebrewSpanChirho[] = [];
  const linePathsChirho = scanSpanLinePathsChirho();
  let wordCoveredLineCountChirho = 0;

  for (const pathChirho of linePathsChirho) {
    const lineChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as SpanLineChirho;
    const keyChirho = lineKeyChirho(lineChirho.volumeChirho, lineChirho.pageChirho, lineChirho.lineIndexChirho);
    const wordsChirho = wordMapChirho.get(keyChirho) ?? [];
    if (wordsChirho.length > 0) wordCoveredLineCountChirho += 1;
    const witnessesChirho = witnessMapChirho.get(keyChirho) ?? [];
    const hasHebrewChirho = lineHasHebrewChirho(lineChirho);
    const renderedLineTextChirho = renderSpanLineTextChirho(lineChirho, {
      normalizeTextChirho: normalizeTextForStorageChirho,
    });
    const scanlinePathChirho = scanlinePathForLineChirho(lineChirho);

    for (const spanChirho of lineChirho.spansChirho ?? []) {
      const signalsChirho: string[] = [];
      const wordEvidenceChirho: WordEvidenceChirho[] = [];
      let witnessChirho: { predChirho: string; confChirho: number } | null = null;
      const spanWordsChirho = wordsInSpanChirho(wordsChirho, spanChirho);

      if (spanChirho.scriptChirho === HEBREW_SCRIPT_CHIRHO) {
        witnessChirho = witnessDisagreementChirho(spanChirho, spanWordsChirho, witnessesChirho);
        if (witnessChirho !== null) {
          signalsChirho.push("witness-disagrees-hebrew-span-chirho");
        } else if (
          !witnessesChirho.some((candidateChirho) =>
            spanWordsChirho.some((wordChirho) => wordChirho.wordIndexChirho === candidateChirho.wordIndexChirho)
          )
        ) {
          unwitnessedHebrewSpansChirho.push({
            spanKeyChirho: spanKeyChirho(lineChirho, spanChirho),
            spanTextChirho: spanChirho.utf8TextChirho,
            xMinPxChirho: spanChirho.xMinPxChirho,
            widthPxChirho: spanChirho.widthPxChirho,
            lineWidthPxChirho: lineChirho.lineWidthPxChirho,
            scanlinePathChirho: relative(PROJECT_ROOT_CHIRHO, scanlinePathChirho),
          });
        }
      } else {
        if (HEBREW_CHAR_RE_CHIRHO.test(spanChirho.utf8TextChirho)) {
          signalsChirho.push("hebrew-text-in-nonhebrew-span-chirho");
        }
        if (REPLACEMENT_CHAR_RE_CHIRHO.test(spanChirho.utf8TextChirho)) {
          signalsChirho.push("replacement-char-chirho");
        }
        if (
          ORPHAN_DIGIT_SCRIPT_SET_CHIRHO.has(spanChirho.scriptChirho) &&
          !spanChirho.utf8TextChirho.includes(APPARATUS_SEPARATOR_CHIRHO)
        ) {
          const rawEvidenceChirho =
            spanWordsChirho.length > 0
              ? orphanDigitEvidenceFromWordsChirho(wordsChirho, spanChirho)
              : orphanDigitEvidenceFromSpanTextChirho(spanChirho);
          // A digit garble that swallowed Hebrew REPLACES the Hebrew: if the
          // stored line shows Hebrew within two tokens after the digit, the
          // equivalence target survived and the number is legitimate prose.
          // If the digit never appears in the stored line, the stored text
          // already superseded the word underlay (e.g. a restored siglum).
          const renderedTokensChirho = renderedLineTextChirho.split(/\s+/u).filter(Boolean);
          const orphanEvidenceChirho: WordEvidenceChirho[] = [];
          let supersededChirho = false;
          for (const entryChirho of rawEvidenceChirho) {
            const entryDigitsChirho = digitValueChirho(entryChirho.textChirho);
            const occurrenceIndexesChirho = renderedTokensChirho.flatMap((tokenChirho, indexChirho) =>
              /\d/u.test(tokenChirho) && digitValueChirho(tokenChirho) === entryDigitsChirho ? [indexChirho] : []
            );
            if (occurrenceIndexesChirho.length === 0) {
              supersededChirho = true;
              continue;
            }
            const hebrewFollowsEverywhereChirho = occurrenceIndexesChirho.every((indexChirho) =>
              [1, 2].some((offsetChirho) => {
                const followerChirho = renderedTokensChirho[indexChirho + offsetChirho];
                return followerChirho !== undefined && HEBREW_CHAR_RE_CHIRHO.test(followerChirho);
              })
            );
            if (hebrewFollowsEverywhereChirho) continue;
            orphanEvidenceChirho.push(entryChirho);
          }
          if (orphanEvidenceChirho.length > 0) {
            signalsChirho.push("orphan-digit-word-chirho");
            wordEvidenceChirho.push(...orphanEvidenceChirho);
          } else if (supersededChirho) {
            signalsChirho.push("digit-word-superseded-in-stored-text-chirho");
            wordEvidenceChirho.push(...rawEvidenceChirho);
          }
        }
      }

      if (signalsChirho.length === 0) continue;

      // Notes are keyed per segment, but a clean-sounding note anywhere on a
      // flagged line contradicts the flag (the 3:151:36 note sits on S2 while
      // the swallow evidence sits on S1). Prefer the span's own note text.
      const ownNoteChirho = preReviewNotesChirho.get(spanKeyChirho(lineChirho, spanChirho)) ?? null;
      const lineNotesChirho = (lineChirho.spansChirho ?? [])
        .map((siblingChirho) => preReviewNotesChirho.get(spanKeyChirho(lineChirho, siblingChirho)))
        .filter((candidateChirho): candidateChirho is string => candidateChirho !== undefined);
      const cleanLineNoteChirho = lineNotesChirho.find((candidateChirho) => CLEAN_NOTE_RE_CHIRHO.test(candidateChirho)) ?? null;
      const noteChirho = ownNoteChirho ?? cleanLineNoteChirho ?? lineNotesChirho[0] ?? null;
      if (cleanLineNoteChirho !== null) {
        signalsChirho.push("pre-review-note-contradicted-chirho");
      } else if (noteChirho !== null) {
        signalsChirho.push("pre-review-note-present-chirho");
      }

      const highChirho =
        signalsChirho.includes("hebrew-text-in-nonhebrew-span-chirho") ||
        signalsChirho.includes("witness-disagrees-hebrew-span-chirho") ||
        signalsChirho.includes("pre-review-note-contradicted-chirho") ||
        (signalsChirho.includes("orphan-digit-word-chirho") && hasHebrewChirho);

      findingsChirho.push({
        spanKeyChirho: spanKeyChirho(lineChirho, spanChirho),
        volumeChirho: lineChirho.volumeChirho,
        pageChirho: lineChirho.pageChirho,
        lineIndexChirho: lineChirho.lineIndexChirho,
        segmentIndexChirho: spanChirho.segmentIndexChirho,
        scriptChirho: spanChirho.scriptChirho,
        spanTextChirho: spanChirho.utf8TextChirho,
        xMinPxChirho: spanChirho.xMinPxChirho,
        widthPxChirho: spanChirho.widthPxChirho,
        lineWidthPxChirho: lineChirho.lineWidthPxChirho,
        severityChirho: highChirho ? "high-chirho" : "medium-chirho",
        signalsChirho,
        wordEvidenceChirho,
        witnessChirho,
        preReviewNoteChirho: noteChirho,
        renderedLineTextChirho,
        spanPathChirho: relative(PROJECT_ROOT_CHIRHO, pathChirho),
        scanlinePathChirho: relative(PROJECT_ROOT_CHIRHO, scanlinePathChirho),
      });
    }
  }

  findingsChirho.sort((aChirho, bChirho) => {
    if (aChirho.severityChirho !== bChirho.severityChirho) {
      return aChirho.severityChirho === "high-chirho" ? -1 : 1;
    }
    return (
      aChirho.volumeChirho - bChirho.volumeChirho ||
      aChirho.pageChirho - bChirho.pageChirho ||
      aChirho.lineIndexChirho - bChirho.lineIndexChirho ||
      aChirho.segmentIndexChirho - bChirho.segmentIndexChirho
    );
  });

  return {
    findingsChirho,
    unwitnessedHebrewSpansChirho,
    lineCountChirho: linePathsChirho.length,
    wordCoveredLineCountChirho,
  };
}

function markdownEscapeChirho(textChirho: string): string {
  return textChirho.replace(/`/gu, "\\`").replace(/\n/gu, " ");
}

function inlineCodeChirho(textChirho: string): string {
  return `\`${markdownEscapeChirho(textChirho)}\``;
}

function markdownImagePathChirho(reportPathChirho: string, imagePathChirho: string): string {
  return relative(dirname(reportPathChirho), join(PROJECT_ROOT_CHIRHO, imagePathChirho)).replaceAll("\\", "/");
}

function findingHeadingChirho(findingChirho: FindingChirho): string {
  return `vol ${findingChirho.volumeChirho} p${String(findingChirho.pageChirho).padStart(4, "0")} L${String(
    findingChirho.lineIndexChirho
  ).padStart(3, "0")} S${findingChirho.segmentIndexChirho}`;
}

function renderFindingSectionChirho(findingChirho: FindingChirho, reportPathChirho: string): string[] {
  const linesChirho = [
    `### ${findingChirho.severityChirho} ${findingHeadingChirho(findingChirho)} (${findingChirho.spanKeyChirho})`,
    "",
    `- Signals: ${findingChirho.signalsChirho.map(inlineCodeChirho).join(", ")}`,
    `- Span (${findingChirho.scriptChirho}, x ${findingChirho.xMinPxChirho}..${
      findingChirho.xMinPxChirho + findingChirho.widthPxChirho
    } of ${findingChirho.lineWidthPxChirho}): ${inlineCodeChirho(findingChirho.spanTextChirho)}`,
  ];
  for (const evidenceChirho of findingChirho.wordEvidenceChirho) {
    const rangeChirho =
      evidenceChirho.relXMinChirho === null
        ? "span-text"
        : `x ${Math.round(evidenceChirho.relXMinChirho)}..${Math.round(evidenceChirho.relXMaxChirho ?? 0)}`;
    linesChirho.push(
      `- Evidence (${evidenceChirho.sourceChirho}, ${rangeChirho}): ${inlineCodeChirho(evidenceChirho.textChirho)} after ${
        evidenceChirho.previousTextChirho === null ? "line start" : inlineCodeChirho(evidenceChirho.previousTextChirho)
      }`
    );
  }
  if (findingChirho.witnessChirho !== null) {
    linesChirho.push(
      `- CRNN witness read: ${inlineCodeChirho(findingChirho.witnessChirho.predChirho)} (conf ${findingChirho.witnessChirho.confChirho.toFixed(2)}) vs stored ${inlineCodeChirho(findingChirho.spanTextChirho)}`
    );
  }
  if (findingChirho.preReviewNoteChirho !== null) {
    linesChirho.push(`- Pre-review note (ADVISORY ONLY): ${inlineCodeChirho(findingChirho.preReviewNoteChirho)}`);
  }
  linesChirho.push(`- Line text: ${inlineCodeChirho(findingChirho.renderedLineTextChirho)}`);
  linesChirho.push(`- Span file: ${inlineCodeChirho(findingChirho.spanPathChirho)}`);
  if (findingChirho.severityChirho === "high-chirho") {
    linesChirho.push(`![scanline](${markdownImagePathChirho(reportPathChirho, findingChirho.scanlinePathChirho)})`);
  }
  linesChirho.push("");
  return linesChirho;
}

function renderReportChirho(
  resultChirho: ScanResultChirho,
  reportPathChirho: string,
  jsonPathChirho: string,
  spanFingerprintChirho: SourceFingerprintChirho,
  scannerFingerprintChirho: SourceFingerprintChirho
): string {
  const highChirho = resultChirho.findingsChirho.filter((findingChirho) => findingChirho.severityChirho === "high-chirho");
  const mediumChirho = resultChirho.findingsChirho.filter(
    (findingChirho) => findingChirho.severityChirho === "medium-chirho"
  );
  const signalCountsChirho = new Map<string, number>();
  for (const findingChirho of resultChirho.findingsChirho) {
    for (const signalChirho of findingChirho.signalsChirho) {
      signalCountsChirho.set(signalChirho, (signalCountsChirho.get(signalChirho) ?? 0) + 1);
    }
  }
  const linesChirho: string[] = [
    "<!-- For God so loved the world, that he gave his only begotten Son,",
    "that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->",
    "",
    "# Swallowed Hebrew Sweep Chirho",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Read-only machine triage queue for the swallowed-Hebrew defect class (reviewer UX v2 plan, Phase 5). Flags are review candidates, not certification results, and every repair still goes draft proposal -> approval -> apply. Pre-review notes are advisory only; a clean-sounding note on a flagged span is reported as a contradiction, never as an exoneration.",
    "",
    "## Summary",
    "",
    `- Scanner source files: ${scannerFingerprintChirho.fileCountChirho}`,
    `- Scanner source fingerprint: ${scannerFingerprintChirho.sha256Chirho}`,
    `- Span source files: ${spanFingerprintChirho.fileCountChirho}`,
    `- Span source fingerprint: ${spanFingerprintChirho.sha256Chirho}`,
    `- Lines scanned: ${resultChirho.lineCountChirho} (word-level coverage: ${resultChirho.wordCoveredLineCountChirho})`,
    `- Findings: ${resultChirho.findingsChirho.length} (high ${highChirho.length}, medium ${mediumChirho.length})`,
    `- Unwitnessed Hebrew spans (need on-demand CRNN read): ${resultChirho.unwitnessedHebrewSpansChirho.length}`,
    ...[...signalCountsChirho.entries()]
      .sort((aChirho, bChirho) => aChirho[0].localeCompare(bChirho[0]))
      .map(([signalChirho, countChirho]) => `- ${signalChirho}: ${countChirho}`),
    `- Machine triage JSON: ${inlineCodeChirho(relative(PROJECT_ROOT_CHIRHO, jsonPathChirho))}`,
    "",
    "## High Severity Findings",
    "",
  ];
  for (const findingChirho of highChirho) {
    linesChirho.push(...renderFindingSectionChirho(findingChirho, reportPathChirho));
  }
  linesChirho.push("## Medium Severity Findings", "");
  for (const findingChirho of mediumChirho) {
    linesChirho.push(...renderFindingSectionChirho(findingChirho, reportPathChirho));
  }
  return `${linesChirho.join("\n").replace(/\n+$/u, "")}\n`;
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const reportPathChirho = parseArgValueChirho(argsChirho, "out-chirho") ?? DEFAULT_REPORT_PATH_CHIRHO;
  const jsonPathChirho = parseArgValueChirho(argsChirho, "json-out-chirho") ?? DEFAULT_JSON_PATH_CHIRHO;
  const dbPathChirho = parseArgValueChirho(argsChirho, "db-chirho") ?? DEFAULT_DB_PATH_CHIRHO;
  const spanFingerprintChirho = sourceFingerprintForPathsChirho(scanSpanLinePathsChirho());
  const scannerFingerprintChirho = strictBlindScannerSourceFingerprintChirho(fileURLToPath(import.meta.url));
  const resultChirho = scanChirho(dbPathChirho);

  writeTextAtomicChirho(
    jsonPathChirho,
    `${JSON.stringify(
      {
        schemaVersionChirho: 1,
        moduleChirho: MODULE_CHIRHO,
        generatedAtChirho: new Date().toISOString(),
        scannerSourceFingerprintChirho: scannerFingerprintChirho.sha256Chirho,
        spanSourceFingerprintChirho: spanFingerprintChirho.sha256Chirho,
        findingsChirho: resultChirho.findingsChirho,
        unwitnessedHebrewSpansChirho: resultChirho.unwitnessedHebrewSpansChirho,
      },
      null,
      2
    )}\n`
  );
  writeTextAtomicChirho(
    reportPathChirho,
    renderReportChirho(resultChirho, reportPathChirho, jsonPathChirho, spanFingerprintChirho, scannerFingerprintChirho)
  );

  const highCountChirho = resultChirho.findingsChirho.filter(
    (findingChirho) => findingChirho.severityChirho === "high-chirho"
  ).length;
  console.log(
    `[${MODULE_CHIRHO}] findings=${resultChirho.findingsChirho.length} high=${highCountChirho} unwitnessedHebrew=${resultChirho.unwitnessedHebrewSpansChirho.length} report=${relative(PROJECT_ROOT_CHIRHO, reportPathChirho)} json=${relative(PROJECT_ROOT_CHIRHO, jsonPathChirho)}`
  );
  if (highCountChirho > 0) process.exitCode = 1;
}

if (import.meta.main) mainChirho();
