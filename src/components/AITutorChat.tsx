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
  ChevronRight
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AITutorChatProps {
  selectedSubject: MOSSubject;
}

const QUICK_PROMPTS = [
  {
    subject: 'excel',
    label: 'Hàm VLOOKUP & IFERROR',
    prompt: 'Hãy hướng dẫn cách dùng hàm VLOOKUP kết hợp IFERROR trong Excel để tránh hiển thị lỗi #N/A khi không tìm thấy dữ liệu trong đề thi MOS.',
  },
  {
    subject: 'excel',
    label: 'Cố định hàng & cột (Freeze Panes)',
    prompt: 'Phân biệt giữa Freeze Top Row, Freeze First Column và Freeze Panes tự do theo ô đang chọn trong Excel.',
  },
  {
    subject: 'word',
    label: 'Section Break vs Page Break',
    prompt: 'Sự khác biệt giữa Page Break và Section Break (Next Page) trong Word là gì? Khi nào cần dùng Section Break trong đề thi MOS?',
  },
  {
    subject: 'word',
    label: 'Mục lục tự động (TOC)',
    prompt: 'Các bước tạo Mục lục tự động (Table of Contents) chuẩn Certiport và cách cập nhật khi sửa tiêu đề tài liệu.',
  },
  {
    subject: 'powerpoint',
    label: 'Hiệu ứng chuyển trang Morph',
    prompt: 'Cách thiết lập hiệu ứng Morph trong PowerPoint 365 để các hình khối và chữ biến hình mượt mà giữa 2 slide.',
  },
  {
    subject: 'powerpoint',
    label: 'Slide Master nâng cao',
    prompt: 'Slide Master trong PowerPoint hoạt động như thế nào? Cách chèn Logo lên tất cả các slide mà không cần chỉnh từng trang.',
  },
];

export const AITutorChat: React.FC<AITutorChatProps> = ({ selectedSubject }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Xin chào! Tôi là **Gia Sư MOS AI** — chuyên gia đồng hành cùng bạn ôn luyện chứng chỉ tin học quốc tế Microsoft Office Specialist (Word, Excel, PowerPoint).

Bạn có thể hỏi tôi bất kỳ điều gì:
- 📌 Cách dùng và cú pháp các hàm Excel phức tạp (*VLOOKUP, INDEX/MATCH, COUNTIF, IF...*)
- 📌 Vị trí các nút lệnh trên thanh Ribbon chuẩn khảo thí Certiport
- 📌 Các bẫy thường gặp trong đề thi MOS và kinh nghiệm phân bổ 50 phút
- 📌 Hướng dẫn giải quyết các task thực hành cụ thể`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [credits, setCredits] = useState<{ remaining: number | 'unlimited'; max: number | 'unlimited'; used: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/gemini/credits');
      if (res.ok) {
        const data = await res.json();
        setCredits({
          remaining: data.remainingCredits,
          max: data.maxQuota,
          used: data.usedToday,
        });
      }
    } catch {}
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    if (credits && credits.remaining === 0) {
      return;
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          subject: selectedSubject === 'all' ? 'Tổng hợp Word, Excel, PowerPoint' : selectedSubject.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Lỗi kết nối AI');
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || 'Xin lỗi, tôi chưa nhận được câu trả lời phù hợp.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMessage]);
      fetchCredits();
    } catch (error: any) {
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `⚠️ **Không thể hoàn tất**: ${error.message || 'Vui lòng thử lại sau.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
      fetchCredits();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Đã làm mới cuộc hội thoại! Bạn muốn ôn tập chủ đề hoặc môn học nào tiếp theo?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const relevantPrompts = QUICK_PROMPTS.filter(p => {
    if (selectedSubject === 'all') return true;
    return p.subject === selectedSubject;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Trợ Lý Trí Tuệ Nhân Tạo Thông Minh</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Gia Sư MOS AI — Giải Đáp & Phân Tích
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
            Hỏi đáp trực tiếp mọi bài tập khó, phân tích cú pháp hàm Excel, chỉ đường dẫn Ribbon Certiport và hướng dẫn phương pháp làm bài đạt điểm tuyệt đối 1000/1000.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 self-start md:self-auto">
          {credits && (
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs ${
              credits.remaining === 'unlimited'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : credits.remaining > 5
                ? 'bg-blue-950/80 border-blue-500/40 text-blue-200'
                : credits.remaining > 0
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                : 'bg-red-950/80 border-red-500/40 text-red-300'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {credits.remaining === 'unlimited'
                  ? 'Hạn mức: Vô hạn (Giảng viên)'
                  : `Hạn mức hôm nay: ${credits.remaining}/${credits.max} lượt`}
              </span>
            </div>
          )}

          <button
            onClick={handleResetChat}
            className="px-3 py-1.5 bg-blue-800/80 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 border border-blue-700 cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm mới hội thoại</span>
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="mb-6">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Gợi ý câu hỏi ôn tập nhanh:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {relevantPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.prompt)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shadow-2xs flex items-center gap-1 shrink-0"
            >
              <span>{qp.label}</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[580px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map(msg => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-indigo-600 text-white shadow-xs'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {/* Markdown formatted content */}
                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                    {msg.content}
                  </div>

                  {/* Message footer */}
                  <div
                    className={`mt-2 pt-1.5 flex items-center justify-between gap-3 text-[10px] ${
                      isUser ? 'text-blue-200' : 'text-slate-400 border-t border-slate-200/60'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {!isUser && (
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="hover:text-slate-700 flex items-center gap-1 transition-colors"
                        title="Sao chép nội dung"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Đã chép</span>
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

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-xl mr-auto">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span>Gia Sư MOS AI đang suy nghĩ và tổng hợp kiến thức...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200">
          {credits && credits.remaining === 0 && (
            <div className="mb-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Bạn đã sử dụng hết 20/20 lượt hỏi AI hôm nay. Hãy tiếp tục ôn tập theo ngân hàng câu hỏi và quay lại vào ngày mai nhé!</span>
            </div>
          )}

          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={
                credits && credits.remaining === 0
                  ? 'Đã hết lượt hỏi hôm nay (Đặt lại vào 00:00 ngày mai)...'
                  : `Đặt câu hỏi về ${selectedSubject === 'all' ? 'Word, Excel, PowerPoint' : selectedSubject.toUpperCase()}... (Ví dụ: cú pháp hàm XLOOKUP, cách ngắt section...)`
              }
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={isLoading || (credits ? credits.remaining === 0 : false)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || (credits ? credits.remaining === 0 : false)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <span>Gửi</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="text-[11px] text-slate-400 mt-2 text-center">
            Gia sư MOS AI trả lời theo tài liệu chuẩn khảo thí Certiport & Microsoft Office 365.
          </div>
        </div>
      </div>
    </div>
  );
};
