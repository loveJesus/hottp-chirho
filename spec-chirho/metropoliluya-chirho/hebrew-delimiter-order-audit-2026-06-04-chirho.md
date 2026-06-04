<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Hebrew Delimiter Order Audit Chirho

Generated: 2026-06-04T11:29:02.198Z

This is a read-only mechanical audit for Hebrew spans that contain parentheses, square brackets, or braces. It does not certify text and does not change the gate. It exists to catch the strict-blind visual-order bug class where Hebrew parentheses were stored as a close delimiter before an open delimiter.
Neighbor-unbalanced rows are review targets, not automatic defects; Qumran/DSS lacuna notation can legitimately be damaged or unresolved until an expert confirms it.

## Summary

- Hebrew delimiter span count: 11
- Close-before-open suspect count: 0
- Neighbor-unbalanced review count: 1
- balanced-in-span-chirho: 6
- neighbor-balanced-across-spans-chirho: 4
- neighbor-unbalanced-review-chirho: 1

## Details

Location | Status | Provenance | Hebrew span text | Notes | Rendered line text
--- | --- | --- | --- | --- | ---
v1 p151 L7 S1 | balanced-in-span-chirho | vision-chirho | (ואחמדם ואקחם) | all delimiter pairs balance within the Hebrew span | tiques Jos 7,21 (ואחמדם ואקחם) et Dt 7,25 (לא תחמד ... ולקחת לך) en un contexte
v1 p151 L7 S3 | balanced-in-span-chirho | vision-chirho | (לא תחמד ... ולקחת לך) | all delimiter pairs balance within the Hebrew span | tiques Jos 7,21 (ואחמדם ואקחם) et Dt 7,25 (לא תחמד ... ולקחת לך) en un contexte
v1 p152 L37 S1 | neighbor-balanced-across-spans-chirho | none-chirho | (שֵׁבֶט | span-level round-chirho imbalance balances with adjacent line span text | 1. Juda est désigné une fois comme tribu (שֵׁבֶט au vs 16), une autre fois comme
v1 p152 L38 S1 | neighbor-balanced-across-spans-chirho | none-chirho | (מַטֶּה | span-level round-chirho imbalance balances with adjacent line span text | phratrie (מַטֶּה au vs 18) et encore une fois comme clan (מִשְׁפָּחָה au vs 17). Cette
v1 p152 L38 S3 | neighbor-balanced-across-spans-chirho | none-chirho | (מִשְׁפָּחָה | span-level round-chirho imbalance balances with adjacent line span text | phratrie (מַטֶּה au vs 18) et encore une fois comme clan (מִשְׁפָּחָה au vs 17). Cette
v2 p148 L11 S1 | balanced-in-span-chirho | none-chirho | (וְיַסִּירֵנִי) | all delimiter pairs balance within the Hebrew span | donné (וְיַסִּירֵנִי) de même que ThAq dont la leçon (καὶ ἀποστήσει LE) nous est rappor-
v2 p148 L22 S1 | neighbor-unbalanced-review-chirho | none-chirho | [מ̇ק̇[י | span-level square-chirho imbalance does not balance with adjacent line span text | de Qumrän : L'’allusion la plus formelle est en 11QMelchisédec, 1. 25 où se lit [מ̇ק̇[י
v2 p148 L23 S0 | balanced-in-span-chirho | vision-chirho | הברית הסרים מלכת [בד]ר̇ך̇ הָעָם. | all delimiter pairs balance within the Hebrew span | הברית הסרים מלכת [בד]ר̇ך̇ הָעָם. On a une allusion très semblable en 1QSa I 2s : un
v2 p150 L37 S1 | neighbor-balanced-across-spans-chirho | none-chirho | (לְמִקְדָּשׁ | span-level round-chirho imbalance balances with adjacent line span text | 83) a proposé pour le second (לְמִקְדָּשׁ au vs 14) de lire מַקְשִׁר “ou quelque chose de
v4 p150 L13 S1 | balanced-in-span-chirho | vision-chirho | הָאֵל הַמְאַ[....] חָיִל | all delimiter pairs balance within the Hebrew span | Ps 18,33. — Hev (42189) porte: הָאֵל הַמְאַ[....] חָיִל
v5 p51 L27 S1 | balanced-in-span-chirho | vision-chirho | צְמִ[א]ִים | all delimiter pairs balance within the Hebrew span | 5,5C. — La correction de [N]RSV en צְמִ[א]ִים a été requise et
