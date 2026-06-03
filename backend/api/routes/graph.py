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