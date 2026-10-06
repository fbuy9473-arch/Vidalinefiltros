import React, { useState } from 'react';
import {
  X,
  Package,
  Plus,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { Product, InventoryMovementType } from '../../types';
import { storageService } from '../../services/storage';
import { CategoryInput } from '../CategoryInput';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
  onStockAdded: () => void;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  initialProduct,
  onStockAdded
}) => {
  const products = storageService.getProducts();

  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Produtos');
  const [customReturnable, setCustomReturnable] = useState(false);
  const [customPrice, setCustomPrice] = useState<number | string>('');

  const [productId, setProductId] = useState<string>(
    initialProduct ? initialProduct.id : ''
  );
  const [movementType, setMovementType] = useState<InventoryMovementType | ''>('entrada');
  const [quantity, setQuantity] = useState<number | string>('');
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentProd = products.find(p => p.id === productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const qtyNum = Number(quantity);
    if (!qtyNum || qtyNum <= 0) {
      setErrorMsg('A quantidade deve ser maior que zero.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Informe o motivo ou lote da movimentação.');
      return;
    }

    try {
      if (isCustomProduct) {
        if (!customName.trim()) {
          setErrorMsg('Escreva o nome do novo produto.');
          return;
        }
        const nameTrim = customName.trim();
        let prod = products.find(p => p.name.toLowerCase() === nameTrim.toLowerCase());

        if (!prod) {
          prod = storageService.addProduct({
            sku: `PRD-${nameTrim.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
            name: nameTrim,
            category: customCategory.trim() || 'Produtos',
            unit: 'un',
            costPrice: 0,
            sellingPrice: Number(customPrice) || 0,
            currentStock: qtyNum,
            minStock: 0,
            isReturnableBottle: customReturnable,
            description: 'Produto inserido manualmente no ajuste de estoque',
            status: 'ativo'
          });
        } else {
          storageService.addInventoryMovement({
            productId: prod.id,
            type: (movementType || 'entrada') as InventoryMovementType,
            quantity: qtyNum,
            reason: reason.trim()
          });
        }
      } else {
        if (!productId) {
          setErrorMsg('Selecione o produto.');
          return;
        }
        if (!movementType) {
          setErrorMsg('Selecione o tipo de movimentação.');
          return;
        }

        storageService.addInventoryMovement({
          productId,
          type: movementType as InventoryMovementType,
          quantity: qtyNum,
          reason: reason.trim()
        });
      }

      onStockAdded();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao movimentar estoque.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] shadow-2xl w-full max-w-md max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E2D56] flex items-center justify-between bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#162752] border border-[#233A70] text-cyan-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Entrada / Ajuste de Estoque</h2>
              <p className="text-xs text-slate-400">Produção de água ou recebimento de insumos</p>
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

          {/* Product Select or Custom Entry */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-200 block">Produto / Item: *</label>
              <button
                type="button"
                onClick={() => setIsCustomProduct(!isCustomProduct)}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                {isCustomProduct ? '← Escolher da Lista' : '✍️ Escrever Novo Produto'}
              </button>
            </div>

            {isCustomProduct ? (
              <div className="space-y-2 p-3 bg-[#0B132B] border border-cyan-800/60 rounded-xl">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Nome do Produto: *</label>
                  <input
                    type="text"
                    placeholder="Escreva o nome do produto..."
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="w-full p-2 bg-[#111C38] border border-[#1E2D56] rounded-lg text-white font-medium"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Categoria:</label>
                    <CategoryInput
                      value={customCategory}
                      onChange={setCustomCategory}
                      className="w-full p-2 bg-[#111C38] border border-[#1E2D56] rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Preço Venda (Kz):</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={customPrice}
                      onChange={e => setCustomPrice(e.target.value)}
                      className="w-full p-2 bg-[#111C38] border border-[#1E2D56] rounded-lg text-white font-bold"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={customReturnable} onChange={e => setCustomReturnable(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                  Vasilhame retornável (fica em posse do cliente)
                </label>
              </div>
            ) : (
              <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-medium text-white focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">-- Selecione o Item / Insumo --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Saldo atual: {p.currentStock} {p.unit})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Movement Type */}
          <div>
            <label className="font-bold text-slate-200 block mb-1">Tipo de Movimentação: *</label>
            <select
              value={movementType}
              onChange={e => setMovementType(e.target.value as InventoryMovementType)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-medium text-white"
            >
              <option value="">-- Selecione o Tipo de Movimentação --</option>
              <option value="entrada">Entrada de Produção / Envasamento (+)</option>
              <option value="devolucao">Devolução de Vasilhames (+)</option>
              <option value="ajuste">Ajuste de Balanço Físico (+/-)</option>
              <option value="perda">Registro de Perda / Avaria (-)</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="font-bold text-slate-200 block mb-1">
              Quantidade ({currentProd?.unit || 'un'}): *
            </label>
            <input
              type="number"
              min="1"
              placeholder="Digite a quantidade..."
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-lg font-black text-cyan-300 placeholder:text-slate-500"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="font-bold text-slate-200 block mb-1">Motivo / Lote / Observação: *</label>
            <input
              type="text"
              placeholder="Ex: Lote de produção manhã, recebimento de fornecedor..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500"
            />
          </div>

          {/* Footer */}
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
              Confirmar Entrada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
