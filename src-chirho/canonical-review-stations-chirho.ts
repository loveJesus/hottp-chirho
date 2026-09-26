// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Read the standing record of WHERE the canonical human-review stations live.
 *
 * A write lease authorizes one sync-out window; this record instead answers the
 * steady-state question the health check needs: should `review-servers-chirho
 * --check-chirho` probe localhost, or the deployed stations behind Caddy basic
 * auth? Without it the certification bundle stays permanently red whenever the
 * VPS owns human-review writes, which trains everyone to ignore a red bundle.
 *
 * Part of the reviewer deployment workflow documented in
 * `spec-chirho/reviewer-deployment-chirho/human-review-vps-boundary-2026-07-02-chirho.md`.
 */

import { readFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import type { ReviewServerKeyChirho } from "./review-server-health-chirho.ts";

export const CANONICAL_REVIEW_STATIONS_RELATIVE_PATH_CHIRHO =
  "spec-chirho/reviewer-deployment-chirho/human-review-canonical-stations-chirho.json";

export const CANONICAL_REVIEW_STATIONS_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  CANONICAL_REVIEW_STATIONS_RELATIVE_PATH_CHIRHO
);

export type CanonicalReviewLocationChirho = "local-chirho" | "vps-chirho";

export type CanonicalReviewCredentialChirho = "review-basic-auth-chirho" | "approval-basic-auth-chirho";

export interface CanonicalReviewStationChirho {
  keyChirho: ReviewServerKeyChirho;
  labelChirho: string;
  urlChirho: string;
  credentialChirho: CanonicalReviewCredentialChirho;
}

export interface CanonicalReviewStationsChirho {
  schemaVersionChirho: 1;
  canonicalLocationChirho: CanonicalReviewLocationChirho;
  recordedAtChirho: string;
  recordedByChirho: string;
  authorizationReferenceChirho: string;
  writerHostChirho: string | null;
  notesChirho: string;
  stationsChirho: CanonicalReviewStationChirho[];
}

export interface CanonicalReviewCredentialValueChirho {
  userChirho: string;
  passwordChirho: string;
}

const VALID_LOCATIONS_CHIRHO: readonly CanonicalReviewLocationChirho[] = ["local-chirho", "vps-chirho"];

const VALID_CREDENTIALS_CHIRHO: readonly CanonicalReviewCredentialChirho[] = [
  "review-basic-auth-chirho",
  "approval-basic-auth-chirho",
];

const VALID_STATION_KEYS_CHIRHO: readonly ReviewServerKeyChirho[] = [
  "raw-hebrew-chirho",
  "latin-symbol-chirho",
  "expert-non-latin-chirho",
  "segment-repair-approval-chirho",
];

const CREDENTIAL_ENV_NAMES_CHIRHO: Record<
  CanonicalReviewCredentialChirho,
  { userEnvChirho: string; passwordEnvChirho: string }
> = {
  "review-basic-auth-chirho": {
    userEnvChirho: "HOTTP_REVIEW_BASIC_AUTH_USER_CHIRHO",
    passwordEnvChirho: "HOTTP_REVIEW_BASIC_AUTH_PASSWORD_CHIRHO",
  },
  "approval-basic-auth-chirho": {
    userEnvChirho: "HOTTP_APPROVAL_USER_CHIRHO",
    passwordEnvChirho: "HOTTP_APPROVAL_PASSWORD_CHIRHO",
  },
};

function requiredStringChirho(recordChirho: Record<string, unknown>, fieldChirho: string): string {
  const valueChirho = recordChirho[fieldChirho];
  if (typeof valueChirho !== "string" || valueChirho.trim().length === 0) {
    throw new Error(`${fieldChirho} must be a non-empty string`);
  }
  return valueChirho;
}

function assertHttpsStationUrlChirho(urlTextChirho: string, keyChirho: string): string {
  let parsedChirho: URL;
  try {
    parsedChirho = new URL(urlTextChirho);
  } catch {
    throw new Error(`station ${keyChirho} url_chirho is not a valid URL`);
  }
  if (parsedChirho.protocol !== "https:") {
    throw new Error(`station ${keyChirho} url_chirho must use https so basic-auth credentials are never sent in the clear`);
  }
  if (parsedChirho.username.length > 0 || parsedChirho.password.length > 0) {
    throw new Error(`station ${keyChirho} url_chirho must not embed credentials`);
  }
  return parsedChirho.toString();
}

function parseStationChirho(rawStationChirho: unknown, indexChirho: number): CanonicalReviewStationChirho {
  if (rawStationChirho === null || typeof rawStationChirho !== "object" || Array.isArray(rawStationChirho)) {
    throw new Error(`stations_chirho[${indexChirho}] must be an object`);
  }
  const recordChirho = rawStationChirho as Record<string, unknown>;
  const keyTextChirho = requiredStringChirho(recordChirho, "key_chirho");
  if (!VALID_STATION_KEYS_CHIRHO.includes(keyTextChirho as ReviewServerKeyChirho)) {
    throw new Error(`stations_chirho[${indexChirho}] key_chirho ${keyTextChirho} is not a known review server key`);
  }
  const credentialTextChirho = requiredStringChirho(recordChirho, "credential_chirho");
  if (!VALID_CREDENTIALS_CHIRHO.includes(credentialTextChirho as CanonicalReviewCredentialChirho)) {
    throw new Error(`stations_chirho[${indexChirho}] credential_chirho ${credentialTextChirho} is not a known credential set`);
  }
  const keyChirho = keyTextChirho as ReviewServerKeyChirho;
  return {
    keyChirho,
    labelChirho: requiredStringChirho(recordChirho, "label_chirho"),
    urlChirho: assertHttpsStationUrlChirho(requiredStringChirho(recordChirho, "url_chirho"), keyChirho),
    credentialChirho: credentialTextChirho as CanonicalReviewCredentialChirho,
  };
}

/**
 * Validate a parsed canonical-stations record. Throws with a specific reason on
 * any malformed field so a broken record fails the gate instead of quietly
 * degrading it to "nothing to check".
 */
export function parseCanonicalReviewStationsChirho(rawChirho: unknown): CanonicalReviewStationsChirho {
  if (rawChirho === null || typeof rawChirho !== "object" || Array.isArray(rawChirho)) {
    throw new Error("canonical review stations record must be a JSON object");
  }
  const recordChirho = rawChirho as Record<string, unknown>;
  if (recordChirho.schema_version_chirho !== 1) {
    throw new Error("schema_version_chirho must be 1");
  }
  const locationTextChirho = requiredStringChirho(recordChirho, "canonical_location_chirho");
  if (!VALID_LOCATIONS_CHIRHO.includes(locationTextChirho as CanonicalReviewLocationChirho)) {
    throw new Error(`canonical_location_chirho ${locationTextChirho} must be one of ${VALID_LOCATIONS_CHIRHO.join(", ")}`);
  }
  const rawStationsChirho = recordChirho.stations_chirho;
  if (!Array.isArray(rawStationsChirho)) {
    throw new Error("stations_chirho must be an array");
  }
  const stationsChirho = rawStationsChirho.map((rawStationChirho, indexChirho) =>
    parseStationChirho(rawStationChirho, indexChirho)
  );
  const seenKeysChirho = new Set<string>();
  for (const stationChirho of stationsChirho) {
    if (seenKeysChirho.has(stationChirho.keyChirho)) {
      throw new Error(`stations_chirho lists ${stationChirho.keyChirho} more than once`);
    }
    seenKeysChirho.add(stationChirho.keyChirho);
  }
  const locationChirho = locationTextChirho as CanonicalReviewLocationChirho;
  if (locationChirho === "vps-chirho") {
    const missingKeysChirho = VALID_STATION_KEYS_CHIRHO.filter((keyChirho) => !seenKeysChirho.has(keyChirho));
    if (missingKeysChirho.length > 0) {
      throw new Error(
        `canonical_location_chirho vps-chirho requires every station to be listed; missing ${missingKeysChirho.join(", ")}`
      );
    }
  }
  const writerHostValueChirho = recordChirho.writer_host_chirho;
  if (writerHostValueChirho !== null && writerHostValueChirho !== undefined && typeof writerHostValueChirho !== "string") {
    throw new Error("writer_host_chirho must be a string or null");
  }
  return {
    schemaVersionChirho: 1,
    canonicalLocationChirho: locationChirho,
    recordedAtChirho: requiredStringChirho(recordChirho, "recorded_at_chirho"),
    recordedByChirho: requiredStringChirho(recordChirho, "recorded_by_chirho"),
    authorizationReferenceChirho: requiredStringChirho(recordChirho, "authorization_reference_chirho"),
    writerHostChirho: typeof writerHostValueChirho === "string" ? writerHostValueChirho : null,
    notesChirho: requiredStringChirho(recordChirho, "notes_chirho"),
    stationsChirho,
  };
}

/**
 * Read and validate the committed canonical-stations record. A missing record
 * means the workstation owns the stations, which is the historical default.
 */
export function readCanonicalReviewStationsChirho(
  pathChirho: string = CANONICAL_REVIEW_STATIONS_PATH_CHIRHO
): CanonicalReviewStationsChirho {
  let rawTextChirho: string;
  try {
    rawTextChirho = readFileSync(pathChirho, "utf8");
  } catch {
    return {
      schemaVersionChirho: 1,
      canonicalLocationChirho: "local-chirho",
      recordedAtChirho: "",
      recordedByChirho: "",
      authorizationReferenceChirho: "",
      writerHostChirho: null,
      notesChirho: "No canonical review stations record on disk; defaulting to local workstation stations.",
      stationsChirho: [],
    };
  }
  let parsedJsonChirho: unknown;
  try {
    parsedJsonChirho = JSON.parse(rawTextChirho);
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    throw new Error(`${CANONICAL_REVIEW_STATIONS_RELATIVE_PATH_CHIRHO} is not valid JSON: ${messageChirho}`);
  }
  try {
    return parseCanonicalReviewStationsChirho(parsedJsonChirho);
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    throw new Error(`${CANONICAL_REVIEW_STATIONS_RELATIVE_PATH_CHIRHO} is malformed: ${messageChirho}`);
  }
}

export function canonicalReviewCredentialEnvNamesChirho(credentialChirho: CanonicalReviewCredentialChirho): {
  userEnvChirho: string;
  passwordEnvChirho: string;
} {
  return CREDENTIAL_ENV_NAMES_CHIRHO[credentialChirho];
}

/**
 * Resolve a station credential from the environment. Returns null when either
 * half is absent so callers fail loudly rather than probing unauthenticated.
 */
export function canonicalReviewCredentialValueChirho(
  credentialChirho: CanonicalReviewCredentialChirho,
  envChirho: Record<string, string | undefined> = process.env
): CanonicalReviewCredentialValueChirho | null {
  const namesChirho = canonicalReviewCredentialEnvNamesChirho(credentialChirho);
  const userChirho = envChirho[namesChirho.userEnvChirho];
  const passwordChirho = envChirho[namesChirho.passwordEnvChirho];
  if (typeof userChirho !== "string" || userChirho.length === 0) return null;
  if (typeof passwordChirho !== "string" || passwordChirho.length === 0) return null;
  return { userChirho, passwordChirho };
}

export function canonicalReviewBasicAuthHeaderChirho(valueChirho: CanonicalReviewCredentialValueChirho): string {
  return `Basic ${Buffer.from(`${valueChirho.userChirho}:${valueChirho.passwordChirho}`, "utf8").toString("base64")}`;
}

/** The port each station listens on when the workstation runs the fleet. */
export const LOCAL_REVIEW_STATION_PORTS_CHIRHO: Readonly<Record<ReviewServerKeyChirho, number>> = {
  "raw-hebrew-chirho": 8766,
  "latin-symbol-chirho": 8770,
  "expert-non-latin-chirho": 8771,
  "segment-repair-approval-chirho": 8772,
};

export interface CanonicalReviewFetchTargetChirho {
  urlChirho: string;
  headersChirho: Record<string, string>;
}

/**
 * Where a localhost review URL is actually served right now. Generated reports
 * keep localhost-shaped links; while a deployed fleet is canonical, the same
 * path and query are served by the deployed station behind basic auth, so a
 * check that fetches report links must follow the record rather than assume
 * the workstation is running the stations.
 */
export function canonicalReviewFetchTargetChirho(
  localUrlChirho: URL,
  recordChirho: CanonicalReviewStationsChirho = readCanonicalReviewStationsChirho(),
  envChirho: Record<string, string | undefined> = process.env
): CanonicalReviewFetchTargetChirho {
  if (recordChirho.canonicalLocationChirho === "local-chirho") {
    return { urlChirho: localUrlChirho.href, headersChirho: {} };
  }
  const portChirho = Number(localUrlChirho.port);
  const keyChirho = (Object.keys(LOCAL_REVIEW_STATION_PORTS_CHIRHO) as ReviewServerKeyChirho[]).find(
    (candidateChirho) => LOCAL_REVIEW_STATION_PORTS_CHIRHO[candidateChirho] === portChirho
  );
  const stationChirho = recordChirho.stationsChirho.find((candidateChirho) => candidateChirho.keyChirho === keyChirho);
  if (keyChirho === undefined || stationChirho === undefined) {
    throw new Error(`no canonical deployed station serves local port ${localUrlChirho.port} (${localUrlChirho.href})`);
  }
  const credentialChirho = canonicalReviewCredentialValueChirho(stationChirho.credentialChirho, envChirho);
  if (credentialChirho === null) {
    const namesChirho = canonicalReviewCredentialEnvNamesChirho(stationChirho.credentialChirho);
    throw new Error(`${stationChirho.labelChirho} needs ${namesChirho.userEnvChirho} and ${namesChirho.passwordEnvChirho} in .env`);
  }
  return {
    urlChirho: new URL(`${localUrlChirho.pathname}${localUrlChirho.search}`, stationChirho.urlChirho).href,
    headersChirho: { Authorization: canonicalReviewBasicAuthHeaderChirho(credentialChirho) },
  };
}
