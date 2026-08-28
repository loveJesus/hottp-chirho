// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Start or check the three browser review stations on their standard ports.
 *
 * This launcher intentionally does not pass --db or --backup overrides. The
 * individual review servers therefore use the real progress DB and durable
 * committable backup files.
 */

import {
  canonicalReviewBasicAuthHeaderChirho,
  canonicalReviewCredentialEnvNamesChirho,
  canonicalReviewCredentialValueChirho,
  readCanonicalReviewStationsChirho,
  CANONICAL_REVIEW_STATIONS_RELATIVE_PATH_CHIRHO,
  type CanonicalReviewStationChirho,
} from "./canonical-review-stations-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  reviewServerHeadersHaveNoStoreChirho,
  reviewServerSourceFingerprintChirho,
  type ReviewServerHealthChirho,
  type ReviewServerKeyChirho,
} from "./review-server-health-chirho.ts";

const MODULE_CHIRHO = "review-servers-chirho";
const CHECK_TIMEOUT_MS_CHIRHO = 3000;
const DEPLOYED_CHECK_TIMEOUT_MS_CHIRHO = 10000;
const START_TIMEOUT_MS_CHIRHO = 8000;

interface ReviewServerChirho {
  keyChirho: ReviewServerKeyChirho;
  labelChirho: string;
  portChirho: number;
  scriptPathChirho: string;
  probePathsChirho: string[];
}

interface ProbeTargetChirho {
  keyChirho: ReviewServerKeyChirho;
  labelChirho: string;
  baseUrlChirho: string;
  probePathsChirho: string[];
  authHeaderChirho: string | null;
}

interface ServerCheckChirho {
  targetChirho: ProbeTargetChirho;
  runningChirho: boolean;
  statusChirho: number | null;
  errorChirho: string | null;
  checkedUrlsChirho: string[];
  portRespondedChirho: boolean;
  staleSameServiceChirho: boolean;
  sourceFingerprintChirho: string | null;
  expectedSourceFingerprintChirho: string | null;
}

interface FetchedReviewServerHealthChirho {
  healthChirho: ReviewServerHealthChirho;
  noStoreChirho: boolean;
}

const REVIEW_SERVERS_CHIRHO: ReviewServerChirho[] = [
  {
    keyChirho: "raw-hebrew-chirho",
    labelChirho: "Raw Hebrew live validator",
    portChirho: 8766,
    scriptPathChirho: "src-chirho/pass-c-human-validate-server-chirho.ts",
    probePathsChirho: ["/", "/api-chirho/validations-chirho"],
  },
  {
    keyChirho: "latin-symbol-chirho",
    labelChirho: "Latin/symbol live reviewer",
    portChirho: 8770,
    scriptPathChirho: "src-chirho/latin-symbol-vision-review-server-chirho.ts",
    probePathsChirho: ["/", "/api-chirho/state-chirho"],
  },
  {
    keyChirho: "expert-non-latin-chirho",
    labelChirho: "Expert non-Latin live reviewer",
    portChirho: 8771,
    scriptPathChirho: "src-chirho/vision-tier-expert-review-server-chirho.ts",
    probePathsChirho: ["/", "/api-chirho/state-chirho"],
  },
];

function usageChirho(): string {
  return [
    `Usage: bun run review-servers-chirho [--check-chirho] [--restart-stale-chirho] [--local-writer-anyway-chirho]`,
    "",
    "Default mode starts any missing standard review servers and keeps this process open.",
    `Check mode reports whether the canonical review stations respond, without starting anything; ${CANONICAL_REVIEW_STATIONS_RELATIVE_PATH_CHIRHO} decides whether that means localhost or the deployed fleet.`,
    "Local-writer-anyway mode starts local writers even while a deployed fleet is the recorded canonical writer.",
    "Restart-stale mode may stop a responding stale server only when its health endpoint identifies it as the same review service.",
  ].join("\n");
}

function localTargetChirho(serviceChirho: ReviewServerChirho): ProbeTargetChirho {
  return {
    keyChirho: serviceChirho.keyChirho,
    labelChirho: serviceChirho.labelChirho,
    baseUrlChirho: `http://localhost:${serviceChirho.portChirho}/`,
    probePathsChirho: serviceChirho.probePathsChirho,
    authHeaderChirho: null,
  };
}

/**
 * Build a probe target for a deployed station. Missing credentials are an
 * error rather than an unauthenticated probe, because a 401 would otherwise
 * read as "station down" and hide the real cause.
 */
function deployedTargetChirho(stationChirho: CanonicalReviewStationChirho): ProbeTargetChirho {
  const credentialChirho = canonicalReviewCredentialValueChirho(stationChirho.credentialChirho);
  if (credentialChirho === null) {
    const namesChirho = canonicalReviewCredentialEnvNamesChirho(stationChirho.credentialChirho);
    throw new Error(
      `${stationChirho.labelChirho} needs ${namesChirho.userEnvChirho} and ${namesChirho.passwordEnvChirho} in .env to probe ${stationChirho.urlChirho}`
    );
  }
  const localServiceChirho = REVIEW_SERVERS_CHIRHO.find((serviceChirho) => serviceChirho.keyChirho === stationChirho.keyChirho);
  return {
    keyChirho: stationChirho.keyChirho,
    labelChirho: stationChirho.labelChirho,
    baseUrlChirho: stationChirho.urlChirho,
    probePathsChirho: localServiceChirho?.probePathsChirho ?? ["/"],
    authHeaderChirho: canonicalReviewBasicAuthHeaderChirho(credentialChirho),
  };
}

function targetProbeUrlChirho(targetChirho: ProbeTargetChirho, probePathChirho: string): string {
  return new URL(probePathChirho, targetChirho.baseUrlChirho).toString();
}

function targetRequestInitChirho(targetChirho: ProbeTargetChirho, signalChirho: AbortSignal): RequestInit {
  return {
    signal: signalChirho,
    ...(targetChirho.authHeaderChirho === null ? {} : { headers: { Authorization: targetChirho.authHeaderChirho } }),
  };
}

async function fetchServerHealthChirho(
  targetChirho: ProbeTargetChirho,
  timeoutMsChirho: number
): Promise<FetchedReviewServerHealthChirho> {
  const abortControllerChirho = new AbortController();
  const timeoutChirho = setTimeout(() => abortControllerChirho.abort(), timeoutMsChirho);
  try {
    const responseChirho = await fetch(
      targetProbeUrlChirho(targetChirho, "/api-chirho/server-health-chirho"),
      targetRequestInitChirho(targetChirho, abortControllerChirho.signal)
    );
    if (!responseChirho.ok) throw new Error(`HTTP ${responseChirho.status}`);
    return {
      healthChirho: (await responseChirho.json()) as ReviewServerHealthChirho,
      noStoreChirho: reviewServerHeadersHaveNoStoreChirho(responseChirho.headers),
    };
  } finally {
    clearTimeout(timeoutChirho);
  }
}

async function checkTargetChirho(targetChirho: ProbeTargetChirho, timeoutMsChirho = CHECK_TIMEOUT_MS_CHIRHO): Promise<ServerCheckChirho> {
  const checkedUrlsChirho: string[] = [];
  let noStoreErrorChirho: string | null = null;
  for (const probePathChirho of targetChirho.probePathsChirho) {
    const probeUrlChirho = targetProbeUrlChirho(targetChirho, probePathChirho);
    checkedUrlsChirho.push(probeUrlChirho);
    const abortControllerChirho = new AbortController();
    const timeoutChirho = setTimeout(() => abortControllerChirho.abort(), timeoutMsChirho);
    try {
      const responseChirho = await fetch(probeUrlChirho, targetRequestInitChirho(targetChirho, abortControllerChirho.signal));
      if (!responseChirho.ok) {
        return {
          targetChirho,
          runningChirho: false,
          statusChirho: responseChirho.status,
          errorChirho: `${probePathChirho} HTTP ${responseChirho.status}`,
          checkedUrlsChirho,
          portRespondedChirho: true,
          staleSameServiceChirho: false,
          sourceFingerprintChirho: null,
          expectedSourceFingerprintChirho: null,
        };
      }
      if (!reviewServerHeadersHaveNoStoreChirho(responseChirho.headers)) {
        noStoreErrorChirho ??= `${probePathChirho} missing no-store cache control`;
      }
    } catch (errorChirho) {
      const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
      return {
        targetChirho,
        runningChirho: false,
        statusChirho: null,
        errorChirho: `${probePathChirho} ${messageChirho}`,
        checkedUrlsChirho,
        portRespondedChirho: false,
        staleSameServiceChirho: false,
        sourceFingerprintChirho: null,
        expectedSourceFingerprintChirho: null,
      };
    } finally {
      clearTimeout(timeoutChirho);
    }
  }
  const expectedFingerprintChirho = reviewServerSourceFingerprintChirho(targetChirho.keyChirho);
  const healthUrlChirho = targetProbeUrlChirho(targetChirho, "/api-chirho/server-health-chirho");
  checkedUrlsChirho.push(healthUrlChirho);
  try {
    const healthResultChirho = await fetchServerHealthChirho(targetChirho, timeoutMsChirho);
    const healthChirho = healthResultChirho.healthChirho;
    const staleSameServiceChirho =
      healthChirho.schemaVersionChirho === 1 &&
      healthChirho.keyChirho === targetChirho.keyChirho;
    if (!healthResultChirho.noStoreChirho) {
      noStoreErrorChirho ??= "/api-chirho/server-health-chirho missing no-store cache control";
    }
    if (noStoreErrorChirho !== null) {
      return {
        targetChirho,
        runningChirho: false,
        statusChirho: 200,
        errorChirho: noStoreErrorChirho,
        checkedUrlsChirho,
        portRespondedChirho: true,
        staleSameServiceChirho,
        sourceFingerprintChirho: healthChirho.sourceFingerprintChirho ?? null,
        expectedSourceFingerprintChirho: expectedFingerprintChirho.sourceFingerprintChirho,
      };
    }
    if (
      healthChirho.schemaVersionChirho !== 1 ||
      healthChirho.keyChirho !== targetChirho.keyChirho ||
      healthChirho.sourceFingerprintChirho !== expectedFingerprintChirho.sourceFingerprintChirho ||
      healthChirho.sourceFileCountChirho !== expectedFingerprintChirho.sourceFileCountChirho
    ) {
      return {
        targetChirho,
        runningChirho: false,
        statusChirho: 200,
        errorChirho:
          `/api-chirho/server-health-chirho source fingerprint mismatch` +
          ` current=${expectedFingerprintChirho.sourceFingerprintChirho.slice(0, 12)}` +
          ` server=${String(healthChirho.sourceFingerprintChirho ?? "").slice(0, 12)}`,
        checkedUrlsChirho,
        portRespondedChirho: true,
        staleSameServiceChirho,
        sourceFingerprintChirho: healthChirho.sourceFingerprintChirho ?? null,
        expectedSourceFingerprintChirho: expectedFingerprintChirho.sourceFingerprintChirho,
      };
    }
    return {
      targetChirho,
      runningChirho: true,
      statusChirho: 200,
      errorChirho: null,
      checkedUrlsChirho,
      portRespondedChirho: true,
      staleSameServiceChirho: false,
      sourceFingerprintChirho: healthChirho.sourceFingerprintChirho,
      expectedSourceFingerprintChirho: expectedFingerprintChirho.sourceFingerprintChirho,
    };
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    return {
      targetChirho,
      runningChirho: false,
      statusChirho: null,
      errorChirho: `/api-chirho/server-health-chirho ${messageChirho}`,
      checkedUrlsChirho,
      portRespondedChirho: true,
      staleSameServiceChirho: false,
      sourceFingerprintChirho: null,
      expectedSourceFingerprintChirho: expectedFingerprintChirho.sourceFingerprintChirho,
    };
  }
}

async function checkServerChirho(serviceChirho: ReviewServerChirho, timeoutMsChirho = CHECK_TIMEOUT_MS_CHIRHO): Promise<ServerCheckChirho> {
  return checkTargetChirho(localTargetChirho(serviceChirho), timeoutMsChirho);
}

async function waitForServerChirho(serviceChirho: ReviewServerChirho): Promise<ServerCheckChirho> {
  const deadlineChirho = Date.now() + START_TIMEOUT_MS_CHIRHO;
  let lastCheckChirho = await checkServerChirho(serviceChirho);
  while (!lastCheckChirho.runningChirho && Date.now() < deadlineChirho) {
    await new Promise((resolveChirho) => setTimeout(resolveChirho, 250));
    lastCheckChirho = await checkServerChirho(serviceChirho);
  }
  return lastCheckChirho;
}

function localServerUrlChirho(serviceChirho: ReviewServerChirho): string {
  return `http://localhost:${serviceChirho.portChirho}/`;
}

function printCheckChirho(checkChirho: ServerCheckChirho): void {
  const urlChirho = checkChirho.targetChirho.baseUrlChirho;
  if (checkChirho.runningChirho) {
    console.log(
      `[${MODULE_CHIRHO}] ok ${checkChirho.targetChirho.labelChirho}: ${urlChirho}` +
        ` (${checkChirho.checkedUrlsChirho.length} probe(s), source ${checkChirho.sourceFingerprintChirho?.slice(0, 12) ?? "unknown"})`
    );
    return;
  }
  console.log(
    `[${MODULE_CHIRHO}] down ${checkChirho.targetChirho.labelChirho}: ${urlChirho}` +
      (checkChirho.errorChirho === null ? "" : ` (${checkChirho.errorChirho})`)
  );
}

/**
 * Check the stations wherever they canonically live. Probing localhost while
 * the VPS owns human-review writes reports a permanent, meaningless red, so
 * the committed canonical-stations record decides which fleet is checked.
 */
async function checkAllChirho(): Promise<boolean> {
  const canonicalChirho = readCanonicalReviewStationsChirho();
  if (canonicalChirho.canonicalLocationChirho === "local-chirho") {
    console.log(`[${MODULE_CHIRHO}] canonical review stations: local workstation`);
    const checksChirho = await Promise.all(REVIEW_SERVERS_CHIRHO.map((serviceChirho) => checkServerChirho(serviceChirho)));
    for (const checkChirho of checksChirho) printCheckChirho(checkChirho);
    return checksChirho.every((checkChirho) => checkChirho.runningChirho);
  }
  console.log(
    `[${MODULE_CHIRHO}] canonical review stations: deployed` +
      (canonicalChirho.writerHostChirho === null ? "" : ` on ${canonicalChirho.writerHostChirho}`) +
      ` (recorded ${canonicalChirho.recordedAtChirho} by ${canonicalChirho.recordedByChirho})`
  );
  const targetsChirho = canonicalChirho.stationsChirho.map((stationChirho) => deployedTargetChirho(stationChirho));
  const checksChirho = await Promise.all(targetsChirho.map((targetChirho) => checkTargetChirho(targetChirho, DEPLOYED_CHECK_TIMEOUT_MS_CHIRHO)));
  for (const checkChirho of checksChirho) printCheckChirho(checkChirho);
  return checksChirho.every((checkChirho) => checkChirho.runningChirho);
}

async function pidsListeningOnPortChirho(portChirho: number): Promise<number[]> {
  const processChirho = Bun.spawn(["lsof", "-nP", `-tiTCP:${portChirho}`, "-sTCP:LISTEN"], {
    cwd: PROJECT_ROOT_CHIRHO,
    stdout: "pipe",
    stderr: "pipe",
  });
  const outputChirho = await new Response(processChirho.stdout).text();
  const exitCodeChirho = await processChirho.exited;
  if (exitCodeChirho !== 0) return [];
  return outputChirho
    .split(/\s+/)
    .map((valueChirho) => Number.parseInt(valueChirho, 10))
    .filter((pidChirho) => Number.isInteger(pidChirho) && pidChirho > 0);
}

async function waitForPortToClearChirho(serviceChirho: ReviewServerChirho): Promise<boolean> {
  const deadlineChirho = Date.now() + START_TIMEOUT_MS_CHIRHO;
  let lastCheckChirho = await checkServerChirho(serviceChirho);
  while (lastCheckChirho.portRespondedChirho && Date.now() < deadlineChirho) {
    await new Promise((resolveChirho) => setTimeout(resolveChirho, 250));
    lastCheckChirho = await checkServerChirho(serviceChirho);
  }
  return !lastCheckChirho.portRespondedChirho;
}

async function stopStaleSameServiceChirho(
  checkChirho: ServerCheckChirho,
  serviceChirho: ReviewServerChirho
): Promise<void> {
  if (!checkChirho.staleSameServiceChirho) {
    throw new Error(`${serviceChirho.labelChirho} is responding but is not a same-service stale review server; refusing to stop it`);
  }
  const pidsChirho = await pidsListeningOnPortChirho(serviceChirho.portChirho);
  if (pidsChirho.length === 0) {
    throw new Error(`${serviceChirho.labelChirho} is stale but no listening PID was found on ${localServerUrlChirho(serviceChirho)}`);
  }
  console.log(
    `[${MODULE_CHIRHO}] stopping stale ${serviceChirho.labelChirho} PID(s): ${pidsChirho.join(", ")}`
  );
  for (const pidChirho of pidsChirho) {
    process.kill(pidChirho, "SIGTERM");
  }
  const clearedChirho = await waitForPortToClearChirho(serviceChirho);
  if (!clearedChirho) {
    throw new Error(`${serviceChirho.labelChirho} did not stop cleanly on ${localServerUrlChirho(serviceChirho)}`);
  }
}

/**
 * Refuse to start local writers while a deployed fleet is the canonical writer.
 * The boundary rule is one writer at a time; two live fleets diverge the review
 * data that the sync ritual then overwrites wholesale.
 */
function assertLocalWriterAllowedChirho(optionsChirho: { localWriterAnywayChirho: boolean }): void {
  const canonicalChirho = readCanonicalReviewStationsChirho();
  if (canonicalChirho.canonicalLocationChirho === "local-chirho") return;
  if (optionsChirho.localWriterAnywayChirho) {
    console.log(
      `[${MODULE_CHIRHO}] WARNING: starting local review writers while the canonical writer is` +
        `${canonicalChirho.writerHostChirho === null ? " deployed" : ` ${canonicalChirho.writerHostChirho}`};` +
        ` reviews saved here will be overwritten by the next sync-out unless they are pulled first`
    );
    return;
  }
  throw new Error(
    `refusing to start local review writers: ${CANONICAL_REVIEW_STATIONS_RELATIVE_PATH_CHIRHO} records the canonical writer as` +
      `${canonicalChirho.writerHostChirho === null ? " a deployed fleet" : ` ${canonicalChirho.writerHostChirho}`}.` +
      ` Review on the deployed stations, or pass --local-writer-anyway-chirho if you have already taken ownership back.`
  );
}

async function startMissingServersChirho(optionsChirho: {
  restartStaleChirho: boolean;
  localWriterAnywayChirho: boolean;
}): Promise<void> {
  assertLocalWriterAllowedChirho(optionsChirho);
  const spawnedProcessesChirho: Bun.Subprocess[] = [];
  for (const serviceChirho of REVIEW_SERVERS_CHIRHO) {
    let initialCheckChirho = await checkServerChirho(serviceChirho);
    if (initialCheckChirho.runningChirho) {
      console.log(`[${MODULE_CHIRHO}] already running ${serviceChirho.labelChirho}: ${localServerUrlChirho(serviceChirho)}`);
      continue;
    }
    if (initialCheckChirho.portRespondedChirho) {
      printCheckChirho(initialCheckChirho);
      if (!optionsChirho.restartStaleChirho) {
        throw new Error(
          `${serviceChirho.labelChirho} is responding but stale or unhealthy; rerun with --restart-stale-chirho only if this is the same review service`
        );
      }
      await stopStaleSameServiceChirho(initialCheckChirho, serviceChirho);
      initialCheckChirho = await checkServerChirho(serviceChirho);
      if (initialCheckChirho.portRespondedChirho) {
        printCheckChirho(initialCheckChirho);
        throw new Error(`${serviceChirho.labelChirho} is still responding after stale restart attempt`);
      }
    }
    console.log(
      `[${MODULE_CHIRHO}] starting ${serviceChirho.labelChirho}: bun run ${serviceChirho.scriptPathChirho}`
    );
    const processChirho = Bun.spawn([process.execPath, "run", serviceChirho.scriptPathChirho], {
      cwd: PROJECT_ROOT_CHIRHO,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
    spawnedProcessesChirho.push(processChirho);
    const startedCheckChirho = await waitForServerChirho(serviceChirho);
    if (!startedCheckChirho.runningChirho) {
      printCheckChirho(startedCheckChirho);
      throw new Error(`${serviceChirho.labelChirho} did not become ready on ${localServerUrlChirho(serviceChirho)}`);
    }
    printCheckChirho(startedCheckChirho);
  }

  console.log(`[${MODULE_CHIRHO}] review URLs:`);
  for (const serviceChirho of REVIEW_SERVERS_CHIRHO) {
    console.log(`- ${serviceChirho.labelChirho}: ${localServerUrlChirho(serviceChirho)}`);
  }

  if (spawnedProcessesChirho.length === 0) return;

  const stopSpawnedChirho = (): void => {
    for (const processChirho of spawnedProcessesChirho) {
      processChirho.kill();
    }
  };
  process.on("SIGINT", () => {
    stopSpawnedChirho();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    stopSpawnedChirho();
    process.exit(143);
  });

  await Promise.all(spawnedProcessesChirho.map((processChirho) => processChirho.exited));
}

async function mainChirho(): Promise<void> {
  const argsChirho = process.argv.slice(2);
  if (argsChirho.includes("--help-chirho") || argsChirho.includes("-h")) {
    console.log(usageChirho());
    return;
  }
  const allowedArgsChirho = new Set([
    "--check-chirho",
    "--restart-stale-chirho",
    "--local-writer-anyway-chirho",
    "--help-chirho",
    "-h",
  ]);
  const unknownArgChirho = argsChirho.find((argChirho) => !allowedArgsChirho.has(argChirho));
  if (unknownArgChirho !== undefined) {
    throw new Error(`unknown argument ${unknownArgChirho}\n${usageChirho()}`);
  }
  const restartStaleChirho = argsChirho.includes("--restart-stale-chirho");
  const localWriterAnywayChirho = argsChirho.includes("--local-writer-anyway-chirho");
  if (argsChirho.includes("--check-chirho")) {
    const allRunningChirho = await checkAllChirho();
    if (!allRunningChirho) process.exitCode = 1;
    return;
  }
  await startMissingServersChirho({ restartStaleChirho, localWriterAnywayChirho });
}

mainChirho().catch((errorChirho) => {
  const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
  console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
  process.exit(1);
});
