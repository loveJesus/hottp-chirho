// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import type { BoxChirho } from './model-chirho';

// Same source calibration as src-chirho/read_volume_page_chirho.py. Vol 5's
// legacy coordinates are pdftohtml XML units scaled by 300/72, not PNG pixels.
const VOL5_XML_WIDTH_CHIRHO = 892, VOL5_XML_HEIGHT_CHIRHO = 1263, XML_SCALE_CHIRHO = 300 / 72;
export function boxFitsSpaceChirho(boxChirho: BoxChirho, widthChirho: number, heightChirho: number): boolean {
  return boxChirho.xChirho >= 0 && boxChirho.yChirho >= 0 && boxChirho.xChirho + boxChirho.widthChirho <= widthChirho && boxChirho.yChirho + boxChirho.heightChirho <= heightChirho;
}
export function coordinateSpaceChirho(volumeChirho: number, boxesChirho: (BoxChirho | null)[], imageWidthChirho: number, imageHeightChirho: number) {
  const measuredChirho = boxesChirho.filter((boxChirho): boxChirho is BoxChirho => boxChirho !== null);
  // Large overshoot indicates a coordinate-unit error. Small edge padding
  // (existing folio lines overshoot by 11px) holds that token, not the page.
  // Individual confirmation always requires strict bounds, with NO tolerance.
  const fitsChirho = (widthChirho: number, heightChirho: number) => measuredChirho.every((boxChirho) => boxFitsSpaceChirho(boxChirho, widthChirho * 1.01, heightChirho * 1.01));
  const calibratedChirho = volumeChirho === 5 && imageWidthChirho > 0 && imageHeightChirho > 0 && !fitsChirho(imageWidthChirho, imageHeightChirho);
  const widthChirho = calibratedChirho ? VOL5_XML_WIDTH_CHIRHO * XML_SCALE_CHIRHO : imageWidthChirho;
  const heightChirho = calibratedChirho ? VOL5_XML_HEIGHT_CHIRHO * XML_SCALE_CHIRHO : imageHeightChirho;
  return { widthChirho, heightChirho, calibratedChirho, validChirho: imageWidthChirho > 0 && imageHeightChirho > 0 && fitsChirho(widthChirho, heightChirho) };
}
