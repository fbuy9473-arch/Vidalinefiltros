import React, { useState } from 'react';
import {
  X,
  Droplets,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Customer } from '../../types';
import { storageService } from '../../services/storage';

interface RecordBottleReturnModalProps {
  customer: Customer | null;
  onClose: () => void;
  onReturned: () => void;
}

export const RecordBottleReturnModal: React.FC<RecordBottleReturnModalProps> = ({
  customer,
  onClose,
  onReturned
}) => {
  if (!customer) return null;

  const [quantity, setQuantity] = useState<number | string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const qtyNum = Number(quantity) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qtyNum || qtyNum <= 0) {
      setErrorMsg('A quantidade a recolher deve ser maior que zero.');
      return;
    }
    if (qtyNum > customer.bottlesInPossession) {
      setErrorMsg(`A quantidade não pode ser maior que os garrafões em posse do cliente (${customer.bottlesInPossession} un).`);
      return;
    }

    try {
      storageService.recordBottleReturn(customer.id, qtyNum);
      onReturned();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar devolução.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] shadow-2xl w-full max-w-md max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E2D56] flex items-center justify-between bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#162752] border border-[#233A70] text-cyan-400">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Recolha de Garrafões 20L</h2>
              <p className="text-xs text-slate-400">Devolução de vasilhames vazios ao armazém Vidaline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#162752] rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-[#0B132B] border border-[#203D7A] rounded-xl space-y-1">
            <span className="text-[11px] text-cyan-400 font-medium">Cliente:</span>
            <p className="font-bold text-white text-sm">{customer.name}</p>
            <p className="text-[11px] text-slate-400">
              Garrafões atualmente em posse: <strong className="text-cyan-300">{customer.bottlesInPossession} unidades</strong>
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-200 block mb-1">
              Quantidade de Garrafões 20L Recolhidos: *
            </label>
            <input
              type="number"
              min="1"
              max={customer.bottlesInPossession}
              placeholder="Digite a quantidade recolhida..."
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-lg font-black text-cyan-300 placeholder:text-slate-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Após a devolução, restarão {Math.max(0, customer.bottlesInPossession - qtyNum)} garrafões com o cliente.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#1E2D56]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-300 bg-[#162752] border border-[#233B78] hover:bg-[#1E3672] rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl shadow-md shadow-sky-900/40 transition-all cursor-pointer"
            >
              Confirmar Recolha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
