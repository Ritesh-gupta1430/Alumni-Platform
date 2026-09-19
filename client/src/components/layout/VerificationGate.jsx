import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Clock,
  AlertCircle,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Lock
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { Button } from '../ui/Button';

export function VerificationGate({ children, featureName = 'this platform feature' }) {
  const { user } = useAuth();

  // Admins or approved accounts bypass the gate
  if (['ADMIN', 'SUPER_ADMIN'].includes(user?.role) || user?.verificationStatus === 'approved') {
    return children;
  }

  const status = user?.verificationStatus || 'not_submitted';

  const statusConfig = {
    not_submitted: {
      icon: Lock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      title: 'Institutional Verification Required',
      description: `To access ${featureName}, apply for jobs, connect with alumni, or request mentorship, please complete your TCET institutional verification.`,
      actionLabel: 'Submit Verification Documents',
      actionTo: '/settings/verification',
    },
    pending: {
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/30',
      title: 'Verification Under Review',
      description: `Your identity documents have been submitted and are currently in the review queue by the TCET Administration. Full access to ${featureName} will unlock automatically upon approval.`,
      actionLabel: 'Check Submission Status',
      actionTo: '/settings/verification',
    },
    under_review: {
      icon: RefreshCw,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/30',
      title: 'Application Under Active Examination',
      description: `An administrator is actively reviewing your credentials. You will receive an in-app and email notification once verified.`,
      actionLabel: 'View Application Details',
      actionTo: '/settings/verification',
    },
    resubmission_required: {
      icon: AlertCircle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/30',
      title: 'Document Correction / Resubmission Required',
      description: user?.adminComment || 'The administrator requested clearer document scans or updated credentials before approving your account.',
      actionLabel: 'Resubmit Documents Now',
      actionTo: '/settings/verification',
    },
    rejected: {
      icon: ShieldAlert,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/30',
      title: 'Verification Request Rejected',
      description: user?.rejectionReason ? `Reason: "${user.rejectionReason}"` : 'Your previous verification submission could not be verified. Please submit valid institutional proof to regain platform access.',
      actionLabel: 'Submit New Proof',
      actionTo: '/settings/verification',
    },
  };

  const current = statusConfig[status] || statusConfig.not_submitted;
  const Icon = current.icon;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card p-8 sm:p-10 border ${current.bgColor} text-center space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl`}
      >
        <div className="w-20 h-20 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex items-center justify-center mx-auto shadow-xl">
          <Icon className={current.color} size={38} />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <span className="badge badge-gold uppercase text-[10px] tracking-wider font-bold">
            Institutional Trust & Safety
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
            {current.title}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed pt-1">
            {current.description}
          </p>
        </div>

        {/* Status Tracker Steps */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto pt-4 text-xs">
          <div className={`p-3 rounded-xl border text-center ${status !== 'not_submitted' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold' : 'border-[var(--color-surface-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'}`}>
            <span className="block font-bold">1. Submit ID</span>
            <span className="text-[10px] opacity-75">{status !== 'not_submitted' ? 'Done ✓' : 'Required'}</span>
          </div>
          <div className={`p-3 rounded-xl border text-center ${['pending', 'under_review'].includes(status) ? 'border-blue-500/40 bg-blue-500/10 text-blue-300 font-semibold' : status === 'approved' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-[var(--color-surface-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'}`}>
            <span className="block font-bold">2. Admin Review</span>
            <span className="text-[10px] opacity-75">{['pending', 'under_review'].includes(status) ? 'In Progress' : 'Pending'}</span>
          </div>
          <div className={`p-3 rounded-xl border text-center ${status === 'approved' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold' : 'border-[var(--color-surface-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'}`}>
            <span className="block font-bold">3. Access Unlocked</span>
            <span className="text-[10px] opacity-75">{status === 'approved' ? 'Verified ✓' : 'Awaiting'}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link to={current.actionTo} className="btn btn-primary w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/20">
            {current.actionLabel} <ArrowRight size={16} />
          </Link>
          <Link to="/dashboard" className="btn btn-ghost w-full sm:w-auto text-xs text-[var(--color-text-muted)] hover:text-white">
            Return to Overview
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
