import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../utils/userStore';
import { useUserProgressStore } from '../utils/userProgressStore';
import { soundManager } from '../utils/audio';
import { 
  LayoutDashboard, 
  BookOpen, 
  Award, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ShieldCheck, 
  Crown,
  Sparkles,
  TrendingUp,
  GraduationCap
} from 'lucide-react';

export interface NavigationSidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { getMasterProgressPercentage } = useUserProgressStore();
  const masterPercentage = getMasterProgressPercentage();

  const navLinks = [
    {
      name: 'Dashboard',
      path: '/tien-do',
      altPaths: ['/dashboard', '/progress'],
      icon: LayoutDashboard,
      badge: `${masterPercentage}%`,
      badgeClass: masterPercentage >= 70 
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
        : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    },
    {
      name: 'Courses',
      path: '/',
      altPaths: ['/courses', '/khoa-hoc'],
      icon: BookOpen,
      badge: '15 Bài',
      badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      name: 'Practice Tests',
      path: '/thi-thu',
      altPaths: ['/practice-tests', '/exam', '/ket-qua'],
      icon: Award,
      badge: '50 Phút',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    },
    {
      name: 'Profile',
      path: '/profile',
      altPaths: ['/ho-so', '/account'],
      icon: User,
      badge: user.studentCode || 'HV-2026',
      badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    },
  ];

  const handleLinkClick = () => {
    soundManager.playClick();
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          isOpenMobile 
            ? 'translate-x-0 w-72 shadow-2xl' 
            : '-translate-x-full lg:translate-x-0'
        } ${className}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <Link 
            to="/" 
            onClick={handleLinkClick}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-lg flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              M
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight block">
                  MOS Master
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block uppercase tracking-wider">
                  Khảo Thí Certiport
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Đóng thanh điều hướng"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Mini Profile Card (Sidebar top) */}
        {!isCollapsed && (
          <div className="p-3 mx-3 my-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user.role === 'admin' ? 'Quản Trị Viên' : user.role === 'teacher' ? 'Giảng Viên' : (user.studentCode || 'Học Viên')}
                </div>
              </div>
            </div>

            {user.assignedTeacherName && (
              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">GV: {user.assignedTeacherName}</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Menu Điều Hướng
            </div>
          )}

          {navLinks.map((item) => {
            const Icon = item.icon;
            const isExact = location.pathname === item.path;
            const isAlt = item.altPaths.some(p => location.pathname === p || (p !== '/' && location.pathname.startsWith(p)));
            const isActive = isExact || isAlt;

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={handleLinkClick}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between truncate">
                    <span className="truncate">{item.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : item.badgeClass
                    }`}>
                      {item.badge}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer info in sidebar */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 shrink-0 flex items-center justify-between">
            <span className="truncate">Chuẩn Certiport 2026</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">700/1000</span>
          </div>
        )}
      </aside>
    </>
  );
};

export default NavigationSidebar;
