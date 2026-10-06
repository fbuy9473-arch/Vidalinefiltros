import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { storageService } from '../services/storage';
import { VidalineLogo } from './VidalineLogo';

interface LoginViewProps {
  initialError?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({ initialError = null }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await storageService.login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar sessão.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] flex items-center justify-center p-4 text-slate-100">
      <div className="w-full max-w-md bg-[#0B132B] border border-[#1A2649] rounded-2xl shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <VidalineLogo size="lg" />
        </div>
        <h1 className="text-lg font-bold text-white text-center">Iniciar sessão</h1>
        <p className="text-xs text-slate-400 text-center mt-1 mb-6">
          Aceda ao sistema de gestão ERP & CRM com a sua conta de funcionário.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label htmlFor="login-email" className="font-bold text-slate-200 block mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                required
                autoFocus
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome@vidaline.co.ao"
                className="w-full pl-9 pr-3 py-2.5 bg-[#121D3A] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="font-bold text-slate-200 block mb-1">
              Palavra-passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#121D3A] border border-[#1E2D56] rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-60 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-sky-900/30 transition-colors cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
