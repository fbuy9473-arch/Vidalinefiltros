import { useCallback, useState } from 'react';
import { ApiError } from '../services/api';
import { storageService } from '../services/storage';

export type LoginStatus = 'idle' | 'loading' | 'error';

const INVALID_CREDENTIALS = 'Não foi possível iniciar sessão. Verifique o e-mail e a palavra-passe.';

export function useLogin(initialError: string | null = null) {
  const [status, setStatus] = useState<LoginStatus>(initialError ? 'error' : 'idle');
  const [error, setError] = useState<string | null>(initialError);

  const submit = useCallback(async (email: string, password: string) => {
    setError(null);
    setStatus('loading');
    try {
      await storageService.login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? INVALID_CREDENTIALS : err instanceof Error ? err.message : INVALID_CREDENTIALS);
      setStatus('error');
    }
  }, []);

  return { status, error, submit };
}
