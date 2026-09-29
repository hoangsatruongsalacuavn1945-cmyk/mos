import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../utils/userStore';
import { soundManager } from '../utils/audio';
import { ThemeLanguageSwitcher } from '../components/ThemeLanguageSwitcher';
import { 
  ShieldCheck, 
  Crown, 
  Users, 
  BookOpen, 
  FileSpreadsheet, 
  Award, 
  LogOut, 
  Settings, 
  History, 
  ChevronRight, 
  Menu, 
  X,
  ExternalLink,
  GraduationCap,
  Layers,
  Database,
  BarChart3
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user.role === 'admin';
  const isTeacher = user.role === 'teacher';

  const handleLogout = () => {
    soundManager.playClick();
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
            isAdmin ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
          }`}>
            {isAdmin ? <Crown className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-xs font-bold text-white">{user.name}</div>
            <div className="text-[10px] text-slate-400 capitalize">{user.role === 'admin' ? 'Chủ Sở Hữu' : 'Giáo Viên'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeLanguageSwitcher compact />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Dedicated Private Sidebar (Desktop + Mobile overlay) */}
      <aside className={`
        ${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col justify-between
        w-full md:w-64 bg-slate-900 border-r border-slate-800 p-5 shrink-0 z-30
        fixed md:sticky top-0 md:h-screen h-[calc(100vh-65px)] overflow-y-auto
      `}>
        <div className="space-y-6">
          {/* Brand & Portal Type */}
          <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-lg ${
              isAdmin 
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-amber-500/20' 
                : 'bg-emerald-600 text-white shadow-emerald-600/20'
            }`}>
              {isAdmin ? <Crown className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                {isAdmin ? 'ADMINISTRATOR' : 'TEACHER PORTAL'}
              </div>
              <div className="text-sm font-black text-white tracking-tight">
                {isAdmin ? 'Trung Tâm Chủ Sở Hữu' : 'Cổng Khảo Thí Giáo Viên'}
              </div>
            </div>
          </div>

          {/* Current User Badge Card */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                isAdmin 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isAdmin ? 'ROOT SUPER ADMIN' : 'GIẢNG VIÊN BỘ MÔN'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-xs font-bold text-white truncate">{user.name}</div>
            <div className="text-[10px] text-slate-400 font-mono truncate">{user.email || 'Hệ thống'}</div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-semibold">
            {/* Teacher Links */}
            {(isTeacher || isAdmin) && (
              <>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pt-2 pb-1">
                  Nghiệp Vụ Giảng Viên
                </div>
                <Link
                  to="/teacher/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                    location.pathname === '/teacher/dashboard'
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Quản Lý Bài Nộp Thí Sinh</span>
                </Link>

                <Link
                  to="/teacher/gradebook"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                    location.pathname === '/teacher/gradebook'
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Sổ Điểm & Bảng Thống Kê</span>
                </Link>
              </>
            )}

            {/* Admin Only Links */}
            {isAdmin && (
              <>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80 px-3 pt-4 pb-1">
                  Đặc Quyền Chủ Sở Hữu (Root)
                </div>
                <Link
                  to="/admin/users"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                    location.pathname === '/admin/users'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-950'
                      : 'text-amber-200/90 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Quản Lý Người Dùng & Phân Quyền</span>
                </Link>

                <Link
                  to="/admin/config"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                    location.pathname === '/admin/config'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-950'
                      : 'text-amber-200/90 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Cổng Chủ Sở Hữu (Tổng Quan & Audit)</span>
                </Link>
              </>
            )}

            {/* Public Switch */}
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pt-4 pb-1">
              Khảo Thí Công Khai
            </div>
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Xem Góc Học Viên</span>
            </Link>

            <Link
              to="/thi-thu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Award className="w-4 h-4 text-purple-400" />
              <span>Phòng Thi Thử 50 Phút</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-slate-400 font-medium">Giao diện & Ngôn ngữ:</span>
            <ThemeLanguageSwitcher compact />
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 hover:text-red-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Đăng Xuất Khỏi Cán Bộ</span>
          </button>
        </div>
      </aside>

      {/* Main Admin / Teacher Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
