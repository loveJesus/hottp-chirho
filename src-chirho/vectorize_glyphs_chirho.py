#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16

"""
Vectorize bitmap glyphs and wiggle the control points.

User's idea: take each extracted glyph bitmap, trace to vector (Bezier curves
via Potrace), perturb the control points with gaussian noise, rasterize back.
Each source glyph then becomes N visually-similar but pixel-different
variations — domain-randomization at the vector level instead of the pixel
level.

Pipeline:
    glyph.png  --potrace-->  glyph.svg  --parse-->  paths
    paths --jitter-->  perturbed paths  --cairosvg-->  variation.png

Per-volume note: Barthélemy's fonts differ slightly between volumes. The
extracted bitmap font is currently vol-1-only. When we extract from vols
2-5 later, save under a per-volume subdir so we keep the per-vol distinction.

Run:
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/vectorize_glyphs_chirho.py \\
        --variations=12 --vol=1
"""

import argparse
import io
import os
import random
import re
import subprocess
import sys
from pathlib import Path

import cairosvg
import numpy as np
from PIL import Image
from svgpathtools import parse_path, Path as SvgPath, CubicBezier, QuadraticBezier, Line

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
BITMAP_FONT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "bitmap-font-chirho"
OUT_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "synthetic-chirho" / "vectorized-hebrew-chirho"


def potrace_to_svg_chirho(png_path_chirho: Path, svg_path_chirho: Path) -> None:
    """Use potrace CLI: png -> bitmap PBM -> SVG. Potrace needs PBM input."""
    # Convert PNG to binary PBM via PIL first
    img_chirho = Image.open(png_path_chirho).convert("L")
    arr_chirho = np.asarray(img_chirho, dtype=np.uint8)
    bw_chirho = (arr_chirho < 128).astype(np.uint8) * 255
    bw_img_chirho = Image.fromarray(bw_chirho, mode="L")
    pbm_path_chirho = svg_path_chirho.with_suffix(".pbm")
    bw_img_chirho.save(pbm_path_chirho)
    # Run potrace -s for SVG output. -t smooths slightly; --opttolerance keeps fidelity.
    subprocess.run([
        "potrace", "-s",
        "-o", str(svg_path_chirho),
        str(pbm_path_chirho),
    ], check=True, capture_output=True)
    pbm_path_chirho.unlink(missing_ok=True)


def extract_paths_from_svg_chirho(svg_path_chirho: Path) -> tuple[list, str, str, str, str]:
    """Pull every `d` attribute and the `<g transform=...>` wrapper out of the
    potrace SVG. Potrace draws into a transformed coordinate system (typically
    a 10× upscale with y-flip), so any jittered paths need to be re-wrapped
    in that same transform when re-rendering.
    Returns (path_strings, width, height, viewbox, g_transform)."""
    text_chirho = svg_path_chirho.read_text()
    width_chirho = re.search(r'width="([^"]+)"', text_chirho)
    height_chirho = re.search(r'height="([^"]+)"', text_chirho)
    viewbox_chirho = re.search(r'viewBox="([^"]+)"', text_chirho)
    g_transform_chirho = re.search(r'<g\s+transform="([^"]+)"', text_chirho)
    paths_chirho = re.findall(r' d="([^"]+)"', text_chirho)
    return (
        paths_chirho,
        width_chirho.group(1) if width_chirho else "100",
        height_chirho.group(1) if height_chirho else "100",
        viewbox_chirho.group(1) if viewbox_chirho else "0 0 100 100",
        g_transform_chirho.group(1) if g_transform_chirho else "",
    )


def jitter_path_chirho(svg_path_str_chirho: str, sigma_chirho: float, viewbox_chirho: str) -> str:
    """Parse SVG path d-string, jitter each anchor + control point by gaussian
    noise. Noise amplitude scales with the path's own coordinate range so the
    same sigma works whether path coords are 0-32 or 0-320."""
    try:
        path_chirho = parse_path(svg_path_str_chirho)
    except Exception:
        return svg_path_str_chirho

    # Measure actual path bbox in the path's own coord space so jitter sigma
    # is proportional to the glyph's pixel extent.
    try:
        bbox_chirho = path_chirho.bbox()  # (xmin, xmax, ymin, ymax)
        path_scale_chirho = max(bbox_chirho[1] - bbox_chirho[0], bbox_chirho[3] - bbox_chirho[2], 1.0)
    except Exception:
        path_scale_chirho = 100.0
    noise_amp_chirho = sigma_chirho * path_scale_chirho

    new_segments_chirho = []
    for seg_chirho in path_chirho:
        if isinstance(seg_chirho, CubicBezier):
            new_segments_chirho.append(CubicBezier(
                _jitter_point_chirho(seg_chirho.start, noise_amp_chirho),
                _jitter_point_chirho(seg_chirho.control1, noise_amp_chirho * 1.5),
                _jitter_point_chirho(seg_chirho.control2, noise_amp_chirho * 1.5),
                _jitter_point_chirho(seg_chirho.end, noise_amp_chirho),
            ))
        elif isinstance(seg_chirho, QuadraticBezier):
            new_segments_chirho.append(QuadraticBezier(
                _jitter_point_chirho(seg_chirho.start, noise_amp_chirho),
                _jitter_point_chirho(seg_chirho.control, noise_amp_chirho * 1.5),
                _jitter_point_chirho(seg_chirho.end, noise_amp_chirho),
            ))
        elif isinstance(seg_chirho, Line):
            new_segments_chirho.append(Line(
                _jitter_point_chirho(seg_chirho.start, noise_amp_chirho),
                _jitter_point_chirho(seg_chirho.end, noise_amp_chirho),
            ))
        else:
            new_segments_chirho.append(seg_chirho)
    return SvgPath(*new_segments_chirho).d()


def _jitter_point_chirho(p_chirho: complex, amp_chirho: float) -> complex:
    return complex(
        p_chirho.real + random.gauss(0, amp_chirho),
        p_chirho.imag + random.gauss(0, amp_chirho),
    )


def render_svg_to_png_chirho(svg_text_chirho: str, out_path_chirho: Path, width_chirho: int = 64) -> None:
    png_bytes_chirho = cairosvg.svg2png(bytestring=svg_text_chirho.encode("utf-8"), output_width=width_chirho)
    out_path_chirho.write_bytes(png_bytes_chirho)


def build_svg_chirho(path_strings_chirho: list, width_chirho: str, height_chirho: str, viewbox_chirho: str, g_transform_chirho: str = "") -> str:
    paths_xml_chirho = "".join(f'<path d="{d_chirho}"/>' for d_chirho in path_strings_chirho)
    if g_transform_chirho:
        body_chirho = f'<g transform="{g_transform_chirho}" fill="black" stroke="none">{paths_xml_chirho}</g>'
    else:
        body_chirho = f'<g fill="black" stroke="none">{paths_xml_chirho}</g>'
    return (
        f'<?xml version="1.0" standalone="no"?>'
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{width_chirho}" height="{height_chirho}" viewBox="{viewbox_chirho}">'
        f'{body_chirho}'
        f'</svg>'
    )


def vary_one_glyph_chirho(glyph_png_chirho: Path, out_dir_chirho: Path, n_variations_chirho: int, sigma_chirho: float) -> int:
    tmp_svg_chirho = out_dir_chirho / "_tmp.svg"
    try:
        potrace_to_svg_chirho(glyph_png_chirho, tmp_svg_chirho)
    except Exception as e_chirho:
        return 0
    paths_chirho, w_chirho, h_chirho, vb_chirho, g_transform_chirho = extract_paths_from_svg_chirho(tmp_svg_chirho)
    tmp_svg_chirho.unlink(missing_ok=True)
    if len(paths_chirho) == 0:
        return 0

    # Render dimensions: keep aspect ratio, target ~48px tall
    parts_chirho = vb_chirho.split()
    if len(parts_chirho) >= 4:
        vb_w_chirho = float(parts_chirho[2])
        vb_h_chirho = float(parts_chirho[3])
    else:
        vb_w_chirho = 100.0
        vb_h_chirho = 100.0
    target_h_chirho = 48
    target_w_chirho = max(8, int(vb_w_chirho * target_h_chirho / vb_h_chirho))

    base_name_chirho = glyph_png_chirho.stem
    written_chirho = 0
    for i_chirho in range(n_variations_chirho):
        jittered_paths_chirho = [jitter_path_chirho(d_chirho, sigma_chirho, vb_chirho) for d_chirho in paths_chirho]
        svg_text_chirho = build_svg_chirho(jittered_paths_chirho, w_chirho, h_chirho, vb_chirho, g_transform_chirho)
        out_path_chirho = out_dir_chirho / f"{base_name_chirho}-var-{i_chirho:03d}-chirho.png"
        try:
            render_svg_to_png_chirho(svg_text_chirho, out_path_chirho, width_chirho=target_w_chirho)
            written_chirho += 1
        except Exception:
            pass
    return written_chirho


def main_chirho():
    parser_chirho = argparse.ArgumentParser()
    parser_chirho.add_argument("--variations", type=int, default=12)
    parser_chirho.add_argument("--sigma", type=float, default=0.02,
                               help="Gaussian noise sigma as fraction of viewbox size (e.g. 0.02 = ~2pct jitter)")
    parser_chirho.add_argument("--vol", type=int, default=1)
    parser_chirho.add_argument("--limit-per-glyph", type=int, default=None,
                               help="Limit input samples per character to N (default: all)")
    args_chirho = parser_chirho.parse_args()

    random.seed(42)
    np.random.seed(42)

    if not BITMAP_FONT_DIR_CHIRHO.exists():
        print(f"bitmap-font dir missing: {BITMAP_FONT_DIR_CHIRHO}", file=sys.stderr)
        sys.exit(1)

    char_dirs_chirho = sorted([d_chirho for d_chirho in BITMAP_FONT_DIR_CHIRHO.iterdir() if d_chirho.is_dir() and d_chirho.name.startswith("U+")])
    if not char_dirs_chirho:
        print("No glyph subdirs found", file=sys.stderr)
        sys.exit(1)

    total_in_chirho = 0
    total_out_chirho = 0
    for char_dir_chirho in char_dirs_chirho:
        codepoint_chirho = char_dir_chirho.name  # U+05D1 etc
        out_char_dir_chirho = OUT_DIR_CHIRHO / f"vol-{args_chirho.vol}-chirho" / codepoint_chirho
        out_char_dir_chirho.mkdir(parents=True, exist_ok=True)
        samples_chirho = sorted(char_dir_chirho.glob("sample-*-chirho.png"))
        if args_chirho.limit_per_glyph:
            samples_chirho = samples_chirho[: args_chirho.limit_per_glyph]
        for s_chirho in samples_chirho:
            total_in_chirho += 1
            n_chirho = vary_one_glyph_chirho(s_chirho, out_char_dir_chirho, args_chirho.variations, args_chirho.sigma)
            total_out_chirho += n_chirho
        print(f"  {codepoint_chirho}: {len(samples_chirho)} in -> {total_out_chirho} out (running total)")

    print()
    print(f"done: {total_in_chirho} source glyphs -> {total_out_chirho} variations")
    print(f"saved to: {OUT_DIR_CHIRHO}")


if __name__ == "__main__":
    main_chirho()
