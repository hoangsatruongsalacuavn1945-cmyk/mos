import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  X, 
  Minus, 
  Maximize2, 
  Minimize2, 
  Globe, 
  ExternalLink, 
  RotateCcw,
  Zap,
  ShieldCheck,
  Brain,
  Lightbulb
} from 'lucide-react';
import { soundManager } from '../utils/audio';

const STORAGE_KEY = 'mos_gemini_multi_turn_history';

interface GroundingSource {
  title: string;
  uri: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  groundingSources?: GroundingSource[];
}

export const FloatingGeminiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('tutor');
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash');
  const [enableSearch, setEnableSearch] = useState(true);

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
        id: 'floating-welcome',
        role: 'assistant',
        content: `👋 Xin chào! Tôi là **Gia Sư Trợ Giảng Gemini AI** của MOS Master.
Hỏi tôi bất kỳ điều gì về:
- Cú pháp hàm Excel (VLOOKUP, XLOOKUP, IF...)
- Thao tác thanh Ribbon đề thi Certiport
- Mẹo làm bài thi 50 phút đạt 1000/1000!`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

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
      let taskType = 'general';
      if (selectedModel === 'gemini-3.1-pro-preview') taskType = 'complex';
      else if (selectedModel === 'gemini-3.1-flash-lite') taskType = 'fast';

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          systemRole: selectedRole,
          model: selectedModel,
          taskType,
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
        groundingSources: data.groundingSources,
      };

      setMessages(prev => [...prev, assistantMessage]);
      soundManager.playCorrect();
    } catch (err: any) {
      soundManager.playWrong();
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `⚠️ ${err.message || 'Hệ thống bận, vui lòng thử lại sau.'}`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Xóa lịch sử trò chuyện hiện tại?')) {
      const resetMsg: ChatMessage = {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Cuộc trò chuyện đã được làm mới! Bạn muốn ôn tập phần nào?',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([resetMsg]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <>
      {/* Floating Toggle Button (Always accessible) */}
      {!isOpen && (
        <button
          onClick={() => {
            soundManager.playClick();
            setIsOpen(true);
          }}
          className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-white/20 group animate-bounce-subtle"
          title="Mở Trợ Lý Gia Sư Gemini AI"
        >
          <div className="relative">
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900 animate-pulse" />
          </div>
          <span className="text-xs font-black pr-1 hidden sm:inline-block">
            Hỏi Gia Sư AI
          </span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 shadow-2xl flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden ${
            isExpanded
              ? 'bottom-4 right-4 left-4 sm:left-auto sm:w-[650px] h-[85vh]'
              : 'bottom-6 right-6 w-[94vw] sm:w-[420px] h-[560px]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-indigo-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-white">Gia Sư Gemini AI</h4>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-indigo-200/80 line-clamp-1">
                  {selectedModel === 'gemini-3.5-flash' ? 'Gemini 3.5 Flash · Search Grounding' : selectedModel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button
                onClick={handleClearHistory}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                title="Xóa lịch sử chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors hidden sm:block"
                title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                title="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Settings Bar (Compact) */}
          <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-[11px]">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="py-1 px-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold text-[11px] focus:outline-hidden cursor-pointer"
            >
              <option value="tutor">Gia Sư Toàn Năng</option>
              <option value="examiner">Giám Khảo 50P</option>
              <option value="excel_specialist">Chuyên Gia Excel</option>
              <option value="designer">Thiết Kế Word/PPT</option>
            </select>

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="py-1 px-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold text-[11px] focus:outline-hidden cursor-pointer"
            >
              <option value="gemini-3.5-flash">3.5 Flash (Google Search)</option>
              <option value="gemini-3.1-flash-lite">3.1 Flash-Lite (Nhanh)</option>
              <option value="gemini-3.1-pro-preview">3.1 Pro (Chuyên Sâu)</option>
            </select>
          </div>

          {/* Messages Thread (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className={`flex gap-2.5 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold text-white shadow-2xs ${
                      isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-indigo-600 to-purple-600'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div className={`max-w-[85%] space-y-1`}>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>

                      {/* Google Search Citations */}
                      {m.groundingSources && m.groundingSources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Nguồn Google Search:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {m.groundingSources.slice(0, 3).map((src, i) => (
                              <a
                                key={i}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] text-blue-600 dark:text-blue-300 hover:underline"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span className="truncate max-w-[140px]">{src.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className={`text-[9px] text-slate-400 block px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2 items-center text-xs text-slate-400 italic p-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>Gia sư AI đang soạn câu trả lời...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleSendMessage('Cách dùng hàm VLOOKUP kết hợp IFERROR trong Excel?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-semibold whitespace-nowrap hover:text-indigo-600"
            >
              VLOOKUP & IFERROR
            </button>
            <button
              onClick={() => handleSendMessage('Phân biệt Section Break và Page Break trong Word?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-semibold whitespace-nowrap hover:text-indigo-600"
            >
              Section Break Word
            </button>
            <button
              onClick={() => handleSendMessage('Làm thế nào để tạo hiệu ứng Morph trong PowerPoint?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-semibold whitespace-nowrap hover:text-indigo-600"
            >
              Morph PowerPoint
            </button>
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập câu hỏi cho Gia Sư AI..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default FloatingGeminiChatbot;
