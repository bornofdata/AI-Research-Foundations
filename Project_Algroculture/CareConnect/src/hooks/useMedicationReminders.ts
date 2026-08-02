import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'careconnect_med_reminders';
const SESSION_KEY = 'careconnect_reminded_today';

export interface DueAlert {
  medName: string;
  time: string;
}

function loadReminders(): Record<string, string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function getReminedToday(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) ?? '';
    return new Set(raw.split(',').filter(Boolean));
  } catch {
    return new Set();
  }
}

function markRemindedToday(key: string) {
  try {
    const existing = getReminedToday();
    existing.add(key);
    sessionStorage.setItem(SESSION_KEY, Array.from(existing).join(','));
  } catch { /* */ }
}

export function useMedicationReminders() {
  const [dueAlerts, setDueAlerts] = useState<DueAlert[]>([]);

  useEffect(() => {
    const check = () => {
      const reminders = loadReminders();
      const now = new Date().toTimeString().slice(0, 5); // "HH:MM"
      const remindedToday = getReminedToday();

      Object.entries(reminders).forEach(([medName, reminderTime]) => {
        if (reminderTime !== now) return;

        const sessionKey = `${medName}:${reminderTime}`;
        if (remindedToday.has(sessionKey)) return;

        // Mark as shown for this session
        markRemindedToday(sessionKey);

        // Fire native browser notification if permitted
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Medication Reminder 💊', {
            body: `Time to take your ${medName}`,
            icon: '/icon.svg',
          });
        }

        // Always add in-app alert
        setDueAlerts((prev) => {
          // Avoid duplicates in the array
          if (prev.some((a) => a.medName === medName && a.time === reminderTime)) return prev;
          return [...prev, { medName, time: reminderTime }];
        });
      });
    };

    // Run immediately, then every 60 seconds
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  const clearAlert = useCallback((medName: string) => {
    setDueAlerts((prev) => prev.filter((a) => a.medName !== medName));
  }, []);

  return { dueAlerts, clearAlert };
}
