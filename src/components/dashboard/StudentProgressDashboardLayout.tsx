import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis 
} from 'recharts';
import { 
  useUserProgressStore, 
  MOSSubjectTrack, 
  CURRICULUM_LESSONS 
} from '../../utils/userProgressStore';
import { useAuthStore } from '../../utils/userStore';
import { soundManager } from '../../utils/audio';
import { 
  LayoutDashboard, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Award, 
  CheckCircle2, 
  Circle, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Database, 
  RefreshCw, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  GraduationCap, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  ExternalLink, 
  AlertCircle, 
  ArrowLeft,
  BookOpen,
  Calendar,
  Check
} from 'lucide-react';

export type DashboardNavSection = 'overview' | 'word' | 'excel' | 'powerpoint' | 'curriculum' | 'quizzes';

interface StudentProgressDashboardLayoutProps {
  children?: React.ReactNode;
  initialSection?: DashboardNavSection;
  onSectionChange?: (section: DashboardNavSection) => void;
}

export const StudentProgressDashboardLayout: React.FC<StudentProgressDashboardLayoutProps> = ({
  children,
  initialSection = 'overview',
  onSectionChange,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    word, 
    excel, 
    powerpoint, 
    getSubjectStats, 
    getMasterProgressPercentage, 
    getTotalCompletedLessonsCount,
    lastSyncedAt,
    syncWithFirestore,
    completeLesson,
    uncompleteLesson,
    isLessonCompleted
  } = useUserProgressStore();

  const [activeSection, setActiveSection] = useState<DashboardNavSection>(initialSection);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Stats calculation
  const masterPercentage = getMasterProgressPercentage();
  const totalCompletedLessons = getTotalCompletedLessonsCount();
  const wordStats = getSubjectStats('word');
  const excelStats = getSubjectStats('excel');
  const pptStats = getSubjectStats('powerpoint');

  const toggleLesson = (subject: MOSSubjectTrack, lessonId: string) => {
    soundManager.playClick();
    if (isLessonCompleted(subject, lessonId)) {
      uncompleteLesson(subject, lessonId);
    } else {
      completeLesson(subject, lessonId);
    }
  };

  const totalLessons = 
    CURRICULUM_LESSONS.word.length + 
    CURRICULUM_LESSONS.excel.length + 
    CURRICULUM_LESSONS.powerpoint.length;

  const handleNavClick = (section: DashboardNavSection) => {
    soundManager.playClick();
    setActiveSection(section);
    setIsSidebarOpenMobile(false);
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  const handleSyncFirestore = async () => {
    soundManager.playClick();
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await syncWithFirestore();
      soundManager.playCorrect();
      setSyncFeedback('Đã đồng bộ tiến độ lên Firestore thành công!');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err: any) {
      soundManager.playWrong();
      setSyncFeedback('Không thể kết nối CSDL Cloud. Đã lưu bộ nhớ tạm.');
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpenMobile) {
        setIsSidebarOpenMobile(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpenMobile]);

  // Skill domain radar data for learning progress
  const domainRadarData = useMemo(() => [
    { subject: 'Định Dạng Văn Bản', score: wordStats.completionPercentage, fullMark: 100 },
    { subject: 'Bảng & Mục Lục', score: wordStats.completedCount * 20, fullMark: 100 },
    { subject: 'Hàm & Công Thức', score: excelStats.completionPercentage, fullMark: 100 },
    { subject: 'Biểu Đồ Phân Tích', score: excelStats.completedCount * 20, fullMark: 100 },
    { subject: 'Thiết Kế Slide', score: pptStats.completionPercentage, fullMark: 100 },
    { subject: 'Hiệu Ứng Hoạt Họa', score: pptStats.completedCount * 20, fullMark: 100 },
  ], [wordStats, excelStats, pptStats]);

  // All recent quiz attempts across subjects
  const allRecentQuizzes = useMemo(() => {
    const list: Array<{
      id: string;
      subject: MOSSubjectTrack;
      subjectLabel: string;
      score: number;
      total: number;
      percentage: number;
      date: string;
    }> = [];

    word.quizScores.forEach(q => list.push({ ...q, subject: 'word', subjectLabel: 'Word MO-100' }));
    excel.quizScores.forEach(q => list.push({ ...q, subject: 'excel', subjectLabel: 'Excel MO-200' }));
    powerpoint.quizScores.forEach(q => list.push({ ...q, subject: 'powerpoint', subjectLabel: 'PowerPoint MO-300' }));

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [word.quizScores, excel.quizScores, powerpoint.quizScores]);

  // Navigation Items
  const navItems = [
    {
      id: 'overview' as DashboardNavSection,
      label: 'Tổng Quan MOS Master',
      icon: LayoutDashboard,
      badge: `${masterPercentage}%`,
      badgeColor: masterPercentage >= 70 ? 'text-emerald-700 bg-emerald-50' : 'text-blue-700 bg-blue-50',
    },
    {
      id: 'word' as DashboardNavSection,
      label: 'Word MO-100',
      icon: FileText,
      badge: `${wordStats.completionPercentage}%`,
      badgeColor: 'text-blue-700 bg-blue-50',
    },
    {
      id: 'excel' as DashboardNavSection,
      label: 'Excel MO-200',
      icon: FileSpreadsheet,
      badge: `${excelStats.completionPercentage}%`,
      badgeColor: 'text-emerald-700 bg-emerald-50',
    },
    {
      id: 'powerpoint' as DashboardNavSection,
      label: 'PowerPoint MO-300',
      icon: Presentation,
      badge: `${pptStats.completionPercentage}%`,
      badgeColor: 'text-orange-700 bg-orange-50',
    },
    {
      id: 'curriculum' as DashboardNavSection,
      label: 'Khung Bài Học Chuẩn',
      icon: BookOpen,
      badge: `${totalCompletedLessons}/${totalLessons}`,
      badgeColor: 'text-indigo-700 bg-indigo-50',
    },
    {
      id: 'quizzes' as DashboardNavSection,
      label: 'Lịch Sử Thi & Quiz',
      icon: Award,
      badge: `${allRecentQuizzes.length}`,
      badgeColor: 'text-purple-700 bg-purple-50',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* MOBILE TOP BAR (< lg) */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpenMobile(true)}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Mở thanh điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
              M
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">MOS Master Hub</div>
              <div className="text-[10px] text-slate-500">Tiến độ học viên</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block">Hoàn thành</span>
            <span className="text-xs font-black text-blue-600">{masterPercentage}%</span>
          </div>
          <Link
            to="/"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Về trang chủ"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex-1 flex w-full">
        {/* MOBILE SIDEBAR BACKDROP */}
        {isSidebarOpenMobile && (
          <div 
            onClick={() => setIsSidebarOpenMobile(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          />
        )}

        {/* SIDEBAR NAVIGATION (Desktop: sticky, Mobile: fixed slide-over) */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${
            isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
          } ${
            isSidebarOpenMobile 
              ? 'translate-x-0 w-72 shadow-2xl' 
              : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-base shadow-xs shrink-0">
                M
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate">
                  <div className="text-xs font-black text-slate-900 tracking-tight leading-tight">
                    MOS Master Center
                  </div>
                  <div className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Certiport 2026</span>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsSidebarOpenMobile(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student Profile Card (in Sidebar) */}
          {!isSidebarCollapsed && (
            <div className="p-3.5 m-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {user.studentCode || 'HV-2026'} · {user.classRoom || 'Lớp MOS Master'}
                  </div>
                </div>
              </div>

              {user.assignedTeacherName && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">GV: {user.assignedTeacherName}</span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {!isSidebarCollapsed ? 'Lộ Trình Học Tập' : 'Lộ Trình'}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  
                  {!isSidebarCollapsed && (
                    <div className="flex-1 flex items-center justify-between text-left truncate">
                      <span className="truncate">{item.label}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer with Firestore Sync */}
          <div className="p-3 border-t border-slate-100 space-y-2 shrink-0">
            <button
              onClick={handleSyncFirestore}
              disabled={isSyncing}
              title="Đồng bộ tiến độ học tập lên Firestore Cloud"
              className={`w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isSidebarCollapsed ? 'px-0' : ''
              }`}
            >
              <Database className={`w-3.5 h-3.5 text-blue-600 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
              {!isSidebarCollapsed && (
                <span>{isSyncing ? 'Đang lưu...' : 'Đồng Bộ Firestore'}</span>
              )}
            </button>

            {!isSidebarCollapsed && (
              <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  Đồng bộ: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString('vi-VN') : 'Mới khởi tạo'}
                </span>
              </div>
            )}

            <Link
              to="/"
              className={`w-full py-2 px-3 text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                isSidebarCollapsed ? 'px-0' : ''
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {!isSidebarCollapsed && <span>Trang Chủ Khảo Thí</span>}
            </Link>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 bg-slate-50 flex flex-col">
          
          {/* Top Bar inside Content Area */}
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Học Viên MOS</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-blue-600 capitalize">
                  {activeSection === 'overview' ? 'Tổng Quan Báo Cáo' : activeSection}
                </span>
              </div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {activeSection === 'overview' && 'Bảng Điều Khiển Tiến Độ Học Tập'}
                {activeSection === 'word' && 'Lộ Trình Ôn Luyện Microsoft Word (MO-100)'}
                {activeSection === 'excel' && 'Lộ Trình Ôn Luyện Microsoft Excel (MO-200)'}
                {activeSection === 'powerpoint' && 'Lộ Trình Ôn Luyện Microsoft PowerPoint (MO-300)'}
                {activeSection === 'curriculum' && 'Khung Bài Giảng & Chuẩn Khảo Thí 15 Bài'}
                {activeSection === 'quizzes' && 'Nhật Ký Thi Thử & Quiz Certiport'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {syncFeedback && (
                <div className="text-xs px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold rounded-lg flex items-center gap-1.5 animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{syncFeedback}</span>
                </div>
              )}

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Tiêu chuẩn Certiport: 700/1000 điểm</span>
              </div>

              <Link
                to="/thi-thu"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Vào Thi Thử</span>
              </Link>
            </div>
          </header>

          {/* Dynamic Content Body */}
          <div className="p-6 max-w-7xl w-full mx-auto space-y-6 flex-1">
            {children ? (
              children
            ) : (
              <>
                {/* SECTION: OVERVIEW */}
                {activeSection === 'overview' && (
                  <div className="space-y-6">
                    {/* KPI Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      
                      {/* KPI 1: Overall Progress */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                          <span>Tiến Độ MOS Master</span>
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                          {masterPercentage}%
                        </div>
                        <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${masterPercentage}%` }}
                          />
                        </div>
                        <div className="mt-2 text-[11px] text-slate-500">
                          Mục tiêu hoàn thành cả 3 chứng chỉ MO-100, 200, 300
                        </div>
                      </div>

                      {/* KPI 2: Completed Lessons */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                          <span>Bài Giảng Hoàn Thành</span>
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                          {totalCompletedLessons} <span className="text-sm font-semibold text-slate-400">/ {totalLessons} bài</span>
                        </div>
                        <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(totalCompletedLessons / totalLessons) * 100}%` }}
                          />
                        </div>
                        <div className="mt-2 text-[11px] text-slate-500">
                          {totalLessons - totalCompletedLessons} bài cần hoàn thiện
                        </div>
                      </div>

                      {/* KPI 3: Quizzes Attempted */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                          <span>Lần Thi Thử / Quiz</span>
                          <Award className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                          {allRecentQuizzes.length} <span className="text-sm font-semibold text-slate-400">lần làm bài</span>
                        </div>
                        <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Hệ thống tự động lưu điểm</span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          Đạt chuẩn Certiport nếu $\ge$ 70%
                        </div>
                      </div>

                      {/* KPI 4: Cloud Sync Status */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                          <span>Đồng Bộ Cloud</span>
                          <Database className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span>Firestore Khả Dụng</span>
                        </div>
                        <div className="mt-2 text-[11px] text-slate-500">
                          {lastSyncedAt ? (
                            <>Lần lưu cuối: {new Date(lastSyncedAt).toLocaleTimeString('vi-VN')}</>
                          ) : (
                            'Đã sẵn sàng lưu bài học & điểm thi'
                          )}
                        </div>
                        <button
                          onClick={handleSyncFirestore}
                          disabled={isSyncing}
                          className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>Đồng bộ ngay bây giờ</span>
                        </button>
                      </div>

                    </div>

                    {/* 3 Subject Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      
                      {/* Word Card */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                              <FileText className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                              MO-100
                            </span>
                          </div>
                          <h2 className="text-base font-bold text-slate-900 mt-3">Microsoft Word</h2>
                          <p className="text-xs text-slate-500 mt-0.5">Xử lý văn bản, mục lục, bảng biểu & Mail Merge</p>
                          
                          <div className="mt-4 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Tiến độ bài học:</span>
                              <span className="font-bold text-slate-900">{wordStats.completedCount} / 5 bài</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all"
                                style={{ width: `${wordStats.completionPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">{wordStats.completionPercentage}% Hoàn thành</span>
                          <button
                            onClick={() => handleNavClick('word')}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Chi tiết môn</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Excel Card */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                              MO-200
                            </span>
                          </div>
                          <h2 className="text-base font-bold text-slate-900 mt-3">Microsoft Excel</h2>
                          <p className="text-xs text-slate-500 mt-0.5">Bảng tính, hàm logic, XLOOKUP, Data Bar & Pivot</p>
                          
                          <div className="mt-4 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Tiến độ bài học:</span>
                              <span className="font-bold text-slate-900">{excelStats.completedCount} / 5 bài</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-600 h-full rounded-full transition-all"
                                style={{ width: `${excelStats.completionPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">{excelStats.completionPercentage}% Hoàn thành</span>
                          <button
                            onClick={() => handleNavClick('excel')}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Chi tiết môn</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* PowerPoint Card */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                              <Presentation className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg">
                              MO-300
                            </span>
                          </div>
                          <h2 className="text-base font-bold text-slate-900 mt-3">Microsoft PowerPoint</h2>
                          <p className="text-xs text-slate-500 mt-0.5">Trình chiếu, Slide Master, Morph & hoạt họa 3D</p>
                          
                          <div className="mt-4 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Tiến độ bài học:</span>
                              <span className="font-bold text-slate-900">{pptStats.completedCount} / 5 bài</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-orange-600 h-full rounded-full transition-all"
                                style={{ width: `${pptStats.completionPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">{pptStats.completionPercentage}% Hoàn thành</span>
                          <button
                            onClick={() => handleNavClick('powerpoint')}
                            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Chi tiết môn</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Charts & Skill Mastery Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Radar Chart: 6 Core MOS Skill Domains */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-sm font-bold text-slate-900">Biểu Đồ Năng Lực 6 Kỹ Năng Cốt Lõi</h2>
                            <p className="text-xs text-slate-500">Đánh giá độ thuần thục trên các domain Certiport</p>
                          </div>
                          <Sparkles className="w-4 h-4 text-blue-600" />
                        </div>

                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={domainRadarData}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                              <Radar 
                                name="Điểm năng lực" 
                                dataKey="score" 
                                stroke="#2563eb" 
                                fill="#3b82f6" 
                                fillOpacity={0.4} 
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Recent Quiz Scores & Teacher Advice */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-slate-900">Bài Thi & Đánh Giá Gần Nhất</h2>
                            <button
                              onClick={() => handleNavClick('quizzes')}
                              className="text-xs text-blue-600 font-semibold hover:underline"
                            >
                              Xem tất cả
                            </button>
                          </div>

                          {allRecentQuizzes.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 space-y-2">
                              <Award className="w-8 h-8 mx-auto text-slate-300" />
                              <p className="text-xs">Chưa có bài thi trắc nghiệm nào được ghi nhận.</p>
                              <Link
                                to="/thi-thu"
                                className="inline-block mt-2 text-xs font-bold text-blue-600 hover:underline"
                              >
                                Làm bài thi thử 50 phút ngay →
                              </Link>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {allRecentQuizzes.slice(0, 4).map((q) => (
                                <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                  <div>
                                    <div className="text-xs font-bold text-slate-900">{q.subjectLabel}</div>
                                    <div className="text-[11px] text-slate-500">
                                      {new Date(q.date).toLocaleDateString('vi-VN')} · {q.score}/{q.total} câu đúng
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                      q.percentage >= 70 
                                        ? 'bg-emerald-50 text-emerald-700' 
                                        : 'bg-amber-50 text-amber-700'
                                    }`}>
                                      {q.percentage}% {q.percentage >= 70 ? 'Đạt' : 'Cần ôn'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Assigned Teacher Note */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                          <GraduationCap className="w-5 h-5 text-blue-600 shrink-0" />
                          <div className="text-[11px] text-blue-900 leading-snug">
                            <span className="font-bold">Nhận xét của Giáo viên: </span>
                            {user.assignedTeacherName ? (
                              <span>Tiến độ học tập của bạn đang được theo dõi bởi {user.assignedTeacherName}. Hãy hoàn thiện bài tập thực hành để đạt kết quả tốt nhất.</span>
                            ) : (
                              <span>Vui lòng chọn Giáo viên bộ môn để nhận phản hồi và đánh giá bài thi định kỳ.</span>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>
                )}

                {/* SECTION: SUBJECT PATHS (WORD / EXCEL / POWERPOINT) */}
                {(activeSection === 'word' || activeSection === 'excel' || activeSection === 'powerpoint') && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                        <div>
                          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                            Chương Trình Đào Tạo Chứng Chỉ
                          </div>
                          <h2 className="text-xl font-black text-slate-900 mt-1">
                            {activeSection === 'word' && 'Microsoft Word 2019 / 365 (MO-100)'}
                            {activeSection === 'excel' && 'Microsoft Excel 2019 / 365 (MO-200)'}
                            {activeSection === 'powerpoint' && 'Microsoft PowerPoint 2019 / 365 (MO-300)'}
                          </h2>
                          <p className="text-xs text-slate-500 mt-1">
                            Hoàn thành 5 bài học chuẩn Certiport để mở khóa bài thi chứng chỉ và chứng nhận chính thức.
                          </p>
                        </div>

                        <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
                          <span className="text-xs text-slate-500 block">Độ thuần thục môn:</span>
                          <span className="text-2xl font-black text-blue-600">
                            {activeSection === 'word' && `${wordStats.completionPercentage}%`}
                            {activeSection === 'excel' && `${excelStats.completionPercentage}%`}
                            {activeSection === 'powerpoint' && `${pptStats.completionPercentage}%`}
                          </span>
                        </div>
                      </div>

                      {/* Lesson Checklist */}
                      <div className="mt-6 space-y-3">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Danh Sách Bài Học Cốt Lõi
                        </div>

                        {CURRICULUM_LESSONS[activeSection].map((lesson) => {
                          const isDone = activeSection === 'word' 
                            ? word.completedLessons.includes(lesson.id)
                            : activeSection === 'excel'
                            ? excel.completedLessons.includes(lesson.id)
                            : powerpoint.completedLessons.includes(lesson.id);

                          return (
                            <div
                              key={lesson.id}
                              onClick={() => toggleLesson(activeSection, lesson.id)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                                isDone 
                                  ? 'bg-emerald-50/60 border-emerald-300' 
                                  : 'bg-white hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-start gap-3.5">
                                <button
                                  type="button"
                                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                    isDone 
                                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                                      : 'border-slate-300 text-transparent'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-900">{lesson.title}</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                      {lesson.domainCode}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    {lesson.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{lesson.estimatedMinutes} phút</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION: FULL CURRICULUM */}
                {activeSection === 'curriculum' && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Toàn Bộ 15 Bài Giảng Chuẩn Certiport</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Hoàn thành bài giảng tích lũy để tăng % MOS Master. Click vào bài để đánh dấu hoàn thành.
                      </p>
                    </div>

                    {(['word', 'excel', 'powerpoint'] as MOSSubjectTrack[]).map((subj) => (
                      <div key={subj} className="space-y-3">
                        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200 flex items-center justify-between">
                          <span>Phân Hệ: {subj.toUpperCase()}</span>
                          <span className="text-blue-600 lowercase font-medium">
                            {subj === 'word' ? word.completedLessons.length : subj === 'excel' ? excel.completedLessons.length : powerpoint.completedLessons.length}/5 hoàn thành
                          </span>
                        </div>

                        <div className="space-y-2">
                          {CURRICULUM_LESSONS[subj].map((l) => {
                            const isDone = subj === 'word' 
                              ? word.completedLessons.includes(l.id)
                              : subj === 'excel'
                              ? excel.completedLessons.includes(l.id)
                              : powerpoint.completedLessons.includes(l.id);

                            return (
                              <div
                                key={l.id}
                                onClick={() => toggleLesson(subj, l.id)}
                                className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                  isDone ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                                  )}
                                  <span className={`font-semibold ${isDone ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                    {l.title}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">{l.domainCode}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* SECTION: QUIZZES */}
                {activeSection === 'quizzes' && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg font-black text-slate-900">Lịch Sử Làm Bài Thi Thử & Quiz</h2>
                        <p className="text-xs text-slate-500">Mọi kết quả thi được lưu trên trình duyệt và tự động sao lưu</p>
                      </div>
                      <Link
                        to="/thi-thu"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                      >
                        Vào Phòng Thi 50 Phút
                      </Link>
                    </div>

                    {allRecentQuizzes.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <Award className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-semibold">Chưa có bài thi nào</p>
                        <p className="text-xs text-slate-500 mt-1">Hãy bắt đầu ôn luyện bằng cách tham gia thi thử mô phỏng Certiport</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                              <th className="py-3 px-2">Thời Gian</th>
                              <th className="py-3 px-2">Môn Thi</th>
                              <th className="py-3 px-2">Điểm Số</th>
                              <th className="py-3 px-2">Tỷ Lệ</th>
                              <th className="py-3 px-2">Đánh Giá Certiport</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {allRecentQuizzes.map((quiz) => (
                              <tr key={quiz.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-2 text-slate-500 font-medium">
                                  {new Date(quiz.date).toLocaleString('vi-VN')}
                                </td>
                                <td className="py-3 px-2 font-bold text-slate-900">{quiz.subjectLabel}</td>
                                <td className="py-3 px-2 font-mono font-bold text-slate-700">
                                  {quiz.score} / {quiz.total}
                                </td>
                                <td className="py-3 px-2 font-bold text-blue-600">{quiz.percentage}%</td>
                                <td className="py-3 px-2">
                                  <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] ${
                                    quiz.percentage >= 70 
                                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                                      : 'text-amber-700 bg-amber-50 border border-amber-200'
                                  }`}>
                                    {quiz.percentage >= 70 ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>ĐẠT CHUẨN (PASS)</span>
                                      </>
                                    ) : (
                                      <>
                                        <AlertCircle className="w-3 h-3 text-amber-600" />
                                        <span>CẦN ÔN THÊM</span>
                                      </>
                                    )}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

    </div>
  );
};

export default StudentProgressDashboardLayout;
