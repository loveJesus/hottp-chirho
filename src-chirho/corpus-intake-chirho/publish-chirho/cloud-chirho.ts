// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { createHash } from 'node:crypto';
import { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { StatementChirho } from './source-chirho.ts';

export const DATABASE_ID_CHIRHO = '873a8eda-1551-4ee7-9e3b-9b281b6c1635';
export const BUCKET_CHIRHO = 'hottp-chirho';
export interface ResultChirho { results: Record<string, unknown>[]; success: boolean; meta: { changes: number; rows_read: number; rows_written: number; size_after: number } }
function envChirho(nameChirho: string): string {
  const valueChirho = process.env[nameChirho];
  if (!valueChirho) throw new Error(`Missing ${nameChirho}`);
  return valueChirho;
}
export async function apiChirho(pathChirho: string, methodChirho = 'GET', bodyChirho?: unknown): Promise<unknown> {
  const responseChirho = await fetch(`https://api.cloudflare.com/client/v4/accounts/${envChirho('CLOUDFLARE_GLOBAL_API_MAIN_ACCOUNT_ID_CHIRHO')}/${pathChirho}`, {
    method: methodChirho, headers: { 'X-Auth-Email': envChirho('CLOUDFLARE_GLOBAL_API_EMAIL_CHIRHO'), 'X-Auth-Key': envChirho('CLOUDFLARE_GLOBAL_API_KEY_CHIRHO'), 'Content-Type': 'application/json' },
    body: bodyChirho === undefined ? undefined : JSON.stringify(bodyChirho), signal: AbortSignal.timeout(120000),
  });
  const dataChirho = await responseChirho.json() as {success?: boolean; errors?: {code: number; message: string}[]; result?: unknown};
  if (!responseChirho.ok || dataChirho.success === false) throw new Error(`Cloudflare ${responseChirho.status}: ${JSON.stringify(dataChirho.errors ?? [])}`);
  return dataChirho.result;
}
export async function queryChirho(statementsChirho: StatementChirho[], databaseChirho = DATABASE_ID_CHIRHO): Promise<ResultChirho[]> {
  const resultChirho = await apiChirho(`d1/database/${databaseChirho}/query`, 'POST', { batch: statementsChirho }) as ResultChirho[];
  if (!Array.isArray(resultChirho) || resultChirho.length !== statementsChirho.length || resultChirho.some(rowChirho => !rowChirho.success)) throw new Error('Incomplete/failed D1 batch; reconcile remote state before retry');
  return resultChirho;
}
export function r2Chirho(): S3Client {
  if (envChirho('HOTTP_R2_BUCKET_CHIRHO') !== BUCKET_CHIRHO) throw new Error('Unexpected R2 bucket');
  return new S3Client({region: 'auto', endpoint: envChirho('HOTTP_R2_ENDPOINT_CHIRHO'), maxAttempts: 3,
    requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: { accessKeyId: envChirho('HOTTP_R2_ACCESS_KEY_ID_CHIRHO'), secretAccessKey: envChirho('HOTTP_R2_SECRET_ACCESS_KEY_CHIRHO') }});
}

// Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-publish-workflow-chirho.md.
// Create once, never overwrite an existing book scan. A retry after uncertain
// success meets the same precondition and checks the committed object's hash.
export async function putImageChirho(clientChirho: S3Client, keyChirho: string, imageChirho: Uint8Array, shaChirho: string): Promise<string> {
  const md5Chirho = createHash('md5').update(imageChirho).digest();
  try {
    await clientChirho.send(new PutObjectCommand({ Bucket: BUCKET_CHIRHO, Key: keyChirho, Body: imageChirho, ContentType: 'image/png',
      ContentMD5: md5Chirho.toString('base64'), Metadata: { sha256_chirho: shaChirho }, IfNoneMatch: '*' }));
  } catch (errorChirho) {
    if ((errorChirho as {$metadata?: {httpStatusCode?: number}}).$metadata?.httpStatusCode !== 412) throw errorChirho;
  }
  const headChirho = await clientChirho.send(new HeadObjectCommand({Bucket: BUCKET_CHIRHO, Key: keyChirho}));
  if (headChirho.ContentLength !== imageChirho.byteLength || headChirho.ETag?.replaceAll('"', '') !== md5Chirho.toString('hex') ||
    headChirho.Metadata?.sha256_chirho !== shaChirho) throw new Error(`Existing/uploaded image differs: ${keyChirho}`);
  return headChirho.ETag!;
}
export async function imageInventoryChirho(clientChirho: S3Client, volumeChirho: number): Promise<Map<string, {bytes_chirho: number; etag_chirho: string}>> {
  const mapChirho = new Map<string, {bytes_chirho: number; etag_chirho: string}>();
  let cursorChirho: string | undefined;
  do {
    const listChirho = await clientChirho.send(new ListObjectsV2Command({Bucket: BUCKET_CHIRHO, Prefix: `vol-${volumeChirho}-chirho/`, ContinuationToken: cursorChirho}));
    for (const objectChirho of listChirho.Contents ?? []) {
      if (objectChirho.Key?.endsWith('/full-page-chirho.png')) mapChirho.set(objectChirho.Key, {bytes_chirho: objectChirho.Size!, etag_chirho: objectChirho.ETag!});
    }
    cursorChirho = listChirho.NextContinuationToken;
  } while (cursorChirho);
  return mapChirho;
}
