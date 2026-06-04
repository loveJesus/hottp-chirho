// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { mkdirSync, renameSync, writeFileSync } from "fs";
import { dirname } from "path";

export function writeJsonAtomicChirho(pathChirho: string, valueChirho: unknown): void {
  mkdirSync(dirname(pathChirho), { recursive: true });
  const tempPathChirho = `${pathChirho}.tmp-chirho-${process.pid}-${Date.now()}`;
  writeFileSync(tempPathChirho, `${JSON.stringify(valueChirho, null, 2)}\n`);
  renameSync(tempPathChirho, pathChirho);
}
