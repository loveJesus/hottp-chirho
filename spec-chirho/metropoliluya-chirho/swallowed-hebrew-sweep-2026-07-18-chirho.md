<!-- For God so loved the world, that he gave his only begotten Son,
that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Swallowed Hebrew Sweep Chirho

Generated: 2026-07-19T02:25:24.397Z

Read-only machine triage queue for the swallowed-Hebrew defect class (reviewer UX v2 plan, Phase 5). Flags are review candidates, not certification results, and every repair still goes draft proposal -> approval -> apply. Pre-review notes are advisory only; a clean-sounding note on a flagged span is reported as a contradiction, never as an exoneration.

## Summary

- Scanner source files: 7
- Scanner source fingerprint: f19e9c5358a6902c2f655e93a3bb8424397cee9dc9a7d8e0f05f5c38a64572db
- Span source files: 1789
- Span source fingerprint: 7b48437c5e8dc366651f4b3cdfff49ed873cad03f5d4a5471a260224ea0100ff
- Lines scanned: 1789 (word-level coverage: 1789)
- Findings: 82 (high 1, medium 81)
- Unwitnessed Hebrew spans (need on-demand CRNN read): 422
- digit-word-superseded-in-stored-text-chirho: 5
- orphan-digit-word-chirho: 77
- pre-review-note-contradicted-chirho: 1
- Machine triage JSON: `workspace-chirho/swallowed-hebrew-sweep-chirho/candidates-2026-07-18-chirho.json`

## High Severity Findings

### high-chirho vol 3 p0151 L036 S1 (3:151:36:1)

- Signals: `orphan-digit-word-chirho`, `pre-review-note-contradicted-chirho`
- Span (french-chirho, x 138..1105 of 1288): `mot qui réapparaît en Éz 43,13.17 pour 13, en 1R 7 9 pour`
- Evidence (word-db-chirho, x 771..837): `13,` after `pour`
- Pre-review note (ADVISORY ONLY): `Live text: \`גְּבוּל\` Current line text: \`γεῖσος mot qui réapparaît en Éz 43,13.17 pour 13, en 1R 7 9 pour גְּבוּל et en Jr\` Visual precheck: crop is centered on the target word; no obvious crop or segmentation issue. The printed letters and visible pointing look plausible for the live text at review resolution. Human check still needed: exact niqqud/marks against the print.`
- Line text: `γεῖσος mot qui réapparaît en Éz 43,13.17 pour 13, en 1R 7 9 pour גְּבוּל et en Jr`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0151-chirho/line-036-chirho.json`
![scanline](../../workspace-chirho/scanlines-chirho/vol-3-chirho/page-0151-chirho/line-036-chirho.png)

## Medium Severity Findings

### medium-chirho vol 1 p0149 L004 S0 (1:149:4:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1442 of 1442): `de l'alliance du Seigneur”, alors qu'en 11 et 14 il s’agit de ‘l'arche de l'alliance” et en`
- Evidence (word-db-chirho, x 661..693): `11` after `qu'en`
- Line text: `de l'alliance du Seigneur”, alors qu'en 11 et 14 il s’agit de ‘l'arche de l'alliance” et en`
- Span file: `workspace-chirho/spans-chirho/vol-1-chirho/page-0149-chirho/line-004-chirho.json`

### medium-chirho vol 1 p0150 L015 S0 (1:150:15:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1258 of 1258): `Lilienthal (149), ayant trouvé 17 dans un ms de Künigsberg, a adopté cette`
- Evidence (word-db-chirho, x 516..546): `17` after `trouvé`
- Line text: `Lilienthal (149), ayant trouvé 17 dans un ms de Künigsberg, a adopté cette`
- Span file: `workspace-chirho/spans-chirho/vol-1-chirho/page-0150-chirho/line-015-chirho.json`

### medium-chirho vol 1 p0152 L015 S0 (1:152:15:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1262 of 1262): `Aux vss 16 à 18 où est raconté le processus de sélection, le *M offre de`
- Evidence (word-db-chirho, x 156..194): `16` after `vss`
- Evidence (word-db-chirho, x 266..304): `18` after `à`
- Line text: `Aux vss 16 à 18 où est raconté le processus de sélection, le *M offre de`
- Span file: `workspace-chirho/spans-chirho/vol-1-chirho/page-0152-chirho/line-015-chirho.json`

### medium-chirho vol 2 p0148 L016 S0 (2:148:16:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1437 of 1437): `la 1e pers. du pluriel, par assimilation aux 4 verbes à la 2e pers. du pluriel qui se`
- Evidence (word-db-chirho, x 761..781): `4` after `aux`
- Line text: `la 1e pers. du pluriel, par assimilation aux 4 verbes à la 2e pers. du pluriel qui se`
- Span file: `workspace-chirho/spans-chirho/vol-2-chirho/page-0148-chirho/line-016-chirho.json`

### medium-chirho vol 2 p0148 L017 S0 (2:148:17:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1438 of 1438): `trouvent dans les 2 vss suivants. Koenig (Herméneutique 322, n. 69) a , en tout cas,`
- Evidence (word-db-chirho, x 315..334): `2` after `les`
- Line text: `trouvent dans les 2 vss suivants. Koenig (Herméneutique 322, n. 69) a , en tout cas,`
- Span file: `workspace-chirho/spans-chirho/vol-2-chirho/page-0148-chirho/line-017-chirho.json`

### medium-chirho vol 2 p0152 L037 S2 (2:152:37:2)

- Signals: `digit-word-superseded-in-stored-text-chirho`
- Span (french-chirho, x 844..1357 of 1357): `le sujet du verbe. En ces con-`
- Evidence (word-db-chirho, x 844..855): `2` after `nw`
- Line text: `Comme NEB le fera, le *G faisait déjà de נקשה ורעב le sujet du verbe. En ces con-`
- Span file: `workspace-chirho/spans-chirho/vol-2-chirho/page-0152-chirho/line-037-chirho.json`

### medium-chirho vol 3 p0148 L011 S0 (3:148:11:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1170 of 1170): `Concluons de ces exemples que la syntaxe naturelle du 6 est bien plus enchaînée`
- Evidence (word-db-chirho, x 805..828): `6` after `du`
- Line text: `Concluons de ces exemples que la syntaxe naturelle du 6 est bien plus enchaînée`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0148-chirho/line-011-chirho.json`

### medium-chirho vol 3 p0148 L023 S0 (3:148:23:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..492 of 492): `plus petites unités textuelles du 6.`
- Evidence (word-db-chirho, x 461..492): `6.` after `du`
- Line text: `plus petites unités textuelles du 6.`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0148-chirho/line-023-chirho.json`

### medium-chirho vol 3 p0148 L024 S0 (3:148:24:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..372 of 372): `2. Les petites unités du 6`
- Evidence (word-db-chirho, x 349..372): `6` after `du`
- Line text: `2. Les petites unités du 6`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0148-chirho/line-024-chirho.json`

### medium-chirho vol 3 p0148 L026 S0 (3:148:26:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1277 of 1277): `selon le M, des textes continus du 6, citons, à titre d'exemple, deux cas où les`
- Evidence (word-db-chirho, x 564..599): `6,` after `du`
- Line text: `selon le M, des textes continus du 6, citons, à titre d'exemple, deux cas où les`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0148-chirho/line-026-chirho.json`

### medium-chirho vol 3 p0148 L027 S0 (3:148:27:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1278 of 1278): `commentateurs du 6 auraient pu l'aider à donner plus de relief à son texte en évitant des`
- Evidence (word-db-chirho, x 276..299): `6` after `du`
- Line text: `commentateurs du 6 auraient pu l'aider à donner plus de relief à son texte en évitant des`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0148-chirho/line-027-chirho.json`

### medium-chirho vol 3 p0148 L047 S0 (3:148:47:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..529 of 529): `3. Les alinéas dans une édition du 5`
- Evidence (word-db-chirho, x 506..529): `5` after `du`
- Line text: `3. Les alinéas dans une édition du 5`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0148-chirho/line-047-chirho.json`

### medium-chirho vol 3 p0148 L048 S0 (3:148:48:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1174 of 1174): `Il vaudrait mieux aborder la ponctuation du 6 à partir de la lecture qu'en font ses`
- Evidence (word-db-chirho, x 646..669): `6` after `du`
- Line text: `Il vaudrait mieux aborder la ponctuation du 6 à partir de la lecture qu'en font ses`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0148-chirho/line-048-chirho.json`

### medium-chirho vol 3 p0148 L050 S0 (3:148:50:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1279 of 1279): `leurs lemmes, il pourrait être opportun que la mise en pages du 6 en alinéas tienne`
- Evidence (word-db-chirho, x 987..1010): `6` after `du`
- Line text: `leurs lemmes, il pourrait être opportun que la mise en pages du 6 en alinéas tienne`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0148-chirho/line-050-chirho.json`

### medium-chirho vol 3 p0148 L058 S0 (3:148:58:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..888 of 888): `un lemme commençant par ces mots et incluant les vss 6 et 7.`
- Evidence (word-db-chirho, x 801..819): `6` after `vss`
- Line text: `un lemme commençant par ces mots et incluant les vss 6 et 7.`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0148-chirho/line-058-chirho.json`

### medium-chirho vol 3 p0149 L010 S1 (3:149:10:1)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 1011..1326 of 1326): `Les divisions du 6`
- Evidence (word-db-chirho, x 1301..1326): `6` after `du`
- Line text: `cxxiv Les divisions du 6`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0149-chirho/line-010-chirho.json`

### medium-chirho vol 3 p0149 L012 S0 (3:149:12:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1280 of 1280): `s'accordent pour achever par cette phrase le premier lemme du chapitre 9 et donc pour`
- Evidence (word-db-chirho, x 1069..1087): `9` after `chapitre`
- Line text: `s'accordent pour achever par cette phrase le premier lemme du chapitre 9 et donc pour`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0149-chirho/line-012-chirho.json`

### medium-chirho vol 3 p0149 L020 S0 (3:149:20:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..324 of 324): `4. Les péricopes du 6`
- Evidence (word-db-chirho, x 301..324): `6` after `du`
- Line text: `4. Les péricopes du 6`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0149-chirho/line-020-chirho.json`

### medium-chirho vol 3 p0149 L027 S0 (3:149:27:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1279 of 1279): `ms Madrid Univ Centr 31 qui commence ici le chapitre 6 de Michée. Quant au 6, c'est`
- Evidence (word-db-chirho, x 830..848): `6` after `chapitre`
- Evidence (word-db-chirho, x 1176..1208): `6,` after `au`
- Line text: `ms Madrid Univ Centr 31 qui commence ici le chapitre 6 de Michée. Quant au 6, c'est`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0149-chirho/line-027-chirho.json`

### medium-chirho vol 3 p0149 L029 S1 (3:149:29:1)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 97..1100 of 1100): `que les mss Vaticanus et Barberini achèvent la péricope 5 de Michée.`
- Evidence (word-db-chirho, x 915..931): `5` after `péricope`
- Line text: `αὐτοῦ. que les mss Vaticanus et Barberini achèvent la péricope 5 de Michée.`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0149-chirho/line-029-chirho.json`

### medium-chirho vol 3 p0149 L053 S0 (3:149:53:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1173 of 1173): `Comme on le voit, une étude des péricopes du 6 mériterait que l'on fasse une`
- Evidence (word-db-chirho, x 711..733): `6` after `du`
- Line text: `Comme on le voit, une étude des péricopes du 6 mériterait que l'on fasse une`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0149-chirho/line-053-chirho.json`

### medium-chirho vol 3 p0149 L057 S0 (3:149:57:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1175 of 1175): `Cette brève étude sur les divisions du 6 nous a fourni des tests qui suffisent à`
- Evidence (word-db-chirho, x 577..599): `6` after `du`
- Line text: `Cette brève étude sur les divisions du 6 nous a fourni des tests qui suffisent à`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0149-chirho/line-057-chirho.json`

### medium-chirho vol 3 p0150 L020 S0 (3:150:20:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1139 of 1139): `A. Témoins du 6 d'Ézéchiel nouveaux ou inexploités par Ziegler.`
- Evidence (word-db-chirho, x 267..291): `6` after `du`
- Line text: `A. Témoins du 6 d'Ézéchiel nouveaux ou inexploités par Ziegler.`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0150-chirho/line-020-chirho.json`

### medium-chirho vol 3 p0150 L022 S0 (3:150:22:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1273 of 1273): `seulement les parties du papyrus 967 conservées dans les collections Chester Beatty et`
- Evidence (word-db-chirho, x 492..549): `967` after `papyrus`
- Line text: `seulement les parties du papyrus 967 conservées dans les collections Chester Beatty et`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0150-chirho/line-022-chirho.json`

### medium-chirho vol 3 p0150 L026 S0 (3:150:26:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1272 of 1272): `voudrions montrer par quelques exemples que les choix textuels de l'édition du 6`
- Evidence (word-db-chirho, x 1250..1272): `6` after `du`
- Line text: `voudrions montrer par quelques exemples que les choix textuels de l'édition du 6`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0150-chirho/line-026-chirho.json`

### medium-chirho vol 3 p0150 L030 S0 (3:150:30:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1027 of 1027): `la critique contemporaine: la polyglotte d'Alcala, édition princeps du 6.`
- Evidence (word-db-chirho, x 997..1027): `6.` after `du`
- Line text: `la critique contemporaine: la polyglotte d'Alcala, édition princeps du 6.`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0150-chirho/line-030-chirho.json`

### medium-chirho vol 3 p0150 L031 S0 (3:150:31:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..268 of 268): `1. Le papyrus 967`
- Evidence (word-db-chirho, x 212..268): `967` after `papyrus`
- Line text: `1. Le papyrus 967`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0150-chirho/line-031-chirho.json`

### medium-chirho vol 3 p0150 L037 S0 (3:150:37:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1274 of 1274): `cet accident. La partie de Madrid de 967 vient maintenant confirmer ce témoignage de`
- Evidence (word-db-chirho, x 546..603): `967` after `de`
- Line text: `cet accident. La partie de Madrid de 967 vient maintenant confirmer ce témoignage de`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0150-chirho/line-037-chirho.json`

### medium-chirho vol 3 p0150 L041 S0 (3:150:41:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1274 of 1274): `plus gravement mutilé que le Vaticanus). Aucune des éditions du 6 (en dehors de celle`
- Evidence (word-db-chirho, x 966..989): `6` after `du`
- Line text: `plus gravement mutilé que le Vaticanus). Aucune des éditions du 6 (en dehors de celle`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0150-chirho/line-041-chirho.json`

### medium-chirho vol 3 p0150 L049 S0 (3:150:49:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1165 of 1165): `c) Éz 40,31. En CT3 332,35-37 nous avons noté le précieux appui que 967`
- Evidence (word-db-chirho, x 1106..1165): `967` after `que`
- Line text: `c) Éz 40,31. En CT3 332,35-37 nous avons noté le précieux appui que 967`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0150-chirho/line-049-chirho.json`

### medium-chirho vol 3 p0150 L055 S0 (3:150:55:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1274 of 1274): `logique lorsqu'il suit nos trois témoins pour omettre les 12 premiers mots de cette lon-`
- Evidence (word-db-chirho, x 832..864): `12` after `les`
- Line text: `logique lorsqu'il suit nos trois témoins pour omettre les 12 premiers mots de cette lon-`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0150-chirho/line-055-chirho.json`

### medium-chirho vol 3 p0151 L006 S0 (3:151:6:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1333 of 1333): `CXXVI Le papyrus 967`
- Evidence (word-db-chirho, x 1270..1333): `967` after `papyrus`
- Line text: `CXXVI Le papyrus 967`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0151-chirho/line-006-chirho.json`

### medium-chirho vol 3 p0151 L022 S2 (3:151:22:2)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 937..1290 of 1290): `nous avons trouvé 967`
- Evidence (word-db-chirho, x 1231..1290): `967` after `trouvé`
- Line text: `palimpseste de Würzburg porte seulement “duces Istrahel nous avons trouvé 967`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0151-chirho/line-022-chirho.json`

### medium-chirho vol 3 p0151 L026 S0 (3:151:26:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1093 of 1093): `tous les autres témoins du 6 nous a été rendue possible par 967 (Cologne).`
- Evidence (word-db-chirho, x 389..412): `6` after `du`
- Line text: `tous les autres témoins du 6 nous a été rendue possible par 967 (Cologne).`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0151-chirho/line-026-chirho.json`

### medium-chirho vol 3 p0151 L028 S0 (3:151:28:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1286 of 1286): `comité montrent que la découverte du papyrus 967 imposerait à un nouvel éditeur du 6`
- Evidence (word-db-chirho, x 695..750): `967` after `papyrus`
- Evidence (word-db-chirho, x 1264..1286): `6` after `du`
- Line text: `comité montrent que la découverte du papyrus 967 imposerait à un nouvel éditeur du 6`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0151-chirho/line-028-chirho.json`

### medium-chirho vol 3 p0151 L030 S0 (3:151:30:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..845 of 845): `2. Relations entre le papyrus 967 et la polyglotte d'Alcala.`
- Evidence (word-db-chirho, x 430..487): `967` after `papyrus`
- Line text: `2. Relations entre le papyrus 967 et la polyglotte d'Alcala.`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0151-chirho/line-030-chirho.json`

### medium-chirho vol 3 p0151 L032 S0 (3:151:32:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1287 of 1287): `papyrus 967 et le texte donné par la polyglotte d'Alcala, édition princeps de la Bible`
- Evidence (word-db-chirho, x 132..187): `967` after `papyrus`
- Line text: `papyrus 967 et le texte donné par la polyglotte d'Alcala, édition princeps de la Bible`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0151-chirho/line-032-chirho.json`

### medium-chirho vol 3 p0151 L038 S2 (3:151:38:2)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 243..1286 of 1286): `mot qui ne réapparaît dans le 6 qu'en Ex 25,11.24.25 pour "1. Or ici`
- Evidence (word-db-chirho, x 698..720): `6` after `le`
- Line text: `(...) κυμάτιον mot qui ne réapparaît dans le 6 qu'en Ex 25,11.24.25 pour "1. Or ici`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0151-chirho/line-038-chirho.json`

### medium-chirho vol 3 p0151 L047 S0 (3:151:47:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1179 of 1179): `Ayant été intrigué par ces relations exclusives entre le papyrus 967 et l'édition`
- Evidence (word-db-chirho, x 955..1009): `967` after `papyrus`
- Line text: `Ayant été intrigué par ces relations exclusives entre le papyrus 967 et l'édition`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0151-chirho/line-047-chirho.json`

### medium-chirho vol 3 p0151 L048 S0 (3:151:48:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1274 of 1274): `princeps du 6, j'ai voulu élargir cette investigation dont voici les résultats essentiels433.`
- Evidence (word-db-chirho, x 180..211): `6,` after `du`
- Line text: `princeps du 6, j'ai voulu élargir cette investigation dont voici les résultats essentiels433.`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0151-chirho/line-048-chirho.json`

### medium-chirho vol 3 p0151 L049 S0 (3:151:49:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1179 of 1179): `De 40,42af jusqu'à la fin du chapitre 46 on peut relever 215 leçons pour`
- Evidence (word-db-chirho, x 611..648): `46` after `chapitre`
- Evidence (word-db-chirho, x 914..971): `215` after `relever`
- Line text: `De 40,42af jusqu'à la fin du chapitre 46 on peut relever 215 leçons pour`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0151-chirho/line-049-chirho.json`

### medium-chirho vol 3 p0151 L050 S0 (3:151:50:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1284 of 1284): `lesquelles 967 n'a l'appui d'aucun autre manuscrit attesté par l'apparat critique de Zi.`
- Evidence (word-db-chirho, x 154..211): `967` after `lesquelles`
- Line text: `lesquelles 967 n'a l'appui d'aucun autre manuscrit attesté par l'apparat critique de Zi.`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0151-chirho/line-050-chirho.json`

### medium-chirho vol 3 p0152 L008 S0 (3:152:8:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..558 of 558): `2a. Classsification des 215 leçons{34`
- Evidence (word-db-chirho, x 361..413): `215` after `des`
- Line text: `2a. Classsification des 215 leçons{34`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0152-chirho/line-008-chirho.json`

### medium-chirho vol 3 p0152 L013 S0 (3:152:13:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..582 of 1167): `a) sur 10 cas où 967 donne seulement`
- Evidence (word-db-chirho, x 104..137): `10` after `sur`
- Evidence (word-db-chirho, x 255..310): `967` after `où`
- Line text: `a) sur 10 cas où 967 donne seulement κύριος comme nom divin, alors que les`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0152-chirho/line-013-chirho.json`

### medium-chirho vol 3 p0152 L027 S0 (3:152:27:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..416 of 416): `B) sur 7 ‘moins’ de préfixes,`
- Evidence (word-db-chirho, x 98..116): `7` after `sur`
- Line text: `B) sur 7 ‘moins’ de préfixes,`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0152-chirho/line-027-chirho.json`

### medium-chirho vol 3 p0152 L038 S0 (3:152:38:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..765 of 765): `y) sur 4 ‘moins’ haplographiques de plusieurs mots,`
- Evidence (word-db-chirho, x 97..116): `4` after `sur`
- Line text: `y) sur 4 ‘moins’ haplographiques de plusieurs mots,`
- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0152-chirho/line-038-chirho.json`

### medium-chirho vol 4 p0148 L012 S3 (4:148:12:3)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 848..1176 of 1176): `Quant à la 5, elle`
- Evidence (word-db-chirho, x 1063..1098): `5,` after `la`
- Line text: `accinctus J in Deo meo transiliam murum Quant à la 5, elle`
- Span file: `workspace-chirho/spans-chirho/vol-4-chirho/page-0148-chirho/line-012-chirho.json`

### medium-chirho vol 4 p0148 L020 S2 (4:148:20:2)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 270..1182 of 1182): `le mot 7111 qu'il ne comprenait pas. Ici le`
- Evidence (word-db-chirho, x 440..523): `7111` after `mot`
- Line text: `par γεδδουρ le mot 7111 qu'il ne comprenait pas. Ici le`
- Span file: `workspace-chirho/spans-chirho/vol-4-chirho/page-0148-chirho/line-020-chirho.json`

### medium-chirho vol 4 p0148 L030 S0 (4:148:30:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1181 of 1181): `complément 11) en son sens normal de ‘rezzou’ convient`
- Evidence (word-db-chirho, x 255..338): `11)` after `complément`
- Line text: `complément 11) en son sens normal de ‘rezzou’ convient`
- Span file: `workspace-chirho/spans-chirho/vol-4-chirho/page-0148-chirho/line-030-chirho.json`

### medium-chirho vol 4 p0150 L019 S0 (4:150:19:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..386 of 1181): `656. ou, à 0: à`
- Evidence (word-db-chirho, x 266..311): `0:` after `à`
- Line text: `656. ou, à 0: à θεὸς à περιζωννύων με δύναμιν ∫ Kai`
- Span file: `workspace-chirho/spans-chirho/vol-4-chirho/page-0150-chirho/line-019-chirho.json`

### medium-chirho vol 4 p0152 L006 S0 (4:152:6:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1182 of 1182): `tographie, J1-6 se fonde sur le 6 et les versions de Samuel pour`
- Evidence (word-db-chirho, x 583..597): `6` after `le`
- Line text: `tographie, J1-6 se fonde sur le 6 et les versions de Samuel pour`
- Span file: `workspace-chirho/spans-chirho/vol-4-chirho/page-0152-chirho/line-006-chirho.json`

### medium-chirho vol 4 p0152 L008 S0 (4:152:8:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1237 of 1237): `10 debout sur les hauteurs (1: sur les hauteurs me tient debout)”.`
- Evidence (word-db-chirho, x 486..545): `(1:` after `hauteurs`
- Line text: `10 debout sur les hauteurs (1: sur les hauteurs me tient debout)”.`
- Span file: `workspace-chirho/spans-chirho/vol-4-chirho/page-0152-chirho/line-008-chirho.json`

### medium-chirho vol 4 p0152 L009 S2 (4:152:9:2)

- Signals: `digit-word-superseded-in-stored-text-chirho`
- Span (french-chirho, x 776..966 of 1180): `avec le`
- Evidence (word-db-chirho, x 932..960): `6` after `le`
- Line text: `Selon BROCKINGTON, [R]NEB lit בָמוֹת avec le 𝔊 quand elle`
- Span file: `workspace-chirho/spans-chirho/vol-4-chirho/page-0152-chirho/line-009-chirho.json`

### medium-chirho vol 4 p0152 L021 S0 (4:152:21:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1046 of 1046): `J123 se fonde sur le 6 pour éliminer le possessif de “mes`
- Evidence (word-db-chirho, x 382..410): `6` after `le`
- Line text: `J123 se fonde sur le 6 pour éliminer le possessif de “mes`
- Span file: `workspace-chirho/spans-chirho/vol-4-chirho/page-0152-chirho/line-021-chirho.json`

### medium-chirho vol 4 p0152 L024 S2 (4:152:24:2)

- Signals: `digit-word-superseded-in-stored-text-chirho`
- Span (french-chirho, x 465..615 of 1177): `avec le`
- Evidence (word-db-chirho, x 482..510): `6` after `le`
- Line text: `[R]NEB lit בָמוֹת avec le 𝔊 quand elle donne: “who makes me`
- Span file: `workspace-chirho/spans-chirho/vol-4-chirho/page-0152-chirho/line-024-chirho.json`

### medium-chirho vol 4 p0152 L034 S0 (4:152:34:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1038 of 1038): `Se fondant sur le 6 du Psaume, Krrte en BH23 pour`
- Evidence (word-db-chirho, x 349..377): `6` after `le`
- Line text: `Se fondant sur le 6 du Psaume, Krrte en BH23 pour`
- Span file: `workspace-chirho/spans-chirho/vol-4-chirho/page-0152-chirho/line-034-chirho.json`

### medium-chirho vol 5 p0052 L011 S0 (5:52:11:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1218 of 2275): `Naples. Il ajoute que 6 autres de ses`
- Evidence (word-db-chirho, x 705..737): `6` after `que`
- Line text: `Naples. Il ajoute que 6 autres de ses mss outre la vocalisation shewa`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-011-chirho.json`

### medium-chirho vol 5 p0052 L015 S0 (5:52:15:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..2021 of 2271): `est omis par 4 (espagnol, XV s.) ou transféré au ‘ṣadé’`
- Evidence (word-db-chirho, x 484..521): `4` after `par`
- Line text: `est omis par 4 (espagnol, XV s.) ou transféré au ‘ṣadé’ par 379`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-015-chirho.json`

### medium-chirho vol 5 p0052 L015 S1 (5:52:15:1)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 2021..2271 of 2271): `par 379`
- Evidence (word-db-chirho, x 2164..2271): `379` after `par`
- Line text: `est omis par 4 (espagnol, XV s.) ou transféré au ‘ṣadé’ par 379`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-015-chirho.json`

### medium-chirho vol 5 p0052 L021 S2 (5:52:21:2)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 1602..2275 of 2275): `3, 26, 105; Berlin Or`
- Evidence (word-db-chirho, x 1602..1667): `3,` after `hébr`
- Line text: `Elle est attestée aussi par les mss Paris BN hébr 3, 26, 105; Berlin Or`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-021-chirho.json`

### medium-chirho vol 5 p0052 L022 S2 (5:52:22:2)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 551..1028 of 2275): `7, 468, 482;`
- Evidence (word-db-chirho, x 551..624): `7,` after `ebr`
- Line text: `fol 4; Vat ebr 7, 468, 482; London BL Add 15250, 15251, 21161,`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-022-chirho.json`

### medium-chirho vol 5 p0052 L023 S1 (5:52:23:1)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 280..525 of 2275): `or 16,`
- Evidence (word-db-chirho, x 385..490): `16,` after `or`
- Line text: `Arundel or 16, Harley 1528; Madrid Univ hebr 1; Milan Ambr ebr 5;`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-023-chirho.json`

### medium-chirho vol 5 p0052 L023 S5 (5:52:23:5)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 1575..1890 of 2275): `1; Milan`
- Evidence (word-db-chirho, x 1575..1645): `1;` after `hebr`
- Line text: `Arundel or 16, Harley 1528; Madrid Univ hebr 1; Milan Ambr ebr 5;`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-023-chirho.json`

### medium-chirho vol 5 p0052 L023 S7 (5:52:23:7)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 2205..2275 of 2275): `5;`
- Evidence (word-db-chirho, x 2205..2275): `5;` after `ebr`
- Line text: `Arundel or 16, Harley 1528; Madrid Univ hebr 1; Milan Ambr ebr 5;`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-023-chirho.json`

### medium-chirho vol 5 p0052 L024 S3 (5:52:24:3)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 875..1365 of 2275): `7; Copenhague`
- Evidence (word-db-chirho, x 875..945): `7;` after `hebr`
- Line text: `Parme 2668; Hamburg hebr 7; Copenhague hebr 1, 2, 4, 5; Wien hebr`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-024-chirho.json`

### medium-chirho vol 5 p0052 L024 S5 (5:52:24:5)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 1540..1960 of 2275): `1, 2, 4, 5;`
- Evidence (word-db-chirho, x 1540..1610): `1,` after `hebr`
- Line text: `Parme 2668; Hamburg hebr 7; Copenhague hebr 1, 2, 4, 5; Wien hebr`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-024-chirho.json`

### medium-chirho vol 5 p0052 L027 S0 (5:52:27:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1925 of 2046): `Le ms babylonien Berlin Or qu 680 porte clairement les 3 ,`
- Evidence (word-db-chirho, x 996..1095): `680` after `qu`
- Evidence (word-db-chirho, x 1825..1859): `3` after `les`
- Line text: `Le ms babylonien Berlin Or qu 680 porte clairement les 3 , ḥireq`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-027-chirho.json`

### medium-chirho vol 5 p0052 L028 S0 (5:52:28:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..270 of 480): `et les 2`
- Evidence (word-db-chirho, x 210..240): `2` after `les`
- Line text: `et les 2 dagesh`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-028-chirho.json`

### medium-chirho vol 5 p0052 L029 S3 (5:52:29:3)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 1752..2050 of 2050): `3 et la 1 e`
- Evidence (word-db-chirho, x 1752..1783): `3` after `ebr`
- Line text: `Un ‘yod’ après le ‘ṣadé’ est attesté par les mss Vat ebr 3 et la 1 e`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-029-chirho.json`

### medium-chirho vol 5 p0052 L032 S5 (5:52:32:5)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 1291..1443 of 2050): `28;`
- Evidence (word-db-chirho, x 1291..1405): `28;` after `hebr`
- Line text: `Les mss Urbinates 1; Hamburg hebr 28; London BL Harley`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-032-chirho.json`

### medium-chirho vol 5 p0052 L034 S2 (5:52:34:2)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 1439..1807 of 2275): `9 porte le`
- Evidence (word-db-chirho, x 1439..1472): `9` after `hebr`
- Line text: `consonnes suivantes. Le ms Copenhague hebr 9 porte le shewa sans que`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0052-chirho/line-034-chirho.json`

### medium-chirho vol 5 p0054 L034 S3 (5:54:34:3)

- Signals: `digit-word-superseded-in-stored-text-chirho`
- Span (french-chirho, x 1146..2271 of 2271): `, expliquant qu'il s'agit du`
- Evidence (word-db-chirho, x 1213..1246): `8` after `'`
- Line text: `épines. YÉFET BEN ÉLY traduit: والي السنان , expliquant qu'il s'agit du`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0054-chirho/line-034-chirho.json`

### medium-chirho vol 5 p0057 L007 S0 (5:57:7:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..579 of 2275): `sont écrits 3 fois`
- Evidence (word-db-chirho, x 366..396): `3` after `écrits`
- Line text: `sont écrits 3 fois plene, en Jg 13,8; 18,29 et Jb 5, 7 Sur les deux autres`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0057-chirho/line-007-chirho.json`

### medium-chirho vol 5 p0057 L009 S6 (5:57:9:6)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 1580..2275 of 2275): `2, sur Jg 13,8, groupe`
- Evidence (word-db-chirho, x 1580..1643): `2,` after `hébr`
- Line text: `trois fois avec dagesh et plene. Le ms Paris hébr 2, sur Jg 13,8, groupe`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0057-chirho/line-009-chirho.json`

### medium-chirho vol 5 p0058 L032 S0 (5:58:32:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..2271 of 2271): `même omission en 9 mss et dans la 1 main de 11 autres. Cette`
- Evidence (word-db-chirho, x 1312..1350): `1` after `la`
- Evidence (word-db-chirho, x 1699..1770): `11` after `de`
- Line text: `même omission en 9 mss et dans la 1 main de 11 autres. Cette`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0058-chirho/line-032-chirho.json`

### medium-chirho vol 5 p0059 L011 S0 (5:59:11:0)

- Signals: `digit-word-superseded-in-stored-text-chirho`
- Span (french-chirho, x 0..638 of 638): `son édition de 1557`
- Evidence (word-db-chirho, x 486..584): `155` after `de`
- Line text: `son édition de 1557`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0059-chirho/line-011-chirho.json`

### medium-chirho vol 5 p0063 L012 S3 (5:63:12:3)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 1451..2275 of 2275): `dans la 1 main de 4 et la`
- Evidence (word-db-chirho, x 1702..1734): `1` after `la`
- Evidence (word-db-chirho, x 2046..2079): `4` after `de`
- Line text: `KENNICOTT , signale cette graphie en 23 mss dans la 1 main de 4 et la`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0063-chirho/line-012-chirho.json`

### medium-chirho vol 5 p0148 L005 S4 (5:148:5:4)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 738..2271 of 2271): `un appui précis en 1) et en 2), alors qu'en 3) il`
- Evidence (word-db-chirho, x 2115..2177): `3)` after `qu'en`
- Line text: `le 𝔊 qui apporte au 𝔐 un appui précis en 1) et en 2), alors qu'en 3) il`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0148-chirho/line-005-chirho.json`

### medium-chirho vol 5 p0148 L008 S0 (5:148:8:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..2271 of 2271): `accusatif de la 1 pers. sing. et qu'en 4) il a seulement fait une fausse`
- Evidence (word-db-chirho, x 494..525): `1` after `la`
- Evidence (word-db-chirho, x 1232..1295): `4)` after `qu'en`
- Line text: `accusatif de la 1 pers. sing. et qu'en 4) il a seulement fait une fausse`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0148-chirho/line-008-chirho.json`

### medium-chirho vol 5 p0148 L009 S2 (5:148:9:2)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 700..2271 of 2271): `a assimilé la forme verbale de 1) à celle du verbe`
- Evidence (word-db-chirho, x 1674..1737): `1)` after `de`
- Line text: `option de sens. La 𝔖) a assimilé la forme verbale de 1) à celle du verbe`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0148-chirho/line-009-chirho.json`

### medium-chirho vol 5 p0148 L015 S0 (5:148:15:0)

- Signals: `orphan-digit-word-chirho`
- Span (french-chirho, x 0..1605 of 1605): `pourtant l'attestation du suffixe de la 1 pers. en 2).`
- Evidence (word-db-chirho, x 1183..1213): `1` after `la`
- Line text: `pourtant l'attestation du suffixe de la 1 pers. en 2).`
- Span file: `workspace-chirho/spans-chirho/vol-5-chirho/page-0148-chirho/line-015-chirho.json`
