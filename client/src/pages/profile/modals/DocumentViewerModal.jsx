import { FileText, Download, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

export function DocumentViewerModal({ isOpen, onClose, document }) {
  if (!document || !document.url) return null;

  const { title = 'Document Viewer', subtitle = '', url, filename = 'document.pdf' } = document;
  const isPdf = url.toLowerCase().includes('.pdf') || filename?.toLowerCase().endsWith('.pdf');
  const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/) || filename?.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4 pt-2">
        {/* Top bar with document meta and download actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              {isImage ? <ImageIcon size={20} /> : <FileText size={20} />}
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--color-text-primary)] truncate max-w-sm">
                {filename}
              </p>
              {subtitle && <p className="text-[11px] text-[var(--color-text-muted)]">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs"
            >
              <ExternalLink size={13} /> Open Tab
            </a>
            <a
              href={url}
              download={filename}
              className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs"
            >
              <Download size={13} /> Download
            </a>
          </div>
        </div>

        {/* Embedded Viewer Container */}
        <div className="w-full h-[520px] rounded-xl overflow-hidden border border-[var(--color-surface-border)] bg-[var(--color-surface-1)] flex items-center justify-center">
          {isPdf ? (
            <iframe
              src={`${url}#toolbar=0`}
              title={title}
              className="w-full h-full border-none"
            />
          ) : isImage ? (
            <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
              <img
                src={url}
                alt={title}
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg border border-[var(--color-surface-border)]"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
              <FileText size={48} className="text-[var(--color-text-muted)]" />
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{filename}</h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm">
                  Click below to download or view the document in your device's default reader.
                </p>
              </div>
              <a
                href={url}
                download={filename}
                className="btn btn-primary flex items-center gap-2 text-xs"
              >
                <Download size={15} /> Download Document
              </a>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
