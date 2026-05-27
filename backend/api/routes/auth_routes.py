from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
# Added get_password_hash from your auth utilities
from auth import verify_password, create_access_token, get_current_user, USERS_DB, get_password_hash

router = APIRouter()

class NewUserSchema(BaseModel):
    username: str
    password: str
    role: str

@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = USERS_DB.get(form_data.username)
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = create_access_token({
        "sub": user["username"],
        "role": user["role"]
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user["role"]
    }

@router.get("/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.get("/auth/verify")
def verify_token(current_user: dict = Depends(get_current_user)):
    return {"valid": True, "user": current_user}

@router.get("/users")
def get_all_users():
    users_list = []
    for username, details in USERS_DB.items():
        users_list.append({
            "id": details.get("id", len(users_list) + 1),
            "username": username,
            "role": details.get("role"),
            "status": details.get("status", "active")
        })
    return users_list

@router.post("/users")
def add_new_user(user_data: NewUserSchema):
    if user_data.username in USERS_DB:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Hashing the password here so your login function can verify it properly
    hashed_password = get_password_hash(user_data.password)
    
    USERS_DB[user_data.username] = {
        "id": len(USERS_DB) + 1,
        "username": user_data.username,
        "password": hashed_password,
        "role": user_data.role,
        "status": "active"
    }
    
    return {
        "success": True,
        "user": {
            "id": USERS_DB[user_data.username]["id"],
            "username": user_data.username,
            "role": user_data.role,
            "status": "active"
        }
    }