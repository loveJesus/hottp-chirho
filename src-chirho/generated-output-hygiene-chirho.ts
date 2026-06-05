// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Shared hygiene assertions for generated Markdown/JSON artifacts under
 * workspace-chirho. These checks do not certify transcription content.
 */

export const JOHN_316_BLOCK_MARKDOWN_HEADER_CHIRHO = [
  "<!--",
  "For God so loved the world that he gave his only begotten Son,",
  "that whoever believes in him should not perish but have eternal life. John 3:16",
  "-->",
].join("\n");

export const JOHN_316_INLINE_MARKDOWN_HEADER_CHIRHO = [
  "<!-- For God so loved the world that he gave his only begotten Son,",
  "that whoever believes in him should not perish but have eternal life. John 3:16 -->",
].join("\n");

const GENERATED_RENDERED_SENTINELS_CHIRHO = ["undefined", "NaN", "[object Object]", "\uFFFD"];
const ALLOWED_CONTROL_CHARS_CHIRHO = new Set(["\n", "\t"]);
const UNSAFE_FORMAT_CONTROLS_CHIRHO = new Map<number, string>([
  [0x200b, "ZERO WIDTH SPACE"],
  [0x200c, "ZERO WIDTH NON-JOINER"],
  [0x200d, "ZERO WIDTH JOINER"],
  [0x200e, "LEFT-TO-RIGHT MARK"],
  [0x200f, "RIGHT-TO-LEFT MARK"],
  [0x202a, "LEFT-TO-RIGHT EMBEDDING"],
  [0x202b, "RIGHT-TO-LEFT EMBEDDING"],
  [0x202c, "POP DIRECTIONAL FORMATTING"],
  [0x202d, "LEFT-TO-RIGHT OVERRIDE"],
  [0x202e, "RIGHT-TO-LEFT OVERRIDE"],
  [0x2066, "LEFT-TO-RIGHT ISOLATE"],
  [0x2067, "RIGHT-TO-LEFT ISOLATE"],
  [0x2068, "FIRST STRONG ISOLATE"],
  [0x2069, "POP DIRECTIONAL ISOLATE"],
  [0xfeff, "BYTE ORDER MARK"],
]);

export function assertGeneratedCheckChirho(conditionChirho: boolean, messageChirho: string): asserts conditionChirho {
  if (!conditionChirho) throw new Error(messageChirho);
}

export function assertNoTrailingWhitespaceChirho(pathChirho: string, textChirho: string): void {
  const linesChirho = textChirho.split(/\n/);
  linesChirho.forEach((lineChirho, indexChirho) => {
    assertGeneratedCheckChirho(
      !/[ \t]$/.test(lineChirho),
      `${pathChirho}:${indexChirho + 1} has trailing whitespace`
    );
  });
}

export function assertNoRenderedSentinelLeakChirho(pathChirho: string, textChirho: string): void {
  for (const sentinelChirho of GENERATED_RENDERED_SENTINELS_CHIRHO) {
    assertGeneratedCheckChirho(
      !textChirho.includes(sentinelChirho),
      `${pathChirho} contains rendered sentinel ${sentinelChirho}`
    );
  }
}

export function assertNoUnsafeControlCharsChirho(pathChirho: string, textChirho: string): void {
  for (let indexChirho = 0; indexChirho < textChirho.length; indexChirho += 1) {
    const charChirho = textChirho[indexChirho]!;
    const codeChirho = charChirho.charCodeAt(0);
    if (codeChirho < 0x20 && !ALLOWED_CONTROL_CHARS_CHIRHO.has(charChirho)) {
      const hexChirho = `U+${codeChirho.toString(16).toUpperCase().padStart(4, "0")}`;
      throw new Error(`${pathChirho} contains unsafe control character ${hexChirho} at UTF-16 offset ${indexChirho}`);
    }
  }
}

export function assertNoUnsafeFormatControlsChirho(pathChirho: string, textChirho: string): void {
  for (let indexChirho = 0; indexChirho < textChirho.length; indexChirho += 1) {
    const codeChirho = textChirho.codePointAt(indexChirho)!;
    const nameChirho = UNSAFE_FORMAT_CONTROLS_CHIRHO.get(codeChirho);
    if (nameChirho !== undefined) {
      const hexChirho = `U+${codeChirho.toString(16).toUpperCase().padStart(4, "0")}`;
      throw new Error(`${pathChirho} contains unsafe format control ${hexChirho} ${nameChirho} at UTF-16 offset ${indexChirho}`);
    }
    if (codeChirho > 0xffff) indexChirho += 1;
  }
}

export function assertGeneratedTextHygieneChirho(pathChirho: string, textChirho: string): void {
  assertNoTrailingWhitespaceChirho(pathChirho, textChirho);
  assertNoRenderedSentinelLeakChirho(pathChirho, textChirho);
  assertNoUnsafeControlCharsChirho(pathChirho, textChirho);
  assertNoUnsafeFormatControlsChirho(pathChirho, textChirho);
  assertGeneratedCheckChirho(textChirho.normalize("NFC") === textChirho, `${pathChirho} is not NFC-normalized`);
}

export function assertMarkdownHeaderChirho(pathChirho: string, textChirho: string, headerChirho: string): void {
  assertGeneratedCheckChirho(textChirho.startsWith(headerChirho), `${pathChirho} is missing the John 3:16 header`);
}

export function countOccurrencesChirho(textChirho: string, needleChirho: string): number {
  let countChirho = 0;
  let offsetChirho = 0;
  while (true) {
    const nextChirho = textChirho.indexOf(needleChirho, offsetChirho);
    if (nextChirho === -1) return countChirho;
    countChirho += 1;
    offsetChirho = nextChirho + needleChirho.length;
  }
}
