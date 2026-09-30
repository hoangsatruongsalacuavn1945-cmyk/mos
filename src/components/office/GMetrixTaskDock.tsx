import React from 'react';
import {
  CheckCircle2,
  Bookmark,
  RotateCcw,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Compass,
  Check,
  Award
} from 'lucide-react';

export interface GMetrixTaskDockProps {
  taskNumber: number;
  totalTasks: number;
  instruction: string;
  hint: string;
  officialRibbonPath: string;
  isCompleted: boolean;
  isFlagged: boolean;
  showHint: boolean;
  feedback: { message: string; success: boolean } | null;
  onToggleFlag: () => void;
  onToggleHint: () => void;
  onResetTask: () => void;
  onNextTask: () => void;
  onPrevTask: () => void;
  onMarkCompletedManual?: () => void;
}

export const GMetrixTaskDock: React.FC<GMetrixTaskDockProps> = ({
  taskNumber,
  totalTasks,
  instruction,
  hint,
  officialRibbonPath,
  isCompleted,
  isFlagged,
  showHint,
  feedback,
  onToggleFlag,
  onToggleHint,
  onResetTask,
  onNextTask,
  onPrevTask,
  onMarkCompletedManual,
}) => {
  return (
    <div className="w-full bg-[#1e293b] text-slate-100 border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-sans">
      {/* GMetrix Task Title Header */}
      <div className="bg-[#0f172a] px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/40 font-mono text-xs font-black tracking-wider uppercase">
            GMETRIX PRACTICE ENGINE
          </span>
          <span className="text-xs font-bold text-slate-300">
            Task {taskNumber} of {totalTasks}
          </span>
          {isCompleted && (
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-black flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ĐÃ HOÀN THÀNH
            </span>
          )}
        </div>

        {/* GMetrix Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Mark for Review */}
          <button
            onClick={onToggleFlag}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              isFlagged
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
            }`}
            title="Đánh dấu để xem lại sau"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isFlagged ? 'Đã Đánh Dấu' : 'Mark for Review'}</span>
          </button>

          {/* Reset Task */}
          <button
            onClick={onResetTask}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
            title="Khôi phục trạng thái ban đầu của câu hỏi này"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Task</span>
          </button>

          {/* Help / Hint */}
          <button
            onClick={onToggleHint}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 transition-colors flex items-center gap-1.5"
            title="Xem chỉ dẫn thanh Ribbon chuẩn Certiport"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHint ? 'Ẩn Gợi Ý' : 'Gợi Ý Ribbon'}</span>
          </button>
        </div>
      </div>

      {/* Main Task Instruction Body */}
      <div className="p-5 space-y-3">
        <div className="text-sm sm:text-base font-bold text-white leading-relaxed">
          {instruction}
        </div>

        {/* Hint Box */}
        {showHint && (
          <div className="p-3.5 bg-indigo-950/60 border border-indigo-800/60 rounded-xl text-xs text-indigo-200 flex items-start gap-2.5 animate-in fade-in">
            <Compass className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">{hint}</div>
              <div className="mt-1 font-mono text-[11px] text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded w-fit border border-indigo-700/40">
                Thanh Ribbon: {officialRibbonPath}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Verification Feedback */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
              feedback.success
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/60 border-rose-800 text-rose-200'
            }`}
          >
            {feedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <HelpCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="font-semibold leading-relaxed">
              {feedback.message}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="px-5 py-3 bg-[#0f172a] border-t border-slate-800 flex items-center justify-between text-xs">
        <button
          onClick={onPrevTask}
          disabled={taskNumber <= 1}
          className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Câu Trước</span>
        </button>

        <div className="text-slate-400 text-[11px]">
          Chế độ phòng thi tương tác GMetrix 90% chuẩn Office 365
        </div>

        <button
          onClick={onNextTask}
          disabled={taskNumber >= totalTasks}
          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white flex items-center gap-1.5 shadow-md shadow-blue-950 transition-all cursor-pointer"
        >
          <span>Câu Tiếp Theo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
