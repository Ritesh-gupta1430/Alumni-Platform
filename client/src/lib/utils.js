import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date, fmt = 'MMM d, yyyy') {
  if (!date) return '';
  return format(new Date(date), fmt);
}

export function timeAgo(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
}

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num?.toLocaleString('en-IN') || '0';
}

export function getInitials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

export function getRoleBadge(role) {
  const map = {
    STUDENT: { label: 'Student', class: 'badge-blue' },
    ALUMNI: { label: 'Alumni', class: 'badge-gold' },
    FACULTY: { label: 'Faculty', class: 'badge-violet' },
    PLACEMENT_OFFICER: { label: 'Placement', class: 'badge-cyan' },
    RECRUITER: { label: 'Recruiter', class: 'badge-orange' },
    COMMUNITY_MANAGER: { label: 'Community', class: 'badge-green' },
    ADMIN: { label: 'Admin', class: 'badge-red' },
    SUPER_ADMIN: { label: 'Super Admin', class: 'badge-red' },
  };
  return map[role] || { label: role, class: 'badge-gray' };
}

export function getVerificationBadge(badge) {
  const map = {
    verified_student: { label: 'Verified Student', color: '#3b82f6' },
    verified_alumni: { label: 'Verified Alumni', color: '#f59e0b' },
    verified_faculty: { label: 'Verified Faculty', color: '#8b5cf6' },
    verified_recruiter: { label: 'Verified Recruiter', color: '#10b981' },
  };
  return map[badge] || null;
}

export function getStatusColor(status) {
  const map = {
    active: 'badge-green',
    pending: 'badge-gold',
    pending_email: 'badge-gray',
    pending_verification: 'badge-blue',
    suspended: 'badge-red',
    deactivated: 'badge-gray',
    approved: 'badge-green',
    rejected: 'badge-red',
    under_review: 'badge-blue',
    resubmission_required: 'badge-orange',
    applied: 'badge-blue',
    shortlisted: 'badge-cyan',
    assessment: 'badge-violet',
    interview: 'badge-gold',
    selected: 'badge-green',
    withdrawn: 'badge-gray',
    success: 'badge-green',
    failed: 'badge-red',
    initiated: 'badge-gray',
    open: 'badge-green',
    limited: 'badge-gold',
    closed: 'badge-red',
  };
  return map[status] || 'badge-gray';
}

export function getProgressColor(percentage) {
  if (percentage >= 80) return '#10b981';
  if (percentage >= 60) return '#3b82f6';
  if (percentage >= 40) return '#f59e0b';
  return '#ef4444';
}

export function truncate(str, length = 100) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + '...';
}

export function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Computer Science',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Chemical Engineering',
  'AIDS (AI & Data Science)',
  'First Year Engineering',
];

export const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

export const CURRENT_YEARS = [1, 2, 3, 4];

export const WORK_MODES = ['remote', 'hybrid', 'onsite'];

export const SKILL_CATEGORIES = ['technical', 'soft', 'language', 'tool', 'other'];

export const COMMON_SKILLS = [
  'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'MongoDB',
  'MySQL', 'HTML/CSS', 'Git', 'Docker', 'AWS', 'Machine Learning',
  'Data Science', 'Flutter', 'Android', 'iOS', 'TypeScript', 'Next.js',
  'Express.js', 'Django', 'Spring Boot', 'Kubernetes', 'Linux',
  'Figma', 'Photoshop', 'Communication', 'Leadership', 'Project Management',
];
