import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Check,
  X,
  Plus,
  Calendar,
  Clock,
  Sparkles,
  MessageSquare,
  ChevronRight,
  BookOpen,
  FileText
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { mentorshipAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge, RoleBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate, timeAgo } from '../../lib/utils';

export default function MentorDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [activeMentorships, setActiveMentorships] = useState([]);
  const [loading, setLoading] = useState(true);

  // Decline Modal State
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  // Log Session Modal State
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedMentorship, setSelectedMentorship] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    durationMinutes: 45,
    notes: '',
    actionItems: '',
  });
  const [savingSession, setSavingSession] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, activeRes] = await Promise.all([
        mentorshipAPI.getRequests({ role: 'mentor' }),
        mentorshipAPI.getActive(),
      ]);
      setRequests(reqRes.data.data || []);
      setActiveMentorships(activeRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load mentor dashboard.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Accept Request
  const handleAccept = async (requestId) => {
    try {
      await mentorshipAPI.accept(requestId);
      toast.success('Mentorship request accepted!');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request.');
    }
  };

  // Decline Request
  const handleDecline = async () => {
    if (!selectedReq) return;
    try {
      await mentorshipAPI.decline(selectedReq._id, { reason: declineReason });
      toast.info('Mentorship request declined.');
      setShowDeclineModal(false);
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to decline request.');
    }
  };

  // Log Session
  const handleSaveSession = async (e) => {
    e.preventDefault();
    if (!selectedMentorship) return;
    setSavingSession(true);
    try {
      await mentorshipAPI.addSession(selectedMentorship._id, {
        ...sessionForm,
        actionItems: sessionForm.actionItems
          ? sessionForm.actionItems.split('\n').map((a) => a.trim()).filter(Boolean)
          : [],
      });
      toast.success('Mentorship session logged!');
      setShowSessionModal(false);
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to log session.');
    } finally {
      setSavingSession(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
            <Users className="text-amber-400" size={26} />
            Mentor Management Dashboard
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Review student guidance requests, manage ongoing mentorships, and log 1-on-1 sessions.
          </p>
        </div>

        <Link to="/mentorship">
          <Button variant="outline" size="sm">
            View Mentors Directory
          </Button>
        </Link>
      </div>

      {/* Grid: Pending Requests & Active Mentees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Incoming Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Incoming Mentorship Requests ({requests.filter((r) => r.status === 'pending').length})
            </h2>
          </div>

          {loading ? (
            <div className="card p-8 animate-pulse text-xs text-center text-[var(--color-text-muted)]">
              Loading requests...
            </div>
          ) : requests.filter((r) => r.status === 'pending').length > 0 ? (
            <div className="space-y-3">
              {requests
                .filter((r) => r.status === 'pending')
                .map((req) => (
                  <div key={req._id} className="card p-5 space-y-3 border border-[var(--color-surface-border)]">
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={req.student?.profilePhoto}
                        firstName={req.student?.firstName}
                        lastName={req.student?.lastName}
                        size="md"
                      />
                      <div className="flex-1 overflow-hidden">
                        <Link
                          to={`/profile/${req.student?._id}`}
                          className="font-bold text-sm text-[var(--color-text-primary)] hover:text-blue-400 block"
                        >
                          {req.student?.firstName} {req.student?.lastName}
                        </Link>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {req.student?.department} • Class of {req.student?.graduationYear}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[var(--color-surface-2)] text-xs space-y-1.5">
                      <p className="leading-relaxed">
                        <strong>Goal:</strong> {req.goal}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
                        <span>Duration: {req.duration || '3 Months'}</span>
                        <span>Frequency: {req.preferredFrequency || 'Bi-weekly'}</span>
                      </div>
                      {req.topics?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {req.topics.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => handleAccept(req._id)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs font-bold"
                      >
                        <Check size={14} /> Accept Mentee
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedReq(req);
                          setShowDeclineModal(true);
                        }}
                        className="flex-1 text-xs text-rose-400 hover:bg-rose-500/10"
                      >
                        <X size={14} /> Decline
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="card p-12 text-center text-xs text-[var(--color-text-muted)]">
              No pending mentorship requests at this time.
            </div>
          )}
        </div>

        {/* Right Column: Active Mentees */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Users size={18} className="text-emerald-400" />
            Active Mentees ({activeMentorships.length})
          </h2>

          {loading ? (
            <div className="card p-8 animate-pulse text-xs text-center text-[var(--color-text-muted)]">
              Loading active mentorships...
            </div>
          ) : activeMentorships.length > 0 ? (
            <div className="space-y-3">
              {activeMentorships.map((m) => (
                <div key={m._id} className="card p-5 space-y-3 border-l-4 border-emerald-500">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={m.student?.profilePhoto}
                        firstName={m.student?.firstName}
                        lastName={m.student?.lastName}
                        size="md"
                      />
                      <div>
                        <Link
                          to={`/profile/${m.student?._id}`}
                          className="font-bold text-sm text-[var(--color-text-primary)] hover:text-blue-400 block"
                        >
                          {m.student?.firstName} {m.student?.lastName}
                        </Link>
                        <p className="text-xs text-[var(--color-text-muted)]">{m.student?.department}</p>
                      </div>
                    </div>

                    <span className="badge badge-green text-[10px]">Active</span>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                    <strong>Focus:</strong> {m.goal}
                  </p>

                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-surface-border)]">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMentorship(m);
                        setShowSessionModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs"
                    >
                      <Plus size={14} /> Log 1-on-1 Session
                    </Button>
                    <Link to={`/messages?user=${m.student?._id}`}>
                      <Button size="sm" variant="secondary" className="text-xs">
                        <MessageSquare size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center text-xs text-[var(--color-text-muted)]">
              You currently have no active mentees. Accept requests from the left panel to begin mentoring.
            </div>
          )}
        </div>
      </div>

      {/* ===== DECLINE REQUEST MODAL ===== */}
      <Modal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        title="Decline Mentorship Request"
        size="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Reason for Declining (Optional feedback for student)"
            rows={3}
            placeholder="e.g. Currently reached maximum bandwidth this semester..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowDeclineModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDecline}>
              Confirm Decline
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== LOG SESSION MODAL ===== */}
      <Modal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        title={`Log Session with ${selectedMentorship?.student?.firstName}`}
        size="md"
      >
        <form onSubmit={handleSaveSession} className="space-y-4">
          <Input
            label="Session Topic / Title"
            required
            placeholder="e.g. Resume Polish & System Design Overview"
            value={sessionForm.title}
            onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              required
              value={sessionForm.date}
              onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
            />

            <Input
              label="Duration (Minutes)"
              type="number"
              value={sessionForm.durationMinutes}
              onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Meeting / WebRTC Video Room Link (Optional)"
            placeholder="e.g. https://meet.jit.si/alumnetra-session (Auto-generated if empty)"
            value={sessionForm.meetingLink || ''}
            onChange={(e) => setSessionForm({ ...sessionForm, meetingLink: e.target.value })}
          />

          <Textarea
            label="Key Discussion Notes"
            rows={3}
            placeholder="Points covered, advice given, feedback..."
            value={sessionForm.notes}
            onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
          />

          <Textarea
            label="Action Items for Mentee"
            rows={3}
            hint="Enter each action item on a new line"
            placeholder="• Revise database indexing section&#10;• Practice 2 LeetCode Mediums"
            value={sessionForm.actionItems}
            onChange={(e) => setSessionForm({ ...sessionForm, actionItems: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowSessionModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingSession}>
              Save Session Log & Provision WebRTC
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
