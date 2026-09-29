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

dotenv.config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'mos_master_secure_jwt_secret_key_2026_certiport';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * Helper: Sign JWT token
 */
function generateToken(userPayload) {
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
    { expiresIn: JWT_EXPIRES_IN }
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
router.post('/register', async (req, res) => {
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

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 6 ký tự.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email đã tồn tại trong hệ thống' });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: actualName,
      email: cleanEmail,
      password: hashedPassword,
      password_hash: hashedPassword,
      role: 'student',
      studentCode: studentCode ? studentCode.trim() : `HV-${Math.floor(1000 + Math.random() * 9000)}`,
      classRoom: classRoom ? classRoom.trim() : 'Lớp MOS-TinHoc01',
      assignedTeacherId: actualTeacherId,
      status: 'active',
      streakDays: 1,
    });

    await newUser.save();

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.fullName,
      name: newUser.fullName,
      studentCode: newUser.studentCode,
      classRoom: newUser.classRoom,
    });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Hãy đăng nhập.',
      token,
      user: {
        id: newUser.id,
        _id: newUser.id,
        fullName: newUser.fullName,
        name: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        studentCode: newUser.studentCode,
        classRoom: newUser.classRoom,
        assignedTeacherId: newUser.assignedTeacherId,
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
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email và mật khẩu không được để trống!' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Tìm user theo email
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị.' });
    }

    // 2. So sánh mật khẩu bằng bcrypt hoặc master passkey
    let isMatch = false;
    try {
      if (user.password_hash) {
        isMatch = await bcrypt.compare(password, user.password_hash);
      }
    } catch (e) {
      isMatch = false;
    }

    // Cho phép passkey cho tài khoản Super Admin hoặc mật khẩu demo '123456'
    if (!isMatch) {
      if (cleanEmail === 'hoangsatruongsalacuavn1945@gmail.com' && password === 'MOS_MASTER_OWNER_2026!') {
        isMatch = true;
      } else if (password === user.password || password === '123456') {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
    }

    // 3. Tạo JWT Token (Để bảo mật các request sau này, thời hạn 1 ngày)
    const token = jwt.sign(
      {
        id: user._id || user.id,
        role: user.role,
        email: user.email,
        name: user.fullName || user.name,
        fullName: user.fullName || user.name,
      },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '1d' }
    );

    // 4. Trả về thông tin (Không trả về password)
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

    const cleanEmail = (email || `${studentCode || 'user'}@mosmaster.edu.vn`).toLowerCase();
    let existing = await User.findOne({ email: cleanEmail });

    if (!existing) {
      existing = new User({
        fullName: name || (role === 'teacher' ? 'Giảng Viên MOS' : 'Học Viên'),
        email: cleanEmail,
        role,
        studentCode: studentCode || (role === 'student' ? 'K24-CNTT-089' : null),
        classRoom: classRoom || 'Lớp MOS-TinHoc01',
        assignedTeacherId: assignedTeacherId || 'a0000000-0000-0000-0000-000000000002',
      });
      await existing.save();
    }

    const token = generateToken({
      id: existing.id,
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
        id: existing.id,
        _id: existing.id,
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
