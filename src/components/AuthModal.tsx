import React, { useState, useEffect } from 'react';
import { UserProfile, TeacherProfile } from '../types/user';
import { DEFAULT_TEACHERS, saveCurrentUser, DEFAULT_STUDENT, OWNER_PROFILE, getTeachers, useAuthStore, AUTH_TOKEN_KEY } from '../utils/userStore';
import { appendUserRegistrationToSheet, appendUserLoginToSheet } from '../services/googleSheetsService';
import { soundManager } from '../utils/audio';
import { 
  User, 
  GraduationCap, 
  ShieldCheck, 
  Check, 
  X, 
  LogIn, 
  BookOpen, 
  ArrowRight,
  Sparkles,
  School,
  Mail,
  Hash,
  Lock,
  Loader2,
  AlertCircle,
  Crown
} from 'lucide-react';

interface AuthModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUserChanged: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUserChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'owner'>(
    currentUser.role === 'admin' ? 'owner' : currentUser.role === 'teacher' ? 'teacher' : 'student'
  );
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Custom Form States
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState('');
  const [studentCode, setStudentCode] = useState(currentUser.studentCode || 'K24-CNTT-089');
  const [classRoom, setClassRoom] = useState(currentUser.classRoom || 'Lớp MOS-TinHoc01');
  const [targetSubject, setTargetSubject] = useState<'word' | 'excel' | 'powerpoint' | 'all'>(currentUser.targetSubject || 'all');
  const [selectedTeacherId, setSelectedTeacherId] = useState(currentUser.assignedTeacherId || DEFAULT_TEACHERS[1].id);

  // Owner Auth States (Empty defaults, no hardcoded secrets or backdoors)
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPasskey, setOwnerPasskey] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOwnerLogin = async () => {
    if (!ownerEmail || !ownerPasskey) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu Quản Trị Viên.');
      soundManager.playWrong();
      return;
    }

    soundManager.playClick();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: ownerEmail.trim(),
          password: ownerPasskey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.message || 'Thông tin xác thực Quản Trị Viên không hợp lệ.');
      }

      if (data.user?.role !== 'admin') {
        throw new Error('Tài khoản này không có quyền Quản Trị Viên (Admin).');
      }

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);

      const owner: UserProfile = {
        ...OWNER_PROFILE,
        id: data.user.id || data.user._id || OWNER_PROFILE.id,
        name: data.user.fullName || data.user.name || OWNER_PROFILE.name,
        email: data.user.email || ownerEmail.trim(),
        role: 'admin',
      };

      saveCurrentUser(owner);
      useAuthStore.getState().login(owner, data.token);
      soundManager.playCorrect();
      onUserChanged(owner);
      onClose();
    } catch (err: any) {
      soundManager.playWrong();
      setErrorMessage(err.message || 'Lỗi đăng nhập Quản Trị Viên.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLoginStudent = async (customName: string, customCode: string, customClass: string, tId: string, sub: 'word' | 'excel' | 'powerpoint' | 'all') => {
    soundManager.playClick();
    setIsLoading(true);
    setErrorMessage('');
    const teacher = DEFAULT_TEACHERS.find(t => t.id === tId) || DEFAULT_TEACHERS[0];

    try {
      const res = await fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customName,
          email: `${customCode.toLowerCase()}@student.edu.vn`,
          role: 'student',
          studentCode: customCode,
          classRoom: customClass,
          assignedTeacherId: teacher.id,
          targetSubject: sub,
        }),
      });

      const data = await res.json();
      if (data.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      }

      const user: UserProfile = {
        id: data.user?.id || 'stu-' + customCode.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: customName,
        email: `${customCode.toLowerCase()}@student.edu.vn`,
        role: 'student',
        studentCode: customCode,
        classRoom: customClass,
        targetSubject: sub,
        assignedTeacherId: teacher.id,
        assignedTeacherName: teacher.name,
        assignedTeacherEmail: teacher.email,
        createdAt: data.user?.createdAt || new Date().toISOString(),
      };
      saveCurrentUser(user);
      useAuthStore.getState().login(user, data.token);
      appendUserLoginToSheet({
        uid: user.id,
        name: user.name,
        email: user.email || '',
        role: 'student',
        provider: 'Đăng nhập nhanh Học viên',
      }).catch((e) => console.warn('Student quick-login Google Sheets sync:', e));
      onUserChanged(user);
      onClose();
    } catch (err: any) {
      console.warn('Backend auth unreachable, falling back to local session:', err);
      const user: UserProfile = {
        id: 'stu-' + customCode.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: customName,
        email: `${customCode.toLowerCase()}@student.edu.vn`,
        role: 'student',
        studentCode: customCode,
        classRoom: customClass,
        targetSubject: sub,
        assignedTeacherId: teacher.id,
        assignedTeacherName: teacher.name,
        assignedTeacherEmail: teacher.email,
        createdAt: new Date().toISOString(),
      };
      saveCurrentUser(user);
      onUserChanged(user);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLoginTeacher = async (teacher: TeacherProfile) => {
    soundManager.playClick();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teacher.name,
          email: teacher.email,
          role: 'teacher',
          assignedTeacherId: teacher.id,
          targetSubject: teacher.subject,
        }),
      });

      const data = await res.json();
      if (data.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      }

      const user: UserProfile = {
        id: data.user?.id || teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: 'teacher',
        targetSubject: teacher.subject,
        assignedTeacherId: teacher.id,
        assignedTeacherName: teacher.name,
        assignedTeacherEmail: teacher.email,
        createdAt: data.user?.createdAt || new Date().toISOString(),
      };
      saveCurrentUser(user);
      useAuthStore.getState().login(user, data.token);
      appendUserLoginToSheet({
        uid: user.id,
        name: user.name,
        email: user.email,
        role: 'teacher',
        provider: 'Cổng Giáo viên bộ môn',
      }).catch((e) => console.warn('Teacher login Google Sheets sync:', e));
      onUserChanged(user);
      onClose();
    } catch (err) {
      const user: UserProfile = {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: 'teacher',
        targetSubject: teacher.subject,
        assignedTeacherId: teacher.id,
        assignedTeacherName: teacher.name,
        assignedTeacherEmail: teacher.email,
        createdAt: new Date().toISOString(),
      };
      saveCurrentUser(user);
      useAuthStore.getState().login(user);
      appendUserLoginToSheet({
        uid: user.id,
        name: user.name,
        email: user.email,
        role: 'teacher',
        provider: 'Cổng Giáo viên (Offline)',
      }).catch((e) => console.warn('Teacher login Google Sheets sync:', e));
      onUserChanged(user);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập email và mật khẩu.');
      return;
    }

    soundManager.playClick();
    setIsLoading(true);
    setErrorMessage('');

    const teacher = DEFAULT_TEACHERS.find(t => t.id === selectedTeacherId) || DEFAULT_TEACHERS[0];
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const payload = {
        email: email.trim(),
        password: password.trim(),
        name: name.trim() || 'Học Viên MOS',
        studentCode: studentCode.trim() || 'HV-2026',
        classRoom: classRoom.trim() || 'Lớp MOS-TinHoc01',
        role: 'student',
        assignedTeacherId: teacher.id,
        targetSubject,
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Xác thực không thành công.');
      }

      if (data.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      }

      const user: UserProfile = {
        id: data.user?.id || 'stu-' + Date.now(),
        name: data.user?.name || name.trim(),
        email: data.user?.email || email.trim(),
        role: 'student',
        studentCode: data.user?.studentCode || studentCode.trim(),
        classRoom: data.user?.classRoom || classRoom.trim(),
        targetSubject,
        assignedTeacherId: teacher.id,
        assignedTeacherName: teacher.name,
        assignedTeacherEmail: teacher.email,
        createdAt: data.user?.createdAt || new Date().toISOString(),
      };

      saveCurrentUser(user);
      useAuthStore.getState().login(user, data.token);

      // Automatically trigger Google Sheets synchronization
      if (authMode === 'register') {
        appendUserRegistrationToSheet({
          uid: user.studentCode || user.id,
          name: user.name,
          email: user.email,
          role: 'student',
          classRoom: user.classRoom,
          teacherName: teacher.name,
          provider: 'Đăng ký tài khoản (Modal Form)',
        }).catch((e) => console.warn('Modal registration Google Sheets sync:', e));
      } else {
        appendUserLoginToSheet({
          uid: user.id,
          name: user.name,
          email: user.email,
          role: 'student',
          provider: 'Đăng nhập hệ thống (Modal Form)',
        }).catch((e) => console.warn('Modal login Google Sheets sync:', e));
      }

      onUserChanged(user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Đăng Nhập & Phân Quyền Hệ Thống MOS</h2>
              <p className="text-xs text-slate-400">Kết nối trực tiếp Học viên và Giáo viên phụ trách môn học</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('student');
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'student'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Học Viên Ôn Luyện</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('teacher');
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'teacher'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Cổng Giáo Viên Bộ Môn</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded">Portal</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('owner');
            }}
            className={`flex items-center gap-1.5 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'owner'
                ? 'border-amber-500 text-amber-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Chủ Sở Hữu</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-900 font-extrabold rounded">Owner Root</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'student' && (
            <div className="space-y-6">
              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Đăng nhập nhanh tài khoản mẫu:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLoginStudent('Nguyễn Hoàng Sơn', 'K24-CNTT-089', 'Lớp MOS-TinHoc01', 't-excel-02', 'all')}
                    className="p-3 text-left rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Nguyễn Hoàng Sơn</div>
                      <div className="text-[11px] text-slate-500">Mã: K24-CNTT-089 · Lớp 01</div>
                      <div className="text-[10px] text-emerald-600 font-medium">GV: Cô Bích Mai (Excel)</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLoginStudent('Trần Thu Trang', 'K24-KT-104', 'Lớp MOS-TinHoc02', 't-word-01', 'word')}
                    className="p-3 text-left rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Trần Thu Trang</div>
                      <div className="text-[11px] text-slate-500">Mã: K24-KT-104 · Lớp 02</div>
                      <div className="text-[10px] text-blue-600 font-medium">GV: Thầy Tuấn Anh (Word)</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>

              {/* Custom Student Form */}
              <div className="relative border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-700">Tài Khoản Cá Nhân (Đồng Bộ PostgreSQL)</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                        authMode === 'login' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Đăng Nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                        authMode === 'register' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Đăng Ký
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Xác Thực <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="student@mosmaster.edu.vn"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mật Khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Họ và Tên Học Viên <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Ví dụ: Nguyễn Văn A"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mã Số Học Viên / SV
                      </label>
                      <div className="relative">
                        <Hash className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={studentCode}
                          onChange={e => setStudentCode(e.target.value)}
                          placeholder="Ví dụ: K24-CNTT-012"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Lớp / Khóa Học
                      </label>
                      <div className="relative">
                        <School className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={classRoom}
                          onChange={e => setClassRoom(e.target.value)}
                          placeholder="Ví dụ: Lớp MOS-TinHoc01"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Môn Thi Trọng Tâm
                      </label>
                      <select
                        value={targetSubject}
                        onChange={e => setTargetSubject(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="all">Tất Cả Môn (Word, Excel, PowerPoint)</option>
                        <option value="word">MOS Word 365/2019 (MO-100)</option>
                        <option value="excel">MOS Excel 365/2019 (MO-200)</option>
                        <option value="powerpoint">MOS PowerPoint 365/2019 (MO-300)</option>
                      </select>
                    </div>
                  </div>

                  {/* Teacher Assignment */}
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80">
                    <label className="block text-xs font-bold text-blue-900 mb-1.5 flex items-center justify-between">
                      <span>Giáo Viên Phụ Trách Môn Học Nhận Báo Cáo:</span>
                      <span className="text-[10px] text-blue-700 font-normal">Tự động nhận bài thi</span>
                    </label>
                    <select
                      value={selectedTeacherId}
                      onChange={e => setSelectedTeacherId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-blue-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-medium"
                    >
                      {DEFAULT_TEACHERS.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} - {t.title} ({t.email})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-blue-800 mt-2">
                      💡 Mọi kết quả bài thi 50 phút, task thực hành và bài trắc nghiệm của bạn sẽ tự động được gửi và đồng bộ về tài khoản của Thầy/Cô này.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang xử lý xác thực...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{authMode === 'login' ? 'Đăng Nhập & Bắt Đầu Học' : 'Tạo Tài Khoản & Bắt Đầu Học'}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'teacher' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                <span className="font-bold">Cổng Dành Cho Giáo Viên & Giảng Viên Bộ Môn:</span>
                <p className="mt-1 text-emerald-800 text-[11px]">
                  Chọn tài khoản giáo viên tương ứng để xem danh sách bài nộp của học viên, chấm điểm, xem các câu hỏi học viên hay sai và gửi nhận xét trực tiếp.
                </p>
              </div>

              <div className="space-y-2.5">
                {DEFAULT_TEACHERS.map(teacher => {
                  const isCurrent = currentUser.role === 'teacher' && currentUser.id === teacher.id;
                  return (
                    <div
                      key={teacher.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-400/40'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${teacher.avatarBg || 'bg-slate-700'} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs`}>
                          {teacher.name.split(' ').slice(-1)[0][0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{teacher.name}</span>
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded uppercase bg-slate-100 text-slate-700">
                              {teacher.subject}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium">{teacher.title}</div>
                          <div className="text-[10px] text-slate-500">{teacher.email} · {teacher.phone}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleQuickLoginTeacher(teacher)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0 ${
                          isCurrent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đang Đăng Nhập</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Vào Cổng GV</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'owner' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-300 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>Khu Vực Dành Riêng Cho Chủ Sở Hữu (Super Admin Root)</span>
                </div>
                <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                  Tài khoản Chủ sở hữu có toàn quyền: <b>Thêm giáo viên mới</b>, <b>Xóa giáo viên</b>, chỉnh sửa phân công bộ môn, quản lý ngân hàng 95+ đề thi và giám sát dữ liệu toàn hệ thống.
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Chủ Sở Hữu (Master Owner Email) <span className="text-amber-600 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={ownerEmail}
                      onChange={e => setOwnerEmail(e.target.value)}
                      placeholder="admin@mosmaster.edu.vn"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-amber-300 bg-amber-50/20 rounded-lg text-slate-900 font-mono font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mật Khẩu Quản Trị Viên (Admin Password) <span className="text-amber-600 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={ownerPasskey}
                      onChange={e => setOwnerPasskey(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-amber-300 bg-amber-50/20 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Chỉ tài khoản có quyền Quản Trị Viên mới có thể đăng nhập vào bảng điều khiển Admin.
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Quyền Hạn Được Cấp Sau Khi Đăng Nhập:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                    <li>Thêm giáo viên mới vào danh sách giảng dạy (Họ tên, email, bộ môn, khoa).</li>
                    <li>Xóa vĩnh viễn giáo viên khỏi hệ thống với 1 click.</li>
                    <li>Xem toàn bộ bài nộp của học viên ở tất cả các môn Word, Excel, PowerPoint.</li>
                    <li>Giám sát gian lận thi cử và truy xuất toàn bộ câu hỏi chuẩn hóa.</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleOwnerLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <Crown className="w-4 h-4 text-slate-950" />
                  <span>Kích Hoạt Quyền Chủ Sở Hữu & Vào Trung Tâm Quản Trị</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
