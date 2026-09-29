import React, { useState } from 'react';
import { useGoogleSheetsStore } from '../utils/googleSheetsStore';
import { useAuthStore } from '../utils/userStore';
import { useUserProgressStore } from '../utils/userProgressStore';
import { syncCurrentSessionUserProfile } from '../services/userProfileSheetSyncService';
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
  FileText
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

  if (!isOpen) return null;

  // Strict Security Check: ONLY teachers and admin/owner can access Google Sheets
  const isAuthorized = role === 'admin' || role === 'teacher';
  if (!isAuthorized) {
    return null;
  }

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
    });

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

        {/* 3 Pre-formatted Sheets Architecture */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4 text-blue-600" />
            Cấu Trúc 3 Trang Dữ Liệu Tự Động Trong Bảng Tính:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                1. Nhật Ký Đăng Nhập
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Lưu UID, Tên, Email, Vai trò, Thời gian và Thiết bị mỗi khi học viên đăng nhập.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                2. Tiến Độ Học Tập
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Theo dõi % hoàn thành 3 môn Word (MO-100), Excel (MO-200), PowerPoint (MO-300).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                3. Kết Quả Thi Thử
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Điểm số bài thi, tỷ lệ %, kết quả ĐẠT / CHƯA ĐẠT và thời gian hoàn tất.
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
    </div>
  );
};

export default GoogleSheetsBackupModal;
