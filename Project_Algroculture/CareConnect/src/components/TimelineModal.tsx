import React, { useMemo, useState, ReactNode } from 'react';
import { X, FlaskConical, Calendar, MessageCircle, Activity, Pill } from 'lucide-react';
import { LabReport, Appointment, Message, Medication } from '../types';

interface SymptomLogEntry {
  id: string;
  date: string;
  symptoms: string[];
  severity: number;
  note: string;
}

function loadSymptomLog(): SymptomLogEntry[] {
  try {
    const stored = localStorage.getItem('careconnect_symptom_log');
    return stored ? (JSON.parse(stored) as SymptomLogEntry[]) : [];
  } catch {
    return [];
  }
}

type EventType = 'lab' | 'appointment' | 'message' | 'symptom' | 'medication';

interface TimelineEvent {
  id: string;
  date: Date;
  type: EventType;
  title: string;
  subtitle: string;
  icon: ReactNode;
  color: string;
  detail?: string;
}

function formatEventDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - eventDay.getTime()) / 86400000);

  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Best-effort date parser for strings like "Oct 12, 2023" or "Nov 14, 2023".
 * Falls back to Date.parse, then to now.
 */
function parseDate(raw: string): Date {
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed;
  return new Date();
}

const DOT_COLORS: Record<EventType, string> = {
  lab: 'bg-primary',
  appointment: 'bg-secondary',
  message: 'bg-emerald-500',
  symptom: 'bg-amber-500',
  medication: 'bg-purple-500',
};

const FILTER_LABELS: { type: EventType | 'all'; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'lab', label: 'Labs' },
  { type: 'appointment', label: 'Appointments' },
  { type: 'message', label: 'Messages' },
  { type: 'symptom', label: 'Symptoms' },
  { type: 'medication', label: 'Medications' },
];

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  labReports: LabReport[];
  appointments: Appointment[];
  messages: Message[];
  medications: Medication[];
}

export const TimelineModal: React.FC<TimelineModalProps> = ({
  isOpen,
  onClose,
  labReports,
  appointments,
  messages,
  medications,
}) => {
  const [activeFilter, setActiveFilter] = useState<EventType | 'all'>('all');

  const events = useMemo<TimelineEvent[]>(() => {
    const result: TimelineEvent[] = [];

    // Lab reports
    for (const report of labReports) {
      const abnormal = report.parameters.filter(
        (p) => p.status === 'review' || p.status === 'high' || p.status === 'low',
      ).length;
      result.push({
        id: `lab-${report.id}`,
        date: parseDate(report.date),
        type: 'lab',
        title: report.title,
        subtitle: `${report.parameters.length} parameter${report.parameters.length !== 1 ? 's' : ''} tested`,
        icon: <FlaskConical className="w-3.5 h-3.5" />,
        color: DOT_COLORS.lab,
        detail: abnormal > 0 ? `${abnormal} value${abnormal !== 1 ? 's' : ''} need review` : undefined,
      });
    }

    // Appointments
    for (const apt of appointments) {
      const statusLabel =
        apt.status === 'upcoming' ? 'Upcoming' : apt.status === 'completed' ? 'Completed' : 'Cancelled';
      result.push({
        id: `apt-${apt.id}`,
        date: parseDate(`${apt.date} ${apt.time}`),
        type: 'appointment',
        title: `${apt.doctorName} — ${apt.doctorRole}`,
        subtitle: apt.location,
        icon: <Calendar className="w-3.5 h-3.5" />,
        color: DOT_COLORS.appointment,
        detail: statusLabel,
      });
    }

    // Doctor messages
    for (const msg of messages) {
      if (!msg.isDoctor) continue;
      result.push({
        id: `msg-${msg.id}`,
        date: parseDate(msg.timestamp),
        type: 'message',
        title: `Message from ${msg.senderName}`,
        subtitle: msg.text.slice(0, 60) + (msg.text.length > 60 ? '…' : ''),
        icon: <MessageCircle className="w-3.5 h-3.5" />,
        color: DOT_COLORS.message,
      });
    }

    // Symptom log entries from localStorage
    const symptomEntries = loadSymptomLog();
    for (const entry of symptomEntries) {
      const symptomTitle =
        entry.symptoms.length > 0 ? entry.symptoms.slice(0, 3).join(', ') : 'Symptom log entry';
      result.push({
        id: `symptom-${entry.id}`,
        date: new Date(entry.date),
        type: 'symptom',
        title: symptomTitle,
        subtitle: `Severity: ${entry.severity}/5`,
        icon: <Activity className="w-3.5 h-3.5" />,
        color: DOT_COLORS.symptom,
        detail: entry.note ? entry.note.slice(0, 60) + (entry.note.length > 60 ? '…' : '') : undefined,
      });
    }

    // Medications (active ones, use startedAt as event date)
    for (const med of medications) {
      if (!med.active) continue;
      result.push({
        id: `med-${med.id}`,
        date: parseDate(med.startedAt),
        type: 'medication',
        title: `${med.name} ${med.dosage}`,
        subtitle: med.frequency,
        icon: <Pill className="w-3.5 h-3.5" />,
        color: DOT_COLORS.medication,
        detail: 'Currently active',
      });
    }

    // Sort newest first
    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [labReports, appointments, messages, medications]);

  const filtered = useMemo(
    () => (activeFilter === 'all' ? events : events.filter((e) => e.type === activeFilter)),
    [events, activeFilter],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col animate-slideUp">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-outline-variant bg-surface-container-low">
        <h2 className="font-bold text-base text-on-surface">Health Timeline</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Close timeline"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter chips */}
      <div className="shrink-0 px-4 py-3 border-b border-outline-variant/50 flex gap-2 overflow-x-auto no-scrollbar">
        {FILTER_LABELS.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeFilter === type
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container text-on-surface-variant border-outline-variant hover:border-primary/40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timeline list */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Activity className="w-10 h-10 text-outline" />
            <p className="text-sm font-semibold text-on-surface-variant">No events found</p>
            <p className="text-xs text-on-surface-variant">
              {activeFilter === 'symptom'
                ? 'Log your first symptom from the Home tab.'
                : 'Try a different filter.'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical spine */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-outline-variant/50 rounded-full" />

            <ul className="space-y-5">
              {filtered.map((event) => (
                <li key={event.id} className="flex items-start gap-4">
                  {/* Colored dot */}
                  <div
                    className={`relative z-10 shrink-0 w-6 h-6 rounded-full ${event.color} flex items-center justify-center text-white shadow-sm mt-0.5`}
                  >
                    {event.icon}
                  </div>

                  {/* Content card */}
                  <div className="flex-1 bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-3 shadow-xs min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <p className="font-bold text-sm text-on-surface leading-snug">{event.title}</p>
                      <span className="shrink-0 text-[10px] text-on-surface-variant whitespace-nowrap">
                        {formatEventDate(event.date)}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">{event.subtitle}</p>
                    {event.detail && (
                      <p className="text-[11px] text-outline mt-1 leading-snug">{event.detail}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
