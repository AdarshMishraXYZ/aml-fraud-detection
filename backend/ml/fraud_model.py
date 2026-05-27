import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os
import shap

X_train = [
    [100, 0, 0, 1, 12], [500, 0, 0, 1, 12], [1000, 1, 0, 2, 10],
    [5000, 0, 0, 1, 14], [10000, 1, 0, 2, 9], [50000, 0, 0, 1, 15],
    [99999, 0, 1, 5, 2], [200000, 0, 1, 8, 3], [30000, 1, 1, 6, 1],
    [75000, 0, 1, 4, 4],
]
y_train = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1]
feature_names = ["amount", "is_round_number", "is_suspicious_receiver", "sender_tx_count", "hour_of_day"]

def train_model():
    model = RandomForestClassifier(n_estimators=10, random_state=42)
    model.fit(X_train, y_train)
    joblib.dump(model, 'ml/fraud_model.pkl')
    return model

def get_model():
    xgb_path = 'ml/xgboost_model.pkl'
    rf_path = 'ml/fraud_model.pkl'
    if os.path.exists(xgb_path):
        return joblib.load(xgb_path)
    elif os.path.exists(rf_path):
        return joblib.load(rf_path)
    return train_model()

def predict_fraud(amount: float, receiver: str) -> dict:
    suspicious_names = ["Unknown", "Anonymous", "Test", "Fake"]
    is_suspicious_receiver = 1 if receiver in suspicious_names else 0
    is_round_number = 1 if amount % 10000 == 0 and amount >= 10000 else 0
    sender_tx_count = 1
    hour_of_day = 12
    features = [[amount, is_round_number, is_suspicious_receiver, sender_tx_count, hour_of_day]]
    model = get_model()
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0]
    return {
        "is_fraud": bool(prediction),
        "fraud_probability": round(float(probability[1]) * 100, 2),
        "risk_level": "high" if probability[1] > 0.7 else "medium" if probability[1] > 0.3 else "low"
    }

def explain_prediction(amount: float, receiver: str) -> dict:
    suspicious_names = ["Unknown", "Anonymous", "Test", "Fake"]
    is_suspicious_receiver = 1 if receiver in suspicious_names else 0
    is_round_number = 1 if amount % 10000 == 0 and amount >= 10000 else 0
    features = np.array([[amount, is_round_number, is_suspicious_receiver, 1, 12]])
    model = get_model()

    try:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(features)
        if isinstance(shap_values, list):
            fraud_shap = np.array(shap_values[1]).flatten()
        else:
            fraud_shap = np.array(shap_values).flatten()
        explanation = {}
        for i, name in enumerate(feature_names):
            explanation[name] = round(float(fraud_shap[i]), 4)
        top_reason = max(explanation, key=lambda k: abs(explanation[k]))
        return {
            "shap_values": explanation,
            "top_reason": top_reason,
            "interpretation": f"'{top_reason}' was the biggest factor in this prediction"
        }
    except Exception as e:
        return {
            "shap_values": {},
            "top_reason": "amount",
            "interpretation": "Explanation unavailable"
        }