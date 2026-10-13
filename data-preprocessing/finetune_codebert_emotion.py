"""
Fine-tune CodeBERT for SE Emotion Classification
=================================================
Dataset : CommiTune (GitHub commit messages)
Labels  : Frustration, Satisfaction, Caution, Neutral
Model   : microsoft/codebert-base (125M — runs on M3 MacBook)

Install deps first:
    pip install transformers datasets scikit-learn pandas torch

Run:
    python finetune_codebert_emotion.py
"""

import os
import pandas as pd
import numpy as np
import torch
from torch.utils.data import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
)
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score


# ── Config ─────────────────────────────────────────────────────────────────

MODEL_NAME   = "microsoft/codebert-base"
OUTPUT_DIR   = "./codebert-se-emotion"
MAX_LEN      = 128
BATCH_SIZE   = 8          # 8 is safe on 16 GB RAM; bump to 16 if you have headroom
EPOCHS       = 5
LR           = 2e-5
SEED         = 42

# CommiTune dataset — resolved relative to this script's location
_HERE        = os.path.dirname(os.path.abspath(__file__))
LOCAL_CSV    = os.path.join(_HERE, "manual_labeled_2k.csv")

# Label schema — must match exact casing in reconciled_emotion column
LABELS       = ["frustration", "satisfaction", "caution", "neutral"]
LABEL2ID     = {l: i for i, l in enumerate(LABELS)}
ID2LABEL     = {i: l for i, l in enumerate(LABELS)}

# ── Dataset class ───────────────────────────────────────────────────────────

class CommitEmotionDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len):
        self.texts     = texts
        self.labels    = labels
        self.tokenizer = tokenizer
        self.max_len   = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        enc = self.tokenizer(
            self.texts[idx],
            max_length=self.max_len,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        return {
            "input_ids":      enc["input_ids"].squeeze(),
            "attention_mask": enc["attention_mask"].squeeze(),
            "labels":         torch.tensor(self.labels[idx], dtype=torch.long),
        }

# ── Metrics ─────────────────────────────────────────────────────────────────

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    macro_f1 = f1_score(labels, preds, average="macro")
    return {"macro_f1": macro_f1}

# ── Load data ────────────────────────────────────────────────────────────────

def load_dataset():
    if not os.path.exists(LOCAL_CSV):
        print(f"\n⚠️  CSV not found at: {LOCAL_CSV}")
        print("Make sure you cloned the repo:")
        print("  git clone https://github.com/anonymous-commit-emotion/reproducibility-pack-2025")
        raise SystemExit(1)

    df = pd.read_csv(LOCAL_CSV)

    # ── Column names for manual_labeled_2k.csv ─────────────────────────────
    text_col  = "message"
    label_col = "reconciled_emotion"

    if text_col not in df.columns or label_col not in df.columns:
        print(f"Columns found: {list(df.columns)}")
        print(f"Expected '{text_col}' and '{label_col}'.")
        raise SystemExit(1)

    df = df[[text_col, label_col]].dropna()

    # Drop ambiguous / unadjudicated rows
    df = df[~df[label_col].isin(["NEED REVIEW", ""])]

    # Strip strat_label prefix noise: "4568 chromium/chromium 2020Q2 "
    df[text_col] = df[text_col].str.replace(
        r'^\d+\s+\S+/\S+\s+\d{4}Q\d\s*', '', regex=True
    )

    df = df[df[label_col].isin(LABELS)]           # keep only known labels
    df["label_id"] = df[label_col].map(LABEL2ID)

    print(f"\nDataset loaded: {len(df)} examples")
    print(df[label_col].value_counts().to_string())
    return df[text_col].tolist(), df["label_id"].tolist()

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    torch.manual_seed(SEED)

    # 1. Load data
    texts, labels = load_dataset()

    # 2. Train / val split (80/20)
    X_train, X_val, y_train, y_val = train_test_split(
        texts, labels, test_size=0.2, random_state=SEED, stratify=labels
    )
    print(f"\nTrain: {len(X_train)}  |  Val: {len(X_val)}")

    # 3. Tokenizer + model
    print(f"\nLoading {MODEL_NAME}...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=len(LABELS),
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )

    # 4. Torch datasets
    train_ds = CommitEmotionDataset(X_train, y_train, tokenizer, MAX_LEN)
    val_ds   = CommitEmotionDataset(X_val,   y_val,   tokenizer, MAX_LEN)

    # 5. Training args — MPS-friendly for M3 MacBook
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        learning_rate=LR,
        warmup_ratio=0.1,
        weight_decay=0.01,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="macro_f1",
        logging_steps=20,
        seed=SEED,
        # Let transformers auto-select MPS on Apple Silicon (no_cuda / use_mps_device
        # flags are deprecated in >=4.35 and cause a crash — MPS is picked automatically)
        report_to="none",                             # disable wandb/tensorboard
    )

    # 6. Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics,
    )

    # 7. Train
    print("\nStarting fine-tuning...\n")
    trainer.train()

    # 8. Save final model + tokenizer
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print(f"\nModel saved to ./{OUTPUT_DIR}/")

    # 9. Final classification report
    preds_output = trainer.predict(val_ds)
    preds = np.argmax(preds_output.predictions, axis=-1)
    print("\n── Classification Report ──────────────────────────")
    print(classification_report(y_val, preds, target_names=LABELS))

# ── Inference helper (use AFTER training) ────────────────────────────────────

def classify(texts: list[str], model_dir: str = OUTPUT_DIR) -> list[dict]:
    """
    Load the saved model and classify a list of texts.

    Example:
        results = classify([
            "finally fixed the null pointer after 2 days, what a relief",
            "this API is broken and docs are useless",
        ])
        for r in results:
            print(r["text"][:60], "->", r["emotion"], f"({r['confidence']:.0%})")
    """
    from transformers import pipeline
    classifier = pipeline(
        "text-classification",
        model=model_dir,
        tokenizer=model_dir,
        device="mps" if torch.backends.mps.is_available() else "cpu",
    )
    results = []
    for text in texts:
        out = classifier(text, truncation=True, max_length=MAX_LEN)[0]
        results.append({
            "text":       text,
            "emotion":    out["label"],
            "confidence": out["score"],
        })
    return results


if __name__ == "__main__":
    main()

    # ── Quick smoke-test after training ──────────────────────────────────────
    print("\n── Smoke Test ─────────────────────────────────────")
    samples = [
        "finally got the build passing after 3 days of debugging",
        "this library is completely broken, docs make no sense",
        "be careful merging this, it touches auth logic",
        "updated README with new install instructions",
    ]
    results = classify(samples)
    for r in results:
        print(f"  [{r['emotion']:12s} {r['confidence']:.0%}]  {r['text']}")