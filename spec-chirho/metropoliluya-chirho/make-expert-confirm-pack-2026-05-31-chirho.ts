// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Builds a compact reviewer packet for the remaining vision-tier transcription
// questions. The packet is generated under workspace-chirho so it can be
// regenerated without treating screenshots as source.

import { copyFileSync, mkdirSync, writeFileSync } from "fs";
import { join, relative } from "path";

const PROJECT_ROOT_CHIRHO = "/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho";
const SCANLINES_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "scanlines-chirho");
const OUT_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "expert-confirm-pack-chirho",
  "2026-05-31-chirho"
);
const IMAGE_DIR_CHIRHO = join(OUT_DIR_CHIRHO, "images-chirho");

interface ExpertConfirmItemChirho {
  idChirho: string;
  reviewerChirho: string;
  priorityChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineStartChirho: number;
  lineEndChirho?: number;
  spanRefsChirho: string[];
  currentTextChirho: string;
  questionChirho: string;
  sourceNoteChirho?: string;
}

interface GeneratedImageChirho {
  lineIndexChirho: number;
  sourcePathChirho: string;
  packetPathChirho: string;
  markdownPathChirho: string;
}

function paddedPageChirho(pageChirho: number): string {
  return String(pageChirho).padStart(4, "0");
}

function paddedLineChirho(lineChirho: number): string {
  return String(lineChirho).padStart(3, "0");
}

function scanlinePathChirho(itemChirho: ExpertConfirmItemChirho, lineChirho: number): string {
  return join(
    SCANLINES_ROOT_CHIRHO,
    `vol-${itemChirho.volumeChirho}-chirho`,
    `page-${paddedPageChirho(itemChirho.pageChirho)}-chirho`,
    `line-${paddedLineChirho(lineChirho)}-chirho.png`
  );
}

function packetImagePathChirho(itemChirho: ExpertConfirmItemChirho, lineChirho: number): string {
  return join(
    IMAGE_DIR_CHIRHO,
    `${itemChirho.idChirho}-vol-${itemChirho.volumeChirho}-page-${paddedPageChirho(itemChirho.pageChirho)}-line-${paddedLineChirho(lineChirho)}-chirho.png`
  );
}

function linesForItemChirho(itemChirho: ExpertConfirmItemChirho): number[] {
  const endChirho = itemChirho.lineEndChirho ?? itemChirho.lineStartChirho;
  const linesChirho: number[] = [];
  for (let lineChirho = itemChirho.lineStartChirho; lineChirho <= endChirho; lineChirho++) {
    linesChirho.push(lineChirho);
  }
  return linesChirho;
}

const ITEMS_CHIRHO: ExpertConfirmItemChirho[] = [
  {
    idChirho: "syriac-p69-job7-4-chirho",
    reviewerChirho: "Syriac reader",
    priorityChirho: "High",
    volumeChirho: 5,
    pageChirho: 69,
    lineStartChirho: 30,
    lineEndChirho: 31,
    spanRefsChirho: ["L30 S3", "L31 S0"],
    currentTextChirho: "ܘܡܳܫܰܚ / ܐ̱ܢܳܐ ܠܪܰܡܫܳܐ: ܘܫܳܟܶܒ ܐ̱ܢܳܐ. ܘܢܳܐܶܕ ܐ̱ܢܳܐ ܠܫܰܦܪܳܐ.",
    questionChirho: "Confirm exact Syriac letters, vowels, ̱ marks, punctuation, and the L30/L31 split against the printed Serto.",
    sourceNoteChirho: "The consonantal skeleton was cross-checked against Job 7:4 at https://www.peshitta.eu/ot/job/7.html, but the print remains the authority.",
  },
  {
    idChirho: "syriac-p50-job5-3-chirho",
    reviewerChirho: "Syriac reader",
    priorityChirho: "Medium",
    volumeChirho: 5,
    pageChirho: 50,
    lineStartChirho: 4,
    lineEndChirho: 5,
    spanRefsChirho: ["L4 S8", "L5 S0"],
    currentTextChirho: "ܘܳܐܒܕܳܐ / ܕܰܝܪܶܗ ܡܶܢ ܫܶܠܝ",
    questionChirho: "Confirm exact Syriac letters and vowels for the Job 5:3 Peshitta citation.",
  },
  {
    idChirho: "syriac-p53-peshitta-chirho",
    reviewerChirho: "Syriac reader",
    priorityChirho: "Medium",
    volumeChirho: 5,
    pageChirho: 53,
    lineStartChirho: 8,
    spanRefsChirho: ["L8 S1"],
    currentTextChirho: "ܘܠܗ ܢܫܩܠܘܢ ܙܝܢܬܢܐ",
    questionChirho: "Confirm exact Estrangela/Serto letters; both machine witnesses only certify script/context.",
  },
  {
    idChirho: "syriac-p66-job6-21-chirho",
    reviewerChirho: "Syriac reader",
    priorityChirho: "Medium",
    volumeChirho: 5,
    pageChirho: 66,
    lineStartChirho: 19,
    lineEndChirho: 20,
    spanRefsChirho: ["L19 S5", "L20 S2"],
    currentTextChirho: "ܘܳܐܦ ܐܰܢܬܽܘܢ ܗܘܰܝܬܽܘܢ ܥܠܰܝ / ܛܥܢܐ",
    questionChirho: "Confirm exact Syriac letters and vowels for the Job 6:21 note and the short Ambrosianus word.",
  },
  {
    idChirho: "arabic-p55-final-letter-chirho",
    reviewerChirho: "Arabist",
    priorityChirho: "High",
    volumeChirho: 5,
    pageChirho: 55,
    lineStartChirho: 32,
    spanRefsChirho: ["L32 S1"],
    currentTextChirho: "ضِمَار",
    questionChirho: "Confirm the final letter: ضِمَار vs ضِمَام vs ضِمَاد. Do not silently change without review.",
  },
  {
    idChirho: "arabic-p64-wakhiyya-chirho",
    reviewerChirho: "Arabist",
    priorityChirho: "Medium",
    volumeChirho: 5,
    pageChirho: 64,
    lineStartChirho: 16,
    spanRefsChirho: ["L16 S1"],
    currentTextChirho: "للمذيب من صاحبه الفضل / وخية الكافي يترك",
    questionChirho: "Confirm the word currently stored as وخية inside the Arabic line.",
  },
  {
    idChirho: "hebrew-p64-tushiyah-chirho",
    reviewerChirho: "Hebrew/WLC reviewer",
    priorityChirho: "Medium",
    volumeChirho: 5,
    pageChirho: 64,
    lineStartChirho: 18,
    spanRefsChirho: ["L18 S3"],
    currentTextChirho: "תוּשִׁיּה",
    questionChirho: "Confirm the vocalization against the print/WLC question; earlier alternatives included תּוּשִׁיָּה.",
  },
  {
    idChirho: "hebrew-p65-mas-chirho",
    reviewerChirho: "Hebrew/WLC reviewer",
    priorityChirho: "Medium",
    volumeChirho: 5,
    pageChirho: 65,
    lineStartChirho: 2,
    spanRefsChirho: ["L2 S5"],
    currentTextChirho: "מס",
    questionChirho: "Confirm this short Hebrew fragment during the WLC/human spot-check.",
  },
];

function generatePacketChirho(): void {
  mkdirSync(IMAGE_DIR_CHIRHO, { recursive: true });

  const manifestChirho = ITEMS_CHIRHO.map((itemChirho) => {
    const imagesChirho: GeneratedImageChirho[] = linesForItemChirho(itemChirho).map((lineChirho) => {
      const sourcePathChirho = scanlinePathChirho(itemChirho, lineChirho);
      const packetPathChirho = packetImagePathChirho(itemChirho, lineChirho);
      copyFileSync(sourcePathChirho, packetPathChirho);
      return {
        lineIndexChirho: lineChirho,
        sourcePathChirho,
        packetPathChirho,
        markdownPathChirho: relative(OUT_DIR_CHIRHO, packetPathChirho),
      };
    });
    return { ...itemChirho, imagesChirho };
  });

  const markdownChirho = [
    "<!-- For God so loved the world that he gave his only begotten Son,",
    "that whoever believes in him should not perish but have eternal life. John 3:16 -->",
    "",
    "# Expert Confirm Packet Chirho, 2026-05-31",
    "",
    "Use this packet to confirm the remaining `vision-chirho` items against the printed line images. Keep `vision-chirho` provenance unless an expert/human reviewer explicitly certifies the text.",
    "",
    "The strict Markdown export currently passes with `issues=0`, `unknownSpans=0`, and `d1GapPages=0`; these questions are semantic review items, not structural export blockers.",
    "",
    ...manifestChirho.flatMap((itemChirho) => [
      `## ${itemChirho.priorityChirho}: ${itemChirho.idChirho}`,
      "",
      `- Reviewer: ${itemChirho.reviewerChirho}`,
      `- Location: vol ${itemChirho.volumeChirho}, p${itemChirho.pageChirho}, ${itemChirho.spanRefsChirho.join(", ")}`,
      `- Current text: ${itemChirho.currentTextChirho}`,
      `- Question: ${itemChirho.questionChirho}`,
      ...(itemChirho.sourceNoteChirho ? [`- Source note: ${itemChirho.sourceNoteChirho}`] : []),
      "",
      ...itemChirho.imagesChirho.flatMap((imageChirho) => [
        `![${itemChirho.idChirho} line ${imageChirho.lineIndexChirho}](${imageChirho.markdownPathChirho})`,
        "",
      ]),
    ]),
  ].join("\n");

  writeFileSync(join(OUT_DIR_CHIRHO, "manifest-chirho.json"), `${JSON.stringify(manifestChirho, null, 2)}\n`);
  writeFileSync(join(OUT_DIR_CHIRHO, "index-chirho.md"), `${markdownChirho.trimEnd()}\n`);
  console.log(`wrote ${manifestChirho.length} expert-confirm item(s) to ${OUT_DIR_CHIRHO}`);
}

generatePacketChirho();
