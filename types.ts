
export interface InputSource {
  type: 'text' | 'pdf' | 'docx' | 'image';
  label: string;
  filename?: string;
  content: string; // Extracted text
}

export interface UserProfile {
  name: string;
  education: string;
  input_sources: InputSource[];
  // Legacy fields kept for the deterministic scoring engine to work
  detected_metrics?: {
    skills: string[];
    projects: string[];
    internships: string[];
    certifications: string[];
    interests: string[];
  };
}

export interface SystemScores {
  skills_score: number;
  projects_score: number;
  internships_score: number;
  certifications_score: number;
  overall_score: number;
}

export interface ProjectRecommendation {
  title: string;
  description: string;
  skills_gained: string[];
}

export interface SkillRoadmapItem {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
}

export interface AIInsights {
  strengths: string[];
  weaknesses: string[];
  project_recommendations: ProjectRecommendation[];
  skill_roadmap: SkillRoadmapItem[];
  certifications: string[];
  internship_categories: string[];
  hackathon_categories: string[];
  career_explanation: string;
  future_simulation: {
    if_user_completes: string[];
    expected_score_range: string;
  };
}

export enum AppStep {
  PROFILE_INPUT = 'profile',
  DASHBOARD = 'dashboard',
  AI_COACH = 'coach',
  SIMULATOR = 'simulator'
}
