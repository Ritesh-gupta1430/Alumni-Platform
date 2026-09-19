import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Search,
  Plus,
  Building,
  Briefcase,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Send,
  Code2,
  Check,
  X,
  ShieldCheck,
  Share2,
  Layers,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { referralsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { RoleBadge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';

export default function ReferralExchangePage() {
  const { user, isAlumni, isFaculty } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpLevel, setSelectedExpLevel] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'created' | 'applied'

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  // Creation State
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    companyName: user?.currentCompany || 'Microsoft',
    jobTitle: '',
    jobReqId: '',
    jobUrl: '',
    jobLocation: 'Mumbai / Hybrid',
    jobType: 'full_time',
    experienceLevel: 'entry_level',
    salaryRange: '₹14 - ₹20 LPA',
    totalSlots: 3,
    prerequisites: 'Min CGPA 7.5, 1 Deployed Full Stack Project, Strong DSA',
    requiredSkills: 'React, Node.js, System Design',
    description: '',
    alumnusNote: 'Looking to refer strong problem solvers from TCET. I earn a company referral bonus and want to help my juniors!',
  });

  // Application State
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applyForm, setApplyForm] = useState({
    pitch: '',
    resumeUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    leetcodeProfile: '',
    atsScore: 88,
  });

  // Status Action (Alumnus)
  const [updatingApplicant, setUpdatingApplicant] = useState(false);
  const [internalRefIdInput, setInternalRefIdInput] = useState('');

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      let viewParam;
      if (activeTab === 'created') viewParam = 'created';
      if (activeTab === 'applied') viewParam = 'applied';

      const res = await referralsAPI.list({
        q: searchQuery || undefined,
        experienceLevel: selectedExpLevel || undefined,
        jobType: selectedJobType || undefined,
        view: viewParam,
        limit: 30,
      });

      const loadedPosts = res.data.data.posts || [];
      setPosts(loadedPosts);

      // Deep link open if url param present
      const targetId = searchParams.get('post');
      if (targetId) {
        const found = loadedPosts.find((p) => p._id === targetId);
        if (found) {
          setSelectedPost(found);
          if (found.alumnus?._id === user?._id || ['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) {
            setShowManageModal(true);
          } else {
            setShowApplyModal(true);
          }
        }
      }
    } catch (err) {
      toast.error('Failed to load employee referral openings.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, selectedExpLevel, selectedJobType, searchParams, user, toast]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // Handle Post Creation
  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!createForm.companyName || !createForm.jobTitle) {
      toast.error('Company Name and Job Title are required.');
      return;
    }

    setSubmittingCreate(true);
    try {
      const payload = {
        ...createForm,
        prerequisites: typeof createForm.prerequisites === 'string'
          ? createForm.prerequisites.split(',').map((s) => s.trim()).filter(Boolean)
          : createForm.prerequisites,
        requiredSkills: typeof createForm.requiredSkills === 'string'
          ? createForm.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
          : createForm.requiredSkills,
      };

      await referralsAPI.create(payload);
      toast.success('🎉 Referral opening published! Students can now submit referral packages.');
      setShowCreateModal(false);
      fetchReferrals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post referral opening.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Handle Apply
  const handleOpenApply = (post) => {
    setSelectedPost(post);
    setApplyForm({
      pitch: '',
      resumeUrl: user?.resumeUrl || '',
      githubUrl: '',
      portfolioUrl: '',
      leetcodeProfile: '',
      atsScore: 88,
    });
    setShowApplyModal(true);
  };

  const handleSubmitApply = async (e) => {
    e.preventDefault();
    if (!applyForm.pitch) {
      toast.error('Please write a brief pitch explaining your fit.');
      return;
    }

    setSubmittingApply(true);
    try {
      await referralsAPI.apply(selectedPost._id, applyForm);
      toast.success('🚀 Referral package submitted directly to alumnus!');
      setShowApplyModal(false);
      fetchReferrals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit referral package.');
    } finally {
      setSubmittingApply(false);
    }
  };

  // Handle Applicant Review
  const handleUpdateApplicant = async (applicantId, status, feedback = '') => {
    setUpdatingApplicant(true);
    try {
      const res = await referralsAPI.updateApplicantStatus(selectedPost._id, applicantId, {
        status,
        alumnusFeedback: feedback,
        internalReferralId: internalRefIdInput || undefined,
      });

      toast.success(`Candidate marked as ${status.replace('_', ' ').toUpperCase()}!`);
      setSelectedPost(res.data.data);
      setInternalRefIdInput('');
      fetchReferrals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update candidate status.');
    } finally {
      setUpdatingApplicant(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* ===== HERO BANNER: DUAL-BENEFIT VALUE PROPOSITION ===== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-blue-950/80 border border-emerald-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-xs font-semibold text-emerald-300 tracking-wide uppercase">
              <Award size={14} className="text-amber-400" />
              AlumRefer — Direct Employee Referral Exchange
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
              Fast-Track Alumni Referral Bridge
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Alumni earn internal company referral bonuses by referring verified junior talent. Students bypass the HR resume black hole with direct employee referrals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(isAlumni || isFaculty || ['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) && (
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="gold"
                className="flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Plus size={18} /> Post a Referral Slot
              </Button>
            )}
          </div>
        </div>

        {/* Win-Win Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Building size={16} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Top Tech Firms</p>
              <p className="text-[11px] text-slate-400">Google, MSFT, Amazon, etc.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
              <UserCheck size={16} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">30-Sec Review</p>
              <p className="text-[11px] text-slate-400">Vetted GitHub & ATS Scores</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <DollarSign size={16} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Referral Rewards</p>
              <p className="text-[11px] text-slate-400">Bonuses for Working Alumni</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Direct Interview</p>
              <p className="text-[11px] text-slate-400">Bypasses Recruiter Filters</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TABS & FILTERS ===== */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--color-surface-border)] pb-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-white'
            }`}
          >
            <Briefcase size={14} /> All Referral Openings ({posts.length})
          </button>

          {(isAlumni || isFaculty || ['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) && (
            <button
              onClick={() => setActiveTab('created')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'created'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-white'
              }`}
            >
              <Layers size={14} /> My Posted Openings
            </button>
          )}

          <button
            onClick={() => setActiveTab('applied')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'applied'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-white'
            }`}
          >
            <CheckCircle2 size={14} /> My Referral Requests
          </button>
        </div>

        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                icon={Search}
                placeholder="Search by company (e.g. Google, Microsoft), job title, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select
              value={selectedExpLevel}
              onChange={(e) => setSelectedExpLevel(e.target.value)}
            >
              <option value="">All Experience Levels</option>
              <option value="entry_level">Entry Level (2026 Batch / Fresher)</option>
              <option value="intern">Internship</option>
              <option value="1_to_3_years">1 - 3 Years Experience</option>
              <option value="3_plus_years">3+ Years (Senior)</option>
            </Select>
          </div>
        </div>
      </div>

      {/* ===== REFERRALS GRID ===== */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-6 h-72 animate-pulse bg-[var(--color-surface-2)]" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const isOwner = post.alumnus?._id === user?._id || ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);
            const userApplied = post.applicants?.some(
              (a) => a.user?._id === user?._id || a.user === user?._id
            );
            const remainingSlots = Math.max(0, (post.totalSlots || 3) - (post.filledSlots || 0));

            return (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 flex flex-col justify-between hover:border-emerald-400/40 transition-all shadow-md group relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Company & Slots Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center font-bold text-sm text-emerald-300">
                        {post.companyName?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {post.companyName}
                        </h2>
                        <p className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                          <Building size={11} /> {post.jobLocation}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                        remainingSlots > 0
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      ⚡ {remainingSlots} / {post.totalSlots} Slots Left
                    </span>
                  </div>

                  {/* Job Title & Compensation */}
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--color-text-primary)]">
                      {post.jobTitle}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {post.salaryRange && (
                        <span className="badge badge-gold text-[10px]">
                          💰 {post.salaryRange}
                        </span>
                      )}
                      <span className="badge badge-slate text-[10px] uppercase">
                        {post.experienceLevel?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Prerequisites Checklist */}
                  {post.prerequisites && post.prerequisites.length > 0 && (
                    <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] space-y-1">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                        Referral Prerequisites:
                      </p>
                      <ul className="text-[11px] text-[var(--color-text-secondary)] space-y-0.5">
                        {post.prerequisites.map((req, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 truncate">
                            <Check size={12} className="text-emerald-400 flex-shrink-0" />
                            <span className="truncate">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills Pills */}
                  {post.requiredSkills && post.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.requiredSkills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-3)] text-[var(--color-text-muted)] font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alumnus Footer & CTA */}
                <div className="pt-4 mt-4 border-t border-[var(--color-surface-border)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar
                      src={post.alumnus?.profilePhoto}
                      firstName={post.alumnus?.firstName}
                      lastName={post.alumnus?.lastName}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {post.alumnus?.firstName} {post.alumnus?.lastName}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                        {post.alumnus?.currentRole || 'Alumnus'} • {post.alumnus?.department}
                      </p>
                    </div>
                  </div>

                  {isOwner ? (
                    <Button
                      onClick={() => {
                        setSelectedPost(post);
                        setShowManageModal(true);
                      }}
                      variant="secondary"
                      className="text-xs px-3 py-1.5 whitespace-nowrap flex items-center gap-1"
                    >
                      <Users size={14} /> Review ({post.applicants?.length || 0})
                    </Button>
                  ) : userApplied ? (
                    <span className="badge badge-gold text-[10px] px-2.5 py-1">
                      Referral Requested ✓
                    </span>
                  ) : (
                    <Button
                      onClick={() => handleOpenApply(post)}
                      variant="primary"
                      disabled={remainingSlots === 0}
                      className="text-xs px-3 py-1.5 whitespace-nowrap flex items-center gap-1"
                    >
                      <Send size={12} /> Request Referral
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="card p-16 text-center space-y-3">
          <Award size={44} className="mx-auto text-slate-500 opacity-40" />
          <h3 className="text-base font-bold text-white">No Referral Openings Found</h3>
          <p className="text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
            Alumni working at tech firms post referral openings when hiring cycles begin. Be the first alumnus to post an employee referral slot!
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ===== MODAL 1: POST A REFERRAL OPENING (ALUMNI) ===== */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Post an Employee Referral Opening"
        size="lg"
      >
        <form onSubmit={handleSubmitCreate} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
            <DollarSign size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              Post job openings at your company. When you refer a junior from TCET who gets hired, you earn your company's internal referral reward while helping your alma mater.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Company Name"
              required
              placeholder="e.g. Microsoft, Google, TCS"
              value={createForm.companyName}
              onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })}
            />

            <Input
              label="Job Title / Role"
              required
              placeholder="e.g. Software Engineer (SDE-1)"
              value={createForm.jobTitle}
              onChange={(e) => setCreateForm({ ...createForm, jobTitle: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Job / Requisition ID"
              placeholder="e.g. REQ-98421"
              value={createForm.jobReqId}
              onChange={(e) => setCreateForm({ ...createForm, jobReqId: e.target.value })}
            />

            <Input
              label="Location"
              placeholder="e.g. Bangalore / Hybrid"
              value={createForm.jobLocation}
              onChange={(e) => setCreateForm({ ...createForm, jobLocation: e.target.value })}
            />

            <Input
              label="Expected Salary / CTC"
              placeholder="e.g. ₹16 - ₹22 LPA"
              value={createForm.salaryRange}
              onChange={(e) => setCreateForm({ ...createForm, salaryRange: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Experience Level"
              value={createForm.experienceLevel}
              onChange={(e) => setCreateForm({ ...createForm, experienceLevel: e.target.value })}
            >
              <option value="entry_level">Entry Level (Fresher / 2026 Batch)</option>
              <option value="intern">Internship</option>
              <option value="1_to_3_years">1 - 3 Years</option>
              <option value="3_plus_years">3+ Years</option>
            </Select>

            <Input
              label="Available Referral Slots"
              type="number"
              min="1"
              max="20"
              value={createForm.totalSlots}
              onChange={(e) => setCreateForm({ ...createForm, totalSlots: parseInt(e.target.value) || 3 })}
            />
          </div>

          <Input
            label="Official Careers Job Posting URL (Optional)"
            placeholder="https://careers.company.com/job/..."
            value={createForm.jobUrl}
            onChange={(e) => setCreateForm({ ...createForm, jobUrl: e.target.value })}
          />

          <Input
            label="Prerequisites for Referral (Comma-separated)"
            placeholder="Min 7.5 CGPA, 1 Full Stack Project, LeetCode 200+"
            value={createForm.prerequisites}
            onChange={(e) => setCreateForm({ ...createForm, prerequisites: e.target.value })}
          />

          <Input
            label="Key Skills Required (Comma-separated)"
            placeholder="React, Java, Spring Boot, SQL"
            value={createForm.requiredSkills}
            onChange={(e) => setCreateForm({ ...createForm, requiredSkills: e.target.value })}
          />

          <Textarea
            label="Note to Junior Candidates"
            rows={2}
            placeholder="Tell candidates what you look for in a candidate before submitting an internal referral..."
            value={createForm.alumnusNote}
            onChange={(e) => setCreateForm({ ...createForm, alumnusNote: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={submittingCreate}>
              Publish Referral Slot
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* ===== MODAL 2: REQUEST REFERRAL PACKAGE (STUDENT) ===== */}
      {/* ========================================================================= */}
      {selectedPost && (
        <Modal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          title={`Request Employee Referral: ${selectedPost.jobTitle}`}
          size="lg"
        >
          <form onSubmit={handleSubmitApply} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">
                  Referral Lead: {selectedPost.alumnus?.firstName} {selectedPost.alumnus?.lastName}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {selectedPost.companyName} • Class of {selectedPost.alumnus?.graduationYear}
                </p>
              </div>
              <span className="badge badge-emerald text-[10px]">
                {selectedPost.salaryRange || 'Competitive CTC'}
              </span>
            </div>

            {selectedPost.alumnusNote && (
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200">
                <p className="font-semibold text-blue-300 mb-0.5">Alumnus Note:</p>
                <p>{selectedPost.alumnusNote}</p>
              </div>
            )}

            <Textarea
              label="Why should this alumnus refer you? (Elevator Pitch)"
              required
              rows={3}
              placeholder="Highlight how you fulfill the prerequisites, your best project, and why you are ready for the interview..."
              value={applyForm.pitch}
              onChange={(e) => setApplyForm({ ...applyForm, pitch: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="GitHub / Code Repository URL"
                placeholder="https://github.com/yourhandle/project"
                value={applyForm.githubUrl}
                onChange={(e) => setApplyForm({ ...applyForm, githubUrl: e.target.value })}
              />

              <Input
                label="LeetCode / HackerRank Profile"
                placeholder="https://leetcode.com/username"
                value={applyForm.leetcodeProfile}
                onChange={(e) => setApplyForm({ ...applyForm, leetcodeProfile: e.target.value })}
              />
            </div>

            <Input
              label="Portfolio / Live Project Link"
              placeholder="https://myportfolio.dev"
              value={applyForm.portfolioUrl}
              onChange={(e) => setApplyForm({ ...applyForm, portfolioUrl: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-border)]">
              <Button type="button" variant="ghost" onClick={() => setShowApplyModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submittingApply}>
                Submit Referral Package
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* ===== MODAL 3: MANAGE REFERRALS CONSOLE (ALUMNUS REVIEW) ===== */}
      {/* ========================================================================= */}
      {selectedPost && (
        <Modal
          isOpen={showManageModal}
          onClose={() => setShowManageModal(false)}
          title={`Review Candidates: ${selectedPost.companyName} (${selectedPost.jobTitle})`}
          size="xl"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-2)] text-xs">
              <span className="text-[var(--color-text-muted)]">
                Referral Slots: <strong>{selectedPost.filledSlots || 0} / {selectedPost.totalSlots} Submitted</strong>
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                {selectedPost.applicants?.length || 0} Total Candidate Submissions
              </span>
            </div>

            {selectedPost.applicants && selectedPost.applicants.length > 0 ? (
              <div className="space-y-3">
                {selectedPost.applicants.map((app) => {
                  const isSubmitted = app.status === 'referral_submitted';
                  const isRejected = app.status === 'rejected';

                  return (
                    <div
                      key={app._id}
                      className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={app.user?.profilePhoto}
                            firstName={app.user?.firstName}
                            lastName={app.user?.lastName}
                            size="md"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/profile/${app.user?._id}`}
                                className="text-xs font-bold text-white hover:underline"
                              >
                                {app.user?.firstName} {app.user?.lastName}
                              </Link>
                              <span className="badge badge-gold text-[10px]">
                                ATS Match: {app.atsScore || 85}%
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--color-text-muted)]">
                              {app.user?.department} • Class of {app.user?.graduationYear}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold self-start sm:self-auto ${
                            isSubmitted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isRejected
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {app.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Pitch */}
                      <div className="p-3 rounded-lg bg-[var(--color-surface-1)] text-xs text-[var(--color-text-secondary)]">
                        <p className="font-semibold text-slate-300 mb-1">Candidate Pitch:</p>
                        <p>{app.pitch}</p>
                      </div>

                      {/* Links */}
                      <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                        {app.githubUrl && (
                          <a
                            href={app.githubUrl.startsWith('http') ? app.githubUrl : `https://${app.githubUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Code2 size={13} /> GitHub Repo
                          </a>
                        )}
                        {app.leetcodeProfile && (
                          <a
                            href={app.leetcodeProfile.startsWith('http') ? app.leetcodeProfile : `https://${app.leetcodeProfile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:underline flex items-center gap-1"
                          >
                            <Award size={13} /> LeetCode
                          </a>
                        )}
                        {app.portfolioUrl && (
                          <a
                            href={app.portfolioUrl.startsWith('http') ? app.portfolioUrl : `https://${app.portfolioUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={13} /> Portfolio
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      {!isSubmitted && !isRejected && (
                        <div className="pt-2 border-t border-[var(--color-surface-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <Input
                            placeholder="Internal Ref / Job Code (e.g. MS-98421)"
                            value={internalRefIdInput}
                            onChange={(e) => setInternalRefIdInput(e.target.value)}
                            className="text-xs"
                          />

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleUpdateApplicant(app._id, 'rejected')}
                              loading={updatingApplicant}
                              className="text-xs px-3 py-1"
                            >
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              variant="gold"
                              onClick={() => handleUpdateApplicant(app._id, 'referral_submitted')}
                              loading={updatingApplicant}
                              className="text-xs px-3 py-1 flex items-center gap-1 whitespace-nowrap"
                            >
                              <Check size={14} /> Submit Internal Referral
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-2)] rounded-xl">
                No student referral requests received yet.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
