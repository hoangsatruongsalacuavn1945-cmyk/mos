/**
 * Comprehensive Unified Activity & Audit Logging Service for MOS Master
 * 
 * Records, buffers, and synchronizes granular user actions across the platform
 * to Google Sheets in the 'Nhật Ký Hoạt Động Chi Tiết' and 'Nhật Ký Thực Hành Ribbon' tabs.
 */

import { getStoredGoogleToken, getOrCreateMosSpreadsheet, ensureSheetTabExists } from './googleSheetsService';
import { getCurrentUser } from '../utils/userStore';

export type ActivityCategory = 
  | 'Xác Thực & Tài Khoản' 
  | 'Bài Học Giáo Trình' 
  | 'Thực Hành Giả Lập Ribbon' 
  | 'Khảo Thí & Thi Thử' 
  | 'Chống Gian Lận (Anti-Cheat)'
  | 'Chấm File Tự Động (AI)' 
  | 'Chứng Chỉ Certiport' 
  | 'Quản Trị Hệ Thống';

export type ActivityActionType =
  | 'Đăng nhập hệ thống'
  | 'Đăng ký tài khoản'
  | 'Đăng xuất'
  | 'Bắt đầu bài học'
  | 'Hoàn thành bài học'
  | 'Hủy hoàn thành bài học'
  | 'Thao tác thanh Ribbon'
  | 'Hoàn thành bài lab thực hành'
  | 'Làm lại bài lab'
  | 'Bắt đầu phòng thi 50p'
  | 'Nộp bài thi thử'
  | 'Cảnh báo rời màn hình (Tab switch)'
  | 'Cảnh báo thoát toàn màn hình'
  | 'Nộp file chấm tự động'
  | 'Xem chứng chỉ số'
  | 'Sao lưu Google Sheets';

export interface DetailedActivityLog {
  id: string;
  timestamp: string;
  isoTime: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
  category: ActivityCategory;
  action: ActivityActionType | string;
  subject: 'Word (MO-100)' | 'Excel (MO-200)' | 'PowerPoint (MO-300)' | 'Toàn Hệ Thống' | string;
  details: string;
  status: 'Thành Công' | 'Đạt Chuẩn Certiport' | 'Chưa Đạt' | 'Cảnh Báo' | 'Đang Xử Lý';
  sessionId?: string;
  deviceInfo: string;
  metricsOrScore?: string;
  syncedToGoogleSheet?: boolean;
}

export interface RibbonPracticalLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  taskId: string;
  subject: string;
  domainName: string;
  difficulty: string;
  instruction: string;
  targetRibbonPath: string;
  executedRibbonPath: string;
  status: 'Chính Xác (Passed)' | 'Chưa Đúng (Failed)';
  durationSeconds?: number;
}

const ACTIVITY_STORAGE_KEY = 'mos_detailed_activity_logs_v2';
const PRACTICAL_STORAGE_KEY = 'mos_ribbon_practical_logs_v2';
const MAX_LOCAL_LOGS = 500;

export const ACTIVITY_SHEET_HEADERS = [
  'Mã Nhật Ký (Log ID)',
  'Thời Gian (VN)',
  'Mã Học Viên (UID)',
  'Họ Và Tên',
  'Email',
  'Vai Trò (Role)',
  'Hạng Mục Hoạt Động',
  'Tên Hành Động',
  'Phân Hệ Môn Học',
  'Chi Tiết Thao Tác',
  'Kết Quả Thao Tác',
  'Mã Phiên (Session ID)',
  'Thiết Bị & Môi Trường',
  'Ghi Chú & Điểm Số',
];

export const PRACTICAL_SHEET_HEADERS = [
  'Thời Gian (VN)',
  'Mã Học Viên (UID)',
  'Họ Và Tên',
  'Mã Bài Lab (Task ID)',
  'Môn Học',
  'Chuyên Đề (Domain)',
  'Độ Khó',
  'Nhiệm Vụ (Instruction)',
  'Lệnh Ribbon Mục Tiêu',
  'Lệnh Đã Thao Tác',
  'Trạng Thái',
  'Thời Gian Hoàn Thành (Giây)',
];

function getClientEnvSummary(): string {
  if (typeof window === 'undefined' || !navigator) return 'Client Environment';
  const ua = navigator.userAgent;
  const isMobile = /mobile/i.test(ua);
  const browser = /chrome/i.test(ua) ? 'Chrome' : /firefox/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Browser';
  const os = /windows/i.test(ua) ? 'Win' : /mac/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : /android/i.test(ua) ? 'Android' : 'iOS';
  return `${isMobile ? 'Mobile' : 'PC'} · ${os} · ${browser} (${window.screen?.width || 0}x${window.screen?.height || 0})`;
}

/**
 * Retrieve local buffered activity logs
 */
export function getLocalActivityLogs(): DetailedActivityLog[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save activity log buffer to localStorage
 */
function saveLocalActivityLogs(logs: DetailedActivityLog[]): void {
  try {
    const trimmed = logs.slice(0, MAX_LOCAL_LOGS);
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

/**
 * Retrieve local practical drill logs
 */
export function getLocalPracticalLogs(): RibbonPracticalLog[] {
  try {
    const raw = localStorage.getItem(PRACTICAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPracticalLogs(logs: RibbonPracticalLog[]): void {
  try {
    const trimmed = logs.slice(0, MAX_LOCAL_LOGS);
    localStorage.setItem(PRACTICAL_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

/**
 * Core function: Log any granular activity
 */
export async function logActivityEvent(params: {
  category: ActivityCategory;
  action: ActivityActionType | string;
  subject: string;
  details: string;
  status?: 'Thành Công' | 'Đạt Chuẩn Certiport' | 'Chưa Đạt' | 'Cảnh Báo' | 'Đang Xử Lý';
  metricsOrScore?: string;
  sessionId?: string;
  customUser?: { id: string; name: string; email: string; role: string };
}): Promise<DetailedActivityLog> {
  const user = params.customUser || getCurrentUser() || {
    id: 'guest',
    name: 'Khách',
    fullName: 'Khách',
    email: 'guest@student.edu.vn',
    role: 'guest',
  };

  const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const isoTime = new Date().toISOString();
  const logId = `LOG-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

  const logEntry: DetailedActivityLog = {
    id: logId,
    timestamp,
    isoTime,
    userId: user.id || 'N/A',
    userName: (user as any).fullName || user.name || 'Học viên',
    email: user.email || 'N/A',
    role: user.role === 'admin' ? 'Quản trị viên' : user.role === 'teacher' ? 'Giảng viên' : user.role === 'student' ? 'Học viên' : 'Khách',
    category: params.category,
    action: params.action,
    subject: params.subject,
    details: params.details,
    status: params.status || 'Thành Công',
    sessionId: params.sessionId || (typeof window !== 'undefined' ? sessionStorage.getItem('mos_active_session_id') || undefined : undefined),
    deviceInfo: getClientEnvSummary(),
    metricsOrScore: params.metricsOrScore,
    syncedToGoogleSheet: false,
  };

  // 1. Buffer to local storage
  const existing = getLocalActivityLogs();
  existing.unshift(logEntry);
  saveLocalActivityLogs(existing);

  // 2. Asynchronously stream to Google Sheet if token is present
  const token = getStoredGoogleToken();
  if (token) {
    appendActivityLogToGoogleSheet(logEntry, token)
      .then((ok) => {
        if (ok) {
          logEntry.syncedToGoogleSheet = true;
          const current = getLocalActivityLogs();
          const target = current.find(l => l.id === logEntry.id);
          if (target) {
            target.syncedToGoogleSheet = true;
            saveLocalActivityLogs(current);
          }
        }
      })
      .catch((err) => console.warn('[ActivityAuditService] Background sheet stream deferred:', err?.message || err));
  }

  return logEntry;
}

/**
 * Log specific practical Ribbon drill action
 */
export async function logRibbonPracticalEvent(params: {
  taskId: string;
  subject: string;
  domainName: string;
  difficulty: string;
  instruction: string;
  targetRibbonPath: string;
  executedRibbonPath: string;
  passed: boolean;
  durationSeconds?: number;
}): Promise<RibbonPracticalLog> {
  const user = getCurrentUser() || {
    id: 'guest',
    name: 'Học viên MOS',
    email: 'guest@student.edu.vn',
  };

  const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const log: RibbonPracticalLog = {
    id: `PRAC-${Date.now().toString(36).toUpperCase()}`,
    timestamp,
    userId: user.id || 'N/A',
    userName: (user as any).fullName || user.name || 'Học viên',
    taskId: params.taskId,
    subject: params.subject.toUpperCase(),
    domainName: params.domainName,
    difficulty: params.difficulty,
    instruction: params.instruction,
    targetRibbonPath: params.targetRibbonPath,
    executedRibbonPath: params.executedRibbonPath,
    status: params.passed ? 'Chính Xác (Passed)' : 'Chưa Đúng (Failed)',
    durationSeconds: params.durationSeconds,
  };

  const existing = getLocalPracticalLogs();
  existing.unshift(log);
  saveLocalPracticalLogs(existing);

  // Also record in general activity log
  logActivityEvent({
    category: 'Thực Hành Giả Lập Ribbon',
    action: params.passed ? 'Hoàn thành bài lab thực hành' : 'Thao tác thanh Ribbon',
    subject: params.subject === 'word' ? 'Word (MO-100)' : params.subject === 'excel' ? 'Excel (MO-200)' : 'PowerPoint (MO-300)',
    details: `Lab #${params.taskId}: ${params.executedRibbonPath} (Mục tiêu: ${params.targetRibbonPath})`,
    status: params.passed ? 'Thành Công' : 'Chưa Đạt',
    metricsOrScore: params.durationSeconds ? `${params.durationSeconds}s` : undefined,
  }).catch(() => {});

  // Append to Google Sheet 'Nhật Ký Thực Hành Ribbon' if connected
  const token = getStoredGoogleToken();
  if (token) {
    appendPracticalLogToGoogleSheet(log, token).catch(() => {});
  }

  return log;
}

/**
 * Append single activity log row to Google Sheets
 */
async function appendActivityLogToGoogleSheet(log: DetailedActivityLog, token: string): Promise<boolean> {
  try {
    const { id: spreadsheetId } = await getOrCreateMosSpreadsheet(token);
    await ensureSheetTabExists(token, spreadsheetId, 'Nhật Ký Hoạt Động Chi Tiết', ACTIVITY_SHEET_HEADERS);

    const row = [
      log.id,
      log.timestamp,
      log.userId,
      log.userName,
      log.email,
      log.role,
      log.category,
      log.action,
      log.subject,
      log.details,
      log.status,
      log.sessionId || 'N/A',
      log.deviceInfo,
      log.metricsOrScore || '',
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Nhật Ký Hoạt Động Chi Tiết'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    return res.ok;
  } catch (err) {
    console.warn('[ActivityAuditService] Append activity to sheet deferred:', err);
    return false;
  }
}

/**
 * Append single practical log to Google Sheets
 */
async function appendPracticalLogToGoogleSheet(log: RibbonPracticalLog, token: string): Promise<boolean> {
  try {
    const { id: spreadsheetId } = await getOrCreateMosSpreadsheet(token);
    await ensureSheetTabExists(token, spreadsheetId, 'Nhật Ký Thực Hành Ribbon', PRACTICAL_SHEET_HEADERS);

    const row = [
      log.timestamp,
      log.userId,
      log.userName,
      log.taskId,
      log.subject,
      log.domainName,
      log.difficulty,
      log.instruction,
      log.targetRibbonPath,
      log.executedRibbonPath,
      log.status,
      log.durationSeconds !== undefined ? `${log.durationSeconds}` : '',
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Nhật Ký Thực Hành Ribbon'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    return res.ok;
  } catch (err) {
    console.warn('[ActivityAuditService] Append practical log to sheet deferred:', err);
    return false;
  }
}

/**
 * Flush all buffered activity logs and practical logs to Google Sheets
 */
export async function syncAllBufferedLogsToGoogleSheet(
  tokenOverride?: string
): Promise<{ success: boolean; syncedActivityCount: number; syncedPracticalCount: number; spreadsheetUrl?: string; error?: string }> {
  const token = tokenOverride || getStoredGoogleToken();
  if (!token) {
    return {
      success: false,
      syncedActivityCount: 0,
      syncedPracticalCount: 0,
      error: 'Chưa có quyền kết nối Google Sheets. Vui lòng kết nối tài khoản Google.',
    };
  }

  try {
    const { id: spreadsheetId, url: spreadsheetUrl } = await getOrCreateMosSpreadsheet(token);

    // 1. Ensure sheet tabs exist with rich headers
    await ensureSheetTabExists(token, spreadsheetId, 'Nhật Ký Hoạt Động Chi Tiết', ACTIVITY_SHEET_HEADERS);
    await ensureSheetTabExists(token, spreadsheetId, 'Nhật Ký Thực Hành Ribbon', PRACTICAL_SHEET_HEADERS);

    const activityLogs = getLocalActivityLogs();
    const practicalLogs = getLocalPracticalLogs();

    // 2. Batch append activity logs
    let syncedActivityCount = 0;
    if (activityLogs.length > 0) {
      const activityRows = activityLogs.map(l => [
        l.id,
        l.timestamp,
        l.userId,
        l.userName,
        l.email,
        l.role,
        l.category,
        l.action,
        l.subject,
        l.details,
        l.status,
        l.sessionId || 'N/A',
        l.deviceInfo,
        l.metricsOrScore || '',
      ]);

      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Nhật Ký Hoạt Động Chi Tiết'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: activityRows }),
        }
      );

      if (res.ok) {
        syncedActivityCount = activityRows.length;
        activityLogs.forEach(l => { l.syncedToGoogleSheet = true; });
        saveLocalActivityLogs(activityLogs);
      }
    }

    // 3. Batch append practical logs
    let syncedPracticalCount = 0;
    if (practicalLogs.length > 0) {
      const practicalRows = practicalLogs.map(p => [
        p.timestamp,
        p.userId,
        p.userName,
        p.taskId,
        p.subject,
        p.domainName,
        p.difficulty,
        p.instruction,
        p.targetRibbonPath,
        p.executedRibbonPath,
        p.status,
        p.durationSeconds !== undefined ? `${p.durationSeconds}` : '',
      ]);

      const pRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Nhật Ký Thực Hành Ribbon'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: practicalRows }),
        }
      );

      if (pRes.ok) {
        syncedPracticalCount = practicalRows.length;
      }
    }

    return {
      success: true,
      syncedActivityCount,
      syncedPracticalCount,
      spreadsheetUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      syncedActivityCount: 0,
      syncedPracticalCount: 0,
      error: err?.message || 'Lỗi khi đồng bộ nhật ký lên Google Sheets',
    };
  }
}
