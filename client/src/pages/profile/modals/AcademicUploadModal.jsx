import { useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input, Textarea, Select } from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/Toast';
import api, { profileAPI } from '../../../services/api';

export function AcademicUploadModal({
  isOpen,
  onClose,
  mode = 'semester', // 'semester' | 'internship' | 'hackathon' | 'certification'
  currentProfile,
  onSuccess
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Form states
  const [semForm, setSemForm] = useState({
    semester: 1,
    sgpa: '',
    cgpa: '',
    passingYear: new Date().getFullYear(),
    ktCount: 0,
  });

  const [internForm, setInternForm] = useState({
    company: '',
    role: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    skills: '',
  });

  const [hackForm, setHackForm] = useState({
    name: '',
    projectName: '',
    position: '1st Place Winner',
    date: '',
    description: '',
    projectUrl: '',
  });

  const [certForm, setCertForm] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    credentialId: '',
    credentialUrl: '',
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile) return { url: '', filename: '' };
    const fd = new FormData();
    fd.append('certificate', selectedFile);
    const res = await api.post('/profiles/me/certificate', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {
      url: res.data.data.url,
      filename: res.data.data.filename,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedDoc = { url: '', filename: '' };
      if (selectedFile) {
        uploadedDoc = await uploadDocument();
      }

      if (mode === 'semester') {
        const existingResults = currentProfile?.semesterResults || [];
        const newResult = {
          semester: Number(semForm.semester),
          sgpa: semForm.sgpa ? Number(semForm.sgpa) : undefined,
          cgpa: semForm.cgpa ? Number(semForm.cgpa) : undefined,
          passingYear: Number(semForm.passingYear),
          ktCount: Number(semForm.ktCount) || 0,
          marksheetUrl: uploadedDoc.url || '',
          marksheetFilename: uploadedDoc.filename || '',
          uploadedAt: new Date(),
        };

        // Filter out existing semester result if updating
        const filtered = existingResults.filter((r) => r.semester !== newResult.semester);
        const updated = [...filtered, newResult].sort((a, b) => a.semester - b.semester);

        await profileAPI.updateProfile({ semesterResults: updated });
        toast.success(`Semester ${newResult.semester} result & marksheet saved!`);
      } else if (mode === 'internship') {
        const existingInternships = currentProfile?.internships || [];
        const newInternship = {
          ...internForm,
          skills: internForm.skills ? internForm.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
          certificateUrl: uploadedDoc.url || '',
          certificateFilename: uploadedDoc.filename || '',
        };

        await profileAPI.updateProfile({ internships: [newInternship, ...existingInternships] });
        toast.success('Internship & certificate added successfully!');
      } else if (mode === 'hackathon') {
        const existingHackathons = currentProfile?.hackathons || [];
        const newHackathon = {
          ...hackForm,
          certificateUrl: uploadedDoc.url || '',
          certificateFilename: uploadedDoc.filename || '',
        };

        await profileAPI.updateProfile({ hackathons: [newHackathon, ...existingHackathons] });
        toast.success('Hackathon achievement & certificate recorded!');
      } else if (mode === 'certification') {
        const existingCerts = currentProfile?.certifications || [];
        const newCert = {
          ...certForm,
          certificateUrl: uploadedDoc.url || '',
          certificateFilename: uploadedDoc.filename || '',
        };

        await profileAPI.updateProfile({ certifications: [newCert, ...existingCerts] });
        toast.success('Professional certification added!');
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save record.');
    } finally {
      setLoading(false);
    }
  };

  const modalTitles = {
    semester: 'Upload Semester Result & Marksheet',
    internship: 'Add Internship Experience & Certificate',
    hackathon: 'Add Hackathon & Competition Award',
    certification: 'Add Professional Certification',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitles[mode] || 'Upload Credential'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* SEMESTER RESULT MODE */}
        {mode === 'semester' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Semester"
                required
                value={semForm.semester}
                onChange={(e) => setSemForm({ ...semForm, semester: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </Select>

              <Input
                label="Passing Year"
                type="number"
                required
                value={semForm.passingYear}
                onChange={(e) => setSemForm({ ...semForm, passingYear: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Semester SGPA"
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                placeholder="e.g. 9.15"
                value={semForm.sgpa}
                onChange={(e) => setSemForm({ ...semForm, sgpa: e.target.value })}
              />
              <Input
                label="Cumulative CGPA"
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 8.92"
                value={semForm.cgpa}
                onChange={(e) => setSemForm({ ...semForm, cgpa: e.target.value })}
              />
              <Input
                label="Active Backlogs / KTs"
                type="number"
                min="0"
                value={semForm.ktCount}
                onChange={(e) => setSemForm({ ...semForm, ktCount: e.target.value })}
              />
            </div>
          </>
        )}

        {/* INTERNSHIP MODE */}
        {mode === 'internship' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Company / Startup Name"
                required
                placeholder="e.g. Google / Morgan Stanley"
                value={internForm.company}
                onChange={(e) => setInternForm({ ...internForm, company: e.target.value })}
              />
              <Input
                label="Role / Title"
                required
                placeholder="e.g. Software Engineering Intern"
                value={internForm.role}
                onChange={(e) => setInternForm({ ...internForm, role: e.target.value })}
              />
            </div>

            <Input
              label="Location"
              placeholder="e.g. Mumbai / Remote"
              value={internForm.location}
              onChange={(e) => setInternForm({ ...internForm, location: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Start Date"
                type="date"
                required
                value={internForm.startDate}
                onChange={(e) => setInternForm({ ...internForm, startDate: e.target.value })}
              />
              {!internForm.isCurrent && (
                <Input
                  label="End Date"
                  type="date"
                  value={internForm.endDate}
                  onChange={(e) => setInternForm({ ...internForm, endDate: e.target.value })}
                />
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--color-text-secondary)]">
              <input
                type="checkbox"
                checked={internForm.isCurrent}
                onChange={(e) => setInternForm({ ...internForm, isCurrent: e.target.checked })}
                className="rounded border-[var(--color-surface-border)] text-blue-500"
              />
              I am currently working here
            </label>

            <Textarea
              label="Project Description & Responsibilities"
              rows={3}
              placeholder="Key contributions, architectures built, and results..."
              value={internForm.description}
              onChange={(e) => setInternForm({ ...internForm, description: e.target.value })}
            />

            <Input
              label="Skills & Tools Used"
              placeholder="React, Python, FastAPI, Docker"
              value={internForm.skills}
              onChange={(e) => setInternForm({ ...internForm, skills: e.target.value })}
            />
          </>
        )}

        {/* HACKATHON MODE */}
        {mode === 'hackathon' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Hackathon / Competition Name"
                required
                placeholder="e.g. Smart India Hackathon 2024"
                value={hackForm.name}
                onChange={(e) => setHackForm({ ...hackForm, name: e.target.value })}
              />
              <Input
                label="Project Title"
                placeholder="e.g. AlumNetra Smart Portal"
                value={hackForm.projectName}
                onChange={(e) => setHackForm({ ...hackForm, projectName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Position / Award"
                required
                value={hackForm.position}
                onChange={(e) => setHackForm({ ...hackForm, position: e.target.value })}
              >
                <option value="1st Place Winner">🏆 1st Place Winner</option>
                <option value="2nd Place Runner Up">🥈 2nd Place Runner Up</option>
                <option value="3rd Place Winner">🥉 3rd Place Winner</option>
                <option value="Grand Finalist">🌟 Grand Finalist</option>
                <option value="Special Mention">✨ Special Category Winner</option>
                <option value="Participant">📜 Active Participant</option>
              </Select>

              <Input
                label="Date"
                type="date"
                value={hackForm.date}
                onChange={(e) => setHackForm({ ...hackForm, date: e.target.value })}
              />
            </div>

            <Input
              label="Project Demo / GitHub Link (optional)"
              placeholder="https://github.com/..."
              value={hackForm.projectUrl}
              onChange={(e) => setHackForm({ ...hackForm, projectUrl: e.target.value })}
            />

            <Textarea
              label="Brief Description & Problem Solved"
              rows={2}
              placeholder="Summary of the project..."
              value={hackForm.description}
              onChange={(e) => setHackForm({ ...hackForm, description: e.target.value })}
            />
          </>
        )}

        {/* CERTIFICATION MODE */}
        {mode === 'certification' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Certificate / Course Name"
                required
                placeholder="e.g. AWS Solutions Architect Associate"
                value={certForm.name}
                onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
              />
              <Input
                label="Issuing Organization"
                required
                placeholder="e.g. Amazon Web Services / Coursera / NPTEL"
                value={certForm.issuer}
                onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Issue Date"
                type="date"
                value={certForm.issueDate}
                onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
              />
              <Input
                label="Credential ID / License"
                placeholder="e.g. AWS-12345"
                value={certForm.credentialId}
                onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
              />
            </div>

            <Input
              label="Credential URL / Verification Link"
              placeholder="https://www.credly.com/..."
              value={certForm.credentialUrl}
              onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
            />
          </>
        )}

        {/* DOCUMENT / CERTIFICATE FILE UPLOAD */}
        <div className="space-y-2 pt-2 border-t border-[var(--color-surface-border)]">
          <label className="label">
            {mode === 'semester' ? 'Official Marksheet Document (PDF / Image)' : 'Certificate Document / Proof (PDF / Image)'}
          </label>

          <div className="p-4 rounded-xl border border-dashed border-[var(--color-surface-border)] bg-[var(--color-surface-2)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/15 text-blue-400">
                <UploadCloud size={20} />
              </div>
              <div className="text-xs">
                {selectedFile ? (
                  <>
                    <p className="font-bold text-[var(--color-text-primary)] truncate max-w-xs">{selectedFile.name}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-[var(--color-text-primary)]">Upload verification certificate / scan</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">PDF, PNG, JPG accepted (Max 10MB)</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="btn btn-secondary btn-sm cursor-pointer text-xs">
                {selectedFile ? 'Change File' : 'Browse File'}
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-rose-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-surface-border)]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} className="flex items-center gap-1.5">
            <CheckCircle2 size={16} /> Save to Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
}
