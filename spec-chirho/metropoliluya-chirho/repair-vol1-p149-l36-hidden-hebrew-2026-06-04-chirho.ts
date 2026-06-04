// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 1 p149 line 36.
 *
 * Pass-C boxed only a narrow slice of the printed Hebrew phrase and left the
 * remaining Hebrew pixels in the following French span as `a 17722 772 122`.
 * The widened Hebrew phrase is stored as vision-chirho only, not certified
 * human text.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol1-p149-l36-hidden-hebrew-2026-06-04-chirho";
const SPAN_LINE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-1-chirho",
  "page-0149-chirho",
  "line-036-chirho.json"
);
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);

interface SpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
  visionTranscribedAtChirho?: string;
  visionNotesChirho?: string;
  [keyChirho: string]: unknown;
}

interface SpanLineChirho {
  schemaVersionChirho: number;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  spansChirho: SpanChirho[];
  [keyChirho: string]: unknown;
}

interface VisionVerdictChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  garbleTextChirho: string;
  scriptChirho: string;
  utf8TextChirho: string;
  notesChirho: string;
}

interface VisionVerdictsBackupChirho {
  generatedAtChirho?: string;
  countChirho?: number;
  verdictsChirho?: VisionVerdictChirho[];
  [keyChirho: string]: unknown;
}

interface RepairReportChirho {
  moduleChirho: string;
  modeChirho: "dry-run-chirho" | "apply-chirho";
  statusChirho: "blocked-chirho" | "planned-chirho" | "applied-chirho" | "already-applied-chirho";
  messagesChirho: string[];
  spansChirho: Array<
    Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">
  >;
}

const EXPECTED_RENDERED_CHIRHO =
  "respondre à l'hébreu בְּעבְרוֹ בַּיַּרְדֵּן נִכְרְתוּ מֵי הַיַּרְדֵּן a 17722 772 122, elle ne fait que copier la Vet Lat (ms";
const REPAIRED_RENDERED_CHIRHO =
  "respondre à l'hébreu בְּעבְרוֹ בַּיַּרְדֵּן נִכְרְתוּ מֵי הַיַּרְדֵּן, elle ne fait que copier la Vet Lat (ms";
const RECOVERED_HEBREW_CHIRHO = "בְּעבְרוֹ בַּיַּרְדֵּן נִכְרְתוּ מֵי הַיַּרְדֵּן,";
const VISION_NOTES_CHIRHO =
  "Expanded the too-narrow vol 1 p149 line 36 Hebrew span: Codex visually confirmed that the scanline prints the full phrase `בְּעבְרוֹ בַּיַּרְדֵּן נִכְרְתוּ מֵי הַיַּרְדֵּן` across x361..710, while the old S1 box covered only an interior slice and the old S2 text `a 17722 772 122` was the remaining Hebrew pixels mis-OCR'd as digits. A follow-up geometry audit corrected an earlier too-far-left x260 boundary so the French `l'hébreu` tail remains in S0. The comma is attached to the widened span so the rendered French continuation reads cleanly. Stored as vision-chirho; exact printed vowels/marks, comma placement, and segmentation remain Hebrew/WLC expert-confirmation tier.";

function loadJsonChirho<TChirho>(pathChirho: string): TChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function writeJsonChirho(pathChirho: string, valueChirho: unknown): void {
  const tempPathChirho = `${pathChirho}.tmp-chirho-${process.pid}-${Date.now()}`;
  writeFileSync(tempPathChirho, `${JSON.stringify(valueChirho, null, 2)}\n`);
  renameSync(tempPathChirho, pathChirho);
}

function sortedSpansChirho(lineChirho: SpanLineChirho): SpanChirho[] {
  return [...lineChirho.spansChirho].sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho);
}

function renderedLineChirho(lineChirho: SpanLineChirho): string {
  return sortedSpansChirho(lineChirho)
    .map((spanChirho) => spanChirho.utf8TextChirho)
    .join(" ");
}

function spanSummaryChirho(lineChirho: SpanLineChirho): RepairReportChirho["spansChirho"] {
  return sortedSpansChirho(lineChirho).map((spanChirho) => ({
    segmentIndexChirho: spanChirho.segmentIndexChirho,
    xMinPxChirho: spanChirho.xMinPxChirho,
    widthPxChirho: spanChirho.widthPxChirho,
    scriptChirho: spanChirho.scriptChirho,
    utf8TextChirho: spanChirho.utf8TextChirho,
    provenanceChirho: spanChirho.provenanceChirho,
  }));
}

function validateTargetLineChirho(lineChirho: SpanLineChirho): void {
  if (lineChirho.volumeChirho !== 1 || lineChirho.pageChirho !== 149 || lineChirho.lineIndexChirho !== 36) {
    throw new Error("span file is not vol 1 page 149 line 36");
  }
}

function validateTilingChirho(lineChirho: SpanLineChirho): void {
  let expectedXChirho = 0;
  for (const [indexChirho, spanChirho] of sortedSpansChirho(lineChirho).entries()) {
    if (spanChirho.segmentIndexChirho !== indexChirho) {
      throw new Error(`segment index ${spanChirho.segmentIndexChirho} !== ${indexChirho}`);
    }
    if (spanChirho.xMinPxChirho !== expectedXChirho) {
      throw new Error(`xMin ${spanChirho.xMinPxChirho} !== expected ${expectedXChirho}`);
    }
    if (spanChirho.widthPxChirho <= 0) {
      throw new Error(`span ${indexChirho} has non-positive width ${spanChirho.widthPxChirho}`);
    }
    expectedXChirho += spanChirho.widthPxChirho;
  }
  if (expectedXChirho !== lineChirho.lineWidthPxChirho) {
    throw new Error(`spans end at ${expectedXChirho}, expected ${lineChirho.lineWidthPxChirho}`);
  }
}

function stateForLineChirho(lineChirho: SpanLineChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  const renderedChirho = normalizeTextForStorageChirho(renderedLineChirho(lineChirho));
  if (renderedChirho === normalizeTextForStorageChirho(EXPECTED_RENDERED_CHIRHO)) return "pre-repair-chirho";
  if (renderedChirho === normalizeTextForStorageChirho(REPAIRED_RENDERED_CHIRHO)) {
    const spansChirho = sortedSpansChirho(lineChirho);
    const repairedGeometryChirho =
      spansChirho[0]?.xMinPxChirho === 0 &&
      spansChirho[0]?.widthPxChirho === 361 &&
      spansChirho[1]?.xMinPxChirho === 361 &&
      spansChirho[1]?.widthPxChirho === 349 &&
      spansChirho[2]?.xMinPxChirho === 710 &&
      spansChirho[2]?.widthPxChirho === 734;
    return repairedGeometryChirho ? "already-applied-chirho" : "pre-repair-chirho";
  }
  return "unknown-chirho";
}

function buildPlannedLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const spansChirho = sortedSpansChirho(lineChirho);
  const prefixSpanChirho = spansChirho[0];
  const suffixSpanChirho = spansChirho[2];
  if (prefixSpanChirho === undefined || suffixSpanChirho === undefined) {
    throw new Error("expected vol 1 p149 L36 original spans to exist");
  }

  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = [
    { ...prefixSpanChirho, segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 361 },
    {
      segmentIndexChirho: 1,
      xMinPxChirho: 361,
      widthPxChirho: 349,
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(RECOVERED_HEBREW_CHIRHO),
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho: VISION_NOTES_CHIRHO,
    },
    {
      ...suffixSpanChirho,
      segmentIndexChirho: 2,
      xMinPxChirho: 710,
      widthPxChirho: 734,
      scriptChirho: "french-chirho",
      utf8TextChirho: "elle ne fait que copier la Vet Lat (ms",
    },
  ];
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

function visionVerdictForLineChirho(lineChirho: SpanLineChirho): VisionVerdictChirho {
  const recoveredSpanChirho = sortedSpansChirho(lineChirho).find(
    (spanChirho) => spanChirho.segmentIndexChirho === 1 && spanChirho.provenanceChirho === "vision-chirho"
  );
  if (recoveredSpanChirho === undefined) throw new Error("recovered vision Hebrew span missing");
  return {
    volumeChirho: 1,
    pageChirho: 149,
    lineIndexChirho: 36,
    segmentIndexChirho: 1,
    garbleTextChirho: "a 17722 772 122",
    scriptChirho: "hebrew-chirho",
    utf8TextChirho: normalizeTextForStorageChirho(recoveredSpanChirho.utf8TextChirho),
    notesChirho: recoveredSpanChirho.visionNotesChirho ?? VISION_NOTES_CHIRHO,
  };
}

function upsertVisionBackupChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) {
    throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  }
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) => !(candidateChirho.volumeChirho === 1 && candidateChirho.pageChirho === 149 && candidateChirho.lineIndexChirho === 36)
  );
  verdictsChirho.push(visionVerdictForLineChirho(lineChirho));
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return 1;
}

function reportChirho(
  modeChirho: RepairReportChirho["modeChirho"],
  statusChirho: RepairReportChirho["statusChirho"],
  messagesChirho: string[],
  lineChirho: SpanLineChirho
): RepairReportChirho {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho,
    statusChirho,
    messagesChirho,
    spansChirho: spanSummaryChirho(lineChirho),
  };
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const modeChirho: RepairReportChirho["modeChirho"] = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const appliedAtChirho = new Date().toISOString();
  const lineChirho = loadJsonChirho<SpanLineChirho>(SPAN_LINE_PATH_CHIRHO);
  validateTargetLineChirho(lineChirho);
  validateTilingChirho(lineChirho);
  const stateChirho = stateForLineChirho(lineChirho);

  if (stateChirho === "unknown-chirho") {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          "blocked-chirho",
          [
            "vol 1 p149 line 36 is not in the expected pre-repair or already-applied state; refusing to guess around current edits",
            `rendered line: ${JSON.stringify(renderedLineChirho(lineChirho))}`,
          ],
          lineChirho
        ),
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  const plannedLineChirho = stateChirho === "already-applied-chirho" ? lineChirho : buildPlannedLineChirho(lineChirho, appliedAtChirho);
  if (!applyChirho) {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          stateChirho === "already-applied-chirho" ? "already-applied-chirho" : "planned-chirho",
          ["ready to widen vol 1 p149 L36 as one vision-chirho Hebrew span, correct geometry to x361..710, and remove the digit-garble overflow"],
          plannedLineChirho
        ),
        null,
        2
      )
    );
    return;
  }

  writeJsonChirho(SPAN_LINE_PATH_CHIRHO, plannedLineChirho);
  const upsertCountChirho = upsertVisionBackupChirho(plannedLineChirho, appliedAtChirho);

  console.log(
    JSON.stringify(
      reportChirho(
        modeChirho,
        "applied-chirho",
        [
          `applied vol 1 p149 L36 repair/geometry correction and upserted ${upsertCountChirho} durable vision verdict`,
          "re-run export markdown, validate-pass-c-hebrew, both review packs, certification status, and hidden-Hebrew scan",
        ],
        plannedLineChirho
      ),
      null,
      2
    )
  );
}

mainChirho();
