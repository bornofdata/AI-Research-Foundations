import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Plus, X, RefreshCw, Syringe } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface VaccineRecord {
  id: string;
  name: string;
  dateReceived: string; // ISO date string
  nextDueDate?: string; // ISO date string, optional
  notes?: string;
  source: 'manual' | 'ai-suggested';
}

interface VaccineRecommendation {
  vaccine: string;
  priority: 'recommended' | 'consider' | 'discuss';
  reason: string;
}

interface VaccineTrackerProps {
  patientContext: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'careconnect_vaccines';
const REC_CACHE_KEY = 'careconnect_vaccine_recs';

const COMMON_VACCINES = [
  'Influenza (Flu)',
  'COVID-19',
  'Tdap',
  'Pneumococcal (PCV15/PPSV23)',
  'Shingles (Zoster)',
  'Hepatitis B',
  'Hepatitis A',
  'MMR',
  'HPV',
  'RSV',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadVaccines(): VaccineRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as VaccineRecord[]) : [];
  } catch {
    return [];
  }
}

function saveVaccines(records: VaccineRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch { /* storage full */ }
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOverdue(nextDueDate: string): boolean {
  return new Date(nextDueDate) < new Date();
}

// ─── VaccineTracker ────────────────────────────────────────────────────────────

export const VaccineTracker: React.FC<VaccineTrackerProps> = ({ patientContext }) => {
  const [vaccines, setVaccines] = useState<VaccineRecord[]>(loadVaccines);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDateReceived, setFormDateReceived] = useState('');
  const [formNextDue, setFormNextDue] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // AI Recommendations
  const [recs, setRecs] = useState<VaccineRecommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const hasFetched = useRef(false);

  // Load cached recommendations
  useEffect(() => {
    try {
      const cached = localStorage.getItem(REC_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { date: string; data: VaccineRecommendation[] };
        if (parsed.date === todayISO()) {
          setRecs(parsed.data);
          hasFetched.current = true;
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Fetch recommendations on mount if not cached
  useEffect(() => {
    if (hasFetched.current) return;
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRecommendations = () => {
    if (recsLoading) return;
    setRecsLoading(true);
    hasFetched.current = true;

    fetch('/api/vaccine-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientContext }),
    })
      .then((r) => r.json())
      .then(({ recommendations }) => {
        if (Array.isArray(recommendations)) {
          setRecs(recommendations);
          try {
            localStorage.setItem(
              REC_CACHE_KEY,
              JSON.stringify({ date: todayISO(), data: recommendations }),
            );
          } catch { /* ignore */ }
        }
      })
      .catch(() => { /* non-fatal */ })
      .finally(() => setRecsLoading(false));
  };

  const handleRefresh = () => {
    hasFetched.current = false;
    setRecs([]);
    try { localStorage.removeItem(REC_CACHE_KEY); } catch { /* ignore */ }
    fetchRecommendations();
  };

  // Add Vaccine Form handlers
  const handleSave = () => {
    if (!formName.trim() || !formDateReceived) return;
    const newRecord: VaccineRecord = {
      id: `vax-${Date.now()}`,
      name: formName.trim(),
      dateReceived: formDateReceived,
      nextDueDate: formNextDue || undefined,
      notes: formNotes.trim() || undefined,
      source: 'manual',
    };
    const updated = [newRecord, ...vaccines];
    setVaccines(updated);
    saveVaccines(updated);
    // Reset form
    setFormName('');
    setFormDateReceived('');
    setFormNextDue('');
    setFormNotes('');
    setShowForm(false);
  };

  const handleCancel = () => {
    setFormName('');
    setFormDateReceived('');
    setFormNextDue('');
    setFormNotes('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    const updated = vaccines.filter((v) => v.id !== id);
    setVaccines(updated);
    saveVaccines(updated);
  };

  const handleAddFromRec = (vaccineName: string) => {
    setFormName(vaccineName);
    setShowForm(true);
    // Scroll to form after a brief tick
    setTimeout(() => {
      document.getElementById('vaccine-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  // Priority badge styling
  const priorityBadge = (priority: VaccineRecommendation['priority']) => {
    switch (priority) {
      case 'recommended':
        return 'bg-primary text-on-primary';
      case 'consider':
        return 'bg-secondary-container text-on-secondary-container';
      case 'discuss':
        return 'bg-surface-container text-on-surface-variant';
    }
  };

  const priorityLabel = (priority: VaccineRecommendation['priority']) => {
    switch (priority) {
      case 'recommended': return 'Recommended';
      case 'consider': return 'Consider';
      case 'discuss': return 'Discuss';
    }
  };

  return (
    <section className="space-y-5">
      {/* ── A. Vaccination History ──────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
            <Syringe className="w-4 h-4 text-secondary" />
            My Vaccinations
          </h2>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary px-2.5 py-1 rounded-full border border-primary hover:bg-primary-fixed transition-colors"
            aria-label="Add vaccine"
          >
            <Plus className="w-3 h-3" />
            Add Vaccine
          </button>
        </div>

        {/* ── B. Add Vaccine Form (inline toggle) ─────────────────── */}
        {showForm && (
          <div
            id="vaccine-form"
            className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 space-y-3"
          >
            <p className="text-xs font-bold text-on-surface">Add Vaccination Record</p>

            {/* Vaccine name with datalist */}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">
                Vaccine Name *
              </label>
              <input
                type="text"
                list="vaccine-list"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Influenza (Flu)"
                className="w-full text-sm text-on-surface bg-surface-container rounded-lg px-3 py-2 border border-outline-variant outline-none focus:border-primary"
              />
              <datalist id="vaccine-list">
                {COMMON_VACCINES.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>

            {/* Date received */}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">
                Date Received *
              </label>
              <input
                type="date"
                value={formDateReceived}
                max={todayISO()}
                onChange={(e) => setFormDateReceived(e.target.value)}
                className="w-full text-sm text-on-surface bg-surface-container rounded-lg px-3 py-2 border border-outline-variant outline-none focus:border-primary"
              />
            </div>

            {/* Next due date */}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">
                Next Due Date (optional)
              </label>
              <input
                type="date"
                value={formNextDue}
                min={todayISO()}
                onChange={(e) => setFormNextDue(e.target.value)}
                className="w-full text-sm text-on-surface bg-surface-container rounded-lg px-3 py-2 border border-outline-variant outline-none focus:border-primary"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">
                Notes (optional)
              </label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="e.g., Pfizer, lot #123"
                className="w-full text-sm text-on-surface bg-surface-container rounded-lg px-3 py-2 border border-outline-variant outline-none focus:border-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 text-xs font-semibold text-on-surface-variant bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formName.trim() || !formDateReceived}
                className="flex-1 py-2 text-xs font-bold text-on-primary bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Save Vaccine
              </button>
            </div>
          </div>
        )}

        {/* Vaccine list */}
        {vaccines.length === 0 ? (
          <div className="text-center py-6 text-xs text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant">
            No vaccines recorded yet. Add your vaccination history.
          </div>
        ) : (
          <div className="space-y-2">
            {vaccines.map((vax) => {
              const overdue = vax.nextDueDate ? isOverdue(vax.nextDueDate) : false;
              const statusLabel = overdue ? 'Overdue' : 'Up to Date';
              const statusClass = overdue
                ? 'bg-error-container/50 text-error'
                : 'bg-emerald-100 text-emerald-700';

              return (
                <div
                  key={vax.id}
                  className="bg-surface-container-lowest rounded-xl border border-outline-variant px-4 py-3 flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-on-surface">{vax.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Received: {formatDate(vax.dateReceived)}
                    </p>
                    {vax.nextDueDate && (
                      <p className={`text-xs font-medium ${overdue ? 'text-amber-600' : 'text-emerald-600'}`}>
                        Next due: {formatDate(vax.nextDueDate)}
                      </p>
                    )}
                    {vax.notes && (
                      <p className="text-[10px] text-on-surface-variant/70 italic">{vax.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(vax.id)}
                    aria-label={`Remove ${vax.name}`}
                    className="p-1.5 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── C. AI Recommendations ───────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Recommendations
          </h2>
          <button
            onClick={handleRefresh}
            disabled={recsLoading}
            aria-label="Refresh AI vaccine recommendations"
            className="p-1.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${recsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {recsLoading ? (
          // Skeleton rows
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 bg-surface-container-lowest rounded-xl border border-outline-variant animate-pulse"
              />
            ))}
          </div>
        ) : recs.length === 0 ? (
          <div className="text-center py-5 text-xs text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant">
            No recommendations available. Tap refresh to load AI suggestions.
          </div>
        ) : (
          <div className="space-y-2">
            {recs.map((rec, idx) => (
              <div
                key={idx}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant px-4 py-3 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-on-surface">{rec.vaccine}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityBadge(rec.priority as VaccineRecommendation['priority'])}`}
                    >
                      {priorityLabel(rec.priority as VaccineRecommendation['priority'])}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddFromRec(rec.vaccine)}
                    className="shrink-0 text-[10px] font-semibold text-primary px-2 py-0.5 rounded-full border border-primary hover:bg-primary-fixed transition-colors"
                    aria-label={`Add ${rec.vaccine} to my records`}
                  >
                    + Add
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant leading-snug">{rec.reason}</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-on-surface-variant text-center">
          AI recommendations are informational only. Discuss with your doctor before getting any vaccine.
        </p>
      </div>
    </section>
  );
};
