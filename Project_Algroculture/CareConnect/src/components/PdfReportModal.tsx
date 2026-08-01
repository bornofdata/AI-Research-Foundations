import React from 'react';
import { X, Download, Printer, CheckCircle2, Building2, Calendar, FileText } from 'lucide-react';
import { LabReport } from '../types';
import { PATIENT_INFO, DR_EMILY_CHEN } from '../data/mockData';

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LabReport;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-outline-variant shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-slate-800">
        {/* Modal Toolbar Header */}
        <div className="p-4 bg-primary text-on-primary flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-fixed-dim" />
            <span className="font-bold text-sm tracking-wide">Official Clinical Diagnostic Report PDF</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={() => {
                alert('PDF downloaded to your device.');
              }}
              className="px-3 py-1.5 bg-secondary-container text-on-secondary-container text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-full transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Preview Canvas */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 font-sans text-sm print:p-0">
          {/* Document Header */}
          <div className="flex justify-between items-start border-b-2 border-primary/20 pb-4">
            <div>
              <h1 className="text-2xl font-black text-primary uppercase tracking-tight">CareConnect Diagnostic Labs</h1>
              <p className="text-xs text-slate-500 font-medium">Central Lab Service • CLIA Accreditation #88D9201</p>
              <p className="text-xs text-slate-500">100 Health Plaza Suite 200, Medical Center</p>
            </div>
            <div className="text-right text-xs">
              <span className="inline-block bg-primary-fixed text-primary px-2.5 py-1 font-bold rounded-md mb-1">
                Order #{report.orderNumber}
              </span>
              <p className="text-slate-600 font-medium">Date: {report.date}</p>
            </div>
          </div>

          {/* Patient & Physician Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase block text-[10px] mb-1">Patient Information</span>
              <p className="font-bold text-slate-800 text-sm">{PATIENT_INFO.name}</p>
              <p className="text-slate-600">MRN: {PATIENT_INFO.mrn}</p>
              <p className="text-slate-600">DOB: {PATIENT_INFO.dob}</p>
              <p className="text-slate-600">{PATIENT_INFO.insurance}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase block text-[10px] mb-1">Ordering Physician</span>
              <p className="font-bold text-slate-800 text-sm">{DR_EMILY_CHEN.name}</p>
              <p className="text-slate-600">{DR_EMILY_CHEN.role}</p>
              <p className="text-slate-600">{DR_EMILY_CHEN.clinic}</p>
            </div>
          </div>

          {/* Report Title */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">
              {report.title}
            </h2>
          </div>

          {/* Lab Parameters Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <th className="py-2.5 px-3">Test Name</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Reference Range</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {report.parameters.map((param) => (
                  <tr key={param.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-800">{param.name}</td>
                    <td className="py-3 px-3 font-bold text-primary">
                      {param.value} {param.unit}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{param.referenceRange || 'N/A'}</td>
                    <td className="py-3 px-3 text-right font-medium">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          param.status === 'normal' || param.status === 'optimal'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {param.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Physician Interpretation Note */}
          {report.physicianNote && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <span>Physician Review & Clinical Commentary</span>
              </div>
              <p className="text-xs text-slate-700 italic leading-relaxed">
                {report.physicianNote.message}
              </p>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-emerald-100 flex justify-between">
                <span>Signed electronically by {DR_EMILY_CHEN.name}, M.D.</span>
                <span>{report.physicianNote.timestamp}</span>
              </div>
            </div>
          )}

          {/* Document Footer */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-1">
            <p>Confidential Medical Record — Protected under HIPAA regulations.</p>
            <p>CareConnect Diagnostic Systems • Generated electronically on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
