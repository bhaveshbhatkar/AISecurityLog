# AI Security Log Analysis Platform

A complete full-stack platform for intelligent security log analysis with AI-powered parsing, anomaly detection, and natural language querying.

## Overview

This platform combines deterministic parsing, machine learning, and large language models to provide comprehensive security log analysis capabilities. Upload logs, detect anomalies, visualize patterns, and query your data using natural language.

---

## Features

### Backend (FastAPI)
- **Authentication**: Secure JWT-based authentication with HTTP-only cookies
- **File Upload API**: Multi-format log file ingestion
- **Event Queries**: Paginated event retrieval with filtering
- **Anomaly Detection**: ML-powered anomaly identification with explanations
- **Natural Language Queries**: Convert plain English to SQL using AI
- **Async Database**: PostgreSQL with SQLAlchemy 2.0 + asyncpg for high performance

### Worker (Celery + Redis)
- **Intelligent Parsing**:
  - Deterministic parsing for standard log formats (Apache, Nginx, etc.)
  - AI fallback parsing using Ollama (qwen2.5:3b) for non-standard formats
- **Hybrid Anomaly Detection**:
  - Rule-based detection for known patterns
  - IsolationForest ML model per uploaded file
  - LLM-generated human-readable explanations
- **Advanced Feature Engineering**:
  - Sliding-window per-IP request counts
  - URL entropy calculation
  - Domain extraction & heuristics
  - User behavior deviation modeling

### Frontend (Next.js 14 with App Router)
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Authentication**: Login and registration pages with protected routes
- **Dashboard**: Real-time security monitoring overview
- **File Upload**: Drag-and-drop log file uploader
- **Data Visualization**:
  - D3.js charts for entropy, request bursts, and timelines
  - Interactive event and anomaly tables
- **Natural Language Queries**: Ask questions about your logs in plain English
- **Responsive Design**: Works seamlessly on desktop and mobile

### AI Infrastructure (Ollama)
- **Local LLM**: Self-hosted qwen2.5:3b model via Ollama
- **Auto-Installation**: Model automatically downloads on first startup
- **Persistent Storage**: Models cached for fast subsequent startups
- **Privacy-First**: All AI processing happens locally, no external API calls required

---

##  Getting Started

### Prerequisites
- Docker & Docker Compose
- At least 5GB free disk space (for Ollama model)
- 8GB+ RAM recommended

### 1. Clone Repository
```bash
git clone <repo-url>
cd AISecurityLog
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
# Database
DATABASE_URL=postgresql+asyncpg://app:secret@postgres:5432/logs

# Redis
REDIS_URL=redis://redis:6379/0

# Security
SECRET_KEY=your-secret-key-here

```

### 3. Start All Services
```bash
docker-compose up -d --build
```

**⏱️ First Startup**: Takes ~10-15 minutes
- Building containers: ~5 minutes
- Downloading qwen2.5:3b model: ~5-10 minutes (2GB download)
- Subsequent startups: ~30 seconds (model is cached)

### 4. Monitor Startup Progress
```bash
# Watch all services
docker-compose logs -f

# Check Ollama model download
docker-compose logs -f ollama-pull

# Verify model is ready
docker exec ollama ollama list
```

### 5. Access the Applications

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main web interface |
| **Backend API** | http://localhost:8000/docs | Interactive API documentation |
| **Ollama** | http://localhost:11434 | LLM API endpoint |

---

##  Usage

### 1. Register & Login
1. Navigate to http://localhost:3000
2. Click "Register here" to create an account
3. Login with your credentials

### 2. Upload Logs
1. Go to the **Uploads** page
2. Drag and drop your log file or click to browse
3. Supported formats: `.log`, `.txt`, Apache/Nginx access logs, custom formats

### 3. View Events
- Navigate to **Events** to see parsed log entries
- Filter by timestamp, IP address, or other fields
- Paginated table with search capabilities

### 4. Analyze Anomalies
- Go to **Anomalies** to view detected issues
- Each anomaly includes:
  - ML confidence score
  - Affected event details
  - AI-generated explanation
  - Recommended actions

### 5. Natural Language Queries
- Visit the **Query** page
- Ask questions like:
  - "Show me all failed login attempts"
  - "What are the top 5 IP addresses by request count?"
  - "Find suspicious activity in the last hour"
- AI converts your question to SQL and returns results

---

## AI Usage

The platform uses AI in three key areas:

### 1. **Fallback Log Parsing**
When deterministic parsers fail to recognize a log format, the system uses Ollama to intelligently extract structured data from unstructured logs.

### 2. **Natural Language → SQL**
Convert plain English questions into SQL queries using the qwen2.5:3b model, making data analysis accessible to non-technical users.

### 3. **Anomaly Explanations**
Generate human-friendly explanations for detected anomalies, helping security teams quickly understand and respond to threats.

---

## Development

### Project Structure
```
AISecurityLog/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── core/     # Configuration
│   │   ├── db/       # Database models
│   │   └── schemas/  # Pydantic schemas
│   └── Dockerfile
├── worker/           # Celery worker
│   ├── tasks.py      # Background tasks
│   ├── parser.py     # Log parsing logic
│   ├── llm.py        # AI integration
│   └── Dockerfile
├── frontend/         # Next.js application
│   ├── app/          # App Router pages
│   ├── components/   # React components
│   ├── contexts/     # React contexts
│   └── lib/          # Utilities
├── shared/           # Shared code
└── docker-compose.yml
```

### Running Individual Services

**Backend only:**
```bash
docker-compose up backend postgres redis
```

**Worker only:**
```bash
docker-compose up worker redis postgres ollama
```

**Frontend (development mode):**
```bash
cd frontend
npm install
npm run dev
```

### Useful Commands

```bash
# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Rebuild after code changes
docker-compose up -d --build [service-name]

# Stop all services
docker-compose down

# Remove all data (including models)
docker-compose down -v
```

---

##  Configuration

### Ollama Model Configuration

**Using a different model:**
Edit `docker-compose.yml`:
```yaml
ollama-pull:
  command: >
    -c "ollama pull llama2:7b && ollama list"
```

Update `.env`:
```env
OLLAMA_MODEL=llama2:7b
```

**Pulling multiple models:**
```yaml
ollama-pull:
  command: >
    -c "
    ollama pull qwen2.5:3b &&
    ollama pull mistral:latest &&
    ollama list
    "
```

### Database Configuration

PostgreSQL settings in `docker-compose.yml`:
```yaml
postgres:
  environment:
    POSTGRES_USER: app
    POSTGRES_PASSWORD: secret
    POSTGRES_DB: logs
```

---

##  Troubleshooting

### Model Not Downloading
```bash
# Check logs
docker-compose logs ollama-pull

# Manually pull
docker exec ollama ollama pull qwen2.5:3b
```

### Backend Connection Issues
```bash
# Check if all services are running
docker-compose ps

# Restart backend
docker-compose restart backend
```

### Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

### Database Connection Errors
```bash
# Check PostgreSQL health
docker-compose exec postgres pg_isready -U app

# View database logs
docker-compose logs postgres
```

---

##  Performance Notes

- **First startup**: 10-15 minutes (model download)
- **Subsequent startups**: ~30 seconds
- **Log parsing**: ~1000 lines/second (deterministic), ~100 lines/second (AI)
- **Anomaly detection**: Real-time with ML, ~5 seconds for LLM explanations
- **Disk usage**: ~5GB (includes model, database, logs)

---

##  Security Considerations

- Change default passwords in production
- Use strong `SECRET_KEY` in `.env`
- Enable HTTPS for production deployments
- Regularly update Docker images
- Review and audit AI-generated SQL queries
- Implement rate limiting for API endpoints

---
