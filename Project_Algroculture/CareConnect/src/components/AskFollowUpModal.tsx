import React, { useState } from 'react';
import { X, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { DR_EMILY_CHEN, PATIENT_INFO } from '../data/mockData';
import { LabReport } from '../types';

interface AskFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReport: LabReport;
  onSendMessage?: (text: string) => void;
}

export const AskFollowUpModal: React.FC<AskFollowUpModalProps> = ({
  isOpen,
  onClose,
  selectedReport,
  onSendMessage,
}) => {
  const [question, setQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      if (onSendMessage) {
        onSendMessage(question);
      }
      setTimeout(() => {
        setSentSuccess(false);
        setQuestion('');
        onClose();
      }, 1500);
    }, 800);
  };

  const predefinedQuestions = [
    "Should I continue my current fasting routine?",
    "Do these A1C levels affect my annual checkup plan?",
    "When should I schedule my next metabolic blood test?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-secondary-container/40">
          <div className="flex items-center gap-3">
            <img
              src={DR_EMILY_CHEN.avatar}
              alt={DR_EMILY_CHEN.name}
              className="w-10 h-10 rounded-full object-cover border border-secondary"
            />
            <div>
              <h2 className="font-bold text-base text-on-surface">Ask {DR_EMILY_CHEN.name}</h2>
              <p className="text-xs text-on-secondary-container">{DR_EMILY_CHEN.role} • {selectedReport.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5">
          {sentSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-secondary-container text-secondary rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-on-surface">Message Sent!</h3>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                {DR_EMILY_CHEN.name} has received your follow-up inquiry regarding {selectedReport.title}. You will receive a response in your Inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Suggested Questions:
                </label>
                <div className="space-y-1.5">
                  {predefinedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuestion(q)}
                      className="w-full text-left text-xs p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors border border-outline-variant/40"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Your Message to Dr. Chen:
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={`Type your specific question about your ${selectedReport.title} results...`}
                  rows={4}
                  className="w-full text-xs p-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  required
                />
              </div>

              <div className="p-3 bg-primary-fixed/40 rounded-xl flex items-center gap-2 text-[11px] text-on-primary-fixed-variant">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span>Dr. Chen typically replies within 2-4 business hours on active care days.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || !question.trim()}
                  className="px-5 py-2 bg-secondary text-on-secondary text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-md hover:bg-secondary/90 transition-all disabled:opacity-50"
                >
                  {isSending ? (
                    'Sending...'
                  ) : (
                    <>
                      Send Message <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
