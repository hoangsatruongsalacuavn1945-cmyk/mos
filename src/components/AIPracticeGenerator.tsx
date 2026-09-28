import React, { useState } from 'react';
import { MOSSubject } from '../types/mos';
import { 
  Sparkles, 
  FileSpreadsheet, 
  FileText, 
  Presentation, 
  Send, 
  Loader2, 
  CheckCircle2, 
  Compass, 
  HelpCircle,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';

interface GeneratedTask {
  taskNumber: number;
  instruction: string;
  ribbonPath: string;
  hint: string;
}

interface GeneratedProject {
  scenarioTitle?: string;
  context?: string;
  tasks?: GeneratedTask[];
  learningPoints?: string;
  rawText?: string;
}

interface AIPracticeGeneratorProps {
  selectedSubject: MOSSubject;
}

const SAMPLE_TOPICS = [
  { subject: 'excel', label: 'Bảng lương nhân viên & tính thuế TNCN', query: 'Bảng tính lương nhân viên, thưởng KPI và thuế thu nhập cá nhân với hàm IF, VLOOKUP, SUMIFS' },
  { subject: 'excel', label: 'Báo cáo doanh số bán lẻ & Pivot Table', query: 'Quản lý đơn hàng thương mại điện tử, trích xuất dữ liệu Flash Fill và định dạng điều kiện Conditional Formatting' },
  { subject: 'word', label: 'Đồ án tốt nghiệp & Trích dẫn APA', query: 'Văn bản báo cáo nghiên cứu khoa học, ngắt section số trang khác nhau, chèn Caption hình ảnh và chú thích Footnote' },
  { subject: 'word', label: 'Hợp đồng thương mại & Watermark', query: 'Soạn thảo hợp đồng mua bán, định dạng lề Narrow, chèn bảng giá và watermark bảo mật Confidential' },
  { subject: 'powerpoint', label: 'Thuyết trình gọi vốn Startup (Pitch Deck)', query: 'Bài thuyết trình khởi nghiệp 5 slide, chuyển động Morph mượt mà, sơ đồ quy trình SmartArt và nhúng video tự chạy' },
];

export const AIPracticeGenerator: React.FC<AIPracticeGeneratorProps> = ({ selectedSubject }) => {
  const [topicInput, setTopicInput] = useState('');
  const [targetSubject, setTargetSubject] = useState<'word' | 'excel' | 'powerpoint'>(
    selectedSubject === 'all' ? 'excel' : selectedSubject
  );
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedProject | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>({});
  const [copiedPathIdx, setCopiedPathIdx] = useState<number | null>(null);

  const handleGenerate = async (queryText?: string) => {
    const text = (queryText || topicInput).trim();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/generate-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: targetSubject,
          topic: text || 'Dự án thực tế theo chuẩn Certiport',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi tạo đề thi.');
      }

      setGeneratedResult(data);
      setCompletedTasks({});
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể tạo đề bài. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskDone = (taskNum: number) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskNum]: !prev[taskNum],
    }));
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPathIdx(idx);
    setTimeout(() => setCopiedPathIdx(null), 1800);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Trí Tuệ Nhân Tạo Sinh Đề Thi Thực Hành</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
          AI Tạo Tình Huống Đề Thi Thực Hành MOS Mới
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Nhập bất kỳ ngữ cảnh thực tế nào (doanh nghiệp, trường học, tài chính, báo cáo...) hoặc chọn gợi ý có sẵn, Gemini AI sẽ tự động biên soạn một bộ Project đề thi chuẩn phong cách Certiport kèm đường dẫn Ribbon chi tiết.
        </p>
      </div>

      {/* Control Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-xs">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <span className="text-xs font-bold text-slate-600 uppercase">Chọn môn thi:</span>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setTargetSubject('excel')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                targetSubject === 'excel' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>MOS Excel</span>
            </button>
            <button
              onClick={() => setTargetSubject('word')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                targetSubject === 'word' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>MOS Word</span>
            </button>
            <button
              onClick={() => setTargetSubject('powerpoint')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                targetSubject === 'powerpoint' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>MOS PowerPoint</span>
            </button>
          </div>
        </div>

        {/* Input & Action */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Nhập chủ đề đề bài (Ví dụ: Thống kê điểm thi tốt nghiệp, Dự toán ngân sách dự án, Luận văn tốt nghiệp...)"
            value={topicInput}
            onChange={e => setTopicInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <button
            onClick={() => handleGenerate()}
            disabled={isLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI đang biên soạn đề thi...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Biên Soạn Đề Thi Mới</span>
              </>
            )}
          </button>
        </div>

        {/* Suggested Topics Pill row */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">Chủ đề gợi ý:</span>
          {SAMPLE_TOPICS.map((top, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTargetSubject(top.subject as any);
                setTopicInput(top.label);
                handleGenerate(top.query);
              }}
              className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-md transition-colors whitespace-nowrap"
            >
              {top.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl mb-6 text-xs">
          {errorMessage}
        </div>
      )}

      {/* Generated Project Result */}
      {generatedResult && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* Project Title & Context */}
          <div className="border-b border-slate-100 pb-5 mb-6">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Đề Thi Do AI Khởi Tạo (MOS {targetSubject.toUpperCase()})
              </span>
              <button
                onClick={() => handleGenerate()}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Tạo biến thể khác</span>
              </button>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {generatedResult.scenarioTitle || 'Dự Án Thực Hành Đề Xuất'}
            </h3>
            {generatedResult.context && (
              <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                {generatedResult.context}
              </p>
            )}
          </div>

          {/* Tasks List */}
          <div className="space-y-4 mb-6">
            <h4 className="text-sm font-bold text-slate-900">
              Danh Sách Các Task Cần Hoàn Thành:
            </h4>

            {generatedResult.tasks?.map((task, idx) => {
              const isDone = !!completedTasks[task.taskNumber || idx + 1];

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isDone
                      ? 'border-emerald-300 bg-emerald-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleTaskDone(task.taskNumber || idx + 1)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : 'border border-slate-300 text-slate-400 hover:border-slate-400'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </button>
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        Task {task.taskNumber || idx + 1}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleTaskDone(task.taskNumber || idx + 1)}
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isDone ? 'Đã hoàn thành' : 'Đánh dấu đã làm'}
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 mb-3 pl-8 leading-relaxed">
                    {task.instruction}
                  </p>

                  <div className="pl-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100 font-mono font-medium">
                      <Compass className="w-3.5 h-3.5 shrink-0" />
                      <span>{task.ribbonPath}</span>
                    </div>

                    <button
                      onClick={() => handleCopy(task.ribbonPath, idx)}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 self-start sm:self-auto text-[11px]"
                    >
                      {copiedPathIdx === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép Ribbon</span>
                        </>
                      )}
                    </button>
                  </div>

                  {task.hint && (
                    <div className="pl-8 mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Gợi ý: {task.hint}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Fallback if text format */}
            {!generatedResult.tasks && generatedResult.rawText && (
              <div className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200">
                {generatedResult.rawText}
              </div>
            )}
          </div>

          {/* Learning Points */}
          {generatedResult.learningPoints && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-950">
              <span className="font-bold block mb-1">🎯 Điểm cốt lõi cần nhớ:</span>
              <p className="leading-relaxed">{generatedResult.learningPoints}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
