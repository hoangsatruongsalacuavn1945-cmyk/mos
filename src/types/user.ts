export type UserRole = 'student' | 'teacher';

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  subject: 'word' | 'excel' | 'powerpoint' | 'all';
  title: string;
  department: string;
  phone?: string;
  avatarBg?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentCode?: string;
  classRoom?: string;
  targetSubject: 'word' | 'excel' | 'powerpoint' | 'all';
  assignedTeacherId: string;
  assignedTeacherName: string;
  assignedTeacherEmail: string;
  createdAt: string;
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
