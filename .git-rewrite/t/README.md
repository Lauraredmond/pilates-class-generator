# Pilates Class Planner v2.0

AI-powered Pilates class planning application with MCP integration, comprehensive domain knowledge, and EU AI Act compliance.

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- Supabase account
- OpenAI API key

### Initial Setup

1. **Clone and setup environment:**
   ```bash
   cd /Users/lauraredmond/Documents/Bassline/Projects/MVP2
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

2. **Start with Docker (recommended):**
   ```bash
   docker-compose up -d
   ```

   Or run services separately:

3. **Backend setup:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn api.main:app --reload
   ```

4. **Frontend setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **MCP Playwright server:**
   ```bash
   npx @modelcontextprotocol/server-playwright
   ```

### Access Points

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/api/docs
- **Health Check:** http://localhost:8000/health

## Project Structure

```
MVP2/
├── backend/           # FastAPI backend with AI agents
├── frontend/          # React frontend (Vite)
├── database/          # Supabase migrations and functions
├── config/            # Configuration files
├── docs/              # Additional documentation
├── CLAUDE.md          # Comprehensive developer guide
├── docker-compose.yml # Docker services
└── .env.example       # Environment template
```

## Key Features

- **AI Agents:** Sequence, music, meditation, and research agents
- **MCP Integration:** Web research using Playwright
- **Domain Knowledge:** 34 classical Pilates movements from Excel database
- **Safety-First:** Strict sequencing rules prevent injury
- **EU AI Act Compliant:** Transparency logging and bias monitoring
- **GDPR Ready:** PII tokenization and data export/deletion

## Development

See [CLAUDE.md](./CLAUDE.md) for comprehensive development documentation including:
- Command reference
- Architecture overview
- Domain knowledge
- Testing strategies
- Troubleshooting

## Testing

```bash
# Backend tests
cd backend && pytest tests/ -v

# Frontend tests
cd frontend && npm test

# Full test suite with coverage
pytest --cov && npm test -- --coverage
```

## Deployment

```bash
# Build production containers
docker-compose -f docker-compose.prod.yml build

# Run production
docker-compose -f docker-compose.prod.yml up -d
```

## Documentation

- **Developer Guide:** [CLAUDE.md](./CLAUDE.md)
- **MCP Integration:** [MCP_Excel_Integration_Plan.md](/Users/lauraredmond/Documents/Bassline/Admin/7.\ Product/Design\ Documentation/MCP_Excel_Integration_Plan.md)
- **Excel Database:** [Pilates_Summary_Spreadsheet_teachingTracker_v10.xlsm](/Users/lauraredmond/Documents/Bassline/Admin/7.\ Product/Design\ Documentation/Pilates_Summary_Spreadsheet_teachingTracker_v10.xlsm)
- **API Docs:** http://localhost:8000/api/docs

## License

Proprietary - Bassline Projects

## Support

For development guidance, see CLAUDE.md or contact the development team.
