import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  Briefcase,
  Heart,
  Calendar,
  Sparkles,
  TrendingUp,
  FileText,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate, timeAgo } from '../../lib/utils';

export default function AdminDashboardPage() {
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getDashboard();
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  const {
    userStats = {},
    pendingVerifications = 0,
    jobs = {},
    upcomingEvents = 0,
    activeMentorships = 0,
    activeCampaigns = 0,
    donations = {},
    recentActivity = [],
  } = data || {};

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
            <ShieldAlert className="text-rose-500" size={28} />
            Institutional Administration & Governance
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Overview of member verifications, user moderation, placement pipelines, and giving campaigns.
          </p>
        </div>

        <Link to="/admin/analytics">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
            <TrendingUp size={14} /> Full Analytics & Trends
          </Button>
        </Link>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 space-y-2 border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-xs font-semibold uppercase">
            <span>Total Members</span>
            <Users size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
            {userStats.total || 0}
          </div>
          <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-surface-border)]">
            <span>{userStats.students || 0} Students</span>
            <span>{userStats.alumni || 0} Alumni</span>
          </div>
        </motion.div>

        {/* Card 2: Pending Verifications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-5 space-y-2 border-l-4 border-amber-400 bg-amber-500/5"
        >
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-xs font-semibold uppercase">
            <span>Pending Verifications</span>
            <ShieldCheck size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {pendingVerifications}
          </div>
          <Link
            to="/admin/verification"
            className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 pt-1 border-t border-[var(--color-surface-border)]"
          >
            Review Document Queue <ArrowRight size={12} />
          </Link>
        </motion.div>

        {/* Card 3: Opportunities */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5 space-y-2 border-l-4 border-emerald-500"
        >
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-xs font-semibold uppercase">
            <span>Active Postings</span>
            <Briefcase size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
            {(jobs.active || 0) + (jobs.internships || 0)}
          </div>
          <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-surface-border)]">
            <span>{jobs.active || 0} Full-time</span>
            <span>{jobs.internships || 0} Internships</span>
          </div>
        </motion.div>

        {/* Card 4: Donations */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-5 space-y-2 border-l-4 border-rose-500"
        >
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-xs font-semibold uppercase">
            <span>Giving Raised</span>
            <Heart size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {formatCurrency(donations.totalRaised || 0)}
          </div>
          <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-surface-border)]">
            <span>{donations.totalCount || 0} Contributions</span>
            <span>{activeCampaigns} Campaigns</span>
          </div>
        </motion.div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/verification" className="card p-5 hover:border-amber-400/50 transition-all group">
          <div className="p-3 rounded-xl bg-amber-400/10 text-amber-300 w-fit mb-3">
            <ShieldCheck size={22} />
          </div>
          <h3 className="font-bold text-sm text-[var(--color-text-primary)] group-hover:text-amber-300">
            Verify Members
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Review student IDs, marksheets, and issue verified badges.
          </p>
        </Link>

        <Link to="/admin/users" className="card p-5 hover:border-blue-500/50 transition-all group">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 w-fit mb-3">
            <Users size={22} />
          </div>
          <h3 className="font-bold text-sm text-[var(--color-text-primary)] group-hover:text-blue-400">
            User Moderation
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Search directory, suspend abusive accounts, and inspect roles.
          </p>
        </Link>

        <Link to="/admin/campaigns" className="card p-5 hover:border-rose-500/50 transition-all group">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 w-fit mb-3">
            <Heart size={22} />
          </div>
          <h3 className="font-bold text-sm text-[var(--color-text-primary)] group-hover:text-rose-400">
            Manage Campaigns
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Approve giving causes, post milestone updates, and audit receipts.
          </p>
        </Link>

        <Link to="/admin/analytics" className="card p-5 hover:border-purple-500/50 transition-all group">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-3">
            <TrendingUp size={22} />
          </div>
          <h3 className="font-bold text-sm text-[var(--color-text-primary)] group-hover:text-purple-400">
            Skill & Hiring Trends
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Skill market demand vs supply and departmental placements.
          </p>
        </Link>
      </div>

      {/* Audit Log Activity Feed */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <FileText size={18} className="text-blue-400" />
          Live Platform Audit Stream
        </h2>

        {recentActivity.length > 0 ? (
          <div className="divide-y divide-[var(--color-surface-border)]">
            {recentActivity.map((log) => (
              <div key={log._id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${log.severity === 'high' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                  <div>
                    <span className="font-bold text-[var(--color-text-primary)] capitalize">
                      {log.action?.replace('_', ' ')}
                    </span>
                    <span className="text-[var(--color-text-muted)] ml-2">
                      by {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System'}
                    </span>
                    {log.targetDisplay && (
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                        Target: {log.targetDisplay}
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-[11px] font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                  {timeAgo(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">
            No recent administrative audit events recorded.
          </p>
        )}
      </div>
    </div>
  );
}
