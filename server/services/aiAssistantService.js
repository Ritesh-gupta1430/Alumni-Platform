const User = require('../models/User');
const Profile = require('../models/Profile');
const Job = require('../models/Job');
const { Mentorship } = require('../models/Mentorship');
const { Campaign } = require('../models/Donation');

// Normalize tech taxonomy synonyms for search & extraction
const TECH_SYNONYMS = {
  react: ['react', 'react.js', 'reactjs', 'frontend', 'react native'],
  node: ['node', 'nodejs', 'node.js', 'express', 'express.js', 'backend'],
  python: ['python', 'django', 'fastapi', 'flask', 'data science', 'ai', 'ml', 'machine learning', 'deep learning'],
  javascript: ['javascript', 'js', 'es6', 'typescript', 'ts'],
  cloud: ['aws', 'cloud', 'gcp', 'azure', 'devops', 'docker', 'kubernetes'],
  database: ['mongodb', 'sql', 'postgresql', 'mysql', 'redis', 'database', 'dbms'],
  ai: ['ai', 'ml', 'machine learning', 'deep learning', 'nlp', 'computer vision', 'genai', 'llm'],
  dsa: ['dsa', 'data structures', 'algorithms', 'leetcode', 'problem solving', 'competitive programming'],
  system_design: ['system design', 'distributed systems', 'architecture', 'microservices', 'scalability'],
};

/**
 * Intelligent Institutional AI Assistant Engine for TCET AlumNetra
 */
async function processAssistantQuery(message, currentUser = null) {
  const query = (message || '').trim();
  const lower = query.toLowerCase();

  // 1. Check for Gemini API Key if user configured one in .env
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'REPLACE_ME') {
    try {
      const geminiReply = await queryGeminiLLM(query, currentUser);
      if (geminiReply) {
        return {
          reply: geminiReply,
          source: 'gemini_llm',
          actions: generateContextActions(lower),
        };
      }
    } catch (err) {
      console.warn('[AI Assistant] Gemini API error, using institutional knowledge engine:', err.message);
    }
  }

  // 2. Intelligent Institutional Engine with Live DB Integration & Multi-Domain Routing
  return await generateInstitutionalResponse(query, lower, currentUser);
}

/**
 * Call Google Gemini API with institutional system prompt
 */
async function queryGeminiLLM(query, currentUser) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const systemInstruction = `You are the AlumNetra AI Assistant for Thakur College of Engineering and Technology (TCET), Mumbai.
You help students, alumni, and faculty with:
1. Finding and requesting 1-on-1 alumni mentorship.
2. TCET campus placements, internships, and job applications.
3. ATS resume scoring, improvements, and action verb optimization.
4. Technical interview preparation (React, Node, Python, DSA, System Design).
5. Generating professional cold reach-out messages to alumni mentors.
6. TCET donation campaigns, scholarship funds, and 80G tax benefits.
7. Account verification using college roll number and institutional ID.
Format all responses cleanly in GitHub-flavored markdown with bolding, bullet points, and actionable next steps.`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\nUser Question: ${query}` }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text;
  }
  return null;
}

/**
 * Institutional NLP & Real-Time Query Engine
 */
async function generateInstitutionalResponse(rawQuery, lower, user) {
  const userName = user?.firstName || 'there';

  // --- INTENT A: GREETING & GENERAL INTRODUCTION ---
  if (/^(hi|hello|hey|greetings|good\s(morning|afternoon|evening)|who are you)/i.test(lower)) {
    return {
      reply: `Hello **${userName}**! 👋\n\nI am **AlumNetra AI**, the institutional assistant for TCET students and alumni. I can help you with:\n\n` +
        `• 🤝 **Mentorship**: Find verified TCET alumni mentors for 1-on-1 career guidance.\n` +
        `• 💼 **Placements & Jobs**: Match your skills against active campus & alumni-posted roles.\n` +
        `• 📄 **ATS Resume Check**: Score your PDF resume and get quantifiable bullet point tips.\n` +
        `• 🎯 **Career Roadmaps**: Step-by-step milestone plans for Full Stack, AI/ML, DevOps, and Cloud.\n` +
        `• ✉️ **Outreach Writer**: Draft professional reach-out emails to alumni.\n` +
        `• 💰 **Contributions & 80G**: Explore donation campaigns and tax exemptions.\n\n` +
        `*What would you like to explore today?*`,
      source: 'institutional_engine',
      actions: [
        { label: 'Find a Mentor', action: 'navigate', url: '/mentorship' },
        { label: 'Analyze My Resume', action: 'navigate', url: '/ai-tools' },
        { label: 'Browse Jobs', action: 'navigate', url: '/jobs' },
        { label: 'Career Roadmaps', action: 'navigate', url: '/ai-tools' },
      ],
    };
  }

  // --- INTENT B: LIVE MENTOR DISCOVERY / SEARCH ---
  if (/(find|show|recommend|search|get|list|connect|who is|need).*(mentor|mentorship|guidance|alumni|alumnus)/i.test(lower) ||
      /mentor.*(react|node|python|ai|ml|data|cloud|aws|placement|interview)/i.test(lower)) {
    
    let targetSkill = '';
    for (const [key, synList] of Object.entries(TECH_SYNONYMS)) {
      if (synList.some((s) => lower.includes(s))) {
        targetSkill = key;
        break;
      }
    }

    try {
      const filter = {
        $or: [{ isMentor: true }, { mentorshipAvailability: { $in: ['open', 'limited'] } }],
      };
      if (targetSkill) {
        filter['skills.name'] = { $regex: targetSkill, $options: 'i' };
      }

      const mentors = await Profile.find(filter)
        .populate('user', 'firstName lastName profilePhoto role department graduationYear')
        .limit(3)
        .lean();

      if (mentors.length > 0) {
        let mentorListText = mentors
          .map((m, idx) => {
            const u = m.user || {};
            const skills = (m.skills || []).slice(0, 3).map((s) => s.name || s).join(', ');
            return `${idx + 1}. **${u.firstName} ${u.lastName}** — ${m.headline || `${u.department} Alumni`}\n   • 🏢 *${m.currentOrganization || 'Industry Leader'}* | 🎓 Batch ${u.graduationYear || 'Alum'}\n   • 💡 Skills: \`${skills || 'Full Stack, Guidance'}\``;
          })
          .join('\n\n');

        return {
          reply: `Here are verified **TCET Alumni Mentors** ready to help with ${targetSkill ? `**${targetSkill.toUpperCase()}**` : 'your career'}:\n\n` +
            `${mentorListText}\n\n` +
            `👉 You can view their full schedule and request 1-on-1 sessions on the **Mentorship Hub** or use the **AI Vector Matchmaker** for compatibility scoring!`,
          source: 'institutional_engine',
          actions: [
            { label: 'View All Mentors', action: 'navigate', url: '/mentorship' },
            { label: 'AI Matchmaker', action: 'navigate', url: '/ai-tools' },
          ],
        };
      }
    } catch (err) {
      console.error(err);
    }

    return {
      reply: `You can connect directly with verified TCET alumni mentors in the **Mentorship Hub**.\n\n` +
        `• Filter by Department (IT, CMPN, AI&DS, EXTC, Mechanical, etc.)\n` +
        `• Filter by Technology Stack (React, Node, Cloud, Python, AI/ML)\n` +
        `• Request 1-on-1 sessions with custom learning goals.`,
      source: 'institutional_engine',
      actions: [{ label: 'Open Mentorship Hub', action: 'navigate', url: '/mentorship' }],
    };
  }

  // --- INTENT C: LIVE JOBS & INTERNSHIPS ---
  if (/(job|internship|placement|hiring|opening|apply|referral|career opportunity)/i.test(lower)) {
    try {
      const activeJobs = await Job.find({ status: { $in: ['active', 'approved'] } })
        .populate('postedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      if (activeJobs.length > 0) {
        let jobsText = activeJobs
          .map((j, idx) => {
            const reqSkills = (j.requiredSkills || []).slice(0, 3).join(', ');
            return `${idx + 1}. **${j.title}** @ **${j.companyName || 'TCET Partner'}**\n   • 📍 ${j.location || 'Mumbai / Remote'} | 🏷️ \`${j.type === 'internship' ? 'Internship' : 'Full-time'}\`\n   • 🛠️ Required: \`${reqSkills || 'Engineering'}\``;
          })
          .join('\n\n');

        return {
          reply: `Here are the latest job & internship openings posted on AlumNetra:\n\n` +
            `${jobsText}\n\n` +
            `💡 *Tip: Each job card features an **AI ATS Matcher** that checks your profile skills against the job requirements.*`,
          source: 'institutional_engine',
          actions: [
            { label: 'Browse All Jobs', action: 'navigate', url: '/jobs' },
            { label: 'Request Referral', action: 'navigate', url: '/jobs' },
          ],
        };
      }
    } catch (err) {
      console.error(err);
    }

    return {
      reply: `Explore current openings under **Jobs & Internships** in the sidebar. You can:\n\n` +
        `1. View full-time and internship openings with TCET alumni referrals.\n` +
        `2. Run an instant **AI Match Score** against each role.\n` +
        `3. Directly reach out to alumni who posted the vacancy for referrals.`,
      source: 'institutional_engine',
      actions: [{ label: 'View Jobs', action: 'navigate', url: '/jobs' }],
    };
  }

  // --- INTENT D: RESUME ATS & REVIEW ---
  if (/(resume|cv|ats|score|upload resume|format|bullet point|improve resume)/i.test(lower)) {
    return {
      reply: `### 📄 AlumNetra AI Resume & ATS Guidelines\n\n` +
        `To maximize your shortlist rate during TCET campus drives and off-campus applications:\n\n` +
        `1. **Use Quantifiable Metrics**: Always quantify your project or internship impact.\n` +
        `   • *Weak:* "Created backend API in Node.js."\n` +
        `   • *Strong:* "Architected REST APIs in Node.js & MongoDB, reducing query latency by 38% for 5,000+ active users."\n\n` +
        `2. **Lead with Engineering Action Verbs**: Use words like *Spearheaded, Architected, Engineered, Optimized, Containerized, Automated*.\n\n` +
        `3. **ATS Structural Sections**: Ensure clear headings for *Education, Technical Skills, Projects, Experience, Certifications*.\n\n` +
        `🚀 **Try our built-in ATS Analyzer:** Upload your PDF resume in the **AI Tools** section to get an instant 0-100 score with section breakdown!`,
      source: 'institutional_engine',
      actions: [{ label: 'Open Resume Analyzer', action: 'navigate', url: '/ai-tools' }],
    };
  }

  // --- INTENT E: COLD OUTREACH & CONNECTION MESSAGE DRAFTER ---
  if (/(cold (email|message)|how to (message|reach out|contact)|template|draft message|connect with alumni)/i.test(lower)) {
    return {
      reply: `### ✉️ Professional Alumni Reach-Out Template\n\n` +
        `Here is a proven template to request mentorship or an informational interview from TCET alumni:\n\n` +
        `\`\`\`text\n` +
        `Subject: TCET Student Inquiry — Seeking Guidance in [Domain/Role]\n\n` +
        `Dear [Alumnus Name],\n\n` +
        `I hope you are doing well. I am a [Year] year [Department] student at TCET Mumbai, deeply passionate about [e.g., Cloud Architecture / Full Stack Engineering / AI].\n\n` +
        `I came across your inspiring profile on AlumNetra and noticed your impressive work at [Company Name]. I would be truly grateful for 15-20 minutes of your time for brief guidance on [specific topic, e.g. transitioning into product roles / interview preparation].\n\n` +
        `Looking forward to connecting!\n\n` +
        `Warm regards,\n` +
        `${userName}\n` +
        `TCET Mumbai\n` +
        `\`\`\`\n\n` +
        `💡 *You can also use the 1-click **Request Guidance** button on any mentor's profile.*`,
      source: 'institutional_engine',
      actions: [{ label: 'Find Alumni to Message', action: 'navigate', url: '/mentorship' }],
    };
  }

  // --- INTENT F: TECHNICAL INTERVIEW PREPARATION ---
  if (/(interview|prepare|questions|dsa|react questions|system design|faang|coding round)/i.test(lower)) {
    let focus = 'General Full Stack';
    if (lower.includes('react')) focus = 'React.js Frontend';
    else if (lower.includes('node') || lower.includes('backend')) focus = 'Node.js & Backend';
    else if (lower.includes('system design')) focus = 'System Design';
    else if (lower.includes('dsa') || lower.includes('algorithm')) focus = 'DSA & Problem Solving';

    return {
      reply: `### 🎯 Top Interview Focus Areas: ${focus}\n\n` +
        `Here are the most frequently asked technical concepts in tier-1 engineering placement rounds:\n\n` +
        `1. **Core Architecture**: Understand virtual DOM reconciliation, event loops, microtasks vs macrotasks, and concurrency models.\n` +
        `2. **State & Data Management**: Efficient state normalization, caching (Redis), memoization, and API state synchronization.\n` +
        `3. **Database Performance**: Indexing strategies (B-Tree vs Hash), query execution plans, and ACID vs BASE trade-offs.\n` +
        `4. **Security & Scale**: JWT token rotation, CORS, rate limiting, hashing (bcrypt), and SQL/NoSQL injection prevention.\n` +
        `5. **System Design Fundamentals**: Load balancing, horizontal scaling, caching layers, and database sharding.\n\n` +
        `💡 *Need 1-on-1 mock interview prep? Connect with senior alumni working at top tech companies in the Mentorship network!*`,
      source: 'institutional_engine',
      actions: [
        { label: 'Connect with a Tech Mentor', action: 'navigate', url: '/mentorship' },
        { label: 'View Career Roadmap', action: 'navigate', url: '/ai-tools' },
      ],
    };
  }

  // --- INTENT G: DONATION CAMPAIGNS & 80G TAX BENEFITS ---
  if (/(donation|donate|campaign|tax|80g|contribute|fund|scholarship)/i.test(lower)) {
    try {
      const campaigns = await Campaign.find({ status: 'active' }).limit(2).lean();
      let campaignList = '';
      if (campaigns.length > 0) {
        campaignList = campaigns
          .map((c) => `• **${c.title}** (Target: ₹${(c.targetAmount / 100000).toFixed(1)} Lakhs)`)
          .join('\n');
      }

      return {
        reply: `### 🏛️ AlumNetra Institutional Giving & 80G Tax Benefits\n\n` +
          `TCET alumni and patrons can support college initiatives, student scholarships, and research labs:\n\n` +
          `• **Instant 80G Tax Receipts**: Every donation through Razorpay generates a legally compliant Section 80G tax deduction receipt downloadable directly from your dashboard.\n` +
          `• **100% Transparency**: Real-time progress bars, audit trails, and campaign updates.\n\n` +
          `${campaignList ? `**Active Campaigns:**\n${campaignList}\n\n` : ''}` +
          `Support current TCET students by visiting the **Contributions** module!`,
        source: 'institutional_engine',
        actions: [{ label: 'Explore Giving Campaigns', action: 'navigate', url: '/donations' }],
      };
    } catch {
      return {
        reply: `TCET Giving Campaigns allow alumni to fund scholarships, student innovation labs, and departmental events with verified 80G tax deduction receipts. Visit the **Contributions** tab to learn more!`,
        source: 'institutional_engine',
        actions: [{ label: 'Explore Giving Campaigns', action: 'navigate', url: '/donations' }],
      };
    }
  }

  // --- INTENT H: ACCOUNT VERIFICATION & TCET ID ---
  if (/(verify|verification|badge|student id|roll number|degree|document|approval)/i.test(lower)) {
    return {
      reply: `### 🛡️ Institutional Verification at TCET\n\n` +
        `AlumNetra uses verified accounts to keep the alumni network secure and high-trust:\n\n` +
        `1. **Students**: Upload your valid TCET Smart ID card or Fee Receipt with your Roll Number.\n` +
        `2. **Alumni**: Upload your Degree Certificate, Provisional Certificate, or provide your verified LinkedIn profile.\n` +
        `3. **Review SLA**: The TCET Administrative Cell reviews submissions within 24-48 business hours.\n\n` +
        `Once approved, you will receive the **Green Shield Verification Badge** on your profile!`,
      source: 'institutional_engine',
      actions: [{ label: 'Go to Document Verification', action: 'navigate', url: '/settings' }],
    };
  }

  // --- INTENT I: COLLABORATION HUB & STUDENT PROJECTS ---
  if (/(collab|project|side project|team|startup|hackathon|recruit students)/i.test(lower)) {
    return {
      reply: `### 🚀 CollabHub: Student-Alumni Project Incubator\n\n` +
        `In **CollabHub**, students and alumni build real-world products together:\n\n` +
        `• **For Alumni**: Post startup MVPs, open-source projects, or research papers and recruit top TCET students. Offer perks like LORs, Mentorship, or Stipends.\n` +
        `• **For Students**: Apply to open engineering roles (Frontend, Backend, AI/ML, UI/UX) and gain production experience for your resume.`,
      source: 'institutional_engine',
      actions: [{ label: 'Open CollabHub', action: 'navigate', url: '/collab-hub' }],
    };
  }

  // --- INTENT J: DEFAULT INSTITUTIONAL ASSISTANCE ---
  return {
    reply: `I can help you navigate everything on **AlumNetra**!\n\n` +
      `Here are some popular things you can ask me:\n` +
      `• *"Find mentors for AI & Cloud Architecture"*\n` +
      `• *"How can I improve my resume for placement drives?"*\n` +
      `• *"What are the latest jobs and internship openings?"*\n` +
      `• *"Help me draft a cold reach-out message to an alumnus"*\n` +
      `• *"Explain 80G tax benefits for donation campaigns"*\n` +
      `• *"Give me interview preparation questions for Full Stack"*\n\n` +
      `Feel free to ask any specific question!`,
    source: 'institutional_engine',
    actions: [
      { label: 'Find Mentors', action: 'navigate', url: '/mentorship' },
      { label: 'AI Tools & Roadmaps', action: 'navigate', url: '/ai-tools' },
      { label: 'Browse Jobs', action: 'navigate', url: '/jobs' },
    ],
  };
}

function generateContextActions(lower) {
  if (lower.includes('mentor')) return [{ label: 'Mentorship Hub', action: 'navigate', url: '/mentorship' }];
  if (lower.includes('job') || lower.includes('intern')) return [{ label: 'Job Portal', action: 'navigate', url: '/jobs' }];
  if (lower.includes('resume') || lower.includes('roadmap')) return [{ label: 'AI Tools', action: 'navigate', url: '/ai-tools' }];
  return [{ label: 'Explore Mentors', action: 'navigate', url: '/mentorship' }];
}

module.exports = {
  processAssistantQuery,
};
