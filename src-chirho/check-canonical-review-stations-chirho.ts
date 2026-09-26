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

import { Database } from "bun:sqlite";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import {
  CANONICAL_REVIEW_STATIONS_PATH_CHIRHO,
  CANONICAL_REVIEW_STATIONS_RELATIVE_PATH_CHIRHO,
  canonicalReviewBasicAuthHeaderChirho,
  canonicalReviewCredentialEnvNamesChirho,
  canonicalReviewCredentialValueChirho,
  canonicalReviewFetchTargetChirho,
  parseCanonicalReviewStationsChirho,
  readCanonicalReviewStationsChirho,
} from "./canonical-review-stations-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  LOCAL_D1_AUDIT_RELATIVE_DIR_CHIRHO,
  latestLocalD1PathChirho,
  openLocalD1ReadonlyChirho,
} from "./d1-audit-fingerprint-chirho.ts";

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

function throwsChirho(labelChirho: string, actionChirho: () => unknown, expectedFragmentChirho: string): void {
  try {
    actionChirho();
    failuresChirho.push(`${labelChirho}: did not throw`);
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    if (!messageChirho.includes(expectedFragmentChirho)) {
      failuresChirho.push(`${labelChirho}: threw "${messageChirho}", expected to mention "${expectedFragmentChirho}"`);
    }
  }
}

/**
 * Report links stay localhost-shaped; checks that fetch them must follow the
 * canonical record. Pin the mapping: same path and query, the deployed host,
 * the right credential set, and loud failures instead of unauthenticated or
 * wrong-host fetches.
 */
function checkFetchTargetChirho(): void {
  const vpsChirho = parseCanonicalReviewStationsChirho(validRecordChirho());
  const localChirho = parseCanonicalReviewStationsChirho({ ...validRecordChirho(), canonical_location_chirho: "local-chirho", stations_chirho: [] });
  const envChirho = {
    HOTTP_REVIEW_BASIC_AUTH_USER_CHIRHO: "reviewer-chirho",
    HOTTP_REVIEW_BASIC_AUTH_PASSWORD_CHIRHO: "review-password-chirho",
    HOTTP_APPROVAL_USER_CHIRHO: "approver-chirho",
    HOTTP_APPROVAL_PASSWORD_CHIRHO: "approval-password-chirho",
  };
  const rawLinkChirho = new URL("http://localhost:8766/?validation-status-chirho=unvalidated-chirho&item-chirho=3%3A151%3A36%3A2");

  const localTargetChirho = canonicalReviewFetchTargetChirho(rawLinkChirho, localChirho, envChirho);
  checkChirho("local record fetches the link unchanged", localTargetChirho.urlChirho === rawLinkChirho.href);
  checkChirho("local record sends no credentials", Object.keys(localTargetChirho.headersChirho).length === 0);

  const rawTargetChirho = canonicalReviewFetchTargetChirho(rawLinkChirho, vpsChirho, envChirho);
  checkChirho(
    "deployed record keeps the path and query on the deployed host",
    rawTargetChirho.urlChirho === "https://raw-hebrew-chirho.example/?validation-status-chirho=unvalidated-chirho&item-chirho=3%3A151%3A36%3A2"
  );
  checkChirho(
    "deployed review station uses the review credential",
    rawTargetChirho.headersChirho.Authorization === canonicalReviewBasicAuthHeaderChirho({ userChirho: "reviewer-chirho", passwordChirho: "review-password-chirho" })
  );
  const approvalTargetChirho = canonicalReviewFetchTargetChirho(new URL("http://localhost:8772/"), vpsChirho, envChirho);
  checkChirho(
    "deployed approval station uses the approval credential",
    approvalTargetChirho.urlChirho === "https://segment-repair-approval-chirho.example/" &&
      approvalTargetChirho.headersChirho.Authorization === canonicalReviewBasicAuthHeaderChirho({ userChirho: "approver-chirho", passwordChirho: "approval-password-chirho" })
  );
  throwsChirho("an unknown local port fails loudly", () => canonicalReviewFetchTargetChirho(new URL("http://localhost:9999/"), vpsChirho, envChirho), "no canonical deployed station serves local port 9999");
  throwsChirho("missing credentials fail instead of fetching unauthenticated", () => canonicalReviewFetchTargetChirho(rawLinkChirho, vpsChirho, {}), "HOTTP_REVIEW_BASIC_AUTH_USER_CHIRHO");
}

function sidecarsOfChirho(dbPathChirho: string): string[] {
  return ["-wal", "-shm", "-journal"].filter((suffixChirho) => existsSync(`${dbPathChirho}${suffixChirho}`));
}

/**
 * Sync-out ships the audit database as a bare WAL-mode file, which is also the
 * state Miniflare leaves it in locally. A plain read-only open cannot read that
 * state, so prove the shared opener does, first on a disposable database closed
 * into exactly that state and then on the real witness, without creating any
 * sidecar on either.
 */
function checkShippedWitnessReadableChirho(): void {
  const tempDirChirho = mkdtempSync(join(tmpdir(), "witness-open-guard-chirho-"));
  try {
    const fixturePathChirho = join(tempDirChirho, "wal-without-sidecars-chirho.sqlite");
    const writerChirho = new Database(fixturePathChirho);
    writerChirho.exec("PRAGMA journal_mode = WAL");
    writerChirho.exec("CREATE TABLE pages_chirho (id_chirho INTEGER PRIMARY KEY, label_chirho TEXT NOT NULL)");
    writerChirho.exec("INSERT INTO pages_chirho (label_chirho) VALUES ('first-chirho'), ('second-chirho')");
    writerChirho.exec("PRAGMA wal_checkpoint(TRUNCATE)");
    writerChirho.close();
    // Bun keeps a checkpointed, empty -wal and the -shm after close; Miniflare
    // deletes them. Remove them only once the WAL is proven empty, so the
    // fixture holds every commit in the main file exactly as the witness does.
    const walPathChirho = `${fixturePathChirho}-wal`;
    checkChirho("fixture WAL is fully checkpointed before its sidecars are removed", !existsSync(walPathChirho) || statSync(walPathChirho).size === 0);
    rmSync(walPathChirho, { force: true });
    rmSync(`${fixturePathChirho}-shm`, { force: true });
    const headerChirho = readFileSync(fixturePathChirho).subarray(18, 20);
    checkChirho(
      "fixture is a WAL-mode file with no sidecars",
      headerChirho[0] === 2 && headerChirho[1] === 2 && sidecarsOfChirho(fixturePathChirho).length === 0
    );
    try {
      const readerChirho = openLocalD1ReadonlyChirho(fixturePathChirho);
      try {
        const rowChirho = readerChirho.query("SELECT count(*) AS count_chirho FROM pages_chirho").get() as { count_chirho: number };
        checkChirho("shared opener reads a WAL-mode database with no sidecars", rowChirho.count_chirho === 2);
      } finally {
        readerChirho.close();
      }
    } catch (errorChirho) {
      const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
      failuresChirho.push(`shared opener cannot read a WAL-mode database with no sidecars: ${messageChirho}`);
    }
    checkChirho("shared opener leaves the fixture without sidecars", sidecarsOfChirho(fixturePathChirho).length === 0);
  } finally {
    rmSync(tempDirChirho, { recursive: true, force: true });
  }

  const witnessPathChirho = latestLocalD1PathChirho();
  if (witnessPathChirho === null) return;
  const sidecarsBeforeChirho = sidecarsOfChirho(witnessPathChirho).join(",");
  try {
    const witnessChirho = openLocalD1ReadonlyChirho(witnessPathChirho);
    try {
      const countsChirho = witnessChirho
        .query(
          `SELECT (SELECT count(*) FROM pages_chirho) AS pages_chirho,
                  (SELECT count(*) FROM words_chirho) AS words_chirho`
        )
        .get() as { pages_chirho: number; words_chirho: number };
      checkChirho("the local audit database opens read-only with pages and words", countsChirho.pages_chirho > 0 && countsChirho.words_chirho > 0);
    } finally {
      witnessChirho.close();
    }
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    failuresChirho.push(`the local audit database cannot be opened read-only: ${messageChirho}`);
  }
  checkChirho(
    "reading the local audit database changes none of its sidecars",
    sidecarsOfChirho(witnessPathChirho).join(",") === sidecarsBeforeChirho
  );
}

function mainChirho(): void {
  checkParserChirho();
  checkCommittedRecordChirho();
  checkSyncCarriesD1AuditDbChirho();
  checkShippedWitnessReadableChirho();
  checkFetchTargetChirho();
  if (failuresChirho.length > 0) {
    console.error(`[${MODULE_CHIRHO}] ${failuresChirho.length} failure(s):`);
    for (const failureChirho of failuresChirho) console.error(`- ${failureChirho}`);
    process.exit(1);
  }
  console.log(`[${MODULE_CHIRHO}] canonical review station, fetch-target, sync-inclusion and witness-readability guards passed`);
}

mainChirho();
