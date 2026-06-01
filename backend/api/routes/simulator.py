from fastapi import APIRouter
from services.simulator import run_simulation
import asyncio

router = APIRouter()

@router.post("/simulator/run")
async def run_simulator(total: int = 100, fraud_ratio: float = 0.3):
    total = min(total, 1000)
    results = await run_simulation(total=total, fraud_ratio=fraud_ratio)
    return {
        "message": f"Simulation complete! Generated {results['total']} transactions with {results['circular_rings']} circular rings, {results['mule_patterns']} mule patterns, {results['layering_chains']} layering chains.",
        "results": results
    }
