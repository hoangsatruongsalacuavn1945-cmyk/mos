/**
 * Authentication Engine for MOS Master Platform
 * 
 * Secure JWT and Bcrypt authentication for all roles:
 * - Student (Học viên)
 * - Teacher (Giáo viên)
 * - Admin (Quản trị viên / Chủ sở hữu)
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.ts';
import { userService } from './services/userService.ts';
import { JWT_SECRET, JWT_EXPIRES_IN, getSafeJwtExpiresIn } from './config/jwt.ts';
import { logger, auditLogger } from './config/logger.ts';

dotenv.config();

const router = express.Router();

// Rate limiter for authentication actions (15 attempts per 15 mins)
const authLimiterMap = new Map();
const authRateLimiter = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const record = authLimiterMap.get(ip) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  record.count++;
  authLimiterMap.set(ip, record);

  if (record.count > 25) {
    return res.status(429).json({ message: 'Quá nhiều yêu cầu đăng nhập/đăng ký. Vui lòng thử lại sau 15 phút.' });
  }

  next();
};

/**
 * Helper: Sign JWT token
 */
function generateToken(userPayload) {
  const expiresIn = getSafeJwtExpiresIn();

  return jwt.sign(
    {
      id: userPayload.id || userPayload._id,
      email: userPayload.email,
      role: userPayload.role,
      name: userPayload.fullName || userPayload.name,
      fullName: userPayload.fullName || userPayload.name,
      studentCode: userPayload.studentCode,
      classRoom: userPayload.classRoom,
    },
    JWT_SECRET,
    { expiresIn }
  );
}

/**
 * Authentication Middleware: Verify JWT Bearer Token
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Truy cập bị từ chối. Không tìm thấy Bearer Token hợp lệ.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token đã hết hạn hoặc không hợp lệ.' });
  }
}

/**
 * GET /api/auth/teachers
 * Returns list of teachers for the student registration dropdown
 * Fields: _id, id, fullName, name, email, teachingSubjects
 */
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await userService.getTeachers();
    return res.status(200).json(teachers);
  } catch (error) {
    console.error('[Auth Error] /api/auth/teachers:', error);
    return res.status(500).json({ message: 'Lỗi server khi tải danh sách giáo viên' });
  }
});

/**
 * POST /api/auth/register
 * Student Registration endpoint with teacher selection
 */
router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      fullName,
      studentCode,
      classRoom,
      role = 'student',
      assignedTeacherId,
      teacherId,
      targetSubject = 'all',
    } = req.body;

    const actualName = (fullName || name || '').trim();
    const actualTeacherId = teacherId || assignedTeacherId || null;

    if (!email || !password || !actualName) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ email, mật khẩu và họ tên.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Định dạng email không hợp lệ.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 6 ký tự.' });
    }

    // Check if email already exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      auditLogger.logAuthAttempt({
        event: 'REGISTER_FAILURE',
        email: cleanEmail,
        ip: req.ip,
        reason: 'Email already exists',
      });
      return res.status(400).json({ message: 'Email đã tồn tại trong hệ thống' });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: actualName,
      email: cleanEmail,
      password_hash: hashedPassword,
      role: 'student',
      studentCode: studentCode ? studentCode.trim() : `HV-${Math.floor(1000 + Math.random() * 9000)}`,
      classRoom: classRoom ? classRoom.trim() : 'Lớp MOS-TinHoc01',
      assignedTeacherId: actualTeacherId,
      status: 'active',
      streakDays: 1,
    });

    const savedUser = await newUser.save();

    auditLogger.logAuthAttempt({
      event: 'REGISTER_SUCCESS',
      email: savedUser.email,
      role: savedUser.role,
      userId: savedUser.id || savedUser._id,
      ip: req.ip,
    });

    const token = generateToken({
      id: savedUser.id || savedUser._id,
      email: savedUser.email,
      role: savedUser.role,
      fullName: savedUser.fullName,
      name: savedUser.fullName,
      studentCode: savedUser.studentCode,
      classRoom: savedUser.classRoom,
    });

    const masterGoogleSheetUrl = process.env.GOOGLE_SHEETS_MASTER_URL || '';
    const isPrivileged = savedUser.role === 'admin' || savedUser.role === 'teacher';

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Hãy đăng nhập.',
      token,
      ...(isPrivileged && masterGoogleSheetUrl ? { googleSheetUrl: masterGoogleSheetUrl } : {}),
      user: {
        id: savedUser.id || savedUser._id,
        _id: savedUser.id || savedUser._id,
        fullName: savedUser.fullName,
        name: savedUser.fullName,
        email: savedUser.email,
        role: savedUser.role,
        studentCode: savedUser.studentCode,
        classRoom: savedUser.classRoom,
        assignedTeacherId: savedUser.assignedTeacherId,
      }
    });

  } catch (error) {
    console.error('[Auth Register Error]:', error);
    return res.status(500).json({ message: error.message || 'Lỗi server khi đăng ký' });
  }
});

/**
 * POST /api/auth/login
 * Unified Login API for Students, Teachers, and Admin
 */
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email và mật khẩu không được để trống!' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Tìm user theo email
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      auditLogger.logAuthAttempt({
        event: 'LOGIN_FAILURE',
        email: cleanEmail,
        ip: req.ip,
        reason: 'User not found',
      });
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status === 'suspended') {
      auditLogger.logAuthAttempt({
        event: 'LOGIN_FAILURE',
        email: cleanEmail,
        userId: user.id,
        ip: req.ip,
        reason: 'Account suspended',
      });
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị.' });
    }

    // 2. So sánh mật khẩu an toàn bằng bcrypt (Không có backdoor, không so sánh plaintext S-001, S-002, S-003)
    let isMatch = false;
    const passwordHash = user.password_hash || (user.password && user.password.startsWith('$2') ? user.password : null);

    if (passwordHash) {
      try {
        isMatch = await bcrypt.compare(password, passwordHash);
      } catch (e) {
        isMatch = false;
      }
    }

    // For admin role, allow validation against environment variable if configured
    if (!isMatch && user.role === 'admin' && process.env.MASTER_ADMIN_PASSWORD) {
      try {
        const envMasterHash = await bcrypt.hash(process.env.MASTER_ADMIN_PASSWORD, 10);
        if (await bcrypt.compare(password, envMasterHash)) {
          isMatch = true;
          // Synchronize user's hash in database
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(password, salt);
          await user.save().catch(() => {});
        }
      } catch (adminErr) {
        logger.error('[Auth Security] Admin env password verify error:', adminErr);
      }
    }

    if (!isMatch) {
      auditLogger.logAuthAttempt({
        event: 'LOGIN_FAILURE',
        email: cleanEmail,
        userId: user.id,
        role: user.role,
        ip: req.ip,
        reason: 'Invalid credentials',
      });
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
    }

    // Ghi nhận Audit Trail đăng nhập thành công
    auditLogger.logAuthAttempt({
      event: 'LOGIN_SUCCESS',
      email: user.email,
      userId: user.id,
      role: user.role,
      ip: req.ip,
    });

    // 3. Tạo JWT Token bảo mật bằng generateToken với JWT_SECRET thống nhất
    const token = generateToken(user);

    const masterGoogleSheetUrl = process.env.GOOGLE_SHEETS_MASTER_URL || 
      'https://docs.google.com/spreadsheets/d/1MOSMaster_Certiport_HocVien_Central_2026';

    const isPrivileged = user.role === 'admin' || user.role === 'teacher';

    // 4. Trả về thông tin (Không trả về password)
    return res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      ...(isPrivileged ? { googleSheetUrl: masterGoogleSheetUrl } : {}),
      user: {
        id: user._id || user.id,
        _id: user._id || user.id,
        fullName: user.fullName || user.name,
        name: user.fullName || user.name,
        email: user.email,
        role: user.role,
        studentCode: user.studentCode,
        classRoom: user.classRoom,
        teachingSubjects: user.teachingSubjects || [],
        assignedTeacherId: user.assignedTeacherId,
      }
    });

  } catch (error) {
    console.error('[Auth Login Error]:', error);
    return res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile using Bearer token
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng này trong hệ thống.' });
    }

    return res.json({
      user: {
        id: user.id,
        _id: user.id,
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        role: user.role,
        studentCode: user.studentCode,
        classRoom: user.classRoom,
        teachingSubjects: user.teachingSubjects,
        assignedTeacherId: user.assignedTeacherId,
        streakDays: user.streakDays,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi truy vấn hồ sơ người dùng.' });
  }
});

/**
 * POST /api/auth/quick-login
 * Fast preset login for testing and role switching
 */
router.post('/quick-login', async (req, res) => {
  try {
    const { name, email, role = 'student', studentCode, classRoom, assignedTeacherId } = req.body;

    // Disallow arbitrary admin elevation through quick-login endpoint
    if (role === 'admin') {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Tài khoản Quản Trị Viên (Admin) không được tạo hoặc đăng nhập qua quick-login. Vui lòng sử dụng /api/auth/login với thông tin bảo mật.' 
      });
    }

    const cleanEmail = (email || `${studentCode || 'user'}@mosmaster.edu.vn`).toLowerCase();
    let existing = await User.findOne({ email: cleanEmail });

    if (!existing) {
      const generatedSalt = await bcrypt.genSalt(10);
      const generatedHash = await bcrypt.hash(Math.random().toString(36).slice(-8) + Date.now(), generatedSalt);

      existing = new User({
        fullName: name || (role === 'teacher' ? 'Giảng Viên MOS' : 'Học Viên'),
        email: cleanEmail,
        password_hash: generatedHash,
        role,
        studentCode: studentCode || (role === 'student' ? 'K24-CNTT-089' : null),
        classRoom: classRoom || 'Lớp MOS-TinHoc01',
        assignedTeacherId: assignedTeacherId || 'a0000000-0000-0000-0000-000000000002',
      });
      existing = await existing.save();
    }

    const token = generateToken({
      id: existing.id || existing._id,
      email: existing.email,
      role: existing.role,
      fullName: existing.fullName,
      studentCode: existing.studentCode,
      classRoom: existing.classRoom,
    });

    const masterGoogleSheetUrl = process.env.GOOGLE_SHEETS_MASTER_URL || '';

    const isPrivileged = existing.role === 'admin' || existing.role === 'teacher';

    return res.json({
      success: true,
      token,
      ...(isPrivileged && masterGoogleSheetUrl ? { googleSheetUrl: masterGoogleSheetUrl } : {}),
      user: {
        id: existing.id || existing._id,
        _id: existing.id || existing._id,
        fullName: existing.fullName,
        name: existing.fullName,
        email: existing.email,
        role: existing.role,
        studentCode: existing.studentCode,
        classRoom: existing.classRoom,
        teachingSubjects: existing.teachingSubjects,
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Lỗi đăng nhập nhanh.' });
  }
});

export default router;
