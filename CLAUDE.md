# CLAUDE.md

**Project:** Pilates Class Planner v2.0 - AI-powered Pilates class generation

**Stack:** FastAPI backend (Render $9/mo) + React frontend (Netlify $9/mo) + Supabase PostgreSQL (free) + Jentic StandardAgent

**Current Branch:** `dev` → https://bassline-dev.netlify.app

**Status:** Production-ready with AI class generation, voiceover narration, mobile support

---

## 🚨 CRITICAL RULES

**Security:**
- NEVER commit secrets (API keys, tokens, .env files)
- Check before commit: `git diff`, `grep -r "eyJ" .`, `grep -r "sk_" .`

**Git Workflow:**
- NEVER push without user permission (conserves Netlify build minutes: 1,000/month)
- Always work on `dev` branch, commit locally first
- ASK before push: "Ready to push? This will trigger Netlify build"

**Database Access:**
- Read-only: `node scripts/db_readonly_query.mjs "SELECT ..."`
- 31 approved tables (NOT user_profiles - PII protected)
- Write operations BLOCKED, max 1000 rows

**Proactive Troubleshooting (BEFORE asking user):**
1. Run database queries to inspect state
2. Check Render backend logs
3. Test API endpoints with curl
4. Verify browser console errors
5. Propose fixes with evidence

---

## 📋 KEY DOCUMENTATION

**Essential Rules:** `CLAUDE.md` (this file)

**Complete Archive:** `CLAUDE_ARCHIVE.md` (sessions 7-13, resolved issues, detailed reference)

**Jentic Integration:** `/docs/JENTIC_MASTER.md` (StandardAgent, Arazzo Engine)

**Visual Baseline:** `/docs/Visual_regression_baseline.md` (class builder specifications)

**Dev Workflow:** `/docs/DEV_QA_WORKFLOW.md` (dev→QA→production pipeline)

---

## 🔑 ESSENTIAL COMMANDS

**Backend:** `uvicorn api.main:app --reload --port 8000`

**Frontend:** `npm run dev` (dev server), `npm run type-check`, `npm test`

**Database:** `node scripts/db_readonly_query.mjs "SELECT ..."`

**Tests:** `pytest tests/ -v` (backend), `npm test` (frontend)

---

## 🎯 NEXT PRIORITIES

**See CLAUDE_ARCHIVE.md "Prioritized Enhancement Roadmap" section for:**
- Chromecast integration (High Priority)
- Admin-only AI toggle + Redis caching (cost reduction)
- Nutrition tracker
- Test automation (MCP Playwright)
- Security testing & Privacy policy
