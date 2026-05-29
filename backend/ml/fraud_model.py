"""
fraud_model.py
==============
Loads a trained ML model (XGBoost preferred, RandomForest fallback).
If no saved model exists, it triggers training automatically from
synthetic data so the app always starts correctly.

Features used (must stay in sync with train_model.py):
  [amount, is_round_number, is_suspicious_receiver, sender_tx_count, hour_of_day]
"""

import numpy as np
import joblib
import os

FEATURE_NAMES = ["amount", "is_round_number", "is_suspicious_receiver", "sender_tx_count", "hour_of_day"]

SUSPICIOUS_RECEIVERS = [
    "Unknown", "Anonymous", "Offshore_Account",
    "Test", "Fake", "Shell_Corp_1", "Shell_Corp_2", "Unknown_Entity"
]

# Resolve model paths relative to this file so they work regardless of
# what the current working directory is (important on Render / HuggingFace)
_HERE = os.path.dirname(os.path.abspath(__file__))
_ML_DIR = os.path.join(_HERE, "..", "..", "ml")   # project root /ml/
_XGB_PATH = os.path.abspath(os.path.join(_ML_DIR, "xgboost_model.pkl"))
_RF_PATH  = os.path.abspath(os.path.join(_ML_DIR, "fraud_model.pkl"))

_cached_model = None  # module-level cache so we don't reload from disk every call


def get_model():
    """
    Load the best available trained model. Priority:
      1. ml/xgboost_model.pkl   (trained by train_model.py with XGBoost + SMOTE)
      2. ml/fraud_model.pkl     (RandomForest fallback)
      3. Train a new RandomForest on synthetic data if nothing exists yet
    """
    global _cached_model
    if _cached_model is not None:
        return _cached_model

    if os.path.exists(_XGB_PATH):
        print(f"[ML] Loading XGBoost model from {_XGB_PATH}")
        _cached_model = joblib.load(_XGB_PATH)
    elif os.path.exists(_RF_PATH):
        print(f"[ML] Loading RandomForest model from {_RF_PATH}")
        _cached_model = joblib.load(_RF_PATH)
    else:
        print("[ML] No saved model found — training a new RandomForest on synthetic data...")
        from ml.train_model import train_xgboost_model
        _cached_model = train_xgboost_model()

    return _cached_model


def _build_features(amount: float, receiver: str, sender_tx_count: int = 1, hour_of_day: int = 12) -> list:
    """Convert raw transaction fields into the feature vector the model expects."""
    is_suspicious_receiver = 1 if receiver in SUSPICIOUS_RECEIVERS else 0
    is_round_number = 1 if (amount % 10000 == 0 and amount >= 10000) else 0
    return [[amount, is_round_number, is_suspicious_receiver, sender_tx_count, hour_of_day]]


def predict_fraud(amount: float, receiver: str,
                  sender_tx_count: int = 1, hour_of_day: int = 12) -> dict:
    """
    Run the trained ML model to get a fraud probability.
    Returns a dict with:
      is_fraud (bool), fraud_probability (0–100 float), risk_level (low/medium/high)
    """
    features = _build_features(amount, receiver, sender_tx_count, hour_of_day)
    model = get_model()

    prediction  = model.predict(features)[0]
    probability = model.predict_proba(features)[0]  # [prob_clean, prob_fraud]

    fraud_prob = round(float(probability[1]) * 100, 2)

    # Thresholds kept in sync with risk_scorer.py
    if fraud_prob >= 70:
        risk_level = "high"
    elif fraud_prob >= 35:
        risk_level = "medium"
    else:
        risk_level = "low"

    return {
        "is_fraud": bool(prediction),
        "fraud_probability": fraud_prob,
        "risk_level": risk_level
    }


def explain_prediction(amount: float, receiver: str,
                       sender_tx_count: int = 1, hour_of_day: int = 12) -> dict:
    """
    SHAP-based explanation of which features drove the prediction.
    Falls back gracefully if SHAP is not installed.
    """
    try:
        import shap
        features = np.array(_build_features(amount, receiver, sender_tx_count, hour_of_day))
        model    = get_model()

        explainer  = shap.TreeExplainer(model)
        shap_vals  = explainer.shap_values(features)

        # shap_values is a list [class0, class1] for classifiers
        fraud_shap = np.array(shap_vals[1] if isinstance(shap_vals, list) else shap_vals).flatten()

        explanation = {name: round(float(fraud_shap[i]), 4) for i, name in enumerate(FEATURE_NAMES)}
        top_reason  = max(explanation, key=lambda k: abs(explanation[k]))

        return {
            "shap_values": explanation,
            "top_reason": top_reason,
            "interpretation": f"'{top_reason}' had the largest impact on this prediction"
        }
    except Exception as e:
        return {
            "shap_values": {},
            "top_reason": "unavailable",
            "interpretation": f"Explanation unavailable: {str(e)}"
        }