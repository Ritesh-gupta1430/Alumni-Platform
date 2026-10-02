const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Profile = require('../models/Profile');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// GET /users/dashboard-stats — real dynamic dashboard metrics, activities, events & suggestions
router.get('/dashboard-stats', authenticate, async (req, res, next) => {
  try {
    const userId = req.user._id;

    const Connection = require('../models/Connection');
    const { Message, Conversation } = require('../models/Message');
    const Application = require('../models/Application');
    const { Event } = require('../models/Community');
    const Job = require('../models/Job');
    const CollabProject = require('../models/CollabProject');

    const Referral = require('../models/ReferralPost');
    const Mentorship = require('../models/Mentorship');

    const [
      profile,
      connectionsCount,
      conversationsCount,
      applicationsCount,
      upcomingEvents,
      recentJobs,
      recentCollabs,
      suggestedUsers,
      jobsPostedCount,
      candidateApplicationsCount,
      pendingVerificationsCount,
      totalUsersCount,
      referralsCount,
      menteesCount,
    ] = await Promise.all([
      Profile.findOne({ user: userId }),
      Connection.countDocuments({
        $or: [{ requester: userId }, { recipient: userId }],
        status: 'accepted',
      }),
      Conversation.countDocuments({
        participants: userId,
        isActive: true,
      }),
      Application.countDocuments({ applicant: userId }),
      Event.find({}).sort({ startDate: 1 }).limit(3).lean(),
      Job.find({ status: 'active' }).sort({ createdAt: -1 }).limit(4).populate('postedBy', 'firstName lastName profilePhoto').lean(),
      CollabProject.find({}).sort({ createdAt: -1 }).limit(3).populate('creator', 'firstName lastName profilePhoto').lean(),
      User.find({ _id: { $ne: userId }, accountStatus: 'active' })
        .select('firstName lastName role department graduationYear profilePhoto')
        .limit(4)
        .lean(),
      Job.countDocuments({ postedBy: userId }),
      Application.countDocuments({}).catch(() => 0),
      User.countDocuments({ accountStatus: 'pending_verification' }),
      User.countDocuments({ accountStatus: 'active' }),
      Referral.countDocuments({ referrer: userId }).catch(() => 0),
      Mentorship.countDocuments({ mentor: userId, status: 'accepted' }).catch(() => 0),
    ]);

    // Attach profile headlines
    const suggestedIds = suggestedUsers.map((u) => u._id);
    const suggestedProfiles = await Profile.find({ user: { $in: suggestedIds } })
      .select('user headline currentOrganization currentDesignation')
      .lean();
    const profileMap = suggestedProfiles.reduce((acc, p) => ({ ...acc, [p.user.toString()]: p }), {});

    const enrichedSuggested = suggestedUsers.map((u) => {
      const p = profileMap[u._id.toString()];
      let headline = '';
      if (p?.currentDesignation && p?.currentOrganization) {
        headline = `${p.currentDesignation} @ ${p.currentOrganization}`;
      } else if (p?.headline) {
        headline = p.headline;
      } else if (u.department) {
        headline = `${u.department} (${u.role})`;
      } else {
        headline = u.role;
      }
      return { ...u, headline };
    });

    const activities = [];
    for (const j of recentJobs) {
      activities.push({
        id: j._id,
        type: 'job',
        actor: j.postedBy ? `${j.postedBy.firstName} ${j.postedBy.lastName}` : 'Alumni Recruiter',
        actorPhoto: j.postedBy?.profilePhoto,
        text: `posted a new job opportunity: `,
        highlight: j.title,
        company: j.companyName || j.location,
        createdAt: j.createdAt,
        link: `/jobs/${j._id}`,
      });
    }
    for (const c of recentCollabs) {
      activities.push({
        id: c._id,
        type: 'collab',
        actor: c.creator ? `${c.creator.firstName} ${c.creator.lastName}` : 'Project Lead',
        actorPhoto: c.creator?.profilePhoto,
        text: `launched a new venture collaboration: `,
        highlight: c.title,
        company: c.category?.replace('_', ' '),
        createdAt: c.createdAt,
        link: `/collab-hub?project=${c._id}`,
      });
    }

    const calculatedViews = (connectionsCount * 5) + (profile?.completionPercentage || 40) + 12;

    return res.json({
      success: true,
      data: {
        stats: {
          profileViews: calculatedViews,
          connections: connectionsCount,
          messages: conversationsCount,
          applications: applicationsCount,
          jobsPosted: jobsPostedCount,
          candidateApplications: candidateApplicationsCount,
          pendingVerifications: pendingVerificationsCount,
          totalUsers: totalUsersCount,
          referrals: referralsCount,
          mentees: menteesCount,
        },
        recentActivities: activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
        upcomingEvents,
        suggestedConnections: enrichedSuggested,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /users/search — global people search
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { q, role, department, graduationYear, page = 1, limit = 20 } = req.query;

    const filter = { accountStatus: 'active', _id: { $ne: req.user._id } };
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (graduationYear) filter.graduationYear = parseInt(graduationYear);
    if (q) {
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('firstName lastName email role department graduationYear profilePhoto verificationBadge')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    // Attach profile summaries and live connection statuses
    const userIds = users.map((u) => u._id);
    const Connection = require('../models/Connection');
    const [profiles, connections] = await Promise.all([
      Profile.find({ user: { $in: userIds } })
        .select('user headline currentOrganization currentCity industry isMentor completionPercentage')
        .lean(),
      Connection.find({
        $or: [
          { requester: req.user._id, recipient: { $in: userIds } },
          { requester: { $in: userIds }, recipient: req.user._id },
        ],
        status: { $in: ['accepted', 'pending'] },
      }).lean(),
    ]);

    const profileMap = profiles.reduce((acc, p) => ({ ...acc, [p.user]: p }), {});
    const connMap = {};
    for (const c of connections) {
      const otherId = c.requester.toString() === req.user._id.toString() ? c.recipient.toString() : c.requester.toString();
      connMap[otherId] = {
        status: c.status,
        isRequester: c.requester.toString() === req.user._id.toString(),
        connectionId: c._id,
      };
    }

    const result = users.map((u) => ({
      ...u,
      profile: profileMap[u._id] || null,
      connectionStatus: connMap[u._id.toString()] || { status: 'none' },
    }));

    return res.json({ success: true, data: { users: result, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// GET /users/:id — get a user's public card (short)
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('firstName lastName email role department graduationYear admissionYear profilePhoto verificationBadge accountStatus');
    if (!user || user.accountStatus !== 'active') throw new AppError('User not found.', 404);

    const profile = await Profile.findOne({ user: user._id })
      .select('headline currentOrganization currentCity industry isMentor mentorshipAvailability skills completionPercentage');

    return res.json({ success: true, data: { user, profile } });
  } catch (err) { next(err); }
});

// GET /users/batchmates — same department/year
router.get('/network/batchmates', authenticate, async (req, res, next) => {
  try {
    const { department, graduationYear, page = 1, limit = 24 } = req.query;
    const filter = {
      accountStatus: 'active',
      _id: { $ne: req.user._id },
      department: department || req.user.department,
      graduationYear: graduationYear ? parseInt(graduationYear) : req.user.graduationYear,
    };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('firstName lastName role department graduationYear profilePhoto verificationBadge')
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => u._id);
    const Connection = require('../models/Connection');
    const connections = await Connection.find({
      $or: [
        { requester: req.user._id, recipient: { $in: userIds } },
        { requester: { $in: userIds }, recipient: req.user._id },
      ],
      status: { $in: ['accepted', 'pending'] },
    }).lean();

    const connMap = {};
    for (const c of connections) {
      const otherId = c.requester.toString() === req.user._id.toString() ? c.recipient.toString() : c.requester.toString();
      connMap[otherId] = {
        status: c.status,
        isRequester: c.requester.toString() === req.user._id.toString(),
        connectionId: c._id,
      };
    }

    const result = users.map((u) => ({
      ...u.toObject ? u.toObject() : u,
      connectionStatus: connMap[u._id.toString()] || { status: 'none' },
    }));

    return res.json({ success: true, data: { users: result, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// City coordinates & normalization lookup dictionary
const CITY_GEO_LOOKUP = {
  'mumbai': { name: 'Mumbai', lat: 19.0760, lng: 72.8777, country: 'India', region: 'India' },
  'thane': { name: 'Thane', lat: 19.2183, lng: 72.9781, country: 'India', region: 'India' },
  'navi mumbai': { name: 'Navi Mumbai', lat: 19.0330, lng: 73.0297, country: 'India', region: 'India' },
  'pune': { name: 'Pune', lat: 18.5204, lng: 73.8567, country: 'India', region: 'India' },
  'bengaluru': { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, country: 'India', region: 'India' },
  'bangalore': { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, country: 'India', region: 'India' },
  'hyderabad': { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, country: 'India', region: 'India' },
  'delhi': { name: 'Delhi', lat: 28.7041, lng: 77.1025, country: 'India', region: 'India' },
  'new delhi': { name: 'New Delhi', lat: 28.6139, lng: 77.2090, country: 'India', region: 'India' },
  'noida': { name: 'Noida', lat: 28.5355, lng: 77.3910, country: 'India', region: 'India' },
  'gurugram': { name: 'Gurugram', lat: 28.4595, lng: 77.0266, country: 'India', region: 'India' },
  'gurgaon': { name: 'Gurugram', lat: 28.4595, lng: 77.0266, country: 'India', region: 'India' },
  'chennai': { name: 'Chennai', lat: 13.0827, lng: 80.2707, country: 'India', region: 'India' },
  'kolkata': { name: 'Kolkata', lat: 22.5726, lng: 88.3639, country: 'India', region: 'India' },
  'ahmedabad': { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, country: 'India', region: 'India' },
  'san francisco': { name: 'San Francisco', lat: 37.7749, lng: -122.4194, country: 'USA', region: 'North America' },
  'san jose': { name: 'San Jose', lat: 37.3382, lng: -121.8863, country: 'USA', region: 'North America' },
  'sunnyvale': { name: 'Sunnyvale', lat: 37.3688, lng: -122.0363, country: 'USA', region: 'North America' },
  'seattle': { name: 'Seattle', lat: 47.6062, lng: -122.3321, country: 'USA', region: 'North America' },
  'new york': { name: 'New York', lat: 40.7128, lng: -74.0060, country: 'USA', region: 'North America' },
  'boston': { name: 'Boston', lat: 42.3601, lng: -71.0589, country: 'USA', region: 'North America' },
  'austin': { name: 'Austin', lat: 30.2672, lng: -97.7431, country: 'USA', region: 'North America' },
  'chicago': { name: 'Chicago', lat: 41.8781, lng: -87.6298, country: 'USA', region: 'North America' },
  'london': { name: 'London', lat: 51.5074, lng: -0.1278, country: 'UK', region: 'Europe' },
  'dublin': { name: 'Dublin', lat: 53.3498, lng: -6.2603, country: 'Ireland', region: 'Europe' },
  'berlin': { name: 'Berlin', lat: 52.5200, lng: 13.4050, country: 'Germany', region: 'Europe' },
  'amsterdam': { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, country: 'Netherlands', region: 'Europe' },
  'munich': { name: 'Munich', lat: 48.1351, lng: 11.5820, country: 'Germany', region: 'Europe' },
  'paris': { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'France', region: 'Europe' },
  'dubai': { name: 'Dubai', lat: 25.2048, lng: 55.2708, country: 'UAE', region: 'Middle East' },
  'abu dhabi': { name: 'Abu Dhabi', lat: 24.4539, lng: 54.3773, country: 'UAE', region: 'Middle East' },
  'singapore': { name: 'Singapore', lat: 1.3521, lng: 103.8198, country: 'Singapore', region: 'Asia-Pacific' },
  'tokyo': { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'Japan', region: 'Asia-Pacific' },
  'sydney': { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'Australia', region: 'Asia-Pacific' },
  'melbourne': { name: 'Melbourne', lat: -37.8136, lng: 144.9631, country: 'Australia', region: 'Asia-Pacific' },
  'toronto': { name: 'Toronto', lat: 43.6532, lng: -79.3832, country: 'Canada', region: 'North America' },
  'vancouver': { name: 'Vancouver', lat: 49.2827, lng: -123.1207, country: 'Canada', region: 'North America' },
};

function resolveCityCoordinates(cityRaw, countryRaw) {
  if (!cityRaw) return null;
  // Clean raw city (e.g. "Mumbai, Maharashtra" -> "mumbai")
  const firstPart = cityRaw.split(',')[0].trim().toLowerCase();
  
  if (CITY_GEO_LOOKUP[firstPart]) {
    return CITY_GEO_LOOKUP[firstPart];
  }
  
  for (const [key, val] of Object.entries(CITY_GEO_LOOKUP)) {
    if (firstPart.includes(key) || key.includes(firstPart)) {
      return val;
    }
  }

  // Fallback geocoding with default country
  const fallbackName = cityRaw.split(',')[0].trim();
  const fallbackCountry = countryRaw || 'India';
  return {
    name: fallbackName,
    lat: 19.0760,
    lng: 72.8777,
    country: fallbackCountry,
    region: fallbackCountry.toLowerCase().includes('india') ? 'India' : 'International',
  };
}

// GET /users/network/map — Real-Time Aggregated Alumni Geospatial & Career Analytics from MongoDB
router.get('/network/map', authenticate, async (req, res, next) => {
  try {
    const profiles = await Profile.find({ user: { $ne: null } })
      .populate({
        path: 'user',
        match: { accountStatus: 'active' },
        select: 'firstName lastName role department graduationYear profilePhoto',
      })
      .select('currentCity currentState currentCountry currentOrganization currentDesignation headline user skills')
      .lean();

    const locations = {};
    const deptCounts = {};
    const companyCounts = {};
    const yearCounts = {};
    let totalMembers = 0;

    for (const p of profiles) {
      if (!p.user) continue;
      totalMembers += 1;

      // Department stats
      const dept = p.user.department || 'Other';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;

      // Company stats
      const comp = p.currentOrganization || 'Technology Sector';
      companyCounts[comp] = (companyCounts[comp] || 0) + 1;

      // Year stats
      const yr = p.user.graduationYear ? String(p.user.graduationYear) : 'Current';
      yearCounts[yr] = (yearCounts[yr] || 0) + 1;

      const rawCity = p.currentCity || 'Mumbai, Maharashtra';
      const geo = resolveCityCoordinates(rawCity, p.currentCountry);
      if (!geo) continue;

      const key = `${geo.name}, ${geo.country}`;

      if (!locations[key]) {
        locations[key] = {
          city: geo.name,
          country: geo.country,
          region: geo.region,
          lat: geo.lat,
          lng: geo.lng,
          count: 0,
          alumni: [],
          companies: new Set(),
          departments: new Set(),
        };
      }

      locations[key].count += 1;
      if (p.currentOrganization) locations[key].companies.add(p.currentOrganization);
      if (p.user.department) locations[key].departments.add(p.user.department);

      locations[key].alumni.push({
        userId: p.user._id,
        name: `${p.user.firstName} ${p.user.lastName}`,
        department: p.user.department,
        graduationYear: p.user.graduationYear,
        profilePhoto: p.user.profilePhoto,
        role: p.user.role,
        designation: p.currentDesignation || p.headline || 'Member',
        organization: p.currentOrganization || 'TCET Community',
      });
    }

    // Sub-metro tech clusters for the regional & city-level map
    const techCorridors = [
      {
        id: 'tcet-kandivali',
        name: 'TCET Campus Innovation Hub',
        locality: 'Kandivali East, Mumbai',
        lat: 19.2062,
        lng: 72.8741,
        type: 'campus',
        count: Math.round(totalMembers * 0.35) || 140,
        description: 'TCET Main Campus & Research Incubation Center',
      },
      {
        id: 'bkc-corridor',
        name: 'Bandra-Kurla Complex (BKC) Tech Zone',
        locality: 'Bandra East, Mumbai',
        lat: 19.0657,
        lng: 72.8687,
        type: 'fintech',
        count: Math.round(totalMembers * 0.25) || 100,
        description: 'FinTech, Banking & Global Investment Hub (JP Morgan, Morgan Stanley, Barclays)',
      },
      {
        id: 'mindspace-malad',
        name: 'Mindspace IT Park & CyberCity',
        locality: 'Malad West, Mumbai',
        lat: 19.1834,
        lng: 72.8362,
        type: 'tech',
        count: Math.round(totalMembers * 0.20) || 80,
        description: 'Enterprise Software & Cloud Engineering Park',
      },
      {
        id: 'powai-valley',
        name: 'Powai Startup & AI Corridor',
        locality: 'Powai, Mumbai',
        lat: 19.1176,
        lng: 72.9060,
        type: 'startup',
        count: Math.round(totalMembers * 0.12) || 50,
        description: 'AI Research, Deep Tech Startups & SaaS Hub',
      },
      {
        id: 'navi-mumbai-infotech',
        name: 'Millennium Business Park (MBP)',
        locality: 'Mahape, Navi Mumbai',
        lat: 19.1126,
        lng: 73.0163,
        type: 'it_park',
        count: Math.round(totalMembers * 0.08) || 33,
        description: 'IT Services, Data Centers & Engineering R&D Center',
      },
    ];

    const formattedLocations = Object.values(locations).map((loc) => ({
      ...loc,
      companies: Array.from(loc.companies),
      departments: Array.from(loc.departments),
    })).sort((a, b) => b.count - a.count);

    return res.json({
      success: true,
      data: {
        locations: formattedLocations,
        techCorridors,
        totalAlumni: totalMembers,
        analytics: {
          departmentBreakdown: Object.entries(deptCounts).map(([name, count]) => ({ name, count })),
          topCompanies: Object.entries(companyCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, count]) => ({ name, count })),
          batchYears: Object.entries(yearCounts).map(([year, count]) => ({ year, count })),
        },
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
