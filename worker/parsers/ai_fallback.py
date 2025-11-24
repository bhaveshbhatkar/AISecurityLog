from shared.schemas import ParsedEvent
from worker.llm import parse_line_with_llm
import logging


logger = logging.getLogger("worker.ai_parse")


async def ai_parse_line(line: str) -> ParsedEvent:
    # schema the LLM should return
    schema = {
        "timestamp": "iso8601",
        "src_ip": "ip",
        "dest_ip": "ip",
        "user_agent": "string",
        "username": "string",
        "url": "string",
        "method": "string",
        "status": "int",
        "bytes": "int"
    }
    parsed = parse_line_with_llm(line, schema)
    if not parsed:
        # Return minimum structure
        return ParsedEvent(raw_line=line)
    # Validate/normalize fields as needed
    return ParsedEvent(
        timestamp=parsed.get("timestamp"),
        src_ip=parsed.get("src_ip"),
        dest_ip=parsed.get("dest_ip"),
        user_agent=parsed.get("user_agent"),
        username=parsed.get("username"),
        url=parsed.get("url"),
        method=parsed.get("method"),
        status=parsed.get("status"),
        bytes=parsed.get("bytes"),
        raw_line=line
    )