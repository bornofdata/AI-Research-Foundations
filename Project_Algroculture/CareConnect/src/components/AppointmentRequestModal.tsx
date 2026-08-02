import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, CalendarPlus } from 'lucide-react';

interface AppointmentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientContext: string;
  onRequestSent: (message: string) => void;
}

type ModalState = 'confirm' | 'sending' | 'sent' | 'error';

const VISIT_TYPES = [
  'Follow-up',
  'Routine Check-up',
  'Lab Review',
  'Urgent Consultation',
  'Specialist Referral',
  'Annual Physical',
];

const TIME_OPTIONS = [
  'Morning (8AM–12PM)',
  'Afternoon (12PM–4PM)',
  'Late Afternoon (4PM–6PM)',
  'Any time',
];

const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const INPUT_CLASS =
  'w-full text-sm text-on-surface bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 outline-none focus:border-primary transition-colors';

export const AppointmentRequestModal: React.FC<AppointmentRequestModalProps> = ({
  isOpen,
  onClose,
  patientContext,
  onRequestSent,
}) => {
  const [visitType, setVisitType] = useState(VISIT_TYPES[0]);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState(TIME_OPTIONS[0]);
  const [reason, setReason] = useState('');
  const [modalState, setModalState] = useState<ModalState>('confirm');
  const [draftedMessage, setDraftedMessage] = useState('');
  const [dateError, setDateError] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (modalState === 'sending') return;
    setVisitType(VISIT_TYPES[0]);
    setPreferredDate('');
    setPreferredTime(TIME_OPTIONS[0]);
    setReason('');
    setModalState('confirm');
    setDraftedMessage('');
    setDateError(false);
    onClose();
  };

  const handleSend = async () => {
    if (!preferredDate) {
      setDateError(true);
      return;
    }
    setDateError(false);
    setModalState('sending');
    try {
      const res = await fetch('/api/appointment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitType,
          preferredDate,
          preferredTime,
          reason: reason.trim(),
          patientContext,
        }),
      });

      if (!res.ok) throw new Error('Request failed');
      const data = await res.json() as { message?: string; error?: string };
      if (data.error) throw new Error(data.error);
      setDraftedMessage(data.message ?? '');
      setModalState('sent');
    } catch {
      setModalState('error');
    }
  };

  const handleDone = () => {
    onRequestSent(draftedMessage);
    handleClose();
  };

  const isFormDisabled = modalState === 'sending';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={modalState === 'sending' ? undefined : handleClose}
      />

      {/* Dialog card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarPlus className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base text-on-surface">Request Appointment</h2>
            </div>
            {modalState !== 'sending' && (
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Confirm / Sending state — form */}
          {(modalState === 'confirm' || modalState === 'sending') && (
            <>
              <div className="space-y-4 mb-5">
                {/* Visit Type */}
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
                    Visit Type
                  </label>
                  <select
                    value={visitType}
                    onChange={(e) => setVisitType(e.target.value)}
                    disabled={isFormDisabled}
                    className={INPUT_CLASS + ' disabled:opacity-60'}
                  >
                    {VISIT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Preferred Date */}
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    min={tomorrow}
                    onChange={(e) => { setPreferredDate(e.target.value); setDateError(false); }}
                    disabled={isFormDisabled}
                    className={INPUT_CLASS + ' disabled:opacity-60' + (dateError ? ' border-error' : '')}
                  />
                  {dateError && (
                    <p className="text-[11px] text-error mt-1">Please select a preferred date.</p>
                  )}
                </div>

                {/* Preferred Time */}
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
                    Preferred Time
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    disabled={isFormDisabled}
                    className={INPUT_CLASS + ' disabled:opacity-60'}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
                    Reason <span className="font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value.slice(0, 300))}
                    placeholder="Briefly describe the reason for your visit (optional)"
                    rows={3}
                    disabled={isFormDisabled}
                    className={INPUT_CLASS + ' resize-none disabled:opacity-60'}
                  />
                  <p className="text-[10px] text-outline text-right mt-0.5">{reason.length}/300</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  disabled={isFormDisabled}
                  className="flex-1 py-2.5 text-sm font-semibold text-on-surface-variant bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={isFormDisabled}
                  className="flex-1 py-2.5 text-sm font-bold text-on-primary bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {modalState === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Drafting request…
                    </>
                  ) : (
                    'Request Appointment'
                  )}
                </button>
              </div>
            </>
          )}

          {/* Sent state */}
          {modalState === 'sent' && (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-base text-on-surface mb-1">Appointment request sent!</p>
                <p className="text-xs text-on-surface-variant">
                  Dr. Chen's office will contact you to confirm.
                </p>
              </div>
              <button
                onClick={handleDone}
                className="mt-2 w-full py-2.5 text-sm font-bold text-on-primary bg-primary rounded-xl hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Error state */}
          {modalState === 'error' && (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="w-14 h-14 rounded-full bg-error-container/40 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-error" />
              </div>
              <div>
                <p className="font-bold text-base text-on-surface mb-1">Failed to send.</p>
                <p className="text-xs text-on-surface-variant">Please try again.</p>
              </div>
              <div className="flex gap-2 w-full mt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 text-sm font-semibold text-on-surface-variant bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setModalState('confirm')}
                  className="flex-1 py-2.5 text-sm font-bold text-on-primary bg-primary rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};
