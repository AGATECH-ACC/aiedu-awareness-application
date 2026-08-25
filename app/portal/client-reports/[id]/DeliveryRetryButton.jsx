'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeliveryRetryButton({ deliveryId }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function resend() {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/report-delivery/${deliveryId}`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '重新寄送失败。');
      setMessage('报告已重新寄出。');
      router.refresh();
    } catch (error) {
      setMessage(error.message || '重新寄送失败。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="client-report-retry">
      <button type="button" className="educator-secondary-button" onClick={resend} disabled={busy}>
        {busy ? '重新寄送中…' : '重新寄送报告'}
      </button>
      {message ? <div role="status">{message}</div> : null}
    </div>
  );
}
