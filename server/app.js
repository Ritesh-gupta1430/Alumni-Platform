require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { ensureDir, UPLOAD_DIR } = require('./services/storageService');

// Ensure upload directories
ensureDir(path.resolve(UPLOAD_DIR));
ensureDir(path.resolve(UPLOAD_DIR, 'verification'));
ensureDir(path.resolve(UPLOAD_DIR, 'profiles'));
ensureDir(path.resolve(UPLOAD_DIR, 'resumes'));
ensureDir(path.resolve(UPLOAD_DIR, 'campaigns'));
ensureDir(path.resolve(UPLOAD_DIR, 'general'));

const app = express();

// ===== Security Middleware =====
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // for serving uploaded files
    contentSecurityPolicy: false, // handled by frontend
  })
);

// CORS
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ===== Basic Middleware =====
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Global rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 1000 : 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please slow down.', code: 'RATE_LIMITED' },
  })
);

// Serve static uploaded files
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// ===== Health Check =====
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AlumNetra API is running.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

// ===== API Routes =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/users', require('./routes/users'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/events', require('./routes/events'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/collab-projects', require('./routes/collabProjects'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/ai', require('./routes/ai'));

// ===== Error Handling =====
app.use(notFound);
app.use(errorHandler);

module.exports = app;
