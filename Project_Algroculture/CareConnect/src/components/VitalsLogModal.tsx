import React, { useState } from 'react';
import { X, Activity } from 'lucide-react';

interface VitalsLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface FormValues {
  systolic: string;
  diastolic: string;
  heartRate: string;
  glucose: string;
  weight: string;
  spo2: string;
}

interface FormErrors {
  systolic?: string;
  diastolic?: string;
  heartRate?: string;
  glucose?: string;
  weight?: string;
  spo2?: string;
}

const RANGES = {
  systolic: { min: 60, max: 250, label: 'Systolic BP', unit: 'mmHg', placeholder: 'e.g. 118' },
  diastolic: { min: 40, max: 150, label: 'Diastolic BP', unit: 'mmHg', placeholder: 'e.g. 76' },
  heartRate: { min: 30, max: 220, label: 'Heart Rate', unit: 'bpm', placeholder: 'e.g. 68' },
  glucose: { min: 20, max: 600, label: 'Blood Glucose', unit: 'mg/dL', placeholder: 'e.g. 94' },
  weight: { min: 50, max: 800, label: 'Weight', unit: 'lbs', placeholder: 'e.g. 165' },
  spo2: { min: 70, max: 100, label: 'Oxygen Saturation', unit: '%', placeholder: 'e.g. 98' },
};

type VitalField = keyof typeof RANGES;

function validateField(field: VitalField, value: string): string | undefined {
  if (!value.trim()) return undefined;
  const num = parseFloat(value);
  if (isNaN(num)) return 'Invalid number';
  const { min, max } = RANGES[field];
  if (num < min || num > max) return `Must be ${min}–${max}`;
  return undefined;
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export const VitalsLogModal: React.FC<VitalsLogModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [values, setValues] = useState<FormValues>({
    systolic: '',
    diastolic: '',
    heartRate: '',
    glucose: '',
    weight: '',
    spo2: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  if (!isOpen) return null;

  const handleChange = (field: VitalField, raw: string) => {
    setValues((prev) => ({ ...prev, [field]: raw }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, raw) }));
  };

  const hasAnyValue = Object.values(values).some((v) => v.trim() !== '');

  const handleSave = () => {
    // Validate all entered fields
    const newErrors: FormErrors = {};
    let valid = true;
    (Object.keys(RANGES) as VitalField[]).forEach((field) => {
      const err = validateField(field, values[field]);
      if (err) { newErrors[field] = err; valid = false; }
    });
    setErrors(newErrors);
    if (!valid) return;

    // Build reading object — only include fields with valid numeric input
    const reading: Record<string, unknown> = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    (Object.keys(RANGES) as VitalField[]).forEach((field) => {
      const v = values[field].trim();
      if (v !== '') {
        const num = parseFloat(v);
        if (!isNaN(num)) reading[field] = num;
      }
    });

    // Append to localStorage
    const existing: Record<string, unknown>[] = JSON.parse(
      localStorage.getItem('careconnect_vitals') ?? '[]',
    );
    existing.push(reading);
    localStorage.setItem('careconnect_vitals', JSON.stringify(existing));

    // Reset form
    setValues({ systolic: '', diastolic: '', heartRate: '', glucose: '', weight: '', spo2: '' });
    setErrors({});

    onSaved();
    onClose();
  };

  const handleClose = () => {
    setValues({ systolic: '', diastolic: '', heartRate: '', glucose: '', weight: '', spo2: '' });
    setErrors({});
    onClose();
  };

  const inputClass = (field: VitalField) =>
    `w-full text-sm p-2.5 rounded-xl border bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 ${
      errors[field] ? 'border-error' : 'border-outline-variant'
    }`;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleClose} />

      {/* Dialog card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base text-on-surface">Log Vitals</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-on-surface-variant mb-5">{todayLabel()}</p>

          <div className="space-y-4">
            {/* Blood Pressure — 2-column grid with "/" separator */}
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
                Blood Pressure
              </label>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      value={values.systolic}
                      onChange={(e) => handleChange('systolic', e.target.value)}
                      placeholder={RANGES.systolic.placeholder}
                      className={inputClass('systolic')}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-outline pointer-events-none">
                      {RANGES.systolic.unit}
                    </span>
                  </div>
                  {errors.systolic && (
                    <p className="text-[10px] text-error mt-0.5">{errors.systolic}</p>
                  )}
                  <p className="text-[10px] text-outline mt-0.5">Systolic</p>
                </div>

                <span className="text-on-surface-variant font-bold text-base mt-2.5">/</span>

                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      value={values.diastolic}
                      onChange={(e) => handleChange('diastolic', e.target.value)}
                      placeholder={RANGES.diastolic.placeholder}
                      className={inputClass('diastolic')}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-outline pointer-events-none">
                      {RANGES.diastolic.unit}
                    </span>
                  </div>
                  {errors.diastolic && (
                    <p className="text-[10px] text-error mt-0.5">{errors.diastolic}</p>
                  )}
                  <p className="text-[10px] text-outline mt-0.5">Diastolic</p>
                </div>
              </div>
            </div>

            {/* Remaining fields — single column */}
            {(['heartRate', 'glucose', 'weight', 'spo2'] as VitalField[]).map((field) => (
              <div key={field}>
                <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
                  {RANGES[field].label}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={values[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder={RANGES[field].placeholder}
                    className={inputClass(field)}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-outline pointer-events-none">
                    {RANGES[field].unit}
                  </span>
                </div>
                {errors[field] && (
                  <p className="text-[10px] text-error mt-0.5">{errors[field]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 text-sm font-semibold text-on-surface-variant bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasAnyValue}
              className="flex-1 py-2.5 text-sm font-bold text-on-primary bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Reading
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
