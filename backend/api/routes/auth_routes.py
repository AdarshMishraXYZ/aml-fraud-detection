from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from auth import create_access_token, get_current_user, PLAIN_USERS

router = APIRouter()

@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = PLAIN_USERS.get(form_data.username)
    if not user or user["password"] != form_data.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token({
        "sub": form_data.username,
        "role": user["role"]
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": form_data.username,
        "role": user["role"]
    }

@router.get("/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user