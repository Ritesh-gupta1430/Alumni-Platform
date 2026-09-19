import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Compass,
  MessageSquare,
  ChevronRight,
  Shield,
  Tag
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { communityAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

export default function CommunitiesPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Create Community Modal
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'interest_group',
    description: '',
    rules: '',
    isPrivate: false,
  });

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await communityAPI.list({
        q: searchQuery || undefined,
        category: selectedCategory || undefined,
        limit: 20,
      });
      setCommunities(res.data.data.communities || []);
    } catch (err) {
      toast.error('Failed to load communities.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, toast]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...form,
        rules: form.rules ? form.rules.split('\n').map((r) => r.trim()).filter(Boolean) : [],
      };
      await communityAPI.create(payload);
      toast.success('Community created successfully!');
      setShowModal(false);
      fetchCommunities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create community.');
    } finally {
      setCreating(false);
    }
  };

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'department', label: 'Departmental Chapters' },
    { value: 'tech_club', label: 'Technical Clubs (ACM, IEEE, CSI)' },
    { value: 'cultural', label: 'Cultural & Arts' },
    { value: 'alumni_chapter', label: 'Regional Alumni Chapters' },
    { value: 'sports', label: 'Sports & Gaming' },
    { value: 'interest_group', label: 'Special Interest Groups' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
            <Users className="text-blue-400" size={26} />
            TCET Communities & Student Chapters
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Join domain clubs, regional alumni chapters, and technical interest groups to collaborate.
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          variant="primary"
          className="flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus size={16} /> Create Community
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            icon={Search}
            placeholder="Search communities by name or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Communities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card p-6 h-48 animate-pulse bg-[var(--color-surface-2)]" />
          ))}
        </div>
      ) : communities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {communities.map((comm) => (
            <motion.div
              key={comm._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 flex flex-col justify-between hover:border-blue-500/50 transition-all shadow-md group relative"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                    <Compass size={24} />
                  </div>
                  <span className="badge badge-gray text-[10px] capitalize">
                    {comm.category?.replace('_', ' ') || 'Community'}
                  </span>
                </div>

                <div>
                  <Link
                    to={`/communities/${comm._id}`}
                    className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors block line-clamp-1"
                  >
                    {comm.name}
                  </Link>
                  <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                    <Users size={12} /> {comm.memberCount || 1} members
                  </span>
                </div>

                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                  {comm.description || 'A community space for discussions, updates, and events.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--color-surface-border)] flex items-center justify-between">
                <Link to={`/communities/${comm._id}`} className="w-full">
                  <Button variant="ghost" size="sm" className="w-full text-xs flex items-center justify-center gap-1">
                    Explore Hub <ChevronRight size={14} />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center text-sm text-[var(--color-text-muted)] space-y-2">
          <Users size={40} className="mx-auto opacity-30 mb-2" />
          <p className="font-semibold text-[var(--color-text-primary)]">No communities found</p>
          <p className="text-xs">Be the first to start a new club or chapter!</p>
        </div>
      )}

      {/* ===== CREATE COMMUNITY MODAL ===== */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create a New Community"
        size="md"
      >
        <form onSubmit={handleCreateCommunity} className="space-y-4">
          <Input
            label="Community Name"
            required
            placeholder="e.g. TCET AI & Robotics Chapter"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="tech_club">Technical Club</option>
            <option value="department">Departmental Group</option>
            <option value="alumni_chapter">Regional Alumni Chapter</option>
            <option value="cultural">Cultural / Arts</option>
            <option value="sports">Sports / Gaming</option>
            <option value="interest_group">Special Interest Group</option>
          </Select>

          <Textarea
            label="Description & Purpose"
            required
            rows={4}
            placeholder="Describe what members will do in this community..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Textarea
            label="Community Guidelines / Rules"
            rows={3}
            placeholder="• Be respectful&#10;• Keep posts relevant to the club"
            value={form.rules}
            onChange={(e) => setForm({ ...form, rules: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creating}>
              Create Community
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
