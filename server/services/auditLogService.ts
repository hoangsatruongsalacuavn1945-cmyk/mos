/**
 * Backend Audit Log Service
 * Tracks every administrative action executed by 'Owner' (Admin) or 'Teacher' roles:
 * - Role changes (Promote to Teacher, Demote to Student)
 * - User account deletions / status modifications
 * - Teacher creations, updates and removals
 * - Exam creations, question updates and rubric modifications
 * 
 * Persists into PostgreSQL `audit_logs` table with fallback in-memory ring buffer.
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

export interface AuditLogEntry {
  id?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: 'user' | 'teacher' | 'exam' | 'system' | 'question';
  targetId?: string;
  targetName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt?: string;
}

const rawDbUrl = process.env.DATABASE_URL || '';
const hasValidDb = Boolean(
  rawDbUrl && (rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://'))
);

const pool = hasValidDb
  ? new Pool({
      connectionString: rawDbUrl,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'mos_master_db',
      user: process.env.DB_USER || 'mos_admin',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    })
  : null;

class AuditLogService {
  private static instance: AuditLogService | null = null;
  private memoryLogs: AuditLogEntry[] = [];
  private isTableInitialized = false;

  private constructor() {
    // Seed sample initial audit logs for immediate visualization
    this.memoryLogs = [
      {
        id: 'aud-001',
        actorId: 'owner-master-root',
        actorName: 'Chủ Sở Hữu Hệ Thống',
        actorRole: 'admin',
        action: 'SYSTEM_INITIALIZATION',
        targetType: 'system',
        targetId: 'sys-core',
        targetName: 'Hệ Thống Khảo Thí MOS Master',
        details: { mode: 'Production Certiport 365/2019', db: 'PostgreSQL Relational' },
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'aud-002',
        actorId: 'owner-master-root',
        actorName: 'Chủ Sở Hữu Hệ Thống',
        actorRole: 'admin',
        action: 'TEACHER_ASSIGNED',
        targetType: 'teacher',
        targetId: 't-excel-02',
        targetName: 'ThS. Trần Thị Bích Mai',
        details: { subject: 'excel', title: 'Chuyên Gia Huấn Luyện MOS Excel (MO-200)' },
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: 'aud-003',
        actorId: 't-excel-02',
        actorName: 'ThS. Trần Thị Bích Mai',
        actorRole: 'teacher',
        action: 'FEEDBACK_SUBMITTED',
        targetType: 'exam',
        targetId: 'sub-sample-01',
        targetName: 'Bài thi MOS Excel - Thí sinh Trần Minh Quân',
        details: { score: 875, rating: 'excellent' },
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ];

    this.ensureAuditTable();
  }

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  private async ensureAuditTable(): Promise<void> {
    if (!pool || this.isTableInitialized) return;
    try {
      const client = await pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            actor_id VARCHAR(100) NOT NULL,
            actor_name VARCHAR(150) NOT NULL,
            actor_role VARCHAR(50) NOT NULL,
            action VARCHAR(100) NOT NULL,
            target_type VARCHAR(50) NOT NULL,
            target_id VARCHAR(100),
            target_name VARCHAR(150),
            details JSONB DEFAULT '{}'::jsonb,
            ip_address VARCHAR(50),
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        this.isTableInitialized = true;
      } finally {
        client.release();
      }
    } catch (err: any) {
      // Database not reachable yet in local mode
      this.isTableInitialized = false;
    }
  }

  /**
   * Log an administrative action
   */
  public async log(entry: AuditLogEntry): Promise<AuditLogEntry> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: entry.id || 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: entry.createdAt || new Date().toISOString(),
      details: entry.details || {},
    };

    // 1. Store in memory buffer (top newest first)
    this.memoryLogs.unshift(fullEntry);
    if (this.memoryLogs.length > 200) {
      this.memoryLogs = this.memoryLogs.slice(0, 200);
    }

    console.log(
      `[AUDIT_LOG] [${fullEntry.actorRole.toUpperCase()}] ${fullEntry.actorName} performed ` +
      `[${fullEntry.action}] on ${fullEntry.targetType}: ${fullEntry.targetName || 'N/A'}`
    );

    // 2. Persist to PostgreSQL if available
    if (pool) {
      try {
        await this.ensureAuditTable();
        const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO audit_logs (
            actor_id, actor_name, actor_role, action, target_type, target_id, target_name, details, ip_address, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            fullEntry.actorId,
            fullEntry.actorName,
            fullEntry.actorRole,
            fullEntry.action,
            fullEntry.targetType,
            fullEntry.targetId || null,
            fullEntry.targetName || null,
            JSON.stringify(fullEntry.details),
            fullEntry.ipAddress || null,
            fullEntry.createdAt,
          ]
        );
        } finally {
          client.release();
        }
      } catch (err: any) {
        console.warn('[AuditLogService] PostgreSQL log persistence notice:', err.message);
      }
    }

    return fullEntry;
  }

  /**
   * Fetch audit logs with filtering and pagination
   */
  public async getLogs(filter?: {
    action?: string;
    actorRole?: string;
    targetType?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    const limit = filter?.limit || 50;

    // Try reading from PostgreSQL
    if (pool) {
      try {
        const client = await pool.connect();
        try {
          let query = `SELECT id, actor_id, actor_name, actor_role, action, target_type, target_id, target_name, details, ip_address, created_at 
                       FROM audit_logs WHERE 1=1`;
          const params: any[] = [];

          if (filter?.action && filter.action !== 'all') {
            params.push(filter.action);
            query += ` AND action = $${params.length}`;
          }
          if (filter?.actorRole && filter.actorRole !== 'all') {
            params.push(filter.actorRole);
            query += ` AND actor_role = $${params.length}`;
          }
          if (filter?.targetType && filter.targetType !== 'all') {
            params.push(filter.targetType);
            query += ` AND target_type = $${params.length}`;
          }

          query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
          params.push(limit);

          const res = await client.query(query, params);
          if (res.rows.length > 0) {
            return res.rows.map(r => ({
              id: r.id,
              actorId: r.actor_id,
              actorName: r.actor_name,
              actorRole: r.actor_role,
              action: r.action,
              targetType: r.target_type,
              targetId: r.target_id,
              targetName: r.target_name,
              details: r.details,
              ipAddress: r.ip_address,
              createdAt: r.created_at,
            }));
          }
        } finally {
          client.release();
        }
      } catch {
        // Fall through to memory logs
      }
    }

    // Fallback filter on memory logs
    let result = [...this.memoryLogs];
    if (filter?.action && filter.action !== 'all') {
      result = result.filter(l => l.action === filter.action);
    }
    if (filter?.actorRole && filter.actorRole !== 'all') {
      result = result.filter(l => l.actorRole === filter.actorRole);
    }
    if (filter?.targetType && filter.targetType !== 'all') {
      result = result.filter(l => l.targetType === filter.targetType);
    }

    return result.slice(0, limit);
  }
}

export const auditLogService = AuditLogService.getInstance();
export default auditLogService;
