// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Read-only detector for strict-blind Hebrew defects.
 *
 * The vol4 p151 repair proved that a line can pass structural strict export
 * while printed Hebrew has been OCR'd as ordinary French/digit garbage. This
 * script scans the current span tree for similar review candidates and writes
 * a non-certifying markdown report.
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { renderSpanLineTextChirho } from "../../src-chirho/span-line-text-chirho.ts";
import { sourceFingerprintForPathsChirho, type SourceFingerprintChirho } from "../../src-chirho/source-fingerprint-chirho.ts";
import { scanSpanLinePathsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { strictBlindScannerSourceFingerprintChirho } from "../../src-chirho/strict-blind-scanner-source-fingerprint-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "find-hidden-hebrew-candidates-2026-06-04-chirho";
const DEFAULT_REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "hidden-hebrew-candidate-scan-2026-06-04-chirho.md"
);
const SCANLINES_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "scanlines-chirho");
const REVIEWABLE_SCRIPT_SET_CHIRHO = new Set(["french-chirho", "latin-non-french-chirho", "symbol-chirho"]);
const HEBREW_CHAR_RE_CHIRHO = /[\u0590-\u05ff]/u;
const HEBREW_SCRIPT_RE_CHIRHO = /^hebrew-chirho$/;
const DIGIT_CLUSTER_RE_CHIRHO = /(?:^|[\s([{])(?:[A-Za-z]?\d{3,}[A-Za-z]?|\d{2,}[}?][A-Za-z0-9]?|[+*#]\s*\d{2,}|[}\]]\s*\d{2,})(?=$|[\s,.;:)\]}])/u;
const SYMBOL_DIGIT_RE_CHIRHO = /(?:[+*#]\s*\d+|\d+\s*[}?]|\}\s*\d+)/u;
const DIGIT_CLUSTER_SCAN_RE_CHIRHO = new RegExp(DIGIT_CLUSTER_RE_CHIRHO.source, "gu");
const SYMBOL_DIGIT_SCAN_RE_CHIRHO = new RegExp(SYMBOL_DIGIT_RE_CHIRHO.source, "gu");
const ORDINAL_GARBAGE_RE_CHIRHO = /(?:^|[\s([{])["“”']?[nN][°º]\d+/u;
const REPEATED_UPPER_GARBAGE_RE_CHIRHO = /(?:^|[\s([{])["“”']?[A-Z]\.?\s+["“”']?[A-Z]{2}(?=$|[\s,.;:)])/u;
const APPARATUS_WITNESS_LIST_RE_CHIRHO =
  /^(?:\s|[:/()[\]{}.,-]|[A-Z]{1,3}|[mgvst]+|MT|MV|VT|ST|VS|GS|Sym|Hev|1Q-[A-Za-z]|4Q-[A-Za-z]|spont|plur|schem|assim|ctext|clav|abr-elus|usu|et|\d{1,2}[A-Za-z]?)+$/u;
const SHORT_LATIN_SYMBOL_GARBAGE_RE_CHIRHO = /^(?=.{2,12}$)(?=.*[A-Za-z])(?=.*[{}\[\]£?])[A-Za-z0-9{}\[\]£?]+$/u;
const SHORT_BRACKET_DIGIT_GARBAGE_RE_CHIRHO = /^(?:\d[\]}]|\d{1,2}[A-Za-z]?)$/u;
const BRACKETED_SINGLE_CAPITAL_SIGLUM_RE_CHIRHO = /^[{\[][A-Z][}\]]$/u;
const SCRIPTURE_REF_RE_CHIRHO =
  /\b(?:Gn|Ex|Lv|Nb|Dt|Jos|Jg|1\s*S|2\s*S|1\s*R|2\s*R|Is|Jr|Ez|Éz|Ha|Hab|Za|Zach?|Ps|Jb|Job|Qo|Pr)\s*\d/u;
const BENIGN_NUMERIC_CONTEXT_RE_CHIRHO =
  /(?:\b(?:BH|BHS|BH3|BH23|CT\d*|ms|mss|Mss|Opuscules|Syntax|Frensdorff|Esteban|Erub|Hev|J\d{2,3}|Luma|Cpl|rel|BL|Add|Vat|ebr|London|Cortona|XII|XIII|XIV)\b|Kit[aâ]b\s*,?\s*\d+|ḤAYYUJ|Herméneutique|Qumr[aä]n|QMelchisédec|Würzburg|\b(?:Gn|Ex|Lv|Nb|Dt|Jos|Jg|1\s*S|2\s*S|1\s*R|2\s*R|Is|Jr|Ez|Éz|Ha|Hab|Za|Zach?|Ps|Jb|Job|Qo|Pr)\s*\d+\s*[,.:]\s*\d+|\b(?:dat[eé]|copi[eé]|espagnol)\b.{0,20}\d{3,4})/u;

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

function scanlinePathChirho(lineChirho: SpanLineChirho): string {
  return join(
    SCANLINES_ROOT_CHIRHO,
    `vol-${lineChirho.volumeChirho}-chirho`,
    `page-${String(lineChirho.pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(lineChirho.lineIndexChirho).padStart(3, "0")}-chirho.png`
  );
}

function readSpanLineChirho(pathChirho: string): SpanLineChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as SpanLineChirho;
}

function orderedSpansChirho(lineChirho: SpanLineChirho): SpanChirho[] {
  return [...lineChirho.spansChirho].sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho);
}

function lineTextChirho(lineChirho: SpanLineChirho): string {
  return renderSpanLineTextChirho(lineChirho, { normalizeTextChirho: normalizeTextForStorageChirho });
}

function hasHebrewSpanChirho(lineChirho: SpanLineChirho): boolean {
  return lineChirho.spansChirho.some(
    (spanChirho) => HEBREW_SCRIPT_RE_CHIRHO.test(spanChirho.scriptChirho) || HEBREW_CHAR_RE_CHIRHO.test(spanChirho.utf8TextChirho)
  );
}

function isAdjacentToHebrewChirho(spansChirho: SpanChirho[], indexChirho: number): boolean {
  const leftChirho = spansChirho[indexChirho - 1];
  const rightChirho = spansChirho[indexChirho + 1];
  return [leftChirho, rightChirho].some(
    (spanChirho) => spanChirho !== undefined && (HEBREW_SCRIPT_RE_CHIRHO.test(spanChirho.scriptChirho) || HEBREW_CHAR_RE_CHIRHO.test(spanChirho.utf8TextChirho))
  );
}

function compactTextChirho(textChirho: string): string {
  return normalizeTextForStorageChirho(textChirho).replace(/\s+/g, " ").trim();
}

function hasNonBenignNumericMatchChirho(
  textChirho: string,
  patternChirho: RegExp,
  contextTextChirho = textChirho,
  contextStartOffsetChirho = 0
): boolean {
  patternChirho.lastIndex = 0;
  for (const matchChirho of textChirho.matchAll(patternChirho)) {
    const indexChirho = matchChirho.index ?? 0;
    const contextIndexChirho = contextStartOffsetChirho + indexChirho;
    const contextChirho = contextTextChirho.slice(
      Math.max(0, contextIndexChirho - 24),
      Math.min(contextTextChirho.length, contextIndexChirho + matchChirho[0].length + 24)
    );
    if (!BENIGN_NUMERIC_CONTEXT_RE_CHIRHO.test(contextChirho)) return true;
  }
  return false;
}

function spanReasonsChirho(spanChirho: SpanChirho, lineChirho: SpanLineChirho, spansChirho: SpanChirho[], indexChirho: number): string[] {
  const textChirho = compactTextChirho(spanChirho.utf8TextChirho);
  const leftContextChirho = compactTextChirho(spansChirho[indexChirho - 1]?.utf8TextChirho ?? "").slice(-40);
  const rightContextChirho = compactTextChirho(spansChirho[indexChirho + 1]?.utf8TextChirho ?? "").slice(0, 40);
  const numericContextTextChirho = `${leftContextChirho} ${textChirho} ${rightContextChirho}`;
  const numericContextStartOffsetChirho = leftContextChirho.length + 1;
  const reasonsChirho: string[] = [];
  if (!REVIEWABLE_SCRIPT_SET_CHIRHO.has(spanChirho.scriptChirho)) return reasonsChirho;
  if (hasNonBenignNumericMatchChirho(textChirho, DIGIT_CLUSTER_SCAN_RE_CHIRHO, numericContextTextChirho, numericContextStartOffsetChirho)) {
    reasonsChirho.push("dense-digit-cluster-chirho");
  }
  if (hasNonBenignNumericMatchChirho(textChirho, SYMBOL_DIGIT_SCAN_RE_CHIRHO, numericContextTextChirho, numericContextStartOffsetChirho)) {
    reasonsChirho.push("symbol-digit-garble-chirho");
  }
  if (ORDINAL_GARBAGE_RE_CHIRHO.test(textChirho)) reasonsChirho.push("ordinal-garble-chirho");
  if (
    REPEATED_UPPER_GARBAGE_RE_CHIRHO.test(textChirho) &&
    hasHebrewSpanChirho(lineChirho) &&
    !APPARATUS_WITNESS_LIST_RE_CHIRHO.test(textChirho)
  ) {
    reasonsChirho.push("repeated-uppercase-garble-near-hebrew-line-chirho");
  }
  if (
    isAdjacentToHebrewChirho(spansChirho, indexChirho) &&
    (SHORT_LATIN_SYMBOL_GARBAGE_RE_CHIRHO.test(textChirho) || SHORT_BRACKET_DIGIT_GARBAGE_RE_CHIRHO.test(textChirho)) &&
    !BRACKETED_SINGLE_CAPITAL_SIGLUM_RE_CHIRHO.test(textChirho) &&
    !BENIGN_NUMERIC_CONTEXT_RE_CHIRHO.test(textChirho)
  ) {
    reasonsChirho.push("short-latin-symbol-garble-adjacent-to-hebrew-chirho");
  }
  return [...new Set(reasonsChirho)];
}

function scoreCandidateChirho(lineChirho: SpanLineChirho, lineTextValueChirho: string, suspiciousSpansChirho: SuspiciousSpanChirho[]): {
  scoreChirho: number;
  reasonsChirho: string[];
} {
  let scoreChirho = 0;
  const reasonsChirho: string[] = [];
  const hasHebrewChirho = hasHebrewSpanChirho(lineChirho);
  const hasScriptureRefChirho = SCRIPTURE_REF_RE_CHIRHO.test(lineTextValueChirho);
  const hasDenseDigitChirho = suspiciousSpansChirho.some((spanChirho) =>
    spanChirho.reasonsChirho.includes("dense-digit-cluster-chirho")
  );
  const hasSymbolDigitChirho = suspiciousSpansChirho.some((spanChirho) => spanChirho.reasonsChirho.includes("symbol-digit-garble-chirho"));
  const hasOrdinalGarbleChirho = suspiciousSpansChirho.some((spanChirho) => spanChirho.reasonsChirho.includes("ordinal-garble-chirho"));
  const hasRepeatedUpperGarbleChirho = suspiciousSpansChirho.some((spanChirho) =>
    spanChirho.reasonsChirho.includes("repeated-uppercase-garble-near-hebrew-line-chirho")
  );
  const hasShortLatinSymbolGarbleChirho = suspiciousSpansChirho.some((spanChirho) =>
    spanChirho.reasonsChirho.includes("short-latin-symbol-garble-adjacent-to-hebrew-chirho")
  );
  const hasAdjacentHebrewChirho = suspiciousSpansChirho.some((spanChirho) =>
    spanChirho.leftScriptChirho === "hebrew-chirho" || spanChirho.rightScriptChirho === "hebrew-chirho"
  );

  if (hasHebrewChirho) {
    scoreChirho += 2;
    reasonsChirho.push("line-has-hebrew-span-chirho");
  }
  if (hasScriptureRefChirho) {
    scoreChirho += 1;
    reasonsChirho.push("line-has-scripture-reference-chirho");
  }
  if (hasDenseDigitChirho) {
    scoreChirho += 3;
    reasonsChirho.push("line-has-dense-digit-cluster-chirho");
  }
  if (hasSymbolDigitChirho) {
    scoreChirho += 4;
    reasonsChirho.push("line-has-symbol-digit-garble-chirho");
  }
  if (hasOrdinalGarbleChirho) {
    scoreChirho += 4;
    reasonsChirho.push("line-has-ordinal-garble-chirho");
  }
  if (hasRepeatedUpperGarbleChirho) {
    scoreChirho += 4;
    reasonsChirho.push("line-has-repeated-uppercase-garble-chirho");
  }
  if (hasShortLatinSymbolGarbleChirho) {
    scoreChirho += 3;
    reasonsChirho.push("line-has-short-latin-symbol-garble-chirho");
  }
  if (hasAdjacentHebrewChirho) {
    scoreChirho += 2;
    reasonsChirho.push("suspicious-span-adjacent-to-hebrew-chirho");
  }
  scoreChirho += Math.min(3, suspiciousSpansChirho.length);
  return { scoreChirho, reasonsChirho: [...new Set(reasonsChirho)] };
}

function priorityForScoreChirho(scoreChirho: number): CandidateChirho["priorityChirho"] {
  if (scoreChirho >= 8) return "high-chirho";
  if (scoreChirho >= 5) return "medium-chirho";
  return "low-chirho";
}

function candidateForLineChirho(pathChirho: string): CandidateChirho | null {
  const lineChirho = readSpanLineChirho(pathChirho);
  const spansChirho = orderedSpansChirho(lineChirho);
  const lineTextValueChirho = lineTextChirho(lineChirho);
  const suspiciousSpansChirho = spansChirho
    .map((spanChirho, indexChirho): SuspiciousSpanChirho | null => {
      const reasonsChirho = spanReasonsChirho(spanChirho, lineChirho, spansChirho, indexChirho);
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
  if (suspiciousSpansChirho.length === 0) return null;

  const scoredChirho = scoreCandidateChirho(lineChirho, lineTextValueChirho, suspiciousSpansChirho);
  if (scoredChirho.scoreChirho < 5) return null;

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
    "# Hidden Hebrew Candidate Scan Chirho",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This is a machine-assisted review queue, not a certification result. It flags lines where OCR may have rendered printed Hebrew as valid-looking French, Latin, symbols, short Latin/bracket garbage, or digit garbage. Every item still needs visual review against the scanline before any span repair.",
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
    "Priority is heuristic: scripture/citation context, existing Hebrew spans, digit/symbol/short Latin-bracket garbage, and adjacency to Hebrew increase priority. Normal manuscript numbers, citations, and sigla can still appear here as false positives.",
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
  const candidatesChirho = spanLinePathsChirho
    .map(candidateForLineChirho)
    .filter((candidateChirho): candidateChirho is CandidateChirho => candidateChirho !== null)
    .sort((aChirho, bChirho) => {
      if (bChirho.scoreChirho !== aChirho.scoreChirho) return bChirho.scoreChirho - aChirho.scoreChirho;
      if (aChirho.volumeChirho !== bChirho.volumeChirho) return aChirho.volumeChirho - bChirho.volumeChirho;
      if (aChirho.pageChirho !== bChirho.pageChirho) return aChirho.pageChirho - bChirho.pageChirho;
      return aChirho.lineIndexChirho - bChirho.lineIndexChirho;
    });

  writeFileSync(reportPathChirho, renderReportChirho(candidatesChirho, reportPathChirho, spanSourceFingerprintChirho, scannerSourceFingerprintChirho));
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

if (import.meta.main) mainChirho();
