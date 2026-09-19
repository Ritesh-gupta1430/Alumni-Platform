import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, User, Mail, Lock, Building, BookOpen, Hash, ChevronRight, ChevronLeft, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { getErrorMessage, DEPARTMENTS, YEARS, CURRENT_YEARS } from '../../lib/utils';

const ROLES = [
  { value: 'STUDENT', label: 'Current Student' },
  { value: 'ALUMNI', label: 'Alumni' },
  { value: 'FACULTY', label: 'Faculty Member' },
  { value: 'RECRUITER', label: 'Recruiter / HR' },
];

const step1Schema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['STUDENT', 'ALUMNI', 'FACULTY', 'RECRUITER']),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const step2Schema = z.object({
  department: z.string().min(1, 'Department required'),
  course: z.string().optional(),
  admissionYear: z.coerce.number().optional(),
  graduationYear: z.coerce.number().min(1990).max(2040).optional(),
  currentYear: z.coerce.number().optional(),
  rollNumber: z.string().optional(),
  prnNumber: z.string().optional(),
  collegeEmail: z.string().email().optional().or(z.literal('')),
});

export default function RegisterPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const form1 = useForm({ resolver: zodResolver(step1Schema) });
  const form2 = useForm({ resolver: zodResolver(step2Schema) });

  const onStep1 = (data) => {
    setStep1Data(data);
    setStep(2);
  };

  const onStep2 = async (data) => {
    setLoading(true);
    const { confirmPassword, ...rest } = step1Data;
    const payload = {
      ...rest,
      ...data,
      admissionYear: data.admissionYear || undefined,
      graduationYear: data.graduationYear || undefined,
      currentYear: data.currentYear || undefined,
      collegeEmail: data.collegeEmail || undefined,
    };

    try {
      const res = await authAPI.register(payload);
      toast.success('Registration successful! Check your email for the OTP.', { title: 'Account Created 🎉' });
      navigate('/verify-email', { state: { email: rest.email, devOtp: res.data?.data?.devOtp } });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const currentRole = step1Data?.role || form1.watch('role');
  const isStudent = currentRole === 'STUDENT';
  const isAlumni = currentRole === 'ALUMNI';

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
      {/* Orbs */}
      <div className="orb orb-brand" style={{ width: 600, height: 600, top: -200, left: -100, opacity: 0.07 }} />
      <div className="orb orb-gold" style={{ width: 400, height: 400, bottom: -100, right: -100, opacity: 0.06 }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(37,99,235,0.4)' }}>
              <GraduationCap size={24} color="#fff" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>Join AlumNetra</h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            TCET's verified alumni and student network
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`step ${step >= 1 ? 'active' : 'pending'}`}>{step > 1 ? '✓' : '1'}</div>
          <div className={`step-connector ${step >= 2 ? 'active' : ''}`} />
          <div className={`step ${step === 2 ? 'active' : 'pending'}`}>2</div>
          <div className="step-connector" />
          <div className="step pending">3</div>
        </div>

        <div className="glass" style={{ borderRadius: 'var(--radius-2xl)', padding: 32 }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={form1.handleSubmit(onStep1)}
                className="space-y-4"
              >
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                  Basic Information
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    placeholder="Rahul"
                    icon={User}
                    required
                    error={form1.formState.errors.firstName?.message}
                    id="reg-firstname"
                    {...form1.register('firstName')}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Sharma"
                    required
                    error={form1.formState.errors.lastName?.message}
                    id="reg-lastname"
                    {...form1.register('lastName')}
                  />
                </div>

                <Select
                  label="I am a..."
                  required
                  error={form1.formState.errors.role?.message}
                  id="reg-role"
                  {...form1.register('role')}
                >
                  <option value="">Select your role</option>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </Select>

                <Input
                  label="Email"
                  type="email"
                  placeholder="rahul.sharma@gmail.com"
                  icon={Mail}
                  required
                  error={form1.formState.errors.email?.message}
                  id="reg-email"
                  {...form1.register('email')}
                />

                <div>
                  <label className="label">Password <span style={{ color: 'var(--color-accent-rose)' }}>*</span></label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none flex items-center justify-center z-10">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      className={`input has-left-icon has-right-icon ${form1.formState.errors.password ? 'input-error' : ''}`}
                      style={{ paddingLeft: 42, paddingRight: 42 }}
                      id="reg-password"
                      {...form1.register('password')}
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
                  {form1.formState.errors.password && (
                    <p style={{ fontSize: 12, color: 'var(--color-error)', marginTop: 4 }}>{form1.formState.errors.password.message}</p>
                  )}
                </div>

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  icon={Lock}
                  required
                  error={form1.formState.errors.confirmPassword?.message}
                  id="reg-confirm-password"
                  {...form1.register('confirmPassword')}
                />

                <Button type="submit" className="w-full" size="lg" id="reg-next-btn">
                  Next Step <ChevronRight size={18} />
                </Button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={form2.handleSubmit(onStep2)}
                className="space-y-4"
              >
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                  College Details
                </p>

                <Select
                  label="Department"
                  required
                  error={form2.formState.errors.department?.message}
                  id="reg-department"
                  {...form2.register('department')}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>

                <Input
                  label="Course"
                  placeholder="B.E. Computer Engineering"
                  icon={BookOpen}
                  id="reg-course"
                  {...form2.register('course')}
                />

                <div className="grid grid-cols-2 gap-3">
                  {(isStudent || isAlumni) && (
                    <Select label="Admission Year" id="reg-admission" {...form2.register('admissionYear')}>
                      <option value="">Year</option>
                      {YEARS.slice(0, 20).map((y) => <option key={y} value={y}>{y}</option>)}
                    </Select>
                  )}
                  <Select label="Graduation Year" id="reg-grad" {...form2.register('graduationYear')}>
                    <option value="">Year</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    {[new Date().getFullYear() + 1, new Date().getFullYear() + 2, new Date().getFullYear() + 3].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Select>
                </div>

                {isStudent && (
                  <div className="grid grid-cols-2 gap-3">
                    <Select label="Current Year" id="reg-current-year" {...form2.register('currentYear')}>
                      <option value="">Year</option>
                      {CURRENT_YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                    </Select>
                    <Input label="Division" placeholder="A / B / C" id="reg-division" {...form2.register('division')} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Roll Number"
                    placeholder="20ABCD1234"
                    icon={Hash}
                    id="reg-roll"
                    {...form2.register('rollNumber')}
                  />
                  <Input
                    label="PRN Number"
                    placeholder="Enter PRN"
                    id="reg-prn"
                    {...form2.register('prnNumber')}
                  />
                </div>

                <Input
                  label="College Email (optional)"
                  type="email"
                  placeholder="name@tcetmumbai.in"
                  icon={Mail}
                  hint="Speeds up verification"
                  id="reg-college-email"
                  {...form2.register('collegeEmail')}
                />

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(1)} type="button" size="lg" id="reg-back-btn">
                    <ChevronLeft size={18} /> Back
                  </Button>
                  <Button type="submit" loading={loading} className="flex-1" size="lg" id="reg-submit-btn">
                    Create Account <ArrowRight size={18} />
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-brand-400)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
