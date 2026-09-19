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

async function extractTextFromPdfBuffer(buffer) {
  try {
    // pdf-parse v1 (function)
    if (typeof pdfModule === 'function') {
      const data = await pdfModule(buffer);
      if (data && data.text) return data.text;
    }
    // pdf-parse v2 (PDFParse class)
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
    console.warn('[PDF Parser] Standard parser error:', err.message);
  }

  // Raw text stream fallback for readable PDF streams or text files
  try {
    const raw = buffer.toString('utf-8');
    // Extract stream blocks or plain text if ASCII/UTF-8
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
    if (pyResult.success) {
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

    // 2. Built-in Fallback
    const sections = {
      contact: /email|phone|linkedin|github/i.test(extractedText),
      education: /bachelor|b\.?tech|engineering|degree|university|college/i.test(extractedText),
      experience: /experience|intern|work|project/i.test(extractedText),
      skills: /skills|technologies|tools/i.test(extractedText),
      projects: /project|built|developed|created/i.test(extractedText),
      achievements: /award|hackathon|rank|winner|certification/i.test(extractedText),
      measurableOutcomes: /\d+%|\d+ users|\d+ ms|\d+ seconds/i.test(extractedText),
      links: /github\.com|linkedin\.com|portfolio/i.test(extractedText),
    };

    const presentSections = Object.values(sections).filter(Boolean).length;
    const score = Math.round((presentSections / Object.keys(sections).length) * 100);

    return res.json({
      success: true,
      data: {
        score,
        grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
        sectionsFound: sections,
        fileName: req.file.originalname,
        fileSize: `${(req.file.size / 1024).toFixed(1)} KB`,
        extractedText: extractedText,
        strengths: ['Resume text extracted successfully from PDF.'],
        suggestions: ['Ensure quantifiable outcomes and achievements are included.'],
      },
      engine: 'node_builtin_fallback',
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
    if (pyResult.success) {
      return res.json({
        success: true,
        data: pyResult.data,
        engine: pyResult.engine,
      });
    }

    // 2. Built-in Fallback Analyzer
    const sections = {
      contact: /email|phone|linkedin|github/i.test(resumeText),
      education: /bachelor|b\.?tech|engineering|degree|university|college/i.test(resumeText),
      experience: /experience|intern|work|project/i.test(resumeText),
      skills: /skills|technologies|tools/i.test(resumeText),
      projects: /project|built|developed|created/i.test(resumeText),
      achievements: /award|hackathon|rank|winner|certification/i.test(resumeText),
      measurableOutcomes: /\d+%|\d+ users|\d+ ms|\d+ seconds/i.test(resumeText),
      links: /github\.com|linkedin\.com|portfolio/i.test(resumeText),
    };

    const presentSections = Object.values(sections).filter(Boolean).length;
    const score = Math.round((presentSections / Object.keys(sections).length) * 100);

    const strengths = [];
    const suggestions = [];

    if (sections.skills) strengths.push('Skills section is present.');
    if (sections.projects) strengths.push('Projects are highlighted.');
    if (sections.experience) strengths.push('Experience/internships included.');
    if (sections.measurableOutcomes) strengths.push('Includes measurable outcomes.');
    if (sections.links) strengths.push('External profile links included.');

    if (!sections.measurableOutcomes) suggestions.push('Add measurable outcomes (e.g., "Improved performance by 30%").');
    if (!sections.achievements) suggestions.push('Include awards, hackathons, or certifications.');
    if (!sections.links) suggestions.push('Add your GitHub and LinkedIn profile links.');
    if (!sections.projects) suggestions.push('Include at least 2-3 key projects with descriptions.');

    return res.json({
      success: true,
      data: {
        score,
        grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
        sectionsFound: sections,
        strengths,
        suggestions,
        breakdown: {
          sections: `${presentSections}/${Object.keys(sections).length} present`,
        },
      },
      engine: 'node_builtin_fallback',
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

    const candidates = await Profile.find({
      isMentor: true,
      mentorshipAvailability: { $in: ['open', 'limited'] },
      user: { $ne: req.user._id },
    })
      .populate('user', 'firstName lastName profilePhoto role department graduationYear verificationBadge accountStatus')
      .lean();

    const activeMentors = candidates.filter((c) => c.user?.accountStatus === 'active');

    // 1. Try Python TF-IDF Vectorizer Microservice
    const pyResult = await callPythonService('/api/recommend/mentors', {
      candidate: candidateProfile,
      mentors: activeMentors,
      topK: 10,
    });

    if (pyResult.success && Array.isArray(pyResult.data)) {
      return res.json({
        success: true,
        data: pyResult.data,
        engine: pyResult.engine,
      });
    }

    // 2. Built-in Fallback Scorer
    const mySkills = profile?.skills?.map((s) => s.name.toLowerCase()) || [];
    const myGoals = profile?.careerGoals || [];
    const myIndustries = profile?.targetIndustries || [];

    const scored = activeMentors
      .map((mentor) => {
        const mentorSkills = mentor.skills?.map((s) => s.name.toLowerCase()) || [];
        const mentorTopics = mentor.mentorshipTopics?.map((t) => t.toLowerCase()) || [];
        const mentorIndustry = mentor.industry?.toLowerCase() || '';

        const skillMatch = mySkills.length > 0
          ? mySkills.filter((s) => mentorSkills.includes(s)).length / Math.max(mySkills.length, 1)
          : 0;
        const topicMatch = myGoals.length > 0
          ? myGoals.filter((g) => mentorTopics.some((t) => t.includes(g.toLowerCase()))).length / Math.max(myGoals.length, 1)
          : 0;
        const industryMatch = myIndustries.some((i) => mentorIndustry.includes(i.toLowerCase())) ? 1 : 0;
        const deptMatch = mentor.user?.department === req.user.department ? 0.5 : 0;
        const experienceBonus = (mentor.yearsOfExperience || 0) > 5 ? 0.1 : 0;

        const score = Math.round(
          (skillMatch * 0.35 + topicMatch * 0.25 + industryMatch * 0.20 + deptMatch * 0.10 + experienceBonus) * 100
        );

        const reasons = [];
        if (skillMatch > 0.4) reasons.push(`${Math.round(skillMatch * 100)}% skill overlap`);
        if (industryMatch) reasons.push(`Works in target industry (${mentor.industry})`);
        if (deptMatch) reasons.push('Shared department background');
        if (mentor.yearsOfExperience > 5) reasons.push(`${mentor.yearsOfExperience} years industry experience`);

        return { ...mentor, matchScore: Math.min(Math.max(score, 15), 98), matchReasons: reasons.length ? reasons : ['General domain match'] };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return res.json({ success: true, data: scored, engine: 'node_builtin_fallback' });
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
