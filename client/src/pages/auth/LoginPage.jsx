import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getErrorMessage } from '../../lib/utils';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await login(data);
      toast.success('Welcome back!', { title: 'Logged in' });

      if (user.accountStatus === 'pending_email') {
        navigate('/verify-email', { state: { email: data.email } });
      } else if (user.accountStatus === 'pending_verification') {
        navigate('/settings/verification');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-surface-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background orbs */}
      <div className="orb orb-brand animate-float" style={{ width: 500, height: 500, top: -100, right: -100, opacity: 0.08 }} />
      <div className="orb orb-violet" style={{ width: 400, height: 400, bottom: -100, left: -100, opacity: 0.06 }} />
      <div className="orb orb-emerald" style={{ width: 300, height: 300, bottom: 100, right: 100, opacity: 0.05 }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 32px rgba(37, 99, 235, 0.4)',
            }}
          >
            <GraduationCap size={32} color="#fff" />
          </motion.div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Welcome back to AlumNetra
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 6 }}>
            TCET's trusted alumni & student network
          </p>
        </div>

        {searchParams.get('expired') && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: 20,
              fontSize: 13,
              color: '#fbbf24',
            }}
          >
            ⏱️ Your session has expired. Please log in again.
          </div>
        )}

        {/* Card */}
        <div
          className="glass"
          style={{ borderRadius: 'var(--radius-2xl)', padding: 32 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="your.email@example.com"
              icon={Mail}
              error={errors.email?.message}
              id="login-email"
              autoComplete="email"
              {...register('email')}
            />

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="label">Password</label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--color-brand-400)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none flex items-center justify-center z-10">
                  <Lock size={18} />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`input has-left-icon has-right-icon ${errors.password ? 'input-error' : ''}`}
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                  id="login-password"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors flex items-center justify-center z-10"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
              id="login-submit-btn"
            >
              Sign In <ArrowRight size={18} />
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--color-text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-brand-400)', fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </div>

        {/* Trust indicators */}
        <div style={{ marginTop: 24, display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['✓ TCET Verified Network', '✓ Secure & Private', '✓ 100% Free'].map((text) => (
            <span key={text} style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{text}</span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
