def calculate_risk_score(
    amount: float,
    sender: str,
    receiver: str,
    ml_probability: float,
    fraud_status: str
) -> dict:
    
    score = 0
    reasons = []

    # Rule-based score (max 30)
    if fraud_status == "flagged":
        score += 30
        reasons.append("Large amount detected")
    elif fraud_status == "suspicious":
        score += 20
        reasons.append("Suspicious receiver or pattern")
    elif fraud_status == "review":
        score += 10
        reasons.append("Medium risk amount")

    # ML score (max 40)
    ml_score = (ml_probability / 100) * 40
    score += ml_score
    if ml_probability > 70:
        reasons.append(f"ML model flagged {ml_probability}% fraud probability")
    elif ml_probability > 30:
        reasons.append(f"ML model detected {ml_probability}% risk")

    # Additional pattern checks (max 30)
    # Round number check
    if amount % 10000 == 0 and amount >= 10000:
        score += 10
        reasons.append("Suspicious round number amount")

    # Known suspicious receivers
    suspicious_names = ["Unknown", "Anonymous", "Test", "Fake"]
    if receiver in suspicious_names:
        score += 10
        reasons.append("Receiver is suspicious entity")

    # Large amount bonus
    if amount > 100000:
        score += 10
        reasons.append("Extremely large transaction")

    # Cap at 100
    score = min(round(score), 100)

    # Risk level
    if score >= 81:
        risk_level = "CRITICAL"
    elif score >= 61:
        risk_level = "HIGH"
    elif score >= 31:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "risk_score": score,
        "risk_level": risk_level,
        "reasons": reasons
    }