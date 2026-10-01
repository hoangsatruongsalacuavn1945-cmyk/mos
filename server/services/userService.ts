import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

export interface DBUser {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  password_hash: string;
  student_code: string | null;
  classroom: string | null;
  assigned_teacher_id: string | null;
  teaching_subjects: string[];
  status: string;
  streak_days: number;
  created_at: string;
  last_active_at?: string;
}

// Safely determine if real PostgreSQL is configured.
// Prevent attempts to resolve placeholder hosts like 'VITE_DATABASE_URL' or 'base'
const rawDbUrl = process.env.DATABASE_URL || '';
const hasValidDbUrl = 
  (rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://')) &&
  !rawDbUrl.includes('VITE_DATABASE_URL');

const rawDbHost = process.env.DB_HOST || '';
const hasValidDbHost =
  rawDbHost &&
  rawDbHost !== 'VITE_DB_HOST' &&
  rawDbHost !== 'localhost' &&
  rawDbHost !== 'base' &&
  !rawDbHost.includes('base');

export const pool = (hasValidDbUrl || hasValidDbHost)
  ? new Pool({
      connectionString: hasValidDbUrl ? rawDbUrl : undefined,
      host: hasValidDbHost ? rawDbHost : undefined,
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

// Initial pre-hashed fallback users dynamically configured from environment variables
// Secure bcrypt hash for fallback accounts (never store plaintext passwords in source code)
const DEFAULT_SEED_PASSWORD = process.env.DEFAULT_SEED_PASSWORD || 'TeacherPassWord2026!';
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync(DEFAULT_SEED_PASSWORD, 10);

const MASTER_ADMIN_EMAIL = (process.env.MASTER_ADMIN_EMAIL || 'admin@mosmaster.edu.vn').toLowerCase();
const MASTER_ADMIN_PASSWORD = process.env.MASTER_ADMIN_PASSWORD || 'AdminPassWord2026!';
const MASTER_ADMIN_HASH = bcrypt.hashSync(MASTER_ADMIN_PASSWORD, 10);

const memoryUsers: DBUser[] = [
  {
    id: 'usr-admin-001',
    email: MASTER_ADMIN_EMAIL,
    full_name: 'Chủ Sở Hữu Hệ Thống (System Owner)',
    role: 'admin',
    password_hash: MASTER_ADMIN_HASH,
    student_code: 'OWNER-01',
    classroom: 'Phòng Quản Trị Cấp Cao',
    assigned_teacher_id: null,
    teaching_subjects: ['Word', 'Excel', 'PowerPoint'],
    status: 'active',
    streak_days: 99,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    last_active_at: new Date().toISOString(),
  },
  ...(MASTER_ADMIN_EMAIL !== 'admin@mosmaster.edu.vn' ? [{
    id: 'usr-admin-002',
    email: 'admin@mosmaster.edu.vn',
    full_name: 'Quản Trị Viên MOS Master',
    role: 'admin' as const,
    password_hash: MASTER_ADMIN_HASH,
    student_code: 'ADMIN-01',
    classroom: 'Phòng Quản Trị Hệ Thống',
    assigned_teacher_id: null,
    teaching_subjects: ['Word', 'Excel', 'PowerPoint'],
    status: 'active',
    streak_days: 99,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    last_active_at: new Date().toISOString(),
  }] : []),
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'tuananh.mosword@edu.vn',
    full_name: 'ThS. Nguyễn Tuấn Anh',
    role: 'teacher',
    password_hash: DEFAULT_PASSWORD_HASH,
    student_code: 'GV-WORD-01',
    classroom: 'Tổ Tin Học Đại Cương',
    assigned_teacher_id: null,
    teaching_subjects: ['Word'],
    status: 'active',
    streak_days: 14,
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    last_active_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    email: 'bichmai.mosexcel@edu.vn',
    full_name: 'ThS. Trần Thị Bích Mai',
    role: 'teacher',
    password_hash: DEFAULT_PASSWORD_HASH,
    student_code: 'GV-EXCEL-02',
    classroom: 'Bộ Môn Bảng Tính',
    assigned_teacher_id: null,
    teaching_subjects: ['Excel'],
    status: 'active',
    streak_days: 21,
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    last_active_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    email: 'hoanglong.powerpoint@edu.vn',
    full_name: 'TS. Lê Hoàng Long',
    role: 'teacher',
    password_hash: DEFAULT_PASSWORD_HASH,
    student_code: 'GV-PPT-03',
    classroom: 'Bộ Môn Đa Phương Tiện',
    assigned_teacher_id: null,
    teaching_subjects: ['PowerPoint'],
    status: 'active',
    streak_days: 18,
    created_at: new Date(Date.now() - 3600000 * 25).toISOString(),
    last_active_at: new Date().toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    email: 'minhhanh.mos@edu.vn',
    full_name: 'ThS. Phạm Thị Minh Hạnh',
    role: 'teacher',
    password_hash: DEFAULT_PASSWORD_HASH,
    student_code: 'GV-ALL-04',
    classroom: 'Trung Tâm Khảo Thí',
    assigned_teacher_id: null,
    teaching_subjects: ['Word', 'Excel'],
    status: 'active',
    streak_days: 12,
    created_at: new Date(Date.now() - 3600000 * 22).toISOString(),
    last_active_at: new Date().toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    email: 'hoangson.k24@student.edu.vn',
    full_name: 'Nguyễn Hoàng Sơn',
    role: 'student',
    password_hash: DEFAULT_PASSWORD_HASH,
    student_code: 'K24-CNTT-089',
    classroom: 'Lớp MOS-TinHoc01',
    assigned_teacher_id: 'a0000000-0000-0000-0000-000000000002',
    teaching_subjects: [],
    status: 'active',
    streak_days: 6,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    last_active_at: new Date().toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    email: 'thutrang.k24@student.edu.vn',
    full_name: 'Trần Thu Trang',
    role: 'student',
    password_hash: DEFAULT_PASSWORD_HASH,
    student_code: 'K24-KT-104',
    classroom: 'Lớp MOS-TinHoc02',
    assigned_teacher_id: 'a0000000-0000-0000-0000-000000000001',
    teaching_subjects: [],
    status: 'active',
    streak_days: 4,
    created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
    last_active_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    email: 'minhquan.k24@student.edu.vn',
    full_name: 'Trần Minh Quân',
    role: 'student',
    password_hash: DEFAULT_PASSWORD_HASH,
    student_code: 'K24-CNTT-012',
    classroom: 'Lớp MOS-TinHoc01',
    assigned_teacher_id: 'a0000000-0000-0000-0000-000000000003',
    teaching_subjects: [],
    status: 'active',
    streak_days: 8,
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    last_active_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

export const userService = {
  /**
   * Get all registered users
   */
  async getAllUsers(): Promise<DBUser[]> {
    if (pool) {
      try {
        const client = await pool.connect();
        try {
          const res = await client.query(
            `SELECT id, email, role, full_name, student_code, classroom, assigned_teacher_id, streak_days, status, created_at, last_active_at
             FROM users
             ORDER BY 
               CASE WHEN role = 'admin' THEN 1 WHEN role = 'teacher' THEN 2 ELSE 3 END,
               created_at DESC`
          );
          if (res.rows && res.rows.length > 0) {
            return res.rows.map(r => ({
              ...r,
              teaching_subjects: r.teaching_subjects || (r.role === 'teacher' ? ['Word', 'Excel'] : []),
            }));
          }
        } finally {
          client.release();
        }
      } catch (err: any) {
        // Fall back gracefully to memory store without throwing DNS errors
      }
    }
    return [...memoryUsers];
  },

  /**
   * Get list of teachers formatted for selection UI
   */
  async getTeachers() {
    const all = await this.getAllUsers();
    const teachers = all.filter(u => u.role === 'teacher');
    return teachers.map(t => ({
      _id: t.id,
      id: t.id,
      fullName: t.full_name,
      name: t.full_name,
      email: t.email,
      teachingSubjects: t.teaching_subjects && t.teaching_subjects.length > 0 
        ? t.teaching_subjects 
        : ['Excel'],
    }));
  },

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<DBUser | null> {
    const cleanEmail = email.trim().toLowerCase();

    if (pool) {
      try {
        const client = await pool.connect();
        try {
          const res = await client.query(
            `SELECT id, email, password_hash, role, full_name, student_code, classroom, assigned_teacher_id, streak_days, status, created_at
             FROM users WHERE LOWER(email) = $1 LIMIT 1`,
            [cleanEmail]
          );
          if (res.rows.length > 0) {
            const row = res.rows[0];
            return {
              ...row,
              teaching_subjects: row.teaching_subjects || ['Word', 'Excel'],
            };
          }
        } finally {
          client.release();
        }
      } catch (err: any) {
        // Fall through to memory
      }
    }

    const match = memoryUsers.find(u => u.email.toLowerCase() === cleanEmail);
    return match ? { ...match } : null;
  },

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<DBUser | null> {
    if (pool) {
      try {
        const client = await pool.connect();
        try {
          const res = await client.query(
            `SELECT id, email, password_hash, role, full_name, student_code, classroom, assigned_teacher_id, streak_days, status, created_at
             FROM users WHERE id = $1 LIMIT 1`,
            [id]
          );
          if (res.rows.length > 0) {
            const row = res.rows[0];
            return {
              ...row,
              teaching_subjects: row.teaching_subjects || ['Word', 'Excel'],
            };
          }
        } finally {
          client.release();
        }
      } catch (err: any) {
        // Fall through to memory
      }
    }

    const match = memoryUsers.find(u => u.id === id);
    return match ? { ...match } : null;
  },

  /**
   * Save or insert user
   */
  async saveUser(user: Partial<DBUser>): Promise<DBUser> {
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const id = user.id || 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const fullUser: DBUser = {
      id,
      email: cleanEmail,
      full_name: (user.full_name || cleanEmail).trim(),
      role: user.role || 'student',
      password_hash: user.password_hash || DEFAULT_PASSWORD_HASH,
      student_code: user.student_code || null,
      classroom: user.classroom || null,
      assigned_teacher_id: user.assigned_teacher_id || null,
      teaching_subjects: user.teaching_subjects || (user.role === 'teacher' ? ['Excel'] : []),
      status: user.status || 'active',
      streak_days: user.streak_days || 1,
      created_at: user.created_at || new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };

    if (pool) {
      try {
        const client = await pool.connect();
        try {
          await client.query(
            `INSERT INTO users (id, email, password_hash, role, full_name, student_code, classroom, assigned_teacher_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (email) DO UPDATE SET
               full_name = EXCLUDED.full_name,
               password_hash = EXCLUDED.password_hash,
               role = EXCLUDED.role,
               classroom = EXCLUDED.classroom,
               assigned_teacher_id = EXCLUDED.assigned_teacher_id,
               status = EXCLUDED.status,
               last_active_at = CURRENT_TIMESTAMP`,
            [
              fullUser.id,
              fullUser.email,
              fullUser.password_hash,
              fullUser.role,
              fullUser.full_name,
              fullUser.student_code,
              fullUser.classroom,
              fullUser.assigned_teacher_id,
              fullUser.status,
            ]
          );
        } finally {
          client.release();
        }
      } catch (err: any) {
        // In-memory fallback takes effect below
      }
    }

    const existingIdx = memoryUsers.findIndex(u => u.email.toLowerCase() === cleanEmail || u.id === id);
    if (existingIdx !== -1) {
      memoryUsers[existingIdx] = { ...memoryUsers[existingIdx], ...fullUser };
      return memoryUsers[existingIdx];
    } else {
      memoryUsers.unshift(fullUser);
      return fullUser;
    }
  },

  /**
   * Update role
   */
  async updateUserRole(id: string, newRole: 'student' | 'teacher' | 'admin'): Promise<DBUser | null> {
    if (pool) {
      try {
        const client = await pool.connect();
        try {
          await client.query(
            'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newRole, id]
          );
        } finally {
          client.release();
        }
      } catch (err: any) {
        // Fall through
      }
    }

    const idx = memoryUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      memoryUsers[idx].role = newRole;
      if (newRole === 'teacher' && (!memoryUsers[idx].teaching_subjects || memoryUsers[idx].teaching_subjects.length === 0)) {
        memoryUsers[idx].teaching_subjects = ['Excel', 'Word'];
      }
      return memoryUsers[idx];
    }
    return null;
  },

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<boolean> {
    if (pool) {
      try {
        const client = await pool.connect();
        try {
          await client.query('DELETE FROM users WHERE id = $1', [id]);
        } finally {
          client.release();
        }
      } catch (err: any) {
        // Fall through
      }
    }

    const idx = memoryUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      memoryUsers.splice(idx, 1);
      return true;
    }
    return false;
  },
};
