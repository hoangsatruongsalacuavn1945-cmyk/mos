import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { aiRateLimiter, getUserQuotaInfo } from '../middleware/aiRateLimiter.ts';
import { generateOfflineMosAnswer } from '../services/aiFallbackService.ts';
import { 
  MOS_TUTOR_SYSTEM_INSTRUCTION, 
  ROLE_SYSTEM_INSTRUCTIONS,
  MOS_EXAM_EXPLANATION_PROMPT 
} from '../constants/aiPrompts.ts';

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

// Initialized with mandatory User-Agent header as required by SDK guidelines
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Route: POST /api/gemini/chat
 * Multi-turn Gemini chatbot proxy with Role System Instruction, Model Selector, & Google Search Grounding
 */
router.post('/chat', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { 
      messages, 
      subject, 
      systemRole = 'tutor',
      taskType = 'general', // 'general' | 'fast' | 'complex'
      enableSearch = true 
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required and must not be empty.' });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên môi trường server.',
      });
    }

    // Model selection based on task requirements:
    // - gemini-3.1-pro-preview for particularly complex tasks
    // - gemini-3.5-flash for general tasks
    // - gemini-3.1-flash-lite for tasks that should happen fast
    let model = 'gemini-3.5-flash';
    if (taskType === 'complex' || req.body.model === 'gemini-3.1-pro-preview') {
      model = 'gemini-3.1-pro-preview';
    } else if (taskType === 'fast' || req.body.model === 'gemini-3.1-flash-lite') {
      model = 'gemini-3.1-flash-lite';
    } else {
      model = 'gemini-3.5-flash';
    }

    // Role-specific System Instruction
    const baseInstruction = ROLE_SYSTEM_INSTRUCTIONS[systemRole] || MOS_TUTOR_SYSTEM_INSTRUCTION;
    const systemInstruction = `
${baseInstruction}

Môn học trọng tâm hiện tại: ${subject ? subject.toUpperCase() : 'Tất Cả Môn (Word, Excel, PowerPoint)'}
Quy tắc:
- Trả lời bằng tiếng Việt thân thiện, chuẩn xác thuật ngữ Microsoft và Certiport.
- Sử dụng định dạng Markdown phong phú (tiêu đề, in đậm, danh sách, khối mã code cho công thức hàm Excel).
- Chỉ dẫn rõ ràng vị trí trên thanh Ribbon (ví dụ: Home > Styles hoặc Insert > Illustrations > SmartArt).
- Nếu có phím tắt thông dụng, hãy nêu bật phím tắt đó.
`.trim();

    // Map conversation history into multi-turn contents format
    // Ensure alternating user and model turns, starting with user
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }],
    }));

    // Configure tools: Enable Google Search Grounding for gemini-3.5-flash
    const tools: any[] = [];
    if (enableSearch && model === 'gemini-3.5-flash') {
      tools.push({ googleSearch: {} });
    }

    const config: any = {
      systemInstruction,
      temperature: 0.7,
    };

    if (tools.length > 0) {
      config.tools = tools;
    }

    // Call @google/genai SDK
    const response = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    const replyText = response.text || 'Xin lỗi, tôi chưa nhận được câu trả lời phù hợp.';

    // Extract Google Search Grounding citations & metadata
    const candidate = response.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries = candidate?.groundingMetadata?.webSearchQueries || [];

    const groundingSources = groundingChunks
      .filter((chunk: any) => chunk.web && chunk.web.uri)
      .map((chunk: any) => ({
        title: chunk.web.title || 'Nguồn tham khảo Google Search',
        uri: chunk.web.uri,
      }));

    return res.json({
      reply: replyText,
      modelUsed: model,
      taskType,
      systemRole,
      groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
      searchQueries: webSearchQueries.length > 0 ? webSearchQueries : undefined,
    });

  } catch (error: any) {
    console.error('[AI Proxy Error] /api/gemini/chat failed:', error?.message);

    // Graceful offline fallback when Gemini quota is exhausted or network fails
    const lastUserMessage = req.body?.messages?.[req.body.messages.length - 1]?.content || '';
    const subject = req.body?.subject || '';
    const fallbackAnswer = generateOfflineMosAnswer(lastUserMessage, subject);

    return res.json({
      reply: fallbackAnswer,
      isFallback: true,
      modelUsed: 'offline-knowledge-base',
      notice: 'Hệ thống đang hoạt động với Cơ Sở Tri Thức Khảo Thí MOS Tích Hợp (Hạn mức Gemini Cloud tạm thời bận).',
    });
  }
});

/**
 * Route: POST /api/gemini/explain-question
 * Detailed explanation proxy for specific question review (Uses gemini-3.5-flash with Search Grounding)
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
4. Trình bày ngắn gọn, sư phạm, chuyên nghiệp bằng tiếng Việt với định dạng Markdown.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        systemInstruction: MOS_EXAM_EXPLANATION_PROMPT,
        tools: [{ googleSearch: {} }],
        temperature: 0.5,
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingSources = chunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({
        title: c.web.title || 'Tài liệu Microsoft Docs',
        uri: c.web.uri,
      }));

    return res.json({ 
      explanation: response.text,
      groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
    });
  } catch (error: any) {
    console.error('[AI Proxy Error] /api/gemini/explain-question failed:', error);
    return res.status(500).json({
      error: error?.message || 'Có lỗi xảy ra khi yêu cầu giải thích câu hỏi từ AI.',
    });
  }
});

/**
 * Route: POST /api/gemini/generate-practice
 * Dynamic practice task generator proxy (Uses gemini-3.5-flash)
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
      model: 'gemini-3.5-flash',
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
 * Diagnostic analysis proxy for student weak areas (Uses gemini-3.5-flash)
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
      model: 'gemini-3.5-flash',
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
