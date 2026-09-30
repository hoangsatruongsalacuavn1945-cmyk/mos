import winston from 'winston';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Human-readable dev console format
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const stackStr = stack ? `\n${stack}` : '';
  return `[${timestamp}] [${level}]: ${message}${metaStr}${stackStr}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), devFormat)
  ),
  defaultMeta: { service: 'mos-master-server' },
  transports: [
    new winston.transports.Console(),
  ],
});

/**
 * Dedicated audit logger for authentication & security critical events
 */
export const auditLogger = {
  logAuthAttempt: (data: {
    event: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'REGISTER_SUCCESS' | 'REGISTER_FAILURE' | 'ACCESS_DENIED';
    email?: string;
    role?: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    reason?: string;
  }) => {
    const level = data.event.includes('SUCCESS') ? 'info' : 'warn';
    logger.log(level, `[AUTH_AUDIT] ${data.event} - User: ${data.email || data.userId || 'anonymous'}`, {
      audit: true,
      timestamp: new Date().toISOString(),
      ...data,
    });
  },
};

export default logger;
