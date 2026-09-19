import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Compass,
  Shield,
  MessageSquare,
  ChevronLeft,
  Calendar,
  Share2,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { communityAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { RoleBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../lib/utils';

export default function CommunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await communityAPI.get(id);
      setCommunity(res.data.data);
    } catch (err) {
      toast.error('Failed to load community.');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleToggleJoin = () => {
    setJoined(!joined);
    toast.success(joined ? 'You left the community.' : 'You joined the community!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto mt-12">
        <Compass className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-40" />
        <h2 className="text-xl font-bold mb-2">Community Not Found</h2>
        <Button onClick={() => navigate('/communities')} variant="primary" className="mt-4">
          All Communities
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Back button */}
      <button
        onClick={() => navigate('/communities')}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ChevronLeft size={16} /> Back to communities
      </button>

      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 sm:p-8 space-y-6 border border-[var(--color-surface-border)] shadow-xl relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400">
              <Compass size={36} />
            </div>
            <div className="space-y-1.5">
              <span className="badge badge-blue capitalize text-[10px]">
                {community.category?.replace('_', ' ') || 'Club'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
                {community.name}
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                <Users size={14} /> {community.memberCount || 1} members • Created {formatDate(community.createdAt, 'MMM yyyy')}
              </p>
            </div>
          </div>

          <Button
            onClick={handleToggleJoin}
            variant={joined ? 'outline' : 'primary'}
            className="w-full sm:w-auto"
          >
            {joined ? 'Joined ✓' : 'Join Community'}
          </Button>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* About */}
          <div className="card p-6 space-y-3">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">About the Group</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
              {community.description || 'Welcome to the community! Connect and collaborate with members.'}
            </p>
          </div>

          {/* Group Rules */}
          {community.rules && community.rules.length > 0 && (
            <div className="card p-6 space-y-3">
              <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Shield size={18} className="text-emerald-400" />
                Community Guidelines
              </h2>
              <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                {community.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Discussion feed placeholder */}
          <div className="card p-8 text-center text-sm text-[var(--color-text-muted)] space-y-2">
            <MessageSquare size={36} className="mx-auto opacity-30 mb-2" />
            <p className="font-semibold text-[var(--color-text-primary)]">Community Feed</p>
            <p className="text-xs">Discussions, resource sharing, and announcements are open to all joined members.</p>
          </div>
        </div>

        {/* Right Column: Organizer Info */}
        <div className="space-y-6">
          {community.createdBy && (
            <div className="card p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Community Manager
              </h3>
              <div className="flex items-center gap-3">
                <Avatar
                  src={community.createdBy.profilePhoto}
                  firstName={community.createdBy.firstName}
                  lastName={community.createdBy.lastName}
                  size="md"
                />
                <div>
                  <Link
                    to={`/profile/${community.createdBy._id}`}
                    className="font-bold text-sm text-[var(--color-text-primary)] hover:text-blue-400 block"
                  >
                    {community.createdBy.firstName} {community.createdBy.lastName}
                  </Link>
                  <p className="text-xs text-[var(--color-text-muted)]">Founder / Manager</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
