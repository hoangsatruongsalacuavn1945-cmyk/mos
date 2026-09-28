import React, { useState, useMemo } from 'react';
import { Submission, UserProfile } from '../types/user';
import { downloadMOSExcelFile, downloadModernSectionedCSVReport } from '../utils/excelExporter';
import { soundManager } from '../utils/audio';
import { PrintableGradebookModal } from './PrintableGradebookModal';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  FileText, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Filter, 
  Layers, 
  Users, 
  Award, 
  TrendingUp, 
  Clock, 
  Check, 
  ShieldCheck,
  Search,
  Copy,
  Trophy,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

interface ExcelExportCenterModalProps {
  submissions: Submission[];
  currentUser: UserProfile;
  activeSubject: string;
  activeClass: string;
  onClose: () => void;
}

export const ExcelExportCenterModal: React.FC<ExcelExportCenterModalProps> = ({
  submissions,
  currentUser,
  activeSubject,
  activeClass,
  onClose,
}) => {
  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>(activeSubject || 'all');
  const [selectedClass, setSelectedClass] = useState<string>(activeClass || 'all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'highestScore' | 'avgScore' | 'name' | 'latest' | 'attempts'>('highestScore');

  // Preview tab
  const [activePreviewTab, setActivePreviewTab] = useState<'summary' | 'students' | 'domains' | 'rankings' | 'submissions'>('summary');
  
  // Customization checkboxes for sheets
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeStudents, setIncludeStudents] = useState(true);
  const [includeDomains, setIncludeDomains] = useState(true);
  const [includeRankings, setIncludeRankings] = useState(true);
  const [includeSubs, setIncludeSubs] = useState(true);

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Available classes extracted from submissions
  const availableClasses = useMemo(() => {
    return Array.from(new Set(submissions.map(s => s.classRoom).filter(Boolean)));
  }, [submissions]);

  // Filtered submissions based on modal controls
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      // Subject filter
      if (selectedSubject !== 'all' && s.subject !== selectedSubject) return false;
      // Class filter
      if (selectedClass !== 'all' && s.classRoom !== selectedClass) return false;
      // Exam Type filter
      if (selectedType !== 'all' && s.type !== selectedType) return false;
      // Status filter
      if (selectedStatus === 'passed' && !s.passed) return false;
      if (selectedStatus === 'failed' && s.passed) return false;
      if (selectedStatus === 'high-score' && s.score < 900) return false;
      if (selectedStatus === 'reviewed' && !s.teacherFeedback) return false;
      if (selectedStatus === 'pending-review' && s.teacherFeedback) return false;
      // Search query
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const inName = s.studentName.toLowerCase().includes(q);
        const inCode = s.studentCode?.toLowerCase().includes(q);
        const inClass = s.classRoom?.toLowerCase().includes(q);
        return inName || inCode || inClass;
      }
      return true;
    });
  }, [submissions, selectedSubject, selectedClass, selectedType, selectedStatus, searchFilter]);

  // Group by student
  const studentMap = useMemo(() => {
    const map = new Map<string, {
      studentCode: string;
      studentName: string;
      classRoom: string;
      submissions: Submission[];
    }>();

    for (const sub of filteredSubmissions) {
      const key = sub.studentCode || sub.studentName;
      if (!map.has(key)) {
        map.set(key, {
          studentCode: sub.studentCode || 'N/A',
          studentName: sub.studentName,
          classRoom: sub.classRoom || 'N/A',
          submissions: [],
        });
      }
      map.get(key)!.submissions.push(sub);
    }
    return map;
  }, [filteredSubmissions]);

  // Student metrics with sorting
  const studentList = useMemo(() => {
    const list = Array.from(studentMap.values()).map(st => {
      const sList = st.submissions;
      const scores = sList.map(s => s.score);
      const highestScore = Math.max(...scores);
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
      const passed = highestScore >= 700;
      const totalMinutes = Math.round(sList.reduce((acc, s) => acc + (s.timeSpentSeconds || 0), 0) / 60);

      // Latest submission
      const sortedSubs = [...sList].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      const latestSub = sortedSubs[0];
      const latestFeedback = sortedSubs.find(s => !!s.teacherFeedback);

      return {
        studentCode: st.studentCode,
        studentName: st.studentName,
        classRoom: st.classRoom,
        totalAttempts: sList.length,
        mockCount: sList.filter(s => s.type === 'mock-exam').length,
        practicalCount: sList.filter(s => s.type === 'practical').length,
        highestScore,
        avgScore,
        latestScore: latestSub ? latestSub.score : 0,
        passed,
        totalMinutes,
        latestDate: latestSub ? new Date(latestSub.submittedAt).toLocaleDateString('vi-VN') : '',
        latestRating: latestFeedback?.teacherRating || 'none',
        latestFeedback: latestFeedback?.teacherFeedback || ''
      };
    });

    return list.sort((a, b) => {
      if (sortBy === 'highestScore') return b.highestScore - a.highestScore;
      if (sortBy === 'avgScore') return b.avgScore - a.avgScore;
      if (sortBy === 'attempts') return b.totalAttempts - a.totalAttempts;
      if (sortBy === 'name') return a.studentName.localeCompare(b.studentName, 'vi');
      return 0;
    });
  }, [studentMap, sortBy]);

  // Aggregate metrics
  const totalSubmissions = filteredSubmissions.length;
  const uniqueStudents = studentList.length;
  const passedStudentsCount = studentList.filter(s => s.passed).length;
  const studentPassRate = uniqueStudents > 0 ? Math.round((passedStudentsCount / uniqueStudents) * 100) : 0;
  const passedSubmissionsCount = filteredSubmissions.filter(s => s.passed).length;
  const subPassRate = totalSubmissions > 0 ? Math.round((passedSubmissionsCount / totalSubmissions) * 100) : 0;
  const avgScore = totalSubmissions > 0 
    ? Math.round(filteredSubmissions.reduce((acc, cur) => acc + cur.score, 0) / totalSubmissions) 
    : 0;
  const maxScore = totalSubmissions > 0 ? Math.max(...filteredSubmissions.map(s => s.score)) : 0;

  // Aggregate domain competencies
  const domainStats = useMemo(() => {
    const map = new Map<string, { total: number; correct: number }>();
    for (const sub of filteredSubmissions) {
      if (sub.domainScores) {
        for (const [dom, stat] of Object.entries(sub.domainScores)) {
          if (!map.has(dom)) {
            map.set(dom, { total: 0, correct: 0 });
          }
          const curr = map.get(dom)!;
          curr.total += stat.total;
          curr.correct += stat.correct;
        }
      }
    }
    return Array.from(map.entries()).map(([domain, stat]) => ({
      domain,
      total: stat.total,
      correct: stat.correct,
      rate: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [filteredSubmissions]);

  // Handle Export native Excel (.XLSX)
  const handleExportXLSX = () => {
    soundManager.playClick();
    const filename = downloadMOSExcelFile(filteredSubmissions, {
      subject: selectedSubject,
      classRoomFilter: selectedClass,
      teacher: currentUser,
      includeSummarySheet: includeSummary,
      includeStudentsSheet: includeStudents,
      includeDomainsSheet: includeDomains,
      includeRankingsSheet: includeRankings,
      includeSubmissionsSheet: includeSubs,
    });
    soundManager.playCorrect();
    setDownloadSuccess(`Đã xuất thành công tệp Excel đa trang tính: "${filename}"! Mở bằng Microsoft Excel ngay mà không gặp lỗi dồn cột.`);
    setTimeout(() => setDownloadSuccess(null), 7000);
  };

  // Handle Export modern sectioned CSV (Student Info, Exam Attempts, Progress History)
  const handleExportCSV = () => {
    soundManager.playClick();
    const filename = downloadModernSectionedCSVReport(filteredSubmissions, {
      subject: selectedSubject,
      classRoomFilter: selectedClass,
      teacher: currentUser,
    });
    soundManager.playCorrect();
    setDownloadSuccess(`Đã tải tệp CSV chia mục rõ ràng (Student Info, Exam Attempts, Progress History): "${filename}"!`);
    setTimeout(() => setDownloadSuccess(null), 6000);
  };

  const handlePrint = () => {
    soundManager.playClick();
    setShowPrintModal(true);
  };

  // Copy current table to Clipboard as TSV (tab-separated, directly paste-able into Excel or Google Sheets)
  const handleCopyClipboard = () => {
    soundManager.playClick();
    let textToCopy = '';

    if (activePreviewTab === 'students' || activePreviewTab === 'summary') {
      const headers = ['STT', 'Mã Sinh Viên', 'Họ Và Tên', 'Lớp', 'Lượt Làm Bài', 'Điểm Cao Nhất', 'Điểm Trung Bình', 'Trạng Thái', 'Đánh Giá GV'];
      const rows = studentList.map((st, i) => [
        i + 1,
        st.studentCode,
        st.studentName,
        st.classRoom,
        st.totalAttempts,
        st.highestScore,
        st.avgScore,
        st.passed ? 'ĐẠT (PASS)' : 'CHƯA ĐẠT',
        st.latestRating === 'excellent' ? 'Xuất Sắc' : st.latestRating === 'good' ? 'Đạt Chuẩn' : 'Chưa Chấm'
      ]);
      textToCopy = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    } else if (activePreviewTab === 'rankings') {
      const headers = ['Hạng', 'Mã Sinh Viên', 'Họ Và Tên', 'Lớp', 'Điểm Cao Nhất', 'Điểm TB', 'Chứng Chỉ', 'Giờ Ôn Tập'];
      const rows = studentList.map((st, i) => [
        i + 1,
        st.studentCode,
        st.studentName,
        st.classRoom,
        st.highestScore,
        st.avgScore,
        st.passed ? 'ĐẠT' : 'CHƯA ĐẠT',
        `${(st.totalMinutes / 60).toFixed(1)}h`
      ]);
      textToCopy = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    } else if (activePreviewTab === 'domains') {
      const headers = ['Lĩnh Vực Thi MOS', 'Số Câu Đúng', 'Tổng Số Câu', 'Tỉ Lệ Đúng'];
      const rows = domainStats.map(d => [d.domain, d.correct, d.total, `${d.rate}%`]);
      textToCopy = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    } else {
      const headers = ['Mã SV', 'Họ Tên', 'Lớp', 'Môn Thi', 'Loại Bài', 'Điểm', 'Kết Quả', 'Ngày Nộp'];
      const rows = filteredSubmissions.map(s => [
        s.studentCode || 'N/A',
        s.studentName,
        s.classRoom || 'N/A',
        s.subject.toUpperCase(),
        s.type,
        s.score,
        s.passed ? 'PASS' : 'FAIL',
        new Date(s.submittedAt).toLocaleDateString('vi-VN')
      ]);
      textToCopy = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      soundManager.playCorrect();
      setCopiedSuccess('Đã sao chép bảng dữ liệu vào Clipboard! Bạn có thể nhấn Ctrl+V dán trực tiếp vào Excel hoặc Google Sheets.');
      setTimeout(() => setCopiedSuccess(null), 4000);
    });
  };

  const resetFilters = () => {
    soundManager.playClick();
    setSelectedSubject('all');
    setSelectedClass('all');
    setSelectedType('all');
    setSelectedStatus('all');
    setSearchFilter('');
    setSortBy('highestScore');
  };

  const selectAllSheets = () => {
    soundManager.playClick();
    setIncludeSummary(true);
    setIncludeStudents(true);
    setIncludeDomains(true);
    setIncludeRankings(true);
    setIncludeSubs(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ========================================================
            HEADER
        ======================================================== */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-900/40 shrink-0 border border-emerald-400/30">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Trung Tâm Xuất Báo Cáo Excel Đa Trang Tính (.XLSX)
                </span>
                <span className="text-[11px] text-slate-400">· Chuẩn Khảo Thí Certiport & Microsoft Excel</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black mt-1 text-white flex items-center gap-2">
                Hệ Thống Trích Xuất Sổ Điểm & Báo Cáo Chuyên Nghiệp
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Chia mục rõ ràng, tự động phân sheet: Tổng quan KPI, Sổ điểm học viên, Phân tích kỹ năng, Bảng xếp hạng và Nhật ký đối soát.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================
            ALERTS / NOTIFICATIONS
        ======================================================== */}
        {downloadSuccess && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {copiedSuccess && (
          <div className="px-6 py-2.5 bg-blue-50 border-b border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{copiedSuccess}</span>
          </div>
        )}

        {/* Scrollable Container with Sections */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
          
          {/* ========================================================
              MỤC 1: BỘ LỌC DỮ LIỆU & PHẠM VI XUẤT (Clear Section 1)
          ======================================================== */}
          <div className="p-5 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mục 1: Thiết Lập Bộ Lọc & Phạm Vi Dữ Liệu</span>
              </h3>
              <button
                onClick={resetFilters}
                className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                title="Khôi phục các bộ lọc về mặc định"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại bộ lọc</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {/* Filter 1: Subject */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">MÔN THI:</label>
                <select
                  value={selectedSubject}
                  onChange={e => {
                    soundManager.playClick();
                    setSelectedSubject(e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Tất cả môn MOS</option>
                  <option value="word">MOS Word 365/2019</option>
                  <option value="excel">MOS Excel 365/2019</option>
                  <option value="powerpoint">MOS PowerPoint</option>
                </select>
              </div>

              {/* Filter 2: Class */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">LỚP HỌC:</label>
                <select
                  value={selectedClass}
                  onChange={e => {
                    soundManager.playClick();
                    setSelectedClass(e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Tất cả lớp ({availableClasses.length})</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Filter 3: Exam Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">LOẠI BÀI THI:</label>
                <select
                  value={selectedType}
                  onChange={e => {
                    soundManager.playClick();
                    setSelectedType(e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Tất cả loại bài</option>
                  <option value="mock-exam">Thi thử Certiport (50p)</option>
                  <option value="practical">Dự án thực hành Ribbon</option>
                  <option value="theory-quiz">Trắc nghiệm lý thuyết</option>
                </select>
              </div>

              {/* Filter 4: Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">KẾT QUẢ ĐẠT / HỎNG:</label>
                <select
                  value={selectedStatus}
                  onChange={e => {
                    soundManager.playClick();
                    setSelectedStatus(e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Tất cả kết quả</option>
                  <option value="passed">Chỉ học viên ĐẠT (từ 700 điểm)</option>
                  <option value="failed">Chưa đạt (Dưới 700 điểm)</option>
                  <option value="high-score">Học viên xuất sắc (từ 900 điểm)</option>
                  <option value="reviewed">Đã có lời phê GV</option>
                  <option value="pending-review">Chờ GV nhận xét</option>
                </select>
              </div>

              {/* Filter 5: Sort By */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">SẮP XẾP SỔ ĐIỂM:</label>
                <select
                  value={sortBy}
                  onChange={e => {
                    soundManager.playClick();
                    setSortBy(e.target.value as any);
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="highestScore">Điểm cao nhất (Max)</option>
                  <option value="avgScore">Điểm trung bình (TB)</option>
                  <option value="name">Họ và tên (A - Z)</option>
                  <option value="attempts">Lượt làm bài nhiều nhất</option>
                </select>
              </div>

              {/* Filter 6: Realtime Search */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">TÌM HỌC VIÊN:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Tên, MSSV, Lớp..."
                    className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              MỤC 2: CẤU HÌNH CÁC TRANG TÍNH EXCEL (Clear Section 2)
          ======================================================== */}
          <div className="p-5 bg-white space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mục 2: Chọn Các Trang Tính Độc Lập Trong Tệp Excel (.XLSX)</span>
              </h3>
              <button
                onClick={selectAllSheets}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                + Bật chọn toàn bộ 5 Sheet
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* Sheet 1 */}
              <label className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                includeSummary 
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold' 
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <input
                  type="checkbox"
                  checked={includeSummary}
                  onChange={e => {
                    soundManager.playClick();
                    setIncludeSummary(e.target.checked);
                  }}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-extrabold flex items-center gap-1">
                    <span>Sheet 1: Tổng Quan & KPI</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                    11 chỉ số khảo thí toàn diện, tỉ lệ pass, phân loại điểm số.
                  </p>
                </div>
              </label>

              {/* Sheet 2 */}
              <label className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                includeStudents 
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold' 
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <input
                  type="checkbox"
                  checked={includeStudents}
                  onChange={e => {
                    soundManager.playClick();
                    setIncludeStudents(e.target.checked);
                  }}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-extrabold flex items-center gap-1">
                    <span>Sheet 2: Sổ Điểm Học Viên</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                    18 cột: MSSV, Điểm cao nhất, Điểm TB, Trạng thái, Lời phê GV.
                  </p>
                </div>
              </label>

              {/* Sheet 3 */}
              <label className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                includeDomains 
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold' 
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <input
                  type="checkbox"
                  checked={includeDomains}
                  onChange={e => {
                    soundManager.playClick();
                    setIncludeDomains(e.target.checked);
                  }}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-extrabold flex items-center gap-1">
                    <span>Sheet 3: Kỹ Năng Domain</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                    Thống kê tỉ lệ đúng theo từng mục tiêu chuẩn bài thi Certiport.
                  </p>
                </div>
              </label>

              {/* Sheet 4 */}
              <label className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                includeRankings 
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold' 
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <input
                  type="checkbox"
                  checked={includeRankings}
                  onChange={e => {
                    soundManager.playClick();
                    setIncludeRankings(e.target.checked);
                  }}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-extrabold flex items-center gap-1">
                    <span>Sheet 4: Bảng Xếp Hạng Top</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                    Vinh danh Thủ Khoa, Á Khoa, xếp loại năng lực Xuất Sắc/Giỏi.
                  </p>
                </div>
              </label>

              {/* Sheet 5 */}
              <label className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                includeSubs 
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold' 
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <input
                  type="checkbox"
                  checked={includeSubs}
                  onChange={e => {
                    soundManager.playClick();
                    setIncludeSubs(e.target.checked);
                  }}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-extrabold flex items-center gap-1">
                    <span>Sheet 5: Nhật Ký Bài Nộp</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                    Toàn bộ lịch sử nộp bài kèm mốc thời gian để tra cứu, đối soát.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* ========================================================
              MỤC 3: XEM TRƯỚC DỮ LIỆU TRỰC QUAN (Clear Section 3)
          ======================================================== */}
          <div className="p-5 bg-slate-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mục 3: Xem Trước Dữ Liệu Trực Quan</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  ({uniqueStudents} học viên · {filteredSubmissions.length} bài nộp)
                </span>
              </div>

              {/* Quick Copy Button */}
              <button
                onClick={handleCopyClipboard}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 self-start sm:self-auto"
                title="Sao chép bảng dữ liệu hiện tại vào Clipboard để dán trực tiếp vào Google Sheets / Excel"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sao Chép Sheet Này (Copy TSV)</span>
              </button>
            </div>

            {/* Preview Sheet Selector Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100/80 p-1.5 rounded-xl overflow-x-auto text-xs font-bold">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActivePreviewTab('summary');
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                  activePreviewTab === 'summary'
                    ? 'bg-white text-emerald-900 shadow-xs font-black border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sheet 1: Tổng Quan & KPI</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setActivePreviewTab('students');
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                  activePreviewTab === 'students'
                    ? 'bg-white text-emerald-900 shadow-xs font-black border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Sheet 2: Bảng Điểm ({studentList.length})</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setActivePreviewTab('rankings');
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                  activePreviewTab === 'rankings'
                    ? 'bg-white text-emerald-900 shadow-xs font-black border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Sheet 3: Bảng Xếp Hạng Top</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setActivePreviewTab('domains');
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                  activePreviewTab === 'domains'
                    ? 'bg-white text-emerald-900 shadow-xs font-black border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-purple-600" />
                <span>Sheet 4: Kỹ Năng Domain ({domainStats.length})</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setActivePreviewTab('submissions');
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                  activePreviewTab === 'submissions'
                    ? 'bg-white text-emerald-900 shadow-xs font-black border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Sheet 5: Nhật Ký Bài Nộp ({filteredSubmissions.length})</span>
              </button>
            </div>

            {/* TAB CONTENT PREVIEW CONTAINER */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              
              {/* TAB 1: SUMMARY KPI PREVIEW */}
              {activePreviewTab === 'summary' && (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-bold mb-1 uppercase">Tổng Học Viên</div>
                      <div className="text-2xl font-black text-slate-900">{uniqueStudents}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Đã tham gia khảo thí</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="text-[11px] text-emerald-700 font-bold mb-1 uppercase">Tỉ Lệ Đạt Chứng Chỉ</div>
                      <div className="text-2xl font-black text-emerald-600">{studentPassRate}%</div>
                      <div className="text-[11px] text-emerald-700 mt-1">{passedStudentsCount} học viên đạt &gt;= 700đ</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
                      <div className="text-[11px] text-indigo-700 font-bold mb-1 uppercase">Điểm Trung Bình Toàn Môn</div>
                      <div className="text-2xl font-black text-indigo-700">{avgScore} <span className="text-xs font-normal">/ 1000</span></div>
                      <div className="text-[11px] text-indigo-600 mt-1">Điểm cao nhất: {maxScore}</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                      <div className="text-[11px] text-blue-700 font-bold mb-1 uppercase">Tổng Lượt Nộp Khảo Thí</div>
                      <div className="text-2xl font-black text-blue-700">{totalSubmissions}</div>
                      <div className="text-[11px] text-blue-600 mt-1">Tỉ lệ bài đạt: {subPassRate}%</div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <strong className="text-slate-800 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Thông Tin Tệp Excel Sẽ Được Xuất Ra:</span>
                    </strong>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600 text-[11px]">
                      <li>• <strong>Môn khảo thí:</strong> MOS {selectedSubject.toUpperCase()}</li>
                      <li>• <strong>Giảng viên phụ trách:</strong> {currentUser.name} ({currentUser.email})</li>
                      <li>• <strong>Thời gian xuất:</strong> {new Date().toLocaleString('vi-VN')}</li>
                      <li>• <strong>Bộ lọc lớp học:</strong> {selectedClass === 'all' ? 'Tất cả các lớp' : `Lớp ${selectedClass}`}</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: STUDENTS TABLE PREVIEW */}
              {activePreviewTab === 'students' && (
                <div className="overflow-x-auto max-h-[360px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2.5 px-3">STT</th>
                        <th className="py-2.5 px-3">Mã SV</th>
                        <th className="py-2.5 px-3">Họ Và Tên</th>
                        <th className="py-2.5 px-3">Lớp</th>
                        <th className="py-2.5 px-3 text-center">Lượt Thi</th>
                        <th className="py-2.5 px-3 text-center">Điểm Max</th>
                        <th className="py-2.5 px-3 text-center">Điểm TB</th>
                        <th className="py-2.5 px-3">Trạng Thái</th>
                        <th className="py-2.5 px-3">Đánh Giá GV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400">
                            Không tìm thấy học viên nào phù hợp với bộ lọc hiện tại.
                          </td>
                        </tr>
                      ) : (
                        studentList.map((st, idx) => (
                          <tr key={st.studentCode + idx} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-700">{st.studentCode}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{st.studentName}</td>
                            <td className="py-2 px-3 text-slate-600">{st.classRoom}</td>
                            <td className="py-2 px-3 text-center font-semibold text-slate-700">{st.totalAttempts}</td>
                            <td className="py-2 px-3 text-center font-black text-slate-900">{st.highestScore}</td>
                            <td className="py-2 px-3 text-center text-slate-700">{st.avgScore}</td>
                            <td className="py-2 px-3">
                              {st.passed ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  ĐẠT (PASS)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                  CHƯA ĐẠT
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-[11px]">
                              {st.latestRating === 'excellent' ? (
                                <span className="font-bold text-emerald-700">Xuất Sắc 🌟</span>
                              ) : st.latestRating === 'good' ? (
                                <span className="font-semibold text-blue-700">Đạt Chuẩn 👍</span>
                              ) : st.latestRating === 'needs-improvement' ? (
                                <span className="font-semibold text-amber-700">Cần Ôn Lại ⚠️</span>
                              ) : (
                                <span className="text-slate-400">Chưa chấm</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: RANKINGS TABLE PREVIEW */}
              {activePreviewTab === 'rankings' && (
                <div className="overflow-x-auto max-h-[360px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Thứ Hạng</th>
                        <th className="py-2.5 px-3">Mã SV</th>
                        <th className="py-2.5 px-3">Họ Và Tên</th>
                        <th className="py-2.5 px-3">Lớp</th>
                        <th className="py-2.5 px-3 text-center">Điểm Max</th>
                        <th className="py-2.5 px-3 text-center">Điểm TB</th>
                        <th className="py-2.5 px-3">Xếp Loại Danh Hiệu</th>
                        <th className="py-2.5 px-3 text-center">Thời Gian Ôn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentList.map((st, idx) => {
                        let rankBadge = `#${idx + 1}`;
                        if (idx === 0) rankBadge = '🥇 Hạng 1 (Thủ Khoa)';
                        else if (idx === 1) rankBadge = '🥈 Hạng 2 (Á Khoa)';
                        else if (idx === 2) rankBadge = '🥉 Hạng 3';

                        let level = 'Chưa Đạt';
                        if (st.highestScore >= 950) level = 'Xuất Sắc Đặc Biệt 🏆';
                        else if (st.highestScore >= 900) level = 'Xuất Sắc ⭐';
                        else if (st.highestScore >= 800) level = 'Giỏi ✨';
                        else if (st.highestScore >= 700) level = 'Khá - Đạt Chuẩn 👍';
                        else if (st.highestScore >= 500) level = 'Trung Bình';

                        return (
                          <tr key={st.studentCode + idx} className={`hover:bg-slate-50 ${idx < 3 ? 'bg-amber-50/30' : ''}`}>
                            <td className="py-2 px-3 font-bold text-slate-800">{rankBadge}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-700">{st.studentCode}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{st.studentName}</td>
                            <td className="py-2 px-3 text-slate-600">{st.classRoom}</td>
                            <td className="py-2 px-3 text-center font-black text-slate-900">{st.highestScore}</td>
                            <td className="py-2 px-3 text-center font-bold text-indigo-700">{st.avgScore}</td>
                            <td className="py-2 px-3 font-semibold text-slate-700">{level}</td>
                            <td className="py-2 px-3 text-center text-slate-500">{(st.totalMinutes / 60).toFixed(1)} giờ</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: DOMAINS PREVIEW */}
              {activePreviewTab === 'domains' && (
                <div className="p-4 space-y-2.5 max-h-[360px] overflow-y-auto">
                  {domainStats.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Chưa có dữ liệu phân tích domain cho các bài nộp được chọn.
                    </div>
                  ) : (
                    domainStats.map(d => (
                      <div key={d.domain} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <strong className="text-slate-800 font-bold">{d.domain}</strong>
                          <span className="font-black text-slate-900">{d.correct}/{d.total} câu ({d.rate}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              d.rate >= 80 ? 'bg-emerald-500' : d.rate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${d.rate}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: SUBMISSIONS LOG PREVIEW */}
              {activePreviewTab === 'submissions' && (
                <div className="overflow-x-auto max-h-[360px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Học Viên</th>
                        <th className="py-2.5 px-3">Môn Thi</th>
                        <th className="py-2.5 px-3">Loại Bài</th>
                        <th className="py-2.5 px-3 text-center">Điểm</th>
                        <th className="py-2.5 px-3 text-center">Kết Quả</th>
                        <th className="py-2.5 px-3">Thời Gian Nộp</th>
                        <th className="py-2.5 px-3">Lời Phê GV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubmissions.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {s.studentName}
                            <span className="block text-[10px] text-slate-400 font-normal">{s.studentCode} · {s.classRoom}</span>
                          </td>
                          <td className="py-2 px-3 uppercase text-[10px] font-bold">MOS {s.subject}</td>
                          <td className="py-2 px-3 text-slate-600">{s.type}</td>
                          <td className="py-2 px-3 text-center font-black text-slate-900">{s.score}/1000</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              s.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {s.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-500">
                            {new Date(s.submittedAt).toLocaleDateString('vi-VN')} {new Date(s.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-600 max-w-[220px] truncate">
                            {s.teacherFeedback || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            MỤC 4: BẢNG ĐIỀU KHIỂN XUẤT TỆP (Clear Section 4 - Actions)
        ======================================================== */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 border-t border-slate-800">
          <div className="text-xs text-slate-300 font-medium">
            Phạm vi xuất: <strong className="text-emerald-400 uppercase font-bold">MOS {selectedSubject}</strong> · {studentList.length} học viên ({filteredSubmissions.length} bài nộp)
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Print / Save PDF */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Mở giao diện in ấn hoặc lưu trang báo cáo thành file PDF chuẩn A4"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>In / Lưu PDF</span>
            </button>

            {/* CSV Export */}
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Xuất file CSV tối ưu hóa ký tự sep=, tự động chia cột trên Windows Excel"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Xuất CSV (sep=,)</span>
            </button>

            {/* Native Excel XLSX Export */}
            <button
              onClick={handleExportXLSX}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-black transition-all shadow-lg hover:shadow-xl flex items-center gap-2 ring-2 ring-emerald-400/40 active:scale-95"
              title="Xuất ngay file Microsoft Excel (.XLSX) đa sheet với đầy đủ định dạng cột"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>XUẤT TỆP EXCEL (.XLSX) ĐA SHEET</span>
            </button>
          </div>
        </div>

      </div>

      {/* Printable A4 Gradebook & Save as PDF Modal */}
      {showPrintModal && (
        <PrintableGradebookModal
          submissions={filteredSubmissions}
          currentUser={currentUser}
          activeSubject={selectedSubject}
          activeClass={selectedClass}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
