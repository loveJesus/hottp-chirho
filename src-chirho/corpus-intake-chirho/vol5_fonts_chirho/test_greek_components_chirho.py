# For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
"""Exact contour reconstruction and independent breathing-anchor controls."""
import copy
import hashlib
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from decode_hebrew_chirho import VOL5_PDF_CHIRHO
from greek_components_chirho import component_report_chirho, contour_signature_chirho, derive_identity_chirho, body_matches_chirho
from greek_tables_chirho import GREEK_MAIN_CODES_CHIRHO


@pytest.fixture(scope="module")
def source_components_chirho():
    if not VOL5_PDF_CHIRHO.exists():
        pytest.skip("source PDF absent")
    import pikepdf
    with pikepdf.open(VOL5_PDF_CHIRHO) as pdf_chirho:
        return {row_chirho["code_chirho"]: row_chirho for row_chirho in component_report_chirho(pdf_chirho)}


def test_contour_signature_preserves_curve_direction_and_shape_not_placement():
    points_chirho = [(0, 0, 1), (4, 2, 0), (9, 7, 1), (2, 12, 0)]
    translated_chirho = [(x_chirho + 73, y_chirho - 42, flag_chirho) for x_chirho, y_chirho, flag_chirho in points_chirho]
    assert contour_signature_chirho(points_chirho) == contour_signature_chirho(translated_chirho[2:] + translated_chirho[:2])
    assert contour_signature_chirho(points_chirho) != contour_signature_chirho([(-x_chirho, y_chirho, flag_chirho) for x_chirho, y_chirho, flag_chirho in points_chirho])
    assert contour_signature_chirho(points_chirho) != contour_signature_chirho([(x_chirho, y_chirho + (1 if index_chirho == 1 else 0), flag_chirho) for index_chirho, (x_chirho, y_chirho, flag_chirho) in enumerate(points_chirho)])


def test_letter_parts_cannot_be_independently_moved_to_fake_a_body_match():
    body_chirho = [{"signature_chirho": "outer-chirho", "box_chirho": [0, 0, 20, 20]}, {"signature_chirho": "hole-chirho", "box_chirho": [5, 5, 15, 15]}]
    translated_chirho = [{"signature_chirho": "outer-chirho", "box_chirho": [10, 30, 30, 50]}, {"signature_chirho": "hole-chirho", "box_chirho": [15, 35, 25, 45]}]
    assert body_matches_chirho(body_chirho, translated_chirho)
    translated_chirho[1]["box_chirho"][0] += 1
    assert not body_matches_chirho(body_chirho, translated_chirho)


@pytest.mark.parametrize("code_chirho,text_chirho", [(0x21, "ἑ"), (0x27, "ἐ"), (0x3B, "ἀ"), (0x73, "ἄ"), (0x3C, "ἶ"), (0x96, "ἷ"), (0x71, "Ὁ"), (0xA2, "Ἀ")])
def test_independently_read_breathing_anchors(source_components_chirho, code_chirho, text_chirho):
    assert derive_identity_chirho(source_components_chirho[code_chirho]) == text_chirho


def test_all_141_main_codes_reconstruct_from_source_components(source_components_chirho):
    assert set(source_components_chirho) == set(range(0x21, 0xAE))
    assert {code_chirho: derive_identity_chirho(row_chirho) for code_chirho, row_chirho in source_components_chirho.items()} == GREEK_MAIN_CODES_CHIRHO


def test_previously_published_main_codes_keep_the_same_unicode():
    # This is the first publication's data contract, not a UI-copy snapshot.
    published_chirho = [34, 35, 36, 37, 38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 50, 52, 53, 54, 55, 56, 57, 58, 61, 63, 65, 66, 67, 71, 72, 73, 74, 76, 77, 80, 81, 82, 83, 84, 86, 88, 89, 90, 91, 93, 94, 100, 103, 105, 111, 114, 117, 118, 121, 124, 129, 133, 135, 137, 146, 147, 149, 151, 152, 154, 155, 158, 160, 173]
    value_chirho = {str(code_chirho): GREEK_MAIN_CODES_CHIRHO[code_chirho] for code_chirho in published_chirho}
    assert hashlib.sha256(json.dumps(value_chirho, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest() == "7c90c185c55188decb65484a82af5d6d57a68a71b9431310740097a28895711c"


def test_changed_unknown_or_incomplete_component_never_guesses(source_components_chirho):
    for code_chirho in (0x21, 0x3C, 0x6F, 0x80):
        row_chirho = copy.deepcopy(source_components_chirho[code_chirho])
        row_chirho["extra_chirho"][0]["signature_chirho"] = "0" * 64
        with pytest.raises(ValueError):
            derive_identity_chirho(row_chirho)
    row_chirho = copy.deepcopy(source_components_chirho[0x6F])
    row_chirho["extra_chirho"].pop()
    with pytest.raises(ValueError):
        derive_identity_chirho(row_chirho)
