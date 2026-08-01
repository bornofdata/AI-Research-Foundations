import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env.local first (takes precedence), then fall back to .env
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.API_PORT ?? 3001;
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-flash-latest';

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

const SYSTEM_INSTRUCTION = (patientContext: string) => `\
You are an empathetic and knowledgeable medical AI assistant embedded in CareConnect, a secure patient health portal.

You have been given the patient's complete health record below. Use it as your primary source of truth.

${patientContext}

YOUR ROLE AND GUIDELINES:
1. EXPLAIN: Describe what each test measures, what the patient's specific values mean, and the significance of being in or out of range — in plain, accessible language. Avoid unexplained medical jargon.
2. CONTEXTUALIZE: Cross-reference results across reports and trends when relevant (e.g., glucose + A1C together tell a richer story than either alone).
3. FLAG: If you notice anything potentially concerning that the physician's notes did not address, state it clearly with a "⚠️ Worth noting:" prefix.
4. SUGGEST: If follow-up tests would meaningfully complete the patient's health picture, recommend them with a "💡 Consider asking about:" prefix.
5. EMPOWER: Help the patient formulate sharper questions to raise with their doctor.
6. DISCLAIM: End every response with a one-sentence reminder that this is educational and they should confirm decisions with their physician.

Keep responses clear and compassionate. Use bullet points or short paragraphs. Never diagnose.`;

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

    // Build full contents array: system instruction as first user turn (compatible
    // with all model versions), then the conversation history, then the latest message.
    const systemTurn = {
      role: 'user' as const,
      parts: [{ text: `SYSTEM INSTRUCTIONS:\n${SYSTEM_INSTRUCTION(patientContext)}\n\nAcknowledge that you understand and are ready to help.` }],
    };
    const systemAck = {
      role: 'model' as const,
      parts: [{ text: "Understood. I'm ready to help Sarah with her health questions based on her complete health record." }],
    };

    const conversationTurns = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const contents = [systemTurn, systemAck, ...conversationTurns];

    const response = await ai.models.generateContentStream({
      model: MODEL,
      contents,
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
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

app.listen(PORT, () => {
  console.log(`CareConnect AI server running on port ${PORT} using ${MODEL}`);
});
