import {
  brandedEmailAction,
  brandedEmailCode,
  brandedEmailFrame,
} from '../lib/branded-email.mjs';

const TEMPLATE_ICON_URL = '{{ .SiteURL }}/apple-icon.png';
const CONFIRMATION_URL = '{{ .ConfirmationURL }}';
const APP_LOGIN_URL = '{{ .SiteURL }}/login';
const PASSWORD_RESET_URL = '{{ .SiteURL }}/forgot-password';

function frame(options) {
  return brandedEmailFrame({ ...options, iconUrl: TEMPLATE_ICON_URL, includeEnglishBrand: true });
}

function action(label, href = CONFIRMATION_URL) {
  return brandedEmailAction({ href, label });
}

const authTemplates = {
  confirmation: {
    subject: '确认你的电邮 · Confirm your email',
    content: frame({
      eyebrow: 'EMAIL CONFIRMATION · 电邮确认',
      title: '确认你的电邮地址',
      body: '请点击下方按钮确认你的电邮地址。<br><span style="color:#766149">Confirm your email address using the secure button below.</span>',
      action: action('确认电邮 · Confirm email'),
    }),
  },
  invite: {
    subject: '幸福人生觉察卡账户邀请 · Your private account invitation',
    content: frame({
      eyebrow: 'PRIVATE ACCOUNT INVITATION · 私人账户邀请',
      title: '{{ if .Data.full_name }}{{ .Data.full_name }}，{{ end }}欢迎加入幸福人生觉察卡',
      body: '教育者已邀请你开通私人账户。请使用下方的安全连结建立密码；此邀请只供你本人使用。<br><span style="color:#766149">An educator has invited you to activate a private account. Use the secure link below to create your password. This invitation is for you only.</span>',
      action: action('建立我的密码 · Create my password'),
    }),
  },
  recovery: {
    subject: '重设密码 · Reset your password',
    content: frame({
      eyebrow: 'PASSWORD RESET · 重设密码',
      title: '重设你的密码',
      body: '我们收到你的密码重设请求。请使用下方的安全连结建立新密码。若这不是你的操作，可以忽略此邮件。<br><span style="color:#766149">We received a request to reset your password. Use the secure link below to choose a new password. If you did not request this, you can safely ignore this email.</span>',
      action: action('重设密码 · Reset password'),
    }),
  },
  magic_link: {
    subject: '幸福人生觉察卡登入连结 · Your sign-in link',
    content: frame({
      eyebrow: 'SECURE SIGN-IN · 安全登入',
      title: '登入幸福人生觉察卡',
      body: '请点击下方按钮安全登入你的账户。此私人连结将很快失效，并且只能使用一次。<br><span style="color:#766149">Use the button below to sign in securely. This private link expires shortly and can only be used once.</span>',
      action: action('安全登入 · Sign in securely'),
    }),
  },
  email_change: {
    subject: '确认新电邮 · Confirm your new email',
    content: frame({
      eyebrow: 'EMAIL CHANGE · 更改电邮',
      title: '确认你的新电邮地址',
      body: '你正在把账户电邮更改为 <strong>{{ .NewEmail }}</strong>。请点击下方按钮确认。若这不是你的操作，请忽略此邮件并联系支援。<br><span style="color:#766149">You are changing your account email to <strong>{{ .NewEmail }}</strong>. Confirm the change below. If you did not request this, ignore this email and contact support.</span>',
      action: action('确认新电邮 · Confirm new email'),
    }),
  },
  reauthentication: {
    subject: '{{ .Token }}｜幸福人生觉察卡验证码',
    content: frame({
      eyebrow: 'SECURITY VERIFICATION · 安全验证',
      title: '确认是你本人',
      body: `请输入以下六位验证码以继续。请勿把验证码告诉任何人。<br><span style="color:#766149">Enter this six-digit code to continue. Never share it with anyone.</span>${brandedEmailCode('{{ .Token }}')}验证码将很快失效，并且只能使用一次。<br><span style="color:#766149">The code expires shortly and can only be used once.</span>`,
    }),
  },
};

const notificationTemplates = {
  password_changed_notification: {
    subject: '你的密码已更改 · Your password was changed',
    content: frame({
      eyebrow: 'SECURITY NOTICE · 安全通知',
      title: '你的密码已更改',
      body: '你的账户密码最近已更改。若这是你的操作，无需采取任何行动。若不是，请立即重设密码并联系支援。<br><span style="color:#766149">Your account password was recently changed. If this was you, no action is needed. Otherwise, reset your password immediately and contact support.</span>',
      action: action('保护我的账户 · Secure my account', PASSWORD_RESET_URL),
    }),
  },
  email_changed_notification: {
    subject: '你的账户电邮已更改 · Your account email was changed',
    content: frame({
      eyebrow: 'SECURITY NOTICE · 安全通知',
      title: '你的账户电邮已更改',
      body: '账户电邮已从 <strong>{{ .OldEmail }}</strong> 更改为 <strong>{{ .Email }}</strong>。若这不是你的操作，请立即联系支援。<br><span style="color:#766149">Your account email changed from <strong>{{ .OldEmail }}</strong> to <strong>{{ .Email }}</strong>. If this was not you, contact support immediately.</span>',
      action: action('前往登入页面 · Go to sign in', APP_LOGIN_URL),
    }),
  },
  phone_changed_notification: {
    subject: '你的电话号码已更改 · Your phone number was changed',
    content: frame({
      eyebrow: 'SECURITY NOTICE · 安全通知',
      title: '你的电话号码已更改',
      body: '账户电话号码已从 <strong>{{ .OldPhone }}</strong> 更改为 <strong>{{ .Phone }}</strong>。若这不是你的操作，请立即联系支援。<br><span style="color:#766149">Your account phone number changed from <strong>{{ .OldPhone }}</strong> to <strong>{{ .Phone }}</strong>. If this was not you, contact support immediately.</span>',
      action: action('前往登入页面 · Go to sign in', APP_LOGIN_URL),
    }),
  },
  mfa_factor_enrolled_notification: {
    subject: '已新增登入验证方式 · A sign-in method was added',
    content: frame({
      eyebrow: 'SECURITY NOTICE · 安全通知',
      title: '已新增登入验证方式',
      body: '你的账户已新增 <strong>{{ .FactorType }}</strong> 验证方式。若这不是你的操作，请立即联系支援。<br><span style="color:#766149">A <strong>{{ .FactorType }}</strong> verification method was added to your account. If this was not you, contact support immediately.</span>',
      action: action('前往登入页面 · Go to sign in', APP_LOGIN_URL),
    }),
  },
  mfa_factor_unenrolled_notification: {
    subject: '已移除登入验证方式 · A sign-in method was removed',
    content: frame({
      eyebrow: 'SECURITY NOTICE · 安全通知',
      title: '已移除登入验证方式',
      body: '你的账户已移除 <strong>{{ .FactorType }}</strong> 验证方式。若这不是你的操作，请立即联系支援。<br><span style="color:#766149">A <strong>{{ .FactorType }}</strong> verification method was removed from your account. If this was not you, contact support immediately.</span>',
      action: action('前往登入页面 · Go to sign in', APP_LOGIN_URL),
    }),
  },
  identity_linked_notification: {
    subject: '已连结新的登入方式 · A sign-in method was linked',
    content: frame({
      eyebrow: 'SECURITY NOTICE · 安全通知',
      title: '已连结新的登入方式',
      body: '你的 <strong>{{ .Provider }}</strong> 账户已连结至 <strong>{{ .Email }}</strong>。若这不是你的操作，请立即联系支援。<br><span style="color:#766149">Your <strong>{{ .Provider }}</strong> account was linked as a sign-in method for <strong>{{ .Email }}</strong>. If this was not you, contact support immediately.</span>',
      action: action('前往登入页面 · Go to sign in', APP_LOGIN_URL),
    }),
  },
  identity_unlinked_notification: {
    subject: '已移除登入方式 · A sign-in method was removed',
    content: frame({
      eyebrow: 'SECURITY NOTICE · 安全通知',
      title: '已移除登入方式',
      body: '你的 <strong>{{ .Provider }}</strong> 账户已从 <strong>{{ .Email }}</strong> 移除。若这不是你的操作，请立即联系支援。<br><span style="color:#766149">Your <strong>{{ .Provider }}</strong> account was removed as a sign-in method for <strong>{{ .Email }}</strong>. If this was not you, contact support immediately.</span>',
      action: action('前往登入页面 · Go to sign in', APP_LOGIN_URL),
    }),
  },
};

export const supabaseEmailTemplates = {
  ...authTemplates,
  ...notificationTemplates,
};

export function buildSupabaseAuthEmailConfig() {
  const config = {};
  for (const [name, template] of Object.entries(supabaseEmailTemplates)) {
    config[`mailer_subjects_${name}`] = template.subject;
    config[`mailer_templates_${name}_content`] = template.content;
  }
  return config;
}

export function validateSupabaseEmailTemplates() {
  const errors = [];
  const entries = Object.entries(supabaseEmailTemplates);

  for (const [name, template] of entries) {
    if (!template.subject?.trim()) errors.push(`${name}: missing subject`);
    if (!template.content.includes(TEMPLATE_ICON_URL)) errors.push(`${name}: missing brand icon`);
    if (!template.content.includes('幸福人生觉察卡')) errors.push(`${name}: missing Chinese brand name`);
    if (!template.content.includes('HAPPY LIFE AWARENESS CARDS')) errors.push(`${name}: missing English brand name`);
  }

  for (const name of ['confirmation', 'invite', 'recovery', 'magic_link', 'email_change']) {
    if (!supabaseEmailTemplates[name].content.includes(CONFIRMATION_URL)) {
      errors.push(`${name}: missing confirmation URL`);
    }
  }

  if (!supabaseEmailTemplates.reauthentication.content.includes('{{ .Token }}')) {
    errors.push('reauthentication: missing token');
  }

  if (entries.length !== 13) errors.push(`expected 13 templates, found ${entries.length}`);
  return errors;
}

function projectRefFromEnvironment() {
  if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const match = url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i);
  return match?.[1] || '';
}

async function deployTemplates() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = projectRefFromEnvironment();
  if (!accessToken || !projectRef) {
    throw new Error('Set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF before deploying email templates.');
  }

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildSupabaseAuthEmailConfig()),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase email-template update failed (${response.status}): ${message.slice(0, 400)}`);
  }

  console.log(`Updated ${Object.keys(supabaseEmailTemplates).length} email templates for Supabase project ${projectRef}.`);
}

async function main() {
  const errors = validateSupabaseEmailTemplates();
  if (errors.length) throw new Error(`Email template validation failed:\n- ${errors.join('\n- ')}`);

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(buildSupabaseAuthEmailConfig(), null, 2));
    return;
  }

  if (process.argv.includes('--deploy')) {
    await deployTemplates();
    return;
  }

  console.log(`Validated ${Object.keys(supabaseEmailTemplates).length} branded Supabase email templates.`);
}

if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
