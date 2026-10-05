import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { soundManager } from '../../utils/audio';
import { 
  GraduationCap, 
  User, 
  Mail, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ShieldCheck
} from 'lucide-react';
import { appendUserRegistrationToSheet } from '../../services/googleSheetsService';
import { getTeachers, saveCurrentUser, useAuthStore } from '../../utils/userStore';
import { signInWithGoogle, syncFirebaseUserDoc } from '../../lib/firebase';

interface ITeacher {
  _id: string;
  fullName: string;
  teachingSubjects: string[];
}

export default function StudentRegister() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    teacherId: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Lấy danh sách giáo viên khi component mount
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch('/api/teachers');
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : data.teachers || [];
          if (list.length > 0) {
            setTeachers(list.map((t: any) => ({
              _id: t.id || t._id,
              fullName: t.name || t.fullName,
              teachingSubjects: t.teachingSubjects || [t.subject || 'Excel'],
            })));
            return;
          }
        }
      } catch (err) {
        console.warn('Không thể tải giáo viên từ /api/teachers, dùng fallback', err);
      }
      
      const local = getTeachers();
      setTeachers(local.map(t => ({
        _id: t.id,
        fullName: t.name,
        teachingSubjects: [t.subject],
      })));
    };
    fetchTeachers();
  }, []);

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError('');
    soundManager.playClick();
    try {
      const res = await signInWithGoogle();
      if (!res || !res.user) {
        setLoading(false);
        return;
      }
      const fbUser = res.user;
      const selectedTeacher = teachers.find(t => t._id === formData.teacherId) || teachers[0];

      const synced = await syncFirebaseUserDoc(fbUser, {
        displayName: fbUser.displayName || formData.fullName || 'Học Viên Google',
        assignedTeacherId: selectedTeacher?._id || 't-excel-02',
        assignedTeacherName: selectedTeacher?.fullName || 'ThS. Trần Thị Bích Mai',
      });

      const profile = {
        id: synced.uid,
        name: synced.displayName,
        email: synced.email,
        role: synced.role,
        studentCode: synced.studentCode,
        classRoom: synced.classRoom,
        assignedTeacherId: selectedTeacher?._id || 't-excel-02',
        assignedTeacherName: selectedTeacher?.fullName || 'ThS. Trần Thị Bích Mai',
        createdAt: synced.createdAt,
      };

      saveCurrentUser(profile);
      useAuthStore.getState().login(profile, res.accessToken);
      soundManager.playCorrect();
      setSuccessMsg('Đăng ký bằng Google thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/'), 1200);
    } catch (err: any) {
      setError(err.message || 'Lỗi đăng ký bằng tài khoản Google');
      soundManager.playWrong();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    soundManager.playClick();

    if (!formData.teacherId) {
      setError('Vui lòng chọn một giáo viên bộ môn phụ trách!');
      setLoading(false);
      soundManager.playWrong();
      return;
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Định dạng email không hợp lệ (ví dụ: student@mosmaster.edu.vn).');
      setLoading(false);
      soundManager.playWrong();
      return;
    }

    // Password strength validation (min 8 chars, uppercase, lowercase, number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và chữ số.');
      setLoading(false);
      soundManager.playWrong();
      return;
    }

    // Password confirmation match
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp với mật khẩu đã nhập!');
      setLoading(false);
      soundManager.playWrong();
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          teacherId: formData.teacherId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Có lỗi xảy ra khi đăng ký.');
      }

      // Auto-save account creation to Google Sheets silently in background for Teacher/Owner
      const selectedTeacher = teachers.find(t => t._id === formData.teacherId);
      appendUserRegistrationToSheet({
        uid: data.user?.studentCode || data.user?.id || 'HV-NEW',
        name: formData.fullName,
        email: formData.email,
        role: 'student',
        classRoom: 'Lớp MOS Master',
        teacherName: selectedTeacher?.fullName || 'Giáo viên bộ môn',
        provider: 'Tài khoản đăng ký mới',
      }).catch((e) => console.warn('Background Google Sheets registration sync:', e));

      soundManager.playCorrect();
      setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng đến trang đăng nhập...');

      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err: any) {
      soundManager.playWrong();
      setError(err.message || 'Có lỗi xảy ra khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in">
        
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Trang Chủ MOS</span>
          </Link>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-blue-950 text-blue-300 border border-blue-800">
            HỌC VIÊN MỚI
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-600/30">
            <GraduationCap className="w-7 h-7 text-blue-200" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Đăng Ký Học Viên</h2>
          <p className="text-xs text-slate-400">
            Tạo tài khoản luyện thi Certiport và đăng ký với Giáo viên bộ môn phụ trách
          </p>
        </div>
        
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Google Sign-in with Firebase Auth */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-xl border border-slate-700 shadow-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Đăng ký nhanh với Google (Firebase Auth)</span>
          </button>

          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hoặc nhập thông tin</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Họ và Tên</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                name="fullName" 
                required 
                placeholder="Nguyễn Văn A"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
                onChange={handleChange}
                value={formData.fullName}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="hocvien.k24@student.edu.vn"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
                onChange={handleChange}
                value={formData.email}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Mật khẩu (Tối thiểu 8 ký tự, gồm Hoa, Thường & Số)</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="password" 
                name="password" 
                required 
                minLength={8}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
                onChange={handleChange}
                value={formData.password}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Nhập lại mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="password" 
                name="confirmPassword" 
                required 
                minLength={8}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
                onChange={handleChange}
                value={formData.confirmPassword}
              />
            </div>
          </div>

          {/* DROPDOWN CHỌN GIÁO VIÊN BỘ MÔN */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Chọn Giáo Viên Bộ Môn Phụ Trách</span>
              <span className="text-[10px] text-amber-400 font-bold">* Bắt buộc</span>
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <select 
                name="teacherId" 
                required
                className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                onChange={handleChange}
                value={formData.teacherId}
              >
                <option value="" disabled>-- Vui lòng chọn giáo viên --</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    Thầy/Cô {teacher.fullName} (Môn: {teacher.teachingSubjects.join(', ')})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Bài thi thử và điểm số của bạn sẽ được gửi trực tiếp tới giáo viên này để chấm điểm & nhận xét.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-950 cursor-pointer flex items-center justify-center gap-1.5 mt-2"
          >
            {loading ? 'Đang xử lý...' : 'Đăng Ký Tài Khoản'}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
              Đăng nhập tại đây
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
