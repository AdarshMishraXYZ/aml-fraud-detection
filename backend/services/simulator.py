import random
import httpx
import asyncio

BACKEND_URL = "https://aml-fraud-detection.onrender.com/api/transactions"

# Realistic name pools
NAMES = ["Adarsh", "Sameer", "Rahul", "Priya", "Amit", "Sneha", "Vikram", "Pooja", "Raj", "Meera",
         "Karan", "Neha", "Arjun", "Divya", "Rohit", "Sunita", "Manoj", "Kavita", "Suresh", "Anita",
         "Shell_Corp_1", "Shell_Corp_2", "Unknown_Entity", "Offshore_Account", "Anonymous"]

def generate_clean():
    names = NAMES[:20]
    s = random.choice(names)
    r = random.choice([n for n in names if n != s])
    return {"sender": s, "receiver": r, "amount": round(random.uniform(100, 9000), 2)}

def generate_circular_ring():
    """3 people sending money in a circle"""
    people = random.sample(NAMES[:20], 3)
    amount = round(random.uniform(50000, 500000), 2)
    return [
        {"sender": people[0], "receiver": people[1], "amount": amount},
        {"sender": people[1], "receiver": people[2], "amount": round(amount * random.uniform(0.9, 1.1), 2)},
        {"sender": people[2], "receiver": people[0], "amount": round(amount * random.uniform(0.9, 1.1), 2)},
    ]

def generate_mule_deposits():
    """4-6 different senders sending to one mule account"""
    mule = random.choice(["Mule_" + n for n in ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"]])
    senders = random.sample(NAMES[:20], random.randint(4, 6))
    return [
        {"sender": s, "receiver": mule, "amount": round(random.uniform(20000, 100000), 2)}
        for s in senders
    ]

def generate_layering_chain():
    """Money moving through 4 hops to hide origin"""
    people = random.sample(NAMES[:20], 5)
    amount = round(random.uniform(100000, 500000), 2)
    return [
        {"sender": people[0], "receiver": people[1], "amount": amount},
        {"sender": people[1], "receiver": people[2], "amount": round(amount * 0.95, 2)},
        {"sender": people[2], "receiver": people[3], "amount": round(amount * 0.90, 2)},
        {"sender": people[3], "receiver": people[4], "amount": round(amount * 0.85, 2)},
    ]

def generate_fraud():
    pattern = random.choice(["large", "suspicious_receiver", "round_number"])
    if pattern == "large":
        return {"sender": random.choice(NAMES), "receiver": random.choice(NAMES[-5:]), "amount": round(random.uniform(50001, 200000), 2)}
    elif pattern == "suspicious_receiver":
        return {"sender": random.choice(NAMES[:15]), "receiver": random.choice(["Unknown", "Anonymous", "Offshore_Account"]), "amount": round(random.uniform(5000, 50000), 2)}
    else:
        return {"sender": random.choice(NAMES), "receiver": random.choice(NAMES), "amount": random.choice([10000, 25000, 50000, 100000, 200000])}

async def post_transaction(client, tx):
    try:
        await client.post(BACKEND_URL, json=tx, timeout=30)
        return True
    except Exception as e:
        print(f"[Simulator] Error: {e}")
        return False

async def run_simulation(total: int = 100, fraud_ratio: float = 0.3):
    if fraud_ratio > 1:
        fraud_ratio = fraud_ratio / 100

    total = min(total, 1000)  # max 1000

    results = {"total": 0, "clean": 0, "fraud": 0, "circular_rings": 0, "mule_patterns": 0, "layering_chains": 0, "errors": 0}

    all_transactions = []

    # Generate guaranteed fraud patterns (20% of total)
    pattern_budget = max(1, int(total * 0.20))
    rings_count = max(1, pattern_budget // 9)
    mules_count = max(1, pattern_budget // 9)
    layers_count = max(1, pattern_budget // 9)

    # Add circular rings
    for _ in range(rings_count):
        txs = generate_circular_ring()
        all_transactions.extend(txs)
        results["circular_rings"] += 1

    # Add mule deposits
    for _ in range(mules_count):
        txs = generate_mule_deposits()
        all_transactions.extend(txs)
        results["mule_patterns"] += 1

    # Add layering chains
    for _ in range(layers_count):
        txs = generate_layering_chain()
        all_transactions.extend(txs)
        results["layering_chains"] += 1

    # Fill remaining with clean + random fraud
    remaining = total - len(all_transactions)
    for _ in range(max(0, remaining)):
        if random.random() < fraud_ratio:
            all_transactions.append(generate_fraud())
            results["fraud"] += 1
        else:
            all_transactions.append(generate_clean())
            results["clean"] += 1

    # Shuffle so patterns aren't obvious
    random.shuffle(all_transactions)
    results["total"] = len(all_transactions)

    # Send all transactions
    async with httpx.AsyncClient() as client:
        for tx in all_transactions:
            ok = await post_transaction(client, tx)
            if not ok:
                results["errors"] += 1

    return results
