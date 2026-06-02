from ml.fraud_model import predict_fraud
from datetime import datetime

SUSPICIOUS_RECEIVERS = [
    "Unknown", "Anonymous", "Offshore_Account",
    "Test", "Fake", "Shell_Corp_1", "Shell_Corp_2", "Unknown_Entity"
]

def check_fraud(transaction: dict, db=None) -> str:
    amount = transaction["amount"]
    sender = transaction["sender"]
    receiver = transaction["receiver"]
    hour = datetime.now().hour

    # Get sender transaction count from DB if available
    sender_tx_count = 1
    if db:
        from models.transaction import TransactionDB
        sender_tx_count = db.query(TransactionDB).filter(
            TransactionDB.sender == sender
        ).count() + 1

    # Self transfer - always rejected
    if sender == receiver:
        return "rejected"

    # Get ML probability
    ml_result = predict_fraud(
        amount=amount,
        receiver=receiver,
        sender_tx_count=sender_tx_count,
        hour_of_day=hour
    )
    ml_prob = ml_result["fraud_probability"]

    # Calculate combined risk score
    score = 0

    # ML component (50% weight)
    score += (ml_prob / 100) * 50

    # Rule-based component (50% weight)
    # Large amount
    if amount > 500000:
        score += 25
    elif amount > 200000:
        score += 20
    elif amount > 100000:
        score += 15
    elif amount > 50000:
        score += 10

    # Suspicious receiver
    if receiver in SUSPICIOUS_RECEIVERS:
        score += 15

    # Round number structuring
    if amount % 10000 == 0 and amount >= 10000:
        score += 8

    # Off-hours transaction (midnight to 5am)
    if hour >= 0 and hour <= 5:
        score += 5

    # Determine status based on combined score
    if score >= 60:
        return "flagged"
    elif score >= 40:
        return "suspicious"
    elif score >= 20:
        return "review"
    else:
        return "clean"
