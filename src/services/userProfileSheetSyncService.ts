/**
 * User Profile & Authentication Session Google Sheets Synchronization Service
 * 
 * Handles real-time and on-demand synchronization of user profiles,
 * authentication metadata, and active session details to Google Sheets
 * using the Google Sheets API v4 and Google Drive API v3.
 */

import { auth } from '../lib/firebase';
import { 
  getStoredGoogleToken, 
  saveStoredGoogleToken, 
  clearStoredGoogleToken,
  requestGoogleSheetsToken,
  saveStoredSpreadsheetId,
  getStoredSpreadsheetId,
  ensureSheetTabExists
} from './googleSheetsService';

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

export interface UserProfileSyncData {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'teacher' | 'admin' | string;
  avatarUrl?: string;
  phoneNumber?: string;
  studentId?: string;
  schoolOrOrg?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface UserSessionAuthData {
  sessionId: string;
  providerId: 'google.com' | 'password' | 'anonymous' | string;
  emailVerified: boolean;
  loginTimestamp: string;
  clientUserAgent: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  operatingSystem: string;
  browser: string;
  screenResolution: string;
  authStatus: 'Active' | 'Revoked' | 'Expired';
}

export interface SyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  profileAction?: 'inserted' | 'updated' | 'unchanged';
  sessionRowAdded?: boolean;
  error?: string;
  timestamp: string;
}

export interface SheetSyncOptions {
  spreadsheetTitle?: string;
  profileSheetName?: string;
  sessionLogSheetName?: string;
  forceTokenRefresh?: boolean;
  promptIfMissing?: boolean;
}

const DEFAULT_SPREADSHEET_TITLE = 'MOS Master - Hệ Thống Dữ Liệu Học Viên & Khảo Thí Tập Trung';
const DEFAULT_PROFILE_SHEET = 'Danh Sách Hồ Sơ';
const DEFAULT_SESSION_SHEET = 'Lịch Sử Phiên Đăng Nhập';
const SYNC_SHEET_ID_STORAGE_KEY = 'mos_google_spreadsheet_id';

/**
 * Detect client environment, OS, browser, and device type
 */
function parseClientEnvironment() {
  const ua = navigator.userAgent;
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  if (/mobile/i.test(ua)) deviceType = 'Mobile';
  else if (/ipad|tablet/i.test(ua)) deviceType = 'Tablet';

  let operatingSystem = 'Unknown OS';
  if (/windows/i.test(ua)) operatingSystem = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) operatingSystem = 'macOS';
  else if (/linux/i.test(ua)) operatingSystem = 'Linux';
  else if (/android/i.test(ua)) operatingSystem = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) operatingSystem = 'iOS';

  let browser = 'Unknown Browser';
  if (/chrome|chromium|crios/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';

  return {
    deviceType,
    operatingSystem,
    browser,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    userAgent: ua,
  };
}

/**
 * Retrieve valid Google OAuth Access Token
 */
export async function getValidAccessToken(forceRefresh = false, allowPrompt = false): Promise<string | null> {
  let token = getStoredGoogleToken();
  if ((!token && allowPrompt) || (token && forceRefresh)) {
    token = await requestGoogleSheetsToken(forceRefresh);
    if (token) {
      saveStoredGoogleToken(token);
    }
  }
  return token;
}

/**
 * Retrieve or dynamically initialize the target Google Spreadsheet
 */
export async function getOrInitializeSyncSpreadsheet(
  accessToken: string,
  options: SheetSyncOptions = {}
): Promise<{ id: string; url: string }> {
  const spreadsheetTitle = options.spreadsheetTitle || DEFAULT_SPREADSHEET_TITLE;
  const profileSheetName = options.profileSheetName || DEFAULT_PROFILE_SHEET;
  const sessionSheetName = options.sessionLogSheetName || DEFAULT_SESSION_SHEET;

  const storedId = localStorage.getItem(SYNC_SHEET_ID_STORAGE_KEY) || getStoredSpreadsheetId();
  if (storedId) {
    try {
      const checkRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${storedId}?fields=spreadsheetId,sheets.properties.title`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (checkRes.ok) {
        const meta = await checkRes.json();
        const existingTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);
        if (!existingTitles.includes(profileSheetName)) {
          await ensureSheetTabExists(accessToken, storedId, profileSheetName, PROFILE_HEADERS);
        }
        if (!existingTitles.includes(sessionSheetName)) {
          await ensureSheetTabExists(accessToken, storedId, sessionSheetName, SESSION_HEADERS);
        }

        return {
          id: storedId,
          url: `https://docs.google.com/spreadsheets/d/${storedId}`,
        };
      }
    } catch {}
  }

  // Search existing file in Google Drive
  try {
    const driveSearch = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(spreadsheetTitle)}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,webViewLink)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (driveSearch.ok) {
      const data = await driveSearch.json();
      if (data.files && data.files.length > 0) {
        const found = data.files[0];
        localStorage.setItem(SYNC_SHEET_ID_STORAGE_KEY, found.id);
        saveStoredSpreadsheetId(found.id);

        // Ensure required tabs exist
        await ensureSheetTabExists(accessToken, found.id, profileSheetName, PROFILE_HEADERS);
        await ensureSheetTabExists(accessToken, found.id, sessionSheetName, SESSION_HEADERS);

        return {
          id: found.id,
          url: found.webViewLink || `https://docs.google.com/spreadsheets/d/${found.id}`,
        };
      }
    }
  } catch (e) {
    console.warn('Drive search skipped:', e);
  }

  // Create new Spreadsheet with customized schema
  const createPayload = {
    properties: {
      title: spreadsheetTitle,
    },
    sheets: [
      {
        properties: {
          title: profileSheetName,
          gridProperties: { rowCount: 1000, columnCount: 12, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: sessionSheetName,
          gridProperties: { rowCount: 2000, columnCount: 12, frozenRowCount: 1 },
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
    throw new Error(`Không thể khởi tạo Google Sheet: ${errText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  localStorage.setItem(SYNC_SHEET_ID_STORAGE_KEY, spreadsheetId);
  saveStoredSpreadsheetId(spreadsheetId);

  // Initialize sheet headers
  await setupSheetHeaders(accessToken, spreadsheetId, profileSheetName, sessionSheetName);

  return {
    id: spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

/**
 * Configure formatted headers for both Profile and Session sheets
 */
async function setupSheetHeaders(
  accessToken: string, 
  spreadsheetId: string,
  profileSheetName: string,
  sessionSheetName: string
): Promise<void> {
  const profileHeaders = [
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

  const sessionHeaders = [
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

  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: `'${profileSheetName}'!A1:L1`,
              values: [profileHeaders],
            },
            {
              range: `'${sessionSheetName}'!A1:L1`,
              values: [sessionHeaders],
            },
          ],
        }),
      }
    );
  } catch (e) {
    console.warn('Headers batchUpdate warning:', e);
  }
}

/**
 * Synchronize user profile into Google Sheets (Upsert logic by UID)
 */
export async function syncUserProfileToSheet(
  accessToken: string,
  spreadsheetId: string,
  profile: UserProfileSyncData,
  emailVerified = false,
  profileSheetName = DEFAULT_PROFILE_SHEET
): Promise<'inserted' | 'updated' | 'unchanged'> {
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  // Ensure target sheet exists before reading or appending
  await ensureSheetTabExists(accessToken, spreadsheetId, profileSheetName, PROFILE_HEADERS);

  // Read existing UIDs in column A
  let existingRowIndex = -1;
  try {
    const getRowsRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(profileSheetName)}'!A:A`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (getRowsRes.ok) {
      const data = await getRowsRes.json();
      const rows: string[][] = data.values || [];
      for (let i = 1; i < rows.length; i++) {
        if (rows[i] && rows[i][0] === profile.uid) {
          existingRowIndex = i + 1; // 1-based index in Google Sheets
          break;
        }
      }
    }
  } catch (err) {
    console.warn('Could not read existing UIDs, defaulting to append:', err);
  }

  const roleLabel = profile.role === 'admin' 
    ? 'Quản Trị Viên (Admin)' 
    : profile.role === 'teacher' 
    ? 'Giảng Viên (Teacher)' 
    : 'Học Viên (Student)';

  const profileRowValues = [
    profile.uid,
    profile.displayName || 'Học viên MOS',
    profile.email || 'N/A',
    roleLabel,
    profile.studentId || 'N/A',
    profile.schoolOrOrg || 'Trung Tâm Tin Học',
    profile.phoneNumber || 'N/A',
    profile.avatarUrl || '',
    emailVerified ? 'Đã xác minh (TRUE)' : 'Chưa xác minh (FALSE)',
    profile.createdAt || now,
    profile.lastLoginAt || now,
    now,
  ];

  if (existingRowIndex > 0) {
    // Update existing row
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(profileSheetName)}'!A${existingRowIndex}:L${existingRowIndex}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [profileRowValues] }),
      }
    );
    if (!updateRes.ok) {
      console.warn(`Update failed, will attempt append: ${await updateRes.text()}`);
    } else {
      return 'updated';
    }
  }

  // Append new row
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(profileSheetName)}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [profileRowValues] }),
    }
  );

  if (!appendRes.ok) {
    const errText = await appendRes.text();
    // Auto-heal: If range parse error or missing sheet, recreate tab and retry once
    if (errText.includes('Unable to parse range') || errText.includes('INVALID_ARGUMENT')) {
      await ensureSheetTabExists(accessToken, spreadsheetId, profileSheetName, PROFILE_HEADERS);
      const retryRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(profileSheetName)}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [profileRowValues] }),
        }
      );
      if (retryRes.ok) {
        return 'inserted';
      }
    }
    throw new Error(`Thêm mới hồ sơ học viên thất bại: ${errText}`);
  }
  return 'inserted';
}

/**
 * Log session and authentication data to the Session Log sheet
 */
export async function logAuthSessionToSheet(
  accessToken: string,
  spreadsheetId: string,
  profile: UserProfileSyncData,
  session: UserSessionAuthData,
  sessionSheetName = DEFAULT_SESSION_SHEET
): Promise<boolean> {
  await ensureSheetTabExists(accessToken, spreadsheetId, sessionSheetName, SESSION_HEADERS);

  const sessionRowValues = [
    session.loginTimestamp,
    session.sessionId,
    profile.uid,
    profile.displayName || 'Học viên',
    profile.email,
    session.providerId,
    session.deviceType,
    session.operatingSystem,
    session.browser,
    session.screenResolution,
    session.authStatus,
    session.clientUserAgent,
  ];

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sessionSheetName)}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [sessionRowValues] }),
    }
  );

  if (!appendRes.ok) {
    const errText = await appendRes.text();
    if (errText.includes('Unable to parse range') || errText.includes('INVALID_ARGUMENT')) {
      await ensureSheetTabExists(accessToken, spreadsheetId, sessionSheetName, SESSION_HEADERS);
      const retryRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sessionSheetName)}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [sessionRowValues] }),
        }
      );
      return retryRes.ok;
    }
    return false;
  }

  return true;
}

/**
 * High-level function: Synchronize current session's user profile & auth data
 * Automatically inspects Firebase auth / current user and updates Google Sheet.
 */
export async function syncCurrentSessionUserProfile(
  profileOverride?: Partial<UserProfileSyncData>,
  options: SheetSyncOptions = {}
): Promise<SyncResult> {
  const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  try {
    const allowPrompt = options.promptIfMissing ?? false;
    const accessToken = await getValidAccessToken(options.forceTokenRefresh, allowPrompt);

    // If no active Google token and not prompting, gracefully defer sync without error
    if (!accessToken) {
      return {
        success: false,
        error: 'Chưa có phiên kết nối Google Sheets (sync deferred)',
        timestamp,
      };
    }

    const { id: spreadsheetId, url: spreadsheetUrl } = await getOrInitializeSyncSpreadsheet(
      accessToken, 
      options
    );

    // Resolve Firebase user or fallback profile
    const fbUser = auth.currentUser;
    const clientEnv = parseClientEnvironment();

    const profileData: UserProfileSyncData = {
      uid: profileOverride?.uid || fbUser?.uid || 'anonymous-user',
      email: profileOverride?.email || fbUser?.email || 'guest@mosmaster.edu.vn',
      displayName: profileOverride?.displayName || fbUser?.displayName || 'Học viên MOS',
      role: profileOverride?.role || 'student',
      avatarUrl: profileOverride?.avatarUrl || fbUser?.photoURL || undefined,
      phoneNumber: profileOverride?.phoneNumber || fbUser?.phoneNumber || undefined,
      studentId: profileOverride?.studentId || undefined,
      schoolOrOrg: profileOverride?.schoolOrOrg || 'Trung Tâm Khảo Thí MOS',
      createdAt: profileOverride?.createdAt || fbUser?.metadata?.creationTime || timestamp,
      lastLoginAt: timestamp,
    };

    const isEmailVerified = fbUser?.emailVerified ?? Boolean(profileOverride?.email);
    const providerId = fbUser?.providerData?.[0]?.providerId || 'password';

    const secureRandomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().substring(0, 8).toUpperCase()
      : `${Date.now()}`;

    const sessionData: UserSessionAuthData = {
      sessionId: `SES-${Date.now()}-${secureRandomSuffix}`,
      providerId: providerId,
      emailVerified: isEmailVerified,
      loginTimestamp: timestamp,
      clientUserAgent: clientEnv.userAgent,
      deviceType: clientEnv.deviceType,
      operatingSystem: clientEnv.operatingSystem,
      browser: clientEnv.browser,
      screenResolution: clientEnv.screenResolution,
      authStatus: 'Active',
    };

    // 1. Sync Profile Row (Upsert)
    const profileAction = await syncUserProfileToSheet(
      accessToken,
      spreadsheetId,
      profileData,
      isEmailVerified,
      options.profileSheetName || DEFAULT_PROFILE_SHEET
    );

    // 2. Log Session Row (Append)
    const sessionRowAdded = await logAuthSessionToSheet(
      accessToken,
      spreadsheetId,
      profileData,
      sessionData,
      options.sessionLogSheetName || DEFAULT_SESSION_SHEET
    );

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      profileAction,
      sessionRowAdded,
      timestamp,
    };
  } catch (error: any) {
    const isCancelled = error?.message?.includes('đã bị đóng') || error?.code === 'auth/popup-closed-by-user';
    const is401 = error?.message?.includes('401') || error?.status === 401;

    if (is401) {
      clearStoredGoogleToken();
    }

    if (isCancelled || is401) {
      console.warn('[UserProfileSheetSync] Sync deferred or token expired:', error?.message || error);
    } else {
      console.warn('[UserProfileSheetSync] Profile sync deferred:', error?.message || error);
    }

    return {
      success: false,
      error: error.message || 'Lỗi không xác định khi đồng bộ lên Google Sheets',
      timestamp,
    };
  }
}
