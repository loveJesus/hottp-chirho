// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { readFileSync } from "fs";
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import {
  R2_ENDPOINT_CHIRHO,
  R2_KEY_CHIRHO,
  R2_SECRET_CHIRHO,
  R2_BUCKET_CHIRHO,
} from "./config-chirho.ts";
import type { CroppedSnippetChirho } from "./types-chirho.ts";
import { retryChirho, logChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "upload-chirho";

/** Create S3-compatible client for Cloudflare R2 */
function createR2ClientChirho(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT_CHIRHO,
    credentials: {
      accessKeyId: R2_KEY_CHIRHO,
      secretAccessKey: R2_SECRET_CHIRHO,
    },
  });
}

let r2ClientChirho: S3Client | null = null;

function getR2ClientChirho(): S3Client {
  if (!r2ClientChirho) {
    r2ClientChirho = createR2ClientChirho();
  }
  return r2ClientChirho;
}

/** Ensure the R2 bucket exists */
export async function ensureBucketChirho(): Promise<void> {
  const clientChirho = getR2ClientChirho();

  try {
    await clientChirho.send(
      new HeadBucketCommand({ Bucket: R2_BUCKET_CHIRHO })
    );
    logChirho(MODULE_CHIRHO, `Bucket '${R2_BUCKET_CHIRHO}' exists`);
  } catch {
    logChirho(MODULE_CHIRHO, `Creating bucket '${R2_BUCKET_CHIRHO}'...`);
    await clientChirho.send(
      new CreateBucketCommand({ Bucket: R2_BUCKET_CHIRHO })
    );
  }
}

/**
 * Upload a snippet image to R2.
 * Returns the R2 object key.
 */
export async function uploadSnippetImageChirho(
  croppedChirho: CroppedSnippetChirho,
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<string> {
  if (!croppedChirho.imagePathChirho) {
    return "";
  }

  const keyChirho = `vol-${volumeNumberChirho}-chirho/page-${String(pageNumberChirho).padStart(4, "0")}-chirho/snippet-${String(croppedChirho.snippetIndexChirho).padStart(3, "0")}-chirho.png`;

  logChirho(MODULE_CHIRHO, `Uploading ${keyChirho}`);

  const bodyChirho = readFileSync(croppedChirho.imagePathChirho);
  const clientChirho = getR2ClientChirho();

  await retryChirho(async () => {
    await clientChirho.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_CHIRHO,
        Key: keyChirho,
        Body: bodyChirho,
        ContentType: "image/png",
      })
    );
  }, 3, 1000);

  return keyChirho;
}

/**
 * Upload a full page image to R2.
 * Returns the R2 object key.
 */
export async function uploadPageImageChirho(
  imagePathChirho: string,
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<string> {
  const keyChirho = `vol-${volumeNumberChirho}-chirho/page-${String(pageNumberChirho).padStart(4, "0")}-chirho/full-page-chirho.png`;

  logChirho(MODULE_CHIRHO, `Uploading page image ${keyChirho}`);

  const bodyChirho = readFileSync(imagePathChirho);
  const clientChirho = getR2ClientChirho();

  await retryChirho(async () => {
    await clientChirho.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_CHIRHO,
        Key: keyChirho,
        Body: bodyChirho,
        ContentType: "image/png",
      })
    );
  }, 3, 1000);

  return keyChirho;
}

/**
 * Upload all snippet images for a page.
 */
export async function uploadAllSnippetsChirho(
  croppedSnippetsChirho: CroppedSnippetChirho[],
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<Map<number, string>> {
  const keysChirho = new Map<number, string>();

  for (const croppedChirho of croppedSnippetsChirho) {
    const keyChirho = await uploadSnippetImageChirho(
      croppedChirho,
      volumeNumberChirho,
      pageNumberChirho
    );
    keysChirho.set(croppedChirho.snippetIndexChirho, keyChirho);
  }

  return keysChirho;
}

/** CLI: test upload */
if (import.meta.main) {
  console.log("Testing R2 connection...");
  await ensureBucketChirho();
  console.log("R2 bucket ready.");
}
