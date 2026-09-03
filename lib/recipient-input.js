export function normalizeRecipient(input) {
  const name = typeof input?.name === 'string' ? input.name.trim().replace(/\s+/g, ' ') : '';
  const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
  const phone = typeof input?.phone === 'string' ? input.phone.trim().replace(/[\s()-]/g, '') : '';

  if (!name || name.length > 120) {
    return { error: '请输入收件人的姓名（最多 120 个字）。' };
  }
  if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: '请输入有效的收件邮箱。' };
  }
  if (!/^\+?\d{7,20}$/.test(phone)) {
    return { error: '请输入有效的联系电话。' };
  }

  return { name, email, phone };
}
