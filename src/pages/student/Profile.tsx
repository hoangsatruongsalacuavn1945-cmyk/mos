import React, { useState } from 'react';
import { useAuthStore, saveCurrentUser } from '../../utils/userStore';
import { useUserProgressStore } from '../../utils/userProgressStore';
import { soundManager } from '../../utils/audio';
import { 
  User, 
  Mail, 
  GraduationCap, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  BookOpen, 
  Save, 
  Sparkles,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const { getMasterProgressPercentage, getTotalCompletedLessonsCount, getSubjectStats } = useUserProgressStore();

  const [displayName, setDisplayName] = useState(user.name);
  const [studentCode, setStudentCode] = useState(user.studentCode || 'HV-2026');
  const [classRoom, setClassRoom] = useState(user.classRoom || 'Lớp MOS Master Quốc Tế');
  const [isSaved, setIsSaved] = useState(false);

  const masterPct = getMasterProgressPercentage();
  const completedLessons = getTotalCompletedLessonsCount();
  const wordStats = getSubjectStats('word');
  const excelStats = getSubjectStats('excel');
  const pptStats = getSubjectStats('powerpoint');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    const updated = {
      ...user,
      name: displayName.trim() || user.name,
      studentCode: studentCode.trim() || user.studentCode,
      classRoom: classRoom.trim() || user.classRoom,
    };
    saveCurrentUser(updated);
    useAuthStore.setState({ user: updated });
    soundManager.playCorrect();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {user.name}
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
                {user.role === 'admin' ? 'Quản Trị Viên' : user.role === 'teacher' ? 'Giảng Viên' : 'Học Viên Certiport'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              <span>{user.email || 'student@mosmaster.edu.vn'}</span>
              <span>·</span>
              <span>Mã: {user.studentCode || 'HV-2026'}</span>
            </p>
          </div>
        </div>

        {/* MOS Master Metric badge */}
        <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-4 sm:pt-0 sm:pl-6">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Tiến độ chứng chỉ MOS Master</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{masterPct}%</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">{completedLessons} / 15 bài giảng hoàn thành</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Edit Profile Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Thông Tin Hồ Sơ Cá Nhân</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cập nhật thông tin định danh học viên trên chứng nhận khảo thí
            </p>
          </div>

          {isSaved && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã lưu cập nhật hồ sơ thành công!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Họ và Tên Học Viên
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã Số Học Viên / Sinh Viên
                </label>
                <input
                  type="text"
                  value={studentCode}
                  onChange={e => setStudentCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lớp Học / Đơn Vị Đào Tạo
                </label>
                <input
                  type="text"
                  value={classRoom}
                  onChange={e => setClassRoom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Địa Chỉ Email Đăng Nhập
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Email được liên kết bảo mật với tài khoản</span>
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer mt-4"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cập Nhật Hồ Sơ</span>
            </button>
          </form>
        </div>

        {/* Right Column: Assigned Teacher & Certification Progress */}
        <div className="space-y-6">
          {/* Assigned Teacher Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Giáo Viên Bộ Môn Phụ Trách</span>
            </div>
            
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-1">
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                {user.assignedTeacherName || 'ThS. Trần Thị Bích Mai'}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                {user.assignedTeacherEmail || 'bichmai.mosexcel@edu.vn'}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Mọi bài thi thử mô phỏng 50 phút và kết quả trắc nghiệm được tự động báo cáo cho Thầy/Cô phụ trách để đánh giá và gửi nhận xét.
            </p>
          </div>

          {/* Subject Mastery Progress */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Tiến Độ 3 Môn Thi Certiport
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Word MO-100</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{wordStats.completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${wordStats.completionPercentage}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Excel MO-200</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{excelStats.completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${excelStats.completionPercentage}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">PowerPoint MO-300</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold">{pptStats.completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-600 h-full rounded-full" style={{ width: `${pptStats.completionPercentage}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
