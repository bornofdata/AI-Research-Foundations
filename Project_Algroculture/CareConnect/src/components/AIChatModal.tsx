import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, AlertCircle } from 'lucide-react';
import { LabReport } from '../types';
import { buildPatientContext } from '../lib/buildPatientContext';
import { PATIENT_INFO } from '../data/mockData';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  focusedReport?: LabReport | null;
}

const SUGGESTED_QUESTIONS = [
  'What does my latest result mean?',
  'Are any of my results concerning?',
  'What tests am I missing?',
  'How can I improve my numbers?',
  'What should I ask my doctor next visit?',
];

const WELCOME_TEXT = `Hi ${PATIENT_INFO.name.split(' ')[0]}! I'm your AI health assistant. I have access to your lab results, appointments, and doctor messages. Ask me anything about your health data.`;

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  focusedReport,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setMessages([{ id: 'welcome', role: 'assistant', text: WELCOME_TEXT }]);
      setInput('');
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
      setMessages([]);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text };
    const asstId = `a-${Date.now() + 1}`;

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: asstId, role: 'assistant', text: '', streaming: true },
    ]);
    setInput('');
    setLoading(true);

    // Build history for server: skip the welcome message, map roles
    const history = [...messages, userMsg]
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
        text: m.text,
      }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          patientContext: buildPatientContext(focusedReport ?? undefined),
        }),
      });

      if (!res.body) throw new Error('No response stream received.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload) as { text?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === asstId ? { ...m, text: accumulated } : m
                )
              );
            }
          } catch {
            // Partial JSON in chunk — ignore and wait for next chunk
          }
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstId
            ? { ...m, text: `Sorry, I ran into a problem: ${msg}`, streaming: false }
            : m
        )
      );
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === asstId ? { ...m, streaming: false } : m))
      );
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const showSuggestions = messages.length <= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full sm:max-w-lg h-[88vh] sm:h-[620px] rounded-t-3xl sm:rounded-2xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between bg-primary-container/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-on-primary" />
            </div>
            <div>
              <p className="font-bold text-sm text-on-surface">AI Health Assistant</p>
              <p className="text-[11px] text-on-surface-variant">
                {focusedReport
                  ? `Context: ${focusedReport.title}`
                  : 'Full health record access'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Messages ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-on-primary" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-on-primary rounded-tr-sm'
                    : 'bg-surface-container text-on-surface rounded-tl-sm'
                }`}
              >
                {msg.text ||
                  (msg.streaming && (
                    <span className="inline-flex gap-1 py-0.5">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="w-1.5 h-1.5 bg-on-surface-variant/40 rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </span>
                  ))}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* ── Suggested questions ─────────────────────────────────────────── */}
        {showSuggestions && (
          <div className="px-4 pb-2 shrink-0">
            <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
              Try asking
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={loading}
                  className="text-[10px] px-2.5 py-1.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary/20 border border-outline-variant/40 transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Disclaimer ──────────────────────────────────────────────────── */}
        <div className="px-4 py-1.5 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant bg-surface-container rounded-lg px-2.5 py-1.5">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Educational AI — not a substitute for professional medical advice.</span>
          </div>
        </div>

        {/* ── Input ───────────────────────────────────────────────────────── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="p-3 border-t border-outline-variant flex items-end gap-2 shrink-0"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your health results… (Enter to send)"
            rows={1}
            className="flex-1 resize-none text-xs p-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-24"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 bg-primary text-on-primary rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
