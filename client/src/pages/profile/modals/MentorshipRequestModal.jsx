import { useState } from 'react';
import { Sparkles, Send, GraduationCap, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Textarea } from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/Toast';
import { mentorshipAPI } from '../../../services/api';

export function MentorshipRequestModal({ isOpen, onClose, mentorUser, mentorProfile, onSuccess }) {
  const toast = useToast();
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [goals, setGoals] = useState('');
  const [format, setFormat] = useState('1on1_call');
  const [loading, setLoading] = useState(false);

  const availableTopics = mentorProfile?.mentorshipTopics?.length > 0
    ? mentorProfile.mentorshipTopics
    : ['Career Guidance', 'Resume Review', 'Mock Interview', 'Technical Architecture', 'Industry Transition'];

  const toggleTopic = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goals.trim()) {
      toast.error('Please describe what you would like guidance on.');
      return;
    }

    setLoading(true);
    try {
      await mentorshipAPI.sendRequest({
        mentorId: mentorUser._id,
        topics: selectedTopics.length > 0 ? selectedTopics : [availableTopics[0]],
        goals: goals.trim(),
        preferredFormat: format,
      });
      toast.success('Mentorship request sent successfully!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit mentorship request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Mentorship" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        {/* Mentor Info Header */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-[var(--color-surface-2)] to-transparent border border-amber-500/20">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
              {mentorUser?.firstName} {mentorUser?.lastName}
            </h4>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {mentorProfile?.currentDesignation ? `${mentorProfile.currentDesignation} at ` : ''}
              <span className="text-amber-400 font-medium">{mentorProfile?.currentOrganization || 'TCET Alumni Mentor'}</span>
            </p>
          </div>
        </div>

        {/* Topics Selection */}
        <div className="space-y-2">
          <label className="label">Select Topics for Mentorship</label>
          <div className="flex flex-wrap gap-2">
            {availableTopics.map((topic) => {
              const active = selectedTopics.includes(topic);
              return (
                <button
                  type="button"
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-white border border-[var(--color-surface-border)]'
                  }`}
                >
                  {active && <CheckCircle2 size={13} />}
                  {topic}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred Interaction Format */}
        <div className="space-y-2">
          <label className="label">Preferred Session Format</label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { id: '1on1_call', label: '1-on-1 Video Call' },
              { id: 'async_review', label: 'Async Resume / Q&A' },
              { id: 'roadmap', label: 'Long-term Roadmap' },
            ].map((f) => (
              <button
                type="button"
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  format === f.id
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold'
                    : 'border-[var(--color-surface-border)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:border-[var(--color-surface-border)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mentorship Goals */}
        <Textarea
          label="Your Mentorship Goals & Background"
          required
          rows={4}
          placeholder="Describe your current status, what you want to achieve, and any specific questions you have for the mentor..."
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-surface-border)]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="gold" loading={loading} className="flex items-center gap-2">
            <Send size={16} /> Send Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
