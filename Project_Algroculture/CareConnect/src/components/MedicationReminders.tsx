import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, Clock } from 'lucide-react';
import { Medication } from '../types';

const STORAGE_KEY = 'careconnect_med_reminders';

function loadReminders(): Record<string, string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveReminders(reminders: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch { /* */ }
}

interface MedicationRemindersProps {
  medications: Medication[];
}

export const MedicationReminders: React.FC<MedicationRemindersProps> = ({ medications }) => {
  const activeMeds = medications.filter((m) => m.active);
  const [reminders, setReminders] = useState<Record<string, string>>(loadReminders);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );

  // Keep permission state in sync if the user changes it externally
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const handleTimeChange = async (medName: string, time: string) => {
    // If permission not yet granted, ask first
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await requestPermission();
      // Re-read after the await so we use the latest value
      setPermission(typeof Notification !== 'undefined' ? Notification.permission : 'default');
    }

    setReminders((prev) => {
      const next = { ...prev, [medName]: time };
      saveReminders(next);
      return next;
    });
  };

  const clearReminder = (medName: string) => {
    setReminders((prev) => {
      const next = { ...prev };
      delete next[medName];
      saveReminders(next);
      return next;
    });
  };

  if (activeMeds.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
        <Bell className="w-4 h-4 text-secondary" />
        Medication Reminders
      </h2>

      {/* Blocked warning */}
      {permission === 'denied' && (
        <div className="flex items-start gap-2 bg-error-container/30 border border-error/30 rounded-xl px-3 py-2.5 text-xs text-error">
          <BellOff className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Browser notifications are blocked. Enable them in your browser settings to receive
            alerts — in-app alerts will still work.
          </span>
        </div>
      )}

      {/* Permission prompt (shown once when status is default and user hasn't interacted yet) */}
      {permission === 'default' && (
        <div className="flex items-center justify-between bg-primary-fixed/40 border border-primary/20 rounded-xl px-3 py-2.5">
          <p className="text-xs text-on-surface">
            Enable notifications to receive alerts at reminder times.
          </p>
          <button
            onClick={requestPermission}
            className="ml-3 shrink-0 text-[11px] font-bold text-on-primary bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-full transition-colors"
          >
            Allow
          </button>
        </div>
      )}

      <div className="space-y-2">
        {activeMeds.map((med) => {
          const reminderTime = reminders[med.name] ?? '';
          return (
            <div
              key={med.id}
              className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant"
            >
              <Clock className="w-4 h-4 text-secondary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">{med.name}</p>
                <p className="text-[10px] text-on-surface-variant">{med.dosage} · {med.frequency}</p>
              </div>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => handleTimeChange(med.name, e.target.value)}
                aria-label={`Reminder time for ${med.name}`}
                className="text-xs text-on-surface bg-surface-container border border-outline-variant rounded-lg px-2 py-1.5 outline-none focus:border-primary transition-colors"
              />
              {reminderTime && (
                <button
                  onClick={() => clearReminder(med.name)}
                  aria-label={`Clear reminder for ${med.name}`}
                  className="p-1.5 rounded-full hover:bg-error-container/40 text-outline hover:text-error transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-on-surface-variant text-center">
        Daily reminders · Times stored on this device only
      </p>
    </section>
  );
};
