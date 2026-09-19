import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../lib/utils';

export default function VerifyEmailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const toast = useToast();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // If no email in state, user didn't come from login/register properly
  if (!state?.email) {
    return <Navigate to="/login" replace />;
  }

  const email = state.email;

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.some(isNaN)) return;
    
    const newOtp = [...otp];
    pastedData.forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    
    // Focus the appropriate input
    const inputs = document.querySelectorAll('.otp-input');
    const targetIndex = Math.min(pastedData.length, 5);
    if (inputs[targetIndex]) {
      inputs[targetIndex].focus();
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      return toast.error('Please enter the full 6-digit OTP.');
    }

    setLoading(true);
    try {
      // the auth context should have a method to handle this, or we call API and then refresh user
      await authAPI.verifyEmail({ email, otp: otpValue });
      toast.success('Email verified successfully!');
      // After verifying, they need to log in to get tokens if they don't have them
      navigate('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendOTP({ email });
      toast.success('A new OTP has been sent to your email.');
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
      <div className="orb orb-brand animate-float" style={{ width: 400, height: 400, top: -50, right: -100, opacity: 0.08 }} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        <div className="glass" style={{ borderRadius: 'var(--radius-2xl)', padding: 36, textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
          }}>
            <Mail size={32} className="text-brand-500" />
          </div>
          
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Check your email
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
            We've sent a 6-digit verification code to <br/>
            <strong style={{ color: 'var(--color-text-primary)' }}>{email}</strong>
          </p>

          {state?.devOtp && (
            <div className="mb-6 p-3 rounded-xl bg-primary/10 border border-primary/30 text-xs text-primary flex items-center justify-between">
              <span>Dev Mode OTP: <strong className="font-mono text-sm tracking-widest">{state.devOtp}</strong></span>
              <button
                type="button"
                onClick={() => setOtp(state.devOtp.split(''))}
                className="text-[11px] underline font-semibold hover:opacity-80"
              >
                Auto-fill
              </button>
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="flex justify-between gap-2 mb-8">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(e.target, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  className="input otp-input"
                  style={{
                    width: 48, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 600,
                    padding: 0, borderRadius: 'var(--radius-md)'
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
              onClick={handleResend}
              disabled={resending}
              style={{ color: 'var(--color-brand-500)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              {resending ? <RefreshCw size={14} className="animate-spin" /> : 'Resend OTP'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
