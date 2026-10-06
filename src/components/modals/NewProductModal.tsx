import React, { useState } from 'react';
import { X, Package, Plus, AlertCircle, Droplets, Tag } from 'lucide-react';
import { storageService } from '../../services/storage';
import { CategoryInput } from '../CategoryInput';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void;
}

export const NewProductModal: React.FC<NewProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Produtos');
  const [isService, setIsService] = useState(false);
  const [unit, setUnit] = useState('un');
  const [costPrice, setCostPrice] = useState<number | string>('');
  const [sellingPrice, setSellingPrice] = useState<number | string>('');
  const [currentStock, setCurrentStock] = useState<number | string>('0');
  const [minStock, setMinStock] = useState<number | string>('0');
  const [isReturnableBottle, setIsReturnableBottle] = useState(false);
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Escreva o nome do produto ou serviço.');
      return;
    }
    if (!category.trim()) {
      setErrorMsg('Indique a categoria (escolha uma existente ou escreva uma nova).');
      return;
    }

    const generatedSku = sku.trim() || `${isService ? 'SRV' : 'PRD'}-${name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const costNum = Number(costPrice) || 0;
    const sellNum = Number(sellingPrice) || 0;
    const stockNum = isService ? 0 : Math.max(0, Number(currentStock) || 0);
    const minNum = isService ? 0 : Math.max(0, Number(minStock) || 0);

    try {
      storageService.addProduct({
        sku: generatedSku,
        name: name.trim(),
        category: category.trim(),
        isService,
        unit: isService ? 'serviço' : unit,
        costPrice: costNum,
        sellingPrice: sellNum,
        currentStock: stockNum,
        minStock: minNum,
        isReturnableBottle: !isService && isReturnableBottle,
        description: description.trim(),
        status: 'ativo'
      });

      onProductCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar produto.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] shadow-2xl w-full max-w-lg max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E2D56] flex items-center justify-between bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#162752] text-cyan-400 border border-[#233A70]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Cadastrar Produto ou Serviço</h2>
              <p className="text-xs text-slate-400">Cadastre qualquer item: produtos, insumos ou serviços</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#162752] rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {[false, true].map(svc => (
              <button
                type="button"
                key={String(svc)}
                onClick={() => {
                  setIsService(svc);
                  if (svc && category === 'Produtos') setCategory('Outros serviços');
                  if (!svc && category === 'Outros serviços') setCategory('Produtos');
                }}
                className={`p-2.5 rounded-xl border font-bold cursor-pointer transition-colors ${
                  isService === svc
                    ? 'bg-[#0284C7] border-sky-400 text-white'
                    : 'bg-[#0B132B] border-[#1E2D56] text-slate-300 hover:bg-[#162752]'
                }`}
              >
                {svc ? 'Serviço (sem estoque)' : 'Produto / Insumo'}
              </button>
            ))}
          </div>

          <div>
            <label className="font-bold text-slate-200 block mb-1">{isService ? 'Nome do Serviço' : 'Nome do Produto / Insumo'}: *</label>
            <input
              type="text"
              placeholder={isService ? 'Ex: Entrega ao domicílio, Instalação, Manutenção...' : 'Escreva o nome do produto'}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-200 block mb-1">Código / SKU:</label>
              <input
                type="text"
                placeholder="Opcional (gerado automaticamente)"
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white placeholder:text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-200 block mb-1">Categoria: *</label>
              <CategoryInput
                value={category}
                onChange={setCategory}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-200 block mb-1">Preço de Custo (Kz):</label>
              <input
                type="number"
                placeholder="0"
                value={costPrice}
                onChange={e => setCostPrice(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-200 block mb-1">Preço de Venda (Kz):</label>
              <input
                type="number"
                placeholder="0"
                value={sellingPrice}
                onChange={e => setSellingPrice(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white"
              />
            </div>
          </div>

          {!isService && (
            <>
              <div>
                <label className="font-bold text-slate-200 block mb-1">Unidade de medida:</label>
                <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white">
                  {['un', 'pack_6', 'pack_12', 'caixa', 'kg', 'litro', 'metro'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-200 block mb-1">Estoque Inicial:</label>
              <input
                type="number"
                placeholder="0"
                value={currentStock}
                onChange={e => setCurrentStock(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-200 block mb-1">Estoque Mínimo de Segurança:</label>
              <input
                type="number"
                placeholder="0"
                value={minStock}
                onChange={e => setMinStock(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-[#0B132B] border border-[#1E2D56] rounded-xl">
            <input
              type="checkbox"
              id="isReturnable"
              checked={isReturnableBottle}
              onChange={e => setIsReturnableBottle(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-[#111C38] border-[#1E2D56] cursor-pointer"
            />
            <label htmlFor="isReturnable" className="text-xs text-slate-200 font-medium cursor-pointer">
              É vasilhame retornável, ex.: garrafão (fica em posse do cliente até ser devolvido)
            </label>
          </div>

            </>
          )}

          <div>
            <label className="font-bold text-slate-200 block mb-1">Descrição:</label>
            <textarea
              rows={2}
              placeholder="Detalhes opcionais"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white placeholder:text-slate-500"
            />
          </div>

          <div className="pt-3 border-t border-[#1E2D56] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isService ? 'Salvar Serviço' : 'Salvar Produto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
