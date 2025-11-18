# Setup Guide - Pilates Class Planner v2.0

Complete instructions for setting up and running the Pilates Class Planner v2.0 development environment.

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Python** 3.11 or higher
- **pip** 23.0+ or Poetry
- **Docker** & **Docker Compose** (optional, for containerized development)
- **Git** for version control

---

## Initial Setup

### 1. Clone and Navigate

```bash
cd /Users/lauraredmond/Documents/Bassline/Projects/MVP2
```

### 2. Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Redis (if running locally)
REDIS_URL=redis://localhost:6379

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET_KEY=your-secret-key-here

# PII Encryption (generate with: openssl rand -hex 32)
PII_ENCRYPTION_KEY=your-32-byte-key-here
```

---

## Option A: Docker Setup (Recommended)

### Start All Services

```bash
docker-compose up -d
```

This starts:
- **Frontend** on http://localhost:5173
- **Backend** on http://localhost:8000
- **Redis** on localhost:6379
- **MCP Playwright** on localhost:3001

### View Logs

```bash
docker-compose logs -f
```

### Stop Services

```bash
docker-compose down
```

---

## Option B: Local Development Setup

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:5173**

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn api.main:app --reload --port 8000
```

Backend API will be available at: **http://localhost:8000**
API docs at: **http://localhost:8000/api/docs**

### Redis Setup (for MCP caching)

**macOS (via Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name pilates-redis redis:7-alpine
```

### MCP Playwright Server

In a separate terminal:
```bash
npx @modelcontextprotocol/server-playwright
```

Server will run on port 3000 (configurable in `config/mcp_config.yaml`)

---

## Database Setup

### Supabase Configuration

1. **Create a Supabase project** at https://supabase.com
2. **Copy credentials** to `.env` file
3. **Run initial migrations:**

```bash
cd database
supabase db push
```

4. **Seed data** (when migration scripts are ready):

```bash
supabase db reset  # Reset and seed
```

### Generate TypeScript Types

```bash
supabase gen types typescript --local > frontend/src/types/supabase.ts
```

---

## Verification

### Check Frontend

Visit http://localhost:5173

You should see the Pilates Class Planner home page with the burgundy/cream design system.

### Check Backend

Visit http://localhost:8000/health

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "service": "pilates-class-planner-api"
}
```

### Check API Docs

Visit http://localhost:8000/api/docs

You should see the auto-generated FastAPI Swagger documentation.

### Check Redis

```bash
redis-cli ping
```

Expected response: `PONG`

---

## Development Workflow

### Frontend Development

```bash
cd frontend

# Run dev server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development

```bash
cd backend

# Run dev server with auto-reload
uvicorn api.main:app --reload

# Run tests
pytest tests/ -v

# Run tests with coverage
pytest tests/ --cov=backend --cov-report=html

# Format code
black .

# Type checking
mypy .

# Linting
flake8 .
```

### Database Migrations

```bash
cd database

# Create new migration
alembic revision --autogenerate -m "description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

---

## Running Tests

### Frontend Tests

```bash
cd frontend
npm test
```

Runs Vitest with jsdom environment.

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

### Full Test Suite

```bash
# From project root
cd backend && pytest tests/ -v && cd ../frontend && npm test
```

---

## Troubleshooting

### Port Already in Use

**Frontend (5173):**
```bash
# Find process using port 5173
lsof -i :5173

# Kill process
kill -9 <PID>
```

**Backend (8000):**
```bash
# Find and kill
lsof -i :8000
kill -9 <PID>
```

### Module Not Found (Frontend)

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Module Not Found (Backend)

```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

### Supabase Connection Issues

1. Verify `.env` has correct credentials
2. Check Supabase project is running (not paused)
3. Verify network connection
4. Check Supabase dashboard for API status

### MCP Playwright Not Starting

```bash
# Clear npm cache
npm cache clean --force

# Reinstall MCP server
npm uninstall -g @modelcontextprotocol/server-playwright
npm install -g @modelcontextprotocol/server-playwright
```

### Redis Connection Refused

```bash
# Check if Redis is running
redis-cli ping

# If not, start Redis
# macOS:
brew services start redis
# Linux:
sudo systemctl start redis
# Docker:
docker start pilates-redis
```

---

## IDE Setup

### VS Code (Recommended)

Install these extensions:

**Frontend:**
- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- Path Intellisense

**Backend:**
- Python
- Pylance
- Python Test Explorer
- autoDocstring

**Settings (`.vscode/settings.json`):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true
  },
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

---

## Common Development Commands

### Quick Start (All Services)

```bash
# Terminal 1: Backend
cd backend && uvicorn api.main:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Redis (if not using Docker)
redis-server

# Terminal 4: MCP Playwright
npx @modelcontextprotocol/server-playwright
```

### Or use Docker Compose:

```bash
docker-compose up
```

---

## Next Steps

After setup is complete:

1. **Explore the codebase** - Read `CLAUDE.md` for architecture overview
2. **Review design system** - Check `docs/DESIGN_SYSTEM.md`
3. **Start Session 2** - Begin Excel data extraction

---

## Production Deployment

### Build Frontend

```bash
cd frontend
npm run build
```

Output: `frontend/dist/`

### Deploy Backend

```bash
# Build Docker image
docker build -t pilates-backend ./backend

# Run container
docker run -p 8000:8000 --env-file .env pilates-backend
```

### Environment Variables for Production

Ensure all production environment variables are set:
- Use separate Supabase project for production
- Use production API keys
- Set `ENVIRONMENT=production`
- Use strong secrets for JWT and PII encryption

---

*This setup guide ensures a consistent development environment across all developers working on the Pilates Class Planner v2.0.*
