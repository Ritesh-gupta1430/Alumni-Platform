import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  DollarSign,
  Users,
  Calendar,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Award,
  Building,
  Target
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { donationsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate, timeAgo } from '../../lib/utils';

export default function CampaignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [campaign, setCampaign] = useState(null);
  const [recentDonors, setRecentDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Contribute Modal State
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [amount, setAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchCampaignDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await donationsAPI.getCampaign(id);
      setCampaign(res.data.data.campaign);
      setRecentDonors(res.data.data.recentDonors || []);
    } catch (err) {
      toast.error('Failed to load campaign details.');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchCampaignDetail();
  }, [fetchCampaignDetail]);

  const handleDonate = async (e) => {
    e.preventDefault();
    const finalAmount = customAmount ? Number(customAmount) : amount;
    if (!finalAmount || finalAmount < 1) {
      toast.error('Please specify a valid contribution amount.');
      return;
    }

    setProcessing(true);
    try {
      // 1. Initiate Contribution on Backend
      const initRes = await donationsAPI.contribute(id, {
        amount: finalAmount,
        isAnonymous,
        notes,
      });

      const { donation, payment } = initRes.data.data;
      const donationId = donation.donationId;

      // 2. Open Razorpay Checkout if SDK is available and provider is razorpay
      if (typeof window.Razorpay === 'function' && payment && payment.provider === 'razorpay' && payment.key) {
        const options = {
          key: payment.key,
          amount: payment.amount,
          currency: payment.currency || 'INR',
          name: 'AlumNetra TCET Giving',
          description: campaign.title,
          order_id: payment.orderId,
          prefill: {
            name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'TCET Supporter',
            email: user?.email || '',
          },
          theme: {
            color: '#e11d48',
          },
          handler: async function (response) {
            try {
              setProcessing(true);
              await donationsAPI.verifyPayment(donationId, {
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                orderId: response.razorpay_order_id,
              });

              toast.success('🎉 Thank you for your generous contribution!');
              setShowContributeModal(false);
              navigate(`/contributions/receipt/${donationId}`);
            } catch (err) {
              toast.error(err.response?.data?.message || 'Payment verification failed.');
            } finally {
              setProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
              toast.info('Payment window closed.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          toast.error(`Payment failed: ${resp.error?.description || 'Transaction declined.'}`);
          setProcessing(false);
        });
        rzp.open();
        return;
      }

      // Fallback: Instant Sandbox / Mock Verification
      await donationsAPI.verifyPayment(donationId, {
        paymentId: `pay_mock_${Date.now()}`,
        signature: `mock_sig_${Date.now()}`,
      });

      toast.success('🎉 Thank you for your generous contribution!');
      setShowContributeModal(false);
      navigate(`/contributions/receipt/${donationId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto mt-12">
        <Heart className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-40" />
        <h2 className="text-xl font-bold mb-2">Campaign Not Found</h2>
        <Button onClick={() => navigate('/contributions')} variant="primary" className="mt-4">
          All Giving Campaigns
        </Button>
      </div>
    );
  }

  const percentage = Math.min(
    100,
    Math.round(((campaign.raisedAmount || 0) / (campaign.goalAmount || 1)) * 100)
  );

  const presets = [1000, 2500, 5000, 10000, 25000];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Back button */}
      <button
        onClick={() => navigate('/contributions')}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ChevronLeft size={16} /> Back to campaigns
      </button>

      {/* Hero Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 sm:p-8 space-y-6 border-l-4 border-rose-500 bg-gradient-to-r from-rose-500/5 to-transparent relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <span className="badge badge-rose capitalize text-[10px]">
              {campaign.category?.replace('_', ' ') || 'Cause'}
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
              {campaign.title}
            </h1>

            <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
              <Building size={14} className="text-blue-400" /> Beneficiary: {campaign.beneficiary || 'TCET Students'}
              {campaign.endDate && ` • Deadline: ${formatDate(campaign.endDate, 'MMMM d, yyyy')}`}
            </p>
          </div>

          <Button
            onClick={() => setShowContributeModal(true)}
            variant="primary"
            size="lg"
            className="w-full md:w-auto bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 font-bold"
          >
            <Heart size={18} /> Contribute to this Cause
          </Button>
        </div>

        {/* Big Progress Meter */}
        <div className="p-6 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                Total Raised
              </span>
              <div className="text-3xl font-extrabold font-mono text-rose-400 mt-0.5">
                {formatCurrency(campaign.raisedAmount || 0)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-[var(--color-text-muted)]">Target Goal</span>
              <div className="text-lg font-bold font-mono text-[var(--color-text-primary)]">
                {formatCurrency(campaign.goalAmount || 0)}
              </div>
            </div>
          </div>

          <div className="w-full bg-[var(--color-surface-3)] h-3 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-rose-500"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>{percentage}% funded</span>
            <span>{campaign.contributorCount || 0} supporters contributed</span>
          </div>
        </div>
      </motion.div>

      {/* Main Grid: Description & Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Mission & Transparency Updates */}
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6 space-y-3">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">About this Campaign</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
              {campaign.description}
            </p>
          </div>

          {/* Transparency Updates */}
          {campaign.updates && campaign.updates.length > 0 && (
            <div className="card p-6 space-y-4">
              <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                Transparency & Progress Updates
              </h2>
              <div className="space-y-4">
                {campaign.updates.map((upd, idx) => (
                  <div key={idx} className="border-l-2 border-rose-500 pl-4 space-y-1">
                    <div className="flex justify-between">
                      <h3 className="font-bold text-sm text-[var(--color-text-primary)]">{upd.title}</h3>
                      <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                        {formatDate(upd.publishedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{upd.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Donors Leaderboard */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Award size={14} className="text-amber-400" />
              Recent Supporters
            </h3>

            {recentDonors.length > 0 ? (
              <div className="space-y-3">
                {recentDonors.map((don) => (
                  <div key={don._id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={don.donor?.profilePhoto}
                        firstName={don.donor?.firstName || 'Alum'}
                        lastName=""
                        size="xs"
                      />
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {don.donor?.firstName || 'Anonymous'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-rose-400">
                      {formatCurrency(don.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[var(--color-text-muted)]">
                Be the first to contribute to this campaign!
              </div>
            )}
          </div>

          <div className="card p-6 space-y-2 bg-emerald-500/5 border border-emerald-500/20 text-xs text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <ShieldCheck size={16} /> 100% Tax Deductible (80G)
            </div>
            <p>
              All contributions are directly audited and eligible for tax benefits under Section 80G. An official receipt is automatically generated upon completion.
            </p>
          </div>
        </div>
      </div>

      {/* ===== CONTRIBUTE MODAL ===== */}
      <Modal
        isOpen={showContributeModal}
        onClose={() => setShowContributeModal(false)}
        title={`Support: ${campaign.title}`}
        size="md"
      >
        <form onSubmit={handleDonate} className="space-y-4">
          <div className="space-y-2">
            <label className="label">Select Contribution Amount (INR)</label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => {
                const isSelected = !customAmount && amount === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setAmount(p);
                      setCustomAmount('');
                    }}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border-[var(--color-surface-border)] hover:border-rose-400/50'
                    }`}
                  >
                    {formatCurrency(p)}
                  </button>
                );
              })}
            </div>

            <Input
              label="Or Enter Custom Amount (₹)"
              type="number"
              placeholder="e.g. 15000"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
          </div>

          <Textarea
            label="Message of Encouragement (Optional)"
            rows={2}
            placeholder="Proud to support our TCET juniors..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isAnon"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded text-rose-500 bg-[var(--color-surface-2)]"
            />
            <label htmlFor="isAnon" className="text-xs cursor-pointer select-none">
              Make my contribution anonymous on the public leaderboard
            </label>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-surface-2)] text-[11px] text-[var(--color-text-muted)] flex items-center justify-between">
            <span>Payment Security:</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Lock size={12} /> 256-bit Encrypted Checkout
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowContributeModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={processing} className="bg-rose-600 hover:bg-rose-500 text-white font-bold">
              Proceed to Pay {formatCurrency(customAmount ? Number(customAmount) : amount)}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
