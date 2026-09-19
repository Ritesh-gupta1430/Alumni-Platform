import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      setInitialized(true);
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data.user);
      setProfile(data.data.profile);
    } catch {
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (credentials) => {
    const { data } = await authAPI.login(credentials);
    const { accessToken, user: loggedInUser } = data.data;
    localStorage.setItem('accessToken', accessToken);
    setUser(loggedInUser);
    // Fetch full profile
    try {
      const me = await authAPI.getMe();
      setUser(me.data.data.user);
      setProfile(me.data.data.profile);
    } catch {}
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {}
    localStorage.removeItem('accessToken');
    setUser(null);
    setProfile(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateProfile = useCallback((updates) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const refreshUser = useCallback(() => fetchMe(), [fetchMe]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isAlumni = user?.role === 'ALUMNI';
  const isStudent = user?.role === 'STUDENT';
  const isFaculty = user?.role === 'FACULTY';
  const isRecruiter = user?.role === 'RECRUITER';
  const isActive = user?.accountStatus === 'active';
  const isPendingVerification = user?.accountStatus === 'pending_verification';
  const isPendingEmail = user?.accountStatus === 'pending_email';
  const isVerified = user?.verificationStatus === 'approved';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        initialized,
        login,
        logout,
        updateUser,
        updateProfile,
        refreshUser,
        isAdmin,
        isAlumni,
        isStudent,
        isFaculty,
        isRecruiter,
        isActive,
        isPendingVerification,
        isPendingEmail,
        isVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
