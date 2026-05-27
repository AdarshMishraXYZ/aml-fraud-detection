# 🔍 AML Fraud Detection System
A production-grade Anti-Money Laundering (AML) transaction monitoring system built with modern technologies.
## 🚀 Features
### Fraud Detection
- Rule-based detection (large amounts, suspicious receivers, round numbers)
- Machine Learning (Random Forest with 100% accuracy on test data)
- SHAP Explainability (why was transaction flagged?)
- Isolation Forest (unsupervised anomaly detection)
- Combined Risk Scoring (0-100 score with reasons)
### Graph-Based Detection (Neo4j)
- Circular fraud ring detection
- Mule account detection
- Smurfing detection
- Layering/chain detection
- Full fraud network visualization
### Real-Time System
- WebSocket live alerts
- Transaction simulator
- Auto-generated alerts on fraud detection
### Dashboard
- Multi-page React application
- Transaction detail investigation page
- Fraud analysis report page
- Charts and visualizations
- Search, filter, pagination
- CSV export
## 🛠️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI |
| Database | PostgreSQL, Neo4j |
| ML | scikit-learn, RandomForest, IsolationForest, SHAP |
| Frontend | React, Recharts |
| Real-time | WebSockets |
| Other | SQLAlchemy, Pydantic, Git |
## 📁 Project Structure
ml-fraud-detection/
├── backend/
│   ├── api/routes/          # API endpoints
│   ├── ml/                  # ML models
│   ├── models/              # Database models
│   ├── services/            # Business logic
│   ├── websocket/           # Live alerts
│   ├── database.py          # PostgreSQL connection
│   ├── database_neo4j.py    # Neo4j connection
│   └── main.py              # Entry point
└── frontend/
└── src/
├── pages/           # React pages
├── Navbar.js        # Navigation
└── App.js           # Router
## 🔧 Setup
### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL 16
- Neo4j Desktop
### Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
### Frontend
```bash
cd frontend
npm install
npm start
```
## 📊 API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/transactions | List all transactions |
| POST | /api/transactions | Create transaction with fraud check |
| GET | /api/transactions/{id}/detail | Full investigation view |
| GET | /api/alerts | List all alerts |
| POST | /api/ml/explain | SHAP explanation |
| POST | /api/ml/anomaly | Anomaly detection |
| GET | /api/graph/circular | Circular fraud rings |
| GET | /api/graph/mules | Mule accounts |
| GET | /api/graph/full-report | Complete fraud report |
| POST | /api/simulator/run | Run transaction simulation |
## 🎯 Fraud Patterns Detected
1. **Large Amount** → Single transaction > 50,000
2. **Suspicious Receiver** → Unknown/Anonymous entities
3. **Round Numbers** → Exact round amounts
4. **Circular Rings** → A→B→C→A money laundering
5. **Mule Accounts** → Many senders → one receiver
6. **Smurfing** → Many small transactions to avoid detection
7. **Layering** → Long transaction chains
## 👨‍💻 Author
Adarsh Mishra