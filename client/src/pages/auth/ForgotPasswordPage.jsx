import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ChevronLeft, KeyRound } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getErrorMessage } from '../../lib/utils';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(data);
      toast.success('If an account exists, a reset code has been sent.', { title: 'Code Sent' });
      navigate('/reset-password', { state: { email: data.email } });
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
      <div className="orb orb-violet animate-float" style={{ width: 400, height: 400, top: -100, right: -100, opacity: 0.08 }} />
      <div className="orb orb-brand" style={{ width: 300, height: 300, bottom: -50, left: -50, opacity: 0.05 }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        <Link 
          to="/login" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24, fontWeight: 500 }}
          className="hover:text-brand-500 transition-colors"
        >
          <ChevronLeft size={16} /> Back to login
        </Link>

        <div className="glass" style={{ borderRadius: 'var(--radius-2xl)', padding: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: 'rgba(139, 92, 246, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24
          }}>
            <KeyRound size={28} className="text-violet-500" />
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Forgot Password?
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            No worries! Enter your email address and we'll send you a code to reset your password.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your registered email"
              icon={Mail}
              error={errors.email?.message}
              id="forgot-email"
              {...register('email')}
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Send Reset Code <ArrowRight size={18} />
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
