from pydantic import BaseModel
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database import Base

class TransactionDB(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String(100))
    receiver = Column(String(100))
    amount = Column(Float)
    status = Column(String(50))
    ml_fraud_probability = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Transaction(BaseModel):
    sender: str
    receiver: str
    amount: float
    status: Optional[str] = "pending"

class TransactionResponse(BaseModel):
    id: int
    sender: str
    receiver: str
    amount: float
    status: str