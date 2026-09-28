/**
 * Database Entity Types for MOS Master Platform
 * Corresponding to PostgreSQL / MongoDB Schema
 */

export type UserRole = 'student' | 'teacher' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'inactive';
export type StudentTag = 'excellent' | 'good' | 'needs-attention' | 'at-risk';
export type MOSSubject = 'word' | 'excel' | 'powerpoint' | 'mixed';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple-choice' | 'scenario-task' | 'ribbon-locate' | 'shortcut-drill';
export type ExamSessionStatus = 'in_progress' | 'submitted' | 'auto_submitted_timeout' | 'terminated_cheating';
export type SubmissionType = 'mock-exam' | 'practical' | 'theory-quiz' | 'file-grader';
export type TeacherRating = 'excellent' | 'good' | 'needs-improvement';

export interface DbUserProfile {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  student_code?: string;
  classroom?: string;
  target_subject: MOSSubject;
  assigned_teacher_id?: string;
  student_tag: StudentTag;
  streak_days: number;
  status: UserStatus;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

export interface DbKnowledgeDomain {
  id: string;
  subject: MOSSubject;
  domain_number: number;
  title: string;
  description?: string;
  weight_percentage: number;
  created_at: string;
}

export interface DbQuestionOption {
  id: string;
  text: string;
}

export interface DbQuestion {
  id: string;
  subject: MOSSubject;
  domain_id: string;
  title: string;
  scenario?: string;
  difficulty: QuestionDifficulty;
  type: QuestionType;
  points: number;
  options: DbQuestionOption[];
  // Shielded
  correct_answer: string;
  official_ribbon_path: string;
  explanation: string;
  shortcut_tip?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Client-Safe Question Projection (DevTools proof)
export type SafeClientQuestion = Omit<DbQuestion, 'correct_answer' | 'official_ribbon_path' | 'explanation' | 'shortcut_tip'>;

export interface DbExamSession {
  id: string;
  session_token: string;
  exam_config_id?: string;
  student_id: string;
  subject: MOSSubject;
  started_at: string;
  expires_at: string;
  submitted_at?: string;
  status: ExamSessionStatus;
  assigned_question_ids: string[];
  violations_count: number;
  anti_cheat_logs: string[];
  draft_answers: Record<string, string>;
  last_saved_at: string;
}

export interface DbDomainScore {
  total: number;
  correct: number;
}

export interface DbWrongQuestion {
  title: string;
  domainName: string;
  userAnswerText: string;
  correctAnswerText: string;
  officialRibbonPath: string;
  explanation: string;
}

export interface DbExamResult {
  id: string;
  session_id?: string;
  student_id: string;
  assigned_teacher_id?: string;
  subject: MOSSubject;
  submission_type: SubmissionType;
  score: number;
  passed: boolean;
  time_spent_seconds: number;
  total_questions: number;
  correct_count: number;
  domain_scores: Record<string, DbDomainScore>;
  wrong_questions: DbWrongQuestion[];
  teacher_feedback?: string;
  teacher_feedback_at?: string;
  teacher_rating?: TeacherRating;
  final_violations_count: number;
  anti_cheat_logs: string[];
  submitted_at: string;
}

export interface DbStudentQuestionAttempt {
  id: string;
  student_id: string;
  question_id: string;
  exam_result_id?: string;
  selected_answer?: string;
  is_correct: boolean;
  attempted_at: string;
}
