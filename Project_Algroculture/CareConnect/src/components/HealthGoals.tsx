import React, { useState, useEffect, useRef } from 'react';
import { Target, RefreshCw, CheckCircle2, Circle, Sparkles } from 'lucide-react';

interface Goal {
  id: string;
  goal: string;
  reason: string;
  metric: string;
  achieved: boolean;
  aiSuggested: boolean;
}

interface HealthGoalsProps {
  patientContext: string;
}

const STORAGE_KEY = 'careconnect_goals';

function loadGoals(): Goal[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Goal[]) : [];
  } catch { return []; }
}

function saveGoals(goals: Goal[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(goals)); } catch { /* non-fatal */ }
}

export const HealthGoals: React.FC<HealthGoalsProps> = ({ patientContext }) => {
  const [goals, setGoals] = useState<Goal[]>(loadGoals);
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (goals.length > 0 || hasFetched.current) return;
    hasFetched.current = true;
    fetchGoals();
  }, []);

  async function fetchGoals() {
    setLoading(true);
    try {
      const res = await fetch('/api/suggest-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientContext }),
      });
      const { goals: suggestions } = await res.json() as {
        goals: { goal: string; reason: string; metric: string }[];
      };
      if (!Array.isArray(suggestions) || suggestions.length === 0) return;

      const newGoals: Goal[] = suggestions.map((g, i) => ({
        id: `ai-${Date.now()}-${i}`,
        goal: g.goal,
        reason: g.reason,
        metric: g.metric,
        achieved: false,
        aiSuggested: true,
      }));

      setGoals((prev) => {
        // Keep any user-marked goals, replace AI suggestions
        const userGoals = prev.filter((g) => !g.aiSuggested);
        const merged = [...userGoals, ...newGoals];
        saveGoals(merged);
        return merged;
      });
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }

  function refresh() {
    setGoals((prev) => {
      const userGoals = prev.filter((g) => !g.aiSuggested);
      saveGoals(userGoals);
      return userGoals;
    });
    hasFetched.current = false;
    fetchGoals();
  }

  function toggle(id: string) {
    setGoals((prev) => {
      const next = prev.map((g) => g.id === id ? { ...g, achieved: !g.achieved } : g);
      saveGoals(next);
      return next;
    });
  }

  const achieved = goals.filter((g) => g.achieved).length;

  return (
    <section className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
          <Target className="w-4 h-4 text-primary" /> My Health Goals
        </h2>
        <div className="flex items-center gap-2">
          {goals.length > 0 && (
            <span className="text-[11px] text-on-surface-variant">
              {achieved}/{goals.length} on track
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40"
            title="Refresh goals"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && goals.filter((g) => g.aiSuggested).length === 0 && (
        <div className="flex items-center gap-2 text-xs text-on-surface-variant py-2">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse shrink-0" />
          AI is generating personalized goals…
        </div>
      )}

      {goals.length > 0 && (
        <div className="space-y-2">
          {goals.map((g) => (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all active:scale-[0.99] ${
                g.achieved
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-surface-container border-outline-variant/60 hover:border-primary/30'
              }`}
            >
              {g.achieved
                ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                : <Circle className="w-4 h-4 text-outline shrink-0 mt-0.5" />
              }
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold leading-snug ${g.achieved ? 'line-through text-emerald-800' : 'text-on-surface'}`}>
                  {g.goal}
                </p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-snug">{g.reason}</p>
              </div>
              {g.aiSuggested && (
                <Sparkles className="w-3 h-3 text-primary/40 shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      )}

      {!loading && goals.length === 0 && (
        <p className="text-xs text-on-surface-variant py-1">
          Tap ↻ to let AI suggest goals based on your health data.
        </p>
      )}
    </section>
  );
};
