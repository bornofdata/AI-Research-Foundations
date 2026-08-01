# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Start Vite dev server (http://localhost:3000)
npm run dev

# Start Express AI server (port 3001) — required for AI chat to work
npm run server

# Type-check only (no emit)
npm run lint

# Production build
npm build

# Preview production build
npm preview

# Remove dist/ and server.js
npm run clean
```

**Setup:** Create `.env.local` with `GEMINI_API_KEY=<your-api-key>` before running.

**Development:** Run `npm run dev` and `npm run server` in two separate terminals. Vite proxies all `/api` requests to the Express server on port 3001.

## Architecture

**CareConnect** is a mobile-first patient health portal (React 19 + TypeScript + Vite + Tailwind CSS 4).

### State & Routing

All state lives in `src/App.tsx` — there is no router. Tab switching is done via `activeTab` state; modals are toggled via boolean state flags. Both are passed down as props.

### Component Structure

```
App.tsx (state hub)
├── Header.tsx           — top bar with notifications bell
├── [active tab]
│   ├── HomeTab.tsx      — dashboard
│   ├── HealthTab.tsx    — lab results list
│   ├── VisitsTab.tsx    — appointments
│   ├── InboxTab.tsx     — doctor-patient messages
│   └── MoreTab.tsx      — profile & settings
├── [modals, conditionally rendered]
│   ├── NotificationsModal.tsx
│   ├── PdfReportModal.tsx
│   ├── TrendAnalysisModal.tsx
│   └── AskFollowUpModal.tsx
└── BottomNav.tsx        — 5-tab navigation
```

### Data

All data comes from `src/data/mockData.ts` — no real backend. The `@google/genai` package is installed but AI features are not yet wired up; the intent is Gemini-powered insights (trend analysis, lab summaries, follow-up drafting).

### Types

Centralized in `src/types.ts`. Key interfaces: `LabReport`, `TestParameter`, `Appointment`, `Message`, `NotificationItem`.

### AI System

```
server.ts                       Express server, port 3001
  └── POST /api/chat            Gemini 2.0 Flash streaming endpoint (SSE)
src/lib/buildPatientContext.ts  Serialises all mock patient data into a
                                structured prompt string for Gemini
src/components/AIChatModal.tsx  Streaming chat UI, reads SSE from /api/chat
```

The AI system uses Gemini's large context window instead of a vector database — all patient data is injected into the system prompt on every request. This is fine for a single-patient MVP; at scale, swap `buildPatientContext` for a vector-retrieval call without changing any other code.

The system prompt instructs Gemini to:
- Explain results in plain language
- Cross-reference across reports and historical trends
- Prefix flags with `⚠️ Worth noting:` and test suggestions with `💡 Consider asking about:`
- Always close with a medical disclaimer

### Styling

Material Design 3 color tokens are defined as CSS custom properties in `src/index.css` and consumed via Tailwind's `theme()` function. Add new design tokens there, not inline.

### Vite/HMR note

When `DISABLE_HMR=true`, file watching and HMR are disabled (used by AI Studio to prevent flickering during agent edits). Don't rely on HMR being active in all environments.
