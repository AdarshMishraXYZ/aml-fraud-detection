def check_fraud(transaction: dict) -> str:
    amount = transaction["amount"]
    sender = transaction["sender"]
    receiver = transaction["receiver"]

    # Rule 1 - Very large amount
    if amount > 50000:
        return "flagged"

    # Rule 2 - Suspicious receiver name
    suspicious_names = ["Unknown", "Anonymous", "Test", "Fake"]
    if receiver in suspicious_names:
        return "suspicious"

    # Rule 3 - Same sender and receiver
    if sender == receiver:
        return "rejected"

    # Rule 4 - Medium large amount
    if amount > 20000:
        return "review"

    # Rule 5 - Round numbers are suspicious
    if amount % 10000 == 0 and amount >= 10000:
        return "suspicious"

    return "clean"