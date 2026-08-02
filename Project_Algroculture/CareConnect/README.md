<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# CareConnect — AI Patient Health Portal

A mobile-first patient health portal powered by Google Gemini. Patients can review lab results, appointments, medications, and doctor messages — and ask an AI assistant follow-up questions about their health data.

View original AI Studio project: https://ai.studio/apps/5f7acbb6-4437-4465-bbc3-577cdf3d81d7

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your keys:
   ```
   GEMINI_API_KEY=        # required — get at https://aistudio.google.com/apikey
   VITE_CLERK_PUBLISHABLE_KEY=   # optional — Clerk auth
   CLERK_SECRET_KEY=             # optional — Clerk auth
   VITE_SUPABASE_URL=            # optional — Supabase database
   VITE_SUPABASE_ANON_KEY=       # optional — Supabase database
   SUPABASE_URL=                 # optional — Supabase (server-side)
   SUPABASE_SERVICE_ROLE_KEY=    # optional — Supabase (server-side)
   ```
3. Run both servers in two separate terminals:
   ```bash
   npm run dev      # Vite frontend — http://localhost:3000
   npm run server   # Express AI server — http://localhost:3001
   ```

The app works with only `GEMINI_API_KEY` set. Clerk (auth) and Supabase (database) activate automatically when their env vars are present, falling back to dev-mode and localStorage otherwise.

---

## Features

### AI Chat Assistant
- Streaming AI responses via Google Gemini (`gemini-flash-latest`)
- Opened from any tab via the global floating "Ask AI" button
- Opened in report context from the Health tab ("Ask AI" on a specific lab report)
- Suggested question chips on first open
- Markdown-rendered responses (bold, bullets, headings)
- Medical disclaimer on every response
- AI flags concerns with **⚠️ Worth noting:** and suggests tests with **💡 Consider asking about:**
- Clear chat with confirmation dialog

### AI Health Brief (Home tab)
- Gemini-generated 3-bullet daily health summary on the Home tab
- Specific to the patient's actual lab values and medications
- Streamed in on load; cached in `sessionStorage` for the day (one API call per session)
- Refresh button to regenerate

### Health Score (Home tab)
- Aggregate score (0–100) computed from all lab parameters
- Color-coded circular gauge: Excellent / Good / Fair / Needs Attention
- Based on status weights: Optimal=100, Normal=85, Review=55, High/Low=45

### Medication Adherence Tracker (More tab)
- Daily checklist of active medications — tap to mark taken
- Progress shown as "X/Y taken" badge
- Completion celebration message when all meds are taken
- State stored in `localStorage` keyed by date — resets automatically each day

### Chat History Persistence
- **With Supabase:** history saved server-side per patient, persists across devices and sessions
- **Without Supabase:** history saved to `localStorage`, persists per device
- Separate history per lab report context vs. global chat

### Auth (Clerk)
- Sign-in/sign-up gate when `VITE_CLERK_PUBLISHABLE_KEY` is set
- Works in dev mode (no auth) without any Clerk keys
- Sign Out button in the More tab

---

## Architecture

```
Frontend (React 19 + Vite + Tailwind CSS 4)
│
├── src/App.tsx                    State hub, tab routing, AI chat state
├── src/components/
│   ├── AIChatModal.tsx            Streaming chat UI (SSE reader, markdown)
│   ├── AIHealthBrief.tsx          Daily AI health brief with session cache
│   ├── HomeTab.tsx                Dashboard with health score + AI brief
│   ├── HealthTab.tsx              Lab results list
│   ├── VisitsTab.tsx              Appointments
│   ├── InboxTab.tsx               Doctor messages
│   └── MoreTab.tsx                Profile, medications, adherence tracker
├── src/lib/
│   ├── buildPatientContext.ts     Serialises patient data → Gemini prompt
│   ├── queries.ts                 Typed Supabase query functions
│   └── supabase.ts                Supabase client
├── src/hooks/
│   └── usePatientData.ts          Loads from Supabase or falls back to mock
│
Express AI Server (server.ts — port 3001)
├── POST /api/chat                 Streaming Gemini chat (SSE)
├── POST /api/health-brief         Streaming daily health summary (SSE)
├── GET  /api/chat-history         Load persisted chat (requires Supabase + Clerk)
├── POST /api/chat-history         Save a chat turn
└── DELETE /api/chat-history       Clear chat history
│
Supabase (PostgreSQL)
└── Tables: patients, lab_reports, test_parameters, physician_notes,
            appointments, medications, messages, chat_history,
            historical_trends, notifications
    RLS enabled on all tables — patients see only their own rows
```

**Key design principle:** `buildPatientContext.ts` is the single data serialisation point. It accepts real Supabase data or falls back to mock data for any field not provided. Replacing mock data with real backend calls requires changing only this one file.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 4 + Material Design 3 tokens |
| AI | Google Gemini (`gemini-flash-latest`) via `@google/genai` |
| Auth | Clerk (`@clerk/clerk-react`, `@clerk/express`) |
| Database | Supabase (PostgreSQL) with Row-Level Security |
| AI Server | Express.js + Node.js |
| Streaming | Server-Sent Events (SSE) |

---

## Database Setup (Supabase)

1. Go to your Supabase project → SQL Editor
2. Run `src/components/schema.sql` to create all tables with RLS policies
3. Sign up at `http://localhost:3000` to get your Clerk user ID
4. Replace `REPLACE_WITH_YOUR_CLERK_USER_ID` in `src/components/seed.sql` (3 places) with your ID
5. Run `src/components/seed.sql` to load the mock patient data

---

## Production Roadmap

### Infrastructure (before any real patients)

**1. HTTPS everywhere**
The app runs over HTTP. Add a reverse proxy (Caddy or Nginx) or deploy to Vercel/Railway which include HTTPS automatically.

**2. HIPAA compliance**
For US deployments handling real health data:
- Business Associate Agreement (BAA) with Google — use Vertex AI, not AI Studio
- Audit logs of who accessed what and when
- Data encryption at rest

### Product Features

**3. Real lab data ingestion**
Labs send results via HL7 FHIR. A FHIR API connector ingests results automatically from Quest, LabCorp, etc.

**4. Push notifications**
Service worker (PWA) or native app wrapper to notify patients when new results arrive.

**5. Doctor-in-the-loop on AI flags**
When the AI flags a concern with ⚠️, surface it to the physician as a review queue item.

**6. Multi-patient support + doctor dashboard**
A physician view showing all patients, AI-surfaced concerns, and a message queue.

**7. Medication reminders**
Push notifications at medication schedule times, synced with the adherence tracker.

### Scalability

**8. RAG instead of full-context injection**
Currently the entire patient record goes into every prompt. With years of records, switch to pgvector or Pinecone to retrieve only relevant chunks per question.

**9. Rate limiting & cost controls**
Per-user request rate limiting and daily token budgets on the Express server.

**10. Semantic caching**
Cache AI answers for common questions (e.g., "what does A1C measure?") by embedding similarity — cuts AI costs 30–50%.

### Recommended implementation order

| Priority | What |
|---|---|
| 1 | HTTPS — before sharing outside your local network |
| 2 | Push notifications |
| 3 | FHIR data ingestion |
| 4 | Doctor dashboard |
| 5 | Medication reminders |
| 6 | RAG (when data volume grows) |
| 7 | HIPAA / BAA (when onboarding real patients) |

### Scaling the AI layer

The Express/Node.js backend is suitable for MVP. At scale, the AI layer benefits from Python:

- The RAG ecosystem (LangChain, LlamaIndex, sentence-transformers) is Python-first
- Medical NLP libraries (spaCy, scispaCy, MedSpaCy) are Python-only
- Vector search, fine-tuning, and embedding pipelines are easier in Python

The migration is smooth — `buildPatientContext.ts` is the only file that touches patient data. Replace it with a Python API call and nothing else changes.
