import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  Search,
  Plus,
  DollarSign,
  Users,
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
  FileText,
  Building,
  Target
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { donationsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate, getProgressColor, timeAgo } from '../../lib/utils';

export default function ContributionsPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'my-donations'
  const [campaigns, setCampaigns] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Create Campaign Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    category: 'scholarship',
    goalAmount: '',
    beneficiary: 'TCET Merit Students',
    endDate: '',
  });

  // Fetch Campaigns
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await donationsAPI.getCampaigns({
        category: selectedCategory || undefined,
        limit: 20,
      });
      setCampaigns(res.data.data.campaigns || []);
    } catch (err) {
      toast.error('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, toast]);

  // Fetch My Donations
  const fetchMyDonations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await donationsAPI.getMine({ limit: 50 });
      setMyDonations(res.data.data.donations || []);
    } catch (err) {
      toast.error('Failed to load your donation history.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'campaigns') fetchCampaigns();
    else if (activeTab === 'my-donations') fetchMyDonations();
  }, [activeTab, fetchCampaigns, fetchMyDonations]);

  // Handle Create Campaign
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await donationsAPI.createCampaign({
        ...campaignForm,
        goalAmount: Number(campaignForm.goalAmount),
      });
      toast.success('Campaign submitted for approval!');
      setShowCreateModal(false);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create campaign.');
    } finally {
      setCreating(false);
    }
  };

  const categories = [
    { value: '', label: 'All Causes' },
    { value: 'scholarship', label: 'Student Scholarships & Financial Aid' },
    { value: 'infrastructure', label: 'Campus & Lab Infrastructure' },
    { value: 'student_welfare', label: 'Student Welfare & Emergency Fund' },
    { value: 'research', label: 'Innovation & Research Grants' },
    { value: 'department_fund', label: 'Department Special Projects' },
    { value: 'alumni_endowment', label: 'TCET Alumni Endowment' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
            <Heart className="text-rose-400" size={26} />
            TCET Giving & Alumni Endowment Portal
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Empower the next generation of engineers through scholarships, lab upgrades, and innovation grants.
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            className="flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
          >
            <Plus size={16} /> Launch Campaign
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-surface-border)] gap-4">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'campaigns'
              ? 'border-rose-400 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Giving Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('my-donations')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'my-donations'
              ? 'border-rose-400 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          My Contributions ({myDonations.length})
        </button>
      </div>

      {/* ===== TAB 1: CAMPAIGNS ===== */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="card p-4">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              containerClass="max-w-md"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Campaigns Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="card p-6 h-64 animate-pulse bg-[var(--color-surface-2)]" />
              ))}
            </div>
          ) : campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {campaigns.map((camp) => {
                const percentage = Math.min(
                  100,
                  Math.round(((camp.raisedAmount || 0) / (camp.goalAmount || 1)) * 100)
                );

                return (
                  <motion.div
                    key={camp._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 flex flex-col justify-between hover:border-rose-400/50 transition-all shadow-md group relative"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="badge badge-rose capitalize text-[10px]">
                          {camp.category?.replace('_', ' ') || 'Cause'}
                        </span>
                        {camp.endDate && (
                          <span className="text-[11px] text-[var(--color-text-muted)]">
                            Ends {formatDate(camp.endDate, 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>

                      <div>
                        <Link
                          to={`/contributions/${camp._id}`}
                          className="text-base font-bold text-[var(--color-text-primary)] group-hover:text-rose-400 transition-colors block line-clamp-1"
                        >
                          {camp.title}
                        </Link>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          Beneficiary: {camp.beneficiary || 'TCET Students'}
                        </p>
                      </div>

                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                        {camp.description}
                      </p>

                      {/* Goal & Progress Bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-rose-400">
                            {formatCurrency(camp.raisedAmount || 0)}
                          </span>
                          <span className="text-[var(--color-text-muted)] font-mono">
                            Goal: {formatCurrency(camp.goalAmount || 0)}
                          </span>
                        </div>
                        <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-rose-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-[var(--color-text-muted)]">
                          <span>{percentage}% funded</span>
                          <span>{camp.contributorCount || 0} donors</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[var(--color-surface-border)]">
                      <Link to={`/contributions/${camp._id}`} className="w-full">
                        <Button variant="secondary" size="sm" className="w-full text-xs flex items-center justify-center gap-1.5 font-bold">
                          Contribute Now <ChevronRight size={14} />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="card p-16 text-center text-sm text-[var(--color-text-muted)] space-y-2">
              <Heart size={40} className="mx-auto opacity-30 mb-2" />
              <p className="font-semibold text-[var(--color-text-primary)]">No active campaigns</p>
              <p className="text-xs">Check back soon for new college causes.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 2: MY DONATIONS ===== */}
      {activeTab === 'my-donations' && (
        <div className="space-y-4">
          {loading ? (
            <div className="card p-12 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
              Loading contribution history...
            </div>
          ) : myDonations.length > 0 ? (
            <div className="space-y-3">
              {myDonations.map((don) => (
                <div
                  key={don._id}
                  className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className={`badge text-[10px] ${
                      don.status === 'success' ? 'badge-green' : don.status === 'failed' ? 'badge-rose' : 'badge-amber'
                    }`}>
                      {don.status === 'success' ? 'Confirmed ✓' : don.status === 'failed' ? 'Failed ✕' : 'Pending / Processing'}
                    </span>
                    <h3 className="font-bold text-base text-[var(--color-text-primary)]">
                      {don.campaign?.title || 'Giving Campaign'}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                      <Calendar size={12} /> {formatDate(don.completedAt || don.createdAt, 'MMMM d, yyyy')}
                      <span>• ID: {don.donationId}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-lg font-bold font-mono text-emerald-400">
                        {formatCurrency(don.amount)}
                      </div>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {don.status === 'success' ? 'Tax Exemption 80G Eligible' : 'Receipt Not Issued'}
                      </span>
                    </div>

                    {don.status === 'success' ? (
                      <Link to={`/contributions/receipt/${don.donationId}`}>
                        <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5 shadow-sm">
                          <FileText size={14} /> 80G Receipt
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" disabled className="text-xs opacity-50 cursor-not-allowed">
                        {don.status === 'failed' ? 'Payment Failed' : 'Pending'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-16 text-center text-sm text-[var(--color-text-muted)]">
              You have not made any contributions yet. Support a college cause today!
            </div>
          )}
        </div>
      )}

      {/* ===== LAUNCH CAMPAIGN MODAL (ADMIN) ===== */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Launch a Giving Campaign"
        size="lg"
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <Input
            label="Campaign Title"
            required
            placeholder="e.g. 2026 Student Emergency & Merit Scholarship Fund"
            value={campaignForm.title}
            onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Cause Category"
              value={campaignForm.category}
              onChange={(e) => setCampaignForm({ ...campaignForm, category: e.target.value })}
            >
              <option value="scholarship">Student Scholarship</option>
              <option value="infrastructure">Lab / Campus Infrastructure</option>
              <option value="student_welfare">Student Welfare</option>
              <option value="research">Research & Innovation</option>
              <option value="department_fund">Department Fund</option>
              <option value="alumni_endowment">Alumni Endowment</option>
            </Select>

            <Input
              label="Target Goal Amount (in ₹)"
              type="number"
              required
              placeholder="e.g. 500000"
              value={campaignForm.goalAmount}
              onChange={(e) => setCampaignForm({ ...campaignForm, goalAmount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Beneficiary"
              placeholder="e.g. Deserving TCET Engineering Students"
              value={campaignForm.beneficiary}
              onChange={(e) => setCampaignForm({ ...campaignForm, beneficiary: e.target.value })}
            />

            <Input
              label="Campaign End Date"
              type="date"
              value={campaignForm.endDate}
              onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
            />
          </div>

          <Textarea
            label="Campaign Mission & Impact Description"
            required
            rows={5}
            placeholder="Explain what the raised funds will be used for, transparency breakdown, and who benefits..."
            value={campaignForm.description}
            onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creating}>
              Submit Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
