// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Repair high-confidence French/Latin OCR artifacts that pass structural
// strictness but visibly corrupt the rendered Markdown: co+/conj, di*/diff,
// o ff/offre, / om/from, fi>/fifteenth, and hil>/hilft.

import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

const PROJECT_ROOT_CHIRHO = "/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho";
const SPANS_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
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

function pageLinePathChirho(pageChirho: string, lineChirho: string): string {
  return join(SPANS_ROOT_CHIRHO, "vol-5-chirho", `page-${pageChirho}-chirho`, `line-${lineChirho}-chirho.json`);
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

function allLinePathsChirho(rootChirho: string): string[] {
  const pathsChirho: string[] = [];
  for (const volDirChirho of readdirSync(rootChirho)) {
    if (!volDirChirho.startsWith("vol-")) continue;
    const volPathChirho = join(rootChirho, volDirChirho);
    for (const pageDirChirho of readdirSync(volPathChirho)) {
      if (!pageDirChirho.startsWith("page-")) continue;
      const pagePathChirho = join(volPathChirho, pageDirChirho);
      for (const fileChirho of readdirSync(pagePathChirho)) {
        if (fileChirho.startsWith("line-") && fileChirho.endsWith("-chirho.json")) {
          pathsChirho.push(join(pagePathChirho, fileChirho));
        }
      }
    }
  }
  return pathsChirho;
}

function markVisionIfChangedChirho(spanChirho: SpanChirho, nextTextChirho: string): boolean {
  if (nextTextChirho === spanChirho.utf8TextChirho) return false;
  spanChirho.utf8TextChirho = nextTextChirho;
  spanChirho.provenanceChirho = "vision-chirho";
  spanChirho.visionTranscribedAtChirho = NOW_CHIRHO;
  return true;
}

function applyInlineConjectureRepairsChirho(): number {
  let changedCountChirho = 0;
  for (const pathChirho of allLinePathsChirho(SPANS_ROOT_CHIRHO)) {
    const lineChirho = readLineChirho(pathChirho);
    let changedLineChirho = false;
    for (const spanChirho of lineChirho.spansChirho) {
      const nextTextChirho = spanChirho.utf8TextChirho
        .replace(/co \+ ectur/g, "conjectur")
        .replace(/co \+ njectur/g, "conjectur")
        .replace(/co \+ jectur/g, "conjectur");
      changedLineChirho = markVisionIfChangedChirho(spanChirho, nextTextChirho) || changedLineChirho;
    }
    if (changedLineChirho) {
      validateLineChirho(pathChirho, lineChirho);
      writeLineChirho(pathChirho, lineChirho);
      changedCountChirho += 1;
      console.log(`inline conjecture repair: ${pathChirho}`);
    }
  }
  return changedCountChirho;
}

function applyRangeRepairChirho(repairChirho: RangeRepairChirho): boolean {
  const pathChirho = pageLinePathChirho(repairChirho.pageChirho, repairChirho.lineChirho);
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
  if (oldSpansChirho.length === 0) throw new Error(`${pathChirho}: empty repair range`);
  const oldStartChirho = oldSpansChirho[0]!.xMinPxChirho;
  const oldEndChirho = oldSpansChirho[oldSpansChirho.length - 1]!.xMinPxChirho + oldSpansChirho[oldSpansChirho.length - 1]!.widthPxChirho;
  const newStartChirho = repairChirho.spansChirho[0]!.xMinPxChirho;
  const newEndChirho =
    repairChirho.spansChirho[repairChirho.spansChirho.length - 1]!.xMinPxChirho +
    repairChirho.spansChirho[repairChirho.spansChirho.length - 1]!.widthPxChirho;
  if (oldStartChirho !== newStartChirho || oldEndChirho !== newEndChirho) {
    throw new Error(`${pathChirho}: replacement range ${newStartChirho}..${newEndChirho} does not match old range ${oldStartChirho}..${oldEndChirho}`);
  }

  const nextSpansChirho = [
    ...lineChirho.spansChirho.slice(0, repairChirho.startIndexChirho),
    ...repairChirho.spansChirho.map((spanChirho, indexChirho) => visionSpanChirho(spanChirho, repairChirho.startIndexChirho + indexChirho)),
    ...lineChirho.spansChirho.slice(repairChirho.endIndexChirho + 1),
  ].map((spanChirho, indexChirho) => ({ ...spanChirho, segmentIndexChirho: indexChirho }));

  lineChirho.spansChirho = nextSpansChirho;
  validateLineChirho(pathChirho, lineChirho);
  writeLineChirho(pathChirho, lineChirho);
  console.log(`range repair: ${pathChirho} :: ${repairChirho.expectedRenderedChirho} -> ${repairChirho.repairedRenderedChirho}`);
  return true;
}

const RANGE_REPAIRS_CHIRHO: RangeRepairChirho[] = [
  {
    pageChirho: "0050",
    lineChirho: "004",
    startIndexChirho: 5,
    endIndexChirho: 7,
    expectedRenderedChirho: "o ff re:",
    repairedRenderedChirho: "offre:",
    spansChirho: [{ xMinPxChirho: 1805, widthPxChirho: 191, scriptChirho: "french-chirho", utf8TextChirho: "offre:", visionChirho: true }],
  },
  {
    pageChirho: "0051",
    lineChirho: "012",
    startIndexChirho: 3,
    endIndexChirho: 4,
    expectedRenderedChirho: "/ om the panniers",
    repairedRenderedChirho: "from the panniers",
    spansChirho: [{ xMinPxChirho: 900, widthPxChirho: 676, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "from the panniers”,", visionChirho: true }],
  },
  {
    pageChirho: "0051",
    lineChirho: "014",
    startIndexChirho: 1,
    endIndexChirho: 3,
    expectedRenderedChirho: "co + jecture מְשַׁנִּים",
    repairedRenderedChirho: "conjecture מְשַׁנִּים",
    spansChirho: [
      { xMinPxChirho: 641, widthPxChirho: 384, scriptChirho: "french-chirho", utf8TextChirho: "conjecture", visionChirho: true },
      { xMinPxChirho: 1025, widthPxChirho: 225, scriptChirho: "hebrew-chirho", utf8TextChirho: "מְשַׁנִּים", visionChirho: true },
    ],
  },
  {
    pageChirho: "0051",
    lineChirho: "026",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "Il est di * fficile",
    repairedRenderedChirho: "Il est difficile",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 793, scriptChirho: "french-chirho", utf8TextChirho: "5,5AB. — Il est difficile", visionChirho: true }],
  },
  {
    pageChirho: "0051",
    lineChirho: "026",
    startIndexChirho: 2,
    endIndexChirho: 4,
    expectedRenderedChirho: "co + njecture",
    repairedRenderedChirho: "conjecture",
    spansChirho: [{ xMinPxChirho: 1506, widthPxChirho: 327, scriptChirho: "french-chirho", utf8TextChirho: "conjecture", visionChirho: true }],
  },
  {
    pageChirho: "0054",
    lineChirho: "001",
    startIndexChirho: 2,
    endIndexChirho: 4,
    expectedRenderedChirho: "o ff re en 5,5",
    repairedRenderedChirho: "offre en 5,5",
    spansChirho: [{ xMinPxChirho: 188, widthPxChirho: 535, scriptChirho: "french-chirho", utf8TextChirho: "offre en 5,5: “et", visionChirho: true }],
  },
  {
    pageChirho: "0056",
    lineChirho: "016",
    startIndexChirho: 3,
    endIndexChirho: 5,
    expectedRenderedChirho: "co + njecture",
    repairedRenderedChirho: "conjecture",
    spansChirho: [{ xMinPxChirho: 1730, widthPxChirho: 320, scriptChirho: "french-chirho", utf8TextChirho: "conjecture", visionChirho: true }],
  },
  {
    pageChirho: "0056",
    lineChirho: "020",
    startIndexChirho: 1,
    endIndexChirho: 3,
    expectedRenderedChirho: "co + njecture",
    repairedRenderedChirho: "conjecture",
    spansChirho: [{ xMinPxChirho: 120, widthPxChirho: 391, scriptChirho: "french-chirho", utf8TextChirho: "conjecture", visionChirho: true }],
  },
  {
    pageChirho: "0057",
    lineChirho: "013",
    startIndexChirho: 1,
    endIndexChirho: 3,
    expectedRenderedChirho: "co + njecturale",
    repairedRenderedChirho: "conjecturale",
    spansChirho: [{ xMinPxChirho: 526, widthPxChirho: 408, scriptChirho: "french-chirho", utf8TextChirho: "conjecturale", visionChirho: true }],
  },
  {
    pageChirho: "0058",
    lineChirho: "004",
    startIndexChirho: 2,
    endIndexChirho: 4,
    expectedRenderedChirho: "o ff re ici:",
    repairedRenderedChirho: "offre ici:",
    spansChirho: [{ xMinPxChirho: 198, widthPxChirho: 277, scriptChirho: "french-chirho", utf8TextChirho: "offre ici:", visionChirho: true }],
  },
  {
    pageChirho: "0058",
    lineChirho: "005",
    startIndexChirho: 0,
    endIndexChirho: 3,
    expectedRenderedChirho: "Disant co + ecturer",
    repairedRenderedChirho: "Disant conjecturer",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 622, scriptChirho: "french-chirho", utf8TextChirho: "Disant conjecturer", visionChirho: true }],
  },
  {
    pageChirho: "0058",
    lineChirho: "006",
    startIndexChirho: 2,
    endIndexChirho: 3,
    expectedRenderedChirho: "/ om their mouth",
    repairedRenderedChirho: "from their mouth",
    spansChirho: [{ xMinPxChirho: 1246, widthPxChirho: 628, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "from their mouth,", visionChirho: true }],
  },
  {
    pageChirho: "0058",
    lineChirho: "007",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "/ om the hand",
    repairedRenderedChirho: "from the hand",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 1024, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "from the hand of the mighty”.", visionChirho: true }],
  },
  {
    pageChirho: "0058",
    lineChirho: "008",
    startIndexChirho: 2,
    endIndexChirho: 3,
    expectedRenderedChirho: "/ om the sword",
    repairedRenderedChirho: "from the sword",
    spansChirho: [{ xMinPxChirho: 1034, widthPxChirho: 1028, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "from the sword of their mouth,", visionChirho: true }],
  },
  {
    pageChirho: "0058",
    lineChirho: "008",
    startIndexChirho: 3,
    endIndexChirho: 4,
    expectedRenderedChirho: "/ / om",
    repairedRenderedChirho: "/ from",
    spansChirho: [{ xMinPxChirho: 2062, widthPxChirho: 213, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "/ from", visionChirho: true }],
  },
  {
    pageChirho: "0058",
    lineChirho: "014",
    startIndexChirho: 2,
    endIndexChirho: 3,
    expectedRenderedChirho: "/ om their greed",
    repairedRenderedChirho: "from their greed",
    spansChirho: [{ xMinPxChirho: 1171, widthPxChirho: 592, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "from their greed,", visionChirho: true }],
  },
  {
    pageChirho: "0058",
    lineChirho: "015",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "/ om the grip",
    repairedRenderedChirho: "from the grip",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 300, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "from the", visionChirho: true }],
  },
  {
    pageChirho: "0058",
    lineChirho: "016",
    startIndexChirho: 0,
    endIndexChirho: 2,
    expectedRenderedChirho: "RL o ff re:",
    repairedRenderedChirho: "RL offre:",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 829, scriptChirho: "french-chirho", utf8TextChirho: "Sans note, RL offre: “Er", visionChirho: true }],
  },
  {
    pageChirho: "0058",
    lineChirho: "016",
    startIndexChirho: 1,
    endIndexChirho: 2,
    expectedRenderedChirho: "hil > dem",
    repairedRenderedChirho: "hilft dem",
    spansChirho: [{ xMinPxChirho: 829, widthPxChirho: 171, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "hilft", visionChirho: true }],
  },
  {
    pageChirho: "0058",
    lineChirho: "025",
    startIndexChirho: 0,
    endIndexChirho: 2,
    expectedRenderedChirho: "co + ecture",
    repairedRenderedChirho: "conjecture",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 353, scriptChirho: "french-chirho", utf8TextChirho: "conjecture", visionChirho: true }],
  },
  {
    pageChirho: "0058",
    lineChirho: "026",
    startIndexChirho: 3,
    endIndexChirho: 5,
    expectedRenderedChirho: "co + ecture",
    repairedRenderedChirho: "conjecture",
    spansChirho: [{ xMinPxChirho: 1338, widthPxChirho: 378, scriptChirho: "french-chirho", utf8TextChirho: "conjecture", visionChirho: true }],
  },
  {
    pageChirho: "0060",
    lineChirho: "005",
    startIndexChirho: 1,
    endIndexChirho: 3,
    expectedRenderedChirho: "co + ecturer: לִשְׁרַב וְלִכְפֹר",
    repairedRenderedChirho: "conjecturer: לִשְׁרַב וְלִכְפֹר",
    spansChirho: [
      { xMinPxChirho: 914, widthPxChirho: 406, scriptChirho: "french-chirho", utf8TextChirho: "conjecturer:", visionChirho: true },
      { xMinPxChirho: 1320, widthPxChirho: 443, scriptChirho: "hebrew-chirho", utf8TextChirho: "לִשְׁרַב וְלִכְפֹר", visionChirho: true },
    ],
  },
  {
    pageChirho: "0060",
    lineChirho: "010",
    startIndexChirho: 0,
    endIndexChirho: 2,
    expectedRenderedChirho: "co + ecturé",
    repairedRenderedChirho: "conjecturé",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 358, scriptChirho: "french-chirho", utf8TextChirho: "conjecturé", visionChirho: true }],
  },
  {
    pageChirho: "0061",
    lineChirho: "009",
    startIndexChirho: 2,
    endIndexChirho: 4,
    expectedRenderedChirho: "o ff re ici un",
    repairedRenderedChirho: "offre ici un",
    spansChirho: [{ xMinPxChirho: 200, widthPxChirho: 382, scriptChirho: "french-chirho", utf8TextChirho: "offre ici un", visionChirho: true }],
  },
  {
    pageChirho: "0061",
    lineChirho: "011",
    startIndexChirho: 1,
    endIndexChirho: 2,
    expectedRenderedChirho: "co + ecture",
    repairedRenderedChirho: "conjecture",
    spansChirho: [{ xMinPxChirho: 139, widthPxChirho: 1419, scriptChirho: "french-chirho", utf8TextChirho: "conjecture, NEB a omis le stique “I have", visionChirho: true }],
  },
  {
    pageChirho: "0062",
    lineChirho: "015",
    startIndexChirho: 1,
    endIndexChirho: 5,
    expectedRenderedChirho: "“Devotion is due / om his / iends",
    repairedRenderedChirho: "“Devotion is due from his friends",
    spansChirho: [{ xMinPxChirho: 1053, widthPxChirho: 1097, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "“Devotion is due from his friends", visionChirho: true }],
  },
  {
    pageChirho: "0062",
    lineChirho: "023",
    startIndexChirho: 2,
    endIndexChirho: 5,
    expectedRenderedChirho: "/ om a / iend",
    repairedRenderedChirho: "from a friend",
    spansChirho: [{ xMinPxChirho: 1500, widthPxChirho: 515, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "from a friend", visionChirho: true }],
  },
  {
    pageChirho: "0063",
    lineChirho: "005",
    startIndexChirho: 3,
    endIndexChirho: 5,
    expectedRenderedChirho: "co + ecturé מָנַע",
    repairedRenderedChirho: "conjecturé מָנַע",
    spansChirho: [
      { xMinPxChirho: 384, widthPxChirho: 330, scriptChirho: "french-chirho", utf8TextChirho: "conjecturé", visionChirho: true },
      { xMinPxChirho: 714, widthPxChirho: 157, scriptChirho: "hebrew-chirho", utf8TextChirho: "מָנַע", visionChirho: true },
    ],
  },
  {
    pageChirho: "0063",
    lineChirho: "024",
    startIndexChirho: 2,
    endIndexChirho: 4,
    expectedRenderedChirho: "o ff re une interprétation",
    repairedRenderedChirho: "offre une interprétation",
    spansChirho: [{ xMinPxChirho: 175, widthPxChirho: 1805, scriptChirho: "french-chirho", utf8TextChirho: "offre une interprétation qui est très proche de celle de la", visionChirho: true }],
  },
  {
    pageChirho: "0063",
    lineChirho: "026",
    startIndexChirho: 2,
    endIndexChirho: 4,
    expectedRenderedChirho: "o ff re:",
    repairedRenderedChirho: "offre:",
    spansChirho: [{ xMinPxChirho: 221, widthPxChirho: 217, scriptChirho: "french-chirho", utf8TextChirho: "offre:", visionChirho: true }],
  },
  {
    pageChirho: "0065",
    lineChirho: "028",
    startIndexChirho: 3,
    endIndexChirho: 5,
    expectedRenderedChirho: "co + ecture כֵּן",
    repairedRenderedChirho: "conjecture כֵּן",
    spansChirho: [
      { xMinPxChirho: 1146, widthPxChirho: 364, scriptChirho: "french-chirho", utf8TextChirho: "conjecture", visionChirho: true },
      { xMinPxChirho: 1510, widthPxChirho: 132, scriptChirho: "hebrew-chirho", utf8TextChirho: "כֵּן", visionChirho: true },
    ],
  },
  {
    pageChirho: "0066",
    lineChirho: "017",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "Il est di * cile",
    repairedRenderedChirho: "Il est difficile",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 491, scriptChirho: "french-chirho", utf8TextChirho: "Il est difficile", visionChirho: true }],
  },
  {
    pageChirho: "0066",
    lineChirho: "019",
    startIndexChirho: 2,
    endIndexChirho: 4,
    expectedRenderedChirho: "o ffre re ici:",
    repairedRenderedChirho: "offre ici:",
    spansChirho: [{ xMinPxChirho: 246, widthPxChirho: 359, scriptChirho: "french-chirho", utf8TextChirho: "offre ici:", visionChirho: true }],
  },
  {
    pageChirho: "0067",
    lineChirho: "010",
    startIndexChirho: 2,
    endIndexChirho: 4,
    expectedRenderedChirho: "qu'o ff re le ms",
    repairedRenderedChirho: "qu'offre le ms",
    spansChirho: [{ xMinPxChirho: 900, widthPxChirho: 1375, scriptChirho: "french-chirho", utf8TextChirho: "(occidentaux) est celle qu'offre le ms F. Or", visionChirho: true }],
  },
  {
    pageChirho: "0067",
    lineChirho: "019",
    startIndexChirho: 5,
    endIndexChirho: 6,
    expectedRenderedChirho: "or fi > eenth",
    repairedRenderedChirho: "or fifteenth",
    spansChirho: [{ xMinPxChirho: 1939, widthPxChirho: 336, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "or fifteenth", visionChirho: true }],
  },
  {
    pageChirho: "0067",
    lineChirho: "023",
    startIndexChirho: 7,
    endIndexChirho: 8,
    expectedRenderedChirho: "original MS / om which",
    repairedRenderedChirho: "original MS from which",
    spansChirho: [{ xMinPxChirho: 1358, widthPxChirho: 913, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "original MS from which this was", visionChirho: true }],
  },
  {
    pageChirho: "0068",
    lineChirho: "010",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "pour o ffrir",
    repairedRenderedChirho: "pour offrir",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 1241, scriptChirho: "french-chirho", utf8TextChirho: "Cm. Tous deux s'accordent pour offrir", visionChirho: true }],
  },
  {
    pageChirho: "0068",
    lineChirho: "018",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "données o ffertes",
    repairedRenderedChirho: "données offertes",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 2271, scriptChirho: "french-chirho", utf8TextChirho: "1977 notre Compte rendu préliminaire . Les nouvelles données offertes", visionChirho: true }],
  },
  {
    pageChirho: "0068",
    lineChirho: "028",
    startIndexChirho: 2,
    endIndexChirho: 4,
    expectedRenderedChirho: "o ff re:",
    repairedRenderedChirho: "offre:",
    spansChirho: [{ xMinPxChirho: 680, widthPxChirho: 220, scriptChirho: "french-chirho", utf8TextChirho: "offre:", visionChirho: true }],
  },
  {
    pageChirho: "0068",
    lineChirho: "030",
    startIndexChirho: 3,
    endIndexChirho: 5,
    expectedRenderedChirho: "co + ecturer וּמֵדַב",
    repairedRenderedChirho: "conjecturer וּמֵדַב",
    spansChirho: [
      { xMinPxChirho: 1178, widthPxChirho: 340, scriptChirho: "french-chirho", utf8TextChirho: "conjecturer", visionChirho: true },
      { xMinPxChirho: 1518, widthPxChirho: 220, scriptChirho: "hebrew-chirho", utf8TextChirho: "וּמֵדַב", visionChirho: true },
    ],
  },
  {
    pageChirho: "0069",
    lineChirho: "028",
    startIndexChirho: 2,
    endIndexChirho: 4,
    expectedRenderedChirho: "o ff re:",
    repairedRenderedChirho: "offre:",
    spansChirho: [{ xMinPxChirho: 200, widthPxChirho: 366, scriptChirho: "french-chirho", utf8TextChirho: "offre: “si", visionChirho: true }],
  },
  {
    pageChirho: "0070",
    lineChirho: "006",
    startIndexChirho: 2,
    endIndexChirho: 2,
    expectedRenderedChirho: "le di *",
    repairedRenderedChirho: "le difficile",
    spansChirho: [{ xMinPxChirho: 488, widthPxChirho: 233, scriptChirho: "french-chirho", utf8TextChirho: "le difficile", visionChirho: true }],
  },
  {
    pageChirho: "0070",
    lineChirho: "022",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "La principale di * culté",
    repairedRenderedChirho: "La principale difficulté",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 749, scriptChirho: "french-chirho", utf8TextChirho: "La principale difficulté", visionChirho: true }],
  },
  {
    pageChirho: "0149",
    lineChirho: "004",
    startIndexChirho: 0,
    endIndexChirho: 2,
    expectedRenderedChirho: "[N]RSV o ff re:",
    repairedRenderedChirho: "[N]RSV offre:",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 684, scriptChirho: "french-chirho", utf8TextChirho: "[N]RSV offre: “My /", visionChirho: true }],
  },
  {
    pageChirho: "0149",
    lineChirho: "017",
    startIndexChirho: 1,
    endIndexChirho: 3,
    expectedRenderedChirho: "ce qu'o ff re ici",
    repairedRenderedChirho: "ce qu'offre ici",
    spansChirho: [{ xMinPxChirho: 1413, widthPxChirho: 612, scriptChirho: "french-chirho", utf8TextChirho: "est ce qu'offre ici la", visionChirho: true }],
  },
  {
    pageChirho: "0150",
    lineChirho: "013",
    startIndexChirho: 0,
    endIndexChirho: 2,
    expectedRenderedChirho: "[N]RSV o ff re:",
    repairedRenderedChirho: "[N]RSV offre:",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 637, scriptChirho: "french-chirho", utf8TextChirho: "[N]RSV offre: “My", visionChirho: true }],
  },
  {
    pageChirho: "0150",
    lineChirho: "026",
    startIndexChirho: 2,
    endIndexChirho: 4,
    expectedRenderedChirho: "o ff re:",
    repairedRenderedChirho: "offre:",
    spansChirho: [{ xMinPxChirho: 180, widthPxChirho: 208, scriptChirho: "french-chirho", utf8TextChirho: "offre:", visionChirho: true }],
  },
];

const inlineCountChirho = applyInlineConjectureRepairsChirho();
let rangeCountChirho = 0;
for (const repairChirho of RANGE_REPAIRS_CHIRHO) {
  if (applyRangeRepairChirho(repairChirho)) rangeCountChirho += 1;
}

console.log(`Completed semantic Latin/French OCR cleanup: ${inlineCountChirho} inline line(s), ${rangeCountChirho} range repair(s).`);
