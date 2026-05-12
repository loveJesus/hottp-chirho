// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { drizzle } from "drizzle-orm/d1";
import * as schemaChirho from "./schema-d1-chirho";

/** Create Drizzle D1 client from platform binding */
export function getDbChirho(d1Chirho: D1Database) {
  return drizzle(d1Chirho, { schema: schemaChirho });
}

export type DbChirho = ReturnType<typeof getDbChirho>;
