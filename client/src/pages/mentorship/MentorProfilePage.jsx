import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Building,
  GraduationCap,
  MapPin,
  Send,
  CheckCircle2,
  Users,
  Award,
  ChevronLeft,
  Calendar,
  Clock,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { profileAPI, mentorshipAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { RoleBadge, StatusBadge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

export default function MentorProfilePage() {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [mentorData, setMentorData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Request Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestForm, setRequestForm] = useState({
    goal: '',
    duration: '3 Months',
    preferredFrequency: 'Bi-weekly',
    selectedTopics: [],
  });

  const fetchMentorDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await profileAPI.getProfile(mentorId);
      setMentorData(res.data.data);
    } catch (err) {
      toast.error('Failed to load mentor details.');
    } finally {
      setLoading(false);
    }
  }, [mentorId, toast]);

  useEffect(() => {
    fetchMentorDetail();
  }, [fetchMentorDetail]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.goal.trim()) {
      toast.error('Please describe your mentorship goal.');
      return;
    }

    setSubmitting(true);
    try {
      await mentorshipAPI.sendRequest({
        mentorId,
        goal: requestForm.goal,
        duration: requestForm.duration,
        preferredFrequency: requestForm.preferredFrequency,
        topics: requestForm.selectedTopics,
      });
      toast.success('Mentorship request sent successfully!');
      setShowModal(false);
      navigate('/mentorship');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send mentorship request.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTopic = (topic) => {
    setRequestForm((prev) => {
      const exists = prev.selectedTopics.includes(topic);
      return {
        ...prev,
        selectedTopics: exists
          ? prev.selectedTopics.filter((t) => t !== topic)
          : [...prev.selectedTopics, topic],
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading mentor profile...</p>
        </div>
      </div>
    );
  }

  if (!mentorData || !mentorData.user) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto mt-12">
        <Sparkles className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-40" />
        <h2 className="text-xl font-bold mb-2">Mentor Not Found</h2>
        <Button onClick={() => navigate('/mentorship')} variant="primary" className="mt-4">
          Browse All Mentors
        </Button>
      </div>
    );
  }

  const { user: mentor, profile = {}, experiences = [] } = mentorData;
  const isAvailable = profile?.mentorshipAvailability === 'open' || profile?.mentorshipAvailability === 'limited';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ChevronLeft size={16} /> Back to mentors
      </button>

      {/* Mentor Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 sm:p-8 border-l-4 border-amber-400 bg-gradient-to-r from-amber-500/5 to-transparent space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Avatar
              src={mentor.profilePhoto}
              firstName={mentor.firstName}
              lastName={mentor.lastName}
              size="2xl"
              className="w-24 h-24"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {mentor.firstName} {mentor.lastName}
                </h1>
                <RoleBadge role={mentor.role} />
                <VerificationBadge badge={mentor.verificationBadge} />
              </div>

              <p className="text-sm font-medium text-amber-300">
                {profile?.headline || 'TCET Alumni Mentor'}
              </p>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[var(--color-text-muted)] pt-1">
                {profile?.currentOrganization && (
                  <span className="flex items-center gap-1">
                    <Building size={14} className="text-blue-400" />
                    {profile.currentOrganization}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <GraduationCap size={14} className="text-purple-400" />
                  {mentor.department}
                </span>
                {profile?.currentCity && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-rose-400" />
                    {profile.currentCity}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 w-full sm:w-auto">
            <StatusBadge status={profile?.mentorshipAvailability || 'open'} />
            {isAvailable ? (
              <Button
                onClick={() => setShowModal(true)}
                variant="gold"
                className="w-full flex items-center justify-center gap-2"
              >
                <Send size={16} /> Request Mentorship
              </Button>
            ) : (
              <Button disabled variant="ghost" className="w-full opacity-60">
                Currently Closed
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Bio, Focus Topics, Past Experience */}
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6 space-y-3">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              About the Mentor
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
              {profile?.about || 'No detailed biography provided.'}
            </p>
          </div>

          {/* Mentorship Focus Topics */}
          {profile?.mentorshipTopics && profile.mentorshipTopics.length > 0 && (
            <div className="card p-6 space-y-3">
              <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                Mentorship Topics & Focus Areas
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.mentorshipTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-semibold"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience Highlights */}
          {experiences.length > 0 && (
            <div className="card p-6 space-y-4">
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Professional Experience
              </h2>
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp._id} className="border-l-2 border-indigo-500 pl-4 space-y-1">
                    <h3 className="font-bold text-sm text-[var(--color-text-primary)]">{exp.role}</h3>
                    <p className="text-xs text-indigo-400">{exp.company}</p>
                    {exp.description && (
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Capacity & Stats */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Mentorship Capacity
            </h3>
            <div className="space-y-3 text-xs text-[var(--color-text-secondary)]">
              <div className="flex justify-between">
                <span>Active Mentees:</span>
                <strong className="text-[var(--color-text-primary)]">{profile?.currentMenteeCount || 0}</strong>
              </div>
              <div className="flex justify-between">
                <span>Maximum Capacity:</span>
                <strong className="text-[var(--color-text-primary)]">{profile?.maxMentees || 3}</strong>
              </div>
              <div className="flex justify-between">
                <span>Mentorship Impact Score:</span>
                <strong className="text-amber-400">{profile?.impactScore || 0} pts</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== REQUEST MENTORSHIP MODAL ===== */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Request Mentorship from ${mentor.firstName}`}
        size="lg"
      >
        <form onSubmit={handleSendRequest} className="space-y-4">
          <Textarea
            label="What is your primary mentorship goal?"
            required
            rows={4}
            placeholder="e.g. I am seeking guidance on breaking into Cloud Architecture, preparing for system design interviews, and reviewing my portfolio..."
            value={requestForm.goal}
            onChange={(e) => setRequestForm({ ...requestForm, goal: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Preferred Duration"
              value={requestForm.duration}
              onChange={(e) => setRequestForm({ ...requestForm, duration: e.target.value })}
            >
              <option value="1 Month">1 Month (Short sprint / Resume & Mock)</option>
              <option value="3 Months">3 Months (Standard guidance)</option>
              <option value="6 Months">6 Months (Long-term career roadmap)</option>
            </Select>

            <Select
              label="Meeting Frequency"
              value={requestForm.preferredFrequency}
              onChange={(e) => setRequestForm({ ...requestForm, preferredFrequency: e.target.value })}
            >
              <option value="Weekly">Weekly (1 hr / week)</option>
              <option value="Bi-weekly">Bi-weekly (Every 2 weeks)</option>
              <option value="Monthly">Monthly check-in</option>
              <option value="As Needed">As Needed / Async</option>
            </Select>
          </div>

          {/* Select relevant topics */}
          {profile?.mentorshipTopics && profile.mentorshipTopics.length > 0 && (
            <div className="space-y-1.5">
              <label className="label">Select Topics You Wish to Cover</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {profile.mentorshipTopics.map((topic) => {
                  const isSelected = requestForm.selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-amber-400 text-black border-amber-400 font-bold'
                          : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-[var(--color-surface-border)]'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '} {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={submitting}>
              Send Proposal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
