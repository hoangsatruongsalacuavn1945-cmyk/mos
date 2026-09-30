import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../config/logger.ts';

/**
 * Custom Operational Application Error class
 * Allows throwing errors with explicit HTTP status codes and error categories
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorType: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, errorType?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorType = errorType || (
      statusCode === 400 ? 'BadRequest' :
      statusCode === 401 ? 'Unauthorized' :
      statusCode === 403 ? 'Forbidden' :
      statusCode === 404 ? 'NotFound' :
      statusCode === 409 ? 'Conflict' :
      statusCode === 422 ? 'UnprocessableEntity' :
      statusCode === 429 ? 'TooManyRequests' :
      'InternalServerError'
    );
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler utility to wrap Express route controllers
 * Guarantees uncaught asynchronous promise rejections are passed to centralized error handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction): void => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Centralized Error-Handling Middleware
 * Captures all operational & unhandled errors, logs detailed stack traces via Winston,
 * and responds to the client with sanitized JSON containing a unique request ID.
 */
export function centralizedErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  // Determine or generate unique Request ID
  const existingReqId = (req as any).requestId || req.headers['x-request-id'];
  const requestId = (typeof existingReqId === 'string' && existingReqId.trim())
    ? existingReqId.trim()
    : `err-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  // Ensure header is returned for tracing
  if (!res.headersSent) {
    res.setHeader('X-Request-Id', requestId);
  }

  // Normalize HTTP Status Code
  let statusCode = 500;
  if (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) {
    statusCode = err.statusCode;
  } else if (typeof err.status === 'number' && err.status >= 400 && err.status < 600) {
    statusCode = err.status;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
  }

  // Determine Error Type Name
  const errorType = err.errorType || err.name || (statusCode >= 500 ? 'InternalServerError' : 'BadRequest');

  // Log full error diagnostics (including complete stack trace) internally via Winston
  logger.error(`[Unhandled Exception] ${req.method} ${req.originalUrl} - ${err.message || 'Unknown error'}`, {
    requestId,
    statusCode,
    errorType,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });

  // If response headers have already been transmitted, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Sanitize client-facing error message (never expose raw stack traces, SQL syntax, or internal file paths)
  let safeMessage: string;
  if (statusCode >= 500) {
    const isProduction = process.env.NODE_ENV === 'production';
    safeMessage = isProduction 
      ? 'Đã xảy ra sự cố trên máy chủ nội bộ. Vui lòng liên hệ quản trị viên với mã yêu cầu.' 
      : (err.message || 'Lỗi xử lý yêu cầu máy chủ.');
  } else {
    safeMessage = err.message || 'Yêu cầu không hợp lệ.';
  }

  // Deliver sanitized, consistent JSON error payload
  return res.status(statusCode).json({
    success: false,
    error: errorType,
    message: safeMessage,
    statusCode,
    requestId,
    timestamp: new Date().toISOString(),
  });
}

export default centralizedErrorHandler;
