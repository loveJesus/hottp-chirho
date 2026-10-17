// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { error } from '@sveltejs/kit';

export const PAGE_WINDOW_CHIRHO = 24;
export const EXPORT_FIELD_BYTES_CHIRHO = 64 * 1024;
export const EXPORT_BYTES_CHIRHO = 1024 * 1024;
export interface PageWindowChirho { fromChirho: number; beforeChirho: number | null }
export interface ExportRangeChirho { volumeChirho: number; fromChirho: number; toChirho: number }

function pageNumberChirho(valueChirho: string | null, nameChirho: string): number {
  if (!valueChirho || !/^[1-9]\d{0,15}$/.test(valueChirho) || !Number.isSafeInteger(Number(valueChirho))) {
    error(400, `${nameChirho} must be a positive decimal integer.`);
  }
  return Number(valueChirho);
}
function singleParamChirho(paramsChirho: URLSearchParams, nameChirho: string): string | null {
  if (paramsChirho.getAll(nameChirho).length > 1) error(400, `Use ${nameChirho} only once.`);
  return paramsChirho.get(nameChirho);
}

// Workflow: page-reading-workflow-chirho.md. Cursors refer to PDF page numbers,
// not row offsets; no user-supplied limit can expand a window.
export function pageWindowChirho(paramsChirho: URLSearchParams): PageWindowChirho {
  const fromChirho = singleParamChirho(paramsChirho, 'from-chirho');
  const beforeChirho = singleParamChirho(paramsChirho, 'before-chirho');
  if (fromChirho !== null && beforeChirho !== null) error(400, 'Choose from-chirho or before-chirho, not both.');
  return { fromChirho: fromChirho === null ? 1 : pageNumberChirho(fromChirho, 'from-chirho'),
    beforeChirho: beforeChirho === null ? null : pageNumberChirho(beforeChirho, 'before-chirho') };
}

export function exportRangeChirho(paramsChirho: URLSearchParams): ExportRangeChirho {
  if (!paramsChirho.has('from-chirho') || !paramsChirho.has('to-chirho')) {
    error(400, 'Choose a displayed page range in the volume browser, or supply volume-chirho, from-chirho and to-chirho. Whole-volume web export is not supported.');
  }
  const rangeChirho = {
    volumeChirho: pageNumberChirho(singleParamChirho(paramsChirho, 'volume-chirho'), 'volume-chirho'),
    fromChirho: pageNumberChirho(singleParamChirho(paramsChirho, 'from-chirho'), 'from-chirho'),
    toChirho: pageNumberChirho(singleParamChirho(paramsChirho, 'to-chirho'), 'to-chirho'),
  };
  if (rangeChirho.fromChirho > rangeChirho.toChirho) error(400, 'from-chirho must not exceed to-chirho. Choose a displayed page range.');
  return rangeChirho;
}
