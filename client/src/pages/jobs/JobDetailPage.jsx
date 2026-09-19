import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Building,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  User,
  Users,
  Eye,
  FileText,
  Share2,
  ExternalLink,
  ChevronLeft,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { jobsAPI, aiAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, StatusBadge, RoleBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Textarea, Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate, formatCurrency, getProgressColor } from '../../lib/utils';

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [existingApplication, setExistingApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI Match state
  const [aiMatch, setAiMatch] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Apply Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [referredBy, setReferredBy] = useState('');

  // Fetch Job details
  const fetchJobDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jobsAPI.get(id);
      setJob(res.data.data.job);
      setExistingApplication(res.data.data.application);

      // Fetch AI Match
      setLoadingAI(true);
      try {
        const aiRes = await aiAPI.matchJob({ jobId: id });
        setAiMatch(aiRes.data.data);
      } catch (err) {
        console.warn('AI Matchmaker failed:', err);
      } finally {
        setLoadingAI(false);
      }
    } catch (err) {
      toast.error('Failed to load opportunity details.');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchJobDetail();
  }, [fetchJobDetail]);

  // Handle Apply
  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      const res = await jobsAPI.apply(id, {
        coverLetter,
        referredBy: referredBy || undefined,
      });
      toast.success(res.data.message || 'Application submitted successfully!');
      setShowApplyModal(false);
      fetchJobDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading opportunity...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto mt-12">
        <Briefcase className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-40" />
        <h2 className="text-xl font-bold mb-2">Job Not Found</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          This position may have been closed or removed by the employer.
        </p>
        <Link to="/jobs">
          <Button variant="primary">Browse All Jobs</Button>
        </Link>
      </div>
    );
  }

  const isDeadlinePassed = job.applicationDeadline && new Date() > new Date(job.applicationDeadline);
  const isDeptEligible = !job.eligibleDepartments?.length || job.eligibleDepartments.includes(user?.department);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ChevronLeft size={16} /> Back to listings
      </button>

      {/* ===== HERO HEADER CARD ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 sm:p-8 relative overflow-hidden border border-[var(--color-surface-border)] shadow-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-blue capitalize">{job.type}</span>
              <span className="badge badge-gray capitalize">{job.workMode}</span>
              {job.isReferralOnly && <span className="badge badge-gold">★ Alumni Referral</span>}
              {existingApplication && (
                <StatusBadge status={existingApplication.status || 'applied'} />
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
                {job.title}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-blue-400 font-semibold text-base">
                <Building size={18} />
                <span>{job.companyName}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-[var(--color-text-muted)]">
              {job.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-rose-400" />
                  {job.location}
                </span>
              )}

              {/* Compensation */}
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <DollarSign size={16} />
                {job.type === 'job'
                  ? job.ctcDisplayText || (job.ctcMin && job.ctcMax ? `${job.ctcMin} - ${job.ctcMax} LPA` : `${job.ctcMin || 6} LPA`)
                  : job.stipendDisplayText || (job.stipendMin ? `${formatCurrency(job.stipendMin)} / mo` : 'Stipend Disclosed in Interview')}
              </span>

              {job.applicationDeadline && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-purple-400" />
                  Deadline: {formatDate(job.applicationDeadline, 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[200px]">
            {existingApplication ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-sm font-bold">
                  <CheckCircle2 size={16} /> Applied
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Track in <Link to="/applications" className="text-blue-400 hover:underline">Applications</Link>
                </p>
              </div>
            ) : isDeadlinePassed ? (
              <Button disabled variant="ghost" className="w-full text-rose-400 opacity-75">
                Deadline Passed
              </Button>
            ) : (
              <Button
                onClick={() => setShowApplyModal(true)}
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Send size={16} /> Apply Now
              </Button>
            )}

            <Link to="/applications" className="w-full">
              <Button variant="outline" size="sm" className="w-full text-xs">
                View All Applications
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ===== MAIN CONTENT (2 COLUMNS) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2 Cols): Description, Responsibilities, Skills, Eligibility */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Overview */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Briefcase size={20} className="text-blue-400" />
              About the Opportunity
            </h2>
            <div className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed">
              {job.description}
            </div>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                Key Responsibilities
              </h2>
              <ul className="space-y-2.5">
                {job.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                    <span className="text-blue-400 font-bold mt-0.5">•</span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Required & Preferred Skills */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              Skills & Expertise Required
            </h2>

            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Mandatory Skills
                </span>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.preferredSkills && job.preferredSkills.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Preferred / Nice-to-Have
                </span>
                <div className="flex flex-wrap gap-2">
                  {job.preferredSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-surface-border)] text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Eligibility Criteria & Candidate Checker */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <GraduationCap size={20} className="text-purple-400" />
              Eligibility Criteria
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[var(--color-surface-2)] space-y-2">
                <div className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Eligible Departments:
                </div>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">
                  {job.eligibleDepartments?.length > 0
                    ? job.eligibleDepartments.join(', ')
                    : 'Open to all TCET departments'}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] pt-1">
                  {isDeptEligible ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Your Department ({user?.department}) is eligible
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertCircle size={12} /> Your department is not in the primary list
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-surface-2)] space-y-2">
                <div className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Academic Requirements:
                </div>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">
                  {job.minCGPA ? `Minimum CGPA: ${job.minCGPA}` : 'No minimum CGPA cutoff'}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {job.eligibleGraduationYears?.length > 0
                    ? `Eligible Batches: ${job.eligibleGraduationYears.join(', ')}`
                    : 'Open to all batches'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1 Col): AI Resume Matchmaker & Poster Info */}
        <div className="space-y-6">
          {/* ===== AI RESUME MATCHMAKER CARD ===== */}
          <div className="card p-6 border-l-4 border-blue-500 bg-gradient-to-b from-blue-500/10 to-transparent space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                AI Job Match Analysis
              </h2>
              {aiMatch && (
                <span className="badge badge-gold font-bold font-mono text-xs">
                  {aiMatch.matchScore}%
                </span>
              )}
            </div>

            {loadingAI ? (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
                Analyzing your resume skills against job requirements...
              </div>
            ) : aiMatch ? (
              <div className="space-y-3">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {aiMatch.matchLabel}
                    </span>
                    <span className="text-[var(--color-text-muted)] font-mono">
                      {aiMatch.matchScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-2)] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${aiMatch.matchScore}%`,
                        backgroundColor: getProgressColor(aiMatch.matchScore),
                      }}
                    />
                  </div>
                </div>

                {/* Matched Skills */}
                {aiMatch.required?.matched?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Matched Skills ({aiMatch.required.matched.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {aiMatch.required.matched.map((s, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {aiMatch.required?.missing?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                      <XCircle size={12} /> Missing Skills ({aiMatch.required.missing.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {aiMatch.required.missing.map((s, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {aiMatch.suggestions && aiMatch.suggestions.length > 0 && (
                  <div className="p-3 rounded-lg bg-[var(--color-surface-2)] text-[11px] text-[var(--color-text-secondary)] space-y-1 mt-2">
                    <strong className="text-[var(--color-text-primary)] block">AI Recommendations:</strong>
                    {aiMatch.suggestions.map((sug, i) => (
                      <p key={i}>• {sug}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)] italic">
                Add skills to your profile to get personalized AI match insights for this role.
              </p>
            )}
          </div>

          {/* Job Poster Details */}
          {job.postedBy && (
            <div className="card p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Opportunity Posted By
              </h3>
              <div className="flex items-center gap-3">
                <Avatar
                  src={job.postedBy.profilePhoto}
                  firstName={job.postedBy.firstName}
                  lastName={job.postedBy.lastName}
                  size="md"
                />
                <div>
                  <Link
                    to={`/profile/${job.postedBy._id}`}
                    className="font-bold text-sm text-[var(--color-text-primary)] hover:text-blue-400 block"
                  >
                    {job.postedBy.firstName} {job.postedBy.lastName}
                  </Link>
                  <div className="mt-0.5">
                    <RoleBadge role={job.postedBy.role} />
                  </div>
                </div>
              </div>

              {job.postedBy._id !== user?._id && (
                <Link to={`/messages?user=${job.postedBy._id}`} className="block pt-2">
                  <Button variant="ghost" size="sm" className="w-full text-xs flex items-center justify-center gap-1.5">
                    <MessageSquare size={14} /> Inquire with Poster
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Opportunity Stats */}
          <div className="card p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Activity & Engagement
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-lg bg-[var(--color-surface-2)]">
                <div className="text-xl font-bold font-mono text-blue-400">
                  {job.viewCount || 0}
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] flex items-center justify-center gap-1 mt-1">
                  <Eye size={12} /> Views
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--color-surface-2)]">
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {job.applicationCount || 0}
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] flex items-center justify-center gap-1 mt-1">
                  <Users size={12} /> Applicants
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== APPLY NOW MODAL ===== */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title={`Apply for ${job.title}`}
        size="lg"
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">Applicant Snapshot</span>
              <span className="text-xs font-bold text-blue-400">{user?.department}</span>
            </div>
            <p className="text-sm font-bold text-[var(--color-text-primary)]">
              {user?.firstName} {user?.lastName} ({user?.email})
            </p>
            {profile?.resume?.url ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
                <FileText size={14} /> Attached Resume: {profile.resume.filename || 'Profile Resume'}
              </div>
            ) : (
              <div className="text-xs text-amber-400 pt-1">
                No resume uploaded on profile. Please consider uploading one in settings.
              </div>
            )}
          </div>

          <Textarea
            label="Cover Letter / Introductory Note"
            required
            rows={5}
            placeholder="Explain why you are a great fit for this position, your relevant skills, and past projects..."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />

          <Input
            label="Alumni Referral Name / Contact (Optional)"
            placeholder="e.g. Rahul Sharma (Batch '20)"
            value={referredBy}
            onChange={(e) => setReferredBy(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={applying}>
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
