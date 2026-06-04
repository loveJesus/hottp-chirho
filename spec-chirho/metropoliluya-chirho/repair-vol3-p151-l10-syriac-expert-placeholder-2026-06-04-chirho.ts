// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 3 p151 line 10.
 *
 * Pass-C scrambled a Hebrew word into the French span, then boxed that Hebrew
 * word over the later French continuation. The same line also contains a
 * Syrohexapla Syriac gloss that neither Claude nor Codex can responsibly
 * transcribe. This repair pins the geometry and script honestly, keeps the
 * Hebrew as vision-tier, and leaves the Syriac span blank so strict export
 * remains blocked until a Syriac/Syrohexapla expert supplies the text.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol3-p151-l10-syriac-expert-placeholder-2026-06-04-chirho";
const SPAN_LINE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-3-chirho",
  "page-0151-chirho",
  "line-010-chirho.json"
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

const HEBREW_TEXT_CHIRHO = "שִׁלְחוֹת";
const SYRIAC_EXPERT_PENDING_TEXT_CHIRHO = "";
const HEBREW_VISION_NOTES_CHIRHO =
  "Reboxed the vol 3 p151 line 10 Hebrew word from the old mispositioned S1 at x872..1008 to x210..305. Claude and Codex second-witnessed the scanline as `שִׁלְחוֹת`; the old French-span garble `ni]` was the Hebrew pixels. Stored as vision-chirho because this geometry repair is machine-witnessed, not human-certified; exact printed letters, vowels/marks, and segmentation remain Hebrew/WLC expert-confirmation tier.";
const SYRIAC_VISION_NOTES_CHIRHO =
  "Pinned the vol 3 p151 line 10 Syrohexapla gloss box at x767..950 after the open parenthesis and before the comma. Claude and Codex second-witnessed the script/geometry as two Syriac words, with visible Syriac letter forms and seyame/plural dots, but neither can responsibly transcribe exact letters at this resolution. The text is intentionally left empty so strict export emits an EMPTY-SPAN marker and remains blocked until a Syriac/Syrohexapla expert supplies the exact printed text.";

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
  if (lineChirho.volumeChirho !== 3 || lineChirho.pageChirho !== 151 || lineChirho.lineIndexChirho !== 10) {
    throw new Error("span file is not vol 3 page 151 line 10");
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

function isPreRepairLineChirho(lineChirho: SpanLineChirho): boolean {
  const spansChirho = sortedSpansChirho(lineChirho);
  return (
    spansChirho.length === 3 &&
    spansChirho[0]?.xMinPxChirho === 0 &&
    spansChirho[0]?.widthPxChirho === 872 &&
    spansChirho[0]?.scriptChirho === "french-chirho" &&
    spansChirho[0]?.utf8TextChirho === "vise à traduire ni] au sens de “émissions d'eau” (553" &&
    spansChirho[1]?.xMinPxChirho === 872 &&
    spansChirho[1]?.widthPxChirho === 136 &&
    spansChirho[1]?.scriptChirho === "hebrew-chirho" &&
    spansChirho[1]?.utf8TextChirho === HEBREW_TEXT_CHIRHO &&
    spansChirho[2]?.xMinPxChirho === 1008 &&
    spansChirho[2]?.widthPxChirho === 277 &&
    spansChirho[2]?.scriptChirho === "french-chirho" &&
    spansChirho[2]?.utf8TextChirho === "comme l'interprète"
  );
}

function isAlreadyAppliedLineChirho(lineChirho: SpanLineChirho): boolean {
  const spansChirho = sortedSpansChirho(lineChirho);
  return (
    spansChirho.length === 5 &&
    spansChirho[0]?.xMinPxChirho === 0 &&
    spansChirho[0]?.widthPxChirho === 210 &&
    spansChirho[0]?.scriptChirho === "french-chirho" &&
    spansChirho[0]?.utf8TextChirho === "vise à traduire" &&
    spansChirho[1]?.xMinPxChirho === 210 &&
    spansChirho[1]?.widthPxChirho === 95 &&
    spansChirho[1]?.scriptChirho === "hebrew-chirho" &&
    spansChirho[1]?.utf8TextChirho === HEBREW_TEXT_CHIRHO &&
    spansChirho[1]?.provenanceChirho === "vision-chirho" &&
    spansChirho[2]?.xMinPxChirho === 305 &&
    spansChirho[2]?.widthPxChirho === 462 &&
    spansChirho[2]?.scriptChirho === "french-chirho" &&
    spansChirho[2]?.utf8TextChirho === "au sens de “émissions d'eau” (" &&
    spansChirho[3]?.xMinPxChirho === 767 &&
    spansChirho[3]?.widthPxChirho === 183 &&
    spansChirho[3]?.scriptChirho === "syriac-chirho" &&
    spansChirho[3]?.utf8TextChirho === SYRIAC_EXPERT_PENDING_TEXT_CHIRHO &&
    spansChirho[3]?.provenanceChirho === "vision-chirho" &&
    spansChirho[4]?.xMinPxChirho === 950 &&
    spansChirho[4]?.widthPxChirho === 335 &&
    spansChirho[4]?.scriptChirho === "french-chirho" &&
    spansChirho[4]?.utf8TextChirho === ", comme l'interprète"
  );
}

function stateForLineChirho(lineChirho: SpanLineChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  if (isPreRepairLineChirho(lineChirho)) return "pre-repair-chirho";
  if (isAlreadyAppliedLineChirho(lineChirho)) return "already-applied-chirho";
  return "unknown-chirho";
}

function buildPlannedLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = [
    {
      segmentIndexChirho: 0,
      xMinPxChirho: 0,
      widthPxChirho: 210,
      scriptChirho: "french-chirho",
      utf8TextChirho: "vise à traduire",
    },
    {
      segmentIndexChirho: 1,
      xMinPxChirho: 210,
      widthPxChirho: 95,
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(HEBREW_TEXT_CHIRHO),
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho: HEBREW_VISION_NOTES_CHIRHO,
    },
    {
      segmentIndexChirho: 2,
      xMinPxChirho: 305,
      widthPxChirho: 462,
      scriptChirho: "french-chirho",
      utf8TextChirho: "au sens de “émissions d'eau” (",
    },
    {
      segmentIndexChirho: 3,
      xMinPxChirho: 767,
      widthPxChirho: 183,
      scriptChirho: "syriac-chirho",
      utf8TextChirho: SYRIAC_EXPERT_PENDING_TEXT_CHIRHO,
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho: SYRIAC_VISION_NOTES_CHIRHO,
    },
    {
      segmentIndexChirho: 4,
      xMinPxChirho: 950,
      widthPxChirho: 335,
      scriptChirho: "french-chirho",
      utf8TextChirho: ", comme l'interprète",
    },
  ];
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

function visionVerdictsForLineChirho(lineChirho: SpanLineChirho): VisionVerdictChirho[] {
  const spansChirho = sortedSpansChirho(lineChirho);
  const hebrewSpanChirho = spansChirho.find(
    (spanChirho) => spanChirho.segmentIndexChirho === 1 && spanChirho.scriptChirho === "hebrew-chirho" && spanChirho.provenanceChirho === "vision-chirho"
  );
  const syriacSpanChirho = spansChirho.find(
    (spanChirho) => spanChirho.segmentIndexChirho === 3 && spanChirho.scriptChirho === "syriac-chirho" && spanChirho.provenanceChirho === "vision-chirho"
  );
  if (hebrewSpanChirho === undefined) throw new Error("reboxed vision Hebrew span missing");
  if (syriacSpanChirho === undefined) throw new Error("expert-pending vision Syriac span missing");
  return [
    {
      volumeChirho: 3,
      pageChirho: 151,
      lineIndexChirho: 10,
      segmentIndexChirho: 1,
      garbleTextChirho: "ni] + old misboxed S1 at x872..1008",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(hebrewSpanChirho.utf8TextChirho),
      notesChirho: hebrewSpanChirho.visionNotesChirho ?? HEBREW_VISION_NOTES_CHIRHO,
    },
    {
      volumeChirho: 3,
      pageChirho: 151,
      lineIndexChirho: 10,
      segmentIndexChirho: 3,
      garbleTextChirho: "(553",
      scriptChirho: "syriac-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(syriacSpanChirho.utf8TextChirho),
      notesChirho: syriacSpanChirho.visionNotesChirho ?? SYRIAC_VISION_NOTES_CHIRHO,
    },
  ];
}

function upsertVisionBackupChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) {
    throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  }
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) => !(candidateChirho.volumeChirho === 3 && candidateChirho.pageChirho === 151 && candidateChirho.lineIndexChirho === 10)
  );
  const nextVerdictsChirho = visionVerdictsForLineChirho(lineChirho);
  verdictsChirho.push(...nextVerdictsChirho);
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return nextVerdictsChirho.length;
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
            "vol 3 p151 line 10 is not in the expected pre-repair or already-applied state; refusing to guess around current edits",
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
          [
            "ready to repair vol 3 p151 L10 geometry, rebox Hebrew as vision-tier, and leave Syriac text blank for expert-only transcription",
            "strict export is expected to remain blocked by the explicit EMPTY-SPAN marker until the Syriac expert fills S3",
          ],
          plannedLineChirho
        ),
        null,
        2
      )
    );
    return;
  }

  if (stateChirho !== "already-applied-chirho") {
    writeJsonChirho(SPAN_LINE_PATH_CHIRHO, plannedLineChirho);
  }
  const upsertCountChirho = upsertVisionBackupChirho(plannedLineChirho, appliedAtChirho);
  console.log(
    JSON.stringify(
      reportChirho(
        modeChirho,
        "applied-chirho",
        [
          `applied vol 3 p151 L10 repair and upserted ${upsertCountChirho} durable vision verdicts`,
          "Syriac S3 remains intentionally blank and expert-pending; regenerate export/report/packs so the gate reflects the blocker",
        ],
        plannedLineChirho
      ),
      null,
      2
    )
  );
}

mainChirho();
