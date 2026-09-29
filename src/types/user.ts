export type UserRole = 'guest' | 'student' | 'teacher' | 'admin';

export interface IUser {
  id?: string;
  name: string;
  fullName?: string;
  email: string;
  role: UserRole;
  token?: string; // JWT Token cho Teacher/Admin
  studentCode?: string;
  classRoom?: string;
  targetSubject?: 'word' | 'excel' | 'powerpoint' | 'all';
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  assignedTeacherEmail?: string;
  createdAt?: string;
}

export type UserProfile = IUser;

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  subject: 'word' | 'excel' | 'powerpoint' | 'all';
  title: string;
  department: string;
  phone?: string;
  avatarBg?: string;
  createdAt?: string;
  activeStudentsCount?: number;
}

export interface ExamWrongQuestionSummary {
  title: string;
  domainName: string;
  userAnswerText: string;
  correctAnswerText: string;
  officialRibbonPath: string;
  explanation: string;
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classRoom: string;
  subject: 'word' | 'excel' | 'powerpoint' | 'mixed';
  type: 'mock-exam' | 'practical' | 'theory-quiz';
  score: number; // 0 - 1000
  passed: boolean;
  timeSpentSeconds: number;
  totalQuestions: number;
  correctCount: number;
  teacherId: string;
  teacherName: string;
  teacherFeedback?: string;
  teacherFeedbackAt?: string;
  teacherRating?: 'excellent' | 'good' | 'needs-improvement';
  submittedAt: string;
  domainScores?: Record<string, { total: number; correct: number }>;
  wrongQuestions?: ExamWrongQuestionSummary[];
  violationsCount?: number;
  antiCheatLogs?: string[];
  status: 'pending' | 'reviewed';
}
