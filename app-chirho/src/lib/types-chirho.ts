// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/** Page data for display */
export interface PageDataChirho {
  idChirho: number;
  volumeNumberChirho: number;
  pageNumberChirho: number;
  frenchTextChirho: string | null;
  snippetCountChirho: number | null;
  statusChirho: string;
}

/** Snippet data for display */
export interface SnippetDataChirho {
  idChirho: number;
  pageIdChirho: number;
  snippetIndexChirho: number;
  garbledTextChirho: string | null;
  r2KeyChirho: string | null;
  suggestedTextChirho: string | null;
  acceptedTextChirho: string | null;
  scriptTypeChirho: string | null;
  statusChirho: string;
}

/** Volume summary */
export interface VolumeSummaryChirho {
  volumeNumberChirho: number;
  totalPagesChirho: number;
  completedPagesChirho: number;
  totalSnippetsChirho: number;
  reviewedSnippetsChirho: number;
}

/** Snippet update payload */
export interface SnippetUpdateChirho {
  acceptedTextChirho?: string;
  statusChirho?: string;
  actionChirho: "accept-chirho" | "edit-chirho" | "reject-chirho" | "re-ocr-chirho";
  reviewerChirho: string;
}

/** Scanline data for display */
export interface ScanlineDisplayChirho {
  idChirho: number;
  pageIdChirho: number;
  lineIndexChirho: number;
  pdftotextChirho: string | null;
  reconstructedTextChirho: string | null;
  imageR2KeyChirho: string | null;
  wordsJsonChirho: string | null;
  segmentCountChirho: number | null;
  statusChirho: string;
  xMinChirho: number | null;
  widthChirho: number | null;
}

/** Segment data for display */
export interface SegmentDisplayChirho {
  idChirho: number;
  scanlineIdChirho: number;
  segmentIndexChirho: number;
  wordStartIndexChirho: number | null;
  wordEndIndexChirho: number | null;
  xMinPxChirho: number | null;
  widthPxChirho: number | null;
  pdftotextChirho: string | null;
  ocrTextChirho: string | null;
  acceptedTextChirho: string | null;
  scriptTypeChirho: string | null;
  imageR2KeyChirho: string | null;
  statusChirho: string;
}
