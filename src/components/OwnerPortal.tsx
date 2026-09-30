import React, { useState, useEffect } from 'react';
import { TeacherProfile, UserProfile } from '../types/user';
import { 
  getTeachers, 
  addTeacher, 
  deleteTeacher, 
  updateTeacher, 
  fetchSubmissions 
} from '../utils/userStore';
import { useGoogleSheetsStore } from '../utils/googleSheetsStore';
import { getMasterGoogleSheetUrl } from '../services/googleSheetsService';
import { soundManager } from '../utils/audio';
import { 
  Crown, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Users, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Plus, 
  X, 
  Check, 
  Mail, 
  Phone, 
  RefreshCw,
  Server,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Activity,
  Filter,
  UserCheck,
  UserX,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileDown,
  ChevronDown
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

interface AuditLogItem {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

interface OwnerPortalProps {
  currentUser: UserProfile;
  onSwitchToStudentView: () => void;
  onSwitchToTeacherView: () => void;
}

export const OwnerPortal: React.FC<OwnerPortalProps> = ({
  currentUser,
  onSwitchToStudentView,
  onSwitchToTeacherView,
}) => {
  // Access Protection: Strictly lock interface for 'Owner' / 'Admin' role
  const isOwner = currentUser.role === 'admin';

  const [activeTab, setActiveTab] = useState<'users' | 'audit-logs' | 'teachers' | 'questions' | 'system'>('users');
  
  // User Management State
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [targetUserForDelete, setTargetUserForDelete] = useState<ManagedUser | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logActionFilter, setLogActionFilter] = useState('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Teacher Management State
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'all' | 'word' | 'excel' | 'powerpoint'>('all');
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);
  const [deleteConfirmTeacher, setDeleteConfirmTeacher] = useState<TeacherProfile | null>(null);

  // New Teacher Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<'word' | 'excel' | 'powerpoint' | 'all'>('excel');
  const [title, setTitle] = useState('ThS. Giảng Viên Khảo Thí MOS');
  const [department, setDepartment] = useState('Bộ môn Tin học Ứng dụng & Khảo thí');
  const [phone, setPhone] = useState('0988.123.456');
  const [avatarBg, setAvatarBg] = useState('bg-blue-600');

  // Notification State
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Helper to get authenticated headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('mos_auth_token_jwt') || currentUser.token || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Helper to trigger CSV file download with UTF-8 BOM for perfect Excel Vietnamese character support
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Export Users to CSV
  const handleExportUsersCSV = () => {
    soundManager.playClick();
    const listToExport = filteredUsers.length > 0 ? filteredUsers : users;
    if (listToExport.length === 0) {
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
      'Lớp Học / Đơn Vị',
      'Trạng Thái',
      'Chuỗi Ngày Học (Streak)',
      'Thời Gian Tạo',
      'Hoạt Động Gần Nhất',
    ];

    const rows = listToExport.map((u, idx) => [
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
    const filename = `danh-sach-nguoi-dung-mos-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(csvContent, filename);

    // Record audit event
    fetch('/api/admin/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: 'admin',
        action: 'USERS_CSV_EXPORTED',
        targetType: 'user',
        targetName: `Tập hợp ${listToExport.length} tài khoản người dùng`,
        details: { count: listToExport.length, filename },
      }),
    }).catch(() => {});

    soundManager.playCorrect();
    notify(`Đã xuất CSV danh sách ${listToExport.length} người dùng thành công!`);
  };

  // Export Audit Logs to CSV
  const handleExportAuditLogsCSV = () => {
    soundManager.playClick();
    const logsToExport = filteredLogs.length > 0 ? filteredLogs : auditLogs;
    if (logsToExport.length === 0) {
      notify('Không có dữ liệu nhật ký kiểm toán để xuất.', 'error');
      return;
    }

    const headers = [
      'STT',
      'Mã Bản Ghi (Log ID)',
      'Thời Gian Tạo',
      'Người Thực Hiện (Actor Name)',
      'Vai Trò Người Thực Hiện',
      'Mã Người Thực Hiện (Actor ID)',
      'Hành Động Quản Trị (Action)',
      'Loại Đối Tượng (Target Type)',
      'Tên Đối Tượng Bị Tác Động',
      'Mã Đối Tượng (Target ID)',
      'Chi Tiết Sự Kiện (JSON Details)',
      'Địa Chỉ IP',
    ];

    const rows = logsToExport.map((l, idx) => [
      escapeCSV(idx + 1),
      escapeCSV(l.id),
      escapeCSV(new Date(l.createdAt).toLocaleString('vi-VN')),
      escapeCSV(l.actorName),
      escapeCSV(l.actorRole),
      escapeCSV(l.actorId),
      escapeCSV(l.action),
      escapeCSV(l.targetType),
      escapeCSV(l.targetName || 'N/A'),
      escapeCSV(l.targetId || 'N/A'),
      escapeCSV(l.details ? JSON.stringify(l.details) : '{}'),
      escapeCSV(l.ipAddress || '127.0.0.1'),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const filename = `nhat-ky-kiem-toan-mos-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(csvContent, filename);

    // Record audit event
    fetch('/api/admin/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: 'admin',
        action: 'AUDIT_LOGS_CSV_EXPORTED',
        targetType: 'system',
        targetName: `Tập hợp ${logsToExport.length} bản ghi kiểm toán`,
        details: { count: logsToExport.length, filename },
      }),
    }).catch(() => {});

    soundManager.playCorrect();
    notify(`Đã xuất CSV ${logsToExport.length} bản ghi nhật ký kiểm toán thành công!`);
  };

  // Export Both Files
  const handleExportBothCSV = () => {
    handleExportUsersCSV();
    setTimeout(() => {
      handleExportAuditLogsCSV();
    }, 400);
  };

  // Fetch Users from Backend
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.warn('Error loading users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch Audit Logs from Backend
  const loadAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Error loading audit logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Fetch Teachers
  const loadTeachers = () => {
    setTeachers(getTeachers());
  };

  useEffect(() => {
    if (isOwner) {
      loadUsers();
      loadAuditLogs();
      loadTeachers();
    }
  }, [isOwner]);

  // Promote / Demote Action Handler
  const handleRoleChange = async (targetUser: ManagedUser, newRole: 'student' | 'teacher') => {
    soundManager.playClick();
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          newRole,
          actorId: currentUser.id,
          actorName: currentUser.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật vai trò thất bại.');
      }

      soundManager.playCorrect();
      notify(`Đã cập nhật vai trò của "${targetUser.full_name}" thành: ${newRole === 'teacher' ? 'Giáo Viên' : 'Học Viên'}`);
      
      // Reload both users and audit trail
      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  // Delete User Account Handler
  const handleDeleteUser = async () => {
    if (!targetUserForDelete) return;
    soundManager.playClick();
    const uName = targetUserForDelete.full_name;

    try {
      const res = await fetch(`/api/admin/users/${targetUserForDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          actorId: currentUser.id,
          actorName: currentUser.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Xóa tài khoản thất bại.');
      }

      soundManager.playCorrect();
      notify(`Đã xóa vĩnh viễn tài khoản của "${uName}" khỏi hệ thống.`);
      setTargetUserForDelete(null);
      
      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  // Add Teacher Handler
  const handleSaveNewTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    soundManager.playClick();
    const newT = addTeacher({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject,
      title: title.trim(),
      department: department.trim(),
      phone: phone.trim(),
      avatarBg,
    });

    // Also trigger backend audit log
    fetch('/api/admin/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: 'admin',
        action: 'TEACHER_CREATED',
        targetType: 'teacher',
        targetId: newT.id,
        targetName: newT.name,
        details: { subject: newT.subject, email: newT.email, department: newT.department },
      }),
    }).catch(() => {});

    setTeachers(getTeachers());
    setIsAddTeacherModalOpen(false);
    notify(`Đã bổ nhiệm thành công Giáo viên: ${newT.name}`);
    loadAuditLogs();
  };

  // Delete Teacher Handler
  const handleConfirmDeleteTeacher = () => {
    if (!deleteConfirmTeacher) return;
    soundManager.playClick();
    const tName = deleteConfirmTeacher.name;
    const tId = deleteConfirmTeacher.id;
    deleteTeacher(tId);

    // Trigger backend audit log
    fetch('/api/admin/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: 'admin',
        action: 'TEACHER_DELETED',
        targetType: 'teacher',
        targetId: tId,
        targetName: tName,
        details: { deletedAt: new Date().toISOString() },
      }),
    }).catch(() => {});

    setTeachers(getTeachers());
    setDeleteConfirmTeacher(null);
    notify(`Đã xóa vĩnh viễn Giáo viên ${tName} khỏi hệ thống.`);
    loadAuditLogs();
  };

  // ACCESS-PROTECTION LOCK SCREEN: If user is not Owner / Admin
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-2xl p-8 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-900/30">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-950 text-red-400 border border-red-800">
              TRUY CẬP BỊ TỪ CHỐI (403 ACCESS DENIED)
            </span>
            <h2 className="text-xl font-black text-white">Yêu Cầu Quyền Chủ Sở Hữu (Owner)</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Khu vực này được bảo vệ nghiêm ngặt. Chỉ tài khoản Quản trị viên cấp cao (Admin) mới có quyền truy cập bảng phân quyền và nhật ký kiểm toán.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
            Tài khoản hiện tại của bạn: <b className="text-white">{currentUser.name}</b> ({currentUser.role})
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onSwitchToStudentView}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Về Trang Học Viên
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesSearch = u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          (u.student_code && u.student_code.toLowerCase().includes(userSearchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter(l => {
    const matchesAction = logActionFilter === 'all' || l.action === logActionFilter;
    const matchesSearch = l.actorName?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          l.action?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          (l.targetName && l.targetName.toLowerCase().includes(logSearchQuery.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Master Owner Banner */}
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-indigo-950/90 border border-amber-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
                <Crown className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    QUYỀN CHỦ SỞ HỮU (ROOT SUPER ADMIN)
                  </span>
                  <span className="text-slate-400 text-xs">·</span>
                  <span className="text-xs text-amber-200/80 font-mono">{currentUser.email}</span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight mt-1">
                  Trung Tâm Quản Trị Người Dùng & Nhật Ký Kiểm Toán (Audit Trail)
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Giao diện phân quyền cấp cao: Thăng cấp/Hạ cấp tài khoản người dùng trực tiếp trong PostgreSQL, xóa vĩnh viễn tài khoản và ghi nhận nhật ký mọi tác vụ quản trị.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <a
                href={useGoogleSheetsStore.getState().spreadsheetUrl || getMasterGoogleSheetUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer border border-emerald-400/40"
                title="Mở Bảng Tính Google Sheets Dữ Liệu Học Viên & Khảo Thí Tập Trung (Chỉ Chủ Sở Hữu & Giáo Viên)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                <span>Google Sheets Quản Trị</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
              </a>

              <button
                onClick={onSwitchToTeacherView}
                className="px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-emerald-500/30"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Xem Góc Giáo Viên</span>
              </button>
              <button
                onClick={onSwitchToStudentView}
                className="px-3.5 py-2 bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-blue-500/30"
              >
                <BookOpen className="w-4 h-4" />
                <span>Xem Góc Học Viên</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Tổng Tài Khoản</div>
              <div className="text-2xl font-black text-amber-400 mt-0.5">{users.length} Người Dùng</div>
            </div>
            <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Nhật Ký Kiểm Toán</div>
              <div className="text-2xl font-black text-indigo-400 mt-0.5">{auditLogs.length} Sự Kiện</div>
            </div>
            <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Giảng Viên Quản Trị</div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">{teachers.length} Thầy/Cô</div>
            </div>
            <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Cơ Sở Dữ Liệu</div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>PostgreSQL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Message Banner */}
        {actionMessage && (
          <div className={`p-4 rounded-xl flex items-center justify-between text-xs animate-in fade-in ${
            actionMessage.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300' 
              : 'bg-red-500/10 border border-red-500/40 text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
              <span className="font-semibold">{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Tabs Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'users' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Quản Lý Người Dùng ({users.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('audit-logs');
                loadAuditLogs();
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'audit-logs' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Nhật Ký Kiểm Toán ({auditLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'teachers' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Bộ Môn & Giáo Viên ({teachers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'system' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Trạng Thái Hệ Thống</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadUsers();
                loadAuditLogs();
                notify('Đã làm mới dữ liệu từ máy chủ.');
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
              title="Làm mới dữ liệu từ PostgreSQL"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TAB 1: USER MANAGEMENT TABLE WITH PROMOTE / DEMOTE / DELETE */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search, Role Filter and Export CSV Bar */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  placeholder="Tìm theo họ tên, email hoặc mã số sinh viên..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(['all', 'student', 'teacher', 'admin'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setUserRoleFilter(r)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all capitalize ${
                        userRoleFilter === r 
                          ? 'bg-amber-500 text-slate-950 font-bold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {r === 'all' ? 'Tất cả' : r === 'admin' ? 'Chủ Sở Hữu' : r === 'teacher' ? 'Giáo Viên' : 'Học Viên'}
                    </button>
                  ))}
                </div>

                {/* Export CSV Dropdown Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500/50"
                    title="Tải xuống tệp CSV lưu trữ hồ sơ bên ngoài"
                  >
                    <Download className="w-4 h-4 text-emerald-100" />
                    <span>Xuất CSV</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-emerald-200 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isExportMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-20" 
                        onClick={() => setIsExportMenuOpen(false)} 
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                        <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                          Tùy Chọn Tải Xuống CSV
                        </div>

                        <button
                          onClick={() => {
                            setIsExportMenuOpen(false);
                            handleExportUsersCSV();
                          }}
                          className="w-full text-left p-2 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer group"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-white">Xuất Danh Sách Người Dùng</div>
                            <div className="text-[10px] text-slate-400 font-normal">Tải bảng {filteredUsers.length} tài khoản (.CSV)</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setIsExportMenuOpen(false);
                            handleExportAuditLogsCSV();
                          }}
                          className="w-full text-left p-2 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer group"
                        >
                          <History className="w-4 h-4 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-white">Xuất Nhật Ký Kiểm Toán</div>
                            <div className="text-[10px] text-slate-400 font-normal">Tải {auditLogs.length} sự kiện kiểm toán (.CSV)</div>
                          </div>
                        </button>

                        <div className="border-t border-slate-800 pt-1">
                          <button
                            onClick={() => {
                              setIsExportMenuOpen(false);
                              handleExportBothCSV();
                            }}
                            className="w-full text-left p-2 hover:bg-emerald-950/60 rounded-lg text-xs font-bold text-emerald-300 hover:text-emerald-200 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Tải Cả 2 Tệp CSV Cùng Lúc</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* User Management Table */}
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
                    {isLoadingUsers ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                          <span>Đang tải danh sách người dùng từ PostgreSQL...</span>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Không tìm thấy người dùng phù hợp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => {
                        const isTargetOwner = user.role === 'admin';
                        return (
                          <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* User details */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                  user.role === 'admin' ? 'bg-amber-500 text-slate-950' :
                                  user.role === 'teacher' ? 'bg-emerald-600 text-white' :
                                  'bg-blue-600 text-white'
                                }`}>
                                  {user.role === 'admin' ? <Crown className="w-4 h-4" /> : user.full_name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                    <span>{user.full_name}</span>
                                    {user.role === 'admin' && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Code / Classroom */}
                            <td className="py-3.5 px-4 text-slate-300">
                              <div className="font-mono text-[11px] text-amber-300/80">
                                {user.student_code || 'N/A'}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {user.classroom || 'Chưa phân lớp'}
                              </div>
                            </td>

                            {/* Role Badge */}
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-flex items-center gap-1 ${
                                user.role === 'admin' 
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                                  : user.role === 'teacher'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              }`}>
                                {user.role === 'admin' ? <Crown className="w-3 h-3" /> : user.role === 'teacher' ? <ShieldCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                                <span>{user.role === 'admin' ? 'Chủ Sở Hữu' : user.role === 'teacher' ? 'Giáo Viên' : 'Học Viên'}</span>
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                                Hoạt Động
                              </span>
                            </td>

                            {/* Created Date */}
                            <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'Mặc định'}
                            </td>

                            {/* Action Controls */}
                            <td className="py-3.5 px-4 text-right">
                              {isTargetOwner ? (
                                <span className="text-[11px] text-amber-400 font-semibold italic">Tài khoản Gốc (Bảo vệ)</span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Promote to Teacher Button */}
                                  {user.role === 'student' && (
                                    <button
                                      onClick={() => handleRoleChange(user, 'teacher')}
                                      className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 hover:border-emerald-600 text-emerald-300 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Thăng cấp tài khoản này lên Giảng Viên"
                                    >
                                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Nâng Lên GV</span>
                                    </button>
                                  )}

                                  {/* Demote to Student Button */}
                                  {user.role === 'teacher' && (
                                    <button
                                      onClick={() => handleRoleChange(user, 'student')}
                                      className="px-2.5 py-1 bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 hover:border-blue-600 text-blue-300 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Hạ cấp tài khoản này xuống Học Viên"
                                    >
                                      <ArrowDownRight className="w-3.5 h-3.5 text-blue-400" />
                                      <span>Hạ Xuống Học Viên</span>
                                    </button>
                                  )}

                                  {/* Delete Account Button */}
                                  <button
                                    onClick={() => setTargetUserForDelete(user)}
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
          </div>
        )}

        {/* TAB 2: AUDIT LOGS DISPLAY */}
        {activeTab === 'audit-logs' && (
          <div className="space-y-4">
            {/* Filter and Search Bar for Logs */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={e => setLogSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo người thực hiện, hành động, hoặc đối tượng..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 font-semibold">Loại hành động:</span>
                <select
                  value={logActionFilter}
                  onChange={e => setLogActionFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
                >
                  <option value="all">Tất cả hành động</option>
                  <option value="USER_PROMOTED_TO_TEACHER">Thăng cấp lên Giảng Viên</option>
                  <option value="USER_DEMOTED_TO_STUDENT">Hạ cấp xuống Học Viên</option>
                  <option value="USER_ACCOUNT_DELETED">Xóa tài khoản người dùng</option>
                  <option value="TEACHER_CREATED">Bổ nhiệm giáo viên mới</option>
                  <option value="TEACHER_DELETED">Xóa giáo viên</option>
                  <option value="FEEDBACK_SUBMITTED">Chấm điểm & Nhận xét</option>
                </select>

                <button
                  onClick={handleExportAuditLogsCSV}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-950/40 flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-500/50"
                  title="Xuất danh sách sự kiện kiểm toán ra tệp CSV"
                >
                  <Download className="w-4 h-4 text-indigo-100" />
                  <span>Xuất CSV Nhật Ký</span>
                </button>
              </div>
            </div>

            {/* Audit Logs List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800/80">
              {isLoadingLogs ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                  <span>Đang tải nhật ký kiểm toán từ PostgreSQL...</span>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  Chưa có sự kiện kiểm toán nào phù hợp với bộ lọc.
                </div>
              ) : (
                filteredLogs.map(log => {
                  const isRoleChange = log.action.includes('ROLE') || log.action.includes('PROMOTED') || log.action.includes('DEMOTED');
                  const isDelete = log.action.includes('DELETED');
                  const isTeacherAction = log.action.includes('TEACHER');

                  return (
                    <div key={log.id} className="p-4 hover:bg-slate-850/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isDelete ? 'bg-red-950 text-red-400 border border-red-800/60' :
                          isRoleChange ? 'bg-amber-950 text-amber-400 border border-amber-800/60' :
                          isTeacherAction ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' :
                          'bg-indigo-950 text-indigo-400 border border-indigo-800/60'
                        }`}>
                          {isDelete ? <UserX className="w-4 h-4" /> : isRoleChange ? <UserCheck className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs">{log.actorName}</span>
                            <span className={`px-2 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                              log.actorRole === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {log.actorRole}
                            </span>
                            <span className="text-slate-500 text-xs">đã thực hiện</span>
                            <span className="font-mono text-xs font-semibold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              {log.action}
                            </span>
                          </div>

                          <div className="text-xs text-slate-300 flex items-center gap-1.5">
                            <span className="text-slate-400">Đối tượng:</span>
                            <span className="font-bold text-white">{log.targetName || log.targetType}</span>
                            <span className="text-slate-500">({log.targetType})</span>
                          </div>

                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="text-[11px] text-slate-400 font-mono bg-slate-950/80 p-2 rounded-lg border border-slate-800 max-w-xl">
                              {JSON.stringify(log.details)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right sm:shrink-0 text-slate-400 text-xs">
                        <div className="flex items-center gap-1 sm:justify-end text-slate-300 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(log.createdAt).toLocaleTimeString('vi-VN')}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TEACHER MANAGEMENT (CRUD) */}
        {activeTab === 'teachers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Danh Sách Giáo Viên Bộ Môn MOS Master</h2>
                <p className="text-xs text-slate-400">Thêm, sửa đổi hoặc xóa phân công giáo viên nhận bài thi của học viên</p>
              </div>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setName('');
                  setEmail('');
                  setIsAddTeacherModalOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Bổ Nhiệm Giáo Viên Mới</span>
              </button>
            </div>

            {/* Teachers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teachers.map(teacher => (
                <div
                  key={teacher.id}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${teacher.avatarBg || 'bg-blue-600'} text-white font-bold text-lg flex items-center justify-center shadow-md shrink-0`}>
                        {teacher.name.split(' ').slice(-1)[0][0]}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {teacher.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                            MOS {teacher.subject.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-800">
                      <div className="font-semibold text-amber-200/90">{teacher.title}</div>
                      <div className="text-slate-400 text-[11px]">{teacher.department}</div>
                      <div className="text-slate-400 text-[11px] truncate">{teacher.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => setDeleteConfirmTeacher(teacher)}
                      className="w-full py-1.5 px-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Xóa Giáo Viên Này</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM STATUS */}
        {activeTab === 'system' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-base font-bold text-white">Kiến Trúc & Trạng Thái Bảo Mật Hệ Thống</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  <span>PostgreSQL Database Engine</span>
                </div>
                <div className="text-slate-300">
                  Bảng quan hệ: <code className="text-emerald-400">users</code>, <code className="text-emerald-400">questions</code>, <code className="text-emerald-400">attempts</code>, <code className="text-emerald-400">exam_results</code>, <code className="text-emerald-400">audit_logs</code>
                </div>
                <div className="text-slate-400">Hỗ trợ kết nối Connection Pool có tham số hóa chống SQL Injection.</div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dịch Vụ AuditLogService Phía Server</span>
                </div>
                <div className="text-slate-300">
                  File: <code className="text-emerald-400">server/services/auditLogService.ts</code>
                </div>
                <div className="text-slate-400">
                  Tự động ghi nhận mọi sự kiện thăng cấp, hạ cấp, xóa tài khoản và tạo đề thi từ vai trò Owner & Teacher.
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: XÁC NHẬN XÓA TÀI KHOẢN NGƯỜI DÙNG */}
      {targetUserForDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-red-950 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">Xác Nhận Xóa Vĩnh Viễn Tài Khoản?</h3>
              <p className="text-xs text-slate-300">
                Bạn có chắc chắn muốn xóa tài khoản của <span className="font-bold text-amber-300">{targetUserForDelete.full_name}</span> ({targetUserForDelete.email})?
              </p>
              <p className="text-[11px] text-red-400 bg-red-950/50 p-2 rounded-lg border border-red-900/60">
                ⚠️ Hành động này sẽ xóa dữ liệu người dùng khỏi bảng <code className="font-mono">users</code> trong PostgreSQL và tạo một bản ghi kiểm toán không thể xóa bỏ.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setTargetUserForDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa Vĩnh Viễn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: THÊM GIÁO VIÊN MỚI */}
      {isAddTeacherModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Bổ Nhiệm Giáo Viên Mới</h3>
              </div>
              <button onClick={() => setIsAddTeacherModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTeacher} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Họ và Tên Giảng Viên <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ví dụ: ThS. Lê Thị Phương Thảo"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="phuongthao@mosmaster.edu.vn"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0912.xxx.xxx"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Bộ Môn Phụ Trách</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-500"
                >
                  <option value="excel">MOS Excel (MO-200)</option>
                  <option value="word">MOS Word (MO-100)</option>
                  <option value="powerpoint">MOS PowerPoint (MO-300)</option>
                  <option value="all">Tất Cả Các Môn</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Bổ Nhiệm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XÁC NHẬN XÓA GIÁO VIÊN */}
      {deleteConfirmTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-red-950 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">Xác Nhận Xóa Giáo Viên Này?</h3>
              <p className="text-xs text-slate-300">
                Bạn có chắc chắn muốn xóa giáo viên <span className="font-bold text-amber-300">{deleteConfirmTeacher.name}</span> ({deleteConfirmTeacher.email})?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmTeacher(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmDeleteTeacher}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default OwnerPortal;
