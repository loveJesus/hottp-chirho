#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Side-by-side gallery: the spline/stroke-font SYNTHETIC words (what v9 was
trained on) vs real Barthélemy Hebrew scans. Both normalised to equal ink
height so weight/scale are comparable. Self-contained HTML (data URIs).

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/strokes_vs_scans_view_chirho.py --count=48
"""
import argparse
import base64
import glob
import io
import os
import random
import sqlite3
from pathlib import Path

import numpy as np
from PIL import Image

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
SYNTH_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "synthetic-chirho" / "hebrew-strokes-chirho"
DB_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "progress-chirho.sqlite"
OUT_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "strokes-view-chirho" / "view-chirho.html"
INK_H_CHIRHO = 46


def norm_uri_chirho(path_chirho):
    im_chirho = Image.open(path_chirho).convert("L")
    arr_chirho = np.asarray(im_chirho)
    ys_chirho, xs_chirho = np.where(arr_chirho < 200)
    if ys_chirho.size:
        im_chirho = im_chirho.crop((int(xs_chirho.min()), int(ys_chirho.min()),
                                    int(xs_chirho.max()) + 1, int(ys_chirho.max()) + 1))
    w_chirho, h_chirho = im_chirho.size
    im_chirho = im_chirho.resize(
        (max(1, int(w_chirho * INK_H_CHIRHO / h_chirho)), INK_H_CHIRHO), Image.LANCZOS
    )
    buf_chirho = io.BytesIO()
    im_chirho.save(buf_chirho, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf_chirho.getvalue()).decode()


def main_chirho():
    ap_chirho = argparse.ArgumentParser()
    ap_chirho.add_argument("--count", type=int, default=48)
    args_chirho = argparse.Namespace(**vars(ap_chirho.parse_args()))
    random.seed(11)

    synth_chirho = sorted(glob.glob(str(SYNTH_DIR_CHIRHO / "*.png")))
    random.shuffle(synth_chirho)
    synth_chirho = synth_chirho[: args_chirho.count]

    conn_chirho = sqlite3.connect(DB_PATH_CHIRHO)
    real_chirho = [
        r_chirho[0] for r_chirho in conn_chirho.execute(
            "SELECT crop_path_chirho FROM training_pairs_chirho "
            "WHERE script_chirho='hebrew-chirho' "
            "AND source_chirho='canonical-recon-chirho' ORDER BY RANDOM() LIMIT 400"
        ).fetchall()
    ]
    conn_chirho.close()
    real_chirho = [p_chirho for p_chirho in real_chirho if os.path.exists(p_chirho)][: args_chirho.count]

    def cells_chirho(paths_chirho):
        return "".join(
            f"<div class='cell-chirho'><img src='{norm_uri_chirho(p_chirho)}'></div>"
            for p_chirho in paths_chirho
        )

    html_chirho = (
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<title>Stroke-synth vs real scans</title><style>"
        "body{background:#0b0b14;color:#dde;font-family:system-ui;margin:0;padding:1rem}"
        "h1{font-size:1rem;color:#c9a84c}h2{font-size:.9rem;margin:1rem 0 .4rem}"
        ".meta-chirho{color:#89a;font-size:.78rem;margin-bottom:.6rem}"
        ".grid-chirho{display:flex;flex-wrap:wrap;gap:.5rem}"
        ".cell-chirho{background:#fff;border-radius:3px;padding:4px}"
        ".cell-chirho img{height:46px;display:block;image-rendering:-webkit-optimize-contrast}"
        ".synth-chirho .cell-chirho{background:#fffdf2}"
        "</style></head><body>"
        "<h1>What v9 trained on — spline/stroke-font synthetic vs real Barthélemy scans</h1>"
        f"<p class='meta-chirho'>Both normalised to {INK_H_CHIRHO}px ink height. "
        f"Synthetic = your saved ductus stroked with the round pen + wiggle. "
        f"Real = canonical-recon WLC-verified Hebrew crops.</p>"
        f"<h2 style='color:#e5c75a'>SYNTHETIC (stroke-font, {len(synth_chirho)})</h2>"
        f"<div class='grid-chirho synth-chirho'>{cells_chirho(synth_chirho)}</div>"
        f"<h2 style='color:#7cc'>REAL SCANS ({len(real_chirho)})</h2>"
        f"<div class='grid-chirho'>{cells_chirho(real_chirho)}</div>"
        "</body></html>"
    )
    OUT_PATH_CHIRHO.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH_CHIRHO.write_text(html_chirho)
    print(f"wrote {OUT_PATH_CHIRHO} ({len(synth_chirho)} synth, {len(real_chirho)} real)")


if __name__ == "__main__":
    main_chirho()
