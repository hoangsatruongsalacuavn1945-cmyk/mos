import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../utils/userStore';
import { soundManager } from '../../utils/audio';
import {
  LogIn,
  Mail,
  Lock,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  KeyRound
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginToStore = useAuthStore(state => state.login);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginSuccess = (token: string, user: any) => {
    soundManager.playCorrect();

    // 1. Lưu token vào localStorage để gọi API xác thực
    localStorage.setItem('accessToken', token);

    // 2. Cập nhật trạng thái người dùng vào Store
    loginToStore(user, token);

    // 3. ĐIỀU HƯỚNG DỰA TRÊN ROLE BẢO MẬT
    const intended = (location.state as any)?.from?.pathname;
    if (intended) {
      navigate(intended, { replace: true });
      return;
    }

    if (user.role === 'teacher') {
      navigate('/teacher/dashboard'); // Giáo viên vào thẳng Portal quản lý
    } else if (user.role === 'admin') {
      navigate('/admin/config');      // Admin vào trang cấu hình
    } else {
      navigate('/');                  // Học sinh về trang chủ luyện thi
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    soundManager.playClick();

    try {
      // Xác thực tài khoản & mật khẩu qua API bảo mật
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Email hoặc mật khẩu không chính xác!');
      }

      handleLoginSuccess(data.token, data.user);
    } catch (err: any) {
      soundManager.playWrong();
      setError(err.message || 'Lỗi kết nối máy chủ xác thực');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
        
        {/* Navigation back to main training */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Về Trang Luyện Thi MOS</span>
          </Link>

          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-950/80 text-blue-400 border border-blue-800/60 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            BẢO MẬT KHẢO THÍ
          </span>
        </div>

        {/* Brand & Heading */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/20">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Đăng Nhập Hệ Thống
          </h1>
          <p className="text-xs text-slate-400">
            Cổng xác thực định danh duy nhất cho Học viên, Giảng viên và Quản trị viên
          </p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Unified Login Form - Strictly Username & Password */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tài Khoản / Địa Chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@edu.vn hoặc email của bạn"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mật Khẩu Bảo Mật
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/25 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang xác thực thông tin...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Xác Thực & Đăng Nhập</span>
              </>
            )}
          </button>
        </form>

        {/* Security assurance banner */}
        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Hệ thống bảo vệ bằng xác thực JWT & mã hóa mật khẩu Bcrypt đa lớp.</span>
        </div>

        {/* Link to Student Register */}
        <div className="pt-2 text-center text-xs text-slate-400">
          <span>Học viên mới chưa có tài khoản? </span>
          <Link
            to="/register"
            className="text-blue-400 hover:text-blue-300 font-bold hover:underline transition-colors"
          >
            Đăng ký tài khoản học viên
          </Link>
        </div>

      </div>
    </div>
  );
}
