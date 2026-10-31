# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Render a bounded contact sheet from the pinned full-page scan images."""
import argparse
import json
import subprocess
from pathlib import Path

from decode_hebrew_chirho import PROJECT_ROOT_CHIRHO


def main_chirho():
    parser_chirho = argparse.ArgumentParser(description=__doc__)
    parser_chirho.add_argument("--cases-chirho")
    parser_chirho.add_argument("--out-chirho")
    args_chirho = parser_chirho.parse_args()
    root_chirho = PROJECT_ROOT_CHIRHO / "workspace-chirho/corpus-intake-chirho"
    output_chirho = Path(args_chirho.out_chirho) if args_chirho.out_chirho else root_chirho / "font-decode-chirho/review-chirho/page-samples-chirho"
    output_chirho.mkdir(parents=True, exist_ok=True)
    cases_chirho = {51: [8], 54: [6, 19], 56: [15, 26], 65: [3], 200: [11], 500: [7, 13, 16], 900: [5]}
    if args_chirho.cases_chirho:
        value_chirho = json.loads(Path(args_chirho.cases_chirho).read_text(encoding="utf-8"))
        if not isinstance(value_chirho, list) or not 1 <= len(value_chirho) <= 12:
            raise ValueError("One to twelve source-line samples required")
        cases_chirho = {}
        for item_chirho in value_chirho:
            page_number_chirho, line_index_chirho = item_chirho["page_chirho"], item_chirho["line_index_chirho"]
            if type(page_number_chirho) is not int or not 1 <= page_number_chirho <= 1009 or 148 <= page_number_chirho <= 152 or type(line_index_chirho) is not int or not 0 <= line_index_chirho <= 511:
                raise ValueError("Invalid/protected source-line sample")
            cases_chirho.setdefault(page_number_chirho, []).append(line_index_chirho)
    files_chirho = []
    with (root_chirho / "font-decode-chirho/source-pages-chirho.jsonl").open(encoding="utf-8") as stream_chirho:
        for row_chirho in stream_chirho:
            source_chirho = json.loads(row_chirho)
            page_chirho = source_chirho["payload_chirho"]["page_chirho"][1]
            if page_chirho not in cases_chirho:
                continue
            if 50 <= page_chirho <= 70:
                image_chirho = root_chirho / f"publish-chirho/legacy-2026-10-30-chirho/images-chirho/page-{page_chirho}-chirho.png"
            else:
                image_chirho = root_chirho / f"pages-chirho/vol-5-chirho/{page_chirho // 100 * 100:04d}-chirho/page-{page_chirho:04d}-chirho.png"
            for line_chirho in source_chirho["payload_chirho"]["lines_chirho"]:
                if line_chirho[0] not in cases_chirho[page_chirho]:
                    continue
                x_chirho, y_chirho = max(0, line_chirho[1] - 10), max(0, line_chirho[2] - 10)
                width_chirho, height_chirho = line_chirho[3] + 20, line_chirho[4] + 20
                target_chirho = output_chirho / f"p{page_chirho}-l{line_chirho[0]}-chirho.png"
                subprocess.run(["magick", str(image_chirho), "-crop", f"{width_chirho}x{height_chirho}+{x_chirho}+{y_chirho}", "+repage", "-resize", "150%", "-background", "white", "-gravity", "northwest", "-splice", "0x32", "-font", "Arial", "-pointsize", "20", "-annotate", "+10+5", f"PDF p{page_chirho}, line {line_chirho[0]}", str(target_chirho)], check=True)
                files_chirho.append(str(target_chirho))
    subprocess.run(["magick", *files_chirho, "-append", str(output_chirho / "contact-chirho.png")], check=True)
    print(output_chirho / "contact-chirho.png")


if __name__ == "__main__":
    main_chirho()
