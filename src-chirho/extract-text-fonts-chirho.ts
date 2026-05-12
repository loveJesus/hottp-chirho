// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Font-aware text extraction for digital PDFs (used by vol 5; trivially
 * applicable to any vol whose PDF carries real text + font metadata).
 *
 * Why this exists: vol 5's Hebrew/Greek/Syriac glyphs are stored in custom
 * non-Unicode fonts (NewJerusalemU, SymbolGreekU, EstrangeloEdessa). pdftotext
 * splits them per-glyph and emits MacRoman gibberish; downstream classifiers
 * cannot distinguish "Hebrew letter" from "French sigla" by text alone.
 *
 * `pdftohtml -xml -fontfullname` exposes per-text-block font assignments. We
 * group consecutive same-script blocks on the same line into a single "word"
 * carrying a `scriptHintChirho` (hebrew/greek/syriac/latin/symbol). Latin
 * blocks are split into words on whitespace as usual; non-Latin runs become
 * opaque blocks the agent transcribes from the line image.
 */

import { rmSync } from "fs";
import { join } from "path";

import { pdfPathChirho } from "./extract-text-chirho.ts";
import { runCmdChirho, decodeHtmlEntitiesChirho } from "./utils-chirho.ts";

/** Recognised non-Latin font families and the script we map them to. */
const FONT_FAMILY_TO_SCRIPT_CHIRHO: Array<{
  patternChirho: RegExp;
  scriptChirho: "hebrew-chirho" | "greek-chirho" | "syriac-chirho" | "arabic-chirho";
}> = [
  { patternChirho: /NewJerusalemU/i, scriptChirho: "hebrew-chirho" },
  { patternChirho: /SBLHebrew|SBLBibLit|TimesNewRomanHebrew|HebrewU/i, scriptChirho: "hebrew-chirho" },
  { patternChirho: /SymbolGreekU|GreekSans|SBLGreek|GraecaII|TimesNewRomanGreek/i, scriptChirho: "greek-chirho" },
  { patternChirho: /EstrangeloEdessa|MeltoEstrangelo|SyrCOMEdessa/i, scriptChirho: "syriac-chirho" },
  { patternChirho: /TraditionalArabic|TimesNewRomanArabic|Amiri/i, scriptChirho: "arabic-chirho" },
];

function classifyFontFamilyChirho(
  familyChirho: string
): "latin-chirho" | "hebrew-chirho" | "greek-chirho" | "syriac-chirho" | "arabic-chirho" | "symbol-chirho" {
  for (const ruleChirho of FONT_FAMILY_TO_SCRIPT_CHIRHO) {
    if (ruleChirho.patternChirho.test(familyChirho)) return ruleChirho.scriptChirho;
  }
  if (/ZapfDingbats|Wingdings|Symbol(?!Greek)/i.test(familyChirho)) {
    return "symbol-chirho";
  }
  return "latin-chirho";
}

export interface FontAwareWordChirho {
  textChirho: string;
  xMinChirho: number;
  yMinChirho: number;
  xMaxChirho: number;
  yMaxChirho: number;
  scriptHintChirho:
    | "latin-chirho"
    | "hebrew-chirho"
    | "greek-chirho"
    | "syriac-chirho"
    | "arabic-chirho"
    | "symbol-chirho";
}

export interface FontAwareLineChirho {
  yMinChirho: number;
  yMaxChirho: number;
  xMinChirho: number;
  xMaxChirho: number;
  wordsChirho: FontAwareWordChirho[];
}

interface RawTextBlockChirho {
  topChirho: number;
  leftChirho: number;
  widthChirho: number;
  heightChirho: number;
  fontIdChirho: string;
  textChirho: string;
}

/** Run pdftohtml -xml -fontfullname for one page; return XML string. */
async function pdftohtmlXmlChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<string> {
  const pdfChirho = pdfPathChirho(volumeNumberChirho);
  const tmpDirChirho = (await runCmdChirho(["mktemp", "-d"])).trim();
  try {
    const stemChirho = join(tmpDirChirho, "out");
    await runCmdChirho([
      "pdftohtml",
      "-f", String(pageNumberChirho),
      "-l", String(pageNumberChirho),
      "-xml",
      "-fontfullname",
      "-i",
      "-q",
      pdfChirho,
      stemChirho,
    ]);
    return await Bun.file(`${stemChirho}.xml`).text();
  } finally {
    try {
      rmSync(tmpDirChirho, { recursive: true, force: true });
    } catch (_errChirho) {
      // best-effort cleanup
    }
  }
}

/** Parse pdftohtml XML into per-page font map + flat text-block list. */
function parsePdftohtmlXmlChirho(xmlChirho: string): {
  fontByIdChirho: Map<string, string>;
  blocksChirho: RawTextBlockChirho[];
} {
  const fontByIdChirho = new Map<string, string>();
  const fontRegexChirho = /<fontspec\s+id="([^"]+)"[^>]*family="([^"]+)"/g;
  let mfChirho: RegExpExecArray | null;
  while ((mfChirho = fontRegexChirho.exec(xmlChirho)) !== null) {
    fontByIdChirho.set(mfChirho[1]!, mfChirho[2]!);
  }

  const blocksChirho: RawTextBlockChirho[] = [];
  const textRegexChirho =
    /<text\s+top="(-?\d+(?:\.\d+)?)"\s+left="(-?\d+(?:\.\d+)?)"\s+width="(-?\d+(?:\.\d+)?)"\s+height="(-?\d+(?:\.\d+)?)"\s+font="([^"]+)">([\s\S]*?)<\/text>/g;
  let mtChirho: RegExpExecArray | null;
  while ((mtChirho = textRegexChirho.exec(xmlChirho)) !== null) {
    const innerChirho = mtChirho[6]!;
    const cleanedChirho = innerChirho.replace(/<[^>]+>/g, "");
    const textChirho = decodeHtmlEntitiesChirho(cleanedChirho);
    blocksChirho.push({
      topChirho: parseFloat(mtChirho[1]!),
      leftChirho: parseFloat(mtChirho[2]!),
      widthChirho: parseFloat(mtChirho[3]!),
      heightChirho: parseFloat(mtChirho[4]!),
      fontIdChirho: mtChirho[5]!,
      textChirho,
    });
  }

  return { fontByIdChirho, blocksChirho };
}

/**
 * Group raw text blocks into lines by `top` y-coord, then within each line
 * walk left-to-right merging consecutive same-script blocks into "words":
 *   - Latin blocks split on whitespace into individual word tokens.
 *   - Non-Latin blocks remain as opaque runs (merge with adjacent same-script
 *     neighbours within ~30 px gap).
 *
 * `dpiScaleChirho` converts pdftohtml's units (pixels at 72 DPI) to the
 * render-DPI pixel space of our line crops.
 */
export function blocksToLinesChirho(
  blocksChirho: RawTextBlockChirho[],
  fontByIdChirho: Map<string, string>,
  dpiScaleChirho: number
): FontAwareLineChirho[] {
  const sortedChirho = [...blocksChirho].sort(
    (aChirho, bChirho) =>
      aChirho.topChirho - bChirho.topChirho || aChirho.leftChirho - bChirho.leftChirho
  );

  const LINE_Y_TOL_PX_CHIRHO = 6;
  const lineGroupsChirho: RawTextBlockChirho[][] = [];
  for (const blockChirho of sortedChirho) {
    const lastChirho = lineGroupsChirho[lineGroupsChirho.length - 1];
    if (
      lastChirho &&
      Math.abs(
        lastChirho[0]!.topChirho + lastChirho[0]!.heightChirho / 2 -
          (blockChirho.topChirho + blockChirho.heightChirho / 2)
      ) < LINE_Y_TOL_PX_CHIRHO
    ) {
      lastChirho.push(blockChirho);
    } else {
      lineGroupsChirho.push([blockChirho]);
    }
  }

  const linesChirho: FontAwareLineChirho[] = [];
  for (const groupChirho of lineGroupsChirho) {
    groupChirho.sort((aChirho, bChirho) => aChirho.leftChirho - bChirho.leftChirho);

    const wordsChirho: FontAwareWordChirho[] = [];

    for (const blockChirho of groupChirho) {
      const familyChirho = fontByIdChirho.get(blockChirho.fontIdChirho) ?? "";
      const scriptChirho = classifyFontFamilyChirho(familyChirho);
      const blockXMinChirho = blockChirho.leftChirho * dpiScaleChirho;
      const blockXMaxChirho =
        (blockChirho.leftChirho + blockChirho.widthChirho) * dpiScaleChirho;
      const blockYMinChirho = blockChirho.topChirho * dpiScaleChirho;
      const blockYMaxChirho =
        (blockChirho.topChirho + blockChirho.heightChirho) * dpiScaleChirho;
      const trimmedChirho = blockChirho.textChirho.trim();
      if (trimmedChirho.length === 0) continue;

      if (scriptChirho === "latin-chirho") {
        const tokensChirho = trimmedChirho.split(/\s+/);
        if (tokensChirho.length === 0) continue;
        const widthPerCharChirho =
          (blockXMaxChirho - blockXMinChirho) /
          Math.max(1, blockChirho.textChirho.length);
        let cursorXChirho = blockXMinChirho;
        const leadWsChirho =
          blockChirho.textChirho.length - blockChirho.textChirho.trimStart().length;
        cursorXChirho += leadWsChirho * widthPerCharChirho;
        for (let iChirho = 0; iChirho < tokensChirho.length; iChirho++) {
          const tChirho = tokensChirho[iChirho]!;
          const widthChirho = tChirho.length * widthPerCharChirho;
          wordsChirho.push({
            textChirho: tChirho,
            xMinChirho: cursorXChirho,
            yMinChirho: blockYMinChirho,
            xMaxChirho: cursorXChirho + widthChirho,
            yMaxChirho: blockYMaxChirho,
            scriptHintChirho: "latin-chirho",
          });
          cursorXChirho += widthChirho + widthPerCharChirho;
        }
      } else {
        const lastWordChirho = wordsChirho[wordsChirho.length - 1];
        const adjacentChirho =
          lastWordChirho &&
          lastWordChirho.scriptHintChirho === scriptChirho &&
          blockXMinChirho - lastWordChirho.xMaxChirho < 30 * dpiScaleChirho;
        if (adjacentChirho) {
          lastWordChirho.xMaxChirho = blockXMaxChirho;
          lastWordChirho.yMinChirho = Math.min(
            lastWordChirho.yMinChirho,
            blockYMinChirho
          );
          lastWordChirho.yMaxChirho = Math.max(
            lastWordChirho.yMaxChirho,
            blockYMaxChirho
          );
          lastWordChirho.textChirho += blockChirho.textChirho;
        } else {
          wordsChirho.push({
            textChirho: trimmedChirho,
            xMinChirho: blockXMinChirho,
            yMinChirho: blockYMinChirho,
            xMaxChirho: blockXMaxChirho,
            yMaxChirho: blockYMaxChirho,
            scriptHintChirho: scriptChirho,
          });
        }
      }
    }

    if (wordsChirho.length === 0) continue;

    const lineXMinChirho = Math.min(...wordsChirho.map((wChirho) => wChirho.xMinChirho));
    const lineXMaxChirho = Math.max(...wordsChirho.map((wChirho) => wChirho.xMaxChirho));
    const lineYMinChirho = Math.min(...wordsChirho.map((wChirho) => wChirho.yMinChirho));
    const lineYMaxChirho = Math.max(...wordsChirho.map((wChirho) => wChirho.yMaxChirho));

    linesChirho.push({
      xMinChirho: lineXMinChirho,
      yMinChirho: lineYMinChirho,
      xMaxChirho: lineXMaxChirho,
      yMaxChirho: lineYMaxChirho,
      wordsChirho,
    });
  }

  return linesChirho;
}

/** Top-level convenience: run pdftohtml + parse + group into lines. */
export async function extractFontAwareLinesChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number,
  dpiScaleChirho: number
): Promise<FontAwareLineChirho[]> {
  const xmlChirho = await pdftohtmlXmlChirho(volumeNumberChirho, pageNumberChirho);
  const { fontByIdChirho, blocksChirho } = parsePdftohtmlXmlChirho(xmlChirho);
  return blocksToLinesChirho(blocksChirho, fontByIdChirho, dpiScaleChirho);
}

if (import.meta.main) {
  const volChirho = parseInt(process.argv[2] ?? "5", 10);
  const pageChirho = parseInt(process.argv[3] ?? "150", 10);
  const dpiScaleChirho = parseFloat(process.argv[4] ?? "1.5");
  const linesChirho = await extractFontAwareLinesChirho(
    volChirho,
    pageChirho,
    dpiScaleChirho
  );
  for (let iChirho = 0; iChirho < linesChirho.length; iChirho++) {
    const lChirho = linesChirho[iChirho]!;
    console.log(
      `--- line ${iChirho} y=${Math.round(lChirho.yMinChirho)}-${Math.round(lChirho.yMaxChirho)} ${lChirho.wordsChirho.length} words ---`
    );
    for (const wChirho of lChirho.wordsChirho) {
      const tagChirho = wChirho.scriptHintChirho.replace("-chirho", "").toUpperCase();
      console.log(
        `  [${tagChirho.padEnd(7)}] x=${Math.round(wChirho.xMinChirho)}-${Math.round(wChirho.xMaxChirho)}  "${wChirho.textChirho}"`
      );
    }
  }
}
