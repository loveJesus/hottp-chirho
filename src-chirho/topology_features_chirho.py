#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Targeted-topology third witness — the focused replacement after the
4x4 ink-density grid was honestly disproved (template L1=0.124 between
ר↔כ predicted, and ר→כ ×8 confusion held at every beta on n=120).

The 4x4 grid was still pixel-shape — *generic* density. This module
hand-picks features that ENCODE the visual differences between the
confusable pairs:

  ר vs כ      → kaf has bottom-left ink (bottom horizontal stroke);
                resh's bottom-left is empty.
  ה vs ת/ח    → he's left side has a gap in the middle; taw and het
                are connected top-to-bottom on the left.
  ת vs ה      → taw has a bottom-base foot; he doesn't.
  ב vs נ      → bet has a closed full base; nun's base is shorter.
  ס · ם       → exactly 1 enclosed hole; others 0.

Cost = mean L1 distance to per-letter template (built from the
bitmap-font-v3 exemplars, same source word_reader already loads).

Returned in [0, 1]; neutral 0.5 if no template or empty span.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from recognize_realmatch_chirho import norm_ink_chirho, FONT_DIR_CHIRHO  # noqa: E402
from eval_gold_set_chirho import fold_chirho  # noqa: E402

NUM_FEATURES_CHIRHO = 7


def _holes_count_chirho(span_bool_chirho):
    """Number of background components that do NOT touch the bounding
    box edge — i.e., enclosed holes. 4-connectivity flood fill,
    written without scipy/cv2 to keep deps minimal."""
    h_chirho, w_chirho = span_bool_chirho.shape
    bg_chirho = ~span_bool_chirho
    seen_chirho = np.zeros_like(bg_chirho)
    # 1) flood from all boundary bg pixels: anything reachable is OUTSIDE
    stack_chirho = []
    for x_chirho in range(w_chirho):
        if bg_chirho[0, x_chirho] and not seen_chirho[0, x_chirho]:
            stack_chirho.append((0, x_chirho))
        if bg_chirho[h_chirho - 1, x_chirho] \
                and not seen_chirho[h_chirho - 1, x_chirho]:
            stack_chirho.append((h_chirho - 1, x_chirho))
    for y_chirho in range(h_chirho):
        if bg_chirho[y_chirho, 0] and not seen_chirho[y_chirho, 0]:
            stack_chirho.append((y_chirho, 0))
        if bg_chirho[y_chirho, w_chirho - 1] \
                and not seen_chirho[y_chirho, w_chirho - 1]:
            stack_chirho.append((y_chirho, w_chirho - 1))
    while stack_chirho:
        y_chirho, x_chirho = stack_chirho.pop()
        if y_chirho < 0 or y_chirho >= h_chirho \
                or x_chirho < 0 or x_chirho >= w_chirho:
            continue
        if not bg_chirho[y_chirho, x_chirho] or seen_chirho[y_chirho, x_chirho]:
            continue
        seen_chirho[y_chirho, x_chirho] = True
        stack_chirho.extend(((y_chirho + 1, x_chirho),
                             (y_chirho - 1, x_chirho),
                             (y_chirho, x_chirho + 1),
                             (y_chirho, x_chirho - 1)))
    # 2) any remaining unseen bg pixel starts an INNER (hole) component
    holes_chirho = 0
    for y_chirho in range(h_chirho):
        for x_chirho in range(w_chirho):
            if bg_chirho[y_chirho, x_chirho] and not seen_chirho[y_chirho, x_chirho]:
                holes_chirho += 1
                stack_chirho = [(y_chirho, x_chirho)]
                while stack_chirho:
                    yy_chirho, xx_chirho = stack_chirho.pop()
                    if yy_chirho < 0 or yy_chirho >= h_chirho \
                            or xx_chirho < 0 or xx_chirho >= w_chirho:
                        continue
                    if not bg_chirho[yy_chirho, xx_chirho] \
                            or seen_chirho[yy_chirho, xx_chirho]:
                        continue
                    seen_chirho[yy_chirho, xx_chirho] = True
                    stack_chirho.extend(((yy_chirho + 1, xx_chirho),
                                         (yy_chirho - 1, xx_chirho),
                                         (yy_chirho, xx_chirho + 1),
                                         (yy_chirho, xx_chirho - 1)))
    return holes_chirho


def _extract_chirho(norm_ink_bool_chirho):
    """7-d feature vector on a normalised ink bool image."""
    h_chirho, w_chirho = norm_ink_bool_chirho.shape
    ink_chirho = norm_ink_bool_chirho.astype(float)
    # 1. bottom-left corner density (key for ר vs כ)
    bl_h_chirho = (2 * h_chirho) // 3
    bl_w_chirho = w_chirho // 3
    f1_chirho = float(ink_chirho[bl_h_chirho:, :bl_w_chirho].mean())
    # 2. top-left corner density (key for ה vs ת/ח)
    tl_h_chirho = h_chirho // 3
    tl_w_chirho = w_chirho // 3
    f2_chirho = float(ink_chirho[:tl_h_chirho, :tl_w_chirho].mean())
    # 3. bottom strip density (key for taw vs he, bet vs nun)
    bs_h_chirho = (4 * h_chirho) // 5
    f3_chirho = float(ink_chirho[bs_h_chirho:, :].mean())
    # 4. left strip density (left 20% cols)
    ls_w_chirho = w_chirho // 5
    f4_chirho = float(ink_chirho[:, :ls_w_chirho].mean())
    # 5. holes count (samekh, mem-sofit have 1; nothing else does)
    f5_chirho = min(2, _holes_count_chirho(norm_ink_bool_chirho)) / 2.0
    # 6. mean x of ink (centroid x normalised to [0, 1]; right-heavy
    #    letters like ר sit closer to 1, left-extended like כ closer to 0.5)
    ys_chirho, xs_chirho = np.where(norm_ink_bool_chirho)
    f6_chirho = float(xs_chirho.mean() / max(1, w_chirho - 1)) \
        if xs_chirho.size else 0.5
    # 7. aspect ratio (clamped, normalised)
    f7_chirho = min(1.5, max(0.3, w_chirho / max(1, h_chirho))) / 1.5
    return np.array([f1_chirho, f2_chirho, f3_chirho, f4_chirho,
                     f5_chirho, f6_chirho, f7_chirho])


def extract_features_chirho(span_bool_chirho):
    """Returns 7-d feature vector on the candidate span (None if empty)."""
    if span_bool_chirho.sum() == 0:
        return None
    gray_chirho = np.where(span_bool_chirho, 0, 255).astype(np.uint8)
    n_chirho = norm_ink_chirho(gray_chirho)
    if n_chirho is None:
        return None
    return _extract_chirho(n_chirho)


def build_letter_templates_chirho(real_exemplars_chirho):
    """{folded_letter -> mean 7-d feature vector}, PLUS a sidecar dict
    'STDSCALE' (the per-feature inverse std across templates, used to
    z-score so each feature contributes equally to the L1 cost — dead
    constant features like aspect_ratio collapse to 0 weight by design).
    """
    raw_chirho = {}
    for letter_chirho, exs_chirho in real_exemplars_chirho.items():
        vecs_chirho = []
        for n_chirho in exs_chirho:
            vecs_chirho.append(_extract_chirho(n_chirho))
        if vecs_chirho:
            raw_chirho[letter_chirho] = np.mean(vecs_chirho, axis=0)
    if not raw_chirho:
        return {}
    stack_chirho = np.stack(list(raw_chirho.values()))
    sd_chirho = stack_chirho.std(axis=0)
    inv_chirho = np.where(sd_chirho > 1e-4, 1.0 / sd_chirho, 0.0)
    raw_chirho["__STDSCALE__"] = inv_chirho
    return raw_chirho


def build_letter_templates_from_disk_chirho():
    by_letter_chirho = {}
    for cp_dir_chirho in sorted(FONT_DIR_CHIRHO.glob("U+*")):
        letter_chirho = fold_chirho(chr(int(cp_dir_chirho.name[2:], 16)))
        for png_chirho in sorted(cp_dir_chirho.glob("*.png")):
            g_chirho = np.asarray(Image.open(png_chirho).convert("L"))
            n_chirho = norm_ink_chirho(g_chirho)
            if n_chirho is not None:
                by_letter_chirho.setdefault(letter_chirho, []).append(n_chirho)
    return build_letter_templates_chirho(by_letter_chirho)


def topo_cost_chirho(letter_chirho, span_bool_chirho, templates_chirho):
    """Per-feature z-scaled L1 to letter template, normalised to [~0, 1].
    Returns 0.5 (neutral) if no template or empty span.

    Z-scaling makes each feature contribute equally on average so dead
    features (e.g. aspect_ratio is constant -> sd=0 -> weight 0) cannot
    dilute the informative ones (bl-corner, holes, mean-x)."""
    tmpl_chirho = templates_chirho.get(letter_chirho)
    if tmpl_chirho is None:
        return 0.5
    feats_chirho = extract_features_chirho(span_bool_chirho)
    if feats_chirho is None:
        return 0.5
    inv_sd_chirho = templates_chirho.get("__STDSCALE__")
    if inv_sd_chirho is None:
        return float(np.abs(feats_chirho - tmpl_chirho).mean())
    # z-scaled L1; normalise by sum(weights) so cost stays in a stable
    # range across feature-set sizes (mean of nonzero-weighted features)
    raw_chirho = np.abs(feats_chirho - tmpl_chirho) * inv_sd_chirho
    nz_chirho = max(1, int((inv_sd_chirho > 0).sum()))
    # divide by 4 because z-scores commonly hit 1-3 sigma; this keeps
    # the mean cost roughly comparable in magnitude to real_term (~0.15-0.45)
    cost_chirho = float(raw_chirho.sum() / (nz_chirho * 4.0))
    return min(1.0, max(0.0, cost_chirho))


if __name__ == "__main__":
    tmpls_chirho = build_letter_templates_from_disk_chirho()
    letters_chirho = sorted(tmpls_chirho)
    print(f"templates: {len(letters_chirho)} letters")
    feat_names_chirho = ["bl-corner", "tl-corner", "bot-strip",
                         "left-strip", "holes", "mean-x", "aspect"]
    print("\nper-letter feature vectors:")
    print("    " + "  ".join(f"{n_chirho:>10}" for n_chirho in feat_names_chirho))
    for l_chirho in letters_chirho:
        v_chirho = tmpls_chirho[l_chirho]
        print(f"{l_chirho}: " + "  ".join(f"{x_chirho:>10.3f}" for x_chirho in v_chirho))
    inv_sd_chirho = tmpls_chirho["__STDSCALE__"]
    print(f"\nstd-scaled inverse weights: "
          f"{dict(zip(feat_names_chirho, inv_sd_chirho.round(2)))}")
    print("\ndominant-confusion separations (z-scaled L1 / 4*nz "
          "≈ topo_cost differential; higher = better):")
    for pair_chirho in [("ר", "כ"), ("ה", "ת"), ("ה", "ח"),
                        ("ב", "נ"), ("ח", "ת"), ("ש", "ט"),
                        ("ת", "ס"), ("מ", "פ"), ("ו", "ר")]:
        a_chirho, b_chirho = pair_chirho
        if a_chirho not in tmpls_chirho or b_chirho not in tmpls_chirho:
            continue
        per_chirho = np.abs(tmpls_chirho[a_chirho] - tmpls_chirho[b_chirho])
        zper_chirho = per_chirho * inv_sd_chirho
        nz_chirho = max(1, int((inv_sd_chirho > 0).sum()))
        zcost_chirho = float(zper_chirho.sum() / (nz_chirho * 4.0))
        top_chirho = np.argsort(zper_chirho)[::-1][:3]
        contribs_chirho = ", ".join(
            f"{feat_names_chirho[i_chirho]}={zper_chirho[i_chirho]:.2f}"
            for i_chirho in top_chirho)
        print(f"  {a_chirho} vs {b_chirho}: z-cost = {zcost_chirho:.3f}   "
              f"(top: {contribs_chirho})")
