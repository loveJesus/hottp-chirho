// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Real mutual-exclusion lock for the segment repair proposal store.
 *
 * The store is a single JSON file mutated by load-then-rewrite, so two
 * concurrent writers silently drop each other's records. Every store
 * mutation must run inside this lock (see segment-repair-proposals-chirho.ts).
 *
 * The lock is a sibling directory created with an atomic mkdir. A holder
 * writes its pid so a crashed holder can be detected and taken over.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const LOCK_SUFFIX_CHIRHO = ".lock-chirho";
const OWNER_FILE_NAME_CHIRHO = "owner-chirho.json";
const ACQUIRE_TIMEOUT_MS_CHIRHO = 10_000;
const RETRY_INTERVAL_MS_CHIRHO = 25;
const STALE_LOCK_MS_CHIRHO = 120_000;

interface StoreLockOwnerChirho {
  pidChirho: number;
  ownerChirho: string;
  acquiredAtMsChirho: number;
}

export interface StoreLockHandleChirho {
  lockDirChirho: string;
  ownerChirho: string;
}

function lockDirForStoreChirho(storePathChirho: string): string {
  return `${storePathChirho}${LOCK_SUFFIX_CHIRHO}`;
}

function readLockOwnerChirho(lockDirChirho: string): StoreLockOwnerChirho | null {
  try {
    const parsedChirho = JSON.parse(
      readFileSync(join(lockDirChirho, OWNER_FILE_NAME_CHIRHO), "utf8")
    ) as Partial<StoreLockOwnerChirho>;
    if (
      typeof parsedChirho.pidChirho !== "number" ||
      typeof parsedChirho.ownerChirho !== "string" ||
      typeof parsedChirho.acquiredAtMsChirho !== "number"
    ) {
      return null;
    }
    return parsedChirho as StoreLockOwnerChirho;
  } catch {
    return null;
  }
}

function lockHolderIsAliveChirho(ownerChirho: StoreLockOwnerChirho): boolean {
  try {
    process.kill(ownerChirho.pidChirho, 0);
    return true;
  } catch {
    return false;
  }
}

function lockLooksAbandonedChirho(lockDirChirho: string): boolean {
  const ownerChirho = readLockOwnerChirho(lockDirChirho);
  if (ownerChirho === null) {
    // Unreadable owner file: only treat as abandoned once clearly old, using
    // the directory itself as evidence via a conservative existence recheck.
    return false;
  }
  if (ownerChirho.pidChirho === process.pid) return false;
  if (!lockHolderIsAliveChirho(ownerChirho)) return true;
  return Date.now() - ownerChirho.acquiredAtMsChirho > STALE_LOCK_MS_CHIRHO;
}

export function acquireSegmentRepairStoreLockChirho(
  storePathChirho: string,
  ownerChirho: string,
  timeoutMsChirho = ACQUIRE_TIMEOUT_MS_CHIRHO
): StoreLockHandleChirho {
  const lockDirChirho = lockDirForStoreChirho(storePathChirho);
  const deadlineMsChirho = Date.now() + timeoutMsChirho;
  for (;;) {
    try {
      mkdirSync(lockDirChirho, { recursive: false });
      writeFileSync(
        join(lockDirChirho, OWNER_FILE_NAME_CHIRHO),
        `${JSON.stringify(
          {
            pidChirho: process.pid,
            ownerChirho,
            acquiredAtMsChirho: Date.now(),
          } satisfies StoreLockOwnerChirho,
          null,
          2
        )}\n`
      );
      return { lockDirChirho, ownerChirho };
    } catch (errorChirho) {
      if ((errorChirho as NodeJS.ErrnoException).code !== "EEXIST") throw errorChirho;
      if (lockLooksAbandonedChirho(lockDirChirho)) {
        rmSync(lockDirChirho, { recursive: true, force: true });
        continue;
      }
      if (Date.now() >= deadlineMsChirho) {
        const holderChirho = readLockOwnerChirho(lockDirChirho);
        const holderTextChirho = holderChirho === null
          ? "unknown holder"
          : `held by ${holderChirho.ownerChirho} (pid ${holderChirho.pidChirho})`;
        throw new Error(
          `segment repair store lock timeout after ${timeoutMsChirho}ms: ${lockDirChirho} ${holderTextChirho}`
        );
      }
      Bun.sleepSync(RETRY_INTERVAL_MS_CHIRHO);
    }
  }
}

export function releaseSegmentRepairStoreLockChirho(handleChirho: StoreLockHandleChirho): void {
  const ownerChirho = readLockOwnerChirho(handleChirho.lockDirChirho);
  if (ownerChirho !== null && ownerChirho.pidChirho !== process.pid) {
    throw new Error(
      `refusing to release segment repair store lock owned by pid ${ownerChirho.pidChirho}: ${handleChirho.lockDirChirho}`
    );
  }
  if (existsSync(handleChirho.lockDirChirho)) {
    rmSync(handleChirho.lockDirChirho, { recursive: true, force: true });
  }
}

export function withSegmentRepairStoreLockChirho<ResultChirho>(
  storePathChirho: string,
  ownerChirho: string,
  workChirho: () => ResultChirho
): ResultChirho {
  const handleChirho = acquireSegmentRepairStoreLockChirho(storePathChirho, ownerChirho);
  try {
    return workChirho();
  } finally {
    releaseSegmentRepairStoreLockChirho(handleChirho);
  }
}
