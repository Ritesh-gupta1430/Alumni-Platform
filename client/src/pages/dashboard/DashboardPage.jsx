import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Users,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Activity,
  Calendar,
  Sparkles,
  Rocket,
  Building,
  Check,
  UserPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { connectionsAPI } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { formatDate, timeAgo } from '../../lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();

  const isVerified = user?.verificationStatus === 'approved';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      profileViews: 12,
      connections: 0,
      messages: 0,
      applications: 0,
    },
    recentActivities: [],
    upcomingEvents: [],
    suggestedConnections: [],
  });

  const [connectedIds, setConnectedIds] = useState(new Set());
  const [connectingId, setConnectingId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/users/dashboard-stats');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn('Dashboard stats fallback:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (targetUser) => {
    setConnectingId(targetUser._id);
    try {
      await connectionsAPI.sendRequest(targetUser._id, {
        note: `Hi ${targetUser.firstName}, I'd love to connect on AlumNetra!`,
      });
      setConnectedIds((prev) => new Set([...prev, targetUser._id]));
      toast.success(`Connection invitation sent to ${targetUser.firstName}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send connection request.');
    } finally {
      setConnectingId(null);
    }
  };

  const role = user?.role;
  const isRecruiter = role === 'RECRUITER';
  const isAlumni = role === 'ALUMNI';
  const isStudent = role === 'STUDENT';
  const isFaculty = role === 'FACULTY';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const stats = isRecruiter ? [
    {
      label: 'Corporate Reach',
      value: data.stats?.profileViews || 0,
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      change: '+24%',
    },
    {
      label: 'Talent Network',
      value: data.stats?.connections || 0,
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      change: `${data.stats?.connections > 0 ? '+12%' : 'Active'}`,
    },
    {
      label: 'Candidate Messages',
      value: data.stats?.messages || 0,
      icon: MessageSquare,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      change: data.stats?.messages > 0 ? 'New' : '0 Pending',
    },
    {
      label: 'Jobs & Internships Posted',
      value: data.stats?.jobsPosted ?? 0,
      icon: Briefcase,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      change: 'Active Postings',
    },
  ] : isAdmin ? [
    {
      label: 'Total Active Members',
      value: data.stats?.totalUsers || 120,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      change: 'Platform Active',
    },
    {
      label: 'Pending Verifications',
      value: data.stats?.pendingVerifications || 0,
      icon: Activity,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      change: data.stats?.pendingVerifications > 0 ? 'Requires Review' : 'Up to date',
    },
    {
      label: 'Network Messages',
      value: data.stats?.messages || 0,
      icon: MessageSquare,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      change: 'Active',
    },
    {
      label: 'Campus Events',
      value: (data.upcomingEvents?.length || 0) + 2,
      icon: Calendar,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      change: 'Scheduled',
    },
  ] : isAlumni ? [
    {
      label: 'Profile Views',
      value: data.stats?.profileViews || 0,
      icon: Activity,
      color: 'text-brand-500',
      bg: 'bg-brand-500/10',
      change: '+18%',
    },
    {
      label: 'Alumni Network',
      value: data.stats?.connections || 0,
      icon: Users,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      change: `${data.stats?.connections > 0 ? '+12%' : 'Active'}`,
    },
    {
      label: 'Unread Messages',
      value: data.stats?.messages || 0,
      icon: MessageSquare,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      change: data.stats?.messages > 0 ? 'New' : '0 Pending',
    },
    {
      label: 'Referrals & Mentees',
      value: (data.stats?.referrals || 0) + (data.stats?.mentees || 0),
      icon: Briefcase,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      change: 'Giving Back',
    },
  ] : [
    {
      label: 'Profile Views',
      value: data.stats?.profileViews || 0,
      icon: Activity,
      color: 'text-brand-500',
      bg: 'bg-brand-500/10',
      change: '+18%',
    },
    {
      label: 'My Connections',
      value: data.stats?.connections || 0,
      icon: Users,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      change: `${data.stats?.connections > 0 ? '+12%' : 'Active'}`,
    },
    {
      label: 'Unread Messages',
      value: data.stats?.messages || 0,
      icon: MessageSquare,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      change: data.stats?.messages > 0 ? 'New' : '0 Pending',
    },
    {
      label: 'My Applications',
      value: data.stats?.applications || 0,
      icon: Briefcase,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      change: data.stats?.applications > 0 ? 'In Review' : '0 Active',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isRecruiter ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
              isAdmin ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
              isAlumni ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              isFaculty ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {user?.role} Workspace
            </span>
          </div>
          <h1 className="text-3xl font-bold font-display text-text-primary mb-2">
            Welcome back, {user?.firstName} 👋
          </h1>
          <p className="text-text-muted text-sm">
            {isRecruiter
              ? 'Discover top TCET engineers, manage campus job openings, and connect with candidates.'
              : isAlumni
              ? 'Connect with alumni batchmates, offer career referrals, and mentor students.'
              : isAdmin
              ? 'Institutional oversight, user verification queue, and placement analytics.'
              : "Here's what's happening across your TCET network and career hub today."}
          </p>
        </div>

        {!isVerified && user?.verificationStatus !== 'pending' && !isRecruiter && (
          <div className="glass p-4 rounded-xl border-l-4 border-amber-500 max-w-sm">
            <h3 className="font-semibold text-amber-500 mb-1">Verification Required</h3>
            <p className="text-xs text-text-muted mb-3">
              Unlock the verified TCET alumni badge, direct messaging, and referral requests.
            </p>
            <Button as={Link} to="/settings/verification" size="sm" variant="outline">
              Verify Identity
            </Button>
          </div>
        )}
      </div>

      {/* Role-Specific Quick Actions Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {isRecruiter ? (
          <>
            <Link to="/jobs" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-purple-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Briefcase size={16} className="text-purple-400 shrink-0" /> Post New Job
            </Link>
            <Link to="/network" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-purple-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Users size={16} className="text-blue-400 shrink-0" /> Search Talent
            </Link>
            <Link to="/events" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-purple-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Calendar size={16} className="text-cyan-400 shrink-0" /> Host Webinar
            </Link>
            <Link to="/projects" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-purple-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Rocket size={16} className="text-amber-400 shrink-0" /> Student Projects
            </Link>
          </>
        ) : isStudent ? (
          <>
            <Link to="/referrals" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-blue-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Building size={16} className="text-blue-400 shrink-0" /> Referral Bridge
            </Link>
            <Link to="/jobs" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-blue-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Briefcase size={16} className="text-emerald-400 shrink-0" /> Jobs & Internships
            </Link>
            <Link to="/mentorship" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-blue-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Sparkles size={16} className="text-amber-400 shrink-0" /> Find a Mentor
            </Link>
            <Link to="/ai" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-blue-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Rocket size={16} className="text-violet-400 shrink-0" /> AI Career Tools
            </Link>
          </>
        ) : isAlumni ? (
          <>
            <Link to="/referrals" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-amber-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Briefcase size={16} className="text-amber-400 shrink-0" /> Offer Referral
            </Link>
            <Link to="/mentorship/mentor" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-amber-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Sparkles size={16} className="text-cyan-400 shrink-0" /> Mentor Dashboard
            </Link>
            <Link to="/events" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-amber-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Calendar size={16} className="text-emerald-400 shrink-0" /> Alumni Meets
            </Link>
            <Link to="/contributions" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-amber-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Building size={16} className="text-rose-400 shrink-0" /> Give Back
            </Link>
          </>
        ) : isAdmin ? (
          <>
            <Link to="/admin/verification" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-rose-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Activity size={16} className="text-rose-400 shrink-0" /> Verification Queue
            </Link>
            <Link to="/admin/users" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-rose-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Users size={16} className="text-blue-400 shrink-0" /> User Management
            </Link>
            <Link to="/admin/analytics" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-rose-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <TrendingUp size={16} className="text-emerald-400 shrink-0" /> Analytics Hub
            </Link>
            <Link to="/events" className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-rose-400/50 transition-all flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Calendar size={16} className="text-cyan-400 shrink-0" /> Events
            </Link>
          </>
        ) : null}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="glass p-6 rounded-2xl border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp size={12} /> {stat.change}
              </span>
            </div>
            <h3 className="text-3xl font-bold text-text-primary mb-1">
              {loading ? '—' : stat.value}
            </h3>
            <p className="text-xs text-text-muted">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area: Live Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold font-display text-text-primary flex items-center gap-2">
                <Activity size={18} className="text-brand-500" />
                Live Network Activity
              </h2>
              <Link to="/jobs" className="text-xs text-brand-500 hover:underline flex items-center gap-1 font-semibold">
                Explore Portal <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-surface-alt animate-pulse" />
                ))}
              </div>
            ) : data.recentActivities.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivities.map((act) => (
                  <Link
                    key={act.id}
                    to={act.link}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-surface-alt/70 transition-colors border border-border/50 group"
                  >
                    <Avatar
                      src={act.actorPhoto}
                      firstName={act.actor.split(' ')[0]}
                      lastName={act.actor.split(' ')[1] || ''}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-text-primary leading-snug">
                        <span className="font-bold text-text-primary group-hover:text-brand-400 transition-colors">
                          {act.actor}
                        </span>{' '}
                        {act.text}{' '}
                        <span className="font-semibold text-brand-400">
                          {act.highlight}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted">
                        {act.company && <span>{act.company}</span>}
                        <span>•</span>
                        <span>{timeAgo(act.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-xs text-text-muted">
                No recent activity. Check back soon!
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="glass rounded-2xl p-6 border border-border">
            <h2 className="text-base font-bold font-display text-text-primary mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-brand-500" />
              Upcoming Events
            </h2>
            <div className="space-y-4">
              {data.upcomingEvents.length > 0 ? (
                data.upcomingEvents.map((evt) => {
                  const evtDate = new Date(evt.startDate || evt.date || Date.now());
                  const month = evtDate.toLocaleDateString(undefined, { month: 'short' });
                  const day = evtDate.getDate();

                  return (
                    <div key={evt._id} className="flex gap-3.5 items-start">
                      <div className="bg-brand-500/10 text-brand-500 border border-brand-500/20 rounded-xl p-2 text-center min-w-[50px]">
                        <p className="text-[10px] font-bold uppercase tracking-wider">{month}</p>
                        <p className="text-lg font-bold font-mono">{day}</p>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-text-primary text-xs truncate">
                          {evt.title}
                        </h4>
                        <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1 truncate">
                          <Building size={11} className="shrink-0" /> {evt.location || evt.mode || 'TCET Campus'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-text-muted py-4 text-center">
                  No upcoming events scheduled.
                </div>
              )}
            </div>
            <Button as={Link} to="/events" variant="ghost" className="w-full mt-4 text-xs text-brand-500">
              See all campus events →
            </Button>
          </div>

          {/* Suggested Connections */}
          <div className="glass rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold font-display text-text-primary flex items-center gap-2">
                <Users size={18} className="text-emerald-500" />
                Suggested Connections
              </h2>
              <Link to="/network" className="text-xs text-brand-500 hover:underline">
                All
              </Link>
            </div>

            <div className="space-y-4">
              {data.suggestedConnections.map((sug) => {
                const isSent = connectedIds.has(sug._id);
                const isSending = connectingId === sug._id;

                return (
                  <div key={sug._id} className="flex items-center justify-between gap-3">
                    <Link to={`/profile/${sug._id}`} className="flex items-center gap-3 min-w-0 group">
                      <Avatar
                        src={sug.profilePhoto}
                        firstName={sug.firstName}
                        lastName={sug.lastName}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text-primary truncate group-hover:underline">
                          {sug.firstName} {sug.lastName}
                        </p>
                        <p className="text-[10px] text-text-muted truncate">
                          {sug.headline}
                        </p>
                      </div>
                    </Link>

                    {isSent ? (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Check size={12} /> Sent
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSending}
                        onClick={() => handleConnect(sug)}
                        className="rounded-xl px-2.5 py-1 text-xs h-auto flex items-center gap-1 shrink-0"
                      >
                        <UserPlus size={12} /> Connect
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
