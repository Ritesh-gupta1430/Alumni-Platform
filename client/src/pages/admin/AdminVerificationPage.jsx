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
  GraduationCap,
  Eye,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import { verificationAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge, RoleBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../lib/utils';

/**
 * Helper to compute high-res preview URL for Cloudinary PDFs and images
 */
function getDocumentDisplayUrl(doc, page = 1) {
  if (!doc) return '';
  const rawUrl = doc.previewUrl || doc.url || '';
  const isPdf = doc.mimeType === 'application/pdf' || rawUrl.toLowerCase().includes('.pdf');

  if (rawUrl.includes('cloudinary.com')) {
    if (isPdf) {
      // Cloudinary delivers PDF pages as high-quality images via pg_<page> and .jpg extension
      return rawUrl
        .replace(/\/upload\/(?:pg_\d+,[^/]+\/)?(?:v\d+\/)?/, `/upload/pg_${page},w_1600,c_limit,q_auto:best/`)
        .replace(/\.pdf$/i, '.jpg');
    } else {
      return rawUrl.replace(/\/upload\/(?:w_\d+,[^/]+\/)?(?:v\d+\/)?/, '/upload/w_1600,c_limit,q_auto:best/');
    }
  }

  // Local storage URLs
  if (rawUrl.startsWith('/uploads/')) {
    return `http://localhost:5000${rawUrl}`;
  }
  return rawUrl;
}

function getDocumentThumbnailUrl(doc) {
  if (!doc) return '';
  const rawUrl = doc.thumbnailUrl || doc.url || '';
  const isPdf = doc.mimeType === 'application/pdf' || rawUrl.toLowerCase().includes('.pdf');

  if (rawUrl.includes('cloudinary.com')) {
    if (isPdf) {
      return rawUrl
        .replace(/\/upload\/(?:v\d+\/)?/, '/upload/pg_1,w_400,h_260,c_fill,q_auto/')
        .replace(/\.pdf$/i, '.jpg');
    }
    return rawUrl.replace(/\/upload\/(?:v\d+\/)?/, '/upload/w_400,h_260,c_fill,q_auto/');
  }

  if (rawUrl.startsWith('/uploads/')) {
    return `http://localhost:5000${rawUrl}`;
  }
  return rawUrl;
}

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

  // Interactive Document Viewer State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewParentReq, setPreviewParentReq] = useState(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);

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
      if (previewDoc) {
        setPreviewDoc(null);
      }
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
      if (previewDoc) {
        setPreviewDoc(null);
      }
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
      if (previewDoc) {
        setPreviewDoc(null);
      }
      fetchVerifications();
    } catch (err) {
      toast.error('Failed to request correction.');
    }
  };

  const openDocumentViewer = (doc, parentReq) => {
    setPreviewDoc(doc);
    setPreviewParentReq(parentReq);
    setPdfPage(1);
    setZoomLevel(100);
    setRotation(0);
  };

  const isPdfDoc = (doc) => {
    if (!doc) return false;
    return doc.mimeType === 'application/pdf' || (doc.url && doc.url.toLowerCase().includes('.pdf'));
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

      {/* Header & Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
              <ShieldCheck className="text-amber-400" size={26} />
              Member Verification Console
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Inspect uploaded college ID cards, marksheets, and degree certificates or review approval history.
            </p>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-surface-border)] pb-3">
          {[
            { id: 'pending', label: 'Pending Review', color: 'text-amber-400' },
            { id: 'approved', label: 'Approved History', color: 'text-emerald-400' },
            { id: 'rejected', label: 'Rejected', color: 'text-rose-400' },
            { id: 'resubmission_required', label: 'Action Required', color: 'text-blue-400' },
            { id: 'all', label: 'All Submissions', color: 'text-[var(--color-text-primary)]' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterStatus(tab.id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                filterStatus === tab.id
                  ? 'bg-[var(--color-surface-3)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-surface-border)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                tab.id === 'pending' ? 'bg-amber-400' :
                tab.id === 'approved' ? 'bg-emerald-400' :
                tab.id === 'rejected' ? 'bg-rose-400' :
                tab.id === 'resubmission_required' ? 'bg-blue-400' : 'bg-gray-400'
              }`} />
              {tab.label}
            </button>
          ))}
        </div>
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
                      className="text-xs flex items-center gap-1.5 shadow-sm"
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
                  <div className="flex flex-col sm:items-end text-xs">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <Check size={14} /> Approved by {req.reviewedBy ? `${req.reviewedBy.firstName} ${req.reviewedBy.lastName}` : 'Administrator'}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                      {formatDate(req.reviewedAt || req.updatedAt)}
                    </span>
                    {req.adminNotes && (
                      <span className="text-[11px] text-[var(--color-text-muted)] italic mt-0.5 max-w-xs truncate">
                        "{req.adminNotes}"
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Uploaded Documents Gallery with Direct Preview Thumbnails */}
              <div className="p-4 rounded-xl bg-[var(--color-surface-2)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <FileCheck size={14} className="text-blue-400" />
                    Attached Verification Documents ({req.documents?.length || 0}):
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    Click any document to inspect in high resolution
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {req.documents?.map((doc, idx) => {
                    const isPdf = isPdfDoc(doc);
                    const thumbUrl = getDocumentThumbnailUrl(doc);

                    return (
                      <div
                        key={idx}
                        onClick={() => openDocumentViewer(doc, req)}
                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-1)] hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
                      >
                        {/* Thumbnail Image Container */}
                        <div className="h-32 w-full bg-[var(--color-surface-3)] overflow-hidden flex items-center justify-center relative">
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={doc.filename || `Doc ${idx + 1}`}
                              className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : null}

                          {/* Fallback Icon Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                            <div className="p-2 rounded-full bg-blue-600/90 text-white shadow-lg group-hover:scale-110 transition-transform">
                              <Eye size={18} />
                            </div>
                          </div>

                          {/* PDF / Image Format Badge */}
                          <span
                            className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase text-white shadow ${
                              isPdf ? 'bg-rose-600' : 'bg-emerald-600'
                            }`}
                          >
                            {isPdf ? 'PDF' : 'IMAGE'}
                          </span>
                        </div>

                        {/* Document Meta */}
                        <div className="p-2.5 space-y-1">
                          <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate" title={doc.filename}>
                            {doc.filename || `Document_${idx + 1}`}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                            <span className="capitalize">{doc.label || doc.type || 'Verification Doc'}</span>
                            <span className="text-blue-400 font-medium group-hover:underline flex items-center gap-0.5">
                              Inspect <ChevronRight size={10} />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

      {/* ===== HIGH-DEFINITION DOCUMENT INSPECTION MODAL ===== */}
      <Modal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc ? `Document Inspection: ${previewDoc.filename || 'Verification Attachment'}` : ''}
        size="xl"
      >
        {previewDoc && (
          <div className="space-y-4">
            {/* Viewer Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-surface-border)]">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase text-white ${
                    isPdfDoc(previewDoc) ? 'bg-rose-600' : 'bg-emerald-600'
                  }`}
                >
                  {isPdfDoc(previewDoc) ? 'PDF Document' : 'Image Scan'}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {previewDoc.label || previewDoc.type || 'Identity Proof'}
                </span>
              </div>

              {/* PDF Page Navigation & Zoom Controls */}
              <div className="flex items-center gap-2">
                {isPdfDoc(previewDoc) && (
                  <div className="flex items-center gap-1 bg-[var(--color-surface-1)] px-2 py-1 rounded border border-[var(--color-surface-border)] text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pdfPage <= 1}
                      onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                      className="px-1.5 py-0.5 h-auto text-xs"
                    >
                      ◀ Prev
                    </Button>
                    <span className="font-mono px-1">Page {pdfPage}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPdfPage((p) => p + 1)}
                      className="px-1.5 py-0.5 h-auto text-xs"
                    >
                      Next ▶
                    </Button>
                  </div>
                )}

                {/* Zoom & Rotate */}
                <div className="flex items-center gap-1 bg-[var(--color-surface-1)] p-1 rounded border border-[var(--color-surface-border)]">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                    className="p-1 rounded hover:bg-[var(--color-surface-3)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-[11px] font-mono px-1 min-w-[36px] text-center">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(250, z + 25))}
                    className="p-1 rounded hover:bg-[var(--color-surface-3)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1 rounded hover:bg-[var(--color-surface-3)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] ml-1 border-l border-[var(--color-surface-border)] pl-1.5"
                    title="Rotate 90°"
                  >
                    <RotateCw size={16} />
                  </button>
                </div>

                {/* External Download Link */}
                <a
                  href={previewDoc.downloadUrl || getDocumentDisplayUrl(previewDoc, pdfPage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={previewDoc.filename || 'document'}
                  className="btn btn-outline btn-sm text-xs flex items-center gap-1.5"
                  title="Open Original / Download File"
                >
                  <Download size={14} /> Open Original
                </a>
              </div>
            </div>

            {/* Document Canvas Display */}
            <div className="relative min-h-[420px] max-h-[65vh] overflow-auto rounded-xl bg-neutral-950/80 border border-[var(--color-surface-border)] flex items-center justify-center p-4">
              <img
                key={`${previewDoc.url}-${pdfPage}-${rotation}-${zoomLevel}`}
                src={getDocumentDisplayUrl(previewDoc, pdfPage)}
                alt={previewDoc.filename || 'Document Page'}
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease',
                  maxHeight: zoomLevel === 100 ? '58vh' : 'none',
                }}
                className="max-w-full rounded shadow-2xl object-contain"
                onError={(e) => {
                  toast.error('Unable to load page ' + pdfPage + ' directly. Showing document details.');
                }}
              />
            </div>

            {/* Quick Admin Actions inside Viewer */}
            {previewParentReq && (previewParentReq.status === 'pending' || previewParentReq.status === 'under_review') && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)]">
                <div className="text-xs text-[var(--color-text-muted)]">
                  Verifying <strong className="text-[var(--color-text-primary)]">{previewParentReq.user?.firstName} {previewParentReq.user?.lastName}</strong> ({previewParentReq.user?.department})
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleApprove(previewParentReq)}
                    className="text-xs flex items-center gap-1.5"
                  >
                    <Check size={14} /> Approve Verification
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedReq(previewParentReq);
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
                      setSelectedReq(previewParentReq);
                      setShowRejectModal(true);
                    }}
                    className="text-xs text-rose-400 hover:bg-rose-500/10"
                  >
                    <X size={14} /> Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

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
