// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Render a page image with translucent blue line overlays + line index labels.
 *
 * Reads scanlines_chirho rows from local SQLite, draws onto the canonical PNG
 * (using ImageMagick), saves to workspace-chirho/annotated-chirho/.
 * Open the resulting PNG with any image viewer to eyeball line geometry.
 *
 * Usage:
 *   bun src-chirho/visualize-lines-chirho.ts --vol=5 --page=150
 *   bun src-chirho/visualize-lines-chirho.ts --vol=1 --start=148 --end=152
 *   bun src-chirho/visualize-lines-chirho.ts --pilot   (vols 1-5, pages 148-152)
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { initDbChirho, sqliteChirho } from "./db-chirho.ts";
import { runCmdChirho, ensureDirChirho, logChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "visualize-lines-chirho";
const ANNOTATED_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "annotated-chirho"
);
const SPANS_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho"
);

interface ScanlineRowChirho {
  line_index_chirho: number;
  x_min_chirho: number;
  y_min_chirho: number;
  width_chirho: number;
  height_chirho: number;
}

/** Span JSON shape produced by Pass C (per-line agent reads). */
interface SpanFileChirho {
  spansChirho: Array<{
    xMinPxChirho: number;
    widthPxChirho: number;
    scriptChirho: string;
  }>;
}

/**
 * Translucent fill for non-French segment overlays, keyed by scriptChirho.
 * French is intentionally absent — we don't paint French spans (the line
 * bbox already shows them) so non-French chunks visually pop.
 */
const SCRIPT_FILL_CHIRHO: Record<string, string> = {
  "hebrew-chirho": "rgba(220, 50, 50, 0.40)",
  "greek-chirho": "rgba(40, 170, 70, 0.40)",
  "syriac-chirho": "rgba(160, 80, 200, 0.40)",
  "arabic-chirho": "rgba(180, 120, 40, 0.40)",
  "latin-non-french-chirho": "rgba(230, 140, 0, 0.40)",
  "symbol-chirho": "rgba(220, 200, 0, 0.40)",
  "unknown-chirho": "rgba(120, 120, 120, 0.40)",
};

/** Try to load span JSON for a scanline. Returns null if not yet produced. */
function loadSpansForLineChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number,
  lineIndexChirho: number
): SpanFileChirho | null {
  const pathChirho = join(
    SPANS_DIR_CHIRHO,
    `vol-${volumeNumberChirho}-chirho`,
    `page-${String(pageNumberChirho).padStart(4, "0")}-chirho`,
    `line-${String(lineIndexChirho).padStart(3, "0")}-chirho.json`
  );
  if (!existsSync(pathChirho)) return null;
  try {
    return JSON.parse(readFileSync(pathChirho, "utf8")) as SpanFileChirho;
  } catch {
    return null;
  }
}

function resolvePageImagePathChirho(imagePathChirho: string): string {
  if (existsSync(imagePathChirho)) return imagePathChirho;
  const normalizedPathChirho = imagePathChirho.replaceAll("\\", "/");
  const workspaceMarkerChirho = "workspace-chirho/";
  const workspaceIndexChirho = normalizedPathChirho.indexOf(workspaceMarkerChirho);
  if (workspaceIndexChirho === -1) return imagePathChirho;
  const workspaceRelativePathChirho = normalizedPathChirho.slice(workspaceIndexChirho).split("/");
  const localPathChirho = join(PROJECT_ROOT_CHIRHO, ...workspaceRelativePathChirho);
  return existsSync(localPathChirho) ? localPathChirho : imagePathChirho;
}

async function annotatePageChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<string> {
  const pageRowChirho = sqliteChirho
    .query(
      `SELECT id_chirho, image_path_chirho FROM pages_chirho
       WHERE volume_number_chirho = ? AND page_number_chirho = ?`
    )
    .get(volumeNumberChirho, pageNumberChirho) as
    | { id_chirho: number; image_path_chirho: string }
    | null;

  if (!pageRowChirho) {
    throw new Error(
      `No page row for vol ${volumeNumberChirho} p${pageNumberChirho} — run pass1-extract-lines-chirho first`
    );
  }
  const pageImagePathChirho = resolvePageImagePathChirho(pageRowChirho.image_path_chirho);
  if (!existsSync(pageImagePathChirho)) {
    throw new Error(`Image missing on disk: ${pageRowChirho.image_path_chirho}`);
  }

  const linesChirho = sqliteChirho
    .query(
      `SELECT line_index_chirho, x_min_chirho, y_min_chirho,
              width_chirho, height_chirho
       FROM scanlines_chirho WHERE page_id_chirho = ?
       ORDER BY line_index_chirho`
    )
    .all(pageRowChirho.id_chirho) as ScanlineRowChirho[];

  const outputDirChirho = join(
    ANNOTATED_DIR_CHIRHO,
    `vol-${volumeNumberChirho}-chirho`
  );
  ensureDirChirho(outputDirChirho);
  const outputPathChirho = join(
    outputDirChirho,
    `page-${String(pageNumberChirho).padStart(4, "0")}-chirho.png`
  );

  // Build magick draw args: blue translucent rectangles, then red index labels.
  const argsChirho: string[] = [
    "magick",
    pageImagePathChirho,
    "-fill",
    "rgba(80, 140, 255, 0.20)",
    "-stroke",
    "rgba(40, 100, 220, 0.90)",
    "-strokewidth",
    "2",
  ];

  for (const lChirho of linesChirho) {
    const xMaxChirho = lChirho.x_min_chirho + lChirho.width_chirho;
    const yMaxChirho = lChirho.y_min_chirho + lChirho.height_chirho;
    argsChirho.push(
      "-draw",
      `rectangle ${lChirho.x_min_chirho},${lChirho.y_min_chirho} ${xMaxChirho},${yMaxChirho}`
    );
  }

  // Layer 2 — non-French segment overlays from Pass C span JSON, if present.
  // Grouped by script color so we set -fill once per group (magick state is sticky).
  const segmentGroupsChirho = new Map<
    string,
    Array<{
      pageXChirho: number;
      pageYChirho: number;
      pageX2Chirho: number;
      pageY2Chirho: number;
    }>
  >();
  let segmentCountChirho = 0;
  for (const lChirho of linesChirho) {
    const spansFileChirho = loadSpansForLineChirho(
      volumeNumberChirho,
      pageNumberChirho,
      lChirho.line_index_chirho
    );
    if (!spansFileChirho) continue;
    for (const spanChirho of spansFileChirho.spansChirho) {
      if (spanChirho.scriptChirho === "french-chirho") continue;
      const fillChirho =
        SCRIPT_FILL_CHIRHO[spanChirho.scriptChirho] ??
        SCRIPT_FILL_CHIRHO["unknown-chirho"]!;
      const pageXChirho = lChirho.x_min_chirho + spanChirho.xMinPxChirho;
      const pageX2Chirho = pageXChirho + spanChirho.widthPxChirho;
      const groupChirho = segmentGroupsChirho.get(fillChirho) ?? [];
      groupChirho.push({
        pageXChirho,
        pageYChirho: lChirho.y_min_chirho,
        pageX2Chirho,
        pageY2Chirho: lChirho.y_min_chirho + lChirho.height_chirho,
      });
      segmentGroupsChirho.set(fillChirho, groupChirho);
      segmentCountChirho++;
    }
  }
  for (const [fillChirho, rectsChirho] of segmentGroupsChirho) {
    argsChirho.push("-fill", fillChirho, "-stroke", "none");
    for (const rChirho of rectsChirho) {
      argsChirho.push(
        "-draw",
        `rectangle ${rChirho.pageXChirho},${rChirho.pageYChirho} ${rChirho.pageX2Chirho},${rChirho.pageY2Chirho}`
      );
    }
  }

  // Layer 3 — line index labels (bright red, on top of everything)
  argsChirho.push(
    "-font",
    "Helvetica-Bold",
    "-pointsize",
    "13",
    "-fill",
    "rgba(220, 30, 30, 1.0)",
    "-stroke",
    "none"
  );

  for (const lChirho of linesChirho) {
    const labelXChirho = Math.max(2, lChirho.x_min_chirho - 28);
    const labelYChirho = Math.max(13, lChirho.y_min_chirho + 12);
    argsChirho.push(
      "-draw",
      `text ${labelXChirho},${labelYChirho} 'L${lChirho.line_index_chirho}'`
    );
  }

  argsChirho.push(outputPathChirho);

  await runCmdChirho(argsChirho);
  logChirho(
    MODULE_CHIRHO,
    `Annotated vol ${volumeNumberChirho} p${pageNumberChirho}: ${linesChirho.length} lines, ${segmentCountChirho} non-French segments → ${outputPathChirho}`
  );
  return outputPathChirho;
}

if (import.meta.main) {
  initDbChirho();
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

  interface TargetChirho {
    volChirho: number;
    pageChirho: number;
  }
  const targetsChirho: TargetChirho[] = [];

  if (isPilotChirho) {
    for (const vChirho of [1, 2, 3, 4, 5]) {
      for (let pChirho = 148; pChirho <= 152; pChirho++) {
        targetsChirho.push({ volChirho: vChirho, pageChirho: pChirho });
      }
    }
  } else {
    const volChirho = parseInt(volArgChirho ?? "5", 10);
    if (pageArgChirho) {
      targetsChirho.push({
        volChirho,
        pageChirho: parseInt(pageArgChirho, 10),
      });
    } else if (startArgChirho && endArgChirho) {
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
  }

  let okChirho = 0;
  let failChirho = 0;
  for (const tChirho of targetsChirho) {
    try {
      await annotatePageChirho(tChirho.volChirho, tChirho.pageChirho);
      okChirho++;
    } catch (errChirho) {
      failChirho++;
      logChirho(
        MODULE_CHIRHO,
        `FAILED vol ${tChirho.volChirho} p${tChirho.pageChirho}: ${errChirho}`
      );
    }
  }

  logChirho(
    MODULE_CHIRHO,
    `Done: ${okChirho} ok, ${failChirho} failed. Output dir: ${ANNOTATED_DIR_CHIRHO}`
  );
}
