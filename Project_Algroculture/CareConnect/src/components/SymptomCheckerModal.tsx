import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Loader2, Search, AlertTriangle, MessageSquare, NotebookPen } from 'lucide-react';

interface SymptomCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientContext: string;
  onNavigateToInbox: () => void;
  onOpenSymptomLog: () => void;
}

type Stage = 'input' | 'checking' | 'results';
type Urgency = 'emergency' | 'soon' | 'monitor' | 'selfcare' | null;

const QUICK_CHIPS = [
  'Headache',
  'Chest Pain',
  'Shortness of Breath',
  'Nausea',
  'Fatigue',
  'Dizziness',
  'Fever',
  'Abdominal Pain',
];

function parseUrgency(text: string): Urgency {
  const lower = text.toLowerCase();
  if (lower.includes('emergency')) return 'emergency';
  if (lower.includes('see a doctor soon')) return 'soon';
  if (lower.includes('monitor closely')) return 'monitor';
  if (lower.includes('self-care')) return 'selfcare';
  return null;
}

function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  if (!urgency) return null;

  const config: Record<
    NonNullable<Urgency>,
    { label: string; emoji: string; classes: string }
  > = {
    emergency: {
      label: 'Emergency',
      emoji: '🔴',
      classes: 'bg-red-100 border-red-300 text-red-800',
    },
    soon: {
      label: 'See a Doctor Soon',
      emoji: '🟠',
      classes: 'bg-orange-100 border-orange-300 text-orange-800',
    },
    monitor: {
      label: 'Monitor Closely',
      emoji: '🟡',
      classes: 'bg-amber-100 border-amber-300 text-amber-800',
    },
    selfcare: {
      label: 'Self-Care',
      emoji: '🟢',
      classes: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    },
  };

  const { label, emoji, classes } = config[urgency];

  return (
    <div className={`w-full rounded-xl border-2 p-4 text-center ${classes}`}>
      <p className="text-2xl mb-1">{emoji}</p>
      <p className="font-bold text-base">{label}</p>
    </div>
  );
}

export const SymptomCheckerModal: React.FC<SymptomCheckerModalProps> = ({
  isOpen,
  onClose,
  patientContext,
  onNavigateToInbox,
  onOpenSymptomLog,
}) => {
  const [stage, setStage] = useState<Stage>('input');
  const [symptomText, setSymptomText] = useState('');
  const [content, setContent] = useState('');
  const [urgency, setUrgency] = useState<Urgency>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const charCount = symptomText.length;

  const appendChip = (chip: string) => {
    setSymptomText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return chip;
      if (trimmed.endsWith(',') || trimmed.endsWith('.')) return `${trimmed} ${chip}`;
      return `${trimmed}, ${chip}`;
    });
  };

  const handleCheck = async () => {
    if (!symptomText.trim()) return;
    setStage('checking');
    setLoading(true);
    setContent('');
    setUrgency(null);
    setError(false);

    try {
      const res = await fetch('/api/symptom-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: symptomText, patientContext }),
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
              const parsed_urgency = parseUrgency(accumulated);
              if (parsed_urgency) setUrgency(parsed_urgency);
            }
          } catch { /* partial chunk */ }
        }
      }

      setStage('results');
    } catch {
      setError(true);
      setStage('results');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAgain = () => {
    setStage('input');
    setSymptomText('');
    setContent('');
    setUrgency(null);
    setError(false);
  };

  const showQuickActions = !loading && content !== '';
  const needsDoctor = urgency === 'emergency' || urgency === 'soon';

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col animate-slideUp">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-outline-variant bg-surface-container-low">
        {stage === 'results' ? (
          <>
            <h2 className="font-bold text-base text-on-surface">Your Assessment</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCheckAgain}
                className="px-3 py-1.5 text-xs font-semibold text-primary border border-primary/40 rounded-full hover:bg-primary/10 transition-colors"
              >
                Check Again
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">Symptom Checker</p>
                <p className="text-[11px] text-on-surface-variant">AI triage & assessment</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* ── Input Stage ── */}
        {stage === 'input' && (
          <div className="space-y-5">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Describe how you're feeling and get a personalized triage assessment.
            </p>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value.slice(0, 500))}
                placeholder="Describe your symptoms in detail... (e.g., I've had a headache for 2 days, mild fever, and feel tired)"
                rows={5}
                className="w-full text-sm p-4 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span className="absolute bottom-3 right-3 text-[10px] text-on-surface-variant">
                {charCount}/500
              </span>
            </div>

            {/* Quick chips */}
            <div>
              <p className="text-xs font-bold text-on-surface mb-2">Quick add</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => appendChip(chip)}
                    className="px-3 py-1.5 text-xs rounded-full border border-outline-variant bg-surface-container text-on-surface-variant hover:border-primary/40 hover:text-on-surface transition-all font-medium"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Check button */}
            <div className="space-y-2">
              <button
                onClick={handleCheck}
                disabled={!symptomText.trim()}
                className="w-full py-3 bg-primary text-on-primary rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Check Symptoms
              </button>
              <p className="text-center text-[11px] text-error font-medium">
                For emergencies, call 911 immediately
              </p>
            </div>
          </div>
        )}

        {/* ── Checking / Results Stage ── */}
        {(stage === 'checking' || stage === 'results') && (
          <div className="space-y-4">
            {/* Loading spinner (no content yet) */}
            {loading && !content && (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
                <p className="text-sm text-on-surface-variant">Analyzing your symptoms…</p>
              </div>
            )}

            {/* Error state */}
            {error && !content && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertTriangle className="w-8 h-8 text-error" />
                <p className="text-sm font-semibold text-on-surface">Unable to assess symptoms</p>
                <p className="text-xs text-on-surface-variant">
                  Please try again. If symptoms are severe, call 911 or go to the nearest emergency room.
                </p>
                <button
                  onClick={handleCheckAgain}
                  className="mt-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Urgency badge */}
            {urgency && <UrgencyBadge urgency={urgency} />}

            {/* Streamed markdown content */}
            {content && (
              <div className="text-sm text-on-surface leading-relaxed">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-sm font-bold text-on-surface mt-5 mb-2 first:mt-0">
                        {children}
                      </h2>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm text-on-surface leading-relaxed mb-2 last:mb-0">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-outside ml-4 space-y-1 my-1">{children}</ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm leading-relaxed text-on-surface">{children}</li>
                    ),
                    em: ({ children }) => (
                      <em className="block mt-5 pt-4 border-t border-outline-variant text-xs text-on-surface-variant not-italic leading-relaxed">
                        {children}
                      </em>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}

            {/* Quick action buttons — only after streaming is done */}
            {showQuickActions && (
              <div className="space-y-3 pt-2">
                {needsDoctor && (
                  <button
                    onClick={() => { onClose(); onNavigateToInbox(); }}
                    className="w-full py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message Dr. Chen
                  </button>
                )}
                <button
                  onClick={() => { onClose(); onOpenSymptomLog(); }}
                  className="w-full py-3 border border-outline-variant bg-surface-container text-on-surface rounded-xl text-sm font-semibold hover:border-primary/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <NotebookPen className="w-4 h-4" />
                  Log These Symptoms
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
