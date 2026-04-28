import shap
import joblib
import pandas as pd
import numpy as np

# ── Clinical rules ────────────────────────────────────
NORMAL_RANGES = {
    'HR'         : (60,  100,  'bpm',    'Heart Rate'),
    'O2Sat'      : (95,  100,  '%',      'Oxygen Saturation'),
    'SBP'        : (90,  140,  'mmHg',   'Systolic BP'),
    'DBP'        : (60,  90,   'mmHg',   'Diastolic BP'),
    'MAP'        : (70,  100,  'mmHg',   'Mean Art. Pressure'),
    'Resp'       : (12,  20,   '/min',   'Respiratory Rate'),
    'WBC'        : (4,   11,   'K/µL',   'White Blood Cells'),
    'Glucose'    : (70,  140,  'mg/dL',  'Glucose'),
    'Potassium'  : (3.5, 5.0,  'mEq/L',  'Potassium'),
    'ShockIndex' : (0,   0.9,  '',       'Shock Index'),
}

RECOMMENDATIONS = {
    'HR_high'        : "Start continuous cardiac monitoring",
    'SBP_low'        : "Begin IV fluid resuscitation (30mL/kg bolus)",
    'O2Sat_low'      : "Administer supplemental oxygen immediately",
    'Resp_high'      : "Prepare for possible ventilatory support",
    'WBC_high'       : "Draw blood cultures x2, start broad-spectrum antibiotics",
    'ShockIndex_high': "Activate sepsis protocol immediately",
    'Glucose_high'   : "Start insulin therapy per sliding scale",
    'Potassium_high' : "Cardiac monitoring, restrict potassium intake",
    'MAP_low'        : "Consider vasopressors if fluid unresponsive",
}

CONDITIONS = {
    (True,  True,  True)  : ("Septic Shock",          "Critical — immediate ICU escalation"),
    (True,  True,  False) : ("Severe Sepsis",          "Urgent — initiate sepsis bundle"),
    (True,  False, True)  : ("Early Sepsis",           "Monitor closely — start antibiotics"),
    (False, True,  False) : ("Hemodynamic Instability","Check volume status"),
    (False, False, False) : ("Low Risk",               "Continue routine monitoring"),
}


def explain_prediction(patient_data: dict, model_path: str) -> dict:
    """Generate SHAP explanation + clinical flags + recommendations"""

    # ── Abnormal flags ───────────────────────────────
    flags   = []
    actions = []

    for feat, (low, high, unit, label) in NORMAL_RANGES.items():
        val = patient_data.get(feat)
        if val is None:
            continue
        if val < low:
            flags.append({
                "feature" : label,
                "value"   : f"{val} {unit}",
                "status"  : "LOW",
                "normal"  : f"{low}–{high} {unit}",
                "icon"    : "🔻"
            })
            key = f"{feat}_low"
            if key in RECOMMENDATIONS:
                actions.append(RECOMMENDATIONS[key])
        elif val > high:
            flags.append({
                "feature" : label,
                "value"   : f"{val} {unit}",
                "status"  : "HIGH",
                "normal"  : f"{low}–{high} {unit}",
                "icon"    : "🔺"
            })
            key = f"{feat}_high"
            if key in RECOMMENDATIONS:
                actions.append(RECOMMENDATIONS[key])

    # ── Condition detection ──────────────────────────
    high_hr    = patient_data.get('HR', 0) > 100
    low_sbp    = patient_data.get('SBP', 999) < 90
    high_wbc   = patient_data.get('WBC', 0) > 12
    key        = (high_hr, low_sbp, high_wbc)
    condition, advice = CONDITIONS.get(
        key, ("Undetermined", "Clinical correlation required")
    )

    # ── SHAP values ──────────────────────────────────
    shap_values = []
    try:
        model   = joblib.load(model_path)
        scaler  = joblib.load(
            model_path.replace('xgboost_model.pkl', 'scaler.pkl')
        )
        feat_names = [
            'HR','O2Sat','SBP','MAP','DBP','Resp',
            'Age','Gender','ICULOS','HospAdmTime',
            'WBC','Glucose','Potassium',
            'ShockIndex','PulsePressure','LowSpO2','HighResp'
        ]
        vals = [patient_data.get(f, 0) for f in feat_names]
        df   = pd.DataFrame([vals], columns=feat_names)
        df_s = pd.DataFrame(
            scaler.transform(df), columns=feat_names
        )
        explainer   = shap.TreeExplainer(model)
        shap_vals   = explainer.shap_values(df_s)
        shap_values = [
            {"feature": feat_names[i], "impact": float(shap_vals[0][i])}
            for i in np.argsort(np.abs(shap_vals[0]))[::-1][:5]
        ]
    except Exception as e:
        shap_values = []

    return {
        "flags"      : flags,
        "actions"    : list(dict.fromkeys(actions)),  # deduplicate
        "condition"  : condition,
        "advice"     : advice,
        "shap_values": shap_values
    }