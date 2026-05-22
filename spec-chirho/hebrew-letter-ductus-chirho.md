<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Hebrew square-script ductus reference (vol-1 seeding guide)

How each consonant is conventionally formed (square / Assyrian / STA"M
block script — the script Barthélemy prints). Used to *constrain the
auto stroke-decomposition seed* toward the canonical pen motion instead
of arbitrary skeleton routes, and to sanity-check the spine editor.

`countChirho` for the 8 letters the user explicitly fixed is authoritative
(see `hebrew-stroke-counts-chirho.json`, sourceChirho=human). The rest are
scribal-convention (sourceChirho=convention) — refine in the editor.

| letter | strokes | canonical pen motion (ductus) |
|---|---|---|
| א aleph | **3** (human) | medial diagonal (vav-like) + upper-right yod arm + lower-left yod foot |
| ב bet | **2** (human) | roof+right shoulder curving down (1), then the left→right base (2) |
| ג gimel | 2 | vertical/curved body (1) + short lower-right leg (2) |
| ד dalet | **2** (human) | top bar with the right-corner heel as its tail (1) + the descending leg (2) |
| ה he | 2 | roof+right leg in one (1) + the detached short left leg (2) |
| ו vav | 1 | a single top-knob → straight descender |
| ז zayin | 1 | head + descender in one stroke (rare in pool — will appear in more pages) |
| ח het | 2 | left leg+roof (1) + right leg (2) — roof joins them |
| ט tet | 1–2 | rounded body in one continuous loop; inner tongue may add 1 |
| י yod | 1 | one short hooked stroke, sits high (the distinctive anchor letter) |
| כ kaf | 1 | roof→right→base as one smooth bend |
| ל lamed | 1 (impl. 1) | one tall S-spine, ascends above the topline |
| מ mem | **2** (human) | left body (1) + right shoulder/leg (2) |
| נ nun | 1–2 | roof+descender (1); base hook may add 1 |
| ס samekh | **1** (human) | one closed loop — NOT split at its bend |
| ע ayin | 2 | left arm into the V (1) + right arm (2) |
| פ pe | 1–2 | outer body in one; the inward tongue may add 1 |
| צ tsadi | 2 | left arm + body (1) + right arm joining it (2) |
| ק qof | 2 | head/loop (1) + the long left descender (2) |
| ר resh | 1 | roof + right descender, one bend |
| ש shin | 3 | three prongs rising from a shared base — 3 capped tops |
| ת tav | **2** (human) | left leg+roof (1) + the right leg with its foot-nub (2) |
| ך final kaf | 1 | roof → long straight descender, one stroke |
| ם final mem | **1** (human) | one closed box loop |
| ן final nun | **2** (human) | head/short top (1) + the long descender (2) |
| ף final pe | 1–2 | body + long descender; tongue may add 1 (missing in pool) |
| ץ final tsadi | 2 | arm + body (1) + long descender (2) (missing in pool) |

**Routing rule (matches `feedback-hebrew-stroke-ductus-model`):** a stroke
runs pen-down→pen-up; it flows *through* sharp curves/junctions and lifts
only at a capped end; closed loops (ס, ם) are one stroke. Seed the editor
from `glyph_strokes_chirho.py`'s route-inspection decomposition, then bias
toward these counts; the human corrects in the red/blue/green editor and
those saved spines become the true per-volume ground truth.

Sources: square-script formation per Hebrew-alphabet references
(Wikipedia "Hebrew alphabet"; Mishnat Soferim scribal letter-formation
rules referenced therein) cross-checked with the user's stated counts.
