import os
import json
from openai import OpenAI
import logging
from typing import Optional


logger = logging.getLogger("worker.llm")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "ollama")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "qwen2.5:3b")
client = OpenAI(api_key=OPENAI_API_KEY, base_url=os.getenv("OPENAI_BASE_URL", "http://ollama:11434/v1"))


def build_parse_prompt(line: str, schema: dict) -> str:
    """Create a concise prompt for the LLM to parse a single log line.
    schema is a dict of expected fields and types.
    """
    system_prompt = """
        You are a log parsing engine. Your job is to convert messy log lines into structured JSON.
        Do NOT hallucinate. If a field is missing, return null. Only extract fields visible in the log.
        Output JSON ONLY in this exact schema:

        {
        "timestamp": "ISO8601 timestamp or null",
        "src_ip": "string or null",
        "dest_ip": "string or null",
        "method": "string or null",
        "url": "string or null",
        "user_agent": "string or null",
        "username": "string or null",
        "status": "integer or null",
        "bytes": "integer or null"
        }
        """
    user_prompt = f"""
        Parse this log line into the required JSON schema:

        LOG: {line}
        """
    return system_prompt, user_prompt

def parse_line_with_llm(line: str, schema: dict):
    """Synchronous LLM call to parse a line into JSON. Returns dict or None.
    Note: Keep calls rate-limited and validate output strictly.
    """
    if not OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set - skipping LLM parse")
        return None
    system_prompt, user_prompt = build_parse_prompt(line, schema)
    try:
        resp = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}],
            max_tokens=512,
            temperature=0.0
        )
        text = resp.choices[0].message.content.strip()
        # We expect JSON text - try to parse safely
        parsed = json.loads(text)
        return parsed
    except Exception as e:
        logger.exception("LLM parse failed")
        return None


def explain_anomaly_with_llm(event: dict, rules: list, ml_score: float, final_score: float) -> Optional[str]:
    """
    Generate a human-friendly SOC-style explanation for an anomaly using OpenAI LLM.

    Input:
        - event: dict containing key event fields
        - rules: list of rule reasons triggered (if any)
        - ml_score: original ML anomaly score
        - final_score: hybrid score (rule + ML)

    Output:
        - short SOC analyst explanation (string)
        - or None if API not available
    """

    if not OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set - skipping LLM explanation")
        return None

    # Minimal event context (avoid leaking sensitive large logs)
    # Convert timestamp to string to avoid JSON serialization errors
    context = {
        "timestamp": str(event.get("timestamp")) if event.get("timestamp") else None,
        "src_ip": event.get("src_ip"),
        "url": event.get("url"),
        "username": event.get("username"),
        "method": event.get("method"),
        "status": event.get("status"),
        "bytes": event.get("bytes")
    }

    rule_text = "; ".join(rules) if rules else "No explicit rule triggered."

    prompt = f"""
You are a cybersecurity SOC analyst.

A log event has been classified as anomalous by a hybrid detection engine
(rule-based + machine learning). Your job is to generate a short, clear
explanation (~1–3 sentences) describing *why this event is suspicious*, based
on the following details.

EVENT (sanitized):
{json.dumps(context, indent=2)}

ANALYSIS INDICATORS:
- Rule triggers: {rule_text}
- ML anomaly score: {ml_score:.3f}
- Final hybrid score: {final_score:.3f}

REQUIREMENTS:
- Explain in simple human-friendly SOC language.
- Highlight the most meaningful indicators.
- Do NOT output SQL, code, or JSON.
- Keep it concise, factual, and helpful for analysts.
"""

    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a SOC analyst generating anomaly explanations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.2
        )

        explanation = response.choices[0].message.content.strip()
        logger.info(f"Generated LLM explanation: {explanation}")
        return explanation

    except Exception as e:
        logger.exception("LLM explanation generation failed")
        return "Anomaly detected, but explanation could not be generated."