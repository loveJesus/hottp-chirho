// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Structured parser for non-certifying raw Hebrew pre-review notes.
 *
 * These notes are display-only triage aids. Matching them by explicit item
 * headings keeps status counts aligned with the browser reviewer.
 */

export function rawHebrewPreReviewNoteKeyChirho(
  volumeChirho: number,
  pageChirho: number,
  lineIndexChirho: number,
  segmentIndexChirho: number
): string {
  return `${volumeChirho}:${pageChirho}:${lineIndexChirho}:${segmentIndexChirho}`;
}

export function rawHebrewPreReviewNoteHeadingKeysChirho(lineChirho: string): string[] | null {
  const matchChirho = lineChirho.match(/^- `vol (\d+) p(\d+) L(\d+) S([0-9S/,]+)`:/);
  if (matchChirho === null) return null;
  const volumeChirho = Number.parseInt(matchChirho[1]!, 10);
  const pageChirho = Number.parseInt(matchChirho[2]!, 10);
  const lineIndexChirho = Number.parseInt(matchChirho[3]!, 10);
  const segmentIndexesChirho = matchChirho[4]!
    .split(/[\/,]/)
    .map((segmentChirho) => Number.parseInt(segmentChirho.replace(/^S/, ""), 10))
    .filter((segmentChirho) => Number.isInteger(segmentChirho));
  if (segmentIndexesChirho.length === 0) return null;
  return [...new Set(segmentIndexesChirho)].map((segmentIndexChirho) =>
    rawHebrewPreReviewNoteKeyChirho(
      volumeChirho,
      pageChirho,
      lineIndexChirho,
      segmentIndexChirho
    )
  );
}

export function rawHebrewPreReviewNoteHeadingKeyChirho(lineChirho: string): string | null {
  return rawHebrewPreReviewNoteHeadingKeysChirho(lineChirho)?.[0] ?? null;
}

function rawHebrewPreReviewSetNotesChirho(
  notesChirho: Map<string, string>,
  keysChirho: string[],
  noteChirho: string
): void {
  for (const keyChirho of keysChirho) {
    notesChirho.set(keyChirho, noteChirho);
  }
}

export function rawHebrewPreReviewNoteTextLineChirho(lineChirho: string): string | null {
  const trimmedChirho = lineChirho.trim();
  if (trimmedChirho.length === 0) return null;
  if (/^`?https?:\/\//.test(trimmedChirho)) return null;
  if (trimmedChirho.startsWith("- ")) return trimmedChirho.slice(2).trim();
  return trimmedChirho;
}

export function parseRawHebrewPreReviewNotesChirho(textChirho: string): Map<string, string> {
  const notesChirho = new Map<string, string>();
  const linesChirho = textChirho.split(/\r?\n/);
  let currentKeysChirho: string[] | null = null;
  let currentLinesChirho: string[] = [];
  const flushChirho = (): void => {
    if (currentKeysChirho === null) return;
    const noteChirho = currentLinesChirho
      .map((lineChirho) => rawHebrewPreReviewNoteTextLineChirho(lineChirho))
      .filter((lineChirho): lineChirho is string => lineChirho !== null && lineChirho.length > 0)
      .join("\n");
    if (noteChirho.length > 0) rawHebrewPreReviewSetNotesChirho(notesChirho, currentKeysChirho, noteChirho);
    currentLinesChirho = [];
  };
  for (const lineChirho of linesChirho) {
    const headingKeysChirho = rawHebrewPreReviewNoteHeadingKeysChirho(lineChirho);
    if (headingKeysChirho !== null) {
      flushChirho();
      currentKeysChirho = headingKeysChirho;
      continue;
    }
    if (currentKeysChirho === null) continue;
    if (lineChirho.startsWith("## ")) {
      flushChirho();
      currentKeysChirho = null;
      continue;
    }
    currentLinesChirho.push(lineChirho);
  }
  flushChirho();
  return notesChirho;
}
