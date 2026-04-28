import json
import os
from datetime import datetime

AUDIT_FILE = os.path.join(
    os.path.dirname(__file__), '..', 'data', 'audit_log.json'
)

def log_prediction(
    doctor_id   : str,
    patient_data: dict,
    ai_score    : float,
    ai_level    : str,
    overridden  : bool = False,
    override_note: str = ""
):
    """Log every prediction with full audit trail"""

    entry = {
        "timestamp"     : datetime.utcnow().isoformat(),
        "doctor_id"     : doctor_id,
        "ai_score"      : ai_score,
        "ai_level"      : ai_level,
        "overridden"    : overridden,
        "override_note" : override_note,
        "vitals_snapshot": {
            "HR"   : patient_data.get("HR"),
            "SBP"  : patient_data.get("SBP"),
            "SpO2" : patient_data.get("O2Sat"),
            "Resp" : patient_data.get("Resp"),
            "WBC"  : patient_data.get("WBC")
        }
    }

    # Load existing logs
    logs = []
    if os.path.exists(AUDIT_FILE):
        with open(AUDIT_FILE, 'r') as f:
            try:
                logs = json.load(f)
            except:
                logs = []

    # Append new entry
    logs.append(entry)

    # Save back
    with open(AUDIT_FILE, 'w') as f:
        json.dump(logs, f, indent=2)

    return entry


def get_audit_logs(limit: int = 50) -> list:
    """Retrieve recent audit logs"""
    if not os.path.exists(AUDIT_FILE):
        return []
    with open(AUDIT_FILE, 'r') as f:
        try:
            logs = json.load(f)
            return logs[-limit:]
        except:
            return []