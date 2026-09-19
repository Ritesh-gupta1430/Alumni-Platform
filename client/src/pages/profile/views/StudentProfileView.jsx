import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Plus,
  Edit3,
  ExternalLink,
  Code2,
  Sparkles,
  CheckCircle2,
  ThumbsUp,
  Target,
  Compass,
  Download,
  Eye,
  Building,
  Calendar,
  Layers,
  TrendingUp,
  Trophy,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';

export function StudentProfileView({
  user,
  profile,
  experiences = [],
  projects = [],
  isOwnProfile,
  onOpenExpModal,
  onOpenResumeModal,
  onUploadResume,
  uploadingResume,
  onOpenAcademicModal,
  onViewDocument
}) {
  const toast = useToast();
  const [endorsedSkills, setEndorsedSkills] = useState({});

  const handleEndorseSkill = (skillName) => {
    if (isOwnProfile) {
      toast.info('Peers and alumni can endorse your skills!');
      return;
    }
    setEndorsedSkills((prev) => ({
      ...prev,
      [skillName]: !prev[skillName],
    }));
    toast.success(`Endorsed ${skillName}!`);
  };

  const skillsList = profile?.skills || [];
  const semesterResults = (profile?.semesterResults || []).sort((a, b) => a.semester - b.semester);
  const internships = profile?.internships || [];
  const hackathons = profile?.hackathons || [];
  const certifications = profile?.certifications || [];
  const achievements = profile?.achievements || [];
  const targetRoles = profile?.targetRoles || [];
  const targetCompanies = profile?.targetCompanies || [];

  return (
    <div className="space-y-6">
      {/* ===== 1. STUDENT ACADEMIC CREDENTIALS & CAREER READINESS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Academic Profile Card */}
        <div className="card p-5 md:col-span-2 space-y-4 border border-[var(--color-surface-border)] relative overflow-hidden bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                <GraduationCap size={20} />
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Academic Identity</h3>
            </div>
            <span className="badge badge-blue">
              {user.currentYear ? `Year ${user.currentYear}` : 'Student'} • {user.division ? `Div ${user.division}` : 'TCET'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Department</span>
              <strong className="text-[var(--color-text-primary)] truncate block">{user.department || 'Engineering'}</strong>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Roll Number</span>
              <strong className="text-[var(--color-text-primary)] font-mono block">{user.rollNumber || '—'}</strong>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">PRN Number</span>
              <strong className="text-[var(--color-text-primary)] font-mono block">{user.prnNumber || '—'}</strong>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface-0)]/60 border border-[var(--color-surface-border)]">
              <span className="text-[var(--color-text-muted)] block mb-1">Graduation Batch</span>
              <strong className="text-blue-400 font-bold block">{user.graduationYear ? `Class of ${user.graduationYear}` : '—'}</strong>
            </div>
          </div>
        </div>

        {/* Career Readiness & Opportunities Card */}
        <div className="card p-5 space-y-4 border border-[var(--color-surface-border)] flex flex-col justify-between bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-emerald-400" />
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">Career Readiness</h3>
              </div>
              <span className={`badge ${profile?.openToOpportunities !== false ? 'badge-green' : 'badge-gray'}`}>
                {profile?.openToOpportunities !== false ? '🟢 Open to Roles' : '⚪ Focused on Studies'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {targetRoles.length > 0 && (
                <div>
                  <span className="text-[var(--color-text-muted)] block mb-1 font-medium">Target Roles</span>
                  <div className="flex flex-wrap gap-1.5">
                    {targetRoles.map((role, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {targetCompanies.length > 0 && (
                <div>
                  <span className="text-[var(--color-text-muted)] block mb-1 font-medium">Dream Companies</span>
                  <div className="flex flex-wrap gap-1.5">
                    {targetCompanies.map((comp, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-medium">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-[var(--color-text-muted)] block mb-1 font-medium">Work Preference</span>
                <span className="text-[var(--color-text-primary)] font-semibold capitalize">
                  {profile?.workPreference || 'Hybrid / Remote / On-site'}
                </span>
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <Link to="/ai" className="btn btn-outline btn-sm w-full flex items-center justify-center gap-1.5 text-xs text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 mt-2">
              <Sparkles size={14} /> AI Career & Resume Boost
            </Link>
          )}
        </div>
      </div>

      {/* ===== 2. ALL SEMESTER RESULTS & MARKSHEET TRACKER ===== */}
      <div className="card p-6 space-y-4 border border-[var(--color-surface-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TrendingUp size={20} className="text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Semester Academic Performance & Marksheets</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Verified semester-wise SGPA and uploaded official university marksheets</p>
            </div>
          </div>
          {isOwnProfile && (
            <Button
              onClick={() => onOpenAcademicModal('semester')}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus size={14} /> Add Semester Result
            </Button>
          )}
        </div>

        {semesterResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {semesterResults.map((res) => (
              <div
                key={res.semester}
                className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-blue-500/30 transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">
                    Semester {res.semester}
                  </span>
                  {res.passingYear && (
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">{res.passingYear}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-[var(--color-text-secondary)]">SGPA</span>
                    <span className="text-lg font-black text-blue-400">{res.sgpa ? res.sgpa.toFixed(2) : '—'}</span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-3)] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, ((res.sgpa || 0) / 10) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-surface-border)] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    {res.ktCount > 0 ? `${res.ktCount} Backlog(s)` : '0 Backlogs (Clear)'}
                  </span>

                  {res.marksheetUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        onViewDocument({
                          title: `Semester ${res.semester} Marksheet`,
                          subtitle: `SGPA: ${res.sgpa} • Class of ${res.passingYear || ''}`,
                          url: res.marksheetUrl,
                          filename: res.marksheetFilename || `Sem_${res.semester}_Marksheet.pdf`,
                        })
                      }
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Eye size={12} /> Marksheet
                    </button>
                  ) : (
                    <span className="text-[10px] text-[var(--color-text-muted)] italic">No file attached</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[var(--color-surface-2)]/50 rounded-xl border border-dashed border-[var(--color-surface-border)] space-y-2">
            <p className="text-xs text-[var(--color-text-muted)]">No semester results recorded yet.</p>
            {isOwnProfile && (
              <Button onClick={() => onOpenAcademicModal('semester')} variant="outline" size="sm" className="text-xs">
                + Upload Semester 1–8 Marksheets
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ===== 3. INTERNSHIP EXPERIENCES & CERTIFICATES ===== */}
      <div className="card p-6 space-y-4 border border-[var(--color-surface-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Briefcase size={20} className="text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Internships & Work Experience</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Verified corporate internships, roles, and completion letters</p>
            </div>
          </div>
          {isOwnProfile && (
            <Button
              onClick={() => onOpenAcademicModal('internship')}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus size={14} /> Add Internship
            </Button>
          )}
        </div>

        {internships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {internships.map((intern, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-text-primary)]">{intern.role}</h4>
                      <p className="text-xs font-semibold text-emerald-400">{intern.company}</p>
                    </div>
                    <span className="badge badge-green text-[10px]">
                      {intern.isCurrent ? 'Present' : 'Completed'}
                    </span>
                  </div>

                  {intern.description && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-2 line-clamp-3 leading-relaxed">
                      {intern.description}
                    </p>
                  )}

                  {intern.skills && intern.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {intern.skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-[var(--color-surface-3)] text-[10px] text-[var(--color-text-secondary)]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--color-surface-border)] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                    <Calendar size={12} />
                    {intern.startDate ? new Date(intern.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''}
                    {' — '}
                    {intern.isCurrent ? 'Present' : intern.endDate ? new Date(intern.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''}
                  </span>

                  {intern.certificateUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        onViewDocument({
                          title: `${intern.role} Certificate`,
                          subtitle: `${intern.company} • Internship Completion Proof`,
                          url: intern.certificateUrl,
                          filename: intern.certificateFilename || 'Internship_Certificate.pdf',
                        })
                      }
                      className="btn btn-secondary btn-sm text-[11px] flex items-center gap-1 px-2.5 py-1"
                    >
                      <Eye size={12} /> View Certificate
                    </button>
                  ) : (
                    <span className="text-[10px] text-[var(--color-text-muted)] italic">No certificate uploaded</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[var(--color-surface-2)]/50 rounded-xl border border-dashed border-[var(--color-surface-border)] space-y-2">
            <p className="text-xs text-[var(--color-text-muted)]">No internship experiences added yet.</p>
            {isOwnProfile && (
              <Button onClick={() => onOpenAcademicModal('internship')} variant="outline" size="sm" className="text-xs">
                + Add Internship Details & Certificate
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ===== 4. HACKATHONS & COMPETITIONS SHOWCASE ===== */}
      <div className="card p-6 space-y-4 border border-[var(--color-surface-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy size={20} className="text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Hackathons & Competitive Coding</h3>
              <p className="text-xs text-[var(--color-text-muted)]">National/institutional hackathons, awards, and project achievements</p>
            </div>
          </div>
          {isOwnProfile && (
            <Button
              onClick={() => onOpenAcademicModal('hackathon')}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus size={14} /> Add Hackathon
            </Button>
          )}
        </div>

        {hackathons.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {hackathons.map((hack, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">{hack.name}</h4>
                    <span className="badge badge-gold text-[10px] shrink-0 font-bold">{hack.position}</span>
                  </div>

                  {hack.projectName && (
                    <p className="text-xs font-medium text-amber-400/90 mt-1">
                      Project: {hack.projectName}
                    </p>
                  )}

                  {hack.description && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                      {hack.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--color-surface-border)] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {hack.date ? new Date(hack.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''}
                  </span>

                  {hack.certificateUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        onViewDocument({
                          title: `${hack.name} Award Certificate`,
                          subtitle: `${hack.position} • Project: ${hack.projectName || ''}`,
                          url: hack.certificateUrl,
                          filename: hack.certificateFilename || 'Hackathon_Certificate.pdf',
                        })
                      }
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Eye size={12} /> Certificate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[var(--color-surface-2)]/50 rounded-xl border border-dashed border-[var(--color-surface-border)] space-y-2">
            <p className="text-xs text-[var(--color-text-muted)]">No hackathon achievements recorded yet.</p>
            {isOwnProfile && (
              <Button onClick={() => onOpenAcademicModal('hackathon')} variant="outline" size="sm" className="text-xs">
                + Add Hackathon Award & Certificate
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ===== 5. TECHNICAL CERTIFICATIONS ===== */}
      <div className="card p-6 space-y-4 border border-[var(--color-surface-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award size={20} className="text-purple-400" />
            <div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Professional & Online Certifications</h3>
              <p className="text-xs text-[var(--color-text-muted)]">AWS, Coursera, NPTEL, Google, and industry credentials</p>
            </div>
          </div>
          {isOwnProfile && (
            <Button
              onClick={() => onOpenAcademicModal('certification')}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus size={14} /> Add Certification
            </Button>
          )}
        </div>

        {certifications.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {certifications.map((cert, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-purple-500/30 transition-all flex flex-col justify-between gap-2"
              >
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)]">{cert.name}</h4>
                  <p className="text-[11px] font-semibold text-purple-400 mt-0.5">{cert.issuer}</p>
                  {cert.credentialId && (
                    <p className="text-[10px] font-mono text-[var(--color-text-muted)] mt-1 truncate">
                      ID: {cert.credentialId}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--color-surface-border)] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''}
                  </span>

                  <div className="flex items-center gap-2">
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:underline text-[11px] flex items-center gap-1"
                      >
                        <ExternalLink size={11} /> Link
                      </a>
                    )}
                    {cert.certificateUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          onViewDocument({
                            title: cert.name,
                            subtitle: `Issued by ${cert.issuer}`,
                            url: cert.certificateUrl,
                            filename: cert.certificateFilename || 'Certificate.pdf',
                          })
                        }
                        className="text-[var(--color-text-primary)] hover:text-purple-400 font-semibold flex items-center gap-1 text-[11px]"
                      >
                        <Eye size={12} /> Certificate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[var(--color-surface-2)]/50 rounded-xl border border-dashed border-[var(--color-surface-border)] space-y-2">
            <p className="text-xs text-[var(--color-text-muted)]">No external certifications recorded yet.</p>
            {isOwnProfile && (
              <Button onClick={() => onOpenAcademicModal('certification')} variant="outline" size="sm" className="text-xs">
                + Add Online Certification
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ===== 6. SKILLS & ENDORSEMENTS ===== */}
      <div className="card p-6 space-y-4 border border-[var(--color-surface-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-cyan-400" />
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">Technical & Domain Skills</h3>
            <span className="text-xs text-[var(--color-text-muted)]">({skillsList.length})</span>
          </div>
          {isOwnProfile && (
            <Link to="/settings" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              <Edit3 size={13} /> Manage Skills
            </Link>
          )}
        </div>

        {skillsList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {skillsList.map((skill, index) => {
              const proficiency = skill.proficiency || 'intermediate';
              const proficiencyPct =
                proficiency === 'expert' ? 100 : proficiency === 'advanced' ? 75 : proficiency === 'intermediate' ? 50 : 25;
              const isEndorsed = endorsedSkills[skill.name];

              return (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-cyan-500/30 transition-all flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[var(--color-text-primary)]">{skill.name}</span>
                    <button
                      type="button"
                      onClick={() => handleEndorseSkill(skill.name)}
                      className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                        isEndorsed
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                          : 'text-[var(--color-text-muted)] hover:text-cyan-400 hover:bg-[var(--color-surface-3)]'
                      }`}
                      title="Endorse this skill"
                    >
                      <ThumbsUp size={11} />
                      <span>{isEndorsed ? 'Endorsed (1)' : 'Endorse'}</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-[var(--color-surface-3)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${proficiencyPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">
                      <span>{proficiency}</span>
                      <span>{proficiencyPct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-[var(--color-surface-2)]/50 rounded-xl border border-dashed border-[var(--color-surface-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">No skills listed yet.</p>
          </div>
        )}
      </div>

      {/* ===== 7. STUDENT PROJECTS & RESUME ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Student Resume / CV */}
        <div className="card p-5 space-y-3 border border-[var(--color-surface-border)] bg-[var(--color-surface-1)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Student Resume / CV</h3>
            </div>
            {profile?.resume?.url && <span className="badge badge-green text-[10px]">Verified Document</span>}
          </div>

          {profile?.resume?.url ? (
            <div className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex items-center justify-between gap-3">
              <div className="truncate">
                <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                  {profile.resume.filename || 'Resume_Document.pdf'}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {profile.resume.uploadedAt ? `Updated on ${new Date(profile.resume.uploadedAt).toLocaleDateString()}` : 'Ready for review'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button onClick={onOpenResumeModal} variant="secondary" size="sm" className="flex items-center gap-1 text-xs">
                  <Eye size={13} /> View
                </Button>
                <a
                  href={profile.resume.url}
                  download={profile.resume.filename || 'Resume.pdf'}
                  className="btn btn-primary btn-sm flex items-center gap-1 text-xs"
                >
                  <Download size={13} />
                </a>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center bg-[var(--color-surface-2)] rounded-xl border border-dashed border-[var(--color-surface-border)]">
              <p className="text-xs text-[var(--color-text-muted)] mb-3">No resume uploaded.</p>
              {isOwnProfile && (
                <label className="btn btn-primary btn-sm inline-flex items-center gap-1.5 cursor-pointer text-xs">
                  <FileText size={13} /> Upload Resume (PDF)
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onUploadResume} disabled={uploadingResume} />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Projects Preview */}
        <div className="card p-5 space-y-3 border border-[var(--color-surface-border)] bg-[var(--color-surface-1)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-purple-400" />
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Project Repository ({projects.length})</h3>
            </div>
            <Link to="/projects" className="text-xs text-purple-400 hover:underline">
              View All
            </Link>
          </div>

          {projects.length > 0 ? (
            <div className="space-y-2">
              {projects.slice(0, 2).map((proj) => (
                <div key={proj._id} className="p-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[var(--color-text-primary)] block">{proj.title}</span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">{proj.category || 'Engineering Project'}</span>
                  </div>
                  {proj.liveUrl && (
                    <a href={proj.liveUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline text-[11px]">
                      Live Demo ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center bg-[var(--color-surface-2)] rounded-xl border border-dashed border-[var(--color-surface-border)]">
              <p className="text-xs text-[var(--color-text-muted)]">No projects published yet.</p>
            </div>
          )}

          {isOwnProfile && (
            <Link to="/projects" className="btn btn-secondary btn-sm w-full text-xs flex items-center justify-center gap-1">
              <Plus size={13} /> Manage Projects Portfolio
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
