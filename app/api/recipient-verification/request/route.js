import { randomInt, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getEducatorRequestContext } from '@/lib/educator-auth';
import { createAdminSupabase } from '@/lib/supabase-admin';
import {
  maskedEmail,
  normalizeRecipient,
  recipientCodeDigest,
  RECIPIENT_CODE_TTL_SECONDS,
  RECIPIENT_HOURLY_LIMIT,
  RECIPIENT_RESEND_SECONDS,
} from '@/lib/recipient-verification';
import { sendRecipientOtpEmail } from '@/lib/report-email';

export const runtime = 'nodejs';

function problem(status, error, message, headers) {
  return NextResponse.json({ error, message }, { status, headers });
}

export async function POST(request) {
  let context;
  try {
    context = await getEducatorRequestContext();
  } catch (error) {
    console.error('Unable to authorize recipient verification request', error);
    return problem(500, 'authorization_failed', '暂时无法验证教育者身份。');
  }
  if (context.error) {
    return problem(
      context.status,
      context.error,
      context.status === 401
        ? '请重新登入。'
        : '此功能只开放给教育者。'
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return problem(400, 'invalid_json', '请求内容无效。');
  }
  const recipient = normalizeRecipient(body);
  if (recipient.error) return problem(400, 'invalid_recipient', recipient.error);

  let admin;
  try {
    admin = createAdminSupabase();
  } catch (error) {
    console.error('Recipient verification backend is not configured', error);
    return problem(503, 'verification_not_configured', '收件验证尚未完成服务器设置。');
  }

  const now = Date.now();
  const minuteAgo = new Date(now - RECIPIENT_RESEND_SECONDS * 1000).toISOString();
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const { data: recent, error: recentError } = await admin
    .from('recipient_verifications')
    .select('created_at')
    .eq('educator_id', context.user.id)
    .eq('recipient_email', recipient.email)
    .gte('created_at', minuteAgo)
    .order('created_at', { ascending: false })
    .limit(1);
  if (recentError) {
    console.error('Unable to check recipient resend window', recentError);
    return problem(500, 'verification_lookup_failed', '暂时无法寄送验证码。');
  }
  if (recent?.length) {
    const retryAfter = Math.max(1, Math.ceil(
      (new Date(recent[0].created_at).getTime() + RECIPIENT_RESEND_SECONDS * 1000 - now) / 1000
    ));
    return problem(429, 'resend_too_soon', `请在 ${retryAfter} 秒后重新寄送。`, {
      'Retry-After': String(retryAfter),
    });
  }

  const { count, error: countError } = await admin
    .from('recipient_verifications')
    .select('id', { count: 'exact', head: true })
    .eq('educator_id', context.user.id)
    .eq('recipient_email', recipient.email)
    .gte('created_at', hourAgo);
  if (countError) {
    console.error('Unable to check recipient hourly limit', countError);
    return problem(500, 'verification_lookup_failed', '暂时无法寄送验证码。');
  }
  if ((count || 0) >= RECIPIENT_HOURLY_LIMIT) {
    return problem(429, 'hourly_limit_reached', '此邮箱的验证码请求过多，请一小时后再试。');
  }

  const verificationId = randomUUID();
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const expiresAt = new Date(now + RECIPIENT_CODE_TTL_SECONDS * 1000).toISOString();
  let codeDigest;
  try {
    codeDigest = recipientCodeDigest({ verificationId, email: recipient.email, code });
  } catch (error) {
    console.error('Recipient OTP signing secret is not configured', error);
    return problem(503, 'verification_not_configured', '收件验证尚未完成服务器设置。');
  }

  const { error: insertError } = await admin
    .from('recipient_verifications')
    .insert({
      id: verificationId,
      educator_id: context.user.id,
      recipient_name: recipient.name,
      recipient_email: recipient.email,
      code_digest: codeDigest,
      expires_at: expiresAt,
    });
  if (insertError) {
    console.error('Unable to save recipient verification', insertError);
    return problem(500, 'verification_save_failed', '暂时无法建立验证码。');
  }

  try {
    await sendRecipientOtpEmail({
      name: recipient.name,
      email: recipient.email,
      code,
      expiresMinutes: Math.round(RECIPIENT_CODE_TTL_SECONDS / 60),
    });
  } catch (error) {
    console.error('Unable to send recipient OTP email', error);
    await admin.from('recipient_verifications').delete().eq('id', verificationId);
    return problem(503, 'email_send_failed', '验证码邮件暂时无法寄出，请检查寄送设置。');
  }

  return NextResponse.json({
    verificationId,
    maskedEmail: maskedEmail(recipient.email),
    expiresIn: RECIPIENT_CODE_TTL_SECONDS,
    resendAfter: RECIPIENT_RESEND_SECONDS,
  }, { status: 201 });
}
