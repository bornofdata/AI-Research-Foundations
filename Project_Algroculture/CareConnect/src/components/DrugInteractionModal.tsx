import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Pill, ShieldCheck, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Medication } from '../types';

export interface DrugInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  medications: Medication[];
  patientContext: string;
}

type Stage = 'input' | 'checking' | 'results';
type BadgeType = 'safe' | 'caution' | 'avoid';

function SafetyBadge({ badge }: { badge: BadgeType }) {
  if (badge === 'avoid') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-red-100 border border-red-200 rounded-2xl">
        <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
        <div>
          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Safety Assessment</p>
          <p className="text-base font-extrabold text-red-800">Avoid</p>
        </div>
      </div>
    );
  }
  if (badge === 'caution') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-100 border border-amber-200 rounded-2xl">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
        <div>
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Safety Assessment</p>
          <p className="text-base font-extrabold text-amber-800">Use with Caution</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-100 border border-emerald-200 rounded-2xl">
      <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
      <div>
        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Safety Assessment</p>
        <p className="text-base font-extrabold text-emerald-800">Safe</p>
      </div>
    </div>
  );
}

export const DrugInteractionModal: React.FC<DrugInteractionModalProps> = ({
  isOpen,
  onClose,
  medications,
  patientContext,
}) => {
  const [stage, setStage] = useState<Stage>('input');
  const [newDrug, setNewDrug] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState(false);
  const [checkedDrug, setCheckedDrug] = useState('');
  const cache = useRef<Map<string, string>>(new Map());

  const activeMeds = medications.filter((m) => m.active);

  async function checkInteractions() {
    const drugKey = newDrug.trim().toLowerCase();
    if (!drugKey) return;

    const cached = cache.current.get(drugKey);
    if (cached) {
      setCheckedDrug(newDrug.trim());
      setContent(cached);
      setStage('results');
      return;
    }

    setCheckedDrug(newDrug.trim());
    setStage('checking');
    setContent('');
    setError(false);

    try {
      const res = await fetch('/api/drug-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDrug: newDrug.trim(),
          currentMedications: activeMeds.map((m) => m.name),
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
        cache.current.set(drugKey, accumulated);
      }
      setStage('results');
    } catch {
      setError(true);
      setStage('results');
    }
  }

  function handleCheckAnother() {
    setStage('input');
    setNewDrug('');
    setContent('');
    setError(false);
    setCheckedDrug('');
  }

  function handleClose() {
    onClose();
    // Reset after transition
    setTimeout(() => {
      setStage('input');
      setNewDrug('');
      setContent('');
      setError(false);
      setCheckedDrug('');
    }, 300);
  }

  const badge: BadgeType = (() => {
    if (!content) return 'safe';
    const safetyMatch = content.match(/## Safety Assessment\s*([\s\S]*?)(?=##|$)/);
    const safetyText = safetyMatch?.[1]?.toLowerCase() ?? '';
    return safetyText.includes('avoid')
      ? 'avoid'
      : safetyText.includes('caution')
      ? 'caution'
      : 'safe';
  })();

  if (!isOpen) return null;

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        role="dialog"
        aria-modal="true"
        aria-label="Drug Interaction Check"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-outline-variant flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <h2 className="font-bold text-base text-on-surface">Drug Interaction Check</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Stage 1: Input */}
          {stage === 'input' && (
            <div className="space-y-4">
              {/* Drug name input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                  <Pill className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={newDrug}
                  onChange={(e) => setNewDrug(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newDrug.trim()) checkInteractions(); }}
                  placeholder="Enter medication or supplement name"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container rounded-xl border border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:border-primary transition-colors"
                  aria-label="New medication or supplement name"
                  autoFocus
                />
              </div>

              {/* Current meds chips */}
              {activeMeds.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Will check against your {activeMeds.length} active medication{activeMeds.length !== 1 ? 's' : ''}:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeMeds.map((med) => (
                      <span
                        key={med.id}
                        className="text-[11px] font-medium px-2.5 py-1 bg-secondary-container text-on-secondary-container rounded-full"
                      >
                        {med.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeMeds.length === 0 && (
                <p className="text-xs text-on-surface-variant bg-surface-container rounded-xl px-4 py-3">
                  No active medications on file. Interaction check will be based on general pharmacology.
                </p>
              )}

              {/* Note */}
              <p className="text-[11px] text-on-surface-variant text-center">
                We'll check against all your active medications
              </p>

              {/* Check button */}
              <button
                onClick={checkInteractions}
                disabled={!newDrug.trim()}
                className="w-full py-3 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Check Interactions
              </button>
            </div>
          )}

          {/* Stage 2: Checking / Results */}
          {(stage === 'checking' || stage === 'results') && (
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={handleCheckAnother}
                className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Check another
              </button>

              {/* Sub-header */}
              <p className="text-xs text-on-surface-variant">
                {stage === 'checking' && !content
                  ? `Checking ${checkedDrug} against ${activeMeds.length} medication${activeMeds.length !== 1 ? 's' : ''}…`
                  : `${checkedDrug} · checked against ${activeMeds.length} medication${activeMeds.length !== 1 ? 's' : ''}`
                }
              </p>

              {/* Loading skeleton */}
              {stage === 'checking' && !content && (
                <div className="space-y-3 animate-pulse">
                  <div className="h-14 bg-surface-container-high rounded-2xl w-full" />
                  <div className="h-3 bg-surface-container-high rounded w-3/4" />
                  <div className="h-3 bg-surface-container-high rounded w-full" />
                  <div className="h-3 bg-surface-container-high rounded w-5/6" />
                  <div className="h-3 bg-surface-container-high rounded w-4/5" />
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <p className="text-sm text-on-surface-variant text-center">
                    Couldn't complete the interaction check. Please try again.
                  </p>
                  <button
                    onClick={() => {
                      setError(false);
                      setContent('');
                      setStage('checking');
                      checkInteractions();
                    }}
                    className="text-xs font-bold px-4 py-2 bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Safety badge — shown prominently once we have content */}
              {content && stage === 'results' && !error && (
                <SafetyBadge badge={badge} />
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

              {/* Check another button — shown after stream completes */}
              {stage === 'results' && content && !error && (
                <button
                  onClick={handleCheckAnother}
                  className="w-full py-3 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
                >
                  Check Another Drug
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer safe-area spacer */}
        <div className="h-safe-b shrink-0 pb-2" />
      </div>
    </>
  );
};
