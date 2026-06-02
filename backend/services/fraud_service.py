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

    # Self transfer - always rejected
    if sender == receiver:
        return "rejected"

    # Get sender transaction count from DB if available
    sender_tx_count = 1
    if db:
        try:
            from models.transaction import TransactionDB
            sender_tx_count = db.query(TransactionDB).filter(
                TransactionDB.sender == sender
            ).count() + 1
        except:
            sender_tx_count = 1

    # Import ML model here to avoid circular imports
    try:
        from ml.fraud_model import predict_fraud
        ml_result = predict_fraud(
            amount=amount,
            receiver=receiver,
            sender_tx_count=sender_tx_count,
            hour_of_day=hour
        )
        ml_prob = ml_result["fraud_probability"]
    except:
        ml_prob = 0

    # Calculate combined risk score
    score = 0

    # ML component (50% weight)
    score += (ml_prob / 100) * 50

    # Amount-based rules
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

    # Off-hours transaction
    if 0 <= hour <= 5:
        score += 5

    # Determine status
    if score >= 60:
        return "flagged"
    elif score >= 40:
        return "suspicious"
    elif score >= 20:
        return "review"
    else:
        return "clean"
