import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.API_PORT ?? 3001;

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

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = ai.chats.create({
      model: 'gemini-2.0-flash',
      config: { systemInstruction: SYSTEM_INSTRUCTION(patientContext) },
      history,
    });

    const stream = await chat.sendMessageStream({ message: lastMessage.text });

    for await (const chunk of stream) {
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

app.listen(PORT, () => {
  console.log(`CareConnect AI server running on port ${PORT}`);
});
