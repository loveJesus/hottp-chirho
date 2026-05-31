// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Repair residual vol-5 prose OCR artifacts found after the small-caps pass.
// Each change is guarded by the current rendered line so this remains replayable.

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PROJECT_ROOT_CHIRHO = "/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho";
const VOL5_SPANS_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho", "vol-5-chirho");
const NOW_CHIRHO = new Date().toISOString();

interface SpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
  visionTranscribedAtChirho?: string;
  [keyChirho: string]: unknown;
}

interface LineChirho {
  lineWidthPxChirho: number;
  spansChirho: SpanChirho[];
  [keyChirho: string]: unknown;
}

interface ReplacementChirho {
  fromChirho: string;
  toChirho: string;
}

interface LineReplacementChirho {
  pageChirho: string;
  lineChirho: string;
  replacementsChirho: ReplacementChirho[];
}

interface NewSpanChirho {
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  visionChirho?: boolean;
}

interface RangeRepairChirho {
  pageChirho: string;
  lineChirho: string;
  startIndexChirho: number;
  endIndexChirho: number;
  expectedRenderedChirho: string;
  repairedRenderedChirho: string;
  spansChirho: NewSpanChirho[];
}

function linePathChirho(pageChirho: string, lineChirho: string): string {
  return join(VOL5_SPANS_ROOT_CHIRHO, `page-${pageChirho}-chirho`, `line-${lineChirho}-chirho.json`);
}

function readLineChirho(pathChirho: string): LineChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as LineChirho;
}

function writeLineChirho(pathChirho: string, lineChirho: LineChirho): void {
  writeFileSync(pathChirho, `${JSON.stringify(lineChirho, null, 2)}\n`);
}

function renderedLineChirho(lineChirho: LineChirho): string {
  return lineChirho.spansChirho.map((spanChirho) => spanChirho.utf8TextChirho).join(" ");
}

function validateLineChirho(pathChirho: string, lineChirho: LineChirho): void {
  let cursorChirho = 0;
  for (const [indexChirho, spanChirho] of lineChirho.spansChirho.entries()) {
    if (spanChirho.segmentIndexChirho !== indexChirho) {
      throw new Error(`${pathChirho}: segment index mismatch ${spanChirho.segmentIndexChirho} !== ${indexChirho}`);
    }
    if (spanChirho.xMinPxChirho !== cursorChirho) {
      throw new Error(`${pathChirho}: non-contiguous span at ${indexChirho}: got x=${spanChirho.xMinPxChirho}, expected ${cursorChirho}`);
    }
    cursorChirho += spanChirho.widthPxChirho;
  }
  if (cursorChirho !== lineChirho.lineWidthPxChirho) {
    throw new Error(`${pathChirho}: line tiling mismatch ${cursorChirho} !== ${lineChirho.lineWidthPxChirho}`);
  }
}

function visionSpanChirho(spanChirho: NewSpanChirho, segmentIndexChirho: number): SpanChirho {
  const nextSpanChirho: SpanChirho = {
    segmentIndexChirho,
    xMinPxChirho: spanChirho.xMinPxChirho,
    widthPxChirho: spanChirho.widthPxChirho,
    scriptChirho: spanChirho.scriptChirho,
    utf8TextChirho: spanChirho.utf8TextChirho,
  };
  if (spanChirho.visionChirho) {
    nextSpanChirho.provenanceChirho = "vision-chirho";
    nextSpanChirho.visionTranscribedAtChirho = NOW_CHIRHO;
  }
  return nextSpanChirho;
}

function applyLineReplacementChirho(repairChirho: LineReplacementChirho): boolean {
  const pathChirho = linePathChirho(repairChirho.pageChirho, repairChirho.lineChirho);
  const lineChirho = readLineChirho(pathChirho);
  let changedChirho = false;

  for (const replacementChirho of repairChirho.replacementsChirho) {
    if (!renderedLineChirho(lineChirho).includes(replacementChirho.fromChirho)) {
      if (renderedLineChirho(lineChirho).includes(replacementChirho.toChirho)) continue;
      throw new Error(`${pathChirho}: expected artifact not found: ${replacementChirho.fromChirho}`);
    }
    for (const spanChirho of lineChirho.spansChirho) {
      const nextTextChirho = spanChirho.utf8TextChirho.split(replacementChirho.fromChirho).join(replacementChirho.toChirho);
      if (nextTextChirho === spanChirho.utf8TextChirho) continue;
      spanChirho.utf8TextChirho = nextTextChirho;
      spanChirho.provenanceChirho = "vision-chirho";
      spanChirho.visionTranscribedAtChirho = NOW_CHIRHO;
      changedChirho = true;
    }
  }

  if (!changedChirho) {
    console.log(`already repaired: ${pathChirho}`);
    return false;
  }
  validateLineChirho(pathChirho, lineChirho);
  writeLineChirho(pathChirho, lineChirho);
  console.log(`line replacement: ${pathChirho}`);
  return true;
}

function applyRangeRepairChirho(repairChirho: RangeRepairChirho): boolean {
  const pathChirho = linePathChirho(repairChirho.pageChirho, repairChirho.lineChirho);
  const lineChirho = readLineChirho(pathChirho);
  const renderedBeforeChirho = renderedLineChirho(lineChirho);
  if (!renderedBeforeChirho.includes(repairChirho.expectedRenderedChirho)) {
    if (renderedBeforeChirho.includes(repairChirho.repairedRenderedChirho)) {
      console.log(`already repaired: ${pathChirho}`);
      return false;
    }
    throw new Error(`${pathChirho}: expected artifact not found: ${repairChirho.expectedRenderedChirho}`);
  }

  const oldSpansChirho = lineChirho.spansChirho.slice(repairChirho.startIndexChirho, repairChirho.endIndexChirho + 1);
  const oldStartChirho = oldSpansChirho[0]!.xMinPxChirho;
  const oldEndChirho = oldSpansChirho[oldSpansChirho.length - 1]!.xMinPxChirho + oldSpansChirho[oldSpansChirho.length - 1]!.widthPxChirho;
  const newStartChirho = repairChirho.spansChirho[0]!.xMinPxChirho;
  const newEndChirho =
    repairChirho.spansChirho[repairChirho.spansChirho.length - 1]!.xMinPxChirho +
    repairChirho.spansChirho[repairChirho.spansChirho.length - 1]!.widthPxChirho;
  if (oldStartChirho !== newStartChirho || oldEndChirho !== newEndChirho) {
    throw new Error(`${pathChirho}: replacement range ${newStartChirho}..${newEndChirho} does not match old range ${oldStartChirho}..${oldEndChirho}`);
  }

  lineChirho.spansChirho = [
    ...lineChirho.spansChirho.slice(0, repairChirho.startIndexChirho),
    ...repairChirho.spansChirho.map((spanChirho, indexChirho) => visionSpanChirho(spanChirho, repairChirho.startIndexChirho + indexChirho)),
    ...lineChirho.spansChirho.slice(repairChirho.endIndexChirho + 1),
  ].map((spanChirho, indexChirho) => ({ ...spanChirho, segmentIndexChirho: indexChirho }));

  validateLineChirho(pathChirho, lineChirho);
  writeLineChirho(pathChirho, lineChirho);
  console.log(`range repair: ${pathChirho} :: ${repairChirho.expectedRenderedChirho} -> ${repairChirho.repairedRenderedChirho}`);
  return true;
}

const LINE_REPLACEMENTS_CHIRHO: LineReplacementChirho[] = [
  {
    pageChirho: "0058",
    lineChirho: "018",
    replacementsChirho: [{ fromChirho: "hilfftfft", toChirho: "hilfft" }],
  },
  {
    pageChirho: "0064",
    lineChirho: "023",
    replacementsChirho: [{ fromChirho: "0 AYYUJ", toChirho: "ḤAYYUJ" }],
  },
  {
    pageChirho: "0148",
    lineChirho: "018",
    replacementsChirho: [{ fromChirho: "“ J Seulement", toChirho: "“(7) Seulement" }],
  },
  {
    pageChirho: "0148",
    lineChirho: "019",
    replacementsChirho: [{ fromChirho: " K /", toChirho: " (8) /" }],
  },
  {
    pageChirho: "0150",
    lineChirho: "012",
    replacementsChirho: [{ fromChirho: "sou 8 e", toChirho: "souffle" }],
  },
  {
    pageChirho: "0150",
    lineChirho: "017",
    replacementsChirho: [
      { fromChirho: "sou 8 e", toChirho: "souffle" },
      { fromChirho: "s'a % ole", toChirho: "s'affole" },
    ],
  },
  {
    pageChirho: "0151",
    lineChirho: "005",
    replacementsChirho: [{ fromChirho: "sou 8 e", toChirho: "souffle" }],
  },
  {
    pageChirho: "0151",
    lineChirho: "014",
    replacementsChirho: [{ fromChirho: "sou 8 e", toChirho: "souffle" }],
  },
];

const RANGE_REPAIRS_CHIRHO: RangeRepairChirho[] = [
  {
    pageChirho: "0058",
    lineChirho: "018",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "hil dem Armen von dem",
    repairedRenderedChirho: "hilfft dem Armen von dem",
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 180, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "hilfft", visionChirho: true },
      { xMinPxChirho: 180, widthPxChirho: 650, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "dem Armen von dem" },
    ],
  },
  {
    pageChirho: "0062",
    lineChirho: "017",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "e ffondré a droit",
    repairedRenderedChirho: "effondré a droit",
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 269, scriptChirho: "french-chirho", utf8TextChirho: "effondré", visionChirho: true },
    ],
  },
  {
    pageChirho: "0052",
    lineChirho: "015",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "est omis par 4 (espagnol, XV s.) ou transféré au ‘ . adé’",
    repairedRenderedChirho: "est omis par 4 (espagnol, XV s.) ou transféré au ‘ṣadé’",
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 2021, scriptChirho: "french-chirho", utf8TextChirho: "est omis par 4 (espagnol, XV s.) ou transféré au ‘ṣadé’", visionChirho: true },
    ],
  },
  {
    pageChirho: "0052",
    lineChirho: "029",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "Un ‘yod’ après le ‘ . adé’",
    repairedRenderedChirho: "Un ‘yod’ après le ‘ṣadé’",
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 767, scriptChirho: "french-chirho", utf8TextChirho: "Un ‘yod’ après le ‘ṣadé’", visionChirho: true },
    ],
  },
  {
    pageChirho: "0052",
    lineChirho: "035",
    startIndexChirho: 2,
    endIndexChirho: 3,
    expectedRenderedChirho: "a été maintenu dans le ‘ . adé’",
    repairedRenderedChirho: "a été maintenu dans le ‘ṣadé’",
    spansChirho: [
      { xMinPxChirho: 1156, widthPxChirho: 995, scriptChirho: "french-chirho", utf8TextChirho: "a été maintenu dans le ‘ṣadé’", visionChirho: true },
    ],
  },
  {
    pageChirho: "0053",
    lineChirho: "001",
    startIndexChirho: 4,
    endIndexChirho: 6,
    expectedRenderedChirho: "o ﬀ re:",
    repairedRenderedChirho: "offre:",
    spansChirho: [
      { xMinPxChirho: 1000, widthPxChirho: 205, scriptChirho: "french-chirho", utf8TextChirho: "offre:", visionChirho: true },
    ],
  },
  {
    pageChirho: "0053",
    lineChirho: "019",
    startIndexChirho: 2,
    endIndexChirho: 3,
    expectedRenderedChirho: "a o ﬀert",
    repairedRenderedChirho: "a offert",
    spansChirho: [
      { xMinPxChirho: 500, widthPxChirho: 250, scriptChirho: "french-chirho", utf8TextChirho: "a offert", visionChirho: true },
    ],
  },
  {
    pageChirho: "0053",
    lineChirho: "021",
    startIndexChirho: 4,
    endIndexChirho: 5,
    expectedRenderedChirho: "du ‘ . ṣadé",
    repairedRenderedChirho: "du ‘ṣadé’",
    spansChirho: [
      { xMinPxChirho: 1559, widthPxChirho: 287, scriptChirho: "french-chirho", utf8TextChirho: "du ‘ṣadé’", visionChirho: true },
    ],
  },
  {
    pageChirho: "0064",
    lineChirho: "022",
    startIndexChirho: 0,
    endIndexChirho: 0,
    expectedRenderedChirho: "comme fond ( S:OM ) la cire.”",
    repairedRenderedChirho: "comme fond ( يذوب ) la cire.”",
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 493, scriptChirho: "french-chirho", utf8TextChirho: "comme fond (", visionChirho: true },
      { xMinPxChirho: 493, widthPxChirho: 153, scriptChirho: "arabic-chirho", utf8TextChirho: "يذوب", visionChirho: true },
      { xMinPxChirho: 646, widthPxChirho: 242, scriptChirho: "french-chirho", utf8TextChirho: ") la cire.”", visionChirho: true },
    ],
  },
  {
    pageChirho: "0064",
    lineChirho: "017",
    startIndexChirho: 0,
    endIndexChirho: 2,
    expectedRenderedChirho: "premier stique: “Ce vs est lié à ce qui le précède. En e ff et, il y avait",
    repairedRenderedChirho: "premier stique: “Ce vs est lié à ce qui le précède. En effet, il y avait",
    spansChirho: [
      {
        xMinPxChirho: 0,
        widthPxChirho: 2271,
        scriptChirho: "french-chirho",
        utf8TextChirho: "premier stique: “Ce vs est lié à ce qui le précède. En effet, il y avait",
        visionChirho: true,
      },
    ],
  },
  {
    pageChirho: "0064",
    lineChirho: "026",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "s'agit d'un intransitif: “de celui qui est plus e ffondré que son prochain,",
    repairedRenderedChirho: "s'agit d'un intransitif: “de celui qui est plus effondré que son prochain,",
    spansChirho: [
      {
        xMinPxChirho: 0,
        widthPxChirho: 1692,
        scriptChirho: "french-chirho",
        utf8TextChirho: "s'agit d'un intransitif: “de celui qui est plus effondré",
        visionChirho: true,
      },
    ],
  },
  {
    pageChirho: "0065",
    lineChirho: "025",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "Co + ecturant כֵּן",
    repairedRenderedChirho: "Conjecturant כֵּן",
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 360, scriptChirho: "french-chirho", utf8TextChirho: "Conjecturant", visionChirho: true },
      { xMinPxChirho: 360, widthPxChirho: 182, scriptChirho: "hebrew-chirho", utf8TextChirho: "כֵּן", visionChirho: true },
    ],
  },
  {
    pageChirho: "0065",
    lineChirho: "018",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "pourra donc traduire: “À l'e ffondré sied la pitié de son prochain, /",
    repairedRenderedChirho: "pourra donc traduire: “À l'effondré sied la pitié de son prochain, /",
    spansChirho: [
      {
        xMinPxChirho: 0,
        widthPxChirho: 1191,
        scriptChirho: "french-chirho",
        utf8TextChirho: "pourra donc traduire: “À l'effondré",
        visionChirho: true,
      },
    ],
  },
];

let lineCountChirho = 0;
for (const replacementChirho of LINE_REPLACEMENTS_CHIRHO) {
  if (applyLineReplacementChirho(replacementChirho)) lineCountChirho += 1;
}

let rangeCountChirho = 0;
for (const repairChirho of RANGE_REPAIRS_CHIRHO) {
  if (applyRangeRepairChirho(repairChirho)) rangeCountChirho += 1;
}

console.log(`Completed residual vol-5 prose cleanup: ${lineCountChirho} line replacement(s), ${rangeCountChirho} range repair(s).`);
