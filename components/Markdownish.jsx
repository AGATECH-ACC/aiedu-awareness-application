'use client';
import React from 'react';

// Minimal renderer for the report markdown (## headers, **bold**, - lists).
export default function Markdownish({ text }) {
  const blocks = [];
  const lines = (text || '').split('\n');
  let list = null;

  const inline = (s) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : <React.Fragment key={i}>{part}</React.Fragment>
    );

  const flush = () => { if (list) { blocks.push(<ul key={'u' + blocks.length} style={{ margin: '6px 0 12px', paddingLeft: 20 }}>{list}</ul>); list = null; } };

  lines.forEach((raw, idx) => {
    const l = raw.trim();
    if (l.startsWith('## ')) {
      flush();
      blocks.push(<h3 key={idx} style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#b5842b', margin: '18px 0 8px', borderBottom: '1px solid #eadfc4', paddingBottom: 5 }}>{l.slice(3)}</h3>);
    } else if (l.startsWith('# ')) {
      flush();
      blocks.push(<h2 key={idx} style={{ fontFamily: 'Georgia, serif', fontSize: 19, margin: '16px 0 8px' }}>{l.slice(2)}</h2>);
    } else if (l.startsWith('- ') || l.startsWith('* ')) {
      if (!list) list = [];
      list.push(<li key={idx} style={{ margin: '3px 0', lineHeight: 1.6 }}>{inline(l.slice(2))}</li>);
    } else if (l === '') {
      flush();
    } else {
      flush();
      blocks.push(<p key={idx} style={{ margin: '6px 0', lineHeight: 1.7, color: '#3a352e', fontSize: 14 }}>{inline(l)}</p>);
    }
  });
  flush();
  return <div>{blocks}</div>;
}
