import ForgotPasswordClient from './ForgotPasswordClient';

export const metadata = {
  title: '重设密码 · Reset Password',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
