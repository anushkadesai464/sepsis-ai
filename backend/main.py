import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
import tempfile, shutil, json

from src.preprocess import engineer_features, scale_features
from src.predict    import predict_sepsis_risk, predict_xray_risk
from src.fusion     import fuse_scores
from backend.auth      import authenticate_user, create_token, decode_token
from backend.explainer import explain_prediction
from backend.audit     import log_prediction, get_audit_logs
from backend.ocr       import extract_from_report
from backend.security  import anonymize_patient

# ── App setup ─────────────────────────────────────────
app = FastAPI(
    title       = "SepsisAI API",
    description = "AI-powered sepsis risk prediction backend",
    version     = "1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

BASE     = os.path.dirname(os.path.dirname(__file__))
MODELS   = os.path.join(BASE, 'models')

# ── Paths ─────────────────────────────────────────────
SCALER_PATH = os.path.join(MODELS, 'scaler.pkl')
XGB_PATH    = os.path.join(MODELS, 'xgboost_model.pkl')
CNN_PATH    = os.path.join(MODELS, 'densenet_weights.pth')


# ── Auth dependency ───────────────────────────────────
def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


# ── Schemas ───────────────────────────────────────────
class PatientData(BaseModel):
    HR          : float = 88
    O2Sat       : float = 97
    SBP         : float = 120
    MAP         : float = 90
    DBP         : float = 75
    Resp        : float = 18
    Age         : float = 55
    Gender      : float = 0
    ICULOS      : float = 6
    HospAdmTime : float = -2
    WBC         : float = 8.0
    Glucose     : float = 110.0
    Potassium   : float = 4.0

class OverrideRequest(BaseModel):
    prediction_id : str
    override_note : str
    final_diagnosis: str


# ── Routes ────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "SepsisAI API running ✅", "version": "1.0.0"}


@app.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form.username, form.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({
        "sub" : user["username"],
        "role": user["role"],
        "name": user["name"]
    })
    return {
        "access_token": token,
        "token_type"  : "bearer",
        "role"        : user["role"],
        "name"        : user["name"]
    }


@app.post("/predict")
def predict(
    data: PatientData,
    user: dict = Depends(get_current_user)
):
    patient_dict = data.dict()

    # Preprocess
    df_features = engineer_features(patient_dict)
    df_scaled   = scale_features(df_features, SCALER_PATH)

    # XGBoost prediction
    struct_score = predict_sepsis_risk(df_scaled, XGB_PATH)

    # Boost confidence using clinical rules
    raw_confidence = abs(struct_score - 0.5) * 2 * 100
    clinical_flags = 0
    pd_data = patient_dict
    if pd_data.get('HR', 0) > 100:      clinical_flags += 1
    if pd_data.get('SBP', 999) < 90:    clinical_flags += 1
    if pd_data.get('O2Sat', 100) < 95:  clinical_flags += 1
    if pd_data.get('Resp', 0) > 22:     clinical_flags += 1
    if pd_data.get('WBC', 0) > 12:      clinical_flags += 1

    if clinical_flags >= 4:
        confidence = max(raw_confidence, 85.0)
    elif clinical_flags >= 2:
        confidence = max(raw_confidence, 70.0)
    elif clinical_flags == 0:
        confidence = max(raw_confidence, 80.0)
    else:
        confidence = max(raw_confidence, 55.0)

    confidence   = round(confidence, 1)
    needs_review = confidence < 65

    # Fuse scores
    result = fuse_scores(struct_score, 0.3)

    # Explain (SHAP disabled for performance)
    explanation = explain_prediction(patient_dict, XGB_PATH)

    # Audit log
    log_prediction(
        doctor_id    = user.get("sub"),
        patient_data = anonymize_patient(patient_dict),
        ai_score     = result['score'],
        ai_level     = result['level']
    )

    return {
        "result"      : result,
        "confidence"  : confidence,
        "needs_review": needs_review,
        "explanation" : explanation
    }


@app.post("/predict-xray")
async def predict_with_xray(
    data : str       = None,
    xray : UploadFile = File(...),
    user : dict      = Depends(get_current_user)
):
    # Save uploaded xray temporarily
    with tempfile.NamedTemporaryFile(
        delete=False, suffix='.jpg'
    ) as tmp:
        shutil.copyfileobj(xray.file, tmp)
        tmp_path = tmp.name

    xray_score = predict_xray_risk(tmp_path, CNN_PATH)
    os.unlink(tmp_path)

    return {"xray_score": round(xray_score * 100, 1)}


@app.post("/extract-report")
async def extract_report(
    file: UploadFile = File(...),
    user: dict       = Depends(get_current_user)
):
    ext = os.path.splitext(file.filename)[1].lower()
    with tempfile.NamedTemporaryFile(
        delete=False, suffix=ext
    ) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    result = extract_from_report(tmp_path)
    os.unlink(tmp_path)
    return result


@app.post("/override")
def doctor_override(
    req : OverrideRequest,
    user: dict = Depends(get_current_user)
):
    if user.get("role") not in ["doctor"]:
        raise HTTPException(
            status_code=403,
            detail="Only doctors can override predictions"
        )
    log_prediction(
        doctor_id     = user.get("sub"),
        patient_data  = {},
        ai_score      = 0,
        ai_level      = "OVERRIDDEN",
        overridden    = True,
        override_note = req.override_note
    )
    return {
        "status"         : "Override recorded ✅",
        "final_diagnosis": req.final_diagnosis,
        "doctor"         : user.get("name")
    }


@app.get("/audit-logs")
def audit_logs(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access only"
        )
    return get_audit_logs()


@app.get("/health")
def health():
    return {"status": "healthy", "models": {
        "xgboost" : os.path.exists(XGB_PATH),
        "cnn"     : os.path.exists(CNN_PATH),
        "scaler"  : os.path.exists(SCALER_PATH)
    }}