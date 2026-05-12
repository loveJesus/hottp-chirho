// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { readFileSync } from "fs";
import { ANTHROPIC_API_KEY_CHIRHO } from "./config-chirho.ts";
import type {
  CroppedSnippetChirho,
  OcrResultChirho,
  ScriptTypeChirho,
} from "./types-chirho.ts";
import { retryChirho, logChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "ocr-snippets-chirho";

const SYSTEM_PROMPT_CHIRHO = `You are an expert in Biblical textual criticism and ancient Semitic/Greek scripts.
You are reading cropped images from Barthélemy's "Critique textuelle de l'Ancien Testament."
These images contain Hebrew (with nikkud/vowel points), Greek, Syriac, or Arabic text that was
garbled by PDF text extraction due to broken font Unicode mappings.

Your task:
1. Identify the script(s) present in the image
2. Transcribe the text faithfully in proper Unicode
3. For Hebrew: include all nikkud (vowel points), cantillation marks, and special characters
4. For Greek: include all diacritical marks (accents, breathings, iota subscripts)
5. For Syriac: use proper Syriac Unicode block characters
6. Preserve any punctuation, reference markers, or abbreviations visible

Respond with ONLY the transcription text, no explanation. If multiple scripts are present,
transcribe each on its own line with a [HEBREW], [GREEK], [SYRIAC], or [ARABIC] prefix.`;

/**
 * OCR a single cropped snippet image using the Anthropic API with vision.
 */
export async function ocrSnippetChirho(
  croppedChirho: CroppedSnippetChirho
): Promise<OcrResultChirho> {
  if (!croppedChirho.imagePathChirho) {
    return {
      snippetIndexChirho: croppedChirho.snippetIndexChirho,
      suggestedTextChirho: "",
      scriptTypeChirho: "unknown-chirho",
      confidenceChirho: 0,
    };
  }

  logChirho(
    MODULE_CHIRHO,
    `OCR snippet #${croppedChirho.snippetIndexChirho}: ${croppedChirho.imagePathChirho}`
  );

  const imageBufferChirho = readFileSync(croppedChirho.imagePathChirho);
  const base64Chirho = imageBufferChirho.toString("base64");
  const mediaTypeChirho = "image/png";

  const responseChirho = await retryChirho(async () => {
    const respChirho = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY_CHIRHO,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: SYSTEM_PROMPT_CHIRHO,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaTypeChirho,
                  data: base64Chirho,
                },
              },
              {
                type: "text",
                text: `Transcribe this snippet from Barthélemy's Critique textuelle de l'Ancien Testament.
The garbled pdftotext output was: "${croppedChirho.regionChirho.garbledTextChirho}"
Please provide the correct Unicode transcription.`,
              },
            ],
          },
        ],
      }),
    });

    if (!respChirho.ok) {
      const errorBodyChirho = await respChirho.text();
      throw new Error(
        `Anthropic API error ${respChirho.status}: ${errorBodyChirho}`
      );
    }

    return respChirho.json() as Promise<{
      content: Array<{ type: string; text: string }>;
    }>;
  }, 3, 2000);

  const textContentChirho = responseChirho.content
    .filter((blockChirho) => blockChirho.type === "text")
    .map((blockChirho) => blockChirho.text)
    .join("\n");

  // Detect script type from the actual response
  const detectedScriptChirho = detectScriptFromTextChirho(textContentChirho);

  logChirho(
    MODULE_CHIRHO,
    `OCR result for snippet #${croppedChirho.snippetIndexChirho}: "${textContentChirho.slice(0, 60)}..." [${detectedScriptChirho}]`
  );

  return {
    snippetIndexChirho: croppedChirho.snippetIndexChirho,
    suggestedTextChirho: textContentChirho,
    scriptTypeChirho: detectedScriptChirho,
    confidenceChirho: 0.8, // Base confidence; adjusted in review
  };
}

/**
 * OCR all cropped snippets for a page.
 * Processes sequentially to respect rate limits.
 */
export async function ocrAllSnippetsChirho(
  croppedSnippetsChirho: CroppedSnippetChirho[]
): Promise<OcrResultChirho[]> {
  const resultsChirho: OcrResultChirho[] = [];

  for (const croppedChirho of croppedSnippetsChirho) {
    const resultChirho = await ocrSnippetChirho(croppedChirho);
    resultsChirho.push(resultChirho);

    // Small delay between API calls
    await Bun.sleep(500);
  }

  return resultsChirho;
}

/**
 * Detect the script type from actual Unicode text output.
 */
function detectScriptFromTextChirho(textChirho: string): ScriptTypeChirho {
  // Hebrew Unicode range: U+0590–U+05FF (letters + points)
  const hebrewCharsChirho = (textChirho.match(/[\u0590-\u05FF]/g) || []).length;
  // Greek Unicode range: U+0370–U+03FF, U+1F00–U+1FFF (polytonic)
  const greekCharsChirho = (
    textChirho.match(/[\u0370-\u03FF\u1F00-\u1FFF]/g) || []
  ).length;
  // Syriac Unicode range: U+0700–U+074F
  const syriacCharsChirho = (textChirho.match(/[\u0700-\u074F]/g) || []).length;
  // Arabic Unicode range: U+0600–U+06FF
  const arabicCharsChirho = (textChirho.match(/[\u0600-\u06FF]/g) || []).length;

  const countsChirho = [
    { typeChirho: "hebrew-chirho" as ScriptTypeChirho, countChirho: hebrewCharsChirho },
    { typeChirho: "greek-chirho" as ScriptTypeChirho, countChirho: greekCharsChirho },
    { typeChirho: "syriac-chirho" as ScriptTypeChirho, countChirho: syriacCharsChirho },
    { typeChirho: "arabic-chirho" as ScriptTypeChirho, countChirho: arabicCharsChirho },
  ];

  const nonZeroChirho = countsChirho.filter((cChirho) => cChirho.countChirho > 0);
  if (nonZeroChirho.length === 0) return "unknown-chirho";
  if (nonZeroChirho.length > 1) return "mixed-chirho";
  return nonZeroChirho[0]!.typeChirho;
}

/** CLI: test OCR on a single snippet */
if (import.meta.main) {
  const { detectSnippetsChirho } = await import("./detect-snippets-chirho.ts");
  const { renderPageChirho } = await import("./render-pages-chirho.ts");
  const { cropAllSnippetsChirho } = await import("./crop-snippets-chirho.ts");

  const volChirho = parseInt(process.argv[2] ?? "5", 10);
  const pageChirho = parseInt(process.argv[3] ?? "50", 10);
  const maxSnippetsChirho = parseInt(process.argv[4] ?? "3", 10);

  const imagePathChirho = await renderPageChirho(volChirho, pageChirho);
  const detectedChirho = await detectSnippetsChirho(volChirho, pageChirho);
  const croppedChirho = await cropAllSnippetsChirho(
    imagePathChirho,
    volChirho,
    pageChirho,
    detectedChirho.snippetsChirho.slice(0, maxSnippetsChirho),
    detectedChirho.pageWidthChirho,
    detectedChirho.pageHeightChirho
  );

  console.log(`\nOCR-ing ${croppedChirho.length} snippets...`);
  const ocrResultsChirho = await ocrAllSnippetsChirho(croppedChirho);

  for (const rChirho of ocrResultsChirho) {
    console.log(`\n  Snippet #${rChirho.snippetIndexChirho} [${rChirho.scriptTypeChirho}]:`);
    console.log(`    "${rChirho.suggestedTextChirho}"`);
  }
}
