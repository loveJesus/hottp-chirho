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

export function rawHebrewPreReviewNoteHeadingKeyChirho(lineChirho: string): string | null {
  const matchChirho = lineChirho.match(/^- `vol (\d+) p(\d+) L(\d+) S(\d+)`:/);
  if (matchChirho === null) return null;
  return rawHebrewPreReviewNoteKeyChirho(
    Number.parseInt(matchChirho[1]!, 10),
    Number.parseInt(matchChirho[2]!, 10),
    Number.parseInt(matchChirho[3]!, 10),
    Number.parseInt(matchChirho[4]!, 10)
  );
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
  let currentKeyChirho: string | null = null;
  let currentLinesChirho: string[] = [];
  const flushChirho = (): void => {
    if (currentKeyChirho === null) return;
    const noteChirho = currentLinesChirho
      .map((lineChirho) => rawHebrewPreReviewNoteTextLineChirho(lineChirho))
      .filter((lineChirho): lineChirho is string => lineChirho !== null && lineChirho.length > 0)
      .join("\n");
    if (noteChirho.length > 0) notesChirho.set(currentKeyChirho, noteChirho);
    currentLinesChirho = [];
  };
  for (const lineChirho of linesChirho) {
    const headingKeyChirho = rawHebrewPreReviewNoteHeadingKeyChirho(lineChirho);
    if (headingKeyChirho !== null) {
      flushChirho();
      currentKeyChirho = headingKeyChirho;
      continue;
    }
    if (currentKeyChirho === null) continue;
    if (lineChirho.startsWith("## ")) {
      flushChirho();
      currentKeyChirho = null;
      continue;
    }
    currentLinesChirho.push(lineChirho);
  }
  flushChirho();
  return notesChirho;
}
