// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Repair vol-4 known-script OCR garble that strict export cannot see:
// spans were already classified as French/Hebrew, but the text layer had
// Latin-looking garbage where the print has Hebrew or sigla.

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PROJECT_ROOT_CHIRHO = "/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho";
const VOL4_SPANS_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho", "vol-4-chirho");
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

interface SpanSpecChirho {
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  visionChirho?: boolean;
}

interface WholeLineRepairChirho {
  pageChirho: string;
  lineChirho: string;
  expectedRenderedChirho: string;
  repairedRenderedChirho: string;
  previousRenderedChirho?: string[];
  spansChirho: SpanSpecChirho[];
}

interface TextReplacementChirho {
  pageChirho: string;
  lineChirho: string;
  fromChirho: string;
  toChirho: string;
}

function linePathChirho(pageChirho: string, lineChirho: string): string {
  return join(VOL4_SPANS_ROOT_CHIRHO, `page-${pageChirho}-chirho`, `line-${lineChirho}-chirho.json`);
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
      throw new Error(`${pathChirho}: non-contiguous span at ${indexChirho}: got ${spanChirho.xMinPxChirho}, expected ${cursorChirho}`);
    }
    cursorChirho += spanChirho.widthPxChirho;
  }
  if (cursorChirho !== lineChirho.lineWidthPxChirho) {
    throw new Error(`${pathChirho}: span widths ${cursorChirho} do not tile line width ${lineChirho.lineWidthPxChirho}`);
  }
}

function buildSpansChirho(lineChirho: LineChirho, specsChirho: SpanSpecChirho[]): SpanChirho[] {
  const totalWidthChirho = specsChirho.reduce((sumChirho, spanChirho) => sumChirho + spanChirho.widthPxChirho, 0);
  if (totalWidthChirho !== lineChirho.lineWidthPxChirho) {
    throw new Error(`replacement spans ${totalWidthChirho} do not tile line width ${lineChirho.lineWidthPxChirho}`);
  }

  let cursorChirho = 0;
  return specsChirho.map((specChirho, indexChirho) => {
    const spanChirho: SpanChirho = {
      segmentIndexChirho: indexChirho,
      xMinPxChirho: cursorChirho,
      widthPxChirho: specChirho.widthPxChirho,
      scriptChirho: specChirho.scriptChirho,
      utf8TextChirho: specChirho.utf8TextChirho,
    };
    cursorChirho += specChirho.widthPxChirho;
    if (specChirho.visionChirho) {
      spanChirho.provenanceChirho = "vision-chirho";
      spanChirho.visionTranscribedAtChirho = NOW_CHIRHO;
    }
    return spanChirho;
  });
}

function applyWholeLineRepairChirho(repairChirho: WholeLineRepairChirho): boolean {
  const pathChirho = linePathChirho(repairChirho.pageChirho, repairChirho.lineChirho);
  const lineChirho = readLineChirho(pathChirho);
  const renderedBeforeChirho = renderedLineChirho(lineChirho);
  if (renderedBeforeChirho !== repairChirho.expectedRenderedChirho) {
    if (renderedBeforeChirho === repairChirho.repairedRenderedChirho) {
      console.log(`already repaired: ${pathChirho}`);
      return false;
    }
    if (repairChirho.previousRenderedChirho?.includes(renderedBeforeChirho)) {
      lineChirho.spansChirho = buildSpansChirho(lineChirho, repairChirho.spansChirho);
      validateLineChirho(pathChirho, lineChirho);
      writeLineChirho(pathChirho, lineChirho);
      console.log(`migrated previous repair: ${pathChirho}`);
      return true;
    }
    throw new Error(`${pathChirho}: expected ${JSON.stringify(repairChirho.expectedRenderedChirho)}, got ${JSON.stringify(renderedBeforeChirho)}`);
  }

  lineChirho.spansChirho = buildSpansChirho(lineChirho, repairChirho.spansChirho);
  validateLineChirho(pathChirho, lineChirho);
  writeLineChirho(pathChirho, lineChirho);
  console.log(`whole-line repair: ${pathChirho}`);
  return true;
}

function applyTextReplacementChirho(repairChirho: TextReplacementChirho): boolean {
  const pathChirho = linePathChirho(repairChirho.pageChirho, repairChirho.lineChirho);
  const lineChirho = readLineChirho(pathChirho);
  let changedChirho = false;

  for (const spanChirho of lineChirho.spansChirho) {
    if (!spanChirho.utf8TextChirho.includes(repairChirho.fromChirho)) continue;
    spanChirho.utf8TextChirho = spanChirho.utf8TextChirho.split(repairChirho.fromChirho).join(repairChirho.toChirho);
    spanChirho.provenanceChirho = "vision-chirho";
    spanChirho.visionTranscribedAtChirho = NOW_CHIRHO;
    changedChirho = true;
  }

  if (!changedChirho) {
    if (renderedLineChirho(lineChirho).includes(repairChirho.toChirho)) {
      console.log(`already repaired: ${pathChirho}`);
      return false;
    }
    throw new Error(`${pathChirho}: expected text ${JSON.stringify(repairChirho.fromChirho)} not found`);
  }

  validateLineChirho(pathChirho, lineChirho);
  writeLineChirho(pathChirho, lineChirho);
  console.log(`text repair: ${pathChirho}`);
  return true;
}

const WHOLE_LINE_REPAIRS_CHIRHO: WholeLineRepairChirho[] = [
  {
    pageChirho: "0148",
    lineChirho: "006",
    expectedRenderedChirho: "ܚܝܠܐ ܘܒܐܠܗܝ ܐܫܘܪ ܫܘܪܐ As et le €: 77227 710",
    repairedRenderedChirho: "ܚܝܠܐ ܘܒܐܠܗܝ ܐܫܘܪ ܫܘܪܐ et le 𝔗: מְטוּל דִּבְמֵימְרָךְ",
    spansChirho: [
      { widthPxChirho: 659, scriptChirho: "syriac-chirho", utf8TextChirho: "ܚܝܠܐ ܘܒܐܠܗܝ ܐܫܘܪ ܫܘܪܐ" },
      { widthPxChirho: 105, scriptChirho: "french-chirho", utf8TextChirho: "et le", visionChirho: true },
      { widthPxChirho: 70, scriptChirho: "symbol-chirho", utf8TextChirho: "𝔗:" },
      { widthPxChirho: 339, scriptChirho: "hebrew-chirho", utf8TextChirho: "מְטוּל דִּבְמֵימְרָךְ", visionChirho: true },
    ],
  },
  {
    pageChirho: "0148",
    lineChirho: "007",
    expectedRenderedChirho: "OPA 202 WIDN TPS DA / LTD VON.",
    repairedRenderedChirho: "אַסְגֵּי מַשִּׁירְיָין / וּבְמֵימַר אֱלָהִי אֶכְבּוֹשׁ כְּרַכִּין תַּקִּיפִין",
    spansChirho: [
      { widthPxChirho: 964, scriptChirho: "hebrew-chirho", utf8TextChirho: "אַסְגֵּי מַשִּׁירְיָין / וּבְמֵימַר אֱלָהִי אֶכְבּוֹשׁ כְּרַכִּין תַּקִּיפִין", visionChirho: true },
    ],
  },
  {
    pageChirho: "0148",
    lineChirho: "014",
    expectedRenderedChirho: "15 ܐܫܘܪ ܫܘܪܐ LeŒ porte: 292 / ]7709 VON 77222 VIN",
    repairedRenderedChirho: "15 ܐܫܘܪ ܫܘܪܐ Le 𝔗 porte: אֲרֵי בְמֵימְרָךְ אַסְגִּי מַשְׁרִין / וּבְמֵימַר אֱלָהִי אֲכַבֵּשׁ כָּל כַרְכִין תַקִּיפִין",
    spansChirho: [
      { widthPxChirho: 64, scriptChirho: "french-chirho", utf8TextChirho: "15" },
      { widthPxChirho: 282, scriptChirho: "syriac-chirho", utf8TextChirho: "ܐܫܘܪ ܫܘܪܐ" },
      { widthPxChirho: 80, scriptChirho: "french-chirho", utf8TextChirho: "Le", visionChirho: true },
      { widthPxChirho: 70, scriptChirho: "symbol-chirho", utf8TextChirho: "𝔗" },
      { widthPxChirho: 100, scriptChirho: "french-chirho", utf8TextChirho: "porte:", visionChirho: true },
      { widthPxChirho: 642, scriptChirho: "hebrew-chirho", utf8TextChirho: "אֲרֵי בְמֵימְרָךְ אַסְגִּי מַשְׁרִין / וּבְמֵימַר אֱלָהִי אֲכַבֵּשׁ כָּל כַרְכִין תַקִּיפִין", visionChirho: true },
    ],
  },
  {
    pageChirho: "0149",
    lineChirho: "013",
    expectedRenderedChirho: "15 Ps 18,33. — Le M porte: 17°] / 27 הַמְאַזְּרֵנִי PNT",
    repairedRenderedChirho: "15 Ps 18,33. — Le 𝔐 porte: הָאֵל הַמְאַזְּרֵנִי חָיִל / וַיִּתֵּן",
    spansChirho: [
      { widthPxChirho: 650, scriptChirho: "french-chirho", utf8TextChirho: "15 Ps 18,33. — Le 𝔐 porte:", visionChirho: true },
      { widthPxChirho: 583, scriptChirho: "hebrew-chirho", utf8TextChirho: "הָאֵל הַמְאַזְּרֵנִי חָיִל / וַיִּתֵּן", visionChirho: true },
    ],
  },
  {
    pageChirho: "0149",
    lineChirho: "014",
    expectedRenderedChirho: "277 DM avec un ketib 1277.",
    repairedRenderedChirho: "תָּמִים דַּרְכִּי avec un ketib דַּרְכּוֹ.",
    spansChirho: [
      { widthPxChirho: 220, scriptChirho: "hebrew-chirho", utf8TextChirho: "תָּמִים דַּרְכִּי", visionChirho: true },
      { widthPxChirho: 245, scriptChirho: "french-chirho", utf8TextChirho: "avec un ketib", visionChirho: true },
      { widthPxChirho: 140, scriptChirho: "hebrew-chirho", utf8TextChirho: "דַּרְכּוֹ.", visionChirho: true },
    ],
  },
  {
    pageChirho: "0150",
    lineChirho: "013",
    expectedRenderedChirho: "Ps 18,33. — Hev (42189) porte: 71 [ND NT",
    repairedRenderedChirho: "Ps 18,33. — Hev (42189) porte: הָאֵל הַמְאַ[....] חָיִל",
    spansChirho: [
      { widthPxChirho: 595, scriptChirho: "french-chirho", utf8TextChirho: "Ps 18,33. — Hev (42189) porte:", visionChirho: true },
      { widthPxChirho: 447, scriptChirho: "hebrew-chirho", utf8TextChirho: "הָאֵל הַמְאַ[....] חָיִל", visionChirho: true },
    ],
  },
  {
    pageChirho: "0150",
    lineChirho: "014",
    expectedRenderedChirho: "1297 DAN JP.",
    repairedRenderedChirho: "וַיִּתֵּן תָּמִים דַּרְכּוֹ.",
    spansChirho: [
      { widthPxChirho: 320, scriptChirho: "hebrew-chirho", utf8TextChirho: "וַיִּתֵּן תָּמִים דַּרְכּוֹ.", visionChirho: true },
    ],
  },
  {
    pageChirho: "0150",
    lineChirho: "029",
    expectedRenderedChirho: "TN DD POI / NDTA MDP 9 FAR NTIR.",
    repairedRenderedChirho: "אֱלָהָא דִמְזָרֵז לִי קָמוּר בְּחֵילָא / וּמְתַקֵן שְׁלִים אָרְחִי.",
    spansChirho: [
      { widthPxChirho: 977, scriptChirho: "hebrew-chirho", utf8TextChirho: "אֱלָהָא דִמְזָרֵז לִי קָמוּר בְּחֵילָא / וּמְתַקֵן שְׁלִים אָרְחִי.", visionChirho: true },
    ],
  },
  {
    pageChirho: "0151",
    lineChirho: "001",
    expectedRenderedChirho: "ܬܡܡ ܐܘܕܥܢܝ ri et le €: JP / N9712 לִי PDO T NON",
    repairedRenderedChirho: "ܬܡܡ ܐܘܕܥܢܝ et le 𝔗: אֱלָהָא דְּסָעִיד לִי בְּחֵילָא / וּמְתַקַן",
    spansChirho: [
      { widthPxChirho: 269, scriptChirho: "syriac-chirho", utf8TextChirho: "ܬܡܡ ܐܘܕܥܢܝ" },
      { widthPxChirho: 105, scriptChirho: "french-chirho", utf8TextChirho: "et le", visionChirho: true },
      { widthPxChirho: 70, scriptChirho: "symbol-chirho", utf8TextChirho: "𝔗:" },
      { widthPxChirho: 725, scriptChirho: "hebrew-chirho", utf8TextChirho: "אֱלָהָא דְּסָעִיד לִי בְּחֵילָא / וּמְתַקַן", visionChirho: true },
    ],
  },
  {
    pageChirho: "0151",
    lineChirho: "002",
    expectedRenderedChirho: "TS OÙ.",
    repairedRenderedChirho: "שְׁלִים אוֹרְחִי.",
    spansChirho: [
      { widthPxChirho: 252, scriptChirho: "hebrew-chirho", utf8TextChirho: "שְׁלִים אוֹרְחִי.", visionChirho: true },
    ],
  },
  {
    pageChirho: "0152",
    lineChirho: "004",
    expectedRenderedChirho: "5 Ps 18,34. — Le M porte: 221 / NIPND *239 מְשַׁוֶּה",
    repairedRenderedChirho: "5 Ps 18,34. — Le 𝔐 porte: מְשַׁוֶּה רַגְלַי כָּאַיָּלוֹת / וְעַל בָּמֹתַי יַעֲמִידֵנִי.",
    previousRenderedChirho: [
      "5 Ps 18,34. — Le 𝔐 porte: מְשַׁוֶּה רַגְלַי כָּאַיָּלוֹת / וְעַל",
      "5 Ps 18,34. — Le 𝔐 porte: מְשַׁוֶּה רַגְלַי כָּאַיָּלוֹת / וְעַל בָּמֹתַי יַעֲמִידֵנִי. בָּמֹתַי יַעֲמִידֵנִי.",
    ],
    spansChirho: [
      { widthPxChirho: 535, scriptChirho: "french-chirho", utf8TextChirho: "5 Ps 18,34. — Le 𝔐 porte:", visionChirho: true },
      { widthPxChirho: 680, scriptChirho: "hebrew-chirho", utf8TextChirho: "מְשַׁוֶּה רַגְלַי כָּאַיָּלוֹת / וְעַל בָּמֹתַי יַעֲמִידֵנִי.", visionChirho: true },
    ],
  },
  {
    pageChirho: "0152",
    lineChirho: "005",
    expectedRenderedChirho: "Diagnostiquant dans le ‘yod” final de NA une dit-",
    repairedRenderedChirho: "Diagnostiquant dans le ‘yod’ final de בָּמֹתַי une dit-",
    spansChirho: [
      { widthPxChirho: 735, scriptChirho: "french-chirho", utf8TextChirho: "Diagnostiquant dans le ‘yod’ final de", visionChirho: true },
      { widthPxChirho: 135, scriptChirho: "hebrew-chirho", utf8TextChirho: "בָּמֹתַי", visionChirho: true },
      { widthPxChirho: 166, scriptChirho: "french-chirho", utf8TextChirho: "une dit-", visionChirho: true },
    ],
  },
  {
    pageChirho: "0152",
    lineChirho: "009",
    expectedRenderedChirho: "Selon BROCKINGTON, [R]NEB lit בָּמַת avec le 6 quand elle",
    repairedRenderedChirho: "Selon BROCKINGTON, [R]NEB lit בָמוֹת avec le 𝔊 quand elle",
    spansChirho: [
      { widthPxChirho: 672, scriptChirho: "french-chirho", utf8TextChirho: "Selon BROCKINGTON, [R]NEB lit", visionChirho: true },
      { widthPxChirho: 104, scriptChirho: "hebrew-chirho", utf8TextChirho: "בָמוֹת", visionChirho: true },
      { widthPxChirho: 190, scriptChirho: "french-chirho", utf8TextChirho: "avec le", visionChirho: true },
      { widthPxChirho: 70, scriptChirho: "symbol-chirho", utf8TextChirho: "𝔊", visionChirho: true },
      { widthPxChirho: 144, scriptChirho: "french-chirho", utf8TextChirho: "quand elle", visionChirho: true },
    ],
  },
  {
    pageChirho: "0152",
    lineChirho: "019",
    expectedRenderedChirho: "2 S 22,34. — Le M porte: 221 / NIPND 239 מְשַׁוֶּה",
    repairedRenderedChirho: "2 S 22,34. — Le 𝔐 porte: מְשַׁוֶּה רַגְלַי כָּאַיָּלוֹת / וְעַל",
    spansChirho: [
      { widthPxChirho: 470, scriptChirho: "french-chirho", utf8TextChirho: "2 S 22,34. — Le 𝔐 porte:", visionChirho: true },
      { widthPxChirho: 567, scriptChirho: "hebrew-chirho", utf8TextChirho: "מְשַׁוֶּה רַגְלַי כָּאַיָּלוֹת / וְעַל", visionChirho: true },
    ],
  },
  {
    pageChirho: "0152",
    lineChirho: "020",
    expectedRenderedChirho: "3702? DIS.",
    repairedRenderedChirho: "בָּמוֹתַי יַעֲמִדֵנִי.",
    previousRenderedChirho: ["בָּמֹתַי יַעֲמִדֵנִי."],
    spansChirho: [
      { widthPxChirho: 266, scriptChirho: "hebrew-chirho", utf8TextChirho: "בָּמוֹתַי יַעֲמִדֵנִי.", visionChirho: true },
    ],
  },
  {
    pageChirho: "0152",
    lineChirho: "024",
    expectedRenderedChirho: "[RINEB lit M2 avec le 6 quand elle donne: “who makes me",
    repairedRenderedChirho: "[R]NEB lit בָמוֹת avec le 𝔊 quand elle donne: “who makes me",
    spansChirho: [
      { widthPxChirho: 300, scriptChirho: "french-chirho", utf8TextChirho: "[R]NEB lit", visionChirho: true },
      { widthPxChirho: 165, scriptChirho: "hebrew-chirho", utf8TextChirho: "בָמוֹת", visionChirho: true },
      { widthPxChirho: 150, scriptChirho: "french-chirho", utf8TextChirho: "avec le", visionChirho: true },
      { widthPxChirho: 70, scriptChirho: "symbol-chirho", utf8TextChirho: "𝔊", visionChirho: true },
      { widthPxChirho: 191, scriptChirho: "french-chirho", utf8TextChirho: "quand elle donne:", visionChirho: true },
      { widthPxChirho: 244, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "“who makes" },
      { widthPxChirho: 57, scriptChirho: "french-chirho", utf8TextChirho: "me" },
    ],
  },
];

const TEXT_REPLACEMENTS_CHIRHO: TextReplacementChirho[] = [
  { pageChirho: "0149", lineChirho: "018", fromChirho: "[RINEB", toChirho: "[R]NEB" },
  { pageChirho: "0149", lineChirho: "027", fromChirho: "[RINEB", toChirho: "[R]NEB" },
];

let changedCountChirho = 0;
for (const repairChirho of WHOLE_LINE_REPAIRS_CHIRHO) {
  if (applyWholeLineRepairChirho(repairChirho)) changedCountChirho += 1;
}
for (const repairChirho of TEXT_REPLACEMENTS_CHIRHO) {
  if (applyTextReplacementChirho(repairChirho)) changedCountChirho += 1;
}

console.log(`vol4 known-script garble repairs applied: ${changedCountChirho}`);
