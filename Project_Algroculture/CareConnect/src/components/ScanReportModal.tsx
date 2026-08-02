import React, { useState, useRef } from 'react';
import { X, ScanLine, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ExtractedParameter {
  name: string;
  value: string | number;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'high' | 'low' | 'optimal' | 'review';
  statusLabel: string;
}

interface ExtractedReport {
  title: string;
  date: string;
  labLocation: string;
  parameters: ExtractedParameter[];
}

interface ScanReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  normal: 'text-primary bg-primary-fixed',
  optimal: 'text-emerald-700 bg-emerald-50',
  high: 'text-error bg-error-container/40',
  low: 'text-amber-700 bg-amber-50',
  review: 'text-amber-700 bg-amber-50',
};

export const ScanReportModal: React.FC<ScanReportModalProps> = ({ isOpen, onClose }) => {
  const [stage, setStage] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [report, setReport] = useState<ExtractedReport | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (JPEG, PNG, WEBP).');
      setStage('error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image must be under 5 MB.');
      setStage('error');
      return;
    }

    setStage('loading');
    setReport(null);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);

      // Strip the "data:image/jpeg;base64," prefix
      const base64 = dataUrl.split(',')[1];

      try {
        const res = await fetch('/api/scan-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
        });
        const data = await res.json() as { report?: ExtractedReport; error?: string };
        if (data.error) throw new Error(data.error);
        if (!data.report?.parameters?.length) throw new Error('No lab values found in the image.');
        setReport(data.report);
        setStage('done');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Extraction failed.');
        setStage('error');
      }
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setStage('idle');
    setPreview(null);
    setReport(null);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full sm:max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-2xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-on-secondary" />
            </div>
            <div>
              <p className="font-bold text-sm text-on-surface">Scan Lab Report</p>
              <p className="text-[11px] text-on-surface-variant">AI extracts values from any lab printout</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Upload zone */}
          {stage === 'idle' && (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-outline-variant rounded-2xl p-10 flex flex-col items-center gap-3 text-on-surface-variant hover:border-primary/50 hover:bg-surface-container/30 transition-all"
            >
              <Upload className="w-10 h-10 text-outline" />
              <div className="text-center">
                <p className="font-semibold text-sm text-on-surface">Tap to upload a photo</p>
                <p className="text-xs mt-1">Take a photo of your lab report or select from your gallery</p>
                <p className="text-[10px] mt-2 text-outline">JPEG · PNG · WEBP · Max 5 MB</p>
              </div>
            </button>
          )}

          {/* Loading */}
          {stage === 'loading' && (
            <div className="space-y-4">
              {preview && (
                <img src={preview} alt="Uploaded report" className="w-full rounded-xl object-contain max-h-52 border border-outline-variant" />
              )}
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-semibold text-on-surface">Extracting lab values…</p>
                <p className="text-xs text-on-surface-variant">Gemini AI is reading your report</p>
              </div>
            </div>
          )}

          {/* Error */}
          {stage === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-error-container/30 border border-error/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-on-surface">Could not extract report</p>
                  <p className="text-xs text-on-surface-variant mt-1">{errorMsg}</p>
                </div>
              </div>
              <button onClick={reset} className="w-full py-2.5 text-xs font-bold text-primary border border-outline-variant rounded-xl hover:bg-surface-container transition-colors">
                Try Again
              </button>
            </div>
          )}

          {/* Results */}
          {stage === 'done' && report && (
            <div className="space-y-4">
              {preview && (
                <img src={preview} alt="Uploaded report" className="w-full rounded-xl object-contain max-h-40 border border-outline-variant" />
              )}

              <div className="flex items-center gap-2 text-secondary">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-on-surface">{report.title}</p>
                  <p className="text-[11px] text-on-surface-variant">{report.labLocation} · {report.date}</p>
                </div>
              </div>

              <div className="space-y-2">
                {report.parameters.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-container rounded-xl border border-outline-variant/60">
                    <div>
                      <p className="font-semibold text-xs text-on-surface">{p.name}</p>
                      {p.referenceRange && (
                        <p className="text-[10px] text-on-surface-variant">Ref: {p.referenceRange}</p>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-bold text-sm text-on-surface">{p.value} <span className="text-[10px] font-normal text-on-surface-variant">{p.unit}</span></span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? 'text-on-surface bg-surface-container'}`}>
                        {p.statusLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-on-surface-variant text-center">
                AI extraction — verify values against your original report before sharing with a physician.
              </p>

              <button onClick={reset} className="w-full py-2.5 text-xs font-bold text-on-surface-variant border border-outline-variant rounded-xl hover:bg-surface-container transition-colors">
                Scan Another Report
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
      </div>
    </div>
  );
};
