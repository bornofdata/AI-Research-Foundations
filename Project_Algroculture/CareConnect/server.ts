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
