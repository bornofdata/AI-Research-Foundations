import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, RefreshCw } from 'lucide-react';

interface AIHealthBriefProps {
  patientContext: string;
}

const CACHE_KEY = 'careconnect_health_brief';
const CACHE_DATE_KEY = 'careconnect_health_brief_date';

export const AIHealthBrief: React.FC<AIHealthBriefProps> = ({ patientContext }) => {
  const [brief, setBrief] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const today = new Date().toISOString().split('T')[0];
    const cachedDate = sessionStorage.getItem(CACHE_DATE_KEY);
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached && cachedDate === today) {
      setBrief(cached);
      return;
    }

    fetchBrief();
  }, []);

  async function fetchBrief() {
    setLoading(true);
    setError(null);
    setBrief('');

    try {
      const res = await fetch('/api/health-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientContext }),
      });

      if (!res.body) throw new Error('No stream received.');

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
              setBrief(accumulated);
            }
          } catch { /* partial chunk */ }
        }
      }

      const today = new Date().toISOString().split('T')[0];
      sessionStorage.setItem(CACHE_KEY, accumulated);
      sessionStorage.setItem(CACHE_DATE_KEY, today);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate brief.');
    } finally {
      setLoading(false);
    }
  }

  function refresh() {
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(CACHE_DATE_KEY);
    hasFetched.current = false;
    fetchBrief();
  }

  return (
    <div className="p-4 bg-secondary-container/40 rounded-2xl border border-secondary-fixed space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-on-secondary-container flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-secondary" /> AI Health Brief
        </p>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1 text-on-surface-variant hover:text-secondary transition-colors disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !brief && (
        <div className="flex items-center gap-2 text-xs text-on-surface-variant py-1">
          <div className="w-3 h-3 border border-secondary border-t-transparent rounded-full animate-spin shrink-0" />
          Generating your health brief…
        </div>
      )}

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      {brief && (
        <div className="text-xs text-on-secondary-container leading-relaxed">
          <ReactMarkdown components={{
            ul: ({ children }) => <ul className="list-disc list-outside ml-4 space-y-1">{children}</ul>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
          }}>
            {brief}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};
