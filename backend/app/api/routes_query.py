from fastapi import APIRouter, Depends, Query, HTTPException
from ..auth import get_current_user
from shared.db import get_db
from shared.schemas import QueryRequest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import logging
import sqlparse
from ..sql_agent import generate_sql, summarize_query_results

router = APIRouter()
logger = logging.getLogger("backend.query")

ALLOWED_TABLES = {"events", "anomalies", "uploads", "users"}

def validate_sql(sql: str):
    parsed = sqlparse.parse(sql)
    if not parsed:
        raise HTTPException(status_code=400, detail="Invalid SQL")

    stmt = parsed[0]

    if stmt.get_type() != "SELECT":
        raise HTTPException(status_code=400, detail="Only SELECT allowed")

    # Basic table validation
    sql_lower = sql.lower()
    for table in ALLOWED_TABLES:
        if table in sql_lower:
            return  # At least one allowed table found
    
    raise HTTPException(status_code=400, detail="Query must reference allowed tables")


@router.post("")
async def natural_language_query(
    req: QueryRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    prompt = req.prompt.strip()

    logger.info(f"[QueryUser={user.username}] NL Query: {prompt}")

    # ---- Generate SQL via SQL Agent ----
    generated_sql = await generate_sql(prompt)
    logger.info(f"Generated SQL: {generated_sql}")

    # ---- Validate SQL ----
    validate_sql(generated_sql)

    # ---- Execute SQL ----
    try:
        result = await db.execute(text(generated_sql))
        rows = [dict(r._mapping) for r in result.fetchall()]
        logger.info(f"Query returned {len(rows)} rows")
    except Exception as e:
        logger.exception("SQL execution failed")
        raise HTTPException(status_code=500, detail=f"SQL execution failed: {str(e)}")

    # ---- Natural Language Summary ----
    try:
        natural_language_response = await summarize_query_results(prompt, rows)
        logger.info(f"Natural language response: {natural_language_response[:200]}")
    except Exception:
        logger.exception("LLM summarization failed")
        natural_language_response = f"Query returned {len(rows)} results. (Unable to generate AI summary)"

    response_data = {
        "prompt": prompt,
        "sql": generated_sql,
        "rows": rows,
        "response": natural_language_response
    }
    
    logger.info(f"Returning response with {len(rows)} rows and response field: {bool(natural_language_response)}")
    return response_data