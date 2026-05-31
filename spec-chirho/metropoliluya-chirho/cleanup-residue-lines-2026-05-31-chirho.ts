// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Clean up the remaining vol-5 Arabic/French residue where pdftotext produced
// phantom unknown spans inside otherwise legible lines. These are line-level
// repairs, so a simple per-span verdict cannot express the correct result.

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT_CHIRHO = "/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/spans-chirho/vol-5-chirho";
const NOW_CHIRHO = new Date().toISOString();

interface NewSpanChirho {
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  visionChirho?: boolean;
}

interface RebuildSpecChirho {
  pageChirho: string;
  lineChirho: string;
  lineWidthPxChirho: number;
  spansChirho: NewSpanChirho[];
}

function rebuildLineChirho(specChirho: RebuildSpecChirho): void {
  const pathChirho = join(ROOT_CHIRHO, `page-${specChirho.pageChirho}-chirho`, `line-${specChirho.lineChirho}-chirho.json`);
  const lineChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as Record<string, unknown>;
  lineChirho.spansChirho = specChirho.spansChirho.map((spanChirho, indexChirho) => {
    const nextSpanChirho: Record<string, unknown> = {
      segmentIndexChirho: indexChirho,
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
  });

  let cursorChirho = 0;
  for (const spanChirho of lineChirho.spansChirho as Array<{ xMinPxChirho: number; widthPxChirho: number }>) {
    if (spanChirho.xMinPxChirho !== cursorChirho) {
      throw new Error(`non-contiguous span in ${pathChirho}: got x=${spanChirho.xMinPxChirho}, expected x=${cursorChirho}`);
    }
    cursorChirho += spanChirho.widthPxChirho;
  }
  if (cursorChirho !== specChirho.lineWidthPxChirho) {
    throw new Error(`line width mismatch in ${pathChirho}: got ${cursorChirho}, expected ${specChirho.lineWidthPxChirho}`);
  }

  writeFileSync(pathChirho, `${JSON.stringify(lineChirho, null, 2)}\n`);
  console.log(`${specChirho.pageChirho}/L${specChirho.lineChirho}: rebuilt ${specChirho.spansChirho.length} spans`);
}

const SPECS_CHIRHO: RebuildSpecChirho[] = [
  {
    pageChirho: "0054",
    lineChirho: "031",
    lineWidthPxChirho: 2050,
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 730, scriptChirho: "french-chirho", utf8TextChirho: "Pour traduire ces mots" },
      { xMinPxChirho: 730, widthPxChirho: 366, scriptChirho: "hebrew-chirho", utf8TextChirho: "וְאֶל־מְצִנִּים", visionChirho: true },
      { xMinPxChirho: 1096, widthPxChirho: 121, scriptChirho: "french-chirho", utf8TextChirho: "par" },
      { xMinPxChirho: 1217, widthPxChirho: 358, scriptChirho: "arabic-chirho", utf8TextChirho: "ومن بين المسالّ", visionChirho: true },
      { xMinPxChirho: 1575, widthPxChirho: 475, scriptChirho: "french-chirho", utf8TextChirho: ", SAADYA se" },
    ],
  },
  {
    pageChirho: "0054",
    lineChirho: "032",
    lineWidthPxChirho: 2275,
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 967, scriptChirho: "french-chirho", utf8TextChirho: "réfère à Nb 33,55 où il traduit" },
      { xMinPxChirho: 967, widthPxChirho: 267, scriptChirho: "hebrew-chirho", utf8TextChirho: "וְלִצְנִינִם", visionChirho: true },
      { xMinPxChirho: 1234, widthPxChirho: 121, scriptChirho: "french-chirho", utf8TextChirho: "par" },
      { xMinPxChirho: 1355, widthPxChirho: 129, scriptChirho: "arabic-chirho", utf8TextChirho: "وكمسالّ", visionChirho: true },
      { xMinPxChirho: 1484, widthPxChirho: 791, scriptChirho: "french-chirho", utf8TextChirho: ". Ce mot pluriel" },
    ],
  },
  {
    pageChirho: "0055",
    lineChirho: "006",
    lineWidthPxChirho: 2275,
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 984, scriptChirho: "french-chirho", utf8TextChirho: "occurrences ayant le sens de" },
      { xMinPxChirho: 984, widthPxChirho: 220, scriptChirho: "arabic-chirho", utf8TextChirho: "شوك", visionChirho: true },
      { xMinPxChirho: 1204, widthPxChirho: 1071, scriptChirho: "french-chirho", utf8TextChirho: "(= épines). ABULWALID (Uṣul) lui aussi" },
    ],
  },
  {
    pageChirho: "0055",
    lineChirho: "032",
    lineWidthPxChirho: 2271,
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 1842, scriptChirho: "french-chirho", utf8TextChirho: "qui convient bien aux deux contextes. De fait, en arabe," },
      { xMinPxChirho: 1842, widthPxChirho: 240, scriptChirho: "arabic-chirho", utf8TextChirho: "ضِمَار", visionChirho: true },
      { xMinPxChirho: 2082, widthPxChirho: 189, scriptChirho: "french-chirho", utf8TextChirho: "signifie" },
    ],
  },
  {
    pageChirho: "0060",
    lineChirho: "029",
    lineWidthPxChirho: 2271,
    spansChirho: [
      {
        xMinPxChirho: 0,
        widthPxChirho: 2271,
        scriptChirho: "french-chirho",
        utf8TextChirho: "utilisées auparavant. Il y a en effet une nette progression entre “et tu ne",
        visionChirho: true,
      },
    ],
  },
];

for (const specChirho of SPECS_CHIRHO) rebuildLineChirho(specChirho);
