import React, { useState } from 'react';
import { Calculator, Pencil, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InsuranceProfile {
  planName: string;
  planType: 'HMO' | 'PPO' | 'EPO' | 'HDHP';
  deductible: number;
  deductibleMet: number;
  outOfPocketMax: number;
  outOfPocketMet: number;
  primaryCopay: number;
  specialistCopay: number;
  urgentCareCopay: number;
  erCopay: number;
  labCopay: number;
  genericDrugCopay: number;
  brandDrugCopay: number;
}

const INSURANCE_KEY = 'careconnect_insurance';

const DEFAULT_INSURANCE: InsuranceProfile = {
  planName: 'BlueCross BlueShield PPO',
  planType: 'PPO',
  deductible: 1500,
  deductibleMet: 420,
  outOfPocketMax: 5000,
  outOfPocketMet: 420,
  primaryCopay: 25,
  specialistCopay: 50,
  urgentCareCopay: 75,
  erCopay: 250,
  labCopay: 0,
  genericDrugCopay: 10,
  brandDrugCopay: 35,
};

// Reasonable full-cost estimates per visit type (used when deductible not met)
const FULL_COST_ESTIMATES: Record<string, number> = {
  primary: 150,
  specialist: 250,
  urgent: 300,
  er: 1200,
  lab: 80,
  generic: 15,
  brand: 80,
};

function loadInsurance(): InsuranceProfile {
  try {
    const stored = localStorage.getItem(INSURANCE_KEY);
    return stored ? (JSON.parse(stored) as InsuranceProfile) : DEFAULT_INSURANCE;
  } catch {
    return DEFAULT_INSURANCE;
  }
}

function saveInsurance(profile: InsuranceProfile) {
  try {
    localStorage.setItem(INSURANCE_KEY, JSON.stringify(profile));
  } catch { /* quota */ }
}

// ─── Visit options ────────────────────────────────────────────────────────────

interface VisitOption {
  key: string;
  label: string;
  getCopay: (p: InsuranceProfile) => number | null;
  copayLabel: (p: InsuranceProfile) => string;
}

const VISIT_OPTIONS: VisitOption[] = [
  {
    key: 'primary',
    label: 'Primary Care Visit',
    getCopay: (p) => p.primaryCopay,
    copayLabel: (p) => `$${p.primaryCopay}`,
  },
  {
    key: 'specialist',
    label: 'Specialist Visit',
    getCopay: (p) => p.specialistCopay,
    copayLabel: (p) => `$${p.specialistCopay}`,
  },
  {
    key: 'urgent',
    label: 'Urgent Care',
    getCopay: (p) => p.urgentCareCopay,
    copayLabel: (p) => `$${p.urgentCareCopay}`,
  },
  {
    key: 'er',
    label: 'Emergency Room',
    getCopay: (p) => p.erCopay,
    copayLabel: (p) => `$${p.erCopay}`,
  },
  {
    key: 'lab',
    label: 'Lab Work',
    getCopay: (p) => p.labCopay,
    copayLabel: (p) => (p.labCopay === 0 ? 'Free (covered)' : `$${p.labCopay}`),
  },
  {
    key: 'generic',
    label: 'Generic Prescription',
    getCopay: (p) => p.genericDrugCopay,
    copayLabel: (p) => `$${p.genericDrugCopay}`,
  },
  {
    key: 'brand',
    label: 'Brand Name Prescription',
    getCopay: (p) => p.brandDrugCopay,
    copayLabel: (p) => `$${p.brandDrugCopay}`,
  },
];

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ met, total, label }: { met: number; total: number; label: string }) {
  const pct = Math.min(100, total > 0 ? (met / total) * 100 : 0);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-semibold text-on-surface-variant">{label}</span>
        <span className="text-[11px] font-bold text-on-surface">
          ${met.toLocaleString()} / ${total.toLocaleString()} met
        </span>
      </div>
      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  profile: InsuranceProfile;
  onSave: (p: InsuranceProfile) => void;
  onCancel: () => void;
}

function EditModal({ profile, onSave, onCancel }: EditModalProps) {
  const [draft, setDraft] = useState<InsuranceProfile>({ ...profile });

  const field = (
    label: string,
    key: keyof InsuranceProfile,
    type: 'text' | 'number' = 'number',
    prefix?: string,
  ) => (
    <div key={key}>
      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">{prefix}</span>
        )}
        <input
          type={type}
          value={String(draft[key])}
          onChange={(e) => setDraft({ ...draft, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
          className={`w-full text-sm text-on-surface bg-surface-container rounded-lg border border-outline-variant outline-none focus:border-primary px-3 py-2 ${prefix ? 'pl-6' : ''}`}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base text-on-surface">Edit Insurance Plan</h2>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Plan name */}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                Plan Name
              </label>
              <input
                type="text"
                value={draft.planName}
                onChange={(e) => setDraft({ ...draft, planName: e.target.value })}
                className="w-full text-sm text-on-surface bg-surface-container rounded-lg border border-outline-variant outline-none focus:border-primary px-3 py-2"
              />
            </div>

            {/* Plan type */}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                Plan Type
              </label>
              <select
                value={draft.planType}
                onChange={(e) => setDraft({ ...draft, planType: e.target.value as InsuranceProfile['planType'] })}
                className="w-full text-sm text-on-surface bg-surface-container rounded-lg border border-outline-variant outline-none focus:border-primary px-3 py-2"
              >
                <option value="HMO">HMO</option>
                <option value="PPO">PPO</option>
                <option value="EPO">EPO</option>
                <option value="HDHP">HDHP</option>
              </select>
            </div>

            <div className="border-t border-outline-variant/40 pt-4">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Deductible & Out-of-Pocket</p>
              <div className="space-y-3">
                {field('Annual Deductible', 'deductible', 'number', '$')}
                {field('Deductible Met So Far', 'deductibleMet', 'number', '$')}
                {field('Out-of-Pocket Max', 'outOfPocketMax', 'number', '$')}
                {field('Out-of-Pocket Met So Far', 'outOfPocketMet', 'number', '$')}
              </div>
            </div>

            <div className="border-t border-outline-variant/40 pt-4">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Visit Copays</p>
              <div className="space-y-3">
                {field('Primary Care Copay', 'primaryCopay', 'number', '$')}
                {field('Specialist Copay', 'specialistCopay', 'number', '$')}
                {field('Urgent Care Copay', 'urgentCareCopay', 'number', '$')}
                {field('ER Copay', 'erCopay', 'number', '$')}
                {field('Lab Copay (0 = free)', 'labCopay', 'number', '$')}
              </div>
            </div>

            <div className="border-t border-outline-variant/40 pt-4">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Prescription Copays</p>
              <div className="space-y-3">
                {field('Generic Drug Copay', 'genericDrugCopay', 'number', '$')}
                {field('Brand Name Drug Copay', 'brandDrugCopay', 'number', '$')}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 text-sm font-semibold text-on-surface-variant bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(draft)}
              className="flex-1 py-2.5 text-sm font-bold text-on-primary bg-primary rounded-xl hover:bg-primary/90 transition-colors"
            >
              Save Plan
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function CopayEstimator() {
  const [profile, setProfile] = useState<InsuranceProfile>(loadInsurance);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<string>('');

  const handleSave = (updated: InsuranceProfile) => {
    setProfile(updated);
    saveInsurance(updated);
    setEditOpen(false);
  };

  const deductibleMet = profile.deductibleMet >= profile.deductible;
  const remaining = profile.deductible - profile.deductibleMet;

  const selectedOption = VISIT_OPTIONS.find((o) => o.key === selectedVisit);
  const copayAmount = selectedOption ? selectedOption.getCopay(profile) : null;
  const copayLabel = selectedOption ? selectedOption.copayLabel(profile) : '';
  const fullCostEstimate = selectedVisit ? FULL_COST_ESTIMATES[selectedVisit] : null;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          Copay Estimator
        </h2>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors"
          aria-label="Edit insurance plan"
        >
          <Pencil className="w-3 h-3" /> Edit Plan
        </button>
      </div>

      {/* Plan badge */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full">
          {profile.planType}
        </span>
        <span className="text-xs text-on-surface-variant truncate">{profile.planName}</span>
      </div>

      {/* Deductible progress bars */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 space-y-4">
        <ProgressBar
          met={profile.deductibleMet}
          total={profile.deductible}
          label="Annual Deductible"
        />
        <ProgressBar
          met={profile.outOfPocketMet}
          total={profile.outOfPocketMax}
          label="Out-of-Pocket Max"
        />
      </div>

      {/* Visit cost estimator */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 space-y-4">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
          Estimate Visit Cost
        </p>
        <select
          value={selectedVisit}
          onChange={(e) => setSelectedVisit(e.target.value)}
          className="w-full text-sm text-on-surface bg-surface-container rounded-xl border border-outline-variant outline-none focus:border-primary px-3 py-2.5"
        >
          <option value="">Select visit type…</option>
          {VISIT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label} — {o.copayLabel(profile)}
            </option>
          ))}
        </select>

        {/* Result card */}
        {selectedOption && (
          <div
            className={`rounded-xl border p-4 space-y-3 ${
              deductibleMet
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            {/* Estimated cost */}
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-extrabold ${
                  deductibleMet ? 'text-emerald-700' : 'text-amber-800'
                }`}
              >
                {copayLabel}
              </span>
              <span className="text-xs text-on-surface-variant">estimated cost</span>
            </div>

            {/* Deductible note */}
            {deductibleMet ? (
              <p className="text-xs font-medium text-emerald-700">
                Deductible already met — copay applies.
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-amber-800">
                  Deductible not yet met — you pay full cost until{' '}
                  <span className="font-bold">${remaining.toLocaleString()} more</span> is paid.
                </p>
                {fullCostEstimate !== null && (
                  <p className="text-xs text-amber-700">
                    Estimated full cost for this visit:{' '}
                    <span className="font-bold">~${fullCostEstimate.toLocaleString()}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editOpen && (
        <EditModal
          profile={profile}
          onSave={handleSave}
          onCancel={() => setEditOpen(false)}
        />
      )}
    </section>
  );
}
