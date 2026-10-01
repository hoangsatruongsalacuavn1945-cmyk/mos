import { Router, Request, Response } from 'express';
import { feedbackService } from '../services/feedbackService.ts';

const router = Router();

/**
 * POST /api/feedback
 * Submit a website review, bug report, or screen obstruction report
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      rating,
      category,
      title,
      description,
      deviceInfo,
      screenResolution,
      pageUrl,
      priority,
    } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Nội dung phản hồi / mô tả lỗi không được để trống' });
    }

    const saved = await feedbackService.submitFeedback({
      userId,
      userName,
      userEmail,
      rating: Number(rating) || 5,
      category: category || 'ui_rating',
      title: title?.trim() || 'Phản hồi người dùng',
      description: description.trim(),
      deviceInfo,
      screenResolution,
      pageUrl,
      priority: priority || 'normal',
    });

    return res.status(201).json({
      success: true,
      message: 'Cảm ơn bạn đã gửi phản hồi! Ban quản trị sẽ kiểm tra và tối ưu sớm nhất.',
      feedback: saved,
    });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ error: 'Không thể ghi nhận phản hồi', details: error.message });
  }
});

/**
 * GET /api/feedback
 * Retrieve list of user feedback reports (Teacher / Owner / Admin)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category, search, limit } = req.query;

    const items = await feedbackService.getAllFeedback({
      status: status ? String(status) : undefined,
      category: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
      limit: limit ? Number(limit) : 100,
    });

    return res.json({
      success: true,
      count: items.length,
      feedback: items,
    });
  } catch (error: any) {
    console.error('Error fetching feedback:', error);
    return res.status(500).json({ error: 'Lỗi khi tải danh sách phản hồi', details: error.message });
  }
});

/**
 * GET /api/feedback/stats
 * Get overall rating & bug metrics for owner dashboard
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await feedbackService.getFeedbackStats();
    return res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching feedback stats:', error);
    return res.status(500).json({ error: 'Lỗi khi tính toán thống kê phản hồi', details: error.message });
  }
});

/**
 * PATCH /api/feedback/:id/status
 * Update status & admin notes (Owner / Admin)
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Trạng thái xử lý không được để trống' });
    }

    const updated = await feedbackService.updateFeedbackStatus(id, status, adminNotes);
    if (!updated) {
      return res.status(404).json({ error: 'Không tìm thấy phản hồi' });
    }

    return res.json({
      success: true,
      message: 'Cập nhật trạng thái phản hồi thành công',
    });
  } catch (error: any) {
    console.error('Error updating feedback status:', error);
    return res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái', details: error.message });
  }
});

/**
 * DELETE /api/feedback/:id
 * Remove a feedback report (Owner only)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await feedbackService.deleteFeedback(id);
    return res.json({
      success: true,
      message: 'Đã xóa phản hồi thành công',
    });
  } catch (error: any) {
    console.error('Error deleting feedback:', error);
    return res.status(500).json({ error: 'Lỗi khi xóa phản hồi', details: error.message });
  }
});

export default router;
