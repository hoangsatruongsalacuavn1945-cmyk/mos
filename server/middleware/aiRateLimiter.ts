import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mos_master_secure_jwt_secret_key_2026_certiport';

interface CreditRecord {
  count: number;
  dateStr: string; // YYYY-MM-DD
}

// In-memory daily quota store
const userDailyCredits = new Map<string, CreditRecord>();

// In-memory sliding window rate limiter (requests per minute)
interface RateLimitRecord {
  timestamps: number[];
}
const ipRateLimits = new Map<string, RateLimitRecord>();

const MAX_PER_MINUTE = 10;
const STUDENT_DAILY_MAX = 20;
const GUEST_DAILY_MAX = 5;

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getClientIdentifier(req: Request): { identifier: string; role: string; userId?: string } {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.id) {
        return {
          identifier: `user_${decoded.id}`,
          role: decoded.role || 'student',
          userId: decoded.id,
        };
      }
    } catch {}
  }

  // Fallback to IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'unknown_ip';
  return {
    identifier: `ip_${ip}`,
    role: 'guest',
  };
}

export function getUserQuotaInfo(req: Request) {
  const { identifier, role } = getClientIdentifier(req);
  const today = getTodayString();
  const maxQuota = role === 'admin' || role === 'teacher' ? Infinity : role === 'student' ? STUDENT_DAILY_MAX : GUEST_DAILY_MAX;

  const record = userDailyCredits.get(identifier);
  const usedToday = (record && record.dateStr === today) ? record.count : 0;
  const remaining = maxQuota === Infinity ? 999999 : Math.max(0, maxQuota - usedToday);

  return {
    identifier,
    role,
    maxQuota: maxQuota === Infinity ? 'unlimited' : maxQuota,
    usedToday,
    remainingCredits: maxQuota === Infinity ? 'unlimited' : remaining,
    resetTime: '00:00:00 UTC',
  };
}

/**
 * Middleware: Rate limit per minute & enforce daily AI quota
 */
export const aiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const { identifier, role } = getClientIdentifier(req);
  const now = Date.now();

  // 1. Sliding window rate limiter (prevent rapid automated spamming)
  let rateRecord = ipRateLimits.get(identifier);
  if (!rateRecord) {
    rateRecord = { timestamps: [] };
    ipRateLimits.set(identifier, rateRecord);
  }

  // Clean timestamps older than 60s
  rateRecord.timestamps = rateRecord.timestamps.filter(ts => now - ts < 60000);

  if (rateRecord.timestamps.length >= MAX_PER_MINUTE) {
    return res.status(429).json({
      error: 'TooManyRequests',
      message: 'Bạn đang gửi câu hỏi quá nhanh. Vui lòng đợi 1 phút trước khi hỏi câu tiếp theo để tránh làm nghẽn hệ thống.',
      retryAfterSeconds: Math.ceil((60000 - (now - rateRecord.timestamps[0])) / 1000),
    });
  }

  // Record timestamp
  rateRecord.timestamps.push(now);

  // 2. Daily credit quota check
  const maxQuota = role === 'admin' || role === 'teacher' ? Infinity : role === 'student' ? STUDENT_DAILY_MAX : GUEST_DAILY_MAX;

  if (maxQuota !== Infinity) {
    const today = getTodayString();
    let creditRecord = userDailyCredits.get(identifier);

    if (!creditRecord || creditRecord.dateStr !== today) {
      creditRecord = { count: 0, dateStr: today };
      userDailyCredits.set(identifier, creditRecord);
    }

    if (creditRecord.count >= maxQuota) {
      return res.status(429).json({
        error: 'QuotaExceeded',
        message: `Bạn đã sử dụng hết hạn mức ${maxQuota}/${maxQuota} lượt hỏi AI hôm nay. Hạn mức sẽ tự động được làm mới vào 00:00 ngày mai!`,
        maxQuota,
        usedToday: creditRecord.count,
        remainingCredits: 0,
      });
    }

    // Deduct credit
    creditRecord.count += 1;
    res.setHeader('X-Daily-Credits-Remaining', String(maxQuota - creditRecord.count));
  } else {
    res.setHeader('X-Daily-Credits-Remaining', 'unlimited');
  }

  next();
};
