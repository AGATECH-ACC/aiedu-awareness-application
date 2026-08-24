'use client';

import { Eye } from '@phosphor-icons/react/Eye';
import { EyeSlash } from '@phosphor-icons/react/EyeSlash';
import { useState } from 'react';

export default function PasswordInput({ id, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? '隐藏密码 · Hide password' : '显示密码 · Show password';

  return (
    <div className="auth-password-control">
      <input {...inputProps} id={id} type={visible ? 'text' : 'password'} />
      <button
        className="auth-password-toggle"
        type="button"
        aria-controls={id}
        aria-label={toggleLabel}
        aria-pressed={visible}
        title={toggleLabel}
        onClick={() => setVisible((current) => !current)}
      >
        {visible
          ? <EyeSlash size={22} weight="regular" aria-hidden="true" />
          : <Eye size={22} weight="regular" aria-hidden="true" />}
      </button>
    </div>
  );
}
