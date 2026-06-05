// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Read-only detector for strict-blind non-Latin residue.
 *
 * The Greek apparatus repairs proved that a line can pass structural export
 * while Greek or symbol text is hidden inside valid-looking French/symbol
 * spans. This script reports candidates for visual review only; it does not
 * certify text or mutate spans.
 */

import { readFileSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

import { writeTextAtomicChirho } from "../../src-chirho/atomic-json-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { renderSpanLineTextChirho } from "../../src-chirho/span-line-text-chirho.ts";
import { sourceFingerprintForPathsChirho, type SourceFingerprintChirho } from "../../src-chirho/source-fingerprint-chirho.ts";
import { scanSpanLinePathsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { strictBlindScannerSourceFingerprintChirho } from "../../src-chirho/strict-blind-scanner-source-fingerprint-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "find-nonlatin-residue-candidates-2026-06-04-chirho";
const DEFAULT_REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "nonlatin-residue-candidate-scan-2026-06-04-chirho.md"
);
const SCANLINES_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "scanlines-chirho");

const GREEK_CHAR_RE_CHIRHO = /[\u0370-\u03ff\u1f00-\u1fff]/u;
const HEBREW_CHAR_RE_CHIRHO = /[\u0590-\u05ff]/u;
const SYRIAC_CHAR_RE_CHIRHO = /[\u0700-\u074f]/u;
const ARABIC_CHAR_RE_CHIRHO = /[\u0600-\u06ff]/u;
const REVIEWABLE_TEXT_SCRIPT_SET_CHIRHO = new Set(["french-chirho", "latin-non-french-chirho", "latin-chirho", "symbol-chirho"]);
const NON_LATIN_SCRIPT_SET_CHIRHO = new Set(["hebrew-chirho", "greek-chirho", "syriac-chirho", "arabic-chirho"]);
const GREEK_APPARATUS_SIGLUM_TOKEN_RE_CHIRHO = /[ασε](?:[′'])?/gu;
const SYMBOL_APPARATUS_REMAINDER_RE_CHIRHO = /^[\s′'𝔐𝔊𝔙𝔖𝔗MGVST/,+:;().!"?{}\[\]-]*$/u;
const GREEK_APPARATUS_LABEL_RE_CHIRHO = /λέγει κύριος/u;
const APPARATUS_TARGET_RE_CHIRHO = /\.967\s+≠\s+\+/u;
const SHORT_GARBAGE_RE_CHIRHO = /^(?=.{2,14}$)(?=.*[0-9{}[\]£?+])[\p{L}0-9{}[\]£?+ "'”“.-]+$/u;
const BENIGN_SHORT_RE_CHIRHO =
  /^(?:\d{1,2}|\d{1,2}\.|\d{1,2}\s+lire|\d+\s+vocalisent|\d+\s+donne|[A-Z]|\{[A-Z]\}|\[[A-Z]\]|\[R\]NEB lit|Cpl|Cpl et rel\.\[\d+\]|rel\.\[\d+\]|\+\s+rel\.\[\d+\]|vel|et|du vs \d{1,2} par|en\s+\d+\s+par|et en\s+\d+\s+par|et la \d+\s+e par|à la \d+e forme|\+|≠)$/u;
const DELIMITER_RE_CHIRHO = /[()[\]{}]/u;

interface SpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho?: number;
  widthPxChirho?: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
}

interface SpanLineChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  spansChirho: SpanChirho[];
}

interface SuspiciousSpanChirho {
  segmentIndexChirho: number;
  scriptChirho: string;
  textChirho: string;
  reasonsChirho: string[];
  leftScriptChirho: string | null;
  rightScriptChirho: string | null;
}

interface CandidateChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  scoreChirho: number;
  priorityChirho: "high-chirho" | "medium-chirho" | "low-chirho";
  reasonsChirho: string[];
  lineTextChirho: string;
  spanPathChirho: string;
  scanlinePathChirho: string;
  suspiciousSpansChirho: SuspiciousSpanChirho[];
}

function readSpanLineChirho(pathChirho: string): SpanLineChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as SpanLineChirho;
}

function orderedSpansChirho(lineChirho: SpanLineChirho): SpanChirho[] {
  return [...lineChirho.spansChirho].sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho);
}

function lineIdentityKeyChirho(volumeChirho: number, pageChirho: number, lineIndexChirho: number): string {
  return `${volumeChirho}:${pageChirho}:${lineIndexChirho}`;
}

function compactTextChirho(textChirho: string): string {
  return normalizeTextForStorageChirho(textChirho).replace(/\s+/g, " ").trim();
}

function isStandaloneGreekApparatusSiglumSymbolChirho(textChirho: string): boolean {
  if (!GREEK_CHAR_RE_CHIRHO.test(textChirho)) return false;
  const strippedTextChirho = textChirho.replace(GREEK_APPARATUS_SIGLUM_TOKEN_RE_CHIRHO, "");
  return (
    !GREEK_CHAR_RE_CHIRHO.test(strippedTextChirho) &&
    !HEBREW_CHAR_RE_CHIRHO.test(strippedTextChirho) &&
    !SYRIAC_CHAR_RE_CHIRHO.test(strippedTextChirho) &&
    !ARABIC_CHAR_RE_CHIRHO.test(strippedTextChirho) &&
    SYMBOL_APPARATUS_REMAINDER_RE_CHIRHO.test(strippedTextChirho)
  );
}

function lineTextChirho(lineChirho: SpanLineChirho): string {
  return renderSpanLineTextChirho(lineChirho, { normalizeTextChirho: normalizeTextForStorageChirho });
}

function scanlinePathChirho(lineChirho: SpanLineChirho): string {
  return join(
    SCANLINES_ROOT_CHIRHO,
    `vol-${lineChirho.volumeChirho}-chirho`,
    `page-${String(lineChirho.pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(lineChirho.lineIndexChirho).padStart(3, "0")}-chirho.png`
  );
}

function hasNonLatinNeighborChirho(spansChirho: SpanChirho[], indexChirho: number): boolean {
  const leftChirho = spansChirho[indexChirho - 1];
  const rightChirho = spansChirho[indexChirho + 1];
  return [leftChirho, rightChirho].some((spanChirho) => spanChirho !== undefined && NON_LATIN_SCRIPT_SET_CHIRHO.has(spanChirho.scriptChirho));
}

function delimiterCountsChirho(textChirho: string): { roundOpenChirho: number; roundCloseChirho: number } {
  return {
    roundOpenChirho: [...textChirho.matchAll(/\(/g)].length,
    roundCloseChirho: [...textChirho.matchAll(/\)/g)].length,
  };
}

function delimiterBalanceChirho(textChirho: string): number {
  const countsChirho = delimiterCountsChirho(textChirho);
  return countsChirho.roundOpenChirho - countsChirho.roundCloseChirho;
}

function nonHebrewOpenDelimiterUnbalancedChirho(spanChirho: SpanChirho, spansChirho: SpanChirho[], indexChirho: number): boolean {
  if (spanChirho.scriptChirho === "hebrew-chirho" || !NON_LATIN_SCRIPT_SET_CHIRHO.has(spanChirho.scriptChirho)) return false;
  if (!DELIMITER_RE_CHIRHO.test(spanChirho.utf8TextChirho)) return false;
  const spanCountsChirho = delimiterCountsChirho(spanChirho.utf8TextChirho);
  if (spanCountsChirho.roundOpenChirho <= spanCountsChirho.roundCloseChirho) return false;
  const suffixTextChirho = spansChirho
    .slice(indexChirho)
    .map((suffixSpanChirho) => suffixSpanChirho.utf8TextChirho)
    .join(" ");
  const suffixCountsChirho = delimiterCountsChirho(suffixTextChirho);
  return suffixCountsChirho.roundOpenChirho > suffixCountsChirho.roundCloseChirho;
}

function nonHebrewCloseDelimiterUnbalancedChirho(
  spanChirho: SpanChirho,
  spansChirho: SpanChirho[],
  indexChirho: number,
  previousLineTextChirho: string | null
): boolean {
  if (spanChirho.scriptChirho === "hebrew-chirho" || !NON_LATIN_SCRIPT_SET_CHIRHO.has(spanChirho.scriptChirho)) return false;
  if (!DELIMITER_RE_CHIRHO.test(spanChirho.utf8TextChirho)) return false;
  const previousLineBalanceChirho = Math.max(0, delimiterBalanceChirho(previousLineTextChirho ?? ""));
  const sameLinePrefixTextChirho = spansChirho
    .slice(0, indexChirho)
    .map((prefixSpanChirho) => prefixSpanChirho.utf8TextChirho)
    .join(" ");
  const sameLinePrefixBalanceChirho = Math.max(0, delimiterBalanceChirho(sameLinePrefixTextChirho));
  let balanceChirho = previousLineBalanceChirho + sameLinePrefixBalanceChirho;
  for (const charChirho of spanChirho.utf8TextChirho) {
    if (charChirho === "(") {
      balanceChirho += 1;
    } else if (charChirho === ")") {
      if (balanceChirho === 0) return true;
      balanceChirho -= 1;
    }
  }
  return false;
}

function wrongScriptReasonsChirho(spanChirho: SpanChirho): string[] {
  const textChirho = compactTextChirho(spanChirho.utf8TextChirho);
  const reasonsChirho: string[] = [];
  if (!REVIEWABLE_TEXT_SCRIPT_SET_CHIRHO.has(spanChirho.scriptChirho)) return reasonsChirho;
  if (spanChirho.scriptChirho !== "greek-chirho" && GREEK_CHAR_RE_CHIRHO.test(textChirho)) reasonsChirho.push("greek-chars-in-non-greek-span-chirho");
  if (spanChirho.scriptChirho !== "hebrew-chirho" && HEBREW_CHAR_RE_CHIRHO.test(textChirho)) reasonsChirho.push("hebrew-chars-in-non-hebrew-span-chirho");
  if (spanChirho.scriptChirho !== "syriac-chirho" && SYRIAC_CHAR_RE_CHIRHO.test(textChirho)) reasonsChirho.push("syriac-chars-in-non-syriac-span-chirho");
  if (spanChirho.scriptChirho !== "arabic-chirho" && ARABIC_CHAR_RE_CHIRHO.test(textChirho)) reasonsChirho.push("arabic-chars-in-non-arabic-span-chirho");
  if (reasonsChirho.length > 0 && spanChirho.scriptChirho === "symbol-chirho" && isStandaloneGreekApparatusSiglumSymbolChirho(textChirho)) return [];
  return reasonsChirho;
}

function spanReasonsChirho(spanChirho: SpanChirho, spansChirho: SpanChirho[], indexChirho: number, previousLineTextChirho: string | null): string[] {
  const textChirho = compactTextChirho(spanChirho.utf8TextChirho);
  const reasonsChirho = wrongScriptReasonsChirho(spanChirho);
  if (
    REVIEWABLE_TEXT_SCRIPT_SET_CHIRHO.has(spanChirho.scriptChirho) &&
    hasNonLatinNeighborChirho(spansChirho, indexChirho) &&
    SHORT_GARBAGE_RE_CHIRHO.test(textChirho) &&
    !BENIGN_SHORT_RE_CHIRHO.test(textChirho)
  ) {
    reasonsChirho.push("short-garble-near-nonlatin-chirho");
  }
  if (nonHebrewOpenDelimiterUnbalancedChirho(spanChirho, spansChirho, indexChirho)) {
    reasonsChirho.push("non-hebrew-open-delimiter-unbalanced-chirho");
  }
  if (nonHebrewCloseDelimiterUnbalancedChirho(spanChirho, spansChirho, indexChirho, previousLineTextChirho)) {
    reasonsChirho.push("non-hebrew-close-delimiter-unbalanced-chirho");
  }
  return [...new Set(reasonsChirho)];
}

function lineReasonsChirho(lineTextValueChirho: string): string[] {
  const reasonsChirho: string[] = [];
  if (GREEK_APPARATUS_LABEL_RE_CHIRHO.test(lineTextValueChirho) && !APPARATUS_TARGET_RE_CHIRHO.test(lineTextValueChirho) && /Cpl et rel\.\[[1-8]\]/u.test(lineTextValueChirho)) {
    reasonsChirho.push("greek-apparatus-line-without-dot967-chirho");
  }
  return reasonsChirho;
}

function scoreCandidateChirho(lineReasonsValueChirho: string[], suspiciousSpansChirho: SuspiciousSpanChirho[]): { scoreChirho: number; reasonsChirho: string[] } {
  let scoreChirho = 0;
  const reasonsChirho: string[] = [];
  if (lineReasonsValueChirho.includes("greek-apparatus-line-without-dot967-chirho")) {
    scoreChirho += 7;
    reasonsChirho.push("line-greek-apparatus-without-dot967-chirho");
  }
  for (const spanChirho of suspiciousSpansChirho) {
    if (spanChirho.reasonsChirho.some((reasonChirho) => reasonChirho.startsWith("greek-chars-in-non-greek"))) scoreChirho += 3;
    if (spanChirho.reasonsChirho.some((reasonChirho) => reasonChirho.startsWith("hebrew-chars-in-non-hebrew"))) scoreChirho += 3;
    if (spanChirho.reasonsChirho.some((reasonChirho) => reasonChirho.startsWith("syriac-chars-in-non-syriac"))) scoreChirho += 4;
    if (spanChirho.reasonsChirho.some((reasonChirho) => reasonChirho.startsWith("arabic-chars-in-non-arabic"))) scoreChirho += 4;
    if (spanChirho.reasonsChirho.includes("short-garble-near-nonlatin-chirho")) scoreChirho += 4;
    if (spanChirho.reasonsChirho.includes("non-hebrew-open-delimiter-unbalanced-chirho")) scoreChirho += 6;
    if (spanChirho.reasonsChirho.includes("non-hebrew-close-delimiter-unbalanced-chirho")) scoreChirho += 6;
  }
  if (suspiciousSpansChirho.length > 0) reasonsChirho.push("line-has-suspicious-span-chirho");
  scoreChirho += Math.min(3, suspiciousSpansChirho.length);
  return { scoreChirho, reasonsChirho: [...new Set([...reasonsChirho, ...lineReasonsValueChirho])] };
}

function priorityForScoreChirho(scoreChirho: number): CandidateChirho["priorityChirho"] {
  if (scoreChirho >= 8) return "high-chirho";
  if (scoreChirho >= 5) return "medium-chirho";
  return "low-chirho";
}

function candidateForLineChirho(pathChirho: string, previousLineTextChirho: string | null): CandidateChirho | null {
  const lineChirho = readSpanLineChirho(pathChirho);
  const spansChirho = orderedSpansChirho(lineChirho);
  const lineTextValueChirho = lineTextChirho(lineChirho);
  const lineReasonsValueChirho = lineReasonsChirho(lineTextValueChirho);
  const suspiciousSpansChirho = spansChirho
    .map((spanChirho, indexChirho): SuspiciousSpanChirho | null => {
      const reasonsChirho = spanReasonsChirho(spanChirho, spansChirho, indexChirho, previousLineTextChirho);
      if (reasonsChirho.length === 0) return null;
      return {
        segmentIndexChirho: spanChirho.segmentIndexChirho,
        scriptChirho: spanChirho.scriptChirho,
        textChirho: compactTextChirho(spanChirho.utf8TextChirho),
        reasonsChirho,
        leftScriptChirho: spansChirho[indexChirho - 1]?.scriptChirho ?? null,
        rightScriptChirho: spansChirho[indexChirho + 1]?.scriptChirho ?? null,
      };
    })
    .filter((spanChirho): spanChirho is SuspiciousSpanChirho => spanChirho !== null);
  if (lineReasonsValueChirho.length === 0 && suspiciousSpansChirho.length === 0) return null;
  const scoredChirho = scoreCandidateChirho(lineReasonsValueChirho, suspiciousSpansChirho);
  if (scoredChirho.scoreChirho < 3) return null;
  return {
    volumeChirho: lineChirho.volumeChirho,
    pageChirho: lineChirho.pageChirho,
    lineIndexChirho: lineChirho.lineIndexChirho,
    scoreChirho: scoredChirho.scoreChirho,
    priorityChirho: priorityForScoreChirho(scoredChirho.scoreChirho),
    reasonsChirho: scoredChirho.reasonsChirho,
    lineTextChirho: lineTextValueChirho,
    spanPathChirho: pathChirho,
    scanlinePathChirho: scanlinePathChirho(lineChirho),
    suspiciousSpansChirho,
  };
}

function markdownEscapeChirho(textChirho: string): string {
  return textChirho.replace(/`/g, "\\`");
}

function inlineCodeChirho(textChirho: string): string {
  return `\`${markdownEscapeChirho(textChirho)}\``;
}

function relativePathChirho(pathChirho: string): string {
  return relative(PROJECT_ROOT_CHIRHO, pathChirho);
}

function markdownImagePathChirho(reportPathChirho: string, imagePathChirho: string): string {
  return relative(dirname(reportPathChirho), imagePathChirho).replaceAll("\\", "/");
}

function renderReportChirho(
  candidatesChirho: CandidateChirho[],
  reportPathChirho: string,
  spanSourceFingerprintChirho: SourceFingerprintChirho,
  scannerSourceFingerprintChirho: SourceFingerprintChirho
): string {
  const priorityCountsChirho = candidatesChirho.reduce<Record<string, number>>((countsChirho, candidateChirho) => {
    countsChirho[candidateChirho.priorityChirho] = (countsChirho[candidateChirho.priorityChirho] ?? 0) + 1;
    return countsChirho;
  }, {});
  const linesChirho: string[] = [
    "<!-- For God so loved the world that he gave his only begotten Son,",
    "that whoever believes in him should not perish but have eternal life. John 3:16 -->",
    "",
    "# Non-Latin Residue Candidate Scan Chirho",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This is a machine-assisted review queue, not a certification result. It flags possible strict-blind Greek, Hebrew, Syriac, Arabic, apparatus residue, or context-unbalanced non-Hebrew delimiter punctuation inside spans whose current script label may hide the issue. Every item still needs visual review against the scanline before any span repair.",
    "",
    "Standalone Greek recension sigla inside symbol spans are handled by the Latin/symbol proofing lane and are intentionally excluded here; Greek words or Hebrew/Syriac/Arabic residue in the wrong script remain reportable.",
    "",
    "## Summary",
    "",
    `- Scanner source files: ${scannerSourceFingerprintChirho.fileCountChirho}`,
    `- Scanner source fingerprint: ${scannerSourceFingerprintChirho.sha256Chirho}`,
    `- Span source files: ${spanSourceFingerprintChirho.fileCountChirho}`,
    `- Span source fingerprint: ${spanSourceFingerprintChirho.sha256Chirho}`,
    `- Candidate lines: ${candidatesChirho.length}`,
    `- High priority: ${priorityCountsChirho["high-chirho"] ?? 0}`,
    `- Medium priority: ${priorityCountsChirho["medium-chirho"] ?? 0}`,
    `- Low priority included: ${priorityCountsChirho["low-chirho"] ?? 0}`,
    "",
    "## Candidates",
    "",
  ];
  for (const candidateChirho of candidatesChirho) {
    linesChirho.push(
      `### ${candidateChirho.priorityChirho} score ${candidateChirho.scoreChirho}: vol ${candidateChirho.volumeChirho} p${String(candidateChirho.pageChirho).padStart(4, "0")} L${String(candidateChirho.lineIndexChirho).padStart(3, "0")}`,
      "",
      `- Reasons: ${candidateChirho.reasonsChirho.map(inlineCodeChirho).join(", ")}`,
      `- Span file: ${inlineCodeChirho(relativePathChirho(candidateChirho.spanPathChirho))}`,
      `- Scanline: ${inlineCodeChirho(relativePathChirho(candidateChirho.scanlinePathChirho))}`,
      `![scanline](${markdownImagePathChirho(reportPathChirho, candidateChirho.scanlinePathChirho)})`,
      `- Line text: ${inlineCodeChirho(candidateChirho.lineTextChirho)}`,
      "- Suspicious spans:",
      ...candidateChirho.suspiciousSpansChirho.map(
        (spanChirho) =>
          `  - S${spanChirho.segmentIndexChirho} ${spanChirho.scriptChirho}: ${inlineCodeChirho(spanChirho.textChirho)} (${spanChirho.reasonsChirho.join(", ")}; neighbors ${spanChirho.leftScriptChirho ?? "none"} / ${spanChirho.rightScriptChirho ?? "none"})`
      ),
      ""
    );
  }
  return `${linesChirho.join("\n").replace(/\n+$/u, "")}\n`;
}

function mainChirho(): void {
  const reportPathArgChirho = process.argv.find((argChirho) => argChirho.startsWith("--out-chirho="));
  const reportPathChirho = reportPathArgChirho?.slice("--out-chirho=".length) ?? DEFAULT_REPORT_PATH_CHIRHO;
  const spanLinePathsChirho = scanSpanLinePathsChirho();
  const spanSourceFingerprintChirho = sourceFingerprintForPathsChirho(spanLinePathsChirho);
  const scannerSourceFingerprintChirho = strictBlindScannerSourceFingerprintChirho(fileURLToPath(import.meta.url));
  const lineEntriesChirho = spanLinePathsChirho.map((pathChirho) => {
    const lineChirho = readSpanLineChirho(pathChirho);
    return { pathChirho, lineChirho, lineTextValueChirho: lineTextChirho(lineChirho) };
  });
  const lineTextByPathChirho = new Map(lineEntriesChirho.map((entryChirho) => [entryChirho.pathChirho, entryChirho.lineTextValueChirho]));
  const linePathByIdentityChirho = new Map(
    lineEntriesChirho.map((entryChirho) => [
      lineIdentityKeyChirho(entryChirho.lineChirho.volumeChirho, entryChirho.lineChirho.pageChirho, entryChirho.lineChirho.lineIndexChirho),
      entryChirho.pathChirho,
    ])
  );
  const candidatesChirho = lineEntriesChirho
    .map((entryChirho) => {
      const previousLinePathChirho = linePathByIdentityChirho.get(
        lineIdentityKeyChirho(entryChirho.lineChirho.volumeChirho, entryChirho.lineChirho.pageChirho, entryChirho.lineChirho.lineIndexChirho - 1)
      );
      return candidateForLineChirho(entryChirho.pathChirho, previousLinePathChirho === undefined ? null : lineTextByPathChirho.get(previousLinePathChirho) ?? null);
    })
    .filter((candidateChirho): candidateChirho is CandidateChirho => candidateChirho !== null)
    .sort((aChirho, bChirho) => {
      if (bChirho.scoreChirho !== aChirho.scoreChirho) return bChirho.scoreChirho - aChirho.scoreChirho;
      if (aChirho.volumeChirho !== bChirho.volumeChirho) return aChirho.volumeChirho - bChirho.volumeChirho;
      if (aChirho.pageChirho !== bChirho.pageChirho) return aChirho.pageChirho - bChirho.pageChirho;
      return aChirho.lineIndexChirho - bChirho.lineIndexChirho;
    });
  writeTextAtomicChirho(
    reportPathChirho,
    renderReportChirho(candidatesChirho, reportPathChirho, spanSourceFingerprintChirho, scannerSourceFingerprintChirho)
  );
  console.log(
    JSON.stringify(
      {
        moduleChirho: MODULE_CHIRHO,
        reportPathChirho: relativePathChirho(reportPathChirho),
        scannerSourceFileCountChirho: scannerSourceFingerprintChirho.fileCountChirho,
        scannerSourceFingerprintChirho: scannerSourceFingerprintChirho.sha256Chirho,
        spanSourceFileCountChirho: spanSourceFingerprintChirho.fileCountChirho,
        spanSourceFingerprintChirho: spanSourceFingerprintChirho.sha256Chirho,
        candidateCountChirho: candidatesChirho.length,
        highPriorityCountChirho: candidatesChirho.filter((candidateChirho) => candidateChirho.priorityChirho === "high-chirho").length,
        mediumPriorityCountChirho: candidatesChirho.filter((candidateChirho) => candidateChirho.priorityChirho === "medium-chirho").length,
        lowPriorityCountChirho: candidatesChirho.filter((candidateChirho) => candidateChirho.priorityChirho === "low-chirho").length,
      },
      null,
      2
    )
  );
}

mainChirho();
