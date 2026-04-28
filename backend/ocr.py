import pdfplumber
import pytesseract
import re
import os
from PIL import Image

# Set tesseract path for Windows
pytesseract.pytesseract.tesseract_cmd = (
    r'C:\Program Files\Tesseract-OCR\tesseract.exe'
)

# ── Patterns to extract lab values ───────────────────
PATTERNS = {
    'HR'       : r'(?:heart rate|HR|pulse)[^\d]*(\d+)',
    'SBP'      : r'(?:systolic|SBP)[^\d]*(\d+)',
    'DBP'      : r'(?:diastolic|DBP)[^\d]*(\d+)',
    'O2Sat'    : r'(?:SpO2|oxygen sat|O2 sat)[^\d]*(\d+)',
    'Resp'     : r'(?:respiratory rate|RR|resp)[^\d]*(\d+)',
    'WBC'      : r'(?:WBC|white blood)[^\d]*([\d.]+)',
    'Glucose'  : r'(?:glucose|blood sugar)[^\d]*([\d.]+)',
    'Potassium': r'(?:potassium|K\+)[^\d]*([\d.]+)',
    'Temp'     : r'(?:temperature|temp)[^\d]*([\d.]+)',
    'Age'      : r'(?:age)[^\d]*(\d+)',
}


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from digital PDF"""
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text


def extract_text_from_image(file_path: str) -> str:
    """Extract text from scanned image using OCR"""
    img  = Image.open(file_path)
    text = pytesseract.image_to_string(img)
    return text


def parse_values(text: str) -> dict:
    """Parse extracted text for clinical values"""
    extracted = {}
    text_lower = text.lower()

    for field, pattern in PATTERNS.items():
        match = re.search(pattern, text_lower, re.IGNORECASE)
        if match:
            try:
                extracted[field] = float(match.group(1))
            except:
                pass

    return extracted


def extract_from_report(file_path: str) -> dict:
    """Main function — handle PDF or image"""
    ext  = os.path.splitext(file_path)[1].lower()
    text = ""

    if ext == '.pdf':
        text = extract_text_from_pdf(file_path)
        if not text.strip():
            text = extract_text_from_image(file_path)
    elif ext in ['.jpg', '.jpeg', '.png']:
        text = extract_text_from_image(file_path)

    values = parse_values(text)
    return {
        "extracted_values": values,
        "raw_text"        : text[:500],  # first 500 chars preview
        "fields_found"    : len(values),
        "fields_missing"  : [
            f for f in PATTERNS.keys() if f not in values
        ]
    }