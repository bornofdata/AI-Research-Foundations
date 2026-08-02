import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { BarChart2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { LabReport, Medication } from '../types';

interface WeeklyReportProps {
  patientContext: string;
  labReports: LabReport[];
  medications: Medication[];
}

type TabKey = 'overview' | 'wins' | 'watch' | 'priority';

const TABS: { key: TabKey; label: string; dot: string; text: string }[] = [
  { key: 'overview', label: 'Overview', dot: 'bg-primary', text: 'text-primary' },
  { key: 'wins', label: 'Wins', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  { key: 'watch', label: 'Watch', dot: 'bg-amber-500', text: 'text-amber-600' },
  { key: 'priority', label: 'Priority', dot: 'bg-secondary', text: 'text-secondary' },
];

const CACHE_KEY = 'careconnect_weekly_report';

// Returns the Monday of the given date's week
function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

// ── LocalStorage readers ──────────────────────────────────────

interface VitalEntry {
  date: string;
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  heartRate?: number;
  [key: string]: unknown;
}

interface SymptomEntry {
  date: string;
  symptoms: string[];
  severity: number;
}

function loadVitalsThisWeek(): VitalEntry[] {
  try {
    const raw = localStorage.getItem('careconnect_vitals');
    if (!raw) return [];
    const all = JSON.parse(raw) as VitalEntry[];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    return all.filter((e) => new Date(e.date) >= weekAgo);
  } catch {
    return [];
  }
}

function loadSymptomsThisWeek(): SymptomEntry[] {
  try {
    const raw = localStorage.getItem('careconnect_symptom_log');
    if (!raw) return [];
    const all = JSON.parse(raw) as SymptomEntry[];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    return all.filter((e) => new Date(e.date) >= weekAgo);
  } catch {
    return [];
  }
}

function loadAdherenceThisWeek(
  activeMeds: Medication[],
): { takenDays: number; totalDays: number } {
  let takenDays = 0;
  let totalDays = 0;
  const activeMedIds = activeMeds.map((m) => m.id);

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `careconnect_meds_${d.toISOString().split('T')[0]}`;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const taken = JSON.parse(raw) as Record<string, boolean>;
      totalDays++;
      const allTaken =
        activeMedIds.length > 0 &&
        activeMedIds.every((id) => taken[id] === true);
      if (allTaken) takenDays++;
    } catch {
      // skip corrupt data
    }
  }

  return { takenDays, totalDays };
}

function buildWeekSummary(
  labReports: LabReport[],
  medications: Medication[],
): string {
  const vitals = loadVitalsThisWeek();
  const symptoms = loadSymptomsThisWeek();
  const activeMeds = medications.filter((m) => m.active);
  const adherence = loadAdherenceThisWeek(activeMeds);

  const lines: string[] = [];

  // Vitals
  if (vitals.length > 0) {
    lines.push(`Vitals logged ${vitals.length} time(s) this week.`);
    const latest = vitals[vitals.length - 1];
    if (latest.systolic)
      lines.push(`Latest BP: ${latest.systolic}/${latest.diastolic} mmHg.`);
    if (latest.glucose)
      lines.push(`Latest glucose: ${latest.glucose} mg/dL.`);
    if (latest.heartRate)
      lines.push(`Latest heart rate: ${latest.heartRate} bpm.`);
  } else {
    lines.push('No vitals logged this week.');
  }

  // Symptoms
  if (symptoms.length > 0) {
    lines.push(`${symptoms.length} symptom log(s) this week.`);
    const avgSeverity =
      symptoms.reduce((s, e) => s + e.severity, 0) / symptoms.length;
    lines.push(`Average symptom severity: ${avgSeverity.toFixed(1)}/5.`);
    const allSymptoms = [...new Set(symptoms.flatMap((e) => e.symptoms))];
    if (allSymptoms.length > 0)
      lines.push(`Symptoms reported: ${allSymptoms.join(', ')}.`);
  } else {
    lines.push('No symptoms logged this week.');
  }

  // Medications
  if (adherence.totalDays > 0) {
    lines.push(
      `Medication adherence: ${adherence.takenDays}/${adherence.totalDays} days all meds taken.`,
    );
  }
  lines.push(
    `Active medications: ${activeMeds.map((m) => m.name).join(', ')}.`,
  );

  // Labs
  const recentReport = labReports[0];
  if (recentReport) {
    lines.push(
      `Most recent lab report: ${recentReport.title} (${recentReport.date}).`,
    );
  }

  return lines.join(' ');
}

// ── Section parser ────────────────────────────────────────────

function parseSections(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const headings = [
    'Week in Review',
    'What Went Well',
    'Areas to Watch',
    "This Week's Priority",
    'Looking Ahead',
  ];
  const keys = ['overview', 'wins', 'watch', 'priority', 'ahead'];

  headings.forEach((h, i) => {
    const regex = new RegExp(
      `## ${h.replace(/'/g, "\\'")}\\s*([\\s\\S]*?)(?=## |$)`,
    );
    const match = content.match(regex);
    if (match) result[keys[i]] = match[1].trim();
  });

  // Combine priority + ahead into one tab
  if (result.priority || result.ahead) {
    result.priority = [result.priority, result.ahead]
      .filter(Boolean)
      .join('\n\n');
  }

  return result;
}

// ── Component ─────────────────────────────────────────────────

export const WeeklyReport: React.FC<WeeklyReportProps> = ({
  patientContext,
  labReports,
  medications,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const hasFetched = useRef(false);

  const monday = getMonday(new Date());
  const weekKey = monday.toISOString().split('T')[0];
  const weekRange = formatWeekRange(monday);

  // Load or fetch on first expand
  useEffect(() => {
    if (!expanded || hasFetched.current) return;
    hasFetched.current = true;

    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as {
          weekKey: string;
          content: string;
        };
        if (cached.weekKey === weekKey && cached.content) {
          setContent(cached.content);
          return;
        }
      } catch {
        // fall through
      }
    }

    fetchReport();
  }, [expanded]);

  async function fetchReport() {
    setLoading(true);
    setError(null);
    setContent('');

    const weekSummary = buildWeekSummary(labReports, medications);

    try {
      const res = await fetch('/api/weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientContext, weekSummary }),
      });

      if (!res.body) throw new Error('No stream received.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder
          .decode(value, { stream: true })
          .split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload) as {
              text?: string;
              error?: string;
            };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulated += parsed.text;
              setContent(accumulated);
            }
          } catch {
            // partial chunk — ignore
          }
        }
      }

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ weekKey, content: accumulated }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not generate report.',
      );
    } finally {
      setLoading(false);
    }
  }

  function refresh() {
    localStorage.removeItem(CACHE_KEY);
    hasFetched.current = false;
    fetchReport();
  }

  const sections = parseSections(content);
  const activeTabMeta = TABS.find((t) => t.key === activeTab)!;
  const sectionContent = sections[activeTab] ?? '';

  // Render bullets or paragraph text (priority tab has prose, others have bullets)
  const bullets = sectionContent
    .split('\n')
    .filter((line) => line.trim().startsWith('- '))
    .map((line) => line.trim().slice(2).trim());

  const proseText = sectionContent
    .split('\n')
    .filter((line) => !line.trim().startsWith('- ') && line.trim() !== '')
    .join(' ');

  const sectionReady = !!sectionContent;
  const isStreaming = loading && !!content;

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-surface-container/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-bold text-on-surface">Weekly Report</span>
          <span className="text-xs text-on-surface-variant ml-1">{weekRange}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-on-surface-variant shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0" />
        )}
      </button>

      {/* Expanded area */}
      {expanded && (
        <>
          {/* Refresh + tab strip row */}
          <div className="border-t border-outline-variant/40">
            <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant/30">
              <div className="flex gap-1 overflow-x-auto">
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
              <button
                onClick={refresh}
                disabled={loading}
                className="ml-2 p-1 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40 shrink-0"
                title="Refresh report"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="px-4 py-3 min-h-[120px]">
            {/* Error */}
            {error && !content && (
              <p className="text-xs text-error">{error}</p>
            )}

            {/* Initial skeleton — no content yet */}
            {loading && !content && (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-surface-container rounded w-full" />
                <div className="h-3 bg-surface-container rounded w-5/6" />
                <div className="h-3 bg-surface-container rounded w-4/6" />
                <div className="h-3 bg-surface-container rounded w-3/4" />
              </div>
            )}

            {/* Section not yet streamed in */}
            {content && !sectionReady && (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-surface-container rounded w-full" />
                <div className="h-3 bg-surface-container rounded w-5/6" />
                <div className="h-3 bg-surface-container rounded w-4/6" />
              </div>
            )}

            {/* Section content */}
            {sectionReady && (
              <>
                {/* Bullet list (wins / watch tabs) */}
                {bullets.length > 0 && (
                  <ul className="space-y-0">
                    {bullets.map((bullet, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-on-surface leading-relaxed py-1.5 border-b border-outline-variant/30 last:border-0 flex gap-2"
                      >
                        <span
                          className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${activeTabMeta.dot}`}
                        />
                        <span className="flex-1 min-w-0">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <span>{children}</span>,
                              strong: ({ children }) => <strong className="font-semibold text-on-surface">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                            }}
                          >
                            {bullet}
                          </ReactMarkdown>
                        </span>
                      </li>
                    ))}
                    {isStreaming && (
                      <li className="flex items-center gap-2 py-1.5 text-xs text-on-surface-variant">
                        <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                        Generating…
                      </li>
                    )}
                  </ul>
                )}

                {/* Prose text (overview / priority tabs) */}
                {bullets.length === 0 && proseText && (
                  <div className={`text-sm leading-relaxed ${activeTabMeta.text}`}>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="text-sm text-on-surface leading-relaxed mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-on-surface">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="space-y-1 my-1">{children}</ul>,
                        li: ({ children }) => (
                          <li className="flex gap-2 text-sm text-on-surface leading-relaxed">
                            <span className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${activeTabMeta.dot}`} />
                            <span>{children}</span>
                          </li>
                        ),
                      }}
                    >
                      {proseText}
                    </ReactMarkdown>
                    {isStreaming && (
                      <span className="inline-flex items-center gap-1 ml-2 text-on-surface-variant text-xs">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse inline-block" />
                      </span>
                    )}
                  </div>
                )}

                {/* Section exists but body still arriving */}
                {bullets.length === 0 && !proseText && (
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant py-1">
                    <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                    Generating…
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer caption */}
          <div className="px-4 pb-3 pt-0">
            <p className="text-[10px] text-on-surface-variant">
              Generated for week of {monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
