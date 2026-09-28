import React, { useState } from 'react';
import { UserStats, MOSSubject } from '../types/mos';
import { resetAllProgress } from '../utils/storage';
import { 
  BarChart2, 
  CheckCircle2, 
  XCircle, 
  Award, 
  RotateCcw, 
  Bookmark, 
  Flame, 
  Clock, 
  FileSpreadsheet, 
  FileText, 
  Presentation,
  TrendingUp,
  Download,
  AlertCircle,
  Compass,
  ArrowRight,
  Mail,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { getCurrentUser, DEFAULT_TEACHERS, fetchSubmissions } from '../utils/userStore';
import { Submission } from '../types/user';
import { downloadStudentProgressExcelFile } from '../utils/excelExporter';
import { soundManager } from '../utils/audio';

interface AnalyticsDashboardProps {
  stats: UserStats;
  onStatsUpdate: () => void;
  onNavigateToQuiz: (filter: 'bookmarked' | 'wrong') => void;
  onNavigateToRoadmap?: () => void;
  onOpenReport?: () => void;
  onOpenCertificate?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  stats,
  onStatsUpdate,
  onNavigateToQuiz,
  onNavigateToRoadmap,
  onOpenReport,
  onOpenCertificate,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [studentSubmissions, setStudentSubmissions] = useState<Submission[]>([]);
  const [excelSuccess, setExcelSuccess] = useState<string | null>(null);

  const currentUser = getCurrentUser();
  const teacher = DEFAULT_TEACHERS.find(t => t.id === currentUser.assignedTeacherId) || DEFAULT_TEACHERS[0];

  React.useEffect(() => {
    fetchSubmissions({ studentId: currentUser.id }).then(subs => {
      setStudentSubmissions(subs);
    });
  }, [currentUser.id]);

  const accuracyRate =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;

  const examsPassed = stats.examHistory.filter(e => e.passed).length;
  const bestScore = stats.examHistory.reduce(
    (max, e) => Math.max(max, e.score),
    0
  );

  const handleReset = () => {
    resetAllProgress();
    setShowResetConfirm(false);
    onStatsUpdate();
  };

  const handleExportExcel = () => {
    soundManager.playClick();
    const filename = downloadStudentProgressExcelFile(stats, currentUser);
    soundManager.playCorrect();
    setExcelSuccess(`Đã xuất thành công sổ theo dõi tiến độ cá nhân dạng Excel: "${filename}"`);
    setTimeout(() => setExcelSuccess(null), 5000);
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(stats, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mos_master_progress_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Excel Download Success Alert */}
      {excelSuccess && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{excelSuccess}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hồ Sơ Năng Lực & Tiến Độ Ôn Tập
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi tỷ lệ chính xác, lịch sử các bài thi thử 50 phút và khắc phục các mục tiêu kiến thức yếu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="Mở biểu mẫu báo cáo kết quả và gửi về cho người phụ trách"
            >
              <Mail className="w-4 h-4 text-white" />
              <span>Gửi Báo Cáo Phụ Trách</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg transition-all flex items-center gap-1.5 shadow-xs ring-2 ring-emerald-400/30"
            title="Xuất Sổ Theo Dõi Tiến Độ Cá Nhân Dạng Excel (.XLSX) Đa Sheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Xuất Excel (.XLSX)</span>
          </button>

          <button
            onClick={handleExportData}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Xuất bản sao lưu dữ liệu JSON"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Dữ Liệu JSON</span>
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4 text-red-500" />
            <span>Làm Lại Từ Đầu</span>
          </button>
        </div>
      </div>

      {/* Roadmap Quick Banner Callout */}
      {onNavigateToRoadmap && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/60 border border-blue-400/40 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Chỉ Số Sẵn Sàng (Readiness Score) & Kế Hoạch 7 Ngày
              </h4>
              <p className="text-xs text-blue-200">
                Xem phân tích mức độ sẵn sàng thi đạt chuẩn Certiport (từ 700 điểm trở lên) và lộ trình bù đắp lỗ hổng kiến thức từng ngày.
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToRoadmap}
            className="px-4 py-2 bg-white hover:bg-blue-50 text-slate-900 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
          >
            <span>Xem Lộ Trình Cá Nhân</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* KPI 1: Answered */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Câu Đã Luyện
            </span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {stats.totalAnswered}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Đúng {stats.totalCorrect} câu
          </div>
        </div>

        {/* KPI 2: Accuracy */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tỷ Lệ Chính Xác
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {accuracyRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {accuracyRate >= 80 ? 'Rất tốt (Sẵn sàng đi thi)' : accuracyRate >= 70 ? 'Đạt chuẩn MOS' : 'Cần ôn thêm lý thuyết'}
          </div>
        </div>

        {/* KPI 3: Practical Tasks Completed */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Task Thực Hành
            </span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {stats.completedTaskIds.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Thao tác mô phỏng Certiport
          </div>
        </div>

        {/* KPI 4: Best Mock Exam Score */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Điểm Thi Thử Cao Nhất
            </span>
            <Flame className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {bestScore} <span className="text-sm font-normal text-slate-400">/ 1000</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {examsPassed} lần đạt chứng chỉ (Pass)
          </div>
        </div>
      </div>

      {/* Teacher Supervision & Direct Feedback Section */}
      <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-xs mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Giáo Viên Phụ Trách Bộ Môn Của Bạn</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">Đã Kết Nối Tự Động</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {teacher.name} - {teacher.title}
              </h3>
              <p className="text-xs text-slate-500">
                {teacher.department} · Email nhận bài: <strong className="text-slate-700">{teacher.email}</strong> · SĐT: {teacher.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenReport && (
              <button
                onClick={onOpenReport}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Gửi Báo Cáo Mới</span>
              </button>
            )}
            {examsPassed > 0 && onOpenCertificate && (
              <button
                onClick={onOpenCertificate}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                <span>Xem Chứng Chỉ MOS</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback List from Teacher */}
        <div className="mt-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Lời Nhận Xét & Đánh Giá Gần Nhất Từ Giáo Viên Dạy Môn:</span>
          </h4>

          {studentSubmissions.filter(s => s.teacherFeedback).length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500 text-center">
              Giáo viên phụ trách sẽ xem xét các bài thi thử 50P và bài thực hành bạn nộp để gửi lời nhận xét và hướng dẫn chi tiết tại đây.
            </div>
          ) : (
            <div className="space-y-2.5">
              {studentSubmissions.filter(s => s.teacherFeedback).slice(0, 3).map(sub => (
                <div key={sub.id} className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Bài thi: MOS {sub.subject.toUpperCase()} ({sub.score} điểm)</span>
                      {sub.teacherRating === 'excellent' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">🌟 Xuất Sắc</span>
                      )}
                      {sub.teacherRating === 'good' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">👍 Đạt Yêu Cầu</span>
                      )}
                      {sub.teacherRating === 'needs-improvement' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">⚠️ Cần Ôn Lại</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {sub.teacherFeedbackAt ? new Date(sub.teacherFeedbackAt).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>
                  <p className="text-slate-700 italic">
                    "{sub.teacherFeedback}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Cards: Bookmarked & Wrong Questions Drill */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Card 1: Review Wrong Questions */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-2">
              <XCircle className="w-5 h-5" />
              <span>Khắc Phục Câu Làm Sai ({stats.wrongQuestionIds.length})</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Hệ thống tự động lưu trữ các câu hỏi bạn từng trả lời sai để rèn luyện lại cho đến khi thành thạo.
            </p>
          </div>
          <button
            onClick={() => onNavigateToQuiz('wrong')}
            disabled={stats.wrongQuestionIds.length === 0}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors text-center"
          >
            {stats.wrongQuestionIds.length > 0
              ? `Luyện lại ${stats.wrongQuestionIds.length} câu làm sai`
              : 'Hiện chưa có câu làm sai'}
          </button>
        </div>

        {/* Card 2: Bookmarked Questions */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm mb-2">
              <Bookmark className="w-5 h-5 fill-amber-500" />
              <span>Câu Hỏi Đã Đánh Dấu Sao ({stats.bookmarkedQuestionIds.length})</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Xem lại danh sách các câu hỏi lý thuyết hoặc mẹo Ribbon quan trọng bạn đã lưu lại để chuẩn bị trước ngày thi.
            </p>
          </div>
          <button
            onClick={() => onNavigateToQuiz('bookmarked')}
            disabled={stats.bookmarkedQuestionIds.length === 0}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors text-center"
          >
            {stats.bookmarkedQuestionIds.length > 0
              ? `Ôn lại ${stats.bookmarkedQuestionIds.length} câu đã đánh dấu`
              : 'Chưa có câu nào được đánh dấu sao'}
          </button>
        </div>
      </div>

      {/* Exam History Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Lịch Sử Thi Thử MOS 50 Phút
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {stats.examHistory.length} lần thi
          </span>
        </div>

        {stats.examHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Bạn chưa làm bài thi thử nào. Hãy vào mục "Thi Thử 50 Phút" để trải nghiệm áp lực phòng thi thật!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-4">Ngày Thi</th>
                  <th className="p-4">Chủ Đề</th>
                  <th className="p-4">Điểm Số (Thang 1000)</th>
                  <th className="p-4">Kết Quả</th>
                  <th className="p-4">Thời Gian Làm Bài</th>
                  <th className="p-4">Số Câu Đúng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.examHistory.map(exam => (
                  <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-slate-700">{exam.date}</td>
                    <td className="p-4 uppercase font-bold text-xs">
                      {exam.subject}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900 tabular-nums">
                      {exam.score}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-bold ${
                          exam.passed ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {exam.passed ? 'PASS (Đạt)' : 'DID NOT PASS'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-mono">
                      {Math.floor(exam.timeSpentSeconds / 60)}m {exam.timeSpentSeconds % 60}s
                    </td>
                    <td className="p-4 font-mono text-slate-700 tabular-nums">
                      {exam.correctCount} / {exam.totalQuestions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation modal for reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h4 className="text-base font-bold text-slate-900">Xóa Toàn Bộ Lịch Sử</h4>
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Thao tác này sẽ xóa toàn bộ số câu đã luyện, các câu đánh dấu sao, câu làm sai và lịch sử điểm thi thử. Bạn có chắc chắn muốn đặt lại từ đầu?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
