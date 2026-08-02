import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Send, Sparkles, Bot, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { LabReport, Medication } from '../types';
import { buildPatientContext } from '../lib/buildPatientContext';
import { PATIENT_INFO } from '../data/mockData';

const clerkEnabled = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const supabaseEnabled = !!(import.meta.env.VITE_SUPABASE_URL);

/**
 * Safe hook wrapper — useAuth() must always be called (rules of hooks),
 * but its result is only used when Clerk is configured.
 */
function useClerkToken(): () => Promise<string | null> {
  const { getToken } = useAuth();
  if (!clerkEnabled) return async () => null;
  return getToken;
}

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
  medications?: Medication[];
  historicalTrends?: unknown[];
}

const SUGGESTED_QUESTIONS = [
  'What does my latest result mean?',
  'Are any of my results concerning?',
  'What tests am I missing?',
  'How can I improve my numbers?',
  'What should I ask my doctor next visit?',
];

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: `Hi ${PATIENT_INFO.name.split(' ')[0]}! I'm your AI health assistant. I have access to your lab results, appointments, medications, and doctor messages. Ask me anything about your health data.`,
};

// localStorage helpers (fallback when Supabase is not configured)
const storageKey = (rId: string | null) => `careconnect_chat_${rId ?? 'global'}`;

function loadFromStorage(rId: string | null): ChatMessage[] {
  try {
    const stored = localStorage.getItem(storageKey(rId));
    if (stored) return (JSON.parse(stored) as ChatMessage[]).map((m) => ({ ...m, streaming: false }));
  } catch { /* ignore */ }
  return [WELCOME_MESSAGE];
}

function saveToStorage(rId: string | null, msgs: ChatMessage[]) {
  try {
    localStorage.setItem(storageKey(rId), JSON.stringify(msgs.filter((m) => !m.streaming)));
  } catch { /* ignore */ }
}

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  focusedReport,
  medications,
  historicalTrends,
}) => {
  const reportId = focusedReport?.id ?? null;

  // getToken is a no-op when Clerk is not configured.
  // We call useClerkAuth unconditionally and ignore it when not needed.
  const getToken = useClerkToken();

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeReportIdRef = useRef<string | null>(reportId);

  useEffect(() => {
    if (!isOpen) return;
    const incomingId = focusedReport?.id ?? null;
    if (activeReportIdRef.current !== incomingId) {
      activeReportIdRef.current = incomingId;
      setInput('');
      loadHistory(incomingId);
    }
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [isOpen, focusedReport]);

  useEffect(() => {
    if (messages.length > 0 && !supabaseEnabled) {
      saveToStorage(activeReportIdRef.current, messages);
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadHistory(rId: string | null) {
    if (supabaseEnabled) {
      setLoadingHistory(true);
      try {
        const token = await getToken();
        const url = rId ? `/api/chat-history?reportId=${rId}` : '/api/chat-history';
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const { messages: rows } = (await res.json()) as {
          messages: { id: string; role: 'user' | 'assistant'; text: string }[];
        };
        setMessages(rows.length > 0 ? [WELCOME_MESSAGE, ...rows] : [WELCOME_MESSAGE]);
      } catch {
        setMessages([WELCOME_MESSAGE]);
      } finally {
        setLoadingHistory(false);
      }
    } else {
      setMessages(loadFromStorage(rId));
    }
  }

  async function persistTurn(role: 'user' | 'assistant', text: string) {
    if (!supabaseEnabled) return;
    try {
      const token = await getToken();
      await fetch('/api/chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role, text, contextReportId: activeReportIdRef.current }),
      });
    } catch { /* non-fatal */ }
  }

  async function clearHistory() {
    if (supabaseEnabled) {
      try {
        const token = await getToken();
        const rId = activeReportIdRef.current;
        const url = rId ? `/api/chat-history?reportId=${rId}` : '/api/chat-history';
        await fetch(url, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch { /* non-fatal */ }
    } else {
      saveToStorage(activeReportIdRef.current, [WELCOME_MESSAGE]);
    }
    setMessages([WELCOME_MESSAGE]);
    setConfirmClear(false);
  }

  if (!isOpen) return null;

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text };
    const asstId = `a-${Date.now() + 1}`;

    setMessages((prev) => [...prev, userMsg, { id: asstId, role: 'assistant', text: '', streaming: true }]);
    setInput('');
    setLoading(true);
    persistTurn('user', text);

    const history = [...messages, userMsg]
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model', text: m.text }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          patientContext: buildPatientContext(focusedReport ?? undefined, medications, historicalTrends),
        }),
      });
      if (!res.body) throw new Error('No response stream received.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload) as { text?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) => prev.map((m) => (m.id === asstId ? { ...m, text: accumulated } : m)));
            }
          } catch { /* partial chunk */ }
        }
      }
      persistTurn('assistant', accumulated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setMessages((prev) => prev.map((m) => m.id === asstId ? { ...m, text: `Sorry, I ran into a problem: ${msg}`, streaming: false } : m));
    } finally {
      setMessages((prev) => prev.map((m) => (m.id === asstId ? { ...m, streaming: false } : m)));
      setLoading(false);
    }
  };

  const showSuggestions = messages.length <= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full sm:max-w-lg h-[88vh] sm:h-[620px] rounded-t-3xl sm:rounded-2xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between bg-primary-container/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-on-primary" />
            </div>
            <div>
              <p className="font-bold text-sm text-on-surface">AI Health Assistant</p>
              <p className="text-[11px] text-on-surface-variant">
                {focusedReport ? `Context: ${focusedReport.title}` : 'Full health record access'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {confirmClear ? (
              <div className="flex items-center gap-1.5 bg-error/10 rounded-full px-2 py-1">
                <span className="text-[10px] text-error font-medium">Clear chat?</span>
                <button onClick={clearHistory} className="text-[10px] font-bold text-error hover:underline">Yes</button>
                <button onClick={() => setConfirmClear(false)} className="text-[10px] text-on-surface-variant hover:underline">No</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                disabled={messages.length <= 1}
                className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors disabled:opacity-30"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loadingHistory ? (
            <div className="flex justify-center pt-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-on-primary" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-on-primary rounded-tr-sm whitespace-pre-wrap'
                    : 'bg-surface-container text-on-surface rounded-tl-sm'
                }`}>
                  {msg.role === 'user' ? msg.text : msg.text ? (
                    <ReactMarkdown components={{
                      h3: ({ children }) => <p className="font-bold text-xs mt-3 mb-1 text-on-surface">{children}</p>,
                      h2: ({ children }) => <p className="font-bold text-xs mt-3 mb-1 text-on-surface">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-on-surface">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc list-outside ml-4 space-y-0.5 my-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-outside ml-4 space-y-0.5 my-1">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                      hr: () => <hr className="my-2 border-outline-variant/40" />,
                      em: ({ children }) => <em className="italic text-on-surface-variant">{children}</em>,
                    }}>
                      {msg.text}
                    </ReactMarkdown>
                  ) : msg.streaming ? (
                    <span className="inline-flex gap-1 py-0.5">
                      {[0, 150, 300].map((delay) => (
                        <span key={delay} className="w-1.5 h-1.5 bg-on-surface-variant/40 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                      ))}
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions */}
        {showSuggestions && !loadingHistory && (
          <div className="px-4 pb-2 shrink-0">
            <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Try asking</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button key={q} onClick={() => send(q)} disabled={loading}
                  className="text-[10px] px-2.5 py-1.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary/20 border border-outline-variant/40 transition-colors disabled:opacity-50">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="px-4 py-1.5 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant bg-surface-container rounded-lg px-2.5 py-1.5">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Educational AI — not a substitute for professional medical advice.</span>
          </div>
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="p-3 border-t border-outline-variant flex items-end gap-2 shrink-0">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Ask about your health results… (Enter to send)"
            rows={1}
            className="flex-1 resize-none text-xs p-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-24"
          />
          <button type="submit" disabled={!input.trim() || loading}
            className="p-3 bg-primary text-on-primary rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
