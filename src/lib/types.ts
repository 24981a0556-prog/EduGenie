export interface UserProfile {
  name: string;
  college: string;
  branch: string;
  year: string;
  semester: string;
}

export interface Lesson {
  id: string;
  name: string;
  priority: string;
  summary?: string;
  key_points?: string[];
  concepts?: string[];
  formulas?: string[];
  sort_order?: number;
  unit_id?: string;
}

export interface Unit {
  id: string;
  name: string;
  lessons: Lesson[];
  sort_order?: number;
  subject_id?: string;
}

export interface Subject {
  id: string;
  name: string;
  daysLeft: number;
  units: Unit[];
  youtubeLinks: string[];
  createdAt: string;
}

export interface Resource {
  id: string;
  subject_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

export interface FocusSessionType {
  unitName: string;
  subjectName: string;
  duration: number;
  startedAt?: string;
}

export interface PredictedQuestion {
  question: string;
  answer: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
