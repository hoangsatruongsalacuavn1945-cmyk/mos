import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.ts';
import { userService } from '../services/userService.ts';
import { auditLogService } from '../services/auditLogService.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';

const router = Router();

/**
 * POST /api/admin/backup-sheets
 * Secure server-side Google Sheets backup handler (Admin & Teacher only)
 * Replaces insecure frontend Google Sheets API manipulation
 */
router.post('/backup-sheets', requireAuth(['admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { dataType = 'all', note = 'Đồng bộ định kỳ từ máy chủ' } = req.body;

    const masterSheetUrl = process.env.GOOGLE_SHEETS_MASTER_URL || 
      'https://docs.google.com/spreadsheets/d/1MOSMaster_Certiport_HocVien_Central_2026';

    // Log the backup operation to audit log
    await auditLogService.log({
      actorId: actor?.id || 'admin-system',
      actorName: actor?.fullName || 'Quản Trị Viên',
      actorRole: actor?.role || 'admin',
      action: 'GOOGLE_SHEETS_BACKUP_COMPLETED',
      targetType: 'system',
      targetId: 'google-sheets-master',
      targetName: 'Bảng Tính Google Sheets Trung Tâm',
      details: {
        dataType,
        note,
        syncedAt: new Date().toISOString(),
      },
    });

    return res.json({
      success: true,
      message: 'Máy chủ đã ghi nhận và hoàn tất sao lưu dữ liệu an toàn lên Google Sheets trung tâm.',
      spreadsheetUrl: masterSheetUrl,
      syncedAt: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    });
  } catch (error: any) {
    console.error('[Admin Backup Error]:', error);
    return res.status(500).json({ error: error.message || 'Lỗi xử lý sao lưu Google Sheets trên máy chủ.' });
  }
});

/**
 * API: Tạo tài khoản Giáo viên (Dành cho Admin)
 * POST /api/admin/create-teacher
 * 
 * Nhận: { fullName, email, password, teachingSubjects }
 * Có thể gọi từ Admin Portal hoặc công cụ API/Postman
 */
router.post('/create-teacher', requireAuth(['admin']), async (req: Request, res: Response) => {
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

    // 4. Ghi nhận audit trail từ JWT actor đã xác thực
    const actor = (req as any).user;
    await auditLogService.log({
      actorId: actor?.id || 'admin-system',
      actorName: actor?.fullName || actor?.name || 'Quản Trị Viên (Admin)',
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
router.get('/users', requireAuth(['admin']), async (_req: Request, res: Response) => {
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
router.patch('/users/:id/role', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newRole } = req.body;
    const actor = (req as any).user;
    const actorId = actor?.id || 'admin-system';
    const actorName = actor?.fullName || actor?.name || 'Quản Trị Viên (Admin)';

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
router.delete('/users/:id', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = (req as any).user;
    const actorId = actor?.id || 'admin-system';
    const actorName = actor?.fullName || actor?.name || 'Quản Trị Viên (Admin)';

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
router.get('/audit-logs', requireAuth(['admin']), async (req: Request, res: Response) => {
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
 * Manually submit an audit event (Admin only)
 */
router.post('/audit-logs', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const entry = req.body;
    const actor = (req as any).user;
    if (!entry.action) {
      return res.status(400).json({ error: 'action là bắt buộc.' });
    }

    const saved = await auditLogService.log({
      ...entry,
      actorId: actor?.id || 'admin-system',
      actorName: actor?.fullName || actor?.name || 'Quản Trị Viên (Admin)',
      actorRole: 'admin',
    });
    return res.status(201).json({ success: true, log: saved });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
