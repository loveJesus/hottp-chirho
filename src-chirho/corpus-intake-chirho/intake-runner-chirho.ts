// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Full-corpus intake, Phase 1: Pass A (page image + line boxes) for every
 * PDF page outside the protected set, into the intake's own SQLite and
 * artifact tree. Local only: no D1, R2, VPS or Worker access.
 *
 * Resumable and idempotent per page: an extracted page whose image is still
 * on disk is skipped; anything else is redone from scratch. Bounded
 * parallelism; first Ctrl-C finishes the pages in flight and stops.
 *
 * CLI:
 *   bun src-chirho/corpus-intake-chirho/intake-runner-chirho.ts --all
 *   bun src-chirho/corpus-intake-chirho/intake-runner-chirho.ts --vol=2,3 [--concurrency=9]
 *   bun src-chirho/corpus-intake-chirho/intake-runner-chirho.ts --vol=1 --start=1 --end=40
 *   ... [--limit=N] [--skip-failed] [--dry-run]
 *
 * Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
 */

import type { Database } from "bun:sqlite";
import { existsSync, statSync } from "fs";
import { dirname, join } from "path";

import { PROGRESS_DB_PATH_CHIRHO } from "../config-chirho.ts";
import { extractPlainTextChirho, pdfPathChirho } from "../extract-text-chirho.ts";
import { ensureDirChirho, logChirho, parseCliArgPrefixValueChirho, runCmdChirho } from "../utils-chirho.ts";
import {
  DEFAULT_CONCURRENCY_CHIRHO,
  INTAKE_DB_PATH_CHIRHO,
  INTAKE_ROOT_DIR_CHIRHO,
  INTAKE_VOLUMES_CHIRHO,
  intakeImageRelPathChirho,
  pageKeyChirho,
} from "./intake-config-chirho.ts";
import {
  donePagesChirho,
  failedPageKeysChirho,
  finishRunChirho,
  openIntakeDbChirho,
  recordPageDoneChirho,
  recordPageFailedChirho,
  startRunChirho,
  type DonePageChirho,
} from "./intake-db-chirho.ts";
import {
  GEOMETRY_VERSION_CHIRHO,
  geometrySourceChirho,
  lineBoxOutsideImageChirho,
  pageLineBboxesChirho,
  renderPageImageToPathChirho,
} from "./page-geometry-chirho.ts";
import { protectedPagesChirho } from "./protected-pages-chirho.ts";

const MODULE_CHIRHO = "corpus-intake-chirho";
const PROGRESS_EVERY_MS_CHIRHO = 15_000;

export interface IntakeArgsChirho {
  volumesChirho: number[];
  startChirho: number | null;
  endChirho: number | null;
  concurrencyChirho: number;
  limitChirho: number | null;
  skipFailedChirho: boolean;
  dryRunChirho: boolean;
}

export interface IntakeTargetChirho {
  volumeNumberChirho: number;
  pageNumberChirho: number;
}

function positiveIntChirho(textChirho: string, flagChirho: string): number {
  const nChirho = Number(textChirho);
  if (!Number.isInteger(nChirho) || nChirho < 1) throw new Error(`${flagChirho} must be a positive integer`);
  return nChirho;
}

export function parseIntakeArgsChirho(argvChirho: string[]): IntakeArgsChirho {
  const argsChirho: IntakeArgsChirho = {
    volumesChirho: [],
    startChirho: null,
    endChirho: null,
    concurrencyChirho: DEFAULT_CONCURRENCY_CHIRHO,
    limitChirho: null,
    skipFailedChirho: false,
    dryRunChirho: false,
  };
  let allChirho = false;
  for (const aChirho of argvChirho) {
    let vChirho: string | null;
    if (aChirho === "--all") allChirho = true;
    else if (aChirho === "--skip-failed") argsChirho.skipFailedChirho = true;
    else if (aChirho === "--dry-run") argsChirho.dryRunChirho = true;
    else if ((vChirho = parseCliArgPrefixValueChirho(aChirho, "--vol=")) !== null) {
      argsChirho.volumesChirho = vChirho.split(",").map((sChirho) => positiveIntChirho(sChirho, "--vol"));
    } else if ((vChirho = parseCliArgPrefixValueChirho(aChirho, "--start=")) !== null) {
      argsChirho.startChirho = positiveIntChirho(vChirho, "--start");
    } else if ((vChirho = parseCliArgPrefixValueChirho(aChirho, "--end=")) !== null) {
      argsChirho.endChirho = positiveIntChirho(vChirho, "--end");
    } else if ((vChirho = parseCliArgPrefixValueChirho(aChirho, "--concurrency=")) !== null) {
      argsChirho.concurrencyChirho = positiveIntChirho(vChirho, "--concurrency");
    } else if ((vChirho = parseCliArgPrefixValueChirho(aChirho, "--limit=")) !== null) {
      argsChirho.limitChirho = positiveIntChirho(vChirho, "--limit");
    } else throw new Error(`unknown argument: ${aChirho}`);
  }
  if (allChirho === (argsChirho.volumesChirho.length > 0)) throw new Error("pass exactly one of --all or --vol=N[,M]");
  if (allChirho) argsChirho.volumesChirho = [...INTAKE_VOLUMES_CHIRHO];
  for (const vChirho of argsChirho.volumesChirho) {
    if (!INTAKE_VOLUMES_CHIRHO.includes(vChirho)) throw new Error(`unknown volume ${vChirho}`);
  }
  if ((argsChirho.startChirho !== null || argsChirho.endChirho !== null) && argsChirho.volumesChirho.length !== 1) {
    throw new Error("--start/--end need exactly one --vol");
  }
  if (argsChirho.startChirho !== null && argsChirho.endChirho !== null && argsChirho.startChirho > argsChirho.endChirho) {
    throw new Error("--start is after --end");
  }
  return argsChirho;
}

export async function pdfPageCountChirho(volumeNumberChirho: number): Promise<number> {
  const infoChirho = await runCmdChirho(["pdfinfo", pdfPathChirho(volumeNumberChirho)]);
  const mChirho = infoChirho.match(/^Pages:\s+(\d+)\s*$/m);
  if (!mChirho) throw new Error(`pdfinfo gave no page count for vol ${volumeNumberChirho}`);
  return Number(mChirho[1]);
}

/**
 * The pages a run will process, in volume then page order. Protected pages
 * are never targets; done pages are skipped while `stillValidChirho` holds
 * (current geometry version, image still on disk).
 */
export function planTargetsChirho(
  argsChirho: IntakeArgsChirho,
  pageCountsChirho: Map<number, number>,
  protectedKeysChirho: Set<string>,
  doneChirho: Map<string, DonePageChirho>,
  failedKeysChirho: Set<string>,
  stillValidChirho: (donePageChirho: DonePageChirho) => boolean
): { targetsChirho: IntakeTargetChirho[]; protectedChirho: number; alreadyDoneChirho: number; skippedFailedChirho: number } {
  const targetsChirho: IntakeTargetChirho[] = [];
  let protectedChirho = 0;
  let alreadyDoneChirho = 0;
  let skippedFailedChirho = 0;
  for (const vChirho of argsChirho.volumesChirho) {
    const countChirho = pageCountsChirho.get(vChirho);
    if (countChirho === undefined) throw new Error(`no page count for vol ${vChirho}`);
    const firstChirho = argsChirho.startChirho ?? 1;
    const lastChirho = Math.min(argsChirho.endChirho ?? countChirho, countChirho);
    for (let pChirho = firstChirho; pChirho <= lastChirho; pChirho++) {
      const keyChirho = pageKeyChirho(vChirho, pChirho);
      if (protectedKeysChirho.has(keyChirho)) {
        protectedChirho++;
        continue;
      }
      const doneRowChirho = doneChirho.get(keyChirho);
      if (doneRowChirho && stillValidChirho(doneRowChirho)) {
        alreadyDoneChirho++;
        continue;
      }
      if (argsChirho.skipFailedChirho && failedKeysChirho.has(keyChirho)) {
        skippedFailedChirho++;
        continue;
      }
      targetsChirho.push({ volumeNumberChirho: vChirho, pageNumberChirho: pChirho });
    }
  }
  const limitedChirho = argsChirho.limitChirho === null ? targetsChirho : targetsChirho.slice(0, argsChirho.limitChirho);
  return { targetsChirho: limitedChirho, protectedChirho, alreadyDoneChirho, skippedFailedChirho };
}

/** Width and height from a PNG's IHDR chunk. */
export function pngSizeChirho(bytesChirho: Uint8Array): { widthChirho: number; heightChirho: number } {
  const signatureChirho = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const isPngChirho = bytesChirho.length >= 24 && signatureChirho.every((bChirho, iChirho) => bytesChirho[iChirho] === bChirho);
  const ihdrChirho = new TextDecoder().decode(bytesChirho.subarray(12, 16));
  if (!isPngChirho || ihdrChirho !== "IHDR") throw new Error("not a PNG with a leading IHDR chunk");
  const viewChirho = new DataView(bytesChirho.buffer, bytesChirho.byteOffset, bytesChirho.byteLength);
  return { widthChirho: viewChirho.getUint32(16), heightChirho: viewChirho.getUint32(20) };
}

function donePageStillValidChirho(donePageChirho: DonePageChirho): boolean {
  if (donePageChirho.geometryVersionChirho !== GEOMETRY_VERSION_CHIRHO) return false;
  const absChirho = join(INTAKE_ROOT_DIR_CHIRHO, donePageChirho.imageRelPathChirho);
  return existsSync(absChirho) && statSync(absChirho).size === donePageChirho.imageBytesChirho;
}

async function toolVersionsChirho(): Promise<Record<string, string>> {
  const firstLineChirho = async (cmdChirho: string[]): Promise<string> => {
    const procChirho = Bun.spawn(cmdChirho, { stdout: "pipe", stderr: "pipe" });
    const outChirho = (await new Response(procChirho.stdout).text()) + (await new Response(procChirho.stderr).text());
    await procChirho.exited;
    return outChirho.trim().split("\n")[0] ?? "";
  };
  return {
    tesseract_chirho: await firstLineChirho(["tesseract", "--version"]),
    magick_chirho: await firstLineChirho(["magick", "-version"]),
    pdftoppm_chirho: await firstLineChirho(["pdftoppm", "-v"]),
    pdftohtml_chirho: await firstLineChirho(["pdftohtml", "-v"]),
  };
}

async function processPageChirho(dbChirho: Database, runIdChirho: number, tChirho: IntakeTargetChirho): Promise<boolean> {
  const t0Chirho = performance.now();
  const { volumeNumberChirho, pageNumberChirho } = tChirho;
  try {
    const relChirho = intakeImageRelPathChirho(volumeNumberChirho, pageNumberChirho);
    const absChirho = join(INTAKE_ROOT_DIR_CHIRHO, relChirho);
    ensureDirChirho(dirname(absChirho));
    await renderPageImageToPathChirho(volumeNumberChirho, pageNumberChirho, absChirho);
    const linesChirho = await pageLineBboxesChirho(volumeNumberChirho, pageNumberChirho, absChirho);
    const frenchTextChirho = await extractPlainTextChirho(volumeNumberChirho, pageNumberChirho);
    const bytesChirho = await Bun.file(absChirho).bytes();
    const { widthChirho, heightChirho } = pngSizeChirho(bytesChirho);
    const outsideChirho = lineBoxOutsideImageChirho(linesChirho, widthChirho, heightChirho);
    if (outsideChirho) {
      throw new Error(
        `line box ${outsideChirho.xMinChirho},${outsideChirho.yMinChirho}-${outsideChirho.xMaxChirho},${outsideChirho.yMaxChirho} ` +
          `lies outside the ${widthChirho}x${heightChirho} page image`
      );
    }
    recordPageDoneChirho(dbChirho, runIdChirho, {
      volumeNumberChirho,
      pageNumberChirho,
      imageRelPathChirho: relChirho,
      imageSha256Chirho: new Bun.CryptoHasher("sha256").update(bytesChirho).digest("hex"),
      imageBytesChirho: bytesChirho.byteLength,
      imageWidthChirho: widthChirho,
      imageHeightChirho: heightChirho,
      frenchTextChirho,
      geometrySourceChirho: geometrySourceChirho(volumeNumberChirho),
      geometryVersionChirho: GEOMETRY_VERSION_CHIRHO,
      linesChirho,
      elapsedMsChirho: Math.round(performance.now() - t0Chirho),
    });
    return true;
  } catch (errChirho) {
    const messageChirho = errChirho instanceof Error ? errChirho.message : String(errChirho);
    recordPageFailedChirho(dbChirho, runIdChirho, volumeNumberChirho, pageNumberChirho, messageChirho, Math.round(performance.now() - t0Chirho));
    logChirho(MODULE_CHIRHO, `FAILED vol ${volumeNumberChirho} p${pageNumberChirho}: ${messageChirho.split("\n")[0]}`);
    return false;
  }
}

async function mainChirho(): Promise<void> {
  const argsChirho = parseIntakeArgsChirho(process.argv.slice(2));
  const protectedChirho = protectedPagesChirho(PROGRESS_DB_PATH_CHIRHO);
  const pageCountsChirho = new Map<number, number>();
  for (const vChirho of argsChirho.volumesChirho) pageCountsChirho.set(vChirho, await pdfPageCountChirho(vChirho));

  const dbExistsChirho = existsSync(INTAKE_DB_PATH_CHIRHO);
  if (argsChirho.dryRunChirho && !dbExistsChirho) {
    const planChirho = planTargetsChirho(argsChirho, pageCountsChirho, protectedChirho.keysChirho, new Map(), new Set(), () => false);
    console.log(JSON.stringify({ dry_run_chirho: true, page_counts_chirho: Object.fromEntries(pageCountsChirho),
      targets_chirho: planChirho.targetsChirho.length, protected_chirho: planChirho.protectedChirho,
      protected_extra_chirho: protectedChirho.extraKeysChirho, already_done_chirho: 0 }, null, 2));
    return;
  }

  const dbChirho = openIntakeDbChirho(INTAKE_DB_PATH_CHIRHO);
  const planChirho = planTargetsChirho(argsChirho, pageCountsChirho, protectedChirho.keysChirho,
    donePagesChirho(dbChirho), failedPageKeysChirho(dbChirho), donePageStillValidChirho);
  const summaryChirho = {
    page_counts_chirho: Object.fromEntries(pageCountsChirho),
    targets_chirho: planChirho.targetsChirho.length,
    protected_chirho: planChirho.protectedChirho,
    protected_extra_chirho: protectedChirho.extraKeysChirho,
    already_done_chirho: planChirho.alreadyDoneChirho,
    skipped_failed_chirho: planChirho.skippedFailedChirho,
    concurrency_chirho: argsChirho.concurrencyChirho,
  };
  if (argsChirho.dryRunChirho) {
    console.log(JSON.stringify({ dry_run_chirho: true, ...summaryChirho }, null, 2));
    dbChirho.close();
    return;
  }
  logChirho(MODULE_CHIRHO, `plan ${JSON.stringify(summaryChirho)}`);

  // One thread per tesseract/ImageMagick process; the pool supplies the parallelism.
  process.env.OMP_THREAD_LIMIT ??= "1";
  process.env.MAGICK_THREAD_LIMIT ??= "1";

  const runIdChirho = startRunChirho(dbChirho, argsChirho, argsChirho.concurrencyChirho, await toolVersionsChirho());
  let nextChirho = 0;
  let doneChirho = 0;
  let failedChirho = 0;
  let stopChirho = false;
  process.on("SIGINT", () => {
    if (stopChirho) process.exit(130);
    stopChirho = true;
    logChirho(MODULE_CHIRHO, "stopping after the pages in flight (Ctrl-C again to quit now)");
  });

  const t0Chirho = performance.now();
  let lastReportChirho = t0Chirho;
  const reportChirho = (forceChirho: boolean): void => {
    const nowChirho = performance.now();
    if (!forceChirho && nowChirho - lastReportChirho < PROGRESS_EVERY_MS_CHIRHO) return;
    lastReportChirho = nowChirho;
    const finishedChirho = doneChirho + failedChirho;
    const rateChirho = finishedChirho / ((nowChirho - t0Chirho) / 1000);
    const etaMinChirho = rateChirho > 0 ? (planChirho.targetsChirho.length - finishedChirho) / rateChirho / 60 : 0;
    logChirho(MODULE_CHIRHO, `progress ${finishedChirho}/${planChirho.targetsChirho.length} ` +
      `(${failedChirho} failed) ${rateChirho.toFixed(2)} pages/s, about ${etaMinChirho.toFixed(1)} min left`);
  };

  const workerChirho = async (): Promise<void> => {
    while (!stopChirho) {
      const iChirho = nextChirho++;
      const targetChirho = planChirho.targetsChirho[iChirho];
      if (!targetChirho) return;
      if (await processPageChirho(dbChirho, runIdChirho, targetChirho)) doneChirho++;
      else failedChirho++;
      reportChirho(false);
    }
  };
  await Promise.all(Array.from({ length: argsChirho.concurrencyChirho }, workerChirho));
  reportChirho(true);

  finishRunChirho(dbChirho, runIdChirho, {
    doneChirho, failedChirho, skippedChirho: planChirho.alreadyDoneChirho, stoppedEarlyChirho: stopChirho,
  });
  dbChirho.close();
  logChirho(MODULE_CHIRHO, `run ${runIdChirho} ${stopChirho ? "stopped early" : "complete"}: ` +
    `${doneChirho} extracted, ${failedChirho} failed, ${planChirho.alreadyDoneChirho} already done, ` +
    `${((performance.now() - t0Chirho) / 60_000).toFixed(1)} min`);
  if (failedChirho > 0) process.exitCode = 1;
}

if (import.meta.main) {
  await mainChirho();
}
