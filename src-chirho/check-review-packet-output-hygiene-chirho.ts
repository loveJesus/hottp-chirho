// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify ignored offline review packet artifacts are present and internally
 * sane. This checks packet Markdown/image plumbing only; it does not certify
 * transcription text.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, relative, resolve, sep } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  JOHN_316_INLINE_MARKDOWN_HEADER_CHIRHO,
  assertGeneratedCheckChirho,
  assertGeneratedTextHygieneChirho,
  assertMarkdownHeaderChirho,
} from "./generated-output-hygiene-chirho.ts";

const MODULE_CHIRHO = "check-review-packet-output-hygiene-chirho";
const PACKET_DATE_CHIRHO = "2026-05-31-chirho";
const WORKSPACE_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho");
const MARKDOWN_IMAGE_RE_CHIRHO = /!\[[^\]\n]*\]\(([^)\n]+)\)/g;

type PacketKindChirho = "target-line-chirho" | "expert-chirho";

interface PacketSpecChirho {
  labelChirho: string;
  kindChirho: PacketKindChirho;
  packetDirChirho: string;
}

interface TargetLinePacketItemChirho {
  idChirho?: string;
  targetMarkdownPathChirho?: string;
  lineMarkdownPathChirho?: string;
}

interface TargetLinePacketManifestChirho {
  itemsChirho?: TargetLinePacketItemChirho[];
}

interface ExpertVisionItemChirho {
  idChirho?: string;
  markdownPathChirho?: string;
  currentTextChirho?: string;
}

interface ExpertPriorityImageChirho {
  markdownPathChirho?: string;
}

interface ExpertPriorityItemChirho {
  idChirho?: string;
  imagesChirho?: ExpertPriorityImageChirho[];
}

interface ExpertPacketManifestChirho {
  completeVisionItemsChirho?: ExpertVisionItemChirho[];
  priorityItemsChirho?: ExpertPriorityItemChirho[];
}

const PACKET_SPECS_CHIRHO: PacketSpecChirho[] = [
  {
    labelChirho: "Pass-C Hebrew human review packet",
    kindChirho: "target-line-chirho",
    packetDirChirho: join(WORKSPACE_ROOT_CHIRHO, "pass-c-hebrew-human-pack-chirho", PACKET_DATE_CHIRHO),
  },
  {
    labelChirho: "Latin/symbol vision review packet",
    kindChirho: "target-line-chirho",
    packetDirChirho: join(WORKSPACE_ROOT_CHIRHO, "latin-symbol-vision-pack-chirho", PACKET_DATE_CHIRHO),
  },
  {
    labelChirho: "Expert confirmation packet",
    kindChirho: "expert-chirho",
    packetDirChirho: join(WORKSPACE_ROOT_CHIRHO, "expert-confirm-pack-chirho", PACKET_DATE_CHIRHO),
  },
];

function normalizedPathChirho(pathChirho: string): string {
  return resolve(pathChirho);
}

function collectFilesChirho(dirChirho: string): string[] {
  const filesChirho: string[] = [];
  for (const entryChirho of readdirSync(dirChirho)) {
    const pathChirho = join(dirChirho, entryChirho);
    const statChirho = statSync(pathChirho);
    if (statChirho.isDirectory()) {
      filesChirho.push(...collectFilesChirho(pathChirho));
    } else {
      filesChirho.push(normalizedPathChirho(pathChirho));
    }
  }
  return filesChirho.sort();
}

function packetRelativePathChirho(packetDirChirho: string, pathChirho: string): string {
  return relative(packetDirChirho, pathChirho).split(sep).join("/");
}

function incrementCountChirho(mapChirho: Map<string, number>, keyChirho: string): void {
  mapChirho.set(keyChirho, (mapChirho.get(keyChirho) ?? 0) + 1);
}

function assertPacketRelativeMarkdownPathChirho(
  specChirho: PacketSpecChirho,
  markdownPathChirho: unknown,
  contextChirho: string
): string {
  assertGeneratedCheckChirho(
    typeof markdownPathChirho === "string" && markdownPathChirho.length > 0,
    `${specChirho.labelChirho} ${contextChirho} markdown path must be a non-empty string`
  );
  assertGeneratedCheckChirho(
    !markdownPathChirho.includes("\\") && !markdownPathChirho.startsWith("/") && !/^[a-z][a-z0-9+.-]*:/i.test(markdownPathChirho),
    `${specChirho.labelChirho} ${contextChirho} markdown path must be a relative packet path: ${markdownPathChirho}`
  );
  const resolvedChirho = normalizedPathChirho(join(specChirho.packetDirChirho, markdownPathChirho));
  const rootChirho = normalizedPathChirho(specChirho.packetDirChirho);
  assertGeneratedCheckChirho(
    resolvedChirho === rootChirho || resolvedChirho.startsWith(`${rootChirho}${sep}`),
    `${specChirho.labelChirho} ${contextChirho} markdown path escapes packet directory: ${markdownPathChirho}`
  );
  assertGeneratedCheckChirho(
    packetRelativePathChirho(specChirho.packetDirChirho, resolvedChirho) === markdownPathChirho,
    `${specChirho.labelChirho} ${contextChirho} markdown path is not normalized: ${markdownPathChirho}`
  );
  assertGeneratedCheckChirho(
    existsSync(resolvedChirho),
    `${specChirho.labelChirho} ${contextChirho} referenced image is missing: ${markdownPathChirho}`
  );
  return resolvedChirho;
}

function addExpectedImageReferenceChirho(
  specChirho: PacketSpecChirho,
  expectedReferenceCountsChirho: Map<string, number>,
  expectedFilesChirho: Set<string>,
  markdownPathChirho: unknown,
  contextChirho: string
): void {
  const resolvedChirho = assertPacketRelativeMarkdownPathChirho(specChirho, markdownPathChirho, contextChirho);
  incrementCountChirho(expectedReferenceCountsChirho, markdownPathChirho);
  expectedFilesChirho.add(resolvedChirho);
}

function extractMarkdownImageReferencesChirho(indexTextChirho: string): string[] {
  const referencesChirho: string[] = [];
  for (const matchChirho of indexTextChirho.matchAll(MARKDOWN_IMAGE_RE_CHIRHO)) {
    referencesChirho.push(matchChirho[1]!);
  }
  return referencesChirho;
}

function assertReferenceCountsChirho(
  labelChirho: string,
  expectedReferenceCountsChirho: Map<string, number>,
  actualReferenceCountsChirho: Map<string, number>
): void {
  for (const [referenceChirho, expectedCountChirho] of expectedReferenceCountsChirho.entries()) {
    assertGeneratedCheckChirho(
      actualReferenceCountsChirho.get(referenceChirho) === expectedCountChirho,
      `${labelChirho} image reference count for ${referenceChirho} is ${actualReferenceCountsChirho.get(referenceChirho) ?? 0}, expected ${expectedCountChirho}`
    );
  }
  for (const [referenceChirho, actualCountChirho] of actualReferenceCountsChirho.entries()) {
    assertGeneratedCheckChirho(
      expectedReferenceCountsChirho.get(referenceChirho) === actualCountChirho,
      `${labelChirho} index contains unexpected image reference ${referenceChirho}`
    );
  }
}

function assertNoStalePacketFilesChirho(
  specChirho: PacketSpecChirho,
  expectedFilesChirho: Set<string>,
  actualFilesChirho: string[]
): void {
  for (const expectedPathChirho of expectedFilesChirho) {
    assertGeneratedCheckChirho(
      existsSync(expectedPathChirho),
      `${specChirho.labelChirho} expected packet file is missing: ${packetRelativePathChirho(specChirho.packetDirChirho, expectedPathChirho)}`
    );
  }
  for (const actualPathChirho of actualFilesChirho) {
    assertGeneratedCheckChirho(
      expectedFilesChirho.has(actualPathChirho),
      `${specChirho.labelChirho} has stale packet file: ${relative(PROJECT_ROOT_CHIRHO, actualPathChirho)}`
    );
  }
}

function expectedReferencesForTargetLinePacketChirho(
  specChirho: PacketSpecChirho,
  manifestChirho: TargetLinePacketManifestChirho,
  indexTextChirho: string,
  expectedFilesChirho: Set<string>
): Map<string, number> {
  assertGeneratedCheckChirho(Array.isArray(manifestChirho.itemsChirho), `${specChirho.labelChirho} manifest itemsChirho must be an array`);
  const expectedReferenceCountsChirho = new Map<string, number>();
  for (const itemChirho of manifestChirho.itemsChirho) {
    assertGeneratedCheckChirho(typeof itemChirho.idChirho === "string", `${specChirho.labelChirho} manifest item missing idChirho`);
    assertGeneratedCheckChirho(indexTextChirho.includes(itemChirho.idChirho), `${specChirho.labelChirho} index does not render item ${itemChirho.idChirho}`);
    addExpectedImageReferenceChirho(
      specChirho,
      expectedReferenceCountsChirho,
      expectedFilesChirho,
      itemChirho.targetMarkdownPathChirho,
      `${itemChirho.idChirho} target`
    );
    addExpectedImageReferenceChirho(
      specChirho,
      expectedReferenceCountsChirho,
      expectedFilesChirho,
      itemChirho.lineMarkdownPathChirho,
      `${itemChirho.idChirho} line`
    );
  }
  return expectedReferenceCountsChirho;
}

function expectedReferencesForExpertPacketChirho(
  specChirho: PacketSpecChirho,
  manifestChirho: ExpertPacketManifestChirho,
  indexTextChirho: string,
  expectedFilesChirho: Set<string>
): Map<string, number> {
  assertGeneratedCheckChirho(
    Array.isArray(manifestChirho.completeVisionItemsChirho),
    `${specChirho.labelChirho} manifest completeVisionItemsChirho must be an array`
  );
  assertGeneratedCheckChirho(
    Array.isArray(manifestChirho.priorityItemsChirho),
    `${specChirho.labelChirho} manifest priorityItemsChirho must be an array`
  );
  const expectedReferenceCountsChirho = new Map<string, number>();
  for (const itemChirho of manifestChirho.priorityItemsChirho) {
    assertGeneratedCheckChirho(typeof itemChirho.idChirho === "string", `${specChirho.labelChirho} priority item missing idChirho`);
    assertGeneratedCheckChirho(indexTextChirho.includes(itemChirho.idChirho), `${specChirho.labelChirho} index does not render priority item ${itemChirho.idChirho}`);
    assertGeneratedCheckChirho(
      Array.isArray(itemChirho.imagesChirho) && itemChirho.imagesChirho.length > 0,
      `${specChirho.labelChirho} priority item ${itemChirho.idChirho} must include image references`
    );
    itemChirho.imagesChirho.forEach((imageChirho, imageIndexChirho) => {
      addExpectedImageReferenceChirho(
        specChirho,
        expectedReferenceCountsChirho,
        expectedFilesChirho,
        imageChirho.markdownPathChirho,
        `${itemChirho.idChirho} priority image ${imageIndexChirho}`
      );
    });
  }
  for (const itemChirho of manifestChirho.completeVisionItemsChirho) {
    assertGeneratedCheckChirho(typeof itemChirho.idChirho === "string", `${specChirho.labelChirho} complete item missing idChirho`);
    assertGeneratedCheckChirho(
      typeof itemChirho.currentTextChirho === "string",
      `${specChirho.labelChirho} complete item ${itemChirho.idChirho} missing currentTextChirho`
    );
    assertGeneratedCheckChirho(indexTextChirho.includes(itemChirho.idChirho), `${specChirho.labelChirho} index does not render complete item ${itemChirho.idChirho}`);
    addExpectedImageReferenceChirho(
      specChirho,
      expectedReferenceCountsChirho,
      expectedFilesChirho,
      itemChirho.markdownPathChirho,
      `${itemChirho.idChirho} complete item`
    );
  }
  return expectedReferenceCountsChirho;
}

function checkPacketChirho(specChirho: PacketSpecChirho): number {
  const manifestPathChirho = join(specChirho.packetDirChirho, "manifest-chirho.json");
  const indexPathChirho = join(specChirho.packetDirChirho, "index-chirho.md");
  assertGeneratedCheckChirho(existsSync(manifestPathChirho), `${specChirho.labelChirho} manifest is missing`);
  assertGeneratedCheckChirho(existsSync(indexPathChirho), `${specChirho.labelChirho} index Markdown is missing`);

  const manifestTextChirho = readFileSync(manifestPathChirho, "utf8");
  const indexTextChirho = readFileSync(indexPathChirho, "utf8");
  assertGeneratedTextHygieneChirho(manifestPathChirho, manifestTextChirho);
  assertGeneratedTextHygieneChirho(indexPathChirho, indexTextChirho);
  assertMarkdownHeaderChirho(indexPathChirho, indexTextChirho, JOHN_316_INLINE_MARKDOWN_HEADER_CHIRHO);

  const manifestChirho = JSON.parse(manifestTextChirho) as TargetLinePacketManifestChirho | ExpertPacketManifestChirho;
  const expectedFilesChirho = new Set<string>([normalizedPathChirho(manifestPathChirho), normalizedPathChirho(indexPathChirho)]);
  const expectedReferenceCountsChirho =
    specChirho.kindChirho === "target-line-chirho"
      ? expectedReferencesForTargetLinePacketChirho(
          specChirho,
          manifestChirho as TargetLinePacketManifestChirho,
          indexTextChirho,
          expectedFilesChirho
        )
      : expectedReferencesForExpertPacketChirho(
          specChirho,
          manifestChirho as ExpertPacketManifestChirho,
          indexTextChirho,
          expectedFilesChirho
        );

  const actualReferenceCountsChirho = new Map<string, number>();
  for (const referenceChirho of extractMarkdownImageReferencesChirho(indexTextChirho)) {
    assertPacketRelativeMarkdownPathChirho(specChirho, referenceChirho, "index image");
    incrementCountChirho(actualReferenceCountsChirho, referenceChirho);
  }
  assertReferenceCountsChirho(specChirho.labelChirho, expectedReferenceCountsChirho, actualReferenceCountsChirho);
  assertNoStalePacketFilesChirho(specChirho, expectedFilesChirho, collectFilesChirho(specChirho.packetDirChirho));
  return expectedReferenceCountsChirho.size;
}

function mainChirho(): void {
  let packetCountChirho = 0;
  let referencePathCountChirho = 0;
  for (const specChirho of PACKET_SPECS_CHIRHO) {
    referencePathCountChirho += checkPacketChirho(specChirho);
    packetCountChirho += 1;
  }
  console.log(
    `[${MODULE_CHIRHO}] review packet output hygiene passed for ${packetCountChirho} packet(s), ${referencePathCountChirho} unique referenced image path(s)`
  );
}

if (import.meta.main) {
  try {
    mainChirho();
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  }
}
