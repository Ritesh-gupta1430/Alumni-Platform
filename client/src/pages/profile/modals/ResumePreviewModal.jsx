import { FileText, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

export function ResumePreviewModal({ isOpen, onClose, resume, user }) {
  if (!resume || !resume.url) return null;

  const isPdf = resume.url.toLowerCase().endsWith('.pdf') || resume.filename?.toLowerCase().endsWith('.pdf');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${user?.firstName}'s Resume / CV`} size="xl">
      <div className="space-y-4 pt-2">
        {/* Top bar with download action */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate max-w-xs">
                {resume.filename || 'Candidate_Resume.pdf'}
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {resume.uploadedAt ? `Uploaded on ${new Date(resume.uploadedAt).toLocaleDateString()}` : 'Institutional Candidate Document'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={resume.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs"
            >
              <ExternalLink size={14} /> Open in New Tab
            </a>
            <a
              href={resume.url}
              download={resume.filename || 'Resume.pdf'}
              className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs"
            >
              <Download size={14} /> Download
            </a>
          </div>
        </div>

        {/* Embedded viewer */}
        <div className="w-full h-[540px] rounded-xl overflow-hidden border border-[var(--color-surface-border)] bg-[var(--color-surface-1)]">
          {isPdf ? (
            <iframe
              src={`${resume.url}#toolbar=0`}
              title="Resume Preview"
              className="w-full h-full border-none"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
              <FileText size={48} className="text-[var(--color-text-muted)]" />
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Document Preview Ready</h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm">
                  This document cannot be previewed directly in iframe. Click below to download or view in reader.
                </p>
              </div>
              <a
                href={resume.url}
                download
                className="btn btn-primary flex items-center gap-2 text-xs"
              >
                <Download size={16} /> Download {resume.filename}
              </a>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
