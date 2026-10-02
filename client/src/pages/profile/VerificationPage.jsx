import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, X, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';

export default function VerificationPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter((f) => {
      const isImg = f.type.startsWith('image/');
      const isPdf = f.type === 'application/pdf';
      const isOkSize = f.size <= 10 * 1024 * 1024; // 10MB
      if (!isImg && !isPdf) {
        toast.error(`"${f.name}" is not a valid format. Please upload JPG, PNG, or PDF.`);
        return false;
      }
      if (!isOkSize) {
        toast.error(`"${f.name}" exceeds 10MB file limit.`);
        return false;
      }
      return true;
    });

    setFiles((prev) => {
      const combined = [...prev, ...valid];
      if (combined.length > 5) {
        toast.error('You can upload a maximum of 5 documents.');
        return combined.slice(0, 5);
      }
      return combined;
    });
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      return toast.error('Please select at least one document to upload.');
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const docTypes = [];

      files.forEach((file) => {
        formData.append('documents', file);
        docTypes.push(user?.role === 'STUDENT' ? 'college_id' : 'degree_certificate');
      });

      formData.append('documentTypes', JSON.stringify(docTypes));

      const res = await api.post('/verification/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(res.data?.message || 'Documents submitted successfully!', {
        title: 'Application Submitted 🎉',
      });
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit verification documents.');
    } finally {
      setLoading(false);
    }
  };

  if (user?.verificationStatus === 'approved') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="glass p-8 sm:p-10 rounded-2xl text-center border border-emerald-500/30 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            Institutional Verification Approved
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-text-primary mb-2">
            You are a Verified Member 🎉
          </h2>
          <p className="text-sm text-text-muted max-w-lg mx-auto mb-6 leading-relaxed">
            Your TCET credentials have been authenticated. Your profile is stamped with the official verified badge, and all network features (Direct Messaging, Alumni Referral Bridge, Mentorship, and Jobs) are active.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={() => navigate('/dashboard')} variant="primary">
              Go to Dashboard <ArrowRight size={16} />
            </Button>
            <Button onClick={() => navigate('/profile/me')} variant="outline">
              View Public Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (user?.verificationStatus === 'pending' || user?.verificationStatus === 'under_review') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="glass p-8 rounded-2xl text-center">
          <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-brand-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold font-display mb-2">Verification Under Review ⏳</h2>
          <p className="text-text-muted mb-6 leading-relaxed">
            Your verification documents have been submitted and are currently in the administrator review queue.
            You will receive a notification and verified badge once approved.
          </p>
          <Button onClick={() => navigate('/dashboard')} variant="secondary">
            Go to Dashboard <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-3xl font-bold font-display">Identity Verification</h1>
        </div>
        <p className="text-text-muted">
          To keep AlumNetra a trusted TCET network, please upload a photo or scan of your College ID Card,
          Degree Certificate, or Marksheet.
        </p>
      </div>

      <div className="glass p-6 md:p-8 rounded-2xl">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex gap-3">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-amber-300/90 leading-relaxed">
            <strong className="text-amber-200">Important:</strong> Ensure the document clearly displays your full name,
            department, and institution details. Accepted formats: JPG, PNG, WEBP, PDF (Max 10MB per file).
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border-base hover:border-brand-500/50 rounded-2xl p-8 text-center transition-all bg-surface-base/50 hover:bg-surface-base cursor-pointer group"
        >
          <div className="w-16 h-16 bg-surface-alt group-hover:scale-110 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform">
            <UploadCloud className="text-brand-400" size={32} />
          </div>
          <p className="font-semibold text-base mb-1 text-text-primary">
            Drag and drop your documents here
          </p>
          <p className="text-sm text-text-muted mb-5">or click to browse from your device</p>

          <input
            ref={fileInputRef}
            type="file"
            id="doc-upload"
            className="hidden"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            variant="secondary"
            className="cursor-pointer pointer-events-auto"
          >
            Select Files
          </Button>
        </div>

        {/* Selected Files List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-3"
            >
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Selected Documents ({files.length})
              </h3>
              {files.map((file, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-base border border-border-base"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 bg-brand-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <FileText size={20} className="text-brand-400" />
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-sm truncate text-text-primary">{file.name}</p>
                      <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X size={18} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={files.length === 0}
            size="lg"
            className="w-full sm:w-auto"
          >
            Submit for Verification <ShieldCheck size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
