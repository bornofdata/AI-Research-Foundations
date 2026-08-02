import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Copy, Check, RefreshCw, Microscope } from 'lucide-react';
import { LabReport } from '../types';

export interface SecondOpinionModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LabReport | null;
  patientContext: string;
}

// Map section headings to dot colours
function headingDotClass(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('clinical summary')) return 'bg-primary';
  if (t.includes('key findings')) return 'bg-secondary';
  if (t.includes('patterns')) return 'bg-purple-500';
  if (t.includes('areas of concern')) return 'bg-amber-500';
  if (t.includes('what to discuss')) return 'bg-emerald-500';
  if (t.includes('reassuring')) return 'bg-emerald-500';
  return 'bg-primary';
}

export const SecondOpinionModal: React.FC<SecondOpinionModalProps> = ({
  isOpen,
  onClose,
  report,
  patientContext,
}) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // In-memory cache keyed by report.id
  const cache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!isOpen || !report) return;
    const cached = cache.current.get(report.id);
    if (cached) {
      setContent(cached);
      return;
    }
    fetchOpinion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, report]);

  async function fetchOpinion() {
    if (!report) return;
    setLoading(true);
    setContent('');
    setError('');

    try {
      const parameters = report.parameters.map((p) => ({
        name: p.name,
        value: String(p.value),
        unit: p.unit,
        referenceRange: p.referenceRange ?? '',
        status: p.status,
      }));

      const res = await fetch('/api/second-opinion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportName: report.title,
          reportDate: report.date,
          parameters,
          patientContext,
        }),
      });

      if (!res.body) throw new Error('No stream.');

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
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr;
            }
          }
        }
      }

      if (accumulated) cache.current.set(report.id, accumulated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate second opinion. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = () => {
    if (report) cache.current.delete(report.id);
    fetchOpinion();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      {/* Slide-up animation container */}
      <div className="flex flex-col h-full animate-slide-up">

        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shrink-0">
              <Microscope className="w-5 h-5 text-on-primary" />
            </div>
            <div>
              <p className="font-bold text-sm text-on-surface">AI Second Opinion</p>
              <p className="text-[11px] text-on-surface-variant line-clamp-1">{report.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {content && !loading && (
              <>
                <button
                  onClick={handleRefresh}
                  className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Loading skeleton */}
          {loading && !content && (
            <div className="space-y-3 animate-pulse pt-4">
              <div className="h-4 bg-surface-container rounded w-3/4" />
              <div className="h-4 bg-surface-container rounded w-full" />
              <div className="h-4 bg-surface-container rounded w-5/6" />
              <div className="h-4 bg-surface-container rounded w-2/3" />
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="text-sm text-error">{error}</p>
              <button
                onClick={fetchOpinion}
                className="px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Streamed content */}
          {content && (
            <ReactMarkdown
              components={{
                h2: ({ children }) => {
                  const text = typeof children === 'string' ? children : String(children ?? '');
                  const dotClass = headingDotClass(text);
                  return (
                    <h2 className="text-sm font-bold text-primary mt-5 mb-2 first:mt-0 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                      {children}
                    </h2>
                  );
                },
                p: ({ children }) => (
                  <p className="text-sm text-on-surface leading-relaxed mb-2">{children}</p>
                ),
                ul: ({ children }) => <ul className="space-y-1 mb-3">{children}</ul>,
                li: ({ children }) => (
                  <li className="text-sm text-on-surface flex gap-2">
                    <span className="mt-1.5 shrink-0 text-on-surface-variant text-[10px]">•</span>
                    <span>{children}</span>
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-on-surface">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="text-xs text-on-surface-variant block mt-6 pt-4 border-t border-outline-variant italic not-italic">
                    {children}
                  </em>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};
