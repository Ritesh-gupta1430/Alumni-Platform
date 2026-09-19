import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { PageLoading } from './components/ui/Skeleton';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Main pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import NetworkPage from './pages/profile/NetworkPage';
import MessagesPage from './pages/profile/MessagesPage';
import NotificationsPage from './pages/profile/NotificationsPage';
import SettingsPage from './pages/profile/SettingsPage';
import VerificationPage from './pages/profile/VerificationPage';

// Career
import JobsPage from './pages/jobs/JobsPage';
import JobDetailPage from './pages/jobs/JobDetailPage';
import ApplicationsPage from './pages/jobs/ApplicationsPage';
import InternshipsPage from './pages/jobs/InternshipsPage';
import ReferralExchangePage from './pages/jobs/ReferralExchangePage';

// Mentorship
import MentorshipPage from './pages/mentorship/MentorshipPage';
import MentorProfilePage from './pages/mentorship/MentorProfilePage';
import MentorDashboardPage from './pages/mentorship/MentorDashboardPage';

// Community
import CommunitiesPage from './pages/community/CommunitiesPage';
import CommunityDetailPage from './pages/community/CommunityDetailPage';
import EventsPage from './pages/community/EventsPage';

// Projects & Stories & Collabs
import ProjectsPage from './pages/profile/ProjectsPage';
import StoriesPage from './pages/profile/StoriesPage';
import CollabHubPage from './pages/projects/CollabHubPage';

// Donations
import ContributionsPage from './pages/donations/ContributionsPage';
import CampaignDetailPage from './pages/donations/CampaignDetailPage';
import DonationReceiptPage from './pages/donations/DonationReceiptPage';

// AI
import AIToolsPage from './pages/ai/AIToolsPage';

// Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminVerificationPage from './pages/admin/AdminVerificationPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCampaignsPage from './pages/admin/AdminCampaignsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';

// Route Guards
import { VerificationGate } from './components/layout/VerificationGate';

function AuthGuard({ children }) {
  const { user, loading, initialized } = useAuth();
  if (!initialized || loading) return <PageLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminGuard({ children }) {
  const { user, loading, initialized } = useAuth();
  if (!initialized || loading) return <PageLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function GuestGuard({ children }) {
  const { user, loading, initialized } = useAuth();
  if (!initialized || loading) return <PageLoading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function VerifiedFeature({ children, name }) {
  return <VerificationGate featureName={name}>{children}</VerificationGate>;
}

function ProtectedLayout() {
  return (
    <AuthGuard>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AuthGuard>
  );
}

function AdminLayout() {
  return (
    <AdminGuard>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AdminGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Guest only */}
            <Route element={<GuestGuard><Outlet /></GuestGuard>}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Authenticated */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />
              <Route path="/profile/me" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/verification" element={<VerificationPage />} />

              {/* Verified Only Features */}
              <Route path="/network" element={<VerifiedFeature name="Alumni & Student Directory"><NetworkPage /></VerifiedFeature>} />
              <Route path="/messages" element={<VerifiedFeature name="Direct Messaging"><MessagesPage /></VerifiedFeature>} />

              {/* Career & Referrals */}
              <Route path="/referrals" element={<VerifiedFeature name="Alumni Referral Bridge"><ReferralExchangePage /></VerifiedFeature>} />
              <Route path="/jobs" element={<VerifiedFeature name="Job Portal & Applications"><JobsPage /></VerifiedFeature>} />
              <Route path="/jobs/:id" element={<VerifiedFeature name="Job Details"><JobDetailPage /></VerifiedFeature>} />
              <Route path="/internships" element={<VerifiedFeature name="Internships"><InternshipsPage /></VerifiedFeature>} />
              <Route path="/applications" element={<VerifiedFeature name="My Applications"><ApplicationsPage /></VerifiedFeature>} />

              {/* Mentorship */}
              <Route path="/mentorship" element={<VerifiedFeature name="Mentorship Hub"><MentorshipPage /></VerifiedFeature>} />
              <Route path="/mentorship/mentor/:mentorId" element={<VerifiedFeature name="Mentor Profile"><MentorProfilePage /></VerifiedFeature>} />
              <Route path="/mentorship/mentor" element={<VerifiedFeature name="Mentor Dashboard"><MentorDashboardPage /></VerifiedFeature>} />

              {/* Community */}
              <Route path="/communities" element={<VerifiedFeature name="Communities"><CommunitiesPage /></VerifiedFeature>} />
              <Route path="/communities/:id" element={<VerifiedFeature name="Community Discussions"><CommunityDetailPage /></VerifiedFeature>} />
              <Route path="/events" element={<VerifiedFeature name="Campus Events"><EventsPage /></VerifiedFeature>} />

              {/* Projects, Stories & Collab Labs */}
              <Route path="/collab-hub" element={<VerifiedFeature name="Collab Labs & Startup Gigs"><CollabHubPage /></VerifiedFeature>} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/stories" element={<StoriesPage />} />

              {/* Contributions */}
              <Route path="/contributions" element={<VerifiedFeature name="Institutional Giving"><ContributionsPage /></VerifiedFeature>} />
              <Route path="/contributions/:id" element={<VerifiedFeature name="Campaign Details"><CampaignDetailPage /></VerifiedFeature>} />
              <Route path="/contributions/receipt/:donationId" element={<DonationReceiptPage />} />

              {/* AI Tools */}
              <Route path="/ai" element={<VerifiedFeature name="AI Career Tools"><AIToolsPage /></VerifiedFeature>} />
            </Route>

            {/* Admin only */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="verification" element={<AdminVerificationPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="campaigns" element={<AdminCampaignsPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
