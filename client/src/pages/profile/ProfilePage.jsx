import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Briefcase,
  GraduationCap,
  MapPin,
  Mail,
  Globe,
  Link2,
  Award,
  FileText,
  Edit3,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  UserPlus,
  UserCheck,
  Building,
  Calendar,
  Download,
  Upload,
  ExternalLink,
  ShieldCheck,
  Share2,
  Send,
  Eye,
  Info
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { profileAPI, connectionsAPI, messagesAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { RoleBadge, StatusBadge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate, getProgressColor } from '../../lib/utils';

// Role-specific view components
import { StudentProfileView } from './views/StudentProfileView';
import { AlumniProfileView } from './views/AlumniProfileView';
import { FacultyProfileView } from './views/FacultyProfileView';
import { RecruiterProfileView } from './views/RecruiterProfileView';
import { AdminProfileView } from './views/AdminProfileView';

// Interactive Modals
import { ShareProfileModal } from './modals/ShareProfileModal';
import { MentorshipRequestModal } from './modals/MentorshipRequestModal';
import { ResumePreviewModal } from './modals/ResumePreviewModal';
import { AcademicUploadModal } from './modals/AcademicUploadModal';
import { DocumentViewerModal } from './modals/DocumentViewerModal';

export default function ProfilePage() {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const toast = useToast();

  const isOwnProfile = !paramUserId || paramUserId === 'me' || paramUserId === currentUser?._id;
  const targetUserId = isOwnProfile ? currentUser?._id : paramUserId;

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [connecting, setConnecting] = useState(false);

  // Academic Upload & Document Viewer Modals State
  const [showAcademicModal, setShowAcademicModal] = useState(false);
  const [academicModalMode, setAcademicModalMode] = useState('semester');
  const [viewingDoc, setViewingDoc] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);

  // Modals state
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [expForm, setExpForm] = useState({
    type: 'work',
    company: '',
    role: '',
    location: '',
    workMode: 'onsite',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    skills: '',
  });

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectMessage, setConnectMessage] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMentorshipModal, setShowMentorshipModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const res = await profileAPI.getProfile(targetUserId);
      setProfileData(res.data.data);

      if (!isOwnProfile) {
        const connRes = await connectionsAPI.getStatus(targetUserId);
        setConnectionStatus(connRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  }, [targetUserId, isOwnProfile, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle Connection Actions
  const handleSendConnectionRequest = async () => {
    setConnecting(true);
    try {
      await connectionsAPI.sendRequest(targetUserId, { message: connectMessage });
      toast.success('Connection request sent!');
      setShowConnectModal(false);
      setConnectionStatus({ status: 'pending', isRequester: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send connection request.');
    } finally {
      setConnecting(false);
    }
  };

  const handleAcceptConnection = async (connId) => {
    try {
      await connectionsAPI.accept(connId);
      toast.success('Connection accepted!');
      setConnectionStatus({ status: 'accepted' });
    } catch (err) {
      toast.error('Failed to accept connection.');
    }
  };

  const handleStartConversation = async () => {
    try {
      const res = await messagesAPI.startConversation({ recipientId: targetUserId });
      navigate(`/messages?convo=${res.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to open conversation.');
    }
  };

  // Handle Experience CRUD
  const handleOpenExpModal = (exp = null) => {
    if (exp) {
      setEditingExp(exp);
      setExpForm({
        type: exp.type || 'work',
        company: exp.company || '',
        role: exp.role || '',
        location: exp.location || '',
        workMode: exp.workMode || 'onsite',
        startDate: exp.startDate ? exp.startDate.split('T')[0] : '',
        endDate: exp.endDate ? exp.endDate.split('T')[0] : '',
        isCurrent: exp.isCurrent || false,
        description: exp.description || '',
        skills: exp.skills ? exp.skills.join(', ') : '',
      });
    } else {
      setEditingExp(null);
      setExpForm({
        type: 'work',
        company: '',
        role: '',
        location: '',
        workMode: 'onsite',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
        skills: '',
      });
    }
    setShowExpModal(true);
  };

  const handleSaveExperience = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...expForm,
        skills: expForm.skills ? expForm.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };

      if (editingExp) {
        await profileAPI.updateExperience(editingExp._id, payload);
        toast.success('Experience updated successfully.');
      } else {
        await profileAPI.addExperience(payload);
        toast.success('Experience added successfully.');
      }
      setShowExpModal(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save experience.');
    }
  };

  const handleDeleteExperience = async (id) => {
    if (!window.confirm('Are you sure you want to remove this experience?')) return;
    try {
      await profileAPI.deleteExperience(id);
      toast.success('Experience removed.');
      fetchProfile();
    } catch (err) {
      toast.error('Failed to remove experience.');
    }
  };

  // Handle Photo & Resume Uploads
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      await profileAPI.uploadPhoto(file);
      toast.success('Profile photo updated!');
      await refreshUser();
      fetchProfile();
    } catch (err) {
      toast.error('Failed to upload profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      await profileAPI.uploadResume(file);
      toast.success('Resume uploaded successfully!');
      fetchProfile();
    } catch (err) {
      toast.error('Failed to upload resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading institutional profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData || !profileData.user) {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto mt-12">
        <UserIcon className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Member Not Found</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          The profile you are looking for does not exist or has been removed.
        </p>
        <Button onClick={() => navigate('/network')} variant="primary">
          Explore TCET Network
        </Button>
      </div>
    );
  }

  const { user, profile = {}, experiences = [], projects = [] } = profileData;
  const completionPercentage = profile?.completionPercentage || 0;

  // Role banner background gradients
  const roleThemes = {
    STUDENT: 'from-blue-900 via-indigo-900 to-cyan-950',
    ALUMNI: 'from-amber-950 via-slate-900 to-blue-950',
    FACULTY: 'from-purple-950 via-indigo-950 to-slate-950',
    PLACEMENT_OFFICER: 'from-purple-950 via-indigo-950 to-slate-950',
    RECRUITER: 'from-rose-950 via-slate-900 to-blue-950',
    ADMIN: 'from-cyan-950 via-slate-900 to-blue-950',
    SUPER_ADMIN: 'from-cyan-950 via-slate-900 to-blue-950',
  };

  const bannerGradient = roleThemes[user.role] || 'from-blue-900 via-indigo-900 to-purple-950';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* ===== 1. HERO HEADER CARD ===== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden relative border border-[var(--color-surface-border)] shadow-xl"
      >
        {/* Banner Graphic Background */}
        <div className={`h-48 sm:h-56 bg-gradient-to-r ${bannerGradient} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.25),transparent_70%)]" />
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button
              onClick={() => setShowShareModal(true)}
              variant="secondary"
              size="sm"
              className="glass-light text-xs flex items-center gap-1.5 backdrop-blur-md"
            >
              <Share2 size={14} /> Share Profile
            </Button>
          </div>
        </div>

        {/* Profile Details Bar */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-6">
            {/* Avatar & Photo Upload */}
            <div className="relative group shrink-0">
              <div className="ring-4 ring-[var(--color-surface-1)] rounded-full overflow-hidden bg-[var(--color-surface-2)] shadow-2xl w-28 h-28 sm:w-36 sm:h-36">
                <Avatar
                  src={user.profilePhoto}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  size="2xl"
                  className="w-full h-full text-4xl"
                />
              </div>
              {isOwnProfile && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-1 right-1 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full cursor-pointer shadow-lg transition-transform transform group-hover:scale-110"
                  title="Update Photo"
                >
                  <Upload size={16} />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                </label>
              )}
            </div>

            {/* Quick Actions Header Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {isOwnProfile ? (
                <>
                  <Link to="/settings">
                    <Button variant="outline" className="flex items-center gap-2 text-xs sm:text-sm">
                      <Edit3 size={15} />
                      Edit Profile
                    </Button>
                  </Link>
                  <Link to="/settings/verification">
                    <Button variant="secondary" className="flex items-center gap-2 text-xs sm:text-sm">
                      <ShieldCheck size={15} />
                      Verification
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleStartConversation}
                    variant="secondary"
                    className="flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <MessageSquare size={15} />
                    Message
                  </Button>

                  {connectionStatus?.status === 'accepted' ? (
                    <Button variant="outline" className="flex items-center gap-2 text-emerald-400 border-emerald-500/30 text-xs sm:text-sm">
                      <UserCheck size={15} />
                      Connected
                    </Button>
                  ) : connectionStatus?.status === 'pending' ? (
                    connectionStatus.isRequester ? (
                      <Button variant="ghost" disabled className="flex items-center gap-2 opacity-75 text-xs sm:text-sm">
                        <Clock size={15} />
                        Request Pending
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleAcceptConnection(connectionStatus.connectionId)}
                        variant="primary"
                        className="flex items-center gap-2 text-xs sm:text-sm"
                      >
                        <UserCheck size={15} />
                        Accept Request
                      </Button>
                    )
                  ) : (
                    <Button
                      onClick={() => setShowConnectModal(true)}
                      variant="primary"
                      className="flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <UserPlus size={15} />
                      Connect
                    </Button>
                  )}

                  {profile?.isMentor && profile?.mentorshipAvailability === 'open' && (
                    <Button
                      onClick={() => setShowMentorshipModal(true)}
                      variant="gold"
                      className="flex items-center gap-2 text-xs sm:text-sm shadow-lg shadow-amber-500/20"
                    >
                      <Sparkles size={15} />
                      Request Mentorship
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
                {user.firstName} {user.lastName}
              </h1>
              <RoleBadge role={user.role} />
              <VerificationBadge badge={user.verificationBadge} />
            </div>

            {profile?.headline ? (
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-3xl font-medium">
                {profile.headline}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] italic">
                {isOwnProfile ? 'Add a headline in profile settings to describe your expertise.' : 'TCET Institutional Member'}
              </p>
            )}

            {/* Quick Metadata Row */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-[var(--color-text-muted)] pt-2">
              {profile?.currentOrganization && (
                <div className="flex items-center gap-1.5">
                  <Building size={15} className="text-blue-400" />
                  <span>
                    {profile.currentDesignation ? `${profile.currentDesignation} at ` : ''}
                    <strong className="text-[var(--color-text-primary)]">{profile.currentOrganization}</strong>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <GraduationCap size={15} className="text-purple-400" />
                <span>
                  {user.department}
                  {user.graduationYear ? ` • Class of ${user.graduationYear}` : ''}
                </span>
              </div>

              {(profile?.currentCity || profile?.currentCountry) && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-rose-400" />
                  <span>
                    {[profile.currentCity, profile.currentState, profile.currentCountry].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {user.email && isOwnProfile && (
                <div className="flex items-center gap-1.5">
                  <Mail size={15} className="text-emerald-400" />
                  <span>{user.email}</span>
                </div>
              )}
            </div>

            {/* External Links */}
            {profile?.links && profile.links.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5 pt-3">
                {profile.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-surface-border)] hover:border-blue-500/50"
                  >
                    <Link2 size={13} />
                    <span className="capitalize">{link.platform || 'Link'}</span>
                    <ExternalLink size={11} className="opacity-60" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ===== 2. PROFILE COMPLETION TRACKER (Own Profile) ===== */}
      {isOwnProfile && completionPercentage < 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 sm:p-5 border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-[var(--color-surface-1)] to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-400" />
              <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Profile Strength: {completionPercentage}% Complete</h4>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Complete your profile to increase visibility among TCET recruiters, alumni mentors, and peers.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="w-32 bg-[var(--color-surface-2)] h-2.5 rounded-full overflow-hidden border border-[var(--color-surface-border)]">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <Link to="/settings" className="btn btn-primary btn-sm text-xs">
              Complete Now →
            </Link>
          </div>
        </motion.div>
      )}

      {/* ===== 3. ABOUT BIO SECTION ===== */}
      {profile?.about && (
        <div className="card p-6 space-y-2 border border-[var(--color-surface-border)]">
          <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Info size={18} className="text-blue-400" /> About & Professional Summary
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line pt-1">
            {profile.about}
          </p>
        </div>
      )}

      {/* ===== 4. ROLE-SPECIFIC TAILORED PROFILE VIEW ===== */}
      {user.role === 'STUDENT' && (
        <StudentProfileView
          user={user}
          profile={profile}
          experiences={experiences}
          projects={projects}
          isOwnProfile={isOwnProfile}
          onOpenExpModal={handleOpenExpModal}
          onOpenResumeModal={() => setShowResumeModal(true)}
          onUploadResume={handleResumeUpload}
          uploadingResume={uploadingResume}
          onOpenAcademicModal={(mode) => {
            setAcademicModalMode(mode);
            setShowAcademicModal(true);
          }}
          onViewDocument={(doc) => {
            setViewingDoc(doc);
            setShowDocModal(true);
          }}
        />
      )}

      {user.role === 'ALUMNI' && (
        <AlumniProfileView
          user={user}
          profile={profile}
          experiences={experiences}
          projects={projects}
          isOwnProfile={isOwnProfile}
          onOpenExpModal={handleOpenExpModal}
          onDeleteExp={handleDeleteExperience}
          onRequestMentorship={() => setShowMentorshipModal(true)}
        />
      )}

      {(user.role === 'FACULTY' || user.role === 'PLACEMENT_OFFICER') && (
        <FacultyProfileView
          user={user}
          profile={profile}
          experiences={experiences}
          projects={projects}
          isOwnProfile={isOwnProfile}
          onRequestMentorship={() => setShowMentorshipModal(true)}
        />
      )}

      {user.role === 'RECRUITER' && (
        <RecruiterProfileView
          user={user}
          profile={profile}
          isOwnProfile={isOwnProfile}
        />
      )}

      {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'COMMUNITY_MANAGER') && (
        <AdminProfileView
          user={user}
          profile={profile}
          isOwnProfile={isOwnProfile}
        />
      )}

      {/* ===== 5. INTERACTIVE MODALS ===== */}

      {/* Experience Add/Edit Modal */}
      <Modal
        isOpen={showExpModal}
        onClose={() => setShowExpModal(false)}
        title={editingExp ? 'Edit Experience' : 'Add Professional Experience'}
        size="lg"
      >
        <form onSubmit={handleSaveExperience} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Experience Type"
              value={expForm.type}
              onChange={(e) => setExpForm({ ...expForm, type: e.target.value })}
            >
              <option value="work">Full-time Job</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance / Contract</option>
              <option value="research">Academic Research</option>
            </Select>

            <Select
              label="Work Mode"
              value={expForm.workMode}
              onChange={(e) => setExpForm({ ...expForm, workMode: e.target.value })}
            >
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Role / Title"
              required
              placeholder="e.g. Software Engineer"
              value={expForm.role}
              onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
            />
            <Input
              label="Company / Organization"
              required
              placeholder="e.g. Microsoft / Tata Consultancy"
              value={expForm.company}
              onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
            />
          </div>

          <Input
            label="Location"
            placeholder="e.g. Mumbai, India"
            value={expForm.location}
            onChange={(e) => setExpForm({ ...expForm, location: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={expForm.startDate}
              onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
            />
            {!expForm.isCurrent && (
              <Input
                label="End Date"
                type="date"
                value={expForm.endDate}
                onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
              />
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={expForm.isCurrent}
              onChange={(e) => setExpForm({ ...expForm, isCurrent: e.target.checked })}
              className="rounded border-[var(--color-surface-border)] text-blue-500 focus:ring-0"
            />
            I currently work here
          </label>

          <Textarea
            label="Description & Responsibilities"
            rows={3}
            placeholder="Key achievements, technologies used, and project impact..."
            value={expForm.description}
            onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
          />

          <Input
            label="Skills & Tools (comma-separated)"
            placeholder="React, Node.js, AWS, Kubernetes"
            value={expForm.skills}
            onChange={(e) => setExpForm({ ...expForm, skills: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowExpModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Experience
            </Button>
          </div>
        </form>
      </Modal>

      {/* Connect Modal */}
      <Modal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        title={`Connect with ${user.firstName}`}
        size="md"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Add a personal note to introduce yourself and explain why you'd like to connect on TCET AlumNetra.
          </p>
          <Textarea
            rows={3}
            placeholder="Hi, I'm a TCET student interested in your work at..."
            value={connectMessage}
            onChange={(e) => setConnectMessage(e.target.value)}
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowConnectModal(false)} disabled={connecting}>
              Cancel
            </Button>
            <Button
              onClick={handleSendConnectionRequest}
              variant="primary"
              loading={connecting}
              className="flex items-center gap-1.5"
            >
              <Send size={15} /> Send Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Profile Modal */}
      <ShareProfileModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={user}
        profile={profile}
      />

      {/* Mentorship Request Modal */}
      <MentorshipRequestModal
        isOpen={showMentorshipModal}
        onClose={() => setShowMentorshipModal(false)}
        mentorUser={user}
        mentorProfile={profile}
        onSuccess={() => fetchProfile()}
      />

      {/* Resume Viewer Modal */}
      <ResumePreviewModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        resume={profile?.resume}
        user={user}
      />

      {/* Academic & Credential Upload Modal */}
      <AcademicUploadModal
        isOpen={showAcademicModal}
        onClose={() => setShowAcademicModal(false)}
        mode={academicModalMode}
        currentProfile={profile}
        onSuccess={() => fetchProfile()}
      />

      {/* Document & Certificate Viewer Modal */}
      <DocumentViewerModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        document={viewingDoc}
      />
    </div>
  );
}
