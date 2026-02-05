
import { UserProfile, SystemScores } from "./types";

export const calculateScores = (profile: UserProfile): SystemScores => {
  const metrics = profile.detected_metrics || {
    skills: [],
    projects: [],
    internships: [],
    certifications: [],
    interests: []
  };

  // Logic: 0-100 for each sub-category
  const skills_score = Math.min(metrics.skills.length * 15, 100);
  const projects_score = Math.min(metrics.projects.length * 25, 100);
  const internships_score = Math.min(metrics.internships.length * 50, 100);
  const certifications_score = Math.min(metrics.certifications.length * 35, 100);
  
  // profile_quality (0.1 weight)
  let profile_quality = 0;
  if (profile.education) profile_quality += 40;
  if (metrics.interests.length > 0) profile_quality += 30;
  if (metrics.skills.length > 2) profile_quality += 30;

  // Formula: (skills * 0.3) + (projects * 0.25) + (internships * 0.2) + (certifications * 0.15) + (profile_quality * 0.1)
  const overall_score = Math.round(
    (skills_score * 0.3) +
    (projects_score * 0.25) +
    (internships_score * 0.2) +
    (certifications_score * 0.15) +
    (profile_quality * 0.1)
  );

  return {
    skills_score,
    projects_score,
    internships_score,
    certifications_score,
    overall_score
  };
};
