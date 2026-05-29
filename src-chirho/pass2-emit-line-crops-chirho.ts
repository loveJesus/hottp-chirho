// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Pass 2 — emit per-line crop PNGs from approved scanline bboxes.
 *
 * For each pilot page:
 *   1. Look up scanlines_chirho rows + the page PNG path
 *   2. For each line, crop the page PNG to a strip via ImageMagick
 *   3. Write to SCANLINES_DIR_CHIRHO/vol-N-chirho/page-NNNN-chirho/line-NNN-chirho.png
 *
 * Crops use coords already padded by pass1 (top=6, bottom=12), clipped to page bounds.
 * Existing crops for the page are wiped first so a re-run never leaves stale lines around.
 *
 * CLI:
 *   bun src-chirho/pass2-emit-line-crops-chirho.ts --pilot
 *   bun src-chirho/pass2-emit-line-crops-chirho.ts --vol=2 --page=150
 *   bun src-chirho/pass2-emit-line-crops-chirho.ts --vol=3 --start=148 --end=152
 */

import { join } from "path";
import { existsSync, rmSync, readdirSync } from "fs";

import { PROJECT_ROOT_CHIRHO, SCANLINES_DIR_CHIRHO } from "./config-chirho.ts";
import {
  dbChirho,
  initDbChirho,
  logStepStartChirho,
  logStepEndChirho,
} from "./db-chirho.ts";
import { pagesChirho, scanlinesChirho } from "./schema-db-chirho.ts";
import { runCmdChirho, ensureDirChirho, logChirho } from "./utils-chirho.ts";
import { eq, and } from "drizzle-orm";

const MODULE_CHIRHO = "pass2-emit-line-crops-chirho";
const AGENT_CODE_CHIRHO = "pass2-emit-line-crops-chirho";

const PILOT_VOLS_CHIRHO = [1, 2, 3, 4, 5] as const;
const PILOT_START_CHIRHO = 148;
const PILOT_END_CHIRHO = 152;
const VOL5_PDFTOHTML_XML_WIDTH_CHIRHO = 892.0;
const VOL5_PDFTOHTML_XML_HEIGHT_CHIRHO = 1263.0;
const VOL5_STORED_XML_SCALE_CHIRHO = 300.0 / 72.0;

/** Directory where line crops for one page live */
function pageCropDirChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): string {
  return join(
    SCANLINES_DIR_CHIRHO,
    `vol-${volumeNumberChirho}-chirho`,
    `page-${String(pageNumberChirho).padStart(4, "0")}-chirho`
  );
}

/** File path for one line crop */
function lineCropPathChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number,
  lineIndexChirho: number
): string {
  return join(
    pageCropDirChirho(volumeNumberChirho, pageNumberChirho),
    `line-${String(lineIndexChirho).padStart(3, "0")}-chirho.png`
  );
}

function canonicalPageImagePathChirho(volumeNumberChirho: number, pageNumberChirho: number): string {
  return join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "images-chirho",
    `vol-${volumeNumberChirho}-chirho`,
    `page-${String(pageNumberChirho).padStart(4, "0")}-chirho.png`
  );
}

function resolvePageImagePathChirho(
  storedImagePathChirho: string | null,
  volumeNumberChirho: number,
  pageNumberChirho: number
): string {
  if (storedImagePathChirho && existsSync(storedImagePathChirho)) return storedImagePathChirho;
  if (storedImagePathChirho) {
    const workspaceIndexChirho = storedImagePathChirho.lastIndexOf("workspace-chirho/");
    if (workspaceIndexChirho >= 0) {
      const relativeWorkspacePathChirho = storedImagePathChirho.slice(workspaceIndexChirho);
      const relocatedPathChirho = join(PROJECT_ROOT_CHIRHO, relativeWorkspacePathChirho);
      if (existsSync(relocatedPathChirho)) return relocatedPathChirho;
    }
  }
  return canonicalPageImagePathChirho(volumeNumberChirho, pageNumberChirho);
}

/** Wipe existing line PNGs in a page dir so we don't leave stale crops behind */
function wipePageCropsChirho(dirChirho: string): void {
  if (!existsSync(dirChirho)) return;
  for (const fileNameChirho of readdirSync(dirChirho)) {
    if (/^line-\d+-chirho\.png$/.test(fileNameChirho)) {
      rmSync(join(dirChirho, fileNameChirho));
    }
  }
}

interface ScanlineRowChirho {
  idChirho: number;
  lineIndexChirho: number;
  xMinChirho: number;
  yMinChirho: number;
  widthChirho: number;
  heightChirho: number;
}

interface CropBoxChirho {
  xChirho: number;
  yChirho: number;
  widthChirho: number;
  heightChirho: number;
}

interface ImageSizeChirho {
  widthChirho: number;
  heightChirho: number;
}

async function imageSizeChirho(imagePathChirho: string): Promise<ImageSizeChirho> {
  const outputChirho = await runCmdChirho([
    "magick",
    "identify",
    "-format",
    "%w %h",
    imagePathChirho,
  ]);
  const [widthTextChirho, heightTextChirho] = outputChirho.trim().split(/\s+/);
  const widthChirho = Number.parseInt(widthTextChirho ?? "", 10);
  const heightChirho = Number.parseInt(heightTextChirho ?? "", 10);
  if (!Number.isFinite(widthChirho) || !Number.isFinite(heightChirho)) {
    throw new Error(`Could not read image dimensions for ${imagePathChirho}: ${outputChirho}`);
  }
  return { widthChirho, heightChirho };
}

function cropBoxForScanlineChirho(
  volumeNumberChirho: number,
  pageImageSizeChirho: ImageSizeChirho,
  scanlineChirho: ScanlineRowChirho,
  shouldApplyVol5CalibrationChirho: boolean
): CropBoxChirho {
  if (volumeNumberChirho !== 5 || !shouldApplyVol5CalibrationChirho) {
    return {
      xChirho: Math.max(0, Math.round(scanlineChirho.xMinChirho)),
      yChirho: Math.max(0, Math.round(scanlineChirho.yMinChirho)),
      widthChirho: Math.round(scanlineChirho.widthChirho),
      heightChirho: Math.round(scanlineChirho.heightChirho),
    };
  }

  const scaleXChirho =
    pageImageSizeChirho.widthChirho /
    (VOL5_PDFTOHTML_XML_WIDTH_CHIRHO * VOL5_STORED_XML_SCALE_CHIRHO);
  const scaleYChirho =
    pageImageSizeChirho.heightChirho /
    (VOL5_PDFTOHTML_XML_HEIGHT_CHIRHO * VOL5_STORED_XML_SCALE_CHIRHO);
  const leftChirho = Math.max(0, Math.floor(scanlineChirho.xMinChirho * scaleXChirho));
  const topChirho = Math.max(0, Math.floor(scanlineChirho.yMinChirho * scaleYChirho));
  const rightChirho = Math.min(
    pageImageSizeChirho.widthChirho,
    Math.ceil((scanlineChirho.xMinChirho + scanlineChirho.widthChirho) * scaleXChirho)
  );
  const bottomChirho = Math.min(
    pageImageSizeChirho.heightChirho,
    Math.ceil((scanlineChirho.yMinChirho + scanlineChirho.heightChirho) * scaleYChirho)
  );
  return {
    xChirho: leftChirho,
    yChirho: topChirho,
    widthChirho: rightChirho - leftChirho,
    heightChirho: bottomChirho - topChirho,
  };
}

function shouldApplyVol5CalibrationChirho(
  volumeNumberChirho: number,
  pageImageSizeChirho: ImageSizeChirho,
  scanlinesChirho2: ScanlineRowChirho[]
): boolean {
  if (volumeNumberChirho !== 5 || scanlinesChirho2.length === 0) return false;
  return scanlinesChirho2.some(
    (scanlineChirho) =>
      scanlineChirho.xMinChirho + scanlineChirho.widthChirho > pageImageSizeChirho.widthChirho ||
      scanlineChirho.yMinChirho + scanlineChirho.heightChirho > pageImageSizeChirho.heightChirho
  );
}

/** Crop all line strips for one page in a single magick invocation (much faster than per-line spawn) */
async function cropPageChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number,
  pageImagePathChirho: string,
  scanlinesChirho2: ScanlineRowChirho[]
): Promise<{ okChirho: number; skippedChirho: number }> {
  if (scanlinesChirho2.length === 0) {
    return { okChirho: 0, skippedChirho: 0 };
  }

  const outDirChirho = pageCropDirChirho(volumeNumberChirho, pageNumberChirho);
  ensureDirChirho(outDirChirho);
  wipePageCropsChirho(outDirChirho);
  const pageImageSizeChirho = await imageSizeChirho(pageImagePathChirho);
  const shouldApplyVol5CalibrationChirho2 = shouldApplyVol5CalibrationChirho(
    volumeNumberChirho,
    pageImageSizeChirho,
    scanlinesChirho2
  );

  // Build a single ImageMagick batch:
  //   magick page.png \( -clone 0 -crop WxH+X+Y +repage -write out0.png +delete \) ... null:
  const argsChirho: string[] = ["magick", pageImagePathChirho];
  let skippedChirho = 0;
  for (const sChirho of scanlinesChirho2) {
    const cropBoxChirho = cropBoxForScanlineChirho(
      volumeNumberChirho,
      pageImageSizeChirho,
      sChirho,
      shouldApplyVol5CalibrationChirho2
    );
    const xChirho = cropBoxChirho.xChirho;
    const yChirho = cropBoxChirho.yChirho;
    const wChirho = cropBoxChirho.widthChirho;
    const hChirho = cropBoxChirho.heightChirho;
    if (wChirho <= 0 || hChirho <= 0) {
      skippedChirho++;
      continue;
    }
    const outPathChirho = lineCropPathChirho(
      volumeNumberChirho,
      pageNumberChirho,
      sChirho.lineIndexChirho
    );
    argsChirho.push(
      "(",
      "-clone",
      "0",
      "-crop",
      `${wChirho}x${hChirho}+${xChirho}+${yChirho}`,
      "+repage",
      "-write",
      outPathChirho,
      "+delete",
      ")"
    );
  }
  argsChirho.push("null:");

  await runCmdChirho(argsChirho);

  return {
    okChirho: scanlinesChirho2.length - skippedChirho,
    skippedChirho,
  };
}

async function pass2PageChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<{ okChirho: number; skippedChirho: number }> {
  const stepIdChirho = logStepStartChirho(
    AGENT_CODE_CHIRHO,
    `Pass 2 (line crops): vol ${volumeNumberChirho} p${pageNumberChirho}`
  );

  try {
    const pageRowsChirho = await dbChirho
      .select()
      .from(pagesChirho)
      .where(
        and(
          eq(pagesChirho.volumeNumberChirho, volumeNumberChirho),
          eq(pagesChirho.pageNumberChirho, pageNumberChirho)
        )
      )
      .limit(1);

    if (pageRowsChirho.length === 0) {
      throw new Error(
        `No page row for vol ${volumeNumberChirho} p${pageNumberChirho} (run pass1 first)`
      );
    }
    const pageRowChirho = pageRowsChirho[0]!;
    const imagePathChirho = resolvePageImagePathChirho(
      pageRowChirho.imagePathChirho,
      volumeNumberChirho,
      pageNumberChirho
    );
    if (!imagePathChirho || !existsSync(imagePathChirho)) {
      throw new Error(
        `Page image missing on disk for vol ${volumeNumberChirho} p${pageNumberChirho}: ${imagePathChirho}`
      );
    }

    const scanlineRowsChirho = await dbChirho
      .select({
        idChirho: scanlinesChirho.idChirho,
        lineIndexChirho: scanlinesChirho.lineIndexChirho,
        xMinChirho: scanlinesChirho.xMinChirho,
        yMinChirho: scanlinesChirho.yMinChirho,
        widthChirho: scanlinesChirho.widthChirho,
        heightChirho: scanlinesChirho.heightChirho,
      })
      .from(scanlinesChirho)
      .where(eq(scanlinesChirho.pageIdChirho, pageRowChirho.idChirho))
      .orderBy(scanlinesChirho.lineIndexChirho);

    const typedRowsChirho: ScanlineRowChirho[] = scanlineRowsChirho.map(
      (rChirho) => ({
        idChirho: rChirho.idChirho,
        lineIndexChirho: rChirho.lineIndexChirho,
        xMinChirho: Number(rChirho.xMinChirho ?? 0),
        yMinChirho: Number(rChirho.yMinChirho ?? 0),
        widthChirho: Number(rChirho.widthChirho ?? 0),
        heightChirho: Number(rChirho.heightChirho ?? 0),
      })
    );

    const resultChirho = await cropPageChirho(
      volumeNumberChirho,
      pageNumberChirho,
      imagePathChirho,
      typedRowsChirho
    );

    logChirho(
      MODULE_CHIRHO,
      `Vol ${volumeNumberChirho} p${pageNumberChirho}: cropped ${resultChirho.okChirho} lines (skipped ${resultChirho.skippedChirho})`
    );

    logStepEndChirho(
      stepIdChirho,
      `Cropped ${resultChirho.okChirho} lines, skipped ${resultChirho.skippedChirho}`,
      `Line crops emitted to ${pageCropDirChirho(volumeNumberChirho, pageNumberChirho)}.`
    );

    return resultChirho;
  } catch (errChirho) {
    logStepEndChirho(
      stepIdChirho,
      `Error: ${errChirho}`,
      `Pass 2 failed for vol ${volumeNumberChirho} p${pageNumberChirho}.`
    );
    throw errChirho;
  }
}

if (import.meta.main) {
  const argsChirho = process.argv.slice(2);
  const isPilotChirho = argsChirho.includes("--pilot");

  const volArgChirho = argsChirho
    .find((aChirho) => aChirho.startsWith("--vol="))
    ?.split("=")[1];
  const pageArgChirho = argsChirho
    .find((aChirho) => aChirho.startsWith("--page="))
    ?.split("=")[1];
  const startArgChirho = argsChirho
    .find((aChirho) => aChirho.startsWith("--start="))
    ?.split("=")[1];
  const endArgChirho = argsChirho
    .find((aChirho) => aChirho.startsWith("--end="))
    ?.split("=")[1];

  initDbChirho();

  interface TargetChirho {
    volChirho: number;
    pageChirho: number;
  }
  const targetsChirho: TargetChirho[] = [];

  if (isPilotChirho) {
    for (const vChirho of PILOT_VOLS_CHIRHO) {
      for (
        let pChirho = PILOT_START_CHIRHO;
        pChirho <= PILOT_END_CHIRHO;
        pChirho++
      ) {
        targetsChirho.push({ volChirho: vChirho, pageChirho: pChirho });
      }
    }
  } else if (volArgChirho && pageArgChirho) {
    targetsChirho.push({
      volChirho: parseInt(volArgChirho, 10),
      pageChirho: parseInt(pageArgChirho, 10),
    });
  } else if (volArgChirho && startArgChirho && endArgChirho) {
    const volChirho = parseInt(volArgChirho, 10);
    const startChirho = parseInt(startArgChirho, 10);
    const endChirho = parseInt(endArgChirho, 10);
    for (let pChirho = startChirho; pChirho <= endChirho; pChirho++) {
      targetsChirho.push({ volChirho, pageChirho: pChirho });
    }
  } else {
    console.error(
      "Usage:\n" +
        "  --pilot                       (vols 1-5, pages 148-152)\n" +
        "  --vol=N --page=X              (single page)\n" +
        "  --vol=N --start=X --end=Y     (page range within a vol)"
    );
    process.exit(1);
  }

  let pagesOkChirho = 0;
  let pagesFailChirho = 0;
  let totalLinesChirho = 0;
  let totalSkippedChirho = 0;
  for (const tChirho of targetsChirho) {
    try {
      const rChirho = await pass2PageChirho(tChirho.volChirho, tChirho.pageChirho);
      pagesOkChirho++;
      totalLinesChirho += rChirho.okChirho;
      totalSkippedChirho += rChirho.skippedChirho;
    } catch (errChirho) {
      pagesFailChirho++;
      logChirho(
        MODULE_CHIRHO,
        `FAILED vol ${tChirho.volChirho} p${tChirho.pageChirho}: ${errChirho}`
      );
    }
  }

  logChirho(
    MODULE_CHIRHO,
    `\nPass 2 done: ${pagesOkChirho} pages ok, ${pagesFailChirho} failed, ${totalLinesChirho} crops written, ${totalSkippedChirho} skipped.`
  );
}
