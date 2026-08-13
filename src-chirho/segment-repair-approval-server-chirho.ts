// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Segment repair approval station (reviewer UX v2 Phase 4).
 * Workflow doc: spec-chirho/workflows-chirho/segment-repair-apply-lane-chirho.md
 *
 * Lists draft segment repair proposals with the target crop, full line, old
 * spans, proposed spans, and exact geometry side by side. A human reviewer
 * approves or rejects drafts (server-authoritative attribution; approval
 * never certifies text), and applies approved proposals through the
 * fail-closed engine in segment-repair-apply-chirho.ts.
 *
 * Local run (equals-syntax flags only):
 *   bun run segment-repair-approval-chirho -- --reviewer=<your-name> [--port=8772]
 * Scratch smoke:
 *   ... --segment-repair-proposals-chirho=<scratch.json> --db=<scratch.sqlite>
 *       --spans-dir-chirho=<dir> --scanlines-dir-chirho=<dir> --backup-root-chirho=<dir>
 */

import { Database } from "bun:sqlite";
import { existsSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { writePassCHumanValidationBackupChirho } from "./pass-c-human-validation-backup-chirho.ts";
import {
  reviewServerNoStoreHeadersChirho,
  reviewServerSourceStaleErrorChirho,
  reviewServerStartupHealthChirho,
} from "./review-server-health-chirho.ts";
import { certifyingReviewerAttributionErrorChirho } from "./reviewer-attribution-chirho.ts";
import {
  applySegmentRepairProposalChirho,
  segmentRepairLiveStateChirho,
  scanlineImagePathForLineChirho,
  DEFAULT_APPLY_BACKUP_ROOT_CHIRHO,
  DEFAULT_SCANLINES_ROOT_CHIRHO,
  DEFAULT_SPANS_ROOT_CHIRHO,
} from "./segment-repair-apply-chirho.ts";
import {
  loadSegmentRepairProposalStoreChirho,
  updateSegmentRepairProposalChirho,
  SEGMENT_REPAIR_KIND_LABELS_CHIRHO,
  SEGMENT_REPAIR_SCRIPT_LABELS_CHIRHO,
  SEGMENT_REPAIR_PROPOSAL_STATUS_APPLIED_CHIRHO,
  SEGMENT_REPAIR_PROPOSAL_STATUS_APPROVED_CHIRHO,
  SEGMENT_REPAIR_PROPOSAL_STATUS_DRAFT_CHIRHO,
  SEGMENT_REPAIR_PROPOSAL_STATUS_REJECTED_CHIRHO,
  SEGMENT_REPAIR_PROPOSAL_STATUS_REVERTED_CHIRHO,
  type SegmentRepairProposalRecordChirho,
  type SegmentRepairProposalSpanChirho,
  type SegmentRepairProposalStatusChirho,
} from "./segment-repair-proposals-chirho.ts";
import { reviewNotesLookPlaceholderChirho } from "./template-placeholder-chirho.ts";
import { trustedReviewerIdentityChirho } from "./trusted-reviewer-identity-chirho.ts";

const MODULE_CHIRHO = "segment-repair-approval-server-chirho";
const SERVER_HEALTH_CHIRHO = reviewServerStartupHealthChirho("segment-repair-approval-chirho");
const DEFAULT_PORT_CHIRHO = 8772;
const DEFAULT_DB_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite");
const DEFAULT_SEGMENT_REPAIR_PROPOSALS_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "segment-repair-proposals-2026-07-02-chirho.json"
);

const STATUS_DISPLAY_LABELS_CHIRHO: Record<SegmentRepairProposalStatusChirho, string> = {
  "draft-chirho": "Draft",
  "approved-chirho": "Approved",
  "rejected-chirho": "Rejected",
  "applied-chirho": "Applied",
  "reverted-chirho": "Reverted",
};

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function positivePortChirho(valueChirho: string | undefined): number {
  if (valueChirho === undefined) return DEFAULT_PORT_CHIRHO;
  const portChirho = Number.parseInt(valueChirho, 10);
  if (!Number.isInteger(portChirho) || portChirho <= 0 || portChirho > 65535) {
    throw new Error(`--port must be a valid TCP port; got ${valueChirho}`);
  }
  return portChirho;
}

const argsChirho = process.argv.slice(2);
const portChirho = positivePortChirho(parseArgValueChirho(argsChirho, "port"));
const dbPathChirho = parseArgValueChirho(argsChirho, "db") ?? DEFAULT_DB_PATH_CHIRHO;
const dbBackupPathChirho = parseArgValueChirho(argsChirho, "db-backup-chirho");
const storePathChirho =
  parseArgValueChirho(argsChirho, "segment-repair-proposals-chirho") ?? DEFAULT_SEGMENT_REPAIR_PROPOSALS_PATH_CHIRHO;
const spansRootChirho = parseArgValueChirho(argsChirho, "spans-dir-chirho") ?? DEFAULT_SPANS_ROOT_CHIRHO;
const scanlinesRootChirho = parseArgValueChirho(argsChirho, "scanlines-dir-chirho") ?? DEFAULT_SCANLINES_ROOT_CHIRHO;
const backupRootChirho = parseArgValueChirho(argsChirho, "backup-root-chirho") ?? DEFAULT_APPLY_BACKUP_ROOT_CHIRHO;
const reviewerChirho = parseArgValueChirho(argsChirho, "reviewer")?.trim() ?? "";
const dbChirho = new Database(dbPathChirho);

if (!existsSync(storePathChirho)) {
  throw new Error(`segment repair proposal store not found: ${storePathChirho}`);
}
loadSegmentRepairProposalStoreChirho(storePathChirho);

interface EnrichedProposalChirho {
  proposalChirho: SegmentRepairProposalRecordChirho;
  applyRefusalChirho: string | null;
}

function enrichedProposalsChirho(): EnrichedProposalChirho[] {
  const storeChirho = loadSegmentRepairProposalStoreChirho(storePathChirho);
  return storeChirho.proposalsChirho.map((proposalChirho) => {
    const needsReadinessChirho =
      proposalChirho.statusChirho === SEGMENT_REPAIR_PROPOSAL_STATUS_DRAFT_CHIRHO ||
      proposalChirho.statusChirho === SEGMENT_REPAIR_PROPOSAL_STATUS_APPROVED_CHIRHO;
    if (!needsReadinessChirho) return { proposalChirho, applyRefusalChirho: null };
    const liveStateChirho = segmentRepairLiveStateChirho(proposalChirho, spansRootChirho, scanlinesRootChirho);
    return { proposalChirho, applyRefusalChirho: liveStateChirho.refusalChirho };
  });
}

function proposalByIdChirho(proposalIdChirho: string): SegmentRepairProposalRecordChirho | null {
  const storeChirho = loadSegmentRepairProposalStoreChirho(storePathChirho);
  return (
    storeChirho.proposalsChirho.find((proposalChirho) => proposalChirho.proposalIdChirho === proposalIdChirho) ?? null
  );
}

function htmlEscapeChirho(valueChirho: string): string {
  return valueChirho
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Display-only strip: stored identifiers keep their wire form; reviewer-facing
// prose shows them without the internal suffix.
function displayIdentifierChirho(identifierChirho: string): string {
  return identifierChirho.replace(/-chirho\b/g, "");
}

function scriptDisplayLabelChirho(scriptChirho: SegmentRepairProposalSpanChirho["scriptChirho"]): string {
  return SEGMENT_REPAIR_SCRIPT_LABELS_CHIRHO[scriptChirho] ?? String(scriptChirho).replace(/-chirho$/, "");
}

function spanChangedChirho(
  proposalChirho: SegmentRepairProposalRecordChirho,
  sideChirho: "old" | "proposed",
  indexChirho: number
): boolean {
  const oldSpanChirho = proposalChirho.oldSpansChirho[indexChirho];
  const proposedSpanChirho = proposalChirho.proposedSpansChirho[indexChirho];
  if (oldSpanChirho === undefined || proposedSpanChirho === undefined) return true;
  return (
    oldSpanChirho.xMinPxChirho !== proposedSpanChirho.xMinPxChirho ||
    oldSpanChirho.widthPxChirho !== proposedSpanChirho.widthPxChirho ||
    oldSpanChirho.scriptChirho !== proposedSpanChirho.scriptChirho ||
    oldSpanChirho.utf8TextChirho !== proposedSpanChirho.utf8TextChirho
  );
}

function spanTableHtmlChirho(
  proposalChirho: SegmentRepairProposalRecordChirho,
  sideChirho: "old" | "proposed"
): string {
  const spansChirho = sideChirho === "old" ? proposalChirho.oldSpansChirho : proposalChirho.proposedSpansChirho;
  const rowsChirho = spansChirho
    .map((spanChirho, indexChirho) => {
      const changedClassChirho = spanChangedChirho(proposalChirho, sideChirho, indexChirho)
        ? ' class="span-row-changed-chirho"'
        : "";
      return (
        `<tr${changedClassChirho}><td>${spanChirho.segmentIndexChirho}</td>` +
        `<td>${spanChirho.xMinPxChirho}</td><td>${spanChirho.widthPxChirho}</td>` +
        `<td>${htmlEscapeChirho(scriptDisplayLabelChirho(spanChirho.scriptChirho))}</td>` +
        `<td dir="auto">${htmlEscapeChirho(spanChirho.utf8TextChirho)}</td></tr>`
      );
    })
    .join("");
  return (
    `<table class="span-table-chirho"><thead><tr>` +
    `<th>#</th><th>x&nbsp;px</th><th>width&nbsp;px</th><th>Script</th><th>Text</th>` +
    `</tr></thead><tbody>${rowsChirho}</tbody></table>`
  );
}

function overlayBoxesHtmlChirho(
  proposalChirho: SegmentRepairProposalRecordChirho,
  spansChirho: SegmentRepairProposalSpanChirho[],
  boxClassChirho: string
): string {
  return spansChirho
    .map((spanChirho, indexChirho) => {
      const leftPctChirho = (spanChirho.xMinPxChirho / proposalChirho.lineWidthPxChirho) * 100;
      const widthPctChirho = (spanChirho.widthPxChirho / proposalChirho.lineWidthPxChirho) * 100;
      const targetClassChirho =
        boxClassChirho === "old-box-chirho" && indexChirho === proposalChirho.targetSegmentIndexChirho
          ? " target-box-chirho"
          : "";
      return (
        `<div class="overlay-box-chirho ${boxClassChirho}${targetClassChirho}" ` +
        `style="left:${leftPctChirho.toFixed(3)}%;width:${widthPctChirho.toFixed(3)}%;" ` +
        `title="#${spanChirho.segmentIndexChirho} ${htmlEscapeChirho(scriptDisplayLabelChirho(spanChirho.scriptChirho))}"></div>`
      );
    })
    .join("");
}

function lineImageRowHtmlChirho(
  proposalChirho: SegmentRepairProposalRecordChirho,
  labelChirho: string,
  spansChirho: SegmentRepairProposalSpanChirho[],
  boxClassChirho: string,
  imageAvailableChirho: boolean
): string {
  if (!imageAvailableChirho) {
    return `<div class="image-row-chirho"><span class="image-label-chirho">${htmlEscapeChirho(labelChirho)}</span><span class="image-missing-chirho">Line image unavailable</span></div>`;
  }
  const imageUrlChirho = `/line-image-chirho/${encodeURIComponent(proposalChirho.proposalIdChirho)}`;
  return (
    `<div class="image-row-chirho"><span class="image-label-chirho">${htmlEscapeChirho(labelChirho)}</span>` +
    `<div class="image-wrap-chirho"><img src="${imageUrlChirho}" alt="${htmlEscapeChirho(labelChirho)} scan of line ${proposalChirho.lineIndexChirho}">` +
    overlayBoxesHtmlChirho(proposalChirho, spansChirho, boxClassChirho) +
    `</div></div>`
  );
}

function decisionHistoryHtmlChirho(proposalChirho: SegmentRepairProposalRecordChirho): string {
  const partsChirho: string[] = [];
  if (proposalChirho.decidedAtChirho !== undefined) {
    const decisionLabelChirho =
      proposalChirho.statusChirho === SEGMENT_REPAIR_PROPOSAL_STATUS_REJECTED_CHIRHO ? "Rejected" : "Approved";
    partsChirho.push(
      `<p class="history-chirho">${decisionLabelChirho} by <strong>${htmlEscapeChirho(displayIdentifierChirho(proposalChirho.decidedByChirho ?? ""))}</strong>` +
        ` on ${htmlEscapeChirho(proposalChirho.decidedAtChirho)} — ` +
        `${htmlEscapeChirho(proposalChirho.decisionRationaleChirho ?? "")}</p>`
    );
  }
  if (proposalChirho.appliedAtChirho !== undefined) {
    partsChirho.push(
      `<p class="history-chirho">Applied by <strong>${htmlEscapeChirho(displayIdentifierChirho(proposalChirho.appliedByChirho ?? ""))}</strong>` +
        ` on ${htmlEscapeChirho(proposalChirho.appliedAtChirho)}. Backup: ` +
        `<code>${htmlEscapeChirho(proposalChirho.applyBackupDirChirho ?? "")}</code>. ` +
        `Reverse path: the backup folder's manifest documents the exact revert command.</p>`
    );
  }
  if (proposalChirho.revertedAtChirho !== undefined) {
    partsChirho.push(
      `<p class="history-chirho">Reverted by <strong>${htmlEscapeChirho(displayIdentifierChirho(proposalChirho.revertedByChirho ?? ""))}</strong>` +
        ` on ${htmlEscapeChirho(proposalChirho.revertedAtChirho)} — ` +
        `${htmlEscapeChirho(proposalChirho.revertRationaleChirho ?? "")}</p>`
    );
  }
  return partsChirho.join("");
}

function actionsHtmlChirho(enrichedChirho: EnrichedProposalChirho): string {
  const proposalChirho = enrichedChirho.proposalChirho;
  const readyChirho = enrichedChirho.applyRefusalChirho === null;
  const readinessChirho = readyChirho
    ? '<p class="readiness-ok-chirho">Apply readiness: the live line still matches this proposal’s before-state.</p>'
    : `<p class="readiness-blocked-chirho">Apply blocked: ${htmlEscapeChirho(enrichedChirho.applyRefusalChirho ?? "")}</p>`;
  if (proposalChirho.statusChirho === SEGMENT_REPAIR_PROPOSAL_STATUS_DRAFT_CHIRHO) {
    return (
      readinessChirho +
      `<div class="actions-chirho">` +
      `<label>Decision rationale (required)<textarea class="decision-rationale-chirho" rows="2" ` +
      `placeholder="Why this repair is right (or wrong) against the print"></textarea></label>` +
      `<button class="approve-button-chirho" data-proposal-chirho="${htmlEscapeChirho(proposalChirho.proposalIdChirho)}">Approve</button>` +
      `<button class="reject-button-chirho" data-proposal-chirho="${htmlEscapeChirho(proposalChirho.proposalIdChirho)}">Reject</button>` +
      `<p class="action-note-chirho">Approval records a decision only; the data changes when an approved proposal is applied.</p>` +
      `</div>`
    );
  }
  if (proposalChirho.statusChirho === SEGMENT_REPAIR_PROPOSAL_STATUS_APPROVED_CHIRHO) {
    const disabledChirho = readyChirho ? "" : " disabled";
    return (
      readinessChirho +
      `<div class="actions-chirho">` +
      `<button class="apply-button-chirho" data-proposal-chirho="${htmlEscapeChirho(proposalChirho.proposalIdChirho)}"${disabledChirho}>Apply to live data</button>` +
      `<p class="action-note-chirho">Apply writes a backup first, invalidates touched validations, then rewrites the line atomically.</p>` +
      `</div>`
    );
  }
  return "";
}

function proposalCardHtmlChirho(enrichedChirho: EnrichedProposalChirho): string {
  const proposalChirho = enrichedChirho.proposalChirho;
  const imageAvailableChirho = existsSync(
    scanlineImagePathForLineChirho(
      proposalChirho.volumeChirho,
      proposalChirho.pageChirho,
      proposalChirho.lineIndexChirho,
      scanlinesRootChirho
    )
  );
  const kindLabelChirho = SEGMENT_REPAIR_KIND_LABELS_CHIRHO[proposalChirho.repairKindChirho] ?? proposalChirho.repairKindChirho;
  return (
    `<article class="proposal-card-chirho" data-proposal-id-chirho="${htmlEscapeChirho(proposalChirho.proposalIdChirho)}" ` +
    `data-status-chirho="${htmlEscapeChirho(proposalChirho.statusChirho)}" ` +
    `data-line-image-hash-chirho="${htmlEscapeChirho(proposalChirho.lineImageHashChirho)}" ` +
    `data-proposed-span-count-chirho="${proposalChirho.proposedSpansChirho.length}">` +
    `<header><span class="status-chip-chirho status-${htmlEscapeChirho(proposalChirho.statusChirho)}">` +
    `${STATUS_DISPLAY_LABELS_CHIRHO[proposalChirho.statusChirho]}</span> ` +
    `<strong>${htmlEscapeChirho(kindLabelChirho)}</strong> — item ${htmlEscapeChirho(proposalChirho.itemKeyChirho)} ` +
    `<span class="proposal-id-chirho">${htmlEscapeChirho(displayIdentifierChirho(proposalChirho.proposalIdChirho))}</span></header>` +
    `<p class="meta-chirho">Drafted by ${htmlEscapeChirho(displayIdentifierChirho(proposalChirho.reviewerChirho))} on ${htmlEscapeChirho(proposalChirho.createdAtChirho)}</p>` +
    `<p class="rationale-chirho" dir="auto">${htmlEscapeChirho(proposalChirho.rationaleChirho)}</p>` +
    lineImageRowHtmlChirho(proposalChirho, "Current boxes", proposalChirho.oldSpansChirho, "old-box-chirho", imageAvailableChirho) +
    lineImageRowHtmlChirho(proposalChirho, "Proposed boxes", proposalChirho.proposedSpansChirho, "proposed-box-chirho", imageAvailableChirho) +
    `<div class="line-texts-chirho">` +
    `<p><span class="text-label-chirho">Line text now:</span> <span dir="auto">${htmlEscapeChirho(proposalChirho.lineTextBeforeChirho)}</span></p>` +
    `<p><span class="text-label-chirho">Line text after apply:</span> <span dir="auto">${htmlEscapeChirho(proposalChirho.lineTextPreviewChirho)}</span></p>` +
    `</div>` +
    `<div class="span-tables-chirho">` +
    `<div><h4>Current spans</h4>${spanTableHtmlChirho(proposalChirho, "old")}</div>` +
    `<div><h4>Proposed spans</h4>${spanTableHtmlChirho(proposalChirho, "proposed")}</div>` +
    `</div>` +
    decisionHistoryHtmlChirho(proposalChirho) +
    actionsHtmlChirho(enrichedChirho) +
    `</article>`
  );
}

const PAGE_SECTION_ORDER_CHIRHO: Array<{ statusChirho: SegmentRepairProposalStatusChirho; titleChirho: string }> = [
  { statusChirho: SEGMENT_REPAIR_PROPOSAL_STATUS_DRAFT_CHIRHO, titleChirho: "Awaiting decision" },
  { statusChirho: SEGMENT_REPAIR_PROPOSAL_STATUS_APPROVED_CHIRHO, titleChirho: "Approved — ready to apply" },
  { statusChirho: SEGMENT_REPAIR_PROPOSAL_STATUS_APPLIED_CHIRHO, titleChirho: "Applied" },
  { statusChirho: SEGMENT_REPAIR_PROPOSAL_STATUS_REJECTED_CHIRHO, titleChirho: "Rejected" },
  { statusChirho: SEGMENT_REPAIR_PROPOSAL_STATUS_REVERTED_CHIRHO, titleChirho: "Reverted" },
];

function pageHtmlChirho(): string {
  const enrichedListChirho = enrichedProposalsChirho();
  const sectionsChirho = PAGE_SECTION_ORDER_CHIRHO.map((sectionChirho) => {
    const cardsChirho = enrichedListChirho.filter(
      (enrichedChirho) => enrichedChirho.proposalChirho.statusChirho === sectionChirho.statusChirho
    );
    if (cardsChirho.length === 0) return "";
    return (
      `<section><h2>${sectionChirho.titleChirho} <span class="count-chirho">${cardsChirho.length}</span></h2>` +
      cardsChirho.map(proposalCardHtmlChirho).join("") +
      `</section>`
    );
  }).join("");
  const reviewerLineChirho = reviewerChirho.length > 0
    ? `Local reviewer identity: <strong>${htmlEscapeChirho(reviewerChirho)}</strong> (production uses the authenticated sign-in name)`
    : "No local reviewer set; production attribution comes from the authenticated sign-in name";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Segment Repair Approval</title>
<style>
  body { font-family: -apple-system, "Segoe UI", sans-serif; margin: 0; background: #f4f2ec; color: #222; }
  main { max-width: 1180px; margin: 0 auto; padding: 16px; }
  h1 { font-size: 1.35rem; margin: 8px 0 2px; }
  h2 { font-size: 1.05rem; border-bottom: 2px solid #c8c2b2; padding-bottom: 4px; margin-top: 28px; }
  .count-chirho { background: #7a6f52; color: #fff; border-radius: 10px; padding: 1px 9px; font-size: .85rem; }
  .subtitle-chirho { color: #5a543f; margin: 0 0 4px; font-size: .92rem; }
  .proposal-card-chirho { background: #fff; border: 1px solid #d8d2c0; border-radius: 8px; padding: 12px 16px; margin: 14px 0; }
  .proposal-card-chirho header { font-size: 1rem; margin-bottom: 4px; }
  .proposal-id-chirho { color: #8a8268; font-size: .78rem; margin-left: 8px; }
  .status-chip-chirho { display: inline-block; border-radius: 4px; padding: 1px 8px; font-size: .8rem; color: #fff; margin-right: 6px; }
  .status-draft-chirho { background: #9a6700; }
  .status-approved-chirho { background: #1a7f37; }
  .status-rejected-chirho { background: #80301f; }
  .status-applied-chirho { background: #0a5f8a; }
  .status-reverted-chirho { background: #5f5f5f; }
  .meta-chirho { color: #6a6350; font-size: .85rem; margin: 2px 0; }
  .rationale-chirho { background: #faf7ee; border-left: 3px solid #b7ad8e; padding: 6px 10px; margin: 8px 0; }
  .image-row-chirho { display: flex; align-items: center; gap: 10px; margin: 6px 0; }
  .image-label-chirho { flex: 0 0 120px; font-size: .8rem; color: #574f38; text-align: right; }
  .image-missing-chirho { color: #935410; font-size: .85rem; }
  .image-wrap-chirho { position: relative; flex: 1; }
  .image-wrap-chirho img { width: 100%; display: block; image-rendering: -webkit-optimize-contrast; }
  .overlay-box-chirho { position: absolute; top: 0; bottom: 0; box-sizing: border-box; pointer-events: none; }
  .old-box-chirho { border: 2px solid rgba(200, 30, 30, .85); }
  .old-box-chirho.target-box-chirho { background: rgba(200, 30, 30, .12); }
  .proposed-box-chirho { border: 2px dashed rgba(20, 140, 60, .9); }
  .line-texts-chirho { font-size: .92rem; margin: 8px 0; }
  .text-label-chirho { color: #574f38; font-size: .8rem; }
  .span-tables-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .span-tables-chirho h4 { margin: 6px 0 4px; font-size: .85rem; color: #574f38; }
  .span-table-chirho { border-collapse: collapse; width: 100%; font-size: .85rem; }
  .span-table-chirho th, .span-table-chirho td { border: 1px solid #ddd6c4; padding: 3px 7px; text-align: left; }
  .span-row-changed-chirho { background: #fdf3d7; }
  .history-chirho { background: #eef4f8; border-left: 3px solid #7fa8c2; padding: 6px 10px; font-size: .88rem; }
  .readiness-ok-chirho { color: #1a6f37; font-size: .88rem; }
  .readiness-blocked-chirho { color: #92321d; font-size: .88rem; font-weight: 600; }
  .actions-chirho { margin-top: 8px; }
  .actions-chirho label { display: block; font-size: .85rem; color: #574f38; margin-bottom: 6px; }
  .decision-rationale-chirho { width: 100%; box-sizing: border-box; font: inherit; padding: 6px; border: 1px solid #c8c2b2; border-radius: 5px; margin-top: 3px; }
  .actions-chirho button { font: inherit; padding: 6px 18px; border-radius: 6px; border: 1px solid #7a6f52; cursor: pointer; margin-right: 10px; }
  .approve-button-chirho { background: #1a7f37; color: #fff; border-color: #14632b; }
  .reject-button-chirho { background: #fff; color: #80301f; border-color: #80301f; }
  .apply-button-chirho { background: #0a5f8a; color: #fff; border-color: #084c6e; }
  .apply-button-chirho[disabled] { background: #9db4c0; border-color: #9db4c0; cursor: not-allowed; }
  .action-note-chirho { color: #6a6350; font-size: .8rem; margin-top: 6px; }
  .error-banner-chirho { position: sticky; top: 0; background: #80301f; color: #fff; padding: 8px 14px; display: none; z-index: 5; }
  .empty-chirho { color: #6a6350; margin-top: 24px; }
</style>
</head>
<body>
<div class="error-banner-chirho" id="error-banner-chirho"></div>
<main>
<h1>Segment Repair Approval</h1>
<p class="subtitle-chirho">${reviewerLineChirho}</p>
<p class="subtitle-chirho">Compare the red current boxes with the green proposed boxes against the scan before deciding. Approving never certifies text; applying an approved repair rewrites the line with a backup and re-opens touched reviews.</p>
${sectionsChirho.length > 0 ? sectionsChirho : '<p class="empty-chirho">No repair proposals in the store.</p>'}
</main>
<script>
(function () {
  "use strict";
  var bannerChirho = document.getElementById("error-banner-chirho");
  function showErrorChirho(messageChirho) {
    bannerChirho.textContent = messageChirho;
    bannerChirho.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function postActionChirho(pathChirho, cardChirho, rationaleChirho) {
    var payloadChirho = {
      proposalIdChirho: cardChirho.dataset.proposalIdChirho,
      expectedStatusChirho: cardChirho.dataset.statusChirho,
      expectedLineImageHashChirho: cardChirho.dataset.lineImageHashChirho,
      expectedProposedSpanCountChirho: Number(cardChirho.dataset.proposedSpanCountChirho),
      rationaleChirho: rationaleChirho
    };
    fetch(pathChirho, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadChirho)
    }).then(function (responseChirho) {
      return responseChirho.json().then(function (dataChirho) {
        if (!responseChirho.ok || dataChirho.okChirho !== true) {
          throw new Error(dataChirho.errorChirho || ("request failed with status " + responseChirho.status));
        }
        window.location.reload();
      });
    }).catch(function (errorChirho) {
      showErrorChirho(errorChirho.message);
    });
  }
  document.addEventListener("click", function (eventChirho) {
    var buttonChirho = eventChirho.target.closest("button");
    if (!buttonChirho || buttonChirho.disabled) return;
    var cardChirho = buttonChirho.closest(".proposal-card-chirho");
    if (!cardChirho) return;
    var rationaleFieldChirho = cardChirho.querySelector(".decision-rationale-chirho");
    var rationaleChirho = rationaleFieldChirho ? rationaleFieldChirho.value.trim() : "";
    if (buttonChirho.classList.contains("approve-button-chirho")) {
      postActionChirho("/api-chirho/approve-chirho", cardChirho, rationaleChirho);
    } else if (buttonChirho.classList.contains("reject-button-chirho")) {
      postActionChirho("/api-chirho/reject-chirho", cardChirho, rationaleChirho);
    } else if (buttonChirho.classList.contains("apply-button-chirho")) {
      if (!window.confirm("Apply this approved repair to the live data now? A backup is written first.")) return;
      postActionChirho("/api-chirho/apply-chirho", cardChirho, rationaleChirho);
    }
  });
})();
</script>
</body>
</html>`;
}

function jsonResponseChirho(dataChirho: unknown, statusChirho = 200): Response {
  return new Response(JSON.stringify(dataChirho), {
    status: statusChirho,
    headers: reviewServerNoStoreHeadersChirho("application/json; charset=utf-8"),
  });
}

function staleReviewServerWriteResponseChirho(): Response | null {
  const staleErrorChirho = reviewServerSourceStaleErrorChirho(SERVER_HEALTH_CHIRHO);
  return staleErrorChirho === null ? null : jsonResponseChirho({ okChirho: false, errorChirho: staleErrorChirho }, 409);
}

interface ApprovalActionRequestChirho {
  proposalIdChirho?: unknown;
  rationaleChirho?: unknown;
  expectedStatusChirho?: unknown;
  expectedLineImageHashChirho?: unknown;
  expectedProposedSpanCountChirho?: unknown;
}

interface ValidatedActionChirho {
  proposalChirho: SegmentRepairProposalRecordChirho;
  effectiveReviewerChirho: string;
  rationaleChirho: string;
}

function validatedActionChirho(
  reqChirho: Request,
  bodyChirho: ApprovalActionRequestChirho,
  expectedStatusChirho: SegmentRepairProposalStatusChirho,
  rationaleRequiredChirho: boolean
): ValidatedActionChirho | Response {
  if (typeof bodyChirho.proposalIdChirho !== "string" || bodyChirho.proposalIdChirho.length === 0) {
    return jsonResponseChirho({ okChirho: false, errorChirho: "proposalIdChirho is required" }, 400);
  }
  const proposalChirho = proposalByIdChirho(bodyChirho.proposalIdChirho);
  if (proposalChirho === null) {
    return jsonResponseChirho({ okChirho: false, errorChirho: "unknown proposal id" }, 404);
  }
  if (bodyChirho.expectedStatusChirho !== expectedStatusChirho || proposalChirho.statusChirho !== expectedStatusChirho) {
    return jsonResponseChirho(
      {
        okChirho: false,
        errorChirho: `proposal is ${proposalChirho.statusChirho}; this action expects ${expectedStatusChirho}; reload the queue`,
      },
      409
    );
  }
  if (bodyChirho.expectedLineImageHashChirho !== proposalChirho.lineImageHashChirho) {
    return jsonResponseChirho(
      { okChirho: false, errorChirho: "expectedLineImageHashChirho no longer matches this proposal; reload the queue" },
      409
    );
  }
  if (bodyChirho.expectedProposedSpanCountChirho !== proposalChirho.proposedSpansChirho.length) {
    return jsonResponseChirho(
      { okChirho: false, errorChirho: "expectedProposedSpanCountChirho no longer matches this proposal; reload the queue" },
      409
    );
  }
  const effectiveReviewerChirho = trustedReviewerIdentityChirho(reqChirho.headers, reviewerChirho);
  if (effectiveReviewerChirho.length === 0) {
    return jsonResponseChirho({ okChirho: false, errorChirho: "reviewerChirho is required" }, 400);
  }
  const reviewerErrorChirho = certifyingReviewerAttributionErrorChirho(effectiveReviewerChirho);
  if (reviewerErrorChirho !== null) {
    return jsonResponseChirho({ okChirho: false, errorChirho: reviewerErrorChirho }, 400);
  }
  const rationaleChirho = typeof bodyChirho.rationaleChirho === "string" ? bodyChirho.rationaleChirho.trim() : "";
  if (rationaleRequiredChirho) {
    if (rationaleChirho.length === 0) {
      return jsonResponseChirho({ okChirho: false, errorChirho: "rationaleChirho is required for this decision" }, 400);
    }
    if (reviewNotesLookPlaceholderChirho(rationaleChirho)) {
      return jsonResponseChirho(
        { okChirho: false, errorChirho: "rationaleChirho must explain the decision, not a template placeholder" },
        400
      );
    }
  }
  return { proposalChirho, effectiveReviewerChirho, rationaleChirho };
}

function decideProposalChirho(
  actionChirho: ValidatedActionChirho,
  nextStatusChirho: SegmentRepairProposalStatusChirho
): SegmentRepairProposalRecordChirho {
  return updateSegmentRepairProposalChirho(
    storePathChirho,
    actionChirho.proposalChirho.proposalIdChirho,
    `decide-${actionChirho.proposalChirho.proposalIdChirho}`,
    (currentChirho) => ({
      ...currentChirho,
      statusChirho: nextStatusChirho,
      decidedAtChirho: new Date().toISOString(),
      decidedByChirho: actionChirho.effectiveReviewerChirho,
      decisionRationaleChirho: actionChirho.rationaleChirho,
    })
  );
}

const serverChirho = Bun.serve({
  port: portChirho,
  hostname: "127.0.0.1",
  async fetch(reqChirho: Request) {
    const urlChirho = new URL(reqChirho.url);
    if (urlChirho.pathname === "/") {
      return new Response(pageHtmlChirho(), { headers: reviewServerNoStoreHeadersChirho("text/html; charset=utf-8") });
    }
    if (urlChirho.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }
    if (urlChirho.pathname === "/api-chirho/server-health-chirho") {
      return jsonResponseChirho(SERVER_HEALTH_CHIRHO);
    }
    if (urlChirho.pathname === "/api-chirho/proposals-chirho") {
      return jsonResponseChirho({
        okChirho: true,
        proposalsChirho: enrichedProposalsChirho().map((enrichedChirho) => ({
          ...enrichedChirho.proposalChirho,
          applyRefusalChirho: enrichedChirho.applyRefusalChirho,
        })),
      });
    }
    if (urlChirho.pathname.startsWith("/line-image-chirho/")) {
      const proposalIdChirho = decodeURIComponent(urlChirho.pathname.slice("/line-image-chirho/".length));
      const proposalChirho = proposalByIdChirho(proposalIdChirho);
      if (proposalChirho === null) return new Response("not found", { status: 404 });
      const imagePathChirho = scanlineImagePathForLineChirho(
        proposalChirho.volumeChirho,
        proposalChirho.pageChirho,
        proposalChirho.lineIndexChirho,
        scanlinesRootChirho
      );
      if (!existsSync(imagePathChirho)) return new Response("not found", { status: 404 });
      return new Response(Bun.file(imagePathChirho), {
        headers: reviewServerNoStoreHeadersChirho("image/png"),
      });
    }
    if (reqChirho.method === "POST") {
      const staleServerResponseChirho = staleReviewServerWriteResponseChirho();
      if (staleServerResponseChirho !== null) return staleServerResponseChirho;
      let bodyChirho: ApprovalActionRequestChirho;
      try {
        bodyChirho = (await reqChirho.json()) as ApprovalActionRequestChirho;
      } catch {
        return jsonResponseChirho({ okChirho: false, errorChirho: "request body must be JSON" }, 400);
      }
      if (urlChirho.pathname === "/api-chirho/approve-chirho") {
        const actionChirho = validatedActionChirho(reqChirho, bodyChirho, SEGMENT_REPAIR_PROPOSAL_STATUS_DRAFT_CHIRHO, true);
        if (actionChirho instanceof Response) return actionChirho;
        const updatedChirho = decideProposalChirho(actionChirho, SEGMENT_REPAIR_PROPOSAL_STATUS_APPROVED_CHIRHO);
        return jsonResponseChirho({ okChirho: true, proposalChirho: updatedChirho });
      }
      if (urlChirho.pathname === "/api-chirho/reject-chirho") {
        const actionChirho = validatedActionChirho(reqChirho, bodyChirho, SEGMENT_REPAIR_PROPOSAL_STATUS_DRAFT_CHIRHO, true);
        if (actionChirho instanceof Response) return actionChirho;
        const updatedChirho = decideProposalChirho(actionChirho, SEGMENT_REPAIR_PROPOSAL_STATUS_REJECTED_CHIRHO);
        return jsonResponseChirho({ okChirho: true, proposalChirho: updatedChirho });
      }
      if (urlChirho.pathname === "/api-chirho/apply-chirho") {
        const actionChirho = validatedActionChirho(
          reqChirho,
          bodyChirho,
          SEGMENT_REPAIR_PROPOSAL_STATUS_APPROVED_CHIRHO,
          false
        );
        if (actionChirho instanceof Response) return actionChirho;
        try {
          const outcomeChirho = applySegmentRepairProposalChirho({
            storePathChirho,
            proposalChirho: actionChirho.proposalChirho,
            applyReviewerChirho: actionChirho.effectiveReviewerChirho,
            dbChirho,
            spansRootChirho,
            scanlinesRootChirho,
            backupRootChirho,
          });
          writePassCHumanValidationBackupChirho(dbChirho, dbBackupPathChirho);
          return jsonResponseChirho({
            okChirho: true,
            proposalChirho: outcomeChirho.proposalChirho,
            backupDirChirho: outcomeChirho.backupDirChirho,
            invalidatedValidationIdsChirho: outcomeChirho.manifestChirho.invalidatedValidationIdsChirho,
            preservedValidationIdsChirho: outcomeChirho.manifestChirho.preservedValidationIdsChirho,
          });
        } catch (errorChirho) {
          const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
          const refusalChirho = /refused|stale/i.test(messageChirho);
          return jsonResponseChirho({ okChirho: false, errorChirho: messageChirho }, refusalChirho ? 409 : 400);
        }
      }
      return jsonResponseChirho({ okChirho: false, errorChirho: "unknown action" }, 404);
    }
    return new Response("not found", { status: 404 });
  },
});

const startupStoreChirho = loadSegmentRepairProposalStoreChirho(storePathChirho);
console.log(`[${MODULE_CHIRHO}] loaded ${startupStoreChirho.proposalsChirho.length} segment repair proposal(s) from ${storePathChirho}`);
console.log(`[${MODULE_CHIRHO}] http://localhost:${serverChirho.port}/`);
