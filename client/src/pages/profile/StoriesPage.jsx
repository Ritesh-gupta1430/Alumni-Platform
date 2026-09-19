import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Award,
  Plus,
  Quote,
  Building,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

export default function StoriesPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', story: '' });

  // Curated featured inspirational alumni stories
  const [stories, setStories] = useState([
    {
      id: 1,
      title: 'From Campus Placement to Silicon Valley Tech Lead',
      author: 'Aakash Mehta',
      role: 'Principal Engineer at Meta',
      department: 'Computer Engineering',
      graduationYear: 2017,
      date: 'Aug 2026',
      avatar: '',
      story:
        'During my 3rd year at TCET, I built my first open source project in the college lab. The foundation I built in computer science and the mentorship from our alumni network opened doors to opportunities I never thought possible.',
      quote: 'Consistency in problem-solving and leveraging our alumni connections changed everything.',
    },
    {
      id: 2,
      title: 'Founding an AI HealthTech Startup with My Batchmate',
      author: 'Pooja Sharma',
      role: 'Co-Founder & CEO, HealthSphere AI',
      department: 'Information Technology',
      graduationYear: 2019,
      date: 'Jul 2026',
      avatar: '',
      story:
        'We started pitching our idea at the TCET annual project competition. Three years later, we raised our seed round from alumni angel investors and now serve over 100 clinics across India.',
      quote: 'Never underestimate the power of partnerships formed inside the classroom.',
    },
    {
      id: 3,
      title: 'Navigating the Transition from Mechanical to Data Engineering',
      author: 'Rohan Deshmukh',
      role: 'Staff Data Engineer at Snowflake',
      department: 'Mechanical Engineering',
      graduationYear: 2018,
      date: 'Jun 2026',
      avatar: '',
      story:
        'Transitioning domains was intimidating, but regular 1-on-1 mentorship sessions with senior alumni gave me the exact roadmap I needed to master distributed systems and big data.',
      quote: 'Your major does not define your horizon—your curiosity and grit do.',
    },
  ]);

  const handleShareStory = (e) => {
    e.preventDefault();
    if (!form.title || !form.story) return;

    setStories([
      {
        id: Date.now(),
        title: form.title,
        author: `${user?.firstName} ${user?.lastName}`,
        role: user?.role === 'ALUMNI' ? 'TCET Alumnus' : 'Student Story',
        department: user?.department || 'TCET',
        graduationYear: user?.graduationYear || new Date().getFullYear(),
        date: 'Just now',
        story: form.story,
        quote: form.title,
      },
      ...stories,
    ]);

    toast.success('Your story has been submitted for community spotlight!');
    setShowModal(false);
    setForm({ title: '', story: '' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
            <Sparkles className="text-amber-400" size={26} />
            Alumni Spotlights & Success Stories
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Inspiring journeys, startup milestones, and career lessons from the global TCET community.
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          variant="gold"
          className="flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus size={16} /> Share Your Story
        </Button>
      </div>

      {/* Stories Feed */}
      <div className="space-y-6">
        {stories.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 sm:p-8 space-y-5 border border-[var(--color-surface-border)] shadow-lg hover:border-amber-400/40 transition-all"
          >
            {/* Author Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar
                  src={item.avatar}
                  firstName={item.author.split(' ')[0]}
                  lastName={item.author.split(' ')[1] || ''}
                  size="lg"
                />
                <div>
                  <h2 className="font-bold text-base text-[var(--color-text-primary)]">
                    {item.author}
                  </h2>
                  <p className="text-xs text-amber-300 font-medium">{item.role}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1.5">
                    <GraduationCap size={13} />
                    {item.department} • Class of {item.graduationYear}
                  </p>
                </div>
              </div>

              <span className="text-xs text-[var(--color-text-muted)] font-mono">
                {item.date}
              </span>
            </div>

            {/* Story Title & Quote */}
            <div className="space-y-3">
              <h3 className="text-xl font-extrabold text-[var(--color-text-primary)]">
                {item.title}
              </h3>

              {item.quote && (
                <div className="p-4 rounded-xl bg-amber-500/10 border-l-4 border-amber-400 text-xs sm:text-sm italic text-amber-200 flex items-start gap-2.5">
                  <Quote size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p>"{item.quote}"</p>
                </div>
              )}

              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                {item.story}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ===== SHARE STORY MODAL ===== */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Share Your Alumni Journey"
        size="lg"
      >
        <form onSubmit={handleShareStory} className="space-y-4">
          <Input
            label="Story Headline / Main Takeaway"
            required
            placeholder="e.g. How TCET hackathons prepared me for my career at Google"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <Textarea
            label="Your Story"
            required
            rows={6}
            placeholder="Share key milestones, challenges overcome, advice for junior students, and lessons learned..."
            value={form.story}
            onChange={(e) => setForm({ ...form, story: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold">
              Submit Story
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
