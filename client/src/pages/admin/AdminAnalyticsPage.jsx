import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Briefcase,
  Sparkles,
  ChevronLeft,
  GraduationCap,
  Award,
  Layers
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';

export default function AdminAnalyticsPage() {
  const toast = useToast();

  const [analytics, setAnalytics] = useState(null);
  const [skillTrends, setSkillTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [anaRes, skillRes] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getSkillTrends(),
      ]);
      setAnalytics(anaRes.data.data);
      setSkillTrends(skillRes.data.data);
    } catch (err) {
      toast.error('Failed to load institutional analytics.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  const { usersByRole = {}, usersByDepartment = [], placementByDepartment = [] } = analytics || {};
  const { demand = [], supply = [] } = skillTrends || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Back button */}
      <Link
        to="/admin"
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ChevronLeft size={16} /> Back to Admin Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
          <TrendingUp className="text-purple-400" size={26} />
          Institutional Analytics & Skill Market Trends
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Real-time intelligence on student talent readiness, industry hiring demands, and departmental metrics.
        </p>
      </div>

      {/* Top Row: User Demographics & Department Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Roles Breakdown */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            Member Distribution by Role
          </h2>
          <div className="space-y-3">
            {Object.entries(usersByRole).map(([role, count]) => (
              <div key={role} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="capitalize">{role.toLowerCase()}</span>
                  <span className="font-mono text-blue-400">{count}</span>
                </div>
                <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, (count / 50) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Placements / Department Success */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <GraduationCap size={18} className="text-emerald-400" />
            Selections / Placements by Department
          </h2>
          {placementByDepartment.length > 0 ? (
            <div className="space-y-3">
              {placementByDepartment.map((item) => (
                <div key={item._id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{item._id}</span>
                    <span className="font-mono text-emerald-400">{item.count} Selected</span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, (item.count / 20) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
              Placement statistics will populate as candidate applications are marked selected.
            </div>
          )}
        </div>
      </div>

      {/* ===== SKILL DEMAND VS SUPPLY (INTELLIGENCE LAYER) ===== */}
      <div className="card p-6 space-y-6 border-l-4 border-purple-500">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Sparkles size={20} className="text-amber-400" />
            Industry Skill Demand vs Student Talent Pool
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Comparison between required skills posted in active jobs versus skills present on student/alumni profiles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top In-Demand Skills */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-2)] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Briefcase size={14} /> Top Industry Demands (From Job Postings)
            </h3>
            {demand.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {demand.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs flex items-center gap-1.5 font-semibold"
                  >
                    <span>{s._id}</span>
                    <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded-full font-mono">
                      {s.count} jobs
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">No active job requirements aggregated yet.</p>
            )}
          </div>

          {/* Top Supplied Skills */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-2)] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Users size={14} /> Top Talent Pool Skills (From Member Profiles)
            </h3>
            {supply.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {supply.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs flex items-center gap-1.5 font-semibold"
                  >
                    <span>{s._id}</span>
                    <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded-full font-mono">
                      {s.count} members
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">No profile skills registered yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
