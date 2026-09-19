// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { expect, test } from 'bun:test';
import { boxFitsSpaceChirho, coordinateSpaceChirho } from '../../app-chirho/src/lib/page-reader-chirho/coordinate-space-chirho';
test('native volumes remain native, and unrecognized out-of-bounds coordinates hold review', () => {
  const boxChirho = { xChirho: 100, yChirho: 200, widthChirho: 500, heightChirho: 30 };
  expect(coordinateSpaceChirho(3, [boxChirho], 1647, 2633)).toEqual({ widthChirho: 1647, heightChirho: 2633, calibratedChirho: false, validChirho: true });
  expect(coordinateSpaceChirho(3, [boxChirho], 400, 200).validChirho).toBe(false);
  expect(coordinateSpaceChirho(5, [boxChirho], 1647, 2633).calibratedChirho).toBe(false);
});
test('bottom padding holds only the clipped folio, never licenses a clipped confirmation', () => {
  const folioChirho = { xChirho: 700, yChirho: 2480, widthChirho: 40, heightChirho: 51 };
  const spaceChirho = coordinateSpaceChirho(2, [folioChirho], 1668, 2520);
  expect(spaceChirho.validChirho).toBe(true);
  expect(boxFitsSpaceChirho(folioChirho, spaceChirho.widthChirho, spaceChirho.heightChirho)).toBe(false);
  expect(boxFitsSpaceChirho({ ...folioChirho, yChirho: 100 }, spaceChirho.widthChirho, spaceChirho.heightChirho)).toBe(true);
});
test('vol-5 source mapping preserves raw draft/CAS coordinates and yields expected image crop', () => {
  const boxChirho = { xChirho: 883, yChirho: 3361, widthChirho: 1946, heightChirho: 134 };
  const spaceChirho = coordinateSpaceChirho(5, [boxChirho], 2480, 3509);
  expect(spaceChirho.validChirho && spaceChirho.calibratedChirho).toBe(true);
  expect(Math.round(boxChirho.xChirho / spaceChirho.widthChirho * 2480)).toBe(589);
  expect(Math.round(boxChirho.yChirho / spaceChirho.heightChirho * 3509)).toBe(2241);
  // A pixel crop rounds outward at both edges; its span is not rounded width.
  expect(Math.ceil((boxChirho.xChirho + boxChirho.widthChirho) / spaceChirho.widthChirho * 2480) - Math.floor(boxChirho.xChirho / spaceChirho.widthChirho * 2480)).toBe(1299);
  expect(boxChirho.xChirho).toBe(883);
  expect(coordinateSpaceChirho(5, [{ ...boxChirho, widthChirho: 10000 }], 2480, 3509).validChirho).toBe(false);
});
