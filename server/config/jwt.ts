import dotenv from 'dotenv';
dotenv.config();

const rawSecret = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : '';
export const JWT_SECRET = (rawSecret && rawSecret !== 'JWT_SECRET' && rawSecret.length >= 8)
  ? rawSecret
  : 'mos_master_secure_jwt_secret_key_2026_certiport';

/**
 * Validates and safely converts JWT expiration string/number.
 * Prevents errors like: Error: "expiresIn" should be a number of seconds or string representing a timespan
 * when env vars contain placeholder strings like "JWT_EXPIRES_IN".
 */
export function getSafeJwtExpiresIn(): number | string {
  const envVal = process.env.JWT_EXPIRES_IN;
  if (typeof envVal === 'number' && !isNaN(envVal) && envVal > 0) {
    return envVal;
  }
  if (typeof envVal === 'string') {
    const trimmed = envVal.trim();
    // Seconds as digits (e.g. "86400")
    if (/^\d+$/.test(trimmed)) {
      const parsed = parseInt(trimmed, 10);
      if (parsed > 0) return parsed;
    }
    // Timespan syntax (e.g. "1d", "24h", "60m")
    if (/^\d+\s*(d|days?|h|hours?|m|minutes?|s|seconds?)$/i.test(trimmed)) {
      return trimmed;
    }
  }
  // Safe default: 86400 seconds (24 hours / 1 day)
  return 86400;
}

export const JWT_EXPIRES_IN = getSafeJwtExpiresIn();
