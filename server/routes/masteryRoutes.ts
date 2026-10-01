import { Router, Request, Response, NextFunction } from 'express';
import { MasteryService } from '../services/masteryService.js';

export function createMasteryRouter(getSubmissionsStore: () => any[]): Router {
  const router = Router();

  /**
   * GET /api/mastery/progress
   * Pulls user mastery data across Word, Excel, and PowerPoint from the database
   */
  router.get('/progress', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = (req.query.studentId as string) || (req.query.userId as string) || 'student-current';
      const studentName = (req.query.studentName as string) || 'Học viên MOS';

      const inMemorySubmissions = getSubmissionsStore();
      const dashboardData = await MasteryService.getUserMasteryDashboard(
        studentId,
        studentName,
        inMemorySubmissions
      );

      return res.json({
        success: true,
        data: dashboardData,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
