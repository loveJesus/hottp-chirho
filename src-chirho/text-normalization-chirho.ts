// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { createHash as createHashChirho } from "crypto";

export function normalizeTextForStorageChirho(textChirho: string): string {
  return textChirho.normalize("NFC");
}

export function isNfcTextChirho(textChirho: string): boolean {
  return textChirho === normalizeTextForStorageChirho(textChirho);
}

export function assertCanonicalEquivalentChirho(beforeChirho: string, afterChirho: string): void {
  if (beforeChirho.normalize("NFD") !== afterChirho.normalize("NFD")) {
    throw new Error("NFC normalization would not be canonically equivalent");
  }
}

export function hashTextChirho(textChirho: string): string {
  return createHashChirho("sha256")
    .update(normalizeTextForStorageChirho(textChirho), "utf8")
    .digest("hex");
}
