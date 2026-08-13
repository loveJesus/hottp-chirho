// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-human-review-vps-deployment-templates-chirho";

const TEMPLATE_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho", "reviewer-deployment-chirho");

const CADDY_TEMPLATE_PATH_CHIRHO = join(
  TEMPLATE_DIR_CHIRHO,
  "human-review-vps-caddyfile-template-2026-07-02-chirho.caddyfile"
);
const ENV_TEMPLATE_PATH_CHIRHO = join(
  TEMPLATE_DIR_CHIRHO,
  "human-review-vps-env-template-2026-07-02-chirho.env"
);
const CADDY_ENV_DROPIN_PATH_CHIRHO = join(
  TEMPLATE_DIR_CHIRHO,
  "human-review-caddy-env-2026-07-02-chirho.conf"
);
const RAW_SERVICE_TEMPLATE_PATH_CHIRHO = join(
  TEMPLATE_DIR_CHIRHO,
  "human-review-raw-hebrew-2026-07-02-chirho.service"
);
const LATIN_SYMBOL_SERVICE_TEMPLATE_PATH_CHIRHO = join(
  TEMPLATE_DIR_CHIRHO,
  "human-review-latin-symbol-2026-07-02-chirho.service"
);
const EXPERT_SERVICE_TEMPLATE_PATH_CHIRHO = join(
  TEMPLATE_DIR_CHIRHO,
  "human-review-expert-non-latin-2026-07-02-chirho.service"
);
const REPAIR_APPROVAL_SERVICE_TEMPLATE_PATH_CHIRHO = join(
  TEMPLATE_DIR_CHIRHO,
  "human-review-repair-approval-2026-08-13-chirho.service"
);

const REVIEW_UPSTREAMS_CHIRHO = [
  { hostChirho: "raw-review.example-chirho.org", portChirho: 8766 },
  { hostChirho: "latin-review.example-chirho.org", portChirho: 8770 },
  { hostChirho: "expert-review.example-chirho.org", portChirho: 8771 },
  { hostChirho: "repair-approval.example-chirho.org", portChirho: 8772 },
] as const;

const REQUIRED_ENV_KEYS_CHIRHO = [
  "HOTTP_REVIEW_USER_CHIRHO",
  "HOTTP_REVIEW_PASSWORD_HASH_CHIRHO",
  "HOTTP_REVIEW_FALLBACK_REVIEWER_CHIRHO",
  "HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO",
  "HOTTP_APPROVAL_USER_CHIRHO",
  "HOTTP_APPROVAL_PASSWORD_HASH_CHIRHO",
] as const;

const REVIEW_SERVICE_TEMPLATES_CHIRHO = [
  {
    labelChirho: "raw review systemd service",
    pathChirho: RAW_SERVICE_TEMPLATE_PATH_CHIRHO,
    commandChirho: "bun run pass-c-human-validate-chirho",
    forbiddenCommandsChirho: [
      "latin-symbol-vision-review-chirho",
      "vision-tier-expert-review-chirho",
      "segment-repair-approval-chirho",
    ],
  },
  {
    labelChirho: "Latin/symbol review systemd service",
    pathChirho: LATIN_SYMBOL_SERVICE_TEMPLATE_PATH_CHIRHO,
    commandChirho: "bun run latin-symbol-vision-review-chirho",
    forbiddenCommandsChirho: [
      "pass-c-human-validate-chirho",
      "vision-tier-expert-review-chirho",
      "segment-repair-approval-chirho",
    ],
  },
  {
    labelChirho: "expert review systemd service",
    pathChirho: EXPERT_SERVICE_TEMPLATE_PATH_CHIRHO,
    commandChirho: "bun run vision-tier-expert-review-chirho",
    forbiddenCommandsChirho: [
      "pass-c-human-validate-chirho",
      "latin-symbol-vision-review-chirho",
      "segment-repair-approval-chirho",
    ],
  },
  {
    labelChirho: "segment repair approval systemd service",
    pathChirho: REPAIR_APPROVAL_SERVICE_TEMPLATE_PATH_CHIRHO,
    commandChirho: "bun run segment-repair-approval-chirho",
    forbiddenCommandsChirho: [
      "pass-c-human-validate-chirho",
      "latin-symbol-vision-review-chirho",
      "vision-tier-expert-review-chirho",
    ],
  },
] as const;

function failChirho(messageChirho: string): never {
  throw new Error(messageChirho);
}

function readRequiredFileChirho(pathChirho: string): string {
  if (!existsSync(pathChirho)) failChirho(`required deployment template missing: ${pathChirho}`);
  return readFileSync(pathChirho, "utf8");
}

function assertIncludesChirho(sourceChirho: string, snippetChirho: string, labelChirho: string): void {
  if (!sourceChirho.includes(snippetChirho)) failChirho(`${labelChirho} missing snippet: ${snippetChirho}`);
}

function assertRegexChirho(sourceChirho: string, regexChirho: RegExp, labelChirho: string): void {
  if (!regexChirho.test(sourceChirho)) failChirho(`${labelChirho} missing pattern: ${regexChirho}`);
}

function assertCaddyTemplateChirho(sourceChirho: string): void {
  assertIncludesChirho(sourceChirho, "auto_https disable_redirects", "Caddy template");
  assertIncludesChirho(sourceChirho, "tls internal", "Caddy template");
  assertIncludesChirho(sourceChirho, "basic_auth", "Caddy template");
  assertIncludesChirho(sourceChirho, "{$HOTTP_REVIEW_USER_CHIRHO}", "Caddy template");
  assertIncludesChirho(sourceChirho, "{$HOTTP_REVIEW_PASSWORD_HASH_CHIRHO}", "Caddy template");
  assertIncludesChirho(sourceChirho, "{$HOTTP_APPROVAL_USER_CHIRHO}", "Caddy template");
  assertIncludesChirho(sourceChirho, "{$HOTTP_APPROVAL_PASSWORD_HASH_CHIRHO}", "Caddy template");
  for (const upstreamChirho of REVIEW_UPSTREAMS_CHIRHO) {
    assertIncludesChirho(sourceChirho, `https://${upstreamChirho.hostChirho}`, "Caddy template");
    assertIncludesChirho(sourceChirho, `reverse_proxy 127.0.0.1:${upstreamChirho.portChirho}`, "Caddy template");
  }
  const internalTlsImportsChirho = (sourceChirho.match(/import hottp_review_origin_tls_chirho/g) ?? []).length;
  if (internalTlsImportsChirho !== REVIEW_UPSTREAMS_CHIRHO.length) {
    failChirho("Caddy template must import internal origin TLS for every upstream");
  }
  const strippedCfHeadersChirho = (sourceChirho.match(/header_up -Cf-Access-Authenticated-User-Email/g) ?? []).length;
  const injectedWebauthHeadersChirho = (sourceChirho.match(/header_up X-Webauth-User \{http\.auth\.user\.id\}/g) ?? []).length;
  if (strippedCfHeadersChirho !== REVIEW_UPSTREAMS_CHIRHO.length) {
    failChirho("Caddy template must strip Cf-Access-Authenticated-User-Email for every upstream");
  }
  if (injectedWebauthHeadersChirho !== REVIEW_UPSTREAMS_CHIRHO.length) {
    failChirho("Caddy template must inject X-Webauth-User from {http.auth.user.id} for every upstream");
  }
  if (/reverse_proxy\s+0\.0\.0\.0/.test(sourceChirho)) failChirho("Caddy template must not proxy to 0.0.0.0");
}

function assertEnvTemplateChirho(sourceChirho: string): void {
  for (const keyChirho of REQUIRED_ENV_KEYS_CHIRHO) {
    assertRegexChirho(sourceChirho, new RegExp(`^${keyChirho}=`, "m"), "env template");
  }
  assertIncludesChirho(sourceChirho, "HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO=x-webauth-user", "env template");
  if (/=($|\s*$)/m.test(sourceChirho)) failChirho("env template must not contain blank values");
}

function assertCaddyDropinChirho(sourceChirho: string): void {
  assertIncludesChirho(sourceChirho, "[Service]", "Caddy systemd drop-in");
  assertIncludesChirho(sourceChirho, "EnvironmentFile=/etc/hottp-review-chirho.env", "Caddy systemd drop-in");
}

function assertReviewServiceTemplateChirho(
  sourceChirho: string,
  serviceChirho: (typeof REVIEW_SERVICE_TEMPLATES_CHIRHO)[number]
): void {
  assertIncludesChirho(sourceChirho, "[Service]", serviceChirho.labelChirho);
  assertIncludesChirho(sourceChirho, "User=hottp-review-chirho", serviceChirho.labelChirho);
  assertIncludesChirho(sourceChirho, "WorkingDirectory=/srv/hottp-review-chirho/current", serviceChirho.labelChirho);
  assertIncludesChirho(sourceChirho, "EnvironmentFile=/etc/hottp-review-chirho.env", serviceChirho.labelChirho);
  assertIncludesChirho(sourceChirho, serviceChirho.commandChirho, serviceChirho.labelChirho);
  assertIncludesChirho(sourceChirho, "--reviewer=${HOTTP_REVIEW_FALLBACK_REVIEWER_CHIRHO}", serviceChirho.labelChirho);
  assertIncludesChirho(sourceChirho, "Restart=on-failure", serviceChirho.labelChirho);
  assertIncludesChirho(
    sourceChirho,
    "ReadWritePaths=/srv/hottp-review-chirho/current /srv/hottp-review-chirho/backups-chirho",
    serviceChirho.labelChirho
  );
  for (const forbiddenCommandChirho of serviceChirho.forbiddenCommandsChirho) {
    if (sourceChirho.includes(forbiddenCommandChirho)) {
      failChirho(`${serviceChirho.labelChirho} must not start ${forbiddenCommandChirho}`);
    }
  }
}

function mainChirho(): void {
  assertCaddyTemplateChirho(readRequiredFileChirho(CADDY_TEMPLATE_PATH_CHIRHO));
  assertEnvTemplateChirho(readRequiredFileChirho(ENV_TEMPLATE_PATH_CHIRHO));
  assertCaddyDropinChirho(readRequiredFileChirho(CADDY_ENV_DROPIN_PATH_CHIRHO));
  for (const serviceChirho of REVIEW_SERVICE_TEMPLATES_CHIRHO) {
    assertReviewServiceTemplateChirho(readRequiredFileChirho(serviceChirho.pathChirho), serviceChirho);
  }
  console.log(`[${MODULE_CHIRHO}] deployment templates passed`);
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
