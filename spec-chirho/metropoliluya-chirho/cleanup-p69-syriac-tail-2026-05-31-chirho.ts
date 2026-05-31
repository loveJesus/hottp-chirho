// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Rebuild the p69 Syriac tail from the scanline image plus the Job 7:4
// Peshitta witness. This clears the structural unknown span but leaves the
// text at vision-tier pending Syriac-expert confirmation.

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PROJECT_ROOT_CHIRHO = "/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho";
const PAGE_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-5-chirho",
  "page-0069-chirho"
);
const NOW_CHIRHO = new Date().toISOString();

interface NewSpanChirho {
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  visionChirho?: boolean;
}

interface RebuildSpecChirho {
  lineChirho: string;
  lineWidthPxChirho: number;
  spansChirho: NewSpanChirho[];
}

function rebuiltSpanChirho(spanChirho: NewSpanChirho, segmentIndexChirho: number): Record<string, unknown> {
  const nextSpanChirho: Record<string, unknown> = {
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

function rebuildLineChirho(specChirho: RebuildSpecChirho): void {
  const pathChirho = join(PAGE_DIR_CHIRHO, `line-${specChirho.lineChirho}-chirho.json`);
  const lineChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as Record<string, unknown>;
  if (lineChirho.lineWidthPxChirho !== specChirho.lineWidthPxChirho) {
    throw new Error(
      `line width mismatch in ${pathChirho}: got ${lineChirho.lineWidthPxChirho}, expected ${specChirho.lineWidthPxChirho}`
    );
  }

  lineChirho.spansChirho = specChirho.spansChirho.map(rebuiltSpanChirho);

  let cursorChirho = 0;
  for (const spanChirho of lineChirho.spansChirho as Array<{ xMinPxChirho: number; widthPxChirho: number }>) {
    if (spanChirho.xMinPxChirho !== cursorChirho) {
      throw new Error(`non-contiguous span in ${pathChirho}: got x=${spanChirho.xMinPxChirho}, expected x=${cursorChirho}`);
    }
    cursorChirho += spanChirho.widthPxChirho;
  }
  if (cursorChirho !== specChirho.lineWidthPxChirho) {
    throw new Error(`line tiling mismatch in ${pathChirho}: got ${cursorChirho}, expected ${specChirho.lineWidthPxChirho}`);
  }

  writeFileSync(pathChirho, `${JSON.stringify(lineChirho, null, 2)}\n`);
  console.log(`p0069 L${specChirho.lineChirho}: rebuilt ${specChirho.spansChirho.length} spans`);
}

const REBUILD_SPECS_CHIRHO: RebuildSpecChirho[] = [
  {
    lineChirho: "030",
    lineWidthPxChirho: 759,
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 121, scriptChirho: "french-chirho", utf8TextChirho: "La" },
      { xMinPxChirho: 121, widthPxChirho: 84, scriptChirho: "symbol-chirho", utf8TextChirho: "𝔖", visionChirho: true },
      { xMinPxChirho: 205, widthPxChirho: 229, scriptChirho: "french-chirho", utf8TextChirho: "porte:" },
      { xMinPxChirho: 434, widthPxChirho: 325, scriptChirho: "syriac-chirho", utf8TextChirho: "ܘܡܳܫܰܚ", visionChirho: true },
    ],
  },
  {
    lineChirho: "031",
    lineWidthPxChirho: 1675,
    spansChirho: [
      {
        xMinPxChirho: 0,
        widthPxChirho: 1675,
        scriptChirho: "syriac-chirho",
        utf8TextChirho: "ܐ̱ܢܳܐ ܠܪܰܡܫܳܐ: ܘܫܳܟܶܒ ܐ̱ܢܳܐ. ܘܢܳܐܶܕ ܐ̱ܢܳܐ ܠܫܰܦܪܳܐ.",
        visionChirho: true,
      },
    ],
  },
];

for (const specChirho of REBUILD_SPECS_CHIRHO) rebuildLineChirho(specChirho);
