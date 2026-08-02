import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, ClipboardList, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { Appointment } from '../types';

interface VisitPrepModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  patientContext: string;
}

function cacheKey(appointmentId: string) {
  return `careconnect_prep_${appointmentId}`;
}

function loadCached(appointmentId: string): string {
  try {
    return localStorage.getItem(cacheKey(appointmentId)) ?? '';
  } catch { return ''; }
}

function saveCache(appointmentId: string, content: string) {
  try {
    localStorage.setItem(cacheKey(appointmentId), content);
  } catch { /* non-fatal */ }
}

export const VisitPrepModal: React.FC<VisitPrepModalProps> = ({
  isOpen,
  onClose,
  appointment,
  patientContext,
}) => {
  const [content, setContent] = useState(() => loadCached(appointment.id));
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    // Already have cached content — no need to fetch
    if (content) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    generate();
  }, [isOpen]);

  async function generate() {
    setLoading(true);
    setContent('');

    try {
      const res = await fetch('/api/visit-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientContext,
          appointmentType: appointment.type,
          doctorName: appointment.doctorName,
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
            const parsed = JSON.parse(payload) as { text?: string };
            if (parsed.text) {
              accumulated += parsed.text;
              setContent(accumulated);
            }
          } catch { /* partial */ }
        }
      }

      // Persist once fully streamed
      if (accumulated) saveCache(appointment.id, accumulated);
    } catch {
      setContent('Unable to generate prep summary. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const regenerate = () => {
    try { localStorage.removeItem(cacheKey(appointment.id)); } catch { /* non-fatal */ }
    hasFetched.current = false;
    generate();
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full sm:max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-2xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-on-primary" />
            </div>
            <div>
              <p className="font-bold text-sm text-on-surface">Pre-Visit Prep</p>
              <p className="text-[11px] text-on-surface-variant">{appointment.type} · {appointment.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {content && !loading && (
              <>
                <button
                  onClick={regenerate}
                  className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Appointment context banner */}
        <div className="px-5 py-3 bg-primary-container/20 border-b border-outline-variant/40 flex items-center gap-3 shrink-0">
          <img src={appointment.doctorAvatar} alt={appointment.doctorName} className="w-8 h-8 rounded-full object-cover border border-outline-variant" />
          <div>
            <p className="text-xs font-bold text-on-surface">{appointment.doctorName}</p>
            <p className="text-[10px] text-on-surface-variant">{appointment.doctorRole} · {appointment.date} at {appointment.time}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && !content && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="text-sm text-on-surface-variant">Preparing your visit summary…</p>
            </div>
          )}

          {content && (
            <div className="text-sm text-on-surface leading-relaxed">
              <ReactMarkdown components={{
                h2: ({ children }) => <h2 className="font-bold text-sm text-on-surface mt-5 mb-2 first:mt-0">{children}</h2>,
                strong: ({ children }) => <strong className="font-semibold text-on-surface">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc list-outside ml-4 space-y-1 my-1">{children}</ul>,
                li: ({ children }) => <li className="text-xs leading-relaxed text-on-surface">{children}</li>,
                p: ({ children }) => <p className="text-xs mb-2 last:mb-0 text-on-surface">{children}</p>,
              }}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-outline-variant bg-surface-container-low shrink-0">
          <p className="text-[10px] text-on-surface-variant text-center">
            AI-generated summary · Verify with your actual health records before your appointment
          </p>
        </div>
      </div>
    </div>
  );
};
