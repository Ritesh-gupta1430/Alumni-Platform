import { useState } from 'react';
import { Copy, Check, Share2, MessageCircle, Mail, QrCode, Globe } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

export function ShareProfileModal({ isOpen, onClose, user, profile }) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `${window.location.origin}/profile/${user?._id || ''}`;
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'AlumNetra Member';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const shareText = `Check out ${fullName}'s profile on TCET AlumNetra Platform!`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Profile" size="md">
      <div className="space-y-6 pt-2">
        {/* QR Code Card */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] text-center">
          <div className="w-40 h-40 bg-white p-3 rounded-xl shadow-lg flex items-center justify-center mb-3">
            {/* Generative QR Code representation */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full text-slate-900 fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="0" y="0" width="30" height="30" fill="currentColor" rx="4" />
              <rect x="5" y="5" width="20" height="20" fill="white" rx="2" />
              <rect x="10" y="10" width="10" height="10" fill="currentColor" rx="1" />

              <rect x="70" y="0" width="30" height="30" fill="currentColor" rx="4" />
              <rect x="75" y="5" width="20" height="20" fill="white" rx="2" />
              <rect x="80" y="10" width="10" height="10" fill="currentColor" rx="1" />

              <rect x="0" y="70" width="30" height="30" fill="currentColor" rx="4" />
              <rect x="5" y="75" width="20" height="20" fill="white" rx="2" />
              <rect x="10" y="80" width="10" height="10" fill="currentColor" rx="1" />

              {/* Data pattern */}
              <rect x="35" y="10" width="8" height="8" fill="currentColor" />
              <rect x="48" y="10" width="8" height="8" fill="currentColor" />
              <rect x="35" y="24" width="8" height="8" fill="currentColor" />
              <rect x="48" y="24" width="14" height="8" fill="currentColor" />
              <rect x="10" y="38" width="16" height="8" fill="currentColor" />
              <rect x="35" y="38" width="8" height="16" fill="currentColor" />
              <rect x="48" y="38" width="8" height="8" fill="currentColor" />
              <rect x="62" y="38" width="12" height="8" fill="currentColor" />
              <rect x="80" y="38" width="10" height="12" fill="currentColor" />
              <rect x="10" y="52" width="8" height="8" fill="currentColor" />
              <rect x="24" y="52" width="16" height="8" fill="currentColor" />
              <rect x="48" y="52" width="18" height="8" fill="currentColor" />
              <rect x="72" y="52" width="18" height="8" fill="currentColor" />
              <rect x="38" y="68" width="16" height="8" fill="currentColor" />
              <rect x="60" y="68" width="10" height="8" fill="currentColor" />
              <rect x="76" y="68" width="14" height="8" fill="currentColor" />
              <rect x="38" y="82" width="8" height="10" fill="currentColor" />
              <rect x="52" y="82" width="18" height="10" fill="currentColor" />
              <rect x="76" y="82" width="14" height="10" fill="currentColor" />
            </svg>
          </div>
          <p className="text-xs font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5">
            <QrCode size={14} className="text-blue-400" />
            Scan QR code to open profile on mobile
          </p>
        </div>

        {/* Copy Link Section */}
        <div className="space-y-2">
          <label className="label">Direct Profile Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={profileUrl}
              className="input text-xs font-mono text-[var(--color-text-secondary)] select-all truncate flex-1"
            />
            <Button
              onClick={handleCopy}
              variant={copied ? 'success' : 'primary'}
              className="flex items-center gap-1.5 px-4 shrink-0"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="space-y-2 pt-2 border-t border-[var(--color-surface-border)]">
          <label className="label">Share on Social Channels</label>
          <div className="grid grid-cols-3 gap-3">
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 rounded-xl hover:text-blue-400 hover:border-blue-500/40"
            >
              <Globe size={16} /> LinkedIn
            </a>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${profileUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 rounded-xl hover:text-emerald-400 hover:border-emerald-500/40"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(`TCET AlumNetra: ${fullName}`)}&body=${encodeURIComponent(`${shareText}\n\nView Profile: ${profileUrl}`)}`}
              className="btn btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 rounded-xl hover:text-purple-400 hover:border-purple-500/40"
            >
              <Mail size={16} /> Email
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}
