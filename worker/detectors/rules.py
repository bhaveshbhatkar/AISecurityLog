# Simple rule-based detectors. Add as many as needed.
def rule_high_request_rate(sliding_count: int, threshold: int = 200):
    if sliding_count > threshold:
        score = min(1.0, sliding_count / threshold)
        return True, score, "High request rate from same IP"
    return False, 0.0, None

# Unusual HTTP Method
def rule_unusual_method(method: str):
    common = {"GET", "POST", "PUT", "DELETE", "HEAD"}
    if method not in common:
        return True, 0.9, f"Unusual HTTP method detected: {method}"
    return False, 0.0, None

# Suspicious User-Agent
def rule_suspicious_user_agent(ua: str):
    if ua is None:
        return False, 0, None

    bad_keywords = ["bot", "curl", "python", "nmap", "scanner"]
    if any(k.lower() in ua.lower() for k in bad_keywords):
        return True, 0.9, f"Suspicious user agent: {ua}"
    return False, 0, None

# High Byte Count
def rule_large_transfer(bytes_sent: int):
    if bytes_sent and bytes_sent > 5_000_000:  # > 5MB
        return True, 0.8, f"Large data transfer detected: {bytes_sent} bytes"
    return False, 0, None
