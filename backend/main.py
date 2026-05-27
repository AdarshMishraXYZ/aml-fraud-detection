from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from api.routes import transactions
from api.routes import alerts
from api.routes import ml_score
from api.routes import graph
from websocket.manager import manager
from api.routes import simulator
from api.routes import auth_routes
from fastapi import Request
from fastapi.responses import JSONResponse
from database import engine, Base
from models.transaction import TransactionDB
from models.alert import AlertDB

app = FastAPI()

@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )



app.add_middleware(
    CORSMiddleware,
   allow_origins=[
    "http://localhost:3000",
    "https://aml-fraud-detection.vercel.app"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(ml_score.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(simulator.router, prefix="/api")
app.include_router(auth_routes.router, prefix="/api")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
def home():
    return {"message": "AML Fraud Detection API is running!"}

@app.get("/health")
def health():
    return {"status": "ok"}