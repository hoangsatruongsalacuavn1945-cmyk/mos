import React, { useState } from 'react';
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
  Database
} from 'lucide-react';
import { useAuthStore } from '../utils/userStore';
import { loadUserStats } from '../utils/storage';
import { useUserProgressStore, CURRICULUM_LESSONS } from '../utils/userProgressStore';
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
    id: 'word',
    code: 'MO-100',
    name: 'Microsoft Word Associate',
    englishTitle: 'Word 365 / 2019 Document Processing',
    level: 'Associate Certification',
    themeColor: 'text-blue-600',
    accentBg: 'bg-blue-600',
    lightBg: 'bg-blue-50',
    borderColor: 'border-blue-200 hover:border-blue-400',
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
    id: 'excel',
    code: 'MO-200',
    name: 'Microsoft Excel Associate',
    englishTitle: 'Excel 365 / 2019 Data Analysis & Spreadsheets',
    level: 'Associate Certification',
    themeColor: 'text-emerald-600',
    accentBg: 'bg-emerald-600',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200 hover:border-emerald-400',
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
    id: 'powerpoint',
    code: 'MO-300',
    name: 'Microsoft PowerPoint Associate',
    englishTitle: 'PowerPoint 365 / 2019 Presentation Design',
    level: 'Associate Certification',
    themeColor: 'text-orange-600',
    accentBg: 'bg-orange-600',
    lightBg: 'bg-orange-50',
    borderColor: 'border-orange-200 hover:border-orange-400',
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
  const stats = loadUserStats();

  // Connect UserProgressStore (Zustand + Firestore)
  const { 
    completeLesson, 
    uncompleteLesson, 
    isLessonCompleted, 
    getSubjectStats: getProgressStats,
    getMasterProgressPercentage,
    recordQuizScore
  } = useUserProgressStore();

  const [activePreview, setActivePreview] = useState<'word' | 'excel' | 'powerpoint'>('excel');
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quickQuizScore, setQuickQuizScore] = useState(85);

  const displayName = fullName || user.fullName || user.name || 'Học viên';
  const roleLabel = role === 'admin' 
    ? 'Quản trị viên' 
    : role === 'teacher' 
    ? 'Giảng viên' 
    : role === 'student' 
    ? 'Học viên chính thức' 
    : 'Khách trải nghiệm';

  // Calculate subject progress from exam history
  const getSubjectStats = (subject: 'word' | 'excel' | 'powerpoint') => {
    const exams = stats.examHistory.filter(e => e.subject === subject);
    const bestScore = exams.reduce((max, curr) => Math.max(max, curr.score), 0);
    const passed = exams.some(e => e.passed);
    const attempts = exams.length;
    return { bestScore, passed, attempts };
  };

  const handleStartExam = (subject: 'word' | 'excel' | 'powerpoint') => {
    if (onStartExam) {
      onStartExam(subject);
    } else {
      navigate(`/thi-thu?subject=${subject}`);
    }
  };

  const handleOpenPath = (subject: 'word' | 'excel' | 'powerpoint') => {
    if (onSelectSubject) {
      onSelectSubject(subject);
    }
    if (onSelectTab) {
      onSelectTab('theory');
    } else {
      navigate('/?tab=theory');
    }
  };

  const handleOpenPractical = (subject: 'word' | 'excel' | 'powerpoint') => {
    if (onSelectSubject) {
      onSelectSubject(subject);
    }
    if (onSelectTab) {
      onSelectTab('practical');
    } else {
      navigate('/?tab=practical');
    }
  };

  const totalExamsPassed = ['word', 'excel', 'powerpoint'].filter(
    sub => getSubjectStats(sub as 'word' | 'excel' | 'powerpoint').passed
  ).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome & MOS Certiport Benchmark Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold tracking-wide border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CỔNG KHẢO THÍ MOS CERTIPORT CHUẨN QUỐC TẾ</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold">2026 Ready</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-emerald-300">{displayName}</span>! 👋
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Trung tâm huấn luyện và khảo thí tin học văn phòng quốc tế. Lựa chọn môn thi mục tiêu bên dưới để bắt đầu lộ trình làm chủ kiến thức và đạt chứng chỉ MOS Master.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs border border-white/10">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Vai trò: <strong className="text-white">{roleLabel}</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs border border-white/10">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Chuỗi ngày học: <strong className="text-white">{stats.streakDays || 1} ngày</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Chứng chỉ đã đạt: <strong className="text-white">{totalExamsPassed}/3 Môn</strong></span>
              </div>
            </div>
          </div>

          {/* Master Certification Progress Gauge */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/15 w-full lg:w-80 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span className="uppercase tracking-wider">Tiến Độ MOS Master</span>
              <span className="text-emerald-300 font-bold">{Math.round((totalExamsPassed / 3) * 100)}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-3 p-0.5 overflow-hidden border border-white/10">
              <div 
                className="bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-300 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.max(10, Math.round((totalExamsPassed / 3) * 100))}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              {(['word', 'excel', 'powerpoint'] as const).map(sub => {
                const subStat = getSubjectStats(sub);
                return (
                  <div 
                    key={sub}
                    className={`p-2 rounded-lg text-xs border ${
                      subStat.passed 
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
                        : 'bg-slate-900/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-bold uppercase text-[11px]">{sub}</div>
                    <div className="text-[10px] mt-0.5">
                      {subStat.passed ? '✓ Đạt' : subStat.bestScore > 0 ? `${subStat.bestScore}đ` : 'Chưa thi'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-[11px] text-slate-400 text-center">
              Chuẩn Certiport: <strong className="text-white">≥ 700 / 1000 điểm</strong> để cấp bằng
            </div>
          </div>
        </div>
      </div>

      {/* Main Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Lộ Trình Học & Khảo Thí 3 Phân Hệ MOS
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Chọn một trong ba lộ trình chuyên sâu bên dưới để ôn tập kiến thức, thực hành thao tác trên Ribbon và thi thử.
          </p>
        </div>

        {/* Quick Subject Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          {LEARNING_PATHS.map(path => (
            <button
              key={path.id}
              onClick={() => setActivePreview(path.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePreview === path.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {path.code}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Main Subject Cards: Word, Excel, PowerPoint */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LEARNING_PATHS.map((path) => {
          const Icon = path.icon;
          const subStat = getSubjectStats(path.id);
          const progressStats = getProgressStats(path.id);
          const isSelected = activePreview === path.id;

          return (
            <div
              key={path.id}
              onClick={() => setActivePreview(path.id)}
              className={`group flex flex-col rounded-2xl bg-white border-2 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer overflow-hidden ${
                isSelected ? path.borderColor + ' ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Banner */}
              <div className={`p-5 text-white bg-gradient-to-r ${path.bannerGradient} relative overflow-hidden`}>
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15 pointer-events-none">
                  <Icon className="w-36 h-36" />
                </div>

                <div className="flex items-start justify-between relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-sm">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-white/20 backdrop-blur-md border border-white/30 text-white">
                    {path.code}
                  </span>
                </div>

                <div className="mt-4 relative z-10">
                  <div className="text-xs uppercase tracking-wider font-semibold text-white/80">
                    {path.level}
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                    {path.name}
                  </h3>
                  <div className="text-xs text-white/90 mt-1 line-clamp-1 font-medium">
                    {path.englishTitle}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-5">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {path.description}
                </p>

                {/* Learning Progress & Quiz Score Badge */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Tiến độ bài học</span>
                    <strong className="text-sm font-bold text-slate-900">
                      {progressStats.completedCount}/{progressStats.totalLessons} bài ({progressStats.completionPercentage}%)
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[11px]">Quiz cao nhất</span>
                    <strong className={`text-sm font-bold ${progressStats.highestScore >= 70 ? 'text-emerald-600' : progressStats.highestScore > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                      {progressStats.highestScore > 0 ? `${progressStats.highestScore}%` : 'Chưa làm'}
                    </strong>
                  </div>
                </div>

                {/* Key Skills Checklist */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Nội Dung Trọng Tâm</span>
                    <span className="text-[11px] font-normal text-slate-500">{path.practicalTasks} bài lab</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {path.keySkills.slice(0, 3).map((skill, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${path.themeColor}`} />
                        <span className="line-clamp-1">{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exam Parameters Bar */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs text-slate-600">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="block text-[10px] text-slate-400 font-medium">Thời gian</span>
                    <strong className="text-slate-800">{path.timeLimit} phút</strong>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="block text-[10px] text-slate-400 font-medium">Điểm đạt</span>
                    <strong className="text-emerald-700">≥ {path.targetScore}</strong>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="block text-[10px] text-slate-400 font-medium">Ngân hàng</span>
                    <strong className="text-slate-800">{path.totalQuestions} câu</strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPath(path.id);
                    }}
                    className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Vào Học Lý Thuyết</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartExam(path.id);
                    }}
                    className={`w-full sm:flex-1 py-2.5 px-3 rounded-xl ${path.accentBg} hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-opacity shadow-xs`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Thi Thử 50P</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Subject In-Depth Matrix Banner */}
      {(() => {
        const activeItem = LEARNING_PATHS.find(p => p.id === activePreview) || LEARNING_PATHS[1];
        const ActiveIcon = activeItem.icon;

        return (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${activeItem.accentBg} text-white flex items-center justify-center shadow-md shrink-0`}>
                  <ActiveIcon className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      Ma trận chuẩn Certiport
                    </span>
                    <span className="text-xs font-semibold text-blue-600">Mã môn: {activeItem.code}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    Chi Tiết Ma Trận Đánh Giá Năng Lực {activeItem.name}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenPractical(activeItem.id)}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-2 transition-colors border border-blue-200"
                >
                  <Laptop className="w-4 h-4" />
                  <span>Mở Trình Thực Hành Thao Tác</span>
                </button>
                <button
                  onClick={() => handleStartExam(activeItem.id)}
                  className={`px-4 py-2 rounded-xl ${activeItem.accentBg} text-white hover:opacity-90 text-xs font-bold flex items-center gap-2 transition-opacity shadow-sm`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Vào Phòng Thi Ngay</span>
                </button>
              </div>
            </div>

            {/* Matrix Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-600" />
                  Chuẩn Kiến Thức & Kỹ Năng Đề Thi MOS
                </h4>
                <div className="space-y-2">
                  {activeItem.keySkills.map((skill, index) => (
                    <div key={index} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {index + 1}
                      </span>
                      <span className="text-slate-700 font-medium">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Thao Tác Ribbon & Mẹo Phòng Thi Thường Gặp
                </h4>
                
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2.5 text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                    Đường dẫn Ribbon mẫu cần ghi nhớ:
                  </div>
                  <ul className="space-y-1.5 pl-5 list-disc text-amber-800">
                    {activeItem.ribbonHighlights.map((pathStr, i) => (
                      <li key={i} className="font-mono text-[11px] font-semibold">
                        {pathStr}
                      </li>
                    ))}
                  </ul>
                  <div className="text-[11px] text-amber-700 pt-1">
                    * Trong phòng thi Certiport, các câu hỏi tính điểm dựa trên đúng lệnh Ribbon hoặc phím tắt tiêu chuẩn.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 block text-[11px]">Dạng bài tập</span>
                    <strong className="text-slate-800">Project-based (5 - 7 Projects)</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 block text-[11px]">Ngôn ngữ giao diện thi</span>
                    <strong className="text-slate-800">Tiếng Việt & Tiếng Anh</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Curriculum Lessons & UserProgressStore Tracker */}
            <div className="pt-6 border-t border-slate-100 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    Lộ Trình 5 Chuyên Đề Bài Học Chuẩn Quốc Tế & Theo Dõi Tiến Độ
                  </h4>
                  <p className="text-xs text-slate-500">
                    Bấm vào từng bài học để đánh dấu hoàn thành. Dữ liệu tiến độ tự động đồng bộ theo thời gian thực lên Firebase Firestore.
                  </p>
                </div>
                <button
                  onClick={() => setQuizModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ghi Nhận Điểm Quiz Môn Này</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {CURRICULUM_LESSONS[activeItem.id].map((lesson) => {
                  const completed = isLessonCompleted(activeItem.id, lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        soundManager.playClick();
                        if (completed) {
                          uncompleteLesson(activeItem.id, lesson.id);
                        } else {
                          completeLesson(activeItem.id, lesson.id);
                          soundManager.playCorrect();
                        }
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        completed
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                            completed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-500 border border-slate-300'
                          }`}
                        >
                          {completed ? '✓' : lesson.order}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm">{lesson.title}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                              {lesson.domainCode}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {lesson.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lesson.estimatedMinutes} phút
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                            completed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {completed ? 'Đã hoàn thành' : 'Đánh dấu đã học'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick Access Training Features Hub */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Tiện Ích & Công Cụ Học Tập Nhanh
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tool 1: File Grader */}
          <div 
            onClick={() => onSelectTab ? onSelectTab('file-grader') : navigate('/?tab=file-grader')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              Chấm File Tự Động (AI)
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Nộp file .docx, .xlsx, .pptx để AI chấm điểm tiêu chuẩn và sửa lỗi sai từng bước.
            </p>
          </div>

          {/* Tool 2: Practical Simulator */}
          <div 
            onClick={() => onSelectTab ? onSelectTab('practical') : navigate('/?tab=practical')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Laptop className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Giả Lập Thực Hành Ribbon
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Thực hành thao tác trực tiếp trên giao diện giả lập 100% các tab Home, Insert, Formulas.
            </p>
          </div>

          {/* Tool 3: Shortcuts Guide */}
          <div 
            onClick={() => onSelectTab ? onSelectTab('shortcuts') : navigate('/?tab=shortcuts')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              Sổ Tay Phím Tắt MOS
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Tra cứu nhanh 150+ tổ hợp phím tắt thi MOS giúp hoàn thành bài thi tiết kiệm 40% thời gian.
            </p>
          </div>

          {/* Tool 4: Analytics */}
          <div 
            onClick={() => onSelectTab ? onSelectTab('analytics') : navigate('/?tab=analytics')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
              Báo Cáo Năng Lực Chi Tiết
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Xem biểu đồ điểm số theo từng Domain, lịch sử thi và dự đoán tỷ lệ đỗ chứng chỉ thực tế.
            </p>
          </div>

          {/* Tool 5: Progress Charts (Recharts) */}
          <div 
            onClick={() => onSelectTab ? onSelectTab('progress-charts') : navigate('/?tab=progress-charts')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Biểu Đồ Tiến Độ (Recharts)
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Trực quan hóa tỷ lệ hoàn thành 3 môn Word, Excel, PowerPoint qua biểu đồ cột và radar năng lực.
            </p>
          </div>

          {/* Tool 6: Quiz Engine (Firestore) */}
          <div 
            onClick={() => onSelectTab ? onSelectTab('quiz-engine') : navigate('/?tab=quiz-engine')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Khảo Thí Quiz Engine (Firestore)
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Làm bài trắc nghiệm nạp trực tiếp từ Cloud Firestore, chấm điểm và lưu tiến độ tức thì.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Quiz Score Recorder Modal */}
      {quizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Ghi Nhận Kết Quả Quiz {activePreview.toUpperCase()}
              </h3>
              <button 
                onClick={() => setQuizModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Nhập tỷ lệ điểm số bài trắc nghiệm vừa hoàn thành cho môn <strong>{activePreview.toUpperCase()}</strong>. Điểm sẽ được lưu trữ vào <code>UserProgressStore</code> và đồng bộ lên Firebase.
            </p>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Tỷ lệ trả lời đúng</span>
                <span className="text-base text-indigo-600 font-extrabold">{quickQuizScore}%</span>
              </div>
              <input 
                type="range" 
                min="30" 
                max="100" 
                value={quickQuizScore} 
                onChange={(e) => setQuickQuizScore(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>30%</span>
                <span>Chuẩn MOS: ≥ 70%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuizModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={async () => {
                  await recordQuizScore(activePreview, {
                    score: Math.round((quickQuizScore / 100) * 20),
                    total: 20,
                    percentage: quickQuizScore,
                    domainName: `Chuyên đề ${activePreview.toUpperCase()}`,
                  });
                  soundManager.playCorrect();
                  setQuizModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Lưu Điểm Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
