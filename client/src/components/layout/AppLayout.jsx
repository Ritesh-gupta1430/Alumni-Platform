import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, GraduationCap, Briefcase, Heart, MessageCircle,
  Bell, Settings, LogOut, BookOpen, Trophy, Users2, CalendarDays,
  Search, ChevronRight, Sparkles, BarChart3, Shield, X, Menu, Rocket, Award,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { Avatar } from '../ui/Avatar';
import { VerificationBadge, RoleBadge } from '../ui/Badge';
import { notificationsAPI } from '../../services/api';
import { getInitials } from '../../lib/utils';
import AIAssistantWidget from '../ui/AIAssistantWidget';

function NavItem({ to, icon: Icon, label, badge, onClick }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon size={18} />
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span
          style={{
            background: 'var(--color-accent-rose)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 999,
            minWidth: 18,
            textAlign: 'center',
          }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  );
}

function NavSection({ title, children }) {
  return (
    <div>
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          padding: '0 16px',
          marginBottom: 6,
          marginTop: 4,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

export function Sidebar({ mobileOpen, onClose }) {
  const { user, profile, logout, isAdmin, isAlumni, isStudent, isFaculty, isRecruiter } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  // Role detection helpers
  const userRole = user?.role;
  const isRecruiterRole = isRecruiter || userRole === 'RECRUITER';
  const isStudentRole = isStudent || userRole === 'STUDENT';
  const isAlumniRole = isAlumni || userRole === 'ALUMNI';
  const isFacultyRole = isFaculty || userRole === 'FACULTY';
  const isAdminRole = isAdmin || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  useEffect(() => {
    if (user?.accountStatus !== 'active') return;

    notificationsAPI.getUnreadCount()
      .then(({ data }) => setUnreadCount(data.data.count))
      .catch(() => {});

    // Poll every 45 seconds if active
    const interval = setInterval(() => {
      if (user?.accountStatus === 'active') {
        notificationsAPI.getUnreadCount()
          .then(({ data }) => setUnreadCount(data.data.count))
          .catch(() => {});
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const sidebarContent = (
    <div
      style={{
        background: 'var(--color-surface-0)',
        borderRight: '1px solid var(--color-surface-border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 256,
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--color-surface-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <NavLink to="/dashboard" className="flex items-center gap-2.5">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
            }}
          >
            <GraduationCap size={20} color="#fff" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--color-text-primary)', lineHeight: 1 }}>
              AlumNetra
            </p>
            <p style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              TCET Network
            </p>
          </div>
        </NavLink>
        {mobileOpen && (
          <button onClick={onClose} className="btn btn-ghost btn-sm rounded-full lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* User Card */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-surface-border)',
        }}
      >
        <NavLink to="/profile/me" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Avatar
            src={user?.profilePhoto}
            firstName={user?.firstName}
            lastName={user?.lastName}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }} className="truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                isRecruiterRole ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                isAdminRole ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                isAlumniRole ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                isFacultyRole ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {user?.role || 'Member'}
              </span>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }} className="truncate">
                {user?.department || (isRecruiterRole ? 'Corporate' : '')}
              </span>
            </div>
          </div>
          <ChevronRight size={14} color="var(--color-text-muted)" />
        </NavLink>

        {/* Profile completion */}
        {!isRecruiterRole && profile?.completionPercentage < 90 && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Profile Completion</span>
              <span style={{ fontSize: 10, color: 'var(--color-brand-400)', fontWeight: 600 }}>
                {profile?.completionPercentage || 0}%
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${profile?.completionPercentage || 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Role-Specific Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={onClose} />
        <NavItem
          to="/network"
          icon={Users}
          label={isRecruiterRole ? "Talent Directory" : "Network"}
          onClick={onClose}
        />
        <NavItem to="/messages" icon={MessageCircle} label="Messages" onClick={onClose} />
        <NavItem to="/notifications" icon={Bell} label="Notifications" badge={unreadCount} onClick={onClose} />

        {/* RECRUITER SPECIFIC NAVIGATION */}
        {isRecruiterRole && (
          <>
            <div style={{ height: 8 }} />
            <NavSection title="Hiring & Recruitment">
              <NavItem to="/jobs" icon={Briefcase} label="Post & Manage Jobs" onClick={onClose} />
              <NavItem to="/internships" icon={BookOpen} label="Campus Internships" onClick={onClose} />
              <NavItem to="/events" icon={CalendarDays} label="Recruitment Webinars" onClick={onClose} />
            </NavSection>

            <div style={{ height: 8 }} />
            <NavSection title="Talent Discovery">
              <NavItem to="/projects" icon={Trophy} label="Student Projects" onClick={onClose} />
              <NavItem to="/collab-hub" icon={Rocket} label="Collab Labs" onClick={onClose} />
              <NavItem to="/communities" icon={Users2} label="Communities" onClick={onClose} />
            </NavSection>
          </>
        )}

        {/* STUDENT SPECIFIC NAVIGATION */}
        {isStudentRole && (
          <>
            <div style={{ height: 8 }} />
            <NavSection title="Career & Jobs">
              <NavItem to="/referrals" icon={Award} label="Referral Bridge" onClick={onClose} />
              <NavItem to="/jobs" icon={Briefcase} label="Job Openings" onClick={onClose} />
              <NavItem to="/internships" icon={BookOpen} label="Internships" onClick={onClose} />
              <NavItem to="/applications" icon={ChevronRight} label="My Applications" onClick={onClose} />
            </NavSection>

            <div style={{ height: 8 }} />
            <NavSection title="Growth & Learning">
              <NavItem to="/mentorship" icon={GraduationCap} label="Find a Mentor" onClick={onClose} />
              <NavItem to="/collab-hub" icon={Rocket} label="Collab Labs" onClick={onClose} />
              <NavItem to="/projects" icon={Trophy} label="Project Showcase" onClick={onClose} />
              <NavItem to="/ai" icon={Sparkles} label="AI Career Tools" onClick={onClose} />
            </NavSection>

            <div style={{ height: 8 }} />
            <NavSection title="Campus Community">
              <NavItem to="/communities" icon={Users2} label="Communities" onClick={onClose} />
              <NavItem to="/events" icon={CalendarDays} label="Events & Meets" onClick={onClose} />
              <NavItem to="/stories" icon={BookOpen} label="Alumni Stories" onClick={onClose} />
            </NavSection>
          </>
        )}

        {/* ALUMNI SPECIFIC NAVIGATION */}
        {isAlumniRole && (
          <>
            <div style={{ height: 8 }} />
            <NavSection title="Referrals & Jobs">
              <NavItem to="/referrals" icon={Award} label="Referral Bridge" onClick={onClose} />
              <NavItem to="/jobs" icon={Briefcase} label="Job Board" onClick={onClose} />
              <NavItem to="/internships" icon={BookOpen} label="Internships" onClick={onClose} />
            </NavSection>

            <div style={{ height: 8 }} />
            <NavSection title="Mentorship & Giving Back">
              <NavItem to="/mentorship/mentor" icon={GraduationCap} label="Mentor Dashboard" onClick={onClose} />
              <NavItem to="/mentorship" icon={GraduationCap} label="Mentorship Hub" onClick={onClose} />
              <NavItem to="/projects" icon={Trophy} label="Student Projects" onClick={onClose} />
              <NavItem to="/collab-hub" icon={Rocket} label="Collab Gigs" onClick={onClose} />
              <NavItem to="/contributions" icon={Heart} label="Alumni Contributions" onClick={onClose} />
            </NavSection>

            <div style={{ height: 8 }} />
            <NavSection title="Alumni Network">
              <NavItem to="/communities" icon={Users2} label="Communities" onClick={onClose} />
              <NavItem to="/events" icon={CalendarDays} label="Meets & Reunions" onClick={onClose} />
              <NavItem to="/stories" icon={BookOpen} label="Alumni Stories" onClick={onClose} />
            </NavSection>
          </>
        )}

        {/* FACULTY SPECIFIC NAVIGATION */}
        {isFacultyRole && (
          <>
            <div style={{ height: 8 }} />
            <NavSection title="Academic & Mentorship">
              <NavItem to="/mentorship/mentor" icon={GraduationCap} label="Faculty Mentorship" onClick={onClose} />
              <NavItem to="/projects" icon={Trophy} label="Student Projects Review" onClick={onClose} />
              <NavItem to="/collab-hub" icon={Rocket} label="Collab Labs & Research" onClick={onClose} />
            </NavSection>

            <div style={{ height: 8 }} />
            <NavSection title="Campus & Events">
              <NavItem to="/communities" icon={Users2} label="Communities" onClick={onClose} />
              <NavItem to="/events" icon={CalendarDays} label="Events & Workshops" onClick={onClose} />
              <NavItem to="/contributions" icon={Heart} label="Institutional Funds" onClick={onClose} />
            </NavSection>
          </>
        )}

        {/* ADMIN / SUPER_ADMIN NAVIGATION */}
        {isAdminRole && (
          <>
            <div style={{ height: 8 }} />
            <NavSection title="Admin Controls">
              <NavItem to="/admin" icon={BarChart3} label="Admin Dashboard" onClick={onClose} />
              <NavItem to="/admin/verification" icon={Shield} label="Verification Queue" onClick={onClose} />
              <NavItem to="/admin/users" icon={Users} label="User Management" onClick={onClose} />
              <NavItem to="/admin/campaigns" icon={Heart} label="Campaigns" onClick={onClose} />
              <NavItem to="/admin/analytics" icon={BarChart3} label="Analytics" onClick={onClose} />
            </NavSection>

            <div style={{ height: 8 }} />
            <NavSection title="All Platform Modules">
              <NavItem to="/referrals" icon={Award} label="Referrals" onClick={onClose} />
              <NavItem to="/jobs" icon={Briefcase} label="Jobs & Internships" onClick={onClose} />
              <NavItem to="/communities" icon={Users2} label="Communities" onClick={onClose} />
              <NavItem to="/events" icon={CalendarDays} label="Events" onClick={onClose} />
              <NavItem to="/projects" icon={Trophy} label="Projects" onClick={onClose} />
            </NavSection>
          </>
        )}
      </nav>

      {/* Bottom Actions */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid var(--color-surface-border)',
          display: 'flex',
          gap: 8,
        }}
      >
        <NavItem to="/settings" icon={Settings} label="Settings" onClick={onClose} />
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="sidebar-nav-item hover:text-[var(--color-accent-rose)] w-full"
          style={{ flex: 1 }}
          id="logout-btn"
        >
          {loggingOut ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <LogOut size={18} />}
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 z-90 lg:hidden"
              style={{ backdropFilter: 'blur(4px)', zIndex: 90 }}
            />
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 30 }}
              className="lg:hidden"
              style={{ zIndex: 100 }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function TopBar({ onMenuToggle }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/network?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header
      style={{
        height: 60,
        borderBottom: '1px solid var(--color-surface-border)',
        background: 'rgba(13, 18, 33, 0.9)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="btn btn-ghost btn-sm rounded-full mobile-menu-trigger lg:hidden"
        aria-label="Toggle menu"
        id="mobile-menu-btn"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative flex items-center">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none flex items-center justify-center z-10">
            <Search size={16} />
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alumni, students, skills..."
            className="input has-left-icon"
            style={{ paddingLeft: 42, height: 38, fontSize: 13 }}
            id="global-search"
          />
        </div>
      </form>

      <div className="flex-1" />

      {/* Quick actions */}
      <NavLink to="/notifications" className="relative btn btn-ghost btn-sm rounded-full" id="notif-bell">
        <Bell size={20} />
      </NavLink>
    </header>
  );
}

export function AppLayout({ children }) {
  const { user, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-surface-0)' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: 0 }} className="lg:ml-64">
        <TopBar onMenuToggle={() => setMobileOpen(true)} />
        
        {/* Verification Alert Banner for Unverified Accounts */}
        {user?.accountStatus === 'pending_verification' && !isAdmin && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>
                <strong>Account Pending Institutional Verification:</strong> Please upload your student ID / admission proof to unlock all messaging, job applications, and mentorship features.
              </span>
            </div>
            <NavLink to="/settings/verification" className="underline font-bold text-amber-200 hover:text-white shrink-0">
              Submit Verification Documents →
            </NavLink>
          </div>
        )}

        <main style={{ flex: 1, padding: '24px' }}>
          {children}
        </main>
      </div>

      {/* Global Floating Institutional AI Assistant */}
      <AIAssistantWidget />
    </div>
  );
}
