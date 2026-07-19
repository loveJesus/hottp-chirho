// For God so loved the world, that he gave his only begotten Son,
// that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Draft segment-repair proposals for the swallowed-Hebrew sweep findings and
 * write the triage decision report (reviewer UX v2 plan, Phase 5).
 *
 * DRAFTS ONLY. This appends draft proposals to the segment-repair store and
 * writes a markdown triage report; it never edits spans, validations, or
 * certification state. Landing a repair is the Phase 4 apply lane's job and
 * always requires an explicit approval step.
 *
 * The four drafted repairs are the eye-confirmed items (room msgs #5642,
 * #5645, #5648): both halves of 3:151:36, the two printed-gdud swallows on
 * vol 4 p148, and the Fraktur-G witness siglum stored as "6" on vol 3 p149.
 * Every other flagged item is cleared with a recorded reason or escalated for
 * visual confirmation per the #5648 calibration (CRNN is weak on vols 3-5, so
 * a disjoint non-exact read never justifies a text-changing draft by itself).
 *
 * Attribution: reviewer "claude2-sweep-chirho" — machine triage, never a
 * human reviewer name, so the approval queue can distinguish agent drafts.
 */

import { randomBytes } from "crypto";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join, relative } from "path";

import { writeTextAtomicChirho } from "./atomic-json-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  SEGMENT_REPAIR_PROPOSAL_SCHEMA_VERSION_CHIRHO,
  SEGMENT_REPAIR_PROPOSAL_STATUS_DRAFT_CHIRHO,
  appendSegmentRepairProposalChirho,
  validateSegmentRepairProposalSpansChirho,
  type SegmentRepairKindChirho,
  type SegmentRepairProposalRecordChirho,
  type SegmentRepairProposalSpanChirho,
} from "./segment-repair-proposals-chirho.ts";
import { normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "draft-swallowed-hebrew-repairs-chirho";
const SWEEP_REVIEWER_CHIRHO = "claude2-sweep-chirho";
const DEFAULT_STORE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "segment-repair-proposals-2026-07-02-chirho.json"
);
const DEFAULT_REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "swallowed-hebrew-triage-2026-07-18-chirho.md"
);
const CANDIDATES_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "swallowed-hebrew-sweep-chirho",
  "candidates-2026-07-18-chirho.json"
);
const WITNESS_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "swallowed-hebrew-sweep-chirho",
  "witness-reads-2026-07-18-chirho.json"
);
const SPANS_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
const SCANLINES_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "scanlines-chirho");
const V8_HEBREW_MIN_CHIRHO = 0.9;
const V8_NONHEBREW_MAX_CHIRHO = 0.5;

interface StoredSpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
}

interface StoredLineChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  lineWidthPxChirho: number;
  lineTextOrderChirho?: string;
  spansChirho: StoredSpanChirho[];
}

interface SweepFindingChirho {
  spanKeyChirho: string;
  severityChirho: string;
  signalsChirho: string[];
  spanTextChirho: string;
}

interface WitnessRecordChirho {
  spanKeyChirho: string;
  targetKindChirho: string;
  crnnReadingChirho: string | null;
  crnnConfChirho: number | null;
  wlcVerdictChirho: string | null;
  v8PHebChirho: number | null;
  sharedSkeletonCharsChirho: number;
  readSkeletonChirho: string;
  skeletonEqualChirho: boolean;
}

interface RepairDraftSpecChirho {
  itemKeyChirho: string;
  repairKindChirho: SegmentRepairKindChirho;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  targetSegmentIndexChirho: number;
  proposedSpansChirho: SegmentRepairProposalSpanChirho[];
  rationaleChirho: string;
  notesChirho: string;
}

// The four eye-confirmed repairs. Split boundaries sit at the midpoint of the
// word-box gaps recorded in words_chirho; Hebrew pointing follows the print
// crops and stays subject to the human niqqud check at approval time.
const REPAIR_SPECS_CHIRHO: RepairDraftSpecChirho[] = [
  {
    itemKeyChirho: "3:151:36:1",
    repairKindChirho: "split-chirho",
    volumeChirho: 3,
    pageChirho: 151,
    lineIndexChirho: 36,
    targetSegmentIndexChirho: 1,
    proposedSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 138, scriptChirho: "greek-chirho", utf8TextChirho: "γεῖσος" },
      {
        segmentIndexChirho: 1,
        xMinPxChirho: 138,
        widthPxChirho: 627,
        scriptChirho: "french-chirho",
        utf8TextChirho: "mot qui réapparaît en Éz 43,13.17 pour",
      },
      { segmentIndexChirho: 2, xMinPxChirho: 765, widthPxChirho: 78, scriptChirho: "hebrew-chirho", utf8TextChirho: "גְּבוּל" },
      { segmentIndexChirho: 3, xMinPxChirho: 843, widthPxChirho: 262, scriptChirho: "french-chirho", utf8TextChirho: "en 1R 7 9 pour" },
      { segmentIndexChirho: 4, xMinPxChirho: 1105, widthPxChirho: 69, scriptChirho: "hebrew-chirho", utf8TextChirho: "טָפַח" },
      { segmentIndexChirho: 5, xMinPxChirho: 1174, widthPxChirho: 114, scriptChirho: "french-chirho", utf8TextChirho: "et en Jr" },
    ],
    rationaleChirho:
      "Swallowed Hebrew (plan Phase 5, defect 3:151:36:2). The French segment stores the printed word גבול as the digit garble \"13,\" after \"pour\", and the Hebrew box on printed טפח stores גבול. Print eye-confirmed twice (2026-07-09 manual witness and 2026-07-18 verification); witness classifier reads the \"13,\" crop as Hebrew script with probability 1.0.",
    notesChirho:
      "Split carves the printed גבול out of the French segment at word-gap midpoints x765-843 (word box x771-837); the box on x1105-1174 keeps its geometry with text corrected to the printed טפח. CRNN reads: carved range gave a Hebrew-script read at conf 0.86 (letters imperfect, classifier P(hebrew)=1.0); the טפח box read reproduces the 2026-07-09 manual witness (same imperfect read at conf ~0.79 in both implementations, disjoint from the stored גבול). Exact niqqud of both Hebrew words needs the human print check at approval. Remaining French nit NOT included in this repair: stored \"en 1R 7 9\" vs printed \"en 1 R 7,9\".",
  },
  {
    itemKeyChirho: "4:148:20:2",
    repairKindChirho: "split-chirho",
    volumeChirho: 4,
    pageChirho: 148,
    lineIndexChirho: 20,
    targetSegmentIndexChirho: 2,
    proposedSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 88, scriptChirho: "french-chirho", utf8TextChirho: "par" },
      { segmentIndexChirho: 1, xMinPxChirho: 88, widthPxChirho: 182, scriptChirho: "greek-chirho", utf8TextChirho: "γεδδουρ" },
      { segmentIndexChirho: 2, xMinPxChirho: 270, widthPxChirho: 156, scriptChirho: "french-chirho", utf8TextChirho: "le mot" },
      { segmentIndexChirho: 3, xMinPxChirho: 426, widthPxChirho: 111, scriptChirho: "hebrew-chirho", utf8TextChirho: "גְּדוּד" },
      {
        segmentIndexChirho: 4,
        xMinPxChirho: 537,
        widthPxChirho: 645,
        scriptChirho: "french-chirho",
        utf8TextChirho: "qu'il ne comprenait pas. Ici le",
      },
    ],
    rationaleChirho:
      "Swallowed Hebrew found by the Phase 5 sweep and eye-confirmed by two agents: the French segment stores printed גדוד as the digit garble \"7111\" (letter-for-letter shape garble). The Greek γεδδουρ transliteration in the same line names that very word.",
    notesChirho:
      "Split carves the printed גדוד at word-gap midpoints x426-537 (word box x440-523). CRNN read on the crop: גדוד, WLC-exact, conf 0.90, classifier P(hebrew)=1.0. Niqqud (גְּדוּד as printed) subject to the human check at approval.",
  },
  {
    itemKeyChirho: "4:148:30:0",
    repairKindChirho: "split-chirho",
    volumeChirho: 4,
    pageChirho: 148,
    lineIndexChirho: 30,
    targetSegmentIndexChirho: 0,
    proposedSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 244, scriptChirho: "french-chirho", utf8TextChirho: "complément" },
      { segmentIndexChirho: 1, xMinPxChirho: 244, widthPxChirho: 106, scriptChirho: "hebrew-chirho", utf8TextChirho: "גְּדוּד" },
      {
        segmentIndexChirho: 2,
        xMinPxChirho: 350,
        widthPxChirho: 831,
        scriptChirho: "french-chirho",
        utf8TextChirho: "en son sens normal de ‘rezzou’ convient",
      },
    ],
    rationaleChirho:
      "Swallowed Hebrew found by the Phase 5 sweep and eye-confirmed by two agents: the French segment stores printed גדוד as the garble \"11)\". The surrounding French seals the reading — 'rezzou' is the French translation of גדוד, so the slot demands that word.",
    notesChirho:
      "Split carves the printed גדוד at word-gap midpoints x244-350 (word box x255-338). CRNN read on the crop: גדוד, WLC-exact, conf 0.995, classifier P(hebrew)=1.0. The \")\" in the stored garble appears to be part of the final ד stroke, not printed punctuation — approver should confirm on the crop. Niqqud subject to the human check at approval.",
  },
  {
    itemKeyChirho: "5:69:7:8",
    repairKindChirho: "script-text-chirho",
    volumeChirho: 5,
    pageChirho: 69,
    lineIndexChirho: 7,
    targetSegmentIndexChirho: 8,
    proposedSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 205, scriptChirho: "hebrew-chirho", utf8TextChirho: "אָקוּם" },
      { segmentIndexChirho: 1, xMinPxChirho: 205, widthPxChirho: 104, scriptChirho: "french-chirho", utf8TextChirho: "du" },
      { segmentIndexChirho: 2, xMinPxChirho: 309, widthPxChirho: 62, scriptChirho: "symbol-chirho", utf8TextChirho: "𝔐" },
      { segmentIndexChirho: 3, xMinPxChirho: 371, widthPxChirho: 771, scriptChirho: "french-chirho", utf8TextChirho: ", puis elle se réfère à la" },
      { segmentIndexChirho: 4, xMinPxChirho: 1142, widthPxChirho: 71, scriptChirho: "symbol-chirho", utf8TextChirho: "𝔖" },
      { segmentIndexChirho: 5, xMinPxChirho: 1213, widthPxChirho: 446, scriptChirho: "french-chirho", utf8TextChirho: "pour corriger" },
      { segmentIndexChirho: 6, xMinPxChirho: 1659, widthPxChirho: 371, scriptChirho: "hebrew-chirho", utf8TextChirho: "וּמָדַד עֶרֶב" },
      { segmentIndexChirho: 7, xMinPxChirho: 2030, widthPxChirho: 104, scriptChirho: "french-chirho", utf8TextChirho: "en" },
      { segmentIndexChirho: 8, xMinPxChirho: 2134, widthPxChirho: 141, scriptChirho: "hebrew-chirho", utf8TextChirho: "מָדַד" },
    ],
    rationaleChirho:
      "Stored-Hebrew-suspect confirmed by two independent eye reads (2026-07-18): the box at x2134 prints the three-letter מָדַד — wide mem head with qamats, patach under the middle dalet, letterform identical to the וּמָדַד sibling two words left — while the store carries the four-letter וְשָׁכַב. The CRNN witness read נדד (conf 0.89) agrees in shape; its נ-for-מ is the model's narrow-letter bias.",
    notesChirho:
      "Text-only repair, geometry unchanged. Approver anchors: (1) WLC 2 Sam 8:2 puts מדד and שכב in one verse (וַיְמַדְּדֵם... הַשְׁכֵּב), the likely path by which וְשָׁכַב wandered onto this box from the same apparatus entry; (2) the French context reads \"pour corriger וּמָדַד עֶרֶב en [this word]\" — the print at the box eye-reads מָדַד despite the apparent redundancy, so the approver should confirm the apparatus sense on the context crop. Exact niqqud per print: qamats + patach.",
  },
  {
    itemKeyChirho: "3:150:26:0",
    repairKindChirho: "script-text-chirho",
    volumeChirho: 3,
    pageChirho: 150,
    lineIndexChirho: 26,
    targetSegmentIndexChirho: 0,
    proposedSpansChirho: [
      {
        segmentIndexChirho: 0,
        xMinPxChirho: 0,
        widthPxChirho: 1272,
        scriptChirho: "french-chirho",
        utf8TextChirho: "voudrions montrer par quelques exemples que les choix textuels de l'édition du 𝔊",
      },
    ],
    rationaleChirho:
      "Witness siglum garbled as a digit (symbol class): the print at the flagged range shows the Fraktur 𝔊 (Septuagint witness siglum) where the stored French says \"6\". Eye-confirmed on the crop during the 2026-07-18 escalation review; sibling of the 3:149:10:1 repair.",
    notesChirho:
      "Text-only repair, geometry unchanged; 𝔊 inline per corpus convention. The sweep's Hebrew classifier read 0.88 (ambiguous tier) — Fraktur letterforms sit between the classifier's classes, which is why this class escalates to eyes.",
  },
  {
    itemKeyChirho: "3:151:28:0",
    repairKindChirho: "script-text-chirho",
    volumeChirho: 3,
    pageChirho: 151,
    lineIndexChirho: 28,
    targetSegmentIndexChirho: 0,
    proposedSpansChirho: [
      {
        segmentIndexChirho: 0,
        xMinPxChirho: 0,
        widthPxChirho: 1286,
        scriptChirho: "french-chirho",
        utf8TextChirho: "comité montrent que la découverte du papyrus 967 imposerait à un nouvel éditeur du 𝔊",
      },
    ],
    rationaleChirho:
      "Witness siglum garbled as a digit (symbol class): the print at the line-end flag shows the Fraktur 𝔊 where the stored French says \"6\". Eye-confirmed on the crop during the 2026-07-18 escalation review.",
    notesChirho:
      "Text-only repair, geometry unchanged; 𝔊 inline per corpus convention. The line's other flagged number, \"967\" after \"papyrus\", is the famous Ezekiel papyrus 967 and is correct as stored — no change proposed there.",
  },
  {
    itemKeyChirho: "3:149:10:1",
    repairKindChirho: "script-text-chirho",
    volumeChirho: 3,
    pageChirho: 149,
    lineIndexChirho: 10,
    targetSegmentIndexChirho: 1,
    proposedSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 1011, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "cxxiv" },
      { segmentIndexChirho: 1, xMinPxChirho: 1011, widthPxChirho: 315, scriptChirho: "french-chirho", utf8TextChirho: "Les divisions du 𝔊" },
    ],
    rationaleChirho:
      "Witness siglum garbled as a digit (symbol class, not Hebrew): the print shows the Fraktur 𝔊 (Septuagint witness siglum) where the stored French says \"6\". Identified on the print during the 2026-07-18 verification; the sweep's Hebrew classifier read 0.928 and correctly refused to auto-claim Hebrew.",
    notesChirho:
      "Text-only repair, geometry unchanged. 𝔊 stays inline in the French segment text, matching how the siglum is stored elsewhere in the corpus (e.g. vol 4 p152 lines 9 and 24). No Hebrew involved.",
  },
];

// Every span in this list was eye-confirmed on the 2026-07-18 montage review:
// the print shows the Fraktur 𝔊 (Septuagint witness siglum) where the stored
// French says "6". The CRNN consistently reads the glyph as a round Hebrew
// letter (ס/פ/צ) and the v8 classifier scores it low-Hebrew — it is neither,
// which is exactly why this class needed eyes. Repairs are text-only.
const SIGLUM_REPAIR_KEYS_CHIRHO = [
  "3:148:11:0", "3:148:23:0", "3:148:24:0", "3:148:26:0", "3:148:27:0",
  "3:148:48:0", "3:148:50:0", "3:149:20:0", "3:149:53:0", "3:149:57:0",
  "3:150:20:0", "3:150:30:0", "3:150:41:0", "3:151:26:0", "3:151:38:2",
  "3:151:48:0", "4:152:6:0", "4:152:21:0", "4:152:34:0",
] as const;
const BARE_SIX_TOKEN_RE_CHIRHO = /^[({[«"']?6[.,;:!?)\]}»"']?$/u;

interface CandidatesFileChirho {
  findingsChirho: Array<
    SweepFindingChirho & {
      volumeChirho: number;
      pageChirho: number;
      lineIndexChirho: number;
      segmentIndexChirho: number;
    }
  >;
}

function buildSiglumSpecsChirho(candidatesChirho: CandidatesFileChirho): RepairDraftSpecChirho[] {
  const byKeyChirho = new Map(candidatesChirho.findingsChirho.map((findingChirho) => [findingChirho.spanKeyChirho, findingChirho]));
  const specsChirho: RepairDraftSpecChirho[] = [];
  for (const keyChirho of SIGLUM_REPAIR_KEYS_CHIRHO) {
    const findingChirho = byKeyChirho.get(keyChirho);
    if (findingChirho === undefined) throw new Error(`siglum repair ${keyChirho}: not in candidates file`);
    const lineChirho = JSON.parse(
      readFileSync(lineFilePathChirho(findingChirho.volumeChirho, findingChirho.pageChirho, findingChirho.lineIndexChirho), "utf8")
    ) as StoredLineChirho;
    const proposedChirho: SegmentRepairProposalSpanChirho[] = lineChirho.spansChirho
      .slice()
      .sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho)
      .map((spanChirho) => {
        let textChirho = spanChirho.utf8TextChirho;
        if (spanChirho.segmentIndexChirho === findingChirho.segmentIndexChirho) {
          const tokensChirho = textChirho.split(/(\s+)/u);
          const hitsChirho = tokensChirho.filter((tokenChirho) => BARE_SIX_TOKEN_RE_CHIRHO.test(tokenChirho)).length;
          if (hitsChirho !== 1) {
            throw new Error(`siglum repair ${keyChirho}: expected exactly one bare-6 token, found ${hitsChirho}`);
          }
          textChirho = tokensChirho
            .map((tokenChirho) => (BARE_SIX_TOKEN_RE_CHIRHO.test(tokenChirho) ? tokenChirho.replace("6", "𝔊") : tokenChirho))
            .join("");
        }
        return {
          segmentIndexChirho: spanChirho.segmentIndexChirho,
          xMinPxChirho: spanChirho.xMinPxChirho,
          widthPxChirho: spanChirho.widthPxChirho,
          scriptChirho: spanChirho.scriptChirho as SegmentRepairProposalSpanChirho["scriptChirho"],
          utf8TextChirho: textChirho,
        };
      });
    specsChirho.push({
      itemKeyChirho: keyChirho,
      repairKindChirho: "script-text-chirho",
      volumeChirho: findingChirho.volumeChirho,
      pageChirho: findingChirho.pageChirho,
      lineIndexChirho: findingChirho.lineIndexChirho,
      targetSegmentIndexChirho: findingChirho.segmentIndexChirho,
      proposedSpansChirho: proposedChirho,
      rationaleChirho:
        "Witness siglum garbled as a digit (symbol class): the print shows the Fraktur 𝔊 (Septuagint witness siglum) where the stored French says \"6\". Eye-confirmed on the 2026-07-18 crop montage covering every member of this class; siblings of the 3:149:10:1 repair.",
      notesChirho:
        "Text-only repair generated for the eye-confirmed siglum class; geometry unchanged; 𝔊 inline per corpus convention. The CRNN reads the glyph as a round Hebrew letter and the Hebrew classifier scores it low — the glyph is neither Hebrew nor a digit, which is why the class required eye review.",
    });
  }
  return specsChirho;
}

function sha256FileChirho(pathChirho: string): string {
  return createHash("sha256").update(readFileSync(pathChirho)).digest("hex");
}

function lineFilePathChirho(volumeChirho: number, pageChirho: number, lineIndexChirho: number): string {
  return join(
    SPANS_ROOT_CHIRHO,
    `vol-${volumeChirho}-chirho`,
    `page-${String(pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(lineIndexChirho).padStart(3, "0")}-chirho.json`
  );
}

function scanlinePathChirho(volumeChirho: number, pageChirho: number, lineIndexChirho: number): string {
  return join(
    SCANLINES_ROOT_CHIRHO,
    `vol-${volumeChirho}-chirho`,
    `page-${String(pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(lineIndexChirho).padStart(3, "0")}-chirho.png`
  );
}

function assertStoredSpansUnchangedChirho(lineChirho: StoredLineChirho, specChirho: RepairDraftSpecChirho): void {
  const targetChirho = lineChirho.spansChirho.find(
    (spanChirho) => spanChirho.segmentIndexChirho === specChirho.targetSegmentIndexChirho
  );
  if (targetChirho === undefined) {
    throw new Error(`${specChirho.itemKeyChirho}: target segment missing from stored line`);
  }
  const totalWidthChirho = lineChirho.spansChirho.reduce((sumChirho, spanChirho) => sumChirho + spanChirho.widthPxChirho, 0);
  if (totalWidthChirho !== lineChirho.lineWidthPxChirho) {
    throw new Error(`${specChirho.itemKeyChirho}: stored spans no longer tile the line width`);
  }
  const proposedWidthChirho = specChirho.proposedSpansChirho.reduce(
    (sumChirho, spanChirho) => sumChirho + spanChirho.widthPxChirho,
    0
  );
  if (proposedWidthChirho !== lineChirho.lineWidthPxChirho) {
    throw new Error(
      `${specChirho.itemKeyChirho}: proposed spans tile ${proposedWidthChirho}, stored line width is ${lineChirho.lineWidthPxChirho}`
    );
  }
}

function renderStoredLineTextChirho(lineChirho: StoredLineChirho): string {
  return lineChirho.spansChirho
    .slice()
    .sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho)
    .map((spanChirho) => normalizeTextForStorageChirho(spanChirho.utf8TextChirho))
    .join(" ")
    .replace(/\s+/gu, " ")
    .trim();
}

function draftProposalsChirho(
  storePathChirho: string,
  specsChirho: RepairDraftSpecChirho[]
): SegmentRepairProposalRecordChirho[] {
  const existingChirho = (() => {
    try {
      const parsedChirho = JSON.parse(readFileSync(storePathChirho, "utf8")) as {
        proposalsChirho?: Array<{ itemKeyChirho?: string; reviewerChirho?: string }>;
      };
      return parsedChirho.proposalsChirho ?? [];
    } catch {
      return [];
    }
  })();
  const draftedChirho: SegmentRepairProposalRecordChirho[] = [];
  for (const specChirho of specsChirho) {
    const alreadyChirho = existingChirho.some(
      (proposalChirho) =>
        proposalChirho.itemKeyChirho === specChirho.itemKeyChirho &&
        proposalChirho.reviewerChirho === SWEEP_REVIEWER_CHIRHO
    );
    if (alreadyChirho) {
      console.log(`[${MODULE_CHIRHO}] skip ${specChirho.itemKeyChirho}: draft already in store`);
      continue;
    }
    const lineChirho = JSON.parse(
      readFileSync(lineFilePathChirho(specChirho.volumeChirho, specChirho.pageChirho, specChirho.lineIndexChirho), "utf8")
    ) as StoredLineChirho;
    assertStoredSpansUnchangedChirho(lineChirho, specChirho);
    const validatedChirho = validateSegmentRepairProposalSpansChirho(
      specChirho.proposedSpansChirho,
      lineChirho.lineWidthPxChirho,
      lineChirho.lineTextOrderChirho
    );
    const recordChirho: SegmentRepairProposalRecordChirho = {
      schemaVersionChirho: SEGMENT_REPAIR_PROPOSAL_SCHEMA_VERSION_CHIRHO,
      proposalIdChirho: `segment-repair-${new Date().toISOString()}-${randomBytes(8).toString("hex")}-chirho`,
      statusChirho: SEGMENT_REPAIR_PROPOSAL_STATUS_DRAFT_CHIRHO,
      repairKindChirho: specChirho.repairKindChirho,
      reviewerChirho: SWEEP_REVIEWER_CHIRHO,
      rationaleChirho: specChirho.rationaleChirho,
      createdAtChirho: new Date().toISOString(),
      itemKeyChirho: specChirho.itemKeyChirho,
      volumeChirho: specChirho.volumeChirho,
      pageChirho: specChirho.pageChirho,
      lineIndexChirho: specChirho.lineIndexChirho,
      targetSegmentIndexChirho: specChirho.targetSegmentIndexChirho,
      lineWidthPxChirho: lineChirho.lineWidthPxChirho,
      lineTextBeforeChirho: renderStoredLineTextChirho(lineChirho),
      lineTextPreviewChirho: validatedChirho.lineTextPreviewChirho,
      lineImageHashChirho: sha256FileChirho(
        scanlinePathChirho(specChirho.volumeChirho, specChirho.pageChirho, specChirho.lineIndexChirho)
      ),
      oldSpansChirho: lineChirho.spansChirho
        .slice()
        .sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho)
        .map((spanChirho) => ({
          segmentIndexChirho: spanChirho.segmentIndexChirho,
          xMinPxChirho: spanChirho.xMinPxChirho,
          widthPxChirho: spanChirho.widthPxChirho,
          scriptChirho: spanChirho.scriptChirho as SegmentRepairProposalSpanChirho["scriptChirho"],
          utf8TextChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho),
        })),
      proposedSpansChirho: validatedChirho.proposedSpansChirho,
      notesChirho: specChirho.notesChirho,
    };
    appendSegmentRepairProposalChirho(storePathChirho, recordChirho);
    draftedChirho.push(recordChirho);
    console.log(`[${MODULE_CHIRHO}] drafted ${specChirho.itemKeyChirho} (${recordChirho.proposalIdChirho})`);
  }
  return draftedChirho;
}

interface TriageRowChirho {
  spanKeyChirho: string;
  decisionChirho: string;
  reasonChirho: string;
}

// Eye verdicts from the 2026-07-18 escalation review (claude2, crops in the
// session scratchpad; second-agent verification invited in the room). These
// override the mechanical escalation reasons; drafted items live in
// REPAIR_SPECS_CHIRHO instead.
const EYE_VERDICTS_CHIRHO: TriageRowChirho[] = [
  { spanKeyChirho: "5:52:28:0", decisionChirho: "cleared", reasonChirho: "Eye-checked: print shows a plain \"2\" — legitimate French counting (\"les 2 dagesh\")." },
  { spanKeyChirho: "5:148:15:0", decisionChirho: "cleared", reasonChirho: "Eye-checked: print shows the ordinal \"1ᵉ\" (\"la 1ᵉ pers.\") — legitimate French." },
  { spanKeyChirho: "5:63:27:0", decisionChirho: "cleared", reasonChirho: "Eye-checked: print matches stored ישבק (CRNN misread). Possible plene ו in print — expert letter-check noted, not a swallow." },
  { spanKeyChirho: "5:64:29:6", decisionChirho: "cleared", reasonChirho: "Eye-checked: print תָּם matches stored (CRNN misread ת as ה)." },
  { spanKeyChirho: "5:69:4:1", decisionChirho: "cleared", reasonChirho: "Eye-checked: print מִי יִתֵּן matches stored lexemes; tsere/segol niqqud nit noted for the expert queue." },
  { spanKeyChirho: "5:69:17:0", decisionChirho: "cleared", reasonChirho: "Eye-checked: print קמתי matches stored (CRNN garbage read); qamats/patach niqqud nit noted." },
  { spanKeyChirho: "5:69:17:4", decisionChirho: "cleared", reasonChirho: "Eye-checked: print מָתַי matches stored." },
  { spanKeyChirho: "5:70:8:0", decisionChirho: "cleared", reasonChirho: "Eye-checked: print מָתַי matches stored." },
  { spanKeyChirho: "5:150:4:1", decisionChirho: "cleared", reasonChirho: "Eye-checked: print יָמַי matches stored (adjacent apparatus brace is print, not text)." },
  { spanKeyChirho: "5:69:7:8", decisionChirho: "drafted", reasonChirho: "Confirmed defect: stored וְשָׁכַב, print reads מָדַד — first eye read 2026-07-18, second reader confirmed the mem (wide bowl, sibling-letterform match). Text repair drafted." },
  { spanKeyChirho: "5:150:10:3", decisionChirho: "needs-expert", reasonChirho: "Eye-checked but unresolved: print may show suffixed יָמֶיךָ where stored has יָמַי; too small to call — expert print check required." },
];
const EYE_VERDICT_BY_KEY_CHIRHO = new Map(EYE_VERDICTS_CHIRHO.map((rowChirho) => [rowChirho.spanKeyChirho, rowChirho]));

function triageRowsChirho(
  findingsChirho: SweepFindingChirho[],
  witnessRecordsChirho: WitnessRecordChirho[],
  draftedKeysChirho: Set<string>
): { rowsChirho: TriageRowChirho[]; suspectRowsChirho: TriageRowChirho[] } {
  const bestV8ByKeyChirho = new Map<string, number>();
  for (const recordChirho of witnessRecordsChirho) {
    if (recordChirho.targetKindChirho === "unwitnessed-hebrew-span-chirho") continue;
    const currentChirho = bestV8ByKeyChirho.get(recordChirho.spanKeyChirho) ?? 0;
    bestV8ByKeyChirho.set(recordChirho.spanKeyChirho, Math.max(currentChirho, recordChirho.v8PHebChirho ?? 0));
  }
  const rowsChirho: TriageRowChirho[] = findingsChirho.map((findingChirho) => {
    if (draftedKeysChirho.has(findingChirho.spanKeyChirho)) {
      return {
        spanKeyChirho: findingChirho.spanKeyChirho,
        decisionChirho: "drafted",
        reasonChirho: "Eye-confirmed repair drafted to the segment-repair store (see proposals).",
      };
    }
    const eyeVerdictChirho = EYE_VERDICT_BY_KEY_CHIRHO.get(findingChirho.spanKeyChirho);
    if (eyeVerdictChirho !== undefined) return eyeVerdictChirho;
    if (findingChirho.signalsChirho.includes("digit-word-superseded-in-stored-text-chirho")) {
      return {
        spanKeyChirho: findingChirho.spanKeyChirho,
        decisionChirho: "cleared",
        reasonChirho:
          "Stored text already superseded the garbled word underlay (restored siglum or correction); word rows are stale, spans are right.",
      };
    }
    const v8Chirho = bestV8ByKeyChirho.get(findingChirho.spanKeyChirho) ?? 0;
    if (v8Chirho < V8_NONHEBREW_MAX_CHIRHO) {
      return {
        spanKeyChirho: findingChirho.spanKeyChirho,
        decisionChirho: "cleared",
        reasonChirho: `Witness classifier reads the print as non-Hebrew (P(hebrew)=${v8Chirho.toFixed(2)}); the number is citation-grammar-plausible French prose.`,
      };
    }
    if (v8Chirho < V8_HEBREW_MIN_CHIRHO) {
      return {
        spanKeyChirho: findingChirho.spanKeyChirho,
        decisionChirho: "escalated",
        reasonChirho: `Witness classifier is ambiguous (P(hebrew)=${v8Chirho.toFixed(2)}); needs a human look at the crop before drafting or clearing.`,
      };
    }
    return {
      spanKeyChirho: findingChirho.spanKeyChirho,
      decisionChirho: "escalated",
      reasonChirho: `Witness classifier reads Hebrew-shaped print (P(hebrew)=${v8Chirho.toFixed(2)}) but the item was not eye-confirmed this pass; confirm on the print before drafting.`,
    };
  });
  const suspectRowsChirho: TriageRowChirho[] = witnessRecordsChirho
    .filter(
      (recordChirho) =>
        recordChirho.targetKindChirho === "unwitnessed-hebrew-span-chirho" &&
        recordChirho.spanKeyChirho !== "3:151:36:2" &&
        recordChirho.sharedSkeletonCharsChirho === 0 &&
        (recordChirho.crnnConfChirho ?? 0) >= 0.5 &&
        (recordChirho.v8PHebChirho ?? 0) >= V8_HEBREW_MIN_CHIRHO &&
        recordChirho.readSkeletonChirho.length >= 2
    )
    .map(
      (recordChirho) =>
        EYE_VERDICT_BY_KEY_CHIRHO.get(recordChirho.spanKeyChirho) ?? {
          spanKeyChirho: recordChirho.spanKeyChirho,
          decisionChirho: "escalated",
          reasonChirho: `Disjoint confident read ${recordChirho.readSkeletonChirho} (conf ${(recordChirho.crnnConfChirho ?? 0).toFixed(2)}) vs stored — awaiting eye check under the vols-3-5 CRNN-weakness rule.`,
        }
    );
  return { rowsChirho, suspectRowsChirho };
}

function renderTriageReportChirho(
  rowsChirho: TriageRowChirho[],
  suspectRowsChirho: TriageRowChirho[],
  witnessRecordsChirho: WitnessRecordChirho[],
  draftedChirho: SegmentRepairProposalRecordChirho[],
  storePathChirho: string
): string {
  const countsChirho = new Map<string, number>();
  for (const rowChirho of rowsChirho) {
    countsChirho.set(rowChirho.decisionChirho, (countsChirho.get(rowChirho.decisionChirho) ?? 0) + 1);
  }
  const unwitnessedChirho = witnessRecordsChirho.filter(
    (recordChirho) => recordChirho.targetKindChirho === "unwitnessed-hebrew-span-chirho"
  );
  const confirmedChirho = unwitnessedChirho.filter((recordChirho) => recordChirho.skeletonEqualChirho);
  const linesChirho: string[] = [
    "<!-- For God so loved the world, that he gave his only begotten Son,",
    "that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->",
    "",
    "# Swallowed Hebrew Triage Chirho",
    "",
    `Generated: ${new Date().toISOString()} by ${MODULE_CHIRHO} (reviewer ${SWEEP_REVIEWER_CHIRHO}, machine triage)`,
    "",
    "Triage decisions for every sweep finding, per the calibration agreed in the room (msgs #5642/#5645/#5648): WLC-exact witness reads are strong evidence even from a weak reader; disjoint non-exact reads on vols 3-5 are weak and never justify a text-changing draft without eye confirmation; geometry and digit-garble signals are primary, CRNN reads are corroboration. Drafts land nothing: the Phase 4 apply lane with its mandatory approval step is the only path to a data change.",
    "",
    "## Summary",
    "",
    `- Sweep findings triaged: ${rowsChirho.length}`,
    ...[...countsChirho.entries()].sort().map(([decisionChirho, countChirho]) => `- ${decisionChirho}: ${countChirho}`),
    `- Draft proposals appended this run: ${draftedChirho.length} -> ${relative(PROJECT_ROOT_CHIRHO, storePathChirho)}`,
    `- Unwitnessed Hebrew spans read: ${unwitnessedChirho.length} (stored text witness-confirmed: ${confirmedChirho.length})`,
    `- Stored-Hebrew-suspect tier (disjoint confident read, vols 3-5 CRNN-weak rule): ${suspectRowsChirho.length} — ${suspectRowsChirho.filter((rowChirho) => rowChirho.decisionChirho === "cleared").length} eye-cleared, ${suspectRowsChirho.filter((rowChirho) => rowChirho.decisionChirho === "drafted").length} drafted, ${suspectRowsChirho.filter((rowChirho) => !["cleared", "drafted"].includes(rowChirho.decisionChirho)).length} open`,
    "",
    "## Drafted Proposals",
    "",
    ...draftedChirho.flatMap((proposalChirho) => [
      `### ${proposalChirho.itemKeyChirho} (${proposalChirho.repairKindChirho})`,
      "",
      `- Proposal: ${proposalChirho.proposalIdChirho}`,
      `- Rationale: ${proposalChirho.rationaleChirho}`,
      `- Before: ${proposalChirho.lineTextBeforeChirho}`,
      `- Preview: ${proposalChirho.lineTextPreviewChirho}`,
      "",
    ]),
    "## Stored-Hebrew-Suspect Tier (vols 3-5 CRNN-weak rule)",
    "",
    "Per the calibration these get NO text-changing draft until a human or second agent confirms the print. The 3:151:36:2 member of this tier is covered by the drafted split above. Eye results from the 2026-07-18 escalation review:",
    "",
    ...suspectRowsChirho.map(
      (rowChirho) => `- ${rowChirho.spanKeyChirho} [${rowChirho.decisionChirho}]: ${rowChirho.reasonChirho}`
    ),
    "",
    "## Per-Finding Decisions",
    "",
    "Span | Decision | Reason",
    "--- | --- | ---",
    ...rowsChirho.map((rowChirho) => `${rowChirho.spanKeyChirho} | ${rowChirho.decisionChirho} | ${rowChirho.reasonChirho}`),
    "",
  ];
  return `${linesChirho.join("\n").replace(/\n+$/u, "")}\n`;
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const storePathChirho =
    argsChirho.find((argChirho) => argChirho.startsWith("--store-chirho="))?.slice("--store-chirho=".length) ??
    DEFAULT_STORE_PATH_CHIRHO;
  const reportPathChirho =
    argsChirho.find((argChirho) => argChirho.startsWith("--out-chirho="))?.slice("--out-chirho=".length) ??
    DEFAULT_REPORT_PATH_CHIRHO;
  const candidatesChirho = JSON.parse(readFileSync(CANDIDATES_PATH_CHIRHO, "utf8")) as CandidatesFileChirho;
  const witnessChirho = JSON.parse(readFileSync(WITNESS_PATH_CHIRHO, "utf8")) as {
    recordsChirho: WitnessRecordChirho[];
  };
  const allSpecsChirho = [...REPAIR_SPECS_CHIRHO, ...buildSiglumSpecsChirho(candidatesChirho)];
  const draftedChirho = draftProposalsChirho(storePathChirho, allSpecsChirho);
  const triageChirho = triageRowsChirho(
    candidatesChirho.findingsChirho,
    witnessChirho.recordsChirho,
    new Set(allSpecsChirho.map((specChirho) => specChirho.itemKeyChirho))
  );
  writeTextAtomicChirho(
    reportPathChirho,
    renderTriageReportChirho(
      triageChirho.rowsChirho,
      triageChirho.suspectRowsChirho,
      witnessChirho.recordsChirho,
      draftedChirho,
      storePathChirho
    )
  );
  const countsChirho = triageChirho.rowsChirho.reduce<Record<string, number>>((accChirho, rowChirho) => {
    accChirho[rowChirho.decisionChirho] = (accChirho[rowChirho.decisionChirho] ?? 0) + 1;
    return accChirho;
  }, {});
  const suspectCountsChirho = triageChirho.suspectRowsChirho.reduce<Record<string, number>>((accChirho, rowChirho) => {
    accChirho[rowChirho.decisionChirho] = (accChirho[rowChirho.decisionChirho] ?? 0) + 1;
    return accChirho;
  }, {});
  console.log(
    `[${MODULE_CHIRHO}] drafted=${draftedChirho.length} decisions=${JSON.stringify(countsChirho)} suspects=${JSON.stringify(suspectCountsChirho)} report=${relative(PROJECT_ROOT_CHIRHO, reportPathChirho)} store=${relative(PROJECT_ROOT_CHIRHO, storePathChirho)}`
  );
}

if (import.meta.main) mainChirho();
