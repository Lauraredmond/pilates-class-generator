# Youth Training Hub — Project Spec & Prompt

> **Integration note:** Add the following line to your existing `CLAUDE.md` to pull this file in:
>
> ```
> See YOUTH-TRAINING-HUB.md for the full specification, constraints, and guardrails for the Youth Training Hub feature/project.
> ```
>
> Alternatively, if your project uses a docs/ folder, place this file at `docs/YOUTH-TRAINING-HUB.md` and reference it accordingly.

---

## Project Overview

You are building the **Youth Training Hub**, a multi-sport coaching diary and youth training visibility platform. The core purpose is simple: **parents and approved coaches can see a registered youth's full training schedule and content in one place.**

Read `SPEC.docx` and `youth-training-hub.jsx` before doing any work. The spec is the source of truth for all design decisions. The JSX is a working prototype that demonstrates the complete data model and user flows. Your job is to turn this prototype into a production-ready application.

---

## Critical Context

This product serves youth sports in Ireland and similar multi-sport cultures. A typical user is a parent whose 14-year-old plays GAA on Tuesday, rugby on Wednesday, and swims on Saturday. No one currently has visibility into the full picture. This app fixes that.

The users (coaches and parents) are time-poor, not tech-averse. Session logging must be fast — under 60 seconds for a coach using templates. The parent flow must be even simpler: activity name, date, time, duration, done.

---

## Architecture Decisions (Non-Negotiable)

These decisions are final. Do not revisit, redesign, or suggest alternatives unless explicitly asked.

### Two-Timestamp Model
Every entry stores both:
- `trainingDate` — when the training actually happened (set by coach or parent)
- `recordedAt` — when the entry was created (system-generated, automatic)

The timeline sorts by `trainingDate`, never by `recordedAt`. These are separate fields in the database. Do not merge them.

### Code-Based Player Linking
- Parent registers a child → system generates a unique 6-character alphanumeric code
- Parent shares this code with each coach verbally or via message
- Coach enters the code once to link the player to their team
- No child appears on any coach's view without the parent explicitly sharing their code
- Codes must be unique, case-insensitive, and exclude ambiguous characters (0/O, 1/I/L)

### Attendance-Based Session Attribution
- When a coach logs a session, they select which linked players attended
- Only attending players get the session on their timeline
- Do NOT attribute sessions to all roster players automatically

### Open Activity Naming for Parents
- Parents type any activity name as free text (e.g. "Swimming", "Dance", "Martial Arts")
- Do not use a fixed dropdown or restrict to predefined sports
- The system should auto-assign colours/icons for common sports and generate deterministic colours for unknown ones

### Three Structured Sports with Drill Templates
- Rugby, Soccer, and GAA have full drill libraries organised by category
- Each sport has pre-configured session templates that pre-load common drill combinations
- Coaches can customise any template (reorder, add, remove drills, adjust durations, add notes)
- Coaches can also start blank sessions
- Do not add drill templates for other sports — parent-logged activities cover everything else

---

## Data Model

Refer to Section 4 of `SPEC.docx` for the complete field-level schema. The four core entities are:

1. **Youth** — `id`, `name`, `code`
2. **Team** — `id`, `name`, `sport`, `level`, `linkedYouthCodes[]`
3. **Coach Session** — `id`, `teamId`, `trainingDate`, `recordedAt`, `templateName`, `drills[]`, `notes`, `attendees[]`, `sport`, `teamName`
4. **Parent Activity** — `id`, `youthCode`, `activity`, `trainingDate`, `duration`, `recordedAt`

### Database Guidance
- Use PostgreSQL (or SQLite for local dev)
- Store all timestamps in UTC
- Index on `youthCode`/`attendees` and `trainingDate` — the timeline query is the most important query in the system
- Youth codes must be unique with a case-insensitive constraint
- The `attendees` field on coach sessions is an array of youth codes; design the schema to support efficient lookup of "all sessions where youth X attended"

---

## User Roles

### Coach
- Creates and manages multiple teams (each team has one sport)
- Links youth players via their 6-character code
- Logs sessions using sport-specific templates or custom sessions
- Sets training date and time explicitly (defaults to now, but adjustable for backdating)
- Marks attendance per session
- Views session history per team

### Parent
- Registers one or more children (each gets a unique code)
- Shares codes with coaches
- Logs any activity by typing a name + date + time + duration
- Views their child's timeline

### Youth (Future — do not build yet)
- Will eventually log their own activities
- Profile is currently auto-generated from coach and parent entries
- Flag this in the codebase with TODO comments where youth self-logging would plug in

---

## Timeline View

The timeline is the core output. It must:

- Show a horizontal 7-day grid (Monday–Sunday) navigable week by week
- Display colour-coded event blocks per day, one per session/activity
- Highlight today's column
- Support tap/click to expand a day's detail (sport, label, duration, time, drill count, source)
- Show a weekly summary above the grid: session count, total hours, number of sports
- Show an all-time overview below: cumulative sessions, hours, and sport breakdown
- Aggregate both coach sessions (where youth attended) AND parent activities for that youth

Reference the prototype's `TimelineView` component for the exact UX pattern.

---

## Constraints and Guardrails

### Do
- Read `SPEC.docx` fully before writing any code
- Reference `youth-training-hub.jsx` as the working prototype for data model and flow
- Keep the coach session logging flow under 60 seconds (template → tweak → attendance → save)
- Keep the parent activity logging flow to 4 fields (activity, date, time, duration)
- Preserve the exact drill library and template structure from the prototype
- Write tests for the timeline aggregation query — it is the most critical piece of logic
- Use clear, descriptive variable names matching the spec terminology (trainingDate, recordedAt, youthCode, attendees, etc.)
- Add TODO comments for future features listed in Section 8 of the spec

### Do Not
- Do not rename fields from the spec (e.g. don't rename `trainingDate` to `sessionDate` or `date`)
- Do not merge `trainingDate` and `recordedAt` into a single timestamp
- Do not auto-attribute sessions to all roster players — attendance must be explicit
- Do not restrict parent activity names to a dropdown
- Do not add drill templates for sports beyond rugby, soccer, and GAA
- Do not build youth self-logging yet (mark as TODO)
- Do not build alerts, KPIs, load management, or rest-day tracking yet (these are layer-two features)
- Do not add authentication complexity beyond basic email/password — keep it simple for MVP
- Do not over-engineer the frontend — the prototype aesthetic is intentionally clean and utilitarian, not flashy

### Security Considerations
- Rate-limit code entry attempts to prevent brute-force guessing of youth codes
- Youth data is sensitive — ensure proper access control (only linked coaches and the registering parent can see a youth's timeline)
- Do not expose youth codes in URLs or API responses beyond the parent's own view
- Sanitise all free-text inputs (activity names, session notes, drill notes)

---

## Tech Stack (Recommended)

This is a recommendation, not a mandate. Adjust if you have strong reasons, but document why.

- **Frontend**: React (or React Native if targeting mobile first)
- **Backend**: Node.js with Express or Fastify
- **Database**: PostgreSQL (with Prisma or Drizzle ORM)
- **Auth**: Simple email/password with session tokens (no OAuth complexity for MVP)
- **Hosting**: Vercel (frontend) + Railway or Render (backend + DB)

---

## Project Structure (Suggested)

```
youth-training-hub/
├── CLAUDE.md              ← This file
├── SPEC.docx              ← Product specification (source of truth)
├── youth-training-hub.jsx ← Working prototype (reference implementation)
├── client/                ← React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── coach/     ← Coach dashboard, session logging, drill picker
│   │   │   ├── parent/    ← Parent dashboard, activity logging, registration
│   │   │   └── timeline/  ← Notion-style weekly timeline view
│   │   ├── data/
│   │   │   ├── drills.js  ← Drill libraries (rugby, soccer, GAA)
│   │   │   └── templates.js ← Session templates per sport
│   │   ├── utils/
│   │   │   ├── sportStyles.js ← Colour/icon mapping for sports
│   │   │   └── dates.js      ← Date helpers (toDateStr, getWeekStart, etc.)
│   │   └── App.jsx
│   └── package.json
├── server/                ← API backend
│   ├── routes/
│   │   ├── auth.js
│   │   ├── teams.js
│   │   ├── sessions.js
│   │   ├── activities.js
│   │   ├── youths.js
│   │   └── timeline.js   ← The most important route
│   ├── db/
│   │   ├── schema.sql
│   │   └── migrations/
│   └── package.json
└── tests/
    ├── timeline.test.js   ← MUST exist — test the aggregation logic
    └── codes.test.js      ← Test code generation uniqueness and validation
```

---

## Getting Started Sequence

1. Read `SPEC.docx` end to end
2. Review `youth-training-hub.jsx` — run it if possible to understand the flows
3. Set up the database schema based on Section 4 of the spec
4. Build the API routes, starting with the timeline aggregation endpoint
5. Write tests for timeline aggregation and code generation
6. Build the frontend, extracting drill data and templates from the prototype
7. Implement auth and access control
8. Wire everything together

---

## Key Queries to Get Right

### Timeline Query (Most Important)
```sql
-- All training events for a youth, sorted by training date
-- This combines coach sessions (via attendance) and parent activities

SELECT 'coach' as source, cs.id, cs.training_date, cs.sport, cs.team_name as label,
       cs.template_name as detail, cs.drills, NULL as duration_mins
FROM coach_sessions cs
WHERE :youth_code = ANY(cs.attendees)

UNION ALL

SELECT 'parent' as source, pa.id, pa.training_date, pa.activity as sport,
       pa.activity as label, NULL as detail, NULL as drills, pa.duration as duration_mins
FROM parent_activities pa
WHERE pa.youth_code = :youth_code

ORDER BY training_date ASC;
```

### Weekly Filter
Add `WHERE training_date >= :week_start AND training_date < :week_end` for the timeline view.

---

## Definition of Done

The MVP is complete when:
- [ ] A parent can register a child and receive a unique code
- [ ] A parent can share the code with a coach (out of band — the system just generates and displays it)
- [ ] A coach can create a team, enter the code, and link the youth
- [ ] A coach can log a session using a template, set date/time, tick attendance, and save
- [ ] A parent can log an activity with any sport name, date, time, and duration
- [ ] The timeline view shows all events for a youth (from both coaches and parents) in a weekly grid
- [ ] Tapping a day expands detail
- [ ] Weekly summary shows session count, hours, and sports
- [ ] Only the parent and linked coaches can see a youth's timeline
- [ ] The system prevents duplicate youth codes
- [ ] Timeline sorts by trainingDate, not recordedAt
