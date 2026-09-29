import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { THEORY_QUESTIONS } from './src/data/theoryQuestions.ts';
import aiRoutes from './server/routes/aiRoutes.ts';
import authRouter from './server/auth.js';
import adminRoutes from './server/routes/adminRoutes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.NODE_ENV === 'production' && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// Mount modular Auth, Admin & AI Proxy routers
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/gemini', aiRoutes);

// Initialize GoogleGenAI client according to SKILL guidelines
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System instruction for MOS Master AI Tutor
const MOS_TUTOR_SYSTEM_INSTRUCTION = `
Bạn là "MOS Master AI" - Chuyên gia và Giảng viên Huấn Luyện Chứng Chỉ Tin Học Quốc Tế Microsoft Office Specialist (MOS Word, MOS Excel, MOS PowerPoint) theo chuẩn khảo thí quốc tế Certiport và IIG.

Nhiệm vụ của bạn:
1. Giải đáp các thắc mắc của học sinh về lý thuyết và thực hành MOS.
2. Hướng dẫn các thao tác chuẩn trên thanh Ribbon (Tab > Group > Command) và phím tắt hiệu quả.
3. Giải thích cặn kẽ các công thức và hàm Excel (VLOOKUP, INDEX/MATCH, XLOOKUP, IF, SUMIFS, COUNTIF, CONCAT...), cách khắc phục lỗi (#N/A, #VALUE!, #REF!).
4. Cảnh báo các "bẫy" hay gặp trong phòng thi MOS Certiport thực tế.
5. Giọng điệu sư phạm thân thiện, tích cực, khuyến khích học sinh, dùng định dạng Markdown rõ ràng, dễ đọc (bullet points, bold, code block cho công thức).
`;

// Endpoint 1: General MOS AI Chat
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { messages, subject } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên hệ thống.',
      });
    }

    // Convert messages to prompt / history
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const conversationHistory = messages.slice(0, -1).map(m => `${m.role === 'user' ? 'Học sinh' : 'Gia sư MOS'}: ${m.content}`).join('\n');

    const promptText = `
Ngữ cảnh môn học đang ôn tập: ${subject || 'Tất cả (Word, Excel, PowerPoint)'}

Lịch sử trò chuyện trước đó:
${conversationHistory}

Câu hỏi mới nhất của học sinh:
"${lastUserMessage}"

Hãy trả lời chi tiết, súc tích và chuẩn xác theo phong cách chuyên gia MOS Certiport.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction: MOS_TUTOR_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Error calling Gemini chat API:', error);
    return res.status(500).json({
      error: error?.message || 'Có lỗi xảy ra khi xử lý yêu cầu AI.',
    });
  }
});

// Endpoint 2: Deep Explanation for a Specific Question
app.post('/api/gemini/explain-question', async (req: Request, res: Response) => {
  try {
    const { question, userAnswer, isCorrect } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question data is required.' });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên hệ thống.',
      });
    }

    const prompt = `
Phân tích chuyên sâu câu hỏi thi MOS sau:
- Môn thi: MOS ${question.subject?.toUpperCase()}
- Mục tiêu kiến thức (Domain): ${question.domainName}
- Tên câu hỏi: ${question.title}
- Tình huống đề bài (Scenario): ${question.scenario || 'Không có'}
- Các lựa chọn đáp án:
${question.options?.map((opt: any) => `  * [${opt.id.toUpperCase()}]: ${opt.text}`).join('\n')}
- Đáp án đúng chuẩn: [${question.correctAnswer?.toUpperCase()}]
- Người học đã chọn: [${userAnswer ? userAnswer.toUpperCase() : 'Chưa chọn'}] (Kết quả: ${isCorrect ? 'ĐÚNG' : 'SAI'})
- Đường dẫn Ribbon chuẩn: ${question.officialRibbonPath}

Hãy cung cấp:
1. 🎯 **Bản chất cốt lõi**: Tại sao thao tác này lại quan trọng trong thực tế và đề thi MOS?
2. 🔍 **Phân tích vì sao đáp án đúng**: Hướng dẫn chi tiết từng bước trên thanh Ribbon.
3. ⚠️ **Bẫy thi Certiport thường gặp**: Lỗi sai phổ biến mà thí sinh hay mắc phải ở dạng câu này.
4. 💡 **Mẹo làm bài siêu tốc**: Phím tắt hoặc cách nhớ nhanh.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: MOS_TUTOR_SYSTEM_INSTRUCTION,
        temperature: 0.5,
      },
    });

    return res.json({ analysis: response.text });
  } catch (error: any) {
    console.error('Error explaining question with Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Có lỗi xảy ra khi phân tích câu hỏi với AI.',
    });
  }
});

// Endpoint 3: Generate Custom MOS Practice Task / Scenario
app.post('/api/gemini/generate-practice', async (req: Request, res: Response) => {
  try {
    const { subject, topic } = req.body;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên hệ thống.',
      });
    }

    const prompt = `
Hãy tạo một tình huống thực hành mô phỏng đề thi MOS Certiport mới cho môn: MOS ${subject?.toUpperCase() || 'EXCEL'}.
Chủ đề mong muốn: ${topic || 'Ngẫu nhiên trong chương trình thi'}.

Yêu cầu xuất ra theo định dạng JSON với cấu trúc sau:
{
  "scenarioTitle": "Tên tình huống đề bài",
  "context": "Mô tả bối cảnh tài liệu/bảng tính/bài trình chiếu",
  "tasks": [
    {
      "taskNumber": 1,
      "instruction": "Yêu cầu thao tác cụ thể chuẩn phong cách đề thi Certiport",
      "ribbonPath": "Tab > Group > Command",
      "hint": "Gợi ý nhanh cách thực hiện"
    }
  ],
  "learningPoints": "Kiến thức trọng tâm rút ra"
}

Chỉ trả về JSON thuần túy, không có markdown codeblock \`\`\`json.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: MOS_TUTOR_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    let parsedData = {};
    try {
      parsedData = JSON.parse(response.text || '{}');
    } catch {
      parsedData = { rawText: response.text };
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error generating practice with Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Có lỗi xảy ra khi tạo đề thi với AI.',
    });
  }
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
}

const activeExamSessions = new Map<string, ActiveExamSession>();

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

// Endpoint: Start new exam session with sanitized questions (No answers exposed to client!)
app.post('/api/exam/start', (req: Request, res: Response) => {
  try {
    const { subject = 'all', studentId, studentName, studentCode } = req.body;
    let pool = THEORY_QUESTIONS;
    if (subject && subject !== 'all') {
      pool = THEORY_QUESTIONS.filter(q => q.subject === subject);
    }
    if (pool.length === 0) pool = THEORY_QUESTIONS;

    // Shuffle and pick 15 questions (or up to pool size)
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
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
  } catch (err: any) {
    console.error('Error starting exam session:', err);
    return res.status(500).json({ error: err?.message || 'Lỗi khởi tạo kỳ thi.' });
  }
});

// Endpoint: Anti-Cheat Violation event logger
app.post('/api/exam/violation', (req: Request, res: Response) => {
  try {
    const { sessionId, reason, timestamp } = req.body;
    const session = activeExamSessions.get(sessionId);
    if (session) {
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
    }
    return res.json({ success: false, message: 'Session not active' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// Endpoint: Submit exam with server-side authoritative grading
app.post('/api/exam/submit', (req: Request, res: Response) => {
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

    const session = activeExamSessions.get(sessionId);
    const questionIds = session ? session.questionIds : Object.keys(userAnswers);
    const questions = questionIds.map(id => THEORY_QUESTIONS.find(q => q.id === id)).filter(Boolean) as typeof THEORY_QUESTIONS;

    let totalScore = 0;
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

    const totalQ = questions.length || 1;
    // Standard Certiport MOS scale: 1000 max score, 700 passing score
    totalScore = Math.round((correctCount / totalQ) * 1000);
    const passed = totalScore >= 700;

    const finalViolations = Math.max(violationsCount, session?.violationsCount || 0);
    const finalLogs = antiCheatLogs.length > 0 ? antiCheatLogs : (session?.antiCheatLogs || []);

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
  } catch (err: any) {
    console.error('Error submitting exam:', err);
    return res.status(500).json({ error: err?.message || 'Lỗi khi chấm điểm bài thi.' });
  }
});

// Endpoint: Submit exam/practice result from student
app.post('/api/submissions', (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error('Error in /api/submissions:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi khi lưu bài nộp.' });
  }
});

// Endpoint: Get submissions filtered by teacher, student, subject
app.get('/api/submissions', (req: Request, res: Response) => {
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
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Lỗi tải danh sách bài nộp.' });
  }
});

// Endpoint: Teacher adds feedback/grade for a submission
app.post('/api/submissions/:id/feedback', (req: Request, res: Response) => {
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
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Lỗi lưu nhận xét giáo viên.' });
  }
});

// ==========================================
// OWNER TEACHER MANAGEMENT (CRUD)
// ==========================================
let teachersStore = [
  {
    id: 't-word-01',
    name: 'ThS. Nguyễn Tuấn Anh',
    email: 'tuananh.mosword@edu.vn',
    subject: 'word',
    title: 'Trưởng Bộ Môn MOS Word (MO-100)',
    department: 'Khoa Tin học Ứng dụng & Khảo thí Quốc tế',
    phone: '0912.345.678',
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
    phone: '0988.765.432',
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
    phone: '0933.112.233',
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
    phone: '0903.999.888',
    avatarBg: 'bg-indigo-700',
    createdAt: new Date().toISOString(),
  },
];

app.get('/api/teachers', (_req: Request, res: Response) => {
  return res.json({ teachers: teachersStore });
});

app.post('/api/teachers', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.name || !data.email) {
      return res.status(400).json({ error: 'Tên và email giảng viên là bắt buộc.' });
    }
    const newTeacher = {
      id: data.id || 't-custom-' + Date.now(),
      name: data.name,
      email: data.email,
      subject: data.subject || 'excel',
      title: data.title || 'Giảng Viên Bộ Môn MOS',
      department: data.department || 'Bộ môn Tin học',
      phone: data.phone || '0900.000.000',
      avatarBg: data.avatarBg || 'bg-blue-600',
      createdAt: new Date().toISOString(),
    };
    teachersStore.unshift(newTeacher);
    console.log(`[Owner Action] Added new teacher: ${newTeacher.name} (${newTeacher.email})`);
    return res.status(201).json({ success: true, teacher: newTeacher });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/teachers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const index = teachersStore.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy giảng viên.' });
  }
  teachersStore[index] = { ...teachersStore[index], ...updates };
  console.log(`[Owner Action] Updated teacher: ${teachersStore[index].name}`);
  return res.json({ success: true, teacher: teachersStore[index] });
});

app.delete('/api/teachers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = teachersStore.length;
  teachersStore = teachersStore.filter(t => t.id !== id);
  if (teachersStore.length === initialLen) {
    return res.status(404).json({ error: 'Không tìm thấy giảng viên để xóa.' });
  }
  console.log(`[Owner Action] Deleted teacher ID: ${id}`);
  return res.json({ success: true, message: 'Đã xóa giảng viên thành công.' });
});

// Endpoint: Protected Question Bank Proxy (Strips answers for students, reveals for teachers)
app.get('/api/questions', (req: Request, res: Response) => {
  try {
    const { subject, domainId, role = 'student' } = req.query;

    let pool = THEORY_QUESTIONS;
    if (subject && subject !== 'all') {
      pool = pool.filter(q => q.subject === subject);
    }
    if (domainId) {
      pool = pool.filter(q => q.domainId === domainId);
    }

    // Role-based data projection:
    // Teachers/Admins get full questions including answers & explanations
    if (role === 'teacher' || role === 'admin') {
      return res.json({
        total: pool.length,
        questions: pool,
      });
    }

    // Students get sanitized questions only - zero sensitive keys sent over the wire!
    const sanitized = pool.map(q => ({
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
      total: sanitized.length,
      questions: sanitized,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Lỗi truy vấn ngân hàng câu hỏi.' });
  }
});

// Endpoint: Granular Attempt & Results Details
app.get('/api/attempts/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const submission = submissionsStore.find(s => s.id === id);
    if (!submission) {
      return res.status(404).json({ error: 'Không tìm thấy lượt thi với ID này.' });
    }
    return res.json({ attempt: submission });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Lỗi truy xuất chi tiết lượt thi.' });
  }
});

// Endpoint: Leaderboard
app.get('/api/leaderboard', (req: Request, res: Response) => {
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
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Lỗi tải bảng vàng.' });
  }
});

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
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });

  const shutdown = () => {
    console.log('Shutting down server gracefully...');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
