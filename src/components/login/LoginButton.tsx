import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { LoginStatus } from '../../hooks/useLogin';

export const LoginButton: React.FC<{ status: LoginStatus }> = ({ status }) => {
  const busy = status === 'loading';
  return (
    <button type="submit" className="vlx-btn" data-status={status} disabled={busy} aria-live="polite">
      <span>{busy ? 'Entrando...' : 'Entrar'}</span>
      {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="vlx-arrow w-4 h-4" aria-hidden="true" />}
    </button>
  );
};
