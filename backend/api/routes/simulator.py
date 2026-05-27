from fastapi import APIRouter
from services.simulator import run_simulation
import asyncio

router = APIRouter()

@router.post("/simulator/run")
async def run_simulator(total: int = 50, fraud_ratio: float = 0.3):
    results = await run_simulation(total=total, fraud_ratio=fraud_ratio)
    return {
        "message": "Simulation complete!",
        "results": results
    }