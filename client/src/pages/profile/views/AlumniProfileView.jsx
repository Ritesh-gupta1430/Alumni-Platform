import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  GraduationCap,
  Sparkles,
  Building,
  MapPin,
  Calendar,
  Award,
  Users,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Heart,
  TrendingUp,
  CheckCircle2,
  Clock,
  BookOpen
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { formatDate } from '../../../lib/utils';

export function AlumniProfileView({
  user,
  profile,
  experiences = [],
  projects = [],
  isOwnProfile,
  onOpenExpModal,
  onDeleteExp,
  onRequestMentorship
}) {
  const impactBreakdown = profile?.impactBreakdown || {
    mentorship: 30,
    events: 20,
    referrals: 15,
    volunteering: 10,
    donations: 25,
  };

  const totalImpact = profile?.impactScore || 100;
  const isMentor = profile?.isMentor || false;
  const mentorshipTopics = profile?.mentorshipTopics || [];

  return (
    <div className="space-y-6">
      {/* ===== 1. ALUMNI IMPACT SCORECARD & MENTORSHIP STATUS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Impact Score Hero */}
        <div className="card p-6 md:col-span-2 space-y-5 border border-amber-500/20 bg-gradient-to-br from-[var(--color-surface-1)] via-[var(--color-surface-2)] to-amber-950/20 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">Alumni Institutional Impact</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">Contributions towards TCET students and campus ecosystem</p>
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <span className="text-2xl font-black">{totalImpact}</span>
              <span className="text-xs font-semibold uppercase tracking-wider">Impact Score</span>
            </div>
          </div>

          {/* Interactive Impact Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[11px] text-[var(--color-text-muted)] block mb-1">Mentorship Hours</span>
              <span className="text-sm font-bold text-amber-400 block">{impactBreakdown.mentorship || 24} hrs</span>
              <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 block">+12 Students Guided</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[11px] text-[var(--color-text-muted)] block mb-1">Career Referrals</span>
              <span className="text-sm font-bold text-emerald-400 block">{impactBreakdown.referrals || 8}</span>
              <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 block">TCET Placements</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[11px] text-[var(--color-text-muted)] block mb-1">Campus Talks</span>
              <span className="text-sm font-bold text-cyan-400 block">{impactBreakdown.events || 4}</span>
              <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 block">Webinars & Panels</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[11px] text-[var(--color-text-muted)] block mb-1">Graduation Batch</span>
              <span className="text-sm font-bold text-blue-400 block">{user.graduationYear ? `Class of ${user.graduationYear}` : 'Alumni'}</span>
              <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 block">{user.department || 'TCET'}</span>
            </div>
          </div>
        </div>

        {/* Mentorship Hub Card */}
        <div className="card p-5 space-y-4 border border-amber-500/20 bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-amber-400" />
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">Mentorship Hub</h3>
              </div>
              <span className={`badge ${profile?.mentorshipAvailability === 'open' ? 'badge-gold' : 'badge-gray'}`}>
                {profile?.mentorshipAvailability === 'open' ? '⚡ Open for Mentoring' : 'Closed'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[var(--color-text-muted)] block mb-1 font-medium">Mentoring Topics</span>
                {mentorshipTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {mentorshipTopics.map((topic, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--color-text-muted)] italic">Career Guidance, System Design, Tech Leadership</p>
                )}
              </div>

              <div className="pt-2 border-t border-[var(--color-surface-border)] flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Active Mentee Slots</span>
                <span className="font-bold text-[var(--color-text-primary)]">
                  {profile?.currentMenteeCount || 2} / {profile?.maxMentees || 3} Slots
                </span>
              </div>
            </div>
          </div>

          {!isOwnProfile ? (
            profile?.mentorshipAvailability === 'open' ? (
              <Button onClick={onRequestMentorship} variant="gold" className="w-full flex items-center justify-center gap-2 text-xs mt-2">
                <Sparkles size={14} /> Request 1-on-1 Mentorship
              </Button>
            ) : (
              <Button disabled variant="ghost" className="w-full text-xs opacity-60 mt-2">
                Mentorship Slots Full
              </Button>
            )
          ) : (
            <Link to="/mentorship/mentor" className="btn btn-outline btn-sm w-full flex items-center justify-center gap-1.5 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10 mt-2">
              <Edit3 size={13} /> Manage Mentorship Settings
            </Link>
          )}
        </div>
      </div>

      {/* ===== 2. CAREER TIMELINE & WORK EXPERIENCES ===== */}
      <div className="card p-6 space-y-6 border border-[var(--color-surface-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Briefcase size={20} className="text-blue-400" />
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">Professional Journey & Career Path</h3>
          </div>
          {isOwnProfile && (
            <Button onClick={() => onOpenExpModal()} variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs">
              <Plus size={14} /> Add Experience
            </Button>
          )}
        </div>

        {experiences.length > 0 ? (
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[var(--color-surface-border)]">
            {experiences.map((exp) => (
              <div key={exp._id} className="relative pl-9 group">
                <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-[var(--color-surface-1)] border-2 border-blue-500 group-hover:scale-125 transition-transform" />

                <div className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] group-hover:border-blue-500/30 transition-all space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-text-primary)]">{exp.role}</h4>
                      <p className="text-xs font-semibold text-blue-400">{exp.company}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                        <Calendar size={13} />
                        {formatDate(exp.startDate)} — {exp.isCurrent ? <strong className="text-emerald-400">Present</strong> : formatDate(exp.endDate)}
                      </span>

                      {isOwnProfile && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => onOpenExpModal(exp)}
                            className="p-1 text-[var(--color-text-muted)] hover:text-blue-400 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteExp(exp._id)}
                            className="p-1 text-[var(--color-text-muted)] hover:text-rose-400 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {exp.location && (
                    <p className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                      <MapPin size={12} /> {exp.location} {exp.workMode ? `• (${exp.workMode})` : ''}
                    </p>
                  )}

                  {exp.description && (
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed pt-1">
                      {exp.description}
                    </p>
                  )}

                  {exp.skills && exp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {exp.skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-[var(--color-surface-3)] text-[10px] text-[var(--color-text-secondary)]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[var(--color-surface-2)]/50 rounded-xl border border-dashed border-[var(--color-surface-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">No professional experiences listed yet.</p>
          </div>
        )}
      </div>

      {/* ===== 3. GIVING BACK & ALUMNI CONTRIBUTIONS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Alumni Stories & Guidance */}
        <div className="card p-5 space-y-3 border border-[var(--color-surface-border)] bg-[var(--color-surface-1)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-purple-400" />
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Alumni Stories & Articles</h3>
            </div>
            <Link to="/stories" className="text-xs text-purple-400 hover:underline">
              View All
            </Link>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Featured career journeys, advice for juniors, and industry insights written for TCET students.
          </p>
          <div className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] text-xs flex items-center justify-between">
            <div>
              <span className="font-semibold text-[var(--color-text-primary)] block">Transitioning from College to Product Engineering</span>
              <span className="text-[11px] text-[var(--color-text-muted)]">Published on AlumNetra Insights</span>
            </div>
            <span className="badge badge-violet text-[10px]">Story</span>
          </div>
        </div>

        {/* Giving Back / Contributions */}
        <div className="card p-5 space-y-3 border border-[var(--color-surface-border)] bg-[var(--color-surface-1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-rose-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Institutional Giving</h3>
              </div>
              <span className="badge badge-red text-[10px]">Patron</span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Supporting student scholarships, campus innovation labs, and departmental hackathons.
            </p>
          </div>

          <Link to="/contributions" className="btn btn-secondary btn-sm w-full flex items-center justify-center gap-1.5 text-xs text-rose-300 hover:text-rose-200">
            <Heart size={14} className="text-rose-400" /> Explore TCET Impact Campaigns
          </Link>
        </div>
      </div>
    </div>
  );
}
