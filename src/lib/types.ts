export interface UserProfile {
  name: string;
  college: string;
  branch: string;
  year: string;
  semester: string;
}

export interface Subtopic {
  id: string;
  name: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Lesson {
  id: string;
  name: string;
  priority: 'high' | 'medium' | 'low';
  summary?: string;
  keyPoints?: string[];
  concepts?: string[];
  formulas?: string[];
}

export interface Unit {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface Subject {
  id: string;
  name: string;
  daysLeft: number;
  units: Unit[];
  youtubeLinks: string[];
  createdAt: string;
}

export interface FocusSession {
  lessonName: string;
  subjectName: string;
  duration: number; // minutes
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
