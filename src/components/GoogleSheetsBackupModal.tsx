import React, { useState, useEffect } from 'react';
import { useGoogleSheetsStore } from '../utils/googleSheetsStore';
import { useAuthStore, AUTH_TOKEN_KEY } from '../utils/userStore';
import { useUserProgressStore } from '../utils/userProgressStore';
import { syncCurrentSessionUserProfile } from '../services/userProfileSheetSyncService';
import { unifiedLoggingService } from '../services/unifiedLoggingService';
import { SHEET_NAMES } from '../services/googleSheetsService';
import { soundManager } from '../utils/audio';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Clock, 
  ShieldCheck, 
  Database, 
  Users, 
  BookOpen, 
  Sparkles, 
  Check, 
  X,
  FileText,
  Zap,
  Code2,
  Copy,
  Send
} from 'lucide-react';

interface GoogleSheetsBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsBackupModal: React.FC<GoogleSheetsBackupModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { 
    isConnected, 
    isConnecting, 
    isBackingUp, 
    spreadsheetUrl, 
    lastBackupTime, 
    autoSyncLogins, 
    historyLogs,
    connect, 
    disconnect, 
    toggleAutoSync,
    backupUserLogin,
    backupLearningProgress
  } = useGoogleSheetsStore();

  const { user, fullName, role } = useAuthStore();
  const { getSubjectStats, getMasterProgressPercentage, getTotalCompletedLessonsCount } = useUserProgressStore();

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isServerBackingUp, setIsServerBackingUp] = useState(false);
  const [isMasterSyncing, setIsMasterSyncing] = useState(false);

  const [autoSyncStats, setAutoSyncStats] = useState<{
    totalSynced: number;
    lastSyncedAt: string | null;
    webhookUrl: string | null;
    isAutoSyncEnabled: boolean;
    pendingCount?: number;
  }>({
    totalSynced: 0,
    lastSyncedAt: null,
    webhookUrl: null,
    isAutoSyncEnabled: true,
    pendingCount: 0,
  });
  const [webhookInput, setWebhookInput] = useState('');
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [isTestPinging, setIsTestPinging] = useState(false);
  const [scriptTemplate, setScriptTemplate] = useState<string>('');
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const fetchAutoSyncStatus = async () => {
    try {
      const res = await fetch('/api/sheets/status');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setAutoSyncStats(data.stats);
          if (data.stats.webhookUrl && !webhookInput) {
            setWebhookInput(data.stats.webhookUrl);
          }
        }
        if (data.scriptTemplate) {
          setScriptTemplate(data.scriptTemplate);
        }
      }
    } catch (e) {
      console.warn('Error fetching auto sync status:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAutoSyncStatus();
    }
  }, [isOpen]);

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    setIsSavingWebhook(true);
    try {
      const res = await fetch('/api/sheets/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: webhookInput.trim() }),
      });
      if (res.ok) {
        soundManager.playCorrect();
        setActionMessage('Đã lưu URL Webhook Google Apps Script tự động đồng bộ!');
        fetchAutoSyncStatus();
      }
    } catch (err: any) {
      soundManager.playWrong();
      setActionMessage(`Lỗi lưu: ${err.message}`);
    } finally {
      setIsSavingWebhook(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleTestPing = async () => {
    soundManager.playClick();
    setIsTestPinging(true);
    try {
      const res = await fetch('/api/sheets/test-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: user.name || 'Quản trị viên' }),
      });
      if (res.ok) {
        soundManager.playCorrect();
        setActionMessage('Đã bắn thử 1 dòng dữ liệu vào luồng tự động đồng bộ Google Sheets!');
        fetchAutoSyncStatus();
      }
    } catch (err: any) {
      soundManager.playWrong();
      setActionMessage(`Lỗi gửi: ${err.message}`);
    } finally {
      setIsTestPinging(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  if (!isOpen) return null;

  // Strict Security Check: ONLY teachers and admin/owner can access Google Sheets
  const isAuthorized = role === 'admin' || role === 'teacher';
  if (!isAuthorized) {
    return null;
  }

  const handleMasterFullSync = async () => {
    soundManager.playClick();
    setIsMasterSyncing(true);
    setActionMessage('Đang kết nối mọi thông tin và đồng bộ 8 bảng dữ liệu liên kết lên Google Sheets...');

    try {
      const res = await unifiedLoggingService.syncAllToGoogleSheets();
      if (res.success) {
        soundManager.playCorrect();
        setActionMessage(res.details);
      } else {
        soundManager.playWrong();
        setActionMessage(`Lỗi: ${res.details}`);
      }
    } catch (err: any) {
      soundManager.playWrong();
      setActionMessage(`Lỗi đồng bộ: ${err.message}`);
    } finally {
      setIsMasterSyncing(false);
      setTimeout(() => setActionMessage(null), 6000);
    }
  };

  const handleServerBackup = async () => {
    soundManager.playClick();
    setIsServerBackingUp(true);
    setActionMessage('Đang gửi yêu cầu sao lưu xuống máy chủ Node.js...');

    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY) || (user as any)?.token;
      const res = await fetch('/api/admin/backup-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          dataType: 'all',
          note: `Sao lưu bởi ${role === 'admin' ? 'Chủ Sở Hữu' : 'Giáo Viên'} (${user.email || 'Admin'})`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Lỗi sao lưu trên máy chủ.');
      }

      soundManager.playCorrect();
      setActionMessage(data.message || 'Máy chủ đã hoàn tất sao lưu dữ liệu an toàn lên Google Sheets trung tâm!');
    } catch (err: any) {
      soundManager.playWrong();
      setActionMessage(`Lỗi sao lưu máy chủ: ${err.message}`);
    } finally {
      setIsServerBackingUp(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleConnect = async () => {
    soundManager.playClick();
    const ok = await connect();
    if (ok) {
      soundManager.playCorrect();
      setActionMessage('Đã kết nối thành công với Google Sheets!');
    } else {
      soundManager.playWrong();
      setActionMessage('Không thể kết nối. Vui lòng cấp quyền truy cập Google Drive & Sheets.');
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleManualBackupLogin = async () => {
    soundManager.playClick();
    const ok = await backupUserLogin({
      uid: user.id || 'current-user',
      name: fullName || user.name || user.fullName || 'Học viên',
      email: user.email || 'hocvien@mosmaster.edu.vn',
      role: role || 'student',
      provider: 'Đồng bộ thủ công từ giao diện',
    });

    if (ok) {
      soundManager.playCorrect();
      setActionMessage('Đã ghi nhận thông tin học viên vào trang "Nhật Ký Đăng Nhập" trên Google Sheets!');
    } else {
      soundManager.playWrong();
      setActionMessage('Ghi dữ liệu thất bại. Hãy bấm "Kết Nối Lại Google Sheets".');
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleManualBackupProgress = async () => {
    soundManager.playClick();
    const wordStats = getSubjectStats('word');
    const excelStats = getSubjectStats('excel');
    const pptStats = getSubjectStats('powerpoint');

    const ok = await backupLearningProgress({
      uid: user.id || 'current-user',
      name: fullName || user.name || user.fullName || 'Học viên',
      email: user.email || 'hocvien@mosmaster.edu.vn',
      masterPct: getMasterProgressPercentage(),
      wordPct: wordStats.completionPercentage,
      excelPct: excelStats.completionPercentage,
      pptPct: pptStats.completionPercentage,
      totalLessonsCompleted: getTotalCompletedLessonsCount(),
    });

    if (ok) {
      soundManager.playCorrect();
      setActionMessage('Đã sao lưu toàn bộ tiến độ 3 môn Word, Excel, PPT vào Google Sheets!');
    } else {
      soundManager.playWrong();
      setActionMessage('Sao lưu tiến độ thất bại. Hãy kiểm tra kết nối.');
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSyncFullProfile = async () => {
    soundManager.playClick();
    const result = await syncCurrentSessionUserProfile({
      uid: user.id || 'current-user',
      displayName: fullName || user.name || user.fullName || 'Học viên MOS',
      email: user.email || 'hocvien@mosmaster.edu.vn',
      role: role || 'student',
      schoolOrOrg: 'Trung Tâm Khảo Thí Tin Học MOS Master',
    }, { promptIfMissing: true });

    if (result.success) {
      soundManager.playCorrect();
      const actionText = result.profileAction === 'inserted' 
        ? 'Tạo mới hồ sơ học viên' 
        : 'Cập nhật thông tin hồ sơ hiện có';
      setActionMessage(`Thành công! ${actionText} & Đã ghi nhận phiên xác thực.`);
    } else {
      soundManager.playWrong();
      setActionMessage(`Lỗi đồng bộ: ${result.error}`);
    }
    setTimeout(() => setActionMessage(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Google Workspace
                </span>
                <span className="text-xs text-slate-400">OAuth 2.0 Client</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                Sao Lưu Học Viên Vào Google Sheets
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action feedback banner */}
        {actionMessage && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* 24/7 Zero-Touch Automated Sync Section */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white border border-indigo-500/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white tracking-tight">
                    Tự Động Đồng Bộ Google Sheets 24/7 (Không Cần Can Thiệp)
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Đang Chạy Tự Động
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Mọi đăng ký, đăng nhập, nộp bài thi, tiến độ học tập và đánh giá đều được tự động lưu lên Google Sheets theo thời gian thực mà không cần người dùng thao tác.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTestPing}
                disabled={isTestPinging}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/60 hover:bg-indigo-600 border border-indigo-400/40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Bắn thử nghiệm 1 dòng dữ liệu lên Sheet"
              >
                <Send className={`w-3.5 h-3.5 ${isTestPinging ? 'animate-pulse' : ''}`} />
                <span>{isTestPinging ? 'Đang gửi...' : 'Gửi Thử Nghiệm'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowScriptModal(true)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Xem mã nguồn Google Apps Script"
              >
                <Code2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Mã Apps Script</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-indigo-300 font-medium block">Tổng Bản Ghi Đã Đồng Bộ</span>
              <span className="text-lg font-black text-amber-300">{autoSyncStats.totalSynced} hàng</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-indigo-300 font-medium block">Lần Đồng Bộ Gần Nhất</span>
              <span className="text-xs font-bold text-white truncate block mt-1">
                {autoSyncStats.lastSyncedAt ? new Date(autoSyncStats.lastSyncedAt).toLocaleTimeString('vi-VN') : 'Sẵn sàng'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-indigo-300 font-medium block">Hàng Đợi Chờ Xử Lý</span>
              <span className="text-lg font-black text-emerald-300">{autoSyncStats.pendingCount ?? 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-indigo-300 font-medium block">Kênh Đồng Bộ</span>
              <span className="text-xs font-bold text-white truncate block mt-1">
                {autoSyncStats.webhookUrl ? 'Apps Script Webhook' : 'Bảng Tính Master Hub'}
              </span>
            </div>
          </div>

          {/* Webhook Configuration Input */}
          <form onSubmit={handleSaveWebhook} className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <input
                type="url"
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
                placeholder="Dán Webhook Apps Script (tùy chọn: https://script.google.com/macros/s/.../exec)"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white placeholder:text-indigo-300/50 focus:outline-hidden focus:ring-2 focus:ring-amber-400 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isSavingWebhook}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isSavingWebhook ? 'Đang lưu...' : 'Lưu Webhook Riêng'}
            </button>
          </form>
        </div>

        {/* Connection Status Box */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái kết nối</span>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã kết nối Google Drive & Sheets
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    <Clock className="w-3.5 h-3.5" /> Chưa kích hoạt quyền
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                {isConnected 
                  ? 'Bảng tính "MOS Master - Hệ Thống Sao Lưu Học Viên & Khảo Thí" đang đồng bộ tự động.' 
                  : 'Bấm nút bên dưới để cấp quyền Google Drive và tạo bảng tính sao lưu.'}
              </p>
            </div>

            {/* Connect / Reconnect Button */}
            {isConnected ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                <span>Cấp Lại Token</span>
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isConnecting ? 'Đang kết nối...' : 'Kết Nối Google Sheets Ngay'}</span>
              </button>
            )}
          </div>

          {/* Direct Link to Google Spreadsheet */}
          {spreadsheetUrl && (
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs text-slate-600 truncate">
                Tệp: <strong className="text-slate-800">MOS Master - Hệ Thống Sao Lưu Học Viên & Khảo Thí</strong>
              </span>
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở Trực Tiếp Trên Google Sheets</span>
              </a>
            </div>
          )}
        </div>

        {/* Dual-Write Transparency Status Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-indigo-500/30 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Dual-Write Architecture
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PostgreSQL Database + Google Sheets
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">
                Hệ Thống Ghi Đồng Thời & Nhật Ký Hoạt Động Siêu Chi Tiết
              </h4>
              <p className="text-xs text-indigo-100/80">
                Mọi bài thi thử, cập nhật tiến độ, thao tác Ribbon 1000 tasks và phiên học tập được lưu đồng thời vào CSDL PostgreSQL và 8 bảng tính liên kết trên Google Sheets.
              </p>
            </div>

            <button
              onClick={handleMasterFullSync}
              disabled={isMasterSyncing || !isConnected}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isMasterSyncing ? 'animate-spin' : ''}`} />
              <span>{isMasterSyncing ? 'Đang Liên Kết & Đồng Bộ...' : 'Đồng Bộ Toàn Bộ 8 Bảng Liên Kết'}</span>
            </button>
          </div>
        </div>

        {/* 8 Interconnected Sheets Architecture */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              Cấu Trúc 8 Bảng Dữ Liệu Được Kết Nối Toàn Diện Qua UID & Email:
            </h4>
            <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Quan hệ 1-N & Tổng hợp Master
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
              <span className="font-bold text-indigo-950 block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                1. Bảng Tổng Hợp Master
              </span>
              <p className="text-[10px] text-indigo-900/80 mt-0.5">
                Hub trung tâm: UID, Họ tên, Tổng %, Word/Excel/PPT %, Điểm cao nhất, Trạng thái.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="font-bold text-emerald-950 block flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                2. Nhật Ký Chi Tiết
              </span>
              <p className="text-[10px] text-emerald-900/80 mt-0.5">
                Ghi chép siêu chi tiết: Thao tác Ribbon, Thời lượng, Thiết bị, Điểm số, Mã Log ID.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200">
              <span className="font-bold text-orange-950 block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                3. Kết Quả Thi & Quiz
              </span>
              <p className="text-[10px] text-orange-900/80 mt-0.5">
                Lịch sử phòng thi 50p, số câu đúng/sai, thang điểm 1000, Certiport Passed.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
              <span className="font-bold text-blue-950 block flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                4. Tiến Độ Học Tập
              </span>
              <p className="text-[10px] text-blue-900/80 mt-0.5">
                Theo dõi 15 bài học, tỷ lệ % từng môn, chuỗi ngày streak học tập.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
              <span className="font-bold text-purple-950 block flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                5. Thực Hành 1000 Tasks
              </span>
              <p className="text-[10px] text-purple-900/80 mt-0.5">
                Lưu từng lệnh Ribbon thực thi theo chuẩn đề GMetrix / Certiport.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200">
              <span className="font-bold text-teal-950 block flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                6. Phiên Đăng Nhập
              </span>
              <p className="text-[10px] text-teal-900/80 mt-0.5">
                Mã Session ID, thời lượng học, thiết bị PC/Mobile, Browser, Resolution.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
              <span className="font-bold text-slate-900 block flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-600" />
                7. Danh Sách Hồ Sơ
              </span>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Hồ sơ học viên, email, số điện thoại, MSSV, trường học liên kết.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
              <span className="font-bold text-slate-900 block flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                8. Tài Khoản Đăng Ký
              </span>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Danh sách tài khoản kích hoạt, lớp học và giáo viên phụ trách.
              </p>
            </div>
          </div>
        </div>

        {/* Auto Sync Settings & Manual Triggers */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-xs sm:text-sm text-slate-800 block">
                Tự Động Sao Lưu Mỗi Khi Đăng Nhập
              </span>
              <span className="text-[11px] text-slate-500">
                Ghi 1 dòng vào Google Sheets ngay khi người dùng đăng nhập qua Google hoặc Email.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSyncLogins}
                onChange={(e) => toggleAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleSyncFullProfile}
              disabled={isBackingUp || !isConnected}
              className="sm:col-span-2 p-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-100" />
              <span>Đồng Bộ Hồ Sơ Học Viên & Phiên Đăng Nhập Đầy Đủ (Google Sheets API)</span>
            </button>

            <button
              onClick={handleManualBackupLogin}
              disabled={isBackingUp || !isConnected}
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 text-xs font-bold text-slate-800 hover:text-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Ghi Nhật Ký Đăng Nhập Nhanh</span>
            </button>

            <button
              onClick={handleManualBackupProgress}
              disabled={isBackingUp || !isConnected}
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-xs font-bold text-slate-800 hover:text-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Sao Lưu Toàn Bộ Tiến Độ 3 Môn</span>
            </button>
          </div>
        </div>

        {/* Sync History Logs */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Nhật Ký Đồng Bộ Gần Đây
            </span>
            <span className="text-[11px] text-slate-400">
              {lastBackupTime ? `Lần cuối: ${new Date(lastBackupTime).toLocaleTimeString('vi-VN')}` : 'Chưa có nhật ký'}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 max-h-36 overflow-y-auto space-y-1.5 text-xs">
            {historyLogs.length === 0 ? (
              <div className="text-center text-slate-400 py-3 text-xs italic">
                Chưa có thao tác sao lưu nào. Hãy bấm nút sao lưu ở trên để thử nghiệm!
              </div>
            ) : (
              historyLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white border border-slate-100">
                  <div className="flex items-center gap-2">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                    <span className="font-medium text-slate-800">{log.title}</span>
                  </div>
                  <span className="text-slate-400 shrink-0 font-mono">{log.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>

      {/* Google Apps Script 1-Click Code Viewer Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Mã Nguồn Google Apps Script (Tự Động Đồng Bộ 100%)
                </h3>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                <strong>Hướng dẫn 3 bước đơn giản:</strong>
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                <li>Mở Bảng tính Google Sheets của bạn &rarr; chọn menu <strong>Tiện ích mở rộng (Extensions) &rarr; Apps Script</strong>.</li>
                <li>Dán toàn bộ đoạn mã bên dưới vào rồi bấm <strong>Triển khai (Deploy) &rarr; Triển khai mới (New deployment)</strong>.</li>
                <li>Chọn loại: <strong>Ứng dụng web (Web app)</strong>, quyền: <strong>Bất kỳ ai (Anyone)</strong>, rồi sao chép URL dán vào ô Webhook.</li>
              </ol>
            </div>

            <div className="relative flex-1 min-h-0 bg-slate-950 rounded-xl p-4 overflow-y-auto">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(scriptTemplate);
                  setCopiedScript(true);
                  soundManager.playCorrect();
                  setTimeout(() => setCopiedScript(false), 2500);
                }}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-white/20"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Đã Sao Chép!' : 'Sao Chép Mã'}</span>
              </button>
              <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap pr-24">
                {scriptTemplate}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowScriptModal(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsBackupModal;
