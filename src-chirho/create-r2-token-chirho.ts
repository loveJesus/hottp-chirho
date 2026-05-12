// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Create an R2 API token scoped to the hottp-chirho bucket and print
 * the S3-compatible Access Key ID + Secret Access Key for use with
 * @aws-sdk/client-s3.
 *
 *   Access Key ID    = the Cloudflare token's ID
 *   Secret Access Key = sha256 hex of the token's value
 *
 * Auth: uses CLOUDFLARE_GLOBAL_API_EMAIL_CHIRHO + CLOUDFLARE_GLOBAL_API_KEY_CHIRHO
 * with the legacy X-Auth-Email / X-Auth-Key headers.
 *
 * Usage:
 *   bun src-chirho/create-r2-token-chirho.ts
 */

import { createHash } from "crypto";

const ACCOUNT_ID_CHIRHO =
  process.env.CLOUDFLARE_GLOBAL_API_MAIN_ACCOUNT_ID_CHIRHO!;
const AUTH_EMAIL_CHIRHO = process.env.CLOUDFLARE_GLOBAL_API_EMAIL_CHIRHO!;
const AUTH_KEY_CHIRHO = process.env.CLOUDFLARE_GLOBAL_API_KEY_CHIRHO!;
const BUCKET_CHIRHO = "hottp-chirho";

if (!ACCOUNT_ID_CHIRHO || !AUTH_EMAIL_CHIRHO || !AUTH_KEY_CHIRHO) {
  console.error(
    "Missing CLOUDFLARE_GLOBAL_API_MAIN_ACCOUNT_ID_CHIRHO / EMAIL / KEY in env"
  );
  process.exit(1);
}

const baseHeadersChirho = {
  "X-Auth-Email": AUTH_EMAIL_CHIRHO,
  "X-Auth-Key": AUTH_KEY_CHIRHO,
  "Content-Type": "application/json",
};

interface CfRespChirho<T> {
  success: boolean;
  errors: { code: number; message: string }[];
  messages: { code: number; message: string }[];
  result: T;
  result_info?: { page: number; per_page: number; total_count: number; total_pages: number };
}

async function listR2PermissionGroupsChirho(): Promise<{ id: string; name: string }[]> {
  const allChirho: { id: string; name: string }[] = [];
  for (let pageChirho = 1; pageChirho <= 5; pageChirho++) {
    const respChirho = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID_CHIRHO}/tokens/permission_groups?page=${pageChirho}&per_page=100`,
      { headers: baseHeadersChirho }
    );
    if (!respChirho.ok) {
      const tChirho = await respChirho.text();
      throw new Error(`permission_groups list failed (${respChirho.status}): ${tChirho}`);
    }
    const dataChirho = (await respChirho.json()) as CfRespChirho<{ id: string; name: string }[]>;
    if (!dataChirho.success) {
      throw new Error(`permission_groups error: ${JSON.stringify(dataChirho.errors)}`);
    }
    allChirho.push(...dataChirho.result);
    const totalChirho = dataChirho.result_info?.total_pages ?? 1;
    if (pageChirho >= totalChirho) break;
  }
  return allChirho;
}

async function createTokenChirho(
  itemWriteIdChirho: string
): Promise<{ id: string; value: string }> {
  const policyChirho = {
    effect: "allow" as const,
    resources: {
      [`com.cloudflare.edge.r2.bucket.${ACCOUNT_ID_CHIRHO}_default_${BUCKET_CHIRHO}`]: "*",
    },
    permission_groups: [{ id: itemWriteIdChirho }],
  };

  const respChirho = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID_CHIRHO}/tokens`,
    {
      method: "POST",
      headers: baseHeadersChirho,
      body: JSON.stringify({
        name: `hottp-chirho-pipeline-${Date.now()}`,
        policies: [policyChirho],
      }),
    }
  );

  const dataChirho = (await respChirho.json()) as CfRespChirho<{
    id: string;
    value: string;
  }>;

  if (!respChirho.ok || !dataChirho.success) {
    throw new Error(`token create failed: ${JSON.stringify(dataChirho.errors ?? dataChirho)}`);
  }

  return { id: dataChirho.result.id, value: dataChirho.result.value };
}

const pgsChirho = await listR2PermissionGroupsChirho();
const r2PgsChirho = pgsChirho.filter((pgChirho) =>
  /R2/i.test(pgChirho.name)
);

console.log("R2-related permission groups:");
for (const pgChirho of r2PgsChirho) {
  console.log(`  ${pgChirho.id}  ${pgChirho.name}`);
}

const itemWriteChirho =
  r2PgsChirho.find((pgChirho) =>
    /Bucket.*Item.*Write/i.test(pgChirho.name)
  ) ??
  r2PgsChirho.find((pgChirho) => /Storage Write/i.test(pgChirho.name));

if (!itemWriteChirho) {
  console.error("Could not find an R2 'Item Write' permission group — printing all R2 ones above.");
  process.exit(2);
}

console.log(`\nUsing permission group: ${itemWriteChirho.id} (${itemWriteChirho.name})`);

const tokenChirho = await createTokenChirho(itemWriteChirho.id);
const accessKeyIdChirho = tokenChirho.id;
const secretChirho = createHash("sha256").update(tokenChirho.value).digest("hex");

console.log("\n=== R2 S3-compatible credentials for hottp-chirho bucket ===");
console.log(`HOTTP_R2_ACCESS_KEY_ID_CHIRHO=${accessKeyIdChirho}`);
console.log(`HOTTP_R2_SECRET_ACCESS_KEY_CHIRHO=${secretChirho}`);
console.log(`HOTTP_R2_ENDPOINT_CHIRHO=https://${ACCOUNT_ID_CHIRHO}.r2.cloudflarestorage.com`);
console.log(`HOTTP_R2_BUCKET_CHIRHO=${BUCKET_CHIRHO}`);
console.log(`# Cloudflare token id (for revoke later): ${tokenChirho.id}`);
