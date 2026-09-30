import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../utils/userStore';
import { soundManager } from '../../utils/audio';
import { 
  Users, 
  Search, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  ShieldCheck, 
  Crown, 
  GraduationCap, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Filter, 
  X,
  FileSpreadsheet,
  Clock,
  UserCheck,
  Plus,
  BookOpen
} from 'lucide-react';

interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  student_code?: string | null;
  classroom?: string | null;
  status: 'active' | 'suspended' | 'inactive';
  streak_days?: number;
  created_at?: string;
  last_active_at?: string;
}

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  
  // Modals & Action States
  const [targetUserForDelete, setTargetUserForDelete] = useState<ManagedUser | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Create Teacher Modal States
  const generateInitialSecurePass = () => 'Mos@' + Math.random().toString(36).substring(2, 7).toUpperCase() + Math.floor(10 + Math.random() * 90);
  const [isCreateTeacherOpen, setIsCreateTeacherOpen] = useState(false);
  const [teacherFullName, setTeacherFullName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState(generateInitialSecurePass());
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Excel']);
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState(false);

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('mos_auth_token_jwt') || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherFullName.trim() || !teacherEmail.trim() || !teacherPassword.trim()) {
      notify('Vui lòng điền đầy đủ họ tên, email và mật khẩu.', 'error');
      return;
    }
    setIsSubmittingTeacher(true);
    soundManager.playClick();
    try {
      const res = await fetch('/api/admin/create-teacher', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fullName: teacherFullName.trim(),
          email: teacherEmail.trim(),
          password: teacherPassword.trim(),
          teachingSubjects: selectedSubjects,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể tạo giáo viên.');
      }
      soundManager.playCorrect();
      notify(`Đã tạo thành công tài khoản Giáo viên: ${teacherFullName}!`);
      setIsCreateTeacherOpen(false);
      setTeacherFullName('');
      setTeacherEmail('');
      setTeacherPassword(generateInitialSecurePass());
      setSelectedSubjects(['Excel']);
      loadUsers();
    } catch (err: any) {
      soundManager.playWrong();
      notify(err.message || 'Lỗi khi tạo tài khoản giáo viên.', 'error');
    } finally {
      setIsSubmittingTeacher(false);
    }
  };

  // 1. Fetch all registered users from backend
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        notify('Không thể tải danh sách người dùng từ máy chủ.', 'error');
      }
    } catch (err) {
      console.warn('Lỗi kết nối /api/admin/users:', err);
      notify('Lỗi kết nối máy chủ.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 2. Promote / Demote Role Action
  const handleRoleChange = async (targetUser: ManagedUser, newRole: 'student' | 'teacher') => {
    soundManager.playClick();
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          newRole,
          actorId: currentUser.id || 'owner-root',
          actorName: currentUser.name || 'Chủ Sở Hữu',
        }),
      });

      if (res.ok) {
        soundManager.playCorrect();
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
        notify(`Đã chuyển đổi quyền của "${targetUser.full_name}" sang: ${newRole === 'teacher' ? 'Giáo Viên' : 'Học Viên'}.`);
      } else {
        const data = await res.json();
        soundManager.playWrong();
        notify(data.error || 'Cập nhật vai trò thất bại.', 'error');
      }
    } catch (err) {
      soundManager.playWrong();
      notify('Lỗi hệ thống khi cập nhật vai trò.', 'error');
    }
  };

  // 3. Delete Account Action
  const handleDeleteUser = async () => {
    if (!targetUserForDelete) return;
    soundManager.playClick();

    try {
      const res = await fetch(`/api/admin/users/${targetUserForDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          actorId: currentUser.id || 'owner-root',
          actorName: currentUser.name || 'Chủ Sở Hữu',
        }),
      });

      if (res.ok) {
        soundManager.playCorrect();
        setUsers(prev => prev.filter(u => u.id !== targetUserForDelete.id));
        notify(`Đã xóa vĩnh viễn tài khoản "${targetUserForDelete.full_name}" khỏi hệ thống.`);
        setTargetUserForDelete(null);
      } else {
        const data = await res.json();
        soundManager.playWrong();
        notify(data.error || 'Xóa tài khoản thất bại.', 'error');
      }
    } catch (err) {
      soundManager.playWrong();
      notify('Lỗi hệ thống khi xóa tài khoản.', 'error');
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      user.full_name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.student_code && user.student_code.toLowerCase().includes(q)) ||
      (user.classroom && user.classroom.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  // Export to CSV
  const handleExportCSV = () => {
    soundManager.playClick();
    if (filteredUsers.length === 0) {
      notify('Không có dữ liệu người dùng để xuất.', 'error');
      return;
    }

    const headers = [
      'STT',
      'Mã Định Danh (ID)',
      'Họ và Tên',
      'Email',
      'Vai Trò',
      'Mã Số Sinh Viên / GV',
      'Lớp Học / Bộ Môn',
      'Trạng Thái',
      'Chuỗi Ngày Học (Streak)',
      'Thời Gian Tạo',
      'Hoạt Động Gần Nhất',
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredUsers.map((u, idx) => [
      escapeCSV(idx + 1),
      escapeCSV(u.id),
      escapeCSV(u.full_name),
      escapeCSV(u.email),
      escapeCSV(u.role === 'admin' ? 'Chủ Sở Hữu (Admin)' : u.role === 'teacher' ? 'Giáo Viên' : 'Học Viên'),
      escapeCSV(u.student_code || 'N/A'),
      escapeCSV(u.classroom || 'Chưa phân lớp'),
      escapeCSV(u.status === 'active' ? 'Đang hoạt động' : 'Tạm khóa'),
      escapeCSV(u.streak_days || 0),
      escapeCSV(u.created_at ? new Date(u.created_at).toLocaleString('vi-VN') : 'Mặc định'),
      escapeCSV(u.last_active_at ? new Date(u.last_active_at).toLocaleString('vi-VN') : 'Chưa ghi nhận'),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danh-sach-nguoi-dung-mos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    soundManager.playCorrect();
    notify(`Đã xuất ${filteredUsers.length} tài khoản người dùng ra tệp CSV!`);
  };

  const studentCount = users.filter(u => u.role === 'student').length;
  const teacherCount = users.filter(u => u.role === 'teacher').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              TRUNG TÂM QUẢN TRỊ NGƯỜI DÙNG
            </span>
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-xs text-slate-400">PostgreSQL Identity Store</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Quản Lý & Phân Quyền Toàn Bộ Tài Khoản Hệ Thống
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Thực hiện nâng cấp/hạ cấp vai trò (Học viên ⇄ Giáo viên), kiểm soát truy cập và xóa vĩnh viễn tài khoản với tính năng ghi nhận kiểm toán an toàn.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setIsCreateTeacherOpen(true);
              soundManager.playClick();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer border border-blue-500/50"
            title="Admin tạo tài khoản cho Giáo viên mới"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Tạo Giáo Viên Mới</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-500/50"
            title="Xuất bảng người dùng ra file Excel/CSV"
          >
            <Download className="w-4 h-4 text-emerald-100" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={() => {
              loadUsers();
              notify('Đã làm mới danh sách người dùng.');
            }}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700 cursor-pointer"
            title="Làm mới dữ liệu từ PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Tổng Tài Khoản</div>
          <div className="text-2xl font-black text-white mt-1">{users.length} Người Dùng</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Học Viên (Students)</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{studentCount} Thí Sinh</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Giảng Viên (Teachers)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{teacherCount} Thầy/Cô</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Chủ Sở Hữu (Admins)</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{adminCount} Quản Trị</div>
        </div>
      </div>

      {/* Notification Banner */}
      {actionMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs animate-in fade-in ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300' 
            : 'bg-red-500/10 border border-red-500/40 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className="font-semibold">{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Role Filter Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, email hoặc mã số sinh viên..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-semibold">Lọc vai trò:</span>
          {(['all', 'student', 'teacher', 'admin'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all capitalize cursor-pointer ${
                roleFilter === r
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {r === 'all' ? 'Tất cả' : r === 'admin' ? 'Chủ Sở Hữu' : r === 'teacher' ? 'Giáo Viên' : 'Học Viên'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Người Dùng</th>
                <th className="py-3.5 px-4">Mã Số / Lớp Học</th>
                <th className="py-3.5 px-4">Vai Trò Hiện Tại</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Thời Gian Tạo</th>
                <th className="py-3.5 px-4 text-right">Hành Động Quản Trị (Admin)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Đang tải danh sách người dùng từ PostgreSQL...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy người dùng nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isCurrentLoggedUser = u.email === currentUser.email;
                  const isRootAdmin = u.role === 'admin';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : u.role === 'teacher'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}>
                            {u.full_name ? u.full_name.charAt(0) : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white flex items-center gap-1.5 truncate">
                              <span>{u.full_name}</span>
                              {isCurrentLoggedUser && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-amber-300 font-normal">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Student Code / Class */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        {u.student_code ? (
                          <div>
                            <div className="font-bold text-slate-200">{u.student_code}</div>
                            <div className="text-[10px] text-slate-500">{u.classroom || 'Chưa xếp lớp'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Không áp dụng</span>
                        )}
                      </td>

                      {/* Current Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : u.role === 'teacher'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}>
                          {u.role === 'admin' && <Crown className="w-3 h-3 text-amber-400" />}
                          {u.role === 'teacher' && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                          {u.role === 'student' && <GraduationCap className="w-3 h-3 text-blue-400" />}
                          <span>{u.role === 'admin' ? 'Chủ Sở Hữu' : u.role === 'teacher' ? 'Giáo Viên' : 'Học Viên'}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Đang hoạt động</span>
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : 'Mặc định'}
                      </td>

                      {/* Admin Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isRootAdmin ? (
                          <span className="text-[11px] text-amber-400/80 italic font-medium">
                            Tài khoản tối cao (Protected)
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {/* Role Toggle Button */}
                            {u.role === 'student' ? (
                              <button
                                onClick={() => handleRoleChange(u, 'teacher')}
                                className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 hover:text-white border border-emerald-800/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Thăng cấp tài khoản này lên Giáo Viên"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Thăng Làm Giáo Viên</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRoleChange(u, 'student')}
                                className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900 text-blue-300 hover:text-white border border-blue-800/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Hạ cấp tài khoản này xuống Học Viên"
                              >
                                <ArrowDownRight className="w-3.5 h-3.5 text-blue-400" />
                                <span>Hạ Xuống Học Viên</span>
                              </button>
                            )}

                            {/* Delete Account Button */}
                            <button
                              onClick={() => setTargetUserForDelete(u)}
                              className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-400 hover:text-red-300 border border-red-800/60 rounded-lg transition-colors cursor-pointer"
                              title="Xóa tài khoản này khỏi PostgreSQL"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Teacher Modal (Dành riêng cho Admin) */}
      {isCreateTeacherOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Tạo Tài Khoản Giáo Viên Mới</h3>
                  <p className="text-xs text-slate-400">Cấp tài khoản giảng viên khảo thí để xuất hiện trên trang Đăng Ký</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateTeacherOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Họ và Tên Giảng Viên <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={teacherFullName}
                  onChange={e => setTeacherFullName(e.target.value)}
                  placeholder="Ví dụ: ThS. Đặng Hải Yến"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Email Đăng Nhập <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={teacherEmail}
                  onChange={e => setTeacherEmail(e.target.value)}
                  placeholder="haiyen.mosexcel@edu.vn"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-hidden text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Mật Khẩu Ban Đầu <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={teacherPassword}
                  onChange={e => setTeacherPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-hidden text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Bộ Môn Phụ Trách Giảng Dạy:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Word', 'Excel', 'PowerPoint'].map(subj => {
                    const isSelected = selectedSubjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => {
                          setSelectedSubjects(prev =>
                            isSelected ? prev.filter(s => s !== subj) : [...prev, subj]
                          );
                        }}
                        className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        MOS {subj}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateTeacherOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeacher}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingTeacher ? (
                    <span>Đang khởi tạo...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Tạo Tài Khoản Giáo Viên</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {targetUserForDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-red-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác Nhận Xóa Tài Khoản?</h3>
                <p className="text-xs text-slate-400">Hành động này sẽ xóa vĩnh viễn và không thể khôi phục.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div><span className="text-slate-400">Họ và Tên:</span> <b className="text-white">{targetUserForDelete.full_name}</b></div>
              <div><span className="text-slate-400">Email:</span> <span className="text-amber-300 font-mono">{targetUserForDelete.email}</span></div>
              <div><span className="text-slate-400">Vai Trò:</span> <span className="uppercase font-bold text-slate-300">{targetUserForDelete.role}</span></div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setTargetUserForDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-red-950 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
