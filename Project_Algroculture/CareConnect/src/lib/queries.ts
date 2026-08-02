/**
 * All database query functions. Each returns data in the same shape as the
 * existing TypeScript types so components don't need to change.
 *
 * The server uses the service-role key (bypasses RLS).
 * The frontend uses the anon key (respects RLS — patients see only their data).
 */
import { supabase } from './supabase';
import {
  LabReport,
  Appointment,
  Message,
  NotificationItem,
  Medication,
} from '../types';

// ── Patient profile ───────────────────────────────────────────
export async function fetchPatient(patientId: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('*, doctors(*)')
    .eq('id', patientId)
    .single();
  if (error) throw error;
  return {
    name: data.name as string,
    dob: data.dob as string,
    mrn: data.mrn as string,
    insurance: data.insurance as string,
    primaryDoctor: (data.doctors as { name: string } | null)?.name ?? '',
  };
}

// ── Lab reports (with parameters + physician notes) ───────────
export async function fetchLabReports(patientId: string): Promise<LabReport[]> {
  const { data, error } = await supabase
    .from('lab_reports')
    .select(`
      *,
      test_parameters(*),
      physician_notes(*, doctors(*))
    `)
    .eq('patient_id', patientId)
    .order('date', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((r) => {
    const note = r.physician_notes?.[0];
    const doctor = note?.doctors;
    return {
      id: r.id,
      title: r.title,
      date: r.short_date ?? r.date,
      shortDate: r.short_date ?? r.date,
      orderNumber: r.order_number,
      labLocation: r.lab_location,
      status: r.status,
      statusText: r.status_text,
      parameters: (r.test_parameters ?? []).map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.name,
        value: p.value,
        unit: p.unit ?? '',
        markerPercentage: p.marker_percentage ?? undefined,
        status: p.status,
        statusLabel: p.status_label,
        lowLabel: p.low_label ?? undefined,
        normalLabel: p.normal_label ?? undefined,
        highLabel: p.high_label ?? undefined,
        referenceRange: p.reference_range ?? undefined,
      })),
      physicianNote: note
        ? {
            doctorName: doctor?.name ?? '',
            doctorRole: doctor?.role ?? '',
            doctorAvatar: doctor?.avatar_url ?? '',
            message: note.message,
            timestamp: new Date(note.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }),
          }
        : undefined,
    } as LabReport;
  });
}

// ── Appointments ──────────────────────────────────────────────
export async function fetchAppointments(patientId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, doctors(*)')
    .eq('patient_id', patientId)
    .order('date', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((a) => ({
    id: a.id,
    doctorName: a.doctors?.name ?? '',
    doctorRole: a.doctors?.role ?? '',
    doctorAvatar: a.doctors?.avatar_url ?? '',
    date: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: a.time,
    location: a.location,
    type: a.type,
    status: a.status,
  }));
}

// ── Messages ──────────────────────────────────────────────────
export async function fetchMessages(patientId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((m) => ({
    id: m.id,
    senderName: m.sender_name,
    senderRole: m.sender_role,
    senderAvatar: m.sender_avatar,
    text: m.text,
    timestamp: new Date(m.created_at).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }),
    isDoctor: m.sender_type === 'doctor',
    unread: !m.is_read,
  }));
}

// ── Notifications ─────────────────────────────────────────────
export async function fetchNotifications(patientId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    time: timeAgo(n.created_at),
    read: n.is_read,
    type: n.type,
  }));
}

// ── Medications ───────────────────────────────────────────────
export async function fetchMedications(patientId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*, doctors(*)')
    .eq('patient_id', patientId)
    .order('started_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    dosage: m.dosage,
    frequency: m.frequency,
    prescribingDoctor: m.doctors?.name ?? '',
    startedAt: m.started_at,
    endedAt: m.ended_at ?? undefined,
    notes: m.notes ?? undefined,
    active: !m.ended_at,
  }));
}

// ── Historical trends ─────────────────────────────────────────
export async function fetchHistoricalTrends(patientId: string) {
  const { data, error } = await supabase
    .from('historical_trends')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ── Helpers ───────────────────────────────────────────────────
function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
