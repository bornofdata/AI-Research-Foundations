import React, { useMemo } from 'react';
import { Activity, Plus } from 'lucide-react';
import { LineChart, Line } from 'recharts';

interface MyVitalsProps {
  onOpenLog: () => void;
  refreshKey: number;
}

interface VitalReading {
  id: string;
  date: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  glucose?: number;
  weight?: number;
  spo2?: number;
}

type VitalField = 'systolic' | 'diastolic' | 'heartRate' | 'glucose' | 'weight' | 'spo2';

interface MetricConfig {
  field: VitalField;
  label: string;
  unit: string;
  getStatus: (value: number) => 'green' | 'amber' | 'red' | 'neutral';
}

const METRICS: MetricConfig[] = [
  {
    field: 'systolic',
    label: 'Systolic BP',
    unit: 'mmHg',
    getStatus: (v) => (v < 120 ? 'green' : v < 140 ? 'amber' : 'red'),
  },
  {
    field: 'diastolic',
    label: 'Diastolic BP',
    unit: 'mmHg',
    getStatus: (v) => (v < 80 ? 'green' : v < 90 ? 'amber' : 'red'),
  },
  {
    field: 'heartRate',
    label: 'Heart Rate',
    unit: 'bpm',
    getStatus: (v) => (v >= 60 && v <= 100 ? 'green' : 'amber'),
  },
  {
    field: 'glucose',
    label: 'Blood Glucose',
    unit: 'mg/dL',
    getStatus: (v) => (v < 100 ? 'green' : v < 126 ? 'amber' : 'red'),
  },
  {
    field: 'weight',
    label: 'Weight',
    unit: 'lbs',
    getStatus: () => 'neutral',
  },
  {
    field: 'spo2',
    label: 'SpO2',
    unit: '%',
    getStatus: (v) => (v >= 95 ? 'green' : v >= 90 ? 'amber' : 'red'),
  },
];

const STATUS_COLORS = {
  green:   { stroke: '#16a34a', bg: 'bg-surface-container-lowest', valueColor: 'text-emerald-600', badgeBg: 'bg-emerald-100 text-emerald-800', label: 'Normal' },
  amber:   { stroke: '#d97706', bg: 'bg-surface-container-lowest', valueColor: 'text-amber-600',   badgeBg: 'bg-amber-100 text-amber-800',   label: 'Review' },
  red:     { stroke: '#dc2626', bg: 'bg-surface-container-lowest', valueColor: 'text-red-600',     badgeBg: 'bg-red-100 text-red-800',       label: 'High'   },
  neutral: { stroke: '#4a6fa5', bg: 'bg-surface-container-lowest', valueColor: 'text-on-surface',  badgeBg: '',                              label: ''       },
};

function relativeDate(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((value, i) => ({ i, value }));
  return (
    <LineChart
      width={80}
      height={36}
      data={chartData}
      margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
    >
      <Line
        type="monotone"
        dataKey="value"
        stroke={color}
        strokeWidth={2}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  );
}

export const MyVitals: React.FC<MyVitalsProps> = ({ onOpenLog, refreshKey }) => {
  // Read from localStorage whenever refreshKey changes
  const readings = useMemo<VitalReading[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('careconnect_vitals') ?? '[]') as VitalReading[];
    } catch {
      return [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (readings.length === 0) {
    return (
      <section className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant shadow-xs">
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center">
            <Activity className="w-6 h-6 text-on-primary-container" />
          </div>
          <div>
            <p className="font-bold text-sm text-on-surface">No vitals logged yet</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Track blood pressure, heart rate, glucose and more between appointments.
            </p>
          </div>
          <button
            onClick={onOpenLog}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Log Reading
          </button>
        </div>
      </section>
    );
  }

  // Sorted newest-first for "last logged"
  const sorted = [...readings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const lastDate = sorted[0].date;

  // Determine which metrics have at least one reading (sorted oldest-first for sparklines)
  const chronological = [...readings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const activeMetrics = METRICS.filter((m) =>
    chronological.some((r) => r[m.field] !== undefined),
  );

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-base text-on-surface flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-secondary" /> My Vitals
        </h2>
        <button
          onClick={onOpenLog}
          className="flex items-center gap-1 px-3 py-1.5 border border-outline-variant rounded-full text-xs font-semibold text-on-surface-variant hover:border-primary/60 hover:text-primary transition-colors"
        >
          <Plus className="w-3 h-3" /> Log Reading
        </button>
      </div>

      <p className="text-[11px] text-on-surface-variant -mt-1">
        Last logged: {relativeDate(lastDate)}
      </p>

      {/* Metric tiles grid */}
      <div className="grid grid-cols-2 gap-3">
        {activeMetrics.map((metric) => {
          // Get readings that have this field, chronological
          const fieldReadings = chronological.filter(
            (r) => r[metric.field] !== undefined,
          );
          const latestValue = fieldReadings[fieldReadings.length - 1][metric.field] as number;
          const status = metric.getStatus(latestValue);
          const colors = STATUS_COLORS[status];
          const sparklineData = fieldReadings
            .slice(-7)
            .map((r) => r[metric.field] as number);

          return (
            <div
              key={metric.field}
              className={`rounded-2xl p-3.5 border border-outline-variant ${colors.bg} space-y-1.5`}
            >
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">
                {metric.label}
              </p>
              <div className="flex items-end justify-between gap-1">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-bold leading-none ${colors.valueColor}`}>
                      {latestValue}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">{metric.unit}</span>
                  </div>
                  {colors.label && (
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1 ${colors.badgeBg}`}>
                      {colors.label}
                    </span>
                  )}
                </div>
                {sparklineData.length > 1 && (
                  <MiniSparkline data={sparklineData} color={colors.stroke} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
