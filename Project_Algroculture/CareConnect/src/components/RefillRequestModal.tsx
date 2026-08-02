import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Medication } from '../types';

interface RefillRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
  patientContext: string;
  onRequestSent: (message: string, medicationName: string) => void;
}

type ModalState = 'confirm' | 'sending' | 'sent' | 'error';

export const RefillRequestModal: React.FC<RefillRequestModalProps> = ({
  isOpen,
  onClose,
  medication,
  patientContext,
  onRequestSent,
}) => {
  const [note, setNote] = useState('');
  const [state, setState] = useState<ModalState>('confirm');
  const [draftedMessage, setDraftedMessage] = useState('');

  if (!isOpen || !medication) return null;

  const handleClose = () => {
    setState('confirm');
    setNote('');
    setDraftedMessage('');
    onClose();
  };

  const handleSend = async () => {
    setState('sending');
    try {
      const res = await fetch('/api/refill-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationName: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          patientContext,
          pharmacyNote: note.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Request failed');
      const data = await res.json() as { message?: string; error?: string };
      if (data.error) throw new Error(data.error);
      setDraftedMessage(data.message ?? '');
      setState('sent');
    } catch {
      setState('error');
    }
  };

  const handleDone = () => {
    onRequestSent(draftedMessage, medication.name);
    handleClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={state === 'sending' ? undefined : handleClose}
      />

      {/* Dialog card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base text-on-surface">Request Refill</h2>
            </div>
            {state !== 'sending' && (
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Confirm state */}
          {(state === 'confirm' || state === 'sending') && (
            <>
              {/* Medication info */}
              <div className="bg-surface-container rounded-xl p-4 mb-4 space-y-1">
                <p className="font-bold text-sm text-on-surface">{medication.name}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-on-surface-variant">{medication.dosage}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-primary">
                    {medication.frequency}
                  </span>
                </div>
                {medication.prescribingDoctor && (
                  <p className="text-[11px] text-on-surface-variant">
                    Prescribed by {medication.prescribingDoctor}
                  </p>
                )}
              </div>

              {/* Note textarea */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
                  Add a note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  placeholder="e.g., Running low, going on vacation..."
                  rows={3}
                  disabled={state === 'sending'}
                  className="w-full text-xs p-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-60"
                />
                <p className="text-[10px] text-outline text-right mt-0.5">{note.length}/200</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  disabled={state === 'sending'}
                  className="flex-1 py-2.5 text-sm font-semibold text-on-surface-variant bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={state === 'sending'}
                  className="flex-1 py-2.5 text-sm font-bold text-on-primary bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {state === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Drafting request…
                    </>
                  ) : (
                    'Send Request'
                  )}
                </button>
              </div>
            </>
          )}

          {/* Sent state */}
          {state === 'sent' && (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-base text-on-surface mb-1">Refill request sent!</p>
                <p className="text-xs text-on-surface-variant">
                  Your message has been sent to Dr. Chen.
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
          {state === 'error' && (
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
                  onClick={() => setState('confirm')}
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
