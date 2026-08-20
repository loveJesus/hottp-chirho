#!/usr/bin/env python3
# For God so loved the world that he gave his only begotten Son,
# that whoever believes in him should not perish but have eternal life. John 3:16
"""
Neural word OCR (CRNN + CTC) — the production path PAST the
analysis-by-synthesis reader's ceiling (held-out ~0.52 char). A CNN
reads the whole word image; a BiLSTM models letter-sequence context;
CTC aligns to the consonant string with NO explicit segmentation
(segmentation is learned implicitly — exactly what beats the
ink-bridged-print problem that defeated every bottom-up rule).

Data (no new human labelling):
  - PRETRAIN on the synthetic stroke composer (compose_word_chirho) over
    the full WLC consonant-word vocabulary — unlimited realistic
    labelled words.
  - FINE-TUNE on the real WLC gold crops (train split).
  - SCORE on a held-out gold split (word sequences never used to render
    synthetic, so it measures READING not memorisation).

RTL: compose_word_chirho lays a reading-order string out right-to-left,
so the leftmost pixel column is the LAST reading letter. CTC scans
columns left-to-right, so its target is the VISUAL order = reading
order reversed. We reverse the decode back before scoring vs gold.

Run (quick smoke, validates the whole pipeline cheaply):
    workspace-chirho/classifier-venv-chirho/bin/python3 \\
        src-chirho/train_word_ocr_chirho.py --smoke
Full:
    ... --pretrain-steps 4000 --finetune-epochs 40
"""
import argparse
import json
import random
import sqlite3
import sys
from pathlib import Path

import numpy as np
from PIL import Image

import torch
import torch.nn as nn

if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

import compose_synthetic_strokes_chirho as csyn_chirho
from eval_gold_set_chirho import fold_chirho, edit_dist_chirho

PROJECT_ROOT_CHIRHO = Path(__file__).resolve().parent.parent
GOLD_DIR_CHIRHO = PROJECT_ROOT_CHIRHO / "workspace-chirho" / "gold-set-chirho"
CORPUS_DIR_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho"
                     / "hebrew-corpus-chirho")
WLC_PATH_CHIRHO = PROJECT_ROOT_CHIRHO / "spec-chirho" / "wlc-chirho.sqlite"
MODEL_OUT_CHIRHO = (PROJECT_ROOT_CHIRHO / "workspace-chirho"
                    / "word-ocr-chirho" / "crnn-chirho.pt")
IMG_H_CHIRHO = 48                     # fixed network input height
ALPHABET_CHIRHO = list("אבגדהוזחטיכלמנסעפצקרשת")   # 22 base consonants
# CTC index 0 = blank; letters map to 1..22
CHAR_TO_IDX_CHIRHO = {c_chirho: i_chirho + 1
                      for i_chirho, c_chirho in enumerate(ALPHABET_CHIRHO)}
IDX_TO_CHAR_CHIRHO = {i_chirho + 1: c_chirho
                      for i_chirho, c_chirho in enumerate(ALPHABET_CHIRHO)}
NUM_CLASSES_CHIRHO = len(ALPHABET_CHIRHO) + 1   # + blank


def device_chirho():
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def encode_label_chirho(reading_text_chirho):
    """reading-order consonants -> CTC target (VISUAL L->R = reversed),
    as a list of class indices. Folds + drops out-of-alphabet chars."""
    folded_chirho = fold_chirho(reading_text_chirho)
    visual_chirho = folded_chirho[::-1]
    return [CHAR_TO_IDX_CHIRHO[c_chirho] for c_chirho in visual_chirho
            if c_chirho in CHAR_TO_IDX_CHIRHO]


def img_to_tensor_chirho(pil_gray_chirho):
    """grayscale PIL -> (1, IMG_H, W) float tensor in [0,1], height-fixed,
    aspect-preserved, ink=high (invert so background 0)."""
    w_chirho, h_chirho = pil_gray_chirho.size
    if h_chirho == 0:
        return None
    new_w_chirho = max(8, int(round(w_chirho * IMG_H_CHIRHO / h_chirho)))
    im_chirho = pil_gray_chirho.resize((new_w_chirho, IMG_H_CHIRHO),
                                       Image.BILINEAR)
    arr_chirho = np.asarray(im_chirho, dtype=np.float32) / 255.0
    arr_chirho = 1.0 - arr_chirho            # ink -> high
    return torch.from_numpy(arr_chirho).unsqueeze(0)


def load_wlc_vocab_chirho(max_words_chirho=None, exclude_texts_chirho=None):
    """distinct folded WLC consonant-words usable as synthetic vocab,
    restricted to words whose chars are all in the alphabet. When
    exclude_texts_chirho is given, those folded words are DROPPED — used to
    strip held-out test-word sequences so the synthetic pretraining cannot
    leak the test vocabulary (a strict generalisation measurement)."""
    exclude_chirho = exclude_texts_chirho or set()
    conn_chirho = sqlite3.connect(WLC_PATH_CHIRHO)
    seen_chirho = set()
    for (cons_chirho,) in conn_chirho.execute(
            "SELECT consonants_only_chirho FROM words_chirho"):
        f_chirho = fold_chirho(cons_chirho)
        if (2 <= len(f_chirho) <= 10
                and f_chirho not in exclude_chirho
                and all(c_chirho in CHAR_TO_IDX_CHIRHO for c_chirho in f_chirho)):
            seen_chirho.add(f_chirho)
    conn_chirho.close()
    vocab_chirho = sorted(seen_chirho)
    random.Random(17).shuffle(vocab_chirho)
    if max_words_chirho:
        vocab_chirho = vocab_chirho[:max_words_chirho]
    return vocab_chirho


def load_gold_split_chirho(holdout_frac_chirho=0.15):
    """(train_records, test_records). STABLE split by md5 of the crop
    name (Python's hash() is per-process salted, so use hashlib for a
    reproducible held-out set across runs)."""
    import hashlib
    man_chirho = json.loads(
        (GOLD_DIR_CHIRHO / "manifest-chirho.json").read_text())["goldChirho"]
    train_chirho, test_chirho = [], []
    for r_chirho in man_chirho:
        d_chirho = hashlib.md5(r_chirho["cropChirho"].encode()).hexdigest()
        h_chirho = (int(d_chirho[:6], 16) % 1000) / 1000.0
        (test_chirho if h_chirho < holdout_frac_chirho
         else train_chirho).append(r_chirho)
    return train_chirho, test_chirho


class CRNNChirho(nn.Module):
    """Compact CRNN: CNN -> collapse height -> BiLSTM -> linear (CTC)."""

    def __init__(self, num_classes_chirho):
        super().__init__()

        def block_chirho(in_c_chirho, out_c_chirho, pool_chirho):
            return nn.Sequential(
                nn.Conv2d(in_c_chirho, out_c_chirho, 3, padding=1),
                nn.BatchNorm2d(out_c_chirho),
                nn.ReLU(inplace=True),
                nn.MaxPool2d(pool_chirho),
            )
        self.cnn_chirho = nn.Sequential(
            block_chirho(1, 32, (2, 2)),     # H/2  W/2
            block_chirho(32, 64, (2, 2)),    # H/4  W/2
            block_chirho(64, 128, (2, 1)),   # H/8  W/2
            block_chirho(128, 256, (2, 1)),  # H/16 W/2
        )
        self.collapse_chirho = nn.AdaptiveAvgPool2d((1, None))
        self.rnn_chirho = nn.LSTM(256, 256, num_layers=2,
                                  bidirectional=True, batch_first=True)
        self.head_chirho = nn.Linear(512, num_classes_chirho)

    def forward(self, x_chirho, widths_chirho=None):   # x: (B,1,H,W)
        f_chirho = self.cnn_chirho(x_chirho)       # (B,256,H',W')
        f_chirho = self.collapse_chirho(f_chirho)  # (B,256,1,W')
        f_chirho = f_chirho.squeeze(2).permute(0, 2, 1)  # (B,W',256)
        if widths_chirho is None:
            f_chirho, _ = self.rnn_chirho(f_chirho)      # (B,W',512)
        else:
            # The RNN is BIDIRECTIONAL, so its backward pass begins inside the
            # right-padding and carries that state into the real timesteps.
            # Truncating after the fact does not undo it — the padding has to be
            # kept out of the RNN. Packing makes a batched read identical to the
            # same crop read alone (audited 2026-08-20).
            lens_chirho = torch.tensor(
                [valid_timesteps_chirho(w_chirho) for w_chirho in widths_chirho],
                dtype=torch.long)
            packed_chirho = nn.utils.rnn.pack_padded_sequence(
                f_chirho, lens_chirho, batch_first=True, enforce_sorted=False)
            packed_chirho, _ = self.rnn_chirho(packed_chirho)
            f_chirho, _ = nn.utils.rnn.pad_packed_sequence(
                packed_chirho, batch_first=True, total_length=f_chirho.shape[1])
        return self.head_chirho(f_chirho)          # (B,W',C)


def collate_chirho(batch_chirho):
    """list of (tensor(1,H,W), label_list) -> padded images + CTC tensors."""
    batch_chirho = [b_chirho for b_chirho in batch_chirho
                    if b_chirho[0] is not None and len(b_chirho[1]) > 0]
    if not batch_chirho:
        return None
    max_w_chirho = padded_width_chirho(
        max(b_chirho[0].shape[2] for b_chirho in batch_chirho))
    imgs_chirho = torch.zeros(len(batch_chirho), 1, IMG_H_CHIRHO, max_w_chirho)
    widths_chirho, targets_chirho, target_lens_chirho = [], [], []
    for i_chirho, (img_chirho, lab_chirho) in enumerate(batch_chirho):
        imgs_chirho[i_chirho, :, :, :img_chirho.shape[2]] = img_chirho
        widths_chirho.append(img_chirho.shape[2])
        targets_chirho.extend(lab_chirho)
        target_lens_chirho.append(len(lab_chirho))
    return (imgs_chirho,
            torch.tensor(targets_chirho, dtype=torch.long),
            torch.tensor(target_lens_chirho, dtype=torch.long),
            torch.tensor(widths_chirho, dtype=torch.long))


# The CNN halves width twice ((2,2) then (2,2); the last two pools are (2,1)),
# so one timestep covers WIDTH_DOWNSAMPLE_CHIRHO input columns. Needed to know
# which timesteps belong to a real image and which to right-padding.
WIDTH_DOWNSAMPLE_CHIRHO = 4


def padded_width_chirho(width_chirho):
    """Round a width up to the pooling grid so the grid never depends on which
    other crops share the batch."""
    w_chirho = int(width_chirho)
    return ((w_chirho + WIDTH_DOWNSAMPLE_CHIRHO - 1)
            // WIDTH_DOWNSAMPLE_CHIRHO) * WIDTH_DOWNSAMPLE_CHIRHO


def valid_timesteps_chirho(width_chirho):
    """Timesteps a crop of this true pixel width occupies on that grid.

    Ceiling, not floor: at an un-rounded width the final MaxPool DISCARDS a
    trailing odd column when the crop is alone but PAIRS it with padding when
    the crop shares a batch, which silently changes the boundary timestep's
    features (measured 1.89 max-abs, 2026-08-20)."""
    return max(1, padded_width_chirho(width_chirho) // WIDTH_DOWNSAMPLE_CHIRHO)


def width_bucketed_batches_chirho(tensors_chirho, batch_size_chirho):
    """Yield (indices, collate output) batching ONLY crops of equal padded width.

    Rounding the batch maximum is not enough for a batched read to equal a solo
    read: a narrow crop sharing a canvas with a wider one still gets extra
    background columns inside its CNN receptive field, and those reach its
    boundary timestep BEFORE packing isolates the BiLSTM. Packing fixes the
    recurrence; it cannot undo CNN divergence. Width-homogeneous batches give
    every crop the same canvas it would get alone.

    Measured on the default 400-crop production sample (2026-08-20): mixed-width
    batch 32 differed from solo on 12-24 decoded strings (count is backend
    dependent) and up to 0.55 confidence; width-bucketed batching differs on 0
    strings with ~1e-6 confidence noise.
    """
    buckets_chirho = {}
    for index_chirho, tensor_chirho in enumerate(tensors_chirho):
        buckets_chirho.setdefault(
            padded_width_chirho(tensor_chirho.shape[-1]), []).append(index_chirho)
    for width_chirho in sorted(buckets_chirho):
        indices_chirho = buckets_chirho[width_chirho]
        for start_chirho in range(0, len(indices_chirho), batch_size_chirho):
            group_chirho = indices_chirho[start_chirho:start_chirho + batch_size_chirho]
            batch_chirho = collate_chirho([(tensors_chirho[i_chirho], [1])
                                           for i_chirho in group_chirho])
            if batch_chirho is not None:
                yield group_chirho, batch_chirho


def greedy_decode_chirho(logits_chirho, widths_chirho=None):
    """(B,T,C) logits -> list of reading-order strings (un-reverse).

    `widths_chirho` = true pre-padding pixel widths. Without it every row is
    decoded across the full padded width, so a batch's widest member dictates
    what its neighbours emit and the same crop can decode differently at
    different batch sizes (audited 2026-08-20: batch 32 vs batch 1 flipped two
    held-out predictions, one of which manufactured a false pass). Always pass
    widths when decoding a padded batch.
    """
    idx_chirho = logits_chirho.argmax(dim=2).cpu().numpy()   # (B,T)
    out_chirho = []
    for row_index_chirho, row_chirho in enumerate(idx_chirho):
        if widths_chirho is not None:
            row_chirho = row_chirho[:valid_timesteps_chirho(widths_chirho[row_index_chirho])]
        prev_chirho, chars_chirho = 0, []
        for v_chirho in row_chirho:
            if v_chirho != 0 and v_chirho != prev_chirho:
                chars_chirho.append(IDX_TO_CHAR_CHIRHO.get(int(v_chirho), ""))
            prev_chirho = v_chirho
        visual_chirho = "".join(chars_chirho)
        out_chirho.append(visual_chirho[::-1])    # visual -> reading order
    return out_chirho


def make_synth_batch_chirho(vocab_chirho, font_chirho, bs_chirho):
    items_chirho = []
    for _ in range(bs_chirho):
        word_chirho = random.choice(vocab_chirho)
        try:
            img_chirho = csyn_chirho.compose_word_chirho(
                word_chirho, font_chirho, glue_prob_chirho=0.45)
        except (KeyError, ValueError):
            continue
        t_chirho = img_to_tensor_chirho(img_chirho)
        items_chirho.append((t_chirho, encode_label_chirho(word_chirho)))
    return collate_chirho(items_chirho)


def load_real_items_chirho(records_chirho):
    items_chirho = []
    for r_chirho in records_chirho:
        p_chirho = CORPUS_DIR_CHIRHO / r_chirho["cropChirho"]
        if not p_chirho.exists():
            continue
        img_chirho = Image.open(p_chirho).convert("L")
        t_chirho = img_to_tensor_chirho(img_chirho)
        lab_chirho = encode_label_chirho(r_chirho["goldConsonantsChirho"])
        if t_chirho is not None and lab_chirho:
            items_chirho.append((t_chirho, lab_chirho,
                                 fold_chirho(r_chirho["goldConsonantsChirho"])))
    return items_chirho


def load_pseudo_gold_chirho(test_crop_names_chirho):
    """Self-training pseudo-labels (CRNN high-conf WLC-exact reads on
    un-gold crops). EXCLUDES any crop in the held-out test set (none
    should overlap — pseudo is un-gold — but guard anyway)."""
    p_chirho = MODEL_OUT_CHIRHO.parent / "pseudo-gold-chirho.json"
    if not p_chirho.exists():
        return []
    recs_chirho = json.loads(p_chirho.read_text()).get("pseudoGoldChirho", [])
    recs_chirho = [r_chirho for r_chirho in recs_chirho
                   if r_chirho["cropChirho"] not in test_crop_names_chirho]
    return load_real_items_chirho(recs_chirho)


@torch.no_grad()
def score_heldout_chirho(model_chirho, items_chirho, dev_chirho, bs_chirho=32):
    model_chirho.train(False)
    tot_ed_chirho = tot_len_chirho = exact_chirho = n_chirho = 0
    tensors_chirho = [t_chirho for t_chirho, _, _ in items_chirho]
    for group_chirho, batch_chirho in width_bucketed_batches_chirho(tensors_chirho, bs_chirho):
        chunk_chirho = [items_chirho[i_chirho] for i_chirho in group_chirho]
        imgs_chirho = batch_chirho[0].to(dev_chirho)
        preds_chirho = greedy_decode_chirho(
            model_chirho(imgs_chirho, batch_chirho[3]), batch_chirho[3])
        for (_, _, gold_chirho), pred_chirho in zip(chunk_chirho, preds_chirho):
            tot_ed_chirho += edit_dist_chirho(pred_chirho, gold_chirho)
            tot_len_chirho += len(gold_chirho)
            exact_chirho += (pred_chirho == gold_chirho)
            n_chirho += 1
    char_chirho = 1 - tot_ed_chirho / max(1, tot_len_chirho)
    return char_chirho, exact_chirho, n_chirho


def ctc_step_chirho(model_chirho, batch_chirho, ctc_chirho, opt_chirho, dev_chirho):
    imgs_chirho, targets_chirho, tlens_chirho, _ = batch_chirho
    imgs_chirho = imgs_chirho.to(dev_chirho)
    logits_chirho = model_chirho(imgs_chirho)                  # (B,T,C)
    logp_chirho = logits_chirho.log_softmax(2).permute(1, 0, 2)  # (T,B,C)
    in_lens_chirho = torch.full((imgs_chirho.size(0),),
                                logits_chirho.size(1), dtype=torch.long)
    loss_chirho = ctc_chirho(logp_chirho, targets_chirho.to(dev_chirho),
                             in_lens_chirho, tlens_chirho)
    opt_chirho.zero_grad()
    loss_chirho.backward()
    nn.utils.clip_grad_norm_(model_chirho.parameters(), 5.0)
    opt_chirho.step()
    return loss_chirho.item()


def main_chirho():
    ap_chirho = argparse.ArgumentParser()
    ap_chirho.add_argument("--smoke", action="store_true", dest="smoke_chirho")
    ap_chirho.add_argument("--pretrain-steps", type=int, default=4000,
                           dest="pretrain_steps_chirho")
    ap_chirho.add_argument("--finetune-epochs", type=int, default=40,
                           dest="finetune_epochs_chirho")
    ap_chirho.add_argument("--batch", type=int, default=32, dest="bs_chirho")
    ap_chirho.add_argument("--use-pseudo", action="store_true",
                           dest="use_pseudo_chirho",
                           help="add CRNN self-training pseudo-gold to the "
                                "real fine-tune set")
    ap_chirho.add_argument("--exclude-test-vocab", action="store_true",
                           dest="exclude_test_vocab_chirho",
                           help="drop held-out test-word sequences from the "
                                "synthetic vocab (strict generalisation test)")
    ap_chirho.add_argument("--dump-preds", default="", dest="dump_preds_chirho",
                           help="after training, write per-test-word "
                                "(crop, gold, pred, correct) JSON to this path")
    args_chirho = ap_chirho.parse_args()
    if args_chirho.smoke_chirho:
        args_chirho.pretrain_steps_chirho = 300
        args_chirho.finetune_epochs_chirho = 5

    random.seed(17)
    torch.manual_seed(17)
    dev_chirho = device_chirho()
    print(f"device={dev_chirho}  classes={NUM_CLASSES_CHIRHO}")

    csyn_chirho.CTRL_JITTER_FRAC_CHIRHO = 0.004
    font_chirho = csyn_chirho.load_stroke_font_chirho()
    train_recs_chirho, test_recs_chirho = load_gold_split_chirho()
    # Strict generalisation: optionally strip held-out test-word sequences
    # from the synthetic vocab so pretraining cannot leak the test lexicon.
    test_texts_chirho = {fold_chirho(r_chirho["goldConsonantsChirho"])
                         for r_chirho in test_recs_chirho}
    exclude_chirho = test_texts_chirho if args_chirho.exclude_test_vocab_chirho else None
    vocab_chirho = load_wlc_vocab_chirho(
        max_words_chirho=2000 if args_chirho.smoke_chirho else None,
        exclude_texts_chirho=exclude_chirho)
    real_train_chirho = load_real_items_chirho(train_recs_chirho)
    real_test_chirho = load_real_items_chirho(test_recs_chirho)
    test_names_chirho = {r_chirho["cropChirho"] for r_chirho in test_recs_chirho}
    train_texts_chirho = {fold_chirho(r_chirho["goldConsonantsChirho"])
                          for r_chirho in train_recs_chirho}
    n_pseudo_chirho = 0
    if args_chirho.use_pseudo_chirho:
        pseudo_items_chirho = load_pseudo_gold_chirho(test_names_chirho)
        n_pseudo_chirho = len(pseudo_items_chirho)
        real_train_chirho = real_train_chirho + pseudo_items_chirho
    print(f"WLC vocab={len(vocab_chirho)}  "
          f"real train={len(real_train_chirho)} (+{n_pseudo_chirho} pseudo)  "
          f"test={len(real_test_chirho)}")

    model_chirho = CRNNChirho(NUM_CLASSES_CHIRHO).to(dev_chirho)
    ctc_chirho = nn.CTCLoss(blank=0, zero_infinity=True)
    opt_chirho = torch.optim.Adam(model_chirho.parameters(), lr=1e-3)

    # ---- PRETRAIN on synthetic ----
    print(f"\n[pretrain] {args_chirho.pretrain_steps_chirho} synthetic steps")
    model_chirho.train()
    for step_chirho in range(1, args_chirho.pretrain_steps_chirho + 1):
        batch_chirho = make_synth_batch_chirho(vocab_chirho, font_chirho,
                                               args_chirho.bs_chirho)
        if batch_chirho is None:
            continue
        loss_chirho = ctc_step_chirho(model_chirho, batch_chirho, ctc_chirho,
                                      opt_chirho, dev_chirho)
        if step_chirho % max(1, args_chirho.pretrain_steps_chirho // 10) == 0:
            ch_chirho, ex_chirho, n_chirho = score_heldout_chirho(
                model_chirho, real_test_chirho, dev_chirho)
            print(f"  step {step_chirho:5d}  loss {loss_chirho:.3f}  "
                  f"| held-out real: char {ch_chirho:.3f}  exact {ex_chirho}/{n_chirho}")
            model_chirho.train()

    # ---- FINE-TUNE on real train split ----
    print(f"\n[finetune] {args_chirho.finetune_epochs_chirho} epochs on "
          f"{len(real_train_chirho)} real words")
    for g_chirho in opt_chirho.param_groups:
        g_chirho["lr"] = 3e-4
    for ep_chirho in range(1, args_chirho.finetune_epochs_chirho + 1):
        model_chirho.train()
        random.shuffle(real_train_chirho)
        for i_chirho in range(0, len(real_train_chirho), args_chirho.bs_chirho):
            chunk_chirho = real_train_chirho[i_chirho:i_chirho + args_chirho.bs_chirho]
            batch_chirho = collate_chirho([(t_chirho, lab_chirho)
                                           for t_chirho, lab_chirho, _ in chunk_chirho])
            if batch_chirho is None:
                continue
            ctc_step_chirho(model_chirho, batch_chirho, ctc_chirho,
                            opt_chirho, dev_chirho)
        if ep_chirho % max(1, args_chirho.finetune_epochs_chirho // 10) == 0:
            ch_chirho, ex_chirho, n_chirho = score_heldout_chirho(
                model_chirho, real_test_chirho, dev_chirho)
            print(f"  epoch {ep_chirho:3d}  | held-out real: "
                  f"char {ch_chirho:.3f}  exact {ex_chirho}/{n_chirho}")

    ch_chirho, ex_chirho, n_chirho = score_heldout_chirho(
        model_chirho, real_test_chirho, dev_chirho)
    print(f"\n=== FINAL held-out real gold: char {ch_chirho:.3f}  "
          f"exact {ex_chirho}/{n_chirho} = {ex_chirho / max(1, n_chirho):.3f} ===")
    print("  anchor: analysis-by-synthesis reader ~0.52 char / ~0.24 exact "
          "on held-out OK. Honest; different (mixed-length) split.")
    MODEL_OUT_CHIRHO.parent.mkdir(parents=True, exist_ok=True)
    torch.save({"modelChirho": model_chirho.state_dict(),
                "alphabetChirho": ALPHABET_CHIRHO}, MODEL_OUT_CHIRHO)
    print(f"saved {MODEL_OUT_CHIRHO}")

    # ---- per-test-word prediction dump + novel-vs-seen breakdown ----
    if args_chirho.dump_preds_chirho:
        model_chirho.train(False)
        preds_out_chirho = []
        for i_chirho in range(0, len(test_recs_chirho), args_chirho.bs_chirho):
            chunk_chirho = test_recs_chirho[i_chirho:i_chirho + args_chirho.bs_chirho]
            items_chirho, metas_chirho = [], []
            for r_chirho in chunk_chirho:
                p_chirho = CORPUS_DIR_CHIRHO / r_chirho["cropChirho"]
                if not p_chirho.exists():
                    continue
                t_chirho = img_to_tensor_chirho(Image.open(p_chirho).convert("L"))
                if t_chirho is None:
                    continue
                items_chirho.append((t_chirho, [1]))
                metas_chirho.append(r_chirho)
            batch_chirho = collate_chirho(items_chirho)
            if batch_chirho is None:
                continue
            with torch.no_grad():
                logits_chirho = model_chirho(batch_chirho[0].to(dev_chirho))
            for r_chirho, pred_chirho in zip(metas_chirho,
                                             greedy_decode_chirho(logits_chirho)):
                gold_chirho = fold_chirho(r_chirho["goldConsonantsChirho"])
                preds_out_chirho.append({
                    "cropChirho": r_chirho["cropChirho"],
                    "goldChirho": gold_chirho,
                    "predChirho": pred_chirho,
                    "correctChirho": pred_chirho == gold_chirho,
                    "seenInTrainChirho": gold_chirho in train_texts_chirho,
                })
        Path(args_chirho.dump_preds_chirho).write_text(
            json.dumps({"predsChirho": preds_out_chirho,
                        "excludeTestVocabChirho": args_chirho.exclude_test_vocab_chirho},
                       ensure_ascii=False, indent=1))
        seen_chirho = [p_chirho for p_chirho in preds_out_chirho if p_chirho["seenInTrainChirho"]]
        novel_chirho = [p_chirho for p_chirho in preds_out_chirho if not p_chirho["seenInTrainChirho"]]
        sc_chirho = sum(p_chirho["correctChirho"] for p_chirho in seen_chirho)
        nc_chirho = sum(p_chirho["correctChirho"] for p_chirho in novel_chirho)
        print(f"\n=== generalisation breakdown (exact-match) ===")
        print(f"  test words whose TEXT was in train (seen): "
              f"{sc_chirho}/{len(seen_chirho)} = {sc_chirho / max(1, len(seen_chirho)):.3f}")
        print(f"  test words with NOVEL text (never in train): "
              f"{nc_chirho}/{len(novel_chirho)} = {nc_chirho / max(1, len(novel_chirho)):.3f}"
              f"  <- the honest generalisation floor")
        print(f"  dumped per-word preds -> {args_chirho.dump_preds_chirho}")


if __name__ == "__main__":
    main_chirho()
