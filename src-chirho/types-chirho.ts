// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/** A word extracted from pdftotext -bbox-layout output */
export interface BboxWordChirho {
  textChirho: string;
  xMinChirho: number;
  yMinChirho: number;
  xMaxChirho: number;
  yMaxChirho: number;
  isGarbledChirho: boolean;
  garbledScoreChirho: number;
}

/** A line from bbox output containing words */
export interface BboxLineChirho {
  xMinChirho: number;
  yMinChirho: number;
  xMaxChirho: number;
  yMaxChirho: number;
  wordsChirho: BboxWordChirho[];
}

/** A detected non-French snippet region */
export interface SnippetRegionChirho {
  indexChirho: number;
  xMinChirho: number;
  yMinChirho: number;
  xMaxChirho: number;
  yMaxChirho: number;
  garbledTextChirho: string;
  wordCountChirho: number;
  scriptTypeChirho: ScriptTypeChirho;
}

/** Script types we detect */
export type ScriptTypeChirho =
  | "hebrew-chirho"
  | "greek-chirho"
  | "syriac-chirho"
  | "arabic-chirho"
  | "mixed-chirho"
  | "unknown-chirho";

/** Page extraction result */
export interface PageResultChirho {
  volumeNumberChirho: number;
  pageNumberChirho: number;
  frenchTextChirho: string;
  imagePathChirho: string;
  snippetsChirho: SnippetRegionChirho[];
}

/** Status values for pages */
export type PageStatusChirho =
  | "pending-chirho"
  | "extracted-chirho"
  | "rendered-chirho"
  | "detected-chirho"
  | "cropped-chirho"
  | "ocr-done-chirho"
  | "uploaded-chirho"
  | "complete-chirho";

/** Status values for snippets */
export type SnippetStatusChirho =
  | "pending-chirho"
  | "cropped-chirho"
  | "ocr-done-chirho"
  | "accepted-chirho"
  | "rejected-chirho";

/** Cropped snippet result */
export interface CroppedSnippetChirho {
  snippetIndexChirho: number;
  imagePathChirho: string;
  regionChirho: SnippetRegionChirho;
}

/** OCR result for a snippet */
export interface OcrResultChirho {
  snippetIndexChirho: number;
  suggestedTextChirho: string;
  scriptTypeChirho: ScriptTypeChirho;
  confidenceChirho: number;
}

/** Pipeline step result for logging */
export interface StepResultChirho {
  actionTakenChirho: string;
  resultOfActionChirho: string;
  overviewOfResultChirho: string;
}

// ─── Scanline-based pipeline types ───

/** Detection strategy used per volume profile */
export type DetectionStrategyChirho =
  | "garbled-score-chirho"
  | "transliteration-chirho"
  | "font-mapped-chirho";

/** Per-volume detection configuration */
export interface VolumeProfileChirho {
  volumeNumberChirho: number;
  profileNameChirho: string;
  garbledThresholdChirho: number;
  detectionStrategyChirho: DetectionStrategyChirho;
  fontHintsJsonChirho: string | null;
  notesChirho: string;
}

/** A single scanline (text line) on a page */
export interface ScanlineDataChirho {
  idChirho?: number;
  pageIdChirho: number;
  lineIndexChirho: number;
  xMinChirho: number;
  yMinChirho: number;
  xMaxChirho: number;
  yMaxChirho: number;
  pdftotextChirho: string;
  reconstructedTextChirho: string | null;
  imageR2KeyChirho: string | null;
  wordsJsonChirho: string;
  segmentCountChirho: number;
  statusChirho: string;
}

/** Word data stored in words_json_chirho */
export interface ScanlineWordChirho {
  textChirho: string;
  xMinChirho: number;
  xMaxChirho: number;
  yMinChirho: number;
  yMaxChirho: number;
  garbledScoreChirho: number;
}

/** A segment (word-run) within a scanline.
 *  French vs non-French is derived from scriptTypeChirho ("french-chirho" → French). */
export interface SegmentDataChirho {
  idChirho?: number;
  scanlineIdChirho: number;
  segmentIndexChirho: number;
  wordStartIndexChirho: number;
  wordEndIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  pdftotextChirho: string;
  ocrTextChirho: string | null;
  acceptedTextChirho: string | null;
  scriptTypeChirho: ScriptTypeChirho;
  imageR2KeyChirho: string | null;
  statusChirho: string;
}

/** Result from segment detection for a single line.
 *  French vs non-French is derived from scriptTypeChirho ("french-chirho" → French). */
export interface SegmentDetectionChirho {
  lineIndexChirho: number;
  segmentsChirho: Array<{
    wordStartIndexChirho: number;
    wordEndIndexChirho: number;
    textChirho: string;
    xMinPxChirho: number;
    widthPxChirho: number;
    scriptTypeChirho: ScriptTypeChirho;
  }>;
}

/** Status values for scanlines */
export type ScanlineStatusChirho =
  | "pending-chirho"
  | "extracted-chirho"
  | "segmented-chirho"
  | "ocr-done-chirho"
  | "accepted-chirho";

/** Status values for segments */
export type SegmentStatusChirho =
  | "pending-chirho"
  | "cropped-chirho"
  | "ocr-done-chirho"
  | "accepted-chirho"
  | "rejected-chirho";
