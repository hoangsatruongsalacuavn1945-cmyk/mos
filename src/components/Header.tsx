import React from 'react';
import { MOSSubject } from '../types/mos';
import { UserProfile } from '../types/user';
import { 
  BookOpen, 
  Monitor, 
  Award, 
  Keyboard, 
  BarChart2, 
  Bot, 
  Sparkles, 
  Compass, 
  Mail, 
  Volume2, 
  VolumeX, 
  Trophy, 
  User, 
  ShieldCheck, 
  GraduationCap 
} from 'lucide-react';

export type NavTab = 'theory' | 'practical' | 'mock-exam' | 'roadmap' | 'shortcuts' | 'analytics' | 'ai-tutor' | 'ai-practice' | 'teacher-portal';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedSubject: MOSSubject;
  onSelectSubject: (sub: MOSSubject) => void;
  onOpenReport?: () => void;
  currentUser: UserProfile;
  onOpenAuthModal: () => void;
  onOpenLeaderboard: () => void;
  onOpenCertificate: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  selectedSubject,
  onSelectSubject,
  onOpenReport,
  currentUser,
  onOpenAuthModal,
  onOpenLeaderboard,
  onOpenCertificate,
  isAudioMuted,
  onToggleAudio,
}) => {
  const isTeacher = currentUser.role === 'teacher';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            M
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
              MOS Master
            </span>
            <span className="text-[11px] text-slate-500 font-medium block leading-none">
              Ôn Thi Chứng Chỉ Quốc Tế
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          <button
            onClick={() => onSelectTab('theory')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'theory'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Lý Thuyết</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">1,000+</span>
          </button>

          <button
            onClick={() => onSelectTab('practical')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'practical'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Thực Hành</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">1,000+</span>
          </button>

          <button
            onClick={() => onSelectTab('roadmap')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'roadmap'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Lộ Trình</span>
          </button>

          <button
            onClick={() => onSelectTab('mock-exam')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'mock-exam'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Thi Thử 50P</span>
          </button>

          {/* Teacher Portal Nav Tab */}
          <button
            onClick={() => onSelectTab('teacher-portal')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'teacher-portal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50 bg-emerald-50/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Cổng Giáo Viên</span>
          </button>

          <button
            onClick={() => onSelectTab('ai-tutor')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'ai-tutor'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50/50'
            }`}
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>Gia Sư AI</span>
          </button>

          <button
            onClick={() => onSelectTab('ai-practice')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'ai-practice'
                ? 'bg-purple-50 text-purple-700 font-bold'
                : 'text-purple-600 hover:text-purple-900 hover:bg-purple-50/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Tạo Đề</span>
          </button>

          <button
            onClick={() => onSelectTab('shortcuts')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'shortcuts'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Phím Tắt</span>
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'analytics'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Tiến Độ</span>
          </button>
        </nav>

        {/* Zone 3: Subject selector pills, utilities & User Identity Switcher */}
        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <button
            onClick={onToggleAudio}
            className={`p-2 rounded-lg border transition-colors ${
              isAudioMuted
                ? 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
            }`}
            title={isAudioMuted ? 'Bật âm thanh thao tác' : 'Tắt âm thanh'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Leaderboard button */}
          <button
            onClick={onOpenLeaderboard}
            className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
            title="Bảng vàng thành tích học viên"
          >
            <Trophy className="w-4 h-4 text-amber-600" />
          </button>

          {/* Certificate button */}
          <button
            onClick={onOpenCertificate}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors"
            title="Xem và in chứng chỉ hoàn thành MOS"
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Chứng Chỉ</span>
          </button>

          {/* Subject Pills */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => onSelectSubject('all')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                selectedSubject === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => onSelectSubject('word')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                selectedSubject === 'word'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Word
            </button>
            <button
              onClick={() => onSelectSubject('excel')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                selectedSubject === 'excel'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Excel
            </button>
            <button
              onClick={() => onSelectSubject('powerpoint')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                selectedSubject === 'powerpoint'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-orange-700'
              }`}
            >
              PPT
            </button>
          </div>

          {/* User Account Button (Opens AuthModal) */}
          <button
            onClick={onOpenAuthModal}
            className={`flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl border transition-all shadow-2xs group ${
              isTeacher
                ? 'bg-emerald-50/80 hover:bg-emerald-100 border-emerald-300 text-emerald-900'
                : 'bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-800'
            }`}
            title="Nhấp để đăng nhập hoặc đổi tài khoản Học viên / Giáo viên"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0 ${
              isTeacher ? 'bg-emerald-600' : 'bg-blue-600'
            }`}>
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold leading-tight group-hover:text-blue-600 truncate max-w-[110px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-none flex items-center gap-1">
                {isTeacher ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    GV Bộ Môn
                  </span>
                ) : (
                  <span>{currentUser.studentCode || 'Học viên'}</span>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="xl:hidden flex items-center justify-between border-t border-slate-100 px-3 py-2 bg-slate-50 overflow-x-auto text-xs gap-1">
        <button
          onClick={() => onSelectTab('theory')}
          className={`px-2.5 py-1.5 font-medium rounded-md whitespace-nowrap ${currentTab === 'theory' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'}`}
        >
          Lý Thuyết
        </button>
        <button
          onClick={() => onSelectTab('practical')}
          className={`px-2.5 py-1.5 font-medium rounded-md whitespace-nowrap ${currentTab === 'practical' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'}`}
        >
          Thực Hành
        </button>
        <button
          onClick={() => onSelectTab('roadmap')}
          className={`px-2.5 py-1.5 font-bold rounded-md whitespace-nowrap ${currentTab === 'roadmap' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700'}`}
        >
          Lộ Trình
        </button>
        <button
          onClick={() => onSelectTab('mock-exam')}
          className={`px-2.5 py-1.5 font-medium rounded-md whitespace-nowrap ${currentTab === 'mock-exam' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'}`}
        >
          Thi Thử
        </button>
        <button
          onClick={() => onSelectTab('teacher-portal')}
          className={`px-2.5 py-1.5 font-bold rounded-md whitespace-nowrap ${currentTab === 'teacher-portal' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700'}`}
        >
          Cổng GV
        </button>
        <button
          onClick={() => onSelectTab('ai-tutor')}
          className={`px-2.5 py-1.5 font-bold rounded-md whitespace-nowrap ${currentTab === 'ai-tutor' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-700'}`}
        >
          Gia Sư AI
        </button>
        <button
          onClick={() => onSelectTab('ai-practice')}
          className={`px-2.5 py-1.5 font-bold rounded-md whitespace-nowrap ${currentTab === 'ai-practice' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-700'}`}
        >
          AI Tạo Đề
        </button>
        <button
          onClick={() => onSelectTab('analytics')}
          className={`px-2.5 py-1.5 font-medium rounded-md whitespace-nowrap ${currentTab === 'analytics' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'}`}
        >
          Tiến Độ
        </button>
      </div>
    </header>
  );
};
