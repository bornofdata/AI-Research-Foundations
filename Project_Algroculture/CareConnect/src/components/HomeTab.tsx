import React from 'react';
import {
  Calendar,
  MapPin,
  ChevronRight,
  Stethoscope,
  Activity,
  FileText,
  NotebookPen,
  History,
} from 'lucide-react';
import { TabType, Appointment, LabReport } from '../types';
import { AIHealthBrief } from './AIHealthBrief';
import { HealthGoals } from './HealthGoals';

interface PatientProfile { name: string; }

interface HomeTabProps {
  patient: PatientProfile;
  appointments: Appointment[];
  labReports: LabReport[];
  onNavigateToTab: (tab: TabType) => void;
  patientContext: string;
  onOpenSymptomLog: () => void;
  onOpenTimeline: () => void;
}

function computeHealthScore(labReports: LabReport[]) {
  const allParams = labReports.flatMap((r) => r.parameters);
  if (!allParams.length) return null;
  const weights: Record<string, number> = { optimal: 100, normal: 85, review: 55, high: 45, low: 45 };
  const avg = allParams.reduce((sum, p) => sum + (weights[p.status] ?? 50), 0) / allParams.length;
  const score = Math.round(avg);
  const label = score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : score >= 65 ? 'Fair' : 'Needs Attention';
  const color = score >= 90 ? 'text-emerald-600' : score >= 80 ? 'text-primary' : score >= 65 ? 'text-amber-600' : 'text-error';
  const ring = score >= 90 ? 'border-emerald-400' : score >= 80 ? 'border-primary' : score >= 65 ? 'border-amber-400' : 'border-error';
  return { score, label, color, ring };
}

export const HomeTab: React.FC<HomeTabProps> = ({ patient, appointments, labReports, onNavigateToTab, patientContext, onOpenSymptomLog, onOpenTimeline }) => {
  const nextAppointment = appointments.find((a) => a.status === 'upcoming');
  const healthScore = computeHealthScore(labReports);

  return (
    <main className="pt-20 pb-32 px-5 max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-primary-container">
            Patient Portal
          </span>
          <h1 className="text-2xl font-bold">Good day, {patient.name.split(' ')[0]} 👋</h1>
          <p className="text-xs text-on-primary-container leading-relaxed max-w-sm">
            All recent metabolic and diagnostic panel records are updated. Your health metrics are on track.
          </p>
          <button
            onClick={() => onNavigateToTab('health')}
            className="mt-3 px-4 py-2 bg-surface text-primary rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-white active:scale-95 transition-all"
          >
            <Stethoscope className="w-4 h-4" /> View Latest Labs <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upcoming Visit Card */}
      {nextAppointment && (
        <section className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant shadow-xs space-y-3">
          <div className="flex justify-between items-center border-b border-outline-variant/50 pb-3">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" /> Upcoming Visit
            </span>
            <button
              onClick={() => onNavigateToTab('visits')}
              className="text-xs text-secondary font-semibold hover:underline flex items-center gap-0.5"
            >
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <img
              src={nextAppointment.doctorAvatar}
              alt={nextAppointment.doctorName}
              className="w-12 h-12 rounded-full object-cover border border-outline-variant"
            />
            <div>
              <h3 className="font-bold text-sm text-on-surface">{nextAppointment.doctorName}</h3>
              <p className="text-xs text-on-surface-variant">{nextAppointment.doctorRole}</p>
              <p className="text-xs font-medium text-primary mt-1">
                {nextAppointment.date} at {nextAppointment.time}
              </p>
            </div>
          </div>

          <div className="p-3 bg-surface-container rounded-xl text-xs text-on-surface-variant flex items-center gap-2">
            <MapPin className="w-4 h-4 text-outline shrink-0" />
            <span className="truncate">{nextAppointment.location}</span>
          </div>
        </section>
      )}

      {/* Quick Action Tiles */}
      <section className="space-y-3">
        <h2 className="font-bold text-base text-on-surface">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigateToTab('health')}
            className="p-4 bg-surface-container rounded-2xl border border-outline-variant/60 text-left hover:border-primary/50 transition-all space-y-2 group"
          >
            <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface">Lab Results</h3>
              <p className="text-xs text-on-surface-variant">View tests & downloads</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateToTab('inbox')}
            className="p-4 bg-surface-container rounded-2xl border border-outline-variant/60 text-left hover:border-primary/50 transition-all space-y-2 group"
          >
            <div className="w-10 h-10 bg-secondary-container text-on-secondary-container rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface">Ask Care Team</h3>
              <p className="text-xs text-on-surface-variant">Message Dr. Emily Chen</p>
            </div>
          </button>

          <button
            onClick={onOpenSymptomLog}
            className="col-span-2 p-4 bg-surface-container rounded-2xl border border-outline-variant/60 text-left hover:border-secondary/50 transition-all flex items-center gap-4 group"
          >
            <div className="w-10 h-10 bg-secondary-container text-on-secondary-container rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <NotebookPen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface">Log Today's Symptoms</h3>
              <p className="text-xs text-on-surface-variant">Track how you feel between appointments</p>
            </div>
          </button>

          <button
            onClick={onOpenTimeline}
            className="col-span-2 p-4 bg-surface-container rounded-2xl border border-outline-variant/60 text-left hover:border-primary/50 transition-all flex items-center gap-4 group"
          >
            <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface">View Health Timeline</h3>
              <p className="text-xs text-on-surface-variant">All health events in one chronological feed</p>
            </div>
          </button>
        </div>
      </section>

      {/* Vitals Summary + Health Score */}
      <section className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-secondary" /> Latest Vitals Check
          </h2>
          <span className="text-[11px] text-on-surface-variant">Sync: Today 8:00 AM</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Glucose', value: '94', unit: 'mg/dL', status: 'Normal', color: 'text-primary' },
            { label: 'Blood Pressure', value: '118/76', unit: 'mmHg', status: 'Optimal', color: 'text-emerald-600' },
            { label: 'Resting HR', value: '68', unit: 'bpm', status: 'Normal', color: 'text-primary' },
          ].map(({ label, value, unit, status, color }) => (
            <div key={label} className="p-3 bg-surface-container rounded-xl flex flex-col items-center text-center gap-1">
              <span className="text-[10px] text-on-surface-variant leading-tight">{label}</span>
              <span className={`font-bold text-xl leading-none ${color}`}>{value}</span>
              <span className="text-[10px] text-on-surface-variant leading-none">{unit}</span>
              <span className="text-[10px] font-semibold text-secondary mt-0.5">{status}</span>
            </div>
          ))}
        </div>

        {healthScore && (
          <div className="flex items-center gap-4 pt-2 border-t border-outline-variant/40">
            <div className={`w-14 h-14 rounded-full border-4 ${healthScore.ring} flex flex-col items-center justify-center shrink-0`}>
              <span className={`font-bold text-base leading-none ${healthScore.color}`}>{healthScore.score}</span>
              <span className="text-[9px] text-on-surface-variant leading-none mt-0.5">/ 100</span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">Overall Health Score</p>
              <p className={`text-xs font-semibold ${healthScore.color}`}>{healthScore.label}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Based on {labReports.flatMap(r => r.parameters).length} lab parameters</p>
            </div>
          </div>
        )}
      </section>

      {/* AI Health Brief */}
      <AIHealthBrief patientContext={patientContext} />

      {/* Health Goals */}
      <HealthGoals patientContext={patientContext} />
    </main>
  );
};
