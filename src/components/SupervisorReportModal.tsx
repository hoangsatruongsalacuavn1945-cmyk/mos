import React, { useState } from 'react';
import { UserStats } from '../types/mos';
import { 
  Send, 
  Copy, 
  Printer, 
  Check, 
  X, 
  Award, 
  FileText, 
  Mail, 
  User, 
  Building, 
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SupervisorReportModalProps {
  stats: UserStats;
  onClose: () => void;
}

export const SupervisorReportModal: React.FC<SupervisorReportModalProps> = ({ stats, onClose }) => {
  const [studentName, setStudentName] = useState('Học Viên MOS');
  const [studentClass, setStudentClass] = useState('Lớp Ôn Thi MOS 2026');
  const [supervisorName, setSupervisorName] = useState('Thầy/Cô Phụ Trách');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [studentNote, setStudentNote] = useState('Em xin gửi báo cáo tiến độ học tập và kết quả thi thử MOS để thầy/cô theo dõi và hướng dẫn thêm ạ.');
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const accuracyRate =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;

  const examsPassed = stats.examHistory.filter(e => e.passed).length;
  const bestScore = stats.examHistory.reduce((max, e) => Math.max(max, e.score), 0);

  // Generate readable text report
  const generateReportText = () => {
    return `=====================================================
BÁO CÁO TIẾN ĐỘ & KẾT QUẢ ÔN TẬP CHỨNG CHỈ MOS QUỐC TẾ
=====================================================
- Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}
- Học viên: ${studentName}
- Đơn vị / Lớp: ${studentClass}
- Kính gửi: ${supervisorName} ${supervisorEmail ? `(${supervisorEmail})` : ''}

1. TỔNG QUAN TIẾN ĐỘ HỌC TẬP
- Tổng số câu lý thuyết đã luyện: ${stats.totalAnswered} câu
- Số câu trả lời chính xác: ${stats.totalCorrect} câu
- Tỷ lệ chính xác lý thuyết: ${accuracyRate}%
- Số task thực hành mô phỏng Certiport đã hoàn thành: ${stats.completedTaskIds.length} task
- Số câu cần khắc phục (câu sai): ${stats.wrongQuestionIds.length} câu

2. KẾT QUẢ THI THỬ 50 PHÚT CHUẨN CERTIPORT
- Điểm thi thử cao nhất: ${bestScore} / 1000 điểm
- Chuẩn điểm đạt: 700 / 1000
- Số lần đạt chứng chỉ (Pass): ${examsPassed} / ${stats.examHistory.length} lần thi
- Trạng thái hiện tại: ${bestScore >= 700 ? 'ĐẠT CHUẨN ĐI THI (SẴN SÀNG)' : 'CẦN ÔN TẬP BỔ SUNG'}

3. LỊCH SỬ CÁC LẦN THI THỬ GẦN NHẤT
${stats.examHistory.length === 0 ? '- Chưa có dữ liệu thi thử' : stats.examHistory.slice(0, 3).map((e, idx) => `  * Lần ${idx + 1} (${e.date}): ${e.score}/1000 điểm - ${e.passed ? 'PASS' : 'DID NOT PASS'} (${Math.floor(e.timeSpentSeconds / 60)} phút)`).join('\n')}

4. LỜI NHẮN TỪ HỌC VIÊN
"${studentNote}"

Báo cáo được khởi tạo tự động từ hệ thống MOS Master Platform.`;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`[MOS Master] Báo Cáo Tiến Độ Ôn Tập - ${studentName} (${studentClass})`);
    const body = encodeURIComponent(generateReportText());
    const mailtoUrl = `mailto:${supervisorEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    setSentSuccess(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Gửi Báo Cáo Cho Người Phụ Trách</h3>
              <p className="text-xs text-slate-400">Xuất báo cáo năng lực gửi giáo viên, phụ huynh hoặc quản lý</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ & Tên Học Viên:
              </label>
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lớp / Đơn vị:
              </label>
              <input
                type="text"
                value={studentClass}
                onChange={e => setStudentClass(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên Người Phụ Trách / Thầy Cô:
              </label>
              <input
                type="text"
                value={supervisorName}
                onChange={e => setSupervisorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Người Phụ Trách (tùy chọn):
              </label>
              <input
                type="email"
                placeholder="thayco@truong.edu.vn"
                value={supervisorEmail}
                onChange={e => setSupervisorEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lời Nhắn / Đề Xuất Của Học Viên:
            </label>
            <textarea
              rows={2}
              value={studentNote}
              onChange={e => setStudentNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Live Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Xem trước nội dung báo cáo:
              </span>
              <button
                onClick={handleCopyReport}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép văn bản'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-100 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {generateReportText()}
            </pre>
          </div>

          {sentSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã khởi tạo email gửi báo cáo cho người phụ trách thành công!</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In / Lưu PDF</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao Chép Báo Cáo'}</span>
            </button>

            <button
              onClick={handleSendEmail}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi Qua Email</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
