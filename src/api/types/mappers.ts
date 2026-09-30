/**
 * Bidirectional Data Mappers & Resolvers
 * Bridges PostgreSQL/MongoDB snake_case schema models with Frontend camelCase domain entities.
 */

import { DbUserProfile, DbExamResult } from '../../types/db_schema';
import { IUser, Submission, UserRole } from '../../types/user';
import { ApiUser } from './auth';
import { SubmissionItemDto } from './exam';

/**
 * Transforms database record (snake_case) into standardized ApiUser (camelCase)
 */
export function mapDbUserToApiUser(dbUser: Partial<DbUserProfile> & Record<string, any>): ApiUser {
  const fullName = dbUser.full_name || dbUser.fullName || dbUser.name || 'Người dùng';
  const role = (dbUser.role as UserRole) || 'student';
  
  return {
    id: dbUser.id || dbUser._id || dbUser.auth_user_id || '',
    email: (dbUser.email || '').toLowerCase().trim(),
    name: fullName,
    fullName: fullName,
    role: role,
    studentCode: dbUser.student_code || dbUser.studentCode || null,
    classRoom: dbUser.classroom || dbUser.classRoom || null,
    targetSubject: dbUser.target_subject || dbUser.targetSubject || 'all',
    teachingSubjects: dbUser.teaching_subjects || dbUser.teachingSubjects || [],
    assignedTeacherId: dbUser.assigned_teacher_id || dbUser.assignedTeacherId || null,
    assignedTeacherName: dbUser.assigned_teacher_name || dbUser.assignedTeacherName || null,
    assignedTeacherEmail: dbUser.assigned_teacher_email || dbUser.assignedTeacherEmail || null,
    status: (dbUser.status as 'active' | 'suspended' | 'inactive') || 'active',
    streakDays: typeof dbUser.streak_days === 'number' ? dbUser.streak_days : (dbUser.streakDays || 1),
    createdAt: dbUser.created_at || dbUser.createdAt || new Date().toISOString(),
    updatedAt: dbUser.updated_at || dbUser.updatedAt,
  };
}

/**
 * Transforms ApiUser into Frontend IUser representation
 */
export function mapApiUserToFrontendUser(apiUser: ApiUser, token?: string): IUser {
  if (token && typeof window !== 'undefined') {
    localStorage.setItem('mos_auth_token_jwt', token);
  }
  return {
    id: apiUser.id,
    name: apiUser.fullName || apiUser.name,
    fullName: apiUser.fullName,
    email: apiUser.email,
    role: apiUser.role,
    studentCode: apiUser.studentCode || undefined,
    classRoom: apiUser.classRoom || undefined,
    targetSubject: (apiUser.targetSubject as any) || 'all',
    assignedTeacherId: apiUser.assignedTeacherId || undefined,
    assignedTeacherName: apiUser.assignedTeacherName || undefined,
    assignedTeacherEmail: apiUser.assignedTeacherEmail || undefined,
    createdAt: apiUser.createdAt,
  };
}

/**
 * Transforms Frontend User state to Database Payload (snake_case)
 */
export function mapFrontendUserToDbUser(user: Partial<IUser>): Partial<DbUserProfile> {
  const payload: Record<string, any> = {
    full_name: user.fullName || user.name,
    email: user.email?.toLowerCase().trim(),
    role: user.role,
    student_code: user.studentCode || null,
    classroom: user.classRoom || null,
    target_subject: user.targetSubject || 'mixed',
    assigned_teacher_id: user.assignedTeacherId || null,
  };

  if (user.id) {
    payload.id = user.id;
  }

  return payload as Partial<DbUserProfile>;
}

/**
 * Transforms Database Exam Result into Frontend Submission entity
 */
export function mapDbExamResultToSubmission(
  dbResult: Partial<DbExamResult> & Record<string, any>,
  extra?: {
    studentName?: string;
    studentCode?: string;
    classRoom?: string;
    teacherName?: string;
  }
): Submission {
  const submissionType = dbResult.submission_type || dbResult.type || 'mock-exam';
  const score = typeof dbResult.score === 'number' ? Math.max(0, Math.min(1000, dbResult.score)) : 0;
  const passed = typeof dbResult.passed === 'boolean' ? dbResult.passed : score >= 700;

  return {
    id: dbResult.id || 'sub-' + Date.now(),
    studentId: dbResult.student_id || dbResult.studentId || '',
    studentName: extra?.studentName || dbResult.student_name || dbResult.studentName || 'Học viên',
    studentCode: extra?.studentCode || dbResult.student_code || dbResult.studentCode || '',
    classRoom: extra?.classRoom || dbResult.classroom || dbResult.classRoom || '',
    subject: dbResult.subject || 'word',
    type: (submissionType === 'file-grader' ? 'practical' : submissionType) as 'mock-exam' | 'practical' | 'theory-quiz',
    score: score,
    passed: passed,
    timeSpentSeconds: dbResult.time_spent_seconds ?? dbResult.timeSpentSeconds ?? 0,
    totalQuestions: dbResult.total_questions ?? dbResult.totalQuestions ?? 0,
    correctCount: dbResult.correct_count ?? dbResult.correctCount ?? 0,
    teacherId: dbResult.assigned_teacher_id || dbResult.teacherId || '',
    teacherName: extra?.teacherName || dbResult.teacher_name || dbResult.teacherName || 'Chưa phân công',
    teacherFeedback: dbResult.teacher_feedback || dbResult.teacherFeedback,
    teacherFeedbackAt: dbResult.teacher_feedback_at || dbResult.teacherFeedbackAt,
    teacherRating: dbResult.teacher_rating || dbResult.teacherRating,
    submittedAt: dbResult.submitted_at || dbResult.submittedAt || new Date().toISOString(),
    domainScores: dbResult.domain_scores || dbResult.domainScores,
    wrongQuestions: dbResult.wrong_questions || dbResult.wrongQuestions,
    violationsCount: dbResult.final_violations_count ?? dbResult.violations_count ?? dbResult.violationsCount ?? 0,
    antiCheatLogs: dbResult.anti_cheat_logs || dbResult.antiCheatLogs || [],
    status: dbResult.teacher_feedback ? 'reviewed' : 'pending',
  };
}

/**
 * Transforms Submission into Database Schema Payload
 */
export function mapSubmissionToDbExamResult(submission: Partial<Submission>): Partial<DbExamResult> {
  return {
    id: submission.id,
    student_id: submission.studentId,
    assigned_teacher_id: submission.teacherId,
    subject: submission.subject as any,
    submission_type: submission.type as any,
    score: submission.score,
    passed: submission.passed,
    time_spent_seconds: submission.timeSpentSeconds,
    total_questions: submission.totalQuestions,
    correct_count: submission.correctCount,
    domain_scores: submission.domainScores as any,
    wrong_questions: submission.wrongQuestions as any,
    teacher_feedback: submission.teacherFeedback,
    teacher_feedback_at: submission.teacherFeedbackAt,
    teacher_rating: submission.teacherRating as any,
    final_violations_count: submission.violationsCount || 0,
    anti_cheat_logs: submission.antiCheatLogs || [],
    submitted_at: submission.submittedAt || new Date().toISOString(),
  };
}

/**
 * Maps API Submission item to Frontend Submission
 */
export function mapSubmissionDtoToSubmission(dto: SubmissionItemDto): Submission {
  const mappedSubject: 'word' | 'excel' | 'powerpoint' | 'mixed' =
    dto.subject === 'all' ? 'mixed' : (dto.subject as 'word' | 'excel' | 'powerpoint' | 'mixed');

  return {
    id: dto.id,
    studentId: dto.studentId,
    studentName: dto.studentName,
    studentCode: dto.studentCode,
    classRoom: dto.classRoom,
    subject: mappedSubject,
    type: dto.type === 'file-grader' ? 'practical' : dto.type,
    score: dto.score,
    passed: dto.passed,
    timeSpentSeconds: dto.timeSpentSeconds,
    totalQuestions: dto.totalQuestions,
    correctCount: dto.correctCount,
    teacherId: dto.teacherId || '',
    teacherName: dto.teacherName || 'Chưa phân công',
    teacherFeedback: dto.teacherFeedback,
    teacherFeedbackAt: dto.teacherFeedbackAt,
    teacherRating: dto.teacherRating,
    submittedAt: dto.submittedAt,
    violationsCount: dto.violationsCount,
    status: dto.status,
  };
}
