import React, { useState } from 'react';
import { UserProfile, TeacherProfile } from '../types/user';
import { DEFAULT_TEACHERS, saveCurrentUser, DEFAULT_STUDENT } from '../utils/userStore';
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
  Hash
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
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  
  // Custom Student Form
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [studentCode, setStudentCode] = useState(currentUser.studentCode || 'K24-CNTT-089');
  const [classRoom, setClassRoom] = useState(currentUser.classRoom || 'Lớp MOS-TinHoc01');
  const [targetSubject, setTargetSubject] = useState<'word' | 'excel' | 'powerpoint' | 'all'>(currentUser.targetSubject || 'all');
  const [selectedTeacherId, setSelectedTeacherId] = useState(currentUser.assignedTeacherId || DEFAULT_TEACHERS[1].id);

  if (!isOpen) return null;

  const handleQuickLoginStudent = (customName: string, customCode: string, customClass: string, tId: string, sub: 'word' | 'excel' | 'powerpoint' | 'all') => {
    soundManager.playClick();
    const teacher = DEFAULT_TEACHERS.find(t => t.id === tId) || DEFAULT_TEACHERS[0];
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
  };

  const handleQuickLoginTeacher = (teacher: TeacherProfile) => {
    soundManager.playClick();
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
    onUserChanged(user);
    onClose();
  };

  const handleSaveCustomStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    soundManager.playClick();
    const teacher = DEFAULT_TEACHERS.find(t => t.id === selectedTeacherId) || DEFAULT_TEACHERS[0];
    const user: UserProfile = {
      id: currentUser.id || 'stu-' + Date.now(),
      name: name.trim(),
      email: email.trim() || `${studentCode.toLowerCase()}@student.edu.vn`,
      role: 'student',
      studentCode: studentCode.trim() || 'HV-2026',
      classRoom: classRoom.trim() || 'Lớp MOS',
      targetSubject,
      assignedTeacherId: teacher.id,
      assignedTeacherName: teacher.name,
      assignedTeacherEmail: teacher.email,
      createdAt: currentUser.createdAt || new Date().toISOString(),
    };
    saveCurrentUser(user);
    onUserChanged(user);
    onClose();
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
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[11px] font-semibold text-slate-400">
                  Hoặc điền thông tin của bạn
                </div>

                <form onSubmit={handleSaveCustomStudent} className="space-y-4">
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
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu Thông Tin & Bắt Đầu Học</span>
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
        </div>
      </div>
    </div>
  );
};
