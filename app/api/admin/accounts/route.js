import { NextResponse } from 'next/server';
import { AWARENESS_ACCESS_CLAIM } from '@/lib/awareness-access';
import { getEducatorRequestContext } from '@/lib/educator-auth';
import { createAdminSupabase } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function problem(status, error, message, headers) {
  return NextResponse.json({ error, message }, { status, headers });
}

function normalizeInvitation(body) {
  const name = typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (name.length < 1 || name.length > 120) {
    return { error: '请输入 1–120 个字符的姓名。 · Enter a name between 1 and 120 characters.' };
  }
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { error: '请输入有效的电邮地址。 · Enter a valid email address.' };
  }

  return { name, email };
}

async function rollbackIncompleteInvitation(admin, userId, reason) {
  const { error: cleanupError } = await admin.auth.admin.deleteUser(userId);
  if (cleanupError) {
    console.error('Unable to roll back incomplete account invitation', {
      reason,
      code: cleanupError.code,
      status: cleanupError.status,
      userId,
    });
  }
}

export async function POST(request) {
  let context;
  try {
    context = await getEducatorRequestContext();
  } catch (error) {
    console.error('Unable to authorize account invitation', error);
    return problem(500, 'authorization_failed', '暂时无法验证教育者身份。 · Could not verify the educator account.');
  }

  if (context.error) {
    return problem(
      context.status,
      context.error,
      context.status === 401
        ? '请重新登入。 · Please sign in again.'
        : '只有教育者可以邀请新账户。 · Only educators can invite new accounts.'
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return problem(400, 'invalid_json', '请求内容无效。 · Invalid request body.');
  }

  const invitation = normalizeInvitation(body);
  if (invitation.error) return problem(400, 'invalid_invitation', invitation.error);

  let admin;
  try {
    admin = createAdminSupabase();
  } catch (error) {
    console.error('Account invitation backend is not configured', error);
    return problem(503, 'invitation_not_configured', '账户邀请尚未完成服务器设置。 · Account invitations are not configured yet.');
  }

  const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
  const redirectTo = `${siteOrigin}/auth/set-password`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(invitation.email, {
    data: { full_name: invitation.name },
    redirectTo,
  });

  if (error) {
    console.error('Unable to invite account', { code: error.code, status: error.status });

    if (error.code === 'user_already_exists' || error.code === 'email_exists') {
      return problem(409, 'account_exists', '此电邮已有账户，可以直接登入。 · This email already has an account and can sign in.');
    }
    if (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit' || error.status === 429) {
      return problem(429, 'rate_limit_reached', '邀请发送过于频繁，请稍后再试。 · Too many invitations were sent. Please try again later.', {
        'Retry-After': '60',
      });
    }
    if (error.code === 'email_address_invalid') {
      return problem(400, 'invalid_email', '请输入有效的电邮地址。 · Enter a valid email address.');
    }
    if (error.code === 'email_address_not_authorized') {
      return problem(502, 'email_not_authorized', '目前无法寄送到此电邮地址，请检查 Supabase SMTP 设置。 · Email cannot currently be sent to this address. Check the Supabase SMTP configuration.');
    }

    return problem(502, 'invitation_failed', '邀请暂时无法寄出，请稍后再试。 · The invitation could not be sent. Please try again.');
  }

  const invitedUser = data.user;
  if (!invitedUser) {
    return problem(502, 'invitation_failed', '邀请暂时无法完成，请稍后再试。 · The invitation could not be completed. Please try again.');
  }

  const { data: educatorProfile, error: roleError } = await admin
    .from('profiles')
    .update({ role: 'educator' })
    .eq('id', invitedUser.id)
    .select('id, role')
    .maybeSingle();
  if (roleError || educatorProfile?.role !== 'educator') {
    console.error('Unable to grant invited account educator role', {
      code: roleError?.code,
      status: roleError?.status,
      userId: invitedUser.id,
    });
    await rollbackIncompleteInvitation(admin, invitedUser.id, 'educator_role_failed');
    return problem(502, 'role_assignment_failed', '教育者账户暂时无法完成，请稍后再试。 · The educator account could not be completed. Please try again.');
  }

  const { error: accessError } = await admin.auth.admin.updateUserById(invitedUser.id, {
    app_metadata: {
      ...(invitedUser.app_metadata || {}),
      [AWARENESS_ACCESS_CLAIM]: true,
    },
  });
  if (accessError) {
    console.error('Unable to grant invited account access', { code: accessError.code, status: accessError.status });
    await rollbackIncompleteInvitation(admin, invitedUser.id, 'awareness_access_failed');
    return problem(502, 'access_grant_failed', '邀请暂时无法完成，请稍后再试。 · The invitation could not be completed. Please try again.');
  }

  return NextResponse.json({
    userId: invitedUser.id,
    name: invitation.name,
    email: invitation.email,
    role: educatorProfile.role,
    passwordSetupSent: true,
  }, { status: 201 });
}
