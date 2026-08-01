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

---

## Production Roadmap

### Must-haves before any real patient uses this

**1. Authentication & identity**
Right now there's no login — anyone with the URL sees Sarah's data. Auth0 or Clerk handles auth, with each patient seeing only their own records. Non-negotiable before sharing with anyone outside your local network.

**2. Real backend + database**
All data is mock JSON. A PostgreSQL database with row-level security ensures patient A can never query patient B's records, even if something goes wrong at the app layer.

**3. HTTPS everywhere**
The app runs over HTTP. Phones on the same Wi-Fi can see the traffic. Before any real data touches the app, it needs TLS — add a reverse proxy (Caddy or Nginx) or deploy to Vercel/Railway which include HTTPS automatically.

**4. HIPAA compliance**
For any US deployment handling real health data:
- A Business Associate Agreement (BAA) with Google — use Vertex AI, not AI Studio
- Audit logs of who accessed what and when
- Data encryption at rest

---

### Features that make it a real product

**5. Multi-patient support + doctor dashboard**
A physician view where Dr. Chen can see all her patients, flag results, and respond to AI-surfaced concerns. Without this it's a one-sided tool.

**6. Real lab data ingestion**
Labs send results via HL7 FHIR (the standard healthcare data format). A FHIR API connector ingests results automatically from Quest, LabCorp, etc. — no manual data entry.

**7. Push notifications**
When a new result arrives, the patient should get a push notification on their phone. Requires a service worker (PWA push) or a native app wrapper.

**8. Server-side chat history**
localStorage only persists on one device. A patient switching from phone to desktop loses their chat. Conversations need to live server-side, tied to the patient's account.

**9. Doctor-in-the-loop on AI flags**
When the AI flags something with ⚠️, that flag should optionally surface to Dr. Chen — not be buried in the patient's chat. A simple review queue: "AI flagged 3 concerns from Sarah's results this week."

**10. Medication context**
No medications are in the current data model. Adding a medications list to the patient profile lets the AI warn about drug interactions and explain results that are caused by medications — dramatically improving its usefulness.

---

### Scalability (technical)

**11. Move from full-context injection to RAG**
Right now the entire patient record goes into every Gemini prompt. For a patient with years of records and dozens of lab reports, this becomes expensive and hits context limits. The fix is a vector database (pgvector in PostgreSQL, or Pinecone) — embed the patient's records and retrieve only relevant chunks per question.

**12. Rate limiting & cost controls**
One patient asking hundreds of questions in a session can run up a large API bill. The Express server needs per-user rate limiting and a token budget per day.

**13. Semantic caching**
Questions like "what does A1C measure?" have the same answer for every patient. A semantic cache (store embeddings of past questions, return cached answers for similar ones) can cut AI costs by 30–50%.

---

### Recommended order of implementation

| Priority | What |
|---|---|
| 1 | Auth + HTTPS — before sharing with anyone outside your network |
| 2 | Real database + multi-patient support |
| 3 | Server-side chat history |
| 4 | Medication context in the AI |
| 5 | Push notifications |
| 6 | FHIR ingestion |
| 7 | Doctor dashboard |
| 8 | RAG (when you have enough real patient data to need it) |
| 9 | HIPAA / BAA (when onboarding real patients) |

The first three are pure infrastructure. The rest are product features that can be built incrementally. The architecture — one context builder function, one server endpoint, one chat component — is designed to accommodate all of these without rewriting anything major.
