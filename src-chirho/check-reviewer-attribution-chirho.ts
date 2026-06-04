// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify reviewer attribution invariants used by certification-affecting paths.
 *
 * This does not certify text or mutate review state. It prevents future drift
 * between server-side attribution checks and the serialized browser regex.
 */

import {
  certifyingReviewerAttributionErrorChirho,
  explicitReviewerAttributionErrorChirho,
  isBlockedCertificationReviewerAttributionChirho,
  isGenericReviewerAttributionChirho,
  isMachineReviewerAttributionChirho,
  MACHINE_REVIEWER_ID_RE_FLAGS_CHIRHO,
  MACHINE_REVIEWER_ID_RE_SOURCE_CHIRHO,
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
  explicitOkChirho: boolean;
  certifyingOkChirho: boolean;
}

const REVIEWER_ATTRIBUTION_CASES_CHIRHO: ReviewerAttributionCaseChirho[] = [
  {
    reviewerChirho: "",
    genericChirho: true,
    machineChirho: false,
    explicitOkChirho: false,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "human-chirho",
    genericChirho: true,
    machineChirho: false,
    explicitOkChirho: false,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "reviewer-chirho",
    genericChirho: true,
    machineChirho: false,
    explicitOkChirho: false,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "hallelujah-chirho",
    genericChirho: false,
    machineChirho: false,
    explicitOkChirho: true,
    certifyingOkChirho: true,
  },
  {
    reviewerChirho: "dr-brock-human-reviewer",
    genericChirho: false,
    machineChirho: false,
    explicitOkChirho: true,
    certifyingOkChirho: true,
  },
  {
    reviewerChirho: "inhumane-bot-chirho",
    genericChirho: false,
    machineChirho: false,
    explicitOkChirho: true,
    certifyingOkChirho: true,
  },
  {
    reviewerChirho: "codex-gpt5-chirho",
    genericChirho: false,
    machineChirho: true,
    explicitOkChirho: true,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "claude-opus-vision-chirho",
    genericChirho: false,
    machineChirho: true,
    explicitOkChirho: true,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "openai-o3-chirho",
    genericChirho: false,
    machineChirho: true,
    explicitOkChirho: true,
    certifyingOkChirho: false,
  },
  {
    reviewerChirho: "codex-human-chirho",
    genericChirho: false,
    machineChirho: true,
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

function expertPolicyFileChirho(reviewerChirho: string): VisionTierExpertConfirmationFileChirho {
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
        rationaleChirho: "reviewer attribution invariant check",
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
}

function mainChirho(): void {
  const browserMachineReviewerReChirho = new RegExp(
    MACHINE_REVIEWER_ID_RE_SOURCE_CHIRHO,
    MACHINE_REVIEWER_ID_RE_FLAGS_CHIRHO
  );

  for (const caseChirho of REVIEWER_ATTRIBUTION_CASES_CHIRHO) {
    const labelChirho = JSON.stringify(caseChirho.reviewerChirho);
    const browserReviewerChirho = caseChirho.reviewerChirho.trim().toLowerCase();
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
      browserMachineReviewerReChirho.test(browserReviewerChirho),
      caseChirho.machineChirho,
      `${labelChirho} browser machine attribution`
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
