import React, { useState, useMemo } from 'react';
import { X, Copy, Share2, Download, Check } from 'lucide-react';
import { LabReport } from '../types';

interface LabShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LabReport | null;
}

function loadMRN(): string {
  try {
    const card = localStorage.getItem('careconnect_emergency_card');
    if (!card) return 'On file';
    const parsed = JSON.parse(card) as Record<string, string>;
    return (parsed['mrn'] as string) || 'On file';
  } catch {
    return 'On file';
  }
}

function buildSummary(report: LabReport, mrn: string): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const optimal = report.parameters.filter(
    (p) => p.status === 'optimal' || p.status === 'normal',
  ).length;
  const review = report.parameters.filter(
    (p) => p.status === 'review' || p.status === 'high' || p.status === 'low',
  ).length;

  const divider = '─────────────────────────────';

  const paramLines = report.parameters
    .map((p) => {
      const ref = p.referenceRange ? ` (ref: ${p.referenceRange})` : '';
      return `• ${p.name}: ${p.value} ${p.unit} — ${p.statusLabel}${ref}`;
    })
    .join('\n');

  return [
    'LABORATORY REPORT SUMMARY',
    `Generated: ${today}`,
    divider,
    `Report: ${report.title}`,
    `Date: ${report.date}`,
    `Patient MRN: ${mrn}`,
    '',
    'RESULTS:',
    paramLines,
    '',
    'SUMMARY:',
    `${report.parameters.length} parameters tested | ${optimal} optimal | ${review} need review`,
    '',
    'Generated via CareConnect Patient Portal',
  ].join('\n');
}

export const LabShareModal: React.FC<LabShareModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [copiedState, setCopiedState] = useState<'idle' | 'copied'>('idle');

  const mrn = useMemo(() => loadMRN(), []);

  const formattedText = useMemo(() => {
    if (!report) return '';
    return buildSummary(report, mrn);
  }, [report, mrn]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopiedState('copied');
      setTimeout(() => setCopiedState('idle'), 2000);
    } catch {
      // fallback: select + copy via execCommand (older browsers)
      const el = document.createElement('textarea');
      el.value = formattedText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedState('copied');
      setTimeout(() => setCopiedState('idle'), 2000);
    }
  };

  const handleShare = async () => {
    if (!!navigator.share) {
      try {
        await navigator.share({
          title: `Lab Report — ${report?.title ?? 'Summary'}`,
          text: formattedText,
        });
        return;
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    // fallback
    await handleCopy();
  };

  const handleDownload = () => {
    if (!report) return;
    const safeName = report.title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    const safeDate = report.date.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    const filename = `lab-report-${safeName}-${safeDate}.txt`;
    const blob = new Blob([formattedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !report) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
        role="dialog"
        aria-modal="true"
        aria-label={`Share lab report: ${report.title}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-outline-variant flex items-start justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base text-on-surface">Share Lab Report</h2>
            <p className="text-xs text-on-surface-variant mt-0.5 truncate">{report.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Formatted preview */}
          <pre className="bg-surface-container rounded-xl p-3 text-xs font-mono text-on-surface overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {formattedText}
          </pre>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleCopy}
              className="w-full h-[52px] bg-primary text-on-primary rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
            >
              {copiedState === 'copied' ? (
                <>
                  <Check className="w-5 h-5" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" /> Copy to Clipboard
                </>
              )}
            </button>

            <button
              onClick={handleShare}
              className="w-full h-[52px] border-2 border-outline-variant text-on-surface hover:bg-surface-container rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <Share2 className="w-5 h-5" /> Share
            </button>

            <button
              onClick={handleDownload}
              className="w-full h-[52px] border-2 border-outline-variant text-on-surface hover:bg-surface-container rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <Download className="w-5 h-5" /> Download as .txt
            </button>
          </div>
        </div>

        {/* Safe area spacer */}
        <div className="h-safe-b shrink-0 pb-2" />
      </div>
    </>
  );
};
