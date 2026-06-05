// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify reviewer attribution invariants used by certification-affecting paths.
 *
 * This does not certify text or mutate review state. It prevents future drift
 * between server-side attribution checks and the serialized browser regex.
 */

import {
  summarizeLatinSymbolAcceptancePolicyChirho,
  LATIN_SYMBOL_POLICY_DECISION_ACCEPTED_CHIRHO,
  type LatinSymbolAcceptancePolicyFileChirho,
} from "./latin-symbol-vision-acceptance-policy-chirho.ts";
import type { LatinSymbolVisionLiveItemChirho } from "./latin-symbol-vision-live-items-chirho.ts";
import {
  certifyingReviewerAttributionErrorChirho,
  explicitReviewerAttributionErrorChirho,
  isBlockedCertificationReviewerAttributionChirho,
  isGenericReviewerAttributionChirho,
  isMachineReviewerAttributionChirho,
  isTemplatePlaceholderReviewerAttributionChirho,
  MACHINE_REVIEWER_ID_RE_FLAGS_CHIRHO,
  MACHINE_REVIEWER_ID_RE_SOURCE_CHIRHO,
  REVIEWER_TEMPLATE_PLACEHOLDER_RE_FLAGS_CHIRHO,
  REVIEWER_TEMPLATE_PLACEHOLDER_RE_SOURCE_CHIRHO,
} from "./reviewer-attribution-chirho.ts";
import { hashTextChirho } from "./text-normalization-chirho.ts";
import {
  summarizeVisionTierExpertConfirmationsChirho,
  VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO,
  type VisionTierExpertConfirmationFileChirho,
} from "./vision-tier-expert-confirmation-policy-chirho.ts";
import type { VisionTierExpertLiveItemChirho } from "./vision-tier-expert-live-items-chirho.ts";

const MODULE_CHIRHO = "check-reviewer-attribution-chirho";

interface ReviewerAttributionCaseChirho {
  reviewerChirho: string;
  genericChirho: boolean;
  machineChirho: boolean;
  placeholderChirho: boolean;
  explicitOkChirho: boolean;
  certifyingOkChirho: boolean;
}

const REVIEWER_ATTRIBUTION_CASES_CHIRHO: ReviewerAttributionCaseChirho[] = [
  {
    reviewerChirho: "",
    genericChirho: true,
    machineChirho: false,
    placeholderChirho: false,
    explicitOkChirho: false,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "human-chirho",
    genericChirho: true,
    machineChirho: false,
    placeholderChirho: false,
    explicitOkChirho: false,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "reviewer-chirho",
    genericChirho: true,
    machineChirho: false,
    placeholderChirho: false,
    explicitOkChirho: false,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "<explicit-human-reviewer-id-chirho>",
    genericChirho: true,
    machineChirho: false,
    placeholderChirho: true,
    explicitOkChirho: false,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "hallelujah-chirho",
    genericChirho: false,
    machineChirho: false,
    placeholderChirho: false,
    explicitOkChirho: true,
    certifyingOkChirho: true,
  },
  {
    reviewerChirho: "dr-brock-human-reviewer",
    genericChirho: false,
    machineChirho: false,
    placeholderChirho: false,
    explicitOkChirho: true,
    certifyingOkChirho: true,
  },
  {
    reviewerChirho: "inhumane-bot-chirho",
    genericChirho: false,
    machineChirho: true,
    placeholderChirho: false,
    explicitOkChirho: true,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "ai-reviewer-chirho",
    genericChirho: false,
    machineChirho: true,
    placeholderChirho: false,
    explicitOkChirho: true,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "llm-reviewer-chirho",
    genericChirho: false,
    machineChirho: true,
    placeholderChirho: false,
    explicitOkChirho: true,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "codex-gpt5-chirho",
    genericChirho: false,
    machineChirho: true,
    placeholderChirho: false,
    explicitOkChirho: true,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "claude-opus-vision-chirho",
    genericChirho: false,
    machineChirho: true,
    placeholderChirho: false,
    explicitOkChirho: true,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "openai-o3-chirho",
    genericChirho: false,
    machineChirho: true,
    placeholderChirho: false,
    explicitOkChirho: true,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "codex-human-chirho",
    genericChirho: false,
    machineChirho: true,
    placeholderChirho: false,
    explicitOkChirho: true,
    certifyingOkChirho: false,
  },
];

function assertEqualChirho(actualChirho: unknown, expectedChirho: unknown, labelChirho: string): void {
  if (actualChirho !== expectedChirho) {
    throw new Error(`${labelChirho}: expected ${String(expectedChirho)}, got ${String(actualChirho)}`);
  }
}

const EXPERT_POLICY_LIVE_ITEM_CHIRHO: VisionTierExpertLiveItemChirho = {
  idChirho: "v1-p0001-l001-s1",
  reviewerChirho: "Hebrew/WLC reviewer",
  scriptChirho: "hebrew-chirho",
  visionSourceChirho: "explicit-span-chirho",
  volumeChirho: 1,
  pageChirho: 1,
  lineIndexChirho: 1,
  segmentIndexChirho: 1,
  currentTextChirho: "א",
};

const LATIN_SYMBOL_POLICY_LIVE_ITEM_CHIRHO: LatinSymbolVisionLiveItemChirho = {
  idChirho: "v1-p0001-l001-s0",
  itemKindChirho: "span-chirho",
  volumeChirho: 1,
  pageChirho: 1,
  lineIndexChirho: 1,
  segmentIndexChirho: 0,
  wordIndexChirho: null,
  scriptChirho: "symbol-chirho",
  textChirho: "3,11",
  lineTextChirho: "3,11",
  sourceChirho: "explicit-span-provenance-chirho",
};

function expertPolicyFileChirho(reviewerChirho: string): VisionTierExpertConfirmationFileChirho {
  return expertPolicyFileWithRationaleChirho(reviewerChirho, "reviewer attribution invariant check");
}

function expertPolicyFileWithRationaleChirho(
  reviewerChirho: string,
  rationaleChirho: string
): VisionTierExpertConfirmationFileChirho {
  return {
    schemaVersionChirho: 1,
    policiesChirho: [
      {
        policyIdChirho: `reviewer-attribution-check-${reviewerChirho}-chirho`,
        decisionChirho: VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO,
        reviewerChirho,
        reviewerRoleChirho: "Hebrew/WLC reviewer",
        confirmedAtChirho: "2026-06-04T00:00:00.000Z",
        certifyExactChirho: true,
        rationaleChirho,
        itemCountChirho: 1,
        itemsChirho: [
          {
            itemIdChirho: EXPERT_POLICY_LIVE_ITEM_CHIRHO.idChirho,
            scriptChirho: EXPERT_POLICY_LIVE_ITEM_CHIRHO.scriptChirho,
            visionSourceChirho: EXPERT_POLICY_LIVE_ITEM_CHIRHO.visionSourceChirho,
            currentTextChirho: EXPERT_POLICY_LIVE_ITEM_CHIRHO.currentTextChirho,
            currentTextHashChirho: hashTextChirho(EXPERT_POLICY_LIVE_ITEM_CHIRHO.currentTextChirho),
          },
        ],
      },
    ],
  };
}

function latinSymbolPolicyFileChirho(reviewerChirho: string): LatinSymbolAcceptancePolicyFileChirho {
  return latinSymbolPolicyFileWithRationaleChirho(reviewerChirho, "reviewer attribution invariant check");
}

function latinSymbolPolicyFileWithRationaleChirho(
  reviewerChirho: string,
  rationaleChirho: string
): LatinSymbolAcceptancePolicyFileChirho {
  return {
    schemaVersionChirho: 1,
    policiesChirho: [
      {
        policyIdChirho: `reviewer-attribution-check-${reviewerChirho}-latin-symbol-chirho`,
        decisionChirho: LATIN_SYMBOL_POLICY_DECISION_ACCEPTED_CHIRHO,
        reviewerChirho,
        acceptedAtChirho: "2026-06-04T00:00:00.000Z",
        acceptCleanChirho: true,
        rationaleChirho,
        scopeChirho: "script=symbol-chirho; kind=all-chirho; safeSymbolsOnly=false",
        itemCountChirho: 1,
        itemsChirho: [
          {
            itemIdChirho: LATIN_SYMBOL_POLICY_LIVE_ITEM_CHIRHO.idChirho,
            itemKindChirho: LATIN_SYMBOL_POLICY_LIVE_ITEM_CHIRHO.itemKindChirho,
            scriptChirho: LATIN_SYMBOL_POLICY_LIVE_ITEM_CHIRHO.scriptChirho,
            currentTextChirho: LATIN_SYMBOL_POLICY_LIVE_ITEM_CHIRHO.textChirho,
            currentTextHashChirho: hashTextChirho(LATIN_SYMBOL_POLICY_LIVE_ITEM_CHIRHO.textChirho),
          },
        ],
      },
    ],
  };
}

function checkExpertConfirmationPolicyAttributionChirho(): void {
  const humanSummaryChirho = summarizeVisionTierExpertConfirmationsChirho(
    expertPolicyFileChirho("dr-brock-human-reviewer"),
    true,
    [EXPERT_POLICY_LIVE_ITEM_CHIRHO]
  );
  assertEqualChirho(humanSummaryChirho.policyFileShapeOkChirho, true, "human expert policy shape");
  assertEqualChirho(humanSummaryChirho.validConfirmedPolicyItemCountChirho, 1, "human expert policy valid item count");

  const machineSummaryChirho = summarizeVisionTierExpertConfirmationsChirho(
    expertPolicyFileChirho("codex-gpt5-chirho"),
    true,
    [EXPERT_POLICY_LIVE_ITEM_CHIRHO]
  );
  assertEqualChirho(machineSummaryChirho.policyFileShapeOkChirho, false, "machine expert policy shape");
  assertEqualChirho(machineSummaryChirho.validConfirmedPolicyItemCountChirho, 0, "machine expert policy valid item count");
  if (
    !machineSummaryChirho.shapeErrorsChirho.some((errorChirho) =>
      errorChirho.includes("machine reviewer codex-gpt5-chirho cannot certify")
    )
  ) {
    throw new Error(`machine expert policy did not report reviewer attribution error: ${machineSummaryChirho.shapeErrorsChirho.join("; ")}`);
  }

  const placeholderRationaleSummaryChirho = summarizeVisionTierExpertConfirmationsChirho(
    expertPolicyFileWithRationaleChirho("dr-brock-human-reviewer", "<why these exact items are confirmed>"),
    true,
    [EXPERT_POLICY_LIVE_ITEM_CHIRHO]
  );
  assertEqualChirho(placeholderRationaleSummaryChirho.policyFileShapeOkChirho, false, "placeholder-rationale expert policy shape");
  assertEqualChirho(
    placeholderRationaleSummaryChirho.validConfirmedPolicyItemCountChirho,
    0,
    "placeholder-rationale expert policy valid item count"
  );
  if (
    !placeholderRationaleSummaryChirho.shapeErrorsChirho.some((errorChirho) =>
      errorChirho.includes("rationaleChirho must not be a template placeholder")
    )
  ) {
    throw new Error(`placeholder-rationale expert policy did not report rationale error: ${placeholderRationaleSummaryChirho.shapeErrorsChirho.join("; ")}`);
  }
}

function checkLatinSymbolPolicyAttributionChirho(): void {
  const humanSummaryChirho = summarizeLatinSymbolAcceptancePolicyChirho(
    latinSymbolPolicyFileChirho("dr-smith-human-reviewer"),
    true,
    [LATIN_SYMBOL_POLICY_LIVE_ITEM_CHIRHO]
  );
  assertEqualChirho(humanSummaryChirho.policyFileShapeOkChirho, true, "human Latin/symbol policy shape");
  assertEqualChirho(humanSummaryChirho.validAcceptedPolicyItemCountChirho, 1, "human Latin/symbol policy valid item count");

  const machineSummaryChirho = summarizeLatinSymbolAcceptancePolicyChirho(
    latinSymbolPolicyFileChirho("openai-human-chirho"),
    true,
    [LATIN_SYMBOL_POLICY_LIVE_ITEM_CHIRHO]
  );
  assertEqualChirho(machineSummaryChirho.policyFileShapeOkChirho, false, "machine-human Latin/symbol policy shape");
  assertEqualChirho(machineSummaryChirho.validAcceptedPolicyItemCountChirho, 0, "machine-human Latin/symbol policy valid item count");
  if (
    !machineSummaryChirho.shapeErrorsChirho.some((errorChirho) =>
      errorChirho.includes("is not trivial symbol punctuation")
    )
  ) {
    throw new Error(`machine-human Latin/symbol policy did not report trivial-only scope error: ${machineSummaryChirho.shapeErrorsChirho.join("; ")}`);
  }

  const placeholderRationaleSummaryChirho = summarizeLatinSymbolAcceptancePolicyChirho(
    latinSymbolPolicyFileWithRationaleChirho("dr-smith-human-reviewer", "<why these items are accepted clean>"),
    true,
    [LATIN_SYMBOL_POLICY_LIVE_ITEM_CHIRHO]
  );
  assertEqualChirho(placeholderRationaleSummaryChirho.policyFileShapeOkChirho, false, "placeholder-rationale Latin/symbol policy shape");
  assertEqualChirho(
    placeholderRationaleSummaryChirho.validAcceptedPolicyItemCountChirho,
    0,
    "placeholder-rationale Latin/symbol policy valid item count"
  );
  if (
    !placeholderRationaleSummaryChirho.shapeErrorsChirho.some((errorChirho) =>
      errorChirho.includes("rationaleChirho must not be a template placeholder")
    )
  ) {
    throw new Error(`placeholder-rationale Latin/symbol policy did not report rationale error: ${placeholderRationaleSummaryChirho.shapeErrorsChirho.join("; ")}`);
  }
}

function mainChirho(): void {
  const browserMachineReviewerReChirho = new RegExp(
    MACHINE_REVIEWER_ID_RE_SOURCE_CHIRHO,
    MACHINE_REVIEWER_ID_RE_FLAGS_CHIRHO
  );
  const browserReviewerPlaceholderReChirho = new RegExp(
    REVIEWER_TEMPLATE_PLACEHOLDER_RE_SOURCE_CHIRHO,
    REVIEWER_TEMPLATE_PLACEHOLDER_RE_FLAGS_CHIRHO
  );

  for (const caseChirho of REVIEWER_ATTRIBUTION_CASES_CHIRHO) {
    const labelChirho = JSON.stringify(caseChirho.reviewerChirho);
    const browserReviewerChirho = caseChirho.reviewerChirho.trim().toLowerCase();
    const browserTrimmedReviewerChirho = caseChirho.reviewerChirho.trim();
    assertEqualChirho(
      isGenericReviewerAttributionChirho(caseChirho.reviewerChirho),
      caseChirho.genericChirho,
      `${labelChirho} generic attribution`
    );
    assertEqualChirho(
      isMachineReviewerAttributionChirho(caseChirho.reviewerChirho),
      caseChirho.machineChirho,
      `${labelChirho} machine attribution`
    );
    assertEqualChirho(
      isTemplatePlaceholderReviewerAttributionChirho(caseChirho.reviewerChirho),
      caseChirho.placeholderChirho,
      `${labelChirho} placeholder attribution`
    );
    assertEqualChirho(
      browserMachineReviewerReChirho.test(browserReviewerChirho),
      caseChirho.machineChirho,
      `${labelChirho} browser machine attribution`
    );
    assertEqualChirho(
      browserReviewerPlaceholderReChirho.test(browserTrimmedReviewerChirho),
      caseChirho.placeholderChirho,
      `${labelChirho} browser placeholder attribution`
    );
    assertEqualChirho(
      isBlockedCertificationReviewerAttributionChirho(caseChirho.reviewerChirho),
      caseChirho.genericChirho || caseChirho.machineChirho,
      `${labelChirho} blocked certification attribution`
    );
    assertEqualChirho(
      explicitReviewerAttributionErrorChirho(caseChirho.reviewerChirho) === null,
      caseChirho.explicitOkChirho,
      `${labelChirho} explicit reviewer acceptance`
    );
    assertEqualChirho(
      certifyingReviewerAttributionErrorChirho(caseChirho.reviewerChirho) === null,
      caseChirho.certifyingOkChirho,
      `${labelChirho} certifying reviewer acceptance`
    );
  }
  checkExpertConfirmationPolicyAttributionChirho();
  checkLatinSymbolPolicyAttributionChirho();

  console.log(`[${MODULE_CHIRHO}] reviewer attribution invariants passed`);
}

if (import.meta.main) {
  try {
    mainChirho();
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  }
}
