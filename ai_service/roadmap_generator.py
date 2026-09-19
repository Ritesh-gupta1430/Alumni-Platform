"""
roadmap_generator.py - Skill Graph & Career Progression Generator for AlumNetra
Generates role-specific milestone roadmaps, skill gap analyses, and capstone project tracks.
"""

from typing import Dict, Any, List, Optional

CAREER_PATHS = {
    "full stack developer": {
        "title": "Full Stack Software Engineer",
        "description": "Build end-to-end scalable web applications, REST/GraphQL APIs, and responsive glassmorphic user interfaces.",
        "skills": ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Node.js", "Express.js", "MongoDB", "PostgreSQL", "Docker", "Git", "REST APIs", "Tailwind CSS", "Next.js"],
        "certifications": ["Meta Front-End Developer", "AWS Certified Cloud Practitioner", "MongoDB Certified Developer"],
        "capstoneProjects": [
            {"title": "Multi-tenant SaaS Workspace", "description": "Collaborative real-time board with WebSocket sync, role-based access, and Stripe payments."},
            {"title": "Institutional Networking Hub", "description": "Full-stack alumni engagement portal with AI recommendation matching and automated verification."}
        ],
        "phases": [
            {
                "phase": "1. Modern Web Core & Version Control",
                "duration": "4-6 weeks",
                "skills": ["HTML", "CSS", "JavaScript", "Git", "Tailwind CSS"],
                "focus": "DOM manipulation, ES6+ async/await, responsive styling systems, Git flow."
            },
            {
                "phase": "2. Modern Frontend Architecture",
                "duration": "6-8 weeks",
                "skills": ["React", "TypeScript", "Next.js"],
                "focus": "Component composition, custom hooks, state management, client vs server components."
            },
            {
                "phase": "3. Scalable Backend & Databases",
                "duration": "6-8 weeks",
                "skills": ["Node.js", "Express.js", "MongoDB", "PostgreSQL", "REST APIs"],
                "focus": "JWT authentication, ACID transactions, data aggregation pipelines, API rate limiting."
            },
            {
                "phase": "4. Containerization & Deployment",
                "duration": "4 weeks",
                "skills": ["Docker", "CI/CD", "Cloud Deployment"],
                "focus": "Multi-stage Docker builds, GitHub Actions CI pipelines, cloud hosting (AWS/Vercel/Render)."
            }
        ]
    },
    "ai engineer": {
        "title": "AI & Machine Learning Engineer",
        "description": "Architect intelligent predictive models, NLP transformers, computer vision pipelines, and production LLM workflows.",
        "skills": ["Python", "NumPy", "Pandas", "Scikit-learn", "TensorFlow", "PyTorch", "NLP", "FastAPI", "Docker", "SQL", "Transformers", "Vector Databases"],
        "certifications": ["DeepLearning.AI Machine Learning Specialization", "TensorFlow Developer Certificate", "AWS Certified Machine Learning - Specialty"],
        "capstoneProjects": [
            {"title": "Semantic Recommendation Microservice", "description": "TF-IDF & vector embedding matching pipeline served over FastAPI with sub-50ms latency."},
            {"title": "RAG Document Intelligence Bot", "description": "Retrieval-Augmented Generation agent indexing academic research papers with LangChain and FAISS."}
        ],
        "phases": [
            {
                "phase": "1. Numerical Computing & Statistical Foundations",
                "duration": "6 weeks",
                "skills": ["Python", "NumPy", "Pandas", "SQL", "Linear Algebra"],
                "focus": "Data wrangling, matrix operations, statistical hypothesis testing, feature engineering."
            },
            {
                "phase": "2. Classical Machine Learning & Scikit-learn",
                "duration": "6 weeks",
                "skills": ["Scikit-learn", "Classification", "Regression", "TF-IDF"],
                "focus": "Model evaluation metrics (ROC-AUC, F1), cross-validation, hyperparameter tuning."
            },
            {
                "phase": "3. Deep Learning & Transformer Architectures",
                "duration": "8 weeks",
                "skills": ["PyTorch", "TensorFlow", "NLP", "Transformers"],
                "focus": "Neural network optimization, backpropagation, attention mechanisms, HuggingFace integration."
            },
            {
                "phase": "4. MLOps & Production Model Serving",
                "duration": "4-6 weeks",
                "skills": ["FastAPI", "Docker", "Vector Databases", "MLflow"],
                "focus": "REST model serving, vector indexing, containerized inference, performance benchmarking."
            }
        ]
    },
    "cloud devops architect": {
        "title": "Cloud & DevOps Infrastructure Architect",
        "description": "Design resilient multi-region cloud infrastructures, automated CI/CD deployment pipelines, and observability stacks.",
        "skills": ["Linux", "Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Nginx", "Prometheus", "Grafana", "Bash", "Python"],
        "certifications": ["AWS Certified Solutions Architect", "Certified Kubernetes Administrator (CKA)", "HashiCorp Certified: Terraform Associate"],
        "capstoneProjects": [
            {"title": "GitOps Kubernetes Cluster", "description": "High-availability automated microservices cluster orchestrated with ArgoCD and Helm."},
            {"title": "Terraform Multi-Tier AWS Infrastructure", "description": "Infrastructure as Code provisioning VPC, ECS, RDS, and CloudFront with automated backup policies."}
        ],
        "phases": [
            {
                "phase": "1. Systems & Networking Fundamentals",
                "duration": "4 weeks",
                "skills": ["Linux", "Bash", "Networking", "Nginx"],
                "focus": "Shell scripting, POSIX permissions, reverse proxies, SSL/TLS certificates, DNS routing."
            },
            {
                "phase": "2. Containerization & Orchestration",
                "duration": "6 weeks",
                "skills": ["Docker", "Kubernetes", "Helm"],
                "focus": "Docker swarm/k8s pods, deployments, services, ingress controllers, config maps."
            },
            {
                "phase": "3. Infrastructure as Code & Cloud Platforms",
                "duration": "6 weeks",
                "skills": ["AWS", "Terraform", "CloudFormation"],
                "focus": "Declarative cloud architectures, state locks, serverless computing, autoscaling groups."
            },
            {
                "phase": "4. CI/CD & Production Observability",
                "duration": "4 weeks",
                "skills": ["CI/CD", "Prometheus", "Grafana", "ELK Stack"],
                "focus": "Continuous integration pipelines, automated canary releases, metrics monitoring, centralized logging."
            }
        ]
    },
    "data scientist": {
        "title": "Data Scientist & Analytics Lead",
        "description": "Transform unstructured enterprise data into predictive business intelligence, dashboards, and ML insights.",
        "skills": ["Python", "SQL", "Pandas", "NumPy", "Scikit-learn", "Tableau", "Power BI", "Statistics", "A/B Testing", "Matplotlib"],
        "certifications": ["Google Data Analytics Professional Certificate", "IBM Data Science Professional", "Microsoft Certified: Power BI Data Analyst"],
        "capstoneProjects": [
            {"title": "Institutional Placement Predictive Engine", "description": "Predictive analytics forecasting TCET student placement trends based on skill portfolios."},
            {"title": "Interactive Executive Analytics Dashboard", "description": "Real-time Power BI & Python dashboard monitoring donation campaign conversions and alumni engagement."}
        ],
        "phases": [
            {
                "phase": "1. Relational Databases & Advanced SQL",
                "duration": "4 weeks",
                "skills": ["SQL", "Relational Databases", "Data Modeling"],
                "focus": "Complex joins, window functions, query optimization, indexing strategies."
            },
            {
                "phase": "2. Python Data Engineering & Exploratory Analysis",
                "duration": "6 weeks",
                "skills": ["Python", "Pandas", "NumPy", "Matplotlib"],
                "focus": "Data cleaning, imputation, hypothesis testing, exploratory data visualization."
            },
            {
                "phase": "3. Predictive Modeling & Applied Statistics",
                "duration": "6 weeks",
                "skills": ["Scikit-learn", "Statistics", "A/B Testing"],
                "focus": "Regression analysis, cluster modeling, cohort analysis, experimentation."
            },
            {
                "phase": "4. Business Intelligence & Executive Storytelling",
                "duration": "4 weeks",
                "skills": ["Tableau", "Power BI", "Data Storytelling"],
                "focus": "Executive dashboards, automated ETL reports, actionable KPI tracking."
            }
        ]
    }
}


class CareerRoadmapGenerator:
    """Generates personalized milestone roadmaps based on user target role and current skills."""

    def generate(self, target_role: str, user_skills: List[str]) -> Dict[str, Any]:
        normalized_target = target_role.strip().lower()
        
        # Find matching roadmap key
        matched_key = "full stack developer"
        for key in CAREER_PATHS:
            if key in normalized_target or normalized_target in key:
                matched_key = key
                break

        path_data = CAREER_PATHS[matched_key]
        
        # User skills normalized
        my_skills_set = set(s.lower() for s in user_skills)

        required_skills = path_data["skills"]
        mastered_skills = [s for s in required_skills if s.lower() in my_skills_set]
        missing_skills = [s for s in required_skills if s.lower() not in my_skills_set]

        readiness_score = round((len(mastered_skills) / max(len(required_skills), 1)) * 100)
        readiness_score = min(max(readiness_score, 10), 100)

        # Build evaluated phases
        evaluated_phases = []
        for p in path_data["phases"]:
            phase_skills = p["skills"]
            phase_mastered = [s for s in phase_skills if s.lower() in my_skills_set]
            
            if len(phase_mastered) == len(phase_skills):
                status = "completed"
            elif len(phase_mastered) > 0:
                status = "in_progress"
            else:
                status = "pending"

            evaluated_phases.append({
                "phase": p["phase"],
                "duration": p["duration"],
                "focus": p["focus"],
                "skills": phase_skills,
                "masteredSkills": phase_mastered,
                "missingSkills": [s for s in phase_skills if s.lower() not in my_skills_set],
                "completionPct": round((len(phase_mastered) / max(len(phase_skills), 1)) * 100),
                "status": status
            })

        return {
            "targetRole": path_data["title"],
            "description": path_data["description"],
            "readinessScore": readiness_score,
            "readinessLabel": "Industry Ready" if readiness_score >= 80 else "Strong Foundation" if readiness_score >= 50 else "Early Explorer",
            "skillsSummary": {
                "totalRequired": len(required_skills),
                "masteredCount": len(mastered_skills),
                "missingCount": len(missing_skills),
                "mastered": mastered_skills,
                "missing": missing_skills
            },
            "phases": evaluated_phases,
            "capstoneProjects": path_data.get("capstoneProjects", []),
            "recommendedCertifications": path_data.get("certifications", []),
            "estimatedTimeToComplete": "3-6 months" if readiness_score < 60 else "1-2 months (Advanced Specialization)"
        }
