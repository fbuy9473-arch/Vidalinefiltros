import React, { forwardRef } from 'react';

export type LoginInputState = 'idle' | 'error' | 'success';

interface LoginInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: string;
  icon: React.ReactNode;
  state?: LoginInputState;
  trailing?: React.ReactNode;
  errorId?: string;
}

export const LoginInput = forwardRef<HTMLInputElement, LoginInputProps>(
  ({ id, label, icon, state = 'idle', trailing, errorId, ...inputProps }, ref) => (
    <div className="vlx-field">
      <label htmlFor={id} className="vlx-label">{label}</label>
      <div className="vlx-input-wrap" data-state={state}>
        <span className="vlx-input-icon" aria-hidden="true">{icon}</span>
        <input
          {...inputProps}
          ref={ref}
          id={id}
          className="vlx-input"
          aria-invalid={state === 'error' || undefined}
          aria-describedby={state === 'error' ? errorId : undefined}
        />
        {trailing && <div className="vlx-trailing">{trailing}</div>}
      </div>
    </div>
  ),
);
LoginInput.displayName = 'LoginInput';
