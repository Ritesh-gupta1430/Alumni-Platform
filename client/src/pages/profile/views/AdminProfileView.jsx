import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Users,
  CheckCircle2,
  Heart,
  Briefcase,
  Settings,
  Lock,
  Layers
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export function AdminProfileView({
  user,
  profile,
  isOwnProfile
}) {
  const adminModules = [
    { name: 'Alumni & Student Verification Queue', path: '/admin/verification', icon: ShieldCheck, count: 'Pending Review' },
    { name: 'Institutional User Directory Management', path: '/admin/users', icon: Users, count: 'Active Oversight' },
    { name: 'Impact Campaigns & Institutional Funds', path: '/admin/campaigns', icon: Heart, count: 'Active' },
    { name: 'Platform Analytics & Engagement Engine', path: '/admin/analytics', icon: BarChart3, count: 'Real-time' },
  ];

  return (
    <div className="space-y-6">
      {/* ===== 1. ADMIN GOVERNANCE HERO ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Governance Overview */}
        <div className="card p-6 md:col-span-2 space-y-4 border border-cyan-500/20 bg-gradient-to-br from-[var(--color-surface-1)] via-[var(--color-surface-2)] to-cyan-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">Institutional Governance & Administration</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">TCET AlumNetra System Administrator</p>
              </div>
            </div>
            <span className="badge badge-cyan">
              {user.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Platform Admin'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Access Scope</span>
              <strong className="text-cyan-400 block font-bold">Full Institutional</strong>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Department</span>
              <strong className="text-[var(--color-text-primary)] block truncate">{user.department || 'Institute Administration'}</strong>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Security Level</span>
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <Lock size={12} /> Elevated
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">System Health</span>
              <span className="text-emerald-400 font-bold block">🟢 Operational</span>
            </div>
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="card p-5 space-y-4 border border-cyan-500/20 bg-[var(--color-surface-1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Settings size={18} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Admin Control Center</h3>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Access the master administrative panels to review incoming student/alumni submissions and platform metrics.
            </p>
          </div>

          <Link to="/admin" className="btn btn-primary btn-sm w-full flex items-center justify-center gap-2 text-xs">
            <BarChart3 size={14} /> Open Admin Dashboard
          </Link>
        </div>
      </div>

      {/* ===== 2. MANAGED MODULES & ADMINISTRATIVE TOOLS ===== */}
      <div className="card p-6 space-y-4 border border-[var(--color-surface-border)]">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-cyan-400" />
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">Administrative Modules & Control Shortcuts</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {adminModules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <Link
                key={idx}
                to={mod.path}
                className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-[var(--color-surface-3)] text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-text-primary)] group-hover:text-cyan-400 transition-colors">
                      {mod.name}
                    </h4>
                    <span className="text-[11px] text-[var(--color-text-muted)]">{mod.count}</span>
                  </div>
                </div>

                <Button variant="ghost" size="sm" className="text-xs shrink-0 group-hover:translate-x-1 transition-transform">
                  Manage →
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
