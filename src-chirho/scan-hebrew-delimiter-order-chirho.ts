// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Read-only audit for Hebrew spans containing parentheses/brackets/braces.
 *
 * This catches the visual-order bug class where a Hebrew quote was stored with
 * a closing parenthesis before an opening parenthesis. It writes a report only;
 * it never edits spans, databases, packets, or certification state.
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { renderSpanLineTextChirho } from "./span-line-text-chirho.ts";
import { sourceFingerprintForPathsChirho, type SourceFingerprintChirho } from "./source-fingerprint-chirho.ts";
import { scanSpanLinePathsChirho } from "./span-nfc-chirho.ts";
import { strictBlindScannerSourceFingerprintChirho } from "./strict-blind-scanner-source-fingerprint-chirho.ts";

const MODULE_CHIRHO = "scan-hebrew-delimiter-order-chirho";
const SCANNER_PATH_CHIRHO = fileURLToPath(import.meta.url);
const DEFAULT_REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "hebrew-delimiter-order-audit-2026-06-04-chirho.md"
);
const DELIMITER_RE_CHIRHO = /[()[\]{}]/;

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
  lineWidthPxChirho: number;
  spansChirho: SpanChirho[];
}

interface DelimiterCountChirho {
  roundOpenChirho: number;
  roundCloseChirho: number;
  squareOpenChirho: number;
  squareCloseChirho: number;
  curlyOpenChirho: number;
  curlyCloseChirho: number;
}

interface DelimiterFindingChirho {
  statusChirho: string;
  pathChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  xMinPxChirho: number | null;
  widthPxChirho: number | null;
  provenanceChirho: string | null;
  textChirho: string;
  renderedLineTextChirho: string;
  notesChirho: string[];
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function delimiterCountsChirho(textChirho: string): DelimiterCountChirho {
  return {
    roundOpenChirho: [...textChirho.matchAll(/\(/g)].length,
    roundCloseChirho: [...textChirho.matchAll(/\)/g)].length,
    squareOpenChirho: [...textChirho.matchAll(/\[/g)].length,
    squareCloseChirho: [...textChirho.matchAll(/\]/g)].length,
    curlyOpenChirho: [...textChirho.matchAll(/\{/g)].length,
    curlyCloseChirho: [...textChirho.matchAll(/\}/g)].length,
  };
}

function closeBeforeOpenChirho(textChirho: string): boolean {
  return /[)\]}].*[(\[{]/.test(textChirho);
}

function spanImbalanceNotesChirho(countsChirho: DelimiterCountChirho): string[] {
  const notesChirho: string[] = [];
  if (countsChirho.roundOpenChirho !== countsChirho.roundCloseChirho) notesChirho.push("round-chirho");
  if (countsChirho.squareOpenChirho !== countsChirho.squareCloseChirho) notesChirho.push("square-chirho");
  if (countsChirho.curlyOpenChirho !== countsChirho.curlyCloseChirho) notesChirho.push("curly-chirho");
  return notesChirho;
}

function delimiterBalanceChirho(countsChirho: DelimiterCountChirho, noteChirho: string): number {
  if (noteChirho === "round-chirho") return countsChirho.roundOpenChirho - countsChirho.roundCloseChirho;
  if (noteChirho === "square-chirho") return countsChirho.squareOpenChirho - countsChirho.squareCloseChirho;
  if (noteChirho === "curly-chirho") return countsChirho.curlyOpenChirho - countsChirho.curlyCloseChirho;
  return 0;
}

function neighborTextForBalanceChirho(lineChirho: SpanLineChirho, spanChirho: SpanChirho, noteChirho: string): string {
  const spansChirho = [...lineChirho.spansChirho].sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho);
  const spanIndexChirho = spansChirho.findIndex((candidateChirho) => candidateChirho.segmentIndexChirho === spanChirho.segmentIndexChirho);
  const spanBalanceChirho = delimiterBalanceChirho(delimiterCountsChirho(spanChirho.utf8TextChirho), noteChirho);
  if (spanIndexChirho < 0) return spanChirho.utf8TextChirho;
  if (spanBalanceChirho > 0) return spansChirho.slice(spanIndexChirho).map((candidateChirho) => candidateChirho.utf8TextChirho).join(" ");
  if (spanBalanceChirho < 0) return spansChirho.slice(0, spanIndexChirho + 1).map((candidateChirho) => candidateChirho.utf8TextChirho).join(" ");
  return spanChirho.utf8TextChirho;
}

function neighborBalancesDelimiterChirho(lineChirho: SpanLineChirho, spanChirho: SpanChirho, noteChirho: string): boolean {
  const neighborCountsChirho = delimiterCountsChirho(neighborTextForBalanceChirho(lineChirho, spanChirho, noteChirho));
  if (noteChirho === "round-chirho") return neighborCountsChirho.roundOpenChirho === neighborCountsChirho.roundCloseChirho;
  if (noteChirho === "square-chirho") return neighborCountsChirho.squareOpenChirho === neighborCountsChirho.squareCloseChirho;
  if (noteChirho === "curly-chirho") return neighborCountsChirho.curlyOpenChirho === neighborCountsChirho.curlyCloseChirho;
  return false;
}

function statusForFindingChirho(lineChirho: SpanLineChirho, spanChirho: SpanChirho): { statusChirho: string; notesChirho: string[] } {
  const textChirho = spanChirho.utf8TextChirho;
  const spanCountsChirho = delimiterCountsChirho(textChirho);
  const notesChirho = spanImbalanceNotesChirho(spanCountsChirho);
  if (closeBeforeOpenChirho(textChirho)) {
    return {
      statusChirho: "close-before-open-suspect-chirho",
      notesChirho: ["same-span close delimiter appears before an open delimiter"],
    };
  }
  if (notesChirho.length === 0) {
    return {
      statusChirho: "balanced-in-span-chirho",
      notesChirho: ["all delimiter pairs balance within the Hebrew span"],
    };
  }
  const neighborBalancedNotesChirho = notesChirho.filter((noteChirho) => neighborBalancesDelimiterChirho(lineChirho, spanChirho, noteChirho));
  if (neighborBalancedNotesChirho.length === notesChirho.length) {
    return {
      statusChirho: "neighbor-balanced-across-spans-chirho",
      notesChirho: [`span-level ${notesChirho.join(", ")} imbalance balances with adjacent line span text`],
    };
  }
  return {
    statusChirho: "neighbor-unbalanced-review-chirho",
    notesChirho: [`span-level ${notesChirho.join(", ")} imbalance does not balance with adjacent line span text`],
  };
}

function scanFindingsChirho(): DelimiterFindingChirho[] {
  const findingsChirho: DelimiterFindingChirho[] = [];
  for (const pathChirho of scanSpanLinePathsChirho()) {
    const lineChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as SpanLineChirho;
    const renderedLineTextChirho = renderSpanLineTextChirho(lineChirho);
    for (const spanChirho of lineChirho.spansChirho ?? []) {
      if (spanChirho.scriptChirho !== "hebrew-chirho") continue;
      if (!DELIMITER_RE_CHIRHO.test(spanChirho.utf8TextChirho)) continue;
      const statusChirho = statusForFindingChirho(lineChirho, spanChirho);
      findingsChirho.push({
        statusChirho: statusChirho.statusChirho,
        pathChirho,
        volumeChirho: lineChirho.volumeChirho,
        pageChirho: lineChirho.pageChirho,
        lineIndexChirho: lineChirho.lineIndexChirho,
        segmentIndexChirho: spanChirho.segmentIndexChirho,
        xMinPxChirho: spanChirho.xMinPxChirho ?? null,
        widthPxChirho: spanChirho.widthPxChirho ?? null,
        provenanceChirho: spanChirho.provenanceChirho ?? null,
        textChirho: spanChirho.utf8TextChirho,
        renderedLineTextChirho,
        notesChirho: statusChirho.notesChirho,
      });
    }
  }
  return findingsChirho.sort(
    (aChirho, bChirho) =>
      aChirho.volumeChirho - bChirho.volumeChirho ||
      aChirho.pageChirho - bChirho.pageChirho ||
      aChirho.lineIndexChirho - bChirho.lineIndexChirho ||
      aChirho.segmentIndexChirho - bChirho.segmentIndexChirho
  );
}

function markdownEscapeChirho(valueChirho: string): string {
  return valueChirho.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function markdownReportChirho(
  findingsChirho: DelimiterFindingChirho[],
  spanSourceFingerprintChirho: SourceFingerprintChirho,
  scannerSourceFingerprintChirho: SourceFingerprintChirho
): string {
  const byStatusChirho = new Map<string, number>();
  for (const findingChirho of findingsChirho) {
    byStatusChirho.set(findingChirho.statusChirho, (byStatusChirho.get(findingChirho.statusChirho) ?? 0) + 1);
  }
  const statusLinesChirho = [...byStatusChirho.entries()]
    .sort((aChirho, bChirho) => aChirho[0].localeCompare(bChirho[0]))
    .map(([statusChirho, countChirho]) => `- ${statusChirho}: ${countChirho}`);
  const detailLinesChirho = findingsChirho.map((findingChirho) =>
    [
      `v${findingChirho.volumeChirho} p${findingChirho.pageChirho} L${findingChirho.lineIndexChirho} S${findingChirho.segmentIndexChirho}`,
      findingChirho.statusChirho,
      findingChirho.provenanceChirho ?? "none-chirho",
      markdownEscapeChirho(findingChirho.textChirho),
      markdownEscapeChirho(findingChirho.notesChirho.join("; ")),
      markdownEscapeChirho(findingChirho.renderedLineTextChirho),
    ].join(" | ")
  );
  return [
    "<!-- For God so loved the world that he gave his only begotten Son,",
    "that whoever believes in him should not perish but have eternal life. John 3:16 -->",
    "",
    "# Hebrew Delimiter Order Audit Chirho",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This is a read-only mechanical audit for Hebrew spans that contain parentheses, square brackets, or braces. It does not certify text and does not change the gate. It exists to catch the strict-blind visual-order bug class where Hebrew parentheses were stored as a close delimiter before an open delimiter.",
    "Neighbor-unbalanced rows are review targets, not automatic defects; Qumran/DSS lacuna notation can legitimately be damaged or unresolved until an expert confirms it.",
    "",
    "## Summary",
    "",
    `- Scanner source files: ${scannerSourceFingerprintChirho.fileCountChirho}`,
    `- Scanner source fingerprint: ${scannerSourceFingerprintChirho.sha256Chirho}`,
    `- Span source files: ${spanSourceFingerprintChirho.fileCountChirho}`,
    `- Span source fingerprint: ${spanSourceFingerprintChirho.sha256Chirho}`,
    `- Hebrew delimiter span count: ${findingsChirho.length}`,
    `- Close-before-open suspect count: ${byStatusChirho.get("close-before-open-suspect-chirho") ?? 0}`,
    `- Neighbor-unbalanced review count: ${byStatusChirho.get("neighbor-unbalanced-review-chirho") ?? 0}`,
    ...statusLinesChirho,
    "",
    "## Details",
    "",
    "Location | Status | Provenance | Hebrew span text | Notes | Rendered line text",
    "--- | --- | --- | --- | --- | ---",
    ...detailLinesChirho,
    "",
  ].join("\n");
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const outPathChirho = parseArgValueChirho(argsChirho, "out-chirho") ?? DEFAULT_REPORT_PATH_CHIRHO;
  const spanSourceFingerprintChirho = sourceFingerprintForPathsChirho(scanSpanLinePathsChirho());
  const scannerSourceFingerprintChirho = strictBlindScannerSourceFingerprintChirho(SCANNER_PATH_CHIRHO);
  const findingsChirho = scanFindingsChirho();
  mkdirSync(dirname(outPathChirho), { recursive: true });
  writeFileSync(outPathChirho, markdownReportChirho(findingsChirho, spanSourceFingerprintChirho, scannerSourceFingerprintChirho));
  const suspectCountChirho = findingsChirho.filter((findingChirho) => findingChirho.statusChirho === "close-before-open-suspect-chirho").length;
  const neighborUnbalancedCountChirho = findingsChirho.filter((findingChirho) => findingChirho.statusChirho === "neighbor-unbalanced-review-chirho").length;
  console.log(
    `[${MODULE_CHIRHO}] findings=${findingsChirho.length} closeBeforeOpen=${suspectCountChirho} neighborUnbalanced=${neighborUnbalancedCountChirho} report=${outPathChirho}`
  );
  if (suspectCountChirho > 0) process.exitCode = 1;
}

if (import.meta.main) mainChirho();
