import hashlib
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from werkzeug.security import generate_password_hash, check_password_hash

# ── Config ───────────────────────────────────────────
SECRET_KEY  = "sepsis-ai-secret-key-2024-secure"
ALGORITHM   = "HS256"
EXPIRE_MINS = 60 * 8  # 8 hours

# ── Password utils ───────────────────────────────────
def hash_password(password: str) -> str:
    return generate_password_hash(password, method='pbkdf2:sha256')

def verify_password(plain: str, hashed: str) -> bool:
    return check_password_hash(hashed, plain)

# ── Users DB ─────────────────────────────────────────
USERS_DB = {
    "doctor1": {
        "username" : "doctor1",
        "password" : hash_password("doctor123"),
        "role"     : "doctor",
        "name"     : "Dr. Smith"
    },
    "nurse1": {
        "username" : "nurse1",
        "password" : hash_password("nurse123"),
        "role"     : "nurse",
        "name"     : "Nurse Jane"
    },
    "admin1": {
        "username" : "admin1",
        "password" : hash_password("admin123"),
        "role"     : "admin",
        "name"     : "Admin User"
    }
}

def authenticate_user(username: str, password: str):
    user = USERS_DB.get(username)
    if not user:
        return None
    if not verify_password(password, user["password"]):
        return None
    return user

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=EXPIRE_MINS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None