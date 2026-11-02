// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import type { BoxChirho } from '../model-chirho';
import { boxFitsSpaceChirho } from '../coordinate-space-chirho';

export const INSPECTION_ZOOMS_CHIRHO = [1, 2, 4, 8] as const;
export type InspectionZoomChirho = 'fit-chirho' | typeof INSPECTION_ZOOMS_CHIRHO[number];
export interface InspectionFrameChirho {
  cropChirho: BoxChirho;
  pixelWidthChirho: number;
  pixelHeightChirho: number;
}
interface InspectionSpaceChirho {
  widthChirho: number;
  heightChirho: number;
  validChirho: boolean;
}
const PADDING_PX_CHIRHO = 24;
const positiveChirho = (valueChirho: number) => Number.isFinite(valueChirho) && valueChirho > 0;
function fitsChirho(boxChirho: BoxChirho, spaceChirho: InspectionSpaceChirho): boolean {
  return positiveChirho(boxChirho.widthChirho) && positiveChirho(boxChirho.heightChirho) &&
    boxFitsSpaceChirho(boxChirho, spaceChirho.widthChirho, spaceChirho.heightChirho);
}

// Workflow: page-reading-workflow-chirho.md. Project raw coordinates into
// native PNG pixels for display only; never rewrite a draft, box or CAS value.
export function inspectionFrameChirho(boxChirho: BoxChirho | null, contextChirho: BoxChirho[], spaceChirho: InspectionSpaceChirho,
  imageWidthChirho: number, imageHeightChirho: number): InspectionFrameChirho | null {
  if (!spaceChirho.validChirho || ![spaceChirho.widthChirho, spaceChirho.heightChirho, imageWidthChirho, imageHeightChirho].every(positiveChirho) ||
    !boxChirho || !fitsChirho(boxChirho, spaceChirho)) return null;
  const scaleXChirho = imageWidthChirho / spaceChirho.widthChirho, scaleYChirho = imageHeightChirho / spaceChirho.heightChirho;
  const boxesChirho = [boxChirho, ...contextChirho.filter((candidateChirho) => fitsChirho(candidateChirho, spaceChirho))];
  const leftChirho = Math.max(0, Math.min(...boxesChirho.map((candidateChirho) => candidateChirho.xChirho)) - PADDING_PX_CHIRHO / scaleXChirho);
  const topChirho = Math.max(0, Math.min(...boxesChirho.map((candidateChirho) => candidateChirho.yChirho)) - PADDING_PX_CHIRHO / scaleYChirho);
  const rightChirho = Math.min(spaceChirho.widthChirho, Math.max(...boxesChirho.map((candidateChirho) => candidateChirho.xChirho + candidateChirho.widthChirho)) + PADDING_PX_CHIRHO / scaleXChirho);
  const bottomChirho = Math.min(spaceChirho.heightChirho, Math.max(...boxesChirho.map((candidateChirho) => candidateChirho.yChirho + candidateChirho.heightChirho)) + PADDING_PX_CHIRHO / scaleYChirho);
  const cropChirho = { xChirho: leftChirho, yChirho: topChirho, widthChirho: rightChirho - leftChirho, heightChirho: bottomChirho - topChirho };
  return { cropChirho, pixelWidthChirho: cropChirho.widthChirho * scaleXChirho, pixelHeightChirho: cropChirho.heightChirho * scaleYChirho };
}

export function inspectionScaleChirho(frameChirho: InspectionFrameChirho, zoomChirho: InspectionZoomChirho,
  viewportWidthChirho: number, viewportHeightChirho: number): number {
  if (zoomChirho !== 'fit-chirho') return zoomChirho;
  if (!positiveChirho(viewportWidthChirho) || !positiveChirho(viewportHeightChirho)) return 1;
  return Math.min(1, viewportWidthChirho / frameChirho.pixelWidthChirho, viewportHeightChirho / frameChirho.pixelHeightChirho);
}
