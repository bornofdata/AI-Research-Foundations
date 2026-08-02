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
  Sun,
  Moon,
  HeartPulse,
  Pencil,
  Copy,
  Check,
  X,
  Download,
  Info,
} from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { Medication, LabReport, Appointment } from '../types';
import { loadSymptomLog } from './SymptomLogModal';
import { MedicationReminders } from './MedicationReminders';
import { useMedicationReminders } from '../hooks/useMedicationReminders';
import { HealthExportModal } from './HealthExportModal';
import { MedInfoModal } from './MedInfoModal';

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

// ─── Emergency Card ───────────────────────────────────────────────────────────

interface EmergencyCard {
  bloodType: string;
  allergies: string;
  conditions: string;
  emergencyName: string;
  emergencyPhone: string;
}

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
  } catch { return DEFAULT_EMERGENCY_CARD; }
}

function saveEmergencyCard(card: EmergencyCard) {
  try { localStorage.setItem(EMERGENCY_CARD_KEY, JSON.stringify(card)); } catch { /* */ }
}

function EmergencyCardSection() {
  const [card, setCard] = useState<EmergencyCard>(loadEmergencyCard);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EmergencyCard>(card);
  const [copied, setCopied] = useState(false);

  const handleEdit = () => {
    setDraft(card);
    setEditing(true);
  };

  const handleSave = () => {
    setCard(draft);
    saveEmergencyCard(draft);
    setEditing(false);
  };

  const handleCancel = () => setEditing(false);

  const handleCopy = () => {
    const summary = `Blood Type: ${card.bloodType} | Allergies: ${card.allergies} | Conditions: ${card.conditions} | Emergency Contact: ${card.emergencyName} (${card.emergencyPhone})`;
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* clipboard unavailable */ });
  };

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-error" />
          Emergency Info
        </h2>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary px-2.5 py-1 rounded-full bg-primary-fixed hover:bg-primary-fixed/70 transition-colors"
              aria-label="Copy emergency summary"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
          {!editing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors"
              aria-label="Edit emergency card"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="text-[11px] font-semibold text-on-surface-variant px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="text-[11px] font-bold text-on-primary px-2.5 py-1 rounded-full bg-primary hover:bg-primary/90 transition-colors"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
        {/* Blood type banner */}
        <div className="bg-error/10 border-b border-outline-variant/40 px-5 py-3 flex items-center gap-3">
          <span className="text-2xl font-extrabold text-error tracking-tight">
            {editing ? (
              <input
                value={draft.bloodType}
                onChange={(e) => setDraft({ ...draft, bloodType: e.target.value })}
                className="w-16 text-2xl font-extrabold text-error bg-transparent border-b-2 border-error outline-none"
                aria-label="Blood type"
              />
            ) : card.bloodType}
          </span>
          <div>
            <p className="text-[10px] font-bold text-error uppercase tracking-wider">Blood Type</p>
            <p className="text-[10px] text-on-surface-variant">Verified on file</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Allergies */}
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Allergies</p>
            {editing ? (
              <input
                value={draft.allergies}
                onChange={(e) => setDraft({ ...draft, allergies: e.target.value })}
                className="w-full text-sm text-on-surface bg-surface-container rounded-lg px-3 py-2 border border-outline-variant outline-none focus:border-primary"
                aria-label="Allergies"
              />
            ) : (
              <p className="text-sm font-medium text-on-surface">{card.allergies}</p>
            )}
          </div>

          {/* Conditions */}
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Chronic Conditions</p>
            {editing ? (
              <input
                value={draft.conditions}
                onChange={(e) => setDraft({ ...draft, conditions: e.target.value })}
                className="w-full text-sm text-on-surface bg-surface-container rounded-lg px-3 py-2 border border-outline-variant outline-none focus:border-primary"
                aria-label="Chronic conditions"
              />
            ) : (
              <p className="text-sm font-medium text-on-surface">{card.conditions}</p>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="pt-2 border-t border-outline-variant/40">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Emergency Contact</p>
            {editing ? (
              <div className="space-y-2">
                <input
                  value={draft.emergencyName}
                  onChange={(e) => setDraft({ ...draft, emergencyName: e.target.value })}
                  placeholder="Contact name"
                  className="w-full text-sm text-on-surface bg-surface-container rounded-lg px-3 py-2 border border-outline-variant outline-none focus:border-primary"
                  aria-label="Emergency contact name"
                />
                <input
                  value={draft.emergencyPhone}
                  onChange={(e) => setDraft({ ...draft, emergencyPhone: e.target.value })}
                  placeholder="Phone number"
                  className="w-full text-sm text-on-surface bg-surface-container rounded-lg px-3 py-2 border border-outline-variant outline-none focus:border-primary"
                  aria-label="Emergency contact phone"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-fixed rounded-xl">
                  <PhoneCall className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{card.emergencyName}</p>
                  <p className="text-xs text-on-surface-variant">{card.emergencyPhone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

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
  isDark: boolean;
  toggleTheme: () => void;
  labReports: LabReport[];
  appointments: Appointment[];
  patientContext: string;
}

export const MoreTab: React.FC<MoreTabProps> = ({ patient, medications, isDark, toggleTheme, labReports, appointments, patientContext }) => {
  const { signOut } = useClerk();
  const activeMeds = medications.filter((m) => m.active);
  const [takenMeds, setTakenMeds] = useState<Record<string, boolean>>(loadAdherence);
  const recentLogs = loadSymptomLog().slice(0, 3);
  const { dueAlerts, clearAlert, addAlert } = useMedicationReminders();
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);

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
      {/* Medication due-alert banners */}
      {dueAlerts.length > 0 && (
        <div className="space-y-2">
          {dueAlerts.map((alert) => (
            <div
              key={alert.medName}
              className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg shrink-0">💊</span>
                <p className="text-sm font-semibold text-amber-900 truncate">
                  Time to take your <span className="font-bold">{alert.medName}</span>
                </p>
              </div>
              <button
                onClick={() => clearAlert(alert.medName)}
                aria-label={`Dismiss reminder for ${alert.medName}`}
                className="shrink-0 p-1.5 rounded-full hover:bg-amber-200 text-amber-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

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

      {/* Emergency Info Card */}
      <EmergencyCardSection />

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
                <div
                  key={med.id}
                  className={`w-full rounded-xl border flex items-center gap-3 transition-all ${
                    taken
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-surface-container-lowest border-outline-variant'
                  }`}
                >
                  {/* Main tap area — toggles adherence */}
                  <button
                    onClick={() => toggleMed(med.id)}
                    className="flex-1 p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-all"
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

                  {/* Info button — opens MedInfoModal */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMed(med);
                    }}
                    className="p-3 pr-4 text-on-surface-variant hover:text-primary transition-colors shrink-0"
                    aria-label={`Info about ${med.name}`}
                    title={`Learn about ${med.name}`}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-on-surface-variant text-center">Tap a medication to mark it as taken · Tap ℹ for AI info · Resets daily</p>
        </section>
      )}

      {/* Medication Reminders */}
      <MedicationReminders medications={medications} onTestAlert={addAlert} />

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
        {/* Dark Mode Toggle */}
        <div className="w-full p-4 flex items-center justify-between text-on-surface">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-container rounded-xl text-primary">
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <span className="font-semibold text-sm">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <button
            onClick={toggleTheme}
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              isDark ? 'bg-primary' : 'bg-outline-variant'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Export Health Summary */}
        <button
          onClick={() => setExportOpen(true)}
          className="w-full p-4 flex items-center justify-between text-on-surface hover:bg-surface-container transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-container rounded-xl text-primary">
              <Download className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">Export Health Summary</span>
          </div>
          <ChevronRight className="w-4 h-4 text-outline" />
        </button>

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

      {/* Health Export Modal */}
      <HealthExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        patient={patient}
        medications={medications}
        labReports={labReports}
        appointments={appointments}
      />

      {/* AI Medication Info Modal */}
      <MedInfoModal
        isOpen={!!selectedMed}
        onClose={() => setSelectedMed(null)}
        medication={selectedMed}
        patientContext={patientContext}
      />
    </main>
  );
};
