import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.ts';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  fullName?: string;
  studentCode?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Strict Role-Based Access Control (RBAC) middleware
 * @param allowedRoles Array of permissible roles, e.g. ['admin', 'teacher']. If omitted, checks valid login.
 */
export const requireAuth = (allowedRoles?: ('admin' | 'teacher' | 'student')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

      if (!token) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Phiên làm việc đã hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại.' 
        });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;

      if (allowedRoles && allowedRoles.length > 0) {
        if (!decoded.role || !allowedRoles.includes(decoded.role)) {
          return res.status(403).json({ 
            error: 'Forbidden', 
            message: `Quyền truy cập bị từ chối. Tính năng này yêu cầu quyền: ${allowedRoles.join(', ')}.` 
          });
        }
      }

      // Attach decoded user securely to the express request object
      (req as AuthenticatedRequest).user = decoded;
      next();
    } catch (error: any) {
      return res.status(401).json({ 
        error: 'InvalidToken', 
        message: 'Token xác thực không hợp lệ hoặc đã hết hạn.' 
      });
    }
  };
};

export const requireRole = (roles: string[]) => requireAuth(roles as any);

export default requireAuth;
