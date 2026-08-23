import { NextResponse } from 'next/server';
import { getEducatorRequestContext } from '@/lib/educator-auth';
import { createAdminSupabase } from '@/lib/supabase-admin';
import {
  recipientCodeMatches,
  RECIPIENT_AUTHORIZATION_TTL_SECONDS,
  RECIPIENT_MAX_ATTEMPTS,
} from '@/lib/recipient-verification';

export const runtime = 'nodejs';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function problem(status, error, message) {
  return NextResponse.json({ error, message }, { status });
}

async function upsertEducatorClient({ admin, educatorId, name, email, verifiedAt }) {
  const normalizedEmail = email.trim().toLowerCase();
  const fields = 'id, display_name, email, email_verified_at';
  const { data: existing, error: lookupError } = await admin
    .from('educator_clients')
    .select(fields)
    .eq('educator_id', educatorId)
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existing) {
    const { data, error } = await admin
      .from('educator_clients')
      .update({ display_name: name, email_verified_at: verifiedAt })
      .eq('id', existing.id)
      .eq('educator_id', educatorId)
      .select(fields)
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await admin
    .from('educator_clients')
    .insert({
      educator_id: educatorId,
      display_name: name,
      email: normalizedEmail,
      email_verified_at: verifiedAt,
    })
    .select(fields)
    .single();
  if (!error) return data;

  // Another verification for the same educator/email may complete concurrently.
  if (error.code === '23505') {
    const { data: concurrent, error: concurrentError } = await admin
      .from('educator_clients')
      .select(fields)
      .eq('educator_id', educatorId)
      .eq('email', normalizedEmail)
      .single();
    if (concurrentError) throw concurrentError;
    return concurrent;
  }
  throw error;
}

export async function POST(request) {
  let context;
  try {
    context = await getEducatorRequestContext();
  } catch (error) {
    console.error('Unable to authorize recipient OTP verification', error);
    return problem(500, 'authorization_failed', '暂时无法验证教育者身份。 · Could not verify the educator account.');
  }
  if (context.error) {
    return problem(context.status, context.error, context.status === 401
      ? '请重新登入。 · Please sign in again.'
      : '此功能只开放给教育者。 · This feature is available to educators only.');
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return problem(400, 'invalid_json', '请求内容无效。 · Invalid request body.');
  }
  const verificationId = typeof body?.verificationId === 'string' ? body.verificationId : '';
  const code = typeof body?.code === 'string' ? body.code.replace(/\D/g, '') : '';
  if (!UUID_PATTERN.test(verificationId) || !/^\d{6}$/.test(code)) {
    return problem(400, 'invalid_code', '请输入六位验证码。 · Enter the six-digit code.');
  }

  let admin;
  try {
    admin = createAdminSupabase();
  } catch (error) {
    console.error('Recipient verification backend is not configured', error);
    return problem(503, 'verification_not_configured', '收件验证尚未完成服务器设置。 · Recipient verification is not configured yet.');
  }

  const { data: verification, error } = await admin
    .from('recipient_verifications')
    .select('id, educator_id, client_id, recipient_name, recipient_email, code_digest, attempts, expires_at, verified_at, authorization_expires_at, used_at')
    .eq('id', verificationId)
    .eq('educator_id', context.user.id)
    .maybeSingle();
  if (error) {
    console.error('Unable to load recipient verification', error);
    return problem(500, 'verification_lookup_failed', '暂时无法验证代码。 · Could not verify the code.');
  }
  if (!verification) return problem(404, 'verification_not_found', '找不到这次验证，请重新寄送。 · Verification not found. Request a new code.');
  if (verification.used_at) return problem(409, 'verification_used', '此验证码已用于一份报告。 · This code has already authorized a report.');

  const now = Date.now();
  if (verification.verified_at) {
    if (new Date(verification.authorization_expires_at).getTime() <= now) {
      return problem(410, 'authorization_expired', '收件授权已过期，请重新寄送验证码。 · Recipient authorization expired. Request a new code.');
    }
    let client;
    try {
      client = await upsertEducatorClient({
        admin,
        educatorId: context.user.id,
        name: verification.recipient_name,
        email: verification.recipient_email,
        verifiedAt: verification.verified_at,
      });
      if (!verification.client_id) {
        const { error: attachError } = await admin
          .from('recipient_verifications')
          .update({ client_id: client.id })
          .eq('id', verificationId)
          .eq('educator_id', context.user.id);
        if (attachError) throw attachError;
      }
    } catch (clientError) {
      console.error('Unable to save verified educator client', clientError);
      return problem(500, 'client_save_failed', '暂时无法保存客户资料。 · Could not save the client record.');
    }
    return NextResponse.json({
      verified: true,
      verificationId,
      recipient: { name: verification.recipient_name, email: verification.recipient_email },
      client,
    });
  }
  if (new Date(verification.expires_at).getTime() <= now) {
    return problem(410, 'code_expired', '验证码已过期，请重新寄送。 · The code expired. Request a new one.');
  }
  if (verification.attempts >= RECIPIENT_MAX_ATTEMPTS) {
    return problem(429, 'attempts_exhausted', '验证码尝试次数已达上限，请重新寄送。 · Too many attempts. Request a new code.');
  }

  const nextAttempts = Math.min(RECIPIENT_MAX_ATTEMPTS, verification.attempts + 1);
  const matches = recipientCodeMatches({
    verificationId,
    email: verification.recipient_email,
    code,
  }, verification.code_digest);
  if (!matches) {
    await admin
      .from('recipient_verifications')
      .update({ attempts: nextAttempts })
      .eq('id', verificationId)
      .eq('educator_id', context.user.id);
    const remaining = RECIPIENT_MAX_ATTEMPTS - nextAttempts;
    return problem(remaining > 0 ? 400 : 429, 'code_incorrect', remaining > 0
      ? `验证码不正确，还可尝试 ${remaining} 次。 · Incorrect code. ${remaining} attempts remaining.`
      : '验证码尝试次数已达上限，请重新寄送。 · Too many attempts. Request a new code.');
  }

  const verifiedAt = new Date(now).toISOString();
  const authorizationExpiresAt = new Date(now + RECIPIENT_AUTHORIZATION_TTL_SECONDS * 1000).toISOString();
  let client;
  try {
    client = await upsertEducatorClient({
      admin,
      educatorId: context.user.id,
      name: verification.recipient_name,
      email: verification.recipient_email,
      verifiedAt,
    });
  } catch (clientError) {
    console.error('Unable to save verified educator client', clientError);
    return problem(500, 'client_save_failed', '暂时无法保存客户资料。 · Could not save the client record.');
  }
  const { error: updateError } = await admin
    .from('recipient_verifications')
    .update({
      attempts: nextAttempts,
      client_id: client.id,
      verified_at: verifiedAt,
      authorization_expires_at: authorizationExpiresAt,
    })
    .eq('id', verificationId)
    .eq('educator_id', context.user.id);
  if (updateError) {
    console.error('Unable to mark recipient verification complete', updateError);
    return problem(500, 'verification_update_failed', '暂时无法完成验证。 · Could not complete verification.');
  }

  return NextResponse.json({
    verified: true,
    verificationId,
    recipient: { name: verification.recipient_name, email: verification.recipient_email },
    client,
    authorizationExpiresIn: RECIPIENT_AUTHORIZATION_TTL_SECONDS,
  });
}
