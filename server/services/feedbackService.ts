/**
 * Server-side Feedback, Bug & Website Rating Service
 * 
 * Persists user feedback, bug reports, and screen obstruction issues
 * into PostgreSQL with an in-memory fallback ring buffer for resilient uptime.
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

export interface FeedbackRecord {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  rating: number; // 1 to 5
  category: 'bug_report' | 'screen_display' | 'ui_rating' | 'exam_question' | 'feature_request' | 'other';
  title: string;
  description: string;
  deviceInfo?: string;
  screenResolution?: string;
  pageUrl?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

class FeedbackService {
  private pool: any = null;
  private isPostgresAvailable = false;
  private memoryBuffer: FeedbackRecord[] = [];
  private readonly MAX_BUFFER_SIZE = 500;

  constructor() {
    this.initPool();
    this.seedInitialFeedback();
  }

  private async initPool() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.log('ℹ️ [FeedbackService] No DATABASE_URL found. Operating in-memory mode.');
      return;
    }

    try {
      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      const client = await this.pool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS feedback_reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(100),
          user_name VARCHAR(150),
          user_email VARCHAR(255),
          rating INT NOT NULL DEFAULT 5,
          category VARCHAR(50) NOT NULL DEFAULT 'ui_rating',
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          device_info VARCHAR(255),
          screen_resolution VARCHAR(100),
          page_url VARCHAR(255),
          priority VARCHAR(20) NOT NULL DEFAULT 'normal',
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          admin_notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      client.release();
      this.isPostgresAvailable = true;
      console.log('✅ [FeedbackService] Connected to PostgreSQL feedback_reports table.');
    } catch (err: any) {
      console.warn('⚠️ [FeedbackService] Failed connecting to PostgreSQL. Using in-memory store:', err.message);
      this.isPostgresAvailable = false;
    }
  }

  private seedInitialFeedback() {
    this.memoryBuffer = [
      {
        id: 'fb-001',
        userId: 'student-demo-1',
        userName: 'Nguyễn Văn An',
        userEmail: 'student.demo@mosmaster.edu.vn',
        rating: 5,
        category: 'ui_rating',
        title: 'Giao diện thi thử rất trực quan và giống Certiport!',
        description: 'Em đã thử làm bài thi Word 50 phút, đồng hồ đếm ngược và thanh Ribbon giả lập rất sát với phòng thi thật IIG. Rất mong thầy cô bổ sung thêm đề PowerPoint!',
        deviceInfo: 'Chrome 122.0 / Windows 11',
        screenResolution: '1920x1080',
        pageUrl: '/thi-thu',
        priority: 'normal',
        status: 'resolved',
        adminNotes: 'Đã bổ sung thêm ngân hàng câu hỏi PowerPoint MO-300 theo góp ý.',
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'fb-002',
        userId: 'guest-user-4',
        userName: 'Trần Hoài Nam',
        userEmail: 'nam.tran@gmail.com',
        rating: 4,
        category: 'screen_display',
        title: 'Màn hình laptop nhỏ 1366x768 hơi bị khuất thanh tác vụ dưới',
        description: 'Khi em mở bài thi thử trên laptop màn hình 14 inch độ phân giải 1366x768, thanh dock nộp bài ở dưới hơi bị tràn phải cuộn chuột. Nếu thu gọn thanh công cụ lại một chút sẽ dễ nhìn hơn.',
        deviceInfo: 'Edge 121.0 / Windows 10',
        screenResolution: '1366x768',
        pageUrl: '/thi-thu',
        priority: 'high',
        status: 'reviewing',
        adminNotes: 'Đang tối ưu lại giao diện responsive cho màn hình 1366x768 và 1280x720.',
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
      {
        id: 'fb-003',
        userId: 'student-demo-2',
        userName: 'Lê Thuỳ Dung',
        userEmail: 'dung.le@student.edu.vn',
        rating: 5,
        category: 'feature_request',
        title: 'Thêm tính năng xuất kết quả PDF đẹp mắt',
        description: 'Trang chứng chỉ điện tử MOS rất đẹp, em đã tải được chứng chỉ về khoe gia đình. Hệ thống rất tuyệt vời ạ!',
        deviceInfo: 'Safari 17.2 / macOS Sonoma',
        screenResolution: '1440x900',
        pageUrl: '/ket-qua',
        priority: 'normal',
        status: 'resolved',
        adminNotes: 'Đã hoàn thiện tính năng in chứng chỉ và xuất bảng điểm PDF chuẩn Certiport.',
        createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
    ];
  }

  public async submitFeedback(payload: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    rating?: number;
    category?: 'bug_report' | 'screen_display' | 'ui_rating' | 'exam_question' | 'feature_request' | 'other';
    title: string;
    description: string;
    deviceInfo?: string;
    screenResolution?: string;
    pageUrl?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<FeedbackRecord> {
    const newRecord: FeedbackRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : `fb-${Date.now()}`,
      userId: payload.userId || 'guest',
      userName: payload.userName || 'Người dùng ẩn danh',
      userEmail: payload.userEmail || '',
      rating: Math.min(5, Math.max(1, payload.rating || 5)),
      category: payload.category || 'ui_rating',
      title: payload.title || 'Phản hồi người dùng',
      description: payload.description,
      deviceInfo: payload.deviceInfo || 'Web Browser',
      screenResolution: payload.screenResolution || `${windowFallbackResolution()}`,
      pageUrl: payload.pageUrl || '/',
      priority: payload.priority || 'normal',
      status: 'pending',
      adminNotes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Add to in-memory ring buffer
    this.memoryBuffer.unshift(newRecord);
    if (this.memoryBuffer.length > this.MAX_BUFFER_SIZE) {
      this.memoryBuffer.pop();
    }

    // 2. Persist to PostgreSQL if connected
    if (this.isPostgresAvailable && this.pool) {
      try {
        const query = `
          INSERT INTO feedback_reports (
            id, user_id, user_name, user_email, rating, category,
            title, description, device_info, screen_resolution, page_url, priority, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *;
        `;
        const values = [
          newRecord.id,
          newRecord.userId,
          newRecord.userName,
          newRecord.userEmail,
          newRecord.rating,
          newRecord.category,
          newRecord.title,
          newRecord.description,
          newRecord.deviceInfo,
          newRecord.screenResolution,
          newRecord.pageUrl,
          newRecord.priority,
          newRecord.status,
        ];
        await this.pool.query(query, values);
      } catch (err: any) {
        console.warn('⚠️ [FeedbackService] PostgreSQL insert failed, kept in memory buffer:', err.message);
      }
    }

    return newRecord;
  }

  public async getAllFeedback(filter: {
    status?: string;
    category?: string;
    search?: string;
    limit?: number;
  } = {}): Promise<FeedbackRecord[]> {
    if (this.isPostgresAvailable && this.pool) {
      try {
        let sql = `SELECT * FROM feedback_reports WHERE 1=1`;
        const values: any[] = [];
        let idx = 1;

        if (filter.status && filter.status !== 'all') {
          sql += ` AND status = $${idx++}`;
          values.push(filter.status);
        }

        if (filter.category && filter.category !== 'all') {
          sql += ` AND category = $${idx++}`;
          values.push(filter.category);
        }

        if (filter.search) {
          sql += ` AND (title ILIKE $${idx} OR description ILIKE $${idx} OR user_name ILIKE $${idx})`;
          values.push(`%${filter.search}%`);
          idx++;
        }

        sql += ` ORDER BY created_at DESC LIMIT $${idx}`;
        values.push(filter.limit || 100);

        const result = await this.pool.query(sql, values);
        if (result.rows && result.rows.length > 0) {
          return result.rows.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            userName: r.user_name,
            userEmail: r.user_email,
            rating: r.rating,
            category: r.category,
            title: r.title,
            description: r.description,
            deviceInfo: r.device_info,
            screenResolution: r.screen_resolution,
            pageUrl: r.page_url,
            priority: r.priority,
            status: r.status,
            adminNotes: r.admin_notes,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));
        }
      } catch (err: any) {
        console.warn('⚠️ [FeedbackService] Query failed, falling back to memory buffer:', err.message);
      }
    }

    // Memory buffer filtering fallback
    let items = [...this.memoryBuffer];
    if (filter.status && filter.status !== 'all') {
      items = items.filter(f => f.status === filter.status);
    }
    if (filter.category && filter.category !== 'all') {
      items = items.filter(f => f.category === filter.category);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(f => 
        (f.title && f.title.toLowerCase().includes(q)) ||
        (f.description && f.description.toLowerCase().includes(q)) ||
        (f.userName && f.userName.toLowerCase().includes(q))
      );
    }
    return items.slice(0, filter.limit || 100);
  }

  public async updateFeedbackStatus(
    id: string,
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed',
    adminNotes?: string
  ): Promise<boolean> {
    // 1. Update in-memory
    const item = this.memoryBuffer.find(f => f.id === id);
    if (item) {
      item.status = status;
      if (adminNotes !== undefined) item.adminNotes = adminNotes;
      item.updatedAt = new Date().toISOString();
    }

    // 2. Update in PostgreSQL
    if (this.isPostgresAvailable && this.pool) {
      try {
        const query = `
          UPDATE feedback_reports
          SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = CURRENT_TIMESTAMP
          WHERE id = $3;
        `;
        await this.pool.query(query, [status, adminNotes || null, id]);
        return true;
      } catch (err: any) {
        console.warn('⚠️ [FeedbackService] Update failed in Postgres:', err.message);
      }
    }

    return !!item;
  }

  public async deleteFeedback(id: string): Promise<boolean> {
    const idx = this.memoryBuffer.findIndex(f => f.id === id);
    if (idx !== -1) {
      this.memoryBuffer.splice(idx, 1);
    }

    if (this.isPostgresAvailable && this.pool) {
      try {
        await this.pool.query(`DELETE FROM feedback_reports WHERE id = $1;`, [id]);
        return true;
      } catch (err: any) {
        console.warn('⚠️ [FeedbackService] Delete failed in Postgres:', err.message);
      }
    }

    return true;
  }

  public async getFeedbackStats(): Promise<{
    total: number;
    avgRating: number;
    pendingCount: number;
    resolvedCount: number;
    bugsCount: number;
    screenDisplayCount: number;
  }> {
    const all = await this.getAllFeedback({ limit: 1000 });
    const total = all.length;
    if (total === 0) {
      return { total: 0, avgRating: 5, pendingCount: 0, resolvedCount: 0, bugsCount: 0, screenDisplayCount: 0 };
    }

    const sumRating = all.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    const avgRating = Number((sumRating / total).toFixed(1));
    const pendingCount = all.filter(f => f.status === 'pending').length;
    const resolvedCount = all.filter(f => f.status === 'resolved').length;
    const bugsCount = all.filter(f => f.category === 'bug_report').length;
    const screenDisplayCount = all.filter(f => f.category === 'screen_display').length;

    return {
      total,
      avgRating,
      pendingCount,
      resolvedCount,
      bugsCount,
      screenDisplayCount,
    };
  }
}

function windowFallbackResolution() {
  return '1920x1080 (Desktop)';
}

export const feedbackService = new FeedbackService();
