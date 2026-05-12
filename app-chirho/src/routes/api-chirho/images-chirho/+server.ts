// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import type { RequestHandler } from "./$types";

/** Serve images from R2 by key */
export const GET: RequestHandler = async ({ url, platform }) => {
  const keyChirho = url.searchParams.get("key-chirho");
  if (!keyChirho) {
    return new Response("Missing key-chirho parameter", { status: 400 });
  }

  const r2Chirho = platform?.env?.R2_CHIRHO;
  if (!r2Chirho) {
    return new Response("R2 not configured", { status: 500 });
  }

  const objectChirho = await r2Chirho.get(keyChirho);
  if (!objectChirho) {
    return new Response("Image not found", { status: 404 });
  }

  return new Response(objectChirho.body, {
    headers: {
      "Content-Type": objectChirho.httpMetadata?.contentType ?? "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
