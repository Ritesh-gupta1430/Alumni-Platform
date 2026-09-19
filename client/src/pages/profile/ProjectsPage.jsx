import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  Plus,
  ExternalLink,
  Code2,
  Sparkles,
  Layers
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { projectsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../lib/utils';

export default function ProjectsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'web',
    techStack: '',
    projectUrl: '',
    githubUrl: '',
  });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectsAPI.list({
        q: searchQuery || undefined,
        category: selectedCategory || undefined,
        limit: 20,
      });
      setProjects(res.data.data.projects || []);
    } catch (err) {
      toast.error('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        techStack: form.techStack
          ? form.techStack.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      await projectsAPI.create(payload);
      toast.success('Project published to showcase!');
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit project.');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { value: '', label: 'All Domains' },
    { value: 'web', label: 'Web & Full Stack' },
    { value: 'ai_ml', label: 'AI / Machine Learning' },
    { value: 'mobile', label: 'Mobile Apps (Flutter/React Native)' },
    { value: 'iot', label: 'IoT & Embedded Systems' },
    { value: 'cloud_devops', label: 'Cloud & DevOps' },
    { value: 'cybersecurity', label: 'Cybersecurity' },
    { value: 'other', label: 'Other Innovations' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
            <BookOpen className="text-amber-400" size={26} />
            TCET Innovation & Project Showcase
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Explore capstone projects, startup MVPs, and open-source contributions built by TCET students & alumni.
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          variant="primary"
          className="flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus size={16} /> Showcase a Project
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            icon={Search}
            placeholder="Search projects by title or keywords..."
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

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card p-6 h-56 animate-pulse bg-[var(--color-surface-2)]" />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <motion.div
              key={proj._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedProject(proj)}
              className="card p-6 flex flex-col justify-between hover:border-amber-400/50 hover:shadow-lg transition-all shadow-md group relative cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="badge badge-gold capitalize text-[10px]">
                    {proj.category || 'Project'}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                    {formatDate(proj.createdAt, 'MMM yyyy')}
                  </span>
                </div>

                <div>
                  <h2 className="text-base font-bold text-[var(--color-text-primary)] group-hover:text-amber-400 transition-colors line-clamp-1">
                    {proj.title}
                  </h2>
                </div>

                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
                  {proj.description}
                </p>

                {/* Tech Stack Chips */}
                {proj.techStack && proj.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.techStack.slice(0, 4).map((tech, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-surface-border)]"
                      >
                        {tech}
                      </span>
                    ))}
                    {proj.techStack.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
                        +{proj.techStack.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Creator and Action Footer */}
              <div className="pt-4 mt-4 border-t border-[var(--color-surface-border)] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {proj.user && (
                    <div
                      className="flex items-center gap-2 min-w-0 flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Avatar
                        src={proj.user.profilePhoto}
                        firstName={proj.user.firstName}
                        lastName={proj.user.lastName}
                        size="xs"
                      />
                      <Link
                        to={`/profile/${proj.user._id}`}
                        className="text-xs font-semibold text-[var(--color-text-primary)] hover:text-amber-400 truncate"
                      >
                        {proj.user.firstName} {proj.user.lastName}
                      </Link>
                    </div>
                  )}

                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl.startsWith('http') ? proj.githubUrl : `https://${proj.githubUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
                        title="GitHub Repository"
                      >
                        <Code2 size={16} />
                      </a>
                    )}
                    {(proj.liveUrl || proj.projectUrl) && (
                      <a
                        href={(proj.liveUrl || proj.projectUrl).startsWith('http') ? (proj.liveUrl || proj.projectUrl) : `https://${proj.liveUrl || proj.projectUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Live Demo"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(proj.liveUrl || proj.projectUrl) && (
                    <a
                      href={(proj.liveUrl || proj.projectUrl).startsWith('http') ? (proj.liveUrl || proj.projectUrl) : `https://${proj.liveUrl || proj.projectUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 btn btn-secondary btn-sm text-xs flex items-center justify-center gap-1.5 py-1.5 font-medium"
                    >
                      Live Demo <ExternalLink size={12} />
                    </a>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedProject(proj)}
                    className="flex-1 text-xs text-amber-400 border-amber-400/30 hover:bg-amber-400/10 font-medium py-1.5"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center text-sm text-[var(--color-text-muted)] space-y-2">
          <BookOpen size={40} className="mx-auto opacity-30 mb-2" />
          <p className="font-semibold text-[var(--color-text-primary)]">No projects showcased yet</p>
          <p className="text-xs">Publish your research or web project to inspire the community!</p>
        </div>
      )}

      {/* ===== PROJECT DETAILS MODAL ===== */}
      <Modal
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.title || 'Project Details'}
        size="lg"
      >
        {selectedProject && (
          <div className="space-y-5">
            {/* Badges & Meta info */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--color-surface-border)]">
              <span className="badge badge-gold capitalize text-xs">
                {selectedProject.category || 'Project'}
              </span>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">
                Published {formatDate(selectedProject.createdAt, 'MMMM d, yyyy')}
              </span>
            </div>

            {/* Author details card */}
            {selectedProject.user && (
              <div className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={selectedProject.user.profilePhoto}
                    firstName={selectedProject.user.firstName}
                    lastName={selectedProject.user.lastName}
                    size="sm"
                  />
                  <div>
                    <Link
                      to={`/profile/${selectedProject.user._id}`}
                      className="text-sm font-bold text-[var(--color-text-primary)] hover:underline"
                    >
                      {selectedProject.user.firstName} {selectedProject.user.lastName}
                    </Link>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {selectedProject.user.headline || selectedProject.user.department || selectedProject.user.role || 'TCET Creator'}
                    </p>
                  </div>
                </div>
                <Link to={`/profile/${selectedProject.user._id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    View Profile
                  </Button>
                </Link>
              </div>
            )}

            {/* Full Project Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Project Overview & Architecture
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line bg-[var(--color-surface-1)] p-4 rounded-xl border border-[var(--color-surface-border)]">
                {selectedProject.description}
              </p>
            </div>

            {/* Tech Stack Chips */}
            {selectedProject.techStack && selectedProject.techStack.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Technologies & Frameworks Used
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-3 py-1 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-surface-border)] font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons / External links */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[var(--color-surface-border)]">
              {selectedProject.githubUrl && (
                <a
                  href={selectedProject.githubUrl.startsWith('http') ? selectedProject.githubUrl : `https://${selectedProject.githubUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary text-xs flex items-center gap-2"
                >
                  <Code2 size={16} /> GitHub Source
                </a>
              )}
              {selectedProject.projectUrl && (
                <a
                  href={selectedProject.projectUrl.startsWith('http') ? selectedProject.projectUrl : `https://${selectedProject.projectUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary text-xs flex items-center gap-2"
                >
                  <ExternalLink size={16} /> Open Live Demo
                </a>
              )}
              <Button variant="ghost" onClick={() => setSelectedProject(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== SUBMIT PROJECT MODAL ===== */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Showcase Your Project"
        size="lg"
      >
        <form onSubmit={handleSubmitProject} className="space-y-4">
          <Input
            label="Project Title"
            required
            placeholder="e.g. AlumNetra Platform"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <Select
            label="Category / Domain"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="web">Web & Full Stack</option>
            <option value="ai_ml">AI / Machine Learning</option>
            <option value="mobile">Mobile Application</option>
            <option value="iot">IoT / Robotics</option>
            <option value="cloud_devops">Cloud & DevOps</option>
            <option value="cybersecurity">Cybersecurity</option>
            <option value="other">Other</option>
          </Select>

          <Textarea
            label="Project Overview"
            required
            rows={4}
            placeholder="Describe what problem your project solves, architecture, and impact..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Input
            label="Tech Stack & Tools Used"
            required
            hint="Comma-separated (e.g. React, Node.js, PyTorch, MongoDB)"
            placeholder="React, TypeScript, Docker"
            value={form.techStack}
            onChange={(e) => setForm({ ...form, techStack: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Live Demo URL (Optional)"
              placeholder="https://myproject.vercel.app"
              value={form.projectUrl}
              onChange={(e) => setForm({ ...form, projectUrl: e.target.value })}
            />

            <Input
              label="GitHub Repository (Optional)"
              placeholder="https://github.com/username/repo"
              value={form.githubUrl}
              onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Publish Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
