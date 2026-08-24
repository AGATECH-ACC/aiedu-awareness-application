'use client';
import React from 'react';

// Lightweight renderer for the controlled report Markdown returned by the API.
export default function Markdownish({ text }) {
  const blocks = [];
  const lines = (text || '').split('\n');
  let list = null;
  let listType = null;

  const inline = (s) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : <React.Fragment key={i}>{part}</React.Fragment>
    );

  const flush = () => {
    if (!list) return;
    const key = `${listType}-${blocks.length}`;
    const style = { margin: '7px 0 14px', paddingLeft: 22, color: '#3a352e', fontSize: 16 };
    blocks.push(listType === 'ol' ? <ol key={key} style={style}>{list}</ol> : <ul key={key} style={style}>{list}</ul>);
    list = null;
    listType = null;
  };

  lines.forEach((raw, idx) => {
    const l = raw.trim();
    const ordered = l.match(/^\d+\.\s+(.+)$/);
    if (l.startsWith('### ')) {
      flush();
      blocks.push(<h4 key={idx} style={{ fontSize: 16, color: '#5e5039', margin: '16px 0 7px' }}>{l.slice(4)}</h4>);
    } else if (l.startsWith('## ')) {
      flush();
      blocks.push(<h3 key={idx} style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#b5842b', margin: '20px 0 9px', borderBottom: '1px solid #eadfc4', paddingBottom: 5 }}>{l.slice(3)}</h3>);
    } else if (l.startsWith('# ')) {
      flush();
      blocks.push(<h2 key={idx} style={{ fontFamily: 'Georgia, serif', fontSize: 22, margin: '18px 0 9px' }}>{l.slice(2)}</h2>);
    } else if (l.startsWith('- ') || l.startsWith('* ')) {
      if (listType && listType !== 'ul') flush();
      if (!list) list = [];
      listType = 'ul';
      list.push(<li key={idx} style={{ margin: '3px 0', lineHeight: 1.6 }}>{inline(l.slice(2))}</li>);
    } else if (ordered) {
      if (listType && listType !== 'ol') flush();
      if (!list) list = [];
      listType = 'ol';
      list.push(<li key={idx} style={{ margin: '4px 0', lineHeight: 1.65 }}>{inline(ordered[1])}</li>);
    } else if (l.startsWith('> ')) {
      flush();
      blocks.push(<blockquote key={idx} style={{ margin: '12px 0', padding: '12px 14px', borderLeft: '3px solid #b5842b', background: '#f7efdf', color: '#5e5039', fontSize: 16, lineHeight: 1.72 }}>{inline(l.slice(2))}</blockquote>);
    } else if (l === '') {
      flush();
    } else {
      flush();
      blocks.push(<p key={idx} style={{ margin: '7px 0', lineHeight: 1.78, color: '#3a352e', fontSize: 16 }}>{inline(l)}</p>);
    }
  });
  flush();
  return <div className="markdownish-report">{blocks}</div>;
}
