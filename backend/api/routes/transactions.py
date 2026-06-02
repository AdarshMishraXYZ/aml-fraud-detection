from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.transaction import Transaction, TransactionDB
from models.alert import AlertDB
from services.fraud_service import check_fraud
from services.risk_scorer import calculate_risk_score
from ml.fraud_model import predict_fraud, explain_prediction
from ml.anomaly_detector import detect_anomaly
from database import get_db
from websocket.manager import manager
from database_neo4j import add_transaction_to_graph, get_fraud_network

router = APIRouter()

@router.get("/transactions")
def get_transactions(db: Session = Depends(get_db)):
    transactions = db.query(TransactionDB).all()
    return transactions

@router.get("/transactions/{transaction_id}/detail")
def get_transaction_detail(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(TransactionDB).filter(TransactionDB.id == transaction_id).first()
    if not transaction:
        return {"error": "Transaction not found"}

    explanation = explain_prediction(
        amount=transaction.amount,
        receiver=transaction.receiver
    )

    anomaly = detect_anomaly(
        amount=transaction.amount,
        receiver=transaction.receiver
    )

    network = get_fraud_network(transaction.sender)

    return {
        "transaction": {
            "id": transaction.id,
            "sender": transaction.sender,
            "receiver": transaction.receiver,
            "amount": transaction.amount,
            "status": transaction.status,
            "ml_fraud_probability": transaction.ml_fraud_probability,
            "created_at": str(transaction.created_at)
        },
        "shap_explanation": explanation,
        "anomaly_detection": anomaly,
        "sender_network": network
    }

@router.get("/transactions/{transaction_id}")
def get_transaction_by_id(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(TransactionDB).filter(TransactionDB.id == transaction_id).first()
    if not transaction:
        return {"error": "Transaction not found"}
    return transaction

@router.post("/transactions")
async def create_transaction(transaction: Transaction, db: Session = Depends(get_db)):
    fraud_status = check_fraud({
        "sender": transaction.sender,
        "receiver": transaction.receiver,
        "amount": transaction.amount
    }, db)

    ml_result = predict_fraud(
        amount=transaction.amount,
        receiver=transaction.receiver
    )

    risk_result = calculate_risk_score(
        amount=transaction.amount,
        sender=transaction.sender,
        receiver=transaction.receiver,
        ml_probability=ml_result["fraud_probability"],
        fraud_status=fraud_status
    )

    new_transaction = TransactionDB(
        sender=transaction.sender,
        receiver=transaction.receiver,
        amount=transaction.amount,
        status=fraud_status,
        ml_fraud_probability=ml_result["fraud_probability"]
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    add_transaction_to_graph(
        sender=transaction.sender,
        receiver=transaction.receiver,
        amount=transaction.amount,
        status=fraud_status
    )

    if fraud_status in ["flagged", "suspicious", "rejected", "review"]:
        new_alert = AlertDB(
            transaction_id=new_transaction.id,
            reason=f"Transaction {fraud_status} - Risk Score: {risk_result['risk_score']}",
            severity="high" if risk_result["risk_score"] >= 61 else "medium",
            status="open"
        )
        db.add(new_alert)
        db.commit()

        await manager.broadcast({
            "type": "alert",
            "message": f"🚨 Risk Score {risk_result['risk_score']}/100 - Transaction {new_transaction.id} is {fraud_status}",
            "severity": "high" if risk_result["risk_score"] >= 61 else "medium",
            "transaction_id": new_transaction.id
        })

    return {
        "message": "Transaction processed",
        "fraud_status": fraud_status,
        "ml_score": ml_result,
        "risk_assessment": risk_result,
        "data": new_transaction
    }
from fastapi.responses import StreamingResponse
import csv
import io

@router.get("/transactions/export/csv")
def export_transactions_csv(db: Session = Depends(get_db)):
    transactions = db.query(TransactionDB).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(['ID', 'Sender', 'Receiver', 'Amount', 'Status', 'ML Risk %', 'Created At'])
    
    for t in transactions:
        writer.writerow([
            t.id, t.sender, t.receiver, 
            t.amount, t.status,
            t.ml_fraud_probability or 'N/A',
            t.created_at
        ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"}
    )