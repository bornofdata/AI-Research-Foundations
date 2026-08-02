import React from 'react';
import {
  User,
  Shield,
  PhoneCall,
  Settings,
  Lock,
  ChevronRight,
  LogOut,
  Pill,
} from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { Medication } from '../types';

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

      {/* Current Medications */}
      {activeMeds.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
            <Pill className="w-4 h-4 text-secondary" /> Current Medications
          </h2>
          <div className="space-y-2">
            {activeMeds.map((med) => (
              <div
                key={med.id}
                className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant flex justify-between items-start"
              >
                <div>
                  <p className="font-semibold text-sm text-on-surface">{med.name}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {med.dosage} · {med.frequency}
                  </p>
                  {med.notes && (
                    <p className="text-[10px] text-on-surface-variant/70 mt-1 italic">{med.notes}</p>
                  )}
                </div>
                <span className="text-[10px] font-bold text-secondary bg-secondary-container px-2 py-0.5 rounded-full shrink-0 ml-2">
                  Active
                </span>
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
