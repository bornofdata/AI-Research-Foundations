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

### Health Timeline (Home tab)
- "View Health Timeline" quick-action button on the Home tab opens a full-screen timeline modal
- Unified chronological feed of all health events sorted newest first
- Covers: lab results, appointments, doctor messages, symptom log entries, and active medications
- Filter by event type: All | Labs | Appointments | Messages | Symptoms | Medications
- Color-coded event dots per category (Labs → primary blue, Appointments → secondary teal, Messages → emerald, Symptoms → amber, Medications → purple)
- Slide-up animation; smooth scroll through long histories
- Symptom log entries loaded live from `localStorage` (`careconnect_symptom_log`)

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

### Dark Mode (More tab)
- Toggle between light and dark colour schemes from the More tab settings menu
- Uses Material Design 3 dark palette — all colour tokens override via CSS custom properties on `<html class="dark">`
- Preference persisted to `localStorage` (`careconnect_theme`) and restored on every page load
- All Tailwind utilities (`bg-surface`, `text-on-surface`, etc.) automatically pick up the dark palette with no per-component changes

### Emergency Health Card (More tab)
- Prominent emergency info card displayed directly below the patient profile card
- Shows blood type as a bold badge, allergies, chronic conditions, and emergency contact
- "Edit" (pencil) button switches to inline edit mode with input fields for every field; "Save" persists changes
- "Copy" button copies a one-line emergency summary to the clipboard (e.g. "Blood Type: A+ | Allergies: Penicillin | Emergency Contact: John Jenkins (555-0100)")
- Data stored in `localStorage` under `careconnect_emergency_card`; defaults pre-populated for demo

### Appointment Request (Visits tab)
- "Request New Appointment" button at the top of the Visits tab
- Select visit type (Follow-up, Routine Check-up, Lab Review, Urgent Consultation, Specialist Referral, Annual Physical), preferred date, preferred time of day, and optional reason (up to 300 chars)
- AI drafts a professional 3–5 sentence appointment request message using the patient's health context via Gemini
- Sent request appears immediately in the Inbox as a new patient message thread

### Prescription Refill Request (More tab)
- Tap "Refill" on any active medication to open a refill request dialog
- Optional patient note (e.g., "running low", "going on vacation") — up to 200 characters
- AI drafts a professional 3–5 sentence refill request using the patient's health context via Gemini
- Sent message appears immediately in the Inbox as a new patient message thread

### AI Medication Explainer (More tab)
- Tap the ℹ info button on any medication in the adherence list to get an AI-generated explanation
- Covers: what it treats, how it works, common side effects, what to watch for, and tips for taking it
- Personalized to the patient's health data (e.g., connects metformin to glucose levels for pre-diabetic patients)
- Streamed response with markdown formatting; cached per medication within the session — reopening the same med is instant

### Medication Adherence Tracker (More tab)
- Daily checklist of active medications — tap to mark taken
- Progress shown as "X/Y taken" badge
- Completion celebration message when all meds are taken
- State stored in `localStorage` keyed by date — resets automatically each day

### Medication Reminder Notifications (More tab)
- Set a daily reminder time per medication via a time picker
- Native browser notification at reminder time (requires permission grant)
- In-app dismissible yellow alert banner even without notification permission
- Reminder state tracked per day via `sessionStorage` to avoid duplicate alerts
- Reminder times stored in `localStorage` under `careconnect_med_reminders`

### AI Doctor Reply (Inbox tab)
- Messages sent to Dr. Chen receive a real Gemini-generated response referencing the patient's actual health data
- Shows "Dr. Chen is reviewing your message…" typing indicator, then streams the reply character by character
- Response rendered with markdown formatting
- Falls back to a polite static message if the AI call fails

### Biometric Trend Charts (Trend Analysis modal)
- Interactive Recharts line chart for each metric (Glucose, A1C, Sodium, Potassium) in the Trend Analysis modal
- Plots real historical data points from `HISTORICAL_TRENDS` (May–Oct 2023) with labeled month ticks
- Dashed reference lines show the normal Min/Max bounds for each metric (parsed from the target range string)
- Renders above the AI-generated text interpretation without interrupting SSE streaming
- Built with Recharts (`ResponsiveContainer` + `LineChart`) — zero additional API calls

### AI Trend Insight (Trend Analysis modal)
- Opening the Trend Analysis modal streams a Gemini-generated clinical interpretation of the selected metric's trajectory
- Switches automatically when clicking a different metric tab (Glucose → A1C → Sodium → Potassium)
- Results cached per metric in memory — no repeated API calls within the same session

### Smart Health Alerts (Notifications panel)
- On app load, Gemini analyzes the patient's full health record and generates 2 personalized, data-specific alerts
- Alerts appear at the top of the notifications panel (bell icon) marked as unread
- Non-blocking — runs silently after data loads, fails silently if the API is unavailable

### PWA — Installable App
- Full Progressive Web App setup: `manifest.json`, service worker, Apple/Android meta tags
- "Add to Home Screen" works on both iOS Safari and Android Chrome
- Service worker caches the app shell for offline loading
- App icon (heart + ECG pulse SVG) and correct theme colour on the device status bar

### Lab Report Comparison (Health tab)
- Select any two lab reports to compare side-by-side using the "Compare Reports" button
- Color-coded trend arrows show improvement (green ↑), decline (red ↓), or no change
- Arrow color determined by status transitions: moving toward optimal/normal = green, moving toward high/low = red, ambiguous = amber
- Parameters unique to one report listed separately below the shared-parameter table
- Shared parameters matched by name across reports; non-numeric values show a dash instead of an arrow

### Lab Report Photo Scan (Health tab)
- "Scan Report" button at the top of the Health tab
- Tap to upload a photo of any printed lab report (JPEG/PNG/WEBP, max 5 MB)
- Gemini vision AI extracts every individual test result: name, value, unit, reference range, and status
- Results displayed in a structured card with colour-coded status badges (Normal / High / Low / Optimal / Review)
- Camera capture supported on mobile (`capture="environment"` triggers rear camera)

### Pre-Visit AI Summary (Visits tab)
- "Prepare for Visit" button on every upcoming appointment card
- Streams a structured AI prep document with four sections: Health Since Last Visit, Current Medications, Questions to Ask, What to Bring
- Content is specific to the patient's actual lab values and the appointment type/doctor
- Persisted to `localStorage` per appointment — reopening shows the same summary instantly, no extra API call
- Refresh button to regenerate if health data has changed
- Copy-to-clipboard button for sharing the summary before the appointment

### AI Health Goals (Home tab)
- AI generates 3 personalized, measurable goals tied to the patient's actual lab values (e.g. "Keep fasting glucose below 95 mg/dL")
- Each goal shows the metric it tracks and the reason it was suggested
- Tap any goal to mark it on track — progress shown as "X/Y on track" badge
- Goals persist in `localStorage`; refresh button regenerates new AI suggestions
- Sparkle icon marks AI-suggested goals vs. any future user-added ones

### Health Summary Export (More tab)
- Tap "Export Health Summary" in the More tab settings menu to open a full structured health report
- Compiles patient info (name, DOB, MRN, insurance, blood type), health score, active medications, recent lab results with parameter tables, upcoming appointments, emergency info, and AI Health Brief
- **Print** button calls `window.print()` with a `@media print` CSS rule that hides everything except the export area — clean black-and-white output with `@page { margin: 1cm }`
- **Copy Summary** button copies a full plain-text version of the summary to the clipboard for pasting into emails or messages
- Status badges degrade gracefully to text labels in print (no colored backgrounds)
- AI Health Brief pulled from `sessionStorage` (`careconnect_health_brief`); shows "Not yet generated" if unavailable

### Symptom Journal (Home tab → More tab)
- "Log Today's Symptoms" quick-action tile on the Home tab opens a daily log modal
- Select from 10 symptom chips (Fatigue, Headache, Dizziness, etc.) + optional free-text note
- Severity slider 1–5 with colour-coded labels (Mild → Severe)
- Entries saved to `localStorage` with timestamp
- 3 most recent entries shown in the More tab for quick reference
- Journal entries can be referenced during pre-visit prep summaries

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
│   ├── usePatientData.ts          Loads from Supabase or falls back to mock
│   └── useTheme.ts                Dark/light mode toggle — persists to localStorage
│
Express AI Server (server.ts — port 3001)
├── POST /api/chat                 Streaming Gemini chat (SSE)
├── POST /api/health-brief         Streaming daily health summary (SSE)
├── POST /api/doctor-reply         Streaming AI reply as Dr. Chen (SSE)
├── POST /api/trend-insight        Streaming metric trend analysis (SSE)
├── POST /api/smart-alerts         AI-generated health alerts (JSON)
├── POST /api/scan-report          Gemini vision — extract lab values from image (JSON)
├── POST /api/visit-prep           Streaming pre-visit AI prep summary (SSE)
├── POST /api/med-info             Streaming AI medication explainer (SSE)
├── POST /api/refill-request       AI-drafted prescription refill message (JSON)
├── POST /api/appointment-request  AI-drafted appointment request message (JSON)
└── POST /api/suggest-goals        AI-generated health goals (JSON)
├── GET  /api/chat-history         Load persisted chat (Supabase + Clerk required)
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
