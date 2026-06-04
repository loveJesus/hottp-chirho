// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for two vol 1 p149 scanner candidates.
 *
 * Line 11 only removes a non-printed OCR duplicate from the French span.
 * Line 38 expands the too-narrow Hebrew span to include the printed Hebrew
 * right half that Pass-C re-OCR'd as "MY Un 723"; the corrected Hebrew remains
 * vision-chirho only, not certified human text.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol1-p149-l11-l38-hidden-hebrew-2026-06-04-chirho";
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

interface RepairTargetChirho {
  nameChirho: string;
  pathChirho: string;
  expectedRenderedChirho: string;
  repairedRenderedChirho: string;
  buildChirho: (lineChirho: SpanLineChirho, appliedAtChirho: string) => SpanLineChirho;
}

interface RepairReportChirho {
  moduleChirho: string;
  modeChirho: "dry-run-chirho" | "apply-chirho";
  statusChirho: "blocked-chirho" | "planned-chirho" | "applied-chirho" | "already-applied-chirho";
  messagesChirho: string[];
  linesChirho: Array<{
    nameChirho: string;
    stateChirho: string;
    spansChirho: Array<
      Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">
    >;
  }>;
}

const LINE_11_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-1-chirho",
  "page-0149-chirho",
  "line-011-chirho.json"
);
const LINE_38_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-1-chirho",
  "page-0149-chirho",
  "line-038-chirho.json"
);

const LINE_11_EXPECTED_RENDERED_CHIRHO =
  "Graetz voit en ces mots une dittographie de נִכְרְתוּ מֵימֵי הַיַּרְדֵּן 17922 qui les précède";
const LINE_11_REPAIRED_RENDERED_CHIRHO =
  "Graetz voit en ces mots une dittographie de נִכְרְתוּ מֵימֵי הַיַּרְדֵּן qui les précède";

const LINE_38_EXPECTED_RENDERED_CHIRHO =
  "4,10 כְּכֹל אֲשֶׁרצִוָּה מֹשֶׁה אֶתיְהוֹשֻׁעַ MY Un 723 [B] M g(S) T // abr-elus : G om / lic : V";
const LINE_38_REPAIRED_RENDERED_CHIRHO =
  "4,10 כְּכֹל אֲשֶׁר־צִוָּה מֹשֶׁה אֶת־יְהוֹשֻׁעַ [B] M g(S) T // abr-elus : G om / lic : V";
const LINE_38_RECOVERED_HEBREW_CHIRHO = "כְּכֹל אֲשֶׁר־צִוָּה מֹשֶׁה אֶת־יְהוֹשֻׁעַ";
const LINE_38_VISION_NOTES_CHIRHO =
  "Expanded the too-narrow vol 1 p149 line 38 Hebrew span: Claude and Codex second-witnessed that the print reads `כְּכֹל אֲשֶׁר־צִוָּה מֹשֶׁה אֶת־יְהוֹשֻׁעַ` across x89..535, while the old S1 box covered only the left half and `MY Un 723` was the Hebrew right half mis-OCR'd inside the following French span. The two maqafs in אשר־צוה and את־יהושע are visually certain, matching Joshua 4:10, but the span remains vision-chirho; exact printed vowels/marks and segmentation remain Hebrew/WLC expert-confirmation tier.";

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

function spanSummaryChirho(lineChirho: SpanLineChirho): RepairReportChirho["linesChirho"][number]["spansChirho"] {
  return sortedSpansChirho(lineChirho).map((spanChirho) => ({
    segmentIndexChirho: spanChirho.segmentIndexChirho,
    xMinPxChirho: spanChirho.xMinPxChirho,
    widthPxChirho: spanChirho.widthPxChirho,
    scriptChirho: spanChirho.scriptChirho,
    utf8TextChirho: spanChirho.utf8TextChirho,
    provenanceChirho: spanChirho.provenanceChirho,
  }));
}

function validateTargetLineChirho(lineChirho: SpanLineChirho, pageChirho: number, lineIndexChirho: number): void {
  if (lineChirho.volumeChirho !== 1 || lineChirho.pageChirho !== pageChirho || lineChirho.lineIndexChirho !== lineIndexChirho) {
    throw new Error(`span file is not vol 1 page ${pageChirho} line ${lineIndexChirho}`);
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

function stateForLineChirho(
  lineChirho: SpanLineChirho,
  expectedRenderedChirho: string,
  repairedRenderedChirho: string
): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  const renderedChirho = normalizeTextForStorageChirho(renderedLineChirho(lineChirho));
  if (renderedChirho === normalizeTextForStorageChirho(expectedRenderedChirho)) return "pre-repair-chirho";
  if (renderedChirho === normalizeTextForStorageChirho(repairedRenderedChirho)) return "already-applied-chirho";
  return "unknown-chirho";
}

function buildLine11Chirho(lineChirho: SpanLineChirho): SpanLineChirho {
  validateTargetLineChirho(lineChirho, 149, 11);
  const spansChirho = sortedSpansChirho(lineChirho);
  const frenchTailChirho = spansChirho[2];
  if (frenchTailChirho === undefined) throw new Error("line 11 French tail span missing");
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = spansChirho.map((spanChirho) =>
    spanChirho.segmentIndexChirho === 2 ? { ...spanChirho, utf8TextChirho: "qui les précède" } : { ...spanChirho }
  );
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

function buildLine38Chirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  validateTargetLineChirho(lineChirho, 149, 38);
  const spansChirho = sortedSpansChirho(lineChirho);
  const prefixSpanChirho = spansChirho[0];
  const apparatusSpanChirho = spansChirho[2];
  const omSpanChirho = spansChirho[3];
  const slashSpanChirho = spansChirho[4];
  const licSpanChirho = spansChirho[5];
  const vulgateSpanChirho = spansChirho[6];
  if (
    prefixSpanChirho === undefined ||
    apparatusSpanChirho === undefined ||
    omSpanChirho === undefined ||
    slashSpanChirho === undefined ||
    licSpanChirho === undefined ||
    vulgateSpanChirho === undefined
  ) {
    throw new Error("line 38 expected seven original spans");
  }

  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = [
    { ...prefixSpanChirho, segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 89 },
    {
      segmentIndexChirho: 1,
      xMinPxChirho: 89,
      widthPxChirho: 446,
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(LINE_38_RECOVERED_HEBREW_CHIRHO),
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho: LINE_38_VISION_NOTES_CHIRHO,
    },
    {
      ...apparatusSpanChirho,
      segmentIndexChirho: 2,
      xMinPxChirho: 535,
      widthPxChirho: 504,
      scriptChirho: "french-chirho",
      utf8TextChirho: "[B] M g(S) T // abr-elus : G",
    },
    { ...omSpanChirho, segmentIndexChirho: 3, xMinPxChirho: 1039, widthPxChirho: 54 },
    { ...slashSpanChirho, segmentIndexChirho: 4, xMinPxChirho: 1093, widthPxChirho: 36 },
    { ...licSpanChirho, segmentIndexChirho: 5, xMinPxChirho: 1129, widthPxChirho: 53 },
    { ...vulgateSpanChirho, segmentIndexChirho: 6, xMinPxChirho: 1182, widthPxChirho: 47 },
  ];
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

const TARGETS_CHIRHO: RepairTargetChirho[] = [
  {
    nameChirho: "vol1-p149-l11-chirho",
    pathChirho: LINE_11_PATH_CHIRHO,
    expectedRenderedChirho: LINE_11_EXPECTED_RENDERED_CHIRHO,
    repairedRenderedChirho: LINE_11_REPAIRED_RENDERED_CHIRHO,
    buildChirho: buildLine11Chirho,
  },
  {
    nameChirho: "vol1-p149-l38-chirho",
    pathChirho: LINE_38_PATH_CHIRHO,
    expectedRenderedChirho: LINE_38_EXPECTED_RENDERED_CHIRHO,
    repairedRenderedChirho: LINE_38_REPAIRED_RENDERED_CHIRHO,
    buildChirho: buildLine38Chirho,
  },
];

function visionVerdictForLine38Chirho(lineChirho: SpanLineChirho): VisionVerdictChirho {
  const recoveredSpanChirho = sortedSpansChirho(lineChirho).find(
    (spanChirho) => spanChirho.segmentIndexChirho === 1 && spanChirho.provenanceChirho === "vision-chirho"
  );
  if (recoveredSpanChirho === undefined) throw new Error("line 38 recovered vision Hebrew span missing");
  return {
    volumeChirho: 1,
    pageChirho: 149,
    lineIndexChirho: 38,
    segmentIndexChirho: 1,
    garbleTextChirho: "MY Un 723",
    scriptChirho: "hebrew-chirho",
    utf8TextChirho: normalizeTextForStorageChirho(recoveredSpanChirho.utf8TextChirho),
    notesChirho: recoveredSpanChirho.visionNotesChirho ?? LINE_38_VISION_NOTES_CHIRHO,
  };
}

function upsertVisionBackupChirho(line38Chirho: SpanLineChirho, appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) {
    throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  }
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) => !(candidateChirho.volumeChirho === 1 && candidateChirho.pageChirho === 149 && candidateChirho.lineIndexChirho === 38)
  );
  verdictsChirho.push(visionVerdictForLine38Chirho(line38Chirho));
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
  linesChirho: RepairReportChirho["linesChirho"]
): RepairReportChirho {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho,
    statusChirho,
    messagesChirho,
    linesChirho,
  };
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const modeChirho: RepairReportChirho["modeChirho"] = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const appliedAtChirho = new Date().toISOString();
  const plannedLinesChirho: RepairReportChirho["linesChirho"] = [];
  const writesChirho: Array<{ pathChirho: string; lineChirho: SpanLineChirho; nameChirho: string; stateChirho: string }> = [];

  for (const targetChirho of TARGETS_CHIRHO) {
    const lineChirho = loadJsonChirho<SpanLineChirho>(targetChirho.pathChirho);
    validateTilingChirho(lineChirho);
    const stateChirho = stateForLineChirho(lineChirho, targetChirho.expectedRenderedChirho, targetChirho.repairedRenderedChirho);
    if (stateChirho === "unknown-chirho") {
      console.log(
        JSON.stringify(
          reportChirho(
            modeChirho,
            "blocked-chirho",
            [
              `${targetChirho.nameChirho} is not in the expected pre-repair or already-applied state; refusing to guess around current edits`,
              `rendered line: ${JSON.stringify(renderedLineChirho(lineChirho))}`,
            ],
            [{ nameChirho: targetChirho.nameChirho, stateChirho, spansChirho: spanSummaryChirho(lineChirho) }]
          ),
          null,
          2
        )
      );
      process.exitCode = 1;
      return;
    }

    const plannedLineChirho = stateChirho === "already-applied-chirho" ? lineChirho : targetChirho.buildChirho(lineChirho, appliedAtChirho);
    plannedLinesChirho.push({
      nameChirho: targetChirho.nameChirho,
      stateChirho,
      spansChirho: spanSummaryChirho(plannedLineChirho),
    });
    writesChirho.push({ pathChirho: targetChirho.pathChirho, lineChirho: plannedLineChirho, nameChirho: targetChirho.nameChirho, stateChirho });
  }

  if (!applyChirho) {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          writesChirho.every((writeChirho) => writeChirho.stateChirho === "already-applied-chirho")
            ? "already-applied-chirho"
            : "planned-chirho",
          [
            "ready to remove vol 1 p149 L11 non-printed duplicate text and rewrite vol 1 p149 L38 as one widened vision-chirho Hebrew span",
          ],
          plannedLinesChirho
        ),
        null,
        2
      )
    );
    return;
  }

  for (const writeChirho of writesChirho) {
    writeJsonChirho(writeChirho.pathChirho, writeChirho.lineChirho);
  }
  const line38Chirho = writesChirho.find((writeChirho) => writeChirho.nameChirho === "vol1-p149-l38-chirho")?.lineChirho;
  if (line38Chirho === undefined) throw new Error("planned line 38 missing");
  const upsertCountChirho = upsertVisionBackupChirho(line38Chirho, appliedAtChirho);

  console.log(
    JSON.stringify(
      reportChirho(
        modeChirho,
        "applied-chirho",
        [
          `applied vol 1 p149 L11/L38 repair and upserted ${upsertCountChirho} durable vision verdict for L38`,
          "re-run export markdown, validate-pass-c-hebrew, both review packs, certification status, and hidden-Hebrew scan",
        ],
        writesChirho.map((writeChirho) => ({
          nameChirho: writeChirho.nameChirho,
          stateChirho: writeChirho.stateChirho,
          spansChirho: spanSummaryChirho(writeChirho.lineChirho),
        }))
      ),
      null,
      2
    )
  );
}

mainChirho();
