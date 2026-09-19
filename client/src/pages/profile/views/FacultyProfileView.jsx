import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Award,
  Users,
  Building,
  Sparkles,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export function FacultyProfileView({
  user,
  profile,
  experiences = [],
  projects = [],
  isOwnProfile,
  onRequestMentorship
}) {
  const subjectsTaught = [
    'Advanced Data Structures & Algorithms',
    'Cloud Computing & Distributed Systems',
    'Artificial Intelligence & Machine Learning',
    'Object-Oriented Software Engineering',
  ];

  const researchAreas = [
    'Distributed Cloud Architectures',
    'AI-driven Predictive Analytics',
    'Educational Data Mining',
    'Next-gen Network Security',
  ];

  return (
    <div className="space-y-6">
      {/* ===== 1. FACULTY ACADEMIC & INSTITUTIONAL CREDENTIALS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Main Faculty Overview */}
        <div className="card p-6 md:col-span-2 space-y-4 border border-indigo-500/20 bg-gradient-to-br from-[var(--color-surface-1)] via-[var(--color-surface-2)] to-indigo-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                <GraduationCap size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">Faculty & Academic Portfolio</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">Department of {user.department || 'Computer Engineering'}, TCET</p>
              </div>
            </div>
            <span className="badge badge-violet">
              {user.role === 'PLACEMENT_OFFICER' ? 'Placement Officer' : 'Faculty Member'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Designation</span>
              <strong className="text-[var(--color-text-primary)] block truncate">{profile?.currentDesignation || 'Professor'}</strong>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Department</span>
              <strong className="text-indigo-400 block truncate">{user.department || 'Engineering'}</strong>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Experience</span>
              <strong className="text-emerald-400 block font-bold">{profile?.yearsOfExperience || 10}+ Years</strong>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Verification</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck size={14} /> Institutional
              </span>
            </div>
          </div>
        </div>

        {/* Office Hours & Student Guidance Card */}
        <div className="card p-5 space-y-4 border border-indigo-500/20 bg-[var(--color-surface-1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Student Guidance Hours</h3>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mb-3">
              Available for final-year project guidance, research paper reviews, and academic mentoring.
            </p>

            <div className="space-y-2 text-xs p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)]">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Days</span>
                <span className="font-semibold text-[var(--color-text-primary)]">Mon, Wed, Fri</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Time</span>
                <span className="font-semibold text-indigo-400">3:00 PM – 5:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Location</span>
                <span className="font-semibold text-[var(--color-text-primary)]">Faculty Cabin 402</span>
              </div>
            </div>
          </div>

          {!isOwnProfile && (
            <Button onClick={onRequestMentorship} variant="primary" className="w-full text-xs flex items-center justify-center gap-1.5">
              <Sparkles size={14} /> Book Guidance Slot
            </Button>
          )}
        </div>
      </div>

      {/* ===== 2. SUBJECTS TAUGHT & RESEARCH AREAS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Subjects Taught */}
        <div className="card p-6 space-y-4 border border-[var(--color-surface-border)]">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-400" />
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">Courses & Subjects Taught</h3>
          </div>

          <div className="space-y-2.5">
            {subjectsTaught.map((sub, i) => (
              <div key={i} className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex items-center gap-3 text-xs">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                  {i + 1}
                </div>
                <span className="font-semibold text-[var(--color-text-primary)]">{sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Research Areas & Publications */}
        <div className="card p-6 space-y-4 border border-[var(--color-surface-border)]">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-purple-400" />
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">Research Domains & Publications</h3>
          </div>

          <div className="space-y-2.5">
            {researchAreas.map((res, i) => (
              <div key={i} className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex items-start gap-3 text-xs">
                <span className="p-1 rounded bg-purple-500/15 text-purple-400 mt-0.5 shrink-0">
                  <CheckCircle2 size={14} />
                </span>
                <div>
                  <span className="font-semibold text-[var(--color-text-primary)] block">{res}</span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">Peer-reviewed publications & ongoing student grants</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
