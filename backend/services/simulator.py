import random
import httpx
import asyncio

SENDERS = [
    "Adarsh", "Sameer", "Rahul", "Priya", "Amit",
    "Sneha", "Vikram", "Pooja", "Raj", "Meera",
    "Shell_Corp_1", "Shell_Corp_2", "Unknown_Entity"
]

RECEIVERS = [
    "Adarsh", "Sameer", "Rahul", "Priya", "Amit",
    "Sneha", "Vikram", "Pooja", "Raj", "Meera",
    "Unknown", "Anonymous", "Offshore_Account",
    "Shell_Corp_1", "Shell_Corp_2"
]

def generate_clean_transaction():
    sender = random.choice(SENDERS[:10])
    receiver = random.choice(SENDERS[:10])
    while sender == receiver:
        receiver = random.choice(SENDERS[:10])
    amount = round(random.uniform(100, 9000), 2)
    return {"sender": sender, "receiver": receiver, "amount": amount}

def generate_fraud_transaction():
    pattern = random.choice(["large", "suspicious_receiver", "round_number", "smurfing"])

    if pattern == "large":
        sender = random.choice(SENDERS)
        receiver = random.choice(RECEIVERS)
        amount = round(random.uniform(50001, 200000), 2)

    elif pattern == "suspicious_receiver":
        sender = random.choice(SENDERS[:10])
        receiver = random.choice(["Unknown", "Anonymous", "Offshore_Account"])
        amount = round(random.uniform(5000, 50000), 2)

    elif pattern == "round_number":
        sender = random.choice(SENDERS)
        receiver = random.choice(RECEIVERS)
        amount = random.choice([10000, 20000, 30000, 50000, 100000])

    else:  # smurfing
        sender = "Smurf_Account"
        receiver = random.choice(RECEIVERS[:10])
        amount = round(random.uniform(3000, 9000), 2)

    return {"sender": sender, "receiver": receiver, "amount": amount}


async def run_simulation(total: int = 50, fraud_ratio: float = 0.3):
    # FIX 1: Normalise fraud_ratio — frontend sends 0.1 (already decimal), but guard anyway
    if fraud_ratio > 1:
        fraud_ratio = fraud_ratio / 100

    results = {
        "total": total,
        "clean": 0,
        "fraud": 0,
        "errors": 0
    }

    # FIX 2: Remove the leading-space bug in the URL and increase timeout for Render cold starts
    BACKEND_URL = "https://aml-fraud-detection-1.onrender.com/api/transactions"

    async with httpx.AsyncClient() as client:
        for i in range(total):
            if random.random() < fraud_ratio:
                transaction = generate_fraud_transaction()
                results["fraud"] += 1
            else:
                transaction = generate_clean_transaction()
                results["clean"] += 1

            try:
                await client.post(
                    BACKEND_URL,
                    json=transaction,
                    timeout=30  # FIX 3: Render free tier has cold-start delays
                )
            except Exception as e:
                results["errors"] += 1
                print(f"[Simulator] Transaction POST error: {e}")

    return results