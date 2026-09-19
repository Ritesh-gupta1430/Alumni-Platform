import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  Sparkles,
  Cpu,
  FileText,
  Compass,
  Users,
  Bot,
  CheckCircle2,
  AlertCircle,
  Award,
  Zap,
  Check,
  Send,
  RefreshCw,
  Target,
  Layers,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  Code2,
} from 'lucide-react';

export default function AIToolsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('resume');
  const [engineStatus, setEngineStatus] = useState(null);

  useEffect(() => {
    fetchEngineStatus();
  }, []);

  const fetchEngineStatus = async () => {
    try {
      const res = await api.get('/ai/status');
      if (res.data?.success) {
        setEngineStatus(res.data.data);
      }
    } catch {
      setEngineStatus({ activeEngine: 'node_builtin_fallback' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 mb-8 glass border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-accent/10">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-8 w-48 h-48 bg-accent/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              AlumNetra AI Intelligence Suite
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-text-primary">
              AI Recommendation & Analytics Engine
            </h1>
            <p className="mt-2 text-text-secondary text-sm sm:text-base max-w-2xl">
              Leverage TF-IDF vector matching, structural ATS resume scoring, and machine learning skill graphs powered by Python and scikit-learn.
            </p>
          </div>

          {/* Engine Status Pill */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl glass border border-border text-xs">
              <div className={`w-2.5 h-2.5 rounded-full ${engineStatus?.activeEngine === 'python_microservice' ? 'bg-emerald-400 animate-ping' : 'bg-primary'}`} />
              <Cpu className="w-4 h-4 text-primary" />
              <div className="text-left">
                <span className="font-semibold text-text-primary block">
                  {engineStatus?.activeEngine === 'python_microservice' ? 'Python Vector Service' : 'AlumNetra AI Engine'}
                </span>
                <span className="text-[10px] text-text-muted">
                  {engineStatus?.activeEngine === 'python_microservice' ? 'FastAPI • Scikit-Learn TF-IDF' : 'Integrated Node.js Fallback'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2 scrollbar-none border-b border-border/50">
          {[
            { id: 'resume', label: 'Resume ATS Analyzer', icon: FileText },
            { id: 'roadmap', label: 'Career Skill Roadmap', icon: Compass },
            { id: 'mentors', label: 'Vector Mentor Matchmaker', icon: Users },
            { id: 'assistant', label: 'AlumNetra Assistant', icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'resume' && <ResumeAnalyzerTab />}
      {activeTab === 'roadmap' && <CareerRoadmapTab />}
      {activeTab === 'mentors' && <MentorMatchmakerTab user={user} />}
      {activeTab === 'assistant' && <AIAssistantTab user={user} />}
    </div>
  );
}

/* =========================================================================
   TAB 1: AI RESUME ANALYZER (PDF + TEXT MODES)
   ========================================================================= */
function ResumeAnalyzerTab() {
  const [inputMode, setInputMode] = useState('pdf'); // 'pdf' | 'text'
  const [resumeText, setResumeText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const sampleResume = `RITESH PATIL
Email: ritesh.patil@tcetmumbai.in | Phone: +91 9876543210 | Mumbai, India
GitHub: github.com/riteshpatil | LinkedIn: linkedin.com/in/riteshpatil | Portfolio: riteshpatil.dev

EDUCATION
Thakur College of Engineering and Technology (TCET), Mumbai
B.Tech in Information Technology | CGPA: 9.12/10.0 (2022 - 2026)

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Java, SQL, C++
Frontend: React.js, Next.js, Tailwind CSS, Redux Toolkit, HTML5, CSS3
Backend: Node.js, Express.js, FastAPI, REST APIs, GraphQL
Databases & Cloud: MongoDB, PostgreSQL, Redis, Docker, AWS, Git

PROJECTS
AlumNetra - Institutional Alumni Engagement Platform
• Architected full-stack institutional portal with MERN stack, Tailwind CSS, and Python recommendation microservice.
• Engineered TF-IDF vector similarity engine scoring candidate-mentor profile alignment with sub-50ms latency.
• Implemented automated 80G tax receipt PDF generation and integrated multi-factor document verification.

CloudOps Distributed Task Scheduler
• Developed resilient background task orchestration system utilizing Node.js, Redis queues, and Docker.
• Reduced queue processing latency by 45% and scaled throughput to 500+ concurrent requests.

EXPERIENCE & INTERNSHIPS
Software Engineering Intern | TechNova Labs (June 2025 - August 2025)
• Built reusable React component libraries and integrated RESTful endpoints for enterprise dashboard.
• Automated CI/CD deployment pipelines using GitHub Actions, improving build speed by 30%.

ACHIEVEMENTS & CERTIFICATIONS
• Winner (1st Rank) - Smart India Hackathon (Internal TCET Round 2024)
• AWS Certified Cloud Practitioner
• Solved 350+ DSA problems on LeetCode`;

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      if (!file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
        setError('Please upload a PDF (.pdf) or Text (.txt) resume file.');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
        setError('Please upload a PDF (.pdf) or Text (.txt) resume file.');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleAnalyze = async (overrideText) => {
    setError('');
    setLoading(true);

    try {
      if (inputMode === 'pdf' && selectedFile && !overrideText) {
        const formData = new FormData();
        formData.append('resume', selectedFile);

        const res = await api.post('/ai/resume/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data?.success) {
          setResult(res.data.data);
        }
      } else {
        const text = overrideText || resumeText;
        if (!text || text.trim().length < 30) {
          setError('Please paste or load at least 30 characters of resume text.');
          setLoading(false);
          return;
        }

        const res = await api.post('/ai/resume/analyze', { resumeText: text });
        if (res.data?.success) {
          setResult(res.data.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Input Side */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="glass p-6 rounded-3xl border border-border">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 p-1 bg-surface-elevated rounded-xl border border-border">
              <button
                type="button"
                onClick={() => { setInputMode('pdf'); setError(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  inputMode === 'pdf' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                📄 PDF Upload
              </button>
              <button
                type="button"
                onClick={() => { setInputMode('text'); setError(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  inputMode === 'text' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                ✏️ Paste Text
              </button>
            </div>

            {inputMode === 'text' && (
              <button
                onClick={() => {
                  setResumeText(sampleResume);
                  handleAnalyze(sampleResume);
                }}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Sample
              </button>
            )}
          </div>

          {inputMode === 'pdf' ? (
            /* PDF Upload & Drag-and-Drop Zone */
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById('resume-pdf-input')?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-primary/60 bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-surface-elevated'
                }`}
              >
                <input
                  id="resume-pdf-input"
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-sm text-text-primary">
                  {selectedFile ? selectedFile.name : 'Upload your PDF Resume'}
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB • Ready to analyze`
                    : 'Drag and drop your PDF / TXT file here, or click to browse'}
                </p>
                <span className="inline-block mt-3 px-3 py-1 rounded-full text-[11px] font-semibold bg-surface border border-border text-text-secondary">
                  Supports .PDF and .TXT (Max 8MB)
                </span>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-medium text-text-primary truncate">{selectedFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    className="text-rose-400 hover:text-rose-300 font-bold ml-2"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Plain Text Input */
            <div>
              <p className="text-xs text-text-muted mb-3">
                Paste your resume text including education, projects, skills, and experience for structural and ATS scoring.
              </p>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your plain text resume here..."
                rows={13}
                className="w-full p-4 rounded-2xl bg-surface border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-mono text-text-primary leading-relaxed resize-none scrollbar-thin"
              />
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={() => handleAnalyze()}
            disabled={loading || (inputMode === 'pdf' && !selectedFile)}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {inputMode === 'pdf' ? 'Parsing PDF & Scoring...' : 'Analyzing with AI Engine...'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {inputMode === 'pdf' ? 'Analyze PDF Resume with AI' : 'Analyze Text with AI'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Side */}
      <div className="lg:col-span-7">
        {!result && !loading && (
          <div className="glass p-12 rounded-3xl border border-border text-center flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">No Resume Analyzed Yet</h3>
            <p className="text-text-muted text-sm max-w-md mt-2">
              Paste your resume or click &quot;Load Sample TCET Resume&quot; to run our NLP scoring engine and inspect section health, detected skills, and ATS suggestions.
            </p>
          </div>
        )}

        {loading && (
          <div className="glass p-12 rounded-3xl border border-border flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
              <div className="w-20 h-20 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin flex items-center justify-center">
                <Cpu className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-text-primary">Running AI Diagnostics</h3>
            <p className="text-text-muted text-xs mt-1">
              Extracting technical entities, evaluating action verbs, and computing ATS readability...
            </p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-6">
            {/* Top Score Summary Banner */}
            <div className="glass p-6 rounded-3xl border border-border flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-surface via-surface-elevated to-surface">
              <div className="flex items-center gap-6">
                <div className="relative flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-primary/30 flex flex-col items-center justify-center bg-surface">
                    <span className="text-3xl font-extrabold text-primary font-display">{result.score}%</span>
                    <span className="text-[10px] uppercase font-semibold text-text-muted">ATS Score</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-muted uppercase">Overall Grade:</span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-sm font-bold ${
                      result.grade === 'A+' || result.grade === 'A'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : result.grade === 'B'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      Grade {result.grade}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mt-1">
                    {result.score >= 80 ? 'Excellent Technical Resume' : result.score >= 60 ? 'Strong Foundation with Room to Polish' : 'Needs Structural Improvement'}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Word count: {result.wordCount} words • {result.quantifiableImpactCount || 0} quantifiable outcomes detected
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist & Detected Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ATS Checklist */}
              <div className="glass p-6 rounded-3xl border border-border">
                <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ATS Structural Audit
                </h4>
                <div className="space-y-2.5 text-xs">
                  {result.atsChecklist?.length > 0 ? (
                    result.atsChecklist.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-surface/60 border border-border/50">
                        <div>
                          <span className="font-semibold text-text-primary block">{item.item}</span>
                          <span className="text-[11px] text-text-muted">{item.note}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          item.status === 'pass'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : item.status === 'warn'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    Object.entries(result.sectionsFound || {}).map(([sec, found], idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-surface/60 border border-border/50">
                        <span className="capitalize text-text-primary font-medium">{sec.replace(/([A-Z])/g, ' $1')}</span>
                        {found ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                            <Check className="w-3.5 h-3.5" /> Present
                          </span>
                        ) : (
                          <span className="text-rose-400 text-[11px]">Missing</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Detected Skills Taxonomy */}
              <div className="glass p-6 rounded-3xl border border-border">
                <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" />
                  Extracted Tech Stack ({result.detectedSkills?.length || 0})
                </h4>
                {result.detectedSkills?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    {result.detectedSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20 flex items-center gap-1"
                      >
                        {s.name || s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">No explicit keywords detected in taxonomy dictionary.</p>
                )}
              </div>
            </div>

            {/* Strengths & AI Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="glass p-6 rounded-3xl border border-border">
                <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Identified Strengths
                </h4>
                <ul className="space-y-2 text-xs text-text-secondary">
                  {result.strengths?.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actionable Suggestions */}
              <div className="glass p-6 rounded-3xl border border-border">
                <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Actionable AI Improvements
                </h4>
                <ul className="space-y-2 text-xs text-text-secondary">
                  {result.suggestions?.map((sug, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   TAB 2: AI CAREER ROADMAP & SKILL GRAPH
   ========================================================================= */
function CareerRoadmapTab() {
  const [selectedRole, setSelectedRole] = useState('full stack developer');
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  const careerRoles = [
    { id: 'full stack developer', label: 'Full Stack Software Engineer', desc: 'React, Node, MongoDB, System Design' },
    { id: 'ai engineer', label: 'AI & Machine Learning Engineer', desc: 'Python, PyTorch, Scikit-learn, MLOps' },
    { id: 'cloud devops architect', label: 'Cloud & DevOps Architect', desc: 'Docker, Kubernetes, AWS, Terraform' },
    { id: 'data scientist', label: 'Data Scientist & Analytics Lead', desc: 'SQL, Statistics, Pandas, BI Dashboards' },
  ];

  useEffect(() => {
    fetchRoadmap(selectedRole);
  }, []);

  const fetchRoadmap = async (role) => {
    setLoading(true);
    try {
      const res = await api.post('/ai/career/roadmap', { targetRole: role });
      if (res.data?.success) {
        setRoadmap(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Role Picker Carousel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {careerRoles.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              onClick={() => {
                setSelectedRole(role.id);
                fetchRoadmap(role.id);
              }}
              className={`p-5 rounded-2xl text-left transition-all duration-200 border ${
                isSelected
                  ? 'glass border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.02]'
                  : 'glass border-border hover:border-border/80 hover:bg-surface-elevated'
              }`}
            >
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${isSelected ? 'bg-primary text-white' : 'bg-surface text-text-muted'}`}>
                Track
              </span>
              <h3 className="font-bold text-sm text-text-primary mt-2">{role.label}</h3>
              <p className="text-[11px] text-text-muted mt-1">{role.desc}</p>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="glass p-12 rounded-3xl border border-border flex flex-col items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-sm font-semibold text-text-primary">Generating AI Skill Graph...</p>
        </div>
      )}

      {roadmap && !loading && (
        <div className="space-y-6">
          {/* Target Overview Card */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-border bg-gradient-to-r from-surface via-surface-elevated to-surface">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/30 mb-2">
                  <Target className="w-3.5 h-3.5" />
                  Target Role Architecture
                </div>
                <h2 className="text-2xl font-bold text-text-primary">{roadmap.targetRole}</h2>
                <p className="text-text-secondary text-xs sm:text-sm mt-1 max-w-2xl">{roadmap.description}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0 bg-surface/80 p-4 rounded-2xl border border-border">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary font-bold">
                  <span className="text-xl font-display">{roadmap.readinessScore}%</span>
                  <span className="text-[9px] uppercase text-text-muted">Readiness</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-text-primary block">{roadmap.readinessLabel || 'Evaluation Score'}</span>
                  <span className="text-[11px] text-text-muted">Est. Duration: {roadmap.estimatedTimeToComplete || '3-6 months'}</span>
                </div>
              </div>
            </div>

            {/* Skills Status Pill bar */}
            <div className="mt-6 pt-6 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mastered in Profile ({roadmap.skillsSummary?.masteredCount || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {roadmap.skillsSummary?.mastered?.length > 0 ? (
                    roadmap.skillsSummary.mastered.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-muted">None registered yet in profile.</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Recommended Skills to Acquire ({roadmap.skillsSummary?.missingCount || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {roadmap.skillsSummary?.missing?.slice(0, 8).map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Phased Roadmap Timeline */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Curated Phased Learning Pathway
            </h3>

            <div className="space-y-6">
              {roadmap.phases?.map((phase, idx) => (
                <div key={idx} className="relative pl-6 sm:pl-8 border-l-2 border-primary/30 last:border-l-0 pb-6 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-surface" />
                  <div className="glass p-5 rounded-2xl border border-border/80 bg-surface/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h4 className="font-bold text-sm sm:text-base text-text-primary">{phase.phase}</h4>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 w-fit">
                        {phase.duration}
                      </span>
                    </div>

                    {phase.focus && <p className="text-xs text-text-muted mb-3">{phase.focus}</p>}

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {phase.skills?.map((sk, sIdx) => (
                        <span key={sIdx} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-elevated text-text-secondary border border-border">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capstone Projects & Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recommended Projects */}
            <div className="glass p-6 rounded-3xl border border-border">
              <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Recommended Portfolio Capstones
              </h3>
              <div className="space-y-3">
                {roadmap.capstoneProjects?.map((proj, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-surface/60 border border-border/50">
                    <h4 className="font-bold text-xs text-text-primary">{proj.title}</h4>
                    <p className="text-[11px] text-text-muted mt-1">{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="glass p-6 rounded-3xl border border-border">
              <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-accent" />
                Industry Validated Certifications
              </h3>
              <div className="space-y-2.5">
                {roadmap.recommendedCertifications?.map((cert, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-surface/60 border border-border/50">
                    <Award className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-xs font-semibold text-text-primary">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   TAB 3: VECTOR MENTOR MATCHMAKER
   ========================================================================= */
function MentorMatchmakerTab() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentorRecommendations();
  }, []);

  const fetchMentorRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/recommendations/mentors');
      if (res.data?.success) {
        setMentors(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-3xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            AI Vector Mentor Matchmaker
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Mentors ranked using Scikit-Learn TF-IDF cosine similarity against your skills, career goals, and departmental affiliation.
          </p>
        </div>
        <button
          onClick={fetchMentorRecommendations}
          className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface border border-border text-xs font-semibold text-text-primary flex items-center gap-2 transition-all w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Ranking
        </button>
      </div>

      {loading && (
        <div className="glass p-12 rounded-3xl border border-border flex flex-col items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-sm font-semibold text-text-primary">Calculating Vector Match Scores...</p>
        </div>
      )}

      {!loading && mentors.length === 0 && (
        <div className="glass p-12 rounded-3xl border border-border text-center">
          <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <h3 className="font-bold text-text-primary">No Active Mentors Found</h3>
          <p className="text-xs text-text-muted mt-1">Check back soon or explore the main Mentorship directory.</p>
        </div>
      )}

      {!loading && mentors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mentors.map((mentor) => {
            const mentorUser = mentor.user || {};
            const initials = `${mentorUser.firstName?.[0] || ''}${mentorUser.lastName?.[0] || ''}`.toUpperCase() || 'M';

            return (
              <div
                key={mentor._id}
                className="glass p-6 rounded-3xl border border-border hover:border-primary/50 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {mentorUser.profilePhoto ? (
                        <img
                          src={mentorUser.profilePhoto}
                          alt={mentorUser.firstName}
                          className="w-12 h-12 rounded-2xl object-cover border border-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent text-white font-bold flex items-center justify-center text-sm shadow-md">
                          {initials}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-text-primary flex items-center gap-1.5">
                          {mentorUser.firstName} {mentorUser.lastName}
                          {mentorUser.verificationBadge && (
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          )}
                        </h3>
                        <p className="text-xs text-text-muted line-clamp-1">{mentor.headline || `${mentor.industry || 'Alumnus'} • ${mentor.yearsOfExperience || 0} yrs exp`}</p>
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div className="flex flex-col items-end">
                      <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-gradient-to-r from-primary to-accent text-white shadow-md">
                        {mentor.matchScore || 85}% Match
                      </span>
                    </div>
                  </div>

                  {/* Reasons for Match */}
                  {mentor.matchReasons?.length > 0 && (
                    <div className="mt-4 p-3 rounded-2xl bg-surface/60 border border-border/60">
                      <span className="text-[10px] font-bold uppercase text-primary tracking-wider block mb-1.5">
                        Why this match:
                      </span>
                      <ul className="space-y-1 text-xs text-text-secondary">
                        {mentor.matchReasons.map((reason, rIdx) => (
                          <li key={rIdx} className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-primary shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills tags */}
                  {mentor.skills?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      {mentor.skills.slice(0, 4).map((sk, sIdx) => (
                        <span key={sIdx} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface text-text-secondary border border-border">
                          {sk.name || sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    Dept of {mentorUser.department || 'TCET'} ({mentorUser.graduationYear || 'Alum'})
                  </span>
                  <Link
                    to={`/mentorship/mentor/${mentor._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    View & Connect <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   TAB 4: ALUMNETRA INTERACTIVE ASSISTANT
   ========================================================================= */
function AIAssistantTab({ user }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${user?.firstName || 'there'}! I am the AlumNetra Institutional AI Assistant. You can ask me how to find alumni mentors, get your ATS resume reviewed, explore job opportunities, or support TCET donation campaigns. How can I help you today?`,
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    'How do I find a mentor matching my career goals?',
    'How can I improve my resume for technical placements?',
    'Tell me how donation campaigns work and about 80G tax receipts.',
    'How do I verify my institutional account with my college ID?',
  ];

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query, time: 'Just now' };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/assistant', { message: query });
      const reply = res.data?.data?.reply || 'I am ready to help with any queries regarding AlumNetra features!';
      setMessages((prev) => [...prev, { sender: 'bot', text: reply, time: 'Just now' }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I encountered an issue processing your query. Please try again.', time: 'Just now' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-6 sm:p-8 rounded-3xl border border-border flex flex-col h-[650px]">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-text-primary">AlumNetra Institutional AI Assistant</h3>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active • Python/NLP Backend
            </span>
          </div>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="py-3 overflow-x-auto scrollbar-none flex gap-2">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-xl bg-surface border border-border hover:border-primary/50 text-xs text-text-secondary hover:text-text-primary whitespace-nowrap transition-all"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.sender === 'bot' ? (
              <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-surface-elevated text-text-secondary flex items-center justify-center shrink-0 mt-1 font-bold text-xs border border-border">
                {user?.firstName?.[0] || 'U'}
              </div>
            )}
            <div
              className={`max-w-[80%] sm:max-w-[70%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-primary text-white rounded-tr-none shadow-md'
                  : 'glass border border-border/80 text-text-primary rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl glass border border-border/80 text-xs text-text-muted rounded-tl-none">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="pt-4 border-t border-border/50 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about mentorship, career roadmaps, jobs, or college features..."
          className="flex-1 py-3 px-4 rounded-2xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm text-text-primary"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="p-3 rounded-2xl bg-primary text-white hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
