// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

export const REVIEWER_LAUNCHPAD_FILENAME_CHIRHO = "review-launchpad-chirho.html";

interface ReviewerLaunchpadRawHebrewStatusChirho {
  livePendingSpanCountChirho?: number;
  reportSpanCountChirho?: number;
  livePendingUnvalidatedSpanCountChirho?: number;
  livePendingPartialValidatedSpanCountChirho?: number;
  livePendingAllTokenValidatedSpanCountChirho?: number;
  livePendingValidationTierCountsChirho?: Record<string, number>;
}

interface ReviewerLaunchpadHumanValidationStatusChirho {
  rawQueueIssueRowsChirho?: number;
  genericReviewerRowsChirho?: number;
  genericReviewerLiveTextMatchRowsChirho?: number;
  genericReviewerLiveTextMismatchRowsChirho?: number;
}

interface ReviewerLaunchpadLatinSymbolStatusChirho {
  remainingDecisionCountChirho?: number;
  pendingDecisionCountsChirho?: Record<string, number>;
  pendingTrivialPunctuationSymbolItemCountChirho?: number;
  pendingMixedScriptSymbolItemCountChirho?: number;
  pendingNontrivialSymbolItemCountChirho?: number;
}

interface ReviewerLaunchpadVisionTierStatusChirho {
  remainingConfirmationCountChirho?: number;
  pendingVisionCountsChirho?: Record<string, number>;
  pendingNonblankTextCountsChirho?: Record<string, number>;
  pendingBlankTextCountsChirho?: Record<string, number>;
  pendingPriorityItemCountChirho?: number;
  pendingAppendixItemCountChirho?: number;
  pendingBlankTextItemCountChirho?: number;
}

interface ReviewerLaunchpadStructuralStatusChirho {
  issueCodeCountsChirho?: Record<string, number>;
}

export interface ReviewerLaunchpadStatusChirho {
  generatedAtChirho?: string;
  certificationCompleteChirho?: boolean;
  reviewStartLinksChirho?: Record<string, string | null>;
  structuralChirho?: ReviewerLaunchpadStructuralStatusChirho;
  rawHebrewChirho?: ReviewerLaunchpadRawHebrewStatusChirho;
  humanValidationDbChirho?: ReviewerLaunchpadHumanValidationStatusChirho;
  latinSymbolVisionChirho?: ReviewerLaunchpadLatinSymbolStatusChirho;
  visionTierChirho?: ReviewerLaunchpadVisionTierStatusChirho;
}

interface ReviewerLaunchpadLaneChirho {
  labelChirho: string;
  hrefChirho: string;
  countChirho: string;
  guidanceChirho: string;
}

interface ReviewerLaunchpadSectionChirho {
  titleChirho: string;
  summaryChirho: string;
  lanesChirho: ReviewerLaunchpadLaneChirho[];
}

const RAW_HEBREW_PRIMARY_VOLS_3_5_KEY_CHIRHO = "unvalidated-chirho|primary-vols-3-5-chirho";
const RAW_HEBREW_PRIMARY_VOLS_1_2_KEY_CHIRHO = "unvalidated-chirho|primary-vol-2-chirho";
const RAW_HEBREW_PARTIAL_VOLS_1_2_KEY_CHIRHO = "partial-token-validated-chirho|primary-vol-2-chirho";

function escapeHtmlChirho(valueChirho: unknown): string {
  return String(valueChirho)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function numberChirho(valueChirho: unknown): number {
  return typeof valueChirho === "number" && Number.isFinite(valueChirho) ? valueChirho : 0;
}

function countTextChirho(currentChirho: unknown, nounChirho: string, totalChirho?: unknown): string {
  const currentTextChirho = String(numberChirho(currentChirho));
  if (totalChirho === undefined) return `${currentTextChirho} ${nounChirho}`;
  return `${currentTextChirho} of ${numberChirho(totalChirho)} ${nounChirho}`;
}

function startLinkChirho(
  statusChirho: ReviewerLaunchpadStatusChirho,
  keyChirho: string,
  fallbackHrefChirho: string
): string {
  const linkChirho = statusChirho.reviewStartLinksChirho?.[keyChirho];
  return typeof linkChirho === "string" && linkChirho.trim().length > 0 ? linkChirho : fallbackHrefChirho;
}

function rawValidationTierCountChirho(statusChirho: ReviewerLaunchpadStatusChirho, keyChirho: string): number {
  return numberChirho(statusChirho.rawHebrewChirho?.livePendingValidationTierCountsChirho?.[keyChirho]);
}

function pendingScriptCountChirho(statusChirho: ReviewerLaunchpadStatusChirho, scriptChirho: string): number {
  return numberChirho(statusChirho.visionTierChirho?.pendingVisionCountsChirho?.[scriptChirho]);
}

function pendingLatinCountChirho(statusChirho: ReviewerLaunchpadStatusChirho, scriptChirho: string): number {
  return numberChirho(statusChirho.latinSymbolVisionChirho?.pendingDecisionCountsChirho?.[scriptChirho]);
}

function laneChirho(
  labelChirho: string,
  hrefChirho: string,
  countChirho: string,
  guidanceChirho: string
): ReviewerLaunchpadLaneChirho {
  return { labelChirho, hrefChirho, countChirho, guidanceChirho };
}

function reviewerLaunchpadSectionsChirho(statusChirho: ReviewerLaunchpadStatusChirho): ReviewerLaunchpadSectionChirho[] {
  const rawChirho = statusChirho.rawHebrewChirho ?? {};
  const humanChirho = statusChirho.humanValidationDbChirho ?? {};
  const latinChirho = statusChirho.latinSymbolVisionChirho ?? {};
  const expertChirho = statusChirho.visionTierChirho ?? {};
  const syriacIssueCountChirho = numberChirho(
    statusChirho.structuralChirho?.issueCodeCountsChirho?.["blank-span-text-chirho"]
  );
  return [
    {
      titleChirho: "All Review Stations",
      summaryChirho: "Open the guarded browser queues. The review servers still own all save and confirmation behavior.",
      lanesChirho: [
        laneChirho(
          "Raw Hebrew live validator",
          startLinkChirho(statusChirho, "rawHebrewAllChirho", "http://localhost:8766/"),
          countTextChirho(rawChirho.livePendingSpanCountChirho, "pending report span(s)", rawChirho.reportSpanCountChirho),
          "Use for Hebrew spans from Pass C. Clean saves require an explicit clean-certification checkbox."
        ),
        laneChirho(
          "Latin/symbol live reviewer",
          startLinkChirho(statusChirho, "latinSymbolAllChirho", "http://localhost:8770/"),
          countTextChirho(latinChirho.remainingDecisionCountChirho, "remaining decision(s)"),
          "Use for French, Latin, sigla, references, operators, and punctuation decisions."
        ),
        laneChirho(
          "Expert non-Latin reviewer",
          startLinkChirho(statusChirho, "expertAllChirho", "http://localhost:8771/"),
          countTextChirho(expertChirho.remainingConfirmationCountChirho, "remaining confirmation(s)"),
          "Confirm only exact letters and marks inside your script competence; otherwise flag or skip."
        ),
        laneChirho(
          "Saved raw Hebrew issues",
          "http://localhost:8766/?review-state-chirho=saved-issues-chirho",
          countTextChirho(humanChirho.rawQueueIssueRowsChirho, "read-only issue row(s)"),
          "Read-only inspection lane for already-saved issues; it does not expose save actions."
        ),
        laneChirho(
          "Certification status",
          "status-chirho.md",
          statusChirho.certificationCompleteChirho === true ? "complete" : "not complete",
          "Read the current blockers, fingerprints, and generated handoff links."
        ),
      ],
    },
    {
      titleChirho: "Hallelujah Hebrew And Greek",
      summaryChirho: "Primary lanes for Hebrew/WLC and Greek review, including raw Hebrew reconstruction work.",
      lanesChirho: [
        laneChirho(
          "Raw Hebrew unvalidated",
          startLinkChirho(
            statusChirho,
            "rawHebrewUnvalidatedChirho",
            "http://localhost:8766/?validation-status-chirho=unvalidated-chirho"
          ),
          countTextChirho(rawChirho.livePendingUnvalidatedSpanCountChirho, "pending span(s)"),
          "Use for raw rows that have no saved current validation yet."
        ),
        laneChirho(
          "Raw Hebrew vols 3-5 unvalidated",
          startLinkChirho(
            statusChirho,
            "rawHebrewVols35UnvalidatedChirho",
            "http://localhost:8766/?validation-status-chirho=unvalidated-chirho&tier-chirho=primary-vols-3-5-chirho"
          ),
          countTextChirho(rawValidationTierCountChirho(statusChirho, RAW_HEBREW_PRIMARY_VOLS_3_5_KEY_CHIRHO), "pending span(s)"),
          "Start here for the current raw Hebrew priority pass."
        ),
        laneChirho(
          "Raw Hebrew vols 1-2 unvalidated",
          startLinkChirho(
            statusChirho,
            "rawHebrewVols12UnvalidatedChirho",
            "http://localhost:8766/?validation-status-chirho=unvalidated-chirho&tier-chirho=primary-vol-2-chirho"
          ),
          countTextChirho(rawValidationTierCountChirho(statusChirho, RAW_HEBREW_PRIMARY_VOLS_1_2_KEY_CHIRHO), "pending span(s)"),
          "Use after the primary vols 3-5 lane or when working through older-volume leftovers."
        ),
        laneChirho(
          "Raw Hebrew partial",
          startLinkChirho(
            statusChirho,
            "rawHebrewPartialChirho",
            "http://localhost:8766/?validation-status-chirho=partial-token-validated-chirho"
          ),
          countTextChirho(rawChirho.livePendingPartialValidatedSpanCountChirho, "pending span(s)"),
          "Use for rows where some token-level evidence exists but a human still needs to settle the print."
        ),
        laneChirho(
          "Raw Hebrew vols 1-2 partial",
          startLinkChirho(
            statusChirho,
            "rawHebrewVols12PartialChirho",
            "http://localhost:8766/?validation-status-chirho=partial-token-validated-chirho&tier-chirho=primary-vol-2-chirho"
          ),
          countTextChirho(rawValidationTierCountChirho(statusChirho, RAW_HEBREW_PARTIAL_VOLS_1_2_KEY_CHIRHO), "pending span(s)"),
          "Use for partial-token rows where exact letters or marks still need direct print review."
        ),
        laneChirho(
          "Raw Hebrew all-token spot-check",
          startLinkChirho(
            statusChirho,
            "rawHebrewSpotCheckChirho",
            "http://localhost:8766/?validation-status-chirho=all-token-validated-chirho&tier-chirho=spot-check-chirho"
          ),
          countTextChirho(rawChirho.livePendingAllTokenValidatedSpanCountChirho, "pending span(s)"),
          "Spot-check rows that machine witnesses agree on; still verify against the printed line."
        ),
        laneChirho(
          "Hebrew/WLC expert lane",
          startLinkChirho(statusChirho, "expertHebrewChirho", "http://localhost:8771/?script-chirho=hebrew-chirho"),
          countTextChirho(pendingScriptCountChirho(statusChirho, "hebrew-chirho"), "pending item(s)"),
          "Confirm exact Hebrew letters, vowels, accents, punctuation, and Hebrew-script Aramaic only within competence."
        ),
        laneChirho(
          "Greek expert lane",
          startLinkChirho(statusChirho, "expertGreekChirho", "http://localhost:8771/?script-chirho=greek-chirho"),
          countTextChirho(pendingScriptCountChirho(statusChirho, "greek-chirho"), "pending item(s)"),
          "Confirm exact Greek text and marks against the print, not just a plausible standard text."
        ),
        laneChirho(
          "Attribution re-review",
          startLinkChirho(
            statusChirho,
            "rawHebrewAttributionRereviewChirho",
            "http://localhost:8766/?review-state-chirho=attribution-rereview-chirho"
          ),
          countTextChirho(humanChirho.genericReviewerRowsChirho, "row(s) needing explicit attribution"),
          "Use when an older generic row cannot be safely reattributed without a fresh review."
        ),
      ],
    },
    {
      titleChirho: "Latin And Symbols",
      summaryChirho: "Human proofing for French, Latin, apparatus marks, references, sigla, and symbols.",
      lanesChirho: [
        laneChirho(
          "French",
          startLinkChirho(statusChirho, "latinSymbolFrenchChirho", "http://localhost:8770/?script-chirho=french-chirho"),
          countTextChirho(pendingLatinCountChirho(statusChirho, "french-chirho"), "pending item(s)"),
          "Review ordinary French text; flag anything that actually belongs to another script lane."
        ),
        laneChirho(
          "Latin non-French",
          startLinkChirho(
            statusChirho,
            "latinSymbolNonFrenchChirho",
            "http://localhost:8770/?script-chirho=latin-non-french-chirho"
          ),
          countTextChirho(pendingLatinCountChirho(statusChirho, "latin-non-french-chirho"), "pending item(s)"),
          "Review names, abbreviations, and non-French Latin text directly against the print."
        ),
        laneChirho(
          "Witness sigla and script-like symbols",
          startLinkChirho(
            statusChirho,
            "latinSymbolSiglumSymbolChirho",
            "http://localhost:8770/?script-chirho=symbol-chirho&symbol-risk-chirho=script-or-siglum-symbol-chirho"
          ),
          countTextChirho(latinChirho.pendingMixedScriptSymbolItemCountChirho, "pending item(s)"),
          "Do not blanket-accept fraktur sigla; wrong siglum means wrong witness."
        ),
        laneChirho(
          "Nontrivial symbols",
          startLinkChirho(
            statusChirho,
            "latinSymbolNontrivialSymbolChirho",
            "http://localhost:8770/?script-chirho=symbol-chirho&symbol-risk-chirho=nontrivial-symbol-chirho"
          ),
          countTextChirho(latinChirho.pendingNontrivialSymbolItemCountChirho, "pending item(s)"),
          "Review references, dingbats, operators, and ornaments as meaningful printed content."
        ),
        laneChirho(
          "Trivial punctuation",
          startLinkChirho(
            statusChirho,
            "latinSymbolTrivialPunctuationChirho",
            "http://localhost:8770/?script-chirho=symbol-chirho&symbol-risk-chirho=trivial-punctuation-chirho"
          ),
          countTextChirho(latinChirho.pendingTrivialPunctuationSymbolItemCountChirho, "pending item(s)"),
          "Small lane for punctuation already constrained by the policy scope guard."
        ),
      ],
    },
    {
      titleChirho: "External Script Experts",
      summaryChirho: "Script-specific confirmation lanes for Syriac and Arabic readers.",
      lanesChirho: [
        laneChirho(
          "Syriac blank handoff",
          startLinkChirho(
            statusChirho,
            "expertSyriacBlankChirho",
            "http://localhost:8771/?script-chirho=syriac-chirho&text-state-chirho=blank-chirho"
          ),
          `${countTextChirho(expertChirho.pendingBlankTextCountsChirho?.["syriac-chirho"], "blank item(s)")} (${syriacIssueCountChirho} strict issue marker(s))`,
          "A Syriac reader must supply the exact printed text before anyone can confirm it."
        ),
        laneChirho(
          "Syriac has-text",
          startLinkChirho(
            statusChirho,
            "expertSyriacNonblankChirho",
            "http://localhost:8771/?script-chirho=syriac-chirho&text-state-chirho=nonblank-chirho"
          ),
          countTextChirho(expertChirho.pendingNonblankTextCountsChirho?.["syriac-chirho"], "pending item(s)"),
          "Confirm exact Syriac letters, dots, and punctuation only if you can read the script."
        ),
        laneChirho(
          "Syriac all",
          startLinkChirho(statusChirho, "expertSyriacChirho", "http://localhost:8771/?script-chirho=syriac-chirho"),
          countTextChirho(pendingScriptCountChirho(statusChirho, "syriac-chirho"), "pending item(s)"),
          "Use for a complete Syriac pass after the blank handoff is supplied."
        ),
        laneChirho(
          "Arabic",
          startLinkChirho(statusChirho, "expertArabicChirho", "http://localhost:8771/?script-chirho=arabic-chirho"),
          countTextChirho(pendingScriptCountChirho(statusChirho, "arabic-chirho"), "pending item(s)"),
          "Confirm exact Arabic letters, dots, vowels, and punctuation only if you can read Arabic."
        ),
      ],
    },
  ];
}

function laneHtmlChirho(laneChirho: ReviewerLaunchpadLaneChirho): string {
  return [
    `<article class="lane-chirho">`,
    `  <div class="lane-body-chirho">`,
    `    <h3>${escapeHtmlChirho(laneChirho.labelChirho)}</h3>`,
    `    <p class="count-chirho">${escapeHtmlChirho(laneChirho.countChirho)}</p>`,
    `    <p>${escapeHtmlChirho(laneChirho.guidanceChirho)}</p>`,
    `  </div>`,
    `  <a class="launch-chirho" href="${escapeHtmlChirho(laneChirho.hrefChirho)}">Open lane</a>`,
    `</article>`,
  ].join("\n");
}

function sectionHtmlChirho(sectionChirho: ReviewerLaunchpadSectionChirho): string {
  return [
    `<section class="section-chirho">`,
    `  <div class="section-header-chirho">`,
    `    <h2>${escapeHtmlChirho(sectionChirho.titleChirho)}</h2>`,
    `    <p>${escapeHtmlChirho(sectionChirho.summaryChirho)}</p>`,
    `  </div>`,
    `  <div class="lanes-chirho">`,
    ...sectionChirho.lanesChirho.map((laneItemChirho) => laneHtmlChirho(laneItemChirho)),
    `  </div>`,
    `</section>`,
  ].join("\n");
}

export function reviewerLaunchpadHtmlChirho(statusChirho: ReviewerLaunchpadStatusChirho): string {
  const generatedAtChirho = statusChirho.generatedAtChirho ?? "unknown";
  const sectionsChirho = reviewerLaunchpadSectionsChirho(statusChirho);
  return [
    "<!doctype html>",
    "<!-- For God so loved the world that he gave his only begotten Son, that whoever believes in him should not perish but have eternal life. John 3:16 -->",
    `<html lang="en" data-status-generated-at-chirho="${escapeHtmlChirho(generatedAtChirho)}">`,
    "<head>",
    `  <meta charset="utf-8">`,
    `  <meta name="viewport" content="width=device-width, initial-scale=1">`,
    `  <title>HOTTP Reviewer Launchpad Chirho</title>`,
    "  <style>",
    "    :root { color-scheme: light; --ink-chirho: #20242a; --muted-chirho: #5b6470; --line-chirho: #cfd6df; --panel-chirho: #f7f8fa; --accent-chirho: #7b4a12; --link-chirho: #0a5796; }",
    "    * { box-sizing: border-box; }",
    "    body { margin: 0; color: var(--ink-chirho); background: #ffffff; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.35; }",
    "    header { padding: 24px clamp(16px, 3vw, 40px) 16px; border-bottom: 1px solid var(--line-chirho); background: #f4f1ea; }",
    "    main { padding: 20px clamp(16px, 3vw, 40px) 36px; max-width: 1320px; margin: 0 auto; }",
    "    h1 { margin: 0; font-size: clamp(28px, 4vw, 42px); letter-spacing: 0; }",
    "    h2, h3, p { margin: 0; }",
    "    .meta-chirho { margin-top: 8px; color: var(--muted-chirho); font-size: 15px; }",
    "    .section-chirho { margin-top: 24px; }",
    "    .section-header-chirho { display: grid; gap: 6px; margin-bottom: 12px; }",
    "    .section-header-chirho h2 { font-size: 21px; letter-spacing: 0; }",
    "    .section-header-chirho p { color: var(--muted-chirho); max-width: 880px; }",
    "    .lanes-chirho { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; }",
    "    .lane-chirho { min-height: 164px; border: 1px solid var(--line-chirho); background: var(--panel-chirho); border-radius: 6px; padding: 14px; display: grid; grid-template-rows: 1fr auto; gap: 14px; }",
    "    .lane-body-chirho { display: grid; gap: 8px; }",
    "    .lane-body-chirho h3 { font-size: 17px; letter-spacing: 0; }",
    "    .lane-body-chirho p { color: var(--muted-chirho); font-size: 14px; }",
    "    .count-chirho { color: var(--accent-chirho) !important; font-weight: 700; }",
    "    .launch-chirho { display: inline-flex; align-items: center; justify-content: center; min-height: 42px; border: 1px solid var(--link-chirho); color: #ffffff; background: var(--link-chirho); border-radius: 5px; text-decoration: none; font-weight: 700; padding: 8px 12px; }",
    "    .launch-chirho:focus-visible { outline: 3px solid #d48a2c; outline-offset: 2px; }",
    "    .footer-chirho { margin-top: 28px; padding-top: 16px; border-top: 1px solid var(--line-chirho); color: var(--muted-chirho); font-size: 14px; }",
    "  </style>",
    "</head>",
    "<body>",
    "  <header>",
    "    <h1>HOTTP Reviewer Launchpad</h1>",
    `    <p class="meta-chirho">Generated from certification status at ${escapeHtmlChirho(generatedAtChirho)}. Links open the existing guarded review stations.</p>`,
    "  </header>",
    "  <main>",
    ...sectionsChirho.map((sectionChirho) => sectionHtmlChirho(sectionChirho)),
    "    <p class=\"footer-chirho\">This page is generated from status-chirho.json and contains no save form. Certification still depends on the review servers and fail-closed status gate.</p>",
    "  </main>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}
