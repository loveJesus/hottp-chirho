// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Rebuild the four non-expert suspect-text residues from the scanline images.
// These are line-level segmentation/OCR repairs, not per-token verdicts.

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PROJECT_ROOT_CHIRHO = "/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho";
const SPANS_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
const NOW_CHIRHO = new Date().toISOString();

interface NewSpanChirho {
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  visionChirho?: boolean;
}

interface RebuildSpecChirho {
  volumeChirho: string;
  pageChirho: string;
  lineChirho: string;
  lineWidthPxChirho: number;
  spansChirho: NewSpanChirho[];
}

function linePathChirho(specChirho: RebuildSpecChirho): string {
  return join(
    SPANS_ROOT_CHIRHO,
    `vol-${specChirho.volumeChirho}-chirho`,
    `page-${specChirho.pageChirho}-chirho`,
    `line-${specChirho.lineChirho}-chirho.json`
  );
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
  const pathChirho = linePathChirho(specChirho);
  const lineChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as Record<string, unknown>;
  if (lineChirho.lineWidthPxChirho !== specChirho.lineWidthPxChirho) {
    throw new Error(
      `line width field mismatch in ${pathChirho}: got ${lineChirho.lineWidthPxChirho}, expected ${specChirho.lineWidthPxChirho}`
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
  console.log(`vol-${specChirho.volumeChirho} p${specChirho.pageChirho} L${specChirho.lineChirho}: rebuilt ${specChirho.spansChirho.length} spans`);
}

const REBUILD_SPECS_CHIRHO: RebuildSpecChirho[] = [
  {
    volumeChirho: "1",
    pageChirho: "0151",
    lineChirho: "034",
    lineWidthPxChirho: 1442,
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 946, scriptChirho: "french-chirho", utf8TextChirho: "clameur du peuple qu'elle conserve, alors qu'elle allège" },
      { xMinPxChirho: 946, widthPxChirho: 296, scriptChirho: "hebrew-chirho", utf8TextChirho: "ויריעו העם תרועה גדולה", visionChirho: true },
      { xMinPxChirho: 1242, widthPxChirho: 200, scriptChirho: "french-chirho", utf8TextChirho: "en un" },
    ],
  },
  {
    volumeChirho: "2",
    pageChirho: "0148",
    lineChirho: "025",
    lineWidthPxChirho: 1439,
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 1036, scriptChirho: "french-chirho", utf8TextChirho: "contrent dans le Document de Damas VIII 16 et XIX 29 :" },
      { xMinPxChirho: 1036, widthPxChirho: 403, scriptChirho: "hebrew-chirho", utf8TextChirho: "שבי ישראל סרו מדרך העם", visionChirho: true },
    ],
  },
  {
    volumeChirho: "2",
    pageChirho: "0148",
    lineChirho: "029",
    lineWidthPxChirho: 1444,
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 747, scriptChirho: "french-chirho", utf8TextChirho: "qui serait la Vorlage requise par le *G :" },
      { xMinPxChirho: 747, widthPxChirho: 697, scriptChirho: "greek-chirho", utf8TextChirho: "ἀπειθοῦσι τῇ πορείᾳ τῆς ὁδοῦ τοῦ λαοῦ", visionChirho: true },
    ],
  },
  {
    volumeChirho: "5",
    pageChirho: "0058",
    lineChirho: "010",
    lineWidthPxChirho: 2046,
    spansChirho: [
      { xMinPxChirho: 0, widthPxChirho: 620, scriptChirho: "french-chirho", utf8TextChirho: "Disant conjecturer" },
      { xMinPxChirho: 620, widthPxChirho: 255, scriptChirho: "hebrew-chirho", utf8TextChirho: "מָחֵרֶב", visionChirho: true },
      { xMinPxChirho: 875, widthPxChirho: 384, scriptChirho: "french-chirho", utf8TextChirho: "au lieu de" },
      { xMinPxChirho: 1259, widthPxChirho: 187, scriptChirho: "hebrew-chirho", utf8TextChirho: "מֵחֶרֶב", visionChirho: true },
      { xMinPxChirho: 1446, widthPxChirho: 600, scriptChirho: "french-chirho", utf8TextChirho: ", J123 traduit: “Il" },
    ],
  },
];

for (const specChirho of REBUILD_SPECS_CHIRHO) rebuildLineChirho(specChirho);
