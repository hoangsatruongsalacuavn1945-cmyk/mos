import { Router, Request, Response } from 'express';
import { studyLoggerService } from '../services/studyLoggerService.ts';

const router = Router();

/**
 * POST /api/logs/quiz-attempt
 * Logs student quiz/exam attempt to PostgreSQL database
 */
router.post('/quiz-attempt', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      subject,
      quizType,
      score,
      totalScore,
      percentage,
      passed,
      correctCount,
      totalQuestions,
      timeSpentSeconds,
      notes,
      details,
    } = req.body;

    if (!userId || !subject || score === undefined) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: userId, subject, score.' });
    }

    const saved = await studyLoggerService.logQuizAttempt({
      userId,
      userName: userName || 'Học viên MOS',
      userEmail: userEmail || 'hocvien@student.edu.vn',
      subject,
      quizType: quizType || 'mock-exam',
      score: Number(score),
      totalScore: Number(totalScore || 1000),
      percentage: percentage !== undefined ? Number(percentage) : undefined,
      passed: passed !== undefined ? Boolean(passed) : undefined,
      correctCount: correctCount !== undefined ? Number(correctCount) : undefined,
      totalQuestions: totalQuestions !== undefined ? Number(totalQuestions) : undefined,
      timeSpentSeconds: timeSpentSeconds !== undefined ? Number(timeSpentSeconds) : undefined,
      notes,
      details,
    });

    // Also record in unified activity log
    await studyLoggerService.logUnifiedActivity({
      userId: saved.userId,
      userName: saved.userName,
      userEmail: saved.userEmail,
      role: 'Học viên',
      category: 'Khảo Thí & Thi Thử',
      action: 'Nộp bài thi thử / Quiz',
      subject: `${saved.subject.toUpperCase()} Certiport`,
      details: `Đạt ${saved.score}/${saved.totalScore} (${saved.percentage}%) - ${saved.passed ? 'ĐẠT CHUẨN CERTIPORT' : 'CHƯA ĐẠT'}. Đúng ${saved.correctCount || 0}/${saved.totalQuestions || 0} câu.`,
      status: saved.passed ? 'Đạt Chuẩn Certiport' : 'Chưa Đạt',
      scoreMetric: `${saved.score}/${saved.totalScore} (${saved.percentage}%)`,
      details_extra: details,
    } as any);

    return res.json({ success: true, record: saved });
  } catch (error: any) {
    console.error('[API Log Quiz Attempt Error]:', error);
    return res.status(500).json({ error: error.message || 'Lỗi lưu bài thi vào CSDL PostgreSQL.' });
  }
});

/**
 * POST /api/logs/progress-update
 * Logs curriculum progress update to PostgreSQL database
 */
router.post('/progress-update', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      subject,
      lessonId,
      lessonTitle,
      completionPercentage,
      totalLessonsCompleted,
      streakDays,
      details,
    } = req.body;

    if (!userId || !subject) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: userId, subject.' });
    }

    const saved = await studyLoggerService.logProgressUpdate({
      userId,
      userName: userName || 'Học viên MOS',
      userEmail: userEmail || 'hocvien@student.edu.vn',
      subject,
      lessonId,
      lessonTitle,
      completionPercentage: Number(completionPercentage || 0),
      totalLessonsCompleted: Number(totalLessonsCompleted || 0),
      streakDays: Number(streakDays || 1),
      details,
    });

    // Also record unified log
    await studyLoggerService.logUnifiedActivity({
      userId: saved.userId,
      userName: saved.userName,
      userEmail: saved.userEmail,
      role: 'Học viên',
      category: 'Bài Học Giáo Trình',
      action: 'Cập nhật tiến độ học tập',
      subject: saved.subject.toUpperCase(),
      details: `Cập nhật tiến độ môn ${saved.subject.toUpperCase()}: ${saved.completionPercentage}%. Hoàn thành ${saved.totalLessonsCompleted || 0} bài học. Chuỗi streak: ${saved.streakDays || 1} ngày.`,
      status: 'Thành Công',
      scoreMetric: `${saved.completionPercentage}%`,
    });

    return res.json({ success: true, record: saved });
  } catch (error: any) {
    console.error('[API Log Progress Update Error]:', error);
    return res.status(500).json({ error: error.message || 'Lỗi lưu tiến độ học tập vào PostgreSQL.' });
  }
});

/**
 * POST /api/logs/study-session
 * Logs or updates user study/login session in PostgreSQL database
 */
router.post('/study-session', async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      userId,
      userName,
      userEmail,
      role,
      sessionType,
      startedAt,
      endedAt,
      durationSeconds,
      deviceInfo,
      ipAddress,
      details,
    } = req.body;

    if (!sessionId || !userId) {
      return res.status(400).json({ error: 'Thiếu sessionId hoặc userId.' });
    }

    const saved = await studyLoggerService.logStudySession({
      sessionId,
      userId,
      userName: userName || 'Học viên',
      userEmail: userEmail || 'hocvien@student.edu.vn',
      role: role || 'student',
      sessionType: sessionType || 'study',
      startedAt,
      endedAt,
      durationSeconds: durationSeconds !== undefined ? Number(durationSeconds) : undefined,
      deviceInfo,
      ipAddress: ipAddress || req.ip,
      details,
    });

    return res.json({ success: true, record: saved });
  } catch (error: any) {
    console.error('[API Log Study Session Error]:', error);
    return res.status(500).json({ error: error.message || 'Lỗi lưu phiên học vào PostgreSQL.' });
  }
});

/**
 * POST /api/logs/activity
 * Logs granular unified activity
 */
router.post('/activity', async (req: Request, res: Response) => {
  try {
    const {
      id,
      timestampVn,
      userId,
      userName,
      userEmail,
      role,
      category,
      action,
      subject,
      details,
      status,
      scoreMetric,
      sessionId,
      deviceInfo,
      rawMetadata,
    } = req.body;

    if (!userId || !category || !action || !details) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: userId, category, action, details.' });
    }

    const saved = await studyLoggerService.logUnifiedActivity({
      id,
      timestampVn,
      userId,
      userName: userName || 'Học viên MOS',
      userEmail: userEmail || 'hocvien@student.edu.vn',
      role: role || 'Học viên',
      category,
      action,
      subject: subject || 'Toàn Hệ Thống',
      details,
      status: status || 'Thành Công',
      scoreMetric,
      sessionId,
      deviceInfo,
      rawMetadata,
    });

    return res.json({ success: true, record: saved });
  } catch (error: any) {
    console.error('[API Log Activity Error]:', error);
    return res.status(500).json({ error: error.message || 'Lỗi lưu nhật ký hoạt động.' });
  }
});

/**
 * GET /api/logs/user/:userId
 * Get user logs from PostgreSQL
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userLogs = await studyLoggerService.getUserLogs(userId);
    return res.json({ success: true, ...userLogs });
  } catch (error: any) {
    console.error('[API Get User Logs Error]:', error);
    return res.status(500).json({ error: error.message || 'Lỗi truy xuất dữ liệu từ CSDL.' });
  }
});

/**
 * GET /api/logs/stats
 * Get overall summary stats
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await studyLoggerService.getSummaryStats();
    return res.json({ success: true, stats });
  } catch (error: any) {
    console.error('[API Get Stats Error]:', error);
    return res.status(500).json({ error: error.message || 'Lỗi tính toán thống kê.' });
  }
});

export default router;
