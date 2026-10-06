import React, { useState } from 'react';
import {
  X,
  TrendingDown,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { ExpenseCategory, CostCenter } from '../../types';
import { storageService } from '../../services/storage';

interface NewPayableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayableCreated: () => void;
  initialSupplierName?: string;
}

export const NewPayableModal: React.FC<NewPayableModalProps> = ({
  isOpen,
  onClose,
  onPayableCreated,
  initialSupplierName
}) => {
  const suppliers = storageService.getSuppliers();

  const [supplierName, setSupplierName] = useState(initialSupplierName || '');
  const [description, setDescription] = useState('');
  const [purchasedProducts, setPurchasedProducts] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [costCenter, setCostCenter] = useState<CostCenter | ''>('');
  const [amount, setAmount] = useState<number | string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('A descrição da despesa é obrigatória.');
      return;
    }
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      setErrorMsg('O valor da despesa deve ser maior que zero.');
      return;
    }
    if (!dueDate) {
      setErrorMsg('A data de vencimento é obrigatória.');
      return;
    }

    try {
      const fullDesc = purchasedProducts.trim()
        ? `${description.trim()} — Produtos: ${purchasedProducts.trim()}`
        : description.trim();

      const sup = suppliers.find(s => s.name.toLowerCase() === supplierName.trim().toLowerCase());
      storageService.addPayable({
        supplierId: sup?.id,
        supplierName: supplierName.trim() || 'Fornecedor Diversos',
        category: (category || 'outros') as ExpenseCategory,
        costCenter: (costCenter || 'operacoes') as CostCenter,
        description: fullDesc,
        amount: amountNum,
        dueDate,
        paymentMethod: 'transferencia'
      });

      onPayableCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar conta a pagar.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] shadow-2xl w-full max-w-lg max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E2D56] flex items-center justify-between bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/70 border border-amber-800 text-amber-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Lançar Despesa / Conta a Pagar</h2>
              <p className="text-xs text-slate-400">Classificação por categoria e centro de custo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#162752] rounded-xl transition-colors cursor-pointer"
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

          {/* Supplier */}
          <div>
            <label className="font-bold text-slate-200 block mb-1">Fornecedor / Beneficiário:</label>
            <input
              type="text"
              list="suppliers-list"
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              placeholder="Selecione ou digite o nome do fornecedor..."
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-medium text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500"
            />
            <datalist id="suppliers-list">
              {suppliers.map(s => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-slate-200 block mb-1">Descrição do Gasto / Fatura: *</label>
            <input
              type="text"
              required
              placeholder="Ex: Compra de matéria-prima e suprimentos..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Products/Items details */}
          <div>
            <label className="font-bold text-slate-200 block mb-1">Escrever Produtos / Itens Adquiridos:</label>
            <input
              type="text"
              placeholder="Ex: 500x Tampas Azuis, 100x Garrafões 20L Vazios, 50x Filtros de Areia..."
              value={purchasedProducts}
              onChange={e => setPurchasedProducts(e.target.value)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500"
            />
          </div>

          {/* Category & Cost Center */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-200 block mb-1">Categoria Contábil:</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-medium text-white"
              >
                <option value="">-- Selecione a Categoria --</option>
                <option value="combustivel">Combustível & Frotas</option>
                <option value="materia_prima">Matéria-Prima (Garrafões)</option>
                <option value="embalagens">Tampas & Embalagens</option>
                <option value="energia">Energia Elétrica (ENDE)</option>
                <option value="agua">Água & Saneamento (EPAL)</option>
                <option value="salarios">Salários & Encargos</option>
                <option value="manutencao">Manutenção Industrial</option>
                <option value="marketing">Marketing & Publicidade</option>
                <option value="internet">Internet & Telecomunicações</option>
                <option value="aluguel">Aluguel / Armazém</option>
                <option value="outros">Outras Despesas</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-200 block mb-1">Centro de Custo:</label>
              <select
                value={costCenter}
                onChange={e => setCostCenter(e.target.value as CostCenter)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-medium text-white"
              >
                <option value="">-- Selecione o Centro de Custo --</option>
                <option value="logistica">Logística & Entregas</option>
                <option value="producao">Produção & Envasamento</option>
                <option value="comercial">Comercial & Vendas</option>
                <option value="administracao">Administração & Finanças</option>
                <option value="marketing">Marketing</option>
                <option value="operacoes">Operações Gerais</option>
              </select>
            </div>
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-200 block mb-1">Valor da Despesa (Kz): *</label>
              <input
                type="number"
                min="100"
                step="500"
                placeholder="Ex: 50000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-black text-amber-400 text-sm placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-200 block mb-1">Data de Vencimento: *</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-medium text-white"
              />
            </div>
          </div>

          {/* Submit */}
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
              className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-900/40 transition-all cursor-pointer"
            >
              Lançar Despesa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
