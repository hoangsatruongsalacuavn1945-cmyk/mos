import React, { useState, useEffect } from 'react';
import { useAuthStore, fetchSubmissions } from '../../utils/userStore';
import { Submission } from '../../types/user';
import { soundManager } from '../../utils/audio';
import { 
  BarChart3, 
  Search, 
  Download, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Users, 
  BookOpen, 
  Filter, 
  Clock, 
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export const Gradebook: React.FC = () => {
  const { user } = useAuthStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<'all' | 'word' | 'excel' | 'powerpoint'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');

  useEffect(() => {
    fetchSubmissions().then(data => setSubmissions(data));
  }, []);

  const filtered = submissions.filter(sub => {
    const matchesSubject = subjectFilter === 'all' || sub.subject === subjectFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'passed' && sub.passed) || 
      (statusFilter === 'failed' && !sub.passed);
    const matchesSearch = sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.classRoom.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesStatus && matchesSearch;
  });

  const passedCount = filtered.filter(s => s.passed).length;
  const passRate = filtered.length > 0 ? Math.round((passedCount / filtered.length) * 100) : 0;
  const avgScore = filtered.length > 0 ? Math.round(filtered.reduce((acc, s) => acc + s.score, 0) / filtered.length) : 0;

  const handleExportCSV = () => {
    soundManager.playClick();
    if (filtered.length === 0) return;

    const headers = ['STT', 'Mã Sinh Viên', 'Họ và Tên', 'Lớp Học', 'Môn Thi', 'Điểm Số', 'Kết Quả', 'Thời Gian Làm Bài', 'Ngày Nộp', 'Đánh Giá GV'];
    const rows = filtered.map((s, idx) => [
      idx + 1,
      `"${s.studentCode}"`,
      `"${s.studentName}"`,
      `"${s.classRoom}"`,
      `"MOS ${s.subject.toUpperCase()}"`,
      s.score,
      s.passed ? '"Đạt (Passed)"' : '"Chưa đạt"',
      `"${Math.round(s.timeSpentSeconds / 60)} phút"`,
      `"${new Date(s.submittedAt).toLocaleDateString('vi-VN')}"`,
      `"${s.teacherFeedback || 'Chưa nhận xét'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `so-diem-mos-khao-thi-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    soundManager.playCorrect();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
              SỔ ĐIỂM ĐIỆN TỬ
            </span>
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-xs text-slate-400">Giảng Viên: <b className="text-white">{user.name}</b></span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Bảng Thống Kê & Kết Quả Thi Thử Của Thí Sinh
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tổng hợp dữ liệu bài nộp toàn khóa: Điểm thi Certiport, tỷ lệ đạt chuẩn quốc tế và đánh giá bài thi.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Sổ Điểm (.CSV)</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Tổng Bài Thi</div>
          <div className="text-2xl font-black text-white mt-1">{filtered.length} Bài Nộp</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Tỷ Lệ Đạt (≥ 700)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{passRate}%</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Điểm Trung Bình</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{avgScore} / 1000</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Đạt Chứng Chỉ</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{passedCount} Thí Sinh</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên học viên, MSSV hoặc lớp..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
          >
            <option value="all">Tất cả môn thi</option>
            <option value="excel">MOS Excel</option>
            <option value="word">MOS Word</option>
            <option value="powerpoint">MOS PowerPoint</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
          >
            <option value="all">Tất cả kết quả</option>
            <option value="passed">Đạt (≥ 700)</option>
            <option value="failed">Chưa đạt (&lt; 700)</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Thí Sinh</th>
                <th className="py-3 px-4">Mã Số / Lớp</th>
                <th className="py-3 px-4">Môn Thi</th>
                <th className="py-3 px-4">Điểm Số Certiport</th>
                <th className="py-3 px-4">Kết Quả</th>
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4">Nhận Xét GV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy bài nộp nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {sub.studentName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      <div>{sub.studentCode}</div>
                      <div className="text-slate-400 text-[10px]">{sub.classRoom}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        MOS {sub.subject}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-sm">
                      <span className={sub.passed ? 'text-emerald-400' : 'text-red-400'}>
                        {sub.score}
                      </span>
                      <span className="text-slate-500 font-normal text-xs"> / 1000</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        sub.passed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {sub.passed ? 'Đạt' : 'Chưa đạt'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-[11px] max-w-xs truncate">
                      {sub.teacherFeedback || <span className="text-slate-500 italic">Chưa phản hồi</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Gradebook;
