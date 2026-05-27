import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os

def train_anomaly_model():
    X = [
        [100, 0, 0], [500, 0, 0], [1000, 0, 0],
        [2000, 0, 0], [5000, 0, 0], [3000, 0, 0],
        [800, 0, 0], [1500, 0, 0], [2500, 0, 0],
        [4000, 0, 0], [600, 0, 0], [900, 0, 0],
    ]
    model = IsolationForest(contamination=0.1, random_state=42)
    model.fit(X)
    joblib.dump(model, 'ml/anomaly_model.pkl')
    return model

def detect_anomaly(amount: float, receiver: str) -> dict:
    suspicious_names = ["Unknown", "Anonymous", "Test", "Fake"]
    is_suspicious_receiver = 1 if receiver in suspicious_names else 0
    is_round_number = 1 if amount % 10000 == 0 and amount >= 10000 else 0
    features = np.array([[amount, is_round_number, is_suspicious_receiver]])
    model_path = 'ml/anomaly_model.pkl'
    if os.path.exists(model_path):
        model = joblib.load(model_path)
    else:
        model = train_anomaly_model()
    score = model.decision_function(features)[0]
    prediction = model.predict(features)[0]
    return {
        "is_anomaly": bool(prediction == -1),
        "anomaly_score": round(float(score), 4),
        "interpretation": "Anomalous transaction detected!" if prediction == -1 else "Normal transaction pattern"
    }