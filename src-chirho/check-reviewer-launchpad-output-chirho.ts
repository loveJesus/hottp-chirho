// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify the generated reviewer launchpad is a read-only projection of
 * status-chirho.json, not a second source of review counts or write behavior.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  assertGeneratedCheckChirho,
  assertGeneratedTextHygieneChirho,
} from "./generated-output-hygiene-chirho.ts";
import {
  REVIEWER_LAUNCHPAD_FILENAME_CHIRHO,
  reviewerLaunchpadHtmlChirho,
  type ReviewerLaunchpadStatusChirho,
} from "./reviewer-launchpad-chirho.ts";

const MODULE_CHIRHO = "check-reviewer-launchpad-output-chirho";
const STATUS_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "certification-status-chirho");
const STATUS_JSON_PATH_CHIRHO = join(STATUS_DIR_CHIRHO, "status-chirho.json");
const LAUNCHPAD_PATH_CHIRHO = join(STATUS_DIR_CHIRHO, REVIEWER_LAUNCHPAD_FILENAME_CHIRHO);
const CRITICAL_REVIEW_START_LINK_KEYS_CHIRHO = [
  "rawHebrewAllChirho",
  "rawHebrewVols35UnvalidatedChirho",
  "rawHebrewVols12UnvalidatedChirho",
  "rawHebrewPartialChirho",
  "latinSymbolAllChirho",
  "latinSymbolFrenchChirho",
  "latinSymbolNonFrenchChirho",
  "latinSymbolSiglumSymbolChirho",
  "latinSymbolNontrivialSymbolChirho",
  "expertAllChirho",
  "expertHebrewChirho",
  "expertGreekChirho",
  "expertSyriacChirho",
  "expertSyriacBlankChirho",
  "expertArabicChirho",
] as const;
const FORBIDDEN_INTERACTIVE_TAG_RE_CHIRHO = /<(?:form|input|button|textarea|select|script)\b/iu;
const REVIEW_HREF_RE_CHIRHO = /href="(http:\/\/localhost:(?:8766|8770|8771)\/[^"]*|status-chirho\.md)"/gu;

function escapeHtmlAttrChirho(valueChirho: string): string {
  return valueChirho
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readStatusChirho(): ReviewerLaunchpadStatusChirho {
  assertGeneratedCheckChirho(existsSync(STATUS_JSON_PATH_CHIRHO), `${STATUS_JSON_PATH_CHIRHO} is missing`);
  return JSON.parse(readFileSync(STATUS_JSON_PATH_CHIRHO, "utf8")) as ReviewerLaunchpadStatusChirho;
}

function hrefsChirho(htmlChirho: string): string[] {
  return [...htmlChirho.matchAll(REVIEW_HREF_RE_CHIRHO)].map((matchChirho) => matchChirho[1]!);
}

function mainChirho(): void {
  const statusChirho = readStatusChirho();
  assertGeneratedCheckChirho(existsSync(LAUNCHPAD_PATH_CHIRHO), `${LAUNCHPAD_PATH_CHIRHO} is missing`);
  const actualHtmlChirho = readFileSync(LAUNCHPAD_PATH_CHIRHO, "utf8");
  const expectedHtmlChirho = reviewerLaunchpadHtmlChirho(statusChirho);
  assertGeneratedCheckChirho(
    actualHtmlChirho === expectedHtmlChirho,
    `${LAUNCHPAD_PATH_CHIRHO} does not match regenerated status projection`
  );
  assertGeneratedTextHygieneChirho(LAUNCHPAD_PATH_CHIRHO, actualHtmlChirho);
  assertGeneratedCheckChirho(
    !FORBIDDEN_INTERACTIVE_TAG_RE_CHIRHO.test(actualHtmlChirho),
    `${LAUNCHPAD_PATH_CHIRHO} must stay a read-only launchpad without form controls or scripts`
  );
  assertGeneratedCheckChirho(
    actualHtmlChirho.includes('href="status-chirho.md"'),
    `${LAUNCHPAD_PATH_CHIRHO} does not link the certification status report`
  );
  for (const keyChirho of CRITICAL_REVIEW_START_LINK_KEYS_CHIRHO) {
    const linkChirho = statusChirho.reviewStartLinksChirho?.[keyChirho];
    if (typeof linkChirho !== "string" || linkChirho.length === 0) continue;
    assertGeneratedCheckChirho(
      actualHtmlChirho.includes(`href="${escapeHtmlAttrChirho(linkChirho)}"`),
      `${LAUNCHPAD_PATH_CHIRHO} is missing first-pending link ${keyChirho}`
    );
  }
  for (const hrefChirho of hrefsChirho(actualHtmlChirho)) {
    const urlChirho = hrefChirho.startsWith("http://") ? new URL(hrefChirho) : null;
    assertGeneratedCheckChirho(
      urlChirho === null || ["8766", "8770", "8771"].includes(urlChirho.port),
      `${LAUNCHPAD_PATH_CHIRHO} links an unexpected review port: ${hrefChirho}`
    );
  }
  console.log(`[${MODULE_CHIRHO}] ok ${LAUNCHPAD_PATH_CHIRHO}`);
}

mainChirho();
