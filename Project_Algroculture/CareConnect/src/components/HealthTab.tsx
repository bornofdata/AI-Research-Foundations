import React, { useState } from 'react';
import {
  CheckCircle2,
  Info,
  Share2,
  ArrowUp,
  Check,
  Sparkles,
  Download,
  History,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { LAB_REPORTS } from '../data/mockData';
import { LabReport } from '../types';

interface HealthTabProps {
  onOpenPdf: (report: LabReport) => void;
  onOpenTrends: (report: LabReport) => void;
  onOpenAskFollowUp: (report: LabReport) => void;
}

export const HealthTab: React.FC<HealthTabProps> = ({
  onOpenPdf,
  onOpenTrends,
  onOpenAskFollowUp,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string>('report-2'); // default to Metabolic Panel
  const [copiedToast, setCopiedToast] = useState(false);

  const activeReport = LAB_REPORTS.find((r) => r.id === selectedReportId) || LAB_REPORTS[0];

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <main className="pt-20 pb-32 px-5 max-w-2xl mx-auto space-y-6">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" /> Report link copied to clipboard!
        </div>
      )}

      {/* Section: Chronological Recent Tests */}
      <section className="mb-6">
        <h2 className="font-headline-md text-xl font-bold text-on-surface mb-3 tracking-tight">
          Recent Reports
        </h2>
        <div className="flex gap-3 overflow-x-auto scroll-hide pb-2">
          {LAB_REPORTS.map((report) => {
            const isSelected = report.id === selectedReportId;
            return (
              <div
                key={report.id}
                onClick={() => setSelectedReportId(report.id)}
                className={`min-w-[140px] p-4 rounded-xl border shadow-sm flex flex-col gap-1 active:scale-95 transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-primary-container text-on-primary-container border-primary shadow-md'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant hover:border-primary/40'
                }`}
              >
                <span
                  className={`text-xs ${
                    isSelected ? 'opacity-80' : 'text-on-surface-variant'
                  }`}
                >
                  {report.shortDate}
                </span>
                <span
                  className={`font-semibold text-sm line-clamp-1 ${
                    isSelected ? 'text-white' : 'text-primary'
                  }`}
                >
                  {report.title.replace('Comprehensive ', '')}
                </span>
                <div className="mt-2 flex items-center gap-1">
                  {report.status === 'review' ? (
                    <Info
                      className={`w-4 h-4 ${
                        isSelected ? 'text-on-primary-container' : 'text-amber-600'
                      }`}
                    />
                  ) : (
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        isSelected ? 'text-on-primary-container' : 'text-secondary'
                      }`}
                    />
                  )}
                  <span className="text-xs font-bold capitalize">
                    {report.statusText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Selection Detail: Lab Report Card */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant custom-shadow transition-all duration-300">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface leading-snug">
              {activeReport.title}
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Processed at {activeReport.labLocation} • Order #{activeReport.orderNumber}
            </p>
          </div>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-surface-container text-outline hover:text-primary rounded-full transition-colors active:scale-90"
            title="Share Report"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Range Parameters (Glucose, A1C, WBC, Cholesterol, etc.) */}
        <div className="space-y-6">
          {activeReport.parameters
            .filter((p) => p.markerPercentage !== undefined)
            .map((param) => (
              <div key={param.id} className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-semibold text-sm text-on-surface">
                    {param.name}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-md text-xl font-bold text-primary">
                      {param.value}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {param.unit}
                    </span>
                  </div>
                </div>

                {/* Range Bar */}
                <div className="range-indicator mb-2">
                  <div
                    className="range-marker"
                    style={{ left: `${param.markerPercentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                  <span>{param.lowLabel || 'Low'}</span>
                  <span>{param.normalLabel || 'Normal'}</span>
                  <span>{param.highLabel || 'High'}</span>
                </div>
              </div>
            ))}

          {/* Grid Box Parameters (Sodium, Potassium, Hgb, Platelets, etc.) */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {activeReport.parameters
              .filter((p) => p.markerPercentage === undefined)
              .map((param) => (
                <div
                  key={param.id}
                  className="p-4 bg-surface-container rounded-xl space-y-1"
                >
                  <span className="text-xs text-on-surface-variant block">
                    {param.name}
                  </span>
                  <span className="font-headline-md text-xl font-bold text-on-surface block">
                    {param.value} <span className="text-xs font-normal">{param.unit}</span>
                  </span>
                  <span className="text-xs text-secondary font-semibold flex items-center gap-1 pt-0.5">
                    {param.status === 'optimal' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUp className="w-3.5 h-3.5" />
                    )}
                    {param.statusLabel}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Physician Notes / Interpretation Section */}
      {activeReport.physicianNote && (
        <section className="bg-secondary-container rounded-2xl p-5 border border-secondary-fixed transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-on-secondary-container shadow-xs">
              <img
                src={activeReport.physicianNote.doctorAvatar}
                alt={activeReport.physicianNote.doctorName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-sm text-on-secondary-container">
                {activeReport.physicianNote.doctorName}
              </p>
              <p className="text-xs text-on-secondary-fixed-variant">
                {activeReport.physicianNote.doctorRole}
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 relative shadow-xs">
            {/* Speech bubble tip */}
            <div className="absolute -top-2 left-6 w-4 h-4 bg-surface-container-lowest transform rotate-45 border-t border-l border-black/5" />
            <p className="text-sm text-on-surface leading-relaxed font-normal">
              {activeReport.physicianNote.message}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant italic">
                Message sent {activeReport.physicianNote.timestamp}
              </span>
              <button
                onClick={() => onOpenAskFollowUp(activeReport)}
                className="text-secondary font-semibold text-xs flex items-center gap-1 hover:underline active:scale-95 transition-transform"
              >
                Ask AI <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Additional Action Buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={() => onOpenPdf(activeReport)}
          className="h-[52px] bg-primary text-on-primary rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-primary/95 active:scale-95 transition-all"
        >
          <Download className="w-5 h-5" /> Download PDF Report
        </button>
        <button
          onClick={() => onOpenTrends(activeReport)}
          className="h-[52px] border-2 border-outline-variant text-primary hover:bg-surface-container rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
        >
          <History className="w-5 h-5" /> View Trend Analysis
        </button>
      </div>
    </main>
  );
};
