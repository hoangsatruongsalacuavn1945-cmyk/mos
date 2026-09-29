import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../utils/userStore';
import { useUserProgressStore } from '../../utils/userProgressStore';
import { useGoogleSheetsStore } from '../../utils/googleSheetsStore';
import { saveStoredGoogleToken, appendUserRegistrationToSheet } from '../../services/googleSheetsService';
import { soundManager } from '../../utils/audio';
import { signInWithGoogle, db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    soundManager.playClick();

    try {
      const result = await signInWithGoogle();
      if (!result || !result.user) throw new Error('Không thể hoàn tất đăng nhập bằng Google.');
      const fbUser = result.user;

      if (result.accessToken) {
        saveStoredGoogleToken(result.accessToken);
      }

      // Check or create user profile in Firestore
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let role: any = 'student';
      let displayName = fbUser.displayName || 'Học viên Google';

      if (userDocSnap.exists()) {
        const existingData = userDocSnap.data();
        role = existingData.role || 'student';
        displayName = existingData.displayName || displayName;
      } else {
        // Save new user profile to Firestore
        await setDoc(userDocRef, {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName,
          role: 'student',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Automatically backup new account creation to the master Google Sheet
        appendUserRegistrationToSheet({
          uid: fbUser.uid,
          name: displayName,
          email: fbUser.email || '',
          role: 'student',
          classRoom: 'Lớp MOS Master Quốc Tế',
          teacherName: 'Trung Tâm Khảo Thí',
          provider: 'Google Sign-In (Khởi Tạo)',
        }).catch((e) => console.warn('Google Sheets auto-register warning:', e));
      }

      // Sync progress from Firestore for this user
      await useUserProgressStore.getState().loadFromFirestore(fbUser.uid);

      // Auto-backup login to Google Sheets
      useGoogleSheetsStore.getState().backupUserLogin({
        uid: fbUser.uid,
        name: displayName,
        email: fbUser.email || '',
        role: role,
        provider: 'Google Sign-In',
      }).catch((e) => console.warn('Google Sheets auto-backup warning:', e));

      const token = await fbUser.getIdToken();
      const userObj = {
        id: fbUser.uid,
        email: fbUser.email || '',
        name: displayName,
        fullName: displayName,
        role: role,
        token: token,
      };

      handleLoginSuccess(token, userObj);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      soundManager.playWrong();
      setError(err.message || 'Đăng nhập bằng Google thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
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

      // Auto-backup login to Google Sheets
      useGoogleSheetsStore.getState().backupUserLogin({
        uid: data.user.id || data.user.uid || 'user-email',
        name: data.user.name || data.user.fullName || data.user.email,
        email: data.user.email,
        role: data.user.role,
        provider: 'Tài khoản hệ thống (Email/Password)',
      }).catch((e) => console.warn('Google Sheets auto-backup warning:', e));

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

        {/* Divider */}
        <div className="relative flex items-center justify-center pt-1 pb-1">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold absolute">
            hoặc đăng nhập nhanh
          </span>
        </div>

        {/* Google Sign-In with Firebase Auth */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer border border-slate-300 disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Tiếp tục với Google (Firebase Auth)</span>
        </button>

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
