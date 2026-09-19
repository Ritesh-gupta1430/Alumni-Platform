import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  Check,
  Pause,
  Play,
  Archive,
  Plus,
  ChevronLeft,
  Calendar,
  Sparkles,
  Building,
  Target
} from 'lucide-react';
import { donationsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function AdminCampaignsPage() {
  const toast = useToast();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update Modal State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [updateForm, setUpdateForm] = useState({ title: '', content: '' });
  const [postingUpdate, setPostingUpdate] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await donationsAPI.getCampaigns({ status: 'all', limit: 50 });
      setCampaigns(res.data.data.campaigns || []);
    } catch (err) {
      toast.error('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Handle Approve
  const handleApprove = async (id) => {
    try {
      await donationsAPI.approveCampaign(id);
      toast.success('Campaign approved and published live!');
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve campaign.');
    }
  };

  // Handle Status Update
  const handleSetStatus = async (id, status) => {
    try {
      await donationsAPI.setCampaignStatus(id, { status });
      toast.success(`Campaign status updated to ${status}.`);
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  // Handle Transparency Update
  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!selectedCamp) return;
    setPostingUpdate(true);
    try {
      await donationsAPI.addUpdate(selectedCamp._id, updateForm);
      toast.success('Transparency update published!');
      setShowUpdateModal(false);
      setUpdateForm({ title: '', content: '' });
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to publish update.');
    } finally {
      setPostingUpdate(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Back button */}
      <Link
        to="/admin"
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ChevronLeft size={16} /> Back to Admin Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
          <Heart className="text-rose-500" size={26} />
          Giving Campaigns Governance
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Approve submitted fundraising causes, manage campaign states, and publish transparency reports.
        </p>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card p-6 h-40 animate-pulse bg-[var(--color-surface-2)]" />
          ))}
        </div>
      ) : campaigns.length > 0 ? (
        <div className="space-y-4">
          {campaigns.map((camp) => (
            <motion.div
              key={camp._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 space-y-4 border border-[var(--color-surface-border)] shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-rose capitalize text-[10px]">
                      {camp.category?.replace('_', ' ')}
                    </span>
                    <StatusBadge status={camp.status} />
                  </div>
                  <Link
                    to={`/contributions/${camp._id}`}
                    className="font-bold text-lg text-[var(--color-text-primary)] hover:text-rose-400 block"
                  >
                    {camp.title}
                  </Link>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Beneficiary: {camp.beneficiary || 'TCET Students'} • Goal: {formatCurrency(camp.goalAmount)} • Raised: {formatCurrency(camp.raisedAmount || 0)}
                  </p>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                  {camp.status === 'pending_approval' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApprove(camp._id)}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Check size={14} /> Approve & Publish
                    </Button>
                  )}

                  {camp.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetStatus(camp._id, 'paused')}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Pause size={14} /> Pause
                    </Button>
                  )}

                  {camp.status === 'paused' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetStatus(camp._id, 'active')}
                      className="text-xs flex items-center gap-1.5 text-emerald-400"
                    >
                      <Play size={14} /> Resume
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedCamp(camp);
                      setShowUpdateModal(true);
                    }}
                    className="text-xs flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Post Update
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center text-sm text-[var(--color-text-muted)]">
          No campaigns found.
        </div>
      )}

      {/* ===== POST UPDATE MODAL ===== */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title={`Post Transparency Update: ${selectedCamp?.title}`}
        size="md"
      >
        <form onSubmit={handlePostUpdate} className="space-y-4">
          <Input
            label="Update Headline"
            required
            placeholder="e.g. 50% Goal Reached: Initial Scholarships Disbursed"
            value={updateForm.title}
            onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
          />

          <Textarea
            label="Detailed Update Report"
            required
            rows={5}
            placeholder="Share milestones achieved, recipient feedback, and next steps..."
            value={updateForm.content}
            onChange={(e) => setUpdateForm({ ...updateForm, content: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowUpdateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={postingUpdate}>
              Publish Update
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
