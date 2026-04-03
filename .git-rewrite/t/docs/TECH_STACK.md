# Technology Stack - Pilates Class Planner v2.0

This document details all technologies, libraries, and dependencies chosen for the Pilates Class Planner v2.0, with rationale for each choice.

---

## Frontend Stack

### Core Framework
**React 18.3+ with TypeScript**
- **Why**: Component-based architecture, excellent TypeScript support, large ecosystem
- **Version**: 18.3.1 (latest stable)
- **Type Safety**: Full TypeScript integration for compile-time error catching

**Vite 5+**
- **Why**: Lightning-fast HMR, optimized builds, better DX than CRA
- **Features**: ES modules, instant server start, optimized bundling
- **Configuration**: `vite.config.ts` with React SWC plugin

---

### UI Component Library
**shadcn/ui (Radix UI Primitives)**
- **Why**: Unstyled, accessible, composable components
- **Accessibility**: WCAG 2.1 compliant out of the box
- **Customization**: Full control over styling via Tailwind
- **Components Used**:
  - `button` - All button variants
  - `card` - Content containers
  - `select` - Dropdown selectors
  - `dialog` / `alert-dialog` - Modals
  - `form` - Form controls (with react-hook-form)
  - `toast` (sonner) - Notifications
  - `accordion` - Collapsible sections
  - `tabs` - Tabbed interfaces
  - More as needed

**Radix UI Features:**
- Keyboard navigation
- Focus management
- Screen reader support
- Portal-based overlays

---

### Styling
**Tailwind CSS 3.4+**
- **Why**: Utility-first, rapid development, small bundle size
- **Plugins**:
  - `tailwindcss-animate` - Animation utilities
  - `@tailwindcss/typography` (if needed for content)
- **Configuration**: Extended with custom burgundy/cream theme
- **Design Tokens**: All colors defined as CSS variables in HSL

**CSS Architecture:**
- `design-tokens.css` - HSL color variables, animations
- Tailwind utilities - Component styling
- No CSS modules or styled-components (keeping it simple)

---

### State Management
**Zustand 4.5+**
- **Why**: Minimal boilerplate, excellent TypeScript support, small bundle
- **Use Cases**:
  - Authentication state
  - Class builder state (movements, sequence)
  - User preferences
- **Alternative Considered**: Redux Toolkit (rejected - too complex for MVP)

**React Query (TanStack Query) 5.17+**
- **Why**: Declarative data fetching, caching, synchronization
- **Features**:
  - Automatic background refetching
  - Optimistic updates
  - Cache management
- **Use Cases**:
  - Fetching movements from database
  - Class plan CRUD operations
  - User progress data

---

### Forms & Validation
**React Hook Form 7.49+**
- **Why**: Performant, minimal re-renders, excellent validation
- **Integration**: Works seamlessly with shadcn/ui form components

**Zod 3.22+**
- **Why**: TypeScript-first schema validation
- **Integration**: Via `@hookform/resolvers`
- **Use Cases**:
  - Form validation
  - API response validation
  - Type inference

---

### Routing
**React Router DOM 6.21+**
- **Why**: Standard React routing library, excellent TypeScript support
- **Features**:
  - Nested routes
  - Loader functions for data fetching
  - Protected routes (auth)
- **Routes**:
  - `/` - Home/Dashboard
  - `/login` - Authentication
  - `/class-planner` - Main class builder
  - `/analytics` - Progress tracking
  - `/profile` - User settings

---

### Drag & Drop
**@dnd-kit/core & @dnd-kit/sortable 8.0+**
- **Why**: Modern, accessible, performant drag-and-drop
- **Features**:
  - Touch support
  - Keyboard navigation
  - Smooth animations
- **Use Case**: Drag movements to build class sequence
- **Alternative**: react-beautiful-dnd (deprecated, lacks accessibility)

---

### Icons
**Lucide React 0.462+**
- **Why**: Beautiful, consistent, tree-shakeable
- **Size**: Only imports used icons
- **Icons Used**: ArrowLeft, Check, Home, Calendar, User, Settings, Music, etc.

---

### Date Handling
**date-fns 3.6+**
- **Why**: Modular, tree-shakeable, immutable
- **Features**: Timezone support, localization
- **Alternative**: Day.js (considered but date-fns more robust)

---

### HTTP Client
**Axios 1.6+** (for backend API calls)
- **Why**: Interceptors, request/response transformation, better error handling
- **Configuration**: Base URL, auth token injection
- **Alternative**: Fetch API (lacks interceptors)

**Supabase Client 2.39+** (for database)
- **Why**: Direct Postgres access, real-time subscriptions, RLS
- **Features**:
  - Row Level Security
  - Real-time updates
  - Built-in auth

---

## Backend Stack

### Core Framework
**FastAPI 0.109+**
- **Why**: Modern Python, auto-generated docs, excellent async support
- **Features**:
  - OpenAPI spec generation
  - Pydantic validation
  - Dependency injection
- **Server**: Uvicorn with `--reload` for development

---

### Database
**Supabase (PostgreSQL 15)**
- **Why**: Managed Postgres, real-time, built-in auth, generous free tier
- **Features**:
  - Row Level Security (RLS)
  - Postgres functions for business logic
  - Full-text search
- **ORM**: Direct SQL via Supabase client (no SQLAlchemy for simplicity)

**Alembic 1.13+** (Migrations)
- **Why**: Standard Python migration tool
- **Features**: Version control for database schema

---

### AI/ML Libraries
**OpenAI API 1.10+**
- **Why**: GPT-3.5-turbo for sequence generation
- **Use Cases**:
  - Movement sequence variations
  - Music recommendations
  - Meditation script generation

**Anthropic API 0.8+** (Optional)
- **Why**: Claude for more nuanced text generation
- **Use Case**: Research agent, content enhancement

**LangChain 0.1+**
- **Why**: Orchestrate AI agents, prompt templates
- **Use Cases**:
  - Agent coordination
  - Memory management
  - Prompt engineering

---

### MCP Integration
**MCP Protocol 0.1+**
- **Why**: Model Context Protocol for Playwright integration
- **Server**: `@modelcontextprotocol/server-playwright`
- **Use Case**: Web research for movement cues, modifications

---

### Caching
**Redis 5.0+**
- **Why**: Fast in-memory cache for MCP results, session data
- **Client**: `redis-py` with `hiredis` for performance
- **TTL**: 24 hours for MCP research results

---

### Excel Processing
**openpyxl 3.1+**
- **Why**: Read/write .xlsm files with macro preservation
- **Use Case**: Import Pilates_Summary_Spreadsheet

**pandas 2.1+**
- **Why**: Data transformation, validation
- **Use Case**: Transform Excel to database schema

---

### Security & Compliance
**python-jose 3.3+** (JWT)
- **Why**: JSON Web Token creation/validation
- **Algorithm**: HS256

**passlib 1.7+** (Password Hashing)
- **Algorithm**: bcrypt
- **Rounds**: 12 (secure but performant)

**cryptography 41.0+** (PII Encryption)
- **Algorithm**: AES-256 for PII tokenization
- **Key Management**: Environment variables

---

### Testing
**Frontend:**
- `vitest 1.2+` - Fast Vite-native test runner
- `@testing-library/react 14.1+` - Component testing
- `@testing-library/user-event 14.5+` - User interaction simulation
- `jsdom 24.0+` - DOM environment

**Backend:**
- `pytest 7.4+` - Python test framework
- `pytest-asyncio 0.23+` - Async test support
- `pytest-cov 4.1+` - Coverage reporting
- `pytest-mock 3.12+` - Mocking utilities

---

### Code Quality
**Frontend:**
- `eslint 8.56+` - Linting
- `typescript 5.3+` - Type checking
- `prettier 3.2+` - Code formatting

**Backend:**
- `black 23.12+` - Code formatting
- `flake8 7.0+` - Linting
- `mypy 1.8+` - Static type checking
- `isort 5.13+` - Import sorting

---

### Monitoring & Logging
**loguru 0.7+** (Backend)
- **Why**: Better than standard logging, structured output
- **Features**: Rotation, retention, formatting

**Sentry 1.39+** (Optional)
- **Why**: Error tracking, performance monitoring
- **Integration**: Frontend + Backend

---

## DevOps & Infrastructure

### Containerization
**Docker & Docker Compose**
- **Why**: Consistent environments, easy orchestration
- **Services**:
  - `backend` - FastAPI app
  - `frontend` - React dev server (or Nginx for production)
  - `redis` - Cache layer
  - `mcp-playwright` - Research server

---

### Package Management
**Frontend:** npm 9+ (could use pnpm for speed)
**Backend:** pip with `requirements.txt` (could use Poetry for better dependency resolution)

---

### Version Control
**Git**
- `.gitignore` - Exclude node_modules, .env, __pycache__, etc.
- GitHub (assumed) for remote repository

---

## Development Tools

### VS Code Extensions (Recommended)
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Python
- Pylance (type checking)

---

## Why This Stack?

### Frontend Rationale
1. **React + TypeScript** - Industry standard, type safety
2. **Vite** - Best-in-class DX, faster than Webpack
3. **shadcn/ui** - Accessible, customizable, no runtime overhead
4. **Tailwind** - Rapid styling, matches MVP perfectly
5. **Zustand + React Query** - Simple state management, powerful data fetching

### Backend Rationale
1. **FastAPI** - Modern, fast, auto-docs, async
2. **Supabase** - Managed Postgres, real-time, auth included
3. **Redis** - Essential for MCP caching
4. **OpenAI/Anthropic** - Best-in-class AI for agents

### AI/MCP Rationale
1. **MCP Playwright** - Web research without scraping APIs
2. **LangChain** - Orchestrate multiple agents cleanly
3. **OpenAI** - Cost-effective for sequence generation

---

## Alternatives Considered

| Choice | Alternative | Why Rejected |
|--------|-------------|--------------|
| FastAPI | Django | Too heavy, unnecessary features |
| Supabase | Firebase | Less control, vendor lock-in |
| Zustand | Redux Toolkit | Too complex for this use case |
| Vite | Create React App | CRA is slower, deprecated |
| @dnd-kit | react-beautiful-dnd | Deprecated, lacks accessibility |
| Tailwind | CSS Modules | Slower development |
| Axios | Fetch API | Lacks interceptors |

---

## Dependency Summary

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.21.3",
    "@tanstack/react-query": "^5.17.19",
    "@supabase/supabase-js": "^2.39.3",
    "axios": "^1.6.5",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "zustand": "^4.5.0",
    "date-fns": "^3.6.0",
    "clsx": "^2.1.1",
    "react-hook-form": "^7.49.3",
    "zod": "^3.23.8",
    "@hookform/resolvers": "^3.3.4",
    "lucide-react": "^0.462.0",
    "@radix-ui/react-*": "latest",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.11",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.11",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "vitest": "^1.2.1",
    "@testing-library/react": "^14.1.2"
  }
}
```

### Backend (requirements.txt)
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
supabase==2.3.4
psycopg2-binary==2.9.9
alembic==1.13.1
pydantic==2.5.3
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
cryptography==41.0.7
openai==1.10.0
anthropic==0.8.1
langchain==0.1.4
redis==5.0.1
openpyxl==3.1.2
pandas==2.1.4
httpx==0.26.0
pytest==7.4.4
pytest-asyncio==0.23.3
black==23.12.1
mypy==1.8.0
```

---

*This stack provides a modern, performant, and maintainable foundation for the Pilates Class Planner v2.0.*
