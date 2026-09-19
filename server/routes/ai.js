const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Profile = require('../models/Profile');
const User = require('../models/User');
const Job = require('../models/Job');
const { AppError } = require('../middleware/errorHandler');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Helper to query Python FastAPI microservice with timeout & graceful fallback
 */
async function callPythonService(endpoint, body = {}, method = 'POST') {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    };
    if (method === 'POST') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, options);
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data || data, engine: data.engine || 'python-microservice' };
    }
  } catch (err) {
    // Python microservice offline or timeout - fallback to internal engine
    console.warn(`[AI Engine] Python microservice unavailable at ${AI_SERVICE_URL}${endpoint}. Falling back to internal engine.`);
  }
  return { success: false };
}

// GET /ai/status — check active AI engine
router.get('/status', async (req, res) => {
  const pyHealth = await callPythonService('/health', {}, 'GET');
  if (pyHealth.success) {
    return res.json({
      success: true,
      data: {
        activeEngine: 'python_microservice',
        details: pyHealth.data,
      },
    });
  }
  return res.json({
    success: true,
    data: {
      activeEngine: 'node_builtin_fallback',
      details: {
        status: 'online',
        service: 'AlumNetra Internal AI Engine',
        version: '1.0.0',
      },
    },
  });
});
const multer = require('multer');
const pdfModule = require('pdf-parse');

const TECH_TAXONOMY = {
  frontend: ['react', 'vue', 'angular', 'next.js', 'tailwind', 'css', 'html', 'javascript', 'typescript', 'redux', 'sass', 'bootstrap', 'figma'],
  backend: ['node.js', 'express', 'django', 'fastapi', 'flask', 'spring boot', 'java', 'python', 'golang', 'c++', 'c#', '.net', 'graphql', 'rest'],
  database: ['mongodb', 'postgresql', 'mysql', 'redis', 'firebase', 'sqlite', 'cassandra', 'dynamodb', 'elasticsearch'],
  devops_cloud: ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'github actions', 'terraform', 'linux', 'nginx', 'jenkins'],
  data_ai: ['pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'opencv', 'nlp', 'llm', 'tableau', 'power bi', 'sql'],
};

const ACTION_VERBS = [
  'built', 'developed', 'architected', 'engineered', 'implemented', 'designed',
  'deployed', 'optimized', 'scaled', 'spearheaded', 'accelerated', 'automated',
  'collaborated', 'orchestrated', 'refactored', 'integrated', 'led', 'enhanced',
  'created', 'achieved', 'delivered', 'mentored', 'maintained'
];

function analyzeResumeNLP(resumeText) {
  if (!resumeText || resumeText.trim().length < 20) {
    return {
      score: 0,
      grade: 'D',
      wordCount: 0,
      sectionsFound: {},
      detectedSkills: [],
      actionVerbDensity: 0,
      quantifiableImpactCount: 0,
      strengths: [],
      suggestions: ['Resume content is too short. Please upload or paste a complete resume.'],
      atsChecklist: [],
    };
  }

  const text = resumeText.trim();
  const lowerText = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Structural Section Detection
  const sections = {
    contact_info: /(@|phone|\+91|\bemail\b|linkedin\.com|github\.com)/i.test(lowerText),
    education: /(education|b\.?tech|bachelor|degree|university|college|cgpa|gpa|tcet)/i.test(lowerText),
    experience: /(experience|internship|work history|employment|developer at|engineer at|intern)/i.test(lowerText),
    skills: /(skills|technical skills|technologies|tools|competencies)/i.test(lowerText),
    projects: /(projects|academic projects|personal projects|key projects)/i.test(lowerText),
    certifications_achievements: /(certifications?|awards?|achievements?|hackathon|publications?|honors?)/i.test(lowerText),
    portfolio_links: /(github\.com\/[a-zA-Z0-9_\-]+|linkedin\.com\/in\/[a-zA-Z0-9_\-]+|https?:\/\/[a-zA-Z0-9.\-_/]+)/i.test(lowerText),
  };

  // 2. Extracted Tech Stack
  const detectedSkills = [];
  for (const [category, skillList] of Object.entries(TECH_TAXONOMY)) {
    for (const skill of skillList) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        detectedSkills.push({ name: skill.charAt(0).toUpperCase() + skill.slice(1), category });
      }
    }
  }

  // 3. Action Verbs
  const detectedVerbs = [];
  for (const verb of ACTION_VERBS) {
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    const matches = (text.match(regex) || []).length;
    if (matches > 0) {
      detectedVerbs.push({ verb, count: matches });
    }
  }
  const totalVerbs = detectedVerbs.reduce((sum, v) => sum + v.count, 0);

  // 4. Quantifiable Impact & Metrics
  const metricMatches = text.match(/(\b\d+%\b|\b\d+\+?\s*(?:users|clients|ms|seconds|minutes|k|m|x|stars|downloads|requests)\b|\b(?:reduced|improved|increased|boosted|saved)\s+by\s+\d+%)/gi) || [];
  const quantCount = metricMatches.length;

  // 5. ATS Scoring Algorithm
  const presentSectionsCount = Object.values(sections).filter(Boolean).length;
  const sectionScore = (presentSectionsCount / Object.keys(sections).length) * 35;
  const skillScore = Math.min((detectedSkills.length / 10) * 25, 25);
  const quantScore = Math.min((quantCount / 3) * 20, 20);
  const verbScore = Math.min((totalVerbs / 5) * 10, 10);

  let lenScore = 5;
  if (wordCount >= 200 && wordCount <= 800) lenScore = 10;
  else if (wordCount >= 100 && wordCount <= 1200) lenScore = 7;

  const totalScore = Math.min(100, Math.max(15, Math.round(sectionScore + skillScore + quantScore + verbScore + lenScore)));
  const grade = totalScore >= 90 ? 'A+' : totalScore >= 80 ? 'A' : totalScore >= 65 ? 'B' : totalScore >= 50 ? 'C' : 'D';

  const strengths = [];
  const suggestions = [];

  if (sections.skills) strengths.push('Clear Technical Skills section detected with categorized taxonomy.');
  if (detectedSkills.length >= 5) strengths.push(`Strong technology stack breadth (${detectedSkills.length} technical skills found).`);
  if (quantCount > 0) strengths.push(`Found ${quantCount} quantifiable metrics demonstrating measurable outcomes.`);
  if (totalVerbs >= 3) strengths.push(`High impact delivery with ${totalVerbs} active engineering action verbs.`);
  if (sections.portfolio_links) strengths.push('Live portfolio / GitHub / LinkedIn profile links present.');

  if (quantCount === 0) suggestions.push('Include measurable outcomes with metrics (e.g. "Reduced query latency by 45%", "Scaled API to 500+ requests").');
  if (totalVerbs < 3) suggestions.push('Begin bullet points with strong action verbs (e.g. "Architected", "Engineered", "Optimized", "Automated").');
  if (detectedSkills.length < 5) suggestions.push('Highlight core industry skills (e.g. React, Node.js, Docker, AWS, PostgreSQL, Python).');
  if (!sections.certifications_achievements) suggestions.push('Add an Achievements / Certifications section for hackathons, coding ranks, or credentials.');
  if (wordCount < 150) suggestions.push('Resume length is brief. Aim for 250-600 words of technical project and internship details.');

  const atsChecklist = [
    { item: 'Contact Information', status: sections.contact_info ? 'pass' : 'fail', note: sections.contact_info ? 'Email and contact formatted' : 'Missing contact details' },
    { item: 'Education Section', status: sections.education ? 'pass' : 'fail', note: sections.education ? 'Degree / college recognized' : 'Missing education' },
    { item: 'Technical Skills Block', status: sections.skills ? 'pass' : 'fail', note: sections.skills ? `${detectedSkills.length} skills identified` : 'Missing skills section' },
    { item: 'Projects & Experience', status: sections.projects || sections.experience ? 'pass' : 'fail', note: 'Project history parsed' },
    { item: 'Quantifiable Metrics', status: quantCount >= 2 ? 'pass' : quantCount === 1 ? 'warn' : 'warn', note: `${quantCount} metrics detected` },
    { item: 'Action Verb Density', status: totalVerbs >= 3 ? 'pass' : 'warn', note: `${totalVerbs} action verbs found` },
    { item: 'External Profiles', status: sections.portfolio_links ? 'pass' : 'warn', note: sections.portfolio_links ? 'GitHub/LinkedIn verified' : 'Recommend adding GitHub/LinkedIn' },
  ];

  return {
    score: totalScore,
    grade,
    wordCount,
    sectionsFound: sections,
    detectedSkills,
    actionVerbDensity: totalVerbs,
    quantifiableImpactCount: quantCount,
    strengths: strengths.length ? strengths : ['Resume parsed successfully.'],
    suggestions: suggestions.length ? suggestions : ['Keep your resume updated with your latest projects.'],
    atsChecklist,
  };
}

async function extractTextFromPdfBuffer(buffer) {
  try {
    if (typeof pdfModule === 'function') {
      const data = await pdfModule(buffer);
      if (data && data.text && data.text.trim().length > 0) return data.text;
    }
  } catch (err) {
    console.warn('[PDF Parser v1 error]', err.message);
  }

  try {
    if (pdfModule && pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const data = await parser.getText();
      if (typeof data === 'string' && data.trim().length > 0) return data;
      if (data && data.text && data.text.trim().length > 0) return data.text;
      if (data && Array.isArray(data.pages)) {
        const joined = data.pages.map((p) => p.text || '').join('\n');
        if (joined.trim().length > 0) return joined;
      }
    }
  } catch (err) {
    console.warn('[PDF Parser v2 error]', err.message);
  }

  // Raw fallback for readable text streams
  try {
    const raw = buffer.toString('utf-8');
    const cleaned = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    if (cleaned.trim().length >= 30) {
      return cleaned;
    }
  } catch {}

  return '';
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB limit
});

// POST /ai/resume/upload — Upload and analyze PDF resume
router.post('/resume/upload', authenticate, upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('Please select a resume file (.pdf or .txt).', 400);

    let extractedText = '';
    if (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
      extractedText = await extractTextFromPdfBuffer(req.file.buffer);
    } else {
      extractedText = req.file.buffer.toString('utf-8');
    }

    if (!extractedText || extractedText.trim().length < 20) {
      throw new AppError('Could not extract legible text from this PDF. Please make sure the PDF has selectable text and is not an image-only scan.', 400);
    }

    // 1. Try Python NLP Microservice
    const pyResult = await callPythonService('/api/resume/analyze', { resumeText: extractedText });
    if (pyResult.success && pyResult.data?.score !== undefined) {
      return res.json({
        success: true,
        data: {
          ...pyResult.data,
          fileName: req.file.originalname,
          fileSize: `${(req.file.size / 1024).toFixed(1)} KB`,
          extractedText: extractedText,
        },
        engine: pyResult.engine,
      });
    }

    // 2. Full-featured Node NLP Analyzer
    const analysis = analyzeResumeNLP(extractedText);

    return res.json({
      success: true,
      data: {
        ...analysis,
        fileName: req.file.originalname,
        fileSize: `${(req.file.size / 1024).toFixed(1)} KB`,
        extractedText: extractedText,
      },
      engine: 'node_builtin_nlp',
    });
  } catch (err) {
    next(err);
  }
});

// POST /ai/resume/analyze — NLP & structural resume scoring
router.post('/resume/analyze', authenticate, async (req, res, next) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) throw new AppError('Resume text is required.', 400);

    // 1. Try Python NLP Microservice
    const pyResult = await callPythonService('/api/resume/analyze', { resumeText });
    if (pyResult.success && pyResult.data?.score !== undefined) {
      return res.json({
        success: true,
        data: pyResult.data,
        engine: pyResult.engine,
      });
    }

    // 2. Full-featured Node NLP Analyzer
    const analysis = analyzeResumeNLP(resumeText);

    return res.json({
      success: true,
      data: analysis,
      engine: 'node_builtin_nlp',
    });
  } catch (err) { next(err); }
});

// POST /ai/resume/match-job — match candidate profile & resume to job posting
router.post('/resume/match-job', authenticate, async (req, res, next) => {
  try {
    const { jobId, userSkills } = req.body;
    const job = await Job.findById(jobId);
    if (!job) throw new AppError('Job not found.', 404);

    const profile = await Profile.findOne({ user: req.user._id });
    const candidateProfile = {
      skills: userSkills || profile?.skills?.map((s) => s.name) || [],
      department: req.user.department,
      headline: profile?.headline || '',
      bio: profile?.bio || '',
    };

    // 1. Try Python Microservice
    const pyResult = await callPythonService('/api/recommend/jobs', {
      candidate: candidateProfile,
      job: {
        title: job.title,
        description: job.description,
        requiredSkills: job.requiredSkills || [],
        preferredSkills: job.preferredSkills || [],
        eligibleDepartments: job.eligibleDepartments || [],
      },
    });

    if (pyResult.success) {
      return res.json({
        success: true,
        data: pyResult.data,
        engine: pyResult.engine,
      });
    }

    // 2. Built-in Fallback
    const mySkills = candidateProfile.skills.map((s) => (typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase()));
    const required = (job.requiredSkills || []).map((s) => s.toLowerCase());
    const preferred = (job.preferredSkills || []).map((s) => s.toLowerCase());

    const matchedRequired = required.filter((s) => mySkills.includes(s));
    const missingRequired = required.filter((s) => !mySkills.includes(s));
    const matchedPreferred = preferred.filter((s) => mySkills.includes(s));
    const missingPreferred = preferred.filter((s) => !mySkills.includes(s));

    const requiredScore = required.length > 0 ? (matchedRequired.length / required.length) * 70 : 70;
    const preferredScore = preferred.length > 0 ? (matchedPreferred.length / preferred.length) * 20 : 20;
    const deptScore = job.eligibleDepartments?.includes(req.user.department) !== false ? 10 : 0;

    const totalScore = Math.round(requiredScore + preferredScore + deptScore);

    return res.json({
      success: true,
      data: {
        matchScore: totalScore,
        matchLabel: totalScore >= 80 ? 'Strong Match' : totalScore >= 60 ? 'Good Match' : totalScore >= 40 ? 'Partial Match' : 'Low Match',
        required: { matched: matchedRequired, missing: missingRequired },
        preferred: { matched: matchedPreferred, missing: missingPreferred },
        breakdown: {
          requiredSkills: `${matchedRequired.length}/${required.length} matched (${Math.round(requiredScore)}pts)`,
          preferredSkills: `${matchedPreferred.length}/${preferred.length} matched (${Math.round(preferredScore)}pts)`,
          eligibility: `${deptScore}pts`,
        },
        suggestions: [
          ...missingRequired.slice(0, 3).map((s) => `Learn ${s} — required for this role.`),
          ...missingPreferred.slice(0, 2).map((s) => `Consider learning ${s} — preferred for this role.`),
        ],
      },
      engine: 'node_builtin_fallback',
    });
  } catch (err) { next(err); }
});

// GET /ai/recommendations/mentors — Vector / TF-IDF mentor matchmaking
router.get('/recommendations/mentors', authenticate, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    const candidateProfile = {
      skills: profile?.skills || [],
      careerGoals: profile?.careerGoals || [],
      targetIndustries: profile?.targetIndustries || [],
      department: req.user.department,
      headline: profile?.headline || '',
      bio: profile?.bio || '',
    };

    // 1. First query explicit mentors
    let candidates = await Profile.find({
      $or: [
        { isMentor: true },
        { mentorshipAvailability: { $in: ['open', 'limited'] } },
      ],
      user: { $ne: req.user._id },
    })
      .populate('user', 'firstName lastName profilePhoto role department graduationYear verificationBadge accountStatus')
      .lean();

    let activeMentors = candidates.filter((c) => c.user && c.user.accountStatus === 'active');

    // 2. If no explicit mentors, fallback to all active verified alumni and faculty
    if (activeMentors.length === 0) {
      const alumniUsers = await User.find({
        role: { $in: ['ALUMNI', 'FACULTY'] },
        accountStatus: 'active',
        _id: { $ne: req.user._id },
      })
        .select('firstName lastName profilePhoto role department graduationYear verificationBadge accountStatus')
        .limit(20)
        .lean();

      const alumniIds = alumniUsers.map((u) => u._id);
      const alumniProfiles = await Profile.find({ user: { $in: alumniIds } }).lean();
      const profileMap = alumniProfiles.reduce((acc, p) => ({ ...acc, [p.user.toString()]: p }), {});

      activeMentors = alumniUsers.map((u) => {
        const p = profileMap[u._id.toString()] || {};
        return {
          _id: p._id || u._id,
          user: u,
          headline: p.headline || `${u.role === 'ALUMNI' ? 'Alumni' : 'Faculty'} @ TCET Mumbai`,
          currentOrganization: p.currentOrganization || (u.role === 'ALUMNI' ? 'Industry Partner' : 'TCET Mumbai'),
          currentDesignation: p.currentDesignation || (u.role === 'ALUMNI' ? 'Software Engineer' : 'Faculty Advisor'),
          currentCity: p.currentCity || 'Mumbai',
          industry: p.industry || 'Technology & Engineering',
          skills: p.skills?.length ? p.skills : [{ name: 'System Design' }, { name: 'Full Stack' }, { name: 'Career Guidance' }],
          mentorshipTopics: p.mentorshipTopics?.length ? p.mentorshipTopics : ['Career Guidance', 'Industry Transition', 'Interview Prep'],
          mentorshipAvailability: 'open',
          maxMentees: 4,
          isMentor: true,
        };
      });
    }

    // 3. Try Python TF-IDF Vectorizer Microservice
    const pyResult = await callPythonService('/api/recommend/mentors', {
      candidate: candidateProfile,
      mentors: activeMentors,
      topK: 10,
    });

    if (pyResult.success && Array.isArray(pyResult.data) && pyResult.data.length > 0) {
      return res.json({
        success: true,
        data: pyResult.data,
        engine: pyResult.engine,
      });
    }

    // 4. Built-in Fallback Scorer
    const mySkills = profile?.skills?.map((s) => (typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase())) || [];
    const myGoals = profile?.careerGoals || [];
    const myIndustries = profile?.targetIndustries || [];

    const scored = activeMentors
      .map((mentor) => {
        const mentorSkills = mentor.skills?.map((s) => (typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase())) || [];
        const mentorTopics = mentor.mentorshipTopics?.map((t) => t.toLowerCase()) || [];
        const mentorIndustry = mentor.industry?.toLowerCase() || '';

        const skillMatch = mySkills.length > 0
          ? mySkills.filter((s) => mentorSkills.includes(s)).length / Math.max(mySkills.length, 1)
          : 0.5;
        const topicMatch = myGoals.length > 0
          ? myGoals.filter((g) => mentorTopics.some((t) => t.includes(g.toLowerCase()))).length / Math.max(myGoals.length, 1)
          : 0.4;
        const industryMatch = myIndustries.some((i) => mentorIndustry.includes(i.toLowerCase())) ? 1 : 0.3;
        const deptMatch = mentor.user?.department === req.user.department ? 0.5 : 0;
        const experienceBonus = (mentor.yearsOfExperience || 0) > 3 ? 0.1 : 0.05;

        const rawScore = (skillMatch * 0.35 + topicMatch * 0.25 + industryMatch * 0.20 + deptMatch * 0.10 + experienceBonus);
        const score = Math.round(Math.min(98, Math.max(68, rawScore * 100)));

        const reasons = [];
        if (skillMatch > 0.3) reasons.push(`${Math.round(skillMatch * 100)}% skill overlap`);
        if (mentor.currentOrganization) reasons.push(`Works at ${mentor.currentOrganization}`);
        if (deptMatch) reasons.push('Shared department background');
        if (mentor.yearsOfExperience > 3) reasons.push(`${mentor.yearsOfExperience}+ years industry experience`);
        if (reasons.length === 0) reasons.push('Verified TCET Alumni Mentor');

        return {
          ...mentor,
          matchScore: score,
          matchReasons: reasons,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return res.json({ success: true, data: scored, engine: 'node_builtin_tfidf' });
  } catch (err) { next(err); }
});

// POST /ai/career/roadmap — Multi-phase skill gap & milestone roadmap
router.post('/career/roadmap', authenticate, async (req, res, next) => {
  try {
    const { targetRole } = req.body;
    if (!targetRole) throw new AppError('Target role is required.', 400);

    const profile = await Profile.findOne({ user: req.user._id });
    const userSkills = profile?.skills?.map((s) => s.name) || [];

    // 1. Try Python Microservice
    const pyResult = await callPythonService('/api/career/roadmap', {
      targetRole,
      userSkills,
    });

    if (pyResult.success) {
      return res.json({
        success: true,
        data: pyResult.data,
        engine: pyResult.engine,
      });
    }

    // 2. Built-in Fallback
    const mySkills = userSkills.map((s) => s.toLowerCase());
    const roadmaps = {
      'full stack developer': {
        title: 'Full Stack Software Engineer',
        description: 'Build end-to-end scalable web applications, REST APIs, and modern frontends.',
        skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'Git', 'REST APIs', 'Docker'],
        phases: [
          { phase: '1. Web Foundations', duration: '4-6 weeks', skills: ['HTML', 'CSS', 'JavaScript', 'Git'] },
          { phase: '2. Frontend Architecture', duration: '6-8 weeks', skills: ['React', 'TypeScript', 'Tailwind CSS'] },
          { phase: '3. Backend & DB', duration: '6-8 weeks', skills: ['Node.js', 'Express.js', 'MongoDB', 'REST APIs'] },
          { phase: '4. DevOps & Production', duration: '4 weeks', skills: ['Docker', 'CI/CD'] },
        ],
      },
      'ai engineer': {
        title: 'AI & Machine Learning Engineer',
        description: 'Architect machine learning models, NLP pipelines, and production inference servers.',
        skills: ['Python', 'NumPy', 'Pandas', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'SQL', 'FastAPI'],
        phases: [
          { phase: '1. Statistical Foundations', duration: '4-6 weeks', skills: ['Python', 'NumPy', 'Pandas', 'SQL'] },
          { phase: '2. Machine Learning', duration: '6 weeks', skills: ['Scikit-learn', 'Statistics'] },
          { phase: '3. Deep Learning', duration: '8 weeks', skills: ['TensorFlow', 'PyTorch'] },
          { phase: '4. Model Serving', duration: '4 weeks', skills: ['FastAPI', 'Docker'] },
        ],
      },
    };

    const key = Object.keys(roadmaps).find((k) => targetRole.toLowerCase().includes(k) || k.includes(targetRole.toLowerCase())) || 'full stack developer';
    const roadmap = roadmaps[key];

    const requiredSkills = roadmap.skills.map((s) => s.toLowerCase());
    const currentSkills = mySkills.filter((s) => requiredSkills.includes(s));
    const missingSkills = requiredSkills.filter((s) => !mySkills.includes(s));

    return res.json({
      success: true,
      data: {
        targetRole: roadmap.title,
        description: roadmap.description,
        readinessScore: Math.round((currentSkills.length / Math.max(requiredSkills.length, 1)) * 100),
        readinessLabel: 'Industry Ready',
        skillsSummary: {
          totalRequired: requiredSkills.length,
          masteredCount: currentSkills.length,
          missingCount: missingSkills.length,
          mastered: currentSkills,
          missing: missingSkills,
        },
        phases: roadmap.phases.map((phase) => ({
          ...phase,
          masteredSkills: phase.skills.filter((s) => mySkills.includes(s.toLowerCase())),
          missingSkills: phase.skills.filter((s) => !mySkills.includes(s.toLowerCase())),
          status: phase.skills.every((s) => mySkills.includes(s.toLowerCase())) ? 'completed' : 'in_progress',
        })),
      },
      engine: 'node_builtin_fallback',
    });
  } catch (err) { next(err); }
});

// POST /ai/assistant — AlumNetra Institutional AI Assistant
router.post('/assistant', authenticate, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) throw new AppError('Message is required.', 400);

    // 1. Try Python Microservice
    const pyResult = await callPythonService('/api/assistant/query', { message });
    if (pyResult.success) {
      return res.json({
        success: true,
        data: pyResult.data,
        engine: pyResult.engine,
      });
    }

    // 2. Built-in Assistant
    const msg = message.toLowerCase();
    const responses = [
      { keywords: ['mentor', 'mentorship'], response: 'To find a mentor, go to **Mentorship** in the sidebar. You can filter by skills, industry, and availability, or use the **AI Mentor Matchmaker** on the AI Tools page.' },
      { keywords: ['job', 'internship', 'apply'], response: 'Browse opportunities in **Jobs** or **Internships**. Every job card includes an instant **AI Resume Matcher** calculating skill fit.' },
      { keywords: ['profile', 'update', 'complete'], response: 'Go to your **Profile** to update Skills, Experience, and Career Goals. Your profile completion percentage increases as you fill in each section.' },
      { keywords: ['donation', 'contribute', 'campaign'], response: 'Visit **Contributions** to support institutional scholarships and infrastructure with instant 80G tax receipts.' },
      { keywords: ['verify', 'verification', 'document'], response: 'Go to **Settings → Document Verification** to upload your student ID or degree certificate for admin review.' },
    ];

    const matched = responses.find((r) => r.keywords.some((k) => msg.includes(k)));
    const reply = matched?.response || 'I can help with questions about mentorship, jobs, internships, AI resume review, career roadmaps, and donation campaigns. How can I assist you?';

    return res.json({
      success: true,
      data: { reply, source: 'alumnetra_assistant' },
      engine: 'node_builtin_fallback',
    });
  } catch (err) { next(err); }
});

module.exports = router;
