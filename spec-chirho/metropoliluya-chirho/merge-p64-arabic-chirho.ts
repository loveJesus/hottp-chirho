// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Re-segment p64 over-split Arabic citations: collapse each contiguous garble run
// (the segmenter shredded one Arabic phrase into ~15 sub-word fragments) into ONE
// arabic-chirho span covering the combined x-range (tiling stays gap-free), with a
// best-effort vision transcription (provenance vision-chirho — a WITNESS for Arabist
// confirmation), and trim the leading garble off the adjacent French span.

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DIR_CHIRHO = "/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/spans-chirho/vol-5-chirho/page-0064-chirho";
const NOW_CHIRHO = new Date().toISOString();

interface MergeSpecChirho {
  lineChirho: number;
  fromSegChirho: number;
  toSegChirho: number;
  arabicTextChirho: string;
  boundarySegChirho: number;
  boundaryTextChirho: string;
}

const SPECS_CHIRHO: MergeSpecChirho[] = [
  { lineChirho: 7,  fromSegChirho: 2, toSegChirho: 17, arabicTextChirho: "الملاشي من صاحبه الفضل / وتقوي الكافي يترك", boundarySegChirho: 18, boundaryTextChirho: ", en se fondant sur" },
  { lineChirho: 16, fromSegChirho: 1, toSegChirho: 17, arabicTextChirho: "للمذيب من صاحبه الفضل / وخية الكافي يترك",  boundarySegChirho: 18, boundaryTextChirho: "et il commente ainsi son" },
  { lineChirho: 33, fromSegChirho: 1, toSegChirho: 9,  arabicTextChirho: "اذ رجوت الخاذل اخاه ظلما وتقوي الله قد ترك", boundarySegChirho: 10, boundaryTextChirho: "(“Car j'ai placé mon espoir" },
];

for (const specChirho of SPECS_CHIRHO) {
  const pathChirho = join(DIR_CHIRHO, `line-${String(specChirho.lineChirho).padStart(3, "0")}-chirho.json`);
  const lineChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as {
    spansChirho: Array<{ segmentIndexChirho: number; xMinPxChirho: number; widthPxChirho: number; scriptChirho: string; utf8TextChirho: string; provenanceChirho?: string; visionTranscribedAtChirho?: string }>;
  };
  const spansChirho = lineChirho.spansChirho;
  const fromChirho = spansChirho.find((sChirho) => sChirho.segmentIndexChirho === specChirho.fromSegChirho)!;
  const toChirho = spansChirho.find((sChirho) => sChirho.segmentIndexChirho === specChirho.toSegChirho)!;
  const mergedXMinChirho = fromChirho.xMinPxChirho;
  const mergedWidthChirho = (toChirho.xMinPxChirho + toChirho.widthPxChirho) - fromChirho.xMinPxChirho;
  const mergedSpanChirho = {
    segmentIndexChirho: specChirho.fromSegChirho,
    xMinPxChirho: mergedXMinChirho,
    widthPxChirho: mergedWidthChirho,
    scriptChirho: "arabic-chirho",
    utf8TextChirho: specChirho.arabicTextChirho,
    provenanceChirho: "vision-chirho",
    visionTranscribedAtChirho: NOW_CHIRHO,
  };
  // rebuild: spans before the run + merged + spans after the run (preserve xMin order)
  const keptBeforeChirho = spansChirho.filter((sChirho) => sChirho.segmentIndexChirho < specChirho.fromSegChirho);
  const keptAfterChirho = spansChirho.filter((sChirho) => sChirho.segmentIndexChirho > specChirho.toSegChirho);
  for (const sChirho of keptAfterChirho) {
    if (sChirho.segmentIndexChirho === specChirho.boundarySegChirho) sChirho.utf8TextChirho = specChirho.boundaryTextChirho;
  }
  lineChirho.spansChirho = [...keptBeforeChirho, mergedSpanChirho, ...keptAfterChirho].sort((aChirho, bChirho) => aChirho.xMinPxChirho - bChirho.xMinPxChirho);
  writeFileSync(pathChirho, `${JSON.stringify(lineChirho, null, 2)}\n`);
  console.log(`L${specChirho.lineChirho}: merged seg${specChirho.fromSegChirho}-${specChirho.toSegChirho} -> 1 arabic span (x${mergedXMinChirho}+${mergedWidthChirho}) "${specChirho.arabicTextChirho.slice(0, 30)}…"; span count ${spansChirho.length} -> ${lineChirho.spansChirho.length}`);
}
