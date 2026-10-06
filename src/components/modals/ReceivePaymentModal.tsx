import React, { useState } from 'react';
import {
  X,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { Receivable, PaymentMethod } from '../../types';
import { storageService } from '../../services/storage';
import { formatMoney, formatDate } from '../../lib/formatters';

interface ReceivePaymentModalProps {
  receivable: Receivable | null;
  onClose: () => void;
  onPaymentProcessed: () => void;
}

export const ReceivePaymentModal: React.FC<ReceivePaymentModalProps> = ({
  receivable,
  onClose,
  onPaymentProcessed
}) => {
  if (!receivable) return null;

  const [amount, setAmount] = useState<number | string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      setErrorMsg('O valor a liquidar deve ser maior que zero.');
      return;
    }
    if (amountNum > receivable.remainingAmount) {
      setErrorMsg(`O valor não pode ser superior ao saldo devedor (${formatMoney(receivable.remainingAmount)}).`);
      return;
    }
    if (!paymentMethod) {
      setErrorMsg('Selecione o meio de recebimento.');
      return;
    }

    try {
      storageService.receivePayment(receivable.id, amountNum, paymentMethod as PaymentMethod);
      onPaymentProcessed();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao liquidar pagamento.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] shadow-2xl w-full max-w-md max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E2D56] flex items-center justify-between bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Receber Pagamento</h2>
              <p className="text-xs text-slate-400">Liquidação de fatura com entrada no Livro Caixa</p>
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

          {/* Account Details */}
          <div className="p-3.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Cliente:</span>
              <span className="font-bold text-white">{receivable.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pedido Referência:</span>
              <span className="font-mono font-bold text-cyan-400">{receivable.orderCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Vencimento Original:</span>
              <span className="font-semibold text-slate-300">{formatDate(receivable.dueDate)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#1E2D56]">
              <span className="text-slate-400 font-medium">Saldo Restante:</span>
              <span className="font-black text-rose-400 text-sm">{formatMoney(receivable.remainingAmount)}</span>
            </div>
          </div>

          {/* Amount to receive */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-200">Valor a Receber / Liquidar (Kz):</label>
              <button
                type="button"
                onClick={() => setAmount(receivable.remainingAmount)}
                className="text-[10px] font-bold text-cyan-400 hover:underline cursor-pointer"
              >
                Liquidação Total ({formatMoney(receivable.remainingAmount)})
              </button>
            </div>
            <input
              type="number"
              min="100"
              max={receivable.remainingAmount}
              placeholder="Digite o valor a pagar..."
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-base font-black text-emerald-400 focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500 placeholder:text-xs"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="font-bold text-slate-200 block mb-1">Meio de Recebimento: *</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-medium text-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Selecione o Meio de Recebimento --</option>
              <option value="transferencia">Transferência Bancária (IBAN)</option>
              <option value="tpa">TPA / Cartão Multicaixa</option>
              <option value="dinheiro">Dinheiro Físico (Numerário)</option>
              <option value="multicaixa_express">Multicaixa Express</option>
            </select>
          </div>

          {/* Submit buttons */}
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
              className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-900/40 transition-all cursor-pointer"
            >
              Confirmar Recebimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
