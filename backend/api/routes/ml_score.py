from ml.anomaly_detector import detect_anomaly
from fastapi import APIRouter
from ml.fraud_model import predict_fraud, explain_prediction

router = APIRouter()

@router.post("/ml/score")
def score_transaction(transaction: dict):
    result = predict_fraud(
        amount=transaction.get("amount"),
        receiver=transaction.get("receiver")
    )
    return result

@router.post("/ml/explain")
def explain_transaction(transaction: dict):
    prediction = predict_fraud(
        amount=transaction.get("amount"),
        receiver=transaction.get("receiver")
    )
    explanation = explain_prediction(
        amount=transaction.get("amount"),
        receiver=transaction.get("receiver")
    )
    return {
        "prediction": prediction,
        "explanation": explanation
    }
@router.post("/ml/anomaly")
def anomaly_detection(transaction: dict):
    result = detect_anomaly(
        amount=transaction.get("amount"),
        receiver=transaction.get("receiver")
    )
    return result