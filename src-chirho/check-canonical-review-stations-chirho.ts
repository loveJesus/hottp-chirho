// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Guard the canonical-review-stations record and the sync rules that keep the
 * deployed stations serviceable.
 *
 * Two things are pinned here, both learned from live failures:
 *   1. A malformed location record must fail loudly. A record that silently
 *      degrades to "nothing to check" would turn the certification bundle's
 *      liveness gate back into decoration.
 *   2. The sync must carry the local D1 audit database. The Latin/symbol and
 *      expert stations derive part of their queue from it and answer HTTP 500
 *      ("packet is stale") for every request when it is missing.
 */

import { readFileSync } from "fs";

import {
  CANONICAL_REVIEW_STATIONS_PATH_CHIRHO,
  CANONICAL_REVIEW_STATIONS_RELATIVE_PATH_CHIRHO,
  canonicalReviewBasicAuthHeaderChirho,
  canonicalReviewCredentialEnvNamesChirho,
  canonicalReviewCredentialValueChirho,
  parseCanonicalReviewStationsChirho,
  readCanonicalReviewStationsChirho,
} from "./canonical-review-stations-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { LOCAL_D1_AUDIT_RELATIVE_DIR_CHIRHO } from "./d1-audit-fingerprint-chirho.ts";

const MODULE_CHIRHO = "check-canonical-review-stations-chirho";

const EXPECTED_STATION_KEYS_CHIRHO = [
  "raw-hebrew-chirho",
  "latin-symbol-chirho",
  "expert-non-latin-chirho",
  "segment-repair-approval-chirho",
] as const;

const failuresChirho: string[] = [];

function checkChirho(labelChirho: string, conditionChirho: boolean): void {
  if (!conditionChirho) failuresChirho.push(labelChirho);
}

function refusesChirho(labelChirho: string, rawChirho: unknown, expectedFragmentChirho: string): void {
  try {
    parseCanonicalReviewStationsChirho(rawChirho);
    failuresChirho.push(`${labelChirho}: accepted a record it should have refused`);
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    if (!messageChirho.includes(expectedFragmentChirho)) {
      failuresChirho.push(`${labelChirho}: refused with "${messageChirho}", expected to mention "${expectedFragmentChirho}"`);
    }
  }
}

function validRecordChirho(): Record<string, unknown> {
  return {
    schema_version_chirho: 1,
    canonical_location_chirho: "vps-chirho",
    recorded_at_chirho: "2026-08-28T00:00:00Z",
    recorded_by_chirho: "guard-chirho",
    authorization_reference_chirho: "guard-reference-chirho",
    writer_host_chirho: "203.0.113.9",
    notes_chirho: "guard fixture",
    stations_chirho: EXPECTED_STATION_KEYS_CHIRHO.map((keyChirho) => ({
      key_chirho: keyChirho,
      label_chirho: `${keyChirho} label`,
      url_chirho: `https://${keyChirho}.example/`,
      credential_chirho: keyChirho === "segment-repair-approval-chirho" ? "approval-basic-auth-chirho" : "review-basic-auth-chirho",
    })),
  };
}

function withoutStationChirho(keyChirho: string): Record<string, unknown> {
  const recordChirho = validRecordChirho();
  recordChirho.stations_chirho = (recordChirho.stations_chirho as Record<string, unknown>[]).filter(
    (stationChirho) => stationChirho.key_chirho !== keyChirho
  );
  return recordChirho;
}

function withStationFieldChirho(keyChirho: string, fieldChirho: string, valueChirho: unknown): Record<string, unknown> {
  const recordChirho = validRecordChirho();
  recordChirho.stations_chirho = (recordChirho.stations_chirho as Record<string, unknown>[]).map((stationChirho) =>
    stationChirho.key_chirho === keyChirho ? { ...stationChirho, [fieldChirho]: valueChirho } : stationChirho
  );
  return recordChirho;
}

function checkParserChirho(): void {
  const parsedChirho = parseCanonicalReviewStationsChirho(validRecordChirho());
  checkChirho("valid record keeps its location", parsedChirho.canonicalLocationChirho === "vps-chirho");
  checkChirho("valid record keeps every station", parsedChirho.stationsChirho.length === EXPECTED_STATION_KEYS_CHIRHO.length);
  checkChirho(
    "valid record normalizes station URLs",
    parsedChirho.stationsChirho.every((stationChirho) => stationChirho.urlChirho.startsWith("https://"))
  );

  refusesChirho("non-object record", "not-an-object", "must be a JSON object");
  refusesChirho("array record", [], "must be a JSON object");
  refusesChirho("wrong schema version", { ...validRecordChirho(), schema_version_chirho: 2 }, "schema_version_chirho must be 1");
  refusesChirho(
    "unknown location",
    { ...validRecordChirho(), canonical_location_chirho: "moon-chirho" },
    "must be one of"
  );
  refusesChirho("missing notes", { ...validRecordChirho(), notes_chirho: "" }, "notes_chirho must be a non-empty string");
  refusesChirho("stations not an array", { ...validRecordChirho(), stations_chirho: {} }, "stations_chirho must be an array");
  refusesChirho("unknown station key", withStationFieldChirho("raw-hebrew-chirho", "key_chirho", "made-up-chirho"), "is not a known review server key");
  refusesChirho(
    "unknown credential set",
    withStationFieldChirho("raw-hebrew-chirho", "credential_chirho", "guessed-chirho"),
    "is not a known credential set"
  );
  refusesChirho(
    "plaintext station URL",
    withStationFieldChirho("raw-hebrew-chirho", "url_chirho", "http://raw-review.example/"),
    "must use https"
  );
  refusesChirho(
    "credentials embedded in the URL",
    withStationFieldChirho("raw-hebrew-chirho", "url_chirho", "https://user:secret@raw-review.example/"),
    "must not embed credentials"
  );
  refusesChirho("unparseable station URL", withStationFieldChirho("raw-hebrew-chirho", "url_chirho", "not a url"), "is not a valid URL");
  refusesChirho("deployed record missing a station", withoutStationChirho("segment-repair-approval-chirho"), "missing segment-repair-approval-chirho");

  const duplicateChirho = validRecordChirho();
  const stationsChirho = duplicateChirho.stations_chirho as Record<string, unknown>[];
  duplicateChirho.stations_chirho = [...stationsChirho, stationsChirho[0]];
  refusesChirho("duplicate station key", duplicateChirho, "more than once");

  const localRecordChirho = { ...validRecordChirho(), canonical_location_chirho: "local-chirho", stations_chirho: [] };
  const parsedLocalChirho = parseCanonicalReviewStationsChirho(localRecordChirho);
  checkChirho("local record may list no stations", parsedLocalChirho.stationsChirho.length === 0);

  const missingFileChirho = readCanonicalReviewStationsChirho(`${CANONICAL_REVIEW_STATIONS_PATH_CHIRHO}.absent-chirho`);
  checkChirho("a missing record defaults to local stations", missingFileChirho.canonicalLocationChirho === "local-chirho");
}

function checkCommittedRecordChirho(): void {
  let rawChirho: unknown;
  try {
    rawChirho = JSON.parse(readFileSync(CANONICAL_REVIEW_STATIONS_PATH_CHIRHO, "utf8"));
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    failuresChirho.push(`${CANONICAL_REVIEW_STATIONS_RELATIVE_PATH_CHIRHO} is not readable JSON: ${messageChirho}`);
    return;
  }
  const recordChirho = parseCanonicalReviewStationsChirho(rawChirho);
  if (recordChirho.canonicalLocationChirho !== "vps-chirho") return;
  const keysChirho = new Set(recordChirho.stationsChirho.map((stationChirho) => stationChirho.keyChirho));
  for (const expectedKeyChirho of EXPECTED_STATION_KEYS_CHIRHO) {
    checkChirho(`committed record lists ${expectedKeyChirho}`, keysChirho.has(expectedKeyChirho));
  }
  for (const stationChirho of recordChirho.stationsChirho) {
    const namesChirho = canonicalReviewCredentialEnvNamesChirho(stationChirho.credentialChirho);
    const valueChirho = canonicalReviewCredentialValueChirho(stationChirho.credentialChirho);
    checkChirho(
      `${stationChirho.keyChirho} credentials present (${namesChirho.userEnvChirho} / ${namesChirho.passwordEnvChirho})`,
      valueChirho !== null
    );
  }
  const headerChirho = canonicalReviewBasicAuthHeaderChirho({ userChirho: "abc", passwordChirho: "def" });
  checkChirho("basic auth header is base64 user:password", headerChirho === `Basic ${Buffer.from("abc:def").toString("base64")}`);
}

/**
 * Pin the sync rules behaviorally: run the real command builder and assert the
 * D1 audit database is included ahead of the rules that exclude `.wrangler/`.
 */
function checkSyncCarriesD1AuditDbChirho(): void {
  const resultChirho = Bun.spawnSync(
    [process.execPath, "run", "src-chirho/sync-human-review-vps-chirho.ts", "--print-command-chirho"],
    { cwd: PROJECT_ROOT_CHIRHO }
  );
  if (resultChirho.exitCode !== 0) {
    failuresChirho.push(`sync command builder exited with code ${resultChirho.exitCode}`);
    return;
  }
  const commandChirho = new TextDecoder().decode(resultChirho.stdout);
  const sqliteIncludeChirho = `${LOCAL_D1_AUDIT_RELATIVE_DIR_CHIRHO}/*.sqlite`;
  const includeIndexChirho = commandChirho.indexOf(sqliteIncludeChirho);
  checkChirho(`sync includes ${sqliteIncludeChirho}`, includeIndexChirho >= 0);
  const wranglerDirExcludeIndexChirho = commandChirho.indexOf("'**/.wrangler/'");
  checkChirho("sync still excludes the rest of .wrangler", wranglerDirExcludeIndexChirho >= 0);
  if (includeIndexChirho >= 0 && wranglerDirExcludeIndexChirho >= 0) {
    checkChirho(
      "the D1 include precedes the .wrangler excludes so rsync's first-match-wins keeps it",
      includeIndexChirho < wranglerDirExcludeIndexChirho
    );
  }
  checkChirho("sync excludes the rest of the app .wrangler tree", commandChirho.includes("'app-chirho/.wrangler/**'"));
  checkChirho(
    "sync does not carry D1 sqlite sidecars",
    !commandChirho.includes(`${LOCAL_D1_AUDIT_RELATIVE_DIR_CHIRHO}/*.sqlite-wal`)
  );
}

function mainChirho(): void {
  checkParserChirho();
  checkCommittedRecordChirho();
  checkSyncCarriesD1AuditDbChirho();
  if (failuresChirho.length > 0) {
    console.error(`[${MODULE_CHIRHO}] ${failuresChirho.length} failure(s):`);
    for (const failureChirho of failuresChirho) console.error(`- ${failureChirho}`);
    process.exit(1);
  }
  console.log(`[${MODULE_CHIRHO}] canonical review station and sync-inclusion guards passed`);
}

mainChirho();
