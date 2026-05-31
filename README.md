# 🔍 AML Fraud Detection System
A full-stack Anti-Money Laundering (AML) detection system that uses machine learning to identify fraudulent transactions in real time. Built with a React frontend, FastAPI backend, PostgreSQL database, and an XGBoost ML model trained on AML transaction patterns.

**🌐 Live Demo:** [aml-fraud-detection.vercel.app](https://aml-fraud-detection.vercel.app)

# PROJECT VIDEO 
https://github.com/user-attachments/assets/aa1e240e-117a-4921-b5fe-d9e7ad76d8ef

## ✨ Features

- **🤖 ML-Powered Fraud Detection** — XGBoost model trained on 3,000+ synthetic AML transactions with SMOTE oversampling, achieving high precision/recall on fraud patterns
- **📊 Real-Time Dashboard** — Live transaction monitoring with auto-refresh every 15 seconds and WebSocket support for instant alerts
- **🧪 Transaction Simulator** — Generate realistic clean and fraudulent transactions to stress-test the detection system
- **🔍 Fraud Analysis Report** — Detects circular fraud rings, mule accounts, and layering chains via graph analysis
- **🚨 Smart Alerting** — Automatic alerts for flagged and suspicious transactions with severity levels
- **👥 User Management** — Role-based access control (Admin / Analyst) with persistent user storage
- **📈 Risk Scoring** — Combined ML probability + rule-based scoring giving a 0–100 risk score per transaction
- **🔐 JWT Authentication** — Secure login with token-based auth and role-protected routes

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Recharts, CSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (via SQLAlchemy) |
| ML Model | XGBoost + SMOTE (imbalanced-learn) |
| Graph Analysis | Neo4j Aura (optional) |
| Auth | JWT (python-jose) + bcrypt |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL database (or use the Render hosted one)


## 🔑 Default Login Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `*******` |
| Analyst | `analyst` | `analyst123` |



---

## 🤖 ML Model Details

The fraud detection model is trained entirely from data — no hardcoded if/else rules.

**Features used:**
- `amount` — transaction value
- `is_round_number` — round-number structuring flag (₹10k, ₹20k, ₹50k, ₹1L)
- `is_suspicious_receiver` — receiver matches known flagged entities
- `sender_tx_count` — transaction velocity (smurfing detection)
- `hour_of_day` — off-hours transaction flag

**Training pipeline:**
1. 3,000 synthetic transactions generated across 4 AML patterns: large transfers, suspicious receivers, round-number structuring, and smurfing
2. 80/20 train-test split with stratification
3. SMOTE oversampling to handle class imbalance (20% fraud)
4. XGBoost with `scale_pos_weight=4` for additional fraud class emphasis
5. Evaluated with precision, recall, F1, and ROC-AUC

**To retrain with your own CSV data:**
```bash
cd backend
python ml/train_model.py path/to/your/transactions.csv
```
CSV must have columns: `sender`, `receiver`, `amount`, `is_fraud`

---

## 🏗 Project Structure

```
aml-fraud-detection/
├── backend/
│   ├── api/routes/          # FastAPI route handlers
│   │   ├── transactions.py  # Transaction CRUD + ML scoring
│   │   ├── alerts.py        # Alert management
│   │   ├── simulator.py     # Transaction simulator endpoint
│   │   ├── graph.py         # Fraud ring / mule / layering detection
│   │   ├── ml_score.py      # ML prediction endpoint
│   │   └── auth_routes.py   # Login, register, user management
│   ├── ml/
│   │   ├── train_model.py   # XGBoost training pipeline
│   │   ├── fraud_model.py   # Model loader + predict function
│   │   └── anomaly_detector.py
│   ├── models/              # SQLAlchemy DB models
│   │   ├── transaction.py
│   │   ├── alert.py
│   │   └── user.py
│   ├── services/
│   │   ├── simulator.py     # Transaction generation logic
│   │   └── risk_scorer.py   # Combined ML + rule risk scoring
│   ├── websocket/manager.py # WebSocket connection manager
│   ├── auth.py              # JWT + password hashing
│   ├── database.py          # SQLAlchemy engine + session
│   └── main.py              # FastAPI app + startup
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.js       # Live dashboard with charts
│       │   ├── Transactions.js    # Transaction list + filters
│       │   ├── Alerts.js          # Alert management
│       │   ├── Simulator.js       # Transaction simulator UI
│       │   ├── UserManagement.js  # Admin user management
│       │   └── TransactionDetail.js
│       ├── ReportPage.js          # Fraud analysis report
│       ├── App.js
│       └── Login.js
├── ml/                      # Saved model files (auto-generated)
├── docker-compose.yml
├── Dockerfile
└── render.yaml
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login and get JWT token |
| `GET` | `/api/auth/users` | List all users (admin) |
| `POST` | `/api/auth/register` | Create new user (admin) |
| `PUT` | `/api/auth/users/{id}/status` | Toggle user status (admin) |
| `GET` | `/api/transactions` | Get all transactions |
| `POST` | `/api/transactions` | Create + auto-score transaction |
| `GET` | `/api/alerts` | Get all alerts |
| `POST` | `/api/simulator/run` | Run transaction simulation |
| `GET` | `/api/graph/full-report` | Get fraud analysis report |
| `POST` | `/api/ml/predict` | Get ML fraud prediction |
| `GET` | `/health` | Health check |

Full interactive docs available at: `https://aml-fraud-detection-1.onrender.com/docs`

---

## 🚢 Deployment

### Frontend → Vercel

```bash
cd frontend
vercel --prod
```

Set environment variable in Vercel dashboard — none required (API URL is hardcoded).

### Backend → Render

1. Connect your GitHub repo to Render
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   - `DATABASE_URL` — your PostgreSQL connection string
   - `SECRET_KEY` — a long random string
   - `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` — optional, for graph analysis

> **Note:** On Render free tier the backend sleeps after 15 minutes of inactivity. First request after sleep may take 20–30 seconds while it cold-starts and retrains the ML model.

---

## 🔮 Neo4j Graph Analysis (Optional)

Circular fraud rings, mule account detection, and layering chain analysis require Neo4j. To enable:

1. Create a free instance at [neo4j.com/cloud/aura-free](https://neo4j.com/cloud/aura-free)
2. Add the connection credentials to your Render environment variables
3. Rerun the simulator — graph patterns will populate automatically

Without Neo4j the rest of the system works fully; the Fraud Report page will show a setup guide.

---

## 👤 Author

**Adarsh Mishra**
- GitHub: [@AdarshMishraXYZ](https://github.com/AdarshMishraXYZ)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
