"""
Risk scorer — combines rule-based flags and ML probability into a 0-100 score.
Score bands:
  81-100  CRITICAL
  61-80   HIGH
  31-60   MEDIUM
   0-30   LOW
"""

SUSPICIOUS_RECEIVERS = [
    "Unknown", "Anonymous", "Offshore_Account",
    "Test", "Fake", "Shell_Corp_1", "Shell_Corp_2", "Unknown_Entity"
]

def calculate_risk_score(
    amount: float,
    sender: str,
    receiver: str,
    ml_probability: float,
    fraud_status: str
) -> dict:

    score = 0
    reasons = []

    # ML component (40 pts max)
    ml_score = round((ml_probability / 100) * 40)
    score += ml_score
    if ml_probability >= 70:
        reasons.append(f"ML model: {ml_probability:.0f}% fraud probability (HIGH)")
    elif ml_probability >= 40:
        reasons.append(f"ML model: {ml_probability:.0f}% fraud probability (MEDIUM)")

    # Amount-based scoring (30 pts max)
    if amount > 500000:
        score += 30
        reasons.append("Extremely large transaction (>₹5,00,000)")
    elif amount > 200000:
        score += 22
        reasons.append("Very large transaction (>₹2,00,000)")
    elif amount > 100000:
        score += 15
        reasons.append("Large transaction (>₹1,00,000)")
    elif amount > 50000:
        score += 8
        reasons.append("Medium-large transaction (>₹50,000)")

    # Suspicious receiver (15 pts)
    if receiver in SUSPICIOUS_RECEIVERS:
        score += 15
        reasons.append(f"Receiver '{receiver}' is a flagged entity")

    # Round number structuring (10 pts)
    if amount % 10000 == 0 and amount >= 10000:
        score += 10
        reasons.append("Suspicious round-number structuring")

    # Self transfer (20 pts)
    if sender == receiver:
        score += 20
        reasons.append("Self-transfer detected")

    # Cap at 100
    score = min(round(score), 100)

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
        "reasons": reasons if reasons else ["No significant risk factors detected"]
    }
