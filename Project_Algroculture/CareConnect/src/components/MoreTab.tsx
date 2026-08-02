import React, { useState } from 'react';
import {
  User,
  Shield,
  PhoneCall,
  Settings,
  Lock,
  ChevronRight,
  LogOut,
  Pill,
  CheckCircle2,
  Circle,
  NotebookPen,
} from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { Medication } from '../types';
import { loadSymptomLog } from './SymptomLogModal';

const todayKey = () => `careconnect_meds_${new Date().toISOString().split('T')[0]}`;

function loadAdherence(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(todayKey());
    return stored ? (JSON.parse(stored) as Record<string, boolean>) : {};
  } catch { return {}; }
}

function saveAdherence(state: Record<string, boolean>) {
  localStorage.setItem(todayKey(), JSON.stringify(state));
}

interface PatientProfile {
  name: string;
  avatar?: string;
  dob: string;
  mrn: string;
  insurance: string;
}

interface MoreTabProps {
  patient: PatientProfile;
  medications: Medication[];
}

export const MoreTab: React.FC<MoreTabProps> = ({ patient, medications }) => {
  const { signOut } = useClerk();
  const activeMeds = medications.filter((m) => m.active);
  const [takenMeds, setTakenMeds] = useState<Record<string, boolean>>(loadAdherence);
  const recentLogs = loadSymptomLog().slice(0, 3);

  const toggleMed = (id: string) => {
    setTakenMeds((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveAdherence(next);
      return next;
    });
  };

  const takenCount = activeMeds.filter((m) => takenMeds[m.id]).length;

  return (
    <main className="pt-20 pb-32 px-5 max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Patient Profile Card */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-xs flex items-center gap-4">
        {patient.avatar ? (
          <img
            src={patient.avatar}
            alt={patient.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-primary-fixed shadow-sm"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center border-2 border-primary-fixed shadow-sm">
            <User className="w-8 h-8 text-on-primary-container" />
          </div>
        )}
        <div className="space-y-0.5">
          <h1 className="font-bold text-lg text-on-surface">{patient.name}</h1>
          <p className="text-xs text-on-surface-variant">DOB: {patient.dob}</p>
          <span className="inline-block px-2 py-0.5 bg-primary-fixed text-primary font-bold text-[10px] rounded-md mt-1">
            {patient.mrn}
          </span>
        </div>
      </div>

      {/* Insurance Coverage */}
      <section className="bg-gradient-to-r from-secondary-container/70 to-surface-container p-5 rounded-2xl border border-secondary-fixed space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-on-secondary-container uppercase tracking-wide flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-secondary" /> Primary Health Insurance
          </span>
          <span className="text-xs font-bold text-secondary">Active</span>
        </div>
        <p className="font-bold text-sm text-on-surface">{patient.insurance}</p>
        <p className="text-xs text-on-surface-variant">In-Network Copay: $25 Specialist / $0 Preventative Labs</p>
      </section>

      {/* Medication Adherence */}
      {activeMeds.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <Pill className="w-4 h-4 text-secondary" /> Today's Medications
            </h2>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              takenCount === activeMeds.length
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-surface-container text-on-surface-variant'
            }`}>
              {takenCount}/{activeMeds.length} taken
            </span>
          </div>

          {takenCount === activeMeds.length && activeMeds.length > 0 && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              All medications taken for today. Great job!
            </div>
          )}

          <div className="space-y-2">
            {activeMeds.map((med) => {
              const taken = !!takenMeds[med.id];
              return (
                <button
                  key={med.id}
                  onClick={() => toggleMed(med.id)}
                  className={`w-full p-4 rounded-xl border flex items-center gap-3 text-left transition-all active:scale-[0.99] ${
                    taken
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-surface-container-lowest border-outline-variant'
                  }`}
                >
                  {taken
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    : <Circle className="w-5 h-5 text-outline shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${taken ? 'text-emerald-800 line-through' : 'text-on-surface'}`}>
                      {med.name}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {med.dosage} · {med.frequency}
                    </p>
                    {med.notes && (
                      <p className="text-[10px] text-on-surface-variant/70 mt-1 italic">{med.notes}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1 ${
                    taken ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary-container text-on-secondary-container'
                  }`}>
                    {taken ? 'Taken' : 'Pending'}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-on-surface-variant text-center">Tap a medication to mark it as taken · Resets daily</p>
        </section>
      )}

      {/* Symptom Journal */}
      {recentLogs.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
            <NotebookPen className="w-4 h-4 text-secondary" /> Recent Symptom Entries
          </h2>
          <div className="space-y-2">
            {recentLogs.map((entry) => (
              <div key={entry.id} className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant">
                <div className="flex justify-between items-start">
                  <div className="flex flex-wrap gap-1 flex-1 mr-3">
                    {entry.symptoms.length > 0
                      ? entry.symptoms.map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 bg-primary-fixed text-primary rounded-full font-medium">{s}</span>
                        ))
                      : <span className="text-xs text-on-surface-variant italic">Note only</span>
                    }
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    entry.severity <= 2 ? 'bg-emerald-100 text-emerald-700' :
                    entry.severity === 3 ? 'bg-amber-100 text-amber-700' :
                    'bg-error-container/50 text-error'
                  }`}>
                    Severity {entry.severity}/5
                  </span>
                </div>
                {entry.note && <p className="text-xs text-on-surface-variant mt-2 leading-snug">{entry.note}</p>}
                <p className="text-[10px] text-outline mt-2">
                  {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Menu Options */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant divide-y divide-outline-variant/40 overflow-hidden text-xs">
        {[
          { icon: User, label: 'Personal Information & Medical History' },
          { icon: PhoneCall, label: 'Emergency Contacts & Caregivers' },
          { icon: Lock, label: 'HIPAA Privacy & Security Controls' },
          { icon: Settings, label: 'Portal Preferences & Notifications' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="w-full p-4 flex items-center justify-between text-on-surface hover:bg-surface-container transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-container rounded-xl text-primary">
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-outline" />
          </button>
        ))}
      </div>

      {/* Sign Out */}
      <button
        onClick={() => signOut()}
        className="w-full py-3 text-xs font-bold text-error bg-error-container/30 hover:bg-error-container/60 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" /> Sign Out of CareConnect
      </button>
    </main>
  );
};
