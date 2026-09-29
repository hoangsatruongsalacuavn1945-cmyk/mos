import React, { useState, useEffect } from 'react';
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
import { MOSSubject, UserStats } from '../../types/mos';
import { loadUserStats } from '../../utils/storage';
import { useAuthStore } from '../../utils/userStore';
import { soundManager } from '../../utils/audio';
import { 
  Award, 
  BookOpen, 
  Monitor, 
  Keyboard, 
  BarChart2, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Bot, 
  Mail, 
  Trophy, 
  GraduationCap, 
  FileSpreadsheet, 
  ShieldCheck, 
  Crown,
  Laptop
} from 'lucide-react';

export type StudentNavTab = 'hub' | 'leaderboard' | 'progress-charts' | 'quiz-engine' | 'theory' | 'practical' | 'file-grader' | 'roadmap' | 'shortcuts' | 'analytics' | 'ai-tutor' | 'ai-practice';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const [currentTab, setCurrentTab] = useState<StudentNavTab>('theory');
  const [selectedSubject, setSelectedSubject] = useState<MOSSubject>('all');
  const [stats, setStats] = useState<UserStats>(loadUserStats());

  // Modals
  const [isSystemCheckOpen, setIsSystemCheckOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
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

  return (
    <div className="flex flex-col">
      {/* Subject Filter & Quick Navigation Bar */}
      <div className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Subject Pills */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>Khảo Thí Chuẩn Quốc Tế MOS 365 / 2019</span>
                <span>·</span>
                <span className="text-blue-600 font-semibold">IIG & Certiport</span>
                <span>·</span>
                <span>Thang điểm 1000 (Đạt ≥ 700)</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                {selectedSubject === 'word'
                  ? 'MOS Word Associate (MO-100) - Soạn Thảo & Định Dạng Tài Liệu'
                  : selectedSubject === 'excel'
                  ? 'MOS Excel Associate (MO-200) - Phân Tích Dữ Liệu & Làm Chủ Hàm'
                  : selectedSubject === 'powerpoint'
                  ? 'MOS PowerPoint Associate (MO-300) - Thiết Kế & Hiệu Ứng Trình Chiếu'
                  : 'MOS Master - Luyện Thi Chứng Chỉ Tin Học Quốc Tế Toàn Diện'}
              </h1>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Subject Selector Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              {(['all', 'word', 'excel', 'powerpoint'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedSubject(s);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                    selectedSubject === s ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s === 'all' ? 'Tất cả' : s}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                setIsSystemCheckOpen(true);
              }}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Kiểm tra tương thích phòng thi (màn hình, mạng)"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Kiểm Tra Máy Thi</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setIsLeaderboardOpen(true);
              }}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Bảng vàng vinh danh điểm cao"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Bảng Vàng</span>
            </button>

            {(role === 'admin' || role === 'teacher') && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  setIsSheetsModalOpen(true);
                }}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Quản trị dữ liệu Google Sheets (Chỉ Giáo viên & Ban Quản trị)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sao Lưu Google Sheets</span>
              </button>
            )}

            <button
              onClick={() => {
                soundManager.playClick();
                navigate('/thi-thu');
              }}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Vào Thi Thử 50 Phút</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2 text-xs">
          <button
            onClick={() => { soundManager.playClick(); setCurrentTab('hub'); }}
            className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'hub' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Trung Tâm Học Tập (Hub)</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setCurrentTab('leaderboard'); }}
            className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'leaderboard' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Bảng Xếp Hạng Tiến Độ</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setCurrentTab('progress-charts'); }}
            className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'progress-charts' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>Biểu Đồ Tiến Độ (Recharts)</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setCurrentTab('quiz-engine'); }}
            className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'quiz-engine' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Khảo Thí Quiz Engine (Firestore)</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setCurrentTab('theory'); }}
            className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'theory' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Trắc Nghiệm Lý Thuyết</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setCurrentTab('practical'); }}
            className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'practical' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Thao Tác Thực Hành (Projects)</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setCurrentTab('file-grader'); }}
            className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'file-grader' ? 'bg-emerald-50 text-emerald-700' : 'text-emerald-800 hover:bg-emerald-50/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Chấm File Tự Động (.xlsx / .docx)</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setCurrentTab('roadmap'); }}
            className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'roadmap' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Lộ Trình Cá Nhân Hóa</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setCurrentTab('ai-tutor'); }}
            className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'ai-tutor' ? 'bg-indigo-50 text-indigo-700' : 'text-indigo-600 hover:bg-indigo-50/50'
            }`}
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>Gia Sư AI Trợ Giảng</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setCurrentTab('ai-practice'); }}
            className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'ai-practice' ? 'bg-purple-50 text-purple-700' : 'text-purple-600 hover:bg-purple-50/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Tạo Đề Tùy Biến</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setCurrentTab('shortcuts'); }}
            className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'shortcuts' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Phím Tắt Vàng</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setCurrentTab('analytics'); }}
            className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'analytics' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Phân Tích Năng Lực</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="py-6">
        {currentTab === 'hub' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Dashboard 
              onSelectSubject={(sub) => setSelectedSubject(sub)}
              onSelectTab={(tab) => setCurrentTab(tab as StudentNavTab)}
              onStartExam={(sub) => navigate(`/thi-thu?subject=${sub || 'excel'}`)}
            />
          </div>
        )}

        {currentTab === 'leaderboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Leaderboard 
              onSelectAction={(action, subject) => {
                if (action === 'study') {
                  setCurrentTab('theory');
                } else {
                  navigate(`/thi-thu?subject=${subject || 'excel'}`);
                }
              }}
            />
          </div>
        )}

        {currentTab === 'progress-charts' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <ProgressDashboard />
          </div>
        )}

        {currentTab === 'quiz-engine' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <QuizEngine initialSubject={selectedSubject === 'all' ? 'excel' : selectedSubject} />
          </div>
        )}

        {currentTab === 'theory' && (
          <TheoryQuiz
            selectedSubject={selectedSubject}
            bookmarkedIds={stats.bookmarkedQuestionIds}
            wrongIds={stats.wrongQuestionIds}
            onStatsUpdate={refreshStats}
          />
        )}

        {currentTab === 'practical' && (
          <PracticalSimulator
            selectedSubject={selectedSubject}
            completedTaskIds={stats.completedTaskIds}
            onStatsUpdate={refreshStats}
          />
        )}

        {currentTab === 'file-grader' && (
          <RealFileGrader currentUser={user} onStatsUpdate={refreshStats} />
        )}

        {currentTab === 'roadmap' && (
          <PersonalizedRoadmap
            stats={stats}
            onNavigateTab={(t) => setCurrentTab(t as any)}
            onSelectSubject={(s) => setSelectedSubject(s)}
          />
        )}

        {currentTab === 'ai-tutor' && (
          <AITutorChat
            selectedSubject={selectedSubject}
          />
        )}

        {currentTab === 'ai-practice' && (
          <AIPracticeGenerator
            selectedSubject={selectedSubject}
          />
        )}

        {currentTab === 'shortcuts' && (
          <ShortcutsGuide selectedSubject={selectedSubject} />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsDashboard
            stats={stats}
            onStatsUpdate={refreshStats}
            onNavigateToQuiz={() => setCurrentTab('theory')}
          />
        )}
      </div>

      {/* System Check Modal */}
      <SystemCheckModal
        isOpen={isSystemCheckOpen}
        onClose={() => setIsSystemCheckOpen(false)}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* Certificate Modal */}
      <MOSCertificateModal
        isOpen={isCertificateOpen}
        user={user}
        subject={certificateInfo.subject}
        score={certificateInfo.score}
        onClose={() => setIsCertificateOpen(false)}
      />

      {/* Supervisor Report Modal */}
      {isReportOpen && (
        <SupervisorReportModal
          stats={stats}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      {/* Google Sheets Backup & Sync Modal */}
      <GoogleSheetsBackupModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />
    </div>
  );
};

export default Home;
