# 🎓 AlumNetra — Intelligent Institutional Alumni Interaction & Career Platform

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![AI Service](https://img.shields.io/badge/AI%20Layer-FastAPI%20%7C%20Scikit--Learn-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Payments](https://img.shields.io/badge/Payments-Razorpay%20Gateway-02042B?logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Storage](https://img.shields.io/badge/Storage-Cloudinary%20CDN-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Email](https://img.shields.io/badge/Email-Gmail%20SMTP-EA4335?logo=gmail&logoColor=white)](https://mail.google.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**AlumNetra** is a next-generation institutional portal engineered for **Thakur College of Engineering and Technology (TCET Mumbai)**. It solves the critical real-world problem of alumni disengagement by creating a **bilateral value exchange**: alumni recruit skilled junior talent and earn company referral rewards, while students gain direct industry referrals, micro-mentorship, and startup project collaborations.

---

## 🏗️ System Architecture

```
                                ┌─────────────────────────────────────────────────┐
                                │             Vite + React 18 Frontend            │
                                │   Glassmorphic UI • TailwindCSS • Framer Motion │
                                │   Live URL: http://localhost:5173 / Production  │
                                └────────────────────────┬────────────────────────┘
                                                         │ HTTP / JWT Auth
                                                         ▼
                                ┌─────────────────────────────────────────────────┐
                                │            Express.js REST API Server           │
                                │    Role-Based Access (Student/Alumni/Admin)     │
                                │    Cloudinary CDN • Razorpay • Gmail SMTP       │
                                └───────┬───────────────────────────┬─────────────┘
                                        │                           │
                        HTTP / Fallback │                           │ Mongoose Driver
                                        ▼                           ▼
                  ┌───────────────────────────┐   ┌───────────────────────────────────┐
                  │   Python AI Microservice  │   │      MongoDB Atlas Cloud Cluster  │
                  │   FastAPI + Scikit-Learn  │   │      Multi-Collection Databases   │
                  │   Vector Cosine Recommender│   │      Users, Jobs, Referrals, etc. │
                  └───────────────────────────┘   └───────────────────────────────────┘
```

---

## 🌟 Key Modules & Core Solutions

### 1. ⚡ AlumRefer: Fast-Track Employee Referral Bridge
* **The Win-Win Loop**: Alumni working at top tech firms (Google, Microsoft, Amazon, Meta, TCS) post internal company openings with specific referral prerequisites (CGPA, LeetCode, GitHub repo).
* **30-Second Review**: Students submit structured 1-click referral packages (ATS resume score + project demo). Alumni review candidate readiness in 30 seconds and submit internal HR referrals with confirmation tracking codes.
* **Incentive**: Alumni earn company hiring bonuses; students bypass automated recruiter black holes.

### 2. 🚀 Collab Labs & Startup Gigs Marketplace
* **Venture Collaboration**: Alumni startup founders, freelancers, and engineers post live side projects, startup MVPs, and open-source gigs.
* **Student Onboarding**: Multi-role team builder (Frontend, ML, Backend) with spot counters, stipend trackers, and perks (LORs, PPO opportunities).
* **Creator Console**: 1-click applicant review and team roster management.

### 3. 🧠 AI Intelligence Layer
* **ATS Resume Analyzer**: NLP parser auditing action verb density, quantifiable metrics, tech stack taxonomy, and assigning grades (`A+` to `D`).
* **Vector Mentor Matchmaker**: Scikit-Learn TF-IDF vectorizer + Cosine Similarity matching students to the ideal alumni mentors based on skill gaps.
* **Career Skill Roadmap**: Interactive multi-phase curriculum builder with target readiness scores and portfolio capstone guides.

### 4. 💼 Career & ATS Placement Tracker
* **Comprehensive Job & Traineeship Portal**: Filters for stipend, CTC, eligibility criteria, and work mode.
* **Visual 5-Stage ATS Pipeline**: Interactive status tracker (`Applied` ➔ `Shortlisted` ➔ `Assessment` ➔ `Interview` ➔ `Selected` / `Rejected`).

### 5. 🤝 Mentorship Hub & Communities
* **Structured Mentorship Proposals**: Defined session goals, frequency, and duration to eliminate open-ended time burdens on alumni.
* **50+ Chapters & Campus Events**: Interactive webinars, hackathons, and reunions with live RSVP capacity limits.

### 6. 💖 Giving & Automated 80G Tax Receipts
* **Campaign Crowdfunding**: Endowment funds for student labs, scholarships, and research grants.
* **Razorpay Gateway Integration**: Generates printable **80G tax exemption certificates** with unique receipt numbers and college seals.

### 7. 🛡️ Admin Governance & Institutional Analytics
* **Verification Queue**: Document inspection for college IDs/degrees with 1-click approvals and verified badges.
* **Institutional Placement Analytics**: Skill market demand vs. talent supply intelligence for NAAC / NIRF accreditation.

---

## 🚀 Quick Start Guide (Local Setup)

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **Python**: v3.10 or higher
* **MongoDB**: MongoDB Atlas URI (or local MongoDB running on `mongodb://127.0.0.1:27017`)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/alumnetra.git
cd alumnetra
```

---

### Step 2: Configure Environment Variables

Create `.env` inside the `server/` directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/alumnetrafyp

JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

CLIENT_URL=http://localhost:5173

# Email (SMTP Gateway)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM="AlumNetra <your_email@gmail.com>"

# Storage (Cloudinary CDN)
STORAGE_PROVIDER=cloudinary
LOCAL_UPLOAD_DIR=./uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment (Razorpay Gateway)
PAYMENT_PROVIDER=razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
SESSION_SECRET=your_session_secret_key
```

---

### Step 3: Install Dependencies

```bash
# 1. Install Backend Dependencies
cd server
npm install

# 2. Install Frontend Dependencies
cd ../client
npm install

# 3. Install AI Service Dependencies
cd ../ai_service
pip install -r requirements.txt
```

---

### Step 4: Seed the Database (200+ Records Across All Modules)

Populate your database with complete institutional demo datasets (Students, Alumni, Jobs, Referrals, Ventures, Campaigns):

```bash
cd server
npm run seed
```

---

### Step 5: Start the Development Servers

#### Terminal 1: Python AI Microservice
```bash
cd ai_service
uvicorn main:app --reload --port 8000
```

#### Terminal 2: Node.js Backend API
```bash
cd server
npm run dev
```

#### Terminal 3: Vite React Frontend
```bash
cd client
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 🔑 Pre-Configured Test Accounts

All accounts share the default password: **`Password@123`**

| Role | Email | Highlights & Test Flows |
| :--- | :--- | :--- |
| **System Admin** | `admin@tcetmumbai.in` | Verification Queue, Member Moderation, Placement Analytics |
| **Alumni (Microsoft)** | `rahul.sharma@tcetmumbai.in` | Referral Bridge (Azure SDE-1), Post Collab Projects, Mentor Dashboard |
| **Alumni (Google)** | `neha.verma@tcetmumbai.in` | GCP Cloud Engineer Referrals, Mentorship Requests, Community Feed |
| **Student** | `student.ritesh@tcetmumbai.in` | Request Referrals, Apply for Collab Gigs, ATS Tracker, AI Career Tools |
| **Recruiter** | `recruiter@technova.com` | ATS Candidate Management Dashboard (`Applied` ➔ `Selected`), Post Jobs |

---

## 🌐 Production Deployment Guide

### 1. Frontend (Vercel / Netlify)
1. Set the Root Directory to `client/`.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set Environment Variable: `VITE_API_URL=https://your-backend-api.onrender.com`

### 2. Backend API (Render / Railway / AWS EC2)
1. Set the Root Directory to `server/`.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Copy all environment variables from `server/.env`.

### 3. AI Microservice (Render / Railway / Fly.io)
1. Set the Root Directory to `ai_service/`.
2. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 📊 Database Collections Summary

```
alumnetrafyp (MongoDB Atlas)
├── users                  # 201 Students, 202 Alumni, Admins, Recruiters
├── profiles               # 405 User Profiles with skills & academic history
├── jobs                   # 200 Listings (100 Jobs + 100 Internships)
├── referralposts          # 150 Employee Referral Openings (AlumRefer)
├── collabprojects         # 150 Startup MVPs & Gigs (Collab Labs)
├── projects               # 200 Innovation & Capstone Showcase Projects
├── mentorships            # 200 Mentorship Offerings & Logged Sessions
├── communities            # 50 Tech & Regional Chapters
├── events                 # 50 Campus Webinars & Hackathons
└── donationcampaigns      # 30 Institutional Endowment Funds
```

---

## 📜 License
This project is licensed under the **MIT License** — developed for **Thakur College of Engineering and Technology (TCET Mumbai)**.
