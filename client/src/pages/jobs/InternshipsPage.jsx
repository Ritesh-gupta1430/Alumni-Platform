import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Search,
  MapPin,
  Building,
  Plus,
  Calendar,
  Sparkles,
  Clock,
  DollarSign,
  ChevronRight,
  Award
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { jobsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate, DEPARTMENTS, formatCurrency } from '../../lib/utils';

export default function InternshipsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedWorkMode, setSelectedWorkMode] = useState('');

  // Post Internship Modal State
  const [showPostModal, setShowPostModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [internshipForm, setInternshipForm] = useState({
    title: '',
    companyName: '',
    location: '',
    workMode: 'onsite',
    stipendMin: '',
    stipendMax: '',
    stipendDisplayText: '',
    duration: '3 Months',
    description: '',
    responsibilities: '',
    requiredSkills: '',
    preferredSkills: '',
    eligibleDepartments: [],
    eligibleYears: [3, 4],
    applicationDeadline: '',
  });

  const canPost = [
    'RECRUITER',
    'ALUMNI',
    'PLACEMENT_OFFICER',
    'ADMIN',
    'SUPER_ADMIN',
  ].includes(user?.role);

  // Fetch Internships
  const fetchInternships = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jobsAPI.list({
        type: 'internship',
        q: searchQuery || undefined,
        department: selectedDepartment || undefined,
        workMode: selectedWorkMode || undefined,
        page,
        limit: 9,
      });
      setInternships(res.data.data.jobs || []);
      setTotalPages(res.data.data.pages || 1);
    } catch (err) {
      toast.error('Failed to load internships.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedDepartment, selectedWorkMode, page, toast]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  // Handle Post Form
  const handlePostInternship = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      const payload = {
        ...internshipForm,
        type: 'internship',
        stipendMin: Number(internshipForm.stipendMin) || undefined,
        stipendMax: Number(internshipForm.stipendMax) || undefined,
        responsibilities: internshipForm.responsibilities
          ? internshipForm.responsibilities.split('\n').map((r) => r.trim()).filter(Boolean)
          : [],
        requiredSkills: internshipForm.requiredSkills
          ? internshipForm.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        preferredSkills: internshipForm.preferredSkills
          ? internshipForm.preferredSkills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const res = await jobsAPI.create(payload);
      toast.success(res.data.message || 'Internship posted successfully!');
      setShowPostModal(false);
      fetchInternships();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post internship.');
    } finally {
      setPosting(false);
    }
  };

  const toggleDept = (dept) => {
    setInternshipForm((prev) => {
      const exists = prev.eligibleDepartments.includes(dept);
      return {
        ...prev,
        eligibleDepartments: exists
          ? prev.eligibleDepartments.filter((d) => d !== dept)
          : [...prev.eligibleDepartments, dept],
      };
    });
  };

  const toggleYear = (yr) => {
    setInternshipForm((prev) => {
      const exists = prev.eligibleYears.includes(yr);
      return {
        ...prev,
        eligibleYears: exists
          ? prev.eligibleYears.filter((y) => y !== yr)
          : [...prev.eligibleYears, yr],
      };
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
            <GraduationCap className="text-purple-400" size={28} />
            Internship Programs & Summer Traineeships
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Hands-on internships, startup roles, and industrial research training opportunities for students.
          </p>
        </div>

        {canPost && (
          <Button
            onClick={() => setShowPostModal(true)}
            variant="primary"
            className="flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
          >
            <Plus size={16} /> Post Internship
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            icon={Search}
            placeholder="Search role, startup, technology..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>

          <Select
            value={selectedWorkMode}
            onChange={(e) => setSelectedWorkMode(e.target.value)}
          >
            <option value="">All Work Modes</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </Select>
        </div>
      </div>

      {/* Internships Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card p-6 h-56 animate-pulse bg-[var(--color-surface-2)]" />
          ))}
        </div>
      ) : internships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {internships.map((intern) => (
            <motion.div
              key={intern._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 flex flex-col justify-between hover:border-purple-500/50 transition-all shadow-md group relative"
            >
              <div className="space-y-3">
                {/* Company & Role */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                      <Building size={14} />
                      {intern.companyName}
                    </span>
                    <Link
                      to={`/jobs/${intern._id}`}
                      className="text-base font-bold text-[var(--color-text-primary)] group-hover:text-purple-400 transition-colors block mt-0.5 line-clamp-1"
                    >
                      {intern.title}
                    </Link>
                  </div>
                  <span className="badge badge-violet text-[10px] whitespace-nowrap">
                    Internship
                  </span>
                </div>

                {/* Duration & Location */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-[var(--color-text-muted)]">
                  {intern.duration && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-indigo-400" />
                      {intern.duration}
                    </span>
                  )}
                  {intern.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-rose-400" />
                      {intern.location}
                    </span>
                  )}
                  {intern.workMode && (
                    <span className="capitalize px-2 py-0.5 rounded bg-[var(--color-surface-2)] text-[11px]">
                      {intern.workMode}
                    </span>
                  )}
                </div>

                {/* Stipend Card */}
                <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold flex items-center gap-1.5">
                  <Award size={14} />
                  <span>
                    {intern.stipendDisplayText ||
                      (intern.stipendMin
                        ? `${formatCurrency(intern.stipendMin)} / mo`
                        : 'Unpaid / Certificate Traineeship')}
                  </span>
                </div>

                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                  {intern.description}
                </p>

                {/* Required Skills */}
                {intern.requiredSkills && intern.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {intern.requiredSkills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-surface-border)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--color-surface-border)]">
                {intern.applicationDeadline ? (
                  <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                    <Calendar size={12} />
                    Apply by {formatDate(intern.applicationDeadline, 'MMM d')}
                  </span>
                ) : (
                  <span className="text-[11px] text-purple-400 font-medium">Open Application</span>
                )}

                <Link to={`/jobs/${intern._id}`}>
                  <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
                    Details <ChevronRight size={14} />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center text-sm text-[var(--color-text-muted)] space-y-2">
          <GraduationCap size={40} className="mx-auto opacity-30 mb-2" />
          <p className="font-semibold text-[var(--color-text-primary)]">No internships found</p>
          <p className="text-xs">Check back soon or adjust search filters.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-xs font-mono text-[var(--color-text-muted)]">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* ===== POST INTERNSHIP MODAL ===== */}
      <Modal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        title="Post an Internship Opportunity"
        size="lg"
      >
        <form onSubmit={handlePostInternship} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Internship Role"
              required
              placeholder="e.g. Frontend Development Intern"
              value={internshipForm.title}
              onChange={(e) => setInternshipForm({ ...internshipForm, title: e.target.value })}
            />

            <Input
              label="Company / Startup"
              required
              placeholder="e.g. Innovate Labs"
              value={internshipForm.companyName}
              onChange={(e) => setInternshipForm({ ...internshipForm, companyName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Location"
              placeholder="e.g. Mumbai / Remote"
              value={internshipForm.location}
              onChange={(e) => setInternshipForm({ ...internshipForm, location: e.target.value })}
            />

            <Select
              label="Work Mode"
              value={internshipForm.workMode}
              onChange={(e) => setInternshipForm({ ...internshipForm, workMode: e.target.value })}
            >
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </Select>

            <Input
              label="Duration"
              placeholder="e.g. 2 Months, 6 Months"
              value={internshipForm.duration}
              onChange={(e) => setInternshipForm({ ...internshipForm, duration: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Monthly Stipend (in ₹)"
              type="number"
              placeholder="e.g. 15000"
              value={internshipForm.stipendMin}
              onChange={(e) => setInternshipForm({ ...internshipForm, stipendMin: e.target.value })}
            />

            <Input
              label="Application Deadline"
              type="date"
              value={internshipForm.applicationDeadline}
              onChange={(e) => setInternshipForm({ ...internshipForm, applicationDeadline: e.target.value })}
            />
          </div>

          <Textarea
            label="Internship Overview"
            required
            rows={4}
            placeholder="Describe what the student will work on, mentoring provided, and learning outcomes..."
            value={internshipForm.description}
            onChange={(e) => setInternshipForm({ ...internshipForm, description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Skills Required"
              required
              placeholder="React, CSS, JavaScript"
              value={internshipForm.requiredSkills}
              onChange={(e) => setInternshipForm({ ...internshipForm, requiredSkills: e.target.value })}
            />

            <Input
              label="Preferred Skills"
              placeholder="Git, Figma, Next.js"
              value={internshipForm.preferredSkills}
              onChange={(e) => setInternshipForm({ ...internshipForm, preferredSkills: e.target.value })}
            />
          </div>

          {/* College Year Eligibility */}
          <div className="space-y-1.5">
            <label className="label">Eligible College Years</label>
            <div className="flex gap-4 p-2 rounded-lg bg-[var(--color-surface-2)]">
              {[1, 2, 3, 4].map((yr) => (
                <label key={yr} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={internshipForm.eligibleYears.includes(yr)}
                    onChange={() => toggleYear(yr)}
                    className="rounded text-purple-500 bg-[var(--color-surface-1)]"
                  />
                  <span>Year {yr}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Department Checkboxes */}
          <div className="space-y-1.5">
            <label className="label">Eligible Departments (leave empty for all)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-36 overflow-y-auto p-2 rounded-lg bg-[var(--color-surface-2)]">
              {DEPARTMENTS.map((dept) => (
                <label key={dept} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={internshipForm.eligibleDepartments.includes(dept)}
                    onChange={() => toggleDept(dept)}
                    className="rounded text-purple-500 bg-[var(--color-surface-1)]"
                  />
                  <span className="truncate">{dept}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowPostModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={posting}>
              Publish Internship
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
