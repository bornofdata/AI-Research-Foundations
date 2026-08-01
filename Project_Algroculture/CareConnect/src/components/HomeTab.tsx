import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Stethoscope,
  Activity,
  ShieldCheck,
  Sparkles,
  Heart,
  FileText,
} from 'lucide-react';
import { PATIENT_INFO, APPOINTMENTS, LAB_REPORTS } from '../data/mockData';
import { TabType } from '../types';

interface HomeTabProps {
  onNavigateToTab: (tab: TabType) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onNavigateToTab }) => {
  const nextAppointment = APPOINTMENTS.find((a) => a.status === 'upcoming');
  const latestReport = LAB_REPORTS[0];

  return (
    <main className="pt-20 pb-32 px-5 max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-primary-container">
            Patient Portal
          </span>
          <h1 className="text-2xl font-bold">Good day, {PATIENT_INFO.name.split(' ')[0]} 👋</h1>
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
        </div>
      </section>

      {/* Vitals Summary Card */}
      <section className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-secondary" /> Latest Vitals Check
          </h2>
          <span className="text-[11px] text-on-surface-variant">Sync: Today 8:00 AM</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-surface-container rounded-xl">
            <span className="text-[11px] text-on-surface-variant block">Glucose</span>
            <span className="font-bold text-base text-primary">94 mg/dL</span>
            <span className="text-[10px] text-secondary font-semibold">Normal</span>
          </div>

          <div className="p-3 bg-surface-container rounded-xl">
            <span className="text-[11px] text-on-surface-variant block">Blood Pressure</span>
            <span className="font-bold text-base text-primary">118/76</span>
            <span className="text-[10px] text-secondary font-semibold">Optimal</span>
          </div>

          <div className="p-3 bg-surface-container rounded-xl">
            <span className="text-[11px] text-on-surface-variant block">Resting HR</span>
            <span className="font-bold text-base text-primary">68 bpm</span>
            <span className="text-[10px] text-secondary font-semibold">Normal</span>
          </div>
        </div>
      </section>

      {/* Preventive Wellness Note */}
      <div className="p-4 bg-secondary-container/40 rounded-2xl border border-secondary-fixed flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
        <div className="text-xs text-on-secondary-container space-y-1">
          <p className="font-bold">Personalized Wellness Advice</p>
          <p className="leading-relaxed">
            Your fasting glucose trends reflect great dietary control. Maintaining 30 minutes of routine daily activity will help preserve your optimal lipid score.
          </p>
        </div>
      </div>
    </main>
  );
};
