import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, Clock, Play } from 'lucide-react';
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
  onTestAlert?: (medName: string) => void;
}

export const MedicationReminders: React.FC<MedicationRemindersProps> = ({ medications, onTestAlert }) => {
  const activeMeds = medications.filter((m) => m.active);
  const [reminders, setReminders] = useState<Record<string, string>>(loadReminders);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    setPermission(Notification.permission);
  }, []);

  // Must be called from a direct button click (browser user-gesture requirement)
  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const handleTimeChange = (medName: string, time: string) => {
    // Just save the time — do NOT call requestPermission() here.
    // Browsers block permission requests that aren't from a direct click event.
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

  // Test button: fires an immediate in-app alert (and a native notification if permitted)
  const handleTest = async (medName: string) => {
    // If permission not yet asked, request now (valid user gesture — button click)
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const result = await requestPermission();
      if (result === 'granted') {
        new Notification('Medication Reminder 💊', {
          body: `Time to take your ${medName}`,
          icon: '/icon.svg',
        });
      }
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Medication Reminder 💊', {
        body: `Time to take your ${medName}`,
        icon: '/icon.svg',
      });
    }
    // Always trigger in-app alert
    onTestAlert?.(medName);
  };

  if (activeMeds.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
          <Bell className="w-4 h-4 text-secondary" />
          Medication Reminders
        </h2>
        {permission === 'default' && (
          <button
            onClick={requestPermission}
            className="text-[11px] font-bold text-on-primary bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-full transition-colors"
          >
            Enable Alerts
          </button>
        )}
        {permission === 'granted' && (
          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
            <Bell className="w-3 h-3" /> On
          </span>
        )}
      </div>

      {/* Blocked warning */}
      {permission === 'denied' && (
        <div className="flex items-start gap-2 bg-error-container/30 border border-error/30 rounded-xl px-3 py-2.5 text-xs text-error">
          <BellOff className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Notifications are blocked in your browser settings. In-app alerts will still appear.
          </span>
        </div>
      )}

      {permission === 'default' && (
        <p className="text-xs text-on-surface-variant">
          Click <strong>Enable Alerts</strong> above to allow browser notifications, then set a time below.
        </p>
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
                  onClick={() => handleTest(med.name)}
                  aria-label={`Test reminder for ${med.name}`}
                  title="Test this reminder now"
                  className="p-1.5 rounded-full hover:bg-primary-container/40 text-outline hover:text-primary transition-colors shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}
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
        Daily reminders · Tap <Play className="w-2.5 h-2.5 inline" /> to test immediately
      </p>
    </section>
  );
};
