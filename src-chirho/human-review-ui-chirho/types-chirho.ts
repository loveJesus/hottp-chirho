// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import type { SegmentRepairProposalSpanChirho } from "../segment-repair-proposals-chirho.ts";

export interface TokenWitnessChirho {
  sourceChirho: string;
  textChirho: string;
  confidenceChirho: number | null;
  cropChirho: string | null;
  gateReasonChirho: string | null;
  fileChirho: string | null;
}

export interface TokenValidationChirho {
  tokenIndexChirho: number;
  skeletonChirho: string;
  witnessesChirho: TokenWitnessChirho[];
  validatedChirho: boolean;
}

export interface DirectWordReadChirho {
  textChirho: string;
  confidenceChirho: number;
  cropChirho: string | null;
  wlcVerdictChirho: string | null;
  fileChirho: string | null;
}

export interface ReportSpanChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  scriptChirho?: string;
  textChirho: string;
  lineTextChirho: string;
  tokenSkeletonsChirho: string[];
  tokenValidationsChirho: TokenValidationChirho[];
  directWordReadsChirho: DirectWordReadChirho[];
  validationStatusChirho: string;
  issueCodeChirho?: string;
  issueMessageChirho?: string;
}

export interface ExportIssueChirho {
  severityChirho: string;
  codeChirho: string;
  messageChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho?: number;
  segmentIndexChirho?: number;
}

export interface ExportReportChirho {
  generatedAtChirho?: string;
  issuesChirho: ExportIssueChirho[];
}

export interface ValidationReportChirho {
  generatedAtChirho?: string;
  spansChirho: ReportSpanChirho[];
}

export interface SpanLineFileChirho {
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  lineTextOrderChirho?: string;
  spansChirho: Array<{
    segmentIndexChirho: number;
    xMinPxChirho: number;
    widthPxChirho: number;
    scriptChirho: string;
    utf8TextChirho: string;
    wlcSuggestedTextChirho?: string;
    wlcSuggestionSourceChirho?: string;
  }>;
}

export interface ContextWordChirho {
  wordIndexChirho: number;
  textChirho: string;
  xLocChirho: number;
  widthChirho: number;
  markerChirho: "FRENCH-AUTO" | "CANDIDATE";
  autoAcceptReasonChirho?: string;
  scriptHintChirho?: string;
}

export interface ContextLineChirho {
  lineIndexChirho: number;
  wordsChirho: ContextWordChirho[];
}

export interface ContextPageChirho {
  linesChirho: ContextLineChirho[];
}

export interface QueueCandidateWordChirho {
  wordIndexChirho: number;
  textChirho: string;
  scriptHintChirho: string;
}

export interface QueueItemChirho extends ReportSpanChirho {
  keyChirho: string;
  currentScriptChirho: string;
  liveSpanTextChirho: string;
  hasLiveSpanTextDriftChirho: boolean;
  wlcSuggestedTextChirho?: string;
  wlcSuggestionSourceChirho?: string;
  candidateWordsChirho: QueueCandidateWordChirho[];
  scriptHintSummaryChirho: string;
  defaultScriptVerdictChirho: string | null;
  spanXMinPxChirho: number;
  spanWidthPxChirho: number;
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  lineImagePathChirho: string;
  lineImageHashChirho: string | null;
  lineImageWidthPxChirho: number;
  lineImageHeightPxChirho: number;
  lineSegmentsChirho: SegmentRepairProposalSpanChirho[];
  lineTextOrderChirho?: string;
  zoomCropXMinPxChirho: number;
  zoomCropYMinPxChirho: number;
  zoomCropWidthPxChirho: number;
  zoomCropHeightPxChirho: number;
  zoomMarkerLeftPctChirho: number;
  zoomMarkerWidthPctChirho: number;
  zoomMarkerTopPctChirho: number;
  zoomMarkerHeightPctChirho: number;
  lineMarkerLeftPctChirho: number;
  lineMarkerWidthPctChirho: number;
  lineMarkerTopPctChirho: number;
  lineMarkerHeightPctChirho: number;
  originalTextHashChirho: string;
  tierChirho: string;
  attentionKindsChirho: string[];
  attentionReasonsChirho: string[];
  preReviewNoteChirho: string | null;
  preReviewMissingAttentionKindsChirho: string[];
  preReviewMissingAttentionLabelsChirho: string[];
  attributionTextStateChirho: string;
  priorityChirho: number;
}

export interface RawReviewDisplayGuardChirho {
  expectedLiveSpanTextChirho?: unknown;
  expectedReportTextChirho?: unknown;
  expectedLineTextChirho?: unknown;
  expectedValidationStatusChirho?: unknown;
  expectedCurrentScriptChirho?: unknown;
  expectedOriginalTextHashChirho?: unknown;
  expectedSpanXMinPxChirho?: unknown;
  expectedSpanWidthPxChirho?: unknown;
  expectedLineWidthPxChirho?: unknown;
  expectedLineHeightPxChirho?: unknown;
  expectedLineImageHashChirho?: unknown;
  expectedLineImageWidthPxChirho?: unknown;
  expectedLineImageHeightPxChirho?: unknown;
}

export interface RawReviewSubmitRequestChirho extends RawReviewDisplayGuardChirho {
  keyChirho: string;
  issueFlagsChirho?: unknown;
  scriptVerdictChirho?: unknown;
  correctedTextChirho: string;
  notesChirho: string;
  reviewerChirho?: unknown;
  certifyCleanChirho?: unknown;
  supersedeAttributionBlockedChirho?: unknown;
}

export interface RawSegmentRepairProposalRequestChirho extends RawReviewDisplayGuardChirho {
  keyChirho?: unknown;
  reviewStateChirho?: unknown;
  repairKindChirho?: unknown;
  proposedSpansChirho?: unknown;
  rationaleChirho?: unknown;
  reviewerChirho?: unknown;
}

export interface RawReviewUndoRequestChirho {
  expectedLatestValidationIdChirho?: unknown;
  expectedLatestValidationKeyChirho?: unknown;
  expectedLatestValidationReviewerChirho?: unknown;
  expectedLatestValidationUpdatedAtChirho?: unknown;
}

export interface LineWordBoxRowChirho {
  line_x_min_chirho: number | null;
  line_y_min_chirho: number | null;
  word_x_min_chirho: number | null;
  word_y_min_chirho: number | null;
  word_x_max_chirho: number | null;
  word_y_max_chirho: number | null;
}

export interface MarkerGeometryChirho {
  cropXMinPxChirho: number;
  cropYMinPxChirho: number;
  cropWidthPxChirho: number;
  cropHeightPxChirho: number;
  zoomMarkerLeftPctChirho: number;
  zoomMarkerWidthPctChirho: number;
  zoomMarkerTopPctChirho: number;
  zoomMarkerHeightPctChirho: number;
  lineMarkerLeftPctChirho: number;
  lineMarkerWidthPctChirho: number;
  lineMarkerTopPctChirho: number;
  lineMarkerHeightPctChirho: number;
}

export interface HumanValidationRowChirho {
  key_chirho: string;
  id_chirho: number;
  volume_chirho: number;
  page_chirho: number;
  line_index_chirho: number;
  segment_index_chirho: number;
  original_text_chirho: string;
  original_text_hash_chirho: string;
  line_text_chirho: string | null;
  verdict_chirho: string;
  certify_clean_chirho: number;
  corrected_text_chirho: string | null;
  corrected_skeleton_chirho: string | null;
  script_verdict_chirho: string | null;
  issue_flags_chirho: string | null;
  notes_chirho: string | null;
  witness_snapshot_chirho: string | null;
  queue_generated_at_chirho: string | null;
  reviewer_chirho: string;
  created_at_chirho: string;
  updated_at_chirho: string;
  supersedes_id_chirho: number | null;
  is_current_chirho: number;
  applied_at_chirho: string | null;
  applied_to_file_chirho: string | null;
  schema_version_chirho: number;
}

export interface LoadedQueueChirho {
  titleChirho: string;
  queueGeneratedAtChirho: string | null;
  queueChirho: QueueItemChirho[];
}

export type QueueModeChirho = "hebrew-chirho" | "suspect-text-chirho" | "unknown-script-chirho";

export const ISSUE_FLAG_OPTIONS_CHIRHO = [
  { valueChirho: "letters-chirho", labelChirho: "Letters", helpChirho: "Wrong consonant/base letter." },
  { valueChirho: "vowels-chirho", labelChirho: "Vowels/niqqud", helpChirho: "Vowel points plus dagesh, mappiq, shuruk, and shin/sin dots; a dot inside a letter belongs here." },
  { valueChirho: "accents-chirho", labelChirho: "Accents/meteg", helpChirho: "Cantillation marks and meteg; not dagesh, mappiq, shuruk, or shin/sin dot." },
  { valueChirho: "hebrew-punctuation-chirho", labelChirho: "Hebrew punct.", helpChirho: "Maqqef, sof pasuq, Hebrew-side quotes, or Hebrew citation punctuation." },
  { valueChirho: "latin-punctuation-chirho", labelChirho: "Latin punct.", helpChirho: "French/Latin-side comma, period, parentheses, brackets, or spacing punctuation." },
  { valueChirho: "missing-hebrew-chirho", labelChirho: "Missing Heb.", helpChirho: "Printed Hebrew is absent from the stored span text." },
  { valueChirho: "missing-script-chirho", labelChirho: "Missing script", helpChirho: "A printed non-Latin/script run is absent from the stored segments." },
  { valueChirho: "extra-latin-chirho", labelChirho: "Extra Latin", helpChirho: "Latin/OCR garbage is included where the span should be non-Latin." },
  { valueChirho: "wrong-script-chirho", labelChirho: "Wrong script", helpChirho: "The stored script class is wrong for the printed content." },
  { valueChirho: "unreadable-script-chirho", labelChirho: "Unreadable script", helpChirho: "A script is visibly present but exact letters need another reader." },
  { valueChirho: "garbled-text-chirho", labelChirho: "Garbled text", helpChirho: "The stored text is unreadable or not the printed content." },
  { valueChirho: "missing-greek-chirho", labelChirho: "Missing Greek", helpChirho: "Printed Greek is absent from the stored span text." },
  { valueChirho: "extra-symbol-chirho", labelChirho: "Extra symbol", helpChirho: "Symbol/reference/operator is extra or misclassified." },
  { valueChirho: "wrong-language-chirho", labelChirho: "Wrong lang.", helpChirho: "The language/script family is correct enough to render, but the content belongs to another review lane." },
  { valueChirho: "segmentation-chirho", labelChirho: "Segmentation", helpChirho: "Wrong split/merge/box or word boundary: multiple words lumped incorrectly, one word split, spaces/maqqef wrong, or punctuation attached to the wrong span." },
  { valueChirho: "punctuation-attachment-chirho", labelChirho: "Punct. attach", helpChirho: "Punctuation is attached to the wrong neighboring segment or needs its own segment." },
];
export const ISSUE_FLAG_VALUES_CHIRHO = new Set(ISSUE_FLAG_OPTIONS_CHIRHO.map((optionChirho) => optionChirho.valueChirho));
export const SCRIPT_VERDICT_OPTIONS_CHIRHO = [
  { valueChirho: "", labelChirho: "Defer script" },
  { valueChirho: "latin-non-french-chirho", labelChirho: "Latin non-French" },
  { valueChirho: "french-chirho", labelChirho: "French" },
  { valueChirho: "hebrew-chirho", labelChirho: "Hebrew" },
  { valueChirho: "greek-chirho", labelChirho: "Greek" },
  { valueChirho: "syriac-chirho", labelChirho: "Syriac" },
  { valueChirho: "symbol-chirho", labelChirho: "Symbol" },
];
export const SCRIPT_VERDICT_VALUES_CHIRHO = new Set(
  SCRIPT_VERDICT_OPTIONS_CHIRHO
    .map((optionChirho) => optionChirho.valueChirho)
    .filter((valueChirho) => valueChirho.length > 0)
);
export const REVIEW_STATE_FILTER_OPTIONS_CHIRHO = [
  { valueChirho: "pending-chirho", labelChirho: "Pending" },
  { valueChirho: "saved-issues-chirho", labelChirho: "Saved issues" },
  { valueChirho: "attribution-blocked-chirho", labelChirho: "Attribution blocked" },
  { valueChirho: "attribution-rereview-chirho", labelChirho: "Attribution re-review" },
] as const;

