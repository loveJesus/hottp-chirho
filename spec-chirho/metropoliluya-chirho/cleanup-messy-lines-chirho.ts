// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Clean up two over-split/garbled mixed lines per GPT's 2nd-witness audit
// (e4a6061): p64 L19 (merge parenthetical Arabic مذيب) and p54 L34 (join the
// YÉFET BEN ÉLY name, keep the Arabic والي السنان, strip the garble fragments).
// Rebuilds each line's spansChirho gap-free with contiguous segmentIndex.

import { readFileSync, writeFileSync } from "fs";

const ROOT_CHIRHO = "/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/spans-chirho/vol-5-chirho";
const NOW_CHIRHO = new Date().toISOString();

interface NewSpanChirho { xMinPxChirho: number; widthPxChirho: number; scriptChirho: string; utf8TextChirho: string; visionChirho?: boolean; }

function rebuildChirho(pageChirho: string, lineChirho: string, lineWidthChirho: number, newSpansChirho: NewSpanChirho[]): void {
  const pathChirho = `${ROOT_CHIRHO}/page-${pageChirho}-chirho/line-${lineChirho}-chirho.json`;
  const objChirho = JSON.parse(readFileSync(pathChirho, "utf8"));
  objChirho.spansChirho = newSpansChirho.map((sChirho, iChirho) => {
    const spanChirho: Record<string, unknown> = {
      segmentIndexChirho: iChirho,
      xMinPxChirho: sChirho.xMinPxChirho,
      widthPxChirho: sChirho.widthPxChirho,
      scriptChirho: sChirho.scriptChirho,
      utf8TextChirho: sChirho.utf8TextChirho,
    };
    if (sChirho.visionChirho) { spanChirho.provenanceChirho = "vision-chirho"; spanChirho.visionTranscribedAtChirho = NOW_CHIRHO; }
    return spanChirho;
  });
  // sanity: gap-free coverage [0, lineWidth]
  let cursorChirho = 0; let okChirho = true;
  for (const sChirho of objChirho.spansChirho) { if (sChirho.xMinPxChirho !== cursorChirho) okChirho = false; cursorChirho = sChirho.xMinPxChirho + sChirho.widthPxChirho; }
  if (cursorChirho !== lineWidthChirho) okChirho = false;
  writeFileSync(pathChirho, `${JSON.stringify(objChirho, null, 2)}\n`);
  console.log(`${pageChirho}/${lineChirho}: rebuilt to ${objChirho.spansChirho.length} spans; tiling ${okChirho ? "OK (gap-free 0.." + lineWidthChirho + ")" : "WARN cursor=" + cursorChirho}`);
}

// p64 L19 — merge seg1-3 Arabic fragments into one مذيب; trim parens garble
rebuildChirho("0064", "019", 2275, [
  { xMinPxChirho: 0,   widthPxChirho: 559,  scriptChirho: "french-chirho", utf8TextChirho: "qui fait fondre (" },
  { xMinPxChirho: 559, widthPxChirho: 304,  scriptChirho: "arabic-chirho", utf8TextChirho: "مذيب", visionChirho: true },
  { xMinPxChirho: 863, widthPxChirho: 1412, scriptChirho: "french-chirho", utf8TextChirho: ") hors de son prochain sa bienveillance et sa" },
]);

// p54 L34 — join YÉFET / ÉLY name, keep والي السنان, strip garble
rebuildChirho("0054", "034", 2271, [
  { xMinPxChirho: 0,    widthPxChirho: 288,  scriptChirho: "french-chirho",            utf8TextChirho: "épines." },
  { xMinPxChirho: 288,  widthPxChirho: 174,  scriptChirho: "latin-non-french-chirho",  utf8TextChirho: "YÉFET" },
  { xMinPxChirho: 462,  widthPxChirho: 122,  scriptChirho: "french-chirho",            utf8TextChirho: "BEN" },
  { xMinPxChirho: 584,  widthPxChirho: 466,  scriptChirho: "latin-non-french-chirho",  utf8TextChirho: "ÉLY traduit:" },
  { xMinPxChirho: 1050, widthPxChirho: 96,   scriptChirho: "arabic-chirho",            utf8TextChirho: "والي السنان", visionChirho: true },
  { xMinPxChirho: 1146, widthPxChirho: 1125, scriptChirho: "french-chirho",            utf8TextChirho: ", expliquant qu'il s'agit du" },
]);
