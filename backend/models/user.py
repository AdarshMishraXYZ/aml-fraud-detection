from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class UserDB(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    role          = Column(String(50), default="analyst")
    status        = Column(String(50), default="active")
    created_at    = Column(DateTime, server_default=func.now())