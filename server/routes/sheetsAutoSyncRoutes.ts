import { Router, Request, Response } from 'express';
import { googleSheetsAutoSyncService } from '../services/googleSheetsAutoSyncService.ts';
import { auditLogService } from '../services/auditLogService.ts';

const router = Router();

// Standard Google Apps Script template for 1-click deployment
const GOOGLE_APPS_SCRIPT_TEMPLATE = `
/**
 * GOOGLE APPS SCRIPT FOR MOS MASTER 24/7 AUTOMATED SHEET SYNC
 * 
 * Hướng Dẫn Cài Đặt (Chỉ làm 1 lần duy nhất trong 60 giây):
 * 1. Mở Bảng tính Google Sheets của bạn.
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa code cũ, dán toàn bộ đoạn mã này vào.
 * 4. Nhấp nút "Triển khai" (Deploy) ở góc trên bên phải -> "Triển khai mới" (New deployment).
 * 5. Chọn loại: "Ứng dụng web" (Web app).
 * 6. Thiết lập:
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me)
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)
 * 7. Nhấp "Triển khai" (Deploy) và sao chép đường link URL Ứng dụng web (có dạng: https://script.google.com/macros/s/.../exec).
 * 8. Dán URL này vào ô Cấu Hình Webhook trên trang quản trị.
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data payload" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = data.sheetName || 'Nhật Ký Tự Động';
    var sheet = ss.getSheetByName(sheetName);

    // Tự động tạo Tab mới nếu chưa có
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      if (data.headers && Array.isArray(data.headers)) {
        sheet.appendRow(data.headers);
        var headerRange = sheet.getRange(1, 1, 1, data.headers.length);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#f1f5f9");
      }
    }

    // Tự động thêm dòng dữ liệu mới
    if (data.row && Array.isArray(data.row)) {
      sheet.appendRow(data.row);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      sheetName: sheetName,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "MOS Master Auto-Sync Webhook",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`.trim();

/**
 * POST /api/sheets/auto-sync
 * Universal client endpoint: enqueue arbitrary event to be synced automatically
 */
router.post('/auto-sync', (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({ error: 'Missing type or data payload.' });
    }

    switch (type) {
      case 'registration':
        googleSheetsAutoSyncService.queueRegistration(data);
        break;
      case 'login':
        googleSheetsAutoSyncService.queueLoginSession(data);
        break;
      case 'quiz':
        googleSheetsAutoSyncService.queueQuizAttempt(data);
        break;
      case 'progress':
        googleSheetsAutoSyncService.queueProgressUpdate(data);
        break;
      case 'feedback':
        googleSheetsAutoSyncService.queueFeedback(data);
        break;
      default:
        if (data.sheetName && data.row) {
          googleSheetsAutoSyncService.enqueue({
            sheetName: data.sheetName,
            headers: data.headers || [],
            row: data.row,
            type: 'activity',
            entityId: data.entityId,
          });
        }
    }

    return res.json({
      success: true,
      message: 'Đã đưa thông tin vào hàng đợi tự động đồng bộ Google Sheets 24/7.',
    });
  } catch (err: any) {
    console.error('[Sheets Auto-Sync Error]:', err);
    return res.status(500).json({ error: err.message || 'Lỗi xử lý tự động đồng bộ.' });
  }
});

/**
 * GET /api/sheets/status
 * Returns current automated sync status, stats, and Apps Script template
 */
router.get('/status', (_req: Request, res: Response) => {
  const stats = googleSheetsAutoSyncService.getStats();
  return res.json({
    success: true,
    stats,
    scriptTemplate: GOOGLE_APPS_SCRIPT_TEMPLATE,
  });
});

/**
 * POST /api/sheets/configure
 * Configures the Google Apps Script Webhook URL and toggle auto-sync
 */
router.post('/configure', async (req: Request, res: Response) => {
  try {
    const { webhookUrl, isAutoSyncEnabled } = req.body;

    if (webhookUrl !== undefined) {
      googleSheetsAutoSyncService.setWebhookUrl(webhookUrl);
    }
    if (isAutoSyncEnabled !== undefined) {
      googleSheetsAutoSyncService.setAutoSyncEnabled(Boolean(isAutoSyncEnabled));
    }

    const stats = googleSheetsAutoSyncService.getStats();
    return res.json({
      success: true,
      message: 'Cập nhật cấu hình tự động đồng bộ Google Sheets thành công.',
      stats,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/sheets/test-sync
 * Dispatches an instant test ping row to verify auto-sync
 */
router.post('/test-sync', (req: Request, res: Response) => {
  try {
    const { userName = 'Quản Trị Viên' } = req.body;

    googleSheetsAutoSyncService.enqueue({
      sheetName: 'Nhật Ký Hoạt Động Chi Tiết',
      headers: [
        'Thời Gian',
        'Mã Hoạt Động',
        'Người Thực Hiện',
        'Hành Động',
        'Kết Quả',
        'Ghi Chú',
      ],
      row: [
        new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        `test-${Date.now()}`,
        userName,
        'Kiểm tra tự động đồng bộ (Test Ping)',
        'Thành công (OK)',
        'Đồng bộ tức thời không cần can thiệp thủ công',
      ],
      type: 'activity',
      entityId: `test-${Date.now()}`,
    });

    return res.json({
      success: true,
      message: 'Đã gửi bản ghi thử nghiệm vào luồng tự động đồng bộ Google Sheets.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
