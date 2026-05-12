// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { mkdirSync, existsSync } from "fs";

/** Ensure a directory exists, create recursively if not */
export function ensureDirChirho(pathChirho: string): void {
  if (!existsSync(pathChirho)) {
    mkdirSync(pathChirho, { recursive: true });
  }
}

/** Run a shell command and return stdout */
export async function runCmdChirho(
  cmdChirho: string[],
  optionsChirho?: { timeoutMsChirho?: number; cwdChirho?: string }
): Promise<string> {
  const procChirho = Bun.spawn(cmdChirho, {
    stdout: "pipe",
    stderr: "pipe",
    cwd: optionsChirho?.cwdChirho,
  });

  const outputChirho = await new Response(procChirho.stdout).text();
  const errorOutputChirho = await new Response(procChirho.stderr).text();
  const exitCodeChirho = await procChirho.exited;

  if (exitCodeChirho !== 0) {
    throw new Error(
      `Command failed (exit ${exitCodeChirho}): ${cmdChirho.join(" ")}\n${errorOutputChirho}`
    );
  }

  return outputChirho;
}

/** Retry a function with exponential backoff */
export async function retryChirho<TChirho>(
  fnChirho: () => Promise<TChirho>,
  maxRetriesChirho = 3,
  delayMsChirho = 1000
): Promise<TChirho> {
  let lastErrorChirho: unknown;
  for (let attemptChirho = 0; attemptChirho <= maxRetriesChirho; attemptChirho++) {
    try {
      return await fnChirho();
    } catch (errorChirho) {
      lastErrorChirho = errorChirho;
      if (attemptChirho < maxRetriesChirho) {
        const waitChirho = delayMsChirho * Math.pow(2, attemptChirho);
        console.warn(
          `[retry] Attempt ${attemptChirho + 1}/${maxRetriesChirho} failed, waiting ${waitChirho}ms...`
        );
        await Bun.sleep(waitChirho);
      }
    }
  }
  throw lastErrorChirho;
}

/** Format a timestamp for logging */
export function nowIsoChirho(): string {
  return new Date().toISOString();
}

/** Simple console logger with prefix */
export function logChirho(
  moduleChirho: string,
  messageChirho: string,
  ...argsChirho: unknown[]
): void {
  console.log(`[${nowIsoChirho()}] [${moduleChirho}] ${messageChirho}`, ...argsChirho);
}

/** Decode HTML entities from bbox output */
export function decodeHtmlEntitiesChirho(htmlChirho: string): string {
  return htmlChirho
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_matchChirho, codeChirho) =>
      String.fromCharCode(parseInt(codeChirho, 10))
    );
}
