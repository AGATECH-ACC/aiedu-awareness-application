export const DEFAULT_EMAIL_SITE_ORIGIN = 'https://app.aiedu.academy';

export function emailBrandIconUrl(siteOrigin = DEFAULT_EMAIL_SITE_ORIGIN) {
  const normalizedOrigin = String(siteOrigin || DEFAULT_EMAIL_SITE_ORIGIN).replace(/\/$/, '');
  return `${normalizedOrigin}/apple-icon.png`;
}

export function brandedEmailFrame({
  iconUrl = emailBrandIconUrl(),
  eyebrow,
  title,
  body,
  action = '',
  includeEnglishBrand = false,
}) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;background:#f0eadb;color:#201d1a;font-family:Arial,'Noto Sans SC',sans-serif">
  <div style="max-width:620px;margin:0 auto;padding:38px 18px">
    <div style="border:1px solid #ed2f3d;border-radius:22px;background:#fff9ec;padding:7px;box-shadow:inset 0 0 0 2px #253794">
      <div style="padding:30px 28px">
        <div style="margin:0 0 24px;text-align:center">
          <img src="${iconUrl}" width="64" height="64" alt="幸福人生觉察卡" style="display:block;width:64px;height:64px;margin:0 auto 12px;border:0;border-radius:15px">
          <div style="color:#102b4d;font:700 17px Georgia,'Noto Serif SC',serif;letter-spacing:.04em">幸福人生觉察卡</div>
          ${includeEnglishBrand ? '<div style="margin-top:4px;color:#766149;font-size:10px;font-weight:700;letter-spacing:.16em">HAPPY LIFE AWARENESS CARDS</div>' : ''}
        </div>
        <div style="color:#b9782d;font:700 11px Georgia,serif;letter-spacing:.18em">${eyebrow}</div>
        <h1 style="margin:12px 0 16px;color:#201d1a;font:700 28px Georgia,'Noto Serif SC',serif;line-height:1.35">${title}</h1>
        <div style="color:#5f5549;font-size:15px;line-height:1.75">${body}</div>
        ${action}
        <div style="margin-top:26px;padding-top:18px;border-top:1px solid #decba5;color:#8b7a60;font-size:12px;line-height:1.6">
          ${includeEnglishBrand ? '幸福人生觉察卡 · Happy Life Awareness Cards<br>A gentle tool for reflection — not diagnosis or advice.' : '用于自我觉察与反思，不是心理诊断、治疗或医疗建议。'}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function brandedEmailAction({ href, label }) {
  return `<a href="${href}" style="display:inline-block;margin-top:22px;padding:13px 20px;border:1px solid #b9782d;border-radius:9px;background:#102b4d;color:#fff9ec;font-weight:700;text-decoration:none">${label}</a>`;
}

export function brandedEmailCode(code) {
  return `<div style="margin:22px 0;padding:18px;border:1px solid #b9782d;border-radius:12px;background:#f5ecd9;color:#102b4d;font:700 34px Georgia,serif;letter-spacing:.24em;text-align:center">${code}</div>`;
}
