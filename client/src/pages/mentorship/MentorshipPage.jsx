import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Search,
  Building,
  GraduationCap,
  MapPin,
  Users,
  ChevronRight,
  Clock,
  CheckCircle2,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { mentorshipAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { RoleBadge, StatusBadge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { DEPARTMENTS, formatDate, timeAgo } from '../../lib/utils';

export default function MentorshipPage() {
  const { user, profile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'my-requests' | 'active'
  const [mentors, setMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(true);

  // Filters
  const [searchSkills, setSearchSkills] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [sortBy, setSortBy] = useState('match');

  // Requests & Active state
  const [myRequests, setMyRequests] = useState([]);
  const [activeMentorships, setActiveMentorships] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Fetch Mentors
  const fetchMentors = useCallback(async () => {
    setLoadingMentors(true);
    try {
      const res = await mentorshipAPI.getMentors({
        skills: searchSkills || undefined,
        department: selectedDept || undefined,
        industry: industryFilter || undefined,
        sortBy: sortBy || 'match',
        limit: 18,
      });
      setMentors(res.data.data.mentors || []);
    } catch (err) {
      toast.error('Failed to load mentors.');
    } finally {
      setLoadingMentors(false);
    }
  }, [searchSkills, selectedDept, industryFilter, sortBy, toast]);

  // Fetch Requests
  const fetchMyRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await mentorshipAPI.getRequests({ role: 'student' });
      setMyRequests(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load mentorship requests.');
    } finally {
      setLoadingRequests(false);
    }
  }, [toast]);

  // Fetch Active Mentorships
  const fetchActiveMentorships = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await mentorshipAPI.getActive();
      setActiveMentorships(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load active mentorships.');
    } finally {
      setLoadingRequests(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'explore') fetchMentors();
    else if (activeTab === 'my-requests') fetchMyRequests();
    else if (activeTab === 'active') fetchActiveMentorships();
  }, [activeTab, fetchMentors, fetchMyRequests, fetchActiveMentorships]);

  const getMatchBadgeStyle = (score) => {
    if (score >= 90) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (score >= 75) return 'bg-primary/20 text-primary border-primary/30';
    if (score >= 60) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
            <Sparkles className="text-amber-400" size={26} />
            AlumNetra Mentorship Network
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Connect with experienced TCET alumni and faculty for career roadmaps, interview prep, and technical guidance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/ai-tools">
            <Button variant="secondary" className="flex items-center gap-1.5 text-xs">
              <Sparkles size={14} className="text-primary" /> AI Matchmaker
            </Button>
          </Link>
          {profile?.isMentor && (
            <Link to="/mentorship/mentor">
              <Button variant="gold" className="flex items-center gap-2 whitespace-nowrap text-xs">
                <Users size={14} /> Mentor Dashboard
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--color-surface-border)] gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('explore')}
          className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'explore'
              ? 'border-amber-400 text-amber-300 bg-amber-500/5'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Find Mentors
        </button>
        <button
          onClick={() => setActiveTab('my-requests')}
          className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'my-requests'
              ? 'border-amber-400 text-amber-300 bg-amber-500/5'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          My Requests ({myRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'active'
              ? 'border-amber-400 text-amber-300 bg-amber-500/5'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Active Mentorships ({activeMentorships.length})
        </button>
      </div>

      {/* ===== TAB 1: EXPLORE MENTORS ===== */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="card p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input
                icon={Search}
                placeholder="Search skills (e.g. AI, React, Cloud)..."
                value={searchSkills}
                onChange={(e) => setSearchSkills(e.target.value)}
              />

              <Select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>

              <Input
                icon={Building}
                placeholder="Industry (e.g. FinTech, BigTech)..."
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
              />

              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="match">✨ Best AI Match</option>
                <option value="experience">💼 Most Experienced</option>
                <option value="availability">⚡ Highest Availability</option>
              </Select>
            </div>
          </div>

          {/* Mentors Grid */}
          {loadingMentors ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="card p-6 h-56 animate-pulse bg-[var(--color-surface-2)]" />
              ))}
            </div>
          ) : mentors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {mentors.map((m) => {
                const mentorUser = m.user;
                if (!mentorUser) return null;

                const score = m.matchScore || 85;

                return (
                  <motion.div
                    key={m._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 flex flex-col justify-between hover:border-amber-400/50 transition-all shadow-md group relative"
                  >
                    <div className="space-y-3">
                      {/* Top Row: Avatar & Status & Match Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={mentorUser.profilePhoto}
                            firstName={mentorUser.firstName}
                            lastName={mentorUser.lastName}
                            size="lg"
                          />
                          <div>
                            <Link
                              to={`/mentorship/mentor/${mentorUser._id}`}
                              className="font-bold text-base text-[var(--color-text-primary)] hover:text-amber-400 block truncate"
                            >
                              {mentorUser.firstName} {mentorUser.lastName}
                            </Link>
                            <div className="flex items-center gap-1 mt-0.5">
                              <RoleBadge role={mentorUser.role} />
                              <VerificationBadge badge={mentorUser.verificationBadge} />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getMatchBadgeStyle(score)}`}>
                            {score}% Match
                          </span>
                          <StatusBadge status={m.mentorshipAvailability || 'open'} />
                        </div>
                      </div>

                      {/* Headline / Org */}
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed font-medium">
                        {m.headline || `${mentorUser.department} Alumni`}
                      </p>

                      {m.currentOrganization && (
                        <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                          <Building size={13} className="text-blue-400" />
                          <span className="truncate">{m.currentOrganization}</span>
                        </div>
                      )}

                      {/* Mentorship Topics */}
                      {m.mentorshipTopics && m.mentorshipTopics.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                            Mentorship Focus:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {m.mentorshipTopics.slice(0, 3).map((topic, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--color-surface-border)]">
                      <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                        <Users size={12} />
                        {m.currentMenteeCount || 0} / {m.maxMentees || 3} Mentees
                      </span>

                      <Link to={`/mentorship/mentor/${mentorUser._id}`}>
                        <Button variant="secondary" size="sm" className="text-xs flex items-center gap-1">
                          Request Guidance <ChevronRight size={14} />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="card p-16 text-center text-sm text-[var(--color-text-muted)] space-y-2">
              <Sparkles size={40} className="mx-auto opacity-30 mb-2" />
              <p className="font-semibold text-[var(--color-text-primary)]">No mentors found</p>
              <p className="text-xs">Try adjusting your skill keywords or department filters.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 2: MY REQUESTS ===== */}
      {activeTab === 'my-requests' && (
        <div className="space-y-4">
          {loadingRequests ? (
            <div className="card p-12 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
              Loading your mentorship requests...
            </div>
          ) : myRequests.length > 0 ? (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <div key={req._id} className="card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={req.mentor?.profilePhoto}
                        firstName={req.mentor?.firstName}
                        lastName={req.mentor?.lastName}
                        size="md"
                      />
                      <div>
                        <Link
                          to={`/profile/${req.mentor?._id}`}
                          className="font-bold text-sm text-[var(--color-text-primary)] hover:text-amber-400"
                        >
                          {req.mentor?.firstName} {req.mentor?.lastName}
                        </Link>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Requested {timeAgo(req.createdAt)}
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={req.status} />
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--color-surface-2)] text-xs space-y-1">
                    <p><strong>Goal:</strong> {req.goal}</p>
                    {req.topics?.length > 0 && (
                      <p className="text-[var(--color-text-muted)]">
                        <strong>Topics:</strong> {req.topics.join(', ')}
                      </p>
                    )}
                    {req.declineReason && (
                      <p className="text-rose-400 italic">
                        <strong>Decline Reason:</strong> {req.declineReason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-16 text-center text-sm text-[var(--color-text-muted)]">
              You haven't sent any mentorship requests yet.
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 3: ACTIVE MENTORSHIPS ===== */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeMentorships.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeMentorships.map((m) => {
                const partner = m.mentor?._id === user?._id ? m.student : m.mentor;
                return (
                  <div key={m._id} className="card p-5 space-y-4 border-l-4 border-emerald-500">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={partner?.profilePhoto}
                          firstName={partner?.firstName}
                          lastName={partner?.lastName}
                          size="md"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
                            {partner?.firstName} {partner?.lastName}
                          </h3>
                          <p className="text-xs text-[var(--color-text-muted)]">{partner?.department}</p>
                        </div>
                      </div>
                      <span className="badge badge-green text-[10px]">Active</span>
                    </div>

                    <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
                      <p><strong>Goal:</strong> {m.goal}</p>
                      <p><strong>Sessions Completed:</strong> {m.sessionCount || 0}</p>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-[var(--color-surface-border)]">
                      <Link to={`/messages?user=${partner?._id}`} className="flex-1">
                        <Button variant="secondary" size="sm" className="w-full text-xs flex items-center justify-center gap-1.5">
                          <MessageSquare size={14} /> Message
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card p-16 text-center text-sm text-[var(--color-text-muted)]">
              No active mentorships found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
