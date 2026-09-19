/**
 * seed.js - High-quality Institutional Seed Data for AlumNetra (TCET Mumbai)
 * Populates verified demo users, mentors, recruiters, students, jobs, campaigns, and communities.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Profile = require('../models/Profile');
const Job = require('../models/Job');
const { Community, Event } = require('../models/Community');
const { DonationCampaign, Donation } = require('../models/Donation');
const Project = require('../models/Project');
const CollabProject = require('../models/CollabProject');
const ReferralPost = require('../models/ReferralPost');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/alumnetra_dev';

async function seedDatabase() {
  try {
    console.log('[Seed] Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected to database.');

    // Clear existing collections
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Job.deleteMany({});
    await Community.deleteMany({});
    await Event.deleteMany({});
    await DonationCampaign.deleteMany({});
    await Donation.deleteMany({});
    await Project.deleteMany({});
    await CollabProject.deleteMany({});
    await ReferralPost.deleteMany({});
    console.log('[Seed] Cleared existing collections.');

    const defaultPassword = 'Password@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // 1. Create Core Users
    const usersData = [
      {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@tcetmumbai.in',
        passwordHash,
        role: 'ADMIN',
        accountStatus: 'active',
        emailVerified: true,
        department: 'Information Technology',
        verificationStatus: 'approved',
        verificationBadge: 'verified_faculty',
      },
      {
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'rahul.sharma@tcetmumbai.in',
        passwordHash,
        role: 'ALUMNI',
        accountStatus: 'active',
        emailVerified: true,
        department: 'Information Technology',
        graduationYear: 2021,
        admissionYear: 2017,
        verificationStatus: 'approved',
        verificationBadge: 'verified_alumni',
      },
      {
        firstName: 'Neha',
        lastName: 'Verma',
        email: 'neha.verma@tcetmumbai.in',
        passwordHash,
        role: 'ALUMNI',
        accountStatus: 'active',
        emailVerified: true,
        department: 'Computer Engineering',
        graduationYear: 2020,
        admissionYear: 2016,
        verificationStatus: 'approved',
        verificationBadge: 'verified_alumni',
      },
      {
        firstName: 'Ritesh',
        lastName: 'Patil',
        email: 'student.ritesh@tcetmumbai.in',
        passwordHash,
        role: 'STUDENT',
        accountStatus: 'active',
        emailVerified: true,
        department: 'Information Technology',
        graduationYear: 2026,
        admissionYear: 2022,
        currentYear: 4,
        verificationStatus: 'approved',
        verificationBadge: 'verified_student',
      },
      {
        firstName: 'Vikram',
        lastName: 'Mehta',
        email: 'recruiter@technova.com',
        passwordHash,
        role: 'RECRUITER',
        accountStatus: 'active',
        emailVerified: true,
        department: 'Corporate Placement Cell',
        verificationStatus: 'approved',
        verificationBadge: 'verified_recruiter',
      },
    ];

    const createdUsers = await User.insertMany(usersData);
    console.log(`[Seed] Created ${createdUsers.length} users.`);

    const [adminUser, rahulAlumni, nehaAlumni, riteshStudent, recruiterUser] = createdUsers;

    // 2. Create Profiles
    const profilesData = [
      {
        user: rahulAlumni._id,
        headline: 'Senior Software Engineer @ Microsoft | Ex-Amazon',
        bio: 'TCET IT 2021 Alum. Passionate about distributed systems, microservices, cloud infrastructure, and mentoring upcoming engineers.',
        currentPosition: 'Senior Software Engineer',
        currentCompany: 'Microsoft',
        industry: 'Technology',
        yearsOfExperience: 5,
        location: { city: 'Bengaluru', country: 'India' },
        skills: [
          { name: 'React', proficiency: 'advanced', category: 'technical' },
          { name: 'Node.js', proficiency: 'expert', category: 'technical' },
          { name: 'TypeScript', proficiency: 'advanced', category: 'technical' },
          { name: 'Distributed Systems', proficiency: 'expert', category: 'technical' },
          { name: 'Docker', proficiency: 'advanced', category: 'tool' },
          { name: 'Kubernetes', proficiency: 'intermediate', category: 'tool' },
          { name: 'AWS', proficiency: 'expert', category: 'technical' },
        ],
        isMentor: true,
        mentorshipAvailability: 'open',
        maxMentees: 4,
        mentorshipTopics: ['Full Stack Architecture', 'System Design', 'FAANG Placement Prep', 'Career Transitions'],
        careerGoals: ['Engineering Leadership', 'Distributed Systems'],
        targetIndustries: ['Technology', 'Cloud Computing'],
      },
      {
        user: nehaAlumni._id,
        headline: 'Lead AI Engineer @ Google | Deep Learning & NLP Specialist',
        bio: 'TCET CMPN 2020 Alum. Building LLM infrastructure and transformer-based recommendation systems.',
        currentPosition: 'Lead AI Engineer',
        currentCompany: 'Google',
        industry: 'Artificial Intelligence',
        yearsOfExperience: 6,
        location: { city: 'Hyderabad', country: 'India' },
        skills: [
          { name: 'Python', proficiency: 'expert', category: 'technical' },
          { name: 'PyTorch', proficiency: 'expert', category: 'technical' },
          { name: 'Scikit-learn', proficiency: 'expert', category: 'technical' },
          { name: 'FastAPI', proficiency: 'advanced', category: 'technical' },
          { name: 'NLP', proficiency: 'expert', category: 'technical' },
          { name: 'Docker', proficiency: 'advanced', category: 'tool' },
        ],
        isMentor: true,
        mentorshipAvailability: 'open',
        maxMentees: 3,
        mentorshipTopics: ['AI & Deep Learning', 'NLP Transformers', 'Research Papers to Code', 'MLOps'],
        careerGoals: ['AI Research', 'Principal Architect'],
        targetIndustries: ['Artificial Intelligence', 'Data Science'],
      },
      {
        user: riteshStudent._id,
        headline: 'Final Year IT Undergrad @ TCET | Full-Stack & AI Enthusiast',
        bio: 'Building web applications and machine learning recommendation engines. Winner of SIH TCET round.',
        currentPosition: 'Software Engineering Intern',
        currentCompany: 'TechNova Labs',
        industry: 'Technology',
        yearsOfExperience: 1,
        location: { city: 'Mumbai', country: 'India' },
        skills: [
          { name: 'JavaScript', proficiency: 'advanced', category: 'technical' },
          { name: 'React', proficiency: 'advanced', category: 'technical' },
          { name: 'Node.js', proficiency: 'intermediate', category: 'technical' },
          { name: 'Python', proficiency: 'intermediate', category: 'technical' },
          { name: 'MongoDB', proficiency: 'intermediate', category: 'technical' },
          { name: 'Tailwind CSS', proficiency: 'advanced', category: 'technical' },
        ],
        careerGoals: ['Full Stack Developer', 'AI Engineer'],
        targetIndustries: ['Technology', 'FinTech'],
      },
    ];

    await Profile.insertMany(profilesData);
    console.log('[Seed] Created User Profiles.');

    // 3. Create Jobs & Internships
    const jobsData = [
      {
        title: 'Full Stack Software Engineer',
        companyName: 'Microsoft',
        companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
        type: 'job',
        location: 'Bengaluru, India',
        workMode: 'hybrid',
        description: 'Join our Azure Core team to build scalable microservices and developer productivity dashboards with React, Node.js, and TypeScript.',
        requiredSkills: ['React', 'Node.js', 'JavaScript', 'TypeScript', 'MongoDB'],
        preferredSkills: ['Docker', 'Azure', 'REST APIs'],
        eligibleDepartments: ['Information Technology', 'Computer Engineering', 'Artificial Intelligence & Data Science'],
        ctcMin: 14,
        ctcMax: 22,
        ctcDisplayText: '14 - 22 LPA',
        postedBy: rahulAlumni._id,
        status: 'active',
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'AI / ML Research Intern',
        companyName: 'TechNova Labs',
        companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
        type: 'internship',
        location: 'Mumbai, India (Remote Available)',
        workMode: 'remote',
        description: 'Looking for enthusiastic student interns to assist in fine-tuning transformer models and optimizing TF-IDF vector search algorithms.',
        requiredSkills: ['Python', 'Scikit-learn', 'NLP', 'FastAPI'],
        preferredSkills: ['PyTorch', 'Docker'],
        eligibleDepartments: ['Information Technology', 'Computer Engineering', 'Artificial Intelligence & Data Science'],
        stipendMin: 30000,
        stipendMax: 45000,
        stipendDisplayText: '₹30,000 - ₹45,000 / month',
        duration: '6 months',
        postedBy: recruiterUser._id,
        status: 'active',
        applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      },
    ];

    await Job.insertMany(jobsData);
    console.log('[Seed] Created Jobs and Internships.');

    // 4. Create Giving Campaigns
    const campaignsData = [
      {
        title: 'TCET Merit-cum-Means Student Scholarship 2026',
        slug: 'tcet-merit-scholarship-2026',
        description: 'Provide 100% tuition support and laptop grants for meritorious and economically underprivileged engineering students at TCET.',
        category: 'scholarship',
        goalAmount: 1500000,
        raisedAmount: 945000,
        coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=60',
        beneficiary: 'TCET Underprivileged Student Welfare Trust',
        status: 'active',
        createdBy: adminUser._id,
        contributorCount: 42,
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Advanced AI & Robotics Innovation Lab Setup',
        slug: 'ai-robotics-innovation-lab',
        description: 'Establish state-of-the-art GPU compute clusters and robotic testbenches for interdisciplinary student research and Smart India Hackathon prototypes.',
        category: 'infrastructure',
        goalAmount: 2500000,
        raisedAmount: 1680000,
        coverImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60',
        beneficiary: 'TCET Center of Excellence',
        status: 'active',
        createdBy: adminUser._id,
        contributorCount: 68,
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    ];

    await DonationCampaign.insertMany(campaignsData);
    console.log('[Seed] Created Donation Campaigns.');

    // 5. Create Communities
    const communitiesData = [
      {
        name: 'AI & Data Science TCET Hub',
        slug: 'ai-data-science-tcet',
        description: 'Technical community for machine learning practitioners, researchers, and competitive Kaggle participants from TCET.',
        category: 'technical',
        coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=60',
        createdBy: rahulAlumni._id,
        membersCount: 156,
        guidelines: '1. Share technical papers and open source repositories.\n2. Respect community members.\n3. Keep discussions professional.',
      },
      {
        name: 'TCET Web & Cloud Developers Chapter',
        slug: 'tcet-web-cloud-devs',
        description: 'Discussions on full-stack web engineering, microservices, cloud deployments, and hackathon project collaborations.',
        category: 'technical',
        coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
        createdBy: riteshStudent._id,
        membersCount: 210,
        guidelines: '1. Code reviews and constructive feedback only.\n2. No spam or self-promotion.',
      },
    ];

    await Community.insertMany(communitiesData);
    console.log('[Seed] Created Communities.');

    // 6. Create Collab Projects (Alumni Ventures & Gigs)
    const collabProjectsData = [
      {
        creator: rahulAlumni._id,
        title: 'MedAssist AI: Clinical Document Summarizer',
        tagline: 'Building a privacy-first NLP pipeline to summarize patient EHR records using FastAPI & Transformers.',
        description: 'We are developing an open-source assistive tool for healthcare workers that converts lengthy unstructured clinical transcripts into structured SOAP summaries. Looking for 2 energetic student engineers to build the React dashboard and fine-tune lightweight HuggingFace models.',
        category: 'startup_mvp',
        techStack: ['React', 'FastAPI', 'PyTorch', 'TailwindCSS', 'Docker'],
        status: 'recruiting',
        stipendAmount: '₹8,000 / month',
        estimatedDuration: '8 Weeks',
        githubUrl: 'https://github.com/rahulsharma/medassist-ai',
        liveUrl: 'https://medassist-demo.vercel.app',
        communicationChannel: 'https://discord.gg/medassist-lab',
        perks: ['Stipend Offered', 'Letter of Recommendation (LOR)', 'Mentorship & Code Reviews', 'Potential PPO / Hiring'],
        openRoles: [
          {
            roleTitle: 'Frontend Engineer (React/Tailwind)',
            spotsAvailable: 1,
            spotsFilled: 0,
            requiredSkills: ['React', 'TailwindCSS', 'REST APIs'],
            commitmentHoursPerWeek: 6,
          },
          {
            roleTitle: 'NLP / Machine Learning Developer',
            spotsAvailable: 1,
            spotsFilled: 0,
            requiredSkills: ['Python', 'Transformers', 'FastAPI'],
            commitmentHoursPerWeek: 8,
          },
        ],
      },
      {
        creator: nehaAlumni._id,
        title: 'FinTrack: Multi-Tenant Budget & Analytics Engine',
        tagline: 'Microservices-based analytics backend for personal finance insights and expense forecasts.',
        description: 'An open-source financial aggregation and predictive forecasting service built on Node.js and Redis. Great opportunity for students aiming for backend and DevOps roles to gain hands-on production engineering experience.',
        category: 'open_source',
        techStack: ['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Jest'],
        status: 'recruiting',
        stipendAmount: 'Unpaid / Portfolio & LOR',
        estimatedDuration: '6 Weeks',
        githubUrl: 'https://github.com/nehaverma/fintrack-engine',
        perks: ['Certificate of Completion', 'Letter of Recommendation (LOR)', 'Mentorship & Code Reviews', 'GitHub Co-author / Contributor'],
        openRoles: [
          {
            roleTitle: 'Backend API Developer',
            spotsAvailable: 2,
            spotsFilled: 0,
            requiredSkills: ['Node.js', 'Express', 'SQL', 'Git'],
            commitmentHoursPerWeek: 5,
          },
        ],
      },
    ];

    await CollabProject.insertMany(collabProjectsData);
    console.log('[Seed] Created Collab Projects (Venture Gigs).');

    // 7. Create Employee Referral Openings (AlumRefer)
    const referralPostsData = [
      {
        alumnus: rahulAlumni._id,
        companyName: 'Microsoft',
        jobTitle: 'Software Engineer 1 (Azure Core Engineering)',
        jobReqId: 'MSFT-REQ-19482',
        jobLocation: 'Hyderabad / Hybrid',
        jobType: 'full_time',
        experienceLevel: 'entry_level',
        salaryRange: '₹18 - ₹24 LPA',
        totalSlots: 3,
        filledSlots: 1,
        prerequisites: ['Min CGPA 8.0', 'Strong in Data Structures & Algorithms', '1 Deployed Full Stack Project (React/Node)'],
        requiredSkills: ['C# / Java', 'System Design Basics', 'Cloud / Docker', 'SQL'],
        description: 'Direct employee referral into the Azure Platform & Tools engineering org in Hyderabad. Looking for 2026/2025 graduates with solid problem-solving foundation.',
        alumnusNote: 'I will personally review your GitHub projects and code quality before submitting the internal HR referral code!',
        applicants: [
          {
            user: riteshStudent._id,
            pitch: 'Hi Rahul Sir, I have maintained an 8.9 CGPA in IT and built AlumNetra and an AI Resume Analyzer. Solved 250+ LeetCode problems and eager to interview for Azure Core!',
            githubUrl: 'https://github.com/riteshgupta/azure-microservices',
            leetcodeProfile: 'https://leetcode.com/ritesh_tcet',
            atsScore: 92,
            status: 'referral_submitted',
            internalReferralId: 'MSFT-REF-88412',
            alumnusFeedback: 'Strong project portfolio and clean code. Internal referral submitted to the hiring manager queue!',
          },
        ],
      },
      {
        alumnus: nehaAlumni._id,
        companyName: 'Google',
        jobTitle: 'Associate Cloud Engineer (Google Cloud Platform)',
        jobReqId: 'GOOG-CLOUD-849',
        jobLocation: 'Bangalore',
        jobType: 'full_time',
        experienceLevel: 'entry_level',
        salaryRange: '₹22 - ₹28 LPA',
        totalSlots: 2,
        filledSlots: 0,
        prerequisites: ['Proficiency in Python or Go', 'Understanding of Distributed Systems & Networking', 'Active GitHub contributions'],
        requiredSkills: ['Python', 'Kubernetes', 'Linux Internals', 'Algorithms'],
        description: 'Google Cloud team in Bangalore is expanding. Seeking energetic engineers passionate about distributed computing and site reliability engineering.',
        alumnusNote: 'Make sure to highlight system design and open-source contributions in your pitch!',
      },
      {
        alumnus: rahulAlumni._id,
        companyName: 'Amazon',
        jobTitle: 'Software Development Engineer Intern (6-Month Trainee)',
        jobReqId: 'AMZN-INT-2026',
        jobLocation: 'Mumbai / Bangalore',
        jobType: 'internship',
        experienceLevel: 'intern',
        salaryRange: '₹80,000 / month stipend',
        totalSlots: 4,
        filledSlots: 0,
        prerequisites: ['Final year / Pre-final year student', 'Good knowledge of Java/OOP', 'LeetCode Medium proficiency'],
        requiredSkills: ['Java', 'Data Structures', 'OOP', 'REST APIs'],
        description: 'Direct fast-track referral for Amazon AWS Retail team 6-month internship with high PPO conversion rate.',
        alumnusNote: 'Great opportunity for 3rd and 4th year students to get direct interview calls at Amazon.',
      },
    ];

    await ReferralPost.insertMany(referralPostsData);
    console.log('[Seed] Created Employee Referral Openings (AlumRefer).');

    console.log('\n======================================================');
    console.log('✅ SEEDING COMPLETE! You can login with:');
    console.log('   Admin:      admin@tcetmumbai.in       | Password@123');
    console.log('   Alumni:     rahul.sharma@tcetmumbai.in | Password@123');
    console.log('   Alumni:     neha.verma@tcetmumbai.in   | Password@123');
    console.log('   Student:    student.ritesh@tcetmumbai.in | Password@123');
    console.log('   Recruiter:  recruiter@technova.com     | Password@123');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
}

seedDatabase();
