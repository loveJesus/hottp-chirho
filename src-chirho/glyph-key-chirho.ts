// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

export interface GlyphKeyPartsChirho {
  cpDirChirho: string;
  cpHexChirho: string;
  letterChirho: string;
  fileChirho: string;
}

export function parseGlyphKeyChirho(keyChirho: string): GlyphKeyPartsChirho {
  const keyPartsChirho = keyChirho.split("/");
  const cpDirChirho = keyPartsChirho[0];
  const fileChirho = keyPartsChirho[1];
  if (
    cpDirChirho === undefined ||
    fileChirho === undefined ||
    keyPartsChirho.length !== 2 ||
    !/^U\+[0-9A-Fa-f]{4,6}$/.test(cpDirChirho) ||
    !fileChirho.endsWith(".png")
  ) {
    throw new Error(`invalid glyph key: ${keyChirho}`);
  }
  const cpHexChirho = cpDirChirho.slice(2).toUpperCase();
  return {
    cpDirChirho: `U+${cpHexChirho}`,
    cpHexChirho,
    letterChirho: String.fromCodePoint(parseInt(cpHexChirho, 16)),
    fileChirho,
  };
}
