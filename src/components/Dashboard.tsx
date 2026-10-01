import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Award, 
  BookOpen, 
  Play, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  Laptop, 
  Star, 
  HelpCircle,
  BarChart2,
  Layers,
  ChevronRight,
  Flame,
  FileCheck,
  Database,
  ExternalLink,
  RefreshCw,
  Trophy,
  Check
} from 'lucide-react';
import { useAuthStore } from '../utils/userStore';
import { loadUserStats } from '../utils/storage';
import { useUserProgressStore, CURRICULUM_LESSONS } from '../utils/userProgressStore';
import { useGoogleSheetsStore } from '../utils/googleSheetsStore';
import { getStoredGoogleToken } from '../services/googleSheetsService';
import { GoogleSheetsBackupModal } from './GoogleSheetsBackupModal';
import { PracticalPerformanceCharts } from './dashboard/PracticalPerformanceCharts';
import { MasteryProgressDashboard } from './dashboard/MasteryProgressDashboard';
import { soundManager } from '../utils/audio';
import { MOSSubject } from '../types/mos';

export interface DashboardProps {
  onSelectSubject?: (subject: MOSSubject) => void;
  onSelectTab?: (tab: string) => void;
  onStartExam?: (subject?: 'word' | 'excel' | 'powerpoint') => void;
}

interface SubjectCardInfo {
  id: 'word' | 'excel' | 'powerpoint';
  code: string;
  name: string;
  englishTitle: string;
  level: string;
  themeColor: string;
  accentBg: string;
  lightBg: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  targetScore: number;
  timeLimit: number;
  totalQuestions: number;
  practicalTasks: number;
  keySkills: string[];
  ribbonHighlights: string[];
  bannerGradient: string;
  badgeBg: string;
}

const LEARNING_PATHS: SubjectCardInfo[] = [
  {
    id: 'excel',
    code: 'MO-200',
    name: 'Microsoft Excel Associate',
    englishTitle: 'Excel 365 / 2019 Data Analysis & Spreadsheets',
    level: 'Associate Certification',
    themeColor: 'text-emerald-600',
    accentBg: 'bg-emerald-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
    icon: FileSpreadsheet,
    description: 'Xử lý bảng tính tự động hóa, làm chủ hệ thống hàm tính toán logic, tham chiếu & trực quan hóa dữ liệu biểu đồ kinh doanh.',
    targetScore: 700,
    timeLimit: 50,
    totalQuestions: 150,
    practicalTasks: 42,
    keySkills: [
      'Quản lý Worksheets, Freeze Panes & Cố định vùng in',
      'Hàm tra cứu & logic nâng cao: XLOOKUP, VLOOKUP, IF, SUMIFS',
      'Định dạng có điều kiện (Conditional Formatting Rules)',
      'Bảng tính dữ liệu chuyên sâu (Excel Table & Structured References)',
      'Biểu đồ trực quan, Đường xu hướng (Trendlines) & Sparklines'
    ],
    ribbonHighlights: ['Formulas > Insert Function', 'Data > Advanced Filter', 'Insert > Recommended Charts'],
    bannerGradient: 'from-emerald-600 to-teal-700',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    id: 'word',
    code: 'MO-100',
    name: 'Microsoft Word Associate',
    englishTitle: 'Word 365 / 2019 Document Processing',
    level: 'Associate Certification',
    themeColor: 'text-blue-600',
    accentBg: 'bg-blue-600',
    lightBg: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-300 dark:border-blue-700',
    icon: FileText,
    description: 'Làm chủ kỹ thuật soạn thảo học thuật, bố cục tài liệu chuẩn ISO, định dạng Styles tự động & trộn thư chuyên nghiệp.',
    targetScore: 700,
    timeLimit: 50,
    totalQuestions: 120,
    practicalTasks: 35,
    keySkills: [
      'Quản trị tài liệu & Cấu trúc trang (Page Setup, Sections)',
      'Định dạng Styles, Heading 1-3 & Bố cục đoạn văn',
      'Mục lục tự động (TOC), Trích dẫn nguồn & Footnotes',
      'Bảng biểu nâng cao & Danh sách đa cấp (Multilevel Lists)',
      'Đồ họa SmartArt, Hình ảnh & Trộn thư (Mail Merge)'
    ],
    ribbonHighlights: ['Layout > Margins', 'References > Table of Contents', 'Mailings > Start Mail Merge'],
    bannerGradient: 'from-blue-600 to-indigo-700',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    id: 'powerpoint',
    code: 'MO-300',
    name: 'Microsoft PowerPoint Associate',
    englishTitle: 'PowerPoint 365 / 2019 Presentation Design',
    level: 'Associate Certification',
    themeColor: 'text-orange-600',
    accentBg: 'bg-orange-600',
    lightBg: 'bg-orange-50 dark:bg-orange-950/40',
    borderColor: 'border-orange-300 dark:border-orange-700',
    icon: Presentation,
    description: 'Thiết kế slide thuyết trình chuẩn nhận diện thương hiệu, Slide Master đồng bộ, hiệu ứng Morph 3D & trình chiếu tương tác cao.',
    targetScore: 700,
    timeLimit: 50,
    totalQuestions: 110,
    practicalTasks: 30,
    keySkills: [
      'Thiết kế kiến trúc Slide Master, Layouts tùy chỉnh & Themes',
      'Hiệu ứng biến hình Morph mượt mà & Chuyển tiếp Slide',
      'Animation chuỗi chuyển động, Kích hoạt (Trigger) & Timing',
      'Chèn đa phương tiện: Video, Audio, Mô hình 3D & Biểu đồ',
      'Kỹ thuật trình chiếu chuyên nghiệp với Presenter View'
    ],
    ribbonHighlights: ['View > Slide Master', 'Transitions > Morph', 'Animations > Animation Pane'],
    bannerGradient: 'from-orange-600 to-rose-700',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-300'
  }
];

export const Dashboard: React.FC<DashboardProps> = ({ 
  onSelectSubject, 
  onSelectTab, 
  onStartExam 
}) => {
  const navigate = useNavigate();
  const { user, fullName, role } = useAuthStore();
  const stats = useMemo(() => loadUserStats(), []);

  // Connect UserProgressStore (Zustand + Firestore)
  const { 
    completeLesson, 
    uncompleteLesson, 
    isLessonCompleted, 
    getSubjectStats: getProgressStats,
    getMasterProgressPercentage,
  } = useUserProgressStore();

  // Active Subject for the unified command center
  const [selectedSubjectId, setSelectedSubjectId] = useState<'word' | 'excel' | 'powerpoint'>('excel');
  
  // View mode inside the active subject: 'curriculum' (5 lessons) | 'matrix' (skills & ribbon) | 'charts' (recharts performance)
  const [subjectViewMode, setSubjectViewMode] = useState<'curriculum' | 'matrix' | 'charts'>('curriculum');

  // Google Sheets Sync State
  const { 
    isConnected: isSheetsConnected, 
    isConnecting: isSheetsConnecting,
    connect: connectSheets, 
    spreadsheetUrl 
  } = useGoogleSheetsStore();
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'error'; url?: string } | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  const displayName = fullName || user.fullName || user.name || 'Học viên';
  const roleLabel = role === 'admin' 
    ? 'Quản trị viên' 
    : role === 'teacher' 
    ? 'Giảng viên' 
    : role === 'student' 
    ? 'Học viên' 
    : 'Khách trải nghiệm';

  // Calculate subject progress from exam history
  const getSubjectStats = (subject: 'word' | 'excel' | 'powerpoint') => {
    const exams = stats.examHistory.filter(e => e.subject === subject);
    const bestScore = exams.reduce((max, curr) => Math.max(max, curr.score), 0);
    const passed = exams.some(e => e.passed);
    const attempts = exams.length;
    return { bestScore, passed, attempts };
  };

  const totalExamsPassed = useMemo(() => {
    return ['word', 'excel', 'powerpoint'].filter(
      sub => getSubjectStats(sub as 'word' | 'excel' | 'powerpoint').passed
    ).length;
  }, [stats]);

  const activeSubjectData = useMemo(() => {
    return LEARNING_PATHS.find(p => p.id === selectedSubjectId) || LEARNING_PATHS[0];
  }, [selectedSubjectId]);

  const handleStartExam = (subject: 'word' | 'excel' | 'powerpoint') => {
    soundManager.playClick();
    if (onStartExam) {
      onStartExam(subject);
    } else {
      navigate(`/thi-thu?subject=${subject}`);
    }
  };

  const handleOpenTheoryQuiz = (subject: 'word' | 'excel' | 'powerpoint') => {
    soundManager.playClick();
    if (onSelectSubject) onSelectSubject(subject);
    if (onSelectTab) onSelectTab('quiz-engine');
    else navigate('/?tab=quiz-engine');
  };

  const handleOpenRibbonSimulator = (subject: 'word' | 'excel' | 'powerpoint') => {
    soundManager.playClick();
    if (onSelectSubject) onSelectSubject(subject);
    if (onSelectTab) onSelectTab('practical');
    else navigate('/?tab=practical');
  };

  const handleSyncToGoogleSheets = async () => {
    soundManager.playClick();
    setIsSyncingSheets(true);
    setSyncFeedback(null);

    try {
      const activeGoogleToken = getStoredGoogleToken();
      if (!isSheetsConnected || !activeGoogleToken) {
        const connected = await connectSheets();
        if (!connected) {
          throw new Error('Chưa thể kết nối với Google Sheets. Vui lòng cấp quyền trong cửa sổ Google OAuth.');
        }
      }
      setSyncFeedback({
        message: 'Đã sẵn sàng đồng bộ 8 bảng dữ liệu liên kết trên Google Sheets.',
        type: 'success',
        url: spreadsheetUrl || undefined,
      });
    } catch (err: any) {
      setSyncFeedback({ message: err.message, type: 'error' });
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const SubjectIcon = activeSubjectData.icon;
  const currentProgress = getProgressStats(selectedSubjectId);
  const currentExamStat = getSubjectStats(selectedSubjectId);

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. COMPACT CERTIPORT HUD: USER GREETING + 3 SUBJECT GAUGES + INSTANT CTAS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-slate-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: User Info & Certiport Target */}
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                MOS CERTIPORT 365 / 2019
              </span>
              <span className="flex items-center gap-1 text-[11px] text-orange-400 font-bold">
                <Flame className="w-3.5 h-3.5 fill-orange-400" />
                Streak: {stats.streakDays || 1} ngày
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-emerald-300">{displayName}</span></span>
              <span className="text-base font-normal text-slate-400">({roleLabel})</span>
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed line-clamp-1">
              Khảo thí tin học văn phòng quốc tế. Chuẩn đạt ≥ 700 / 1000 điểm để cấp chứng chỉ Certiport.
            </p>
          </div>

          {/* Right: Master 3-in-1 Gauge + Direct Actions */}
          <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">
            {/* 3 Subject Mini Status Badges */}
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
              {(['excel', 'word', 'powerpoint'] as const).map(sub => {
                const subStat = getSubjectStats(sub);
                const prog = getProgressStats(sub);
                const isSelected = selectedSubjectId === sub;

                return (
                  <button
                    key={sub}
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedSubjectId(sub);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected 
                        ? 'bg-white text-slate-950 shadow-sm scale-105' 
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="capitalize">{sub === 'powerpoint' ? 'PPT' : sub}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      subStat.passed 
                        ? 'bg-emerald-500/30 text-emerald-300' 
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {subStat.passed ? '✓' : `${prog.completionPercentage}%`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Action: Start 50-Min Exam */}
            <button
              onClick={() => handleStartExam(selectedSubjectId)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Vào thi thử mô phỏng đề thi Certiport 50 phút"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Thi Thử 50P ({activeSubjectData.code})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Feedback Toast if any */}
      {syncFeedback && (
        <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in ${
          syncFeedback.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 border-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-950 dark:text-rose-200 border-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <HelpCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {syncFeedback.url && (
              <a
                href={syncFeedback.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 hover:bg-emerald-50"
              >
                <span>Mở Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button 
              onClick={() => setSyncFeedback(null)}
              className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. UNIFIED MOS COMMAND CENTER (SUBJECT SWITCHER + COMPACT SUB-VIEWS) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
        
        {/* Subject Header & Mode Switcher Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          
          {/* Active Subject Identity */}
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${activeSubjectData.accentBg} text-white flex items-center justify-center shadow-xs shrink-0`}>
              <SubjectIcon className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {activeSubjectData.code}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {activeSubjectData.level}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {activeSubjectData.name}
              </h2>
            </div>
          </div>

          {/* Sub-view switcher: Lộ Trình | Ma Trận | Biểu Đồ */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => {
                soundManager.playClick();
                setSubjectViewMode('curriculum');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subjectViewMode === 'curriculum'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              1. Bài Học ({currentProgress.completedCount}/{currentProgress.totalLessons})
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setSubjectViewMode('matrix');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subjectViewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              2. Kỹ Năng & Ribbon
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setSubjectViewMode('charts');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subjectViewMode === 'charts'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              3. Hiệu Suất Radar
            </button>
          </div>
        </div>

        {/* View Mode 1: 5 Curriculum Lessons (Zero Scroll Fatigue, Interactive Checkboxes) */}
        {subjectViewMode === 'curriculum' && (
          <div className="pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Nhấp vào bài học để đánh dấu hoàn thành. Dữ liệu đồng bộ tự động lên PostgreSQL & Google Sheets.
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Tiến độ: {currentProgress.completionPercentage}%
                </span>
                <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${currentProgress.completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {CURRICULUM_LESSONS[selectedSubjectId].map((lesson) => {
                const completed = isLessonCompleted(selectedSubjectId, lesson.id);

                return (
                  <div
                    key={lesson.id}
                    onClick={() => {
                      soundManager.playClick();
                      if (completed) {
                        uncompleteLesson(selectedSubjectId, lesson.id);
                      } else {
                        completeLesson(selectedSubjectId, lesson.id);
                        soundManager.playCorrect();
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      completed
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                        : 'bg-slate-50/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                          completed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-500 border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {completed ? '✓' : lesson.order}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm">{lesson.title}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {lesson.domainCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {lesson.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.estimatedMinutes} phút
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                          completed
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {completed ? 'Đã học' : 'Chưa học'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick 1-Click Action Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 flex-wrap">
              <button
                onClick={() => handleOpenTheoryQuiz(selectedSubjectId)}
                className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl transition-colors border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Trắc Nghiệm Quiz ({activeSubjectData.code})</span>
              </button>

              <button
                onClick={() => handleOpenRibbonSimulator(selectedSubjectId)}
                className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl transition-colors border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Giả Lập Ribbon ({activeSubjectData.code})</span>
              </button>

              <button
                onClick={() => handleStartExam(selectedSubjectId)}
                className={`px-4 py-2 ${activeSubjectData.accentBg} hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Vào Thi Thử 50 Phút</span>
              </button>
            </div>
          </div>
        )}

        {/* View Mode 2: Key Skills & Ribbon Shortcuts Matrix */}
        {subjectViewMode === 'matrix' && (
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Skills Checklist */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Nội Dung Trọng Tâm Đề Thi MOS Certiport
              </h3>
              <div className="space-y-1.5">
                {activeSubjectData.keySkills.map((skill, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ribbon Paths & Tips */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                Đường Dẫn Ribbon Chuẩn Thường Gặp
              </h3>

              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <div className="font-bold flex items-center gap-1 text-amber-950 dark:text-amber-300">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  Đường dẫn mẫu trong đề thi IIG:
                </div>
                <ul className="space-y-1 pl-4 list-disc text-amber-800 dark:text-amber-300 font-mono text-[11px]">
                  {activeSubjectData.ribbonHighlights.map((pathStr, i) => (
                    <li key={i}>{pathStr}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Thời gian làm bài</span>
                  <strong className="text-slate-800 dark:text-slate-200">{activeSubjectData.timeLimit} phút (50p)</strong>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Điểm đạt chứng chỉ</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">≥ {activeSubjectData.targetScore} / 1000đ</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 3: Recharts & Radar Performance */}
        {subjectViewMode === 'charts' && (
          <div className="pt-4">
            <MasteryProgressDashboard
              onStartExam={onStartExam}
              onNavigateTab={onSelectTab}
            />
          </div>
        )}

      </div>

      {/* Sheets Config Modal for Teachers/Admin */}
      <GoogleSheetsBackupModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
