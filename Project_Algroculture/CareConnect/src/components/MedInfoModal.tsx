import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, RefreshCw } from 'lucide-react';
import { Medication } from '../types';

export interface MedInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
  patientContext: string;
}

export const MedInfoModal: React.FC<MedInfoModalProps> = ({
  isOpen,
  onClose,
  medication,
  patientContext,
}) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // Cache keyed by medication name so reopening same med skips re-fetch
  const cache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!isOpen || !medication) return;

    const cached = cache.current.get(medication.name);
    if (cached) {
      setContent(cached);
      setLoading(false);
      setError(false);
      return;
    }

    fetchMedInfo();
  }, [isOpen, medication]);

  async function fetchMedInfo() {
    if (!medication) return;
    setLoading(true);
    setContent('');
    setError(false);

    try {
      const res = await fetch('/api/med-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationName: medication.name,
          dosage: medication.dosage,
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
          } catch { /* partial JSON — skip */ }
        }
      }

      if (accumulated) {
        cache.current.set(medication.name, accumulated);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const handleRetry = () => {
    if (medication) {
      cache.current.delete(medication.name);
      fetchMedInfo();
    }
  };

  if (!isOpen || !medication) return null;

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
        role="dialog"
        aria-modal="true"
        aria-label={`Medication info: ${medication.name}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-outline-variant flex items-start justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-base text-on-surface">{medication.name}</h2>
              <span className="text-sm text-on-surface-variant">{medication.dosage}</span>
            </div>
            {/* Frequency badge */}
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
              {medication.frequency}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!loading && content && (
              <button
                onClick={handleRetry}
                className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
                title="Regenerate"
                aria-label="Regenerate medication info"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Loading skeleton */}
          {loading && !content && (
            <div className="space-y-3 animate-pulse">
              <div className="h-3 bg-surface-container-high rounded w-3/4" />
              <div className="h-3 bg-surface-container-high rounded w-full" />
              <div className="h-3 bg-surface-container-high rounded w-5/6" />
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-on-surface-variant text-center">
                Couldn't load medication info. Please try again.
              </p>
              <button
                onClick={handleRetry}
                className="text-xs font-bold px-4 py-2 bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Streamed content */}
          {content && (
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-sm font-bold text-primary mt-4 mb-1 first:mt-0">{children}</h2>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-on-surface leading-relaxed mb-2">{children}</p>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-on-surface">{children}</li>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-outside ml-4 space-y-1 my-1">{children}</ul>
                ),
                em: ({ children }) => (
                  <em className="text-xs text-on-surface-variant not-italic block mt-4 border-t border-outline-variant pt-3">
                    {children}
                  </em>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-on-surface">{children}</strong>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>

        {/* Footer safe-area spacer */}
        <div className="h-safe-b shrink-0 pb-2" />
      </div>
    </>
  );
};
