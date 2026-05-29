from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from auth import create_access_token, get_current_user, verify_password, get_password_hash
from database import get_db
from sqlalchemy.orm import Session
from models.user import UserDB
from pydantic import BaseModel

router = APIRouter()


class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "analyst"


class StatusUpdate(BaseModel):
    status: str


# ── Login ─────────────────────────────────────────────────────────────────────
@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == form_data.username).first()

    # Fallback: seed default admin if DB is empty
    if not user:
        _seed_default_users(db)
        user = db.query(UserDB).filter(UserDB.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role
    }


# ── Get current user ──────────────────────────────────────────────────────────
@router.get("/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


# ── List all users (admin only) ───────────────────────────────────────────────
@router.get("/auth/users")
def get_users(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    users = db.query(UserDB).all()
    return [{"id": u.id, "username": u.username, "role": u.role, "status": u.status} for u in users]


# ── Register new user (admin only) ───────────────────────────────────────────
@router.post("/auth/register")
def register_user(
    req: RegisterRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    existing = db.query(UserDB).filter(UserDB.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = UserDB(
        username=req.username,
        password_hash=get_password_hash(req.password),
        role=req.role,
        status="active"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": f"User '{req.username}' created", "id": new_user.id}


# ── Toggle user status (admin only) ──────────────────────────────────────────
@router.put("/auth/users/{user_id}/status")
def update_user_status(
    user_id: int,
    req: StatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = req.status
    db.commit()
    return {"message": f"User {user_id} status updated to {req.status}"}


# ── Seed default users if DB is empty ────────────────────────────────────────
def _seed_default_users(db: Session):
    defaults = [
        {"username": "admin",   "password": "admin123",   "role": "admin"},
        {"username": "analyst", "password": "analyst123", "role": "analyst"},
    ]
    for u in defaults:
        exists = db.query(UserDB).filter(UserDB.username == u["username"]).first()
        if not exists:
            db.add(UserDB(
                username=u["username"],
                password_hash=get_password_hash(u["password"]),
                role=u["role"],
                status="active"
            ))
    db.commit()