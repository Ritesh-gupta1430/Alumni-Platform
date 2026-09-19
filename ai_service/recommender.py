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

        # Extract candidate features for categorical matching
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
            mentor_dept = (mentor.get("department") or (mentor.get("user") or {}).get("department") or "").lower()
            years_exp = float(mentor.get("yearsOfExperience") or 0)

            # 1. Exact Skill Overlap (Jaccard-like)
            matched_skills = list(cand_skills.intersection(mentor_skills))
            skill_ratio = len(matched_skills) / max(len(cand_skills), 1) if cand_skills else 0.4

            # 2. Topic / Goal Overlap
            matched_topics = list(cand_goals.intersection(mentor_topics))
            topic_ratio = len(matched_topics) / max(len(cand_goals), 1) if cand_goals else 0.3

            # 3. Industry Match
            industry_match = 1.0 if (mentor_industry in cand_industries or any(ind in mentor_industry for ind in cand_industries)) else 0.0

            # 4. Department Affinity
            dept_match = 1.0 if (cand_dept and cand_dept == mentor_dept) else 0.0

            # 5. Experience Seniority Bonus (capped at 10+ years)
            exp_bonus = min(years_exp / 10.0, 1.0)

            # Combined weighted score (0 to 100)
            # Weights: Vector Sim (35%), Skill Ratio (25%), Industry (15%), Topic (15%), Dept (5%), Exp (5%)
            final_score = (
                (sim_score * 0.35) +
                (skill_ratio * 0.25) +
                (industry_match * 0.15) +
                (topic_ratio * 0.15) +
                (dept_match * 0.05) +
                (exp_bonus * 0.05)
            ) * 100

            final_score = min(max(round(final_score), 10), 99)

            match_reasons = []
            if len(matched_skills) > 0:
                match_reasons.append(f"{len(matched_skills)} shared skills ({', '.join(matched_skills[:3])})")
            if industry_match > 0:
                match_reasons.append(f"Industry alignment in {mentor.get('industry')}")
            if dept_match > 0:
                match_reasons.append(f"Fellow {mentor_dept.upper()} alumnus")
            if years_exp >= 3:
                match_reasons.append(f"{int(years_exp)}+ years industry experience")
            if sim_score > 0.3:
                match_reasons.append("High contextual profile synergy")

            if not match_reasons:
                match_reasons.append("General mentorship domain match")

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
