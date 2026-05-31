// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Repair the next prose-quality layer in vol-5: pdftotext split small-caps
// names and a few remaining French ligature artifacts that pass strict export.
// This deliberately avoids sigla and ambiguous initials such as "B D E F" or
// "M MARGULIES".

import { readFileSync, readdirSync, writeFileSync } from "fs";
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

interface TextReplacementChirho {
  fromChirho: string;
  toChirho: string;
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

function allLinePathsChirho(): string[] {
  const pathsChirho: string[] = [];
  for (const pageDirChirho of readdirSync(VOL5_SPANS_ROOT_CHIRHO)) {
    if (!pageDirChirho.startsWith("page-")) continue;
    const pagePathChirho = join(VOL5_SPANS_ROOT_CHIRHO, pageDirChirho);
    for (const fileChirho of readdirSync(pagePathChirho)) {
      if (fileChirho.startsWith("line-") && fileChirho.endsWith("-chirho.json")) {
        pathsChirho.push(join(pagePathChirho, fileChirho));
      }
    }
  }
  return pathsChirho;
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

function mergeAdjacentSmallCapsTailChirho(lineChirho: LineChirho): boolean {
  let changedLineChirho = false;
  for (let indexChirho = 0; indexChirho < lineChirho.spansChirho.length - 1; indexChirho += 1) {
    const leftSpanChirho = lineChirho.spansChirho[indexChirho]!;
    const rightSpanChirho = lineChirho.spansChirho[indexChirho + 1]!;
    const matchChirho = leftSpanChirho.utf8TextChirho.match(/^(.*?)([A-ZÀÂÄÇÉÈÊËÎÏÔÖÛÜÆŒ])$/u);
    if (!matchChirho) continue;
    if (!/^[A-ZÀÂÄÇÉÈÊËÎÏÔÖÛÜÆŒ][A-ZÀÂÄÇÉÈÊËÎÏÔÖÛÜÆŒ]{1,}\b/u.test(rightSpanChirho.utf8TextChirho)) continue;

    const prefixChirho = matchChirho[1]!;
    const capitalChirho = matchChirho[2]!;
    if (prefixChirho !== "" && /\p{L}$/u.test(prefixChirho)) continue;
    const mergedTailChirho = rightSpanChirho.utf8TextChirho.startsWith(capitalChirho)
      ? rightSpanChirho.utf8TextChirho
      : `${capitalChirho}${rightSpanChirho.utf8TextChirho}`;
    leftSpanChirho.utf8TextChirho = `${prefixChirho}${mergedTailChirho}`;
    leftSpanChirho.widthPxChirho += rightSpanChirho.widthPxChirho;
    leftSpanChirho.scriptChirho = "french-chirho";
    leftSpanChirho.provenanceChirho = "vision-chirho";
    leftSpanChirho.visionTranscribedAtChirho = NOW_CHIRHO;
    lineChirho.spansChirho.splice(indexChirho + 1, 1);
    lineChirho.spansChirho = lineChirho.spansChirho.map((spanChirho, segmentIndexChirho) => ({
      ...spanChirho,
      segmentIndexChirho,
    }));
    changedLineChirho = true;
    indexChirho -= 1;
  }
  return changedLineChirho;
}

function applyAdjacentSmallCapsTailMergesChirho(): number {
  let changedLineCountChirho = 0;
  for (const pathChirho of allLinePathsChirho()) {
    const lineChirho = readLineChirho(pathChirho);
    if (!mergeAdjacentSmallCapsTailChirho(lineChirho)) continue;
    validateLineChirho(pathChirho, lineChirho);
    writeLineChirho(pathChirho, lineChirho);
    changedLineCountChirho += 1;
    console.log(`adjacent small-caps merge: ${pathChirho}`);
  }
  return changedLineCountChirho;
}

const TEXT_REPLACEMENTS_CHIRHO: TextReplacementChirho[] = [
  { fromChirho: "D E R OSSI", toChirho: "DE ROSSI" },
  { fromChirho: "DE R OSSI", toChirho: "DE ROSSI" },
  { fromChirho: "I BN E ZRA", toChirho: "IBN EZRA" },
  { fromChirho: "M ENA 0 EM", toChirho: "MENAḤEM" },
  { fromChirho: "Z ERA 0 IAH", toChirho: "ZERAḤIAH" },
  { fromChirho: "Q IM 0 I", toChirho: "QIMḤI" },
  { fromChirho: "HA -K OHEN", toChirho: "HA-KOHEN" },
  { fromChirho: "DE T RANI", toChirho: "DE TRANI" },
  { fromChirho: "DE M ARA", toChirho: "DE MARA" },
  { fromChirho: "BEN L AQISH", toChirho: "BEN LAQISH" },
  { fromChirho: "K AFA 0", toChirho: "KAFAḤ" },
  { fromChirho: "B ROCKINGTON", toChirho: "BROCKINGTON" },
  { fromChirho: "A BULWALID", toChirho: "ABULWALID" },
  { fromChirho: "A BRAHAM", toChirho: "ABRAHAM" },
  { fromChirho: "B ÖTTCHER", toChirho: "BÖTTCHER" },
  { fromChirho: "B UBER", toChirho: "BUBER" },
  { fromChirho: "B ÆR", toChirho: "BÆR" },
  { fromChirho: "B EER", toChirho: "BEER" },
  { fromChirho: "C APPEL", toChirho: "CAPPEL" },
  { fromChirho: "D AVID", toChirho: "DAVID" },
  { fromChirho: "D ELITZSCH", toChirho: "DELITZSCH" },
  { fromChirho: "D HORME", toChirho: "DHORME" },
  { fromChirho: "D ILLMANN", toChirho: "DILLMANN" },
  { fromChirho: "D ŒDERLEIN", toChirho: "DŒDERLEIN" },
  { fromChirho: "E LIAS", toChirho: "ELIAS" },
  { fromChirho: "E STIENNE", toChirho: "ESTIENNE" },
  { fromChirho: "E WALD", toChirho: "EWALD" },
  { fromChirho: "F OHRER", toChirho: "FOHRER" },
  { fromChirho: "G ADOLO", toChirho: "GADOLO" },
  { fromChirho: "G ESENIUS", toChirho: "GESENIUS" },
  { fromChirho: "G INSBURG", toChirho: "GINSBURG" },
  { fromChirho: "G RÆTZ", toChirho: "GRÆTZ" },
  { fromChirho: "G UILLAUME", toChirho: "GUILLAUME" },
  { fromChirho: "H ORST", toChirho: "HORST" },
  { fromChirho: "H OUBIGANT", toChirho: "HOUBIGANT" },
  { fromChirho: "I SAÏE", toChirho: "ISAÏE" },
  { fromChirho: "J OSEPH", toChirho: "JOSEPH" },
  { fromChirho: "K ENNICOTT", toChirho: "KENNICOTT" },
  { fromChirho: "K ŒNIG", toChirho: "KŒNIG" },
  { fromChirho: "K ÖNIG", toChirho: "KÖNIG" },
  { fromChirho: "L EVITA", toChirho: "LEVITA" },
  { fromChirho: "L EVY", toChirho: "LEVY" },
  { fromChirho: "L UTHER", toChirho: "LUTHER" },
  { fromChirho: "M ICHAELIS", toChirho: "MICHAELIS" },
  { fromChirho: "M ONTET", toChirho: "MONTET" },
  { fromChirho: "M OSHÉ", toChirho: "MOSHÉ" },
  { fromChirho: "M ERX", toChirho: "MERX" },
  { fromChirho: "N ORZI", toChirho: "NORZI" },
  { fromChirho: "O ORT", toChirho: "OORT" },
  { fromChirho: "O STY", toChirho: "OSTY" },
  { fromChirho: "P AGNINI", toChirho: "PAGNINI" },
  { fromChirho: "Q ARA", toChirho: "QARA" },
  { fromChirho: "R OSENMÜLLER", toChirho: "ROSENMÜLLER" },
  { fromChirho: "R ADAQ", toChirho: "RADAQ" },
  { fromChirho: "R ALBAG", toChirho: "RALBAG" },
  { fromChirho: "R ASHI", toChirho: "RASHI" },
  { fromChirho: "S AADYA", toChirho: "SAADYA" },
  { fromChirho: "S ARUQ", toChirho: "SARUQ" },
  { fromChirho: "S CHULTENS", toChirho: "SCHULTENS" },
  { fromChirho: "S EIGNEUR", toChirho: "SEIGNEUR" },
  { fromChirho: "S HIMÉON", toChirho: "SHIMÉON" },
  { fromChirho: "S IEGFRIED", toChirho: "SIEGFRIED" },
  { fromChirho: "S TEUERNAGEL", toChirho: "STEUERNAGEL" },
  { fromChirho: "T RANI", toChirho: "TRANI" },
  { fromChirho: "Y EIVIN", toChirho: "YEIVIN" },
  { fromChirho: "Y ÉFET", toChirho: "YÉFET" },
  { fromChirho: "GUILLAUMEDE MARA", toChirho: "GUILLAUME DE MARA" },
  { fromChirho: "SHIMÉONBEN LAQISH", toChirho: "SHIMÉON BEN LAQISH" },
  { fromChirho: "YÉFETBENÉLY", toChirho: "YÉFET BEN ÉLY" },
  { fromChirho: "/ ères", toChirho: "frères" },
  { fromChirho: "su * xe", toChirho: "suffixe" },
  { fromChirho: "su * re", toChirho: "suffire" },
  { fromChirho: "su * t", toChirho: "suffit" },
  { fromChirho: "/ oidure", toChirho: "froideur" },
  { fromChirho: "/ oids", toChirho: "froids" },
  { fromChirho: "/ oid", toChirho: "froid" },
  { fromChirho: "di fférence", toChirho: "différence" },
  { fromChirho: "di fférente", toChirho: "différente" },
];

const RANGE_REPAIRS_CHIRHO: RangeRepairChirho[] = [
  {
    pageChirho: "0055",
    lineChirho: "004",
    startIndexChirho: 2,
    endIndexChirho: 3,
    expectedRenderedChirho: ". D AVID BEN A BRAHAM",
    repairedRenderedChirho: ". DAVID BEN ABRAHAM",
    spansChirho: [{ xMinPxChirho: 1484, widthPxChirho: 771, scriptChirho: "french-chirho", utf8TextChirho: ". DAVID BEN ABRAHAM", visionChirho: true }],
  },
  {
    pageChirho: "0055",
    lineChirho: "009",
    startIndexChirho: 3,
    endIndexChirho: 5,
    expectedRenderedChirho: "I BN E ZRA , R ADAQ , M OSHÉ Q IM 0 I , R ALBAG et",
    repairedRenderedChirho: "IBN EZRA , RADAQ , MOSHÉ QIMḤI , RALBAG et",
    spansChirho: [{ xMinPxChirho: 762, widthPxChirho: 1509, scriptChirho: "french-chirho", utf8TextChirho: "IBN EZRA , RADAQ , MOSHÉ QIMḤI , RALBAG et", visionChirho: true }],
  },
  {
    pageChirho: "0055",
    lineChirho: "010",
    startIndexChirho: 0,
    endIndexChirho: 3,
    expectedRenderedChirho: "Z ERA 0 IAH G RACIAN le suivent, suivis à leur tour par P AGNINI",
    repairedRenderedChirho: "ZERAḤIAH GRACIAN le suivent, suivis à leur tour par PAGNINI",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 2075, scriptChirho: "french-chirho", utf8TextChirho: "ZERAḤIAH GRACIAN le suivent, suivis à leur tour par PAGNINI", visionChirho: true }],
  },
  {
    pageChirho: "0055",
    lineChirho: "015",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "“de / oids\"",
    repairedRenderedChirho: "“de froids\"",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 2275, scriptChirho: "french-chirho", utf8TextChirho: "partagent entre trois sens: “de boucliers” pour B D E F , “de froids\"", visionChirho: true }],
  },
  {
    pageChirho: "0055",
    lineChirho: "017",
    startIndexChirho: 0,
    endIndexChirho: 2,
    expectedRenderedChirho: "le sens “de / oids\" à M ENA 0 EM",
    repairedRenderedChirho: "le sens “de froids\" à MENAḤEM",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 2271, scriptChirho: "french-chirho", utf8TextChirho: "le sens “de froids\" à MENAḤEM . Or, selon tous les mss connus de sa", visionChirho: true }],
  },
  {
    pageChirho: "0055",
    lineChirho: "019",
    startIndexChirho: 0,
    endIndexChirho: 2,
    expectedRenderedChirho: "I SAÏE DE T RANI",
    repairedRenderedChirho: "ISAÏE DE TRANI",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 2275, scriptChirho: "french-chirho", utf8TextChirho: "l'on pourrait invoquer ce sens. ISAÏE DE TRANI explique qu'ils prendront", visionChirho: true }],
  },
  {
    pageChirho: "0055",
    lineChirho: "020",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "sont morts de / oid",
    repairedRenderedChirho: "sont morts de froid",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 1905, scriptChirho: "french-chirho", utf8TextChirho: "cela aux habitants de sa maison qui sont morts de froid", visionChirho: true }],
  },
  {
    pageChirho: "0055",
    lineChirho: "021",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "J OSEPH Q ARA a retenu, lui aussi ce sens de / oidure",
    repairedRenderedChirho: "JOSEPH QARA a retenu, lui aussi ce sens de froideur",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 1600, scriptChirho: "french-chirho", utf8TextChirho: "JOSEPH QARA a retenu, lui aussi ce sens de froideur", visionChirho: true }],
  },
  {
    pageChirho: "0058",
    lineChirho: "022",
    startIndexChirho: 0,
    endIndexChirho: 3,
    expectedRenderedChirho: "(selon B ROCKINGTON ) ont hérité à travers M ICHAELIS",
    repairedRenderedChirho: "(selon BROCKINGTON) ont hérité à travers MICHAELIS",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 1696, scriptChirho: "french-chirho", utf8TextChirho: "(selon BROCKINGTON) ont hérité à travers MICHAELIS", visionChirho: true }],
  },
  {
    pageChirho: "0062",
    lineChirho: "006",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "à la di fférence",
    repairedRenderedChirho: "à la différence",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 1262, scriptChirho: "french-chirho", utf8TextChirho: "Job veut dire par là que, à la différence", visionChirho: true }],
  },
  {
    pageChirho: "0064",
    lineChirho: "005",
    startIndexChirho: 0,
    endIndexChirho: 2,
    expectedRenderedChirho: "J OSEPH Q ARA et I SAÏE DE T RANI",
    repairedRenderedChirho: "JOSEPH QARA et ISAÏE DE TRANI",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 1000, scriptChirho: "french-chirho", utf8TextChirho: "JOSEPH QARA et ISAÏE DE TRANI .", visionChirho: true }],
  },
  {
    pageChirho: "0064",
    lineChirho: "031",
    startIndexChirho: 0,
    endIndexChirho: 2,
    expectedRenderedChirho: "I BN E ZRA et par M OSHÉ Q IM 0 I",
    repairedRenderedChirho: "IBN EZRA et par MOSHÉ QIMḤI",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 1963, scriptChirho: "french-chirho", utf8TextChirho: "démoralisation a été retenu par IBN EZRA et par MOSHÉ QIMḤI .", visionChirho: true }],
  },
  {
    pageChirho: "0064",
    lineChirho: "032",
    startIndexChirho: 0,
    endIndexChirho: 4,
    expectedRenderedChirho: "M OSHÉ HA -K OHEN suit une voie toute di fférente",
    repairedRenderedChirho: "MOSHÉ HA-KOHEN suit une voie toute différente",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 2046, scriptChirho: "french-chirho", utf8TextChirho: "MOSHÉ HA-KOHEN suit une voie toute différente en traduisant:", visionChirho: true }],
  },
  {
    pageChirho: "0065",
    lineChirho: "028",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "Selon B ROCKINGTON",
    repairedRenderedChirho: "Selon BROCKINGTON",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 855, scriptChirho: "french-chirho", utf8TextChirho: "me”. Selon BROCKINGTON", visionChirho: true }],
  },
  {
    pageChirho: "0069",
    lineChirho: "006",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "Selon B BROCKINGTON",
    repairedRenderedChirho: "Selon BROCKINGTON",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 638, scriptChirho: "french-chirho", utf8TextChirho: "Selon BROCKINGTON", visionChirho: true }],
  },
  {
    pageChirho: "0070",
    lineChirho: "023",
    startIndexChirho: 2,
    endIndexChirho: 3,
    expectedRenderedChirho: "S AADYA et Y ÉFET",
    repairedRenderedChirho: "SAADYA et YÉFET",
    spansChirho: [{ xMinPxChirho: 288, widthPxChirho: 1904, scriptChirho: "french-chirho", utf8TextChirho: "n'a évidemment pas le sens de ‘mesurer’. SAADYA et YÉFET", visionChirho: true }],
  },
  {
    pageChirho: "0070",
    lineChirho: "027",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "très di fférente",
    repairedRenderedChirho: "très différente",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 1606, scriptChirho: "french-chirho", utf8TextChirho: "cette exégèse de 4B et l'option très différente", visionChirho: true }],
  },
  {
    pageChirho: "0050",
    lineChirho: "016",
    startIndexChirho: 0,
    endIndexChirho: 2,
    expectedRenderedChirho: "Le comité a estimé n'avoir aucune base textuelle su * sante pour",
    repairedRenderedChirho: "Le comité a estimé n'avoir aucune base textuelle suffisante pour",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 2046, scriptChirho: "french-chirho", utf8TextChirho: "Le comité a estimé n'avoir aucune base textuelle suffisante pour", visionChirho: true }],
  },
  {
    pageChirho: "0054",
    lineChirho: "010",
    startIndexChirho: 0,
    endIndexChirho: 1,
    expectedRenderedChirho: "‘cages’ (ou aquariums) o ù",
    repairedRenderedChirho: "‘cages’ (ou aquariums) où",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 838, scriptChirho: "french-chirho", utf8TextChirho: "‘cages’ (ou aquariums) où", visionChirho: true }],
  },
  {
    pageChirho: "0055",
    lineChirho: "018",
    startIndexChirho: 0,
    endIndexChirho: 5,
    expectedRenderedChirho: "Ma \" beret , c'est le troisième sens de צן qui est constitué par Pr 25,13 o ù",
    repairedRenderedChirho: "Mabberet, c'est le troisième sens de צן qui est constitué par Pr 25,13 où",
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 1134, scriptChirho: "french-chirho", utf8TextChirho: "Mabberet, c'est le troisième sens de", visionChirho: true },
      { xMinPxChirho: 1134, widthPxChirho: 96, scriptChirho: "hebrew-chirho", utf8TextChirho: "צן", visionChirho: true },
      { xMinPxChirho: 1230, widthPxChirho: 1045, scriptChirho: "french-chirho", utf8TextChirho: "qui est constitué par Pr 25,13 où", visionChirho: true },
    ],
  },
  {
    pageChirho: "0057",
    lineChirho: "003",
    startIndexChirho: 2,
    endIndexChirho: 3,
    expectedRenderedChirho: "là et en Jb 5,7 (o ù",
    repairedRenderedChirho: "là et en Jb 5,7 (où",
    spansChirho: [{ xMinPxChirho: 739, widthPxChirho: 653, scriptChirho: "french-chirho", utf8TextChirho: "là et en Jb 5,7 (où", visionChirho: true }],
  },
  {
    pageChirho: "0064",
    lineChirho: "035",
    startIndexChirho: 0,
    endIndexChirho: 2,
    expectedRenderedChirho: "du Seigneur”). Pour justifier cette traduction, il a * rme d'abord que le",
    repairedRenderedChirho: "du Seigneur”). Pour justifier cette traduction, il affirme d'abord que le",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 2263, scriptChirho: "french-chirho", utf8TextChirho: "du Seigneur”). Pour justifier cette traduction, il affirme d'abord que le", visionChirho: true }],
  },
  {
    pageChirho: "0067",
    lineChirho: "021",
    startIndexChirho: 0,
    endIndexChirho: 7,
    expectedRenderedChirho: "of Ben Asher’s School in Yemen. A > er first examining its methods of section",
    repairedRenderedChirho: "of Ben Asher’s School in Yemen. After first examining its methods of section",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 2275, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "of Ben Asher’s School in Yemen. After first examining its methods of section", visionChirho: true }],
  },
  {
    pageChirho: "0067",
    lineChirho: "027",
    startIndexChirho: 0,
    endIndexChirho: 7,
    expectedRenderedChirho: "A. The use of \" a ḥaṭaf in non-guttural letters is rare. The spelling, especially of the",
    repairedRenderedChirho: "A. The use of ḥaṭaf in non-guttural letters is rare. The spelling, especially of the",
    spansChirho: [{ xMinPxChirho: 0, widthPxChirho: 2271, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "A. The use of ḥaṭaf in non-guttural letters is rare. The spelling, especially of the", visionChirho: true }],
  },
];

function applyInlineTextReplacementsChirho(): number {
  let changedLineCountChirho = 0;
  for (const pathChirho of allLinePathsChirho()) {
    const lineChirho = readLineChirho(pathChirho);
    let changedLineChirho = false;
    for (const spanChirho of lineChirho.spansChirho) {
      let nextTextChirho = spanChirho.utf8TextChirho;
      for (const replacementChirho of TEXT_REPLACEMENTS_CHIRHO) {
        nextTextChirho = nextTextChirho.split(replacementChirho.fromChirho).join(replacementChirho.toChirho);
      }
      if (nextTextChirho !== spanChirho.utf8TextChirho) {
        spanChirho.utf8TextChirho = nextTextChirho;
        spanChirho.provenanceChirho = "vision-chirho";
        spanChirho.visionTranscribedAtChirho = NOW_CHIRHO;
        changedLineChirho = true;
      }
    }
    if (changedLineChirho) {
      validateLineChirho(pathChirho, lineChirho);
      writeLineChirho(pathChirho, lineChirho);
      changedLineCountChirho += 1;
      console.log(`inline small-caps/prose repair: ${pathChirho}`);
    }
  }
  return changedLineCountChirho;
}

let rangeCountChirho = 0;
for (const repairChirho of RANGE_REPAIRS_CHIRHO) {
  if (applyRangeRepairChirho(repairChirho)) rangeCountChirho += 1;
}
const adjacentMergeCountChirho = applyAdjacentSmallCapsTailMergesChirho();
const inlineCountChirho = applyInlineTextReplacementsChirho();

console.log(
  `Completed small-caps/prose cleanup: ${rangeCountChirho} range repair(s), ${adjacentMergeCountChirho} adjacent merge line(s), ${inlineCountChirho} inline line(s).`
);
