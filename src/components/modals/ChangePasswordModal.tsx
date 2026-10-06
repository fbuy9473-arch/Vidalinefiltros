import React, { useState } from 'react';
import { X, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { storageService } from '../../services/storage';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const close = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 6) {
      setError('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    if (next !== confirm) {
      setError('A confirmação não coincide com a nova palavra-passe.');
      return;
    }
    setLoading(true);
    try {
      await storageService.changePassword(current, next);
      setSuccess(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar a palavra-passe.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm max-h-[92dvh] overflow-y-auto bg-[#111C38] border border-[#1E2D56] rounded-2xl shadow-2xl p-5 sm:p-6 text-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 font-bold text-white">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            Alterar palavra-passe
          </h2>
          <button onClick={close} className="p-1 text-slate-400 hover:text-white cursor-pointer" title="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Palavra-passe alterada com sucesso.</span>
            </div>
            <button onClick={close} className="w-full py-2 font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl cursor-pointer">
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="password" required autoComplete="current-password" placeholder="Palavra-passe atual" value={current} onChange={e => setCurrent(e.target.value)} className={inputClass} />
            <input type="password" required autoComplete="new-password" placeholder="Nova palavra-passe (mín. 6)" value={next} onChange={e => setNext(e.target.value)} className={inputClass} />
            <input type="password" required autoComplete="new-password" placeholder="Confirmar nova palavra-passe" value={confirm} onChange={e => setConfirm(e.target.value)} className={inputClass} />
            {error && (
              <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full py-2 font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-60 rounded-xl cursor-pointer">
              {loading ? 'A guardar...' : 'Guardar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
