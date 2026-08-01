import React from 'react';
import {
  User,
  Shield,
  CreditCard,
  PhoneCall,
  Settings,
  Bell,
  Lock,
  Heart,
  ChevronRight,
  LogOut,
  FileCheck,
} from 'lucide-react';
import { PATIENT_INFO, DR_EMILY_CHEN } from '../data/mockData';

export const MoreTab: React.FC = () => {
  return (
    <main className="pt-20 pb-32 px-5 max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Patient Profile Card */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-xs flex items-center gap-4">
        <img
          src={PATIENT_INFO.avatar}
          alt={PATIENT_INFO.name}
          className="w-16 h-16 rounded-full object-cover border-2 border-primary-fixed shadow-sm"
        />
        <div className="space-y-0.5">
          <h1 className="font-bold text-lg text-on-surface">{PATIENT_INFO.name}</h1>
          <p className="text-xs text-on-surface-variant">DOB: {PATIENT_INFO.dob}</p>
          <span className="inline-block px-2 py-0.5 bg-primary-fixed text-primary font-bold text-[10px] rounded-md mt-1">
            {PATIENT_INFO.mrn}
          </span>
        </div>
      </div>

      {/* Insurance Coverage Preview */}
      <section className="bg-gradient-to-r from-secondary-container/70 to-surface-container p-5 rounded-2xl border border-secondary-fixed space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-on-secondary-container uppercase tracking-wide flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-secondary" /> Primary Health Insurance
          </span>
          <span className="text-xs font-bold text-secondary">Active</span>
        </div>
        <p className="font-bold text-sm text-on-surface">{PATIENT_INFO.insurance}</p>
        <p className="text-xs text-on-surface-variant">In-Network Copay: $25 Specialist / $0 Preventative Labs</p>
      </section>

      {/* Menu Options Group */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant divide-y divide-outline-variant/40 overflow-hidden text-xs">
        <button className="w-full p-4 flex items-center justify-between text-on-surface hover:bg-surface-container transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-container rounded-xl text-primary">
              <User className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">Personal Information & Medical History</span>
          </div>
          <ChevronRight className="w-4 h-4 text-outline" />
        </button>

        <button className="w-full p-4 flex items-center justify-between text-on-surface hover:bg-surface-container transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-container rounded-xl text-primary">
              <PhoneCall className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">Emergency Contacts & Caregivers</span>
          </div>
          <ChevronRight className="w-4 h-4 text-outline" />
        </button>

        <button className="w-full p-4 flex items-center justify-between text-on-surface hover:bg-surface-container transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-container rounded-xl text-primary">
              <Lock className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">HIPAA Privacy & Security Controls</span>
          </div>
          <ChevronRight className="w-4 h-4 text-outline" />
        </button>

        <button className="w-full p-4 flex items-center justify-between text-on-surface hover:bg-surface-container transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-container rounded-xl text-primary">
              <Settings className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">Portal Preferences & Notifications</span>
          </div>
          <ChevronRight className="w-4 h-4 text-outline" />
        </button>
      </div>

      {/* Sign Out Button */}
      <button className="w-full py-3 text-xs font-bold text-error bg-error-container/30 hover:bg-error-container/60 rounded-xl transition-colors flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" /> Sign Out of CareConnect
      </button>
    </main>
  );
};
