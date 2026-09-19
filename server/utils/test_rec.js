const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Profile = require('../models/Profile');

async function testRecommendation() {
  await mongoose.connect(process.env.MONGO_URI);
  const student = await User.findOne({ role: 'STUDENT' });
  const profile = await Profile.findOne({ user: student._id });
  console.log('Student:', student.firstName, student.lastName, student.department);
  console.log('Student profile skills:', profile?.skills);

  const candidateProfile = {
    skills: profile?.skills || [],
    careerGoals: profile?.careerGoals || [],
    targetIndustries: profile?.targetIndustries || [],
    department: student.department,
    headline: profile?.headline || '',
    bio: profile?.bio || '',
  };

  const mentors = await Profile.find({
    isMentor: true,
    user: { $ne: student._id },
  })
    .populate('user', 'firstName lastName profilePhoto role department graduationYear verificationBadge accountStatus')
    .limit(10)
    .lean();

  console.log(`Fetched ${mentors.length} mentors from DB.`);

  try {
    const res = await fetch('http://127.0.0.1:8000/api/recommend/mentors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate: candidateProfile,
        mentors: mentors,
        topK: 10,
      }),
    });
    console.log('Python Service Status:', res.status);
    const pyData = await res.json();
    console.log('Python Results count:', pyData.data?.length);
    if (pyData.data?.length > 0) {
      console.log('Top 3 Python Mentor Match Scores:');
      pyData.data.slice(0, 3).forEach((m) => {
        console.log(`- ${m.user?.firstName} ${m.user?.lastName} (${m.currentOrganization}): ${m.matchScore}% Match. Reasons:`, m.matchReasons);
      });
    }
  } catch (e) {
    console.error('Python service error:', e);
  }

  await mongoose.disconnect();
}

testRecommendation().catch(console.error);
