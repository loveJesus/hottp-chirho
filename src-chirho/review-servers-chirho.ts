// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Start or check the three browser review stations on their standard ports.
 *
 * This launcher intentionally does not pass --db or --backup overrides. The
 * individual review servers therefore use the real progress DB and durable
 * committable backup files.
 */

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  reviewServerSourceFingerprintChirho,
  type ReviewServerHealthChirho,
  type ReviewServerKeyChirho,
} from "./review-server-health-chirho.ts";

const MODULE_CHIRHO = "review-servers-chirho";
const CHECK_TIMEOUT_MS_CHIRHO = 3000;
const START_TIMEOUT_MS_CHIRHO = 8000;

interface ReviewServerChirho {
  keyChirho: ReviewServerKeyChirho;
  labelChirho: string;
  portChirho: number;
  scriptPathChirho: string;
  probePathsChirho: string[];
}

interface ServerCheckChirho {
  serviceChirho: ReviewServerChirho;
  runningChirho: boolean;
  statusChirho: number | null;
  errorChirho: string | null;
  checkedUrlsChirho: string[];
  portRespondedChirho: boolean;
  staleSameServiceChirho: boolean;
  sourceFingerprintChirho: string | null;
  expectedSourceFingerprintChirho: string | null;
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
    `Usage: bun run review-servers-chirho [--check-chirho] [--restart-stale-chirho]`,
    "",
    "Default mode starts any missing standard review servers and keeps this process open.",
    "Check mode reports whether the standard review servers respond, without starting anything.",
    "Restart-stale mode may stop a responding stale server only when its health endpoint identifies it as the same review service.",
  ].join("\n");
}

function serverUrlChirho(serviceChirho: ReviewServerChirho): string {
  return `http://localhost:${serviceChirho.portChirho}/`;
}

function serverProbeUrlChirho(serviceChirho: ReviewServerChirho, probePathChirho: string): string {
  return new URL(probePathChirho, serverUrlChirho(serviceChirho)).toString();
}

async function fetchServerHealthChirho(
  serviceChirho: ReviewServerChirho,
  timeoutMsChirho: number
): Promise<ReviewServerHealthChirho> {
  const abortControllerChirho = new AbortController();
  const timeoutChirho = setTimeout(() => abortControllerChirho.abort(), timeoutMsChirho);
  try {
    const responseChirho = await fetch(serverProbeUrlChirho(serviceChirho, "/api-chirho/server-health-chirho"), {
      signal: abortControllerChirho.signal,
    });
    if (!responseChirho.ok) throw new Error(`HTTP ${responseChirho.status}`);
    return (await responseChirho.json()) as ReviewServerHealthChirho;
  } finally {
    clearTimeout(timeoutChirho);
  }
}

async function checkServerChirho(serviceChirho: ReviewServerChirho, timeoutMsChirho = CHECK_TIMEOUT_MS_CHIRHO): Promise<ServerCheckChirho> {
  const checkedUrlsChirho: string[] = [];
  for (const probePathChirho of serviceChirho.probePathsChirho) {
    const probeUrlChirho = serverProbeUrlChirho(serviceChirho, probePathChirho);
    checkedUrlsChirho.push(probeUrlChirho);
    const abortControllerChirho = new AbortController();
    const timeoutChirho = setTimeout(() => abortControllerChirho.abort(), timeoutMsChirho);
    try {
      const responseChirho = await fetch(probeUrlChirho, {
        signal: abortControllerChirho.signal,
      });
      if (!responseChirho.ok) {
        return {
          serviceChirho,
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
    } catch (errorChirho) {
      const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
      return {
        serviceChirho,
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
  const expectedFingerprintChirho = reviewServerSourceFingerprintChirho(serviceChirho.keyChirho);
  const healthUrlChirho = serverProbeUrlChirho(serviceChirho, "/api-chirho/server-health-chirho");
  checkedUrlsChirho.push(healthUrlChirho);
  try {
    const healthChirho = await fetchServerHealthChirho(serviceChirho, timeoutMsChirho);
    if (
      healthChirho.schemaVersionChirho !== 1 ||
      healthChirho.keyChirho !== serviceChirho.keyChirho ||
      healthChirho.sourceFingerprintChirho !== expectedFingerprintChirho.sourceFingerprintChirho ||
      healthChirho.sourceFileCountChirho !== expectedFingerprintChirho.sourceFileCountChirho
    ) {
      const staleSameServiceChirho =
        healthChirho.schemaVersionChirho === 1 &&
        healthChirho.keyChirho === serviceChirho.keyChirho;
      return {
        serviceChirho,
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
      serviceChirho,
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
      serviceChirho,
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

async function waitForServerChirho(serviceChirho: ReviewServerChirho): Promise<ServerCheckChirho> {
  const deadlineChirho = Date.now() + START_TIMEOUT_MS_CHIRHO;
  let lastCheckChirho = await checkServerChirho(serviceChirho);
  while (!lastCheckChirho.runningChirho && Date.now() < deadlineChirho) {
    await new Promise((resolveChirho) => setTimeout(resolveChirho, 250));
    lastCheckChirho = await checkServerChirho(serviceChirho);
  }
  return lastCheckChirho;
}

function printCheckChirho(checkChirho: ServerCheckChirho): void {
  const urlChirho = serverUrlChirho(checkChirho.serviceChirho);
  if (checkChirho.runningChirho) {
    console.log(
      `[${MODULE_CHIRHO}] ok ${checkChirho.serviceChirho.labelChirho}: ${urlChirho}` +
        ` (${checkChirho.checkedUrlsChirho.length} probe(s), source ${checkChirho.sourceFingerprintChirho?.slice(0, 12) ?? "unknown"})`
    );
    return;
  }
  console.log(
    `[${MODULE_CHIRHO}] down ${checkChirho.serviceChirho.labelChirho}: ${urlChirho}` +
      (checkChirho.errorChirho === null ? "" : ` (${checkChirho.errorChirho})`)
  );
}

async function checkAllChirho(): Promise<boolean> {
  const checksChirho = await Promise.all(REVIEW_SERVERS_CHIRHO.map((serviceChirho) => checkServerChirho(serviceChirho)));
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

async function stopStaleSameServiceChirho(checkChirho: ServerCheckChirho): Promise<void> {
  if (!checkChirho.staleSameServiceChirho) {
    throw new Error(`${checkChirho.serviceChirho.labelChirho} is responding but is not a same-service stale review server; refusing to stop it`);
  }
  const pidsChirho = await pidsListeningOnPortChirho(checkChirho.serviceChirho.portChirho);
  if (pidsChirho.length === 0) {
    throw new Error(`${checkChirho.serviceChirho.labelChirho} is stale but no listening PID was found on ${serverUrlChirho(checkChirho.serviceChirho)}`);
  }
  console.log(
    `[${MODULE_CHIRHO}] stopping stale ${checkChirho.serviceChirho.labelChirho} PID(s): ${pidsChirho.join(", ")}`
  );
  for (const pidChirho of pidsChirho) {
    process.kill(pidChirho, "SIGTERM");
  }
  const clearedChirho = await waitForPortToClearChirho(checkChirho.serviceChirho);
  if (!clearedChirho) {
    throw new Error(`${checkChirho.serviceChirho.labelChirho} did not stop cleanly on ${serverUrlChirho(checkChirho.serviceChirho)}`);
  }
}

async function startMissingServersChirho(optionsChirho: { restartStaleChirho: boolean }): Promise<void> {
  const spawnedProcessesChirho: Bun.Subprocess[] = [];
  for (const serviceChirho of REVIEW_SERVERS_CHIRHO) {
    let initialCheckChirho = await checkServerChirho(serviceChirho);
    if (initialCheckChirho.runningChirho) {
      console.log(`[${MODULE_CHIRHO}] already running ${serviceChirho.labelChirho}: ${serverUrlChirho(serviceChirho)}`);
      continue;
    }
    if (initialCheckChirho.portRespondedChirho) {
      printCheckChirho(initialCheckChirho);
      if (!optionsChirho.restartStaleChirho) {
        throw new Error(
          `${serviceChirho.labelChirho} is responding but stale or unhealthy; rerun with --restart-stale-chirho only if this is the same review service`
        );
      }
      await stopStaleSameServiceChirho(initialCheckChirho);
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
      throw new Error(`${serviceChirho.labelChirho} did not become ready on ${serverUrlChirho(serviceChirho)}`);
    }
    printCheckChirho(startedCheckChirho);
  }

  console.log(`[${MODULE_CHIRHO}] review URLs:`);
  for (const serviceChirho of REVIEW_SERVERS_CHIRHO) {
    console.log(`- ${serviceChirho.labelChirho}: ${serverUrlChirho(serviceChirho)}`);
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
  const allowedArgsChirho = new Set(["--check-chirho", "--restart-stale-chirho", "--help-chirho", "-h"]);
  const unknownArgChirho = argsChirho.find((argChirho) => !allowedArgsChirho.has(argChirho));
  if (unknownArgChirho !== undefined) {
    throw new Error(`unknown argument ${unknownArgChirho}\n${usageChirho()}`);
  }
  const restartStaleChirho = argsChirho.includes("--restart-stale-chirho");
  if (argsChirho.includes("--check-chirho")) {
    const allRunningChirho = await checkAllChirho();
    if (!allRunningChirho) process.exitCode = 1;
    return;
  }
  await startMissingServersChirho({ restartStaleChirho });
}

mainChirho().catch((errorChirho) => {
  const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
  console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
  process.exit(1);
});
