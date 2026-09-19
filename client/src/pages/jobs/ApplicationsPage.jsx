import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Building,
  Video,
  FileText,
  Trash2,
  Check,
  X,
  Sparkles,
  Award,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { applicationsAPI, jobsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge, RoleBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate, timeAgo } from '../../lib/utils';

export default function ApplicationsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const isRecruiterOrAdmin = [
    'RECRUITER',
    'PLACEMENT_OFFICER',
    'ADMIN',
    'SUPER_ADMIN',
  ].includes(user?.role);

  const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'recruiter'
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  // Recruiter specific state
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [recruiterApps, setRecruiterApps] = useState([]);
  const [recruiterLoading, setRecruiterLoading] = useState(false);

  // Status Change Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: 'shortlisted',
    note: '',
    interviewDate: '',
    interviewMode: 'Google Meet',
    interviewLink: '',
    offerAmount: '',
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // 1. Fetch My Applications
  const fetchMyApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await applicationsAPI.getMine({
        status: filterStatus || undefined,
        limit: 50,
      });
      setApplications(res.data.data.applications || []);
    } catch (err) {
      toast.error('Failed to load your applications.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, toast]);

  // 2. Fetch My Jobs (for recruiters)
  const fetchMyJobs = useCallback(async () => {
    if (!isRecruiterOrAdmin) return;
    try {
      const res = await jobsAPI.list({ limit: 50 });
      const list = res.data.data.jobs || [];
      setMyJobs(list);
      if (list.length > 0 && !selectedJobId) {
        setSelectedJobId(list[0]._id);
      }
    } catch (err) {
      console.warn('Failed to load posted jobs:', err);
    }
  }, [isRecruiterOrAdmin, selectedJobId]);

  // 3. Fetch Applications for Selected Job (Recruiter ATS)
  const fetchRecruiterApplications = useCallback(async () => {
    if (!selectedJobId) return;
    setRecruiterLoading(true);
    try {
      const res = await applicationsAPI.getForJob(selectedJobId);
      setRecruiterApps(res.data.data.applications || []);
    } catch (err) {
      toast.error('Failed to load applicants for this job.');
    } finally {
      setRecruiterLoading(false);
    }
  }, [selectedJobId, toast]);

  useEffect(() => {
    if (activeTab === 'mine') {
      fetchMyApplications();
    } else if (activeTab === 'recruiter') {
      fetchMyJobs();
    }
  }, [activeTab, fetchMyApplications, fetchMyJobs]);

  useEffect(() => {
    if (activeTab === 'recruiter' && selectedJobId) {
      fetchRecruiterApplications();
    }
  }, [activeTab, selectedJobId, fetchRecruiterApplications]);

  // Handle Withdraw
  const handleWithdraw = async (id) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await applicationsAPI.withdraw(id);
      toast.success('Application withdrawn.');
      fetchMyApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw application.');
    }
  };

  // Handle Status Update by Recruiter
  const handleOpenStatusModal = (app) => {
    setSelectedApp(app);
    setStatusForm({
      status: app.status || 'shortlisted',
      note: app.recruiterNotes || '',
      interviewDate: app.interviewDate ? app.interviewDate.split('T')[0] : '',
      interviewMode: app.interviewMode || 'Google Meet',
      interviewLink: app.interviewLink || '',
      offerAmount: app.offerAmount || '',
    });
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    setUpdatingStatus(true);
    try {
      await applicationsAPI.updateStatus(selectedApp._id, statusForm);
      toast.success('Applicant status updated!');
      setShowStatusModal(false);
      fetchRecruiterApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update applicant status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Helper for ATS Stages
  const stages = [
    { key: 'applied', label: 'Applied' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'interview', label: 'Interview' },
    { key: 'selected', label: 'Selected' },
  ];

  const getStageIndex = (status) => {
    switch (status) {
      case 'applied': return 0;
      case 'shortlisted': return 1;
      case 'assessment': return 2;
      case 'interview': return 3;
      case 'selected': return 4;
      default: return 0;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
            <Briefcase className="text-blue-400" size={26} />
            Application Tracking System (ATS)
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Monitor the real-time progress of your applications and interview schedules.
          </p>
        </div>

        <Link to="/jobs">
          <Button variant="outline" size="sm" className="whitespace-nowrap">
            Browse More Jobs
          </Button>
        </Link>
      </div>

      {/* Tabs (if user is Recruiter / Admin) */}
      {isRecruiterOrAdmin && (
        <div className="flex border-b border-[var(--color-surface-border)] gap-4">
          <button
            onClick={() => setActiveTab('mine')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'mine'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            My Submissions ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('recruiter')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'recruiter'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Recruiter Candidate Review
          </button>
        </div>
      )}

      {/* ===== TAB 1: MY APPLICATIONS ===== */}
      {activeTab === 'mine' && (
        <div className="space-y-6">
          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              containerClass="w-56"
            >
              <option value="">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview Scheduled</option>
              <option value="selected">Selected 🎉</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="card p-6 h-40 animate-pulse bg-[var(--color-surface-2)]" />
              ))}
            </div>
          ) : applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((app) => {
                const job = app.job;
                if (!job) return null;

                const currentStageIdx = getStageIndex(app.status);
                const isRejected = app.status === 'rejected';
                const isWithdrawn = app.status === 'withdrawn';

                return (
                  <motion.div
                    key={app._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 space-y-5 border border-[var(--color-surface-border)] shadow-md"
                  >
                    {/* Top Job Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                            <Building size={14} />
                            {job.companyName}
                          </span>
                          <span className="badge badge-gray capitalize text-[10px]">{job.type}</span>
                        </div>
                        <Link
                          to={`/jobs/${job._id}`}
                          className="text-lg font-bold text-[var(--color-text-primary)] hover:text-blue-400 transition-colors block"
                        >
                          {job.title}
                        </Link>
                        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                          <Clock size={12} /> Applied {timeAgo(app.createdAt)}
                          {job.location && ` • ${job.location}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-center">
                        <StatusBadge status={app.status} />

                        {app.status === 'applied' && (
                          <button
                            onClick={() => handleWithdraw(app._id)}
                            className="p-1.5 hover:bg-rose-500/10 text-[var(--color-text-muted)] hover:text-rose-400 rounded-lg text-xs flex items-center gap-1 transition-colors"
                            title="Withdraw"
                          >
                            <Trash2 size={14} /> Withdraw
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ===== ATS PROGRESS TIMELINE ===== */}
                    {!isRejected && !isWithdrawn && (
                      <div className="pt-2 pb-2">
                        <div className="relative flex items-center justify-between">
                          {/* Background Bar */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[var(--color-surface-2)] z-0" />
                          {/* Active Bar */}
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 transition-all duration-500 z-0"
                            style={{
                              width: `${(currentStageIdx / (stages.length - 1)) * 100}%`,
                            }}
                          />

                          {/* Stage Dots */}
                          {stages.map((stage, idx) => {
                            const isCompleted = currentStageIdx >= idx;
                            const isCurrent = currentStageIdx === idx;

                            return (
                              <div
                                key={stage.key}
                                className="relative z-10 flex flex-col items-center group"
                              >
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                    isCompleted
                                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-surface-border)]'
                                  } ${isCurrent ? 'ring-4 ring-blue-500/20 scale-110' : ''}`}
                                >
                                  {isCompleted ? <Check size={12} /> : idx + 1}
                                </div>
                                <span
                                  className={`text-[11px] mt-1.5 font-medium whitespace-nowrap ${
                                    isCurrent
                                      ? 'text-blue-400 font-bold'
                                      : isCompleted
                                      ? 'text-[var(--color-text-primary)]'
                                      : 'text-[var(--color-text-muted)]'
                                  }`}
                                >
                                  {stage.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Interview Details if Scheduled */}
                    {app.interviewDate && (
                      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                            <Video size={16} /> Interview Scheduled
                          </span>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {formatDate(app.interviewDate, 'MMMM d, yyyy')} • Mode: {app.interviewMode || 'Google Meet'}
                          </p>
                        </div>
                        {app.interviewLink && (
                          <a
                            href={app.interviewLink.startsWith('http') ? app.interviewLink : `https://${app.interviewLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
                          >
                            Join Meeting <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Offer Details if Selected */}
                    {app.status === 'selected' && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <Award size={16} /> Congratulations! You have been selected
                        </div>
                        {app.offerAmount && (
                          <p className="text-xs text-[var(--color-text-primary)]">
                            Offer Package: <strong>{app.offerAmount}</strong>
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="card p-16 text-center text-sm text-[var(--color-text-muted)] space-y-2">
              <Briefcase size={40} className="mx-auto opacity-30 mb-2" />
              <p className="font-semibold text-[var(--color-text-primary)]">No applications found</p>
              <p className="text-xs">You haven't submitted any job or internship applications yet.</p>
              <Link to="/jobs">
                <Button size="sm" variant="primary" className="mt-3">
                  Explore Opportunities
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 2: RECRUITER CANDIDATE REVIEW ===== */}
      {isRecruiterOrAdmin && activeTab === 'recruiter' && (
        <div className="space-y-6">
          {/* Job Selector */}
          <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[var(--color-text-muted)]">SELECT POSTED JOB:</span>
              <Select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                containerClass="w-full sm:w-80"
              >
                {myJobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.title} ({j.companyName})
                  </option>
                ))}
              </Select>
            </div>

            <span className="text-xs text-[var(--color-text-muted)] font-mono">
              Total Applicants: {recruiterApps.length}
            </span>
          </div>

          {/* Applicants Table / List */}
          {recruiterLoading ? (
            <div className="card p-12 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
              Loading candidates...
            </div>
          ) : recruiterApps.length > 0 ? (
            <div className="space-y-3">
              {recruiterApps.map((app) => (
                <div
                  key={app._id}
                  className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-500/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={app.applicant?.profilePhoto}
                      firstName={app.applicant?.firstName}
                      lastName={app.applicant?.lastName}
                      size="md"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/profile/${app.applicant?._id}`}
                          className="font-bold text-sm text-[var(--color-text-primary)] hover:text-blue-400"
                        >
                          {app.applicant?.firstName} {app.applicant?.lastName}
                        </Link>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {app.applicant?.department} • Class of {app.applicant?.graduationYear} • {app.applicant?.email}
                      </p>
                      {app.coverLetter && (
                        <p className="text-xs italic text-[var(--color-text-secondary)] line-clamp-1 pt-1">
                          "{app.coverLetter}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link to={`/profile/${app.applicant?._id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Profile
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenStatusModal(app)}
                      className="text-xs"
                    >
                      Update Stage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center text-xs text-[var(--color-text-muted)]">
              No applicants received for this job yet.
            </div>
          )}
        </div>
      )}

      {/* ===== UPDATE APPLICANT STATUS MODAL ===== */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={`Update Candidate Stage: ${selectedApp?.applicant?.firstName} ${selectedApp?.applicant?.lastName}`}
        size="md"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <Select
            label="Hiring Stage / Status"
            value={statusForm.status}
            onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
          >
            <option value="applied">Applied (Under Review)</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="assessment">Technical Assessment</option>
            <option value="interview">Interview Scheduled</option>
            <option value="selected">Selected (Offer Extended)</option>
            <option value="rejected">Rejected</option>
          </Select>

          {statusForm.status === 'interview' && (
            <div className="space-y-3 p-3 rounded-lg bg-[var(--color-surface-2)]">
              <Input
                label="Interview Date"
                type="date"
                value={statusForm.interviewDate}
                onChange={(e) => setStatusForm({ ...statusForm, interviewDate: e.target.value })}
              />
              <Input
                label="Meeting Platform / Mode"
                placeholder="Google Meet / Zoom"
                value={statusForm.interviewMode}
                onChange={(e) => setStatusForm({ ...statusForm, interviewMode: e.target.value })}
              />
              <Input
                label="Meeting URL"
                placeholder="https://meet.google.com/xyz-abc"
                value={statusForm.interviewLink}
                onChange={(e) => setStatusForm({ ...statusForm, interviewLink: e.target.value })}
              />
            </div>
          )}

          {statusForm.status === 'selected' && (
            <Input
              label="Offer Package / Stipend Amount"
              placeholder="e.g. 12 LPA or ₹30,000 / mo"
              value={statusForm.offerAmount}
              onChange={(e) => setStatusForm({ ...statusForm, offerAmount: e.target.value })}
            />
          )}

          <Textarea
            label="Feedback & Recruiter Notes (Visible to candidate)"
            rows={3}
            placeholder="Add internal or candidate-facing notes..."
            value={statusForm.note}
            onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={updatingStatus}>
              Save Status
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
