/* eslint-disable react/prop-types */
import { forwardRef, useState } from 'react';
import { IconButton, InputAdornment } from '@mui/material';

export function PasswordVisibilityIcon({ visible, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {visible ? (
        <>
          <path d="M2.25 12S5.75 5.25 12 5.25 21.75 12 21.75 12 18.25 18.75 12 18.75 2.25 12 2.25 12Z" />
          <circle cx="12" cy="12" r="3.25" />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 6.1A10.6 10.6 0 0 1 12 6c6.25 0 9.75 6 9.75 6a17.8 17.8 0 0 1-2.4 3.2" />
          <path d="M6.5 7.4A17.5 17.5 0 0 0 2.25 12S5.75 18 12 18a10.5 10.5 0 0 0 4.1-.8" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </>
      )}
    </svg>
  );
}

export function PasswordVisibilityAdornment({ visible, onToggle, disabled = false }) {
  return (
    <InputAdornment position="end">
      <IconButton
        type="button"
        size="small"
        edge="end"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={onToggle}
        onMouseDown={(event) => event.preventDefault()}
        disabled={disabled}
      >
        <PasswordVisibilityIcon visible={visible} />
      </IconButton>
    </InputAdornment>
  );
}

const PasswordInput = forwardRef(function PasswordInput(
  { className = 'auth-input', ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrap">
      <input
        {...props}
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={className}
      />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        onMouseDown={(event) => event.preventDefault()}
        disabled={props.disabled}
      >
        <PasswordVisibilityIcon visible={visible} size={22} />
      </button>
    </div>
  );
});

export default PasswordInput;
