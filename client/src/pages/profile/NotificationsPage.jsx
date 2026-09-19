import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Check
} from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { timeAgo } from '../../lib/utils';

export default function NotificationsPage() {
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.list({
        read: filterUnreadOnly ? false : undefined,
        limit: 50,
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
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      toast.error('Failed to mark all as read.');
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
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
        return <MessageSquare className="text-indigo-400" size={18} />;
      case 'job_posted':
      case 'application_status':
        return <Briefcase className="text-orange-400" size={18} />;
      case 'mentorship_request':
      case 'mentorship_accepted':
        return <Sparkles className="text-amber-400" size={18} />;
      case 'verification_approved':
      case 'verification_rejected':
        return <ShieldCheck className="text-purple-400" size={18} />;
      case 'donation_received':
        return <Heart className="text-rose-400" size={18} />;
      case 'event_reminder':
        return <Calendar className="text-cyan-400" size={18} />;
      default:
        return <Bell className="text-blue-400" size={18} />;
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.link) return notification.link;
    switch (notification.type) {
      case 'connection_request':
      case 'connection_accepted':
        return '/network';
      case 'message':
        return '/messages';
      case 'job_posted':
      case 'application_status':
        return '/applications';
      case 'mentorship_request':
      case 'mentorship_accepted':
        return '/mentorship';
      case 'verification_approved':
      case 'verification_rejected':
        return '/settings/verification';
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Notifications</h1>
            {unreadCount > 0 && (
              <span className="badge badge-blue font-mono font-bold text-xs">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Stay updated with your connections, mentorships, and opportunities.
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

      {/* Notifications List */}
      <div className="card divide-y divide-[var(--color-surface-border)] overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--color-text-muted)] animate-pulse">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => {
            const link = getNotificationLink(n);
            const isUnread = !n.isRead;

            return (
              <motion.div
                key={n._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                  isUnread ? 'bg-blue-500/5 hover:bg-blue-500/10' : 'hover:bg-[var(--color-surface-2)]'
                }`}
              >
                {/* Icon Circle */}
                <div className="p-2.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex-shrink-0 mt-0.5">
                  {getNotificationIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
                      {n.title}
                    </h3>
                    <span className="text-[11px] font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                    {n.body || n.message}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    {link && (
                      <Link
                        to={link}
                        className="btn btn-secondary btn-sm text-xs py-1 px-3 flex items-center gap-1"
                      >
                        View Details <ExternalLink size={12} />
                      </Link>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(n._id)}
                        className="text-xs text-[var(--color-text-muted)] hover:text-blue-400 flex items-center gap-1 font-medium"
                      >
                        <Check size={14} /> Mark as read
                      </button>
                    )}
                  </div>
                </div>

                {/* Unread indicator pill */}
                {isUnread && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 self-center" />
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="p-16 text-center text-sm text-[var(--color-text-muted)] space-y-2">
            <Bell size={40} className="mx-auto opacity-30 mb-2" />
            <p className="font-semibold text-[var(--color-text-primary)]">No notifications to show</p>
            <p className="text-xs">
              {filterUnreadOnly
                ? 'You have caught up with all your unread notifications!'
                : 'When you get connection requests, messages, or updates, they will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
