import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Printer,
  ChevronLeft,
  CheckCircle2,
  ShieldCheck,
  Building,
  Calendar,
  DollarSign,
  Heart,
  Award
} from 'lucide-react';
import { donationsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function DonationReceiptPage() {
  const { donationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReceipt = useCallback(async () => {
    setLoading(true);
    try {
      const res = await donationsAPI.getReceipt(donationId);
      setReceipt(res.data.data);
    } catch (err) {
      toast.error('Failed to load donation receipt.');
    } finally {
      setLoading(false);
    }
  }, [donationId, toast]);

  useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto mt-12">
        <Heart className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-40" />
        <h2 className="text-xl font-bold mb-2">Receipt Not Found</h2>
        <Button onClick={() => navigate('/contributions')} variant="primary" className="mt-4">
          Return to Giving
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Top Nav Action bar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => navigate('/contributions')}
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ChevronLeft size={16} /> Back to contributions
        </button>

        <Button
          onClick={handlePrint}
          variant="primary"
          size="sm"
          className="flex items-center gap-2"
        >
          <Printer size={16} /> Print / Download Receipt
        </Button>
      </div>

      {/* ===== OFFICIAL RECEIPT DOCUMENT ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 sm:p-12 space-y-8 bg-[var(--color-surface-1)] border border-[var(--color-surface-border)] shadow-2xl relative"
        id="donation-receipt-print"
      >
        {/* Header with College Stamp */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--color-surface-border)] pb-6">
          <div>
            <span className="text-xs font-mono font-bold tracking-widest text-rose-400 uppercase">
              AlumNetra Giving Endowment
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)] tracking-tight">
              Thakur College of Engineering and Technology
            </h1>
            <p className="text-xs text-[var(--color-text-muted)]">
              Kandivali (E), Mumbai, Maharashtra 400101
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold">
              <CheckCircle2 size={16} /> PAYMENT CONFIRMED
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
              80G Tax Exemption Eligible
            </span>
          </div>
        </div>

        {/* Receipt Numbers Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[var(--color-surface-2)] text-xs">
          <div>
            <span className="text-[var(--color-text-muted)] block">Receipt No:</span>
            <strong className="font-mono text-[var(--color-text-primary)]">{receipt.receiptNumber || 'ALM-RCP-2026'}</strong>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)] block">Transaction ID:</span>
            <strong className="font-mono text-[var(--color-text-primary)]">{receipt.donationId}</strong>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)] block">Date:</span>
            <strong className="text-[var(--color-text-primary)]">
              {formatDate(receipt.completedAt || receipt.createdAt, 'MMM d, yyyy')}
            </strong>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)] block">Status:</span>
            <strong className="text-emerald-400 capitalize">{receipt.status}</strong>
          </div>
        </div>

        {/* Donor & Campaign Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1.5 p-4 rounded-xl border border-[var(--color-surface-border)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Contributor Details
            </h3>
            <p className="font-bold text-base text-[var(--color-text-primary)]">
              {receipt.isAnonymous ? 'Anonymous Donor' : `${receipt.donor?.firstName} ${receipt.donor?.lastName}`}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">{receipt.donor?.email}</p>
          </div>

          <div className="space-y-1.5 p-4 rounded-xl border border-[var(--color-surface-border)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Campaign & Beneficiary
            </h3>
            <p className="font-bold text-base text-[var(--color-text-primary)]">
              {receipt.campaign?.title || 'TCET Endowment Fund'}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Beneficiary: {receipt.campaign?.beneficiary || 'TCET Students'}
            </p>
          </div>
        </div>

        {/* Total Amount Box */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Total Contribution Amount
            </span>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              INR (Indian National Rupees)
            </p>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-rose-400">
            {formatCurrency(receipt.amount)}
          </div>
        </div>

        {/* Tax Note & Seal Footer */}
        <div className="pt-6 border-t border-[var(--color-surface-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[var(--color-text-muted)]">
          <div className="space-y-1 max-w-md">
            <p className="font-semibold text-[var(--color-text-secondary)]">
              Official Tax Deduction Acknowledgment
            </p>
            <p>
              This digital receipt is recognized under Section 80G of the Income Tax Act. Thank you for empowering TCET students and our research initiatives.
            </p>
          </div>

          <div className="text-right">
            <div className="w-24 h-12 border-b-2 border-[var(--color-surface-border)] ml-auto" />
            <span className="text-[10px] font-mono mt-1 block">Authorized Signatory / Bursar</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
