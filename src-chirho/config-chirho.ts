// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { join } from "path";

/** Root of the hottp-chirho project */
export const PROJECT_ROOT_CHIRHO = import.meta.dir.replace("/src-chirho", "");

/** Where PDFs live */
export const PDF_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "barthelemy-chirho"
);

/** Where rendered page images go */
export const IMAGES_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "images-chirho"
);

/** Where cropped snippet images go */
export const SNIPPETS_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "snippets-chirho"
);

/** Where exported text goes */
export const EXPORT_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "export-chirho"
);

/** Where scanline (line strip) images go */
export const SCANLINES_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "scanlines-chirho"
);

/** Where segment crop images go */
export const SEGMENTS_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "segments-chirho"
);

/** Spec / progress DB directory */
export const SPEC_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho");

/** Progress SQLite database path */
export const PROGRESS_DB_PATH_CHIRHO = join(
  SPEC_DIR_CHIRHO,
  "progress-chirho.sqlite"
);

/** Volume metadata — filename → volume number */
export const VOLUMES_CHIRHO: Record<
  number,
  { fileNameChirho: string; yearChirho: number; descriptionChirho: string }
> = {
  1: {
    fileNameChirho:
      "Barthelemy_1982_Critique_textuelle_de_lancien_testament.pdf",
    yearChirho: 1982,
    descriptionChirho: "Josué, Juges, Ruth, Samuel, Rois, Chroniques, Esdras, Néhémie",
  },
  2: {
    fileNameChirho:
      "Barthelemy_1986_Critique_textuelle_de_lAncien_Testament.pdf",
    yearChirho: 1986,
    descriptionChirho: "Isaïe, Jérémie, Lamentations",
  },
  3: {
    fileNameChirho:
      "Barthelemy_1992_Critique_textuelle_de_lAncien_Testament.pdf",
    yearChirho: 1992,
    descriptionChirho: "Ézéchiel, Daniel et les 12 Prophètes",
  },
  4: {
    fileNameChirho:
      "Barthelemey_2005_Critique_textuelle_de_lAncien_Testament.pdf",
    yearChirho: 2005,
    descriptionChirho: "Psaumes",
  },
  5: {
    fileNameChirho:
      "Barthelemy_2015_Critique_Textuelle_Ancien_Testament.pdf",
    yearChirho: 2015,
    descriptionChirho: "Job, Proverbes, Qohélet, Cantique des Cantiques",
  },
};

/** Pilot config: which pages to process (single volume) */
export const PILOT_VOLUME_CHIRHO = 5;
export const PILOT_PAGE_START_CHIRHO = 50;
export const PILOT_PAGE_END_CHIRHO = 70;

/** Scanline pilot: pages 150-155 across ALL 5 volumes (25 pages total) */
export const SCANLINE_PILOT_PAGE_START_CHIRHO = 150;
export const SCANLINE_PILOT_PAGE_END_CHIRHO = 155;
export const SCANLINE_PILOT_VOLUMES_CHIRHO = [1, 2, 3, 4, 5] as const;

/** Image rendering DPI */
export const RENDER_DPI_CHIRHO = 300;

/** Snippet cropping padding in pixels (at 300 DPI) */
export const CROP_PADDING_PX_CHIRHO = 20;

/** R2 config (S3-compatible token scoped to the hottp-chirho bucket) */
export const R2_ENDPOINT_CHIRHO =
  process.env.HOTTP_R2_ENDPOINT_CHIRHO ?? "";
export const R2_KEY_CHIRHO =
  process.env.HOTTP_R2_ACCESS_KEY_ID_CHIRHO ?? "";
export const R2_SECRET_CHIRHO =
  process.env.HOTTP_R2_SECRET_ACCESS_KEY_CHIRHO ?? "";
export const R2_BUCKET_CHIRHO =
  process.env.HOTTP_R2_BUCKET_CHIRHO ?? "hottp-chirho";

/** Cloudflare account */
export const CF_ACCOUNT_ID_CHIRHO =
  process.env.CLOUDFLARE_GLOBAL_API_MAIN_ACCOUNT_ID_CHIRHO ?? "";
export const CF_API_KEY_CHIRHO =
  process.env.CLOUDFLARE_GLOBAL_API_KEY_CHIRHO ?? "";
export const CF_EMAIL_CHIRHO =
  process.env.CLOUDFLARE_GLOBAL_API_EMAIL_CHIRHO ?? "";

/** Anthropic API key (for OCR) */
export const ANTHROPIC_API_KEY_CHIRHO =
  process.env.ANTHROPIC_API_KEY ?? "";

/** Garbled detection thresholds */
export const GARBLED_CHAR_RATIO_THRESHOLD_CHIRHO = 0.4;
export const MIN_GARBLED_WORD_LENGTH_CHIRHO = 1;
export const SNIPPET_MERGE_GAP_CHIRHO = 30; // px gap to merge adjacent garbled regions
