export const INVALID_LOGIN_MESSAGE = '电邮或密码不正确。 · The email or password is incorrect.';
export const ACCESS_REQUIRED_MESSAGE = '此账户尚未获邀使用觉察卡，请联系教育者。 · This account has not been invited to Awareness Cards. Please contact your educator.';
export const EXPIRED_PASSWORD_LINK_MESSAGE = '此密码连结已过期、无效或已经使用。请申请新的重设连结，或请教育者重新邀请。 · This password link has expired, is invalid, or has already been used. Request a new reset link or ask your educator to invite you again.';

const TOO_MANY_ATTEMPTS_MESSAGE = '尝试次数过多，请稍后再试。 · Too many attempts. Please try again later.';
const SERVICE_UNAVAILABLE_MESSAGE = '登入服务暂时无法使用，请稍后再试。 · The sign-in service is temporarily unavailable. Please try again.';

export function loginErrorMessage(error) {
  switch (error?.code) {
    case 'invalid_credentials':
    case 'user_not_found':
      return INVALID_LOGIN_MESSAGE;
    case 'email_not_confirmed':
      return '账户尚未完成启用。请打开最新的邀请电邮并设定密码。 · This account has not been activated. Open the latest invitation email and set a password.';
    case 'user_banned':
      return '此账户已被停用，请联系教育者。 · This account has been disabled. Please contact your educator.';
    case 'over_request_rate_limit':
      return TOO_MANY_ATTEMPTS_MESSAGE;
    case 'email_provider_disabled':
    case 'provider_disabled':
      return '密码登入尚未启用，请联系管理员。 · Password sign-in is not enabled. Please contact the administrator.';
    default:
      return SERVICE_UNAVAILABLE_MESSAGE;
  }
}

export function passwordEmailErrorMessage(error) {
  switch (error?.code) {
    case 'email_address_invalid':
      return '请输入有效的电邮地址。 · Enter a valid email address.';
    case 'email_address_not_authorized':
      return '目前无法寄送到此电邮地址，请联系管理员。 · Email cannot currently be sent to this address. Please contact the administrator.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return '重设电邮发送过于频繁，请稍后再试。 · Too many reset emails were requested. Please try again later.';
    default:
      return '暂时无法寄出密码重设电邮，请稍后再试。 · The password reset email could not be sent. Please try again.';
  }
}

export function updatePasswordErrorMessage(error) {
  switch (error?.code) {
    case 'weak_password':
      return '密码不符合安全要求。请使用至少 8 个字符，并避免容易猜测的密码。 · This password does not meet the security requirements. Use at least 8 characters and avoid an easily guessed password.';
    case 'same_password':
      return '新密码不能与目前密码相同。 · Your new password must be different from your current password.';
    case 'session_expired':
    case 'session_not_found':
    case 'invite_not_found':
    case 'otp_expired':
      return EXPIRED_PASSWORD_LINK_MESSAGE;
    case 'over_request_rate_limit':
      return TOO_MANY_ATTEMPTS_MESSAGE;
    default:
      return '暂时无法更新密码，请稍后再试。 · The password could not be updated. Please try again.';
  }
}
