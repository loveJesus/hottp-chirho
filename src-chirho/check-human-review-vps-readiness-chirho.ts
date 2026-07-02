// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

import { PROGRESS_DB_PATH_CHIRHO, PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  reviewServerSourceFingerprintChirho,
  reviewServerSourceFilesChirho,
  type ReviewServerKeyChirho,
} from "./review-server-health-chirho.ts";

const MODULE_CHIRHO = "check-human-review-vps-readiness-chirho";

interface RequiredPathChirho {
  labelChirho: string;
  relativePathChirho: string;
  kindChirho: "file-chirho" | "directory-chirho";
  mustBeNonEmptyChirho?: boolean;
}

interface RequiredServerChirho {
  labelChirho: string;
  relativePathChirho: string;
}

const REQUIRED_PACKAGE_SCRIPTS_CHIRHO = [
  "review-servers-chirho",
  "pass-c-human-validate-chirho",
  "latin-symbol-vision-review-chirho",
  "vision-tier-expert-review-chirho",
  "check-pass-c-human-review-server-guards-chirho",
  "check-latin-symbol-review-server-guards-chirho",
  "check-vision-tier-expert-review-server-guards-chirho",
  "check-certification-chirho",
  "sync-human-review-vps-chirho",
  "pull-human-review-vps-state-chirho",
  "check-human-review-vps-host-preflight-chirho",
  "inventory-human-review-vps-candidates-chirho",
  "check-human-review-vps-provisioning-decision-chirho",
  "check-human-review-vps-write-lease-chirho",
  "check-human-review-vps-smoke-evidence-chirho",
  "check-human-review-vps-first-smoke-completion-chirho",
  "check-human-review-vps-phase6-completion-chirho",
  "check-human-review-vps-deployment-templates-chirho",
  "apply-pass-c-human-validations-chirho",
] as const;

const LOCALHOST_SERVER_FILES_CHIRHO: RequiredServerChirho[] = [
  { labelChirho: "raw Hebrew review server", relativePathChirho: "src-chirho/pass-c-human-validate-server-chirho.ts" },
  { labelChirho: "Latin/symbol review server", relativePathChirho: "src-chirho/latin-symbol-vision-review-server-chirho.ts" },
  { labelChirho: "expert review server", relativePathChirho: "src-chirho/vision-tier-expert-review-server-chirho.ts" },
  { labelChirho: "Hebrew validation server", relativePathChirho: "src-chirho/hebrew-validate-server-chirho.ts" },
  { labelChirho: "glyph review server", relativePathChirho: "src-chirho/glyph-review-server-chirho.ts" },
  { labelChirho: "font specimen server", relativePathChirho: "src-chirho/font-specimen-server-chirho.ts" },
  { labelChirho: "glyph spine editor server", relativePathChirho: "src-chirho/glyph-spine-editor-chirho.ts" },
  { labelChirho: "labeling server", relativePathChirho: "src-chirho/labeling-server-chirho.ts" },
  { labelChirho: "polygon annotation server", relativePathChirho: "src-chirho/polygon-annotate-server-chirho.ts" },
];

const REQUIRED_PATHS_CHIRHO: RequiredPathChirho[] = [
  { labelChirho: "progress DB", relativePathChirho: "spec-chirho/progress-chirho.sqlite", kindChirho: "file-chirho" },
  { labelChirho: "Pass-C validation backup", relativePathChirho: "spec-chirho/metropoliluya-chirho/pass-c-human-validations-backup-2026-06-01-chirho.json", kindChirho: "file-chirho" },
  { labelChirho: "Latin/symbol review backup", relativePathChirho: "spec-chirho/metropoliluya-chirho/latin-symbol-vision-reviews-backup-2026-05-31-chirho.json", kindChirho: "file-chirho" },
  { labelChirho: "Latin/symbol acceptance policy", relativePathChirho: "spec-chirho/metropoliluya-chirho/latin-symbol-vision-acceptance-policy-2026-06-01-chirho.json", kindChirho: "file-chirho" },
  { labelChirho: "expert confirmation policy", relativePathChirho: "spec-chirho/metropoliluya-chirho/vision-tier-expert-confirmations-2026-06-01-chirho.json", kindChirho: "file-chirho" },
  { labelChirho: "VPS boundary doc", relativePathChirho: "spec-chirho/reviewer-deployment-chirho/human-review-vps-boundary-2026-07-02-chirho.md", kindChirho: "file-chirho" },
  { labelChirho: "VPS smoke runbook", relativePathChirho: "spec-chirho/reviewer-deployment-chirho/human-review-vps-smoke-runbook-2026-07-02-chirho.md", kindChirho: "file-chirho" },
  { labelChirho: "VPS smoke evidence template", relativePathChirho: "spec-chirho/reviewer-deployment-chirho/human-review-vps-smoke-evidence-template-2026-07-02-chirho.json", kindChirho: "file-chirho" },
  { labelChirho: "VPS write lease template", relativePathChirho: "spec-chirho/reviewer-deployment-chirho/human-review-vps-write-lease-template-2026-07-02-chirho.json", kindChirho: "file-chirho" },
  { labelChirho: "VPS sync helper", relativePathChirho: "src-chirho/sync-human-review-vps-chirho.ts", kindChirho: "file-chirho" },
  { labelChirho: "VPS commit-back pull helper", relativePathChirho: "src-chirho/pull-human-review-vps-state-chirho.ts", kindChirho: "file-chirho" },
  { labelChirho: "VPS host preflight helper", relativePathChirho: "src-chirho/check-human-review-vps-host-preflight-chirho.ts", kindChirho: "file-chirho" },
  { labelChirho: "VPS provider inventory helper", relativePathChirho: "src-chirho/inventory-human-review-vps-candidates-chirho.ts", kindChirho: "file-chirho" },
  { labelChirho: "VPS provisioning decision helper", relativePathChirho: "src-chirho/check-human-review-vps-provisioning-decision-chirho.ts", kindChirho: "file-chirho" },
  { labelChirho: "VPS write lease helper", relativePathChirho: "src-chirho/check-human-review-vps-write-lease-chirho.ts", kindChirho: "file-chirho" },
  { labelChirho: "VPS first-smoke completion helper", relativePathChirho: "src-chirho/check-human-review-vps-first-smoke-completion-chirho.ts", kindChirho: "file-chirho" },
  { labelChirho: "VPS Phase 6 completion helper", relativePathChirho: "src-chirho/check-human-review-vps-phase6-completion-chirho.ts", kindChirho: "file-chirho" },
  { labelChirho: "VPS provisioning decision template", relativePathChirho: "spec-chirho/reviewer-deployment-chirho/human-review-vps-provisioning-decision-template-2026-07-02-chirho.json", kindChirho: "file-chirho" },
  { labelChirho: "VPS Caddyfile template", relativePathChirho: "spec-chirho/reviewer-deployment-chirho/human-review-vps-caddyfile-template-2026-07-02-chirho.caddyfile", kindChirho: "file-chirho" },
  { labelChirho: "VPS env template", relativePathChirho: "spec-chirho/reviewer-deployment-chirho/human-review-vps-env-template-2026-07-02-chirho.env", kindChirho: "file-chirho" },
  { labelChirho: "VPS Caddy env drop-in", relativePathChirho: "spec-chirho/reviewer-deployment-chirho/human-review-caddy-env-2026-07-02-chirho.conf", kindChirho: "file-chirho" },
  { labelChirho: "VPS raw Hebrew service template", relativePathChirho: "spec-chirho/reviewer-deployment-chirho/human-review-raw-hebrew-2026-07-02-chirho.service", kindChirho: "file-chirho" },
  { labelChirho: "VPS Latin/symbol service template", relativePathChirho: "spec-chirho/reviewer-deployment-chirho/human-review-latin-symbol-2026-07-02-chirho.service", kindChirho: "file-chirho" },
  { labelChirho: "VPS expert service template", relativePathChirho: "spec-chirho/reviewer-deployment-chirho/human-review-expert-non-latin-2026-07-02-chirho.service", kindChirho: "file-chirho" },
  { labelChirho: "span source assets", relativePathChirho: "workspace-chirho/spans-chirho", kindChirho: "directory-chirho", mustBeNonEmptyChirho: true },
  { labelChirho: "scanline assets", relativePathChirho: "workspace-chirho/scanlines-chirho", kindChirho: "directory-chirho", mustBeNonEmptyChirho: true },
  { labelChirho: "segment crop assets", relativePathChirho: "workspace-chirho/segments-chirho", kindChirho: "directory-chirho", mustBeNonEmptyChirho: true },
  { labelChirho: "raw Hebrew review packet", relativePathChirho: "workspace-chirho/pass-c-hebrew-human-pack-chirho/2026-05-31-chirho/manifest-chirho.json", kindChirho: "file-chirho" },
  { labelChirho: "Latin/symbol review packet", relativePathChirho: "workspace-chirho/latin-symbol-vision-pack-chirho/2026-05-31-chirho/manifest-chirho.json", kindChirho: "file-chirho" },
  { labelChirho: "expert review packet", relativePathChirho: "workspace-chirho/expert-confirm-pack-chirho/2026-05-31-chirho/manifest-chirho.json", kindChirho: "file-chirho" },
];

const BOUNDARY_SNIPPETS_CHIRHO = [
  "Stored reviewer attribution is server-authoritative.",
  "HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO=x-webauth-user",
  "Cf-Access-Authenticated-User-Email",
  "X-Webauth-User",
  "All Bun review servers must bind to `127.0.0.1`",
  "Only one box owns human-review writes at a time.",
  "`workspace-chirho/` bulk assets are gitignored",
  "Commit-Back Ritual Chirho",
] as const;

const SMOKE_RUNBOOK_SNIPPETS_CHIRHO = [
  "bun run check-human-review-vps-readiness-chirho",
  "bun run check-human-review-vps-deployment-templates-chirho",
  "bun run check-human-review-vps-provisioning-decision-chirho -- --template-ok-chirho",
  "bun run sync-human-review-vps-chirho -- --print-command-chirho",
  "bun run sync-human-review-vps-chirho -- \\",
  "--host-chirho=REVIEW_HOST_CHIRHO",
  "--decision-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-provisioning-decision-YYYY-MM-DD-chirho.json",
  "--apply-chirho",
  "bun run inventory-human-review-vps-candidates-chirho",
  "check-human-review-vps-provisioning-decision-chirho",
  "bun run check-human-review-vps-host-preflight-chirho -- --print-command-chirho",
  "bun run check-human-review-vps-host-preflight-chirho -- --host-chirho=REVIEW_HOST_CHIRHO",
  "basic_auth",
  "header_up X-Webauth-User {http.auth.user.id}",
  "HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO=x-webauth-user",
  "forged `Cf-Access-Authenticated-User-Email`",
  "caddy validate --envfile /etc/hottp-review-chirho.env --config /etc/caddy/Caddyfile",
  "Start only raw Hebrew for the first smoke",
  "curl -fsS http://127.0.0.1:8766/api-chirho/server-health-chirho",
  "public traffic must go through Caddy",
  "Do not clean-certify a real item merely for smoke.",
  "Commit-Back Proof Chirho",
  "check-human-review-vps-write-lease-chirho",
  "human-review-vps-write-lease-template-2026-07-02-chirho.json",
  "write-capable review servers are paused",
  "--write-lease-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-write-lease-YYYY-MM-DD-chirho.json",
  "--apply-chirho",
  "validation id",
  "gateway reviewer identity",
  "--pass-c-backup-chirho=spec-chirho/metropoliluya-chirho/pass-c-human-validations-backup-2026-06-01-chirho.json",
  "check-human-review-vps-smoke-evidence-chirho",
  "--live-probe-chirho",
  "authenticated URL rejects",
  "unauthenticated requests",
  "direct public review port",
  "check-human-review-vps-first-smoke-completion-chirho",
  "check-human-review-vps-phase6-completion-chirho",
] as const;

const REVIEW_SERVER_KEYS_CHIRHO: ReviewServerKeyChirho[] = [
  "raw-hebrew-chirho",
  "latin-symbol-chirho",
  "expert-non-latin-chirho",
];

function failChirho(messageChirho: string): never {
  throw new Error(messageChirho);
}

function absolutePathChirho(relativePathChirho: string): string {
  return join(PROJECT_ROOT_CHIRHO, relativePathChirho);
}

function assertPathExistsChirho(itemChirho: RequiredPathChirho): void {
  const pathChirho = absolutePathChirho(itemChirho.relativePathChirho);
  if (!existsSync(pathChirho)) {
    failChirho(`${itemChirho.labelChirho} missing: ${itemChirho.relativePathChirho}`);
  }
  const statChirho = statSync(pathChirho);
  if (itemChirho.kindChirho === "file-chirho" && !statChirho.isFile()) {
    failChirho(`${itemChirho.labelChirho} is not a file: ${itemChirho.relativePathChirho}`);
  }
  if (itemChirho.kindChirho === "directory-chirho" && !statChirho.isDirectory()) {
    failChirho(`${itemChirho.labelChirho} is not a directory: ${itemChirho.relativePathChirho}`);
  }
  if (itemChirho.mustBeNonEmptyChirho === true && statChirho.isDirectory()) {
    const hasEntryChirho = readdirSync(pathChirho).length > 0;
    if (!hasEntryChirho) {
      failChirho(`${itemChirho.labelChirho} directory is empty: ${itemChirho.relativePathChirho}`);
    }
  }
}

function packageScriptsChirho(): Record<string, unknown> {
  const packageJsonChirho = JSON.parse(readFileSync(absolutePathChirho("package.json"), "utf8")) as {
    scripts?: Record<string, unknown>;
  };
  return packageJsonChirho.scripts ?? {};
}

function assertPackageScriptsChirho(): void {
  const scriptsChirho = packageScriptsChirho();
  for (const scriptChirho of REQUIRED_PACKAGE_SCRIPTS_CHIRHO) {
    if (typeof scriptsChirho[scriptChirho] !== "string") {
      failChirho(`package script missing for review VPS workflow: ${scriptChirho}`);
    }
  }
}

function assertServerBindsLocalhostChirho(serverChirho: RequiredServerChirho): void {
  const sourceChirho = readFileSync(absolutePathChirho(serverChirho.relativePathChirho), "utf8");
  if (!sourceChirho.includes("Bun.serve({")) {
    failChirho(`${serverChirho.labelChirho} does not contain Bun.serve: ${serverChirho.relativePathChirho}`);
  }
  if (!/hostname:\s*["']127\.0\.0\.1["']/.test(sourceChirho)) {
    failChirho(`${serverChirho.labelChirho} is not explicitly bound to 127.0.0.1`);
  }
}

function assertTrustedReviewerIdentityChirho(): void {
  const trustedSourceChirho = readFileSync(absolutePathChirho("src-chirho/trusted-reviewer-identity-chirho.ts"), "utf8");
  for (const snippetChirho of [
    "cf-access-authenticated-user-email",
    "x-webauth-user",
    "HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO",
    "configuredTrustedReviewerHeaderChirho",
    "return \"\"",
    "return serverReviewerChirho.trim()",
  ]) {
    if (!trustedSourceChirho.includes(snippetChirho)) {
      failChirho(`trusted reviewer identity helper missing snippet: ${snippetChirho}`);
    }
  }
  for (const serverPathChirho of [
    "src-chirho/pass-c-human-validate-server-chirho.ts",
    "src-chirho/latin-symbol-vision-review-server-chirho.ts",
    "src-chirho/vision-tier-expert-review-server-chirho.ts",
  ]) {
    const sourceChirho = readFileSync(absolutePathChirho(serverPathChirho), "utf8");
    if (!sourceChirho.includes("trustedReviewerIdentityChirho(reqChirho.headers")) {
      failChirho(`${serverPathChirho} does not use trusted reviewer identity on write paths`);
    }
  }
}

function assertBoundaryDocChirho(): void {
  const docChirho = readFileSync(
    absolutePathChirho("spec-chirho/reviewer-deployment-chirho/human-review-vps-boundary-2026-07-02-chirho.md"),
    "utf8"
  );
  for (const snippetChirho of BOUNDARY_SNIPPETS_CHIRHO) {
    if (!docChirho.includes(snippetChirho)) {
      failChirho(`VPS boundary doc missing required snippet: ${snippetChirho}`);
    }
  }
}

function assertSmokeRunbookChirho(): void {
  const docChirho = readFileSync(
    absolutePathChirho("spec-chirho/reviewer-deployment-chirho/human-review-vps-smoke-runbook-2026-07-02-chirho.md"),
    "utf8"
  );
  for (const snippetChirho of SMOKE_RUNBOOK_SNIPPETS_CHIRHO) {
    if (!docChirho.includes(snippetChirho)) {
      failChirho(`VPS smoke runbook missing required snippet: ${snippetChirho}`);
    }
  }
}

function assertSyncHelperChirho(): void {
  const sourceChirho = readFileSync(absolutePathChirho("src-chirho/sync-human-review-vps-chirho.ts"), "utf8");
  for (const snippetChirho of [
    "--dry-run",
    "--apply-chirho requires a real --host-chirho value",
    "missing required --host-chirho=REVIEW_HOST_CHIRHO",
    "--apply-chirho requires --decision-chirho",
    "check-human-review-vps-provisioning-decision-chirho.ts",
    "sync host",
    "does not match selected host name or address",
    "--write-lease-chirho",
    "check-human-review-vps-write-lease-chirho.ts",
    "--apply-chirho requires --write-lease-chirho=... so write ownership is explicit before sync-out",
    "write lease owner approval reference does not match provisioning decision approval reference",
    "WRITE_CAPABLE_LOCAL_PORTS_CHIRHO",
    "local write-capable review servers to be stopped before sync-out",
    "127.0.0.1",
    "8766",
    "8770",
    "8771",
    "WRITE_CAPABLE_REMOTE_SERVICES_CHIRHO",
    "hottp-raw-review-chirho.service",
    "hottp-latin-symbol-review-chirho.service",
    "hottp-expert-review-chirho.service",
    "remote write-capable review services must be stopped before sync-out",
    ".git/",
    ".env",
    "node_modules/",
    "app-chirho/.svelte-kit/",
  ]) {
    if (!sourceChirho.includes(snippetChirho)) {
      failChirho(`VPS sync helper missing guard snippet: ${snippetChirho}`);
    }
  }
}

function assertPullHelperChirho(): void {
  const sourceChirho = readFileSync(absolutePathChirho("src-chirho/pull-human-review-vps-state-chirho.ts"), "utf8");
  for (const snippetChirho of [
    "--dry-run",
    "--apply-chirho requires a real --host-chirho value",
    "missing required --host-chirho=REVIEW_HOST_CHIRHO",
    "spec-chirho/progress-chirho.sqlite",
    "backups-chirho/vps-snapshot-progress-chirho.sqlite",
    "pass-c-human-validations-backup-2026-06-01-chirho.json",
    "latin-symbol-vision-reviews-backup-2026-05-31-chirho.json",
    "vision-tier-expert-confirmations-2026-06-01-chirho.json",
    "--include-segment-repair-proposals-chirho",
    "--include-expert-supplied-backup-chirho",
    "--include-workspace-spans-chirho",
    "--write-lease-chirho",
    "--apply-chirho requires --decision-chirho",
    "check-human-review-vps-provisioning-decision-chirho.ts",
    "pull host",
    "does not match selected host name or address",
    "write lease owner approval reference does not match provisioning decision approval reference",
    "check-human-review-vps-write-lease-chirho.ts",
    "WRITE_CAPABLE_LOCAL_PORTS_CHIRHO",
    "local write-capable review servers to be stopped before pull-back",
    "127.0.0.1",
    "8766",
    "8770",
    "8771",
    "WRITE_CAPABLE_REMOTE_SERVICES_CHIRHO",
    "hottp-raw-review-chirho.service",
    "hottp-latin-symbol-review-chirho.service",
    "hottp-expert-review-chirho.service",
    "remote write-capable review services must be stopped before pull-back",
  ]) {
    if (!sourceChirho.includes(snippetChirho)) {
      failChirho(`VPS commit-back pull helper missing guard snippet: ${snippetChirho}`);
    }
  }
  if (!sourceChirho.includes("REMOTE_PROGRESS_DB_PATH_CHIRHO") || !sourceChirho.includes("QUARANTINE_PROGRESS_DB_PATH_CHIRHO")) {
    failChirho("VPS commit-back pull helper must keep remote progress DB path separate from quarantine target");
  }
}

function assertWriteLeaseHelperChirho(): void {
  const sourceChirho = readFileSync(absolutePathChirho("src-chirho/check-human-review-vps-write-lease-chirho.ts"), "utf8");
  for (const snippetChirho of [
    "vps-human-review-chirho",
    "local_writes_paused_chirho",
    "remote_review_servers_stopped_chirho",
    "stopped-review-servers-chirho",
    "json-replay-with-quarantined-sqlite-chirho",
    "write lease has expired",
  ]) {
    if (!sourceChirho.includes(snippetChirho)) {
      failChirho(`VPS write lease helper missing guard snippet: ${snippetChirho}`);
    }
  }
}

function assertPassCReplayHelperChirho(): void {
  const sourceChirho = readFileSync(absolutePathChirho("src-chirho/apply-pass-c-human-validations-chirho.ts"), "utf8");
  for (const snippetChirho of [
    "--apply requires --expected-row-count-chirho=<count>",
    "--expected-validation-id-chirho set",
    "--apply requires --backup-chirho",
    "writePassCHumanValidationBackupChirho",
  ]) {
    if (!sourceChirho.includes(snippetChirho)) {
      failChirho(`Pass-C replay helper missing guard snippet: ${snippetChirho}`);
    }
  }
}

function assertHostPreflightHelperChirho(): void {
  const sourceChirho = readFileSync(absolutePathChirho("src-chirho/check-human-review-vps-host-preflight-chirho.ts"), "utf8");
  for (const snippetChirho of [
    "missing required --host-chirho=REVIEW_HOST_CHIRHO",
    "command -v bun",
    "command -v caddy",
    "command -v rsync",
    "test -d /srv/hottp-review-chirho/current",
    "test -f /etc/hottp-review-chirho.env",
    "grep -q '^HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO=x-webauth-user$' /etc/hottp-review-chirho.env",
    "sudo caddy validate --envfile /etc/hottp-review-chirho.env --config /etc/caddy/Caddyfile",
    "header_up -Cf-Access-Authenticated-User-Email",
    "header_up -X-Webauth-User",
    "header_up X-Webauth-User {http.auth.user.id}",
    "systemctl is-active hottp-raw-review-chirho.service >/dev/null",
    "curl -fsS http://127.0.0.1:8766/api-chirho/server-health-chirho >/dev/null",
  ]) {
    if (!sourceChirho.includes(snippetChirho)) {
      failChirho(`VPS host preflight helper missing guard snippet: ${snippetChirho}`);
    }
  }
}

function assertProviderInventoryHelperChirho(): void {
  const sourceChirho = readFileSync(absolutePathChirho("src-chirho/inventory-human-review-vps-candidates-chirho.ts"), "utf8");
  for (const snippetChirho of [
    "https://api.hetzner.cloud/v1/servers",
    "https://api.digitalocean.com/v2/droplets",
    "https://api.cloudflare.com/client/v4/zones?name=bible.systems",
    "raw-review.bible.systems",
    "latin-review.bible.systems",
    "expert-review.bible.systems",
    "This is read-only provider inventory.",
  ]) {
    if (!sourceChirho.includes(snippetChirho)) {
      failChirho(`VPS provider inventory helper missing snippet: ${snippetChirho}`);
    }
  }
  for (const forbiddenSnippetChirho of ["method: \"POST\"", "method: \"PUT\"", "method: \"PATCH\"", "method: \"DELETE\""]) {
    if (sourceChirho.includes(forbiddenSnippetChirho)) {
      failChirho(`VPS provider inventory helper must stay read-only; found ${forbiddenSnippetChirho}`);
    }
  }
}

function assertProvisioningDecisionHelperChirho(): void {
  const sourceChirho = readFileSync(absolutePathChirho("src-chirho/check-human-review-vps-provisioning-decision-chirho.ts"), "utf8");
  for (const snippetChirho of [
    "owner approval must be explicit",
    "create-new-host-chirho must acknowledge creates_billable_resources_chirho=true",
    "raw-review.bible.systems",
    "single_writer_host_chirho",
    "no_d1_authoring_database_chirho",
    "secrets_outside_git_chirho",
    "workspace_assets_synced_explicitly_chirho",
  ]) {
    if (!sourceChirho.includes(snippetChirho)) {
      failChirho(`VPS provisioning decision helper missing guard snippet: ${snippetChirho}`);
    }
  }
}

function assertDeploymentTemplatesHelperChirho(): void {
  const sourceChirho = readFileSync(absolutePathChirho("src-chirho/check-human-review-vps-deployment-templates-chirho.ts"), "utf8");
  for (const snippetChirho of [
    "HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO",
    "HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO=x-webauth-user",
    "header_up -Cf-Access-Authenticated-User-Email",
    "header_up -X-Webauth-User",
    "header_up X-Webauth-User",
  ]) {
    if (!sourceChirho.includes(snippetChirho)) {
      failChirho(`VPS deployment templates helper missing guard snippet: ${snippetChirho}`);
    }
  }
}

function assertSmokeEvidenceHelperChirho(): void {
  const sourceChirho = readFileSync(absolutePathChirho("src-chirho/check-human-review-vps-smoke-evidence-chirho.ts"), "utf8");
  for (const snippetChirho of [
    "reviewed-issues-chirho",
    "validation_id_chirho",
    "expected_reviewer_chirho",
    "FORBIDDEN_REVIEWER_IDENTITY_PATTERNS_CHIRHO",
    "server fallback identity",
    "saved_after_chirho",
    "saved_before_chirho",
    "--live-probe-chirho",
    "expected unauthenticated gateway HTTP 401/403",
    "expected direct review port to refuse",
    "first write smoke must be a reviewed-issues row, not a clean certification",
  ]) {
    if (!sourceChirho.includes(snippetChirho)) {
      failChirho(`VPS smoke evidence helper missing guard snippet: ${snippetChirho}`);
    }
  }
}

function assertFirstSmokeCompletionHelperChirho(): void {
  const sourceChirho = readFileSync(absolutePathChirho("src-chirho/check-human-review-vps-first-smoke-completion-chirho.ts"), "utf8");
  for (const snippetChirho of [
    "DEFAULT_PASS_C_BACKUP_PATH_CHIRHO",
    "check-human-review-vps-provisioning-decision-chirho.ts",
    "check-human-review-vps-smoke-evidence-chirho.ts",
    "Pass-C backup lacks smoke validation id",
    "Pass-C backup smoke row reviewer does not match gateway identity evidence",
    "updatedAt is outside the evidence time window",
    "pass-c-backup-chirho",
    "live-probe-chirho",
    "smoke host",
    "raw-hebrew-chirho",
    "raw review hostname",
    "direct public port 8766",
  ]) {
    if (!sourceChirho.includes(snippetChirho)) {
      failChirho(`VPS first-smoke completion helper missing guard snippet: ${snippetChirho}`);
    }
  }
}

function assertPhase6CompletionHelperChirho(): void {
  const sourceChirho = readFileSync(absolutePathChirho("src-chirho/check-human-review-vps-phase6-completion-chirho.ts"), "utf8");
  for (const snippetChirho of [
    "check-human-review-vps-readiness-chirho.ts",
    "check-human-review-vps-deployment-templates-chirho.ts",
    "check-human-review-vps-write-lease-chirho.ts",
    "check-human-review-vps-host-preflight-chirho.ts",
    "check-human-review-vps-first-smoke-completion-chirho.ts",
    "check-pass-c-human-review-server-guards-chirho.ts",
    "transcription-certification-status-chirho.ts",
    "check-certification-strict-status-chirho.ts",
    "--live-probe-chirho",
    "--source-local-fixture-chirho",
    "Phase 6 completion requires --live-probe-chirho",
    "REQUIRED_TRUSTED_HEADER_CHIRHO",
    "Phase 6 Caddy smoke evidence must use",
    "write lease owner approval reference does not match provisioning decision approval reference",
  ]) {
    if (!sourceChirho.includes(snippetChirho)) {
      failChirho(`VPS Phase 6 completion helper missing guard snippet: ${snippetChirho}`);
    }
  }
}

function assertReviewServerFingerprintsChirho(): void {
  for (const keyChirho of REVIEW_SERVER_KEYS_CHIRHO) {
    const filesChirho = reviewServerSourceFilesChirho(keyChirho);
    if (filesChirho.length === 0) {
      failChirho(`${keyChirho} has no review-server source files in freshness fingerprint`);
    }
    const fingerprintChirho = reviewServerSourceFingerprintChirho(keyChirho);
    if (fingerprintChirho.sourceFileCountChirho !== filesChirho.length) {
      failChirho(`${keyChirho} source fingerprint count does not match source file list`);
    }
  }
}

function mainChirho(): void {
  for (const pathChirho of REQUIRED_PATHS_CHIRHO) assertPathExistsChirho(pathChirho);
  if (!existsSync(PROGRESS_DB_PATH_CHIRHO)) {
    failChirho(`progress DB missing at configured path: ${PROGRESS_DB_PATH_CHIRHO}`);
  }
  assertPackageScriptsChirho();
  for (const serverChirho of LOCALHOST_SERVER_FILES_CHIRHO) assertServerBindsLocalhostChirho(serverChirho);
  assertTrustedReviewerIdentityChirho();
  assertBoundaryDocChirho();
  assertSmokeRunbookChirho();
  assertSyncHelperChirho();
  assertPullHelperChirho();
  assertWriteLeaseHelperChirho();
  assertPassCReplayHelperChirho();
  assertHostPreflightHelperChirho();
  assertProviderInventoryHelperChirho();
  assertProvisioningDecisionHelperChirho();
  assertDeploymentTemplatesHelperChirho();
  assertSmokeEvidenceHelperChirho();
  assertFirstSmokeCompletionHelperChirho();
  assertPhase6CompletionHelperChirho();
  assertReviewServerFingerprintsChirho();
  console.log(
    `[${MODULE_CHIRHO}] VPS readiness preflight passed: localhost-bound servers, trusted reviewer headers, assets, DB, packets, scripts, and commit-back docs are present`
  );
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
