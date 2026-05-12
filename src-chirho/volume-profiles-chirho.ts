// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Per-volume detection profiles.
 *
 * Each of the 5 Barthélemy volumes has a fundamentally different PDF structure:
 *
 * | Vol | Year | Type                          | Detection Strategy        |
 * |-----|------|-------------------------------|---------------------------|
 * | 1   | 1982 | Scanned + OCR'd text layer    | garbled-score (unembedded fonts, ASCII garbage) |
 * | 2   | 1986 | Scanned + OCR'd text layer    | garbled-score (same as vol 1)                   |
 * | 3   | 1992 | Scanned + hidden OCR layer    | transliteration (Greek→Latin transliteration)    |
 * | 4   | 2005 | Scanned + hidden OCR layer    | garbled-score (Hebrew/Greek garbled in OCR)      |
 * | 5   | 2015 | Natively digital, vector text | font-mapped (embedded Unicode, wrong codepoints) |
 */

import type { VolumeProfileChirho } from "./types-chirho.ts";

/** Default profiles keyed by volume number */
export const VOLUME_PROFILES_CHIRHO: Record<number, VolumeProfileChirho> = {
  1: {
    volumeNumberChirho: 1,
    profileNameChirho: "scanned-garbled-1982-chirho",
    garbledThresholdChirho: 0.4,
    detectionStrategyChirho: "garbled-score-chirho",
    fontHintsJsonChirho: null,
    notesChirho:
      "Scanned 1982 volume. Unembedded fonts produce garbled ASCII for Hebrew/Greek.",
  },
  2: {
    volumeNumberChirho: 2,
    profileNameChirho: "scanned-garbled-1986-chirho",
    garbledThresholdChirho: 0.4,
    detectionStrategyChirho: "garbled-score-chirho",
    fontHintsJsonChirho: null,
    notesChirho:
      "Scanned 1986 volume. Same garbled pattern as vol 1.",
  },
  3: {
    volumeNumberChirho: 3,
    profileNameChirho: "transliteration-1992-chirho",
    garbledThresholdChirho: 0.3,
    detectionStrategyChirho: "transliteration-chirho",
    fontHintsJsonChirho: null,
    notesChirho:
      "Scanned 1992 volume. Greek appears as Latin transliteration in OCR layer (e.g. 'kurios' for κύριος). Need phonotactic analysis to distinguish from French.",
  },
  4: {
    volumeNumberChirho: 4,
    profileNameChirho: "scanned-garbled-2005-chirho",
    garbledThresholdChirho: 0.4,
    detectionStrategyChirho: "garbled-score-chirho",
    fontHintsJsonChirho: null,
    notesChirho:
      "Scanned 2005 volume (Psaumes). Hebrew/Greek garbled in hidden OCR layer.",
  },
  5: {
    volumeNumberChirho: 5,
    profileNameChirho: "font-mapped-2015-chirho",
    garbledThresholdChirho: 0.3,
    detectionStrategyChirho: "font-mapped-chirho",
    fontHintsJsonChirho: JSON.stringify({
      nonLatinFontsChirho: [
        "Junicode",
        "NewJerusalemU",
        "SymbolGreekU",
        "EstrangeloEdessa",
      ],
      hebrewRangeChirho: [0x0590, 0x05ff],
      greekRangeChirho: [0x0370, 0x03ff],
      greekExtendedRangeChirho: [0x1f00, 0x1fff],
      syriacRangeChirho: [0x0700, 0x074f],
      arabicRangeChirho: [0x0600, 0x06ff],
    }),
    notesChirho:
      "Natively digital 2015 volume. Embedded Unicode fonts (Junicode, NewJerusalemU, SymbolGreekU, EstrangeloEdessa) map to wrong codepoints. Detect via Unicode block ranges.",
  },
};

/** Get the profile for a volume, falling back to garbled-score with default threshold */
export function getVolumeProfileChirho(
  volumeNumberChirho: number
): VolumeProfileChirho {
  const profileChirho = VOLUME_PROFILES_CHIRHO[volumeNumberChirho];
  if (profileChirho) return profileChirho;

  return {
    volumeNumberChirho,
    profileNameChirho: `fallback-vol-${volumeNumberChirho}-chirho`,
    garbledThresholdChirho: 0.4,
    detectionStrategyChirho: "garbled-score-chirho",
    fontHintsJsonChirho: null,
    notesChirho: `No specific profile for volume ${volumeNumberChirho}. Using garbled-score fallback.`,
  };
}
