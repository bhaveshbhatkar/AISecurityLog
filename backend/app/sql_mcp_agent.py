import os
import json
import logging
from typing import Optional
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from openai import AsyncOpenAI

logger = logging.getLogger("backend.app.sql_mcp_agent")

# MCP Server Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://app:secret@localhost:5432/logs")

# OpenAI Client (supports OpenAI API or local models via Ollama)
openai_client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY", "ollama"),
    base_url=os.getenv("OPENAI_BASE_URL", "http://localhost:11434/v1")
)
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "qwen2.5:3b")

# ------------------------------------------
# MCP Client Session Management
# ------------------------------------------
_mcp_session: Optional[ClientSession] = None
_mcp_context = None

async def get_mcp_session() -> ClientSession:
    """Get or create MCP client session connected to PostgreSQL server."""
    global _mcp_session, _mcp_context
    
    if _mcp_session is None:
        server_params = StdioServerParameters(
            command="npx",
            args=[
                # "-y",
                # "@modelcontextprotocol/server-postgres",
                # DATABASE_URL
                "@henkey/postgres-mcp-server",
                "--connection-string", "postgresql://app:secret@localhost:5432/logs"
            ],
            # env={**os.environ}
        )
        
        # Store the context manager and enter it
        _mcp_context = stdio_client(server_params)
        read, write = await _mcp_context.__aenter__()
        _mcp_session = ClientSession(read, write)
        await _mcp_session.initialize()
        
        logger.info("[MCP] Connected to PostgreSQL MCP server")
    
    return _mcp_session

async def close_mcp_session():
    """Close the MCP client session."""
    global _mcp_session, _mcp_context
    if _mcp_session:
        await _mcp_session.__aexit__(None, None, None)
        _mcp_session = None
    if _mcp_context:
        await _mcp_context.__aexit__(None, None, None)
        _mcp_context = None
        logger.info("[MCP] Closed PostgreSQL MCP server connection")

# ------------------------------------------
# PROCESS NATURAL LANGUAGE QUERY
# ------------------------------------------
async def process_natural_language_query(user_prompt: str) -> str:
    """
    Process a natural language query using OpenAI/Local Model with MCP PostgreSQL server.
    
    The model will:
    1. Understand the user's question
    2. Use function calling to query the database via MCP
    3. Return a natural language response
    
    Args:
        user_prompt: User's natural language question
        
    Returns:
        Natural language response
    """
    logger.info(f"[Agent] Processing query: {user_prompt}")
    
    try:
        session = await get_mcp_session()
        
        # Get available tools from MCP server
        tools_result = await session.list_tools()
        
        # Convert MCP tools to OpenAI function calling format
        openai_tools = []
        for tool in tools_result.tools:
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.inputSchema
                }
            })
        
        # System prompt
        system_prompt = """You are a helpful cybersecurity analyst assistant with access to a PostgreSQL database.

The database contains the following tables:
- events(id, upload_id, timestamp, src_ip, dest_ip, user_agent, username, url, method, status, bytes)
- anomalies(id, event_id, detector, score, reason, created_at)
- uploads(id, filename, size_bytes, status, created_at)

When users ask questions about their data:
1. Use the 'query' function to execute SQL queries
2. Analyze the results
3. Provide clear, natural language responses
4. Highlight important patterns, anomalies, or insights

IMPORTANT: Only use SELECT statements. Never use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, or TRUNCATE."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        # Agentic loop: Let the model use tools as needed
        max_iterations = 5
        iteration = 0
        
        while iteration < max_iterations:
            iteration += 1
            logger.info(f"[Agent] Iteration {iteration}/{max_iterations}")
            
            response = await openai_client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                tools=openai_tools,
                tool_choice="auto",
                temperature=0.1
            )
            
            message = response.choices[0].message
            
            # Add assistant's response to conversation
            messages.append({
                "role": "assistant",
                "content": message.content,
                "tool_calls": message.tool_calls
            })
            
            # Check if model wants to use tools
            if not message.tool_calls:
                # No more tools to use, return final response
                final_response = message.content or "I couldn't find an answer to your question."
                logger.info(f"[Agent] Query completed in {iteration} iterations")
                return final_response
            
            # Execute tool calls via MCP
            for tool_call in message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                
                logger.info(f"[Agent] Model calling function: {function_name} with args: {function_args}")
                
                try:
                    # Call MCP tool
                    mcp_result = await session.call_tool(function_name, arguments=function_args)
                    
                    # Extract result content
                    result_content = ""
                    if mcp_result.content:
                        for content_item in mcp_result.content:
                            if hasattr(content_item, 'text'):
                                result_content = content_item.text
                                break
                    
                    # Add tool result to conversation
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": function_name,
                        "content": result_content
                    })
                    
                    logger.info(f"[Agent] Tool result received (length: {len(result_content)})")
                    
                except Exception as tool_error:
                    error_msg = str(tool_error)
                    logger.error(f"[Agent] Tool execution error: {error_msg}")
                    
                    # Add error to conversation
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": function_name,
                        "content": f"Error executing query: {error_msg}"
                    })
        
        # Max iterations reached
        logger.warning(f"[Agent] Max iterations ({max_iterations}) reached")
        return "I apologize, but I couldn't complete the analysis within the allowed steps. Please try rephrasing your question or breaking it into smaller parts."
    
    except Exception as e:
        error_msg = str(e)
        logger.error(f"[Agent] Error processing query: {error_msg}")
        
        # Check for specific OpenAI errors
        if "401" in error_msg or "authentication" in error_msg.lower():
            from fastapi import HTTPException
            raise HTTPException(
                status_code=503,
                detail="OpenAI API authentication failed. Please check your API key configuration."
            )
        
        if "429" in error_msg or "quota" in error_msg.lower():
            from fastapi import HTTPException
            raise HTTPException(
                status_code=503,
                detail="OpenAI API quota exceeded. Please check your billing settings."
            )
        
        from fastapi import HTTPException
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process query: {error_msg}"
        )

# ------------------------------------------
# GET DATABASE SCHEMA (Helper function)
# ------------------------------------------
async def get_database_schema() -> dict:
    """
    Get database schema information using MCP PostgreSQL server.
    Returns schema details including tables and columns.
    """
    logger.info("[MCP] Fetching database schema")
    
    try:
        session = await get_mcp_session()
        
        # List available resources (tables)
        resources = await session.list_resources()
        
        schema_info = {
            "tables": []
        }
        
        for resource in resources.resources:
            # Read each table's schema
            content = await session.read_resource(resource.uri)
            
            if content.contents:
                for content_item in content.contents:
                    if hasattr(content_item, 'text'):
                        table_info = json.loads(content_item.text)
                        schema_info["tables"].append(table_info)
        
        logger.info(f"[MCP] Retrieved schema for {len(schema_info['tables'])} tables")
        return schema_info
    
    except Exception as e:
        error_msg = str(e)
        logger.error(f"[MCP] Schema fetch error: {error_msg}")
        return {"tables": [], "error": error_msg}