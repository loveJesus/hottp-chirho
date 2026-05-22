#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Per-letter font specimen (interactive). Renders EVERY saved spine
(glyph_spines_chirho, ALL rows incl. unrefined) on its own through the real
stroke pipeline, with a one-click DELETE per tile so bad saved spines can be
pruned fast. Deletes go through the server (backup-then-remove); this script
only emits the HTML.

Run via the server:  bun src-chirho/font-specimen-server-chirho.ts  -> :8770
(standalone: writes workspace-chirho/strokes-view-chirho/specimen-chirho.html)
"""
import base64
import io
import json
import sqlite3
from pathlib import Path

import numpy as np
from PIL import Image

from compose_synthetic_strokes_chirho import render_glyph_ink_chirho

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
FONT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-v3-chirho"
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
OUT_PATH_CHIRHO = (
    PROJECT_ROOT_CHIRHO / "workspace-chirho" / "strokes-view-chirho" / "specimen-chirho.html"
)
SAMPLES_CHIRHO = 3
DISPLAY_H_CHIRHO = 92


def all_saved_variants_chirho():
    """Every glyph_spines_chirho row -> (cp, fn, letter, variant_dict)."""
    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    try:
        rows_chirho = conn_chirho.execute(
            "SELECT codepoint_chirho, filename_chirho, pen_radius_chirho, strokes_json_chirho "
            "FROM glyph_spines_chirho ORDER BY codepoint_chirho, filename_chirho"
        ).fetchall()
    except sqlite3.OperationalError:
        return []
    finally:
        conn_chirho.close()
    out_chirho = []
    for cp_chirho, fn_chirho, pen_chirho, sj_chirho in rows_chirho:
        png_chirho = FONT_DIR_CHIRHO / f"U+{cp_chirho}" / fn_chirho
        if not png_chirho.exists():
            continue
        w_chirho, h_chirho = Image.open(png_chirho).size
        strokes_chirho = json.loads(sj_chirho)
        u_chirho = []
        for st_chirho in strokes_chirho:
            if len(st_chirho) < 2:
                continue
            u_chirho.append([(px_chirho / max(1, w_chirho), py_chirho / max(1, h_chirho))
                             for px_chirho, py_chirho in st_chirho])
        if not u_chirho:
            continue
        out_chirho.append((
            cp_chirho, fn_chirho, chr(int(cp_chirho, 16)),
            {
                "strokesUChirho": u_chirho,
                "penFracChirho": pen_chirho / max(1, h_chirho),
                "aspectChirho": w_chirho / max(1, h_chirho),
                "nPtsChirho": sum(len(s_chirho) for s_chirho in u_chirho),
            },
        ))
    return out_chirho


def ink_uri_chirho(ink_chirho):
    if ink_chirho.size <= 1:
        return None
    arr_chirho = np.clip(255.0 - ink_chirho * 255.0, 0, 255).astype(np.uint8)
    im_chirho = Image.fromarray(arr_chirho, "L")
    sc_chirho = DISPLAY_H_CHIRHO / max(1, im_chirho.height)
    im_chirho = im_chirho.resize(
        (max(1, int(im_chirho.width * sc_chirho)), DISPLAY_H_CHIRHO), Image.LANCZOS
    )
    buf_chirho = io.BytesIO()
    im_chirho.save(buf_chirho, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf_chirho.getvalue()).decode()


def build_html_chirho():
    variants_chirho = all_saved_variants_chirho()
    by_letter_chirho = {}
    for cp_chirho, fn_chirho, letter_chirho, vd_chirho in variants_chirho:
        by_letter_chirho.setdefault(letter_chirho, []).append((cp_chirho, fn_chirho, vd_chirho))

    sections_chirho = []
    for letter_chirho in sorted(by_letter_chirho):
        cards_chirho = []
        for cp_chirho, fn_chirho, vd_chirho in by_letter_chirho[letter_chirho]:
            imgs_chirho = []
            for _i_chirho in range(SAMPLES_CHIRHO):
                try:
                    ink_chirho, _y_chirho = render_glyph_ink_chirho(letter_chirho, vd_chirho)
                    uri_chirho = ink_uri_chirho(ink_chirho)
                except Exception:
                    uri_chirho = None
                imgs_chirho.append(
                    f"<img src='{uri_chirho}'>" if uri_chirho
                    else "<span class='empty-chirho'>∅</span>"
                )
            cards_chirho.append(
                f"<div class='card-chirho' data-cp-chirho='{cp_chirho}' data-fn-chirho='{fn_chirho}'>"
                f"<div class='imgs-chirho'>{''.join(imgs_chirho)}</div>"
                f"<div class='lab-chirho'>{len(vd_chirho['strokesUChirho'])} strokes · "
                f"{vd_chirho['nPtsChirho']} pts · {fn_chirho.replace('-chirho.png','').replace('vol-1-word-','w')}</div>"
                f"<button class='keep-chirho' onclick=\"toggleKeepChirho(this)\">keep</button>"
                f"</div>"
            )
        sections_chirho.append(
            f"<section><h2>{letter_chirho} <span class='cp-chirho'>U+{ord(letter_chirho):04X}</span> "
            f"<span class='n-chirho'>{len(by_letter_chirho[letter_chirho])} saved</span></h2>"
            f"<div class='grid-chirho'>{''.join(cards_chirho)}</div></section>"
        )

    return (
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<title>Font specimen — prune bad spines</title><style>"
        "body{background:#0b0b14;color:#dde;font-family:system-ui;margin:0;padding:1rem}"
        "h1{font-size:1rem;color:#c9a84c}.meta-chirho{color:#89a;font-size:.78rem;margin:.3rem 0 1rem}"
        "section{border-top:1px solid #243;padding:.5rem 0}"
        "h2{font-size:1.6rem;margin:.2rem 0}.cp-chirho{font-size:.7rem;color:#667}.n-chirho{font-size:.7rem;color:#89a}"
        ".grid-chirho{display:flex;flex-wrap:wrap;gap:.6rem}"
        ".card-chirho{background:#11111e;border:1px solid #222;border-radius:6px;padding:5px;text-align:center}"
        ".card-chirho.gone-chirho{opacity:.25;pointer-events:none}"
        ".imgs-chirho{display:flex;gap:3px;background:#fff;border-radius:3px;padding:3px}"
        ".imgs-chirho img{height:92px;image-rendering:-webkit-optimize-contrast}"
        ".empty-chirho{display:inline-block;width:60px;height:92px;color:#a44;background:#2a1018}"
        ".lab-chirho{font-size:.55rem;color:#667;margin:3px 0}"
        ".keep-chirho{background:#243;color:#bcd;border:0;border-radius:4px;padding:.3rem .5rem;cursor:pointer;font-size:.72rem;width:100%}"
        ".card-chirho.kept-chirho{border-color:#3a7;background:#10241a}"
        ".card-chirho.kept-chirho .keep-chirho{background:#1f5e3a;color:#dfe}"
        "#bar-chirho{position:sticky;top:0;z-index:9;background:#0b0b14;border-bottom:1px solid #243;"
        "padding:.5rem 0;display:flex;gap:1rem;align-items:center}"
        "#purge-chirho{background:#7a2230;color:#fde;border:0;border-radius:5px;padding:.5rem .8rem;cursor:pointer;font-weight:bold}"
        "#cnt-chirho{color:#9cf;font-size:.85rem}"
        "</style></head><body>"
        "<div id='bar-chirho'><h1 style='margin:0'>Font specimen — click KEEP on the good ones</h1>"
        "<button id='purge-chirho' onclick='purgeChirho()'>🗑 Delete ALL not-kept</button>"
        "<span id='cnt-chirho'></span></div>"
        "<p class='meta-chirho'>Most are bad — so mark only the salvageable ones KEEP "
        "(they'll still need refining in the editor). Then one button backs up + "
        "deletes every spine you did NOT keep (recoverable from "
        "_pruned-backup-chirho.jsonl). Re-run propagate + regenerate after.</p>"
        + "".join(sections_chirho) +
        "<script>"
        "function recountChirho(){const t=document.querySelectorAll('.card-chirho').length;"
        "const k=document.querySelectorAll('.card-chirho.kept-chirho').length;"
        "document.getElementById('cnt-chirho').textContent=k+' kept / '+t+' total  ('+(t-k)+' will be deleted)';}"
        "function toggleKeepChirho(b){b.closest('.card-chirho').classList.toggle('kept-chirho');recountChirho();}"
        "async function purgeChirho(){"
        "const kept=[...document.querySelectorAll('.card-chirho.kept-chirho')].map(c=>"
        "({cpChirho:c.getAttribute('data-cp-chirho'),fnChirho:c.getAttribute('data-fn-chirho')}));"
        "const t=document.querySelectorAll('.card-chirho').length;"
        "if(!confirm('Keep '+kept.length+', delete '+(t-kept.length)+' saved spines? (backed up first)'))return;"
        "const r=await fetch('/purge-unkept-chirho',{method:'POST',headers:{'Content-Type':'application/json'},"
        "body:JSON.stringify({keptChirho:kept})});const j=await r.json();"
        "if(j.okChirho){alert('Deleted '+j.deletedChirho+', kept '+j.keptChirho+'. Reloading.');location.reload();}"
        "else alert('ERR '+(j.errorChirho||'?'));}"
        "recountChirho();"
        "</script></body></html>"
    )


def main_chirho():
    OUT_PATH_CHIRHO.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH_CHIRHO.write_text(build_html_chirho())
    print(f"wrote {OUT_PATH_CHIRHO}")


if __name__ == "__main__":
    main_chirho()
