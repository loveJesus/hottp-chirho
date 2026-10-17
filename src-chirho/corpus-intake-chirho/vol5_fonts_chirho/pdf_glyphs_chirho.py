# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Per-glyph positions from a PDF page's text operators.

Poppler's text tools group glyphs into strings and guess spaces, which loses
what the vol 5 font decoder needs: each glyph's position and the order in
which it was drawn. This walks the page content stream with the text state
of the PDF specification (Tf, Tm, Td, TD, T*, TL, Tc, Tw, Tz, Ts and the
showing operators) under the q/Q/cm graphics state, which also saves and
restores the text state. Single-byte simple fonts only, which is what vol 5
uses. Text inside form XObjects is not followed; a sample of 145 vol 5
pages had none, and pages that do carry it are reported.

Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
"""
from dataclasses import dataclass

import pikepdf

SHOW_OPERATORS_CHIRHO = {"Tj", "TJ", "'", '"'}


@dataclass(frozen=True)
class GlyphChirho:
    seq_chirho: int  # drawing order on the page
    op_chirho: int  # index of the operator that showed the glyph
    font_chirho: str  # BaseFont, e.g. "YDQCAM+NewJerusalemU"
    code_chirho: int  # single-byte character code
    x_chirho: float  # glyph origin in PDF points, origin at the bottom left
    y_chirho: float
    size_chirho: float  # effective font size in points


def _mul_chirho(a_chirho, b_chirho):
    """Affine [a b c d e f] product: a_chirho applied first, then b_chirho."""
    a, b, c, d, e, f = a_chirho
    g, h, i, j, k, l = b_chirho
    return [a * g + b * i, a * h + b * j, c * g + d * i, c * h + d * j, e * g + f * i + k, e * h + f * j + l]


def _widths_chirho(font_chirho):
    first_chirho = int(font_chirho.get("/FirstChar", 0))
    widths_chirho = [float(w_chirho) for w_chirho in font_chirho.get("/Widths", [])]

    def width_chirho(code_chirho: int) -> float:
        index_chirho = code_chirho - first_chirho
        return widths_chirho[index_chirho] if 0 <= index_chirho < len(widths_chirho) else 0.0

    return width_chirho


def form_xobjects_with_text_chirho(page_chirho: pikepdf.Page) -> list[str]:
    """Names of form XObjects on the page whose content shows text."""
    names_chirho = []
    for name_chirho, xobject_chirho in page_chirho.Resources.get("/XObject", {}).items():
        if xobject_chirho.get("/Subtype") != "/Form":
            continue
        if any(str(op_chirho) in SHOW_OPERATORS_CHIRHO for _, op_chirho in pikepdf.parse_content_stream(xobject_chirho)):
            names_chirho.append(str(name_chirho))
    return names_chirho


def page_glyphs_chirho(page_chirho: pikepdf.Page) -> list[GlyphChirho]:
    """Every glyph the page content shows, in drawing order."""
    fonts_chirho = {str(k_chirho): v_chirho for k_chirho, v_chirho in page_chirho.Resources.get("/Font", {}).items()}
    glyphs_chirho: list[GlyphChirho] = []
    state_chirho = {
        "ctm": [1.0, 0.0, 0.0, 1.0, 0.0, 0.0], "tc": 0.0, "tw": 0.0, "th": 1.0, "tl": 0.0, "ts": 0.0,
        "font": None, "base": "", "size": 0.0, "width": (lambda _code_chirho: 0.0),
    }
    stack_chirho = []
    tm_chirho = tlm_chirho = [1.0, 0.0, 0.0, 1.0, 0.0, 0.0]

    def show_chirho(data_chirho, op_index_chirho):
        nonlocal tm_chirho
        for code_chirho in bytes(data_chirho):
            s_chirho = state_chirho
            trm_chirho = _mul_chirho([s_chirho["size"] * s_chirho["th"], 0, 0, s_chirho["size"], 0, s_chirho["ts"]],
                                     _mul_chirho(tm_chirho, s_chirho["ctm"]))
            glyphs_chirho.append(GlyphChirho(len(glyphs_chirho), op_index_chirho, s_chirho["base"], code_chirho,
                                             trm_chirho[4], trm_chirho[5], abs(trm_chirho[3])))
            w0_chirho = s_chirho["width"](code_chirho) / 1000.0
            tx_chirho = (w0_chirho * s_chirho["size"] + s_chirho["tc"] + (s_chirho["tw"] if code_chirho == 32 else 0.0)) * s_chirho["th"]
            tm_chirho = _mul_chirho([1, 0, 0, 1, tx_chirho, 0], tm_chirho)

    for op_index_chirho, (operands_chirho, op_chirho) in enumerate(pikepdf.parse_content_stream(page_chirho)):
        o_chirho = str(op_chirho)
        if o_chirho == "q":
            stack_chirho.append(dict(state_chirho, ctm=list(state_chirho["ctm"])))
        elif o_chirho == "Q":
            state_chirho = stack_chirho.pop()
        elif o_chirho == "cm":
            state_chirho["ctm"] = _mul_chirho([float(v_chirho) for v_chirho in operands_chirho], state_chirho["ctm"])
        elif o_chirho == "BT":
            tm_chirho = tlm_chirho = [1.0, 0.0, 0.0, 1.0, 0.0, 0.0]
        elif o_chirho == "Tf":
            font_chirho = fonts_chirho.get(str(operands_chirho[0]))
            state_chirho["font"] = font_chirho
            state_chirho["base"] = str(font_chirho.get("/BaseFont", "")).lstrip("/") if font_chirho is not None else ""
            state_chirho["size"] = float(operands_chirho[1])
            state_chirho["width"] = _widths_chirho(font_chirho) if font_chirho is not None else (lambda _code_chirho: 0.0)
        elif o_chirho == "Tm":
            tm_chirho = tlm_chirho = [float(v_chirho) for v_chirho in operands_chirho]
        elif o_chirho in ("Td", "TD"):
            tx_chirho, ty_chirho = float(operands_chirho[0]), float(operands_chirho[1])
            if o_chirho == "TD":
                state_chirho["tl"] = -ty_chirho
            tm_chirho = tlm_chirho = _mul_chirho([1, 0, 0, 1, tx_chirho, ty_chirho], tlm_chirho)
        elif o_chirho == "T*":
            tm_chirho = tlm_chirho = _mul_chirho([1, 0, 0, 1, 0, -state_chirho["tl"]], tlm_chirho)
        elif o_chirho == "TL":
            state_chirho["tl"] = float(operands_chirho[0])
        elif o_chirho == "Tc":
            state_chirho["tc"] = float(operands_chirho[0])
        elif o_chirho == "Tw":
            state_chirho["tw"] = float(operands_chirho[0])
        elif o_chirho == "Tz":
            state_chirho["th"] = float(operands_chirho[0]) / 100.0
        elif o_chirho == "Ts":
            state_chirho["ts"] = float(operands_chirho[0])
        elif o_chirho == "Tj":
            show_chirho(operands_chirho[0], op_index_chirho)
        elif o_chirho == "'":
            tm_chirho = tlm_chirho = _mul_chirho([1, 0, 0, 1, 0, -state_chirho["tl"]], tlm_chirho)
            show_chirho(operands_chirho[0], op_index_chirho)
        elif o_chirho == '"':
            state_chirho["tw"], state_chirho["tc"] = float(operands_chirho[0]), float(operands_chirho[1])
            tm_chirho = tlm_chirho = _mul_chirho([1, 0, 0, 1, 0, -state_chirho["tl"]], tlm_chirho)
            show_chirho(operands_chirho[2], op_index_chirho)
        elif o_chirho == "TJ":
            for item_chirho in operands_chirho[0]:
                if isinstance(item_chirho, pikepdf.String):
                    show_chirho(item_chirho, op_index_chirho)
                else:
                    shift_chirho = -float(item_chirho) / 1000.0 * state_chirho["size"] * state_chirho["th"]
                    tm_chirho = _mul_chirho([1, 0, 0, 1, shift_chirho, 0], tm_chirho)
    return glyphs_chirho
