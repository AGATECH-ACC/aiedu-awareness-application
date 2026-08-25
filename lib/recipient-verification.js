import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { supabaseSecretKey } from '@/lib/supabase-admin';

export const RECIPIENT_CODE_TTL_SECONDS = 10 * 60;
export const RECIPIENT_AUTHORIZATION_TTL_SECONDS = 60 * 60;
export const RECIPIENT_RESEND_SECONDS = 60;
export const RECIPIENT_HOURLY_LIMIT = 5;
export const RECIPIENT_MAX_ATTEMPTS = 5;

export function normalizeRecipient(input) {
  const name = typeof input?.name === 'string' ? input.name.trim().replace(/\s+/g, ' ') : '';
  const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name || name.length > 120) {
    return { error: '请输入收件人的姓名（最多 120 个字）。' };
  }
  if (!emailPattern.test(email) || email.length > 320) {
    return { error: '请输入有效的收件邮箱。' };
  }
  return { name, email };
}

function otpSigningKey() {
  const secret = process.env.RECIPIENT_OTP_SECRET || supabaseSecretKey();
  if (!secret || secret.length < 24) throw new Error('recipient_otp_secret_missing');
  return createHmac('sha256', secret)
    .update('awareness-recipient-otp-v1')
    .digest();
}

export function recipientCodeDigest({ verificationId, email, code }) {
  return createHmac('sha256', otpSigningKey())
    .update(`${verificationId}\n${email}\n${code}`)
    .digest('hex');
}

export function recipientCodeMatches(input, expectedDigest) {
  if (!/^[a-f0-9]{64}$/i.test(expectedDigest || '')) return false;
  const actual = Buffer.from(recipientCodeDigest(input), 'hex');
  const expected = Buffer.from(expectedDigest, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function maskedEmail(email) {
  const [local, domain] = String(email).split('@');
  if (!local || !domain) return email;
  const visible = local.length <= 2 ? local.charAt(0) : local.slice(0, 2);
  return `${visible}${'•'.repeat(Math.max(2, Math.min(local.length - visible.length, 6)))}@${domain}`;
}
