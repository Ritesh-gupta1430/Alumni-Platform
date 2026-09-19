import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getErrorMessage } from '../../lib/utils';

const schema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function ResetPasswordPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  // If no email in state, redirect to forgot password
  if (!state?.email) {
    return <Navigate to="/forgot-password" replace />;
  }

  const email = state.email;

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authAPI.resetPassword({
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      toast.success('Password reset successfully! You can now log in.', { title: 'Success' });
      navigate('/login');
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
      <div className="orb orb-emerald animate-float" style={{ width: 400, height: 400, top: -100, right: -100, opacity: 0.08 }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        <div className="glass" style={{ borderRadius: 'var(--radius-2xl)', padding: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
          }}>
            <Lock size={28} className="text-emerald-500" />
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
            Set New Password
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.5, textAlign: 'center' }}>
            Enter the 6-digit code sent to <br/>
            <strong>{email}</strong>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="6-Digit Reset Code"
              placeholder="123456"
              maxLength={6}
              error={errors.otp?.message}
              id="reset-otp"
              {...register('otp')}
            />

            <div>
              <label className="label">New Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none flex items-center justify-center z-10">
                  <Lock size={18} />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className={`input has-left-icon has-right-icon ${errors.newPassword ? 'input-error' : ''}`}
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                  id="reset-new-password"
                  {...register('newPassword')}
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
              {errors.newPassword && (
                <p style={{ fontSize: 12, color: 'var(--color-error)', marginTop: 4 }}>{errors.newPassword.message}</p>
              )}
            </div>

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter password"
              icon={Lock}
              error={errors.confirmPassword?.message}
              id="reset-confirm-password"
              {...register('confirmPassword')}
            />

            <Button type="submit" loading={loading} className="w-full" size="lg" style={{ marginTop: 24 }}>
              Reset Password <CheckCircle2 size={18} />
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
