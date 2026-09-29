import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../utils/userStore';
import { soundManager } from '../utils/audio';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [isAudioMuted, setIsAudioMuted] = useState(soundManager.getMuted());

  const isTeacherOrAdmin = user.role === 'teacher' || user.role === 'admin';

  const handleToggleAudio = () => {
    const next = soundManager.toggleMute();
    setIsAudioMuted(next);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Student Public Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          
          {/* Logo & Platform Info */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
              M
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold uppercase tracking-wider">
                <span>Certiport Standard</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-base font-black text-slate-900 tracking-tight leading-none mt-0.5">
                MOS Master 365
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Luyện Thi MOS</span>
            </Link>

            <Link
              to="/thi-thu"
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/thi-thu' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Phòng Thi Thử 50P</span>
            </Link>

            <Link
              to="/ket-qua"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/ket-qua' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Bảng Điểm & Chứng Chỉ</span>
            </Link>
          </nav>

          {/* Actions & Role Switch */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Toggle */}
            <button
              onClick={handleToggleAudio}
              className={`p-2 rounded-lg border transition-colors ${
                isAudioMuted ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-blue-50 text-blue-600 border-blue-200'
              }`}
              title={isAudioMuted ? 'Bật âm thanh hiệu ứng' : 'Tắt âm thanh'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Portal Link if already Teacher or Admin */}
            {isTeacherOrAdmin ? (
              <div className="flex items-center gap-2">
                <Link
                  to={user.role === 'admin' ? '/admin/config' : '/teacher/dashboard'}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl border flex items-center gap-1.5 shadow-2xs transition-all ${
                    user.role === 'admin'
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 ring-1 ring-amber-400/40'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  {user.role === 'admin' ? <Crown className="w-4 h-4 text-amber-600" /> : <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                  <span>{user.role === 'admin' ? 'Cổng Chủ Sở Hữu' : 'Cổng Giáo Viên'}</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Public user button */
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-slate-700 hidden sm:inline">{user.name}</span>
                </div>

                <Link
                  to="/register"
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all shadow-2xs border border-blue-200 hidden sm:flex items-center gap-1.5"
                  title="Đăng ký tài khoản học viên và chọn giáo viên bộ môn"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Đăng Ký</span>
                </Link>

                <Link
                  to="/login"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  title="Cổng dành cho Giáo viên & Quản trị viên"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cổng Cán Bộ</span>
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
      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">MOS Master Platform</span>
            <span>· Chuẩn Khảo Thí Tin Học Quốc Tế Microsoft Office Specialist (MO-100 / MO-200 / MO-300)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Thang Điểm Certiport 1000 (Đạt ≥ 700)</span>
            <span>·</span>
            <Link to="/login" className="text-slate-400 hover:text-slate-700 underline">
              Cổng Giáo Viên & Quản Trị
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentLayout;
