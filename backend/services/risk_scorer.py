"""
Risk scorer — combines rule-based flags and ML probability into a 0–100 score.

Score bands (kept in sync with fraud_model.py thresholds):
  81–100  CRITICAL
  61–80   HIGH
  31–60   MEDIUM
   0–30   LOW
"""

SUSPICIOUS_RECEIVERS = ["Unknown", "Anonymous", "Offshore_Account", "Test", "Fake"]


def calculate_risk_score(
    amount: float,
    sender: str,
    receiver: str,
    ml_probability: float,   # 0–100
    fraud_status: str
) -> dict:

    score = 0
    reasons = []

    # ── 1. Rule-based component (max 35 pts) ──────────────────────────────
    if fraud_status == "flagged":
        score += 35
        reasons.append("Large amount detected (>₹50,000)")
    elif fraud_status == "suspicious":
        score += 25
        reasons.append("Suspicious receiver or round-number pattern")
    elif fraud_status == "review":
        score += 15
        reasons.append("Medium-risk amount (₹20,000–₹50,000)")
    elif fraud_status == "rejected":
        score += 20
        reasons.append("Self-transfer rejected")

    # ── 2. ML component (max 40 pts) ──────────────────────────────────────
    # FIX: Previously used (ml_probability / 100) * 40 which was correct,
    #      but thresholds below were inconsistent with fraud_model.py.
    ml_score = round((ml_probability / 100) * 40)
    score += ml_score
    if ml_probability >= 70:
        reasons.append(f"ML model: {ml_probability:.0f}% fraud probability (HIGH)")
    elif ml_probability >= 35:
        reasons.append(f"ML model: {ml_probability:.0f}% fraud probability (MEDIUM)")

    # ── 3. Pattern bonuses (max 25 pts) ───────────────────────────────────
    # Round-number structuring
    if amount % 10000 == 0 and amount >= 10000:
        score += 10
        reasons.append("Suspicious round-number structuring")

    # Known suspicious receiver
    if receiver in SUSPICIOUS_RECEIVERS:
        score += 10
        reasons.append(f"Receiver '{receiver}' is a flagged entity")

    # Extremely large amount
    if amount > 100000:
        score += 5
        reasons.append("Extremely large transaction (>₹1,00,000)")

    # ── Cap & classify ─────────────────────────────────────────────────────
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