"""
main.py - FastAPI AI Microservice for AlumNetra Institutional Portal
Provides high-performance vector recommendation, resume ATS parsing, and skill roadmap endpoints.
"""

from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from recommender import TFIDFRecommender
from resume_analyzer import ResumeAnalyzer
from roadmap_generator import CareerRoadmapGenerator

app = FastAPI(
    title="AlumNetra AI Intelligence Microservice",
    description="Vector recommendation, resume NLP analyzer, and institutional skill graphs.",
    version="1.0.0"
)

# Enable CORS for local development and institutional servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
recommender = TFIDFRecommender()
resume_analyzer = ResumeAnalyzer()
roadmap_generator = CareerRoadmapGenerator()


# Request Schemas
class MentorMatchRequest(BaseModel):
    candidate: Dict[str, Any]
    mentors: List[Dict[str, Any]]
    topK: Optional[int] = 10


class JobMatchRequest(BaseModel):
    candidate: Dict[str, Any]
    job: Dict[str, Any]


class ResumeAnalyzeRequest(BaseModel):
    resumeText: str = Field(..., min_length=10)


class CareerRoadmapRequest(BaseModel):
    targetRole: str
    userSkills: Optional[List[str]] = []


class AssistantQueryRequest(BaseModel):
    message: str


@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "AlumNetra AI Intelligence Microservice",
        "engine": "Scikit-Learn TF-IDF + Cosine Similarity Vector Engine",
        "version": "1.0.0"
    }


@app.post("/api/recommend/mentors")
def recommend_mentors(payload: MentorMatchRequest):
    try:
        results = recommender.match_mentors(
            candidate_profile=payload.candidate,
            mentor_profiles=payload.mentors,
            top_k=payload.topK or 10
        )
        return {"success": True, "data": results, "engine": "python-tfidf-vectorizer"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation engine error: {str(e)}")


@app.post("/api/recommend/jobs")
def recommend_job_match(payload: JobMatchRequest):
    try:
        results = recommender.match_job(
            candidate_profile=payload.candidate,
            job=payload.job
        )
        return {"success": True, "data": results, "engine": "python-tfidf-vectorizer"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job matching error: {str(e)}")


@app.post("/api/resume/analyze")
def analyze_resume(payload: ResumeAnalyzeRequest):
    try:
        analysis = resume_analyzer.analyze(payload.resumeText)
        return {"success": True, "data": analysis, "engine": "python-nlp-structural-ats"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume analysis error: {str(e)}")


@app.post("/api/career/roadmap")
def generate_career_roadmap(payload: CareerRoadmapRequest):
    try:
        roadmap = roadmap_generator.generate(
            target_role=payload.targetRole,
            user_skills=payload.userSkills or []
        )
        return {"success": True, "data": roadmap, "engine": "python-skill-graph"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Roadmap generation error: {str(e)}")


@app.post("/api/assistant/query")
def assistant_query(payload: AssistantQueryRequest):
    msg = payload.message.lower()
    
    knowledge_base = [
        {"keywords": ["mentor", "mentorship", "guidance"], "reply": "Go to the **Mentorship** tab in the sidebar. You can filter by skill tags, industry, and availability. Use the **AI Mentor Matchmaker** on the AI Tools page to find alumni with the highest vector alignment to your goals."},
        {"keywords": ["job", "internship", "placement", "apply"], "reply": "Explore verified campus and alumni postings in **Jobs & Internships**. Each job card features an instant **AI Fit Matcher** that evaluates your profile skills against required qualifications."},
        {"keywords": ["resume", "ats", "score", "cv"], "reply": "Use our **AI Resume Quality Analyzer** in the AI Tools section. It audits section completeness, action verb density, and quantifiable metrics to provide an ATS grade (A-D) with actionable feedback."},
        {"keywords": ["roadmap", "career", "skills", "learn"], "reply": "Check out the **AI Career Roadmap Generator** in AI Tools. Select your target destination (Full Stack, AI/ML, Cloud DevOps, Data Science) to see personalized milestones, missing skills, and capstone projects."},
        {"keywords": ["donation", "campaign", "contribute", "tax", "80g"], "reply": "Visit **Contributions** to support student scholarships, lab infrastructure, and hackathon funds. You will receive an instant downloadable 80G tax exemption receipt."},
        {"keywords": ["verify", "verification", "badge", "id card"], "reply": "Submit your college ID / degree certificate in **Settings → Document Verification**. Admin reviewers will approve your profile and grant the institutional verified badge."},
        {"keywords": ["community", "groups", "clubs"], "reply": "Join technical and special interest groups in **Communities** (e.g. AI & Data Science, Web Devs, TCET Entrepreneurs) to discuss projects and collaborate."},
        {"keywords": ["event", "webinar", "reunion"], "reply": "Register for upcoming alumni webinars and hackathons in **Events & Reunions**. RSVP to receive email reminders and calendar invites."},
        {"keywords": ["message", "chat", "connect"], "reply": "Build your alumni network in the **Network** directory and start conversations in **Messages**."}
    ]

    matched = next((item["reply"] for item in knowledge_base if any(k in msg for k in item["keywords"])), None)
    
    if not matched:
        matched = "I am the AlumNetra Institutional AI Assistant. I can assist with Mentorship matching, Jobs & Internships, AI Resume Review, Career Roadmaps, Giving campaigns, and Account Verification. How can I help you today?"

    return {
        "success": True,
        "data": {
            "reply": matched,
            "source": "python-fastapi-assistant"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
