// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { join } from "path";
import { PDF_DIR_CHIRHO, VOLUMES_CHIRHO } from "./config-chirho.ts";
import { runCmdChirho, logChirho, decodeHtmlEntitiesChirho } from "./utils-chirho.ts";
import type { BboxWordChirho, BboxLineChirho } from "./types-chirho.ts";

const MODULE_CHIRHO = "extract-text-chirho";

/** Get the full path to a volume's PDF */
export function pdfPathChirho(volumeNumberChirho: number): string {
  const volumeChirho = VOLUMES_CHIRHO[volumeNumberChirho];
  if (!volumeChirho) {
    throw new Error(`Unknown volume number: ${volumeNumberChirho}`);
  }
  return join(PDF_DIR_CHIRHO, volumeChirho.fileNameChirho);
}

/** Extract plain text from a single page using pdftotext */
export async function extractPlainTextChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<string> {
  const pdfChirho = pdfPathChirho(volumeNumberChirho);
  const pageStrChirho = String(pageNumberChirho);

  logChirho(MODULE_CHIRHO, `Extracting plain text: vol ${volumeNumberChirho} page ${pageNumberChirho}`);

  const textChirho = await runCmdChirho([
    "pdftotext",
    "-f", pageStrChirho,
    "-l", pageStrChirho,
    "-layout",
    pdfChirho,
    "-",
  ]);

  return textChirho;
}

/** Extract bbox HTML from a single page using pdftotext -bbox-layout */
export async function extractBboxHtmlChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<string> {
  const pdfChirho = pdfPathChirho(volumeNumberChirho);
  const pageStrChirho = String(pageNumberChirho);

  logChirho(MODULE_CHIRHO, `Extracting bbox HTML: vol ${volumeNumberChirho} page ${pageNumberChirho}`);

  const htmlChirho = await runCmdChirho([
    "pdftotext",
    "-f", pageStrChirho,
    "-l", pageStrChirho,
    "-bbox-layout",
    pdfChirho,
    "-",
  ]);

  return htmlChirho;
}

/** Parse bbox HTML into structured word data with bounding boxes */
export function parseBboxHtmlChirho(htmlChirho: string): {
  pageWidthChirho: number;
  pageHeightChirho: number;
  linesChirho: BboxLineChirho[];
} {
  const pageMatchChirho = htmlChirho.match(
    /<page\s+width="([^"]+)"\s+height="([^"]+)"/
  );
  const pageWidthChirho = pageMatchChirho ? parseFloat(pageMatchChirho[1]!) : 595;
  const pageHeightChirho = pageMatchChirho ? parseFloat(pageMatchChirho[2]!) : 842;

  const linesChirho: BboxLineChirho[] = [];

  const lineRegexChirho =
    /<line\s+xMin="([^"]+)"\s+yMin="([^"]+)"\s+xMax="([^"]+)"\s+yMax="([^"]+)">([\s\S]*?)<\/line>/g;
  let lineMatchChirho: RegExpExecArray | null;

  while ((lineMatchChirho = lineRegexChirho.exec(htmlChirho)) !== null) {
    const lineXMinChirho = parseFloat(lineMatchChirho[1]!);
    const lineYMinChirho = parseFloat(lineMatchChirho[2]!);
    const lineXMaxChirho = parseFloat(lineMatchChirho[3]!);
    const lineYMaxChirho = parseFloat(lineMatchChirho[4]!);
    const lineContentChirho = lineMatchChirho[5]!;

    const wordsChirho: BboxWordChirho[] = [];
    const wordRegexChirho =
      /<word\s+xMin="([^"]+)"\s+yMin="([^"]+)"\s+xMax="([^"]+)"\s+yMax="([^"]+)">([^<]*)<\/word>/g;
    let wordMatchChirho: RegExpExecArray | null;

    while ((wordMatchChirho = wordRegexChirho.exec(lineContentChirho)) !== null) {
      const rawTextChirho = decodeHtmlEntitiesChirho(wordMatchChirho[5]!);
      const scoreChirho = computeGarbledScoreChirho(rawTextChirho);

      wordsChirho.push({
        textChirho: rawTextChirho,
        xMinChirho: parseFloat(wordMatchChirho[1]!),
        yMinChirho: parseFloat(wordMatchChirho[2]!),
        xMaxChirho: parseFloat(wordMatchChirho[3]!),
        yMaxChirho: parseFloat(wordMatchChirho[4]!),
        isGarbledChirho: scoreChirho >= 0.4,
        garbledScoreChirho: scoreChirho,
      });
    }

    if (wordsChirho.length > 0) {
      linesChirho.push({
        xMinChirho: lineXMinChirho,
        yMinChirho: lineYMinChirho,
        xMaxChirho: lineXMaxChirho,
        yMaxChirho: lineYMaxChirho,
        wordsChirho,
      });
    }
  }

  return { pageWidthChirho, pageHeightChirho, linesChirho };
}

/**
 * Compute a "garbled score" for a word.
 * Higher = more likely to be garbled non-French text from broken font mappings.
 *
 * French text uses: a-zA-Z with accents, digits, common punctuation
 * Garbled Hebrew/Greek has: $%#@+=, single chars, dense special sequences,
 * and also ASCII chars from broken font mappings (Hebrew ב → B, ק → q, etc.)
 */
export function computeGarbledScoreChirho(textChirho: string): number {
  if (textChirho.length === 0) return 0;

  const frenchSafeRegexChirho =
    /[a-zA-ZÀ-ÖØ-öø-ÿ0-9.,;:!?'"()\-\/\s«»–—…°·]/;

  let nonFrenchCountChirho = 0;

  for (const charChirho of textChirho) {
    if (!frenchSafeRegexChirho.test(charChirho)) {
      nonFrenchCountChirho++;
    }
  }

  const ratioChirho = nonFrenchCountChirho / textChirho.length;

  // Single and double char words with any special content are very likely garbled
  if (textChirho.length <= 2 && ratioChirho > 0) {
    return Math.min(ratioChirho + 0.3, 1.0);
  }

  // Garbled patterns — boost score when detected
  const strongGarbledPatternsChirho = [
    /[%$#@+=<>\\|~^]{2,}/,           // Dense special char sequences
    /\d[A-Z][%$#]/,                   // Digit-uppercase-special
    /[A-Z][0-9][A-Z]/,               // Uppercase-digit-uppercase (like O5H)
    /^[A-Z]\d+$/,                     // Single uppercase + digits (like B8)
    /^[A-Z]{1,2}\d$/,                // 1-2 uppercase + digit (like FG$, O5H)
    /[)(\[\]]{2,}/,                   // Multiple brackets
    /^[#$%&*+<>=]+$/,                // All special chars
    /^'[#$%A-Z]/,                     // Quote followed by special/upper
    /[%$#][A-Z][%$#]/,               // Special-upper-special
    /^\d[A-Z]{2}/,                    // Digit followed by 2+ uppercase
  ];

  for (const patternChirho of strongGarbledPatternsChirho) {
    if (patternChirho.test(textChirho)) {
      return Math.min(ratioChirho + 0.25, 1.0);
    }
  }

  // Weaker patterns — moderate boost
  const weakGarbledPatternsChirho = [
    /^[A-Z]\d[A-Z]$/,                // Exactly uppercase-digit-uppercase
    /^[A-Z]{1,3}$/,                   // Very short all-uppercase (if not common French abbrev)
    /\)\d/,                           // Close paren + digit
    /\d\(/,                           // Digit + open paren
    /^[=+\-]?[A-Z][)(]/,             // Prefix + uppercase + bracket
    /[A-Z]{2}\d/,                     // Two uppercase + digit
    /\d[A-Z]{2}/,                     // Digit + two uppercase
  ];

  for (const patternChirho of weakGarbledPatternsChirho) {
    if (patternChirho.test(textChirho)) {
      // Only boost short non-French-looking words
      if (textChirho.length <= 6) {
        return Math.min(ratioChirho + 0.15, 1.0);
      }
    }
  }

  return ratioChirho;
}

/** CLI: test extraction on a single page */
if (import.meta.main) {
  const volChirho = parseInt(process.argv[2] ?? "5", 10);
  const pageChirho = parseInt(process.argv[3] ?? "50", 10);

  console.log(`=== Plain text for vol ${volChirho} page ${pageChirho} ===`);
  const textChirho = await extractPlainTextChirho(volChirho, pageChirho);
  console.log(textChirho.slice(0, 500));

  console.log(`\n=== Bbox parsing for vol ${volChirho} page ${pageChirho} ===`);
  const bboxHtmlChirho = await extractBboxHtmlChirho(volChirho, pageChirho);
  const parsedChirho = parseBboxHtmlChirho(bboxHtmlChirho);
  console.log(`Page: ${parsedChirho.pageWidthChirho}x${parsedChirho.pageHeightChirho}`);
  console.log(`Lines: ${parsedChirho.linesChirho.length}`);

  let garbledCountChirho = 0;
  let totalWordCountChirho = 0;
  for (const lineChirho of parsedChirho.linesChirho) {
    for (const wordChirho of lineChirho.wordsChirho) {
      totalWordCountChirho++;
      if (wordChirho.isGarbledChirho) {
        garbledCountChirho++;
      }
    }
  }
  console.log(
    `Words: ${totalWordCountChirho} total, ${garbledCountChirho} garbled (${((garbledCountChirho / totalWordCountChirho) * 100).toFixed(1)}%)`
  );

  console.log("\n=== Sample garbled words ===");
  let shownChirho = 0;
  for (const lineChirho of parsedChirho.linesChirho) {
    for (const wordChirho of lineChirho.wordsChirho) {
      if (wordChirho.isGarbledChirho && shownChirho < 20) {
        console.log(
          `  "${wordChirho.textChirho}" score=${wordChirho.garbledScoreChirho.toFixed(2)} @ (${wordChirho.xMinChirho.toFixed(0)},${wordChirho.yMinChirho.toFixed(0)})-(${wordChirho.xMaxChirho.toFixed(0)},${wordChirho.yMaxChirho.toFixed(0)})`
        );
        shownChirho++;
      }
    }
  }
}
