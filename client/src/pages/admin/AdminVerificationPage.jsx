import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  Check,
  X,
  FileText,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  Calendar,
  Building,
  GraduationCap
} from 'lucide-react';
import { verificationAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge, RoleBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../lib/utils';

export default function AdminVerificationPage() {
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Decision Modals State
  const [selectedReq, setSelectedReq] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await verificationAPI.adminList({
        status: filterStatus === 'all' ? undefined : filterStatus,
        page,
        limit: 15,
      });
      setRequests(res.data.data.requests || []);
      setTotalPages(res.data.data.pages || 1);
    } catch (err) {
      toast.error('Failed to load verification requests.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, page, toast]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // Handle Approve
  const handleApprove = async (req) => {
    const role = req.user?.role?.toLowerCase() || 'student';
    const badgeMap = {
      student: 'verified_student',
      alumni: 'verified_alumni',
      faculty: 'verified_faculty',
      recruiter: 'verified_recruiter',
    };
    const badge = badgeMap[role] || 'verified_student';

    try {
      await verificationAPI.adminApprove(req._id, { badge });
      toast.success(`Verification approved for ${req.user?.firstName}!`);
      fetchVerifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve verification.');
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!selectedReq || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason.');
      return;
    }
    try {
      await verificationAPI.adminReject(selectedReq._id, { reason: rejectReason });
      toast.info('Verification rejected.');
      setShowRejectModal(false);
      setRejectReason('');
      fetchVerifications();
    } catch (err) {
      toast.error('Failed to reject verification.');
    }
  };

  // Handle Request Correction
  const handleCorrection = async () => {
    if (!selectedReq || !correctionNote.trim()) {
      toast.error('Please specify what documents need correction.');
      return;
    }
    try {
      await verificationAPI.adminRequestCorrection(selectedReq._id, { message: correctionNote });
      toast.success('Correction request sent to user.');
      setShowCorrectionModal(false);
      setCorrectionNote('');
      fetchVerifications();
    } catch (err) {
      toast.error('Failed to request correction.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Back button */}
      <Link
        to="/admin"
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ChevronLeft size={16} /> Back to Admin Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
            <ShieldCheck className="text-amber-400" size={26} />
            Member Verification Console
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Inspect uploaded college ID cards, marksheets, and degree certificates to verify student & alumni accounts.
          </p>
        </div>

        <Select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          containerClass="w-56"
        >
          <option value="pending">Pending Review</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="resubmission_required">Action Required</option>
          <option value="all">All Submissions</option>
        </Select>
      </div>

      {/* Verification Submissions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card p-6 h-48 animate-pulse bg-[var(--color-surface-2)]" />
          ))}
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((req) => (
            <motion.div
              key={req._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 space-y-4 border border-[var(--color-surface-border)] shadow-md"
            >
              {/* Member Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar
                    src={req.user?.profilePhoto}
                    firstName={req.user?.firstName}
                    lastName={req.user?.lastName}
                    size="lg"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/profile/${req.user?._id}`}
                        className="font-bold text-base text-[var(--color-text-primary)] hover:text-blue-400"
                      >
                        {req.user?.firstName} {req.user?.lastName}
                      </Link>
                      <RoleBadge role={req.user?.role} />
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {req.user?.email} • {req.user?.department}
                      {req.user?.graduationYear ? ` • Class of ${req.user.graduationYear}` : ''}
                      {req.rollNumber && ` • Roll: ${req.rollNumber}`}
                    </p>
                  </div>
                </div>

                {/* Decision Actions */}
                {req.status === 'pending' || req.status === 'under_review' ? (
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApprove(req)}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Check size={14} /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReq(req);
                        setShowCorrectionModal(true);
                      }}
                      className="text-xs"
                    >
                      Request Correction
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedReq(req);
                        setShowRejectModal(true);
                      }}
                      className="text-xs text-rose-400 hover:bg-rose-500/10"
                    >
                      <X size={14} /> Reject
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--color-text-muted)] font-mono">
                    Processed {formatDate(req.reviewedAt || req.updatedAt)}
                  </span>
                )}
              </div>

              {/* Uploaded Documents Gallery */}
              <div className="p-4 rounded-xl bg-[var(--color-surface-2)] space-y-2">
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Attached Verification Documents ({req.documents?.length || 0}):
                </span>
                <div className="flex flex-wrap gap-3 pt-1">
                  {req.documents?.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg bg-[var(--color-surface-1)] border border-[var(--color-surface-border)] hover:border-blue-500/50 flex items-center gap-2 text-xs transition-colors"
                    >
                      <FileText size={16} className="text-blue-400" />
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {doc.filename || `Document_${idx + 1}`}
                      </span>
                      <ExternalLink size={12} className="text-[var(--color-text-muted)] ml-1" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center text-sm text-[var(--color-text-muted)] space-y-2">
          <ShieldCheck size={40} className="mx-auto opacity-30 mb-2" />
          <p className="font-semibold text-[var(--color-text-primary)]">No verification requests found</p>
          <p className="text-xs">All submissions for this filter have been processed.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-xs font-mono text-[var(--color-text-muted)]">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* ===== REJECT MODAL ===== */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title={`Reject Verification: ${selectedReq?.user?.firstName}`}
        size="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Reason for Rejection (Mandatory)"
            required
            rows={3}
            placeholder="e.g. Uploaded document does not match roll number or name..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== CORRECTION MODAL ===== */}
      <Modal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title={`Request Document Correction: ${selectedReq?.user?.firstName}`}
        size="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Instructions for User"
            required
            rows={3}
            placeholder="e.g. Please re-upload a clear copy of your 8th semester marksheet with visible seal..."
            value={correctionNote}
            onChange={(e) => setCorrectionNote(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCorrectionModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCorrection}>
              Send Correction Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
