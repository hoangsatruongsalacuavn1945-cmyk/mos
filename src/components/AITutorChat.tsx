import React, { useState, useRef, useEffect } from 'react';
import { MOSSubject } from '../types/mos';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Check, 
  HelpCircle, 
  Lightbulb, 
  MessageSquare,
  Globe,
  ExternalLink,
  Zap,
  Brain,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { soundManager } from '../utils/audio';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  groundingSources?: GroundingSource[];
}

interface AITutorChatProps {
  selectedSubject?: MOSSubject;
}

const STORAGE_KEY = 'mos_gemini_multi_turn_history';

const ROLES = [
  {
    id: 'tutor',
    name: 'Gia Sư Toàn Năng',
    desc: 'Giải thích cặn kẽ từng bước, thân thiện, bao quát 3 môn Word, Excel, PPT.',
    icon: Bot,
    badge: 'Khuyên Dùng',
  },
  {
    id: 'examiner',
    name: 'Giám Khảo Khảo Thí',
    desc: 'Chiến thuật thi 50 phút, các bẫy trừ điểm ngầm của Certiport và mẹo bấm lệnh nhanh.',
    icon: ShieldCheck,
    badge: 'Chiến Thuật',
  },
  {
    id: 'excel_specialist',
    name: 'Chuyên Gia Hàm Excel',
    desc: 'Chuyên sâu hàm logic, mảng động, XLOOKUP, VLOOKUP, INDEX/MATCH, sửa lỗi #N/A.',
    icon: Zap,
    badge: 'Excel MO-200',
  },
  {
    id: 'designer',
    name: 'Thiết Kế Word & PPT',
    desc: 'Chuyên Slide Master, Morph, Section Breaks, Mail Merge và chuẩn hóa văn bản.',
    icon: Sparkles,
    badge: 'Word & PPT',
  },
];

const MODELS = [
  {
    id: 'gemini-3.5-flash',
    taskType: 'general',
    name: 'Gemini 3.5 Flash',
    label: 'Tiêu Chuẩn (Có Google Search)',
    desc: 'Nhanh, thông minh, hỗ trợ tra cứu thời gian thực bằng Google Search Grounding.',
    badge: 'Khuyên dùng',
  },
  {
    id: 'gemini-3.1-flash-lite',
    taskType: 'fast',
    name: 'Gemini 3.1 Flash-Lite',
    label: 'Tốc Độ Cao (Fast)',
    desc: 'Phản hồi cực nhanh, tối ưu hóa độ trễ cho các câu hỏi ngắn.',
    badge: 'Siêu Tốc',
  },
  {
    id: 'gemini-3.1-pro-preview',
    taskType: 'complex',
    name: 'Gemini 3.1 Pro Preview',
    label: 'Chuyên Sâu (Complex Reasoning)',
    desc: 'Lý luận đa bước chuyên sâu, phân tích tình huống phức tạp trong đề thi MOS.',
    badge: 'Chuyên Sâu',
  },
];

const QUICK_PROMPTS = [
  {
    subject: 'excel',
    label: 'Hàm VLOOKUP & XLOOKUP',
    prompt: 'So sánh sự khác nhau giữa VLOOKUP và XLOOKUP trong đề thi Excel MO-200. Khi nào nên dùng hàm nào và cú pháp chuẩn ra sao?',
  },
  {
    subject: 'excel',
    label: 'Bẫy tính toán Hàm IF & AND/OR',
    prompt: 'Hướng dẫn lồng hàm IF với AND hoặc OR trong Excel để phân loại điểm học sinh chuẩn đề thi Certiport.',
  },
  {
    subject: 'word',
    label: 'Section Break vs Page Break',
    prompt: 'Sự khác biệt giữa Page Break và Section Break (Next Page) trong Word là gì? Khi nào bắt buộc dùng Section Break?',
  },
  {
    subject: 'word',
    label: 'Trộn Thư (Mail Merge) Bước-Từng-Bước',
    prompt: 'Nêu các bước thực hiện Mail Merge từ danh sách Excel sang Word chuẩn xác không bị lỗi font chữ hoặc sai trường.',
  },
  {
    subject: 'powerpoint',
    label: 'Slide Master & Chèn Logo',
    prompt: 'Cách chèn Logo vào Slide Master để hiển thị trên tất cả slide trừ slide tiêu đề đầu tiên theo yêu cầu đề thi MO-300.',
  },
  {
    subject: 'powerpoint',
    label: 'Hiệu Ứng Chuyển Động Morph',
    prompt: 'Điều kiện để hiệu ứng Morph hoạt động chính xác trong PowerPoint là gì? Cần đặt tên object như thế nào?',
  },
];

export const AITutorChat: React.FC<AITutorChatProps> = ({ selectedSubject = 'all' }) => {
  // Load conversation history from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Xin chào! Tôi là **Gia Sư Trợ Giảng Gemini AI** của nền tảng luyện thi MOS Master (Word MO-100, Excel MO-200, PowerPoint MO-300).

Tôi được tích hợp:
- ⚡ **Đa vai trò chuyên môn hóa** (Gia sư, Giám khảo chiến thuật 50P, Chuyên gia Excel, Chuyên gia Thiết kế)
- 🌐 **Google Search Grounding** tra cứu thông tin và phím tắt Office mới nhất
- 🧠 **Mô hình Gemini 3 thế hệ mới** (3.5 Flash, 3.1 Flash-Lite, 3.1 Pro Preview)

Hãy đặt câu hỏi hoặc chọn một trong các gợi ý bên dưới để bắt đầu!`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('tutor');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [enableSearch, setEnableSearch] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    soundManager.playClick();

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const selectedModelObj = MODELS.find(m => m.id === selectedModel);

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          subject: selectedSubject === 'all' ? 'Tổng hợp Word, Excel, PowerPoint' : selectedSubject.toUpperCase(),
          systemRole: selectedRole,
          model: selectedModel,
          taskType: selectedModelObj?.taskType || 'general',
          enableSearch: enableSearch && selectedModel === 'gemini-3.5-flash',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Lỗi kết nối Gemini AI');
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || 'Xin lỗi, tôi chưa nhận được câu trả lời phù hợp.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed,
        groundingSources: data.groundingSources,
      };

      setMessages(prev => [...prev, assistantMessage]);
      soundManager.playCorrect();
    } catch (error: any) {
      soundManager.playWrong();
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `⚠️ **Không thể hoàn tất**: ${error.message || 'Hệ thống bận, vui lòng thử lại sau.'}`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundManager.playClick();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    soundManager.playClick();
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện để bắt đầu cuộc hội thoại mới?')) {
      const resetMsg: ChatMessage = {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Đã làm mới cuộc hội thoại! Bạn muốn ôn tập chuyên đề hoặc giải đáp thắc mắc nào tiếp theo?`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([resetMsg]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const filteredPrompts = QUICK_PROMPTS.filter(p => {
    if (selectedSubject === 'all') return true;
    return p.subject === selectedSubject;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-7 border border-indigo-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Gemini Multi-Turn AI
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Google Search Grounding
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Gia Sư Khảo Thí MOS — Trí Tuệ Nhân Tạo Gemini
            </h2>
            <p className="text-xs text-indigo-200/80 leading-relaxed">
              Duy trì ngữ cảnh lịch sử trò chuyện đa lượt, phân tích chi tiết đường dẫn Ribbon, hướng dẫn cú pháp hàm Excel và giải đáp đề thi Certiport theo thời gian thực.
            </p>
          </div>

          <button
            onClick={handleClearHistory}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-start md:self-auto"
            title="Bắt đầu phiên hội thoại mới"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
            <span>Làm Mới Chat</span>
          </button>
        </div>
      </div>

      {/* Control Toolbar: Roles, Model Selector, & Google Search Toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* 1. Role Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-indigo-600" />
              Vai Trò Gia Sư (System Instruction)
            </label>
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full appearance-none px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8"
              >
                {ROLES.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.badge})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 2. Model Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-blue-600" />
              Mô Hình Gemini (Model Tier)
            </label>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full appearance-none px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer pr-8"
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 3. Search Grounding Toggle */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              Google Search Grounding
            </label>
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setEnableSearch(!enableSearch);
              }}
              disabled={selectedModel !== 'gemini-3.5-flash'}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                enableSearch && selectedModel === 'gemini-3.5-flash'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                  : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 opacity-80'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${enableSearch && selectedModel === 'gemini-3.5-flash' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {enableSearch && selectedModel === 'gemini-3.5-flash' ? 'Bật Tra Cứu Google' : 'Tắt Tra Cứu Google'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {selectedModel === 'gemini-3.5-flash' ? 'googleSearch' : 'Chỉ hỗ trợ 3.5 Flash'}
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Chat Thread (Scrollable) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[580px]">
        
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((message) => {
            const isUser = message.role === 'user';

            return (
              <div
                key={message.id}
                className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{message.content}</div>

                    {/* Grounding Sources (Search citations) */}
                    {message.groundingSources && message.groundingSources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-1.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          <Globe className="w-3.5 h-3.5" />
                          <span>Nguồn Tra Cứu Google Search Grounding:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {message.groundingSources.map((src, idx) => (
                            <a
                              key={idx}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] text-blue-600 dark:text-blue-300 hover:text-blue-800 hover:underline transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[200px]">{src.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message meta */}
                  <div className={`flex items-center gap-2 text-[10px] text-slate-400 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{message.timestamp}</span>
                    {message.modelUsed && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[9px]">
                        {message.modelUsed}
                      </span>
                    )}
                    {!isUser && (
                      <button
                        onClick={() => handleCopyMessage(message.id, message.content)}
                        className="hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-0.5 cursor-pointer ml-1"
                        title="Sao chép câu trả lời"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500 font-semibold">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                <span>Gia sư Gemini đang suy luận & tổng hợp câu trả lời...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Chips Bar */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 px-2 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            Gợi ý:
          </span>
          {filteredPrompts.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(qp.prompt)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-2xs hover:text-indigo-600"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Chat Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Hỏi về hàm Excel, Ribbon Word, Slide Master, mẹo thi 50 phút..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden transition-colors"
          />

          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
            title="Gửi câu hỏi"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
};

export default AITutorChat;
