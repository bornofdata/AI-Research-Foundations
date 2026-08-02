import {
  LAB_REPORTS,
  PATIENT_INFO,
  INITIAL_MESSAGES,
  APPOINTMENTS,
  HISTORICAL_TRENDS,
} from '../data/mockData';
import { LabReport, Medication } from '../types';

/**
 * Serialises all patient data into a structured text block for the Gemini
 * system prompt. Accepts optional real data from Supabase; falls back to
 * mock data for any argument not provided.
 */
export function buildPatientContext(
  focusedReport?: LabReport,
  medications?: Medication[],
  historicalTrends?: unknown[],
): string {
  const lines: string[] = [];

  // ── Patient profile ──────────────────────────────────────────────────────
  lines.push('## PATIENT PROFILE');
  lines.push(`Name: ${PATIENT_INFO.name}`);
  lines.push(`Date of Birth: ${PATIENT_INFO.dob}`);
  lines.push(`MRN: ${PATIENT_INFO.mrn}`);
  lines.push(`Primary Physician: ${PATIENT_INFO.primaryDoctor}`);
  lines.push(`Insurance: ${PATIENT_INFO.insurance}`);

  // ── Lab reports ──────────────────────────────────────────────────────────
  lines.push('\n## LAB REPORTS');
  for (const report of LAB_REPORTS) {
    lines.push(
      `\n### ${report.title} — ${report.date} | Overall status: ${report.statusText}`
    );
    lines.push(`Lab: ${report.labLocation} | Order #${report.orderNumber}`);
    for (const p of report.parameters) {
      const range = p.referenceRange ? ` | Reference: ${p.referenceRange}` : '';
      lines.push(`  • ${p.name}: ${p.value} ${p.unit}${range} → ${p.statusLabel}`);
    }
    if (report.physicianNote) {
      lines.push(
        `  Physician note (${report.physicianNote.doctorName}, ${report.physicianNote.timestamp}): ${report.physicianNote.message}`
      );
    }
  }

  // ── Medications ──────────────────────────────────────────────────────────
  const meds = medications ?? [];
  if (meds.length > 0) {
    lines.push('\n## CURRENT MEDICATIONS');
    for (const m of meds) {
      const status = m.active ? 'Active' : `Ended ${m.endedAt}`;
      const note = m.notes ? ` | Note: ${m.notes}` : '';
      lines.push(`  • ${m.name} ${m.dosage} ${m.frequency} [${status}] — Prescribed by ${m.prescribingDoctor}${note}`);
    }
  }

  // ── Historical metabolic trends ──────────────────────────────────────────
  const trends = (historicalTrends ?? HISTORICAL_TRENDS) as typeof HISTORICAL_TRENDS;
  lines.push('\n## HISTORICAL METABOLIC TRENDS');
  for (const t of trends) {
    lines.push(
      `  ${t.date}: Glucose ${t.glucose} mg/dL | A1C ${t.a1c}% | Sodium ${t.sodium} mmol/L | Potassium ${t.potassium} mmol/L`
    );
  }

  // ── Appointments ─────────────────────────────────────────────────────────
  lines.push('\n## APPOINTMENTS');
  for (const a of APPOINTMENTS) {
    lines.push(
      `  [${a.status.toUpperCase()}] ${a.date} ${a.time}: ${a.type} with ${a.doctorName} (${a.doctorRole}) at ${a.location}`
    );
  }

  // ── Doctor / system messages ─────────────────────────────────────────────
  lines.push('\n## RECENT MESSAGES');
  for (const m of INITIAL_MESSAGES) {
    lines.push(`  [${m.timestamp}] ${m.senderName} (${m.senderRole}): ${m.text}`);
  }

  // ── Focused report hint (optional) ───────────────────────────────────────
  if (focusedReport) {
    lines.push(`\n## CURRENT CONTEXT`);
    lines.push(
      `The patient is currently viewing: "${focusedReport.title}" (${focusedReport.date}). Prioritise explanations related to this report when relevant.`
    );
  }

  return lines.join('\n');
}
