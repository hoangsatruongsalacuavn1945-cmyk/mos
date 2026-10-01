/**
 * Server-side Study & Activity Logger Service
 * 
 * Persists user quiz attempts, progress updates, and study sessions
 * into PostgreSQL with fallback in-memory ring-buffer for transparency and resilience.
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

export interface QuizAttemptRecord {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  quizType?: string;
  score: number;
  totalScore?: number;
  percentage?: number;
  passed?: boolean;
  correctCount?: number;
  totalQuestions?: number;
  timeSpentSeconds?: number;
  notes?: string;
  details?: Record<string, any>;
  createdAt?: string;
}

export interface ProgressUpdateRecord {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  lessonId?: string;
  lessonTitle?: string;
  completionPercentage: number;
  totalLessonsCompleted?: number;
  streakDays?: number;
  details?: Record<string, any>;
  createdAt?: string;
}

export interface StudySessionRecord {
  id?: string;
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role?: string;
  sessionType?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  deviceInfo?: string;
  ipAddress?: string;
  details?: Record<string, any>;
  createdAt?: string;
}

export interface UnifiedActivityRecord {
  id?: string;
  timestampVn?: string;
  userId: string;
  userName: string;
  userEmail: string;
  role?: string;
  category: string;
  action: string;
  subject: string;
  details: string;
  status: string;
  scoreMetric?: string;
  sessionId?: string;
  deviceInfo?: string;
  rawMetadata?: Record<string, any>;
  createdAt?: string;
}

const rawDbUrl = process.env.DATABASE_URL || '';
const hasValidDb = Boolean(
  rawDbUrl && (rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://'))
);

const pool = hasValidDb
  ? new Pool({
      connectionString: rawDbUrl,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'mos_master_db',
      user: process.env.DB_USER || 'mos_admin',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    })
  : null;

class StudyLoggerService {
  private static instance: StudyLoggerService | null = null;
  private memoryQuizAttempts: QuizAttemptRecord[] = [];
  private memoryProgressUpdates: ProgressUpdateRecord[] = [];
  private memoryStudySessions: StudySessionRecord[] = [];
  private memoryUnifiedLogs: UnifiedActivityRecord[] = [];
  private isTableInitialized = false;

  private constructor() {
    this.seedSampleData();
    this.ensureTables();
  }

  public static getInstance(): StudyLoggerService {
    if (!StudyLoggerService.instance) {
      StudyLoggerService.instance = new StudyLoggerService();
    }
    return StudyLoggerService.instance;
  }

  private seedSampleData(): void {
    const now = Date.now();
    this.memoryQuizAttempts = [
      {
        id: 'qa-init-01',
        userId: 'b0000000-0000-0000-0000-000000000001',
        userName: 'Nguyễn Văn An',
        userEmail: 'student.demo@mosmaster.edu.vn',
        subject: 'excel',
        quizType: 'mock-exam',
        score: 875,
        totalScore: 1000,
        percentage: 87.5,
        passed: true,
        correctCount: 31,
        totalQuestions: 35,
        timeSpentSeconds: 2450,
        notes: 'Bài thi thử MOS Excel 2019 đạt chuẩn Certiport',
        details: { domainBreakdown: { 'Công thức & Hàm': '92%', 'Bảng tính & Sổ làm việc': '85%' } },
        createdAt: new Date(now - 3600000 * 5).toISOString(),
      },
      {
        id: 'qa-init-02',
        userId: 'b0000000-0000-0000-0000-000000000001',
        userName: 'Nguyễn Văn An',
        userEmail: 'student.demo@mosmaster.edu.vn',
        subject: 'word',
        quizType: 'theory-quiz',
        score: 920,
        totalScore: 1000,
        percentage: 92.0,
        passed: true,
        correctCount: 23,
        totalQuestions: 25,
        timeSpentSeconds: 1200,
        notes: 'Kiểm tra trắc nghiệm lý thuyết Word MO-100',
        createdAt: new Date(now - 3600000 * 20).toISOString(),
      },
    ];

    this.memoryProgressUpdates = [
      {
        id: 'pu-init-01',
        userId: 'b0000000-0000-0000-0000-000000000001',
        userName: 'Nguyễn Văn An',
        userEmail: 'student.demo@mosmaster.edu.vn',
        subject: 'excel',
        lessonId: 'excel-04',
        lessonTitle: 'Hàm logic IF, AND, OR và lồng ghép nâng cao',
        completionPercentage: 80.0,
        totalLessonsCompleted: 12,
        streakDays: 4,
        createdAt: new Date(now - 3600000 * 3).toISOString(),
      },
    ];

    this.memoryStudySessions = [
      {
        id: 'ss-init-01',
        sessionId: 'SES-INIT-001',
        userId: 'b0000000-0000-0000-0000-000000000001',
        userName: 'Nguyễn Văn An',
        userEmail: 'student.demo@mosmaster.edu.vn',
        role: 'student',
        sessionType: 'study',
        startedAt: new Date(now - 3600000 * 2).toISOString(),
        durationSeconds: 3600,
        deviceInfo: 'PC · Windows · Chrome',
        ipAddress: '127.0.0.1',
        details: { completedLessonsCount: 2, tasksCompleted: 5 },
        createdAt: new Date(now - 3600000 * 2).toISOString(),
      },
    ];

    this.memoryUnifiedLogs = [
      {
        id: 'LOG-INIT-001',
        timestampVn: new Date(now - 3600000 * 5).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        userId: 'b0000000-0000-0000-0000-000000000001',
        userName: 'Nguyễn Văn An',
        userEmail: 'student.demo@mosmaster.edu.vn',
        role: 'Học viên',
        category: 'Khảo Thí & Thi Thử',
        action: 'Nộp bài thi thử',
        subject: 'Excel (MO-200)',
        details: 'Hoàn thành đề thi thử MOS Excel đạt 875/1000 điểm (ĐẠT chuẩn Certiport)',
        status: 'Đạt Chuẩn Certiport',
        scoreMetric: '875/1000 (87.5%)',
        sessionId: 'SES-INIT-001',
        deviceInfo: 'PC · Windows · Chrome',
        createdAt: new Date(now - 3600000 * 5).toISOString(),
      },
    ];
  }

  private async ensureTables(): Promise<void> {
    if (!pool || this.isTableInitialized) return;
    try {
      const client = await pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS quiz_attempts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR(100) NOT NULL,
            user_name VARCHAR(150) NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            subject VARCHAR(50) NOT NULL,
            quiz_type VARCHAR(50) NOT NULL DEFAULT 'mock-exam',
            score INT NOT NULL DEFAULT 0,
            total_score INT NOT NULL DEFAULT 1000,
            percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
            passed BOOLEAN NOT NULL DEFAULT FALSE,
            correct_count INT NOT NULL DEFAULT 0,
            total_questions INT NOT NULL DEFAULT 0,
            time_spent_seconds INT NOT NULL DEFAULT 0,
            notes TEXT,
            details JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS progress_updates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR(100) NOT NULL,
            user_name VARCHAR(150) NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            subject VARCHAR(50) NOT NULL,
            lesson_id VARCHAR(100),
            lesson_title VARCHAR(255),
            completion_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
            total_lessons_completed INT NOT NULL DEFAULT 0,
            streak_days INT NOT NULL DEFAULT 1,
            details JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS study_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id VARCHAR(100) NOT NULL,
            user_id VARCHAR(100) NOT NULL,
            user_name VARCHAR(150) NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'student',
            session_type VARCHAR(50) NOT NULL DEFAULT 'study',
            started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMPTZ,
            duration_seconds INT NOT NULL DEFAULT 0,
            device_info VARCHAR(255),
            ip_address VARCHAR(50),
            details JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS unified_activity_logs (
            id VARCHAR(100) PRIMARY KEY,
            timestamp_vn VARCHAR(100) NOT NULL,
            user_id VARCHAR(100) NOT NULL,
            user_name VARCHAR(150) NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            category VARCHAR(100) NOT NULL,
            action VARCHAR(150) NOT NULL,
            subject VARCHAR(100) NOT NULL,
            details TEXT NOT NULL,
            status VARCHAR(50) NOT NULL,
            score_metric VARCHAR(100),
            session_id VARCHAR(100),
            device_info VARCHAR(255),
            raw_metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        this.isTableInitialized = true;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.warn('[StudyLoggerService] PostgreSQL table verification notice:', err?.message || err);
    }
  }

  /**
   * Log Quiz / Mock Exam Attempt to PostgreSQL (and in-memory buffer)
   */
  public async logQuizAttempt(data: QuizAttemptRecord): Promise<QuizAttemptRecord> {
    const totalScore = data.totalScore || 1000;
    const percentage = Number(data.percentage ?? ((data.score / totalScore) * 100).toFixed(1));
    const passed = data.passed ?? (percentage >= 70);
    const createdAt = data.createdAt || new Date().toISOString();
    const id = data.id || `qa-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    const record: QuizAttemptRecord = {
      ...data,
      id,
      totalScore,
      percentage,
      passed,
      createdAt,
    };

    // Buffer in memory
    this.memoryQuizAttempts.unshift(record);
    if (this.memoryQuizAttempts.length > 500) this.memoryQuizAttempts.pop();

    // Persist to PostgreSQL if pool is available
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO quiz_attempts (
            user_id, user_name, user_email, subject, quiz_type, 
            score, total_score, percentage, passed, correct_count, 
            total_questions, time_spent_seconds, notes, details, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            record.userId,
            record.userName,
            record.userEmail,
            record.subject,
            record.quizType || 'mock-exam',
            record.score,
            record.totalScore,
            record.percentage,
            record.passed,
            record.correctCount || 0,
            record.totalQuestions || 0,
            record.timeSpentSeconds || 0,
            record.notes || null,
            JSON.stringify(record.details || {}),
            record.createdAt,
          ]
        );
      } catch (err: any) {
        console.warn('[StudyLoggerService] PG insert quiz_attempt warning:', err?.message || err);
      }
    }

    return record;
  }

  /**
   * Log Progress Update to PostgreSQL (and in-memory buffer)
   */
  public async logProgressUpdate(data: ProgressUpdateRecord): Promise<ProgressUpdateRecord> {
    const createdAt = data.createdAt || new Date().toISOString();
    const id = data.id || `pu-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    const record: ProgressUpdateRecord = {
      ...data,
      id,
      createdAt,
    };

    this.memoryProgressUpdates.unshift(record);
    if (this.memoryProgressUpdates.length > 500) this.memoryProgressUpdates.pop();

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO progress_updates (
            user_id, user_name, user_email, subject, lesson_id, 
            lesson_title, completion_percentage, total_lessons_completed, 
            streak_days, details, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            record.userId,
            record.userName,
            record.userEmail,
            record.subject,
            record.lessonId || null,
            record.lessonTitle || null,
            record.completionPercentage,
            record.totalLessonsCompleted || 0,
            record.streakDays || 1,
            JSON.stringify(record.details || {}),
            record.createdAt,
          ]
        );
      } catch (err: any) {
        console.warn('[StudyLoggerService] PG insert progress_update warning:', err?.message || err);
      }
    }

    return record;
  }

  /**
   * Log or Update Study Session in PostgreSQL (and in-memory buffer)
   */
  public async logStudySession(data: StudySessionRecord): Promise<StudySessionRecord> {
    const createdAt = data.createdAt || new Date().toISOString();
    const id = data.id || `ss-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    const record: StudySessionRecord = {
      ...data,
      id,
      createdAt,
    };

    // Check if session exists in memory to update it, or add new
    const existingIndex = this.memoryStudySessions.findIndex(s => s.sessionId === record.sessionId);
    if (existingIndex >= 0) {
      this.memoryStudySessions[existingIndex] = {
        ...this.memoryStudySessions[existingIndex],
        ...record,
      };
    } else {
      this.memoryStudySessions.unshift(record);
      if (this.memoryStudySessions.length > 500) this.memoryStudySessions.pop();
    }

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO study_sessions (
            session_id, user_id, user_name, user_email, role, 
            session_type, started_at, ended_at, duration_seconds, 
            device_info, ip_address, details, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            record.sessionId,
            record.userId,
            record.userName,
            record.userEmail,
            record.role || 'student',
            record.sessionType || 'study',
            record.startedAt || new Date().toISOString(),
            record.endedAt || null,
            record.durationSeconds || 0,
            record.deviceInfo || null,
            record.ipAddress || null,
            JSON.stringify(record.details || {}),
            record.createdAt,
          ]
        );
      } catch (err: any) {
        console.warn('[StudyLoggerService] PG insert study_session warning:', err?.message || err);
      }
    }

    return record;
  }

  /**
   * Log Unified Activity (granular event)
   */
  public async logUnifiedActivity(data: UnifiedActivityRecord): Promise<UnifiedActivityRecord> {
    const createdAt = data.createdAt || new Date().toISOString();
    const id = data.id || `LOG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const timestampVn = data.timestampVn || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    const record: UnifiedActivityRecord = {
      ...data,
      id,
      timestampVn,
      createdAt,
    };

    this.memoryUnifiedLogs.unshift(record);
    if (this.memoryUnifiedLogs.length > 1000) this.memoryUnifiedLogs.pop();

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO unified_activity_logs (
            id, timestamp_vn, user_id, user_name, user_email, role, 
            category, action, subject, details, status, score_metric, 
            session_id, device_info, raw_metadata, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            details = EXCLUDED.details,
            score_metric = EXCLUDED.score_metric;`,
          [
            record.id,
            record.timestampVn,
            record.userId,
            record.userName,
            record.userEmail,
            record.role || 'Học viên',
            record.category,
            record.action,
            record.subject,
            record.details,
            record.status,
            record.scoreMetric || null,
            record.sessionId || null,
            record.deviceInfo || null,
            JSON.stringify(record.rawMetadata || {}),
            record.createdAt,
          ]
        );
      } catch (err: any) {
        console.warn('[StudyLoggerService] PG insert unified_activity_log warning:', err?.message || err);
      }
    }

    return record;
  }

  /**
   * Retrieve all study logs for a specific user
   */
  public async getUserLogs(userId: string): Promise<{
    quizAttempts: QuizAttemptRecord[];
    progressUpdates: ProgressUpdateRecord[];
    studySessions: StudySessionRecord[];
    unifiedLogs: UnifiedActivityRecord[];
  }> {
    if (pool) {
      try {
        const [qaRes, puRes, ssRes, ulRes] = await Promise.all([
          pool.query('SELECT * FROM quiz_attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]),
          pool.query('SELECT * FROM progress_updates WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]),
          pool.query('SELECT * FROM study_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]),
          pool.query('SELECT * FROM unified_activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]),
        ]);

        return {
          quizAttempts: qaRes.rows.map(r => ({
            id: r.id,
            userId: r.user_id,
            userName: r.user_name,
            userEmail: r.user_email,
            subject: r.subject,
            quizType: r.quiz_type,
            score: r.score,
            totalScore: r.total_score,
            percentage: parseFloat(r.percentage),
            passed: r.passed,
            correctCount: r.correct_count,
            totalQuestions: r.total_questions,
            timeSpentSeconds: r.time_spent_seconds,
            notes: r.notes,
            details: r.details,
            createdAt: r.created_at,
          })),
          progressUpdates: puRes.rows.map(r => ({
            id: r.id,
            userId: r.user_id,
            userName: r.user_name,
            userEmail: r.user_email,
            subject: r.subject,
            lessonId: r.lesson_id,
            lessonTitle: r.lesson_title,
            completionPercentage: parseFloat(r.completion_percentage),
            totalLessonsCompleted: r.total_lessons_completed,
            streakDays: r.streak_days,
            details: r.details,
            createdAt: r.created_at,
          })),
          studySessions: ssRes.rows.map(r => ({
            id: r.id,
            sessionId: r.session_id,
            userId: r.user_id,
            userName: r.user_name,
            userEmail: r.user_email,
            role: r.role,
            sessionType: r.session_type,
            startedAt: r.started_at,
            endedAt: r.ended_at,
            durationSeconds: r.duration_seconds,
            deviceInfo: r.device_info,
            ipAddress: r.ip_address,
            details: r.details,
            createdAt: r.created_at,
          })),
          unifiedLogs: ulRes.rows.map(r => ({
            id: r.id,
            timestampVn: r.timestamp_vn,
            userId: r.user_id,
            userName: r.user_name,
            userEmail: r.user_email,
            role: r.role,
            category: r.category,
            action: r.action,
            subject: r.subject,
            details: r.details,
            status: r.status,
            scoreMetric: r.score_metric,
            sessionId: r.session_id,
            deviceInfo: r.device_info,
            rawMetadata: r.raw_metadata,
            createdAt: r.created_at,
          })),
        };
      } catch (err) {
        console.warn('[StudyLoggerService] PG query error, falling back to memory logs:', err);
      }
    }

    // Memory fallback
    return {
      quizAttempts: this.memoryQuizAttempts.filter(q => q.userId === userId || userId === 'all'),
      progressUpdates: this.memoryProgressUpdates.filter(p => p.userId === userId || userId === 'all'),
      studySessions: this.memoryStudySessions.filter(s => s.userId === userId || userId === 'all'),
      unifiedLogs: this.memoryUnifiedLogs.filter(u => u.userId === userId || userId === 'all'),
    };
  }

  /**
   * System summary statistics
   */
  public async getSummaryStats(): Promise<{
    totalQuizAttempts: number;
    avgQuizScore: number;
    passRate: number;
    totalProgressUpdates: number;
    totalStudySessions: number;
    activeUsersCount: number;
    recentActivities: UnifiedActivityRecord[];
  }> {
    if (pool) {
      try {
        const statsRes = await pool.query(`
          SELECT 
            COUNT(id) as total_attempts,
            COALESCE(AVG(score), 0) as avg_score,
            COALESCE(AVG(CASE WHEN passed THEN 1 ELSE 0 END) * 100, 0) as pass_rate
          FROM quiz_attempts;
        `);
        const puCountRes = await pool.query('SELECT COUNT(id) as count FROM progress_updates;');
        const ssCountRes = await pool.query('SELECT COUNT(id) as count FROM study_sessions;');
        const uniqueUsersRes = await pool.query('SELECT COUNT(DISTINCT user_id) as count FROM unified_activity_logs;');
        const recentLogsRes = await pool.query('SELECT * FROM unified_activity_logs ORDER BY created_at DESC LIMIT 20;');

        const sRow = statsRes.rows[0];
        return {
          totalQuizAttempts: parseInt(sRow.total_attempts, 10) || 0,
          avgQuizScore: Math.round(parseFloat(sRow.avg_score) || 0),
          passRate: Math.round(parseFloat(sRow.pass_rate) || 0),
          totalProgressUpdates: parseInt(puCountRes.rows[0].count, 10) || 0,
          totalStudySessions: parseInt(ssCountRes.rows[0].count, 10) || 0,
          activeUsersCount: parseInt(uniqueUsersRes.rows[0].count, 10) || 0,
          recentActivities: recentLogsRes.rows.map(r => ({
            id: r.id,
            timestampVn: r.timestamp_vn,
            userId: r.user_id,
            userName: r.user_name,
            userEmail: r.user_email,
            role: r.role,
            category: r.category,
            action: r.action,
            subject: r.subject,
            details: r.details,
            status: r.status,
            scoreMetric: r.score_metric,
            sessionId: r.session_id,
            deviceInfo: r.device_info,
            createdAt: r.created_at,
          })),
        };
      } catch (err) {
        console.warn('[StudyLoggerService] PG stats error, using memory logs:', err);
      }
    }

    const totalAttempts = this.memoryQuizAttempts.length;
    const avgScore = totalAttempts > 0
      ? Math.round(this.memoryQuizAttempts.reduce((acc, q) => acc + q.score, 0) / totalAttempts)
      : 0;
    const passCount = this.memoryQuizAttempts.filter(q => q.passed).length;
    const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;

    const uniqueUsers = new Set(this.memoryUnifiedLogs.map(l => l.userId));

    return {
      totalQuizAttempts: totalAttempts,
      avgQuizScore: avgScore,
      passRate: passRate,
      totalProgressUpdates: this.memoryProgressUpdates.length,
      totalStudySessions: this.memoryStudySessions.length,
      activeUsersCount: uniqueUsers.size,
      recentActivities: this.memoryUnifiedLogs.slice(0, 20),
    };
  }
}

export const studyLoggerService = StudyLoggerService.getInstance();
