"""
resume_analyzer.py - Intelligent Resume Parsing & ATS Scoring Engine for AlumNetra
Performs structural, lexical, and impact analysis on student and alumni resumes.
"""

import re
from typing import Dict, Any, List

# Core industry technology taxonomy
TECH_TAXONOMY = {
    "frontend": ["react", "vue", "angular", "next.js", "tailwind", "css", "html", "javascript", "typescript", "redux", "sass", "bootstrap", "figma"],
    "backend": ["node.js", "express", "django", "fastapi", "flask", "spring boot", "java", "python", "golang", "c++", "c#", ".net", "graphql", "rest"],
    "database": ["mongodb", "postgresql", "mysql", "redis", "firebase", "sqlite", "cassandra", "dynamodb", "elasticsearch"],
    "devops_cloud": ["docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "github actions", "terraform", "linux", "nginx", "jenkins"],
    "data_ai": ["pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "opencv", "nlp", "llm", "tableau", "power bi", "sql"]
}

ACTION_VERBS = [
    "built", "developed", "architected", "engineered", "implemented", "designed",
    "deployed", "optimized", "scaled", "spearheaded", "accelerated", "automated",
    "collaborated", "orchestrated", "refactored", "integrated", "led", "enhanced",
    "created", "achieved", "delivered", "mentored", "maintained"
]


class ResumeAnalyzer:
    """Analyzes resume text against institutional hiring standards and modern ATS criteria."""

    def analyze(self, resume_text: str) -> Dict[str, Any]:
        if not resume_text or len(resume_text.strip()) < 30:
            return {
                "score": 0,
                "grade": "D",
                "wordCount": len(resume_text.split()) if resume_text else 0,
                "sectionsFound": {},
                "detectedSkills": [],
                "actionVerbDensity": 0,
                "quantifiableImpactCount": 0,
                "strengths": [],
                "suggestions": ["Resume content is too short or empty. Please paste your complete resume text."],
                "atsChecklist": []
            }

        text = resume_text.strip()
        lower_text = text.lower()
        words = text.split()
        word_count = len(words)

        # 1. Structural Section Detection
        sections = {
            "contact_info": bool(re.search(r"(@|phone|\+91|\bemail\b|linkedin\.com|github\.com)", lower_text)),
            "education": bool(re.search(r"(education|b\.?tech|bachelor|degree|university|college|cgpa|gpa|tcet)", lower_text)),
            "experience": bool(re.search(r"(experience|internship|work history|employment|developer at|engineer at)", lower_text)),
            "skills": bool(re.search(r"(skills|technical skills|technologies|tools|competencies)", lower_text)),
            "projects": bool(re.search(r"(projects|academic projects|personal projects|key projects)", lower_text)),
            "certifications_achievements": bool(re.search(r"(certifications?|awards?|achievements?|hackathon|publications?|honors?)", lower_text)),
            "portfolio_links": bool(re.search(r"(github\.com/[a-zA-Z0-9_\-]+|linkedin\.com/in/[a-zA-Z0-9_\-]+|https?://[a-zA-Z0-9.\-_/]+)", lower_text))
        }

        # 2. Extracted Tech Stack
        detected_skills = []
        for category, skill_list in TECH_TAXONOMY.items():
            for skill in skill_list:
                # Word boundary search for accurate matching
                pattern = r"(?i)\b" + re.escape(skill) + r"\b"
                if re.search(pattern, text):
                    detected_skills.append({"name": skill.title(), "category": category})

        # 3. Action Verbs & Leadership Density
        detected_verbs = []
        for verb in ACTION_VERBS:
            pattern = r"(?i)\b" + re.escape(verb) + r"\b"
            matches = len(re.findall(pattern, text))
            if matches > 0:
                detected_verbs.append({"verb": verb, "count": matches})

        total_verb_occurrences = sum(v["count"] for v in detected_verbs)

        # 4. Quantifiable Impact & Metrics (Numbers, percentages, latency, users)
        metric_matches = re.findall(r"(\b\d+%\b|\b\d+\+?\s*(?:users|clients|ms|seconds|minutes|k|m|x|stars|downloads|requests)\b|\b(?:reduced|improved|increased|boosted|saved)\s+by\s+\d+%)", text, re.IGNORECASE)
        quant_count = len(metric_matches)

        # 5. ATS Scoring Algorithm (Weighted)
        # - Sections completeness: 35%
        # - Skills breadth: 25%
        # - Quantifiable impact: 20%
        # - Action verbs density: 10%
        # - Length / Word count health: 10%

        present_sections_count = sum(1 for v in sections.values() if v)
        section_score = (present_sections_count / len(sections)) * 35

        skill_score = min((len(detected_skills) / 10.0) * 25, 25)
        quant_score = min((quant_count / 3.0) * 20, 20)
        verb_score = min((total_verb_occurrences / 5.0) * 10, 10)

        # Word count health (ideal: 200 - 800 words for single-page ATS)
        if 200 <= word_count <= 800:
            len_score = 10
        elif 100 <= word_count < 200 or 800 < word_count <= 1200:
            len_score = 6
        else:
            len_score = 3

        raw_score = round(section_score + skill_score + quant_score + verb_score + len_score)
        final_score = min(max(raw_score, 15), 98)

        # Letter Grade
        if final_score >= 88:
            grade = "A+"
        elif final_score >= 78:
            grade = "A"
        elif final_score >= 65:
            grade = "B"
        elif final_score >= 50:
            grade = "C"
        else:
            grade = "D"

        # 6. Strengths & Actionable Recommendations
        strengths = []
        suggestions = []
        ats_checklist = []

        # Structural checklist
        ats_checklist.append({"item": "Contact & Links", "status": "pass" if sections["contact_info"] and sections["portfolio_links"] else "warn", "note": "Email, Phone, GitHub & LinkedIn presence"})
        ats_checklist.append({"item": "Experience / Internships", "status": "pass" if sections["experience"] else "fail", "note": "Work history or internship entries"})
        ats_checklist.append({"item": "Technical Projects", "status": "pass" if sections["projects"] else "fail", "note": "Clear project titles with stack tags"})
        ats_checklist.append({"item": "Skills Taxonomy", "status": "pass" if len(detected_skills) >= 6 else "warn", "note": f"{len(detected_skills)} technical skills detected"})
        ats_checklist.append({"item": "Impact Metrics", "status": "pass" if quant_count >= 2 else "warn", "note": f"{quant_count} measurable outcomes detected"})

        if sections["projects"]:
            strengths.append("Dedicated Projects section with contextual implementations.")
        if len(detected_skills) >= 6:
            strengths.append(f"Strong tech stack coverage across {len(set(s['category'] for s in detected_skills))} domain categories.")
        if quant_count >= 2:
            strengths.append(f"Quantifiable results present ({quant_count} metric-driven impact statements).")
        if total_verb_occurrences >= 4:
            strengths.append(f"Dynamic action-oriented language ({total_verb_occurrences} active verbs).")

        if not sections["portfolio_links"]:
            suggestions.append("Add direct hyperlinks to your active GitHub and verified LinkedIn profiles.")
        if quant_count < 2:
            suggestions.append("Quantify your project outcomes using metrics (e.g., 'Optimized query latency by 45%', 'Scaled to 500+ active users').")
        if not sections["certifications_achievements"]:
            suggestions.append("Add an Achievements or Certifications section highlighting hackathons, academic honors, or cloud credentials.")
        if total_verb_occurrences < 4:
            suggestions.append("Begin each bullet point with strong action verbs (e.g., 'Architected', 'Implemented', 'Automated').")
        if word_count < 200:
            suggestions.append("Your resume appears too brief. Elaborate on project architectures, responsibilities, and technical tooling.")

        return {
            "score": final_score,
            "grade": grade,
            "wordCount": word_count,
            "sectionsFound": sections,
            "detectedSkills": detected_skills,
            "actionVerbsFound": detected_verbs,
            "quantifiableImpactCount": quant_count,
            "metricSnippets": metric_matches[:5],
            "strengths": strengths,
            "suggestions": suggestions,
            "atsChecklist": ats_checklist,
            "breakdown": {
                "sections": f"{round(section_score)}/35 pts",
                "technicalSkills": f"{round(skill_score)}/25 pts",
                "quantifiableImpact": f"{round(quant_score)}/20 pts",
                "actionVerbs": f"{round(verb_score)}/10 pts",
                "lengthReadability": f"{round(len_score)}/10 pts"
            }
        }
