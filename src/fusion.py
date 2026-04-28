def fuse_scores(
    structured_score: float,
    xray_score: float,
    w_structured: float = 0.6,
    w_xray: float = 0.4
) -> dict:
    """
    Combine structured + image risk scores into final risk.
    Returns risk level, score, and recommended action.
    """
    final_score = (w_structured * structured_score) + (w_xray * xray_score)
    percentage  = round(final_score * 100, 1)

    if percentage >= 60:
        level  = "HIGH"
        color  = "red"
        action = "⚠️ Immediate clinical review recommended. Notify physician now."
    elif percentage >= 35:
        level  = "MEDIUM"
        color  = "orange"
        action = "⚡ Monitor closely. Consider further diagnostic workup."
    else:
        level  = "LOW"
        color  = "green"
        action = "✅ Continue routine monitoring. Re-assess if symptoms change."

    return {
        'score'     : percentage,
        'level'     : level,
        'color'     : color,
        'action'    : action,
        'structured': round(structured_score * 100, 1),
        'xray'      : round(xray_score * 100, 1)
    }