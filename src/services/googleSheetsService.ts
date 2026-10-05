// Google Sheets & Drive API Integration for MOS Master Exam Training Platform
import { signInWithGoogle } from '../lib/firebase';

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '799123061018-eujgscp42l55367b64fvs00bqbso4ij9.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
const SPREADSHEET_TITLE = 'MOS Master - Hệ Thống Dữ Liệu Học Viên & Khảo Thí Tập Trung';

export const SHEET_NAMES = {
  MASTER_SUMMARY: 'Bảng Tổng Hợp Master',
  DETAILED_ACTIVITY: 'Nhật Ký Hoạt Động Chi Tiết',
  EXAM_RESULTS: 'Kết Quả Thi Thử & Quiz',
  PROGRESS: 'Tiến Độ Học Tập',
  SESSIONS: 'Lịch Sử Phiên Đăng Nhập',
  PRACTICAL: 'Thực Hành 1000 Tác Vụ',
  PROFILES: 'Danh Sách Hồ Sơ',
  REGISTRATIONS: 'Tài Khoản Đăng Ký',
  FEEDBACK: 'Phản Hồi & Đánh Giá Web',
} as const;

export const MASTER_SUMMARY_HEADERS = [
  'Mã Học Viên (UID)',
  'Họ Và Tên',
  'Địa Chỉ Email',
  'Vai Trò',
  'Lớp / Đơn Vị',
  'Tiến Độ Tổng (% MOS Master)',
  'Word MO-100 (%)',
  'Excel MO-200 (%)',
  'PowerPoint MO-300 (%)',
  'Số Bài Học Hoàn Thành',
  'Số Lần Thi Thử / Quiz',
  'Điểm Thi Cao Nhất',
  'Điểm Thi Gần Nhất',
  'Trạng Thái Chuẩn Certiport',
  'Số Phiên Học Tập',
  'Hoạt Động Cuối Cùng',
  'Thời Gian Cập Nhật',
];

export const DETAILED_ACTIVITY_HEADERS = [
  'Mã Nhật Ký (Log ID)',
  'Thời Gian (VN)',
  'Mã Học Viên (UID)',
  'Họ Và Tên',
  'Email',
  'Vai Trò',
  'Phân Loại Hoạt Động',
  'Hành Động Cụ Thể',
  'Phân Hệ Môn Học',
  'Chi Tiết Thao Tác',
  'Kết Quả / Trạng Thái',
  'Điểm Số / Thống Kê Đi Kèm',
  'Thời Lượng Thực Hiện',
  'Thiết Bị & Môi Trường',
  'Mã Phiên (Session ID)',
];

export const EXAM_QUIZ_HEADERS = [
  'Thời Gian',
  'Mã Lần Thi (Attempt ID)',
  'Mã Học Viên (UID)',
  'Họ Và Tên',
  'Email',
  'Môn Thi',
  'Loại Khảo Thí',
  'Điểm Đạt Được',
  'Điểm Tối Đa',
  'Tỷ Lệ %',
  'Số Câu Đúng',
  'Tổng Số Câu',
  'Thời Lượng (Giây)',
  'Kết Quả',
  'Ghi Chú & Phân Tích',
];

export const PROGRESS_HEADERS = [
  'Thời Gian Cập Nhật',
  'Mã Học Viên (UID)',
  'Họ Và Tên',
  'Email',
  'Môn Học',
  'Bài Học Vừa Hoàn Thành',
  'Tiến Độ Môn (%)',
  'Tiến Độ Tổng Master (%)',
  'Tổng Bài Hoàn Thành',
  'Chuỗi Ngày Học (Streak)',
  'Trạng Thái',
];

export const SESSION_HEADERS = [
  'Thời Gian Đăng Nhập',
  'Mã Phiên (Session ID)',
  'Mã Học Viên (UID)',
  'Họ Tên Học Viên',
  'Email Đăng Nhập',
  'Hình Thức Xác Thực (Provider)',
  'Thiết Bị (Device)',
  'Hệ Điều Hành (OS)',
  'Trình Duyệt (Browser)',
  'Độ Phân Giải Màn Hình',
  'Trạng Thái Phiên',
  'User Agent Chi Tiết',
];

export const PRACTICAL_HEADERS = [
  'Thời Gian',
  'Mã Tác Vụ (Task ID)',
  'Mã Học Viên (UID)',
  'Họ Và Tên',
  'Email',
  'Môn Học',
  'Nhóm Kỹ Năng / Domain',
  'Lệnh Ribbon Đã Thực Hiện',
  'Yêu Cầu Bài Tập',
  'Kết Quả',
];

export const PROFILE_HEADERS = [
  'Mã Học Viên (UID)',
  'Họ Và Tên',
  'Địa Chỉ Email',
  'Vai Trò',
  'Mã Số Sinh Viên / Học Viên',
  'Trường / Đơn Vị',
  'Số Điện Thoại',
  'Ảnh Đại Diện (URL)',
  'Đã Xác Minh Email',
  'Ngày Tạo Tài Khoản',
  'Lần Đăng Nhập Cuối',
  'Đồng Bộ Lúc',
];

export const REGISTRATION_HEADERS = [
  'Thời Gian Tạo',
  'Mã Học Viên (UID/Code)',
  'Họ Và Tên',
  'Email Đăng Ký',
  'Vai Trò',
  'Lớp Học / Đơn Vị',
  'Giáo Viên Phụ Trách',
  'Hình Thức Đăng Ký',
  'Trạng Thái',
];

export const FEEDBACK_HEADERS = [
  'Thời Gian (VN)',
  'Mã Phản Hồi (ID)',
  'Họ Và Tên',
  'Email',
  'Phân Loại',
  'Đánh Giá (Sao 1-5)',
  'Tiêu Đề',
  'Chi Tiết Mô Tả Lỗi / Khuất Máy',
  'Thiết Bị & Trình Duyệt',
  'Độ Phân Giải Màn Hình',
  'Trang Gặp Lỗi (URL)',
  'Mức Độ Ưu Tiên',
  'Trạng Thái Xử Lý',
  'Ghi Chú Của Chủ Sở Hữu (Admin Notes)',
];

declare global {
  interface Window {
    google?: any;
  }
}

// In-memory token storage (recommended by Workspace integration guidelines)
let inMemoryGoogleAccessToken: string | null = null;
let inMemoryExpiresAt: number | null = null;
const TOKEN_KEY = 'mos_google_sheets_token';
const TOKEN_EXPIRY_KEY = 'mos_google_sheets_token_expires_at';
const SPREADSHEET_ID_KEY = 'mos_google_spreadsheet_id';

/**
 * Retrieves the currently active Google OAuth access token.
 * Validates expiration and format ('ya29.'), clearing stale tokens.
 */
export function getStoredGoogleToken(): string | null {
  // Check in-memory token first
  if (inMemoryGoogleAccessToken && inMemoryExpiresAt && Date.now() < inMemoryExpiresAt) {
    return inMemoryGoogleAccessToken;
  }

  const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  const expiryRaw = sessionStorage.getItem(TOKEN_EXPIRY_KEY) || localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || typeof token !== 'string') return null;

  // Check token expiration (default 3600 seconds)
  if (expiryRaw) {
    const expiresAt = parseInt(expiryRaw, 10);
    if (!isNaN(expiresAt) && Date.now() >= expiresAt) {
      clearStoredGoogleToken();
      return null;
    }
  }

  // Real Google OAuth 2.0 Access Tokens start with 'ya29.'
  if (!token.startsWith('ya29.')) {
    clearStoredGoogleToken();
    return null;
  }

  inMemoryGoogleAccessToken = token;
  return token;
}

export function saveStoredGoogleToken(token: string, expiresInSeconds: number = 3600): void {
  if (typeof token === 'string' && token.startsWith('ya29.')) {
    const expiresAt = Date.now() + (expiresInSeconds - 60) * 1000; // 60s buffer
    inMemoryGoogleAccessToken = token;
    inMemoryExpiresAt = expiresAt;
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
      // Remove token from persistent localStorage to mitigate XSS exposure
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  }
}

export function clearStoredGoogleToken(): void {
  inMemoryGoogleAccessToken = null;
  inMemoryExpiresAt = null;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch {}
}

export function getStoredSpreadsheetId(): string | null {
  return localStorage.getItem(SPREADSHEET_ID_KEY);
}

export function saveStoredSpreadsheetId(id: string): void {
  localStorage.setItem(SPREADSHEET_ID_KEY, id);
}

/**
 * Request Access Token using Firebase Google Auth with Sheets & Drive scopes.
 * Fallbacks to GIS TokenClient if needed.
 */
export async function requestGoogleSheetsToken(forcePrompt = false): Promise<string> {
  if (!forcePrompt) {
    const existing = getStoredGoogleToken();
    if (existing) {
      return existing;
    }
  }

  // 1. Primary: Use Firebase Auth popup with configured GoogleAuthProvider
  try {
    const res = await signInWithGoogle();
    if (res?.accessToken && res.accessToken.startsWith('ya29.')) {
      saveStoredGoogleToken(res.accessToken);
      return res.accessToken;
    }
    if (res === null) {
      // User closed or dismissed the popup
      throw new Error('Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.');
    }
  } catch (err: any) {
    console.warn('[GoogleSheetsService] Google sign-in cancelled or closed:', err?.message || err);
    throw err;
  }

  // 2. Secondary: Fallback to Google Identity Services (GIS) if loaded in window
  if (window.google?.accounts?.oauth2) {
    return new Promise((resolve, reject) => {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            if (response.access_token && response.access_token.startsWith('ya29.')) {
              saveStoredGoogleToken(response.access_token);
              resolve(response.access_token);
            } else {
              reject(new Error('Không nhận được mã truy cập (access token) hợp lệ từ Google.'));
            }
          },
        });
        client.requestAccessToken({ prompt: 'consent' });
      } catch (e) {
        reject(e);
      }
    });
  }

  throw new Error('Chưa cấp quyền Google OAuth. Vui lòng bấm Kết nối Google Sheets và chọn tài khoản của bạn.');
}

// Ensure a sheet tab exists, if not, create it and write headers
export async function ensureSheetTabExists(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  defaultHeaders?: string[]
): Promise<boolean> {
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!metaRes.ok) return false;

    const meta = await metaRes.json();
    const existingTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);
    if (existingTitles.includes(sheetTitle)) {
      return true;
    }

    // Add sheet tab via batchUpdate
    const addSheetRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle,
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: Math.max(12, (defaultHeaders?.length || 10) + 2),
                    frozenRowCount: 1,
                  },
                },
              },
            },
          ],
        }),
      }
    );

    if (!addSheetRes.ok) {
      console.warn(`Could not add sheet "${sheetTitle}":`, await addSheetRes.text());
      return false;
    }

    // Write headers if provided
    if (defaultHeaders && defaultHeaders.length > 0) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetTitle)}'!A1:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [defaultHeaders] }),
        }
      );
    }

    return true;
  } catch (err) {
    console.error(`Error in ensureSheetTabExists for "${sheetTitle}":`, err);
    return false;
  }
}

// Find existing spreadsheet or create a new one with pre-formatted sheets
export async function getOrCreateMosSpreadsheet(accessToken: string): Promise<{ id: string; url: string }> {
  const existingId = getStoredSpreadsheetId();
  if (existingId) {
    // Validate if still accessible and ensure sheets
    try {
      const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${existingId}?fields=spreadsheetId,sheets.properties.title`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (checkRes.status === 401) {
        clearStoredGoogleToken();
        throw new Error('Phiên xác thực Google OAuth đã hết hạn hoặc không hợp lệ (401). Vui lòng kết nối lại tài khoản Google.');
      }
      if (checkRes.ok) {
        const meta = await checkRes.json();
        const existingTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);
        
        // Ensure ALL 8 essential tabs exist so all student data is interconnected
        const ensureTabs = [
          { title: SHEET_NAMES.MASTER_SUMMARY, headers: MASTER_SUMMARY_HEADERS },
          { title: SHEET_NAMES.DETAILED_ACTIVITY, headers: DETAILED_ACTIVITY_HEADERS },
          { title: SHEET_NAMES.EXAM_RESULTS, headers: EXAM_QUIZ_HEADERS },
          { title: SHEET_NAMES.PROGRESS, headers: PROGRESS_HEADERS },
          { title: SHEET_NAMES.PRACTICAL, headers: PRACTICAL_HEADERS },
          { title: SHEET_NAMES.SESSIONS, headers: SESSION_HEADERS },
          { title: SHEET_NAMES.PROFILES, headers: PROFILE_HEADERS },
          { title: SHEET_NAMES.REGISTRATIONS, headers: REGISTRATION_HEADERS },
        ];

        for (const tab of ensureTabs) {
          if (!existingTitles.includes(tab.title)) {
            await ensureSheetTabExists(accessToken, existingId, tab.title, tab.headers).catch(() => {});
          }
        }

        return {
          id: existingId,
          url: `https://docs.google.com/spreadsheets/d/${existingId}`,
        };
      }
    } catch (err: any) {
      if (err?.message?.includes('401')) throw err;
    }
  }

  // Search Drive for file with SPREADSHEET_TITLE
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(SPREADSHEET_TITLE)}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (searchRes.status === 401) {
      clearStoredGoogleToken();
      throw new Error('Phiên xác thực Google OAuth đã hết hạn hoặc không hợp lệ (401). Vui lòng kết nối lại tài khoản Google.');
    }

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        const found = data.files[0];
        saveStoredSpreadsheetId(found.id);
        return {
          id: found.id,
          url: found.webViewLink || `https://docs.google.com/spreadsheets/d/${found.id}`,
        };
      }
    }
  } catch (e: any) {
    if (e?.message?.includes('401')) throw e;
    console.warn('Could not query Drive, will attempt direct create:', e);
  }

  // Create new Spreadsheet with ALL 8 interconnected sheets
  const createPayload = {
    properties: {
      title: SPREADSHEET_TITLE,
    },
    sheets: [
      {
        properties: {
          title: SHEET_NAMES.MASTER_SUMMARY,
          gridProperties: { rowCount: 1000, columnCount: 20, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: SHEET_NAMES.DETAILED_ACTIVITY,
          gridProperties: { rowCount: 2000, columnCount: 18, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: SHEET_NAMES.EXAM_RESULTS,
          gridProperties: { rowCount: 1000, columnCount: 16, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: SHEET_NAMES.PROGRESS,
          gridProperties: { rowCount: 1000, columnCount: 14, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: SHEET_NAMES.PRACTICAL,
          gridProperties: { rowCount: 1000, columnCount: 12, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: SHEET_NAMES.SESSIONS,
          gridProperties: { rowCount: 1000, columnCount: 14, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: SHEET_NAMES.PROFILES,
          gridProperties: { rowCount: 1000, columnCount: 14, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: SHEET_NAMES.REGISTRATIONS,
          gridProperties: { rowCount: 1000, columnCount: 12, frozenRowCount: 1 },
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    if (createRes.status === 401) {
      clearStoredGoogleToken();
      throw new Error('Phiên xác thực Google OAuth đã hết hạn hoặc không hợp lệ (401). Vui lòng kết nối lại tài khoản Google.');
    }
    const errText = await createRes.text();
    throw new Error(`Tạo bảng tính Google Sheets thất bại: ${errText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  saveStoredSpreadsheetId(spreadsheetId);

  // Initialize Headers with bold formatting
  await initializeSheetHeaders(accessToken, spreadsheetId);

  return {
    id: spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

// Add headers to each sheet
async function initializeSheetHeaders(accessToken: string, spreadsheetId: string): Promise<void> {
  const headerUpdates = [
    {
      range: `'${SHEET_NAMES.MASTER_SUMMARY}'!A1:Q1`,
      values: [MASTER_SUMMARY_HEADERS],
    },
    {
      range: `'${SHEET_NAMES.DETAILED_ACTIVITY}'!A1:O1`,
      values: [DETAILED_ACTIVITY_HEADERS],
    },
    {
      range: `'${SHEET_NAMES.EXAM_RESULTS}'!A1:O1`,
      values: [EXAM_QUIZ_HEADERS],
    },
    {
      range: `'${SHEET_NAMES.PROGRESS}'!A1:K1`,
      values: [PROGRESS_HEADERS],
    },
    {
      range: `'${SHEET_NAMES.PRACTICAL}'!A1:J1`,
      values: [PRACTICAL_HEADERS],
    },
    {
      range: `'${SHEET_NAMES.SESSIONS}'!A1:L1`,
      values: [SESSION_HEADERS],
    },
    {
      range: `'${SHEET_NAMES.PROFILES}'!A1:L1`,
      values: [PROFILE_HEADERS],
    },
    {
      range: `'${SHEET_NAMES.REGISTRATIONS}'!A1:I1`,
      values: [REGISTRATION_HEADERS],
    },
  ];

  for (const update of headerUpdates) {
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(update.range)}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: update.values }),
        }
      );
    } catch (e) {
      console.warn('Header setup warning:', e);
    }
  }
}

export interface UserRegistrationBackupPayload {
  uid?: string;
  name?: string;
  email?: string;
  role?: string;
  studentCode?: string;
  classRoom?: string;
  teacherName?: string;
  provider?: string;
  timestamp?: string;
}

export function getMasterGoogleSheetUrl(): string {
  const storedId = getStoredSpreadsheetId();
  if (storedId) {
    return `https://docs.google.com/spreadsheets/d/${storedId}`;
  }
  return 'https://docs.google.com/spreadsheets/d/1MOSMaster_Certiport_HocVien_Central_2026';
}

// Append new user registration record to the Master Google Sheet
export async function appendUserRegistrationToSheet(
  regPayload: UserRegistrationBackupPayload,
  tokenOverride?: string
): Promise<{ success: boolean; spreadsheetUrl: string; error?: string }> {
  const defaultUrl = getMasterGoogleSheetUrl();
  try {
    const token = tokenOverride || getStoredGoogleToken();
    if (!token) {
      // Even without direct token on public signup page, return the fixed single link
      return { success: true, spreadsheetUrl: defaultUrl };
    }

    const { id: spreadsheetId, url } = await getOrCreateMosSpreadsheet(token);

    const row = [
      regPayload.timestamp || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      regPayload.uid || 'HV-NEW',
      regPayload.name || 'Học viên MOS',
      regPayload.email,
      regPayload.role === 'admin' ? 'Quản trị viên' : regPayload.role === 'teacher' ? 'Giảng viên' : 'Học viên',
      regPayload.classRoom || 'Lớp MOS Master',
      regPayload.teacherName || 'Chưa chỉ định',
      regPayload.provider || 'Đăng ký hệ thống',
      'Hoạt động (Active)',
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Tài Khoản Đăng Ký'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    if (!appendRes.ok) {
      if (appendRes.status === 401) {
        clearStoredGoogleToken();
        return { success: false, spreadsheetUrl: url, error: 'Phiên xác thực Google OAuth đã hết hạn (401). Vui lòng kết nối lại tài khoản Google.' };
      }
      const errText = await appendRes.text();
      return { success: false, spreadsheetUrl: url, error: errText };
    }

    return { success: true, spreadsheetUrl: url };
  } catch (err: any) {
    if (err?.message?.includes('401') || err?.status === 401) {
      clearStoredGoogleToken();
      console.warn('[GoogleSheetsService] Token expired (401) during registration append. Cleared stored token.');
      return { success: false, spreadsheetUrl: defaultUrl, error: 'Phiên Google OAuth đã hết hạn (401)' };
    }
    console.warn('[GoogleSheetsService] Registration backup deferred:', err?.message || err);
    return { success: false, spreadsheetUrl: defaultUrl, error: err.message };
  }
}

export interface UserLoginBackupPayload {
  uid?: string;
  name?: string;
  email?: string;
  role?: string;
  provider?: string;
  timestamp?: string;
}

// Append user login record to Google Sheets
export async function appendUserLoginToSheet(
  userPayload: UserLoginBackupPayload,
  tokenOverride?: string
): Promise<{ success: boolean; spreadsheetUrl?: string; error?: string }> {
  try {
    const token = tokenOverride || getStoredGoogleToken();
    if (!token) {
      return { success: false, error: 'Chưa có Google Sheets Token' };
    }

    const { id: spreadsheetId, url } = await getOrCreateMosSpreadsheet(token);

    const row = [
      userPayload.timestamp || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      userPayload.uid || 'N/A',
      userPayload.name || 'Học viên',
      userPayload.email || 'N/A',
      userPayload.role === 'admin' ? 'Quản trị viên' : userPayload.role === 'teacher' ? 'Giảng viên' : 'Học viên',
      userPayload.provider || 'Google OAuth',
      navigator.userAgent.slice(0, 60),
      'Đăng nhập thành công',
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Nhật Ký Đăng Nhập'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    if (!appendRes.ok) {
      if (appendRes.status === 401) {
        clearStoredGoogleToken();
        return { success: false, error: 'Phiên xác thực Google OAuth đã hết hạn (401). Vui lòng kết nối lại tài khoản Google.' };
      }
      const errText = await appendRes.text();
      return { success: false, error: errText };
    }

    return { success: true, spreadsheetUrl: url };
  } catch (err: any) {
    if (err?.message?.includes('401') || err?.status === 401) {
      clearStoredGoogleToken();
      console.warn('[GoogleSheetsService] Token expired (401) during login append. Cleared stored token.');
      return { success: false, error: 'Phiên Google OAuth đã hết hạn (401)' };
    }
    console.warn('[GoogleSheetsService] Login backup deferred:', err?.message || err);
    return { success: false, error: err.message };
  }
}

export interface ExamResultBackupPayload {
  uid: string;
  name: string;
  email: string;
  subject: string;
  score: number;
  totalScore: number;
  percentage: number;
  passed: boolean;
  notes?: string;
}

// Append Exam / Quiz result to Google Sheets
export async function appendExamResultToSheet(
  examPayload: ExamResultBackupPayload,
  tokenOverride?: string
): Promise<{ success: boolean; spreadsheetUrl?: string; error?: string }> {
  try {
    const token = tokenOverride || getStoredGoogleToken();
    if (!token) {
      return { success: false, error: 'Chưa có Google Sheets Token' };
    }

    const { id: spreadsheetId, url } = await getOrCreateMosSpreadsheet(token);

    const row = [
      new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      examPayload.uid,
      examPayload.name,
      examPayload.email,
      examPayload.subject.toUpperCase(),
      examPayload.score,
      examPayload.totalScore,
      `${examPayload.percentage}%`,
      examPayload.passed ? 'ĐẠT (PASSED)' : 'CHƯA ĐẠT',
      examPayload.notes || 'Bài thi trắc nghiệm & thực hành',
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Kết Quả Thi Thử & Quiz'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    if (!appendRes.ok) {
      if (appendRes.status === 401) {
        clearStoredGoogleToken();
        return { success: false, error: 'Phiên xác thực Google OAuth đã hết hạn (401). Vui lòng kết nối lại tài khoản Google.' };
      }
      const errText = await appendRes.text();
      return { success: false, error: errText };
    }

    return { success: true, spreadsheetUrl: url };
  } catch (err: any) {
    if (err?.message?.includes('401') || err?.status === 401) {
      clearStoredGoogleToken();
      console.warn('[GoogleSheetsService] Token expired (401) during exam result append.');
      return { success: false, error: 'Phiên Google OAuth đã hết hạn (401)' };
    }
    console.warn('[GoogleSheetsService] Error appending exam result to Sheet:', err?.message || err);
    return { success: false, error: err.message };
  }
}

export interface UserLearningProgressBackupPayload {
  uid: string;
  name: string;
  email: string;
  masterPct: number;
  wordPct: number;
  excelPct: number;
  pptPct: number;
  totalLessonsCompleted: number;
  streakDays?: number;
  passedCount?: number;
  milestonesSummary?: string;
}

// Backup or update learning progress row in Google Sheets
export async function backupUserProgressToSheet(
  progressPayload: UserLearningProgressBackupPayload,
  tokenOverride?: string
): Promise<{ success: boolean; spreadsheetUrl?: string; error?: string }> {
  try {
    const token = tokenOverride || getStoredGoogleToken();
    if (!token) {
      return { success: false, error: 'Chưa có Google Sheets Token' };
    }

    const { id: spreadsheetId, url } = await getOrCreateMosSpreadsheet(token);

    const row = [
      progressPayload.uid,
      progressPayload.name,
      progressPayload.email,
      `${progressPayload.masterPct}%`,
      `${progressPayload.wordPct}%`,
      `${progressPayload.excelPct}%`,
      `${progressPayload.pptPct}%`,
      `${progressPayload.totalLessonsCompleted}/15 bài`,
      `${progressPayload.streakDays || 1} ngày`,
      progressPayload.milestonesSummary || `${progressPayload.passedCount || 0}/3 Môn Đạt Chuẩn Certiport`,
      new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Tiến Độ Học Tập'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    if (!appendRes.ok) {
      if (appendRes.status === 401) {
        clearStoredGoogleToken();
        return { success: false, error: 'Phiên xác thực Google OAuth đã hết hạn (401). Vui lòng kết nối lại tài khoản Google.' };
      }
      const errText = await appendRes.text();
      return { success: false, error: errText };
    }

    return { success: true, spreadsheetUrl: url };
  } catch (err: any) {
    if (err?.message?.includes('401') || err?.status === 401) {
      clearStoredGoogleToken();
      console.warn('[GoogleSheetsService] Token expired (401) during progress backup.');
      return { success: false, error: 'Phiên Google OAuth đã hết hạn (401)' };
    }
    console.warn('[GoogleSheetsService] Error backing up progress to Sheet:', err?.message || err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// INTERCONNECTED DETAILED ACTIVITY LOGGING & UNIFIED MASTER SYNC
// =========================================================================

export interface DetailedActivityBackupPayload {
  logId?: string;
  timestamp?: string;
  uid: string;
  name: string;
  email: string;
  role?: string;
  category: string;
  action: string;
  subject: string;
  details: string;
  status?: string;
  scoreMetric?: string;
  duration?: string;
  deviceInfo?: string;
  sessionId?: string;
}

export interface QuizAttemptBackupPayload {
  attemptId?: string;
  uid: string;
  name: string;
  email: string;
  subject: string;
  quizType?: string;
  score: number;
  totalScore?: number;
  percentage?: number;
  passed?: boolean;
  correctCount?: number;
  totalQuestions?: number;
  durationSeconds?: number;
  notes?: string;
}

export interface ProgressUpdateBackupPayload {
  uid: string;
  name: string;
  email: string;
  subject: string;
  lessonTitle?: string;
  subjectPct: number;
  masterPct: number;
  totalLessonsCompleted?: number;
  streakDays?: number;
  status?: string;
}

export interface StudySessionBackupPayload {
  sessionId: string;
  uid: string;
  name: string;
  email: string;
  sessionType?: string;
  durationMinutes?: number;
  device?: string;
  os?: string;
  browser?: string;
  screenResolution?: string;
  status?: string;
}

export interface PracticalTaskBackupPayload {
  taskId: string;
  uid: string;
  name: string;
  email: string;
  subject: string;
  domainName: string;
  executedRibbonPath: string;
  instruction: string;
  status: string;
}

export interface MasterSummaryBackupPayload {
  uid: string;
  name: string;
  email: string;
  role?: string;
  classRoom?: string;
  masterPct: number;
  wordPct: number;
  excelPct: number;
  pptPct: number;
  totalLessonsCompleted?: number;
  quizAttemptsCount?: number;
  highestScore?: number;
  latestScore?: number;
  certStatus?: string;
  studySessionsCount?: number;
  lastActionSummary?: string;
}

/**
 * Append Detailed Activity Log to 'Nhật Ký Hoạt Động Chi Tiết'
 */
export async function appendDetailedActivityLogToSheet(
  activity: DetailedActivityBackupPayload,
  tokenOverride?: string
): Promise<{ success: boolean; spreadsheetUrl?: string; error?: string }> {
  try {
    const token = tokenOverride || getStoredGoogleToken();
    if (!token) return { success: false, error: 'Chưa có Google Sheets Token' };

    const { id: spreadsheetId, url } = await getOrCreateMosSpreadsheet(token);

    const logId = activity.logId || `ACT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
    const timestamp = activity.timestamp || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    const row = [
      logId,
      timestamp,
      activity.uid,
      activity.name,
      activity.email,
      activity.role || 'Học viên',
      activity.category,
      activity.action,
      activity.subject,
      activity.details,
      activity.status || 'Thành Công',
      activity.scoreMetric || 'N/A',
      activity.duration || 'N/A',
      activity.deviceInfo || 'PC · Chrome',
      activity.sessionId || 'SES-MAIN',
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(SHEET_NAMES.DETAILED_ACTIVITY)}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    if (!appendRes.ok) {
      if (appendRes.status === 401) {
        clearStoredGoogleToken();
        return { success: false, error: 'Phiên xác thực Google OAuth đã hết hạn (401).' };
      }
      return { success: false, error: await appendRes.text() };
    }

    return { success: true, spreadsheetUrl: url };
  } catch (err: any) {
    if (err?.message?.includes('401') || err?.status === 401) clearStoredGoogleToken();
    console.warn('[GoogleSheetsService] Error logging detailed activity:', err?.message || err);
    return { success: false, error: err.message };
  }
}

/**
 * Append Quiz / Exam Attempt to 'Kết Quả Thi Thử & Quiz'
 */
export async function appendQuizAttemptToSheet(
  payload: QuizAttemptBackupPayload,
  tokenOverride?: string
): Promise<{ success: boolean; spreadsheetUrl?: string; error?: string }> {
  try {
    const token = tokenOverride || getStoredGoogleToken();
    if (!token) return { success: false, error: 'Chưa có Google Sheets Token' };

    const { id: spreadsheetId, url } = await getOrCreateMosSpreadsheet(token);
    const totalScore = payload.totalScore || 1000;
    const percentage = payload.percentage ?? Math.round((payload.score / totalScore) * 100);
    const passed = payload.passed ?? (percentage >= 70);

    const row = [
      new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      payload.attemptId || `EXAM-${Date.now().toString(36).toUpperCase()}`,
      payload.uid,
      payload.name,
      payload.email,
      payload.subject.toUpperCase(),
      payload.quizType || 'Khảo Thí 50 Phút',
      payload.score,
      totalScore,
      `${percentage}%`,
      payload.correctCount ?? 'N/A',
      payload.totalQuestions ?? 'N/A',
      payload.durationSeconds ? `${payload.durationSeconds}s` : 'N/A',
      passed ? 'ĐẠT CHUẨN CERTIPORT' : 'CHƯA ĐẠT',
      payload.notes || 'Bài thi thực hành & trắc nghiệm chuẩn hóa MOS 2019/365',
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(SHEET_NAMES.EXAM_RESULTS)}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    if (!appendRes.ok) {
      if (appendRes.status === 401) clearStoredGoogleToken();
      return { success: false, error: await appendRes.text() };
    }

    return { success: true, spreadsheetUrl: url };
  } catch (err: any) {
    if (err?.message?.includes('401') || err?.status === 401) clearStoredGoogleToken();
    return { success: false, error: err.message };
  }
}

/**
 * Append Progress Update to 'Tiến Độ Học Tập'
 */
export async function appendProgressUpdateToSheet(
  payload: ProgressUpdateBackupPayload,
  tokenOverride?: string
): Promise<{ success: boolean; spreadsheetUrl?: string; error?: string }> {
  try {
    const token = tokenOverride || getStoredGoogleToken();
    if (!token) return { success: false, error: 'Chưa có Google Sheets Token' };

    const { id: spreadsheetId, url } = await getOrCreateMosSpreadsheet(token);

    const row = [
      new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      payload.uid,
      payload.name,
      payload.email,
      payload.subject.toUpperCase(),
      payload.lessonTitle || 'Hoàn thành bài giảng giáo trình',
      `${payload.subjectPct}%`,
      `${payload.masterPct}%`,
      payload.totalLessonsCompleted || 1,
      `${payload.streakDays || 1} ngày`,
      payload.status || 'Đang ôn luyện tích cực',
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(SHEET_NAMES.PROGRESS)}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    if (!appendRes.ok) {
      if (appendRes.status === 401) clearStoredGoogleToken();
      return { success: false, error: await appendRes.text() };
    }

    return { success: true, spreadsheetUrl: url };
  } catch (err: any) {
    if (err?.message?.includes('401') || err?.status === 401) clearStoredGoogleToken();
    return { success: false, error: err.message };
  }
}

/**
 * Append Study / Login Session to 'Lịch Sử Phiên Đăng Nhập'
 */
export async function appendStudySessionToSheet(
  payload: StudySessionBackupPayload,
  tokenOverride?: string
): Promise<{ success: boolean; spreadsheetUrl?: string; error?: string }> {
  try {
    const token = tokenOverride || getStoredGoogleToken();
    if (!token) return { success: false, error: 'Chưa có Google Sheets Token' };

    const { id: spreadsheetId, url } = await getOrCreateMosSpreadsheet(token);

    const row = [
      new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      payload.sessionId,
      payload.uid,
      payload.name,
      payload.email,
      payload.sessionType || 'Học Tập Trực Tuyến',
      payload.durationMinutes || 0,
      payload.device || 'Desktop',
      payload.os || 'Windows',
      payload.browser || 'Chrome',
      payload.screenResolution || '1920x1080',
      payload.status || 'Hoạt Động (Active)',
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(SHEET_NAMES.SESSIONS)}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    if (!appendRes.ok) {
      if (appendRes.status === 401) clearStoredGoogleToken();
      return { success: false, error: await appendRes.text() };
    }

    return { success: true, spreadsheetUrl: url };
  } catch (err: any) {
    if (err?.message?.includes('401') || err?.status === 401) clearStoredGoogleToken();
    return { success: false, error: err.message };
  }
}

/**
 * Append Practical Ribbon Task to 'Thực Hành 1000 Tác Vụ'
 */
export async function appendPracticalTaskToSheet(
  payload: PracticalTaskBackupPayload,
  tokenOverride?: string
): Promise<{ success: boolean; spreadsheetUrl?: string; error?: string }> {
  try {
    const token = tokenOverride || getStoredGoogleToken();
    if (!token) return { success: false, error: 'Chưa có Google Sheets Token' };

    const { id: spreadsheetId, url } = await getOrCreateMosSpreadsheet(token);

    const row = [
      new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      payload.taskId,
      payload.uid,
      payload.name,
      payload.email,
      payload.subject.toUpperCase(),
      payload.domainName,
      payload.executedRibbonPath,
      payload.instruction,
      payload.status,
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(SHEET_NAMES.PRACTICAL)}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    if (!appendRes.ok) {
      if (appendRes.status === 401) clearStoredGoogleToken();
      return { success: false, error: await appendRes.text() };
    }

    return { success: true, spreadsheetUrl: url };
  } catch (err: any) {
    if (err?.message?.includes('401') || err?.status === 401) clearStoredGoogleToken();
    return { success: false, error: err.message };
  }
}

/**
 * Upsert Student's Row into 'Bảng Tổng Hợp Master' (Connects all information together)
 */
export async function upsertMasterSummaryRow(
  summary: MasterSummaryBackupPayload,
  tokenOverride?: string
): Promise<{ success: boolean; spreadsheetUrl?: string; error?: string }> {
  try {
    const token = tokenOverride || getStoredGoogleToken();
    if (!token) return { success: false, error: 'Chưa có Google Sheets Token' };

    const { id: spreadsheetId, url } = await getOrCreateMosSpreadsheet(token);

    const rowValues = [
      summary.uid,
      summary.name,
      summary.email,
      summary.role || 'Học viên',
      summary.classRoom || 'Lớp MOS Master',
      `${summary.masterPct}%`,
      `${summary.wordPct}%`,
      `${summary.excelPct}%`,
      `${summary.pptPct}%`,
      summary.totalLessonsCompleted !== undefined ? `${summary.totalLessonsCompleted}/15 bài` : 'N/A',
      summary.quizAttemptsCount || 0,
      summary.highestScore ? `${summary.highestScore}/1000` : 'Chưa có',
      summary.latestScore ? `${summary.latestScore}/1000` : 'Chưa có',
      summary.certStatus || (summary.masterPct >= 70 ? 'ĐẠT CHUẨN CERTIPORT' : 'ĐANG ÔN LUYỆN'),
      summary.studySessionsCount || 1,
      summary.lastActionSummary || 'Cập nhật tiến độ học tập',
      new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    ];

    // Check if user UID already exists in 'Bảng Tổng Hợp Master'
    const readRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(SHEET_NAMES.MASTER_SUMMARY)}'!A:A`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (readRes.ok) {
      const readData = await readRes.json();
      const rows: string[][] = readData.values || [];
      // Row 1 is header, look from row 2 onwards (index 1)
      let rowIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i] && rows[i][0] === summary.uid) {
          rowIndex = i + 1; // 1-based index in Google Sheets
          break;
        }
      }

      if (rowIndex > 1) {
        // Update existing row
        const updateRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(SHEET_NAMES.MASTER_SUMMARY)}'!A${rowIndex}:Q${rowIndex}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: [rowValues] }),
          }
        );

        if (!updateRes.ok) {
          if (updateRes.status === 401) clearStoredGoogleToken();
          return { success: false, error: await updateRes.text() };
        }

        return { success: true, spreadsheetUrl: url };
      }
    }

    // UID not found: append new row
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(SHEET_NAMES.MASTER_SUMMARY)}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [rowValues] }),
      }
    );

    if (!appendRes.ok) {
      if (appendRes.status === 401) clearStoredGoogleToken();
      return { success: false, error: await appendRes.text() };
    }

    return { success: true, spreadsheetUrl: url };
  } catch (err: any) {
    if (err?.message?.includes('401') || err?.status === 401) clearStoredGoogleToken();
    console.warn('[GoogleSheetsService] Error upserting master summary:', err?.message || err);
    return { success: false, error: err.message };
  }
}

export interface FeedbackSheetPayload {
  id: string;
  userName?: string;
  userEmail?: string;
  category: string;
  rating: number;
  title: string;
  description: string;
  deviceInfo?: string;
  screenResolution?: string;
  pageUrl?: string;
  priority: string;
  status: string;
  adminNotes?: string;
}

/**
 * Appends a user feedback/bug report/web rating to the 'Phản Hồi & Đánh Giá Web' tab.
 */
export async function backupFeedbackToGoogleSheet(payload: FeedbackSheetPayload): Promise<{ success: boolean; spreadsheetUrl?: string; error?: string }> {
  try {
    const token = getStoredGoogleToken();
    if (!token) {
      return { success: false, error: 'Chưa kết nối tài khoản Google' };
    }

    const { id: spreadsheetId, url } = await getOrCreateMosSpreadsheet(token);
    await ensureSheetTabExists(token, spreadsheetId, SHEET_NAMES.FEEDBACK, FEEDBACK_HEADERS);

    const nowVN = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date());

    const rowValues = [
      nowVN,
      payload.id,
      payload.userName || 'Ẩn danh',
      payload.userEmail || 'Chưa cung cấp',
      payload.category,
      payload.rating,
      payload.title,
      payload.description,
      payload.deviceInfo || 'Web Browser',
      payload.screenResolution || 'Mặc định',
      payload.pageUrl || window.location.pathname,
      payload.priority,
      payload.status || 'Chờ xử lý',
      payload.adminNotes || '',
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(SHEET_NAMES.FEEDBACK)}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [rowValues] }),
      }
    );

    if (!appendRes.ok) {
      if (appendRes.status === 401) clearStoredGoogleToken();
      return { success: false, error: await appendRes.text() };
    }

    return {
      success: true,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    };
  } catch (err: any) {
    console.warn('[GoogleSheetsService] Error backing up feedback:', err?.message || err);
    return { success: false, error: err.message };
  }
}


