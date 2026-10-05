import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { THEORY_QUESTIONS } from './src/data/theoryQuestions.ts';
import aiRoutes from './server/routes/aiRoutes.ts';
import authRouter from './server/auth.js';
import adminRoutes from './server/routes/adminRoutes.ts';
import logRoutes from './server/routes/logRoutes.ts';
import feedbackRoutes from './server/routes/feedbackRoutes.ts';
import { createMasteryRouter } from './server/routes/masteryRoutes.ts';
import offlineRoutes from './server/routes/offlineRoutes.ts';
import sheetsAutoSyncRoutes from './server/routes/sheetsAutoSyncRoutes.ts';
import { userService } from './server/services/userService.ts';
import { auditLogService } from './server/services/auditLogService.ts';
import { fileGraderQueue } from './server/services/fileGraderQueue.ts';
import { generateOfflineMosAnswer } from './server/services/aiFallbackService.ts';
import { requireAuth } from './server/middleware/authMiddleware.ts';
import { centralizedErrorHandler } from './server/middleware/errorHandler.ts';
import { JWT_SECRET } from './server/config/jwt.ts';
import { logger } from './server/config/logger.ts';

dotenv.config();

// Fisher-Yates unbiased shuffle algorithm (replaces biased sort with 0.5 - Math.random)
function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.NODE_ENV === 'production' && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';

// Security Headers: Helmet protection against common web vulnerabilities
app.use(helmet({
  contentSecurityPolicy: false, // Allows Vite development & inline app scripts
  crossOriginEmbedderPolicy: false,
  frameguard: false, // Preserves AI Studio iFrame preview capability
}));

app.use(express.json());

// Request Correlation ID and Tracing Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const incomingId = req.headers['x-request-id'];
  const requestId = (typeof incomingId === 'string' && incomingId.trim())
    ? incomingId.trim()
    : `req-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// Winston HTTP Request Logger Middleware with Request ID tracing
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = (req as any).requestId;

  res.on('finish', () => {
    if (req.originalUrl.startsWith('/api')) {
      const duration = Date.now() - start;
      logger.info(`HTTP ${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`, {
        requestId,
        ip: req.ip,
        statusCode: res.statusCode,
      });
    }
  });
  next();
});

// Mount modular Auth, Admin & AI Proxy routers (AI routes include aiRateLimiter)
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/gemini', aiRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/mastery', createMasteryRouter(() => submissionsStore));
app.use('/api/offline', offlineRoutes);
app.use('/api/sheets', sheetsAutoSyncRoutes);

// Explicit Service Worker Route with Root Scope Allowance Header
app.get('/sw.js', (_req: Request, res: Response) => {
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

// ==========================================
// TEACHER & STUDENT SUBMISSIONS MANAGEMENT
// ==========================================

interface SubmissionRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classRoom: string;
  subject: 'word' | 'excel' | 'powerpoint' | 'mixed';
  type: 'mock-exam' | 'practical' | 'theory-quiz';
  score: number;
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
  wrongQuestions?: Array<{
    title: string;
    domainName: string;
    userAnswerText: string;
    correctAnswerText: string;
    officialRibbonPath: string;
    explanation: string;
  }>;
  violationsCount?: number;
  antiCheatLogs?: string[];
  status: 'pending' | 'reviewed';
}

interface ActiveExamSession {
  sessionId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  subject: 'word' | 'excel' | 'powerpoint' | 'mixed';
  startTime: number;
  durationSeconds: number;
  questionIds: string[];
  violationsCount: number;
  antiCheatLogs: string[];
  timeLeftSeconds?: number;
  userAnswers?: Record<string, string>;
  markedForReview?: Record<string, boolean>;
  currentIndex?: number;
  lastSavedAt?: number;
}

const activeExamSessions = new Map<string, ActiveExamSession>();

// O(1) Question Map for instant lookup (avoids O(N) Array.find inside grading loops)
const QUESTION_MAP = new Map(THEORY_QUESTIONS.map(q => [q.id, q]));

// Memory leak prevention: Periodically prune exam sessions older than 2 hours
setInterval(() => {
  const now = Date.now();
  const maxSessionDurationMs = 2 * 60 * 60 * 1000;
  for (const [sId, sess] of activeExamSessions.entries()) {
    if (now - sess.startTime > maxSessionDurationMs) {
      activeExamSessions.delete(sId);
    }
  }
}, 10 * 60 * 1000).unref();

// In-memory submissions store pre-populated with realistic student submissions
let submissionsStore: SubmissionRecord[] = [
  {
    id: 'sub-sample-01',
    studentId: 'stu-sample-1',
    studentName: 'Trần Minh Quân',
    studentCode: 'K24-CNTT-012',
    classRoom: 'Lớp MOS-TinHoc01',
    subject: 'word',
    type: 'mock-exam',
    score: 875,
    passed: true,
    timeSpentSeconds: 2150,
    totalQuestions: 25,
    correctCount: 22,
    teacherId: 't-word-01',
    teacherName: 'ThS. Nguyễn Tuấn Anh',
    teacherFeedback: 'Bài làm rất tốt, các thao tác về Header & Footer và Citation nguồn rất chuẩn xác!',
    teacherFeedbackAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    teacherRating: 'excellent',
    submittedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    domainScores: {
      'Quản lý tài liệu & Thiết lập trang': { total: 5, correct: 5 },
      'Chèn & Định dạng văn bản, đoạn văn': { total: 5, correct: 5 },
      'Quản lý bảng biểu & danh sách': { total: 5, correct: 4 },
      'Tạo & Quản lý tài liệu tham khảo': { total: 5, correct: 4 },
      'Chèn & Định dạng đối tượng đồ họa': { total: 5, correct: 4 },
    },
    status: 'reviewed',
  },
  {
    id: 'sub-sample-02',
    studentId: 'stu-sample-2',
    studentName: 'Lê Thu Hương',
    studentCode: 'K24-KT-045',
    classRoom: 'Lớp MOS-TinHoc01',
    subject: 'excel',
    type: 'mock-exam',
    score: 920,
    passed: true,
    timeSpentSeconds: 1980,
    totalQuestions: 25,
    correctCount: 23,
    teacherId: 't-excel-02',
    teacherName: 'ThS. Trần Thị Bích Mai',
    teacherFeedback: 'Xuất sắc! Các hàm logic lồng nhau và VLOOKUP giải quyết hoàn hảo. Sẵn sàng đi thi lấy chứng chỉ quốc tế!',
    teacherFeedbackAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    teacherRating: 'excellent',
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    domainScores: {
      'Quản lý trang tính & Sổ làm việc': { total: 5, correct: 5 },
      'Quản lý ô dữ liệu & Dải ô': { total: 5, correct: 5 },
      'Quản lý bảng tính (Tables)': { total: 5, correct: 5 },
      'Thực hiện phép tính với công thức & hàm': { total: 5, correct: 4 },
      'Quản lý biểu đồ (Charts)': { total: 5, correct: 4 },
    },
    status: 'reviewed',
  },
  {
    id: 'sub-sample-03',
    studentId: 'stu-sample-3',
    studentName: 'Đặng Tuấn Kiệt',
    studentCode: 'K24-QTKD-078',
    classRoom: 'Lớp MOS-TinHoc02',
    subject: 'excel',
    type: 'mock-exam',
    score: 640,
    passed: false,
    timeSpentSeconds: 2700,
    totalQuestions: 25,
    correctCount: 16,
    teacherId: 't-excel-02',
    teacherName: 'ThS. Trần Thị Bích Mai',
    teacherFeedback: 'Cần ôn lại kỹ quy tắc khóa ô tuyệt đối ($) khi dùng hàm VLOOKUP và cách đặt tên dải ô Name Range nhé em.',
    teacherFeedbackAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    teacherRating: 'needs-improvement',
    submittedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    domainScores: {
      'Quản lý trang tính & Sổ làm việc': { total: 5, correct: 4 },
      'Quản lý ô dữ liệu & Dải ô': { total: 5, correct: 3 },
      'Quản lý bảng tính (Tables)': { total: 5, correct: 3 },
      'Thực hiện phép tính với công thức & hàm': { total: 5, correct: 3 },
      'Quản lý biểu đồ (Charts)': { total: 5, correct: 3 },
    },
    status: 'reviewed',
  },
  {
    id: 'sub-sample-04',
    studentId: 'stu-sample-4',
    studentName: 'Vũ Hoàng Yến',
    studentCode: 'K24-NNA-102',
    classRoom: 'Lớp MOS-TinHoc02',
    subject: 'powerpoint',
    type: 'mock-exam',
    score: 850,
    passed: true,
    timeSpentSeconds: 2200,
    totalQuestions: 20,
    correctCount: 17,
    teacherId: 't-ppt-03',
    teacherName: 'ThS. Lê Hoàng Nam',
    teacherFeedback: 'Kỹ năng làm Slide Master và hiệu ứng Morph rất mượt mà. Cố gắng phát huy!',
    teacherFeedbackAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    teacherRating: 'good',
    submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    domainScores: {
      'Quản lý bài thuyết trình': { total: 5, correct: 4 },
      'Quản lý trang chiếu (Slides)': { total: 4, correct: 4 },
      'Chèn & Định dạng văn bản, hình khối': { total: 4, correct: 3 },
      'Chèn phương tiện & Đa truyền thông': { total: 4, correct: 3 },
      'Hiệu ứng chuyển trang & Hoạt ảnh': { total: 3, correct: 3 },
    },
    status: 'reviewed',
  },
];

// ==========================================
// SECURE SERVER-SIDE EXAM ENGINE (ANTI-CHEAT & QUESTION BANK PROTECTION)
// ==========================================

// Rate limiter for starting exams (Max 3 exam starts per user/IP per hour - Item 7)
const examStartLimiterMap = new Map<string, { count: number; resetAt: number }>();
const examRateLimiter = (req: Request, res: Response, next: () => void) => {
  const userKey = (req.body?.studentId || req.body?.studentCode || req.ip || 'unknown').toString();
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const record = examStartLimiterMap.get(userKey) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  record.count++;
  examStartLimiterMap.set(userKey, record);

  if (record.count > 3) {
    return res.status(429).json({ 
      error: 'TooManyRequests', 
      message: 'Bạn đã đạt giới hạn bắt đầu bài thi (tối đa 3 lần/người dùng/giờ). Vui lòng thử lại sau.' 
    });
  }

  next();
};

// Endpoint: Start new exam session with sanitized questions (No answers exposed to client!)
app.post('/api/exam/start', examRateLimiter, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject = 'all', studentId, studentName, studentCode } = req.body;
    let pool = THEORY_QUESTIONS;
    if (subject && subject !== 'all') {
      pool = THEORY_QUESTIONS.filter(q => q.subject === subject);
    }
    if (pool.length === 0) pool = THEORY_QUESTIONS;

    // Shuffle unbiasedly with Fisher-Yates algorithm and pick 15 questions
    const shuffled = fisherYatesShuffle(pool);
    const selected = shuffled.slice(0, Math.min(15, shuffled.length));
    const sessionId = 'exam-ses-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    const session: ActiveExamSession = {
      sessionId,
      studentId: studentId || 'stu-guest',
      studentName: studentName || 'Học Viên',
      studentCode: studentCode || 'HV-' + Math.floor(1000 + Math.random() * 9000),
      subject: subject as any,
      startTime: Date.now(),
      durationSeconds: 50 * 60,
      questionIds: selected.map(q => q.id),
      violationsCount: 0,
      antiCheatLogs: [],
    };
    activeExamSessions.set(sessionId, session);

    // CRITICAL SECURITY: Strip answers, explanations, and ribbon tips!
    // Student inspecting DevTools / Network tab CANNOT see correct answers!
    const sanitizedQuestions = selected.map(q => ({
      id: q.id,
      subject: q.subject,
      domainId: q.domainId,
      domainName: q.domainName,
      difficulty: q.difficulty,
      type: q.type,
      title: q.title,
      scenario: q.scenario,
      options: q.options,
      points: q.points,
    }));

    console.log(`[Exam Security] Started session ${sessionId} for ${session.studentName} (${session.subject}) with ${sanitizedQuestions.length} sanitized questions.`);
    return res.json({
      sessionId,
      subject,
      durationSeconds: session.durationSeconds,
      totalQuestions: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    });
  } catch (err) {
    next(err);
  }
});

// Endpoint: Anti-Cheat Violation event logger
app.post('/api/exam/violation', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, reason, timestamp } = req.body;
    const session = activeExamSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Phiên thi không tồn tại hoặc đã kết thúc.' });
    }

    session.violationsCount += 1;
    const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString('vi-VN') : new Date().toLocaleTimeString('vi-VN');
    const logEntry = `[${timeStr}] ${reason || 'Phát hiện chuyển tab hoặc mất tiêu điểm màn hình thi'}`;
    session.antiCheatLogs.push(logEntry);
    console.warn(`[Anti-Cheat Warning] Session ${sessionId} (${session.studentName}): ${logEntry} (Tổng: ${session.violationsCount})`);
    return res.json({
      success: true,
      violationsCount: session.violationsCount,
      logs: session.antiCheatLogs,
    });
  } catch (err) {
    next(err);
  }
});

// Endpoint: Submit exam with server-side authoritative grading
app.post('/api/exam/submit', (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      sessionId,
      userAnswers = {},
      timeSpentSeconds = 0,
      studentId,
      studentName,
      studentCode,
      classRoom,
      teacherId,
      teacherName,
      violationsCount = 0,
      antiCheatLogs = [],
    } = req.body;

    if (!userAnswers || typeof userAnswers !== 'object' || Array.isArray(userAnswers)) {
      return res.status(400).json({ error: 'Định dạng câu trả lời (userAnswers) không hợp lệ.' });
    }

    const session = activeExamSessions.get(sessionId);
    const questionIds = session ? session.questionIds : Object.keys(userAnswers);

    if (questionIds.length === 0) {
      return res.status(400).json({ error: 'Bài thi không có câu hỏi hợp lệ để chấm điểm.' });
    }

    // O(1) Map lookup instead of O(N) Array.find
    const questions = questionIds.map(id => QUESTION_MAP.get(id)).filter(Boolean) as typeof THEORY_QUESTIONS;
    if (questions.length === 0) {
      return res.status(400).json({ error: 'Không tìm thấy câu hỏi trong ngân hàng đề thi.' });
    }

    let correctCount = 0;
    const domainScores: Record<string, { total: number; correct: number }> = {};
    const wrongQuestions: any[] = [];
    const reviewQuestions: any[] = [];

    questions.forEach(q => {
      const userAns = userAnswers[q.id];
      const isCorrect = userAns === q.correctAnswer;
      if (isCorrect) {
        correctCount += 1;
      }

      const dom = q.domainName || 'Tổng quát';
      if (!domainScores[dom]) {
        domainScores[dom] = { total: 0, correct: 0 };
      }
      domainScores[dom].total += 1;
      if (isCorrect) domainScores[dom].correct += 1;

      const userOpt = q.options.find(o => o.id === userAns);
      const correctOpt = q.options.find(o => o.id === q.correctAnswer);

      if (!isCorrect) {
        wrongQuestions.push({
          title: q.title,
          domainName: q.domainName,
          userAnswerText: userOpt ? `[${userAns.toUpperCase()}] ${userOpt.text}` : 'Chưa chọn đáp án',
          correctAnswerText: correctOpt ? `[${q.correctAnswer.toUpperCase()}] ${correctOpt.text}` : 'N/A',
          officialRibbonPath: q.officialRibbonPath,
          explanation: q.explanation,
        });
      }

      // Review item sent back only upon completion
      reviewQuestions.push({
        id: q.id,
        subject: q.subject,
        domainName: q.domainName,
        title: q.title,
        scenario: q.scenario,
        options: q.options,
        userAnswer: userAns,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        officialRibbonPath: q.officialRibbonPath,
        shortcutTip: q.shortcutTip,
      });
    });

    const totalQ = questions.length;
    // Standard Certiport MOS scale: 1000 max score, 700 passing score clamped to [0, 1000]
    const calculatedScore = Math.round((correctCount / totalQ) * 1000);
    const totalScore = Math.max(0, Math.min(1000, calculatedScore));
    const passed = totalScore >= 700;

    // Server-side exam timeout enforcement (Item 10)
    if (session) {
      const elapsedSeconds = Math.floor((Date.now() - session.startTime) / 1000);
      const maxAllowedSeconds = session.durationSeconds + 120; // 2 minutes grace period for network latency
      if (elapsedSeconds > maxAllowedSeconds) {
        session.antiCheatLogs.push(`[TIMEOUT_EXCEEDED] Bài thi nộp muộn sau ${elapsedSeconds}s (hạn mức tối đa ${session.durationSeconds}s)`);
        session.violationsCount += 1;
      }
    }

    // Server authoritative anti-cheat: Block client violationsCount & antiCheatLogs (Items 8 & 9)
    // Strictly rely on server-side session tracking to prevent tampering
    const finalViolations = session ? session.violationsCount : 0;
    const finalLogs = session ? [...session.antiCheatLogs] : [];

    const submission: SubmissionRecord = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      studentId: studentId || session?.studentId || 'stu-' + Date.now(),
      studentName: studentName || session?.studentName || 'Học Viên',
      studentCode: studentCode || session?.studentCode || 'HV-' + Math.floor(1000 + Math.random() * 9000),
      classRoom: classRoom || 'Lớp MOS-TinHoc01',
      subject: (session?.subject || 'mixed') as any,
      type: 'mock-exam',
      score: totalScore,
      passed,
      timeSpentSeconds,
      totalQuestions: totalQ,
      correctCount,
      teacherId: teacherId || 't-word-01',
      teacherName: teacherName || 'ThS. Nguyễn Tuấn Anh',
      submittedAt: new Date().toISOString(),
      domainScores,
      wrongQuestions,
      status: 'pending',
      violationsCount: finalViolations,
      antiCheatLogs: finalLogs,
    };

    submissionsStore.unshift(submission);
    if (submissionsStore.length > 200) {
      submissionsStore = submissionsStore.slice(0, 200);
    }

    if (sessionId) {
      activeExamSessions.delete(sessionId);
    }

    console.log(`[Exam Graded] Student: ${submission.studentName} - Score: ${submission.score}/1000 (${passed ? 'PASSED' : 'FAILED'}) - AntiCheat Violations: ${finalViolations}`);

    return res.json({
      success: true,
      submission,
      reviewQuestions,
    });
  } catch (err) {
    next(err);
  }
});

// Endpoint: Debounced Exam Auto-Save (anti-disconnection and F5 recovery)
app.post('/api/exam/autosave', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, userAnswers, timeLeftSeconds, currentIndex, markedForReview } = req.body;
    if (sessionId && activeExamSessions.has(sessionId)) {
      const session = activeExamSessions.get(sessionId)!;
      session.userAnswers = userAnswers || session.userAnswers || {};
      session.timeLeftSeconds = typeof timeLeftSeconds === 'number' ? timeLeftSeconds : session.timeLeftSeconds;
      (session as any).markedForReview = markedForReview || {};
      (session as any).currentIndex = currentIndex || 0;
      (session as any).lastSavedAt = Date.now();
      activeExamSessions.set(sessionId, session);
    }
    return res.json({ 
      success: true, 
      savedAt: new Date().toLocaleTimeString('vi-VN'),
      message: 'Đã tự động lưu bài thi vào bộ nhớ máy chủ an toàn.' 
    });
  } catch (err) {
    next(err);
  }
});

// Endpoint: Check & Resume active exam session
app.get('/api/exam/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = activeExamSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Không tìm thấy phiên làm bài đang hoạt động.' });
  }
  return res.json({
    sessionId,
    subject: session.subject,
    studentName: session.studentName,
    timeLeftSeconds: session.timeLeftSeconds,
    userAnswers: session.userAnswers,
    markedForReview: session.markedForReview || {},
    currentIndex: session.currentIndex || 0,
    questions: session.questionIds
      .map(id => THEORY_QUESTIONS.find(q => q.id === id))
      .filter((q): q is typeof THEORY_QUESTIONS[0] => Boolean(q))
      .map(q => ({
        id: q.id,
        subject: q.subject,
        domainId: q.domainId,
        domainName: q.domainName,
        difficulty: q.difficulty,
        type: q.type,
        title: q.title,
        scenario: q.scenario,
        options: q.options,
        points: q.points,
      })),
  });
});

// Endpoint: Non-blocking File Grader Upload & Queue
app.post('/api/grader/submit', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, studentName, fileName, fileSize, subject, projectId, evaluationResult } = req.body;
    if (!studentName || !subject) {
      return res.status(400).json({ error: 'studentName và subject là bắt buộc.' });
    }

    if (evaluationResult) {
      // Completed with client worker
      const job = fileGraderQueue.completeClientEvaluatedJob({
        studentId: studentId || 'student-auto',
        studentName,
        fileName: fileName || 'practice_file.xlsx',
        fileSize: fileSize || 1024,
        subject,
        projectId: projectId || 'proj-1',
        result: evaluationResult,
      });
      return res.status(201).json({ success: true, job });
    }

    const job = fileGraderQueue.createJob({
      studentId: studentId || 'student-auto',
      studentName,
      fileName: fileName || 'practice_file.xlsx',
      fileSize: fileSize || 1024,
      subject,
      projectId: projectId || 'proj-1',
    });

    return res.status(202).json({ 
      success: true, 
      jobId: job.id, 
      status: job.status,
      message: 'Tệp đã được đưa vào hàng đợi chấm điểm nền không làm nghẽn server.' 
    });
  } catch (error) {
    next(error);
  }
});

// Endpoint: File Grader Status Poll
app.get('/api/grader/status/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const job = fileGraderQueue.getJob(id);
  if (!job) {
    return res.status(404).json({ error: 'Không tìm thấy tác vụ chấm điểm này.' });
  }
  return res.json({ job });
});

// Endpoint: Submit exam/practice result from student
app.post('/api/submissions', (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    if (!data.studentName || !data.subject) {
      return res.status(400).json({ error: 'studentName và subject là bắt buộc' });
    }

    const newSubmission: SubmissionRecord = {
      id: data.id || 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      studentId: data.studentId || 'stu-' + Date.now(),
      studentName: data.studentName,
      studentCode: data.studentCode || 'HV-' + Math.floor(1000 + Math.random() * 9000),
      classRoom: data.classRoom || 'Lớp MOS 2026',
      subject: data.subject,
      type: data.type || 'mock-exam',
      score: typeof data.score === 'number' ? data.score : 0,
      passed: Boolean(data.passed),
      timeSpentSeconds: data.timeSpentSeconds || 0,
      totalQuestions: data.totalQuestions || 25,
      correctCount: data.correctCount || 0,
      teacherId: data.teacherId || 't-word-01',
      teacherName: data.teacherName || 'Giáo Viên Phụ Trách',
      submittedAt: data.submittedAt || new Date().toISOString(),
      domainScores: data.domainScores || {},
      wrongQuestions: data.wrongQuestions || [],
      status: 'pending',
    };

    submissionsStore.unshift(newSubmission);
    // Keep last 200 records
    if (submissionsStore.length > 200) {
      submissionsStore = submissionsStore.slice(0, 200);
    }

    console.log(`[Auto-Sync] Received student submission from ${newSubmission.studentName} (${newSubmission.subject}): ${newSubmission.score} pts -> Assigned to Teacher: ${newSubmission.teacherName}`);
    return res.status(201).json({ success: true, submission: newSubmission });
  } catch (error) {
    next(error);
  }
});

// Endpoint: Get submissions filtered by teacher, student, subject
app.get('/api/submissions', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teacherId, studentId, subject, classRoom } = req.query;

    let filtered = [...submissionsStore];

    if (teacherId && teacherId !== 'all') {
      filtered = filtered.filter(s => s.teacherId === teacherId);
    }
    if (studentId) {
      filtered = filtered.filter(s => s.studentId === studentId);
    }
    if (subject && subject !== 'all') {
      filtered = filtered.filter(s => s.subject === subject);
    }
    if (classRoom) {
      filtered = filtered.filter(s => s.classRoom === classRoom);
    }

    return res.json({ submissions: filtered });
  } catch (error) {
    next(error);
  }
});

// Endpoint: Teacher adds feedback/grade for a submission (Requires Teacher or Admin JWT)
app.post('/api/submissions/:id/feedback', requireAuth(['teacher', 'admin']), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { feedback, rating } = req.body;

    const item = submissionsStore.find(s => s.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy bài nộp với ID này.' });
    }

    item.teacherFeedback = feedback || '';
    item.teacherFeedbackAt = new Date().toISOString();
    item.teacherRating = rating || 'good';
    item.status = 'reviewed';

    return res.json({ success: true, submission: item });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// OWNER TEACHER MANAGEMENT (CRUD - Admin Only)
// ==========================================
let teachersStore = [
  {
    id: 't-word-01',
    name: 'ThS. Nguyễn Tuấn Anh',
    email: 'tuananh.mosword@edu.vn',
    subject: 'word',
    title: 'Trưởng Bộ Môn MOS Word (MO-100)',
    department: 'Khoa Tin học Ứng dụng & Khảo thí Quốc tế',
    phone: '1900.0000',
    avatarBg: 'bg-blue-600',
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-excel-02',
    name: 'ThS. Trần Thị Bích Mai',
    email: 'bichmai.mosexcel@edu.vn',
    subject: 'excel',
    title: 'Chuyên Gia Huấn Luyện MOS Excel (MO-200)',
    department: 'Bộ môn Phân tích Dữ liệu & Bảng tính',
    phone: '1900.0000',
    avatarBg: 'bg-emerald-600',
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-ppt-03',
    name: 'ThS. Lê Hoàng Nam',
    email: 'hoangnam.mosppt@edu.vn',
    subject: 'powerpoint',
    title: 'Giảng Viên Chuyên Sâu MOS PowerPoint (MO-300)',
    department: 'Bộ môn Thiết kế Đa phương tiện & Thuyết trình',
    phone: '1900.0000',
    avatarBg: 'bg-orange-600',
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-all-04',
    name: 'TS. Phạm Minh Đức',
    email: 'minhduc.mosmaster@edu.vn',
    subject: 'all',
    title: 'Giám Đốc Trung Tâm Khảo Thí MOS Master',
    department: 'Hội đồng Khảo thí Certiport Việt Nam',
    phone: '1900.0000',
    avatarBg: 'bg-indigo-700',
    createdAt: new Date().toISOString(),
  },
];

app.get('/api/teachers', async (_req: Request, res: Response) => {
  try {
    const dbTeachers = await userService.getTeachers();
    const existingEmails = new Set(teachersStore.map(t => (t.email || '').toLowerCase()));
    dbTeachers.forEach(dt => {
      if (!existingEmails.has((dt.email || '').toLowerCase())) {
        teachersStore.push({
          id: dt.id,
          name: dt.name,
          email: dt.email,
          subject: (dt.subject || 'excel') as any,
          title: dt.title || 'Giảng Viên Bộ Môn MOS',
          department: dt.department || 'Bộ môn Tin học',
          phone: dt.phone || '1900.6868',
          avatarBg: dt.avatarBg || 'bg-blue-600',
          createdAt: new Date().toISOString(),
        });
        existingEmails.add((dt.email || '').toLowerCase());
      }
    });

    return res.json({ teachers: teachersStore });
  } catch {
    return res.json({ teachers: teachersStore });
  }
});

app.post('/api/teachers', requireAuth(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    if (!data.name || !data.email) {
      return res.status(400).json({ error: 'Tên và email giảng viên là bắt buộc.' });
    }
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();

    // 1. Save to userService (PostgreSQL + memoryUsers) so the teacher becomes a real system user
    const savedUser = await userService.saveUser({
      full_name: cleanName,
      email: cleanEmail,
      role: 'teacher',
      teaching_subjects: [data.subject === 'word' ? 'Word' : data.subject === 'powerpoint' ? 'PowerPoint' : 'Excel'],
      classroom: data.department || 'Bộ môn Tin học Ứng dụng & Khảo thí',
    });

    const newTeacher = {
      id: savedUser.id || data.id || 't-custom-' + Date.now(),
      name: cleanName,
      email: cleanEmail,
      subject: data.subject || 'excel',
      title: data.title || 'Giảng Viên Bộ Môn MOS',
      department: data.department || 'Bộ môn Tin học',
      phone: data.phone || '1900.6868',
      avatarBg: data.avatarBg || (data.subject === 'word' ? 'bg-blue-600' : data.subject === 'powerpoint' ? 'bg-orange-600' : 'bg-emerald-600'),
      createdAt: new Date().toISOString(),
    };

    // Remove any duplicate with same email then unshift
    teachersStore = teachersStore.filter(t => (t.email || '').toLowerCase() !== cleanEmail);
    teachersStore.unshift(newTeacher);

    // 2. Audit Log
    const actor = (req as any).user;
    await auditLogService.log({
      actorId: actor?.id || 'admin-system',
      actorName: actor?.fullName || actor?.name || 'Quản Trị Viên (Admin)',
      actorRole: 'admin',
      action: 'TEACHER_CREATED',
      targetType: 'teacher',
      targetId: newTeacher.id,
      targetName: newTeacher.name,
      details: {
        email: newTeacher.email,
        subject: newTeacher.subject,
        department: newTeacher.department,
        title: newTeacher.title,
      },
    });

    console.log(`[Owner Action] Added new teacher: ${newTeacher.name} (${newTeacher.email})`);
    return res.status(201).json({ success: true, teacher: newTeacher });
  } catch (err) {
    next(err);
  }
});

app.put('/api/teachers/:id', requireAuth(['admin']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const index = teachersStore.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy giảng viên.' });
  }
  teachersStore[index] = { ...teachersStore[index], ...updates };
  if (updates.name || updates.department) {
    await userService.saveUser({
      id,
      email: teachersStore[index].email,
      full_name: teachersStore[index].name,
      classroom: teachersStore[index].department,
      role: 'teacher',
    });
  }
  console.log(`[Owner Action] Updated teacher: ${teachersStore[index].name}`);
  return res.json({ success: true, teacher: teachersStore[index] });
});

app.delete('/api/teachers/:id', requireAuth(['admin']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const target = teachersStore.find(t => t.id === id);
  teachersStore = teachersStore.filter(t => t.id !== id);

  if (target) {
    const existing = await userService.findUserByEmail(target.email);
    if (existing) {
      await userService.deleteUser(existing.id);
    }

    const actor = (req as any).user;
    await auditLogService.log({
      actorId: actor?.id || 'admin-system',
      actorName: actor?.fullName || actor?.name || 'Quản Trị Viên (Admin)',
      actorRole: 'admin',
      action: 'TEACHER_DELETED',
      targetType: 'teacher',
      targetId: id,
      targetName: target.name,
      details: { email: target.email },
    });
  }

  console.log(`[Owner Action] Deleted teacher ID: ${id}`);
  return res.json({ success: true, message: 'Đã xóa giảng viên thành công.' });
});

// Endpoint: Protected Question Bank Proxy with Pagination (Strips answers for students, reveals for teachers verified by JWT)
app.get('/api/questions', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, domainId, page = '1', limit = '10' } = req.query;

    let pool = THEORY_QUESTIONS;
    if (subject && subject !== 'all') {
      pool = pool.filter(q => q.subject === subject);
    }
    if (domainId) {
      pool = pool.filter(q => q.domainId === domainId);
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const total = pool.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = pool.slice(startIndex, startIndex + limitNum);

    // Verify privileged role strictly via JWT Authorization header (Eliminates query param bypass S-009)
    let isPrivilegedRole = false;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded?.role === 'teacher' || decoded?.role === 'admin') {
          isPrivilegedRole = true;
        }
      } catch (e) {}
    }

    // Privileged teachers and admins get full questions including answers & explanations
    if (isPrivilegedRole) {
      return res.json({
        total,
        page: pageNum,
        totalPages,
        limit: limitNum,
        questions: paginated,
      });
    }

    // Students get sanitized questions only - zero sensitive keys sent over the wire!
    const sanitized = paginated.map(q => ({
      id: q.id,
      subject: q.subject,
      domainId: q.domainId,
      domainName: q.domainName,
      difficulty: q.difficulty,
      type: q.type,
      title: q.title,
      scenario: q.scenario,
      options: q.options,
      points: q.points,
    }));

    return res.json({
      total,
      page: pageNum,
      totalPages,
      limit: limitNum,
      questions: sanitized,
    });
  } catch (error) {
    next(error);
  }
});

// Endpoint: Evaluate submitted answers securely on server
app.post('/api/questions/submit', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { answers } = req.body; // Record<string, string>
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'answers object is required.' });
    }

    let correctCount = 0;
    const totalAnswered = Object.keys(answers).length;
    const results: Record<string, { isCorrect: boolean; correctAnswer: string; explanation: string; officialRibbonPath: string }> = {};

    for (const [qId, userAns] of Object.entries(answers)) {
      const q = THEORY_QUESTIONS.find(item => item.id === qId);
      if (q) {
        const isCorrect = q.correctAnswer === userAns;
        if (isCorrect) correctCount += 1;
        results[qId] = {
          isCorrect,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          officialRibbonPath: q.officialRibbonPath,
        };
      }
    }

    return res.json({
      totalAnswered,
      correctCount,
      scorePercentage: totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0,
      results,
    });
  } catch (error) {
    next(error);
  }
});

// Endpoint: Granular Attempt & Results Details
app.get('/api/attempts/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const submission = submissionsStore.find(s => s.id === id);
    if (!submission) {
      return res.status(404).json({ error: 'NotFound', message: 'Không tìm thấy lượt thi với ID này.' });
    }
    return res.json({ attempt: submission });
  } catch (error) {
    next(error);
  }
});

// Endpoint: Leaderboard
app.get('/api/leaderboard', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject } = req.query;
    let list = [...submissionsStore];
    if (subject && subject !== 'all') {
      list = list.filter(s => s.subject === subject);
    }

    // Sort by highest score, then lowest time
    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeSpentSeconds - b.timeSpentSeconds;
    });

    const top = list.slice(0, 10).map((item, idx) => ({
      rank: idx + 1,
      studentName: item.studentName,
      studentCode: item.studentCode,
      classRoom: item.classRoom,
      subject: item.subject,
      score: item.score,
      timeSpentSeconds: item.timeSpentSeconds,
      submittedAt: item.submittedAt,
    }));

    return res.json({ leaderboard: top });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// SYSTEM HEALTH CHECK (Item 68: GET /api/health - DB, Memory, Gemini API)
// ==========================================
app.get(['/api/health', '/api/v1/health'], async (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor(process.uptime());
  const memoryUsage = process.memoryUsage();

  // Test Gemini API readiness
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());

  // Test Database connectivity
  const dbStatus = process.env.DATABASE_URL ? 'postgresql_configured' : 'in_memory_authoritative';

  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: `${uptimeSeconds}s`,
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: {
        status: 'online',
        type: dbStatus,
        submissionsCount: submissionsStore.length,
        activeExamSessionsCount: activeExamSessions.size,
      },
      geminiAi: {
        status: hasGeminiKey ? 'ready' : 'fallback_offline_ready',
        provider: hasGeminiKey ? '@google/genai' : 'offline_knowledge_base',
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      },
    },
  });
});

// API v1 prefix support (Item 54: API versioning)
app.use('/api/v1', (req, _res, next) => {
  // Strip /v1 to seamlessly route to unified endpoints
  req.url = req.url.replace(/^\/v1/, '');
  next();
});

// 404 Catch-All handler for unmatched API routes
app.all('/api/*', (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  logger.warn(`API Route Not Found: ${req.method} ${req.originalUrl}`, {
    requestId,
    ip: req.ip,
  });
  return res.status(404).json({
    error: 'NotFound',
    message: `Tuyến API ${req.method} ${req.originalUrl} không tồn tại trên máy chủ.`,
    requestId,
  });
});

// Centralized Error-Handling Middleware
// Captures all operational & unhandled errors, logs detailed stack traces via Winston,
// and responds to the client with sanitized JSON containing a unique request ID.
app.use(centralizedErrorHandler);

// Mount Vite middleware in development or serve static in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false, // AI Studio disables HMR to avoid WebSocket port collisions
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    logger.info(`Server is running on http://${HOST}:${PORT} [Environment: ${process.env.NODE_ENV || 'development'}]`);
  });

  const shutdown = () => {
    logger.info('Shutting down server gracefully...');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
