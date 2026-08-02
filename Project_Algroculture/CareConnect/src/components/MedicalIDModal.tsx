import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, QrCode, HeartPulse, PhoneCall } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmergencyCard {
  bloodType: string;
  allergies: string;
  conditions: string;
  emergencyName: string;
  emergencyPhone: string;
}

const EMERGENCY_CARD_KEY = 'careconnect_emergency_card';

const DEFAULT_EMERGENCY_CARD: EmergencyCard = {
  bloodType: 'A+',
  allergies: 'None known',
  conditions: 'Pre-diabetic (managed)',
  emergencyName: 'John Jenkins',
  emergencyPhone: '555-0100',
};

function loadEmergencyCard(): EmergencyCard {
  try {
    const stored = localStorage.getItem(EMERGENCY_CARD_KEY);
    return stored ? (JSON.parse(stored) as EmergencyCard) : DEFAULT_EMERGENCY_CARD;
  } catch {
    return DEFAULT_EMERGENCY_CARD;
  }
}

export interface MedicalIDModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: { name: string; dob: string; mrn: string };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MedicalIDModal: React.FC<MedicalIDModalProps> = ({ isOpen, onClose, patient }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const card = loadEmergencyCard();

  const emergencyText = [
    `MEDICAL ID`,
    `Name: ${patient.name}`,
    `DOB: ${patient.dob}`,
    `MRN: ${patient.mrn}`,
    `Blood: ${card.bloodType}`,
    `Allergies: ${card.allergies}`,
    `Conditions: ${card.conditions}`,
    `Emergency: ${card.emergencyName} ${card.emergencyPhone}`,
  ].join(' | ');

  // Generate QR code whenever modal opens
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, emergencyText, { width: 200, margin: 2 }, (err) => {
      if (err) console.error('QR generation error:', err);
    });
  }, [isOpen, emergencyText]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical-id-qr.png';
    a.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(emergencyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* clipboard unavailable */ });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface animate-fadeIn">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-outline-variant shrink-0">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          <h1 className="font-bold text-base text-on-surface">Medical ID & QR Code</h1>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 max-w-sm mx-auto w-full">
        {/* Physical-card styled Medical ID */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary-container rounded-2xl border border-primary/20 overflow-hidden shadow-md">
          {/* Card header */}
          <div className="bg-primary px-5 py-3 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-on-primary" />
            <span className="text-xs font-bold text-on-primary uppercase tracking-wider">Medical ID Card</span>
          </div>

          <div className="p-5 space-y-4">
            {/* Patient name */}
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Patient</p>
              <p className="font-bold text-base text-on-surface">{patient.name}</p>
              <p className="text-xs text-on-surface-variant">DOB: {patient.dob} · MRN: {patient.mrn}</p>
            </div>

            {/* Blood type — large, bold, red */}
            <div className="flex items-center gap-3">
              <div className="bg-error/10 border border-error/30 rounded-xl px-4 py-3 flex flex-col items-center min-w-[72px]">
                <span className="text-3xl font-extrabold text-error leading-none">{card.bloodType}</span>
                <span className="text-[9px] font-bold text-error uppercase tracking-wider mt-1">Blood Type</span>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Allergies</p>
                  <p className="text-xs font-medium text-on-surface">{card.allergies}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Conditions</p>
                  <p className="text-xs font-medium text-on-surface">{card.conditions}</p>
                </div>
              </div>
            </div>

            {/* Emergency contact */}
            <div className="pt-3 border-t border-outline-variant/40 flex items-center gap-3">
              <div className="p-2 bg-secondary-fixed rounded-xl shrink-0">
                <PhoneCall className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Emergency Contact</p>
                <p className="text-sm font-semibold text-on-surface">{card.emergencyName}</p>
                <p className="text-xs text-on-surface-variant">{card.emergencyPhone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-[11px] font-semibold text-on-surface-variant text-center">
            Scan this QR code to read emergency medical info
          </p>
          <div className="bg-white p-3 rounded-2xl border border-outline-variant shadow-sm inline-block">
            <canvas ref={canvasRef} />
          </div>
          <p className="text-[10px] text-outline text-center px-4">
            Contains name, blood type, allergies, conditions, and emergency contact
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-2 pb-4">
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3 font-bold text-sm text-on-primary bg-primary rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download QR as PNG
          </button>
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-xl transition-colors border border-outline-variant"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Text Summary'}
          </button>
        </div>
      </div>
    </div>
  );
};
