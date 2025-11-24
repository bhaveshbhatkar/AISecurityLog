import os
import json
import logging
from datetime import datetime, date
from openai import AsyncOpenAI

logger = logging.getLogger("backend.app.sql_agent")

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    # Handle asyncpg UUID objects
    if hasattr(obj, '__class__') and 'UUID' in obj.__class__.__name__:
        return str(obj)
    raise TypeError(f"Type {type(obj)} not serializable")

# Configure OpenAI client with timeout to prevent hanging
client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY", "ollama"),
    base_url=os.getenv("OPENAI_BASE_URL", "http://ollama:11434/v1"),
    timeout=90.0,  # HTTP timeout in seconds
    max_retries=0  # Don't retry on failure
)
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "qwen2.5:3b")

# ------------------------------------------
# SYSTEM PROMPT: SQL Generation Agent
# ------------------------------------------
SQL_SYSTEM_PROMPT = """
You are an expert SQL generation agent responsible for translating natural-language
questions into safe SQL SELECT queries.

Rules:
1. ALWAYS output pure SQL, nothing else.
2. ONLY use SELECT statements.
3. NEVER use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, or any DDL/DML.
4. NEVER reference unknown tables.
5. SQL must be valid PostgreSQL syntax.
6. If the user asks something impossible or unrelated to data, return a simple SELECT that returns zero rows.

Database Schema:
- events(id, upload_id, timestamp, src_ip, dest_ip, user_agent, username, url, method, status, bytes)
- anomalies(id, event_id, detector, score, reason, created_at)
- uploads(id, filename, size_bytes, status, created_at)
"""

# ------------------------------------------
# SQL GENERATION WRAPPER
# ------------------------------------------
async def generate_sql(prompt: str) -> str:
    """
    Generate SQL from natural language prompt using OpenAI.
    Returns SQL string or raises HTTPException with appropriate error message.
    """
    user_prompt = f"""
Convert the following natural-language question into a safe SQL SELECT query:

"{prompt}"

Output ONLY the SQL query. No explanation.
"""

    logger.info(f"[SQL Generation] User prompt: {prompt}")

    try:
        resp = await client.chat.completions.create(
            model=OPENAI_MODEL,
            temperature=0.1,
            max_tokens=300,
            messages=[
                {"role": "system", "content": SQL_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ]
        )

        sql = resp.choices[0].message.content.strip()

        # Clean accidental code fences:
        if sql.startswith("```"):
            sql = sql.replace("```sql", "").replace("```", "").strip()

        return sql
    
    except Exception as e:
        error_msg = str(e)
        logger.error(f"[SQL Generation] OpenAI API error: {error_msg}")
        
        # Check for quota/billing errors (429)
        if "429" in error_msg or "quota" in error_msg.lower() or "insufficient_quota" in error_msg.lower():
            from fastapi import HTTPException
            raise HTTPException(
                status_code=503,
                detail="OpenAI API quota exceeded. Please check your OpenAI billing settings at https://platform.openai.com/account/billing"
            )
        
        # Check for authentication errors
        if "401" in error_msg or "authentication" in error_msg.lower():
            from fastapi import HTTPException
            raise HTTPException(
                status_code=503,
                detail="OpenAI API authentication failed. Please check your API key configuration."
            )
        
        # Generic error
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail=f"OpenAI API error: {error_msg}"
        )


# ------------------------------------------
# SYSTEM PROMPT: Query Result Summarizer
# ------------------------------------------
SUMMARY_SYSTEM_PROMPT = """
You are a senior cybersecurity analyst who explains SQL query results in a clear,
concise, and friendly way.

Rules:
1. Always summarize in plain English.
2. Highlight anomalies, unusual patterns, or spikes if visible.
3. Avoid technical SQL jargon.
4. Keep the explanation short and actionable.
5. If no meaningful insights exist, state that clearly.
"""

# ------------------------------------------
# Natural-Language Summary of SQL Result
# ------------------------------------------
async def summarize_query_results(original_prompt: str, rows: list[dict]):
    """
    Summarize SQL query results using OpenAI.
    Returns summary string, with graceful fallback on API errors.
    """
    if not rows:
        return "There were no results matching the query."

    # Limit preview to reduce prompt size and prevent timeouts
    preview = rows[:10]  # Only send first 10 rows
    
    # Create a more concise representation
    preview_str = json.dumps(preview, indent=2, default=json_serial)
    
    user_prompt = f"""
User question: "{original_prompt}"

Results: {len(rows)} total rows found.

First {len(preview)} rows:
{preview_str}

Provide a brief summary highlighting key patterns, anomalies, or insights.
"""

    try:
        # Add timeout to prevent hanging
        import asyncio
        logger.info(f"[Summarization] Starting summarization for {len(rows)} rows...")
        logger.debug(f"[Summarization] Prompt size: {len(user_prompt)} characters")
        
        resp = await asyncio.wait_for(
            client.chat.completions.create(
                model=OPENAI_MODEL,
                temperature=0.1,
                max_tokens=300,
                messages=[
                    {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ]
            ),
            timeout=60.0  # 60 second timeout
        )

        summary = resp.choices[0].message.content.strip()
        logger.info(f"[Summarization] Successfully generated summary: {summary[:100]}...")
        return summary
    
    except asyncio.TimeoutError:
        logger.warning("[Summarization] Request timed out after 60 seconds")
        fallback = f"Query returned {len(rows)} results. (Summary generation timed out - Ollama may be slow or unresponsive)"
        logger.info(f"[Summarization] Returning fallback: {fallback}")
        return fallback
    
    except Exception as e:
        error_msg = str(e)
        logger.warning(f"[Summarization] OpenAI API error: {error_msg}")
        
        # Graceful fallback - return basic summary instead of failing
        if "429" in error_msg or "quota" in error_msg.lower():
            return f"Query returned {len(rows)} results. (OpenAI API quota exceeded - unable to generate detailed summary. Please check billing at https://platform.openai.com/account/billing)"
        
        return f"Query returned {len(rows)} results. (Unable to generate AI summary due to API error)"
