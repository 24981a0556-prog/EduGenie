import { UserProfile, Subject } from './types';

const PROFILE_KEY = 'edugenie_profile';
const SUBJECTS_KEY = 'edugenie_subjects';
const AUTH_KEY = 'edugenie_auth';

export const store = {
  getAuth: (): { email: string } | null => {
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  },
  setAuth: (auth: { email: string }) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  },
  clearAuth: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  getProfile: (): UserProfile | null => {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  },
  setProfile: (profile: UserProfile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },

  getSubjects: (): Subject[] => {
    const data = localStorage.getItem(SUBJECTS_KEY);
    return data ? JSON.parse(data) : [];
  },
  setSubjects: (subjects: Subject[]) => {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
  },
  addSubject: (subject: Subject) => {
    const subjects = store.getSubjects();
    subjects.push(subject);
    store.setSubjects(subjects);
  },
  deleteSubject: (id: string) => {
    const subjects = store.getSubjects().filter(s => s.id !== id);
    store.setSubjects(subjects);
  },
};
