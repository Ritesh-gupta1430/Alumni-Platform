const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Profile = require('../models/Profile');
const { processAssistantQuery } = require('../services/aiAssistantService');

async function verify() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB successfully!');

  const student = await User.findOne({ role: 'STUDENT' });
  const studentProfile = await Profile.findOne({ user: student?._id });

  console.log('\n=============================================');
  console.log('1. TEST MENTOR MATCHMAKING & SCORING');
  console.log('=============================================');
  console.log(`Student: ${student?.firstName} ${student?.lastName} (Dept: ${student?.department})`);
  console.log('Student Skills:', studentProfile?.skills?.map(s => s.name || s));

  // Test Node.js Semantic Matchmaker directly
  const mentors = await Profile.find({
    $or: [{ isMentor: true }, { mentorshipAvailability: { $in: ['open', 'limited'] } }],
    user: { $ne: student?._id },
  })
    .populate('user', 'firstName lastName profilePhoto role department graduationYear')
    .lean();

  console.log(`Found ${mentors.length} active mentors.`);

  // Test scoring logic
  const normalizeCanonical = (val) => {
    if (!val) return '';
    const s = (typeof val === 'string' ? val : val.name || '').toLowerCase().trim();
    if (['react', 'react.js', 'reactjs', 'frontend', 'react native'].includes(s)) return 'react';
    if (['node', 'nodejs', 'node.js', 'express', 'express.js', 'backend'].includes(s)) return 'node';
    if (['python', 'py', 'django', 'fastapi', 'flask'].includes(s)) return 'python';
    if (['js', 'javascript', 'ts', 'typescript', 'es6'].includes(s)) return 'javascript';
    if (['mongo', 'mongodb', 'mongoose'].includes(s)) return 'mongodb';
    if (['sql', 'postgresql', 'postgres', 'mysql', 'database', 'dbms'].includes(s)) return 'sql';
    if (['aws', 'cloud', 'gcp', 'azure', 'devops', 'docker'].includes(s)) return 'cloud';
    if (['ai', 'ml', 'machine learning', 'data science'].includes(s)) return 'ai/ml';
    if (['dsa', 'data structures', 'algorithms'].includes(s)) return 'dsa';
    if (['system design', 'architecture'].includes(s)) return 'system design';
    return s;
  };

  const myRawSkills = studentProfile?.skills?.map((s) => (typeof s === 'string' ? s : s.name)) || [];
  const myNormSkills = myRawSkills.map(normalizeCanonical).filter(Boolean);
  const myGoals = studentProfile?.careerGoals || [];
  const myIndustries = studentProfile?.targetIndustries || [];
  const myDept = student?.department || '';

  const scored = mentors.map((m) => {
    const mentorRawSkills = m.skills?.map((s) => (typeof s === 'string' ? s : s.name)) || [];
    const mentorNormSkills = mentorRawSkills.map(normalizeCanonical).filter(Boolean);
    const mentorTopics = m.mentorshipTopics?.map((t) => t.toLowerCase()) || [];
    const mentorIndustry = (m.industry || '').toLowerCase();
    const mentorDept = m.user?.department || '';
    const mentorOrg = m.currentOrganization || '';
    const mentorYears = m.yearsOfExperience || 0;

    const matchedRaw = [];
    mentorRawSkills.forEach((raw, idx) => {
      const norm = mentorNormSkills[idx];
      if (myNormSkills.includes(norm) || myRawSkills.some((ms) => ms.toLowerCase() === raw.toLowerCase())) {
        matchedRaw.push(raw);
      }
    });

    const skillOverlapRatio = myNormSkills.length > 0
      ? matchedRaw.length / Math.max(myNormSkills.length, 1)
      : 0.3;

    const matchedTopics = myGoals.filter((g) =>
      mentorTopics.some((t) => t.includes(g.toLowerCase()) || g.toLowerCase().includes(t))
    );
    const topicOverlapRatio = myGoals.length > 0
      ? matchedTopics.length / Math.max(myGoals.length, 1)
      : 0.25;

    const isSameDept = myDept && mentorDept && myDept.toLowerCase() === mentorDept.toLowerCase();
    const deptWeight = isSameDept ? 0.18 : 0.04;
    const isIndustryMatch = myIndustries.some((i) => mentorIndustry.includes(i.toLowerCase()));
    const industryWeight = isIndustryMatch ? 0.14 : 0.04;
    const expScore = Math.min(mentorYears / 10, 1.0) * 0.10;
    const isTopTierOrg = /(google|microsoft|amazon|meta|apple|nvidia|morgan stanley|barclays|jp morgan|jpmorgan|tcs|jio|adobe|uber)/i.test(mentorOrg);
    const tierBonus = isTopTierOrg ? 0.08 : (mentorOrg ? 0.03 : 0.0);

    const rawScore = 0.22 + (skillOverlapRatio * 0.32) + (topicOverlapRatio * 0.18) + deptWeight + industryWeight + expScore + tierBonus;
    const score = Math.min(97, Math.max(38, Math.round(rawScore * 100)));

    return {
      name: `${m.user?.firstName} ${m.user?.lastName}`,
      org: m.currentOrganization,
      dept: m.user?.department,
      score,
      matchedSkills: matchedRaw,
    };
  }).sort((a, b) => b.score - a.score);

  console.log('\nCalculated Mentor Matches (Distinct Realistic Distribution):');
  scored.slice(0, 6).forEach((m, idx) => {
    console.log(`  [#${idx + 1}] ${m.name} (${m.org || 'TCET Alum'}, Dept: ${m.dept}) -> ${m.score}% MATCH | Shared Skills: ${m.matchedSkills.join(', ') || 'None'}`);
  });

  console.log('\n=============================================');
  console.log('2. TEST INSTITUTIONAL AI ASSISTANT');
  console.log('=============================================');

  const testQueries = [
    'Find mentors for React and Full Stack',
    'What are the latest jobs and internship openings?',
    'Give me top interview questions for React.js',
    'Help me draft a cold email to an alumnus at Microsoft',
    'How does 80G tax benefit work for donations?',
  ];

  for (const q of testQueries) {
    console.log(`\nUser Query: "${q}"`);
    const res = await processAssistantQuery(q, student);
    console.log(`Assistant Response (Source: ${res.source}):`);
    console.log(res.reply.substring(0, 180) + '...');
    if (res.actions?.length) {
      console.log('Action Chips:', res.actions.map(a => a.label).join(' | '));
    }
  }

  await mongoose.disconnect();
  console.log('\nAll tests completed successfully!');
}

verify().catch(console.error);
