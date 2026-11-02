// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { test, expect } from 'bun:test';
import { inspectionFrameChirho, inspectionScaleChirho } from '../../../app-chirho/src/lib/page-reader-chirho/inspection-chirho/viewport-chirho';
import { coordinateSpaceChirho } from '../../../app-chirho/src/lib/page-reader-chirho/coordinate-space-chirho';

const nativeChirho = { widthChirho: 2480, heightChirho: 3509, validChirho: true };
const boxChirho = Object.freeze({ xChirho: 883, yChirho: 1000, widthChirho: 85, heightChirho: 24 });
test('inspection uses source pixels, adds context and never mutates stored geometry', () => {
  const beforeChirho = JSON.stringify(boxChirho);
  const frameChirho = inspectionFrameChirho(boxChirho, [], nativeChirho, 2480, 3509)!;
  expect(frameChirho.cropChirho).toEqual({ xChirho: 859, yChirho: 976, widthChirho: 133, heightChirho: 72 });
  expect(frameChirho.pixelWidthChirho).toBe(133);
  expect(frameChirho.pixelHeightChirho).toBe(72);
  expect(inspectionScaleChirho(frameChirho, 4, 20, 20)).toBe(4);
  expect(JSON.stringify(boxChirho)).toBe(beforeChirho);
});
test('legacy vol-5 display calibration is anisotropic and never leaks into raw coordinates', () => {
  const rawChirho = Object.freeze({ xChirho: 883, yChirho: 3361, widthChirho: 1946, heightChirho: 134 });
  const spaceChirho = coordinateSpaceChirho(5, [rawChirho], 2480, 3509);
  const frameChirho = inspectionFrameChirho(rawChirho, [], spaceChirho, 2480, 3509)!;
  expect(spaceChirho.calibratedChirho).toBe(true);
  expect(frameChirho.pixelWidthChirho).toBeCloseTo(1946 * 2480 / (892 * 300 / 72) + 48, 8);
  expect(frameChirho.pixelHeightChirho).toBeCloseTo(134 * 3509 / (1263 * 300 / 72) + 48, 8);
  expect(frameChirho.cropChirho.xChirho + 24 * spaceChirho.widthChirho / 2480).toBeCloseTo(883, 8);
  expect(rawChirho.widthChirho).toBe(1946);
});
test('line context includes neighbours, clamps padding at the source edge and ignores invalid boxes', () => {
  const leftChirho = { xChirho: 1, yChirho: 10, widthChirho: 50, heightChirho: 30 };
  const rightChirho = { xChirho: 2200, yChirho: 10, widthChirho: 280, heightChirho: 30 };
  const frameChirho = inspectionFrameChirho(leftChirho, [rightChirho, { ...rightChirho, widthChirho: 300 }], nativeChirho, 2480, 3509)!;
  expect(frameChirho.cropChirho).toEqual({ xChirho: 0, yChirho: 0, widthChirho: 2480, heightChirho: 64 });
  expect(inspectionFrameChirho(rightChirho, [leftChirho], nativeChirho, 2480, 3509)).toEqual(frameChirho);
});
test('missing print, held coordinate space and clipped/invalid selections cannot open an inspector', () => {
  for (const [selectedChirho, spaceChirho, widthChirho] of [
    [null, nativeChirho, 2480], [boxChirho, nativeChirho, 0], [boxChirho, nativeChirho, NaN],
    [boxChirho, { ...nativeChirho, validChirho: false }, 2480],
    [{ ...boxChirho, widthChirho: 0 }, nativeChirho, 2480],
    [{ ...boxChirho, xChirho: -1 }, nativeChirho, 2480],
    [{ ...boxChirho, yChirho: 3500 }, nativeChirho, 2480]
  ] as const) expect(inspectionFrameChirho(selectedChirho, [], spaceChirho, widthChirho, 3509)).toBeNull();
});
test('fit view is bounded by both axes while explicit pixel zoom never silently fits down', () => {
  const frameChirho = inspectionFrameChirho(boxChirho, [], nativeChirho, 2480, 3509)!;
  expect(inspectionScaleChirho(frameChirho, 'fit-chirho', 100, 20)).toBeCloseTo(20 / 72, 8);
  expect(inspectionScaleChirho(frameChirho, 'fit-chirho', 1000, 1000)).toBe(1);
  expect(inspectionScaleChirho(frameChirho, 'fit-chirho', 0, 0)).toBe(1);
  expect(inspectionScaleChirho(frameChirho, 8, 100, 20)).toBe(8);
});
