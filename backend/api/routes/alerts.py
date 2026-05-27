from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.alert import AlertDB, Alert
from database import get_db

router = APIRouter()

alerts_db = []

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(AlertDB).all()
    return alerts

@router.post("/alerts")
def create_alert(alert: Alert, db: Session = Depends(get_db)):
    new_alert = AlertDB(
        transaction_id=alert.transaction_id,
        reason=alert.reason,
        severity=alert.severity,
        status=alert.status
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return {"message": "Alert created", "data": new_alert}