import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { hasAwarenessAccess } from '@/lib/awareness-access';
import { createServerSupabase } from '@/lib/supabase-server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { buildFixedReport, FIXED_REPORT_VERSION } from '@/lib/fixed-report';
import { normalizeNewReading, normalizeSavedReading } from '@/lib/reading-validation';
import { sendRecipientReportEmail } from '@/lib/report-email';
import {
  countReportsSince,
  getProfile,
  getReading,
  getReportByReading,
  insertReading,
  insertReport,
} from '@/lib/db';
import { checkReportBurstLimit, reportClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function dailyLimit() {
  const parsed = Number.parseInt(process.env.REPORT_DAILY_LIMIT || '5', 10);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 100) : 5;
}

function startOfUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

function invalidPayload(message) {
  return NextResponse.json({ error: 'invalid_payload', message }, { status: 400 });
}

function reportOrigin(request) {
  const requestOrigin = new URL(request.url).origin;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin)) return requestOrigin;
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    return configured ? new URL(configured).origin : requestOrigin;
  } catch {
    return requestOrigin;
  }
}

async function loadRecipientAuthorization({ admin, verificationId, educatorId }) {
  const { data, error } = await admin
    .from('recipient_verifications')
    .select('id, educator_id, client_id, recipient_name, recipient_email, verified_at, authorization_expires_at, used_at')
    .eq('id', verificationId)
    .eq('educator_id', educatorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { error: '找不到收件验证，请重新寄送验证码。 · Recipient verification not found. Request a new code.' };
  if (!data.verified_at) return { error: '请先完成收件邮箱验证。 · Verify the recipient email first.' };
  if (!data.client_id) return { error: '客户资料尚未建立，请重新完成邮箱验证。 · Client record is missing. Verify the recipient email again.' };
  if (!data.authorization_expires_at || new Date(data.authorization_expires_at).getTime() <= Date.now()) {
    return { error: '收件授权已过期，请重新寄送验证码。 · Recipient authorization expired. Request a new code.' };
  }
  return { value: data };
}

async function deliverRecipientReport({ admin, authorization, report, reading, request }) {
  const { data: priorDelivery, error: priorError } = await admin
    .from('educator_report_deliveries')
    .select('id, report_id, recipient_name, recipient_email, status, emailed_at, created_at')
    .eq('verification_id', authorization.id)
    .maybeSingle();
  if (priorError) throw priorError;
  if (priorDelivery) {
    if (priorDelivery.report_id !== report.id) {
      return { error: '此收件授权已用于另一份报告。 · This recipient authorization has already been used.' };
    }
    return { delivery: priorDelivery, emailSent: priorDelivery.status === 'sent', reused: true };
  }
  if (authorization.used_at) {
    return { error: '此收件授权已用于一份报告。 · This recipient authorization has already been used.' };
  }

  const shareToken = report.share_token || randomUUID();
  const { data: sharedReport, error: shareError } = await admin
    .from('deep_reports')
    .update({ share_token: shareToken, is_public: true })
    .eq('id', report.id)
    .eq('user_id', authorization.educator_id)
    .select('id, share_token, is_public')
    .maybeSingle();
  if (shareError) throw shareError;
  if (!sharedReport) throw new Error('report_share_failed');

  const { data: delivery, error: deliveryError } = await admin
    .from('educator_report_deliveries')
    .insert({
      educator_id: authorization.educator_id,
      client_id: authorization.client_id,
      report_id: report.id,
      verification_id: authorization.id,
      recipient_name: authorization.recipient_name,
      recipient_email: authorization.recipient_email,
      status: 'pending',
    })
    .select('id, report_id, recipient_name, recipient_email, status, emailed_at, created_at')
    .single();
  if (deliveryError) throw deliveryError;

  const usedAt = new Date().toISOString();
  const { error: usedError } = await admin
    .from('recipient_verifications')
    .update({ used_at: usedAt })
    .eq('id', authorization.id)
    .eq('educator_id', authorization.educator_id)
    .is('used_at', null);
  if (usedError) throw usedError;

  const reportUrl = `${reportOrigin(request)}/r/${sharedReport.share_token}`;
  try {
    const providerId = await sendRecipientReportEmail({
      name: authorization.recipient_name,
      email: authorization.recipient_email,
      reportUrl,
    });
    const emailedAt = new Date().toISOString();
    await admin
      .from('educator_report_deliveries')
      .update({ status: 'sent', email_provider_id: providerId, emailed_at: emailedAt, last_error: null })
      .eq('id', delivery.id);
    return {
      delivery: { ...delivery, status: 'sent', emailed_at: emailedAt },
      emailSent: true,
      reportUrl,
      reading,
    };
  } catch (error) {
    const safeError = String(error?.message || 'email_send_failed').slice(0, 500);
    console.error('Unable to email recipient report', error);
    await admin
      .from('educator_report_deliveries')
      .update({ status: 'failed', last_error: safeError })
      .eq('id', delivery.id);
    return {
      delivery: { ...delivery, status: 'failed' },
      emailSent: false,
      reportUrl,
      reading,
    };
  }
}

export async function POST(request) {
  const burst = checkReportBurstLimit(reportClientIp(request));
  if (!burst.allowed) {
    return NextResponse.json({
      error: 'burst_limit_reached',
      message: '请求过于频繁，请稍后再试。 · Too many requests. Please wait and try again.',
    }, {
      status: 429,
      headers: { 'Retry-After': String(burst.retryAfter) },
    });
  }

  // Auth gate — Layer 2 only.
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!hasAwarenessAccess(user)) {
    return NextResponse.json({
      error: 'awareness_access_required',
      message: '此账户尚未获邀使用觉察卡。 · This account has not been invited to Awareness Cards.',
    }, { status: 403 });
  }

  if (process.env.NEXT_PUBLIC_REQUIRE_PLAN === 'true') {
    try {
      const profile = await getProfile(supabase, user.id);
      if (!profile || profile.plan === 'free') {
        return NextResponse.json({
          error: 'plan_required',
          message: '深度报告需要升级方案。 · A paid plan is required for Deep Reports.',
        }, { status: 403 });
      }
    } catch (error) {
      console.error('Unable to check report plan', error);
      return NextResponse.json({ error: 'plan_check_failed' }, { status: 500 });
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return invalidPayload('请求不是有效的 JSON。 · The request body is not valid JSON.');
  }

  let admin = null;
  let recipientAuthorization = null;
  const recipientVerificationId = body?.recipientVerificationId;
  if (recipientVerificationId !== undefined) {
    if (typeof recipientVerificationId !== 'string' || !UUID_PATTERN.test(recipientVerificationId)) {
      return invalidPayload('recipientVerificationId 格式无效。 · Recipient verification ID must be a valid UUID.');
    }
    let profile;
    try {
      profile = await getProfile(supabase, user.id);
    } catch (error) {
      console.error('Unable to check educator profile', error);
      return NextResponse.json({ error: 'educator_check_failed' }, { status: 500 });
    }
    if (profile?.role !== 'educator') {
      return NextResponse.json({
        error: 'educator_required',
        message: '只有教育者可以为他人建立报告。 · Only educators can create reports for others.',
      }, { status: 403 });
    }
    try {
      admin = createAdminSupabase();
      const authorization = await loadRecipientAuthorization({
        admin,
        verificationId: recipientVerificationId,
        educatorId: user.id,
      });
      if (authorization.error) {
        return NextResponse.json({ error: 'recipient_verification_invalid', message: authorization.error }, { status: 409 });
      }
      recipientAuthorization = authorization.value;
    } catch (error) {
      console.error('Unable to load recipient authorization', error);
      return NextResponse.json({
        error: 'recipient_verification_failed',
        message: '暂时无法确认收件授权。 · Could not confirm recipient authorization.',
      }, { status: 503 });
    }
  }

  let reading;
  let report;
  let normalized;
  const retryReadingId = body?.readingId;

  if (retryReadingId !== undefined) {
    if (typeof retryReadingId !== 'string' || !UUID_PATTERN.test(retryReadingId)) {
      return invalidPayload('readingId 格式无效。 · readingId must be a valid UUID.');
    }
    try {
      reading = await getReading(supabase, retryReadingId);
      if (!reading) {
        return NextResponse.json({ error: 'reading_not_found', message: '找不到这次抽牌。 · Reading not found.' }, { status: 404 });
      }
      const existing = await getReportByReading(supabase, retryReadingId);
      if (existing) {
        if (!recipientAuthorization) {
          return NextResponse.json({
            readingId: reading.id,
            reportId: existing.id,
            content: existing.content,
            createdAt: existing.created_at,
            reading: { mode: reading.mode, spread_key: reading.spread_key, cards: reading.cards },
            reused: true,
          });
        }
        report = existing;
      }
    } catch (error) {
      console.error('Unable to load retry reading', error);
      return NextResponse.json({ error: 'reading_load_failed' }, { status: 500 });
    }
    normalized = normalizeSavedReading(reading);
  } else {
    normalized = normalizeNewReading(body);
  }

  if (normalized.error) return invalidPayload(normalized.error);
  const { mode, spreadKey, positions, cardNumbers, question } = normalized.value;

  if (!report) {
    const limit = dailyLimit();
    try {
      const usedToday = await countReportsSince(supabase, { userId: user.id, since: startOfUtcDay() });
      if (usedToday >= limit) {
        return NextResponse.json({
          error: 'daily_limit_reached',
          message: `今日深度报告已达上限（${limit} 份，UTC）。 · Daily Deep Report limit reached (${limit}, UTC).`,
        }, { status: 429 });
      }
    } catch (error) {
      console.error('Unable to check report limit', error);
      return NextResponse.json({ error: 'limit_check_failed' }, { status: 500 });
    }

    // Persist the reading first (RLS: user can only insert their own).
    if (!reading) {
      const cardsPayload = cardNumbers.map((number, index) => ({
        n: number,
        position_cn: positions[index][0],
        position_en: positions[index][1],
      }));
      try {
        reading = await insertReading(supabase, {
          userId: user.id,
          mode,
          spreadKey,
          question: question || null,
          cards: cardsPayload,
        });
      } catch (error) {
        console.error('Unable to save reading', error);
        return NextResponse.json({ error: 'reading_save_failed' }, { status: 500 });
      }
    }

    // Version 2 is deterministic: all copy comes from the reviewed bilingual
    // card dataset, so report creation does not depend on an external AI model.
    const model = FIXED_REPORT_VERSION;
    const content = buildFixedReport({ mode, spreadKey, positions, cardNumbers, question });

    try {
      report = await insertReport(supabase, {
        userId: user.id,
        readingId: reading.id,
        model,
        content,
      });
    } catch (error) {
      console.error('Unable to save generated report', error);
      return NextResponse.json({ error: 'report_save_failed', readingId: reading.id }, { status: 500 });
    }
  }

  let deliveryResult = null;
  if (recipientAuthorization) {
    try {
      deliveryResult = await deliverRecipientReport({
        admin,
        authorization: recipientAuthorization,
        report,
        reading,
        request,
      });
    } catch (error) {
      console.error('Unable to prepare recipient report delivery', error);
      return NextResponse.json({
        error: 'report_delivery_failed',
        message: '报告已建立，但暂时无法准备邮件寄送。 · The report was created, but email delivery could not be prepared.',
        readingId: reading.id,
        reportId: report.id,
      }, { status: 500 });
    }
    if (deliveryResult.error) {
      return NextResponse.json({
        error: 'recipient_verification_used',
        message: deliveryResult.error,
      }, { status: 409 });
    }
  }

  return NextResponse.json({
    readingId: reading.id,
    reportId: report.id,
    content: report.content,
    createdAt: report.created_at,
    reading: { mode: reading.mode, spread_key: reading.spread_key, cards: reading.cards },
    recipient: recipientAuthorization ? {
      name: recipientAuthorization.recipient_name,
      email: recipientAuthorization.recipient_email,
    } : null,
    deliveryId: deliveryResult?.delivery?.id || null,
    deliveryStatus: deliveryResult?.delivery?.status || null,
    emailSent: deliveryResult?.emailSent ?? null,
    reportUrl: deliveryResult?.reportUrl || null,
    reused: deliveryResult?.reused || false,
  });
}
