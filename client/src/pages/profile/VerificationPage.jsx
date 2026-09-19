import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, X } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';

export default function VerificationPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => 
      f.type.startsWith('image/') || f.type === 'application/pdf'
    );
    if (droppedFiles.length + files.length > 3) {
      toast.error('You can upload a maximum of 3 documents.');
      return;
    }
    setFiles(prev => [...prev, ...droppedFiles]);
  }, [files, toast]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 3) {
      toast.error('You can upload a maximum of 3 documents.');
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      return toast.error('Please upload at least one document.');
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const docTypes = [];
      
      files.forEach((file) => {
        formData.append('documents', file);
        // By default, just call it 'id_proof' or 'college_id'
        docTypes.push(user?.role === 'STUDENT' ? 'college_id' : 'degree_certificate');
      });
      
      formData.append('documentTypes', JSON.stringify(docTypes));

      await api.post('/verification/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Documents submitted successfully!');
      await refreshUser(); // This should update user.verificationStatus to 'pending'
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit documents.');
    } finally {
      setLoading(false);
    }
  };

  if (user?.verificationStatus === 'pending') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="glass p-8 rounded-2xl text-center">
          <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-brand-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold font-display mb-2">Verification Under Review</h2>
          <p className="text-text-muted mb-6">
            Your documents have been submitted and are currently being reviewed by our team. 
            This usually takes 1-2 business days. We will notify you once your account is approved.
          </p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display mb-2">Identity Verification</h1>
        <p className="text-text-muted">
          To keep AlumNetra a trusted community, we need to verify your identity.
          Please upload a photo of your college ID, degree, or fee receipt.
        </p>
      </div>

      <div className="glass p-6 md:p-8 rounded-2xl">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6 flex gap-3">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-amber-500">
            <strong>Important:</strong> Ensure the document clearly shows your name, 
            the college logo, and your admission/graduation year. 
            Accepted formats: JPG, PNG, PDF (Max 5MB per file).
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border-base rounded-xl p-8 text-center hover:border-brand-500/50 transition-colors bg-surface-base"
        >
          <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="text-text-muted" size={32} />
          </div>
          <p className="font-medium mb-1">Drag and drop your documents here</p>
          <p className="text-sm text-text-muted mb-6">or click below to browse</p>
          
          <input
            type="file"
            id="doc-upload"
            className="hidden"
            multiple
            accept="image/jpeg, image/png, application/pdf"
            onChange={handleFileSelect}
          />
          <Button as="label" htmlFor="doc-upload" variant="secondary" className="cursor-pointer">
            Select Files
          </Button>
        </div>

        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Selected Files</h3>
            {files.map((file, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={idx} 
                className="flex items-center justify-between p-3 rounded-lg bg-surface-base border border-border-base"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-surface-alt rounded flex items-center justify-center shrink-0">
                    <FileText size={20} className="text-text-muted" />
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(idx)}
                  className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleSubmit} 
            loading={loading} 
            disabled={files.length === 0}
            size="lg"
          >
            Submit for Verification
          </Button>
        </div>
      </div>
    </div>
  );
}
