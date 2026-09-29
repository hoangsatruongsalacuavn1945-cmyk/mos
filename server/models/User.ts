import bcrypt from 'bcryptjs';
import { userService, DBUser } from '../services/userService.ts';

export interface IUserModel {
  _id?: string;
  id?: string;
  fullName: string;
  email: string;
  password?: string;
  password_hash?: string;
  role: 'student' | 'teacher' | 'admin';
  teachingSubjects?: string[];
  studentCode?: string | null;
  classRoom?: string | null;
  assignedTeacherId?: string | null;
  status?: string;
  streakDays?: number;
  createdAt?: string;
}

export class User {
  _id: string;
  id: string;
  fullName: string;
  name: string;
  email: string;
  password?: string;
  password_hash: string;
  role: 'student' | 'teacher' | 'admin';
  teachingSubjects: string[];
  studentCode: string | null;
  classRoom: string | null;
  assignedTeacherId: string | null;
  status: string;
  streakDays: number;
  createdAt: string;

  constructor(data: Partial<IUserModel>) {
    this._id = data._id || data.id || 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    this.id = this._id;
    this.fullName = data.fullName || '';
    this.name = this.fullName;
    this.email = (data.email || '').toLowerCase().trim();
    this.password = data.password;
    this.password_hash = data.password_hash || data.password || '';
    this.role = (data.role as any) || 'student';
    this.teachingSubjects = data.teachingSubjects || [];
    this.studentCode = data.studentCode || null;
    this.classRoom = data.classRoom || null;
    this.assignedTeacherId = data.assignedTeacherId || null;
    this.status = data.status || 'active';
    this.streakDays = data.streakDays || 1;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  async save(): Promise<User> {
    // If password provided and not hashed, hash it
    if (this.password && (!this.password_hash || this.password_hash === this.password)) {
      if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        this.password_hash = await bcrypt.hash(this.password, salt);
      }
    }

    const saved = await userService.saveUser({
      id: this.id,
      email: this.email,
      full_name: this.fullName,
      role: this.role,
      password_hash: this.password_hash,
      teaching_subjects: this.teachingSubjects,
      student_code: this.studentCode,
      classroom: this.classRoom,
      assigned_teacher_id: this.assignedTeacherId,
      status: this.status,
      streak_days: this.streakDays,
      created_at: this.createdAt,
    });

    return new User({
      id: saved.id,
      _id: saved.id,
      fullName: saved.full_name,
      email: saved.email,
      role: saved.role,
      password_hash: saved.password_hash,
      teachingSubjects: saved.teaching_subjects,
      studentCode: saved.student_code,
      classRoom: saved.classroom,
      assignedTeacherId: saved.assigned_teacher_id,
      status: saved.status,
      streakDays: saved.streak_days,
      createdAt: saved.created_at,
    });
  }

  static async findOne(query: { email?: string; id?: string; _id?: string }): Promise<User | null> {
    let raw: DBUser | null = null;
    if (query.email) {
      raw = await userService.findUserByEmail(query.email);
    } else if (query.id || query._id) {
      raw = await userService.findUserById(query.id || query._id!);
    }

    if (!raw) return null;
    return new User({
      id: raw.id,
      _id: raw.id,
      fullName: raw.full_name,
      email: raw.email,
      password_hash: raw.password_hash,
      password: raw.password_hash,
      role: raw.role,
      teachingSubjects: raw.teaching_subjects,
      studentCode: raw.student_code,
      classRoom: raw.classroom,
      assignedTeacherId: raw.assigned_teacher_id,
      status: raw.status,
      streakDays: raw.streak_days,
      createdAt: raw.created_at,
    });
  }

  static async find(query?: { role?: string }): Promise<User[]> {
    const list = await userService.getAllUsers();
    const filtered = query?.role ? list.filter(u => u.role === query.role) : list;
    return filtered.map(raw => new User({
      id: raw.id,
      _id: raw.id,
      fullName: raw.full_name,
      email: raw.email,
      password_hash: raw.password_hash,
      role: raw.role,
      teachingSubjects: raw.teaching_subjects,
      studentCode: raw.student_code,
      classRoom: raw.classroom,
      assignedTeacherId: raw.assigned_teacher_id,
      status: raw.status,
      streakDays: raw.streak_days,
      createdAt: raw.created_at,
    }));
  }
}

export default User;
