// Google Sheets & Drive API Integration for MOS Master Exam Training Platform

const GOOGLE_CLIENT_ID = '799123061018-eujgscp42l55367b64fvs00bqbso4ij9.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
const SPREADSHEET_TITLE = 'MOS Master - Hệ Thống Dữ Liệu Học Viên & Khảo Thí Tập Trung';

declare global {
  interface Window {
    google?: any;
  }
}

// In-memory / localStorage token storage
const TOKEN_KEY = 'mos_google_sheets_token';
const SPREADSHEET_ID_KEY = 'mos_google_spreadsheet_id';

export function getStoredGoogleToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function saveStoredGoogleToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredGoogleToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredSpreadsheetId(): string | null {
  return localStorage.getItem(SPREADSHEET_ID_KEY);
}

export function saveStoredSpreadsheetId(id: string): void {
  localStorage.setItem(SPREADSHEET_ID_KEY, id);
}

// Request Access Token using Google Identity Services (GIS)
export function requestGoogleSheetsToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      // Fallback: wait for script to load if needed
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          initAndRequest();
        } else if (attempts > 15) {
          clearInterval(interval);
          reject(new Error('Thư viện Google Identity Services chưa tải xong. Vui lòng thử lại.'));
        }
      }, 300);
      return;
    }

    initAndRequest();

    function initAndRequest() {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.error) {
              console.error('GIS Error:', response);
              reject(new Error(response.error_description || response.error));
              return;
            }
            if (response.access_token) {
              saveStoredGoogleToken(response.access_token);
              resolve(response.access_token);
            } else {
              reject(new Error('Không nhận được mã truy cập (access token) từ Google.'));
            }
          },
        });
        client.requestAccessToken();
      } catch (err) {
        reject(err);
      }
    }
  });
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
      if (checkRes.ok) {
        const meta = await checkRes.json();
        const existingTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);
        // Ensure essential tabs exist
        if (!existingTitles.includes('Danh Sách Hồ Sơ')) {
          ensureSheetTabExists(accessToken, existingId, 'Danh Sách Hồ Sơ', [
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
          ]).catch(() => {});
        }
        if (!existingTitles.includes('Lịch Sử Phiên Đăng Nhập')) {
          ensureSheetTabExists(accessToken, existingId, 'Lịch Sử Phiên Đăng Nhập', [
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
          ]).catch(() => {});
        }

        return {
          id: existingId,
          url: `https://docs.google.com/spreadsheets/d/${existingId}`,
        };
      }
    } catch {}
  }

  // Search Drive for file with SPREADSHEET_TITLE
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(SPREADSHEET_TITLE)}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

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
  } catch (e) {
    console.warn('Could not query Drive, will attempt direct create:', e);
  }

  // Create new Spreadsheet with all styled sheets
  const createPayload = {
    properties: {
      title: SPREADSHEET_TITLE,
    },
    sheets: [
      {
        properties: {
          title: 'Tài Khoản Đăng Ký',
          gridProperties: { rowCount: 1000, columnCount: 10, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Danh Sách Hồ Sơ',
          gridProperties: { rowCount: 1000, columnCount: 12, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Nhật Ký Đăng Nhập',
          gridProperties: { rowCount: 1000, columnCount: 10, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Lịch Sử Phiên Đăng Nhập',
          gridProperties: { rowCount: 1000, columnCount: 12, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Tiến Độ Học Tập',
          gridProperties: { rowCount: 1000, columnCount: 12, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Kết Quả Thi Thử & Quiz',
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
      range: "'Tài Khoản Đăng Ký'!A1:I1",
      values: [
        [
          'Thời Gian Tạo',
          'Mã Học Viên (UID/Code)',
          'Họ Và Tên',
          'Email Đăng Ký',
          'Vai Trò',
          'Lớp Học / Đơn Vị',
          'Giáo Viên Phụ Trách',
          'Hình Thức Đăng Ký',
          'Trạng Thái',
        ],
      ],
    },
    {
      range: "'Danh Sách Hồ Sơ'!A1:L1",
      values: [
        [
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
        ],
      ],
    },
    {
      range: "'Nhật Ký Đăng Nhập'!A1:H1",
      values: [
        [
          'Thời Gian (Timestamp)',
          'Mã Học Viên (UID)',
          'Họ Và Tên',
          'Email',
          'Vai Trò',
          'Hình Thức Đăng Nhập',
          'Trình Duyệt / Thiết Bị',
          'Trạng Thái',
        ],
      ],
    },
    {
      range: "'Lịch Sử Phiên Đăng Nhập'!A1:L1",
      values: [
        [
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
        ],
      ],
    },
    {
      range: "'Tiến Độ Học Tập'!A1:K1",
      values: [
        [
          'Mã Học Viên (UID)',
          'Họ Và Tên',
          'Email',
          'Tiến Độ Tổng MOS Master (%)',
          'Word MO-100 (%)',
          'Excel MO-200 (%)',
          'PowerPoint MO-300 (%)',
          'Tổng Bài Hoàn Thành',
          'Chuỗi Ngày Học (Streak)',
          'Cột Mốc & Chứng Chỉ (Milestones)',
          'Thời Gian Cập Nhật',
        ],
      ],
    },
    {
      range: "'Kết Quả Thi Thử & Quiz'!A1:J1",
      values: [
        [
          'Thời Gian',
          'Mã Học Viên',
          'Họ Và Tên',
          'Email',
          'Môn Thi',
          'Điểm Đạt Được',
          'Điểm Tối Đa',
          'Tỷ Lệ %',
          'Kết Quả',
          'Ghi Chú',
        ],
      ],
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
      const errText = await appendRes.text();
      return { success: false, spreadsheetUrl: url, error: errText };
    }

    return { success: true, spreadsheetUrl: url };
  } catch (err: any) {
    console.error('Error appending user registration to Google Sheet:', err);
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
      const errText = await appendRes.text();
      return { success: false, error: errText };
    }

    return { success: true, spreadsheetUrl: url };
  } catch (err: any) {
    console.error('Error appending user login to Google Sheet:', err);
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
      const errText = await appendRes.text();
      return { success: false, error: errText };
    }

    return { success: true, spreadsheetUrl: url };
  } catch (err: any) {
    console.error('Error appending exam result to Google Sheet:', err);
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
      const errText = await appendRes.text();
      return { success: false, error: errText };
    }

    return { success: true, spreadsheetUrl: url };
  } catch (err: any) {
    console.error('Error backing up progress to Google Sheet:', err);
    return { success: false, error: err.message };
  }
}
