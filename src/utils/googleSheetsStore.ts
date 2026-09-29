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
      const token = await requestGoogleSheetsToken();
      const { id, url } = await getOrCreateMosSpreadsheet(token);
      set({ 
        isConnected: true, 
        isConnecting: false, 
        spreadsheetId: id, 
        spreadsheetUrl: url 
      });
      return true;
    } catch (err) {
      console.error('Failed to connect Google Sheets:', err);
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
    const { isConnected, autoSyncLogins, historyLogs } = get();
    if (!isConnected || !autoSyncLogins) return false;

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
    const { isConnected, historyLogs } = get();
    if (!isConnected) return false;

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
    const { isConnected, historyLogs } = get();
    if (!isConnected) return false;

    set({ isBackingUp: true });
    const res = await backupUserProgressToSheet(payload);
    set({ isBackingUp: false });

    const newLog: BackupHistoryLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      type: 'progress',
      title: `Cập nhật tiến độ 3 môn: Master ${payload.masterPct}%`,
      status: res.success ? 'success' : 'error',
      details: res.success ? 'Đã ghi 1 hàng vào Tiến Độ Học Tập' : res.error,
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
}));
