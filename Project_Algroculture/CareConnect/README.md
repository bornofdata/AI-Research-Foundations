<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5f7acbb6-4437-4465-bbc3-577cdf3d81d7

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the Vite dev server and the Express AI server in two separate terminals:
   ```bash
   npm run dev      # http://localhost:3000
   npm run server   # AI server on port 3001
   ```

---

## What Was Built

CareConnect is a patient health portal where patients can ask AI-powered follow-up questions about their lab results, appointments, doctor messages, and health history.

### Files Added / Modified

| File | What it does |
|---|---|
| `server.ts` | Express server on port 3001 with `POST /api/chat`. Calls Gemini 2.0 Flash and streams back SSE chunks. |
| `src/lib/buildPatientContext.ts` | Serialises all patient data (labs + trends + appointments + messages) into a structured prompt string. |
| `src/components/AIChatModal.tsx` | Full streaming chat UI — handles SSE, typing indicator, suggested question chips, and medical disclaimer. |
| `src/App.tsx` | Uses `AIChatModal` for the "Ask AI" flow; adds a global floating AI button visible on all tabs. |
| `src/components/HealthTab.tsx` | "Ask follow-up" button updated to "Ask AI". |
| `vite.config.ts` | Proxies `/api` requests to `http://localhost:3001`. |
| `package.json` | Adds `npm run server` script. |

### AI System Behaviour

The Gemini system prompt instructs the model to:

- Explain lab results in plain, accessible language
- Cross-reference results across multiple reports and historical trends
- Prefix any concerns not addressed by the physician with **⚠️ Worth noting:**
- Suggest missing or complementary tests with **💡 Consider asking about:**
- Always close responses with a medical disclaimer

The AI chat can be opened two ways:
- **From a specific report** — click "Ask AI" under the physician note in the Health tab (the report is passed as focused context)
- **Globally** — tap the floating "Ask AI" button visible on every tab (full patient record as context)

---

## Stack & Scaling

The React + TypeScript frontend is the right long-term choice. The current Express/Node.js AI backend is suitable for MVP. Below is the recommended evolution path for production scale:

| Layer | Current (MVP) | At Scale |
|---|---|---|
| **Frontend** | React + Vite | Same, or Next.js for SSR |
| **AI backend** | Express + Gemini (Node.js) | Python + FastAPI |
| **Patient data** | Mock JSON | PostgreSQL + row-level security |
| **RAG / retrieval** | Full context injected per request | pgvector or Pinecone |
| **Auth** | None | Auth0 / Clerk + HIPAA BAA |

**Why Python for the AI layer at scale:**
- The RAG ecosystem (LangChain, LlamaIndex, sentence-transformers, Haystack) is Python-first
- Medical NLP libraries (spaCy, scispaCy, MedSpaCy) are Python-only
- Vector search, fine-tuning, and embedding pipelines are far easier to build and maintain in Python

**The migration path is smooth** — `src/lib/buildPatientContext.ts` is the only file that touches patient data. When moving to a real backend, replace that one function with an API call and nothing else changes.
