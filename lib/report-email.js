import 'server-only';
import {
  brandedEmailAction,
  brandedEmailCode,
  brandedEmailFrame,
  emailBrandIconUrl,
} from './branded-email.mjs';
import { readingReportName, readingSpreadLabel } from './cards';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function sendResendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error('resend_not_configured');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.id) {
    const providerMessage = typeof data?.message === 'string' ? data.message.slice(0, 300) : 'email_provider_error';
    throw new Error(`resend_${response.status}_${providerMessage}`);
  }
  return data.id;
}

function emailFrame(options) {
  return brandedEmailFrame({
    ...options,
    iconUrl: emailBrandIconUrl(process.env.NEXT_PUBLIC_SITE_URL),
  });
}

export function sendRecipientOtpEmail({ name, email, code, expiresMinutes = 10 }) {
  const safeName = escapeHtml(name);
  const safeCode = escapeHtml(code);
  return sendResendEmail({
    to: email,
    subject: `${code}｜幸福人生觉察卡验证代码`,
    text: `${name}，你的验证代码是 ${code}。代码将在 ${expiresMinutes} 分钟后失效。若你没有同意这次觉察卡报告，请忽略此邮件。`,
    html: emailFrame({
      eyebrow: '收件确认',
      title: `${safeName}，请确认这次觉察卡报告`,
      body: `请把以下六位代码告诉正在为你进行觉察卡抽牌的教育者。${brandedEmailCode(safeCode)}代码将在 ${expiresMinutes} 分钟后失效，并且只能用于一份报告。`,
    }),
  });
}

export function sendRecipientReportEmail({ name, email, reportUrl, reading = null }) {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(reportUrl);
  const reportName = readingReportName(reading?.mode);
  const cardCount = Array.isArray(reading?.cards) ? reading.cards.length : Number(reading?.mode) || 0;
  const spreadSummary = reading?.mode
    ? `${escapeHtml(readingSpreadLabel(reading.mode, reading.spread_key))}${cardCount ? ` · ${cardCount} 张牌` : ''}`
    : '';
  const action = brandedEmailAction({
    href: safeUrl,
    label: '查看我的报告',
  });
  return sendResendEmail({
    to: email,
    subject: `${name}，你的${reportName.cn}已准备好`,
    text: `${name}，你的幸福人生觉察卡报告已准备好：${reportUrl}`,
    html: emailFrame({
      eyebrow: '你的觉察报告',
      title: `${safeName}，你的${reportName.cn}已准备好`,
      body: `感谢你确认这次抽牌。你可以通过下方的私人链接阅读完整的觉察报告。${spreadSummary ? `<div style="margin-top:18px;padding:12px 14px;border:1px solid #dfcfac;border-radius:10px;background:#fffaf0;color:#56452e;font-weight:700">${spreadSummary}</div>` : ''}`,
      action,
    }),
  });
}
