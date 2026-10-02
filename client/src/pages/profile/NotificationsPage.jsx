import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  UserPlus,
  UserCheck,
  MessageSquare,
  Briefcase,
  Sparkles,
  ShieldCheck,
  Heart,
  Calendar,
  ExternalLink,
  Trash2,
  Check,
  Users,
  Award,
  AlertCircle,
  Clock,
  ChevronRight,
  Filter
} from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { RoleBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { timeAgo, formatDate } from '../../lib/utils';

export default function NotificationsPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'network' | 'mentorship' | 'jobs' | 'verification' | 'events' | 'contributions'
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.list({
        read: filterUnreadOnly ? false : undefined,
        limit: 100,
      });
      setNotifications(res.data.data.notifications || res.data.data || []);

      const countRes = await notificationsAPI.getUnreadCount();
      setUnreadCount(countRes.data.data.count || 0);
    } catch (err) {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [filterUnreadOnly, toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      toast.success('All notifications marked as read.');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      toast.error('Failed to mark all as read.');
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      toast.error('Failed to update notification.');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'connection_request':
        return <UserPlus className="text-blue-400" size={18} />;
      case 'connection_accepted':
        return <UserCheck className="text-emerald-400" size={18} />;
      case 'message':
      case 'message_received':
        return <MessageSquare className="text-indigo-400" size={18} />;
      case 'job_posted':
      case 'job_recommended':
      case 'internship_recommended':
      case 'job_application_status':
      case 'internship_application_status':
        return <Briefcase className="text-amber-400" size={18} />;
      case 'mentorship_request':
      case 'mentorship_accepted':
      case 'mentorship_session_scheduled':
      case 'mentorship_completed':
        return <Sparkles className="text-cyan-400" size={18} />;
      case 'verification_approved':
      case 'verification_rejected':
      case 'verification_correction':
        return <ShieldCheck className="text-purple-400" size={18} />;
      case 'donation_success':
      case 'donation_received':
      case 'campaign_update':
        return <Heart className="text-rose-400" size={18} />;
      case 'event_registered':
      case 'event_reminder':
      case 'event_approved':
        return <Calendar className="text-emerald-400" size={18} />;
      default:
        return <Bell className="text-blue-400" size={18} />;
    }
  };

  // Robust Link Target Resolution
  const resolveTargetLink = (n) => {
    if (n.link && n.link !== '/dashboard' && !n.link.endsWith('/requests')) {
      return n.link;
    }

    switch (n.type) {
      case 'connection_request':
        return '/network?tab=pending';
      case 'connection_accepted':
        return n.sender?._id ? `/profile/${n.sender._id}` : '/network?tab=connections';
      case 'message':
      case 'message_received':
        return '/messages';
      case 'mentorship_request':
        return '/mentorship?tab=my-requests';
      case 'mentorship_accepted':
      case 'mentorship_session_scheduled':
        return '/mentorship?tab=active';
      case 'job_posted':
      case 'job_recommended':
        return n.data?.jobId ? `/jobs/${n.data.jobId}` : '/jobs';
      case 'job_application_status':
      case 'internship_application_status':
        return '/applications';
      case 'verification_approved':
      case 'verification_rejected':
      case 'verification_correction':
        return '/settings/verification';
      case 'event_registered':
      case 'event_reminder':
      case 'event_approved':
        return '/events';
      case 'donation_success':
      case 'donation_received':
      case 'campaign_update':
        return n.data?.donationId ? `/contributions/receipt/${n.data.donationId}` : '/contributions';
      case 'community_post':
      case 'community_joined':
        return n.data?.communityId ? `/communities/${n.data.communityId}` : '/communities';
      case 'referral_received':
      case 'referral_outcome':
        return '/referrals';
      default:
        return n.link || '/dashboard';
    }
  };

  // Filter by category
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'network') {
        return ['connection_request', 'connection_accepted', 'connection_declined'].includes(n.type);
      }
      if (activeCategory === 'mentorship') {
        return ['mentorship_request', 'mentorship_accepted', 'mentorship_declined', 'mentorship_session_scheduled', 'mentorship_completed'].includes(n.type);
      }
      if (activeCategory === 'jobs') {
        return ['job_posted', 'job_recommended', 'internship_recommended', 'job_application_status', 'internship_application_status', 'referral_received'].includes(n.type);
      }
      if (activeCategory === 'verification') {
        return ['verification_approved', 'verification_rejected', 'verification_correction'].includes(n.type);
      }
      if (activeCategory === 'events') {
        return ['event_registered', 'event_reminder', 'event_approved', 'community_post', 'community_joined'].includes(n.type);
      }
      if (activeCategory === 'contributions') {
        return ['donation_success', 'donation_received', 'donation_failed', 'receipt_generated', 'campaign_update'].includes(n.type);
      }
      return true;
    });
  }, [notifications, activeCategory]);

  const categories = [
    { id: 'all', label: 'All Updates', icon: Bell },
    { id: 'network', label: 'Network & Connects', icon: Users },
    { id: 'mentorship', label: 'Mentorship', icon: Sparkles },
    { id: 'jobs', label: 'Jobs & Applications', icon: Briefcase },
    { id: 'verification', label: 'Verification', icon: ShieldCheck },
    { id: 'events', label: 'Campus & Events', icon: Calendar },
    { id: 'contributions', label: 'Giving & Grants', icon: Heart },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Notifications Hub</h1>
            {unreadCount > 0 && (
              <span className="badge badge-blue font-mono font-bold text-xs">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Stay updated with your connections, mentorship requests, job updates, and institutional verifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={filterUnreadOnly ? 'primary' : 'outline'}
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className="text-xs"
          >
            {filterUnreadOnly ? 'Show All' : 'Unread Only'}
          </Button>

          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 text-xs"
            >
              <CheckCheck size={14} /> Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--color-surface-border)] no-scrollbar">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)]'
              }`}
            >
              <Icon size={14} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="card divide-y divide-[var(--color-surface-border)] overflow-hidden shadow-lg border border-[var(--color-surface-border)]">
        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--color-text-muted)] animate-pulse">
            Loading notifications...
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => {
            const targetLink = resolveTargetLink(n);
            const isUnread = !n.read && !n.isRead;

            return (
              <motion.div
                key={n._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                  isUnread ? 'bg-blue-500/5 hover:bg-blue-500/10' : 'hover:bg-[var(--color-surface-2)]'
                }`}
              >
                {/* Sender Avatar or Icon */}
                {n.sender && n.sender.firstName ? (
                  <Link to={`/profile/${n.sender._id}`} className="mt-0.5 flex-shrink-0">
                    <Avatar
                      src={n.sender.profilePhoto}
                      firstName={n.sender.firstName}
                      lastName={n.sender.lastName}
                      size="md"
                    />
                  </Link>
                ) : (
                  <div className="p-2.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex-shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>
                )}

                {/* Content Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
                        {n.title}
                      </h3>
                      {n.sender?.role && <RoleBadge role={n.sender.role} />}
                    </div>
                    <span className="text-[11px] font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                    {n.message || n.body}
                  </p>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {targetLink && (
                      <Link
                        to={targetLink}
                        onClick={() => {
                          if (isUnread) handleMarkAsRead(n._id);
                        }}
                        className="btn btn-primary btn-sm text-xs py-1 px-3 flex items-center gap-1.5 shadow-sm"
                      >
                        <span>
                          {n.type === 'connection_request'
                            ? 'Review Connection Request'
                            : n.type.startsWith('mentorship')
                            ? 'View Mentorship Request'
                            : n.type.startsWith('job') || n.type.startsWith('application')
                            ? 'View Application Status'
                            : n.type.startsWith('verification')
                            ? 'View Verification Status'
                            : 'View Details'}
                        </span>
                        <ChevronRight size={14} />
                      </Link>
                    )}

                    {n.sender?._id && (
                      <Link
                        to={`/profile/${n.sender._id}`}
                        className="text-xs text-[var(--color-text-muted)] hover:text-blue-400 font-medium transition-colors"
                      >
                        View {n.sender.firstName}'s Profile
                      </Link>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(n._id)}
                        className="text-xs text-[var(--color-text-muted)] hover:text-blue-400 flex items-center gap-1 font-medium ml-auto"
                      >
                        <Check size={14} /> Mark as read
                      </button>
                    )}
                  </div>
                </div>

                {/* Unread indicator dot */}
                {isUnread && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 self-center" />
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="p-16 text-center text-sm text-[var(--color-text-muted)] space-y-2">
            <Bell size={40} className="mx-auto opacity-30 mb-2" />
            <p className="font-semibold text-[var(--color-text-primary)]">No notifications in this category</p>
            <p className="text-xs">
              {filterUnreadOnly
                ? 'You have caught up with all your unread notifications!'
                : 'When new activity occurs in this category, it will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
