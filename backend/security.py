from cryptography.fernet import Fernet
import os
import base64

KEY_FILE = os.path.join(
    os.path.dirname(__file__), '..', 'data', 'secret.key'
)

def get_or_create_key() -> bytes:
    """Get encryption key or create new one"""
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, 'rb') as f:
            return f.read()
    key = Fernet.generate_key()
    os.makedirs(os.path.dirname(KEY_FILE), exist_ok=True)
    with open(KEY_FILE, 'wb') as f:
        f.write(key)
    return key

def encrypt_data(data: str) -> str:
    """Encrypt sensitive patient data"""
    f = Fernet(get_or_create_key())
    return f.encrypt(data.encode()).decode()

def decrypt_data(token: str) -> str:
    """Decrypt patient data"""
    f = Fernet(get_or_create_key())
    return f.decrypt(token.encode()).decode()

def anonymize_patient(patient_data: dict) -> dict:
    """Remove PII before logging"""
    safe = patient_data.copy()
    for field in ['name', 'dob', 'ssn', 'address', 'phone']:
        safe.pop(field, None)
    return safe