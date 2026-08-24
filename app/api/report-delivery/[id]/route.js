import { NextResponse } from 'next/server';
import { getEducatorRequestContext } from '@/lib/educator-auth';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { sendRecipientReportEmail } from '@/lib/report-email';

export const runtime = 'nodejs';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function problem(status, error, message) {
  return NextResponse.json({ error, message }, { status });
}

function reportOrigin(request) {
  const requestOrigin = new URL(request.url).origin;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin)) return requestOrigin;
  try {
    return process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
      : requestOrigin;
  } catch {
    return requestOrigin;
  }
}

export async function POST(request, { params }) {
  const deliveryId = params?.id;
  if (!UUID_PATTERN.test(deliveryId || '')) {
    return problem(400, 'invalid_delivery_id', '邮件记录格式无效。 · Invalid delivery ID.');
  }

  let context;
  try {
    context = await getEducatorRequestContext();
  } catch (error) {
    console.error('Unable to authorize report resend', error);
    return problem(500, 'authorization_failed', '暂时无法验证教育者身份。 · Could not verify the educator account.');
  }
  if (context.error) {
    return problem(context.status, context.error, context.status === 401
      ? '请重新登入。 · Please sign in again.'
      : '此功能只开放给教育者。 · This feature is available to educators only.');
  }

  let admin;
  try {
    admin = createAdminSupabase();
  } catch (error) {
    console.error('Report delivery backend is not configured', error);
    return problem(503, 'delivery_not_configured', '报告寄送尚未完成服务器设置。 · Report delivery is not configured yet.');
  }

  const { data: delivery, error } = await admin
    .from('educator_report_deliveries')
    .select('id, educator_id, report_id, recipient_name, recipient_email, status, emailed_at, updated_at')
    .eq('id', deliveryId)
    .eq('educator_id', context.user.id)
    .maybeSingle();
  if (error) {
    console.error('Unable to load report delivery', error);
    return problem(500, 'delivery_lookup_failed', '暂时无法读取邮件记录。 · Could not load the delivery.');
  }
  if (!delivery) return problem(404, 'delivery_not_found', '找不到这份邮件记录。 · Delivery not found.');
  if (delivery.status === 'sent') {
    return NextResponse.json({ deliveryId, status: 'sent', emailedAt: delivery.emailed_at, reused: true });
  }
  if (Date.now() - new Date(delivery.updated_at).getTime() < 60_000) {
    return problem(429, 'resend_too_soon', '请稍候一分钟再重新寄送。 · Wait one minute before resending.');
  }

  const { data: report, error: reportError } = await admin
    .from('deep_reports')
    .select('id, share_token, is_public, reading:readings!deep_reports_reading_id_fkey ( mode, spread_key, cards )')
    .eq('id', delivery.report_id)
    .eq('user_id', context.user.id)
    .maybeSingle();
  if (reportError || !report?.is_public || !report?.share_token) {
    console.error('Unable to load shared report for resend', reportError);
    return problem(409, 'report_not_shareable', '报告分享连结尚未准备好。 · The report link is not ready.');
  }

  const reportUrl = `${reportOrigin(request)}/r/${report.share_token}`;
  const reading = Array.isArray(report.reading) ? report.reading[0] : report.reading;
  try {
    const providerId = await sendRecipientReportEmail({
      name: delivery.recipient_name,
      email: delivery.recipient_email,
      reportUrl,
      reading,
    });
    const emailedAt = new Date().toISOString();
    const { error: updateError } = await admin
      .from('educator_report_deliveries')
      .update({ status: 'sent', email_provider_id: providerId, emailed_at: emailedAt, last_error: null })
      .eq('id', deliveryId)
      .eq('educator_id', context.user.id);
    if (updateError) throw updateError;
    return NextResponse.json({ deliveryId, status: 'sent', emailedAt, reportUrl });
  } catch (sendError) {
    console.error('Unable to resend recipient report', sendError);
    await admin
      .from('educator_report_deliveries')
      .update({ status: 'failed', last_error: String(sendError?.message || 'email_send_failed').slice(0, 500) })
      .eq('id', deliveryId)
      .eq('educator_id', context.user.id);
    return problem(503, 'email_send_failed', '报告邮件仍无法寄出，请检查 Resend 设置。 · The report email could not be sent. Check the Resend configuration.');
  }
}
