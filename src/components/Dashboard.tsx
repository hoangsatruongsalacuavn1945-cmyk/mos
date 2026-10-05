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
  Flame, 
  Layers, 
  ChevronRight, 
  Trophy, 
  BarChart2, 
  Target, 
  RotateCcw,
  Check,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../utils/userStore';
import { loadUserStats } from '../utils/storage';
import { useUserProgressStore, CURRICULUM_LESSONS, MOSSubjectTrack } from '../utils/userProgressStore';
import { useGoogleSheetsStore } from '../utils/googleSheetsStore';
import { getStoredGoogleToken } from '../services/googleSheetsService';
import { GoogleSheetsBackupModal } from './GoogleSheetsBackupModal';
import { MasteryProgressDashboard } from './dashboard/MasteryProgressDashboard';
import { WeeklyStudyProgressChart } from './dashboard/WeeklyStudyProgressChart';
import { soundManager } from '../utils/audio';
import { MOSSubject } from '../types/mos';

export interface DashboardProps {
  onSelectSubject?: (subject: MOSSubject) => void;
  onSelectTab?: (tab: string) => void;
  onStartExam?: (subject?: 'word' | 'excel' | 'powerpoint') => void;
}

interface ModulePathConfig {
  id: 'word' | 'excel' | 'powerpoint';
  code: string;
  name: string;
  shortName: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgLight: string;
  bgGradient: string;
  borderLight: string;
  badgeBg: string;
  description: string;
  targetScore: number;
  timeLimit: number;
  domains: string[];
  ribbonHighlight: string;
}

const MODULE_PATHS: ModulePathConfig[] = [
  {
    id: 'word',
    code: 'MO-100',
    name: 'Microsoft Word',
    shortName: 'Word',
    title: 'Word Associate 365 / 2019',
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-50/70 dark:bg-blue-950/40',
    bgGradient: 'from-blue-600 to-indigo-700',
    borderLight: 'border-blue-200 dark:border-blue-800',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
    description: 'Định dạng văn bản chuẩn quốc tế, bố cục Sections, bảng biểu nâng cao, Trộn thư (Mail Merge) & tham chiếu APA/IEEE.',
    targetScore: 700,
    timeLimit: 50,
    domains: [
      'Quản lý tài liệu & Tùy chỉnh Word',
      'Chèn & Định dạng Văn bản, Đoạn văn',
      'Quản lý Bảng biểu & Danh sách',
      'Tạo & Quản lý Tài liệu tham khảo',
      'Chèn & Định dạng Thành phần đồ họa'
    ],
    ribbonHighlight: 'Layout > Breaks > Next Page · References > Insert TOC'
  },
  {
    id: 'excel',
    code: 'MO-200',
    name: 'Microsoft Excel',
    shortName: 'Excel',
    title: 'Excel Associate 365 / 2019',
    icon: FileSpreadsheet,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50/70 dark:bg-emerald-950/40',
    bgGradient: 'from-emerald-600 to-teal-700',
    borderLight: 'border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    description: 'Xử lý bảng tính tự động hóa, làm chủ hệ thống hàm logic, tra cứu XLOOKUP/VLOOKUP, biểu đồ & định dạng có điều kiện.',
    targetScore: 700,
    timeLimit: 50,
    domains: [
      'Quản lý Worksheets & Workbooks',
      'Quản lý Ô dữ liệu & Vùng (Data Cells & Ranges)',
      'Quản lý Bảng dữ liệu (Tables & Table Data)',
      'Thực hiện Công thức & Hàm (Formulas & Functions)',
      'Quản lý Biểu đồ (Charts & Visual Elements)'
    ],
    ribbonHighlight: 'Formulas > Insert Function · Data > Advanced Filter'
  },
  {
    id: 'powerpoint',
    code: 'MO-300',
    name: 'Microsoft PowerPoint',
    shortName: 'PowerPoint',
    title: 'PowerPoint Associate 365 / 2019',
    icon: Presentation,
    color: 'text-orange-600 dark:text-orange-400',
    bgLight: 'bg-orange-50/70 dark:bg-orange-950/40',
    bgGradient: 'from-orange-600 to-rose-700',
    borderLight: 'border-orange-200 dark:border-orange-800',
    badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300',
    description: 'Thiết kế bài thuyết trình chuyên nghiệp, đồng bộ Slide Master, chuyển động Animations phức hợp & tối ưu trình chiếu tự động.',
    targetScore: 700,
    timeLimit: 50,
    domains: [
      'Quản lý Bản thuyết trình (Presentations)',
      'Quản lý Slide & Bố cục trình diễn (Layouts)',
      'Chèn & Định dạng Văn bản, Hình dạng, Hình ảnh',
      'Chèn Bảng biểu, Biểu đồ, SmartArt, 3D Models',
      'Áp dụng Hiệu ứng Chuyển tiếp & Hoạt hình'
    ],
    ribbonHighlight: 'View > Slide Master · Animations > Animation Pane'
  }
];

export const Dashboard: React.FC<DashboardProps> = ({ 
  onSelectSubject, 
  onSelectTab, 
  onStartExam 
}) => {
  const navigate = useNavigate();
  const { user, fullName, role } = useAuthStore();
  const rawStats = useMemo(() => loadUserStats(), []);

  // Connect Real-Time UserProgressStore (Firestore Sync)
  const { 
    completeLesson, 
    uncompleteLesson, 
    isLessonCompleted, 
    getSubjectStats: getProgressStats,
    getMasterProgressPercentage,
    getTotalCompletedLessonsCount
  } = useUserProgressStore();

  // Active Subject Selector for focused view
  const [activeSubject, setActiveSubject] = useState<'word' | 'excel' | 'powerpoint'>('excel');
  
  // Tab view within the active subject: 'overview' | 'lessons' | 'weekly' | 'radar'
  const [subView, setSubView] = useState<'overview' | 'lessons' | 'weekly' | 'radar'>('overview');

  // Sheets Sync state
  const { isConnected: isSheetsConnected, spreadsheetUrl } = useGoogleSheetsStore();
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  const displayName = fullName || user.fullName || user.name || 'Học viên';
  const roleLabel = role === 'admin' 
    ? 'Quản trị viên' 
    : role === 'teacher' 
    ? 'Giảng viên' 
    : role === 'student' 
    ? 'Học viên' 
    : 'Khách trải nghiệm';

  // Overall calculations
  const masterPercentage = getMasterProgressPercentage();
  const totalLessonsCompleted = getTotalCompletedLessonsCount();

  const getSubjectExamStat = (subject: 'word' | 'excel' | 'powerpoint') => {
    const exams = rawStats.examHistory.filter(e => e.subject === subject);
    const bestScore = exams.reduce((max, curr) => Math.max(max, curr.score), 0);
    const passed = exams.some(e => e.passed);
    const attempts = exams.length;
    return { bestScore, passed, attempts };
  };

  const highestScoreOverall = useMemo(() => {
    return rawStats.examHistory.reduce((max, curr) => Math.max(max, curr.score), 0);
  }, [rawStats]);

  const activeModuleConfig = useMemo(() => {
    return MODULE_PATHS.find(m => m.id === activeSubject) || MODULE_PATHS[1];
  }, [activeSubject]);

  const activeProgress = getProgressStats(activeSubject);
  const activeExam = getSubjectExamStat(activeSubject);

  // Navigation handlers
  const handleLaunchExam = (subject: 'word' | 'excel' | 'powerpoint') => {
    soundManager.playClick();
    if (onStartExam) {
      onStartExam(subject);
    } else {
      navigate(`/thi-thu?subject=${subject}`);
    }
  };

  const handleLaunchQuiz = (subject: 'word' | 'excel' | 'powerpoint') => {
    soundManager.playClick();
    if (onSelectSubject) onSelectSubject(subject);
    if (onSelectTab) onSelectTab('quiz-engine');
    else navigate('/?tab=quiz-engine');
  };

  const handleLaunchRibbon = (subject: 'word' | 'excel' | 'powerpoint') => {
    soundManager.playClick();
    if (onSelectSubject) onSelectSubject(subject);
    if (onSelectTab) onSelectTab('practical');
    else navigate('/?tab=practical');
  };

  const handleLaunchStudyModule = (subject: 'word' | 'excel' | 'powerpoint') => {
    soundManager.playClick();
    setActiveSubject(subject);
    setSubView('lessons');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: USER GREETING & CERTIPORT BENCHMARK HUD                   */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-xl">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left Column: Greeting & Summary */}
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Certiport Authorized Training
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                Streak: {rawStats.streakDays || 1} Ngày Liên Tục
              </span>

              {masterPercentage >= 70 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <Award className="w-3.5 h-3.5" /> Đạt Chuẩn MOS Master
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-emerald-300">{displayName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Trung tâm huấn luyện và khảo thí tin học quốc tế Certiport (MO-100, MO-200, MO-300). 
              Hệ thống theo dõi tiến độ thời gian thực, lưu trữ trên Firestore & Google Sheets.
            </p>
          </div>

          {/* Right Column: Quick CTA Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => handleLaunchExam(activeSubject)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Vào Thi Thử 50P ({activeModuleConfig.code})</span>
            </button>

            <button
              onClick={() => handleLaunchRibbon(activeSubject)}
              className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Laptop className="w-4 h-4 text-blue-300" />
              <span>Giả Lập Ribbon Simulator</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PROGRESS SUMMARY KPI METRICS BAR                                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Master Progress */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tiến Độ Master
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {masterPercentage}%
            </span>
            <span className="text-xs font-semibold text-slate-400">
              / 100%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${masterPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-1">
            <Target className="w-3 h-3 text-emerald-500" />
            Tiêu chuẩn đỗ MOS: ≥ 70%
          </p>
        </div>

        {/* KPI 2: Lessons Completed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Bài Học Hoàn Thành
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {totalLessonsCompleted}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              / 15 Bài Trọng Tâm
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(totalLessonsCompleted / 15) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-1">
            <CheckCircle2 className="w-3 h-3 text-blue-500" />
            Mỗi môn gồm 5 chuyên đề ma trận
          </p>
        </div>

        {/* KPI 3: Best Exam Score */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Điểm Thi Cao Nhất
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {highestScoreOverall > 0 ? highestScoreOverall : '---'}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              / 1000đ
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (highestScoreOverall / 1000) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-1">
            {highestScoreOverall >= 700 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Đã vượt điểm sàn Certiport</span>
            ) : (
              <span className="text-slate-400">Mục tiêu: Đạt 700đ trở lên</span>
            )}
          </p>
        </div>

        {/* KPI 4: Active Modules Status */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              3 Môn Khảo Thí
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            {MODULE_PATHS.map((m) => {
              const p = getProgressStats(m.id);
              const isPassed = getSubjectExamStat(m.id).passed;
              return (
                <div 
                  key={m.id}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center text-xs font-bold border transition-colors ${
                    isPassed 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : p.completionPercentage > 0
                      ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                  title={`${m.name}: ${p.completionPercentage}%`}
                >
                  <span className="block text-[10px] uppercase font-mono">{m.shortName}</span>
                  <span className="text-xs">{isPassed ? 'Đậu' : `${p.completionPercentage}%`}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-1">
            <Clock className="w-3 h-3 text-slate-400" />
            Thời gian thi: 50 phút / môn
          </p>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVE STUDY PATHS CARDS (WORD, EXCEL, POWERPOINT)                     */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 rounded-full bg-indigo-600" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Lộ Trình Học Tập Đang Kích Hoạt
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Chọn môn học để xem bài học & làm khảo thí
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODULE_PATHS.map((module) => {
            const Icon = module.icon;
            const progress = getProgressStats(module.id);
            const examStat = getSubjectExamStat(module.id);
            const isSelected = activeSubject === module.id;

            return (
              <div
                key={module.id}
                onClick={() => {
                  soundManager.playClick();
                  setActiveSubject(module.id);
                }}
                className={`relative rounded-3xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                  isSelected 
                    ? 'bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {/* Header tag */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-2xl ${module.bgLight} ${module.color} flex items-center justify-center shrink-0 shadow-2xs`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono block">
                          {module.code}
                        </span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {module.name}
                        </h3>
                      </div>
                    </div>

                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${module.badgeBg}`}>
                      {examStat.passed ? '✓ Đạt Chuẩn' : `${progress.completionPercentage}%`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {module.description}
                  </p>
                </div>

                {/* Progress bar & Milestones */}
                <div className="pt-4 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Tiến độ bài học</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {progress.completedCount} / {progress.totalLessons} bài
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r ${module.bgGradient}`}
                        style={{ width: `${progress.completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Highlights Pill */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>Thao tác trọng tâm:</span>
                    </div>
                    <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {module.ribbonHighlight}
                    </p>
                  </div>

                  {/* Action row */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchStudyModule(module.id);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>5 Bài Lý Thuyết</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchExam(module.id);
                      }}
                      className={`py-2 px-3.5 rounded-xl bg-gradient-to-r ${module.bgGradient} text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Thi Thử</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ACTIVE SUBJECT COMMAND CENTER (LESSONS, DOMAINS & RADAR)               */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5">
        
        {/* Module Header Bar with Sub-View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${activeModuleConfig.bgLight} ${activeModuleConfig.color} flex items-center justify-center shrink-0 shadow-xs`}>
              <activeModuleConfig.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono">
                  {activeModuleConfig.code}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {activeModuleConfig.title}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Chi Tiết Chuyên Đề & Bài Học {activeModuleConfig.shortName}
              </h3>
            </div>
          </div>

          {/* Sub-view navigation buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start sm:self-auto">
            <button
              onClick={() => {
                soundManager.playClick();
                setSubView('overview');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subView === 'overview'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tổng Quan Ma Trận
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setSubView('lessons');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subView === 'lessons'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              5 Bài Giảng ({activeProgress.completedCount}/5)
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setSubView('weekly');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subView === 'weekly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tiến Độ Tuần (Recharts)
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setSubView('radar');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subView === 'radar'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Biểu Đồ Năng Lực
            </button>
          </div>
        </div>

        {/* View 1: Overview & 5 Domains */}
        {subView === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Domain list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  5 Nhóm Kỹ Năng Chuẩn Certiport ({activeModuleConfig.code})
                </h4>

                <div className="space-y-2">
                  {activeModuleConfig.domains.map((dom, i) => (
                    <div 
                      key={i}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-xs">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{dom}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 shrink-0">
                        {20}% Đề Thi
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exam specs & fast start card */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Quy Chuẩn Bài Thi Khảo Thí MOS Quốc Tế
                </h4>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-4 border border-slate-800">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[11px] text-slate-400 block">Thời Gian Thi Thử</span>
                      <strong className="text-base text-white font-black">{activeModuleConfig.timeLimit} Phút</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[11px] text-slate-400 block">Điểm Đạt Chuẩn</span>
                      <strong className="text-base text-emerald-400 font-black">≥ {activeModuleConfig.targetScore} / 1000đ</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bài thi gồm các Projects thực tế mô phỏng môi trường làm việc doanh nghiệp. Mỗi bài thi chứa 5-7 Tasks thao tác trực tiếp trên giao diện Ribbon.
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleLaunchExam(activeSubject)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Bắt Đầu Thi Thử 50 Phút</span>
                    </button>

                    <button
                      onClick={() => handleLaunchQuiz(activeSubject)}
                      className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Trắc Nghiệm Khảo Thí</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Interactive 5 Curriculum Lessons */}
        {subView === 'lessons' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
              <span>Đánh dấu tick để ghi nhận bài giảng đã học. Tiến độ tự động đồng bộ Firestore.</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Đã hoàn thành {activeProgress.completedCount} / {activeProgress.totalLessons} bài ({activeProgress.completionPercentage}%)
              </span>
            </div>

            <div className="space-y-2">
              {CURRICULUM_LESSONS[activeSubject].map((lesson) => {
                const completed = isLessonCompleted(activeSubject, lesson.id);

                return (
                  <div
                    key={lesson.id}
                    onClick={() => {
                      soundManager.playClick();
                      if (completed) {
                        uncompleteLesson(activeSubject, lesson.id);
                      } else {
                        completeLesson(activeSubject, lesson.id);
                        soundManager.playCorrect();
                      }
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      completed
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs transition-colors ${
                          completed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-500 border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {completed ? '✓' : lesson.order}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm">{lesson.title}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {lesson.domainCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {lesson.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-400 hidden sm:inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {lesson.estimatedMinutes}p
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          completed
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
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
          </div>
        )}

        {/* View 3: Weekly Study Progress (Recharts) */}
        {subView === 'weekly' && (
          <div className="pt-2">
            <WeeklyStudyProgressChart onSelectSubject={(sub) => setActiveSubject(sub)} />
          </div>
        )}

        {/* View 4: Radar & Performance Matrix */}
        {subView === 'radar' && (
          <div className="pt-2">
            <MasteryProgressDashboard
              onStartExam={onStartExam}
              onNavigateTab={onSelectTab}
            />
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 4.5 WEEKLY STUDY PROGRESS (RECHARTS VISUAL) ACROSS WORD, EXCEL & PPT      */}
      {/* ========================================================================= */}
      <WeeklyStudyProgressChart onSelectSubject={(sub) => setActiveSubject(sub)} />

      {/* ========================================================================= */}
      {/* 5. QUICK-LINKS TO WORD, EXCEL, AND POWERPOINT MODULES                     */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 rounded-full bg-blue-600" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Phím Tắt & Liên Kết Nhanh Mô-đun (Quick-Launch Hub)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Truy cập tức thì 1-chạm</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODULE_PATHS.map((m) => {
            const Icon = m.icon;

            return (
              <div 
                key={m.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl ${m.bgLight} ${m.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{m.name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{m.code}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    5 Chuyên Đề
                  </span>
                </div>

                {/* 4 Fast Launch Links */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleLaunchStudyModule(m.id)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-left font-bold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">Lý Thuyết</span>
                  </button>

                  <button
                    onClick={() => handleLaunchRibbon(m.id)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-left font-bold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Laptop className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">Luyện Ribbon</span>
                  </button>

                  <button
                    onClick={() => handleLaunchQuiz(m.id)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-left font-bold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">Trắc Nghiệm</span>
                  </button>

                  <button
                    onClick={() => handleLaunchExam(m.id)}
                    className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-left font-bold transition-colors flex items-center gap-2 cursor-pointer border border-emerald-200 dark:border-emerald-800"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-600 fill-current shrink-0" />
                    <span className="truncate">Thi Thử 50P</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sheets Config Modal */}
      <GoogleSheetsBackupModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
