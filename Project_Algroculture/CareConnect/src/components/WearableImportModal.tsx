import React, { useState, useRef } from 'react';
import { X, Upload, ClipboardPaste, ChevronDown, ChevronUp, Download, Check } from 'lucide-react';

interface VitalReading {
  id: string;
  date: string; // ISO
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  glucose?: number;
  weight?: number;
  spo2?: number;
}

interface WearableImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

function isValidNumber(v: unknown): v is number {
  return typeof v === 'number' && !isNaN(v) && isFinite(v);
}

function parseNum(v: string | number | undefined | null): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function toISO(raw: string): string | null {
  try {
    const d = new Date(raw.trim());
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return null;
  } catch {
    return null;
  }
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function parseHealthData(raw: string): VitalReading[] {
  const results: VitalReading[] = [];
  const trimmed = raw.trim();

  // 1. JSON array
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed) as Record<string, unknown>[];
      if (Array.isArray(arr)) {
        for (const row of arr) {
          const dateRaw =
            (row['date'] as string) ??
            (row['Date'] as string) ??
            (row['startDate'] as string) ??
            (row['timestamp'] as string) ??
            '';
          const isoDate = toISO(String(dateRaw));
          if (!isoDate) continue;

          const reading: VitalReading = { id: makeId(), date: isoDate };
          const s = parseNum(row['systolic'] as string | number);
          const d = parseNum(row['diastolic'] as string | number);
          const hr = parseNum(
            (row['heartRate'] as string | number) ??
              (row['heart_rate'] as string | number) ??
              (row['HeartRate'] as string | number),
          );
          const gl = parseNum(
            (row['glucose'] as string | number) ??
              (row['bloodGlucose'] as string | number),
          );
          const wt = parseNum(
            (row['weight'] as string | number) ??
              (row['Weight'] as string | number),
          );
          const sp = parseNum(
            (row['spo2'] as string | number) ??
              (row['SpO2'] as string | number) ??
              (row['oxygen'] as string | number),
          );

          if (isValidNumber(s)) reading.systolic = s;
          if (isValidNumber(d)) reading.diastolic = d;
          if (isValidNumber(hr)) reading.heartRate = hr;
          if (isValidNumber(gl)) reading.glucose = gl;
          if (isValidNumber(wt)) reading.weight = wt;
          if (isValidNumber(sp)) reading.spo2 = sp;

          const hasData =
            reading.systolic !== undefined ||
            reading.diastolic !== undefined ||
            reading.heartRate !== undefined ||
            reading.glucose !== undefined ||
            reading.weight !== undefined ||
            reading.spo2 !== undefined;
          if (hasData) results.push(reading);
        }
        return results;
      }
    } catch {
      // fall through
    }
  }

  // Detect CSV lines
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return results;

  const HEADER_KEYS = ['date', 'systolic', 'diastolic', 'heartrate', 'glucose', 'weight', 'spo2'];

  const firstLineLower = lines[0].toLowerCase();
  const hasHeader = HEADER_KEYS.some((k) => firstLineLower.includes(k));

  // 2. CSV with header
  if (hasHeader) {
    try {
      const rawHeaders = lines[0].split(',').map((h) => h.trim().toLowerCase());
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        const obj: Record<string, string> = {};
        rawHeaders.forEach((h, idx) => { obj[h] = cols[idx] ?? ''; });

        const dateRaw =
          obj['date'] ?? obj['startdate'] ?? obj['timestamp'] ?? '';
        const isoDate = toISO(dateRaw);
        if (!isoDate) continue;

        const reading: VitalReading = { id: makeId(), date: isoDate };
        const s = parseNum(obj['systolic']);
        const d = parseNum(obj['diastolic'] ?? obj['diastolicbp'] ?? '');
        const hr = parseNum(obj['heartrate'] ?? obj['heart_rate'] ?? '');
        const gl = parseNum(obj['glucose'] ?? obj['bloodglucose'] ?? '');
        const wt = parseNum(obj['weight'] ?? '');
        const sp = parseNum(obj['spo2'] ?? obj['oxygen'] ?? '');

        if (isValidNumber(s)) reading.systolic = s;
        if (isValidNumber(d)) reading.diastolic = d;
        if (isValidNumber(hr)) reading.heartRate = hr;
        if (isValidNumber(gl)) reading.glucose = gl;
        if (isValidNumber(wt)) reading.weight = wt;
        if (isValidNumber(sp)) reading.spo2 = sp;

        const hasData =
          reading.systolic !== undefined ||
          reading.diastolic !== undefined ||
          reading.heartRate !== undefined ||
          reading.glucose !== undefined ||
          reading.weight !== undefined ||
          reading.spo2 !== undefined;
        if (hasData) results.push(reading);
      }
      return results;
    } catch {
      // fall through
    }
  }

  // 3. CSV without header: date,systolic,diastolic,heartRate,glucose,weight,spo2
  try {
    for (const line of lines) {
      const cols = line.split(',').map((c) => c.trim());
      if (cols.length < 2) continue;
      const isoDate = toISO(cols[0]);
      if (!isoDate) continue;

      const reading: VitalReading = { id: makeId(), date: isoDate };
      const s = parseNum(cols[1]);
      const d = parseNum(cols[2]);
      const hr = parseNum(cols[3]);
      const gl = parseNum(cols[4]);
      const wt = parseNum(cols[5]);
      const sp = parseNum(cols[6]);

      if (isValidNumber(s)) reading.systolic = s;
      if (isValidNumber(d)) reading.diastolic = d;
      if (isValidNumber(hr)) reading.heartRate = hr;
      if (isValidNumber(gl)) reading.glucose = gl;
      if (isValidNumber(wt)) reading.weight = wt;
      if (isValidNumber(sp)) reading.spo2 = sp;

      const hasData =
        reading.systolic !== undefined ||
        reading.diastolic !== undefined ||
        reading.heartRate !== undefined ||
        reading.glucose !== undefined ||
        reading.weight !== undefined ||
        reading.spo2 !== undefined;
      if (hasData) results.push(reading);
    }
  } catch {
    // fall through
  }

  // 4. Apple Health XML snippet — basic extraction
  if (results.length === 0 && trimmed.includes('<Record')) {
    try {
      const hrMatches = [
        ...trimmed.matchAll(
          /<Record[^>]*type="HKQuantityTypeIdentifierHeartRate"[^>]*value="([^"]+)"[^>]*startDate="([^"]+)"/g,
        ),
      ];
      for (const m of hrMatches) {
        const isoDate = toISO(m[2]);
        if (!isoDate) continue;
        const hr = parseNum(m[1]);
        if (!isValidNumber(hr)) continue;
        results.push({ id: makeId(), date: isoDate, heartRate: hr });
      }

      const bpSystolicMatches = [
        ...trimmed.matchAll(
          /<Record[^>]*type="HKQuantityTypeIdentifierBloodPressureSystolic"[^>]*value="([^"]+)"[^>]*startDate="([^"]+)"/g,
        ),
      ];
      for (const m of bpSystolicMatches) {
        const isoDate = toISO(m[2]);
        if (!isoDate) continue;
        const s = parseNum(m[1]);
        if (!isValidNumber(s)) continue;
        const existing = results.find((r) => r.date === isoDate);
        if (existing) {
          existing.systolic = s;
        } else {
          results.push({ id: makeId(), date: isoDate, systolic: s });
        }
      }

      const glucoseMatches = [
        ...trimmed.matchAll(
          /<Record[^>]*type="HKQuantityTypeIdentifierBloodGlucose"[^>]*value="([^"]+)"[^>]*startDate="([^"]+)"/g,
        ),
      ];
      for (const m of glucoseMatches) {
        const isoDate = toISO(m[2]);
        if (!isoDate) continue;
        const gl = parseNum(m[1]);
        if (!isValidNumber(gl)) continue;
        const existing = results.find((r) => r.date === isoDate);
        if (existing) {
          existing.glucose = gl;
        } else {
          results.push({ id: makeId(), date: isoDate, glucose: gl });
        }
      }
    } catch {
      // ignore
    }
  }

  return results;
}

const PREVIEW_COLS: { key: keyof VitalReading; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'systolic', label: 'Systolic' },
  { key: 'diastolic', label: 'Diastolic' },
  { key: 'heartRate', label: 'HR' },
  { key: 'glucose', label: 'Glucose' },
  { key: 'weight', label: 'Weight' },
  { key: 'spo2', label: 'SpO2' },
];

export const WearableImportModal: React.FC<WearableImportModalProps> = ({
  isOpen,
  onClose,
  onImported,
}) => {
  const [stage, setStage] = useState<'input' | 'preview'>('input');
  const [pasteText, setPasteText] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const [parsed, setParsed] = useState<VitalReading[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const hasInput = pasteText.trim().length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) setPasteText(text);
    };
    reader.readAsText(file);
  };

  const handleImportClick = () => {
    try {
      const rows = parseHealthData(pasteText);
      setParsed(rows);
      setStage('preview');
    } catch {
      setParsed([]);
      setStage('preview');
    }
  };

  const handleConfirm = () => {
    try {
      const existing: VitalReading[] = JSON.parse(
        localStorage.getItem('careconnect_vitals') ?? '[]',
      );
      const existingDates = new Set(existing.map((r) => r.date));
      const toAdd = parsed.filter((r) => !existingDates.has(r.date));
      const merged = [...existing, ...toAdd];
      localStorage.setItem('careconnect_vitals', JSON.stringify(merged));
      setSuccessMsg(`${toAdd.length} reading${toAdd.length !== 1 ? 's' : ''} imported!`);
      setTimeout(() => {
        setSuccessMsg('');
        onImported();
        handleReset();
      }, 1500);
    } catch {
      onImported();
      handleReset();
    }
  };

  const handleReset = () => {
    setStage('input');
    setPasteText('');
    setParsed([]);
    setGuideOpen(false);
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  };

  const handleBack = () => {
    setStage('input');
    setParsed([]);
  };

  if (!isOpen) return null;

  const previewRows = parsed.slice(0, 10);
  const overflow = parsed.length - previewRows.length;

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col animate-slideUp">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-outline-variant bg-surface-container-low">
        <h2 className="font-bold text-base text-on-surface">Import Wearable Data</h2>
        <button
          onClick={handleReset}
          className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* ── Stage 1: Input ── */}
        {stage === 'input' && (
          <>
            {/* Paste option */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <ClipboardPaste className="w-4 h-4 text-primary" />
                Paste Data
              </div>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={6}
                placeholder="Paste your Apple Health or Google Fit export data here (CSV or JSON)..."
                className="w-full bg-surface-container rounded-xl p-3 text-xs text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant focus:outline-none focus:border-primary resize-none font-mono"
              />
            </div>

            {/* Upload option */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <Upload className="w-4 h-4 text-primary" />
                Upload File
              </div>
              <label className="flex items-center justify-center gap-2 w-full h-[52px] border-2 border-dashed border-outline-variant rounded-xl text-xs font-semibold text-on-surface-variant hover:border-primary/60 hover:text-primary transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                Choose CSV, JSON, or TXT file
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.json,.txt"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
              {pasteText.length > 0 && fileRef.current?.files?.length ? (
                <p className="text-[11px] text-on-surface-variant">
                  File loaded — {fileRef.current.files[0].name}
                </p>
              ) : null}
            </div>

            {/* Format guide */}
            <div className="border border-outline-variant rounded-xl overflow-hidden">
              <button
                onClick={() => setGuideOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span>Format Guide</span>
                {guideOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {guideOpen && (
                <div className="px-4 pb-4 text-[11px] text-on-surface-variant space-y-1 border-t border-outline-variant/50 pt-3 font-mono leading-relaxed">
                  <p className="font-sans font-semibold text-xs text-on-surface mb-2">
                    Supported formats:
                  </p>
                  <p>• Apple Health CSV export (Health app → Profile → Export)</p>
                  <p>• Google Fit CSV (Takeout → Fit → Daily activity metrics)</p>
                  <p>• Manual CSV: date,systolic,diastolic,heartRate,glucose,weight,spo2</p>
                  <p className="pl-4 text-on-surface-variant/80">
                    Example: 2026-07-01,118,76,68,94,165,98
                  </p>
                </div>
              )}
            </div>

            {/* Import button */}
            <button
              onClick={handleImportClick}
              disabled={!hasInput}
              className="w-full h-[52px] bg-primary text-on-primary rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <Download className="w-5 h-5" />
              Import
            </button>
          </>
        )}

        {/* ── Stage 2: Preview ── */}
        {stage === 'preview' && (
          <>
            {parsed.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="w-12 h-12 bg-error-container rounded-full flex items-center justify-center">
                  <X className="w-6 h-6 text-on-error-container" />
                </div>
                <p className="font-bold text-sm text-on-surface">No recognizable health data found.</p>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  Check the format guide above and make sure your data contains dates and at
                  least one vital value.
                </p>
              </div>
            ) : (
              <>
                {/* Badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                    {parsed.length} reading{parsed.length !== 1 ? 's' : ''} detected
                  </span>
                </div>

                {/* Preview table */}
                <div className="overflow-x-auto rounded-xl border border-outline-variant">
                  <table className="w-full text-[11px] text-on-surface">
                    <thead>
                      <tr className="bg-surface-container">
                        {PREVIEW_COLS.map((col) => (
                          <th
                            key={col.key}
                            className="px-3 py-2 text-left font-semibold text-on-surface-variant whitespace-nowrap"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr
                          key={row.id}
                          className={i % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container/40'}
                        >
                          {PREVIEW_COLS.map((col) => (
                            <td key={col.key} className="px-3 py-1.5 whitespace-nowrap">
                              {row[col.key] !== undefined ? String(row[col.key]) : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {overflow > 0 && (
                    <p className="px-3 py-2 text-[11px] text-on-surface-variant border-t border-outline-variant/50">
                      …and {overflow} more reading{overflow !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-3 pt-1">
                  <button
                    onClick={handleConfirm}
                    className="w-full h-[52px] bg-primary text-on-primary rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
                  >
                    <Check className="w-5 h-5" />
                    Import All
                  </button>
                  <button
                    onClick={handleBack}
                    className="w-full h-[52px] rounded-full font-semibold text-sm flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors border border-outline-variant"
                  >
                    Back
                  </button>
                </div>
              </>
            )}

            {/* Back when 0 rows */}
            {parsed.length === 0 && (
              <button
                onClick={handleBack}
                className="w-full h-[52px] rounded-full font-semibold text-sm flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors border border-outline-variant"
              >
                Back
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
