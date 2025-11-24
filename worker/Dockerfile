FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY ./worker/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH=/app

# Copy worker code
COPY ./worker ./worker
COPY ./shared ./shared

# Start worker
CMD ["celery", "-A", "shared.celery_app", "worker", "--loglevel=info", "-Q", "parser"]