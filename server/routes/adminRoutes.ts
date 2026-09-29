import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.ts';
import { userService } from '../services/userService.ts';
import { auditLogService } from '../services/auditLogService.ts';

const router = Router();

/**
 * API: Tạo tài khoản Giáo viên (Dành cho Admin)
 * POST /api/admin/create-teacher
 * 
 * Nhận: { fullName, email, password, teachingSubjects }
 * Có thể gọi từ Admin Portal hoặc công cụ API/Postman
 */
router.post('/create-teacher', async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, teachingSubjects } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    // 1. Kiểm tra email tồn tại trong hệ thống
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã tồn tại trong hệ thống' });
    }

    // 2. Mã hóa mật khẩu an toàn bằng bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Tạo user với role mặc định là 'teacher'
    const newTeacher = new User({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'teacher',
      teachingSubjects: Array.isArray(teachingSubjects) && teachingSubjects.length > 0
        ? teachingSubjects
        : ['Excel']
    });

    await newTeacher.save();

    // 4. Ghi nhận audit trail
    await auditLogService.log({
      actorId: 'admin-action',
      actorName: 'Quản Trị Viên (Admin)',
      actorRole: 'admin',
      action: 'TEACHER_ACCOUNT_CREATED',
      targetType: 'user',
      targetId: newTeacher.id,
      targetName: newTeacher.fullName,
      details: {
        email: newTeacher.email,
        teachingSubjects: newTeacher.teachingSubjects,
      },
    });

    console.log(`[Admin] Đã tạo tài khoản giáo viên mới: ${newTeacher.fullName} (${newTeacher.email})`);

    return res.status(201).json({
      message: 'Tạo tài khoản Giáo viên thành công!',
      teacher: {
        id: newTeacher.id,
        _id: newTeacher.id,
        fullName: newTeacher.fullName,
        name: newTeacher.fullName,
        email: newTeacher.email,
        role: newTeacher.role,
        teachingSubjects: newTeacher.teachingSubjects,
      }
    });

  } catch (error: any) {
    console.error('[Admin] Lỗi khi tạo giáo viên:', error);
    return res.status(500).json({ message: 'Lỗi server khi tạo giáo viên' });
  }
});

/**
 * GET /api/admin/users
 * Returns list of all registered users
 */
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const all = await userService.getAllUsers();
    return res.json({ users: all });
  } catch (err: any) {
    console.error('[Admin Routes] users error:', err);
    return res.status(500).json({ error: 'Lỗi lấy danh sách người dùng' });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Promote or Demote user role with audit logging
 */
router.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newRole, actorId = 'owner-master-root', actorName = 'Chủ Sở Hữu Hệ Thống' } = req.body;

    if (!['student', 'teacher', 'admin'].includes(newRole)) {
      return res.status(400).json({ error: 'Vai trò mới không hợp lệ.' });
    }

    const existing = await userService.findUserById(id);
    const targetUserName = existing ? existing.full_name : 'Người dùng';
    const previousRole = existing ? existing.role : 'student';

    const updated = await userService.updateUserRole(id, newRole as any);
    if (!updated) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const action = newRole === 'teacher' ? 'USER_PROMOTED_TO_TEACHER' : 
                   newRole === 'admin' ? 'USER_PROMOTED_TO_ADMIN' : 'USER_DEMOTED_TO_STUDENT';

    await auditLogService.log({
      actorId,
      actorName,
      actorRole: 'admin',
      action,
      targetType: 'user',
      targetId: id,
      targetName: targetUserName,
      details: {
        previousRole,
        newRole,
        actionLabel: newRole === 'teacher' ? 'Bổ nhiệm lên Giảng Viên' : 'Hạ xuống Học Viên',
      },
    });

    return res.json({
      success: true,
      message: `Đã cập nhật vai trò của ${targetUserName} thành ${newRole}.`,
      user: updated,
      role: newRole,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Lỗi cập nhật vai trò người dùng.' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user account with audit logging
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { actorId = 'owner-master-root', actorName = 'Chủ Sở Hữu Hệ Thống' } = req.body;

    const existing = await userService.findUserById(id);
    const targetUserName = existing ? existing.full_name : 'Người dùng ' + id;

    const ok = await userService.deleteUser(id);
    if (!ok) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng để xóa' });
    }

    await auditLogService.log({
      actorId,
      actorName,
      actorRole: 'admin',
      action: 'USER_ACCOUNT_DELETED',
      targetType: 'user',
      targetId: id,
      targetName: targetUserName,
      details: {
        deletedAt: new Date().toISOString(),
        reason: 'Xóa tài khoản bởi Quản Trị Viên (Admin)',
      },
    });

    return res.json({
      success: true,
      message: `Đã xóa vĩnh viễn tài khoản của ${targetUserName} khỏi hệ thống.`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Lỗi xóa tài khoản người dùng.' });
  }
});

/**
 * GET /api/admin/audit-logs
 * Returns audit trail logs with actor details and timestamps
 */
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const { action, actorRole, targetType, limit } = req.query;
    const logs = await auditLogService.getLogs({
      action: action as string,
      actorRole: actorRole as string,
      targetType: targetType as string,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });

    return res.json({ logs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Lỗi tải nhật ký kiểm toán.' });
  }
});

/**
 * POST /api/admin/audit-logs
 * Manually submit an audit event
 */
router.post('/audit-logs', async (req: Request, res: Response) => {
  try {
    const entry = req.body;
    if (!entry.actorName || !entry.action) {
      return res.status(400).json({ error: 'actorName và action là bắt buộc.' });
    }

    const saved = await auditLogService.log(entry);
    return res.status(201).json({ success: true, log: saved });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
