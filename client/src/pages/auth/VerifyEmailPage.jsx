import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ShieldCheck, ArrowRight, RefreshCw, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getErrorMessage } from '../../lib/utils';

export default function VerifyEmailPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const toast = useToast();

  const queryEmail = searchParams.get('email') || '';
  const stateEmail = location.state?.email || '';
  const [email, setEmail] = useState(stateEmail || queryEmail);
  const [devOtp, setDevOtp] = useState(location.state?.devOtp || '');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    // If multiple characters typed or pasted directly in a single input
    if (value.length > 1) {
      const chars = value.replace(/\D/g, '').slice(0, 6).split('');
      chars.forEach((c, idx) => {
        newOtp[idx] = c;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(chars.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);

    const targetIndex = Math.min(pasted.length, 5);
    inputRefs.current[targetIndex]?.focus();
  };

  const autofillDevOtp = (code) => {
    if (!code) return;
    const digits = String(code).slice(0, 6).split('');
    const newOtp = [...otp];
    digits.forEach((d, idx) => {
      newOtp[idx] = d;
    });
    setOtp(newOtp);
    inputRefs.current[5]?.focus();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      return toast.error('Please provide your email address.');
    }

    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      return toast.error('Please enter the full 6-digit OTP.');
    }

    setLoading(true);
    try {
      const res = await authAPI.verifyEmail({ email: email.trim(), otp: otpValue });
      toast.success(res.data?.message || 'Email verified successfully!', { title: 'Welcome! 🎉' });

      // If session tokens returned, auto login
      if (res.data?.data?.accessToken) {
        localStorage.setItem('accessToken', res.data.data.accessToken);
        await refreshUser();
        navigate('/settings/verification');
      } else {
        navigate('/login');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      return toast.error('Please enter your email address first.');
    }
    if (countdown > 0 || resending) return;

    setResending(true);
    try {
      const res = await authAPI.resendOTP({ email: email.trim(), purpose: 'email_verification' });
      toast.success(res.data?.message || 'A new OTP has been sent to your email.', { title: 'Code Sent 📨' });
      if (res.data?.data?.devOtp) {
        setDevOtp(res.data.data.devOtp);
      }
      setCountdown(30);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResending(false);
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
      <div className="orb orb-brand animate-float" style={{ width: 450, height: 450, top: -50, right: -100, opacity: 0.08 }} />
      <div className="orb orb-gold animate-float" style={{ width: 350, height: 350, bottom: -50, left: -100, opacity: 0.06 }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        <Link
          to="/login"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20, fontWeight: 500 }}
          className="hover:text-brand-500 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        <div className="glass" style={{ borderRadius: 'var(--radius-2xl)', padding: 36, textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(37, 99, 235, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Mail size={32} className="text-brand-500" />
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Verify your Email
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
            We've sent a 6-digit verification code to
          </p>

          {/* Email display / fallback input */}
          <div style={{ marginBottom: 20 }}>
            {stateEmail || queryEmail ? (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  display: 'inline-block',
                  fontWeight: 600,
                  fontSize: 15,
                  color: 'var(--color-text-primary)',
                  wordBreak: 'break-all',
                }}
              >
                {email}
              </div>
            ) : (
              <Input
                placeholder="Enter your registered email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                id="verify-email-input"
              />
            )}
          </div>

          {/* Dev Mode OTP Banner */}
          {devOtp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} /> Dev OTP: <strong className="font-mono text-sm tracking-widest text-blue-300">{devOtp}</strong>
              </span>
              <button
                type="button"
                onClick={() => autofillDevOtp(devOtp)}
                className="px-2.5 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Auto-fill
              </button>
            </motion.div>
          )}

          <form onSubmit={onSubmit}>
            <div className="flex justify-between gap-2 mb-6" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="input otp-input"
                  style={{
                    width: 48,
                    height: 56,
                    textAlign: 'center',
                    fontSize: 24,
                    fontWeight: 700,
                    padding: 0,
                    borderRadius: 'var(--radius-md)',
                  }}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Verify Email <ShieldCheck size={18} />
            </Button>
          </form>

          <div style={{ marginTop: 24, fontSize: 14 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Didn't receive the code? </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || countdown > 0}
              style={{
                color: countdown > 0 ? 'var(--color-text-muted)' : 'var(--color-brand-400)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                background: 'transparent',
                border: 'none',
              }}
            >
              {resending ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                'Resend OTP'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
