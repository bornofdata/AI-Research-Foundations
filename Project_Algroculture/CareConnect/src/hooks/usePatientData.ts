/**
 * Single hook that loads all patient data from Supabase.
 * Falls back to mock data if Supabase is not configured (no env vars).
 * Components import this hook instead of importing from mockData directly.
 */
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  fetchPatient,
  fetchLabReports,
  fetchAppointments,
  fetchMessages,
  fetchNotifications,
  fetchMedications,
  fetchHistoricalTrends,
} from '../lib/queries';
import {
  PATIENT_INFO,
  LAB_REPORTS,
  APPOINTMENTS,
  INITIAL_MESSAGES,
  NOTIFICATIONS,
  HISTORICAL_TRENDS,
} from '../data/mockData';
import { LabReport, Appointment, Message, NotificationItem, Medication } from '../types';

const MOCK_MEDICATIONS: Medication[] = [
  { id: 'm1', name: 'Vitamin D3', dosage: '2000 IU', frequency: 'Once daily', prescribingDoctor: 'Dr. Emily Chen', startedAt: '2023-01-01', active: true },
  { id: 'm2', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', prescribingDoctor: 'Dr. Emily Chen', startedAt: '2022-06-01', active: true, notes: 'Preventive — borderline fasting glucose in 2022' },
  { id: 'm3', name: 'Levothyroxine', dosage: '50mcg', frequency: 'Once daily (AM)', prescribingDoctor: 'Dr. Emily Chen', startedAt: '2021-03-15', active: true, notes: 'Hypothyroidism management' },
];

const isSupabaseConfigured = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface PatientData {
  patient: typeof PATIENT_INFO;
  labReports: LabReport[];
  appointments: Appointment[];
  messages: Message[];
  notifications: NotificationItem[];
  medications: Medication[];
  historicalTrends: typeof HISTORICAL_TRENDS;
  loading: boolean;
  error: string | null;
}

export function usePatientData(): PatientData {
  const { user } = useUser();

  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const [patient, setPatient] = useState(PATIENT_INFO);
  const [labReports, setLabReports] = useState<LabReport[]>(LAB_REPORTS);
  const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(NOTIFICATIONS);
  const [medications, setMedications] = useState<Medication[]>(MOCK_MEDICATIONS);
  const [historicalTrends, setHistoricalTrends] = useState(HISTORICAL_TRENDS);

  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) return;

    const patientId = user.id;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [p, lr, apt, msg, notif, meds, trends] = await Promise.all([
          fetchPatient(patientId),
          fetchLabReports(patientId),
          fetchAppointments(patientId),
          fetchMessages(patientId),
          fetchNotifications(patientId),
          fetchMedications(patientId),
          fetchHistoricalTrends(patientId),
        ]);
        setPatient({ ...PATIENT_INFO, ...p });
        setLabReports(lr);
        setAppointments(apt);
        setMessages(msg);
        setNotifications(notif);
        setMedications(meds);
        setHistoricalTrends(trends);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load patient data';
        setError(msg);
        // Keep mock data as fallback so the app stays usable
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.id]);

  return { patient, labReports, appointments, messages, notifications, medications, historicalTrends, loading, error };
}
