from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base
from pydantic import BaseModel

class AlertDB(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer)
    reason = Column(String(200))
    severity = Column(String(50))
    status = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())

class Alert(BaseModel):
    transaction_id: int
    reason: str
    severity: str
    status: str