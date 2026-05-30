from fastapi import APIRouter
from database_neo4j import get_fraud_network, detect_circular_transactions, detect_mule_accounts, detect_smurfing, detect_layering

router = APIRouter()

@router.get("/graph/network/{name}")
def get_network(name: str):
    network = get_fraud_network(name)
    return {"person": name, "transactions": network}

@router.get("/graph/circular")
def get_circular():
    circles = detect_circular_transactions()
    return {"circular_transactions": circles}

@router.get("/graph/mules")
def get_mules():
    mules = detect_mule_accounts()
    return {"mule_accounts": mules}

@router.get("/graph/smurfing/{sender}")
def get_smurfing(sender: str):
    result = detect_smurfing(sender)
    return {"smurfing_detected": result}

@router.get("/graph/layering")
def get_layering():
    result = detect_layering()
    return {"layering_detected": result}

@router.get("/graph/full-report")
def get_full_report():
    neo4j_ok = False
    try:
        circular = detect_circular_transactions()
        mules = detect_mule_accounts()
        layering = detect_layering()
        neo4j_ok = True
    except Exception:
        circular, mules, layering = [], [], []
    return {
        "neo4j_connected": neo4j_ok,
        "summary": {
            "circular_rings": len(circular),
            "mule_accounts": len(mules),
            "layering_chains": len(layering),
            "total_patterns": len(circular) + len(mules) + len(layering)
        },
        "circular_transactions": circular,
        "mule_accounts": mules,
        "layering_detected": layering
    }
