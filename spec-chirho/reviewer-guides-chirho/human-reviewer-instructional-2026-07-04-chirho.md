<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Human Reviewer Instructional

This guide is for people reviewing the HOTTP transcription against the printed
scan. The goal is not to move quickly through a queue. The goal is to create
small, attributed review records that make the text safer and give Codex enough
evidence to improve the project-local detectors, queues, and instructions.

## Review Tool Links

Use the link for your assigned lane. Sign-in is required.

- Raw Hebrew review: <https://raw-review.bible.systems/>
- Latin and symbol review: <https://latin-review.bible.systems/>
- Expert non-Latin review: <https://expert-review.bible.systems/>

Raw Hebrew is the first remote station we are bringing online. The Latin/symbol
and expert links use the same protected VPS boundary and will open when those
services are started.

## Core Rule

Confirm only what you can certify from the print. Do not confirm a word merely
because it matches WLC, LXX, a lexicon, a standard edition, or a plausible
reconstruction. Those sources can help you notice what to inspect, but the
review verdict is about this printed line.

If you are uncertain, use an issue flag or skip. Skipping is useful because it
keeps the item in the queue for a better-qualified reviewer.

## What Each Action Means

- `Continue` with no issue flags means: I intentionally certify this item as
  clean/correct for this lane.
- `Continue` after editing text means: I intentionally record my corrected
  transcription for this lane.
- Checked issue flags mean: this item is not clean; it should remain visible
  until resolved.
- `Skip` means: I am not certifying this item.
- For expert review, `Confirm` means: the current text exactly matches the
  printed script, including relevant letters and marks.
- Supplying text for a blank expert item is not final certification. It fills an
  empty span so it can be reviewed again and explicitly confirmed later.

## Review Lanes

Raw Hebrew:
Use this for Hebrew items from the Pass-C validator. Confirm letters, niqqud,
accents, maqqef, punctuation, and segmentation only when you can see them in the
print. If several words were lumped into one span, or one word was split across
spans, flag segmentation or enter the corrected full text if the lane supports
that exact repair.

Latin and symbols:
Use this for French, Latin, references, apparatus signs, witness sigla, and
ordinary punctuation. References and sigla are meaningful, not filler. A wrong
digit or siglum can change the apparatus.

Expert non-Latin:
Use this for Hebrew-script vision items, Greek, Syriac, Arabic, and other
non-Latin spans that were recovered by visual repair. Only confirm inside your
competence. A non-Syriac reader can flag a crop or segmentation problem on a
Syriac item, but should not certify Syriac letters.

## Notes That Help Codex

When you flag or correct an item, write the shortest note that explains the
pattern. Useful notes look like this:

- `OCR read final kaf as resh; same shape appears nearby.`
- `Two Hebrew words are inside one box; keep as one quote span unless reboxed.`
- `WLC suggests maqqef, but print mark is unclear; needs human visual check.`
- `This is Syriac, not Hebrew; I cannot read the letters.`

Avoid notes that only say `wrong`, `fixed`, or `looks good`; they are hard to
turn into detector improvements.

## When To Invoke Codex For Synthesis

Codex does not automatically learn from each click. Your review rows become
useful to Codex after they are saved, backed up, and pulled back into the local
repo. Then Codex can inspect patterns, update detectors, improve instructions,
or generate a new review batch. This is project-local learning, not model weight
training.

Invoke Codex immediately after any of these:

- One item exposes a new class of hidden content, wrong script, missing word, or
  security/authentication problem.
- One blank or unreadable script item receives exact text from a qualified
  script reader.
- One reviewer finds that the UI makes it easy to accidentally certify the
  wrong thing.

Invoke Codex after a small batch when any of these thresholds are reached:

- 3 examples of the same defect pattern, such as repeated Hebrew hidden in
  French/digit garbage, repeated paren-order bugs, or repeated witness-siglum
  confusion.
- 10 issue flags of the same type in one lane.
- 10 corrections in one script or one volume.
- 25 clean confirmations in one lane, so Codex can update the status summary and
  check that counts moved exactly as expected.
- End of any remote review session longer than about 30 minutes, even if the
  work was routine.

If in doubt, invoke Codex sooner for issues and later for routine clean
confirmations. A single surprising defect is more useful than fifty ordinary
clean items.

## What Codex Should Do With A Review Batch

After a batch is pulled back, ask Codex to:

1. Verify the backup rows and reviewer attribution.
2. Recompute the certification gate and explain count changes.
3. Look for repeated defect patterns.
4. Decide whether a detector, reviewer instruction, or packet should change.
5. Commit only reviewed artifacts, never secrets or scratch files.

## Copy-Ready Reviewer Message

Please use your assigned review link:

- Raw Hebrew: <https://raw-review.bible.systems/>
- Latin and symbols: <https://latin-review.bible.systems/>
- Expert non-Latin: <https://expert-review.bible.systems/>

Review against the printed scan, not against what a standard text says the line
should be. Press `Continue` with no issue boxes only when you intentionally
certify the current item as clean for your lane. If anything is uncertain,
outside your script competence, badly boxed, missing, or suspicious, flag it or
skip it.

Short notes help: name the pattern, not just `wrong`. After roughly 3 repeated
defects, 10 similar issues, 10 corrections in one lane, 25 clean confirmations,
or the end of a review session, tell Hallelujah/Codex so the saved rows can be
pulled back and turned into better detectors, queue routing, and instructions.
