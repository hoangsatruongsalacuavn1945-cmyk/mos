import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../utils/userStore';
import { useLanguageStore } from '../utils/languageStore';
import { soundManager } from '../utils/audio';
import { ThemeLanguageSwitcher } from '../components/ThemeLanguageSwitcher';
import { 
  Award, 
  BookOpen, 
  Monitor, 
  Keyboard, 
  BarChart2, 
  Bot, 
  Sparkles, 
  Compass, 
  FileSpreadsheet, 
  ShieldCheck, 
  Crown, 
  LogIn, 
  LogOut,
  User,
  UserPlus,
  Volume2,
  VolumeX,
  ExternalLink
} from 'lucide-react';

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAudioMuted, setIsAudioMuted] = useState(soundManager.getMuted());

  const isTeacherOrAdmin = user.role === 'teacher' || user.role === 'admin';

  const handleToggleAudio = () => {
    const next = soundManager.toggleMute();
    setIsAudioMuted(next);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-200">
      {/* Student Public Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          
          {/* Logo & Platform Info */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
              M
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                <span>{t('certiportStandard')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-none mt-0.5">
                {t('platformTitle')}
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/' 
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('navTraining')}</span>
            </Link>

            <Link
              to="/thi-thu"
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/thi-thu' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>{t('navMockExam')}</span>
            </Link>

            <Link
              to="/ket-qua"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/ket-qua' 
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>{t('navResults')}</span>
            </Link>
          </nav>

          {/* Actions: Audio, Language & Theme Switcher, Role Portal */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Audio Toggle */}
            <button
              onClick={handleToggleAudio}
              className={`p-2 rounded-xl border transition-colors ${
                isAudioMuted 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700' 
                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
              }`}
              title={isAudioMuted ? t('soundOn') : t('soundOff')}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Language & Theme Switcher */}
            <ThemeLanguageSwitcher />

            {/* Portal Link if already Teacher or Admin */}
            {isTeacherOrAdmin ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to={user.role === 'admin' ? '/admin/config' : '/teacher/dashboard'}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl border flex items-center gap-1.5 shadow-2xs transition-all ${
                    user.role === 'admin'
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 ring-1 ring-amber-400/40'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                  }`}
                >
                  {user.role === 'admin' ? <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  <span>{user.role === 'admin' ? t('ownerPortal') : t('teacherPortal')}</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Public user buttons */
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">{user.name}</span>
                </div>

                <Link
                  to="/register"
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl transition-all shadow-2xs border border-blue-200 dark:border-blue-800 hidden sm:flex items-center gap-1.5"
                  title="Đăng ký tài khoản học viên"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t('register')}</span>
                </Link>

                <Link
                  to="/login"
                  className="px-3 py-1.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  title={t('officerPortal')}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('officerPortal')}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Public Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Student Public Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">MOS Master Platform</span>
            <span>· Chuẩn Khảo Thí Tin Học Quốc Tế Microsoft Office Specialist (MO-100 / MO-200 / MO-300)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>{t('passStandard')}</span>
            <span>·</span>
            <Link to="/login" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline">
              {t('officerPortal')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentLayout;
