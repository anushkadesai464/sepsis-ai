import joblib
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import json

# ── XGBoost prediction ──────────────────────────────────────────
def predict_sepsis_risk(scaled_df, model_path: str) -> float:
    """Returns sepsis probability from structured data (0-1)"""
    model = joblib.load(model_path)
    prob  = model.predict_proba(scaled_df)[0][1]
    return float(prob)


# ── CNN model builder ────────────────────────────────────────────
def build_cnn():
    model = models.densenet121(weights=None)
    num_features = model.classifier.in_features
    model.classifier = nn.Sequential(
        nn.Linear(num_features, 256),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(256, 1),
        nn.Sigmoid()
    )
    return model


# ── X-ray prediction ─────────────────────────────────────────────
def predict_xray_risk(image_path: str, weights_path: str) -> float:
    """Returns infection probability from X-ray image (0-1)"""
    device = torch.device('cpu')

    # Load model
    model = build_cnn()
    model.load_state_dict(
        torch.load(weights_path, map_location=device)
    )
    model.eval()

    # Preprocess image
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.Grayscale(num_output_channels=3),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    img    = Image.open(image_path).convert('RGB')
    tensor = transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        prob = model(tensor).item()

    return float(prob)