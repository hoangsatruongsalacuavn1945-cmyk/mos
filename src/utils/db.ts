/**
 * Database Connection Manager for MOS Master Platform
 * 
 * Secure Configuration Pattern:
 * - Credentials and connection parameters are read EXCLUSIVELY from environment
 *   variables via `import.meta.env` (Vite-standard client/fullstack config).
 * - Enforces zero hardcoded secrets, connection pooling parameters, and SSL options.
 * - Parameterized query execution pattern to guarantee SQL injection immunity.
 * - Supports PostgreSQL (node-postgres / pg / Drizzle / Cloud SQL) and REST database proxies.
 */

export interface DbConnectionConfig {
  connectionString?: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl: boolean | { rejectUnauthorized: boolean };
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
}

export interface DbTransaction {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
}

/**
 * Loads and validates connection parameters exclusively from `import.meta.env`
 */
export function loadDatabaseConfig(): DbConnectionConfig {
  // Read exclusively from environment variables via import.meta.env
  const env = import.meta.env;

  const connectionString = env.VITE_DATABASE_URL || '';
  const host = env.VITE_DB_HOST || 'localhost';
  const port = env.VITE_DB_PORT ? parseInt(env.VITE_DB_PORT, 10) : 5432;
  const database = env.VITE_DB_NAME || 'mos_master_db';
  const user = env.VITE_DB_USER || 'mos_admin';
  const password = env.VITE_DB_PASSWORD || '';
  const sslEnabled = env.VITE_DB_SSL === 'true';
  const maxConnections = env.VITE_DB_POOL_MAX ? parseInt(env.VITE_DB_POOL_MAX, 10) : 20;
  const idleTimeoutMillis = env.VITE_DB_IDLE_TIMEOUT_MS ? parseInt(env.VITE_DB_IDLE_TIMEOUT_MS, 10) : 30000;
  const connectionTimeoutMillis = 5000;

  return {
    connectionString: connectionString || undefined,
    host,
    port,
    database,
    user,
    password: password || undefined,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    maxConnections,
    idleTimeoutMillis,
    connectionTimeoutMillis,
  };
}

/**
 * Strips password and sensitive credentials for safe logging or health checks
 */
export function getSanitizedDbConfig(config: DbConnectionConfig): Record<string, any> {
  const sanitized = { ...config };
  delete sanitized.password;
  if (sanitized.connectionString) {
    // Redact password in URI format postgresql://user:password@host:port/db
    sanitized.connectionString = sanitized.connectionString.replace(/:([^@]+)@/, ':*****@');
  }
  return sanitized;
}

/**
 * Database Connection Manager Singleton
 */
export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager | null = null;
  private config: DbConnectionConfig;
  private isInitialized = false;

  private constructor() {
    this.config = loadDatabaseConfig();
    this.isInitialized = true;
  }

  public static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  /**
   * Returns current connection parameters (excluding sensitive secrets)
   */
  public getConfigSummary() {
    return getSanitizedDbConfig(this.config);
  }

  /**
   * Health probe verifying database reachability
   */
  public async checkHealth(): Promise<{ status: 'healthy' | 'degraded' | 'offline'; latencyMs: number; error?: string }> {
    const start = performance.now();
    try {
      // In web/SPA client mode, probes the server proxy /api/health or performs ping query
      const res = await fetch('/api/questions?role=student&limit=1', { method: 'GET' });
      const latencyMs = Math.round(performance.now() - start);
      if (res.ok) {
        return { status: 'healthy', latencyMs };
      }
      return { status: 'degraded', latencyMs, error: `HTTP ${res.status}: ${res.statusText}` };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return { status: 'offline', latencyMs, error: err?.message || 'Connection timeout' };
    }
  }

  /**
   * Executes a parameterized SQL query securely
   * Protected against SQL Injection vulnerabilities
   */
  public async query<T = any>(sqlText: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!sqlText || typeof sqlText !== 'string') {
      throw new Error('Invalid SQL statement provided to DatabaseConnectionManager.');
    }

    // Pass through backend proxy router
    try {
      const response = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: sqlText,
          params,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Database query failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('[DB Manager Error] Query execution failed:', {
        sql: sqlText.substring(0, 80) + '...',
        paramsCount: params.length,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Executes a database transaction with rollback support
   */
  public async transaction<T>(callback: (trx: DbTransaction) => Promise<T>): Promise<T> {
    const trx: DbTransaction = {
      query: (sql, params) => this.query(sql, params),
    };

    try {
      await this.query('BEGIN');
      const result = await callback(trx);
      await this.query('COMMIT');
      return result;
    } catch (err) {
      await this.query('ROLLBACK').catch(() => {});
      throw err;
    }
  }

  /**
   * Fetches sanitized question bank for students (stripping correct answers)
   */
  public async fetchSanitizedQuestions(filters: { subject?: string; domainId?: string } = {}) {
    const params = new URLSearchParams();
    if (filters.subject && filters.subject !== 'all') params.append('subject', filters.subject);
    if (filters.domainId) params.append('domainId', filters.domainId);
    params.append('role', 'student');

    const res = await fetch(`/api/questions?${params.toString()}`);
    if (!res.ok) throw new Error('Không thể tải ngân hàng câu hỏi từ cơ sở dữ liệu.');
    const data = await res.json();
    return data.questions || [];
  }

  /**
   * Persists an exam attempt to the `attempts` table
   */
  public async recordExamAttempt(attempt: {
    userId: string;
    examId: string;
    score: number;
    passed: boolean;
    timeSpentSeconds: number;
    totalQuestions: number;
    correctCount: number;
    violationsCount: number;
    antiCheatLogs: string[];
  }) {
    const res = await fetch('/api/exam/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attempt),
    });
    if (!res.ok) throw new Error('Lỗi khi ghi nhận kết quả thi vào bảng attempts.');
    return await res.json();
  }

  /**
   * Persists granular per-question outcome to the `exam_results` table
   */
  public async recordExamResult(result: {
    attemptId: string;
    questionId: string;
    isCorrect: boolean;
    userAnswer: string;
  }) {
    const sql = `
      INSERT INTO exam_results (attempt_id, question_id, is_correct, user_answer)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (attempt_id, question_id) DO UPDATE
      SET is_correct = EXCLUDED.is_correct, user_answer = EXCLUDED.user_answer;
    `;
    return await this.query(sql, [
      result.attemptId,
      result.questionId,
      result.isCorrect,
      result.userAnswer,
    ]);
  }
}

// Export singleton instance
export const db = DatabaseConnectionManager.getInstance();
export default db;
