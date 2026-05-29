"""
train_model.py
==============
Trains a proper fraud-detection model from data — no hardcoded if/else scores.

Two training modes:
  1. Synthetic data (default, runs at startup if no model exists)
  2. Real CSV data: python train_model.py path/to/transactions.csv

The synthetic dataset is carefully designed to reflect real AML patterns:
  - Clean: normal amounts, normal hours, trusted receivers
  - Fraud: large amounts, round-number structuring, suspicious receivers,
           off-hours transactions, high transaction velocity (smurfing)

Features:
  [amount, is_round_number, is_suspicious_receiver, sender_tx_count, hour_of_day]

Output:
  ml/xgboost_model.pkl  (XGBoost + SMOTE, preferred)
  ml/fraud_model.pkl    (RandomForest fallback if XGBoost not installed)
"""

import numpy as np
import os
import random
import joblib

# ── Paths ────────────────────────────────────────────────────────────────────
_HERE    = os.path.dirname(os.path.abspath(__file__))
_ML_DIR  = os.path.abspath(os.path.join(_HERE, "..", "..", "ml"))
_XGB_PATH = os.path.join(_ML_DIR, "xgboost_model.pkl")
_RF_PATH  = os.path.join(_ML_DIR, "fraud_model.pkl")

SUSPICIOUS_RECEIVERS = [
    "Unknown", "Anonymous", "Offshore_Account",
    "Test", "Fake", "Shell_Corp_1", "Shell_Corp_2", "Unknown_Entity"
]


# ── Synthetic data generator ──────────────────────────────────────────────────

def generate_training_data(n_samples: int = 3000):
    """
    Generates labelled synthetic transaction data that captures real AML patterns.
    Returns (X: ndarray, y: ndarray) with the same 5 features the model uses.
    """
    random.seed(42)
    np.random.seed(42)

    data, labels = [], []

    n_clean = int(n_samples * 0.80)
    n_fraud = n_samples - n_clean

    # ── Clean transactions (label = 0) ────────────────────────────────────
    for _ in range(n_clean):
        amount      = random.uniform(50, 12000)
        is_round    = 0  # clean txns are never exact round multiples of 10k
        is_susp     = 0  # clean txns go to trusted receivers
        tx_count    = random.randint(1, 6)
        hour        = random.randint(7, 22)   # business hours
        data.append([amount, is_round, is_susp, tx_count, hour])
        labels.append(0)

    # ── Fraud transactions (label = 1) ────────────────────────────────────
    # Four distinct AML patterns so the model learns multiple signals:
    #   1. Large transfer  — very high amount, often off-hours
    #   2. Suspicious recv — moderate amount but going to known bad actors
    #   3. Round-number    — structuring (exact 10k, 20k, 50k, 100k amounts)
    #   4. Smurfing        — many small txns from same sender, off-hours

    fraud_patterns = ["large", "suspicious_recv", "round_number", "smurfing"]

    for i in range(n_fraud):
        pattern = fraud_patterns[i % len(fraud_patterns)]  # balanced mix

        if pattern == "large":
            amount   = random.uniform(55000, 500000)
            is_round = 1 if amount % 10000 == 0 else 0
            is_susp  = random.choice([0, 0, 1])   # not always suspicious receiver
            tx_count = random.randint(1, 4)
            hour     = random.randint(0, 6)        # suspicious hours

        elif pattern == "suspicious_recv":
            amount   = random.uniform(3000, 50000)
            is_round = 1 if amount % 10000 == 0 else 0
            is_susp  = 1                           # always a known bad receiver
            tx_count = random.randint(2, 10)
            hour     = random.randint(0, 23)

        elif pattern == "round_number":
            amount   = random.choice([10000, 20000, 30000, 50000, 100000, 200000])
            is_round = 1
            is_susp  = random.choice([0, 1])
            tx_count = random.randint(2, 8)
            hour     = random.randint(1, 5)

        else:  # smurfing — many rapid small transfers
            amount   = random.uniform(3000, 9500)   # just below reporting threshold
            is_round = 0
            is_susp  = 1
            tx_count = random.randint(10, 25)        # high velocity
            hour     = random.randint(0, 4)

        data.append([amount, is_round, is_susp, tx_count, hour])
        labels.append(1)

    # Shuffle so clean and fraud aren't in order
    combined = list(zip(data, labels))
    random.shuffle(combined)
    data, labels = zip(*combined)

    return np.array(data), np.array(labels)


# ── XGBoost trainer (primary) ─────────────────────────────────────────────────

def train_xgboost_model(n_samples: int = 3000) -> object:
    """
    Trains an XGBoost classifier with SMOTE oversampling.
    Falls back to RandomForest if XGBoost / imbalanced-learn aren't installed.
    """
    os.makedirs(_ML_DIR, exist_ok=True)

    print(f"[Train] Generating {n_samples} synthetic transactions...")
    X, y = generate_training_data(n_samples)

    try:
        from xgboost import XGBClassifier
        from sklearn.model_selection import train_test_split, cross_val_score
        from sklearn.metrics import classification_report, roc_auc_score
        from imblearn.over_sampling import SMOTE

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        print("[Train] Applying SMOTE to balance classes...")
        smote = SMOTE(random_state=42)
        X_train_sm, y_train_sm = smote.fit_resample(X_train, y_train)

        print(f"[Train] Training XGBoost on {len(X_train_sm)} samples...")
        model = XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=4,   # extra weight on fraud class
            random_state=42,
            eval_metric="logloss",
            use_label_encoder=False
        )
        model.fit(X_train_sm, y_train_sm)

        # Evaluation
        y_pred  = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1]
        print("\n[Train] === Evaluation on hold-out test set ===")
        print(classification_report(y_test, y_pred, target_names=["Clean", "Fraud"]))
        print(f"[Train] ROC-AUC: {roc_auc_score(y_test, y_proba):.4f}\n")

        # Feature importance
        feature_names = ["amount", "is_round_number", "is_suspicious_receiver", "sender_tx_count", "hour_of_day"]
        importances = model.feature_importances_
        print("[Train] Feature importances:")
        for name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
            print(f"  {name:30s} {imp:.4f}")

        joblib.dump(model, _XGB_PATH)
        print(f"\n[Train] ✅ XGBoost model saved → {_XGB_PATH}")
        return model

    except ImportError as e:
        print(f"[Train] XGBoost/imbalanced-learn not available ({e}), using RandomForest fallback...")
        return _train_random_forest(X, y)


# ── RandomForest fallback ─────────────────────────────────────────────────────

def _train_random_forest(X, y) -> object:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print("[Train] Training RandomForest (balanced class weights)...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("\n[Train] === Evaluation ===")
    print(classification_report(y_test, y_pred, target_names=["Clean", "Fraud"]))

    joblib.dump(model, _RF_PATH)
    print(f"[Train] ✅ RandomForest model saved → {_RF_PATH}")
    return model


# ── CSV trainer (for real labelled data) ─────────────────────────────────────

def train_from_csv(csv_path: str):
    """
    Train from a real CSV with columns:
      sender, receiver, amount, is_fraud (0 or 1)
    Optional columns: hour_of_day, sender_tx_count
    """
    import pandas as pd
    from xgboost import XGBClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, roc_auc_score
    from imblearn.over_sampling import SMOTE

    print(f"[Train] Loading CSV: {csv_path}")
    df = pd.read_csv(csv_path)

    # Feature engineering
    df["is_suspicious_receiver"] = df["receiver"].apply(
        lambda x: 1 if x in SUSPICIOUS_RECEIVERS else 0
    )
    df["is_round_number"] = df["amount"].apply(
        lambda x: 1 if (x % 10000 == 0 and x >= 10000) else 0
    )
    if "hour_of_day" not in df.columns:
        df["hour_of_day"] = 12
    if "sender_tx_count" not in df.columns:
        df["sender_tx_count"] = 1

    X = df[["amount", "is_round_number", "is_suspicious_receiver",
            "sender_tx_count", "hour_of_day"]].values
    y = df["is_fraud"].values

    print(f"[Train] Dataset: {len(df)} rows | Fraud rate: {y.mean()*100:.1f}%")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    smote = SMOTE(random_state=42)
    X_train_sm, y_train_sm = smote.fit_resample(X_train, y_train)

    model = XGBClassifier(
        n_estimators=200, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8,
        scale_pos_weight=4, random_state=42,
        eval_metric="logloss", use_label_encoder=False
    )
    model.fit(X_train_sm, y_train_sm)

    y_pred  = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    print(classification_report(y_test, y_pred, target_names=["Clean", "Fraud"]))
    print(f"ROC-AUC: {roc_auc_score(y_test, y_proba):.4f}")

    os.makedirs(_ML_DIR, exist_ok=True)
    joblib.dump(model, _XGB_PATH)
    print(f"[Train] ✅ Model saved → {_XGB_PATH}")
    return model


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        train_from_csv(sys.argv[1])
    else:
        train_xgboost_model()