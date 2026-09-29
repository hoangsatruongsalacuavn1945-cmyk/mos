import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'mos_master_secure_jwt_secret_key_2026_certiport';

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

      if (!token) {
        return res.status(401).json({ message: 'Không có quyền truy cập. Vui lòng đăng nhập.' });
      }

      const decoded: any = jwt.verify(token, JWT_SECRET);

      if (!roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Role không hợp lệ. Truy cập bị từ chối.' });
      }

      // Gán thông tin user vào request để các controller dùng
      (req as any).user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token hết hạn hoặc sai' });
    }
  };
};

export default requireRole;
