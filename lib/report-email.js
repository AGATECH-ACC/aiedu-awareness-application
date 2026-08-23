import 'server-only';

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

function emailFrame({ eyebrow, title, body, action }) {
  return `<!doctype html>
<html lang="zh-CN"><body style="margin:0;background:#f0eadb;color:#201d1a;font-family:Arial,'Noto Sans SC',sans-serif">
  <div style="max-width:620px;margin:0 auto;padding:38px 18px">
    <div style="border:1px solid #ed2f3d;border-radius:22px;background:#fff9ec;padding:7px;box-shadow:inset 0 0 0 2px #253794">
      <div style="padding:30px 28px">
        <div style="color:#b9782d;font:700 11px Georgia,serif;letter-spacing:.18em">${eyebrow}</div>
        <h1 style="margin:12px 0 16px;font:700 28px Georgia,'Noto Serif SC',serif;line-height:1.35">${title}</h1>
        <div style="color:#5f5549;font-size:15px;line-height:1.75">${body}</div>
        ${action || ''}
        <div style="margin-top:26px;padding-top:18px;border-top:1px solid #decba5;color:#8b7a60;font-size:12px;line-height:1.6">
          幸福人生觉察卡 · Happy Life Awareness Cards<br>A gentle tool for reflection — not diagnosis or advice.
        </div>
      </div>
    </div>
  </div>
</body></html>`;
}

export function sendRecipientOtpEmail({ name, email, code, expiresMinutes = 10 }) {
  const safeName = escapeHtml(name);
  const safeCode = escapeHtml(code);
  return sendResendEmail({
    to: email,
    subject: `${code}｜幸福人生觉察卡验证代码`,
    text: `${name}，你的验证代码是 ${code}。代码将在 ${expiresMinutes} 分钟后失效。若你没有同意这次觉察卡报告，请忽略此邮件。`,
    html: emailFrame({
      eyebrow: 'RECIPIENT CONSENT · 收件确认',
      title: `${safeName}，请确认这次觉察卡报告`,
      body: `请把以下六位代码告诉正在为你进行觉察卡抽牌的教育者。<br><span style="color:#766149">Share this six-digit code with the educator conducting your reading.</span><div style="margin:22px 0;padding:18px;border:1px solid #b9782d;border-radius:12px;background:#f5ecd9;color:#102b4d;font:700 34px Georgia,serif;letter-spacing:.24em;text-align:center">${safeCode}</div>代码将在 ${expiresMinutes} 分钟后失效，并且只能用于一份报告。<br><span style="color:#766149">It expires in ${expiresMinutes} minutes and authorizes one report only.</span>`,
    }),
  });
}

export function sendRecipientReportEmail({ name, email, reportUrl }) {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(reportUrl);
  const action = `<a href="${safeUrl}" style="display:inline-block;margin-top:22px;padding:13px 20px;border-radius:9px;background:#102b4d;color:#fff9ec;font-weight:700;text-decoration:none">查看我的报告 · View my report</a>`;
  return sendResendEmail({
    to: email,
    subject: `${name}，你的幸福人生觉察卡报告已准备好`,
    text: `${name}，你的幸福人生觉察卡报告已准备好：${reportUrl}`,
    html: emailFrame({
      eyebrow: 'YOUR AWARENESS REPORT · 你的觉察报告',
      title: `${safeName}，你的报告已准备好`,
      body: '感谢你确认这次抽牌。你可以通过下方的私人链接阅读完整的双语觉察报告。<br><span style="color:#766149">Thank you for confirming this reading. Use the private link below to read your complete bilingual awareness report.</span>',
      action,
    }),
  });
}
