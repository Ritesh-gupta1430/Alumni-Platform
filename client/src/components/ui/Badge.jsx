import { cn } from '../../lib/utils';

export function Badge({ children, variant = 'blue', className = '' }) {
  const variants = {
    blue: 'badge-blue',
    green: 'badge-green',
    gold: 'badge-gold',
    red: 'badge-red',
    violet: 'badge-violet',
    gray: 'badge-gray',
    orange: 'badge-orange',
    cyan: 'badge-cyan',
  };

  return (
    <span className={cn('badge', variants[variant] || variants.gray, className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    active: { label: 'Active', variant: 'green' },
    pending: { label: 'Pending', variant: 'gold' },
    pending_email: { label: 'Email Pending', variant: 'gray' },
    pending_verification: { label: 'Pending Verification', variant: 'blue' },
    suspended: { label: 'Suspended', variant: 'red' },
    deactivated: { label: 'Deactivated', variant: 'gray' },
    approved: { label: 'Approved', variant: 'green' },
    rejected: { label: 'Rejected', variant: 'red' },
    under_review: { label: 'Under Review', variant: 'blue' },
    resubmission_required: { label: 'Action Required', variant: 'orange' },
    applied: { label: 'Applied', variant: 'blue' },
    shortlisted: { label: 'Shortlisted', variant: 'cyan' },
    assessment: { label: 'Assessment', variant: 'violet' },
    interview: { label: 'Interview', variant: 'gold' },
    selected: { label: 'Selected 🎉', variant: 'green' },
    withdrawn: { label: 'Withdrawn', variant: 'gray' },
    success: { label: 'Success', variant: 'green' },
    failed: { label: 'Failed', variant: 'red' },
    initiated: { label: 'Initiated', variant: 'gray' },
    open: { label: 'Open', variant: 'green' },
    limited: { label: 'Limited', variant: 'gold' },
    closed: { label: 'Closed', variant: 'red' },
    not_submitted: { label: 'Not Submitted', variant: 'gray' },
    draft: { label: 'Draft', variant: 'gray' },
  };

  const info = map[status] || { label: status, variant: 'gray' };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

export function RoleBadge({ role }) {
  const map = {
    STUDENT: { label: 'Student', variant: 'blue' },
    ALUMNI: { label: 'Alumni', variant: 'gold' },
    FACULTY: { label: 'Faculty', variant: 'violet' },
    PLACEMENT_OFFICER: { label: 'Placement', variant: 'cyan' },
    RECRUITER: { label: 'Recruiter', variant: 'orange' },
    COMMUNITY_MANAGER: { label: 'Community Mgr', variant: 'green' },
    ADMIN: { label: 'Admin', variant: 'red' },
    SUPER_ADMIN: { label: 'Super Admin', variant: 'red' },
  };

  const info = map[role] || { label: role, variant: 'gray' };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

export function VerificationBadge({ badge }) {
  const map = {
    verified_student: { label: '✓ Verified Student', variant: 'blue' },
    verified_alumni: { label: '✓ Verified Alumni', variant: 'gold' },
    verified_faculty: { label: '✓ Verified Faculty', variant: 'violet' },
    verified_recruiter: { label: '✓ Verified Recruiter', variant: 'green' },
  };

  if (!badge || badge === 'none') return null;
  const info = map[badge];
  if (!info) return null;
  return <Badge variant={info.variant}>{info.label}</Badge>;
}
