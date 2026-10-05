import { create } from 'zustand';
import { 
  requestGoogleSheetsToken, 
  getStoredGoogleToken, 
  getStoredSpreadsheetId, 
  getOrCreateMosSpreadsheet, 
  appendUserLoginToSheet, 
  appendExamResultToSheet, 
  backupUserProgressToSheet,
  clearStoredGoogleToken,
  UserLoginBackupPayload,
  ExamResultBackupPayload,
  UserLearningProgressBackupPayload
} from '../services/googleSheetsService';

export interface BackupHistoryLog {
  id: string;
  timestamp: string;
  type: 'login' | 'exam' | 'progress';
  title: string;
  status: 'success' | 'error';
  details?: string;
}

interface GoogleSheetsState {
  isConnected: boolean;
  isConnecting: boolean;
  isBackingUp: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastBackupTime: string | null;
  autoSyncLogins: boolean;
  historyLogs: BackupHistoryLog[];

  // Actions
  checkConnection: () => Promise<boolean>;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  toggleAutoSync: (enabled: boolean) => void;
  backupUserLogin: (payload: UserLoginBackupPayload) => Promise<boolean>;
  backupExamScore: (payload: ExamResultBackupPayload) => Promise<boolean>;
  backupLearningProgress: (payload: UserLearningProgressBackupPayload) => Promise<boolean>;
}

export const useGoogleSheetsStore = create<GoogleSheetsState>((set, get) => ({
  isConnected: Boolean(getStoredGoogleToken()),
  isConnecting: false,
  isBackingUp: false,
  spreadsheetId: getStoredSpreadsheetId(),
  spreadsheetUrl: getStoredSpreadsheetId() 
    ? `https://docs.google.com/spreadsheets/d/${getStoredSpreadsheetId()}` 
    : null,
  lastBackupTime: localStorage.getItem('mos_last_sheets_backup') || null,
  autoSyncLogins: localStorage.getItem('mos_sheets_autosync') !== 'false',
  historyLogs: JSON.parse(localStorage.getItem('mos_sheets_logs') || '[]'),

  checkConnection: async () => {
    const token = getStoredGoogleToken();
    if (!token) {
      set({ isConnected: false });
      return false;
    }
    try {
      const { id, url } = await getOrCreateMosSpreadsheet(token);
      set({ isConnected: true, spreadsheetId: id, spreadsheetUrl: url });
      return true;
    } catch {
      set({ isConnected: false });
      return false;
    }
  },

  connect: async () => {
    set({ isConnecting: true });
    try {
      const token = await requestGoogleSheetsToken(true);
      if (!token) {
        set({ isConnecting: false });
        return false;
      }
      const { id, url } = await getOrCreateMosSpreadsheet(token);
      set({ 
        isConnected: true, 
        isConnecting: false, 
        spreadsheetId: id, 
        spreadsheetUrl: url 
      });
      return true;
    } catch (err: any) {
      if (err?.message?.includes('đã bị đóng') || err?.code === 'auth/popup-closed-by-user') {
        console.warn('Google Sheets connection popup was closed by user.');
      } else {
        console.warn('Failed to connect Google Sheets:', err?.message || err);
      }
      set({ isConnecting: false });
      return false;
    }
  },

  disconnect: () => {
    clearStoredGoogleToken();
    set({ isConnected: false, spreadsheetId: null, spreadsheetUrl: null });
  },

  toggleAutoSync: (enabled: boolean) => {
    localStorage.setItem('mos_sheets_autosync', String(enabled));
    set({ autoSyncLogins: enabled });
  },

  backupUserLogin: async (payload: UserLoginBackupPayload) => {
    // 1. Always dispatch to 24/7 background auto-sync without human intervention
    try {
      fetch('/api/sheets/auto-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'login',
          data: {
            uid: payload.uid,
            name: payload.name,
            email: payload.email,
            provider: payload.provider,
            timestamp: payload.timestamp,
          },
        }),
      }).catch(() => {});
    } catch {}

    const { isConnected, autoSyncLogins, historyLogs } = get();
    if (!isConnected || !autoSyncLogins) return true;

    set({ isBackingUp: true });
    const res = await appendUserLoginToSheet(payload);
    set({ isBackingUp: false });

    const newLog: BackupHistoryLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      type: 'login',
      title: `Sao lưu đăng nhập: ${payload.name || payload.email}`,
      status: res.success ? 'success' : 'error',
      details: res.success ? 'Đã ghi 1 hàng vào Nhật Ký Đăng Nhập' : res.error,
    };

    const updatedLogs = [newLog, ...historyLogs.slice(0, 19)];
    localStorage.setItem('mos_sheets_logs', JSON.stringify(updatedLogs));
    localStorage.setItem('mos_last_sheets_backup', new Date().toISOString());

    set({ 
      lastBackupTime: new Date().toISOString(),
      historyLogs: updatedLogs,
      spreadsheetUrl: res.spreadsheetUrl || get().spreadsheetUrl
    });

    return res.success;
  },

  backupExamScore: async (payload: ExamResultBackupPayload) => {
    // 1. Always dispatch to 24/7 background auto-sync without human intervention
    try {
      fetch('/api/sheets/auto-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quiz',
          data: {
            uid: payload.uid,
            name: payload.name,
            email: payload.email,
            subject: payload.subject,
            score: payload.score,
            totalScore: payload.totalScore,
            percentage: payload.percentage,
            passed: payload.passed,
            notes: payload.notes,
          },
        }),
      }).catch(() => {});
    } catch {}

    const { isConnected, historyLogs } = get();
    if (!isConnected) return true;

    set({ isBackingUp: true });
    const res = await appendExamResultToSheet(payload);
    set({ isBackingUp: false });

    const newLog: BackupHistoryLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      type: 'exam',
      title: `Kết quả thi ${payload.subject.toUpperCase()}: ${payload.score}/${payload.totalScore} (${payload.percentage}%)`,
      status: res.success ? 'success' : 'error',
      details: res.success ? 'Đã ghi 1 hàng vào Kết Quả Thi Thử & Quiz' : res.error,
    };

    const updatedLogs = [newLog, ...historyLogs.slice(0, 19)];
    localStorage.setItem('mos_sheets_logs', JSON.stringify(updatedLogs));

    set({ 
      lastBackupTime: new Date().toISOString(),
      historyLogs: updatedLogs,
      spreadsheetUrl: res.spreadsheetUrl || get().spreadsheetUrl
    });

    return res.success;
  },

  backupLearningProgress: async (payload: UserLearningProgressBackupPayload) => {
    // 1. Always dispatch to 24/7 background auto-sync without human intervention
    try {
      fetch('/api/sheets/auto-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'progress',
          data: {
            uid: payload.uid,
            name: payload.name,
            email: payload.email,
            subject: 'MOS-Master',
            masterPct: payload.masterPct,
            subjectPct: Math.round((payload.wordPct + payload.excelPct + payload.pptPct) / 3),
            totalCompleted: payload.totalLessonsCompleted,
            streak: payload.streakDays,
          },
        }),
      }).catch(() => {});
    } catch {}

    let token = getStoredGoogleToken();
    if (!token) return true;

    set({ isBackingUp: true });
    let res = await backupUserProgressToSheet(payload, token);

    // If failed due to 401 unauthenticated, clear token
    if (!res.success && res.error && (res.error.includes('401') || res.error.includes('UNAUTHENTICATED') || res.error.includes('hết hạn'))) {
      clearStoredGoogleToken();
      set({ isConnected: false });
    }

    set({ isBackingUp: false });

    const newLog: BackupHistoryLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      type: 'progress',
      title: `Cập nhật tiến độ 3 môn: Master ${payload.masterPct}%`,
      status: res.success ? 'success' : 'error',
      details: res.success ? 'Đã ghi 1 hàng vào Tiến Độ Học Tập' : (res.error || 'Lỗi đồng bộ'),
    };

    const updatedLogs = [newLog, ...get().historyLogs.slice(0, 19)];
    localStorage.setItem('mos_sheets_logs', JSON.stringify(updatedLogs));

    set({ 
      isConnected: Boolean(getStoredGoogleToken()),
      lastBackupTime: new Date().toISOString(),
      historyLogs: updatedLogs,
      spreadsheetUrl: res.spreadsheetUrl || get().spreadsheetUrl
    });

    return res.success;
  },
}));
