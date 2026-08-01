# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

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

### Styling

Material Design 3 color tokens are defined as CSS custom properties in `src/index.css` and consumed via Tailwind's `theme()` function. Add new design tokens there, not inline.

### Vite/HMR note

When `DISABLE_HMR=true`, file watching and HMR are disabled (used by AI Studio to prevent flickering during agent edits). Don't rely on HMR being active in all environments.
