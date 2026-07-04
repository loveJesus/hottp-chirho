<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# HOTTP Human Review Guide

Thank you for helping review the HOTTP transcription. The work is simple in
principle: compare the transcription on screen against the printed scan, then
either certify what you can genuinely see or flag what needs more work.

This is not a speed test. A skipped or flagged item is useful. A wrong clean
confirmation is harmful.

## Links And Sign-In

Use the link for your assigned review lane. Sign-in is required.

- Raw Hebrew review: <https://raw-review.bible.systems/>
- Latin and symbols: <https://latin-review.bible.systems/>
- Expert non-Latin review: <https://expert-review.bible.systems/>

Current remote status:

- Raw Hebrew is live now.
- Latin/symbol and expert non-Latin are protected by the same login boundary but
  will open when those services are started.

Credentials:

- Username: send separately.
- Password: send separately.

Do not forward credentials publicly. If you need a new reviewer added, ask
Hallelujah rather than sharing a password broadly.

## What You Are Reviewing

The project has OCR and machine-vision guesses for printed text. Your job is to
turn some of those guesses into attributed human review records.

Each item usually shows:

- a target crop with a red box around the item,
- a full printed line with the item in context,
- the current transcription,
- optional suggested text or witness data,
- issue checkboxes,
- buttons for moving through the queue.

The print is the authority. Standard texts such as WLC, LXX, lexicons, and
parallel editions can help you understand what you are seeing, but do not
certify from those sources alone. Certify only from the printed scan.

## Main Method

For each item:

1. Look at the target crop.
2. Look at the full line for context.
3. Compare the visible print against the current text.
4. Decide whether the item is clean, needs correction, has an issue, or should
   be skipped.
5. Add a short note if something is wrong or uncertain.

If the crop is unclear, use the full line. If the full line still does not make
the text clear, flag or skip.

## Buttons And Controls

`Continue`:
Saves your current decision and moves to the next item. If no issue boxes are
checked and the text is unchanged, this means you intentionally certify the item
as clean for your lane. Do not press `Continue` as a casual "next" button.

`Skip`:
Moves past the item without certifying it. Use this when you are uncertain,
tired, outside your competence, or simply want another reviewer to handle it.

`Previous`:
Moves back to the prior item.

`Copy link`:
Copies a direct link to the current item. Use this when asking Hallelujah or
Codex about a specific case.

`Quickstart`:
Opens a short in-app reminder for that station.

Filters such as `Status`, `Tier`, `Script`, `Priority`, `Volume`, or `Text`:
These narrow the queue. They do not change the item. If a filter leaves you
with no items, set it back to `All`.

Issue checkboxes:
Use these when the item is not clean. Examples include wrong letters, vowel or
accent problems, punctuation problems, wrong script, missing text, segmentation
problems, or crop/source problems. Checked issue boxes keep the item from being
treated as clean.

Text fields:
Only edit text when you are intentionally recording a correction and are sure
what the printed text says. If the exact text is uncertain, flag the issue
instead of guessing.

## Lane-Specific Guidance

Raw Hebrew:
Review Hebrew items from the Pass-C validator. Confirm exact letters, niqqud,
accents, maqqef, punctuation, and segmentation only when you can see them in the
print. If several words are lumped into one span, or one word is split across
spans, flag segmentation or enter the corrected full text only if the tool
clearly supports that repair.

Latin and symbols:
Review French, Latin, references, apparatus signs, witness sigla, and ordinary
punctuation. References and sigla are meaningful. A wrong digit, witness siglum,
or apparatus sign can change the meaning.

Expert non-Latin:
Review Hebrew-script vision repairs, Greek, Syriac, Arabic, and other non-Latin
items. Only confirm inside your competence. A non-Syriac reader may flag a
Syriac crop or segmentation problem, but should not certify Syriac letters.

## What Counts As A Clean Confirmation

A clean confirmation means:

- the visible print matches the current transcription,
- the crop and segmentation are acceptable for the item,
- you are competent to review that script or class of mark,
- no issue boxes are checked,
- you intentionally saved the item.

For Hebrew, this includes letters and relevant marks. For Greek, Syriac, Arabic,
or specialized apparatus, stay inside your actual competence.

## When To Flag Or Skip

Flag or skip when:

- the image is blurry or clipped,
- the box includes too much or too little text,
- the script is outside your competence,
- the letters look plausible but not certain,
- vowels, accents, dots, maqaf/maqqef, punctuation, or brackets are unclear,
- a word may be missing,
- text appears in the wrong script,
- you are tired enough that your judgment is less reliable.

Flagging is not failure. It is how the project avoids false certification.

## Notes That Help

Useful notes are short and specific:

- `OCR read final kaf as resh; same shape appears nearby.`
- `Two Hebrew words are inside one box.`
- `WLC suggests maqqef, but print mark is unclear.`
- `This is Syriac, not Hebrew; I cannot read the letters.`
- `Looks like a witness siglum, not a decorative symbol.`

Avoid notes that only say `wrong`, `fixed`, or `looks good`.

## When To Ask Hallelujah Or Codex

Ask immediately if:

- one item shows a new kind of defect,
- you find hidden text that was not in the transcription,
- you find a wrong script classification,
- the UI makes it easy to accidentally certify something,
- a blank/unreadable script item receives exact text from a qualified reader.

For routine work, batch it. Ask after about:

- 3 examples of the same defect pattern,
- 10 similar issue flags,
- 10 corrections in one lane,
- 25 clean confirmations in one lane,
- or the end of any review session longer than about 30 minutes.

Codex does not automatically learn from each click. After review rows are saved,
backed up, and pulled into the local project, Codex can inspect the batch,
update detectors, improve queue routing, and refine instructions. This is
project-local learning, not model training.

## Copy-Ready Message To Reviewers

Please use your assigned review link:

- Raw Hebrew: <https://raw-review.bible.systems/>
- Latin and symbols: <https://latin-review.bible.systems/>
- Expert non-Latin: <https://expert-review.bible.systems/>

Use the username and password Hallelujah sends separately.

Review against the printed scan, not against what a standard text says the line
should be. Press `Continue` with no issue boxes only when you intentionally
certify the current item as clean for your lane. If anything is uncertain,
outside your script competence, badly boxed, missing, or suspicious, flag it or
skip it.

Short notes help: name the pattern, not just `wrong`. After roughly 3 repeated
defects, 10 similar issues, 10 corrections in one lane, 25 clean confirmations,
or the end of a review session, tell Hallelujah/Codex so the saved rows can be
pulled back and turned into better detectors, queue routing, and instructions.
