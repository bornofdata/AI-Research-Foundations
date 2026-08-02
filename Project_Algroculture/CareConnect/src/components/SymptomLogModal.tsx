import React, { useState } from 'react';
import { X, NotebookPen, CheckCircle2 } from 'lucide-react';

interface LogEntry {
  id: string;
  date: string;
  symptoms: string[];
  severity: number;
  note: string;
}

interface SymptomLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SYMPTOM_CHIPS = [
  'Fatigue', 'Headache', 'Nausea', 'Dizziness', 'Shortness of breath',
  'Chest tightness', 'Joint pain', 'Digestive issues', 'Brain fog', 'Swelling',
];

const STORAGE_KEY = 'careconnect_symptom_log';

export function loadSymptomLog(): LogEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as LogEntry[]) : [];
  } catch { return []; }
}

function saveLog(entries: LogEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch { /* non-fatal */ }
}

const SEVERITY_LABELS = ['', 'Mild', 'Mild–Mod', 'Moderate', 'Mod–Severe', 'Severe'];
const SEVERITY_COLORS = ['', 'text-emerald-600', 'text-lime-600', 'text-amber-600', 'text-orange-600', 'text-error'];

export const SymptomLogModal: React.FC<SymptomLogModalProps> = ({ isOpen, onClose }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [severity, setSeverity] = useState(2);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const toggle = (symptom: string) =>
    setSelected((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );

  const handleSave = () => {
    if (selected.length === 0 && !note.trim()) return;
    const entries = loadSymptomLog();
    const newEntry: LogEntry = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString(),
      symptoms: selected,
      severity,
      note: note.trim(),
    };
    saveLog([newEntry, ...entries]);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setSelected([]);
      setSeverity(2);
      setNote('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center shrink-0">
              <NotebookPen className="w-4 h-4 text-on-secondary" />
            </div>
            <div>
              <p className="font-bold text-sm text-on-surface">Log Today's Symptoms</p>
              <p className="text-[11px] text-on-surface-variant">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <CheckCircle2 className="w-10 h-10 text-secondary" />
            <p className="font-bold text-sm text-on-surface">Entry saved!</p>
          </div>
        ) : (
          <div className="p-5 space-y-5 overflow-y-auto">

            {/* Symptom chips */}
            <div>
              <p className="text-xs font-bold text-on-surface mb-2">What are you experiencing?</p>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_CHIPS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggle(s)}
                    className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-all ${
                      selected.includes(s)
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant hover:border-primary/40'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-on-surface">Overall severity</p>
                <span className={`text-xs font-bold ${SEVERITY_COLORS[severity]}`}>
                  {SEVERITY_LABELS[severity]}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                <span>Mild</span>
                <span>Severe</span>
              </div>
            </div>

            {/* Free-text note */}
            <div>
              <p className="text-xs font-bold text-on-surface mb-2">Additional notes <span className="font-normal text-on-surface-variant">(optional)</span></p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe how you feel, what triggered it, or anything else…"
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={selected.length === 0 && !note.trim()}
              className="w-full py-3 bg-primary text-on-primary rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-primary/90 active:scale-[0.99] transition-all"
            >
              Save Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
