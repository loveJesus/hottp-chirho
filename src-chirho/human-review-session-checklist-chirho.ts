// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

export interface HumanReviewSessionChecklistInputChirho {
  attributionRowCountChirho: string;
  attributionUnchangedRowCountChirho: string;
  attributionChangedRowCountChirho: string;
  attributionUnchangedLaneUrlChirho: string;
  attributionRereviewLaneUrlChirho: string;
  rawHebrewPrimaryLaneUrlChirho: string;
  expertHebrewLaneUrlChirho: string;
  expertGreekLaneUrlChirho: string;
  expertSyriacBlankLaneUrlChirho: string;
  latinSymbolLaneUrlChirho: string;
}

export function humanReviewSessionChecklistLinesChirho(
  inputChirho: HumanReviewSessionChecklistInputChirho
): string[] {
  return [
    "- This checklist is a triage aid only; it does not certify text, apply corrections, or decrement any gate.",
    `- 1. Raw Hebrew certification: start with the primary unvalidated lane and inspect the \`Target crop - red box is the item\` and \`Full line - red box in context\` panels before any clean save. Clean saves need the clean-certification checkbox; dots inside letters are vowels/niqqud, while cantillation/meteg are accent/meteg issues. Start: ${inputChirho.rawHebrewPrimaryLaneUrlChirho}`,
    `- 2. Attribution cleanup (${inputChirho.attributionRowCountChirho} row(s)): use unchanged-live-text reattribution only for rows genuinely attributable to the named human reviewer (${inputChirho.attributionUnchangedRowCountChirho} unchanged; ${inputChirho.attributionChangedRowCountChirho} changed). Unchanged lane: ${inputChirho.attributionUnchangedLaneUrlChirho}; changed/re-review lane: ${inputChirho.attributionRereviewLaneUrlChirho}`,
    `- 3. Hebrew/Greek expert confirmations: use the \`Target crop - red box is the item\` panel as the exact boundary; confirm only exact letters, marks, punctuation, and spacing against the print; use Report issue or Skip when uncertain. Hebrew: ${inputChirho.expertHebrewLaneUrlChirho}; Greek: ${inputChirho.expertGreekLaneUrlChirho}`,
    `- 4. External script handoff: Syriac and Arabic exact letters/dots require qualified readers. The blank Syriac item needs supplied text before it can be confirmed: ${inputChirho.expertSyriacBlankLaneUrlChirho}`,
    `- 5. Latin/symbol proofing: after script-critical work, review French, Latin, witness sigla, references, and nontrivial symbols in the \`Target crop - red box is the item\` and \`Full line - red box in context\` panels; witness sigla and references are not blanket-safe. Start: ${inputChirho.latinSymbolLaneUrlChirho}`,
  ];
}
