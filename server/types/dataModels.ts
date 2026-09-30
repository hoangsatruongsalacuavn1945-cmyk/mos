/**
 * MongoDB Schema Specifications & Native Collections for MOS Master Platform
 * 
 * Target Database: MongoDB 6.0+
 * Focus:
 * 1. user_profiles
 * 2. questions (Sensitive fields shielded at collection projection level)
 * 3. exam_sessions (Authoritative Server-side timer & anti-cheat audit)
 * 4. student_question_attempts (Granular per-question log)
 * 5. exam_results (Authoritative MOS Certiport grades & teacher feedback)
 */

export interface MongoObjectId {
  $oid: string;
}

// ============================================================================
// 1. COLLECTION: user_profiles
// ============================================================================
export interface MongoUserProfile {
  _id: string;
  authUserId: string; // Firebase Auth / OAuth UID
  email: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
  studentCode?: string;
  classRoom?: string;
  targetSubject: 'word' | 'excel' | 'powerpoint' | 'mixed';
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  studentTag: 'excellent' | 'good' | 'needs-attention' | 'at-risk';
  streakDays: number;
  status: 'active' | 'suspended' | 'inactive';
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Collection JSON Schema Validation
export const UserProfileMongoValidation = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['authUserId', 'email', 'fullName', 'role', 'status'],
    properties: {
      authUserId: { bsonType: 'string', description: 'Unique auth ID is required' },
      email: { bsonType: 'string', pattern: '^.+@.+$', description: 'Valid email required' },
      fullName: { bsonType: 'string', minLength: 2 },
      role: { enum: ['student', 'teacher', 'admin'] },
      studentCode: { bsonType: 'string' },
      classRoom: { bsonType: 'string' },
      targetSubject: { enum: ['word', 'excel', 'powerpoint', 'mixed'] },
      studentTag: { enum: ['excellent', 'good', 'needs-attention', 'at-risk'] },
      streakDays: { bsonType: 'int', minimum: 0 },
      status: { enum: ['active', 'suspended', 'inactive'] },
    },
  },
};

// ============================================================================
// 2. COLLECTION: questions (Authoritative Question Bank)
// ============================================================================
export interface MongoQuestionOption {
  id: string; // 'a' | 'b' | 'c' | 'd'
  text: string;
}

export interface MongoQuestion {
  _id: string; // 'excel-th-001'
  subject: 'word' | 'excel' | 'powerpoint';
  domainId: string;
  domainName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple-choice' | 'scenario-task' | 'ribbon-locate' | 'shortcut-drill';
  points: number;
  title: string;
  scenario?: string;
  options: MongoQuestionOption[];
  
  // SENSITIVE SECURITY FIELDS (Shielded from student API projection):
  correctAnswer: string;
  officialRibbonPath: string;
  explanation: string;
  shortcutTip?: string;
  
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Projection filter for student queries: NEVER include sensitive fields!
export const STUDENT_QUESTION_PROJECTION = {
  correctAnswer: 0,
  officialRibbonPath: 0,
  explanation: 0,
  shortcutTip: 0,
};

export const QuestionMongoValidation = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['subject', 'domainId', 'title', 'options', 'correctAnswer', 'officialRibbonPath'],
    properties: {
      subject: { enum: ['word', 'excel', 'powerpoint'] },
      domainId: { bsonType: 'string' },
      title: { bsonType: 'string' },
      difficulty: { enum: ['easy', 'medium', 'hard'] },
      options: {
        bsonType: 'array',
        minItems: 2,
        items: {
          bsonType: 'object',
          required: ['id', 'text'],
          properties: {
            id: { bsonType: 'string' },
            text: { bsonType: 'string' },
          },
        },
      },
      correctAnswer: { bsonType: 'string' },
      officialRibbonPath: { bsonType: 'string' },
      explanation: { bsonType: 'string' },
      isActive: { bsonType: 'bool' },
    },
  },
};

// ============================================================================
// 3. COLLECTION: exam_sessions (Active Runtime with Anti-Cheat Logs)
// ============================================================================
export interface MongoExamSession {
  _id: string;
  sessionToken: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classRoom: string;
  subject: 'word' | 'excel' | 'powerpoint' | 'mixed';
  durationSeconds: number;
  startedAt: Date;
  expiresAt: Date; // Authoritative expiration timer
  submittedAt?: Date;
  status: 'in_progress' | 'submitted' | 'auto_submitted_timeout' | 'terminated_cheating';
  assignedQuestionCodes: string[];
  violationsCount: number;
  antiCheatLogs: string[];
  draftAnswers: Record<string, string>; // questionCode -> selectedOptionId
  lastSavedAt: Date;
}

// ============================================================================
// 4. COLLECTION: exam_results (Authoritative MOS Grades & Certiport Results)
// ============================================================================
export interface MongoDomainScore {
  total: number;
  correct: number;
}

export interface MongoWrongQuestionDetail {
  title: string;
  domainName: string;
  userAnswerText: string;
  correctAnswerText: string;
  officialRibbonPath: string;
  explanation: string;
}

export interface MongoExamResult {
  _id: string;
  sessionId?: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classRoom: string;
  teacherId?: string;
  teacherName?: string;
  subject: 'word' | 'excel' | 'powerpoint' | 'mixed';
  submissionType: 'mock-exam' | 'practical' | 'theory-quiz' | 'file-grader';
  score: number; // 0 - 1000
  passed: boolean; // score >= 700
  timeSpentSeconds: number;
  totalQuestions: number;
  correctCount: number;
  domainScores: Record<string, MongoDomainScore>;
  wrongQuestions: MongoWrongQuestionDetail[];
  teacherFeedback?: string;
  teacherFeedbackAt?: Date;
  teacherRating?: 'excellent' | 'good' | 'needs-improvement';
  violationsCount: number;
  antiCheatLogs: string[];
  submittedAt: Date;
}

// ============================================================================
// 5. COLLECTION: student_question_attempts (Granular Per-Question Log)
// ============================================================================
export interface MongoStudentQuestionAttempt {
  _id: string;
  studentId: string;
  questionCode: string;
  examResultId?: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds?: number;
  attemptedAt: Date;
}

// MongoDB Recommended Indexes Array
export const MONGO_COLLECTION_INDEXES = {
  user_profiles: [
    { key: { authUserId: 1 }, unique: true },
    { key: { email: 1 }, unique: true },
    { key: { studentCode: 1 }, unique: true, sparse: true },
    { key: { role: 1, classRoom: 1 } },
  ],
  questions: [
    { key: { subject: 1, domainId: 1, isActive: 1 } },
    { key: { difficulty: 1 } },
  ],
  exam_sessions: [
    { key: { sessionToken: 1 }, unique: true },
    { key: { studentId: 1, status: 1 } },
    { key: { expiresAt: 1 } },
  ],
  exam_results: [
    { key: { studentId: 1, submittedAt: -1 } },
    { key: { teacherId: 1, subject: 1, submittedAt: -1 } },
    { key: { score: -1, timeSpentSeconds: 1 } }, // Leaderboard index
  ],
  student_question_attempts: [
    { key: { studentId: 1, questionCode: 1 } },
    { key: { questionCode: 1, isCorrect: 1 } },
  ],
};
