// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { existsSync } from "node:fs";
import { reviewServerNoStoreHeadersChirho } from "../review-server-health-chirho.ts";
import type { QueueItemChirho } from "./types-chirho.ts";

export async function spanImageResponseChirho(itemChirho: QueueItemChirho): Promise<Response> {
  if (!existsSync(itemChirho.lineImagePathChirho)) return new Response("not found", { status: 404 });
  const cropSpecChirho =
    `${itemChirho.zoomCropWidthPxChirho}x${itemChirho.zoomCropHeightPxChirho}` +
    `+${itemChirho.zoomCropXMinPxChirho}+${itemChirho.zoomCropYMinPxChirho}`;
  const imageMagickExecutableChirho = imageMagickCommandChirho();
  const procChirho = Bun.spawn([
    imageMagickExecutableChirho,
    itemChirho.lineImagePathChirho,
    "-crop",
    cropSpecChirho,
    "+repage",
    "png:-",
  ], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const outputChirho = await new Response(procChirho.stdout).arrayBuffer();
  const errorOutputChirho = await new Response(procChirho.stderr).text();
  const exitCodeChirho = await procChirho.exited;
  if (exitCodeChirho !== 0) {
    return new Response(errorOutputChirho || "crop failed", { status: 500 });
  }
  return new Response(outputChirho, { headers: reviewServerNoStoreHeadersChirho("image/png") });
}

function imageMagickCommandChirho(): string {
  const resultChirho = Bun.spawnSync(["sh", "-lc", "command -v magick || command -v convert"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  if (resultChirho.exitCode !== 0) {
    throw new Error('ImageMagick executable not found in $PATH: expected "magick" or "convert"');
  }
  const commandChirho = resultChirho.stdout.toString().trim().split("\n")[0]?.trim();
  if (commandChirho === undefined || commandChirho.length === 0) {
    throw new Error('ImageMagick executable not found in $PATH: expected "magick" or "convert"');
  }
  return commandChirho;
}
