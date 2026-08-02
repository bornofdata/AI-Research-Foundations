import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  Upload,
  Shield,
  Scan,
  FileText,
  FlaskConical,
  ClipboardList,
  File,
  Eye,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VaultDocument {
  id: string;
  name: string;
  type: 'insurance' | 'imaging' | 'referral' | 'lab' | 'discharge' | 'other';
  fileType: string; // MIME type e.g. "image/jpeg", "application/pdf"
  base64: string;   // full data URL: "data:image/jpeg;base64,..."
  size: number;     // bytes
  uploadedAt: string; // ISO date string
  notes?: string;
}

type DocType = VaultDocument['type'];

const STORAGE_KEY = 'careconnect_documents';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function loadDocuments(): VaultDocument[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as VaultDocument[]) : [];
  } catch {
    return [];
  }
}

function saveDocuments(docs: VaultDocument[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

// ─── Config maps ──────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<DocType, string> = {
  insurance: 'Insurance Card',
  imaging: 'Imaging Report',
  referral: 'Referral Letter',
  lab: 'Lab Report',
  discharge: 'Discharge Summary',
  other: 'Other',
};

const TYPE_COLORS: Record<DocType, string> = {
  insurance: 'bg-blue-50 text-blue-700',
  imaging: 'bg-purple-50 text-purple-700',
  referral: 'bg-emerald-50 text-emerald-700',
  lab: 'bg-amber-50 text-amber-700',
  discharge: 'bg-orange-50 text-orange-700',
  other: 'bg-surface-container text-on-surface-variant',
};

const TYPE_ICON_COLORS: Record<DocType, string> = {
  insurance: 'text-blue-600 bg-blue-50',
  imaging: 'text-purple-600 bg-purple-50',
  referral: 'text-emerald-600 bg-emerald-50',
  lab: 'text-amber-600 bg-amber-50',
  discharge: 'text-orange-600 bg-orange-50',
  other: 'text-on-surface-variant bg-surface-container',
};

function DocTypeIcon({ type, className = '' }: { type: DocType; className?: string }) {
  const props = { className: `w-5 h-5 ${className}` };
  switch (type) {
    case 'insurance':  return <Shield {...props} />;
    case 'imaging':    return <Scan {...props} />;
    case 'referral':   return <FileText {...props} />;
    case 'lab':        return <FlaskConical {...props} />;
    case 'discharge':  return <ClipboardList {...props} />;
    default:           return <File {...props} />;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentsVault() {
  const [docs, setDocs] = useState<VaultDocument[]>(loadDocuments);
  const [showUpload, setShowUpload] = useState(false);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType>('other');
  const [docName, setDocName] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [sizeWarning, setSizeWarning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSizeWarning(false);

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File exceeds 10 MB limit. Please choose a smaller file or compress it first.');
      setSelectedFile(null);
      // Reset input so the same file can be re-selected after compression
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSizeWarning(true);
    }

    setSelectedFile(file);
    // Auto-populate name from filename (strip extension)
    setDocName(file.name.replace(/\.[^.]+$/, ''));
  };

  const handleSave = () => {
    if (!selectedFile) {
      setErrorMsg('Please select a file.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      const newDoc: VaultDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: docName.trim() || selectedFile.name,
        type: docType,
        fileType: selectedFile.type,
        base64: dataUrl,
        size: selectedFile.size,
        uploadedAt: new Date().toISOString(),
        notes: docNotes.trim() || undefined,
      };

      const updated = [newDoc, ...docs];

      try {
        saveDocuments(updated);
        setDocs(updated);
        resetUploadForm();
        setShowUpload(false);
      } catch {
        setErrorMsg(
          'Document too large to store. Try a smaller file or compress it first.'
        );
      } finally {
        setSaving(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Failed to read the file. Please try again.');
      setSaving(false);
    };

    reader.readAsDataURL(selectedFile);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this document?')) return;
    const updated = docs.filter((d) => d.id !== id);
    saveDocuments(updated);
    setDocs(updated);
  };

  const handleView = (doc: VaultDocument) => {
    window.open(doc.base64, '_blank');
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setDocType('other');
    setDocName('');
    setDocNotes('');
    setSizeWarning(false);
    setErrorMsg('');
    setSaving(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleCancel = () => {
    resetUploadForm();
    setShowUpload(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-3">

      {/* A. Section header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-primary" />
          Medical Documents
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
            {docs.length} {docs.length === 1 ? 'doc' : 'docs'}
          </span>
        </h2>
        {!showUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary px-2.5 py-1 rounded-full border border-primary/40 bg-primary-fixed hover:bg-primary/10 transition-colors"
            aria-label="Upload a document"
          >
            <Upload className="w-3 h-3" />
            Upload Document
          </button>
        )}
      </div>

      {/* B. Upload area */}
      {showUpload && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-on-surface">New Document</p>
            <button
              onClick={handleCancel}
              className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              aria-label="Cancel upload"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* File picker */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-outline-variant rounded-xl p-5 flex flex-col items-center gap-2 text-on-surface-variant hover:border-primary/50 hover:bg-surface-container/30 transition-all"
            type="button"
          >
            <Upload className="w-7 h-7 text-outline" />
            <div className="text-center">
              <p className="font-semibold text-xs text-on-surface">
                {selectedFile ? selectedFile.name : 'Tap to choose a file'}
              </p>
              <p className="text-[10px] mt-0.5 text-outline">
                {selectedFile
                  ? formatSize(selectedFile.size)
                  : 'Images & PDFs · Max 10 MB'}
              </p>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* 5 MB warning */}
          {sizeWarning && (
            <div className="flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Large file ({selectedFile ? formatSize(selectedFile.size) : ''}). Saving large files may fail
              if browser storage is full.
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2 text-[11px] text-error bg-error-container/30 border border-error/20 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

          {/* Document type */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocType)}
              className="w-full text-sm text-on-surface bg-surface-container rounded-lg px-3 py-2 border border-outline-variant outline-none focus:border-primary"
            >
              <option value="insurance">Insurance Card</option>
              <option value="imaging">Imaging Report</option>
              <option value="referral">Referral Letter</option>
              <option value="lab">Lab Report</option>
              <option value="discharge">Discharge Summary</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Document name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Document Name
            </label>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Blue Cross Card Jan 2026"
              className="w-full text-sm text-on-surface bg-surface-container rounded-lg px-3 py-2 border border-outline-variant outline-none focus:border-primary"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Notes <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={docNotes}
              onChange={(e) => setDocNotes(e.target.value)}
              placeholder="e.g. MRI scan from Dr. Smith"
              className="w-full text-sm text-on-surface bg-surface-container rounded-lg px-3 py-2 border border-outline-variant outline-none focus:border-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCancel}
              className="flex-1 py-2 text-xs font-semibold text-on-surface-variant border border-outline-variant rounded-xl hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedFile || saving}
              className="flex-1 py-2 text-xs font-bold text-on-primary bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save Document'}
            </button>
          </div>
        </div>
      )}

      {/* C. Documents list */}
      {docs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 bg-surface-container-lowest rounded-2xl border border-outline-variant text-center">
          <div className="p-3 bg-surface-container rounded-2xl">
            <FolderOpen className="w-7 h-7 text-outline" />
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">No documents stored yet</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Upload insurance cards, reports, and more
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 flex items-start gap-3"
            >
              {/* Type icon */}
              <div className={`p-2 rounded-xl shrink-0 ${TYPE_ICON_COLORS[doc.type]}`}>
                <DocTypeIcon type={doc.type} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="font-bold text-sm text-on-surface truncate">{doc.name}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[doc.type]}`}>
                    {TYPE_LABELS[doc.type]}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    {formatDate(doc.uploadedAt)}
                  </span>
                  <span className="text-[10px] text-outline">
                    {formatSize(doc.size)}
                  </span>
                </div>
                {doc.notes && (
                  <p className="text-[11px] text-on-surface-variant leading-snug pt-0.5">
                    {doc.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => handleView(doc)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary px-2.5 py-1 rounded-full bg-primary-fixed hover:bg-primary/10 transition-colors"
                  aria-label={`View ${doc.name}`}
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-error px-2.5 py-1 rounded-full bg-error-container/30 hover:bg-error-container/60 transition-colors"
                  aria-label={`Delete ${doc.name}`}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
