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

const REVIEW_UPSTREAMS_CHIRHO = [
  { hostChirho: "raw-review.example-chirho.org", portChirho: 8766 },
  { hostChirho: "latin-review.example-chirho.org", portChirho: 8770 },
  { hostChirho: "expert-review.example-chirho.org", portChirho: 8771 },
] as const;

const REQUIRED_ENV_KEYS_CHIRHO = [
  "HOTTP_REVIEW_USER_CHIRHO",
  "HOTTP_REVIEW_PASSWORD_HASH_CHIRHO",
  "HOTTP_REVIEW_FALLBACK_REVIEWER_CHIRHO",
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
  assertIncludesChirho(sourceChirho, "basic_auth", "Caddy template");
  assertIncludesChirho(sourceChirho, "{$HOTTP_REVIEW_USER_CHIRHO}", "Caddy template");
  assertIncludesChirho(sourceChirho, "{$HOTTP_REVIEW_PASSWORD_HASH_CHIRHO}", "Caddy template");
  for (const upstreamChirho of REVIEW_UPSTREAMS_CHIRHO) {
    assertIncludesChirho(sourceChirho, upstreamChirho.hostChirho, "Caddy template");
    assertIncludesChirho(sourceChirho, `reverse_proxy 127.0.0.1:${upstreamChirho.portChirho}`, "Caddy template");
  }
  const strippedCfHeadersChirho = (sourceChirho.match(/header_up -Cf-Access-Authenticated-User-Email/g) ?? []).length;
  const strippedWebauthHeadersChirho = (sourceChirho.match(/header_up -X-Webauth-User/g) ?? []).length;
  const injectedWebauthHeadersChirho = (sourceChirho.match(/header_up X-Webauth-User \{http\.auth\.user\.id\}/g) ?? []).length;
  if (strippedCfHeadersChirho !== REVIEW_UPSTREAMS_CHIRHO.length) {
    failChirho("Caddy template must strip Cf-Access-Authenticated-User-Email for every upstream");
  }
  if (strippedWebauthHeadersChirho !== REVIEW_UPSTREAMS_CHIRHO.length) {
    failChirho("Caddy template must strip X-Webauth-User for every upstream before injecting it");
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
  if (/=($|\s*$)/m.test(sourceChirho)) failChirho("env template must not contain blank values");
}

function assertCaddyDropinChirho(sourceChirho: string): void {
  assertIncludesChirho(sourceChirho, "[Service]", "Caddy systemd drop-in");
  assertIncludesChirho(sourceChirho, "EnvironmentFile=/etc/hottp-review-chirho.env", "Caddy systemd drop-in");
}

function assertRawServiceTemplateChirho(sourceChirho: string): void {
  assertIncludesChirho(sourceChirho, "[Service]", "raw review systemd service");
  assertIncludesChirho(sourceChirho, "User=hottp-review-chirho", "raw review systemd service");
  assertIncludesChirho(sourceChirho, "WorkingDirectory=/srv/hottp-review-chirho/current", "raw review systemd service");
  assertIncludesChirho(sourceChirho, "EnvironmentFile=/etc/hottp-review-chirho.env", "raw review systemd service");
  assertIncludesChirho(sourceChirho, "bun run pass-c-human-validate-chirho", "raw review systemd service");
  assertIncludesChirho(sourceChirho, "--reviewer=${HOTTP_REVIEW_FALLBACK_REVIEWER_CHIRHO}", "raw review systemd service");
  assertIncludesChirho(sourceChirho, "Restart=on-failure", "raw review systemd service");
  assertIncludesChirho(sourceChirho, "ReadWritePaths=/srv/hottp-review-chirho/current /srv/hottp-review-chirho/backups-chirho", "raw review systemd service");
  if (sourceChirho.includes("latin-symbol-vision-review-chirho") || sourceChirho.includes("vision-tier-expert-review-chirho")) {
    failChirho("raw review systemd service must start only the raw Hebrew station");
  }
}

function mainChirho(): void {
  assertCaddyTemplateChirho(readRequiredFileChirho(CADDY_TEMPLATE_PATH_CHIRHO));
  assertEnvTemplateChirho(readRequiredFileChirho(ENV_TEMPLATE_PATH_CHIRHO));
  assertCaddyDropinChirho(readRequiredFileChirho(CADDY_ENV_DROPIN_PATH_CHIRHO));
  assertRawServiceTemplateChirho(readRequiredFileChirho(RAW_SERVICE_TEMPLATE_PATH_CHIRHO));
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
