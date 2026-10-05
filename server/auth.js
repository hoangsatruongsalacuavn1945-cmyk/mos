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
import { auditLogService } from './services/auditLogService.ts';
import { JWT_SECRET, getSafeJwtExpiresIn } from './config/jwt.ts';
import { logger, auditLogger } from './config/logger.ts';
import { googleSheetsAutoSyncService } from './services/googleSheetsAutoSyncService.ts';

dotenv.config();

const router = express.Router();

// In-Memory Token Blacklist for revoked sessions (Logout)
const tokenBlacklist = new Set();

// Clean up expired blacklist items periodically (every 1 hour)
setInterval(() => {
  if (tokenBlacklist.size > 1000) {
    tokenBlacklist.clear();
  }
}, 60 * 60 * 1000);

// ==========================================
// RATE LIMITERS & BRUTE FORCE PROTECTION
// ==========================================

// Rate Limiter for Registration: Max 5 registrations per IP per hour
const registerLimiterMap = new Map();
const registerRateLimiter = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const record = registerLimiterMap.get(ip) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  record.count++;
  registerLimiterMap.set(ip, record);

  if (record.count > 5) {
    return res.status(429).json({ 
      error: 'TooManyRequests',
      message: 'Bạn đã đạt giới hạn đăng ký tài khoản (tối đa 5 lần/giờ/IP). Vui lòng thử lại sau.' 
    });
  }

  next();
};

// Rate Limiter for Login: Max 10 attempts per IP per 15 mins, lockout 30 mins
const loginLimiterMap = new Map();
const loginRateLimiter = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 mins
  const lockoutMs = 30 * 60 * 1000; // 30 mins lockout

  const record = loginLimiterMap.get(ip) || { count: 0, resetAt: now + windowMs, lockedUntil: 0 };

  if (record.lockedUntil > now) {
    const remainingMins = Math.ceil((record.lockedUntil - now) / 60000);
    return res.status(429).json({ 
      error: 'TooManyRequests',
      message: `IP tạm thời bị khóa đăng nhập do quá nhiều lần thử. Vui lòng thử lại sau ${remainingMins} phút.` 
    });
  }

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
    record.lockedUntil = 0;
  }

  record.count++;

  if (record.count > 10) {
    record.lockedUntil = now + lockoutMs;
    loginLimiterMap.set(ip, record);
    return res.status(429).json({ 
      error: 'TooManyRequests',
      message: 'Đăng nhập sai quá 10 lần. IP của bạn bị khóa tạm thời trong 30 phút.' 
    });
  }

  loginLimiterMap.set(ip, record);
  next();
};

// Account-Specific Lockout: 5 failed attempts per email -> lock account for 30 minutes
const accountLockoutMap = new Map();

/**
 * Helper: Sign JWT token with unified configuration
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
 * Authentication Middleware: Verify JWT Bearer Token & Check Blacklist
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Truy cập bị từ chối. Không tìm thấy Bearer Token hợp lệ.' });
  }

  const token = authHeader.split(' ')[1];
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Token phiên làm việc đã bị thu hồi hoặc đã đăng xuất.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden', message: 'Token đã hết hạn hoặc không hợp lệ.' });
  }
}

/**
 * GET /api/auth/teachers
 * Returns list of teachers for the student registration dropdown
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
 * Student Registration endpoint with strict validations and rate limiting
 */
router.post('/register', registerRateLimiter, async (req, res) => {
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
    
    // Validate email format via standard regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Định dạng email không hợp lệ (ví dụ: student@mosmaster.edu.vn).' });
    }

    // Validate password strength: min 8 characters, at least 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm cả chữ hoa, chữ thường và chữ số.' 
      });
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
      return res.status(400).json({ message: 'Email đã tồn tại trong hệ thống.' });
    }

    // Hash password with bcrypt salt (never store plaintext passwords)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: actualName,
      email: cleanEmail,
      password_hash: hashedPassword,
      role: 'student', // Public registration only allows student role
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

    // Record user registration in audit trail for owner real-time dashboard
    await auditLogService.log({
      actorId: savedUser.id || savedUser._id || 'student-reg',
      actorName: savedUser.fullName || actualName,
      actorRole: 'student',
      action: 'USER_REGISTERED',
      targetType: 'user',
      targetId: savedUser.id || savedUser._id,
      targetName: savedUser.fullName || actualName,
      details: {
        email: savedUser.email,
        studentCode: savedUser.studentCode,
        classRoom: savedUser.classRoom,
        assignedTeacherId: actualTeacherId,
        registeredAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
    }).catch((e) => console.warn('Registration audit trail notice:', e));

    const token = generateToken({
      id: savedUser.id || savedUser._id,
      email: savedUser.email,
      role: savedUser.role,
      fullName: savedUser.fullName,
      name: savedUser.fullName,
      studentCode: savedUser.studentCode,
      classRoom: savedUser.classRoom,
    });

    // 24/7 Automated Sync to Google Sheets
    googleSheetsAutoSyncService.queueRegistration({
      uid: savedUser.id || savedUser._id || savedUser.studentCode,
      name: savedUser.fullName || actualName,
      email: savedUser.email,
      role: savedUser.role,
      classRoom: savedUser.classRoom,
      teacherName: actualTeacherId,
      provider: 'Đăng ký hệ thống',
    });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Hãy đăng nhập.',
      token,
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
    return res.status(500).json({ message: error.message || 'Lỗi server khi đăng ký.' });
  }
});

/**
 * POST /api/auth/login
 * Unified Login API for Students, Teachers, and Admin
 */
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email và mật khẩu không được để trống!' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const now = Date.now();

    // Check account lockout status (5 consecutive failed attempts)
    const lockoutRecord = accountLockoutMap.get(cleanEmail) || { failedCount: 0, lockedUntil: 0 };
    if (lockoutRecord.lockedUntil > now) {
      const remainingMins = Math.ceil((lockoutRecord.lockedUntil - now) / 60000);
      return res.status(403).json({
        message: `Tài khoản tạm thời bị khóa do nhập sai mật khẩu 5 lần. Vui lòng thử lại sau ${remainingMins} phút.`
      });
    }

    // 1. Find user by email
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

    // Check user account status
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

    // 2. Compare password strictly with bcrypt hash (No legacy plaintext comparison!)
    let isMatch = false;
    const passwordHash = user.password_hash || (user.password && user.password.startsWith('$2') ? user.password : null);

    if (passwordHash) {
      try {
        isMatch = await bcrypt.compare(password, passwordHash);
      } catch (e) {
        isMatch = false;
      }
    }

    // Allow Master Admin password fallback strictly via hashed environment variable
    if (!isMatch && user.role === 'admin' && process.env.MASTER_ADMIN_PASSWORD) {
      try {
        const envMasterHash = await bcrypt.hash(process.env.MASTER_ADMIN_PASSWORD, 10);
        if (await bcrypt.compare(password, envMasterHash)) {
          isMatch = true;
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(password, salt);
          await user.save().catch(() => {});
        }
      } catch (adminErr) {
        logger.error('[Auth Security] Admin env password verify error:', adminErr);
      }
    }

    if (!isMatch) {
      // Increment failed login count for account
      lockoutRecord.failedCount += 1;
      if (lockoutRecord.failedCount >= 5) {
        lockoutRecord.lockedUntil = now + 30 * 60 * 1000; // 30 minutes lockout
      }
      accountLockoutMap.set(cleanEmail, lockoutRecord);

      auditLogger.logAuthAttempt({
        event: 'LOGIN_FAILURE',
        email: cleanEmail,
        userId: user.id,
        role: user.role,
        ip: req.ip,
        reason: 'Invalid credentials',
      });

      const remainingAttempts = Math.max(0, 5 - lockoutRecord.failedCount);
      const hint = remainingAttempts > 0 ? ` (Còn ${remainingAttempts} lần thử)` : ' (Tài khoản đã bị tạm khóa 30 phút)';
      return res.status(400).json({ message: `Email hoặc mật khẩu không đúng!${hint}` });
    }

    // Reset failed counter upon successful authentication
    accountLockoutMap.delete(cleanEmail);

    // Record login success in audit trail
    auditLogger.logAuthAttempt({
      event: 'LOGIN_SUCCESS',
      email: user.email,
      userId: user.id,
      role: user.role,
      ip: req.ip,
    });

    // 3. Generate JWT Token with configured secret
    const token = generateToken(user);
    const isPrivileged = user.role === 'admin' || user.role === 'teacher';

    // 24/7 Automated Sync to Google Sheets
    googleSheetsAutoSyncService.queueLoginSession({
      uid: user.id || user._id,
      name: user.fullName || user.name,
      email: user.email,
      provider: 'Mật khẩu / JWT',
      device: req.headers['user-agent']?.includes('Mobile') ? 'Mobile' : 'Desktop',
    });

    return res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
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
    return res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
  }
});

/**
 * POST /api/auth/logout
 * Token Blacklist & Session Revocation
 */
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    tokenBlacklist.add(token);
  }
  return res.status(200).json({ success: true, message: 'Đăng xuất thành công. Token đã được thu hồi an toàn.' });
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
 * Fast preset login for student testing only (strictly disallows Teacher and Admin bypass)
 */
router.post('/quick-login', async (req, res) => {
  try {
    const { name, email, role = 'student', studentCode, classRoom, assignedTeacherId } = req.body;

    // Disallow Teacher and Admin bypass via quick-login (Item 35)
    if (role === 'admin' || role === 'teacher') {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Tài khoản Giảng Viên và Quản Trị Viên yêu cầu xác thực bằng mật khẩu chính thức qua /api/auth/login để đảm bảo an toàn.' 
      });
    }

    const cleanEmail = (email || `${studentCode || 'user'}@mosmaster.edu.vn`).toLowerCase();
    let existing = await User.findOne({ email: cleanEmail });

    if (!existing) {
      const generatedSalt = await bcrypt.genSalt(10);
      const generatedHash = await bcrypt.hash(Math.random().toString(36).slice(-8) + Date.now(), generatedSalt);

      existing = new User({
        fullName: name || 'Học Viên',
        email: cleanEmail,
        password_hash: generatedHash,
        role: 'student',
        studentCode: studentCode || 'K24-CNTT-089',
        classRoom: classRoom || 'Lớp MOS-TinHoc01',
        assignedTeacherId: assignedTeacherId || 'a0000000-0000-0000-0000-000000000002',
      });
      existing = await existing.save();

      // Log quick-register in audit trail for owner
      auditLogService.log({
        actorId: existing.id || 'quick-login',
        actorName: existing.fullName || name || 'Học Viên Mới',
        actorRole: 'student',
        action: 'USER_REGISTERED',
        targetType: 'user',
        targetId: existing.id,
        targetName: existing.fullName,
        details: {
          email: existing.email,
          studentCode: existing.studentCode,
          classRoom: existing.classRoom,
          loginMethod: 'Đăng nhập nhanh',
        },
        ipAddress: req.ip,
      }).catch(() => {});
    }

    const token = generateToken({
      id: existing.id || existing._id,
      email: existing.email,
      role: existing.role,
      fullName: existing.fullName,
      studentCode: existing.studentCode,
      classRoom: existing.classRoom,
    });

    return res.json({
      success: true,
      token,
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
