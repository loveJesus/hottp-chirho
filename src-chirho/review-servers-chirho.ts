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

const MODULE_CHIRHO = "review-servers-chirho";
const CHECK_TIMEOUT_MS_CHIRHO = 1500;
const START_TIMEOUT_MS_CHIRHO = 8000;

interface ReviewServerChirho {
  keyChirho: string;
  labelChirho: string;
  portChirho: number;
  scriptPathChirho: string;
}

interface ServerCheckChirho {
  serviceChirho: ReviewServerChirho;
  runningChirho: boolean;
  statusChirho: number | null;
  errorChirho: string | null;
}

const REVIEW_SERVERS_CHIRHO: ReviewServerChirho[] = [
  {
    keyChirho: "raw-hebrew-chirho",
    labelChirho: "Raw Hebrew live validator",
    portChirho: 8766,
    scriptPathChirho: "src-chirho/pass-c-human-validate-server-chirho.ts",
  },
  {
    keyChirho: "latin-symbol-chirho",
    labelChirho: "Latin/symbol live reviewer",
    portChirho: 8770,
    scriptPathChirho: "src-chirho/latin-symbol-vision-review-server-chirho.ts",
  },
  {
    keyChirho: "expert-non-latin-chirho",
    labelChirho: "Expert non-Latin live reviewer",
    portChirho: 8771,
    scriptPathChirho: "src-chirho/vision-tier-expert-review-server-chirho.ts",
  },
];

function usageChirho(): string {
  return [
    `Usage: bun run review-servers-chirho [--check-chirho]`,
    "",
    "Default mode starts any missing standard review servers and keeps this process open.",
    "Check mode reports whether the standard review servers respond, without starting anything.",
  ].join("\n");
}

function serverUrlChirho(serviceChirho: ReviewServerChirho): string {
  return `http://localhost:${serviceChirho.portChirho}/`;
}

async function checkServerChirho(serviceChirho: ReviewServerChirho, timeoutMsChirho = CHECK_TIMEOUT_MS_CHIRHO): Promise<ServerCheckChirho> {
  const abortControllerChirho = new AbortController();
  const timeoutChirho = setTimeout(() => abortControllerChirho.abort(), timeoutMsChirho);
  try {
    const responseChirho = await fetch(serverUrlChirho(serviceChirho), {
      signal: abortControllerChirho.signal,
    });
    return {
      serviceChirho,
      runningChirho: responseChirho.ok,
      statusChirho: responseChirho.status,
      errorChirho: responseChirho.ok ? null : `HTTP ${responseChirho.status}`,
    };
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    return {
      serviceChirho,
      runningChirho: false,
      statusChirho: null,
      errorChirho: messageChirho,
    };
  } finally {
    clearTimeout(timeoutChirho);
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
    console.log(`[${MODULE_CHIRHO}] ok ${checkChirho.serviceChirho.labelChirho}: ${urlChirho}`);
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

async function startMissingServersChirho(): Promise<void> {
  const spawnedProcessesChirho: Bun.Subprocess[] = [];
  for (const serviceChirho of REVIEW_SERVERS_CHIRHO) {
    const initialCheckChirho = await checkServerChirho(serviceChirho);
    if (initialCheckChirho.runningChirho) {
      console.log(`[${MODULE_CHIRHO}] already running ${serviceChirho.labelChirho}: ${serverUrlChirho(serviceChirho)}`);
      continue;
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
  const allowedArgsChirho = new Set(["--check-chirho", "--help-chirho", "-h"]);
  const unknownArgChirho = argsChirho.find((argChirho) => !allowedArgsChirho.has(argChirho));
  if (unknownArgChirho !== undefined) {
    throw new Error(`unknown argument ${unknownArgChirho}\n${usageChirho()}`);
  }
  if (argsChirho.includes("--check-chirho")) {
    const allRunningChirho = await checkAllChirho();
    if (!allRunningChirho) process.exitCode = 1;
    return;
  }
  await startMissingServersChirho();
}

mainChirho().catch((errorChirho) => {
  const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
  console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
  process.exit(1);
});
