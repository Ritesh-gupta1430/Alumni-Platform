import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Search,
  MapPin,
  Building,
  Plus,
  Calendar,
  Sparkles,
  ExternalLink,
  DollarSign,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { jobsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate, DEPARTMENTS, YEARS } from '../../lib/utils';

export default function JobsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedWorkMode, setSelectedWorkMode] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Post Job Modal State
  const [showPostModal, setShowPostModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    companyName: '',
    location: '',
    workMode: 'onsite',
    ctcMin: '',
    ctcMax: '',
    ctcDisplayText: '',
    description: '',
    responsibilities: '',
    requiredSkills: '',
    preferredSkills: '',
    minCGPA: '',
    eligibleDepartments: [],
    eligibleGraduationYears: [],
    applicationDeadline: '',
    isReferralOnly: false,
  });

  const canPostJob = [
    'RECRUITER',
    'ALUMNI',
    'PLACEMENT_OFFICER',
    'ADMIN',
    'SUPER_ADMIN',
  ].includes(user?.role);

  // Fetch Jobs
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jobsAPI.list({
        type: 'job',
        q: searchQuery || undefined,
        department: selectedDepartment || undefined,
        workMode: selectedWorkMode || undefined,
        location: locationFilter || undefined,
        page,
        limit: 9,
      });
      setJobs(res.data.data.jobs || []);
      setTotalPages(res.data.data.pages || 1);
    } catch (err) {
      toast.error('Failed to load job listings.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedDepartment, selectedWorkMode, locationFilter, page, toast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Handle Post Job Form Submission
  const handlePostJob = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      const payload = {
        ...jobForm,
        type: 'job',
        ctcMin: Number(jobForm.ctcMin) || undefined,
        ctcMax: Number(jobForm.ctcMax) || undefined,
        minCGPA: Number(jobForm.minCGPA) || undefined,
        responsibilities: jobForm.responsibilities
          ? jobForm.responsibilities.split('\n').map((r) => r.trim()).filter(Boolean)
          : [],
        requiredSkills: jobForm.requiredSkills
          ? jobForm.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        preferredSkills: jobForm.preferredSkills
          ? jobForm.preferredSkills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const res = await jobsAPI.create(payload);
      toast.success(res.data.message || 'Job created successfully!');
      setShowPostModal(false);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job.');
    } finally {
      setPosting(false);
    }
  };

  const toggleDept = (dept) => {
    setJobForm((prev) => {
      const exists = prev.eligibleDepartments.includes(dept);
      return {
        ...prev,
        eligibleDepartments: exists
          ? prev.eligibleDepartments.filter((d) => d !== dept)
          : [...prev.eligibleDepartments, dept],
      };
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
            <Briefcase className="text-blue-400" size={26} />
            Career Opportunities & Jobs
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Explore curated full-time positions, alumni referrals, and on-campus placement drives.
          </p>
        </div>

        {canPostJob && (
          <Button
            onClick={() => setShowPostModal(true)}
            variant="primary"
            className="flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
          >
            <Plus size={16} /> Post a Job
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-1">
            <Input
              icon={Search}
              placeholder="Search title, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

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

          <Input
            icon={MapPin}
            placeholder="City / Location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Job Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card p-6 h-56 animate-pulse bg-[var(--color-surface-2)]" />
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 flex flex-col justify-between hover:border-blue-500/50 transition-all shadow-md group relative"
            >
              <div className="space-y-3">
                {/* Top Company & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                      <Building size={14} />
                      {job.companyName}
                    </span>
                    <Link
                      to={`/jobs/${job._id}`}
                      className="text-base font-bold text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors block mt-0.5 line-clamp-1"
                    >
                      {job.title}
                    </Link>
                  </div>
                  {job.isReferralOnly && (
                    <span className="badge badge-gold text-[10px] whitespace-nowrap">
                      ★ Referral
                    </span>
                  )}
                </div>

                {/* Location & CTC Details */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-[var(--color-text-muted)]">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-rose-400" />
                      {job.location}
                    </span>
                  )}
                  {job.workMode && (
                    <span className="capitalize px-2 py-0.5 rounded bg-[var(--color-surface-2)] text-[11px]">
                      {job.workMode}
                    </span>
                  )}
                </div>

                {/* CTC Display */}
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <DollarSign size={14} />
                  <span>
                    {job.ctcDisplayText ||
                      (job.ctcMin && job.ctcMax ? `${job.ctcMin} - ${job.ctcMax} LPA` : job.ctcMin ? `${job.ctcMin} LPA` : 'Competitive Package')}
                  </span>
                </div>

                {/* Description Snippet */}
                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Required Skills Chips */}
                {job.requiredSkills && job.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.requiredSkills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-surface-border)]"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 3 && (
                      <span className="text-[11px] text-[var(--color-text-muted)] self-center">
                        +{job.requiredSkills.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--color-surface-border)]">
                {job.applicationDeadline ? (
                  <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                    <Calendar size={12} />
                    Apply by {formatDate(job.applicationDeadline, 'MMM d')}
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-400 font-medium">Actively Hiring</span>
                )}

                <Link to={`/jobs/${job._id}`}>
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
          <Briefcase size={40} className="mx-auto opacity-30 mb-2" />
          <p className="font-semibold text-[var(--color-text-primary)]">No jobs found</p>
          <p className="text-xs">Try adjusting your filters or search keywords.</p>
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

      {/* ===== POST A JOB MODAL ===== */}
      <Modal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        title="Post a New Full-time Job"
        size="lg"
      >
        <form onSubmit={handlePostJob} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Job Title"
              required
              placeholder="e.g. Associate Software Engineer"
              value={jobForm.title}
              onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
            />

            <Input
              label="Company Name"
              required
              placeholder="e.g. Oracle, Reliance Jio, TCS"
              value={jobForm.companyName}
              onChange={(e) => setJobForm({ ...jobForm, companyName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Job Location"
              placeholder="e.g. Mumbai / Bangalore"
              value={jobForm.location}
              onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
            />

            <Select
              label="Work Mode"
              value={jobForm.workMode}
              onChange={(e) => setJobForm({ ...jobForm, workMode: e.target.value })}
            >
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </Select>

            <Input
              label="Application Deadline"
              type="date"
              value={jobForm.applicationDeadline}
              onChange={(e) => setJobForm({ ...jobForm, applicationDeadline: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Min CTC (in LPA)"
              type="number"
              step="0.5"
              placeholder="e.g. 6.5"
              value={jobForm.ctcMin}
              onChange={(e) => setJobForm({ ...jobForm, ctcMin: e.target.value })}
            />

            <Input
              label="Max CTC (in LPA)"
              type="number"
              step="0.5"
              placeholder="e.g. 12"
              value={jobForm.ctcMax}
              onChange={(e) => setJobForm({ ...jobForm, ctcMax: e.target.value })}
            />

            <Input
              label="Min CGPA"
              type="number"
              step="0.1"
              placeholder="e.g. 7.5"
              value={jobForm.minCGPA}
              onChange={(e) => setJobForm({ ...jobForm, minCGPA: e.target.value })}
            />
          </div>

          <Textarea
            label="Job Description"
            required
            rows={4}
            placeholder="Detailed description of the role, team, and company..."
            value={jobForm.description}
            onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
          />

          <Textarea
            label="Key Responsibilities"
            rows={3}
            hint="Enter each responsibility on a new line"
            placeholder="• Design scalable APIs&#10;• Collaborate with cross-functional teams"
            value={jobForm.responsibilities}
            onChange={(e) => setJobForm({ ...jobForm, responsibilities: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Required Skills"
              required
              hint="Comma-separated (e.g. Java, Spring Boot, MySQL)"
              placeholder="React, Node.js, SQL"
              value={jobForm.requiredSkills}
              onChange={(e) => setJobForm({ ...jobForm, requiredSkills: e.target.value })}
            />

            <Input
              label="Preferred Skills"
              hint="Comma-separated"
              placeholder="Docker, Kubernetes, AWS"
              value={jobForm.preferredSkills}
              onChange={(e) => setJobForm({ ...jobForm, preferredSkills: e.target.value })}
            />
          </div>

          {/* Eligible Departments Checkboxes */}
          <div className="space-y-1.5">
            <label className="label">Eligible Departments (leave empty for all)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-36 overflow-y-auto p-2 rounded-lg bg-[var(--color-surface-2)]">
              {DEPARTMENTS.map((dept) => (
                <label key={dept} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobForm.eligibleDepartments.includes(dept)}
                    onChange={() => toggleDept(dept)}
                    className="rounded text-blue-500 bg-[var(--color-surface-1)]"
                  />
                  <span className="truncate">{dept}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isReferralOnly"
              checked={jobForm.isReferralOnly}
              onChange={(e) => setJobForm({ ...jobForm, isReferralOnly: e.target.checked })}
              className="rounded text-amber-500 bg-[var(--color-surface-2)]"
            />
            <label htmlFor="isReferralOnly" className="text-xs cursor-pointer select-none">
              This is an Alumni Referral opportunity (verified alumni direct referral)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowPostModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={posting}>
              Publish Job Listing
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
