import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { VidalineLogo } from '../VidalineLogo';
import type { LoginStatus } from '../../hooks/useLogin';
import { LoginButton } from './LoginButton';
import { LoginInput } from './LoginInput';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ERROR_ID = 'login-error';

interface LoginFormProps {
  status: LoginStatus;
  error: string | null;
  onSubmit: (email: string, password: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ status, error, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const hasError = status === 'error' && !!error;
  const busy = status === 'loading';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busy) onSubmit(email, password);
  };

  const emailState = hasError ? 'error' : EMAIL_RE.test(email.trim()) ? 'success' : 'idle';

  return (
    <div>
      <div className="vlx-logo">
        <VidalineLogo size="xl" />
      </div>
      <h1 className="vlx-title">
        Iniciar <span>sessão</span>
      </h1>
      <p className="vlx-sub">
        Aceda ao sistema de gestão ERP &amp; CRM com a sua conta de funcionário.
      </p>

      <form onSubmit={handleSubmit} noValidate className="vlx-form" aria-busy={busy}>
        <LoginInput
          id="login-email"
          label="E-mail"
          type="email"
          required
          autoFocus
          autoComplete="email"
          inputMode="email"
          placeholder="nome@vidaline.co.ao"
          value={email}
          onChange={e => setEmail(e.target.value)}
          icon={<Mail className="w-full h-full" />}
          state={emailState}
          errorId={ERROR_ID}
          disabled={busy}
        />
        <LoginInput
          id="login-password"
          label="Palavra-passe"
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="current-password"
          placeholder="Digite a sua palavra-passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          icon={<Lock className="w-full h-full" />}
          state={hasError ? 'error' : 'idle'}
          errorId={ERROR_ID}
          disabled={busy}
          trailing={
            <button
              type="button"
              className="vlx-eye"
              onClick={() => setShowPassword(v => !v)}
              aria-pressed={showPassword}
              aria-label={showPassword ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
            >
              {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          }
        />

        {hasError && (
          <div id={ERROR_ID} role="alert" className="vlx-error">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <LoginButton status={status} />
      </form>
    </div>
  );
};
