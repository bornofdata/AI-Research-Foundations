import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, TrendingUp, Calendar, Download, Info, CheckCircle2 } from 'lucide-react';
import { HISTORICAL_TRENDS } from '../data/mockData';
import { LabReport } from '../types';
import { TrendChart } from './TrendChart';

interface TrendAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReport: LabReport;
}

export const TrendAnalysisModal: React.FC<TrendAnalysisModalProps> = ({
  isOpen,
  onClose,
  selectedReport,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'glucose' | 'a1c' | 'sodium' | 'potassium'>('glucose');
  const [timeRange, setTimeRange] = useState<'6m' | '1y'>('6m');
  const [trendInsight, setTrendInsight] = useState<string>('');
  const [insightLoading, setInsightLoading] = useState(false);
  const insightCache = useRef<Record<string, string>>({});

  const metricMeta = {
    glucose: { name: 'Fasting Glucose', unit: 'mg/dL', target: '70 - 99 mg/dL', current: 94, trend: '-2% vs 6mo ago', color: '#003178' },
    a1c: { name: 'A1C Level', unit: '%', target: '< 5.7 %', current: 5.4, trend: '-0.2% vs 6mo ago', color: '#286959' },
    sodium: { name: 'Sodium', unit: 'mmol/L', target: '135 - 145 mmol/L', current: 140, trend: 'Stable', color: '#0d47a1' },
    potassium: { name: 'Potassium', unit: 'mmol/L', target: '3.5 - 5.1 mmol/L', current: 4.2, trend: '+0.2 vs 6mo ago', color: '#045142' },
  };

  // Parse reference range strings like "70 - 99 mg/dL", "< 5.7 %", "> 40 mg/dL"
  const parseReferenceRange = (range: string): { min?: number; max?: number } => {
    const rangeMatch = range.match(/^([\d.]+)\s*[-–]\s*([\d.]+)/);
    if (rangeMatch) {
      return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
    }
    const ltMatch = range.match(/^<\s*([\d.]+)/);
    if (ltMatch) {
      return { max: parseFloat(ltMatch[1]) };
    }
    const gtMatch = range.match(/^>\s*([\d.]+)/);
    if (gtMatch) {
      return { min: parseFloat(gtMatch[1]) };
    }
    return {};
  };

  // Build recharts data from real HISTORICAL_TRENDS using short month labels
  const chartData = useMemo(
    () =>
      HISTORICAL_TRENDS.map((t) => ({
        date: t.date.split(' ')[0], // e.g. "May"
        value: t[selectedMetric],
      })),
    [selectedMetric],
  );

  // Reference range from metricMeta target string
  const { min: refMin, max: refMax } = useMemo(
    () => parseReferenceRange(metricMeta[selectedMetric].target),
    [selectedMetric],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (insightCache.current[selectedMetric]) {
      setTrendInsight(insightCache.current[selectedMetric]);
      return;
    }

    const meta = metricMeta[selectedMetric];
    const dataPoints = HISTORICAL_TRENDS.map((t) => ({ date: t.date, value: t[selectedMetric] }));

    setInsightLoading(true);
    setTrendInsight('');

    fetch('/api/trend-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metricName: meta.name,
        unit: meta.unit,
        referenceRange: meta.target,
        dataPoints,
      }),
    })
      .then((res) => {
        if (!res.body) throw new Error('No stream.');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        const pump = (): Promise<void> =>
          reader.read().then(({ done, value }) => {
            if (done) {
              insightCache.current[selectedMetric] = accumulated;
              setInsightLoading(false);
              return;
            }
            for (const line of decoder.decode(value, { stream: true }).split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();
              if (payload === '[DONE]') continue;
              try {
                const parsed = JSON.parse(payload) as { text?: string };
                if (parsed.text) {
                  accumulated += parsed.text;
                  setTrendInsight(accumulated);
                }
              } catch { /* partial */ }
            }
            return pump();
          });

        return pump();
      })
      .catch(() => {
        setTrendInsight('Unable to load AI insight. Please try again.');
        setInsightLoading(false);
      });
  }, [selectedMetric, isOpen]);

  if (!isOpen) return null;

  const currentMeta = metricMeta[selectedMetric];

  // SVG Chart points calculation
  const getValues = () => HISTORICAL_TRENDS.map((t) => t[selectedMetric]);
  const values = getValues();
  const minVal = Math.min(...values) * 0.9;
  const maxVal = Math.max(...values) * 1.1;

  const chartHeight = 160;
  const chartWidth = 320;
  
  const points = HISTORICAL_TRENDS.map((t, idx) => {
    const x = (idx / (HISTORICAL_TRENDS.length - 1)) * (chartWidth - 40) + 20;
    const val = t[selectedMetric];
    const y = chartHeight - 20 - ((val - minVal) / (maxVal - minVal)) * (chartHeight - 40);
    return { x, y, val, date: t.date };
  });

  const svgPath = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl border border-outline-variant shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-fixed rounded-xl text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline-md text-lg font-bold text-on-surface">Lab Trend Analysis</h2>
              <p className="text-xs text-on-surface-variant">{selectedReport.title} Historical Insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Metric Selector Tabs */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-surface-container rounded-xl">
            {(['glucose', 'a1c', 'sodium', 'potassium'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMetric(m)}
                className={`py-2 px-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  selectedMetric === m
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {m === 'glucose' ? 'Glucose' : m === 'a1c' ? 'A1C' : m === 'sodium' ? 'Sodium' : 'Potassium'}
              </button>
            ))}
          </div>

          {/* Current Value & Target Card */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 flex justify-between items-center">
            <div>
              <span className="text-xs text-on-surface-variant font-medium block">Selected Parameter</span>
              <span className="text-base font-bold text-on-surface">{currentMeta.name}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-4 h-4 text-secondary" />
                <span className="text-xs font-semibold text-secondary">Optimal Range ({currentMeta.target})</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">
                {currentMeta.current} <span className="text-xs font-normal text-on-surface-variant">{currentMeta.unit}</span>
              </span>
              <span className="block text-[11px] text-secondary font-semibold mt-0.5">{currentMeta.trend}</span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" /> 6-Month Trajectory
              </span>
              <div className="flex gap-1 text-[11px]">
                <button
                  onClick={() => setTimeRange('6m')}
                  className={`px-2 py-0.5 rounded-md font-semibold ${timeRange === '6m' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}
                >
                  6M
                </button>
                <button
                  onClick={() => setTimeRange('1y')}
                  className={`px-2 py-0.5 rounded-md font-semibold ${timeRange === '1y' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}
                >
                  1Y
                </button>
              </div>
            </div>

            <div className="relative w-full flex justify-center py-2">
              <svg width={chartWidth} height={chartHeight} className="overflow-visible">
                {/* Horizontal reference grid lines */}
                <line x1="20" y1="40" x2={chartWidth - 20} y2="40" stroke="#e4e2e1" strokeDasharray="3 3" />
                <line x1="20" y1="80" x2={chartWidth - 20} y2="80" stroke="#e4e2e1" strokeDasharray="3 3" />
                <line x1="20" y1="120" x2={chartWidth - 20} y2="120" stroke="#e4e2e1" strokeDasharray="3 3" />

                {/* Line Path */}
                <path d={svgPath} fill="none" stroke={currentMeta.color} strokeWidth="3" strokeLinecap="round" />

                {/* Points */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      fill="#ffffff"
                      stroke={currentMeta.color}
                      strokeWidth="3"
                    />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#1b1c1c"
                    >
                      {p.val}
                    </text>
                    <text
                      x={p.x}
                      y={chartHeight - 2}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#737783"
                    >
                      {p.date.split(' ')[0]}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Recharts Trend Chart */}
          <TrendChart
            data={chartData}
            unit={currentMeta.unit}
            metricName={currentMeta.name}
            referenceMin={refMin}
            referenceMax={refMax}
          />

          {/* AI Clinical Insight */}
          <div className="p-3 bg-secondary-container/50 border border-secondary-fixed rounded-xl flex gap-3 items-start text-xs text-on-secondary-container">
            <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
            {insightLoading && !trendInsight ? (
              <div className="flex items-center gap-2 text-on-surface-variant">
                <div className="w-3 h-3 border border-secondary border-t-transparent rounded-full animate-spin shrink-0" />
                Analyzing trend…
              </div>
            ) : (
              <p className="leading-relaxed">{trendInsight}</p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-full"
          >
            Close
          </button>
          <button
            onClick={() => {
              alert('Trend summary report exported as CSV/PDF.');
            }}
            className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> Export Data
          </button>
        </div>
      </div>
    </div>
  );
};
