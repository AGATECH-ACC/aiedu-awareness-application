'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error('Application error boundary', error);
  }, [error]);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: '#f4ebdc', color: '#2a2622' }}>
      <div role="alert" style={{ maxWidth: 430, textAlign: 'center', background: '#fffdf8', border: '1px solid #e2d5b8', borderRadius: 20, padding: '34px 26px' }}>
        <div aria-hidden="true" style={{ color: '#b5842b', fontSize: 34 }}>✦</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, margin: '8px 0' }}>暂时无法显示 · Something went wrong</h1>
        <p style={{ color: '#786d5c', fontSize: 13.5, lineHeight: 1.65 }}>请稍后重试，你的觉察旅程仍在这里。<br />Please try again; your reflection journey is still here.</p>
        <button type="button" onClick={reset} style={{ marginTop: 8, border: 0, background: '#2a2622', color: '#f3e6bf', borderRadius: 999, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>重试 · Try again</button>
      </div>
    </main>
  );
}
