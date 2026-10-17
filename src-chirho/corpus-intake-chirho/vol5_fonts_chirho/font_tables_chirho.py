# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Code tables for vol 5's embedded Hebrew font subsets, and their metrics.

Vol 5 sets Hebrew in Linguist's Software NewJerusalemU, embedded without a
Unicode map. Each subset is one PDF object shared by the whole volume, so a
code means one glyph everywhere. The main subset (YDQCAM) lost its glyph
names and was identified from a rendered glyph sheet, glyph boxes and outline
contour counts; the second (NDFBXO, MacRoman encoded) keeps glyph names and
holds the dagesh forms, shin and sin, punctuation and the real space glyph.
Identifications were checked against vol 5's reviewed spans and the WLC
(spec-chirho/tasklists-chirho/corpus-chirho/26-10-16_13-45-tasklist-full_corpus_intake-chirho.md).

Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
"""
import io

import pikepdf
from fontTools.ttLib import TTFont

MAIN_SUBSET_CHIRHO = "YDQCAM+NewJerusalemU"
SECOND_SUBSET_CHIRHO = "NDFBXO+NewJerusalemU"
HEBREW_SUBSETS_CHIRHO = (MAIN_SUBSET_CHIRHO, SECOND_SUBSET_CHIRHO)

DAGESH_CHIRHO = "\u05BC"
SHIN_DOT_CHIRHO = "\u05C1"
SIN_DOT_CHIRHO = "\u05C2"
HOLAM_CHIRHO = "\u05B9"
RAFE_CHIRHO = "\u05BF"

# YDQCAM codes (its ToUnicode map is the identity, so pdftohtml shows these
# ASCII characters). Code 0x39 is plain pe: one contour, its inner tongue
# reading as a dot on the sheet. 0x3F, 0x4F and 0x67 are dots above the
# letter, holam in the reviewed text; 0x62 sits over the right edge.
_MAIN_BY_CHAR_CHIRHO = {
    "!": "כ", '"': "\u05B2", "#": "ר", "$": "\u05B5", "%": "ב", "&": "𝔐", "'": "𝔙", "(": "𝔊", ")": "𝔖", "*": "𝔗",
    "+": "\u05B8", ",": "\u05B6", "-": "\u05B0", ".": "י", "/": "ך\u05B0", "0": "\u05B4", "1": "א", "2": "ח",
    "3": "\u05B7", "4": "ל", "5": "ו", "6": "ה", "7": "מ" + DAGESH_CHIRHO, "8": "מ", "9": "פ", ":": "ם",
    ";": "ל" + DAGESH_CHIRHO, "<": "\u05BB", "=": "ס", ">": "ת", "?": HOLAM_CHIRHO, "@": "ע", "A": "\u05B1",
    "B": "ק", "C": "נ", "D": "ט", "E": "\u05BE", "F": "ג", "G": "ך\u05B8", "H": "ד", "I": "צ", "J": "ז",
    "K": "ך", "L": "ץ", "M": "ף", "N": "ן", "O": HOLAM_CHIRHO, "P": "\u05F4", "Q": "ש", "R": "\u05A8", "S": DAGESH_CHIRHO,
    "T": "ù", "U": "\u0591\u05B8", "V": "\u05BD\u05B8", "W": "\u05F3", "X": "\u05B3", "Y": "\u0591\u05B5",
    "Z": "\u05B7", "[": "β", "\\": "\u05C3", "]": "ו" + HOLAM_CHIRHO, "^": RAFE_CHIRHO, "_": "\u05AF", "`": "\u05AA",
    "a": "\u05BD\u05B0", "b": SHIN_DOT_CHIRHO, "c": "÷", "d": "\u05BD", "e": "\u05BD\u05B4", "f": "ר" + DAGESH_CHIRHO,
    "g": HOLAM_CHIRHO,
}
# Marks and accents identified by shape only; decoded text reports them.
UNCERTAIN_MAIN_CHARS_CHIRHO = frozenset("RUVWY^`ae")

# NDFBXO is MacRoman encoded: keys are the MacRoman characters of its glyph names.
_SECOND_BY_CHAR_CHIRHO = {
    " ": " ", "'": "'", "(": "(", ")": ")", ",": ",", "-": "-", ".": ".", "/": "/", ":": ":", "?": "?", "[": "[", "]": "]",
    "a": "a", "d": "d", "e": "e", "g": "g", "o": "o", "s": "s", "u": "u", "§": "§",
    "Ä": "א" + HOLAM_CHIRHO, "ù": "",  # 0x9D draws nothing: a zero-width spacer
    "›": "ש" + SHIN_DOT_CHIRHO, "‡": "ש" + SIN_DOT_CHIRHO,
    "·": "ש" + DAGESH_CHIRHO + SHIN_DOT_CHIRHO, "‚": "ש" + DAGESH_CHIRHO + SIN_DOT_CHIRHO,
    "Ê": "ב" + DAGESH_CHIRHO, "Á": "ג" + DAGESH_CHIRHO, "Ë": "ד" + DAGESH_CHIRHO, "È": "ה" + DAGESH_CHIRHO,
    "Í": "ו" + DAGESH_CHIRHO, "Î": "ז" + DAGESH_CHIRHO, "Ï": "ט" + DAGESH_CHIRHO, "Ì": "י" + DAGESH_CHIRHO,
    "Ó": "ך" + DAGESH_CHIRHO, "Ô": "כ" + DAGESH_CHIRHO, "Ú": "נ" + DAGESH_CHIRHO, "Û": "ס" + DAGESH_CHIRHO,
    "ı": "פ" + DAGESH_CHIRHO, "ˆ": "צ" + DAGESH_CHIRHO, "˜": "ק" + DAGESH_CHIRHO, "˙": "ת" + DAGESH_CHIRHO,
    "˚": "ו" + HOLAM_CHIRHO, "¸": "ב" + RAFE_CHIRHO,
}

CODE_TABLES_CHIRHO: dict[str, dict[int, str]] = {
    MAIN_SUBSET_CHIRHO: {ord(k_chirho): v_chirho for k_chirho, v_chirho in _MAIN_BY_CHAR_CHIRHO.items()},
    SECOND_SUBSET_CHIRHO: {k_chirho.encode("mac_roman")[0]: v_chirho for k_chirho, v_chirho in _SECOND_BY_CHAR_CHIRHO.items()},
}
UNCERTAIN_CODES_CHIRHO: dict[str, frozenset[int]] = {
    MAIN_SUBSET_CHIRHO: frozenset(ord(c_chirho) for c_chirho in UNCERTAIN_MAIN_CHARS_CHIRHO),
    SECOND_SUBSET_CHIRHO: frozenset(),
}
SPACE_CODES_CHIRHO: dict[str, frozenset[int]] = {MAIN_SUBSET_CHIRHO: frozenset(), SECOND_SUBSET_CHIRHO: frozenset({0x20})}


def subset_metrics_chirho(pdf_chirho: pikepdf.Pdf, base_font_chirho: str) -> dict[int, tuple[float, float, float]]:
    """(ink x-min, ink x-max, advance) in font units per code, from the embedded subset."""
    for page_chirho in pdf_chirho.pages:
        for font_chirho in page_chirho.Resources.get("/Font", {}).values():
            if str(font_chirho.get("/BaseFont", "")).lstrip("/") != base_font_chirho:
                continue
            tt_chirho = TTFont(io.BytesIO(font_chirho["/FontDescriptor"]["/FontFile2"].read_bytes()))
            cmap_chirho = next(t_chirho for t_chirho in tt_chirho["cmap"].tables if (t_chirho.platformID, t_chirho.platEncID) == (1, 0)).cmap
            metrics_chirho = {}
            for code_chirho, glyph_name_chirho in cmap_chirho.items():
                glyph_chirho = tt_chirho["glyf"][glyph_name_chirho]
                advance_chirho = float(tt_chirho["hmtx"][glyph_name_chirho][0])
                if glyph_chirho.numberOfContours:
                    metrics_chirho[code_chirho] = (float(glyph_chirho.xMin), float(glyph_chirho.xMax), advance_chirho)
                else:
                    metrics_chirho[code_chirho] = (0.0, 0.0, advance_chirho)
            return metrics_chirho
    raise LookupError(f"font subset {base_font_chirho} is not in this PDF")
