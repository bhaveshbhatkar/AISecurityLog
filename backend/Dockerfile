FROM python:3.11-slim


ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1


WORKDIR /app

# Install system deps including Node.js for MCP server
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libffi-dev curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
&& rm -rf /var/lib/apt/lists/*


# Copy requirements
COPY ./backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt


# Copy backend code
COPY ./backend/app ./app


# Copy shared module
COPY ./shared ./shared


CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]