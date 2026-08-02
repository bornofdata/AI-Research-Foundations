import React, { useState, useEffect, useRef } from 'react';
import { Leaf, RefreshCw } from 'lucide-react';

interface LifestyleTipsProps {
  patientContext: string;
}

const CACHE_KEY = 'careconnect_lifestyle_tips';

type TabKey = 'diet' | 'exercise' | 'sleep' | 'supplements';

const TABS: { key: TabKey; label: string; dot: string; text: string }[] = [
  { key: 'diet', label: 'Diet', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  { key: 'exercise', label: 'Exercise', dot: 'bg-blue-500', text: 'text-blue-600' },
  { key: 'sleep', label: 'Sleep', dot: 'bg-purple-500', text: 'text-purple-600' },
  { key: 'supplements', label: 'Supplements', dot: 'bg-amber-500', text: 'text-amber-600' },
];

function parseSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const matches = content.matchAll(/## [^\n]*\n([\s\S]*?)(?=## |$)/g);
  const keys = ['diet', 'exercise', 'sleep', 'supplements'];
  let i = 0;
  for (const match of matches) {
    if (keys[i]) sections[keys[i]] = match[1].trim();
    i++;
  }
  return sections;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export const LifestyleTips: React.FC<LifestyleTipsProps> = ({ patientContext }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('diet');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const today = getTodayString();
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as { date: string; content: string };
        if (cached.date === today && cached.content) {
          setContent(cached.content);
          return;
        }
      } catch { /* invalid cache — fall through to fetch */ }
    }

    fetchTips();
  }, []);

  async function fetchTips() {
    setLoading(true);
    setError(null);
    setContent('');

    try {
      const res = await fetch('/api/lifestyle-tips', {
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
              setContent(accumulated);
            }
          } catch { /* partial chunk — ignore */ }
        }
      }

      const today = getTodayString();
      localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, content: accumulated }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate recommendations.');
    } finally {
      setLoading(false);
    }
  }

  function refresh() {
    localStorage.removeItem(CACHE_KEY);
    hasFetched.current = false;
    fetchTips();
  }

  const sections = parseSections(content);
  const activeTabMeta = TABS.find((t) => t.key === activeTab)!;
  const sectionContent = sections[activeTab] ?? '';

  // Parse bullet lines from the section text
  const bullets = sectionContent
    .split('\n')
    .filter((line) => line.trim().startsWith('- '))
    .map((line) => line.trim().slice(2).trim());

  const sectionReady = !!sectionContent;
  const isStreaming = loading && !!content;

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-outline-variant/40">
        <p className="text-sm font-bold text-on-surface flex items-center gap-1.5">
          <Leaf className="w-4 h-4 text-emerald-500" />
          Nutrition &amp; Lifestyle
        </p>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40"
          title="Refresh recommendations"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-outline-variant/30">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={
              activeTab === tab.key
                ? 'bg-primary text-on-primary rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap shrink-0 transition-all'
                : 'text-on-surface-variant text-xs px-3 py-1 whitespace-nowrap shrink-0 hover:text-on-surface transition-colors'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="px-4 py-3 min-h-[120px]">
        {/* Error state */}
        {error && !content && (
          <p className="text-xs text-error">{error}</p>
        )}

        {/* Loading skeleton — shown only when no content at all yet */}
        {loading && !content && (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-surface-container rounded w-full" />
            <div className="h-3 bg-surface-container rounded w-5/6" />
            <div className="h-3 bg-surface-container rounded w-4/6" />
          </div>
        )}

        {/* Content: either streaming partial or fully loaded */}
        {content && (
          <>
            {/* Section not yet streamed in */}
            {!sectionReady && (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-surface-container rounded w-full" />
                <div className="h-3 bg-surface-container rounded w-5/6" />
                <div className="h-3 bg-surface-container rounded w-4/6" />
              </div>
            )}

            {/* Section content */}
            {sectionReady && bullets.length > 0 && (
              <ul className="space-y-0">
                {bullets.map((bullet, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-on-surface leading-relaxed py-1.5 border-b border-outline-variant/30 last:border-0 flex gap-2"
                  >
                    <span
                      className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${activeTabMeta.dot}`}
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
                {/* Streaming indicator while more content arrives */}
                {isStreaming && (
                  <li className="flex items-center gap-2 py-1.5 text-xs text-on-surface-variant">
                    <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                    Generating more…
                  </li>
                )}
              </ul>
            )}

            {/* Section exists but no bullets parsed yet (heading appeared, body still streaming) */}
            {sectionReady && bullets.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-on-surface-variant py-1">
                <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                Generating recommendations…
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
