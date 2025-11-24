import re
from datetime import datetime
from shared.schemas import ParsedEvent
import logging
import math
from urllib.parse import urlparse
from collections import Counter

logger = logging.getLogger("worker.deterministic")

LOG_PATTERN = re.compile(
    r'(?P<timestamp>\S+)\s+'
    r'(?P<src_ip>\S+)\s+'
    r'(?P<dest_ip>\S+)\s+'
    r'(?P<method>\S+)\s+'
    r'(?P<url>\S+)\s+'
    r'(?P<user_agent>\S+)\s+'
    r'(?P<username>\S+)\s+'
    r'(?P<status>\d{3})\s+'
    r'(?P<bytes>\d+)'
)


def calculate_entropy(text: str) -> float:
    """Calculate Shannon entropy of a string"""
    if not text:
        return 0.0
    
    counter = Counter(text)
    length = len(text)
    entropy = 0.0
    
    for count in counter.values():
        probability = count / length
        entropy -= probability * math.log2(probability)
    
    return entropy


def parse_line_deterministic(line: str):
    logger.info("Parsing line: %s", line.strip())
    match = LOG_PATTERN.search(line)
    logger.info("Match: %s", match)
    if not match:
        return None

    data = match.groupdict()
    logger.info("Data: %s", data)

    ts_raw = data.get("timestamp")
    timestamp = None
    hour = None
    try:
        # Convert Z to +00:00 for ISO
        if ts_raw.endswith("Z"):
            ts_raw = ts_raw.replace("Z", "+00:00")
        timestamp = datetime.fromisoformat(ts_raw)
        hour = timestamp.hour
    except Exception:
        timestamp = None
        hour = None

    status_raw = data.get("status")
    try:
        status = int(status_raw) if status_raw else None
    except Exception:
        status = None

    try:
        bytes_val = int(data.get("bytes") or 0)
    except:
        bytes_val = 0

    # Extract domain from URL
    url = data.get("url", "")
    domain = None
    try:
        parsed_url = urlparse(url)
        domain = parsed_url.netloc if parsed_url.netloc else None
    except:
        domain = None

    # Calculate computed fields
    url_length = len(url) if url else 0
    user_agent = data.get("user_agent", "")
    ua_length = len(user_agent) if user_agent else 0
    entropy = calculate_entropy(url) if url else 0.0

    return ParsedEvent(
        timestamp=timestamp,
        src_ip=data.get("src_ip"),
        dest_ip=data.get("dest_ip"),
        method=data.get("method"),
        url=url,
        user_agent=user_agent,
        username=data.get("username"),
        status=status,
        bytes=bytes_val,
        raw_line=line,
        # Computed fields
        requests_per_ip=None,  # This would need to be calculated across all events
        entropy=entropy,
        domain=domain,
        url_length=url_length,
        ua_length=ua_length,
        hour=hour,
        bytes_sent=bytes_val,  # Same as bytes field
    )

