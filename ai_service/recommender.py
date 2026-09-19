"""
recommender.py - Machine Learning Vector Matching Engine for AlumNetra
Uses Scikit-learn TF-IDF Vectorizer and Cosine Similarity for intelligent recommendations.
"""

from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class TFIDFRecommender:
    """
    Core ML recommender computing semantic similarity across heterogeneous user profiles,
    mentorship requests, and institutional job boards.
    """

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            lowercase=True,
            token_pattern=r"(?u)\b\w+\b"
        )

    def _build_profile_document(self, profile: Dict[str, Any]) -> str:
        """Constructs an enriched textual representation of a user profile."""
        parts = []
        
        # Skills
        skills = profile.get("skills", [])
        if isinstance(skills, list):
            skill_names = [s.get("name", s) if isinstance(s, dict) else str(s) for s in skills]
            parts.append(" ".join(skill_names * 3))  # Boost skill weight
            
        # Topics & Career Goals
        topics = profile.get("mentorshipTopics", []) or profile.get("careerGoals", [])
        if isinstance(topics, list):
            parts.append(" ".join(topics * 2))
            
        # Industry & Headline
        if profile.get("industry"):
            parts.append(profile["industry"] * 2)
        if profile.get("headline"):
            parts.append(profile["headline"])
        if profile.get("bio") or profile.get("about"):
            parts.append(profile.get("bio") or profile.get("about", ""))
        if profile.get("department"):
            parts.append(f"Department of {profile['department']}")
            
        return " ".join(parts).strip() or "general technology"

    def match_mentors(
        self,
        candidate_profile: Dict[str, Any],
        mentor_profiles: List[Dict[str, Any]],
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Ranks mentor profiles against candidate profile using TF-IDF Cosine Similarity
        and multi-attribute contextual weighting.
        """
        if not mentor_profiles:
            return []

        # Build candidate document
        candidate_doc = self._build_profile_document(candidate_profile)
        
        # Build mentor documents
        mentor_docs = [self._build_profile_document(m) for m in mentor_profiles]
        
        # Corpus for TF-IDF
        corpus = [candidate_doc] + mentor_docs
        
        try:
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            # Candidate vector is at index 0, mentors are indices 1..n
            candidate_vec = tfidf_matrix[0:1]
            mentor_vecs = tfidf_matrix[1:]
            
            # Compute cosine similarities (0.0 to 1.0)
            cosine_sims = cosine_similarity(candidate_vec, mentor_vecs)[0]
        except Exception:
            # Fallback if vocabulary is completely empty
            cosine_sims = np.zeros(len(mentor_profiles))

        # Extract candidate features
        cand_skills = set(
            s.get("name", s).lower() if isinstance(s, dict) else str(s).lower()
            for s in candidate_profile.get("skills", [])
        )
        cand_industries = set(
            i.lower() for i in candidate_profile.get("targetIndustries", [])
        )
        cand_dept = (candidate_profile.get("department") or "").lower()
        cand_goals = set(
            g.lower() for g in candidate_profile.get("careerGoals", [])
        )

        ranked_results = []
        for idx, mentor in enumerate(mentor_profiles):
            sim_score = float(cosine_sims[idx]) if idx < len(cosine_sims) else 0.0
            
            mentor_skills = set(
                s.get("name", s).lower() if isinstance(s, dict) else str(s).lower()
                for s in mentor.get("skills", [])
            )
            mentor_topics = set(
                t.lower() for t in mentor.get("mentorshipTopics", [])
            )
            mentor_industry = (mentor.get("industry") or "").lower()
            mentor_user = mentor.get("user") if isinstance(mentor.get("user"), dict) else {}
            mentor_dept = (mentor.get("department") or mentor_user.get("department") or "").lower()
            years_exp = float(mentor.get("yearsOfExperience") or 0)
            org = mentor.get("currentOrganization") or mentor_user.get("currentCompany") or ""
            role_title = mentor.get("currentDesignation") or mentor_user.get("currentRole") or ""

            # 1. Skill Overlap Calculation
            matched_skills = [s for s in cand_skills if s in mentor_skills or any(ms in s or s in ms for ms in mentor_skills)]
            skill_ratio = len(matched_skills) / max(len(cand_skills), 1) if cand_skills else 0.45

            # 2. Topic / Goal Overlap
            matched_topics = [t for t in cand_goals if t in mentor_topics or any(mt in t or t in mt for mt in mentor_topics)]
            topic_ratio = len(matched_topics) / max(len(cand_goals), 1) if cand_goals else 0.40

            # 3. Industry & Department Alignment
            industry_match = 1.0 if (mentor_industry in cand_industries or any(ind in mentor_industry for ind in cand_industries)) else (0.8 if mentor_industry else 0.5)
            dept_match = 1.0 if (cand_dept and cand_dept == mentor_dept) else 0.35

            # 4. Experience & Seniority Factor (3-12 years)
            exp_factor = min(max(years_exp, 1.0) / 10.0, 1.0)

            # 5. Adaptive Realistic Scoring Formula (Institutional Multi-Factor)
            # Baseline compatibility within TCET ecosystem + Skill synergy + Contextual Vector + Experience
            # Resulting distribution gracefully ranges from 45% to 96%
            base_score = 42.0
            skill_component = skill_ratio * 34.0
            vector_component = min(sim_score * 1.5, 1.0) * 12.0
            dept_component = (1.0 if (cand_dept and cand_dept == mentor_dept) else 0.0) * 5.0
            exp_component = exp_factor * 6.0
            org_bonus = 2.0 if org and any(tier in org.lower() for tier in ['microsoft', 'google', 'amazon', 'meta', 'apple', 'nvidia']) else 0.0

            final_score = base_score + skill_component + vector_component + dept_component + exp_component + org_bonus
            final_score = min(max(round(final_score), 42), 97)

            match_reasons = []
            if len(matched_skills) > 0:
                display_skills = [s.title() for s in matched_skills[:3]]
                match_reasons.append(f"{len(matched_skills)} shared skills ({', '.join(display_skills)})")
            if org:
                match_reasons.append(f"{role_title} @ {org}" if role_title else f"Works at {org}")
            if cand_dept and cand_dept == mentor_dept:
                match_reasons.append(f"Fellow {cand_dept.title()} alumnus")
            if years_exp >= 2:
                match_reasons.append(f"{int(years_exp)}+ years industry experience")
            if sim_score > 0.2:
                match_reasons.append("High contextual profile synergy")

            if not match_reasons:
                match_reasons.append("Verified TCET Alumni Mentor")

            result_item = dict(mentor)
            result_item["matchScore"] = final_score
            result_item["vectorSimilarity"] = round(sim_score, 3)
            result_item["matchReasons"] = match_reasons
            result_item["matchedSkills"] = matched_skills
            ranked_results.append(result_item)

        # Sort descending by match score
        ranked_results.sort(key=lambda x: x["matchScore"], reverse=True)
        return ranked_results[:top_k]

    def match_job(
        self,
        candidate_profile: Dict[str, Any],
        job: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates ATS fit score and skill matrix between candidate profile and a specific job posting.
        """
        cand_skills = set(
            s.get("name", s).lower() if isinstance(s, dict) else str(s).lower()
            for s in candidate_profile.get("skills", [])
        )
        cand_dept = (candidate_profile.get("department") or "").lower()

        required_skills = [s.lower() for s in job.get("requiredSkills", [])]
        preferred_skills = [s.lower() for s in job.get("preferredSkills", [])]
        eligible_depts = [d.lower() for d in job.get("eligibleDepartments", [])]

        matched_req = [s for s in required_skills if s in cand_skills]
        missing_req = [s for s in required_skills if s not in cand_skills]

        matched_pref = [s for s in preferred_skills if s in cand_skills]
        missing_pref = [s for s in preferred_skills if s not in cand_skills]

        # Vector similarity on text descriptions
        job_text = f"{job.get('title', '')} {job.get('description', '')} {' '.join(required_skills)} {' '.join(preferred_skills)}"
        cand_text = self._build_profile_document(candidate_profile)

        try:
            matrix = self.vectorizer.fit_transform([cand_text, job_text])
            sim = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
        except Exception:
            sim = 0.5

        req_score = (len(matched_req) / len(required_skills) * 60) if required_skills else 60
        pref_score = (len(matched_pref) / len(preferred_skills) * 20) if preferred_skills else 20
        dept_eligible = (cand_dept in eligible_depts or not eligible_depts)
        dept_score = 10 if dept_eligible else 0
        vector_bonus = min(sim * 10, 10)

        total_score = round(req_score + pref_score + dept_score + vector_bonus)
        total_score = min(max(total_score, 5), 98)

        if total_score >= 85:
            label = "Excellent Match"
        elif total_score >= 70:
            label = "Strong Match"
        elif total_score >= 50:
            label = "Moderate Match"
        else:
            label = "Growth Opportunity"

        suggestions = []
        if missing_req:
            suggestions.append(f"Prioritize acquiring required core skills: {', '.join(missing_req[:3])}")
        if missing_pref:
            suggestions.append(f"Stand out by adding preferred skills: {', '.join(missing_pref[:2])}")
        if not dept_eligible:
            suggestions.append("Verify role eligibility or request departmental cross-waiver.")

        return {
            "matchScore": total_score,
            "matchLabel": label,
            "vectorSimilarity": round(sim, 3),
            "required": {"matched": matched_req, "missing": missing_req},
            "preferred": {"matched": matched_pref, "missing": missing_pref},
            "breakdown": {
                "requiredSkills": f"{len(matched_req)}/{len(required_skills)} matched ({round(req_score)} pts)",
                "preferredSkills": f"{len(matched_pref)}/{len(preferred_skills)} matched ({round(pref_score)} pts)",
                "departmentEligibility": f"{dept_score} pts",
                "semanticAlignment": f"{round(vector_bonus)} pts"
            },
            "suggestions": suggestions
        }
