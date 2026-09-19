/**
 * seed_large.js — Enterprise Massive Dataset Generator for AlumNetra (TCET Mumbai)
 * Seeds:
 *  - 200+ Students
 *  - 200+ Alumni
 *  - 10 Faculty & Recruiters
 *  - 400+ User Profiles
 *  - 200+ Jobs & Internships (100 Jobs + 100 Internships)
 *  - 200+ Mentorship Relationships & Requests
 *  - 200+ Innovation Showcase Projects
 *  - 150+ Collab Ventures & Gigs
 *  - 150+ Employee Referral Openings (AlumRefer)
 *  - 50+ Communities & Chapters
 *  - 50+ Campus Events & Hackathons
 *  - 30+ Giving Campaigns & Donation Transactions
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
const { MentorshipRequest, Mentorship } = require('../models/Mentorship');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Data pools for realistic generation
const FIRST_NAMES_MALE = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aaryav', 'Dhruv', 'Kabir', 'Rohan', 'Samarth',
  'Ayush', 'Harsh', 'Manish', 'Nikhil', 'Tanmay', 'Siddharth', 'Varun', 'Yash', 'Aniket', 'Abhishek',
  'Kunal', 'Dev', 'Karan', 'Gaurav', 'Omkar', 'Prathamesh', 'Saurabh', 'Mayur', 'Akash', 'Swapnil',
  'Chinmay', 'Shubham', 'Ritesh', 'Tejas', 'Sanket', 'Pratik', 'Ajay', 'Vikas', 'Pankaj', 'Rajat'
];

const FIRST_NAMES_FEMALE = [
  'Aanya', 'Aadhya', 'Saanvi', 'Ananya', 'Pari', 'Anika', 'Navya', 'Angel', 'Diya', 'Myra',
  'Sara', 'Ira', 'Avani', 'Aditi', 'Prisha', 'Riya', 'Riddhi', 'Siddhi', 'Kavya', 'Pooja',
  'Neha', 'Sneha', 'Shreya', 'Tanvi', 'Anjali', 'Deepika', 'Divya', 'Isha', 'Megha', 'Sakshi',
  'Simran', 'Shruti', 'Sonali', 'Swati', 'Vaishnavi', 'Bhavna', 'Payal', 'Mansi', 'Komal', 'Prachi',
  'Rashmi', 'Krutika', 'Sayali', 'Aishwarya', 'Nikita', 'Gayatri', 'Mrunal', 'Pallavi', 'Namrata', 'Sonam'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Mehta', 'Shah', 'Patil', 'Deshmukh', 'Jadhav', 'Pawar', 'Chavan',
  'Kulkarni', 'Joshi', 'Shinde', 'Gaikwad', 'More', 'Tambe', 'Sawant', 'Rane', 'Bhosale', 'Bhatia',
  'Kapoor', 'Malhotra', 'Khanna', 'Agarwal', 'Mittal', 'Jain', 'Singhania', 'Reddy', 'Nair', 'Menon',
  'Iyer', 'Pillai', 'Rao', 'Choudhury', 'Banerjee', 'Chatterjee', 'Das', 'Sen', 'Ghosh', 'Mukherjee',
  'Trivedi', 'Pandey', 'Mishra', 'Dubey', 'Tripathi', 'Tiwari', 'Shukla', 'Yadav', 'Singh', 'Thakur'
];

const DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Internet of Things (IoT)'
];

const COMPANIES = [
  'Microsoft', 'Google', 'Amazon', 'Meta', 'Apple', 'NVIDIA', 'Adobe', 'Salesforce',
  'Goldman Sachs', 'Morgan Stanley', 'J.P. Morgan', 'Barclays', 'Deutsche Bank',
  'TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'Capgemini', 'LTI Mindtree',
  'Zomato', 'Swiggy', 'Uber', 'Flipkart', 'PhonePe', 'Razorpay', 'CRED', 'Zepto',
  'Tata Motors', 'Larsen & Toubro', 'Reliance Jio', 'Qualcomm', 'Intel', 'Cisco'
];

const CITIES = [
  'Mumbai, Maharashtra', 'Bangalore, Karnataka', 'Hyderabad, Telangana', 'Pune, Maharashtra',
  'Gurugram, Haryana', 'Noida, UP', 'Chennai, Tamil Nadu', 'London, United Kingdom',
  'Seattle, WA, USA', 'San Francisco, CA, USA', 'Singapore', 'Dublin, Ireland'
];

const TECH_SKILLS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'Java', 'C++', 'FastAPI', 'Docker', 'Kubernetes',
  'AWS', 'Azure', 'GCP', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'PyTorch', 'TensorFlow',
  'Next.js', 'TailwindCSS', 'Spring Boot', 'Kafka', 'Golang', 'Flutter', 'Solidity', 'DevOps'
];

const JOB_ROLES = [
  'Software Development Engineer (SDE-1)', 'Frontend Engineer', 'Backend API Specialist',
  'Full Stack Developer', 'Machine Learning Engineer', 'Data Scientist', 'DevOps & Cloud Engineer',
  'Cybersecurity Analyst', 'Product Manager Trainee', 'Mobile App Engineer (Flutter/React Native)',
  'Embedded Systems & IoT Engineer', 'QA Automation Engineer', 'Site Reliability Engineer (SRE)'
];

async function generateMassiveDataset() {
  try {
    console.log('🚀 Starting Enterprise Massive Dataset Generation...');
    console.log('[Connecting] MongoDB URI:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas.');

    // Clear all existing data
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
    await MentorshipRequest.deleteMany({});
    await Mentorship.deleteMany({});
    console.log('🧹 Cleared all collections.');

    const defaultPassword = 'Password@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // ==========================================
    // 1. CREATE CORE SEED USERS (Fixed test accounts)
    // ==========================================
    const adminUser = await User.create({
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
    });

    const primaryAlumni = await User.create({
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul.sharma@tcetmumbai.in',
      passwordHash,
      role: 'ALUMNI',
      accountStatus: 'active',
      emailVerified: true,
      department: 'Computer Engineering',
      graduationYear: 2019,
      currentCompany: 'Microsoft',
      currentRole: 'Senior SDE (Azure Platform)',
      city: 'Hyderabad, Telangana',
      verificationStatus: 'approved',
      verificationBadge: 'verified_alumni',
    });

    const secondAlumni = await User.create({
      firstName: 'Neha',
      lastName: 'Verma',
      email: 'neha.verma@tcetmumbai.in',
      passwordHash,
      role: 'ALUMNI',
      accountStatus: 'active',
      emailVerified: true,
      department: 'Information Technology',
      graduationYear: 2021,
      currentCompany: 'Google',
      currentRole: 'Software Engineer 2 (Cloud)',
      city: 'Bangalore, Karnataka',
      verificationStatus: 'approved',
      verificationBadge: 'verified_alumni',
    });

    const primaryStudent = await User.create({
      firstName: 'Ritesh',
      lastName: 'Gupta',
      email: 'student.ritesh@tcetmumbai.in',
      passwordHash,
      role: 'STUDENT',
      accountStatus: 'active',
      emailVerified: true,
      department: 'Information Technology',
      graduationYear: 2026,
      rollNumber: 'IT-2022-045',
      verificationStatus: 'approved',
      verificationBadge: 'verified_student',
    });

    const primaryRecruiter = await User.create({
      firstName: 'Vikram',
      lastName: 'Malhotra',
      email: 'recruiter@technova.com',
      passwordHash,
      role: 'RECRUITER',
      accountStatus: 'active',
      emailVerified: true,
      currentCompany: 'TechNova Solutions',
      currentRole: 'Lead Technical Talent Partner',
      verificationStatus: 'approved',
      verificationBadge: 'verified_recruiter',
    });

    // ==========================================
    // 2. GENERATE 200 STUDENTS
    // ==========================================
    console.log('📦 Generating 200 Students...');
    const studentsData = [];
    for (let i = 1; i <= 200; i++) {
      const isFemale = i % 2 === 0;
      const firstName = isFemale
        ? FIRST_NAMES_FEMALE[i % FIRST_NAMES_FEMALE.length]
        : FIRST_NAMES_MALE[i % FIRST_NAMES_MALE.length];
      const lastName = LAST_NAMES[(i * 3) % LAST_NAMES.length];
      const dept = DEPARTMENTS[i % DEPARTMENTS.length];
      const gradYear = 2025 + (i % 3); // 2025, 2026, 2027

      studentsData.push({
        firstName,
        lastName,
        email: `student.${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@tcetmumbai.in`,
        passwordHash,
        role: 'STUDENT',
        accountStatus: 'active',
        emailVerified: true,
        department: dept,
        graduationYear: gradYear,
        rollNumber: `TCET-${dept.slice(0, 2).toUpperCase()}-${gradYear}-${String(i).padStart(3, '0')}`,
        verificationStatus: 'approved',
        verificationBadge: 'verified_student',
      });
    }

    const createdStudents = await User.insertMany(studentsData);
    const allStudents = [primaryStudent, ...createdStudents];
    console.log(`✅ ${allStudents.length} Students created.`);

    // ==========================================
    // 3. GENERATE 200 ALUMNI
    // ==========================================
    console.log('📦 Generating 200 Alumni...');
    const alumniData = [];
    for (let i = 1; i <= 200; i++) {
      const isFemale = i % 2 === 1;
      const firstName = isFemale
        ? FIRST_NAMES_FEMALE[(i * 2) % FIRST_NAMES_FEMALE.length]
        : FIRST_NAMES_MALE[(i * 2) % FIRST_NAMES_MALE.length];
      const lastName = LAST_NAMES[(i * 7) % LAST_NAMES.length];
      const dept = DEPARTMENTS[(i * 2) % DEPARTMENTS.length];
      const company = COMPANIES[i % COMPANIES.length];
      const roleTitle = JOB_ROLES[i % JOB_ROLES.length];
      const gradYear = 2012 + (i % 12); // 2012 - 2023
      const city = CITIES[i % CITIES.length];

      alumniData.push({
        firstName,
        lastName,
        email: `alumni.${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@tcetmumbai.in`,
        passwordHash,
        role: 'ALUMNI',
        accountStatus: 'active',
        emailVerified: true,
        department: dept,
        graduationYear: gradYear,
        currentCompany: company,
        currentRole: `${roleTitle}`,
        city,
        verificationStatus: 'approved',
        verificationBadge: 'verified_alumni',
      });
    }

    const createdAlumni = await User.insertMany(alumniData);
    const allAlumni = [primaryAlumni, secondAlumni, ...createdAlumni];
    console.log(`✅ ${allAlumni.length} Alumni created.`);

    // ==========================================
    // 4. GENERATE 400+ PROFILES
    // ==========================================
    console.log('📦 Generating 400+ User Profiles...');
    const profilesData = [];

    // Profiles for all students
    allStudents.forEach((st, idx) => {
      profilesData.push({
        user: st._id,
        headline: `Pre-final Year ${st.department} Student | Aspiring Software Engineer`,
        bio: `Passionate ${st.department} undergraduate at Thakur College of Engineering and Technology (TCET). Active in technical clubs, hackathons, and building full-stack web & AI applications.`,
        currentCity: 'Mumbai, Maharashtra',
        skills: [
          { name: TECH_SKILLS[idx % TECH_SKILLS.length], proficiency: 'advanced', category: 'technical' },
          { name: TECH_SKILLS[(idx + 1) % TECH_SKILLS.length], proficiency: 'intermediate', category: 'technical' },
          { name: TECH_SKILLS[(idx + 2) % TECH_SKILLS.length], proficiency: 'beginner', category: 'technical' },
        ],
        completionPercentage: 90,
        academicHistory: [
          { level: 'degree', institution: 'Thakur College of Engineering and Technology', cgpa: 8.2 + ((idx % 18) * 0.1), passingYear: st.graduationYear, specialization: st.department },
          { level: 'twelfth', institution: 'Maharashtra State Board Junior College', percentage: 88 + (idx % 10), passingYear: st.graduationYear - 4 },
        ],
      });
    });

    // Profiles for all alumni
    allAlumni.forEach((al, idx) => {
      profilesData.push({
        user: al._id,
        headline: `${al.currentRole} at ${al.currentCompany} | TCET Class of ${al.graduationYear}`,
        bio: `TCET ${al.department} alumnus working at ${al.currentCompany}. Specialized in distributed systems, cloud architecture, and engineering management. Actively mentoring students and giving internal employee referrals.`,
        currentCity: al.city || 'Mumbai, Maharashtra',
        skills: [
          { name: TECH_SKILLS[idx % TECH_SKILLS.length], proficiency: 'expert', category: 'technical' },
          { name: TECH_SKILLS[(idx + 3) % TECH_SKILLS.length], proficiency: 'advanced', category: 'technical' },
          { name: 'System Design', proficiency: 'expert', category: 'technical' },
        ],
        industry: 'Technology',
        yearsOfExperience: al.graduationYear ? Math.max(1, 2026 - al.graduationYear) : 4,
        isMentor: true,
        mentorshipAvailability: 'open',
        maxMentees: 5,
        mentorshipTopics: ['Career Guidance', 'System Design', 'Interview Prep', 'Resume Review', 'Cloud Architecture', 'Full Stack Development'],
        currentOrganization: al.currentCompany || 'Technology Partner',
        currentDesignation: al.currentRole || 'Senior Software Engineer',
        completionPercentage: 100,
        academicHistory: [
          { level: 'degree', institution: 'Thakur College of Engineering and Technology', cgpa: 8.5 + ((idx % 15) * 0.1), passingYear: al.graduationYear, specialization: al.department },
        ],
      });
    });

    // Profiles for admin & recruiter
    profilesData.push({
      user: adminUser._id,
      headline: 'Institutional Administrator | TCET Training & Placement Cell',
      bio: 'Administrator account for platform governance, student verification, and NIRF/NAAC analytics.',
      completionPercentage: 100,
    });

    profilesData.push({
      user: primaryRecruiter._id,
      headline: 'Lead Talent Acquisition Partner at TechNova Solutions',
      bio: 'Recruiting top-tier engineering talent from TCET Mumbai for full-time and internship opportunities.',
      completionPercentage: 100,
    });

    await Profile.insertMany(profilesData);
    console.log(`✅ ${profilesData.length} Profiles created.`);

    // ==========================================
    // 5. GENERATE 200 JOBS & INTERNSHIPS
    // ==========================================
    console.log('📦 Generating 200 Jobs & Internships (100 Jobs + 100 Internships)...');
    const jobsData = [];

    // 100 Full-time Jobs
    for (let i = 1; i <= 100; i++) {
      const company = COMPANIES[i % COMPANIES.length];
      const title = JOB_ROLES[i % JOB_ROLES.length];
      const postedAlumnus = allAlumni[i % allAlumni.length];
      const ctc = 10 + (i % 25); // 10 to 35 LPA
      const dept = DEPARTMENTS[i % DEPARTMENTS.length];

      jobsData.push({
        postedBy: postedAlumnus._id,
        companyName: company,
        type: 'job',
        title,
        description: `We are hiring a ${title} at ${company}. You will be responsible for designing scalable cloud microservices, collaborating with cross-functional product teams, and optimizing production latency.`,
        responsibilities: [
          'Design and implement robust RESTful & gRPC APIs.',
          'Optimize database queries and data storage pipelines.',
          'Write automated unit and integration tests with >80% coverage.',
          'Participate in agile sprints, code reviews, and architectural RFCs.',
        ],
        location: CITIES[i % CITIES.length],
        workMode: i % 3 === 0 ? 'remote' : i % 3 === 1 ? 'hybrid' : 'onsite',
        ctcMin: ctc,
        ctcMax: ctc + 4,
        ctcDisplayText: `₹${ctc} - ₹${ctc + 4} LPA`,
        requiredSkills: [
          TECH_SKILLS[i % TECH_SKILLS.length],
          TECH_SKILLS[(i + 1) % TECH_SKILLS.length],
          'Data Structures & Algorithms',
        ],
        minCGPA: 7.0 + ((i % 15) * 0.1),
        eligibleDepartments: [dept, 'Computer Engineering', 'Information Technology'],
        eligibleGraduationYears: [2025, 2026],
        openings: 1 + (i % 5),
        status: 'active',
        applicationDeadline: new Date(Date.now() + (30 + (i % 60)) * 24 * 60 * 60 * 1000),
      });
    }

    // 100 Internships
    for (let i = 1; i <= 100; i++) {
      const company = COMPANIES[(i * 3) % COMPANIES.length];
      const title = `${JOB_ROLES[(i * 2) % JOB_ROLES.length]} Intern`;
      const postedAlumnus = allAlumni[(i * 2) % allAlumni.length];
      const stipend = 25000 + (i % 12) * 5000; // ₹25,000 to ₹80,000 / mo
      const duration = i % 2 === 0 ? '6 Months' : '3 Months';

      jobsData.push({
        postedBy: postedAlumnus._id,
        companyName: company,
        type: 'internship',
        title,
        description: `Join ${company} as a ${title}. Work on cutting-edge engineering problems with 1-on-1 mentorship from senior technical leads. High chance of Pre-Placement Offer (PPO) conversion based on performance.`,
        responsibilities: [
          'Build frontend modules or microservice endpoints under mentor guidance.',
          'Debug production logs and implement bug fixes.',
          'Deliver an end-to-end capstone feature before internship completion.',
        ],
        location: CITIES[(i * 2) % CITIES.length],
        workMode: i % 2 === 0 ? 'hybrid' : 'remote',
        stipendMin: stipend,
        stipendMax: stipend + 5000,
        stipendDisplayText: `₹${(stipend).toLocaleString('en-IN')} / month`,
        duration,
        requiredSkills: [
          TECH_SKILLS[(i * 2) % TECH_SKILLS.length],
          'Problem Solving',
          'Git / GitHub',
        ],
        minCGPA: 7.5,
        eligibleDepartments: DEPARTMENTS.slice(0, 4),
        eligibleGraduationYears: [2026, 2027],
        eligibleYears: [3, 4],
        openings: 2 + (i % 4),
        status: 'active',
        applicationDeadline: new Date(Date.now() + (45 + (i % 45)) * 24 * 60 * 60 * 1000),
      });
    }

    await Job.insertMany(jobsData);
    console.log(`✅ ${jobsData.length} Jobs & Internships created.`);

    // ==========================================
    // 6. GENERATE 150 EMPLOYEE REFERRAL OPENINGS (AlumRefer)
    // ==========================================
    console.log('📦 Generating 150 Employee Referral Openings (AlumRefer)...');
    const referralsData = [];
    for (let i = 1; i <= 150; i++) {
      const alumnus = allAlumni[i % allAlumni.length];
      const company = alumnus.currentCompany || COMPANIES[i % COMPANIES.length];
      const title = JOB_ROLES[i % JOB_ROLES.length];
      const totalSlots = 2 + (i % 4);
      const filledSlots = i % 3 === 0 ? 1 : 0;
      const salary = `${14 + (i % 16)} - ${18 + (i % 16)} LPA`;

      const applicants = [];
      if (filledSlots > 0) {
        const applicantStudent = allStudents[(i * 2) % allStudents.length];
        applicants.push({
          user: applicantStudent._id,
          pitch: `Hello ${alumnus.firstName}, I meet all prerequisites with an 8.6 CGPA and 2 deployed projects in ${TECH_SKILLS[i % TECH_SKILLS.length]}. Would love an internal referral!`,
          githubUrl: `https://github.com/tcet-student-${applicantStudent.firstName.toLowerCase()}`,
          leetcodeProfile: `https://leetcode.com/${applicantStudent.firstName.toLowerCase()}_coder`,
          atsScore: 85 + (i % 12),
          status: 'referral_submitted',
          internalReferralId: `REF-${company.slice(0, 3).toUpperCase()}-${10000 + i}`,
          alumnusFeedback: 'Verified student code quality. Internal HR referral submitted successfully!',
        });
      }

      referralsData.push({
        alumnus: alumnus._id,
        companyName: company,
        jobTitle: `${title}`,
        jobReqId: `REQ-${company.slice(0, 3).toUpperCase()}-${20000 + i}`,
        jobLocation: CITIES[i % CITIES.length],
        jobType: i % 4 === 0 ? 'internship' : 'full_time',
        experienceLevel: i % 3 === 0 ? 'entry_level' : i % 3 === 1 ? '1_to_3_years' : 'intern',
        salaryRange: `₹${salary}`,
        totalSlots,
        filledSlots,
        prerequisites: [
          'Min CGPA 7.5',
          `Proficiency in ${TECH_SKILLS[i % TECH_SKILLS.length]}`,
          'At least 1 live project deployed on Vercel/AWS',
        ],
        requiredSkills: [
          TECH_SKILLS[i % TECH_SKILLS.length],
          TECH_SKILLS[(i + 2) % TECH_SKILLS.length],
          'System Design / DSA',
        ],
        description: `Direct fast-track employee referral for ${title} at ${company}. Internal applicants skip initial recruiter screening filters and get prioritized interview scheduling.`,
        alumnusNote: `I earn an internal referral bonus at ${company} and want to refer deserving TCET engineers. Keep your GitHub clean!`,
        applicants,
      });
    }

    await ReferralPost.insertMany(referralsData);
    console.log(`✅ ${referralsData.length} Referral Openings created.`);

    // ==========================================
    // 7. GENERATE 150 COLLAB VENTURES & GIGS
    // ==========================================
    console.log('📦 Generating 150 Collab Projects & Startup Gigs...');
    const collabData = [];
    const CATEGORIES = ['startup_mvp', 'open_source', 'freelance_gig', 'research_paper', 'college_innovation'];

    for (let i = 1; i <= 150; i++) {
      const creator = i % 2 === 0 ? allAlumni[i % allAlumni.length] : allStudents[i % allStudents.length];
      const cat = CATEGORIES[i % CATEGORIES.length];
      const tech1 = TECH_SKILLS[i % TECH_SKILLS.length];
      const tech2 = TECH_SKILLS[(i + 3) % TECH_SKILLS.length];
      const stipend = i % 3 === 0 ? `₹${5000 + (i % 6) * 2000} / month` : 'Unpaid / LOR & Portfolio';

      collabData.push({
        creator: creator._id,
        title: `${cat === 'startup_mvp' ? 'Venture' : 'Project'} ${tech1} & ${tech2} System (#${i})`,
        tagline: `Building high-throughput ${tech1} cloud architecture for modern digital experiences.`,
        description: `We are building an innovative ${cat.replace('_', ' ')} utilizing ${tech1}, ${tech2}, and distributed microservices. Looking for enthusiastic students to take ownership of frontend components and data pipelines.`,
        category: cat,
        techStack: [tech1, tech2, 'Docker', 'PostgreSQL'],
        status: 'recruiting',
        stipendAmount: stipend,
        estimatedDuration: `${4 + (i % 8)} Weeks`,
        githubUrl: `https://github.com/tcet-innovation/project-${i}`,
        perks: [
          'Letter of Recommendation (LOR)',
          'Mentorship & Code Reviews',
          'Certificate of Completion',
          ...(i % 3 === 0 ? ['Stipend Offered'] : []),
        ],
        openRoles: [
          {
            roleTitle: 'Frontend UI/UX Specialist',
            spotsAvailable: 1,
            spotsFilled: 0,
            requiredSkills: [tech1, 'TailwindCSS'],
            commitmentHoursPerWeek: 6,
          },
          {
            roleTitle: 'Backend API Developer',
            spotsAvailable: 1,
            spotsFilled: 0,
            requiredSkills: [tech2, 'REST / Docker'],
            commitmentHoursPerWeek: 8,
          },
        ],
      });
    }

    await CollabProject.insertMany(collabData);
    console.log(`✅ ${collabData.length} Collab Ventures created.`);

    // ==========================================
    // 8. GENERATE 200 INNOVATION SHOWCASE PROJECTS
    // ==========================================
    console.log('📦 Generating 200 Innovation Showcase Projects...');
    const showcaseData = [];
    for (let i = 1; i <= 200; i++) {
      const student = allStudents[i % allStudents.length];
      const tech = [TECH_SKILLS[i % TECH_SKILLS.length], TECH_SKILLS[(i + 2) % TECH_SKILLS.length]];

      showcaseData.push({
        user: student._id,
        title: `Innovative ${tech[0]} Solution for Smart Campus #${i}`,
        description: `Capstone project built by ${student.firstName} ${student.lastName} exploring ${tech.join(' and ')} for institutional efficiency, real-time analytics, and automated decision engines.`,
        techStack: tech,
        githubUrl: `https://github.com/tcet-student/project-showcase-${i}`,
        liveUrl: `https://tcet-demo-project-${i}.vercel.app`,
        category: i % 4 === 0 ? 'ml' : i % 4 === 1 ? 'web' : i % 4 === 2 ? 'mobile' : 'cloud',
        status: 'completed',
        likesCount: 5 + (i % 40),
        commentsCount: 2 + (i % 15),
      });
    }

    await Project.insertMany(showcaseData);
    console.log(`✅ ${showcaseData.length} Innovation Projects created.`);

    // ==========================================
    // 9. GENERATE 200 MENTORSHIP RELATIONSHIPS
    // ==========================================
    console.log('📦 Generating 200 Mentorship Offerings & Relationships...');
    const mentorshipData = [];
    for (let i = 1; i <= 200; i++) {
      const mentor = allAlumni[i % allAlumni.length];
      const student = allStudents[i % allStudents.length];

      mentorshipData.push({
        mentor: mentor._id,
        student: student._id,
        status: i % 5 === 0 ? 'completed' : 'active',
        goal: `Master ${TECH_SKILLS[i % TECH_SKILLS.length]} and crack SDE-1 interviews at tier-1 tech firms.`,
        topics: ['System Design', 'Resume Critique', 'Mock Coding Interview', 'Career Strategy'],
        startDate: new Date(Date.now() - (15 + (i % 40)) * 24 * 60 * 60 * 1000),
        sessionCount: 2 + (i % 6),
        totalHours: 4 + (i % 12),
      });
    }

    await Mentorship.insertMany(mentorshipData);
    console.log(`✅ ${mentorshipData.length} Mentorship connections created.`);

    // ==========================================
    // 10. GENERATE 50 COMMUNITIES & 50 EVENTS
    // ==========================================
    console.log('📦 Generating 50 Communities & 50 Campus Events...');
    const communitiesData = [];
    const eventsData = [];

    for (let i = 1; i <= 50; i++) {
      const creator = allAlumni[i % allAlumni.length];
      const commName = `${DEPARTMENTS[i % DEPARTMENTS.length]} — Chapter #${i}`;

      const comm = await Community.create({
        name: commName,
        slug: `community-chapter-${i}`,
        description: `Professional technical exchange and alumni chapter for ${commName}. Connect with seniors, discuss research papers, and collaborate on tech bounties.`,
        category: ['technical', 'career', 'research', 'alumni', 'academic', 'social'][i % 6],
        createdBy: creator._id,
        membersCount: 45 + (i * 3),
        guidelines: '1. Be respectful.\n2. Share technical knowledge.\n3. No spam.',
      });

      eventsData.push({
        title: `TCET Masterclass: Scaling with ${TECH_SKILLS[i % TECH_SKILLS.length]} (Session ${i})`,
        description: `Interactive webinar and technical deep-dive led by TCET alumnus ${creator.firstName} ${creator.lastName} (${creator.currentRole} at ${creator.currentCompany}).`,
        category: ['webinar', 'workshop', 'ama', 'reunion', 'seminar', 'career_talk'][i % 6],
        organizer: creator._id,
        community: comm._id,
        startDate: new Date(Date.now() + (7 + (i % 30)) * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + (7 + (i % 30)) * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        location: i % 2 === 0 ? 'Online (Zoom / Google Meet)' : 'TCET Central Auditorium, Mumbai',
        isOnline: i % 2 === 0,
        registrationLimit: 100,
        registeredCount: 25 + (i % 60),
        status: 'active',
      });
    }

    await Event.insertMany(eventsData);
    console.log(`✅ 50 Communities & 50 Campus Events created.`);

    // ==========================================
    // 11. GENERATE 30 GIVING CAMPAIGNS & DONATIONS
    // ==========================================
    console.log('📦 Generating 30 Giving Campaigns & Donations...');
    const campaignsData = [];
    for (let i = 1; i <= 30; i++) {
      const goal = 500000 + (i % 10) * 200000;
      const raised = Math.round(goal * (0.3 + ((i % 6) * 0.12)));

      campaignsData.push({
        title: `TCET Student Innovation & Lab Endowment Fund #${i}`,
        slug: `tcet-endowment-fund-${i}`,
        description: `Fund setup to sponsor student conference travel, high-performance GPU compute for AI labs, and merit-cum-means student scholarships.`,
        category: i % 3 === 0 ? 'scholarship' : i % 3 === 1 ? 'infrastructure' : 'research',
        goalAmount: goal,
        raisedAmount: raised,
        beneficiary: 'TCET Research & Student Welfare Cell',
        status: 'active',
        createdBy: adminUser._id,
        contributorCount: 15 + (i % 40),
        endDate: new Date(Date.now() + (60 + (i % 90)) * 24 * 60 * 60 * 1000),
      });
    }

    await DonationCampaign.insertMany(campaignsData);
    console.log(`✅ 30 Donation Campaigns created.`);

    console.log('\n================================================================');
    console.log('🎉 MASSIVE INSTITUTIONAL SEEDING COMPLETE!');
    console.log('================================================================');
    console.log('📊 DATASET SUMMARY:');
    console.log(`   - 👨‍🎓 Students:             ${allStudents.length}`);
    console.log(`   - 👨‍💼 Alumni:               ${allAlumni.length}`);
    console.log(`   - 👤 Total Profiles:        ${profilesData.length}`);
    console.log(`   - 💼 Jobs & Internships:    ${jobsData.length} (100 Jobs + 100 Internships)`);
    console.log(`   - ⚡ Referral Openings:     ${referralsData.length} (AlumRefer)`);
    console.log(`   - 🚀 Collab Ventures:       ${collabData.length}`);
    console.log(`   - 🏆 Innovation Projects:   ${showcaseData.length}`);
    console.log(`   - 🤝 Mentorships:           ${mentorshipData.length}`);
    console.log(`   - 🌐 Communities & Events:  50 Communities + 50 Events`);
    console.log(`   - 💰 Giving Campaigns:      30 Campaigns`);
    console.log('================================================================');
    console.log('🔑 TEST LOGIN CREDENTIALS (Password: Password@123):');
    console.log('   Admin:      admin@tcetmumbai.in');
    console.log('   Alumni 1:   rahul.sharma@tcetmumbai.in (Microsoft)');
    console.log('   Alumni 2:   neha.verma@tcetmumbai.in   (Google)');
    console.log('   Student:    student.ritesh@tcetmumbai.in');
    console.log('   Recruiter:  recruiter@technova.com');
    console.log('================================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ [Massive Seed Error]:', err);
    process.exit(1);
  }
}

generateMassiveDataset();
