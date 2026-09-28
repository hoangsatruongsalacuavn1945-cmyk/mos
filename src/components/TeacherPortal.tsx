import React, { useState, useEffect } from 'react';
import { UserProfile, Submission } from '../types/user';
import { fetchSubmissions, submitTeacherFeedback, DEFAULT_TEACHERS } from '../utils/userStore';
import { soundManager } from '../utils/audio';
import { ExcelExportCenterModal } from './ExcelExportCenterModal';
import { PrintableGradebookModal } from './PrintableGradebookModal';
import { downloadModernSectionedCSVReport } from '../utils/excelExporter';
import { 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  Award, 
  TrendingUp, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  FileText, 
  Download, 
  Printer, 
  Send, 
  Eye, 
  ChevronRight, 
  AlertCircle,
  Sparkles,
  BookOpen,
  RefreshCw,
  FileSpreadsheet,
  X
} from 'lucide-react';

interface TeacherPortalProps {
  currentUser: UserProfile;
  onSwitchToStudentView: () => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  currentUser,
  onSwitchToStudentView,
}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>(currentUser.targetSubject || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed' | 'pending-review'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  
  // Selected submission for deep inspection & feedback modal
  const [inspectingSub, setInspectingSub] = useState<Submission | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState<'excellent' | 'good' | 'needs-improvement'>('good');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    // Fetch submissions for this teacher or all if admin/all
    const data = await fetchSubmissions({
      teacherId: currentUser.role === 'teacher' ? currentUser.id : undefined,
      subject: subjectFilter !== 'all' ? subjectFilter : undefined,
    });
    setSubmissions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id, subjectFilter]);

  // Calculations for KPI Cards
  const totalSubmissions = submissions.length;
  const uniqueStudents = new Set(submissions.map(s => s.studentCode || s.studentName)).size;
  const passedCount = submissions.filter(s => s.passed).length;
  const passRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;
  const avgScore = totalSubmissions > 0 ? Math.round(submissions.reduce((acc, cur) => acc + cur.score, 0) / totalSubmissions) : 0;
  const pendingFeedbackCount = submissions.filter(s => !s.teacherFeedback).length;

  // Filtered submissions
  const filteredSubmissions = submissions.filter(sub => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = sub.studentName.toLowerCase().includes(q);
      const matchCode = sub.studentCode?.toLowerCase().includes(q);
      const matchClass = sub.classRoom?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchClass) return false;
    }
    // Subject
    if (subjectFilter !== 'all' && sub.subject !== subjectFilter) {
      return false;
    }
    // Status
    if (statusFilter === 'passed' && !sub.passed) return false;
    if (statusFilter === 'failed' && sub.passed) return false;
    if (statusFilter === 'pending-review' && sub.teacherFeedback) return false;
    // Class
    if (classFilter !== 'all' && sub.classRoom !== classFilter) return false;

    return true;
  });

  const availableClasses = Array.from(new Set(submissions.map(s => s.classRoom).filter(Boolean)));

  const handleOpenInspect = (sub: Submission) => {
    soundManager.playClick();
    setInspectingSub(sub);
    setFeedbackText(sub.teacherFeedback || '');
    setFeedbackRating(sub.teacherRating || (sub.passed ? 'good' : 'needs-improvement'));
    setFeedbackSuccess(false);
  };

  const handleSendFeedback = async () => {
    if (!inspectingSub || !feedbackText.trim()) return;
    setSubmittingFeedback(true);
    soundManager.playClick();
    const success = await submitTeacherFeedback(inspectingSub.id, feedbackText.trim(), feedbackRating);
    if (success) {
      soundManager.playCorrect();
      setFeedbackSuccess(true);
      // Update local state in list
      setSubmissions(prev => prev.map(s => {
        if (s.id === inspectingSub.id) {
          return {
            ...s,
            teacherFeedback: feedbackText.trim(),
            teacherFeedbackAt: new Date().toISOString(),
            teacherRating: feedbackRating,
            status: 'reviewed',
          };
        }
        return s;
      }));
      setInspectingSub(prev => prev ? {
        ...prev,
        teacherFeedback: feedbackText.trim(),
        teacherFeedbackAt: new Date().toISOString(),
        teacherRating: feedbackRating,
        status: 'reviewed',
      } : null);
      setTimeout(() => setFeedbackSuccess(false), 2500);
    }
    setSubmittingFeedback(false);
  };

  const handleExportCSV = () => {
    soundManager.playClick();
    downloadModernSectionedCSVReport(filteredSubmissions, {
      subject: subjectFilter,
      classRoomFilter: classFilter,
      teacher: currentUser,
    });
    soundManager.playCorrect();
  };

  const handleExportSummary = () => {
    soundManager.playClick();
    downloadModernSectionedCSVReport(submissions, {
      subject: subjectFilter,
      classRoomFilter: classFilter,
      teacher: currentUser,
    });
    soundManager.playCorrect();
  };

  const currentTeacherInfo = DEFAULT_TEACHERS.find(t => t.id === currentUser.assignedTeacherId || t.id === currentUser.id) || DEFAULT_TEACHERS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Teacher Top Identity & Action Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shrink-0">
              {currentUser.name.split(' ').slice(-1)[0][0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Cổng Giảng Viên Phụ Trách Bộ Môn
                </span>
                <span className="text-xs text-slate-400">· Hệ Thống Quản Lý Điểm Khảo Thí</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-1">
                {currentUser.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {currentTeacherInfo.title} · {currentTeacherInfo.department}
              </p>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span>Hòm thư nhận bài: <strong className="text-slate-200">{currentUser.email}</strong></span>
                <span>·</span>
                <span>Phụ trách: <strong className="text-emerald-400 uppercase">MOS {subjectFilter}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadData}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Làm mới danh sách bài nộp"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Đồng Bộ Mới</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setShowExportModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 ring-2 ring-emerald-400/40"
              title="Mở Trung Tâm Xuất Báo Cáo & Sổ Điểm Excel (.XLSX) Đa Sheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Xuất Excel Đa Năng (.XLSX)</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setShowPrintModal(true);
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-xl border border-slate-700 transition-colors shadow-xs flex items-center gap-1.5"
              title="Xem bản in & Lưu dưới dạng file PDF chuẩn A4"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>In & Lưu PDF</span>
            </button>

            <button
              onClick={handleExportSummary}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              title="Xuất Báo Cáo Tổng Hợp Kết Quả & Hoạt Động Học Viên Theo Môn (CSV)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Summary (CSV)</span>
            </button>

            <button
              onClick={onSwitchToStudentView}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Xem Góc Học Viên</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Học Viên Đã Nộp</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{uniqueStudents}</div>
          <div className="text-[11px] text-slate-500 mt-1">Tổng {totalSubmissions} lượt làm bài</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Tỉ Lệ Đạt (Pass)</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{passRate}%</div>
          <div className="text-[11px] text-emerald-700 mt-1">{passedCount} bài đạt chuẩn {'>='} 700đ</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Điểm Trung Bình</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{avgScore} <span className="text-xs font-normal text-slate-400">/ 1000</span></div>
          <div className="text-[11px] text-slate-500 mt-1">Thang điểm chuẩn Certiport</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Cần Nhận Xét</span>
            <MessageSquare className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{pendingFeedbackCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Bài nộp đang chờ giáo viên chấm</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên học viên, mã SV, lớp..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Subject filter */}
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            >
              <option value="all">Môn: Tất cả môn</option>
              <option value="word">MOS Word (MO-100)</option>
              <option value="excel">MOS Excel (MO-200)</option>
              <option value="powerpoint">MOS PowerPoint (MO-300)</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            >
              <option value="all">Kết quả: Tất cả</option>
              <option value="passed">Chỉ bài ĐẠT (Pass {'>='} 700)</option>
              <option value="failed">Chỉ bài CHƯA ĐẠT (Fail {'<'} 700)</option>
              <option value="pending-review">Chưa nhận xét</option>
            </select>

            {/* Class filter */}
            {availableClasses.length > 0 && (
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                <option value="all">Lớp: Tất cả lớp</option>
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Danh Sách Bài Nộp Của Học Viên ({filteredSubmissions.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Mọi kết quả thi thử & thực hành được gửi tự động về đây</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                setShowExportModal(true);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
              title="Mở Trung Tâm Xuất Báo Cáo & Sổ Điểm Excel (.XLSX) Đa Sheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span>Trung Tâm Xuất Excel (.XLSX)</span>
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setShowPrintModal(true);
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Xem bản in & Lưu dưới dạng file PDF chuẩn A4"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>In & Lưu PDF</span>
            </button>
            <button
              onClick={handleExportSummary}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Xuất Báo Cáo Tổng Hợp Điểm & Hoạt Động (CSV)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">Chưa có bài nộp nào phù hợp với bộ lọc.</p>
            <p className="text-xs text-slate-400 mt-1">Khi học viên hoàn thành bài thi thử hoặc thực hành, kết quả sẽ lập tức hiện tại đây.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Học Viên</th>
                  <th className="py-3 px-4">Lớp / Mã SV</th>
                  <th className="py-3 px-4">Môn Học</th>
                  <th className="py-3 px-4">Điểm Số</th>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Ngày Nộp</th>
                  <th className="py-3 px-4">Trạng Thái GV</th>
                  <th className="py-3 px-4 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map(sub => (
                  <tr 
                    key={sub.id} 
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => handleOpenInspect(sub)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {sub.studentName.charAt(0)}
                        </div>
                        <span>{sub.studentName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div>{sub.classRoom || 'Lớp MOS'}</div>
                      <div className="text-[10px] text-slate-400">{sub.studentCode}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        sub.subject === 'word'
                          ? 'bg-blue-100 text-blue-800'
                          : sub.subject === 'excel'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        MOS {sub.subject}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-slate-900">{sub.score}</span>
                        <span className="text-slate-400">/1000</span>
                        {sub.passed ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            PASS
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 flex items-center gap-0.5">
                            <XCircle className="w-3 h-3 text-red-600" />
                            FAIL
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{Math.round(sub.timeSpentSeconds / 60)} phút</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(sub.submittedAt).toLocaleDateString('vi-VN')} {new Date(sub.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-4">
                      {sub.teacherFeedback ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          Đã Nhận Xét
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Chờ Nhận Xét
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInspect(sub);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-600 border border-blue-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ml-auto shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem & Phê</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect & Feedback Modal */}
      {inspectingSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Chi Tiết Bài Nộp Của Học Viên</h3>
                  <p className="text-xs text-slate-400">
                    {inspectingSub.studentName} · {inspectingSub.classRoom} (Mã SV: {inspectingSub.studentCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingSub(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Score banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                inspectingSub.passed
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : 'bg-red-50/80 border-red-200'
              }`}>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kết quả tổng thể</div>
                  <div className="text-3xl font-black text-slate-900 mt-0.5">
                    {inspectingSub.score} <span className="text-base font-semibold text-slate-500">/ 1000 điểm</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Đúng: <strong>{inspectingSub.correctCount} / {inspectingSub.totalQuestions} câu</strong> · Thời gian: <strong>{Math.round(inspectingSub.timeSpentSeconds / 60)} phút</strong>
                  </div>
                </div>

                <div className="text-right">
                  {inspectingSub.passed ? (
                    <span className="px-3.5 py-1.5 rounded-xl font-black text-sm bg-emerald-600 text-white flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      ĐẠT CHỨNG CHỈ (PASS)
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-xl font-black text-sm bg-red-600 text-white flex items-center gap-1.5 shadow-xs">
                      <XCircle className="w-4 h-4" />
                      CHƯA ĐẠT (CẦN ÔN TẬP)
                    </span>
                  )}
                  <div className="text-[11px] text-slate-500 mt-1">Chuẩn Certiport: 700 điểm</div>
                </div>
              </div>

              {/* Domain Scores breakdown if available */}
              {inspectingSub.domainScores && Object.keys(inspectingSub.domainScores).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Điểm số chi tiết theo từng lĩnh vực (Domain):
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(inspectingSub.domainScores).map(([domain, val]) => {
                      const pct = Math.round((val.correct / val.total) * 100);
                      return (
                        <div key={domain} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-slate-800">{domain}</span>
                            <span className="font-bold text-slate-700">{val.correct}/{val.total} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Wrong Questions inspection */}
              {inspectingSub.wrongQuestions && inspectingSub.wrongQuestions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span>Các câu hỏi học viên trả lời sai ({inspectingSub.wrongQuestions.length} câu):</span>
                  </h4>
                  <div className="space-y-3">
                    {inspectingSub.wrongQuestions.map((q, idx) => (
                      <div key={idx} className="p-3.5 bg-red-50/50 rounded-xl border border-red-200 text-xs">
                        <div className="font-bold text-slate-900 mb-1">Câu {idx + 1}: {q.title}</div>
                        <div className="text-[11px] text-slate-500 mb-2">Lĩnh vực: {q.domainName}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-white rounded-lg border border-red-100 mb-2">
                          <div className="text-red-700">
                            <strong>Học viên chọn:</strong> {q.userAnswerText}
                          </div>
                          <div className="text-emerald-700">
                            <strong>Đáp án chuẩn:</strong> {q.correctAnswerText}
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-600 bg-slate-100 p-2 rounded">
                          <strong>Thao tác Ribbon chuẩn:</strong> {q.officialRibbonPath}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teacher Feedback Section */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>Nhận Xét & Lời Khuyên Của Giáo Viên Dạy Môn:</span>
                  </h4>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFeedbackRating('excellent')}
                      className={`px-2 py-1 text-[10px] font-bold rounded ${
                        feedbackRating === 'excellent' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      🌟 Xuất Sắc
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackRating('good')}
                      className={`px-2 py-1 text-[10px] font-bold rounded ${
                        feedbackRating === 'good' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      👍 Đạt Yêu Cầu
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackRating('needs-improvement')}
                      className={`px-2 py-1 text-[10px] font-bold rounded ${
                        feedbackRating === 'needs-improvement' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      ⚠️ Cần Ôn Lại
                    </button>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Gõ lời nhận xét, chỉ ra phần kiến thức em cần ôn luyện thêm (VD: Hãy ôn lại hàm VLOOKUP tuyệt đối, cách tạo Header Section 2...)"
                  className="w-full p-3 text-xs border border-blue-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />

                <div className="flex items-center justify-between pt-1">
                  {feedbackSuccess ? (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Đã lưu và gửi lời nhận xét thành công cho học viên!
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      Học viên sẽ nhìn thấy lời phê này ngay khi đăng nhập.
                    </span>
                  )}

                  <button
                    onClick={handleSendFeedback}
                    disabled={submittingFeedback || !feedbackText.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingFeedback ? 'Đang Gửi...' : 'Lưu & Gửi Lời Phê'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Mã bài nộp: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-[11px]">{inspectingSub.id}</code>
              </span>
              <button
                onClick={() => setInspectingSub(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Multi-Sheet Excel Export Center Modal */}
      {showExportModal && (
        <ExcelExportCenterModal
          submissions={submissions}
          currentUser={currentUser}
          activeSubject={subjectFilter}
          activeClass={classFilter}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Printable A4 Gradebook & Save as PDF Modal */}
      {showPrintModal && (
        <PrintableGradebookModal
          submissions={submissions}
          currentUser={currentUser}
          activeSubject={subjectFilter}
          activeClass={classFilter}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
