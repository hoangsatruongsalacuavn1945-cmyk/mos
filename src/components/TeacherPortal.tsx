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
  X,
  Sliders,
  Calendar,
  UserCheck,
  Key,
  LogOut,
  Upload,
  Tag,
  Lock,
  ExternalLink
} from 'lucide-react';
import { useGoogleSheetsStore } from '../utils/googleSheetsStore';
import { getMasterGoogleSheetUrl } from '../services/googleSheetsService';

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

  // Sub-sections in Teacher Portal
  const [activeSection, setActiveSection] = useState<'submissions' | 'students' | 'exam-builder' | 'messages'>('submissions');

  // Student Roster Management state
  const [studentRoster, setStudentRoster] = useState<Array<{
    id: string;
    name: string;
    code: string;
    email: string;
    classRoom: string;
    tag: 'excellent' | 'good' | 'needs-attention' | 'at-risk';
    daysInactive: number;
    lastLogin: string;
    avgScore: number;
    examsCompleted: number;
  }>>([
    {
      id: 'stu-1',
      name: 'Trần Minh Quân',
      code: 'K24-CNTT-012',
      email: 'minhquan.k24@student.edu.vn',
      classRoom: 'Lớp MOS-TinHoc01',
      tag: 'excellent',
      daysInactive: 0,
      lastLogin: 'Hôm nay 08:30',
      avgScore: 875,
      examsCompleted: 4,
    },
    {
      id: 'stu-2',
      name: 'Lê Thu Hương',
      code: 'K24-KT-045',
      email: 'thuhuong.k24@student.edu.vn',
      classRoom: 'Lớp MOS-TinHoc01',
      tag: 'excellent',
      daysInactive: 1,
      lastLogin: 'Hôm qua 15:45',
      avgScore: 920,
      examsCompleted: 5,
    },
    {
      id: 'stu-3',
      name: 'Đặng Tuấn Kiệt',
      code: 'K24-QTKD-078',
      email: 'tuankiet.k24@student.edu.vn',
      classRoom: 'Lớp MOS-TinHoc02',
      tag: 'needs-attention',
      daysInactive: 3,
      lastLogin: '3 ngày trước',
      avgScore: 640,
      examsCompleted: 2,
    },
    {
      id: 'stu-4',
      name: 'Vũ Hoàng Yến',
      code: 'K24-NNA-102',
      email: 'hoangyen.k24@student.edu.vn',
      classRoom: 'Lớp MOS-TinHoc02',
      tag: 'good',
      daysInactive: 0,
      lastLogin: 'Hôm nay 10:15',
      avgScore: 850,
      examsCompleted: 3,
    },
    {
      id: 'stu-5',
      name: 'Nguyễn Văn Bách',
      code: 'K24-DTVT-133',
      email: 'vanbach.k24@student.edu.vn',
      classRoom: 'Lớp MOS-TinHoc01',
      tag: 'at-risk',
      daysInactive: 9,
      lastLogin: '9 ngày trước (Cảnh báo)',
      avgScore: 480,
      examsCompleted: 1,
    },
  ]);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [rosterActionMessage, setRosterActionMessage] = useState<string | null>(null);

  // Custom Exam Builder state
  const [examBuilderConfig, setExamBuilderConfig] = useState({
    title: 'Kỳ Thi Đánh Giá Năng Lực MOS Certiport - Học Kỳ 1',
    subject: 'excel',
    durationMinutes: 50,
    passingScore: 700,
    randomizeQuestions: true,
    randomizeOptions: true,
    lockdownFullscreen: true,
    maxViolationsAllowed: 3,
    openTime: '2026-09-28T08:00',
    closeTime: '2026-10-05T23:59',
  });
  const [examSavedToast, setExamSavedToast] = useState(false);

  // Direct Teacher Messaging state
  const [selectedStudentChat, setSelectedStudentChat] = useState<string>('stu-1');
  const [chatMessages, setChatMessages] = useState<Record<string, Array<{ sender: 'teacher' | 'student'; text: string; time: string }>>>({
    'stu-1': [
      { sender: 'student', text: 'Thầy cho em hỏi câu số 12 về hàm XLOOKUP nếu không tìm thấy giá trị thì đối số thứ 4 điền gì ạ?', time: '09:15' },
      { sender: 'teacher', text: 'Chào em, đối số thứ 4 [if_not_found] cho phép em gán chuỗi thông báo ví dụ "Không tìm thấy" thay vì dùng IFERROR như trước nhé!', time: '09:20' },
    ],
    'stu-3': [
      { sender: 'student', text: 'Thưa cô, bài thi thử vừa rồi em bị trừ điểm phần PivotTable, em nên ôn lại mục nào ạ?', time: 'Hôm qua' },
      { sender: 'teacher', text: 'Em xem lại phần Group Date và Calculated Field trong PivotTable nhé, đề thi Certiport rất hay hỏi.', time: 'Hôm qua' },
    ],
  });
  const [newTeacherReply, setNewTeacherReply] = useState('');

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

            <a
              href={useGoogleSheetsStore.getState().spreadsheetUrl || getMasterGoogleSheetUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 border border-emerald-400/40"
              title="Mở Bảng Tính Google Sheets Dữ Liệu Học Viên & Khảo Thí (Chỉ Giáo Viên & Chủ Sở Hữu)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Google Sheets Quản Trị</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
            </a>

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

      {/* 4 Core Teacher Sub-Sections Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-xl border border-slate-300 overflow-x-auto">
        <button
          onClick={() => {
            soundManager.playClick();
            setActiveSection('submissions');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeSection === 'submissions'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Sổ Điểm & Bài Nộp ({submissions.length})</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            setActiveSection('students');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeSection === 'students'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Quản Lý Lớp & Học Sinh ({studentRoster.length})</span>
          {studentRoster.some(s => s.daysInactive >= 7) && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Có học sinh lười hoạt động > 7 ngày" />
          )}
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            setActiveSection('exam-builder');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeSection === 'exam-builder'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Tạo Đề Thi & Lên Lịch (Exam Builder)</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            setActiveSection('messages');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeSection === 'messages'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-purple-600" />
          <span>Hộp Thư Hỏi Đáp Học Sinh</span>
        </button>
      </div>

      {activeSection === 'submissions' && (
        <>
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
                  <th className="py-3 px-4">Giám Sát (Anti-Cheat)</th>
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

                    <td className="py-3 px-4">
                      {sub.violationsCount !== undefined && sub.violationsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>{sub.violationsCount} vi phạm</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Trung thực</span>
                        </span>
                      )}
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
    </>
  )}

  {/* SECTION 2: STUDENT ROSTER & CLASS MANAGEMENT */}
  {activeSection === 'students' && (
    <div className="space-y-6">
      {/* Roster Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Danh Sách Học Viên Lớp Học & Giám Sát Chuyên Cần</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý thẻ phân loại học lực, phát hiện cảnh báo không học bài quá 7 ngày, đặt lại mật khẩu và ngắt phiên gian lận.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              setShowImportModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Import Học Sinh (CSV/Excel)</span>
          </button>
        </div>
      </div>

      {rosterActionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{rosterActionMessage}</span>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3.5 px-4">Mã SV & Họ Tên</th>
                <th className="py-3.5 px-4">Lớp Học</th>
                <th className="py-3.5 px-4">Phân Nhóm Học Lực</th>
                <th className="py-3.5 px-4">Đăng Nhập Gần Nhất</th>
                <th className="py-3.5 px-4 text-center">ĐTB / Số Đề Thi</th>
                <th className="py-3.5 px-4 text-right">Thao Tác Quản Trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentRoster.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{student.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{student.code} · {student.email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    {student.classRoom}
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={student.tag}
                      onChange={(e) => {
                        const newTag = e.target.value as any;
                        setStudentRoster(prev => prev.map(s => s.id === student.id ? { ...s, tag: newTag } : s));
                        soundManager.playClick();
                      }}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                        student.tag === 'excellent' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        student.tag === 'good' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        student.tag === 'needs-attention' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      <option value="excellent">Xuất Sắc (Target 900+)</option>
                      <option value="good">Khá Tốt (Target 750+)</option>
                      <option value="needs-attention">Cần Kèm Cặp Thêm</option>
                      <option value="at-risk">Nguy Cơ Trượt Khảo Thí</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-700 font-medium">{student.lastLogin}</div>
                    {student.daysInactive >= 7 ? (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block mt-0.5">
                        ⚠️ Cảnh báo: Không học {student.daysInactive} ngày
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-medium">Chuyên cần tốt</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-black text-slate-900">{student.avgScore}</span>
                    <span className="text-slate-400 text-[11px]"> ({student.examsCompleted} bài)</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          setRosterActionMessage(`Đã đặt lại mật khẩu về mặc định "MOS@2026" cho học viên ${student.name}`);
                          setTimeout(() => setRosterActionMessage(null), 3000);
                        }}
                        className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-slate-200"
                        title="Đặt lại mật khẩu mặc định"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          setRosterActionMessage(`Đã ngắt phiên đăng nhập của học viên ${student.name} khỏi hệ thống.`);
                          setTimeout(() => setRosterActionMessage(null), 3000);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                        title="Đá tài khoản (Force Logout) nếu phát hiện dùng chung"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {/* SECTION 3: CUSTOM EXAM BUILDER & SCHEDULING */}
  {activeSection === 'exam-builder' && (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <span>Tạo Đề Thi Tùy Biến & Lên Lịch Khảo Thí (Custom Exam Builder)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Cài đặt tỉ lệ nội dung từ ngân hàng câu hỏi, thiết lập hàng rào chống gian lận Lockdown Browser và đặt giờ mở/đóng thi.
        </p>
      </div>

      {examSavedToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Cấu hình kỳ thi đã được lưu và cập nhật vào lịch thi chính thức!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="space-y-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Tên kỳ thi / đợt thi:</label>
            <input
              type="text"
              value={examBuilderConfig.title}
              onChange={(e) => setExamBuilderConfig({ ...examBuilderConfig, title: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Môn thi khảo thí:</label>
            <select
              value={examBuilderConfig.subject}
              onChange={(e) => setExamBuilderConfig({ ...examBuilderConfig, subject: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
            >
              <option value="word">MOS Word Associate (MO-100)</option>
              <option value="excel">MOS Excel Associate (MO-200)</option>
              <option value="powerpoint">MOS PowerPoint Associate (MO-300)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Thời gian thi (Phút):</label>
              <input
                type="number"
                value={examBuilderConfig.durationMinutes}
                onChange={(e) => setExamBuilderConfig({ ...examBuilderConfig, durationMinutes: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Điểm đạt chuẩn (Pass):</label>
              <input
                type="number"
                value={examBuilderConfig.passingScore}
                onChange={(e) => setExamBuilderConfig({ ...examBuilderConfig, passingScore: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 block text-xs">Cơ chế Bảo Mật & Anti-Cheat:</span>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={examBuilderConfig.lockdownFullscreen}
                onChange={(e) => setExamBuilderConfig({ ...examBuilderConfig, lockdownFullscreen: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700">Bắt buộc toàn màn hình (Exam Lockdown Browser)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={examBuilderConfig.randomizeQuestions}
                onChange={(e) => setExamBuilderConfig({ ...examBuilderConfig, randomizeQuestions: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700">Trộn ngẫu nhiên câu hỏi (Randomize Questions)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={examBuilderConfig.randomizeOptions}
                onChange={(e) => setExamBuilderConfig({ ...examBuilderConfig, randomizeOptions: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700">Đảo thứ tự các đáp án A/B/C/D (Anti-Copy)</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Giờ mở đề thi:</label>
              <input
                type="datetime-local"
                value={examBuilderConfig.openTime}
                onChange={(e) => setExamBuilderConfig({ ...examBuilderConfig, openTime: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Giờ đóng đề thi:</label>
              <input
                type="datetime-local"
                value={examBuilderConfig.closeTime}
                onChange={(e) => setExamBuilderConfig({ ...examBuilderConfig, closeTime: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
        <button
          onClick={() => {
            soundManager.playCorrect();
            setExamSavedToast(true);
            setTimeout(() => setExamSavedToast(false), 3000);
          }}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          <span>Lưu Cấu Hình & Lên Lịch Thi Chính Thức</span>
        </button>
      </div>
    </div>
  )}

  {/* SECTION 4: DIRECT STUDENT INQUIRIES & MESSAGING */}
  {activeSection === 'messages' && (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[500px]">
      {/* Student List Sidebar */}
      <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50/50 p-4 space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Hộp Thư Hỏi Bài</span>
        {studentRoster.map(s => (
          <button
            key={s.id}
            onClick={() => {
              soundManager.playClick();
              setSelectedStudentChat(s.id);
            }}
            className={`w-full p-3 rounded-xl text-left text-xs transition-all flex items-start justify-between ${
              selectedStudentChat === s.id
                ? 'bg-white border border-blue-200 shadow-2xs font-bold text-slate-900'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <div>
              <div className="font-bold">{s.name}</div>
              <div className="text-[11px] text-slate-400 font-normal">{s.classRoom}</div>
            </div>
            {chatMessages[s.id] && (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {/* Chat Thread */}
      <div className="flex-1 flex flex-col justify-between p-6">
        <div>
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Trao đổi cùng học viên: {studentRoster.find(s => s.id === selectedStudentChat)?.name}
            </h3>
            <p className="text-xs text-slate-400">
              Lớp: {studentRoster.find(s => s.id === selectedStudentChat)?.classRoom} · Mục tiêu điểm thi MOS
            </p>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {(chatMessages[selectedStudentChat] || []).map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === 'teacher' ? 'items-end' : 'items-start'}`}
              >
                <div className={`p-3 rounded-2xl max-w-md text-xs leading-relaxed ${
                  msg.sender === 'teacher'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-2xs'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reply Box */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={newTeacherReply}
            onChange={(e) => setNewTeacherReply(e.target.value)}
            placeholder="Nhập câu trả lời hoặc hướng dẫn cú pháp cho học viên..."
            className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTeacherReply.trim()) {
                const currentList = chatMessages[selectedStudentChat] || [];
                setChatMessages({
                  ...chatMessages,
                  [selectedStudentChat]: [...currentList, { sender: 'teacher', text: newTeacherReply.trim(), time: 'Vừa xong' }]
                });
                setNewTeacherReply('');
                soundManager.playCorrect();
              }
            }}
          />
          <button
            onClick={() => {
              if (!newTeacherReply.trim()) return;
              const currentList = chatMessages[selectedStudentChat] || [];
              setChatMessages({
                ...chatMessages,
                [selectedStudentChat]: [...currentList, { sender: 'teacher', text: newTeacherReply.trim(), time: 'Vừa xong' }]
              });
              setNewTeacherReply('');
              soundManager.playCorrect();
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi Phản Hồi</span>
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Bulk CSV Import Student Modal */}
  {showImportModal && (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Import Danh Sách Học Sinh (CSV / Excel)</h3>
          </div>
          <button
            onClick={() => setShowImportModal(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Dán nội dung bảng tính hoặc CSV (Cột: Mã SV, Họ Tên, Email, Lớp) để tạo danh sách học sinh hàng loạt:
        </p>

        <textarea
          value={importCsvText}
          onChange={(e) => setImportCsvText(e.target.value)}
          placeholder={`K24-CNTT-099, Nguyễn Văn Nam, nam.k24@student.edu.vn, Lớp MOS-TinHoc01\nK24-KT-108, Trần Thị Thảo, thao.k24@student.edu.vn, Lớp MOS-TinHoc02`}
          rows={5}
          className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={() => setShowImportModal(false)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              if (importCsvText.trim()) {
                const lines = importCsvText.trim().split('\n');
                const newItems = lines.map((line, idx) => {
                  const parts = line.split(',').map(p => p.trim());
                  return {
                    id: 'stu-imp-' + Date.now() + '-' + idx,
                    code: parts[0] || 'K24-MOS-' + Math.floor(100 + Math.random() * 900),
                    name: parts[1] || 'Học Viên Mới',
                    email: parts[2] || 'student@edu.vn',
                    classRoom: parts[3] || 'Lớp MOS-TinHoc01',
                    tag: 'good' as const,
                    daysInactive: 0,
                    lastLogin: 'Chưa làm bài',
                    avgScore: 0,
                    examsCompleted: 0,
                  };
                });
                setStudentRoster([...studentRoster, ...newItems]);
                soundManager.playCorrect();
                setRosterActionMessage(`Đã import thành công ${newItems.length} học viên mới vào danh sách lớp!`);
                setShowImportModal(false);
                setImportCsvText('');
                setTimeout(() => setRosterActionMessage(null), 3000);
              }
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            Xác Nhận Import
          </button>
        </div>
      </div>
    </div>
  )}

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

              {/* Anti-Cheat Audit Trail Report */}
              <div className={`p-4 rounded-xl border text-xs ${
                inspectingSub.violationsCount && inspectingSub.violationsCount > 0
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <ShieldCheck className={`w-4 h-4 ${
                      inspectingSub.violationsCount && inspectingSub.violationsCount > 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`} />
                    <span>Báo Cáo Giám Sát Chống Gian Lận (Anti-Cheat Audit Trail)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    inspectingSub.violationsCount && inspectingSub.violationsCount > 0
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    {inspectingSub.violationsCount && inspectingSub.violationsCount > 0
                      ? `Cảnh Báo: ${inspectingSub.violationsCount} Lần Vi Phạm`
                      : 'Hoàn Toàn Trung Thực (0 Vi Phạm)'}
                  </span>
                </div>
                {inspectingSub.antiCheatLogs && inspectingSub.antiCheatLogs.length > 0 ? (
                  <div className="mt-2 space-y-1 bg-white/80 p-2.5 rounded-lg border border-amber-200/60 font-mono text-[11px] text-slate-700">
                    <div className="font-sans font-semibold text-slate-800 mb-1">Nhật ký sự kiện phòng thi:</div>
                    {inspectingSub.antiCheatLogs.map((log: string, idx: number) => (
                      <div key={idx} className="text-amber-800 flex items-start gap-1">
                        <span>•</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-800">
                    Thí sinh giữ tiêu điểm màn hình thi liên tục suốt 50 phút. Không phát hiện hành vi chuyển tab hay tra cứu ngoài.
                  </p>
                )}
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
