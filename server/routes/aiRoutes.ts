import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { aiRateLimiter, getUserQuotaInfo } from '../middleware/aiRateLimiter.ts';
import { generateOfflineMosAnswer } from '../services/aiFallbackService.ts';

dotenv.config();

const router = Router();

// Endpoint to inspect remaining daily credits
router.get('/credits', (req: Request, res: Response) => {
  const info = getUserQuotaInfo(req);
  return res.json(info);
});

// Securely access API key EXCLUSIVELY on the server side from process.env
const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn('[Security Warning] GEMINI_API_KEY is not defined in server environment variables.');
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build-server',
    },
  },
});

const MOS_TUTOR_SYSTEM_INSTRUCTION = `
Bạn là "MOS Master AI" - Chuyên gia và Giảng viên Huấn Luyện Chứng Chỉ Tin Học Quốc Tế Microsoft Office Specialist (MOS Word, MOS Excel, MOS PowerPoint) theo chuẩn khảo thí quốc tế Certiport và IIG.

Nhiệm vụ của bạn:
1. Giải đáp các thắc mắc của học sinh về lý thuyết và thực hành MOS.
2. Hướng dẫn các thao tác chuẩn trên thanh Ribbon (Tab > Group > Command) và phím tắt hiệu quả.
3. Giải thích cặn kẽ các công thức và hàm Excel (VLOOKUP, INDEX/MATCH, XLOOKUP, IF, SUMIFS, COUNTIF, CONCAT...), cách khắc phục lỗi (#N/A, #VALUE!, #REF!).
4. Cảnh báo các "bẫy" hay gặp trong phòng thi MOS Certiport thực tế.
5. Giọng điệu sư phạm thân thiện, tích cực, khuyến khích học sinh, dùng định dạng Markdown rõ ràng, dễ đọc (bullet points, bold, code block cho công thức).
`;

/**
 * Route: POST /api/gemini/chat
 * General AI tutor conversation proxy with Rate Limiting and Token Quota
 */
router.post('/chat', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { messages, subject } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên môi trường server.',
      });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const conversationHistory = messages
      .slice(0, -1)
      .map(m => `${m.role === 'user' ? 'Học sinh' : 'Gia sư MOS'}: ${m.content}`)
      .join('\n');

    const promptText = `
Ngữ cảnh môn học đang ôn tập: ${subject || 'Tất cả (Word, Excel, PowerPoint)'}

Lịch sử trò chuyện trước đó:
${conversationHistory}

Câu hỏi mới nhất của học sinh:
"${lastUserMessage}"

Hãy trả lời chi tiết, súc tích và chuẩn xác theo phong cách chuyên gia MOS Certiport.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: promptText,
      config: {
        systemInstruction: MOS_TUTOR_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return res.json({ reply: response.text });
  } catch (error: any) {
    console.error('[AI Proxy Error] /api/gemini/chat failed:', error?.message);

    // Graceful fallback when Gemini quota/billing is exhausted or network fails
    const lastUserMessage = req.body?.messages?.[req.body.messages.length - 1]?.content || '';
    const subject = req.body?.subject || '';
    const fallbackAnswer = generateOfflineMosAnswer(lastUserMessage, subject);

    return res.json({
      reply: fallbackAnswer,
      isFallback: true,
      notice: 'Hệ thống đang hoạt động với Cơ Sở Tri Thức Khảo Thí MOS Tích Hợp (Hạn mức Gemini Cloud tạm thời bận).',
    });
  }
});

/**
 * Route: POST /api/gemini/explain-question
 * Detailed explanation proxy for specific question review
 */
router.post('/explain-question', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { question, userAnswer, isCorrect } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question data is required.' });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên môi trường server.',
      });
    }

    const promptText = `
Hãy đóng vai Giảng viên Chuyên gia MOS Certiport. Học sinh vừa làm một câu hỏi khảo thí như sau:

- Tiêu đề câu hỏi: "${question.title}"
- Bối cảnh tình huống: "${question.scenario || 'N/A'}"
- Các phương án lựa chọn: ${JSON.stringify(question.options)}
- Phương án học sinh đã chọn: "${userAnswer || 'Chưa chọn'}"
- Kết quả: ${isCorrect ? 'CHÍNH XÁC' : 'CHƯA CHÍNH XÁC'}
- Đáp án chuẩn của đề thi: "${question.correctAnswer || 'N/A'}"
- Đường dẫn thao tác Ribbon chuẩn: "${question.officialRibbonPath || 'N/A'}"

Yêu cầu phân tích:
1. Tại sao đáp án trên lại là chuẩn xác nhất theo chuẩn Microsoft Office Specialist?
2. Phân tích chi tiết đường dẫn trên thanh Ribbon và các phím tắt thay thế tương đương.
3. Nếu học sinh làm sai, hãy chỉ ra bẫy thi thường gặp của câu này và mẹo ghi nhớ để không bị trừ điểm trong phòng thi thật.
4. Trình bày ngắn gọn, sư phạm, chuyên nghiệp bằng tiếng Việt.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: promptText,
      config: {
        systemInstruction: MOS_TUTOR_SYSTEM_INSTRUCTION,
        temperature: 0.6,
      },
    });

    return res.json({ explanation: response.text });
  } catch (error: any) {
    console.error('[AI Proxy Error] /api/gemini/explain-question failed:', error);
    return res.status(500).json({
      error: error?.message || 'Có lỗi xảy ra khi yêu cầu giải thích câu hỏi từ AI.',
    });
  }
});

/**
 * Route: POST /api/gemini/generate-practice
 * Dynamic practice task generator proxy
 */
router.post('/generate-practice', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { subject, difficulty, domainName, customPrompt } = req.body;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên môi trường server.',
      });
    }

    const promptText = `
Tạo một bài tập thực hành MOS thực tế theo format đề thi Certiport 2019/365:
- Môn học: ${subject || 'Excel'}
- Độ khó: ${difficulty || 'medium'}
- Nhóm kỹ năng (Domain): ${domainName || 'Tổng quát'}
- Yêu cầu thêm: ${customPrompt || 'Tạo tình huống văn phòng thực tế'}

Hãy trả về kết quả theo định dạng JSON hợp lệ duy nhất với cấu trúc sau:
{
  "title": "Tên bài thực hành ngắn gọn",
  "scenario": "Mô tả bối cảnh doanh nghiệp và mục tiêu cần giải quyết",
  "tasks": [
    {
      "taskNumber": 1,
      "instruction": "Yêu cầu chi tiết thao tác",
      "targetRibbon": "Tab > Group > Command",
      "shortcutHint": "Phím tắt nếu có",
      "expectedResult": "Kết quả sau khi hoàn thành"
    }
  ],
  "tips": "Mẹo tránh bẫy Certiport"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: promptText,
      config: {
        systemInstruction: MOS_TUTOR_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    try {
      const parsed = JSON.parse(response.text || '{}');
      return res.json({ practice: parsed });
    } catch {
      return res.json({ practice: { rawText: response.text } });
    }
  } catch (error: any) {
    console.error('[AI Proxy Error] /api/gemini/generate-practice failed:', error);
    return res.status(500).json({
      error: error?.message || 'Có lỗi xảy ra khi tạo đề thực hành từ AI.',
    });
  }
});

/**
 * Route: POST /api/gemini/diagnose-weakness
 * Diagnostic analysis proxy for student weak areas
 */
router.post('/diagnose-weakness', async (req: Request, res: Response) => {
  try {
    const { examResult, studentName } = req.body;
    if (!examResult) {
      return res.status(400).json({ error: 'Exam result data is required.' });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên môi trường server.',
      });
    }

    const promptText = `
Học sinh: ${studentName || 'Thí sinh'}
Môn thi: ${examResult.subject}
Điểm thi Certiport đạt được: ${examResult.score}/1000 (${examResult.passed ? 'ĐẠT' : 'CHƯA ĐẠT'})
Thời gian làm bài: ${Math.round(examResult.timeSpentSeconds / 60)} phút
Thống kê điểm theo từng nhóm kỹ năng:
${JSON.stringify(examResult.domainScores, null, 2)}

Danh sách các câu làm sai:
${JSON.stringify(examResult.wrongQuestions?.map((w: any) => ({ title: w.title, domain: w.domainName, userAnswer: w.userAnswerText })), null, 2)}

Hãy đưa ra:
1. Lời khen ngợi và đánh giá khách quan về kết quả.
2. Điểm yếu cốt lõi cần khắc phục gấp trước ngày thi chính thức.
3. Kế hoạch ôn tập cá nhân hóa 3 ngày cụ thể.
4. Dự báo khả năng đỗ chứng chỉ thực tế nếu khắc phục được các lỗi trên.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction: MOS_TUTOR_SYSTEM_INSTRUCTION,
        temperature: 0.6,
      },
    });

    return res.json({ diagnosis: response.text });
  } catch (error: any) {
    console.error('[AI Proxy Error] /api/gemini/diagnose-weakness failed:', error);
    return res.status(500).json({
      error: error?.message || 'Có lỗi xảy ra khi chẩn đoán điểm yếu từ AI.',
    });
  }
});

export default router;
