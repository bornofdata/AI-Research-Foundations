import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { createClerkClient, verifyToken } from '@clerk/express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.API_PORT ?? 3001;
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-flash-latest';

// ── Clients (lazy — only used when env vars are present) ──────
const clerkEnabled = !!(process.env.CLERK_SECRET_KEY);
const supabaseEnabled = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

const clerk = clerkEnabled
  ? createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
  : null;

// Service-role client bypasses RLS — safe only on the server
const supabase = supabaseEnabled
  ? createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  : null;

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

// ── Auth middleware ────────────────────────────────────────────
async function getPatientId(authHeader: string | undefined): Promise<string | null> {
  if (!process.env.CLERK_SECRET_KEY || !authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

// ── System prompt ─────────────────────────────────────────────
const SYSTEM_INSTRUCTION = (patientContext: string) => `\
You are an empathetic and knowledgeable medical AI assistant embedded in CareConnect, a secure patient health portal.

You have been given the patient's complete health record below. Use it as your primary source of truth.

${patientContext}

YOUR ROLE AND GUIDELINES:
1. EXPLAIN: Describe what each test measures, what the patient's specific values mean, and the significance of being in or out of range — in plain, accessible language. Avoid unexplained medical jargon.
2. CONTEXTUALIZE: Cross-reference results across reports, medications, and trends when relevant.
3. FLAG: If you notice anything potentially concerning that the physician's notes did not address, state it clearly with a "⚠️ Worth noting:" prefix.
4. SUGGEST: If follow-up tests would meaningfully complete the patient's health picture, recommend them with a "💡 Consider asking about:" prefix.
5. EMPOWER: Help the patient formulate sharper questions to raise with their doctor.
6. DISCLAIM: End every response with a one-sentence reminder that this is educational and they should confirm decisions with their physician.

Keep responses clear and compassionate. Use bullet points or short paragraphs. Never diagnose.`;

// ── POST /api/chat ────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages, patientContext } = req.body as {
    messages: ChatTurn[];
    patientContext: string;
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemTurn = {
      role: 'user' as const,
      parts: [{ text: `SYSTEM INSTRUCTIONS:\n${SYSTEM_INSTRUCTION(patientContext)}\n\nAcknowledge that you understand and are ready to help.` }],
    };
    const systemAck = {
      role: 'model' as const,
      parts: [{ text: "Understood. I'm ready to help with your health questions based on your complete health record." }],
    };
    const conversationTurns = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContentStream({
      model: MODEL,
      contents: [systemTurn, systemAck, ...conversationTurns],
    });

    let fullText = '';
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

// ── POST /api/health-brief ───────────────────────────────────
// Generate a concise AI health summary for the home screen.
app.post('/api/health-brief', async (req, res) => {
  const { patientContext } = req.body as { patientContext: string };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContentStream({
      model: MODEL,
      contents: [{
        role: 'user',
        parts: [{ text: `You are a health summary generator for a patient portal. Based on the patient's health record below, write a concise daily health brief with exactly 3 bullet points.

Rules:
- Bullet 1: Something going well — cite a specific lab value or metric.
- Bullet 2: One thing to gently watch or a mild trend worth noting.
- Bullet 3: A specific, actionable wellness tip grounded in their actual data.
- Keep each bullet to 1 sentence, under 25 words.
- Use plain, warm language — no medical jargon.
- Output only the 3 bullets, no headings, no preamble, no sign-off.

PATIENT RECORD:
${patientContext}` }],
      }],
    });

    for await (const chunk of response) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

// ── POST /api/doctor-reply ────────────────────────────────────
// Generate an AI reply from Dr. Emily Chen based on patient message + context.
app.post('/api/doctor-reply', async (req, res) => {
  const { patientMessage, patientContext } = req.body as {
    patientMessage: string;
    patientContext: string;
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'No API key.' }); return; }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContentStream({
      model: MODEL,
      contents: [{
        role: 'user',
        parts: [{ text: `You are Dr. Emily Chen, the patient's Primary Physician. The patient has sent you a message through their health portal.

Patient health record for context:
${patientContext}

Patient's message: "${patientMessage}"

Reply as Dr. Chen — warm, professional, and specific to their actual health data when relevant. Keep the reply to 2-3 sentences. End with a short encouraging note or next step. Do not introduce yourself.` }],
      }],
    });

    for await (const chunk of response) {
      if (chunk.text) res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error.';
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

// ── POST /api/trend-insight ───────────────────────────────────
// Generate an AI interpretation of a specific lab metric trend.
app.post('/api/trend-insight', async (req, res) => {
  const { metricName, unit, referenceRange, dataPoints } = req.body as {
    metricName: string;
    unit: string;
    referenceRange: string;
    dataPoints: { date: string; value: number }[];
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'No API key.' }); return; }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const ai = new GoogleGenAI({ apiKey });
    const series = dataPoints.map((p) => `${p.date}: ${p.value} ${unit}`).join(', ');

    const response = await ai.models.generateContentStream({
      model: MODEL,
      contents: [{
        role: 'user',
        parts: [{ text: `Analyze this lab metric trend and write one concise clinical insight (2 sentences max). Be specific about the direction of the trend, what it means, and one actionable takeaway. Use plain language — no jargon.

Metric: ${metricName}
Reference range: ${referenceRange}
Historical readings (oldest → newest): ${series}` }],
      }],
    });

    for await (const chunk of response) {
      if (chunk.text) res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error.';
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

// ── POST /api/smart-alerts ────────────────────────────────────
// Generate 2-3 AI-powered health alerts from the patient's record.
app.post('/api/smart-alerts', async (req, res) => {
  const { patientContext } = req.body as { patientContext: string };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.json({ alerts: [] }); return; }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{
        role: 'user',
        parts: [{ text: `Based on this patient's health record, generate exactly 2 personalized health alerts for their notification feed. Be specific to their actual values — avoid generic advice. Do not repeat what the physician already noted.

Return ONLY a valid JSON array — no markdown, no code fences:
[{"title":"...","description":"...","type":"lab"}]

Valid types: "lab", "appointment", "message"
Keep each description under 18 words and make it actionable.

PATIENT RECORD:
${patientContext}` }],
      }],
    });

    const raw = response.text ?? '[]';
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const alerts = JSON.parse(cleaned) as Array<{ title: string; description: string; type: string }>;
    res.json({ alerts });
  } catch {
    res.json({ alerts: [] });
  }
});

// ── POST /api/scan-report ─────────────────────────────────────
// Extract lab values from an uploaded image using Gemini vision.
app.post('/api/scan-report', async (req, res) => {
  const { imageBase64, mimeType } = req.body as {
    imageBase64: string;
    mimeType: string;
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'No API key.' }); return; }
  if (!imageBase64 || !mimeType) { res.status(400).json({ error: 'imageBase64 and mimeType are required.' }); return; }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: { mimeType, data: imageBase64 },
          },
          {
            text: `Extract all lab test results from this image.

Return ONLY valid JSON — no markdown, no code fences:
{
  "title": "report name (e.g. Comprehensive Metabolic Panel)",
  "date": "date string as shown on report or 'Unknown'",
  "labLocation": "lab name if visible or 'Unknown Lab'",
  "parameters": [
    {
      "name": "test name",
      "value": "numeric or string value",
      "unit": "unit (e.g. mg/dL)",
      "referenceRange": "low-high range as shown or ''",
      "status": "normal|high|low|optimal|review",
      "statusLabel": "Normal|High|Low|Optimal|Review"
    }
  ]
}

If a value is outside the reference range, mark it as "high" or "low". If clearly within range, use "normal" or "optimal". If borderline, use "review". Extract every individual test result shown.`,
          },
        ],
      }],
    });

    const raw = response.text ?? '{}';
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned);
    res.json({ report: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Extraction failed.';
    res.status(500).json({ error: message });
  }
});

// ── POST /api/visit-prep ──────────────────────────────────────
// Generate a pre-visit AI summary for an upcoming appointment.
app.post('/api/visit-prep', async (req, res) => {
  const { patientContext, appointmentType, doctorName } = req.body as {
    patientContext: string;
    appointmentType: string;
    doctorName: string;
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'No API key.' }); return; }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContentStream({
      model: MODEL,
      contents: [{
        role: 'user',
        parts: [{ text: `You are helping a patient prepare for their upcoming "${appointmentType}" appointment with ${doctorName}.

Based on their health record below, generate a concise pre-visit preparation summary with these exact sections:

**Health Since Last Visit**
(2-3 bullets on notable changes or trends in their lab values)

**Current Medications**
(bullet list of active medications — name and dosage only)

**Questions to Ask ${doctorName}**
(3-4 specific, intelligent questions based on their actual data)

**What to Bring**
(2-3 practical items — insurance card, list of symptoms, specific report, etc.)

Keep it focused and useful. Use plain language.

PATIENT RECORD:
${patientContext}` }],
      }],
    });

    for await (const chunk of response) {
      if (chunk.text) res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error.';
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

// ── POST /api/med-info ────────────────────────────────────────
// Stream an AI explanation of a specific medication for the patient.
app.post('/api/med-info', async (req, res) => {
  const { medicationName, dosage, patientContext } = req.body as {
    medicationName: string;
    dosage: string;
    patientContext: string;
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'No API key.' }); return; }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContentStream({
      model: MODEL,
      contents: [{
        role: 'user',
        parts: [{ text: `You are a clinical pharmacist assistant. The patient is asking about their prescribed medication.
Provide a clear, plain-language explanation structured with these exact markdown headings:
## What it's for
## How it works
## Common side effects
## What to watch for
## Tips for taking it

Keep each section 2-3 sentences. Cross-reference the patient's health data where relevant (e.g., if they're pre-diabetic and taking metformin, mention the glucose connection). Always end with:
*This information is for educational purposes only. Always follow your doctor's instructions.*

Explain ${medicationName} ${dosage} for this patient: ${patientContext}` }],
      }],
    });

    for await (const chunk of response) {
      if (chunk.text) res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error.';
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

// ── POST /api/suggest-goals ───────────────────────────────────
// Generate 3 personalized health goals from the patient's record.
app.post('/api/suggest-goals', async (req, res) => {
  const { patientContext } = req.body as { patientContext: string };
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.json({ goals: [] }); return; }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{
        role: 'user',
        parts: [{ text: `Based on this patient's health record, suggest exactly 3 achievable, specific health goals for the next 3 months. Each goal must be directly tied to a value in their record.

Return ONLY valid JSON — no markdown, no code fences:
[{"goal":"...","reason":"...","metric":"..."}]

- "goal": short action statement under 10 words (e.g. "Keep fasting glucose below 95 mg/dL")
- "reason": one sentence explaining why, referencing their actual value
- "metric": the lab test or measure it tracks (e.g. "Fasting Glucose")

PATIENT RECORD:
${patientContext}` }],
      }],
    });

    const raw = response.text ?? '[]';
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    res.json({ goals: JSON.parse(cleaned) });
  } catch {
    res.json({ goals: [] });
  }
});

// ── GET /api/chat-history ─────────────────────────────────────
// Load persisted chat history for the authenticated patient.
app.get('/api/chat-history', async (req, res) => {
  if (!supabase) { res.json({ messages: [] }); return; }

  const patientId = await getPatientId(req.headers.authorization);
  if (!patientId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const contextReportId = (req.query.reportId as string) || null;

  const query = supabase
    .from('chat_history')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: true });

  if (contextReportId) {
    query.eq('context_report_id', contextReportId);
  } else {
    query.is('context_report_id', null);
  }

  const { data, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }

  res.json({ messages: data ?? [] });
});

// ── POST /api/chat-history ────────────────────────────────────
// Save a chat turn (called after each user message + assistant reply).
app.post('/api/chat-history', async (req, res) => {
  if (!supabase) { res.json({ ok: true }); return; }

  const patientId = await getPatientId(req.headers.authorization);
  if (!patientId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { role, text, contextReportId } = req.body as {
    role: 'user' | 'assistant';
    text: string;
    contextReportId?: string | null;
  };

  const { error } = await supabase.from('chat_history').insert({
    patient_id: patientId,
    role,
    text,
    context_report_id: contextReportId ?? null,
  });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

// ── DELETE /api/chat-history ──────────────────────────────────
// Clear chat history for a given context.
app.delete('/api/chat-history', async (req, res) => {
  if (!supabase) { res.json({ ok: true }); return; }

  const patientId = await getPatientId(req.headers.authorization);
  if (!patientId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const contextReportId = (req.query.reportId as string) || null;

  const query = supabase
    .from('chat_history')
    .delete()
    .eq('patient_id', patientId);

  if (contextReportId) {
    query.eq('context_report_id', contextReportId);
  } else {
    query.is('context_report_id', null);
  }

  const { error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`CareConnect AI server running on port ${PORT} using ${MODEL}`);
  console.log(`  Auth:     ${clerkEnabled ? 'Clerk enabled' : 'disabled (dev mode)'}`);
  console.log(`  Database: ${supabaseEnabled ? 'Supabase enabled' : 'disabled (localStorage fallback)'}`);
});
