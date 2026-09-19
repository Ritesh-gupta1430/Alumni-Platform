import { Link } from 'react-router-dom';
import {
  Briefcase,
  Building,
  MapPin,
  Globe,
  Users,
  CheckCircle2,
  ExternalLink,
  Plus,
  ShieldCheck,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export function RecruiterProfileView({
  user,
  profile,
  isOwnProfile
}) {
  const hiringDomains = [
    'Full Stack Software Engineering',
    'AI & Machine Learning Engineering',
    'Cloud Architecture & DevOps',
    'Product Management & Analytics',
  ];

  const activePostings = [
    {
      id: '1',
      title: 'Associate Software Engineer (Full-Time)',
      type: 'Full-Time',
      location: 'Mumbai / Hybrid',
      batch: 'Class of 2024 & 2025',
      ctc: '8–14 LPA',
    },
    {
      id: '2',
      title: 'Backend Engineering Intern',
      type: 'Internship',
      location: 'Remote',
      batch: 'Third & Final Year',
      ctc: '₹35,000 / month',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ===== 1. RECRUITER & COMPANY HERO CARD ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Company Card */}
        <div className="card p-6 md:col-span-2 space-y-4 border border-rose-500/20 bg-gradient-to-br from-[var(--color-surface-1)] via-[var(--color-surface-2)] to-rose-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <Building size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  {profile?.currentOrganization || 'Partner Organization'}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {profile?.currentDesignation || 'Talent Acquisition & University Hiring Lead'}
                </p>
              </div>
            </div>
            <span className="badge badge-red flex items-center gap-1">
              <ShieldCheck size={13} /> Verified Recruiter
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Industry</span>
              <strong className="text-[var(--color-text-primary)] block truncate">{profile?.industry || 'Technology & Fintech'}</strong>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Location</span>
              <strong className="text-rose-400 block truncate">{profile?.currentCity || 'Mumbai, India'}</strong>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">TCET Campus Hires</span>
              <strong className="text-emerald-400 block font-bold">25+ Alumni Hired</strong>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Campus Partnership</span>
              <strong className="text-blue-400 block">Tier-1 Partner</strong>
            </div>
          </div>
        </div>

        {/* Quick Recruitment Actions */}
        <div className="card p-5 space-y-4 border border-rose-500/20 bg-[var(--color-surface-1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={18} className="text-rose-400" />
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Hiring Activity</h3>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Actively scouting TCET graduates and students for upcoming placement cycles and summer internships.
            </p>
          </div>

          <div className="space-y-2">
            {isOwnProfile ? (
              <Link to="/jobs" className="btn btn-primary btn-sm w-full flex items-center justify-center gap-1.5 text-xs">
                <Plus size={14} /> Post New Job / Internship
              </Link>
            ) : (
              <Link to="/jobs" className="btn btn-outline btn-sm w-full flex items-center justify-center gap-1.5 text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10">
                <Briefcase size={14} /> View All Company Openings
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ===== 2. ACTIVE OPPORTUNITIES & HIRING FOCUS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Active Job Openings */}
        <div className="card p-6 md:col-span-2 space-y-4 border border-[var(--color-surface-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-rose-400" />
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Open Positions for TCET Students</h3>
            </div>
            <Link to="/jobs" className="text-xs text-rose-400 hover:underline">
              Browse Job Board
            </Link>
          </div>

          <div className="space-y-3">
            {activePostings.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-rose-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">{job.title}</h4>
                    <span className="badge badge-red text-[10px]">{job.type}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)] mt-1">
                    <span>{job.location}</span>
                    <span>• {job.batch}</span>
                    <span className="font-semibold text-emerald-400">• {job.ctc}</span>
                  </div>
                </div>

                <Link to="/jobs" className="btn btn-secondary btn-sm text-xs shrink-0 flex items-center gap-1">
                  Apply Now <ExternalLink size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Hiring Domains */}
        <div className="card p-6 space-y-4 border border-[var(--color-surface-border)]">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-rose-400" />
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">Key Hiring Domains</h3>
          </div>

          <div className="space-y-2">
            {(profile?.targetRoles && profile.targetRoles.length > 0 ? profile.targetRoles : hiringDomains).map((dom, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex items-center gap-2 text-xs">
                <CheckCircle2 size={14} className="text-rose-400 shrink-0" />
                <span className="font-medium text-[var(--color-text-primary)]">{dom}</span>
              </div>
            ))}
          </div>

          {/* Company & Recruiter Links */}
          {profile?.links && profile.links.length > 0 && (
            <div className="pt-3 border-t border-[var(--color-surface-border)] space-y-2">
              <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Company Links</h4>
              <div className="space-y-1.5">
                {profile.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-surface-2)] text-xs text-[var(--color-text-secondary)] hover:text-rose-400 transition-colors"
                  >
                    <span className="capitalize font-semibold">{link.platform}</span>
                    <ExternalLink size={12} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
