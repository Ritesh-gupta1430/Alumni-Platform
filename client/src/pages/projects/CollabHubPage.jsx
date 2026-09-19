import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Search,
  Plus,
  Users,
  Briefcase,
  Code2,
  Sparkles,
  ExternalLink,
  Award,
  CheckCircle2,
  Clock,
  DollarSign,
  ChevronRight,
  Filter,
  Check,
  X,
  MessageSquare,
  ShieldCheck,
  Send,
  Building,
  GraduationCap,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { collabProjectsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { RoleBadge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';

export default function CollabHubPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'startup_mvp' | 'open_source' | 'freelance_gig' | 'research_paper' | 'my_created' | 'my_applied'

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  // Creation Form State
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    tagline: '',
    description: '',
    category: 'startup_mvp',
    techStack: '',
    stipendAmount: 'Unpaid / Portfolio',
    estimatedDuration: '4-8 Weeks',
    githubUrl: '',
    liveUrl: '',
    communicationChannel: '',
    perks: ['Certificate of Completion', 'Letter of Recommendation (LOR)', 'Mentorship & Code Reviews'],
    openRoles: [
      { roleTitle: 'Frontend Developer', spotsAvailable: 1, requiredSkills: 'React, Tailwind', commitmentHoursPerWeek: 6 },
    ],
  });

  // Application Form State
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applyForm, setApplyForm] = useState({
    roleApplied: '',
    pitch: '',
    portfolioLink: '',
    githubLink: '',
    weeklyAvailabilityHours: 6,
  });

  // Action on applicant (Accept/Reject)
  const [updatingApplicant, setUpdatingApplicant] = useState(false);

  // Category Tabs Configuration
  const categoryTabs = [
    { key: 'all', label: 'All Opportunities', icon: Rocket },
    { key: 'startup_mvp', label: 'Startup MVPs', icon: Sparkles },
    { key: 'open_source', label: 'Open Source Gigs', icon: Code2 },
    { key: 'freelance_gig', label: 'Paid & Freelance Bounties', icon: DollarSign },
    { key: 'research_paper', label: 'Research & Labs', icon: GraduationCap },
    { key: 'my_created', label: 'My Posted Ventures', icon: Layers },
    { key: 'my_applied', label: 'My Applications', icon: CheckCircle2 },
  ];

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      let viewParam;
      let catParam;

      if (activeTab === 'my_created') {
        viewParam = 'created';
      } else if (activeTab === 'my_applied') {
        viewParam = 'applied';
      } else if (activeTab !== 'all') {
        catParam = activeTab;
      }

      const res = await collabProjectsAPI.list({
        q: searchQuery || undefined,
        category: catParam || (selectedCategory || undefined),
        view: viewParam,
        limit: 30,
      });

      setProjects(res.data.data.projects || []);

      // If URL param specifies a project id, open it
      const targetId = searchParams.get('project');
      if (targetId) {
        const found = (res.data.data.projects || []).find((p) => p._id === targetId);
        if (found) {
          setSelectedProject(found);
          if (found.creator?._id === user?._id || ['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) {
            setShowManageModal(true);
          } else {
            setShowDetailModal(true);
          }
        }
      }
    } catch (err) {
      toast.error('Failed to load collab projects.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, selectedCategory, searchParams, user, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handle Create Project
  const handleAddRole = () => {
    setCreateForm((prev) => ({
      ...prev,
      openRoles: [
        ...prev.openRoles,
        { roleTitle: '', spotsAvailable: 1, requiredSkills: '', commitmentHoursPerWeek: 5 },
      ],
    }));
  };

  const handleRemoveRole = (index) => {
    setCreateForm((prev) => ({
      ...prev,
      openRoles: prev.openRoles.filter((_, i) => i !== index),
    }));
  };

  const handleRoleChange = (index, field, value) => {
    setCreateForm((prev) => {
      const updated = [...prev.openRoles];
      updated[index][field] = value;
      return { ...prev, openRoles: updated };
    });
  };

  const handleTogglePerk = (perk) => {
    setCreateForm((prev) => {
      const exists = prev.perks.includes(perk);
      return {
        ...prev,
        perks: exists ? prev.perks.filter((p) => p !== perk) : [...prev.perks, perk],
      };
    });
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!createForm.title || !createForm.tagline || !createForm.description) {
      toast.error('Please fill in all required project information.');
      return;
    }

    if (createForm.openRoles.length === 0 || !createForm.openRoles[0].roleTitle) {
      toast.error('Please specify at least one open role for students.');
      return;
    }

    setSubmittingCreate(true);
    try {
      const payload = {
        ...createForm,
        techStack: createForm.techStack
          ? createForm.techStack.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        openRoles: createForm.openRoles.map((r) => ({
          ...r,
          requiredSkills: typeof r.requiredSkills === 'string'
            ? r.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
            : r.requiredSkills,
        })),
      };

      await collabProjectsAPI.create(payload);
      toast.success('🎉 Collab venture published! Students can now apply to join your team.');
      setShowCreateModal(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish collab project.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Handle Apply
  const handleOpenApply = (proj) => {
    setSelectedProject(proj);
    const initialRole = proj.openRoles?.[0]?.roleTitle || '';
    setApplyForm({
      roleApplied: initialRole,
      pitch: '',
      portfolioLink: '',
      githubLink: '',
      weeklyAvailabilityHours: 6,
    });
    setShowDetailModal(true);
  };

  const handleSubmitApply = async (e) => {
    e.preventDefault();
    if (!applyForm.roleApplied || !applyForm.pitch) {
      toast.error('Please select a role and describe your motivation / skills.');
      return;
    }

    setSubmittingApply(true);
    try {
      await collabProjectsAPI.apply(selectedProject._id, applyForm);
      toast.success('🚀 Application sent directly to the project lead!');
      setShowDetailModal(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmittingApply(false);
    }
  };

  // Handle Applicant Status Update (Accept/Reject)
  const handleUpdateApplicantStatus = async (applicantId, status, reviewNotes = '') => {
    setUpdatingApplicant(true);
    try {
      const res = await collabProjectsAPI.updateApplicantStatus(selectedProject._id, applicantId, {
        status,
        reviewNotes,
      });
      toast.success(`Applicant marked as ${status}!`);
      setSelectedProject(res.data.data);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update applicant status.');
    } finally {
      setUpdatingApplicant(false);
    }
  };

  // Helpers
  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'startup_mvp':
        return 'badge badge-gold';
      case 'open_source':
        return 'badge badge-cyan';
      case 'freelance_gig':
        return 'badge badge-emerald';
      case 'research_paper':
        return 'badge badge-purple';
      default:
        return 'badge badge-slate';
    }
  };

  const formatCategoryName = (cat) => {
    switch (cat) {
      case 'startup_mvp':
        return 'Startup MVP';
      case 'open_source':
        return 'Open Source Gig';
      case 'freelance_gig':
        return 'Paid Freelance Gig';
      case 'research_paper':
        return 'Research & Lab';
      case 'college_innovation':
        return 'College Innovation';
      default:
        return 'Collab Venture';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* ===== HERO BANNER ===== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/60 via-indigo-950/80 to-purple-950/60 border border-blue-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-xs font-semibold text-blue-300 tracking-wide uppercase">
              <Sparkles size={14} className="text-amber-400" />
              Alumni-Student Venture & Gigs Platform
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
              Collab Labs & Startup Gigs
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Alumni founders & engineers post live products, startup MVPs, and open-source gigs. Students apply to build real-world software, earn stipends, and secure LORs & referrals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="gold"
              className="flex items-center gap-2 shadow-lg hover:shadow-amber-500/20"
            >
              <Plus size={18} /> Post a Collab Project
            </Button>
          </div>
        </div>

        {/* Highlight Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Rocket size={16} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{projects.length}</p>
              <p className="text-[11px] text-slate-400">Active Ventures</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign size={16} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Stipends & LORs</p>
              <p className="text-[11px] text-slate-400">Perks & Compensation</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Users size={16} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Bilateral Teams</p>
              <p className="text-[11px] text-slate-400">Alumni + Student Pods</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Verified Alumni</p>
              <p className="text-[11px] text-slate-400">Institutional Trust</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TABS & SEARCH BAR ===== */}
      <div className="space-y-4">
        {/* Horizontal Scroll Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--color-surface-border)] scrollbar-none">
          {categoryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-3)]'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filter Input */}
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 w-full">
              <Input
                icon={Search}
                placeholder="Search ventures by tech stack (e.g. React, Python), title, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== PROJECTS GRID ===== */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-6 h-72 animate-pulse bg-[var(--color-surface-2)]" />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const isCreator = proj.creator?._id === user?._id || ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);
            const userHasApplied = proj.applicants?.some(
              (a) => a.user?._id === user?._id || a.user === user?._id
            );
            const totalSpots = proj.openRoles?.reduce((sum, r) => sum + (r.spotsAvailable || 1), 0) || 0;
            const filledSpots = proj.openRoles?.reduce((sum, r) => sum + (r.spotsFilled || 0), 0) || 0;

            return (
              <motion.div
                key={proj._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  if (isCreator) {
                    setSelectedProject(proj);
                    setShowManageModal(true);
                  } else {
                    handleOpenApply(proj);
                  }
                }}
                className="card p-6 flex flex-col justify-between hover:border-blue-400/40 hover:shadow-lg transition-all shadow-md group relative overflow-hidden cursor-pointer"
              >
                {/* Top Status & Category Badges */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className={getCategoryBadgeClass(proj.category)}>
                      {formatCategoryName(proj.category)}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--color-text-muted)] flex items-center gap-1">
                      <Clock size={12} /> {proj.estimatedDuration || '4-8 Weeks'}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors line-clamp-1">
                      {proj.title}
                    </h2>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                      {proj.tagline || proj.description}
                    </p>
                  </div>

                  {/* Open Roles Preview */}
                  {proj.openRoles && proj.openRoles.length > 0 && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)]">
                      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                        <span className="font-semibold text-slate-300">Open Roles</span>
                        <span className="font-mono text-blue-400">
                          {filledSpots}/{totalSpots} Spots Filled
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {proj.openRoles.map((role, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium"
                          >
                            {role.roleTitle} ({role.spotsAvailable - (role.spotsFilled || 0)} left)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Perks Pills */}
                  {proj.perks && proj.perks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {proj.stipendAmount && proj.stipendAmount !== 'Unpaid / Portfolio' && (
                        <span className="badge badge-emerald text-[10px]">
                          💰 {proj.stipendAmount}
                        </span>
                      )}
                      {proj.perks.slice(0, 2).map((perk, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        >
                          {perk}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tech Stack Badges */}
                  {proj.techStack && proj.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {proj.techStack.slice(0, 4).map((tech, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-3)] text-[var(--color-text-muted)] font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Creator Card & Action Button */}
                <div className="pt-4 mt-4 border-t border-[var(--color-surface-border)] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      src={proj.creator?.profilePhoto}
                      firstName={proj.creator?.firstName}
                      lastName={proj.creator?.lastName}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                        {proj.creator?.firstName} {proj.creator?.lastName}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                        {proj.creator?.currentCompany || proj.creator?.role}
                      </p>
                    </div>
                  </div>

                  {isCreator ? (
                    <Button
                      onClick={() => {
                        setSelectedProject(proj);
                        setShowManageModal(true);
                      }}
                      variant="secondary"
                      className="text-xs px-3 py-1.5 whitespace-nowrap flex items-center gap-1"
                    >
                      <Users size={14} /> Team ({proj.applicants?.length || 0})
                    </Button>
                  ) : userHasApplied ? (
                    <span className="badge badge-gold text-[10px] px-2.5 py-1">
                      Applied ✓
                    </span>
                  ) : (
                    <Button
                      onClick={() => handleOpenApply(proj)}
                      variant="primary"
                      className="text-xs px-3 py-1.5 whitespace-nowrap"
                    >
                      Apply to Collab
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="card p-16 text-center space-y-3">
          <Rocket size={44} className="mx-auto text-slate-500 opacity-40" />
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            No Collab Ventures Found
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
            Be the first alumnus or student founder to post a startup MVP or open-source project and recruit fellow TCET innovators!
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="gold"
            className="mt-2 text-xs"
          >
            <Plus size={15} /> Create Collab Venture
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ===== MODAL 1: POST A COLLAB PROJECT (WIZARD) ===== */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Post a Venture / Project Collab"
        size="xl"
      >
        <form onSubmit={handleSubmitCreate} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2">
            <Sparkles size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              As an alumnus or mentor, recruit talented TCET students for your side project, startup MVP, or open-source repo. Define roles and what perks you provide (e.g. LOR, Mentorship, Stipend).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Project / Venture Title"
              required
              placeholder="e.g. AI MedTech Diagnostic Assistant"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            />

            <Select
              label="Venture Category"
              value={createForm.category}
              onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
            >
              <option value="startup_mvp">Startup MVP / Co-building</option>
              <option value="open_source">Open Source Software</option>
              <option value="freelance_gig">Paid Freelance / Bounty</option>
              <option value="research_paper">Research Lab / Paper</option>
              <option value="college_innovation">College Capstone Collaboration</option>
            </Select>
          </div>

          <Input
            label="One-Line Elevator Pitch / Tagline"
            required
            placeholder="e.g. Building a lightweight RAG system for Indian clinical notes with FastAPI & React"
            value={createForm.tagline}
            onChange={(e) => setCreateForm({ ...createForm, tagline: e.target.value })}
          />

          <Textarea
            label="Project Overview & Deliverables"
            required
            rows={4}
            placeholder="Describe what the project does, architecture, what the student team will build, and expectations..."
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Tech Stack (Comma-separated)"
              placeholder="React, PyTorch, Tailwind, MongoDB"
              value={createForm.techStack}
              onChange={(e) => setCreateForm({ ...createForm, techStack: e.target.value })}
            />

            <Input
              label="Stipend / Compensation"
              placeholder="e.g. ₹6,000 / mo or Unpaid"
              value={createForm.stipendAmount}
              onChange={(e) => setCreateForm({ ...createForm, stipendAmount: e.target.value })}
            />

            <Input
              label="Estimated Duration"
              placeholder="e.g. 6 Weeks, 3 Months"
              value={createForm.estimatedDuration}
              onChange={(e) => setCreateForm({ ...createForm, estimatedDuration: e.target.value })}
            />
          </div>

          {/* Dynamic Open Roles Builder */}
          <div className="space-y-3 pt-2 border-t border-[var(--color-surface-border)]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Open Student Roles & Skillsets
              </label>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddRole}
                className="text-xs py-1 px-2.5"
              >
                <Plus size={14} /> Add Role
              </Button>
            </div>

            {createForm.openRoles.map((role, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Role Title"
                    required
                    placeholder="e.g. Frontend Engineer"
                    value={role.roleTitle}
                    onChange={(e) => handleRoleChange(idx, 'roleTitle', e.target.value)}
                  />
                  <Input
                    label="Spots Available"
                    type="number"
                    min="1"
                    max="10"
                    value={role.spotsAvailable}
                    onChange={(e) => handleRoleChange(idx, 'spotsAvailable', parseInt(e.target.value) || 1)}
                  />
                  <Input
                    label="Hours / Week"
                    type="number"
                    min="2"
                    max="40"
                    value={role.commitmentHoursPerWeek}
                    onChange={(e) => handleRoleChange(idx, 'commitmentHoursPerWeek', parseInt(e.target.value) || 5)}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Required skills (e.g. Next.js, Redux, Figma)"
                      value={role.requiredSkills}
                      onChange={(e) => handleRoleChange(idx, 'requiredSkills', e.target.value)}
                    />
                  </div>
                  {createForm.openRoles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(idx)}
                      className="text-rose-400 hover:text-rose-300 p-2"
                      title="Remove Role"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Perks & Incentives for Students */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-surface-border)]">
            <label className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
              Perks & Incentives for Students
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                'Certificate of Completion',
                'Letter of Recommendation (LOR)',
                'Mentorship & Code Reviews',
                'Stipend Offered',
                'Potential PPO / Hiring Referral',
                'GitHub Co-author / Contributor',
              ].map((perk) => (
                <label
                  key={perk}
                  onClick={() => handleTogglePerk(perk)}
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${
                    createForm.perks.includes(perk)
                      ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                      : 'bg-[var(--color-surface-2)] border-[var(--color-surface-border)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      createForm.perks.includes(perk)
                        ? 'bg-blue-500 border-blue-400 text-white'
                        : 'border-slate-500'
                    }`}
                  >
                    {createForm.perks.includes(perk) && <Check size={12} />}
                  </div>
                  <span className="text-[11px] font-medium">{perk}</span>
                </label>
              ))}
            </div>
          </div>

          {/* External Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--color-surface-border)]">
            <Input
              label="GitHub Repo URL (Optional)"
              placeholder="https://github.com/..."
              value={createForm.githubUrl}
              onChange={(e) => setCreateForm({ ...createForm, githubUrl: e.target.value })}
            />
            <Input
              label="Live Demo / Pitch URL"
              placeholder="https://myproduct.dev"
              value={createForm.liveUrl}
              onChange={(e) => setCreateForm({ ...createForm, liveUrl: e.target.value })}
            />
            <Input
              label="Discord / Slack Channel"
              placeholder="https://discord.gg/..."
              value={createForm.communicationChannel}
              onChange={(e) => setCreateForm({ ...createForm, communicationChannel: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={submittingCreate}>
              Publish Venture & Open Roles
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* ===== MODAL 2: PROJECT DETAIL & APPLICATION (STUDENT VIEW) ===== */}
      {/* ========================================================================= */}
      {selectedProject && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={selectedProject.title}
          size="lg"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Creator Header */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)]">
              <div className="flex items-center gap-3">
                <Avatar
                  src={selectedProject.creator?.profilePhoto}
                  firstName={selectedProject.creator?.firstName}
                  lastName={selectedProject.creator?.lastName}
                  size="md"
                />
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    {selectedProject.creator?.firstName} {selectedProject.creator?.lastName}
                    <RoleBadge role={selectedProject.creator?.role || 'ALUMNI'} />
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {selectedProject.creator?.currentCompany || selectedProject.creator?.department} • Class of {selectedProject.creator?.graduationYear || 'Alumni'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={getCategoryBadgeClass(selectedProject.category)}>
                  {formatCategoryName(selectedProject.category)}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Venture Scope & Architecture
              </h4>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                {selectedProject.description}
              </p>
            </div>

            {/* Open Roles */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Available Open Roles
              </h4>
              <div className="space-y-2">
                {selectedProject.openRoles?.map((r, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{r.roleTitle}</p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        {r.requiredSkills?.join(', ')} • {r.commitmentHoursPerWeek || 5} hrs/week
                      </p>
                    </div>
                    <span className="badge badge-cyan text-[10px]">
                      {r.spotsAvailable - (r.spotsFilled || 0)} spot(s) remaining
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Perks */}
            {selectedProject.perks && selectedProject.perks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Perks & Learning Outcomes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.perks.map((p, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    >
                      ✓ {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Application Section */}
            <form onSubmit={handleSubmitApply} className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-4">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-blue-400" />
                <h4 className="text-sm font-bold text-white">Apply for a Role in this Project</h4>
              </div>

              <Select
                label="Select Role You are Applying For"
                value={applyForm.roleApplied}
                onChange={(e) => setApplyForm({ ...applyForm, roleApplied: e.target.value })}
              >
                {selectedProject.openRoles?.map((r, idx) => (
                  <option key={idx} value={r.roleTitle}>
                    {r.roleTitle} ({r.spotsAvailable - (r.spotsFilled || 0)} spots left)
                  </option>
                ))}
              </Select>

              <Textarea
                label="Why are you a great fit? (Pitch your skills & past projects)"
                required
                rows={3}
                placeholder="Mention relevant frameworks, projects you've shipped, and how many hours you can commit..."
                value={applyForm.pitch}
                onChange={(e) => setApplyForm({ ...applyForm, pitch: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="GitHub / Code Sample URL"
                  placeholder="https://github.com/username/project"
                  value={applyForm.githubLink}
                  onChange={(e) => setApplyForm({ ...applyForm, githubLink: e.target.value })}
                />
                <Input
                  label="Portfolio / Live Work URL"
                  placeholder="https://myportfolio.com"
                  value={applyForm.portfolioLink}
                  onChange={(e) => setApplyForm({ ...applyForm, portfolioLink: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowDetailModal(false)}>
                  Close
                </Button>
                <Button type="submit" variant="primary" loading={submittingApply}>
                  Submit Collab Application
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* ===== MODAL 3: MANAGE TEAM & APPLICANTS (CREATOR VIEW) ===== */}
      {/* ========================================================================= */}
      {selectedProject && (
        <Modal
          isOpen={showManageModal}
          onClose={() => setShowManageModal(false)}
          title={`Manage Collab: ${selectedProject.title}`}
          size="xl"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Active Team Pod */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-blue-400" />
                Active Project Team ({selectedProject.teamMembers?.length || 0})
              </h4>

              {selectedProject.teamMembers && selectedProject.teamMembers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedProject.teamMembers.map((tm, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-3"
                    >
                      <Avatar
                        src={tm.user?.profilePhoto}
                        firstName={tm.user?.firstName}
                        lastName={tm.user?.lastName}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">
                          {tm.user?.firstName} {tm.user?.lastName}
                        </p>
                        <p className="text-[11px] text-emerald-400 font-medium truncate">
                          {tm.role} • Joined {formatDate(tm.joinedAt, 'MMM dd')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)] italic">
                  No accepted team members yet. Review student applications below to onboard contributors.
                </p>
              )}
            </div>

            {/* Student Applications Queue */}
            <div className="space-y-3 pt-3 border-t border-[var(--color-surface-border)]">
              <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                <Send size={16} className="text-amber-400" />
                Applicant Pipeline ({selectedProject.applicants?.length || 0})
              </h4>

              {selectedProject.applicants && selectedProject.applicants.length > 0 ? (
                <div className="space-y-3">
                  {selectedProject.applicants.map((app) => {
                    const isAccepted = app.status === 'accepted';
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
                                  className="text-xs font-bold text-[var(--color-text-primary)] hover:underline"
                                >
                                  {app.user?.firstName} {app.user?.lastName}
                                </Link>
                                <span className="badge badge-cyan text-[10px]">
                                  Role: {app.roleApplied}
                                </span>
                              </div>
                              <p className="text-[11px] text-[var(--color-text-muted)]">
                                {app.user?.department} • Class of {app.user?.graduationYear} • {app.weeklyAvailabilityHours || 5} hrs/wk
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold self-start sm:self-auto ${
                              isAccepted
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isRejected
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {app.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Pitch Quote */}
                        <div className="p-3 rounded-lg bg-[var(--color-surface-1)] text-xs text-[var(--color-text-secondary)] leading-relaxed">
                          <p className="font-semibold text-slate-300 mb-1">Student Pitch:</p>
                          <p>{app.pitch}</p>
                        </div>

                        {/* Links & Decision Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="flex items-center gap-3 text-xs">
                            {app.githubLink && (
                              <a
                                href={app.githubLink.startsWith('http') ? app.githubLink : `https://${app.githubLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1"
                              >
                                <Code2 size={13} /> GitHub Profile
                              </a>
                            )}
                            {app.portfolioLink && (
                              <a
                                href={app.portfolioLink.startsWith('http') ? app.portfolioLink : `https://${app.portfolioLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-400 hover:underline flex items-center gap-1"
                              >
                                <ExternalLink size={13} /> Portfolio
                              </a>
                            )}
                          </div>

                          {!isAccepted && !isRejected && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleUpdateApplicantStatus(app._id, 'rejected')}
                                loading={updatingApplicant}
                                className="text-xs px-3 py-1"
                              >
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                variant="gold"
                                onClick={() => handleUpdateApplicantStatus(app._id, 'accepted')}
                                loading={updatingApplicant}
                                className="text-xs px-3 py-1 flex items-center gap-1"
                              >
                                <Check size={14} /> Accept to Team
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-2)] rounded-xl">
                  No student applications received yet. Share your project in campus communities to get contributors!
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
