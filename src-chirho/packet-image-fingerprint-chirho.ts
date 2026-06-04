// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";

export interface PacketImageHashFieldsChirho {
  sourcePathChirho: string;
  targetPathChirho: string;
  linePathChirho: string;
  sourceImageHashChirho: string;
  targetImageHashChirho: string;
  lineImageHashChirho: string;
}

export interface PacketImageHashItemChirho extends PacketImageHashFieldsChirho {
  idChirho: string;
}

export interface PacketImageHashDriftChirho {
  idChirho: string;
  fieldChirho: string;
  reasonChirho: string;
  pathChirho: string;
  expectedHashChirho: string | null;
  actualHashChirho: string | null;
}

interface CachedPacketImageHashChirho {
  hashChirho: string | null;
  reasonChirho: string | null;
}

const PACKET_IMAGE_HASH_FIELD_PAIRS_CHIRHO = [
  ["sourcePathChirho", "sourceImageHashChirho"],
  ["targetPathChirho", "targetImageHashChirho"],
  ["linePathChirho", "lineImageHashChirho"],
] as const;

export function fileSha256Chirho(pathChirho: string): string {
  return createHash("sha256").update(readFileSync(pathChirho)).digest("hex");
}

export function packetImageHashesChirho(pathsChirho: {
  sourcePathChirho: string;
  targetPathChirho: string;
  linePathChirho: string;
}): PacketImageHashFieldsChirho {
  return {
    sourcePathChirho: pathsChirho.sourcePathChirho,
    targetPathChirho: pathsChirho.targetPathChirho,
    linePathChirho: pathsChirho.linePathChirho,
    sourceImageHashChirho: fileSha256Chirho(pathsChirho.sourcePathChirho),
    targetImageHashChirho: fileSha256Chirho(pathsChirho.targetPathChirho),
    lineImageHashChirho: fileSha256Chirho(pathsChirho.linePathChirho),
  };
}

export function packetImageHashDriftsChirho(itemsChirho: PacketImageHashItemChirho[]): PacketImageHashDriftChirho[] {
  const driftsChirho: PacketImageHashDriftChirho[] = [];
  const hashCacheChirho = new Map<string, CachedPacketImageHashChirho>();
  for (const itemChirho of itemsChirho) {
    for (const [pathFieldChirho, hashFieldChirho] of PACKET_IMAGE_HASH_FIELD_PAIRS_CHIRHO) {
      const pathChirho = itemChirho[pathFieldChirho];
      const expectedHashChirho = itemChirho[hashFieldChirho];
      let cachedHashChirho = hashCacheChirho.get(pathChirho);
      if (cachedHashChirho === undefined) {
        if (!existsSync(pathChirho)) {
          cachedHashChirho = { hashChirho: null, reasonChirho: "missing-image-file-chirho" };
        } else {
          try {
            cachedHashChirho = { hashChirho: fileSha256Chirho(pathChirho), reasonChirho: null };
          } catch (errorChirho) {
            cachedHashChirho = {
              hashChirho: null,
              reasonChirho: `image-read-error-chirho:${errorChirho instanceof Error ? errorChirho.message : String(errorChirho)}`,
            };
          }
        }
        hashCacheChirho.set(pathChirho, cachedHashChirho);
      }
      if (cachedHashChirho.reasonChirho !== null) {
        driftsChirho.push({
          idChirho: itemChirho.idChirho,
          fieldChirho: pathFieldChirho,
          reasonChirho: cachedHashChirho.reasonChirho,
          pathChirho,
          expectedHashChirho,
          actualHashChirho: cachedHashChirho.hashChirho,
        });
      } else if (cachedHashChirho.hashChirho !== expectedHashChirho) {
        driftsChirho.push({
          idChirho: itemChirho.idChirho,
          fieldChirho: pathFieldChirho,
          reasonChirho: "image-hash-drift-chirho",
          pathChirho,
          expectedHashChirho,
          actualHashChirho: cachedHashChirho.hashChirho,
        });
      }
    }
  }
  return driftsChirho;
}

export function summarizePacketImageHashDriftChirho(driftChirho: PacketImageHashDriftChirho): string {
  const expectedChirho = driftChirho.expectedHashChirho === null
    ? "expected=null"
    : `expected=${driftChirho.expectedHashChirho.slice(0, 16)}`;
  const actualChirho = driftChirho.actualHashChirho === null
    ? "actual=null"
    : `actual=${driftChirho.actualHashChirho.slice(0, 16)}`;
  return [
    driftChirho.idChirho,
    driftChirho.fieldChirho,
    driftChirho.reasonChirho,
    expectedChirho,
    actualChirho,
    `path="${driftChirho.pathChirho}"`,
  ].join(" ");
}
