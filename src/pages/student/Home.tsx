import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TheoryQuiz } from '../../components/TheoryQuiz';
import { PracticalSimulator } from '../../components/PracticalSimulator';
import { ShortcutsGuide } from '../../components/ShortcutsGuide';
import { AnalyticsDashboard } from '../../components/AnalyticsDashboard';
import { AITutorChat } from '../../components/AITutorChat';
import { AIPracticeGenerator } from '../../components/AIPracticeGenerator';
import { PersonalizedRoadmap } from '../../components/PersonalizedRoadmap';
import { RealFileGrader } from '../../components/RealFileGrader';
import { Dashboard } from '../../components/Dashboard';
import { QuizEngine } from '../../components/QuizEngine';
import { ProgressDashboard } from '../../components/ProgressDashboard';
import { Leaderboard } from '../../components/Leaderboard';
import { SystemCheckModal } from '../../components/SystemCheckModal';
import { LeaderboardModal } from '../../components/LeaderboardModal';
import { MOSCertificateModal } from '../../components/MOSCertificateModal';
import { SupervisorReportModal } from '../../components/SupervisorReportModal';
import { GoogleSheetsBackupModal } from '../../components/GoogleSheetsBackupModal';
import { FeedbackModal } from '../../components/FeedbackModal';
import { ExamTimerSimulatorModal } from '../../components/exam/ExamTimerSimulatorModal';
import { MasteryProgressDashboard } from '../../components/dashboard/MasteryProgressDashboard';
import { OfflineStudyManagerModal } from '../../components/offline/OfflineStudyManagerModal';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { MOSSubject, UserStats } from '../../types/mos';
import { loadUserStats } from '../../utils/storage';
import { useAuthStore } from '../../utils/userStore';
import { soundManager } from '../../utils/audio';
import { 
  BarChart3, 
  BookOpen, 
  Monitor, 
  Keyboard, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Bot, 
  Trophy, 
  GraduationCap, 
  FileSpreadsheet, 
  ShieldCheck, 
  PenTool,
  Wrench,
  Layers,
  ArrowRight,
  Flame,
  FileCheck,
  Award,
  MessageSquarePlus,
  Wifi,
  WifiOff
} from 'lucide-react';

// 4 Cohesive Workspaces grouping all related features together
export type MainWorkspace = 'overview' | 'exam_practice' | 'ai_roadmap' | 'tools';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const [selectedSubject, setSelectedSubject] = useState<MOSSubject>('all');
  const [stats, setStats] = useState<UserStats>(loadUserStats());

  // Main workspace state
  const [activeWorkspace, setActiveWorkspace] = useState<MainWorkspace>('overview');

  // Sub-tabs for each workspace (keeps UI compact, prevents scroll fatigue)
  const [overviewSubTab, setOverviewSubTab] = useState<'hub' | 'charts' | 'leaderboard'>('hub');
  const [practiceSubTab, setPracticeSubTab] = useState<'exam_center' | 'quiz_engine' | 'ribbon_simulator' | 'file_grader' | 'theory'>('exam_center');
  const [aiSubTab, setAiSubTab] = useState<'roadmap' | 'ai_tutor' | 'ai_practice'>('roadmap');
  const [toolsSubTab, setToolsSubTab] = useState<'shortcuts' | 'analytics' | 'sheets_backup'>('shortcuts');

  // Modals
  const [isSystemCheckOpen, setIsSystemCheckOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isOfflineManagerOpen, setIsOfflineManagerOpen] = useState(false);
  const [isTimerSimulatorOpen, setIsTimerSimulatorOpen] = useState(false);

  const { isOnline, status: offlineStatus } = useOfflineSync();
  const [certificateInfo, setCertificateInfo] = useState<{ subject: string; score: number }>({
    subject: 'excel',
    score: 850,
  });

  const refreshStats = () => {
    setStats(loadUserStats());
  };

  const handleOpenCertificate = (sub?: string, score?: number) => {
    const passedExam = stats.examHistory.find(e => e.passed);
    setCertificateInfo({
      subject: sub || (passedExam?.subject === 'mixed' ? 'excel' : passedExam?.subject) || (selectedSubject === 'all' ? 'excel' : selectedSubject),
      score: score || passedExam?.score || 850,
    });
    setIsCertificateOpen(true);
  };

  const totalExamsPassed = stats.examHistory ? stats.examHistory.filter(e => e.passed).length : 0;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* ========================================================================= */}
      {/* COMPACT STICKY CONTROL BAR: SUBJECT SWITCHER + LIVE BADGES + CTAS */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Program Branding & Subject Filter */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white shadow-xs shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                <span className="text-blue-600 font-bold uppercase tracking-wider">MOS Certiport 365/2019</span>
                <span>·</span>
                <span>Thang Điểm 1000 (Đạt ≥ 700)</span>
              </div>

              {/* Subject Selector Buttons */}
              <div className="flex items-center gap-1 mt-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(['all', 'word', 'excel', 'powerpoint'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedSubject(s);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all capitalize cursor-pointer ${
                      selectedSubject === s 
                        ? 'bg-white text-blue-700 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s === 'all' ? 'Tất cả 3 môn' : s === 'powerpoint' ? 'PowerPoint' : s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Quick Action Badges & Primary CTA */}
          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
            {/* Streak & Status Badges */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
              <span className="flex items-center gap-1 font-bold text-orange-600">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                {stats.streakDays || 1} ngày
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-medium">
                Đạt <strong className="text-emerald-600">{totalExamsPassed}/3</strong> môn
              </span>
            </div>

            {/* System Check button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setIsSystemCheckOpen(true);
              }}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Kiểm tra hệ thống máy thi"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Kiểm Tra Máy</span>
            </button>

            {/* Offline Study Center (Service Worker Caching) */}
            <button
              onClick={() => {
                soundManager.playClick();
                setIsOfflineManagerOpen(true);
              }}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                !isOnline
                  ? 'bg-amber-500 text-white animate-pulse'
                  : offlineStatus.activeCacheCount > 0
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Quản lý bộ đề thi và tài liệu học ngoại tuyến qua Service Worker Cache"
            >
              {!isOnline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Học Offline (Đang Mất Mạng)</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    Học Ngoại Tuyến {offlineStatus.activeCacheCount > 0 ? `(${offlineStatus.activeCacheCount} gói)` : ''}
                  </span>
                </>
              )}
            </button>

            {/* Owner Feedback & Web Rating button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setIsFeedbackOpen(true);
              }}
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Góp ý cho chủ sở hữu, đánh giá website hoặc báo lỗi khuất màn hình máy thi"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-amber-600" />
              <span>Góp Ý & Báo Lỗi</span>
            </button>

            {/* Sheets Backup & Dual-Write button (Teachers/Admins) */}
            {(role === 'admin' || role === 'teacher') && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  setIsSheetsModalOpen(true);
                }}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Sao lưu & Đồng bộ 8 bảng dữ liệu liên kết trên Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Sheets</span>
              </button>
            )}

            {/* Primary CTA: Vào Phòng Thi Thử 50 Phút */}
            <button
              onClick={() => {
                soundManager.playClick();
                navigate(`/thi-thu?subject=${selectedSubject === 'all' ? 'excel' : selectedSubject}`);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Vào Thi Thử 50P</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 COHESIVE WORKSPACE TABS: GỘP TẤT CẢ TÍNH NĂNG LIÊN QUAN LẠI */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto py-2">
          
          <div className="flex items-center gap-2">
            {/* WORKSPACE 1: TỔNG QUAN & TIẾN ĐỘ */}
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveWorkspace('overview');
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeWorkspace === 'overview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>1. Tổng Quan & Tiến Độ</span>
            </button>

            {/* WORKSPACE 2: KHẢO THÍ & THỰC HÀNH */}
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveWorkspace('exam_practice');
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeWorkspace === 'exam_practice'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>2. Khảo Thí & Thực Hành</span>
            </button>

            {/* WORKSPACE 3: TRÍ TUỆ NHÂN TẠO & LỘ TRÌNH */}
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveWorkspace('ai_roadmap');
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeWorkspace === 'ai_roadmap'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>3. Trợ Lý AI & Lộ Trình</span>
            </button>

            {/* WORKSPACE 4: CÔNG CỤ & TRA CỨU */}
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveWorkspace('tools');
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeWorkspace === 'tools'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>4. Công Cụ & Sổ Tay</span>
            </button>
          </div>

          {/* Quick certificate trigger */}
          <button
            onClick={() => handleOpenCertificate()}
            className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Chứng Chỉ Số MOS</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-NAVIGATION PILLS: CHUYỂN TỨC THÌ, KHÔNG CUỘN TRANG */}
      {/* ========================================================================= */}
      <div className="bg-slate-100/80 border-b border-slate-200/80 py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto text-xs">
          
          {/* Workspace 1 Sub-tabs */}
          {activeWorkspace === 'overview' && (
            <>
              <button
                onClick={() => { soundManager.playClick(); setOverviewSubTab('hub'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  overviewSubTab === 'hub' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dashboard 3 Môn Học
              </button>
              <button
                onClick={() => { soundManager.playClick(); setOverviewSubTab('charts'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  overviewSubTab === 'charts' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Biểu Đồ Hiệu Suất Recharts
              </button>
              <button
                onClick={() => { soundManager.playClick(); setOverviewSubTab('leaderboard'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  overviewSubTab === 'leaderboard' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bảng Vàng Thi Đua
              </button>
            </>
          )}

          {/* Workspace 2 Sub-tabs */}
          {activeWorkspace === 'exam_practice' && (
            <>
              <button
                onClick={() => { soundManager.playClick(); setPracticeSubTab('exam_center'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  practiceSubTab === 'exam_center' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cổng Khảo Thí 50 Phút
              </button>
              <button
                onClick={() => { soundManager.playClick(); setPracticeSubTab('quiz_engine'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  practiceSubTab === 'quiz_engine' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Trắc Nghiệm Firestore Quiz
              </button>
              <button
                onClick={() => { soundManager.playClick(); setPracticeSubTab('ribbon_simulator'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  practiceSubTab === 'ribbon_simulator' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Thực Hành Ribbon 1000 Tasks
              </button>
              <button
                onClick={() => { soundManager.playClick(); setPracticeSubTab('file_grader'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  practiceSubTab === 'file_grader' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chấm File Tự Động (.xlsx / .docx)
              </button>
              <button
                onClick={() => { soundManager.playClick(); setPracticeSubTab('theory'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  practiceSubTab === 'theory' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ngân Hàng Câu Hỏi Lý Thuyết
              </button>
            </>
          )}

          {/* Workspace 3 Sub-tabs */}
          {activeWorkspace === 'ai_roadmap' && (
            <>
              <button
                onClick={() => { soundManager.playClick(); setAiSubTab('roadmap'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  aiSubTab === 'roadmap' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lộ Trình Cá Nhân Hóa
              </button>
              <button
                onClick={() => { soundManager.playClick(); setAiSubTab('ai_tutor'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  aiSubTab === 'ai_tutor' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gia Sư Trợ Giảng AI
              </button>
              <button
                onClick={() => { soundManager.playClick(); setAiSubTab('ai_practice'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  aiSubTab === 'ai_practice' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AI Tạo Đề Tùy Biến
              </button>
            </>
          )}

          {/* Workspace 4 Sub-tabs */}
          {activeWorkspace === 'tools' && (
            <>
              <button
                onClick={() => { soundManager.playClick(); setToolsSubTab('shortcuts'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  toolsSubTab === 'shortcuts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sổ Tay Phím Tắt Vàng
              </button>
              <button
                onClick={() => { soundManager.playClick(); setToolsSubTab('analytics'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  toolsSubTab === 'analytics' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Phân Tích Năng Lực & Radar
              </button>
              <button
                onClick={() => { soundManager.playClick(); setIsSheetsModalOpen(true); }}
                className="px-3 py-1 rounded-lg font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all cursor-pointer border border-emerald-200"
              >
                Đồng Bộ Google Sheets & CSDL
              </button>
            </>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* WORKSPACE VIEWPORTS: COMPACT, BALANCED, ZERO CLUTTER */}
      {/* ========================================================================= */}
      <div className="py-5 flex-1">
        
        {/* WORKSPACE 1: TỔNG QUAN & TIẾN ĐỘ */}
        {activeWorkspace === 'overview' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {overviewSubTab === 'hub' && (
              <Dashboard 
                onSelectSubject={(sub) => setSelectedSubject(sub)}
                onSelectTab={(tab) => {
                  if (tab === 'leaderboard') setOverviewSubTab('leaderboard');
                  else if (tab === 'progress-charts') setOverviewSubTab('charts');
                  else if (tab === 'practical') {
                    setActiveWorkspace('exam_practice');
                    setPracticeSubTab('ribbon_simulator');
                  } else if (tab === 'quiz-engine') {
                    setActiveWorkspace('exam_practice');
                    setPracticeSubTab('quiz_engine');
                  }
                }}
                onStartExam={(sub) => navigate(`/thi-thu?subject=${sub || 'excel'}`)}
              />
            )}

            {overviewSubTab === 'charts' && (
              <div className="space-y-4">
                <ProgressDashboard />
              </div>
            )}

            {overviewSubTab === 'leaderboard' && (
              <Leaderboard 
                onSelectAction={(action, subject) => {
                  if (action === 'study') {
                    setActiveWorkspace('exam_practice');
                    setPracticeSubTab('quiz_engine');
                  } else {
                    navigate(`/thi-thu?subject=${subject || 'excel'}`);
                  }
                }}
              />
            )}
          </div>
        )}

        {/* WORKSPACE 2: KHẢO THÍ & THỰC HÀNH */}
        {activeWorkspace === 'exam_practice' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {practiceSubTab === 'exam_center' && (
              <div className="space-y-5">
                {/* Hero Card for 50-minute Certiport Exam */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Phòng Khảo Thí Chuẩn Hóa Quốc Tế Certiport
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Kỳ Thi Thử MOS 50 Phút (1000 Điểm)
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                      Đề thi bao quát trắc nghiệm tình huống, nhận diện lệnh Ribbon và thao tác chuẩn xác. Hệ thống chấm tự động và lưu điểm minh bạch vào CSDL & Google Sheets.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      soundManager.playClick();
                      navigate(`/thi-thu?subject=${selectedSubject === 'all' ? 'excel' : selectedSubject}`);
                    }}
                    className="px-6 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Bắt Đầu Làm Bài Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Cards to Practice Modes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div 
                    onClick={() => setPracticeSubTab('quiz_engine')}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">Trắc Nghiệm Firestore Quiz</h3>
                    <p className="text-xs text-slate-500 mt-1">Luyện tập câu hỏi phân theo từng Domain kỹ năng Certiport.</p>
                  </div>

                  <div 
                    onClick={() => setPracticeSubTab('ribbon_simulator')}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-700">Thực Hành Ribbon 1000 Tasks</h3>
                    <p className="text-xs text-slate-500 mt-1">Giả lập thao tác Ribbon Word, Excel, PowerPoint chuẩn GMetrix.</p>
                  </div>

                  <div 
                    onClick={() => setPracticeSubTab('file_grader')}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-700">Chấm File Tự Động</h3>
                    <p className="text-xs text-slate-500 mt-1">Nộp tệp bài làm .xlsx hoặc .docx để AI chấm điểm tức thì.</p>
                  </div>

                  <div 
                    onClick={() => {
                      soundManager.playClick();
                      setIsTimerSimulatorOpen(true);
                    }}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700">Đồng Hồ Áp Lực Thi MOS</h3>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-800">Mới</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Đếm ngược trực quan, tạm dừng bảo mật & mô phỏng áp lực 50p.</p>
                  </div>
                </div>
              </div>
            )}

            {practiceSubTab === 'quiz_engine' && (
              <QuizEngine initialSubject={selectedSubject === 'all' ? 'excel' : selectedSubject} />
            )}

            {practiceSubTab === 'ribbon_simulator' && (
              <PracticalSimulator
                selectedSubject={selectedSubject}
                completedTaskIds={stats.completedTaskIds}
                onStatsUpdate={refreshStats}
              />
            )}

            {practiceSubTab === 'file_grader' && (
              <RealFileGrader currentUser={user} onStatsUpdate={refreshStats} />
            )}

            {practiceSubTab === 'theory' && (
              <TheoryQuiz
                selectedSubject={selectedSubject}
                bookmarkedIds={stats.bookmarkedQuestionIds}
                wrongIds={stats.wrongQuestionIds}
                onStatsUpdate={refreshStats}
              />
            )}
          </div>
        )}

        {/* WORKSPACE 3: TRÍ TUỆ NHÂN TẠO & LỘ TRÌNH */}
        {activeWorkspace === 'ai_roadmap' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {aiSubTab === 'roadmap' && (
              <PersonalizedRoadmap
                stats={stats}
                onNavigateTab={(t) => {
                  if (t === 'theory') {
                    setActiveWorkspace('exam_practice');
                    setPracticeSubTab('theory');
                  } else if (t === 'practical') {
                    setActiveWorkspace('exam_practice');
                    setPracticeSubTab('ribbon_simulator');
                  }
                }}
                onSelectSubject={(s) => setSelectedSubject(s)}
              />
            )}

            {aiSubTab === 'ai_tutor' && (
              <AITutorChat selectedSubject={selectedSubject} />
            )}

            {aiSubTab === 'ai_practice' && (
              <AIPracticeGenerator selectedSubject={selectedSubject} />
            )}
          </div>
        )}

        {/* WORKSPACE 4: CÔNG CỤ & TRA CỨU */}
        {activeWorkspace === 'tools' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {toolsSubTab === 'shortcuts' && (
              <ShortcutsGuide selectedSubject={selectedSubject} />
            )}

            {toolsSubTab === 'analytics' && (
              <MasteryProgressDashboard
                onStartExam={(s) => {
                  navigate(`/thi-thu?subject=${s || (selectedSubject === 'all' ? 'excel' : selectedSubject)}`);
                }}
                onNavigateTab={(t) => {
                  if (t === 'quiz-engine') {
                    setActiveWorkspace('exam_practice');
                    setPracticeSubTab('quiz_engine');
                  }
                }}
              />
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      <SystemCheckModal
        isOpen={isSystemCheckOpen}
        onClose={() => setIsSystemCheckOpen(false)}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      <MOSCertificateModal
        isOpen={isCertificateOpen}
        user={user}
        subject={certificateInfo.subject}
        score={certificateInfo.score}
        onClose={() => setIsCertificateOpen(false)}
      />

      {isReportOpen && (
        <SupervisorReportModal
          stats={stats}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      <GoogleSheetsBackupModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      <OfflineStudyManagerModal
        isOpen={isOfflineManagerOpen}
        onClose={() => setIsOfflineManagerOpen(false)}
        onStartExam={(subject) => {
          navigate(`/thi-thu?subject=${subject}`);
        }}
      />

      {/* Reusable Exam Pressure Timer & Security Pause Simulator Modal */}
      <ExamTimerSimulatorModal
        isOpen={isTimerSimulatorOpen}
        onClose={() => setIsTimerSimulatorOpen(false)}
      />
    </div>
  );
};

export default Home;
