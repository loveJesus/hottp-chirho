// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Reconstruct the conjoined UTF-8 text of a page from its assembled spans
 * (workspace-chirho/spans-chirho/vol-N/page-NNNN/line-LLL.json).
 *
 * Per line: join `spansChirho[*].utf8TextChirho` with single spaces.
 * Per page: join lines with newlines.
 *
 * Output: workspace-chirho/reconstructed-chirho/vol-N-chirho/page-NNNN-chirho.txt
 *
 * CLI:
 *   bun src-chirho/reconstruct-text-chirho.ts --vol=2 --page=150
 *   bun src-chirho/reconstruct-text-chirho.ts --pilot   (all 5 vols, page 150)
 */

import { existsSync, mkdirSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const SPANS_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho"
);
const RECONSTRUCTED_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "reconstructed-chirho"
);

interface SpanFileChirho {
  lineIndexChirho: number;
  spansChirho: Array<{
    scriptChirho: string;
    utf8TextChirho: string;
  }>;
}

function reconstructPageChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): { textChirho: string; lineCountChirho: number } {
  const pageDirChirho = join(
    SPANS_DIR_CHIRHO,
    `vol-${volumeNumberChirho}-chirho`,
    `page-${String(pageNumberChirho).padStart(4, "0")}-chirho`
  );
  if (!existsSync(pageDirChirho)) {
    throw new Error(`No spans dir: ${pageDirChirho}`);
  }
  const lineFilesChirho = readdirSync(pageDirChirho)
    .filter((fChirho) => /^line-\d+-chirho\.json$/.test(fChirho))
    .sort();

  const linesChirho: string[] = [];
  for (const fChirho of lineFilesChirho) {
    const dataChirho: SpanFileChirho = JSON.parse(
      readFileSync(join(pageDirChirho, fChirho), "utf8")
    );
    const lineTextChirho = dataChirho.spansChirho
      .map((sChirho) => sChirho.utf8TextChirho.trim())
      .filter((tChirho) => tChirho.length > 0)
      .join(" ");
    linesChirho.push(lineTextChirho);
  }

  return {
    textChirho: linesChirho.join("\n"),
    lineCountChirho: linesChirho.length,
  };
}

if (import.meta.main) {
  const argsChirho = process.argv.slice(2);
  const isPilotChirho = argsChirho.includes("--pilot");

  interface TargetChirho {
    volChirho: number;
    pageChirho: number;
  }
  const targetsChirho: TargetChirho[] = [];

  if (isPilotChirho) {
    for (const vChirho of [1, 2, 3, 4, 5]) {
      targetsChirho.push({ volChirho: vChirho, pageChirho: 150 });
    }
  } else {
    const volChirho = parseInt(
      argsChirho.find((aChirho) => aChirho.startsWith("--vol="))?.split("=")[1] ??
        "2",
      10
    );
    const pageChirho = parseInt(
      argsChirho.find((aChirho) => aChirho.startsWith("--page="))?.split("=")[1] ??
        "150",
      10
    );
    targetsChirho.push({ volChirho, pageChirho });
  }

  for (const tChirho of targetsChirho) {
    try {
      const { textChirho, lineCountChirho } = reconstructPageChirho(
        tChirho.volChirho,
        tChirho.pageChirho
      );
      const outDirChirho = join(
        RECONSTRUCTED_DIR_CHIRHO,
        `vol-${tChirho.volChirho}-chirho`
      );
      if (!existsSync(outDirChirho)) mkdirSync(outDirChirho, { recursive: true });
      const outPathChirho = join(
        outDirChirho,
        `page-${String(tChirho.pageChirho).padStart(4, "0")}-chirho.txt`
      );
      await Bun.write(outPathChirho, textChirho);
      console.log(
        `vol ${tChirho.volChirho} p${tChirho.pageChirho}: ${lineCountChirho} lines, ${textChirho.length} chars → ${outPathChirho}`
      );
    } catch (errChirho) {
      console.error(
        `vol ${tChirho.volChirho} p${tChirho.pageChirho}: ${errChirho}`
      );
    }
  }
}
