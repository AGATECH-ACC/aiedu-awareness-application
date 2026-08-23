'use client';

import { useRouter } from 'next/navigation';

export default function ReportBackButton() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/');
  }

  return (
    <button
      type="button"
      className="public-report-back"
      onClick={handleBack}
      aria-label="返回上一页 · Go back"
    >
      <span aria-hidden="true">←</span>
      <span>返回 · Back</span>
    </button>
  );
}
