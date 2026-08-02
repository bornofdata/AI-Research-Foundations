import React, { useEffect, useState } from 'react';
import { X, Printer, Copy, Check, FileText } from 'lucide-react';
import { LabReport, Appointment, Medication } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatientProfile {
  name: string;
  dob: string;
  mrn: string;
  insurance: string;
}

interface EmergencyCard {
  bloodType: string;
  allergies: string;
  conditions: string;
  emergencyName: string;
  emergencyPhone: string;
}

interface HealthExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  medications: Medication[];
  labReports: LabReport[];
  appointments: Appointment[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMERGENCY_CARD_KEY = 'careconnect_emergency_card';
const DEFAULT_EMERGENCY_CARD: EmergencyCard = {
  bloodType: 'A+',
  allergies: 'None known',
  conditions: 'Pre-diabetic (managed)',
  emergencyName: 'John Jenkins',
  emergencyPhone: '555-0100',
};

function loadEmergencyCard(): EmergencyCard {
  try {
    const stored = localStorage.getItem(EMERGENCY_CARD_KEY);
    return stored ? (JSON.parse(stored) as EmergencyCard) : DEFAULT_EMERGENCY_CARD;
  } catch {
    return DEFAULT_EMERGENCY_CARD;
  }
}

function computeHealthScore(labReports: LabReport[]) {
  const allParams = labReports.flatMap((r) => r.parameters);
  if (!allParams.length) return null;
  const weights: Record<string, number> = { optimal: 100, normal: 85, review: 55, high: 45, low: 45 };
  const avg = allParams.reduce((sum, p) => sum + (weights[p.status] ?? 50), 0) / allParams.length;
  const score = Math.round(avg);
  const label = score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : score >= 65 ? 'Fair' : 'Needs Attention';
  return { score, label };
}

function statusColor(status: string): string {
  switch (status) {
    case 'optimal':
    case 'normal':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'review':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'high':
    case 'low':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

function buildPlainText(
  patient: PatientProfile,
  emergencyCard: EmergencyCard,
  healthScore: { score: number; label: string } | null,
  activeMeds: Medication[],
  labReports: LabReport[],
  upcomingAppointments: Appointment[],
  healthBrief: string | null,
): string {
  const lines: string[] = [];
  const sep = '─'.repeat(50);

  lines.push('CARECONNECT — HEALTH SUMMARY EXPORT');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(sep);

  lines.push('PATIENT INFORMATION');
  lines.push(`Name:      ${patient.name}`);
  lines.push(`DOB:       ${patient.dob}`);
  lines.push(`MRN:       ${patient.mrn}`);
  lines.push(`Insurance: ${patient.insurance}`);
  lines.push(`Blood Type: ${emergencyCard.bloodType}`);
  lines.push(sep);

  if (healthScore) {
    lines.push('HEALTH SCORE');
    lines.push(`${healthScore.score} / 100 — ${healthScore.label}`);
    lines.push(sep);
  }

  if (activeMeds.length > 0) {
    lines.push('ACTIVE MEDICATIONS');
    activeMeds.forEach((m) => {
      lines.push(`• ${m.name} — ${m.dosage}, ${m.frequency}`);
    });
    lines.push(sep);
  }

  if (labReports.length > 0) {
    lines.push('RECENT LAB REPORTS');
    labReports.forEach((report) => {
      lines.push(`\n${report.title} (${report.date})`);
      report.parameters.forEach((p) => {
        lines.push(`  ${p.name}: ${p.value} ${p.unit} (${p.statusLabel})`);
      });
    });
    lines.push(sep);
  }

  if (upcomingAppointments.length > 0) {
    lines.push('UPCOMING APPOINTMENTS');
    upcomingAppointments.forEach((apt) => {
      lines.push(`• ${apt.doctorName} — ${apt.date} at ${apt.time}, ${apt.location}`);
    });
    lines.push(sep);
  }

  lines.push('EMERGENCY INFO');
  lines.push(`Allergies:   ${emergencyCard.allergies}`);
  lines.push(`Conditions:  ${emergencyCard.conditions}`);
  lines.push(`Emergency Contact: ${emergencyCard.emergencyName} (${emergencyCard.emergencyPhone})`);
  lines.push(sep);

  lines.push('AI HEALTH BRIEF');
  lines.push(healthBrief ?? 'Not yet generated');
  lines.push(sep);

  lines.push('Confidential Medical Record — Protected under HIPAA regulations.');
  lines.push('CareConnect Patient Health Portal');

  return lines.join('\n');
}

// ─── Component ────────────────────────────────────────────────────────────────

export const HealthExportModal: React.FC<HealthExportModalProps> = ({
  isOpen,
  onClose,
  patient,
  medications,
  labReports,
  appointments,
}) => {
  const [copied, setCopied] = useState(false);

  const emergencyCard = loadEmergencyCard();
  const healthScore = computeHealthScore(labReports);
  const activeMeds = medications.filter((m) => m.active);
  const upcomingAppointments = appointments.filter((a) => a.status === 'upcoming');

  const healthBrief: string | null = (() => {
    try {
      return sessionStorage.getItem('careconnect_health_brief');
    } catch {
      return null;
    }
  })();

  // Inject @media print styles so only the export area prints
  useEffect(() => {
    if (!isOpen) return;

    const styleId = 'health-export-print-styles';
    const existing = document.getElementById(styleId);
    if (!existing) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @media print {
          @page { margin: 1cm; }
          body > * { display: none !important; }
          #health-export-print-area {
            display: block !important;
            position: fixed;
            inset: 0;
            width: 100%;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Georgia, serif;
            font-size: 12pt;
            line-height: 1.5;
            padding: 0;
            margin: 0;
            z-index: 99999;
          }
          #health-export-print-area .print-hide { display: none !important; }
          #health-export-print-area .print-section {
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid #ccc;
          }
          #health-export-print-area table {
            width: 100%;
            border-collapse: collapse;
          }
          #health-export-print-area th,
          #health-export-print-area td {
            border: 1px solid #ccc;
            padding: 4px 8px;
            text-align: left;
          }
          #health-export-print-area th {
            background: #f0f0f0 !important;
            font-weight: bold;
          }
          #health-export-print-area .status-badge {
            background: none !important;
            border: none !important;
            font-weight: bold;
            color: #000 !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [isOpen]);

  const handleCopy = () => {
    const text = buildPlainText(
      patient,
      emergencyCard,
      healthScore,
      activeMeds,
      labReports,
      upcomingAppointments,
      healthBrief,
    );
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => { /* clipboard unavailable */ });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-outline-variant shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-slate-800">

        {/* Header */}
        <div className="p-4 bg-primary text-on-primary flex justify-between items-center print-hide shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-fixed-dim" />
            <span className="font-bold text-sm tracking-wide">Health Summary Export</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              aria-label="Print health summary"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-secondary-container text-on-secondary-container text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              aria-label="Copy health summary to clipboard"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Summary'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-full transition-colors ml-2"
              aria-label="Close export modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content / print area */}
        <div
          id="health-export-print-area"
          className="p-6 md:p-8 overflow-y-auto space-y-6 font-sans text-sm"
        >
          {/* Document header */}
          <div className="flex justify-between items-start border-b-2 border-primary/20 pb-4 print-section">
            <div>
              <h1 className="text-2xl font-black text-primary uppercase tracking-tight">CareConnect</h1>
              <p className="text-xs text-slate-500 font-medium">Patient Health Summary</p>
              <p className="text-xs text-slate-400">Generated: {new Date().toLocaleString()}</p>
            </div>
            <div className="text-right text-xs">
              <span className="inline-block bg-primary/10 text-primary px-2.5 py-1 font-bold rounded-md">
                {patient.mrn}
              </span>
            </div>
          </div>

          {/* ── Patient Info ── */}
          <section className="print-section">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-1 mb-3 uppercase tracking-wide text-xs text-slate-500">
              Patient Information
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px] mb-0.5">Full Name</p>
                <p className="font-bold text-slate-800 text-sm">{patient.name}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px] mb-0.5">Date of Birth</p>
                <p className="font-semibold text-slate-700">{patient.dob}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px] mb-0.5">MRN</p>
                <p className="font-semibold text-slate-700">{patient.mrn}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px] mb-0.5">Insurance</p>
                <p className="font-semibold text-slate-700">{patient.insurance}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px] mb-0.5">Blood Type</p>
                <p className="font-bold text-red-600 text-sm">{emergencyCard.bloodType}</p>
              </div>
            </div>
          </section>

          {/* ── Health Score ── */}
          {healthScore && (
            <section className="print-section">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-3">
                Health Score
              </h2>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="w-16 h-16 rounded-full border-4 border-primary/40 flex flex-col items-center justify-center shrink-0">
                  <span className="font-bold text-xl text-primary leading-none">{healthScore.score}</span>
                  <span className="text-[9px] text-slate-400 leading-none mt-0.5">/ 100</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-base">{healthScore.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Based on {labReports.flatMap((r) => r.parameters).length} lab parameters across {labReports.length} report{labReports.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ── Active Medications ── */}
          {activeMeds.length > 0 && (
            <section className="print-section">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-3">
                Active Medications
              </h2>
              <div className="space-y-2">
                {activeMeds.map((med) => (
                  <div
                    key={med.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800">{med.name}</p>
                      <p className="text-slate-500 mt-0.5">
                        {med.dosage} &middot; {med.frequency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Lab Reports ── */}
          {labReports.length > 0 && (
            <section className="print-section">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-3">
                Recent Lab Reports
              </h2>
              <div className="space-y-5">
                {labReports.map((report) => (
                  <div key={report.id}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-slate-800 text-sm">{report.title}</p>
                      <span className="text-xs text-slate-400">{report.date}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                            <th className="py-2 px-3">Parameter</th>
                            <th className="py-2 px-3">Value</th>
                            <th className="py-2 px-3">Unit</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {report.parameters.map((param) => (
                            <tr key={param.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-700">{param.name}</td>
                              <td className="py-2 px-3 font-bold text-slate-900">{param.value}</td>
                              <td className="py-2 px-3 text-slate-500">{param.unit}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`status-badge inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusColor(param.status)}`}
                                >
                                  {param.statusLabel}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Upcoming Appointments ── */}
          {upcomingAppointments.length > 0 && (
            <section className="print-section">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-3">
                Upcoming Appointments
              </h2>
              <div className="space-y-2">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                  >
                    <p className="font-bold text-slate-800">{apt.doctorName}</p>
                    <p className="text-slate-600 mt-0.5">{apt.doctorRole}</p>
                    <p className="text-primary font-semibold mt-1">
                      {apt.date} at {apt.time}
                    </p>
                    <p className="text-slate-500 mt-0.5">{apt.location}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Emergency Info ── */}
          <section className="print-section">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-3">
              Emergency Info
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3 text-xs">
              <div>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-0.5">Allergies</p>
                <p className="font-semibold text-slate-800">{emergencyCard.allergies}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-0.5">Chronic Conditions</p>
                <p className="font-semibold text-slate-800">{emergencyCard.conditions}</p>
              </div>
              <div className="pt-2 border-t border-red-200">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-0.5">Emergency Contact</p>
                <p className="font-bold text-slate-800">{emergencyCard.emergencyName}</p>
                <p className="text-slate-600 mt-0.5">{emergencyCard.emergencyPhone}</p>
              </div>
            </div>
          </section>

          {/* ── AI Health Brief ── */}
          <section className="print-section">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-3">
              AI Health Brief
            </h2>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {healthBrief ?? (
                <span className="italic text-slate-400">Not yet generated — visit the Home tab to generate your AI Health Brief.</span>
              )}
            </div>
          </section>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-1">
            <p>Confidential Medical Record — Protected under HIPAA regulations.</p>
            <p>CareConnect Patient Health Portal &bull; Generated electronically on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
