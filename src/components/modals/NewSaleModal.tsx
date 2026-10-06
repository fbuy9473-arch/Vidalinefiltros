import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  Plus,
  Trash2,
  AlertCircle,
  Droplets,
  DollarSign,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { Customer, Product, PaymentMethod } from '../../types';
import { storageService } from '../../services/storage';
import { formatMoney } from '../../lib/formatters';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomer?: Customer | null;
  onSaleCreated: () => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen,
  onClose,
  initialCustomer,
  onSaleCreated
}) => {
  const customers = storageService.getCustomers();
  const products = storageService.getProducts();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomer ? initialCustomer.id : ''
  );

  const [items, setItems] = useState<
    {
      productId: string;
      customName?: string;
      quantity: number | string;
      unitPrice: number | string;
      isCustom?: boolean;
      isReturnableBottle?: boolean;
    }[]
  >([
    {
      productId: '',
      customName: '',
      quantity: '',
      unitPrice: '',
      isCustom: false,
      isReturnableBottle: false
    }
  ]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [discount, setDiscount] = useState<number | string>('');
  const [bottlesCollected, setBottlesCollected] = useState<number | string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCustomer = customers.find(c => c.id === selectedCustomerId);

  // Calculate items subtotal and bottles delivered
  let subtotal = 0;
  let bottlesDeliveredCount = 0;

  items.forEach(it => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unitPrice) || 0;
    const prod = products.find(p => p.id === it.productId);
    subtotal += qty * price;
    if (it.isCustom) {
      if (it.isReturnableBottle) bottlesDeliveredCount += qty;
    } else if (prod?.isReturnableBottle) {
      bottlesDeliveredCount += qty;
    }
  });

  const discountNum = Number(discount) || 0;
  const total = Math.max(0, subtotal - discountNum);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        customName: '',
        quantity: '',
        unitPrice: '',
        isCustom: false,
        isReturnableBottle: false
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleToggleCustom = (index: number) => {
    const updated = [...items];
    const item = updated[index];
    updated[index] = {
      ...item,
      isCustom: !item.isCustom,
      productId: '',
      customName: '',
      unitPrice: ''
    };
    setItems(updated);
  };

  const handleItemChange = (
    index: number,
    field: 'productId' | 'customName' | 'quantity' | 'unitPrice' | 'isReturnableBottle',
    value: any
  ) => {
    const updated = [...items];
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      updated[index] = {
        ...updated[index],
        productId: value,
        unitPrice: prod ? prod.sellingPrice : '',
        isReturnableBottle: prod ? prod.isReturnableBottle : false
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      };
    }
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCustomerId) {
      setErrorMsg('Selecione um cliente para prosseguir.');
      return;
    }

    // Process items & auto-create custom typed products if necessary
    const processedItems: { productId: string; quantity: number; unitPrice?: number }[] = [];

    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      const qty = Number(it.quantity) || 0;
      if (qty <= 0) continue;

      if (it.isCustom) {
        if (!it.customName || !it.customName.trim()) {
          setErrorMsg(`Escreva o nome do produto personalizado no item ${idx + 1}.`);
          return;
        }
        const customNameTrim = it.customName.trim();
        let existing = storageService.getProducts().find(p => p.name.toLowerCase() === customNameTrim.toLowerCase());

        if (!existing) {
          // Create product in catalog automatically with stock = qty so sale succeeds
          const isReturnable = Boolean(it.isReturnableBottle);
          existing = storageService.addProduct({
            sku: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
            name: customNameTrim,
            category: 'Produtos',
            unit: 'un',
            costPrice: 0,
            sellingPrice: Number(it.unitPrice) || 0,
            currentStock: qty,
            minStock: 0,
            isReturnableBottle: isReturnable,
            description: 'Produto inserido manualmente na venda',
            status: 'ativo'
          });
        } else if (existing.currentStock < qty) {
          // Temporarily add stock for sale of custom typed item
          storageService.addInventoryStock(existing.id, qty - existing.currentStock, 'Ajuste para venda rápida');
        }

        processedItems.push({
          productId: existing.id,
          quantity: qty,
          unitPrice: Number(it.unitPrice) || existing.sellingPrice
        });
      } else {
        if (!it.productId) {
          setErrorMsg(`Selecione ou escreva o produto no item ${idx + 1}.`);
          return;
        }
        const prod = products.find(p => p.id === it.productId);
        if (!prod) {
          setErrorMsg(`Produto no item ${idx + 1} não encontrado.`);
          return;
        }
        if (!prod.isService && prod.currentStock < qty) {
          setErrorMsg(`Estoque insuficiente para "${prod.name}". Estoque atual: ${prod.currentStock} ${prod.unit}.`);
          return;
        }
        processedItems.push({
          productId: prod.id,
          quantity: qty,
          unitPrice: Number(it.unitPrice) || prod.sellingPrice
        });
      }
    }

    if (processedItems.length === 0) {
      setErrorMsg('Adicione pelo menos um produto válido com quantidade maior que zero.');
      return;
    }

    if (!paymentMethod) {
      setErrorMsg('Selecione a forma de pagamento.');
      return;
    }

    try {
      storageService.createSale({
        customerId: selectedCustomerId,
        items: processedItems,
        paymentMethod: paymentMethod as PaymentMethod,
        discount: discountNum,
        bottlesDeliveredQty: bottlesDeliveredCount,
        bottlesCollectedQty: Number(bottlesCollected) || 0,
        notes
      });

      onSaleCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar venda.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E2D56] flex items-center justify-between bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#162752] text-cyan-400 border border-[#233A70]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Registar Nova Venda de Água</h2>
              <p className="text-xs text-slate-400">Emissão de pedido com baixa automática de estoque e atualização de caixa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#162752] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="font-bold text-slate-200 block mb-1">Selecionar Cliente: *</label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">-- Selecione o Cliente da Lista --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type}) — {c.neighborhood} — Garrafões em posse: {c.bottlesInPossession} un
                </option>
              ))}
            </select>
          </div>

          {/* Items Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200">Itens do Pedido: *</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Produto</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const selectedProd = products.find(p => p.id === item.productId);
                return (
                  <div key={idx} className="p-3 bg-[#0B132B] border border-[#1E2D56] rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold text-slate-300">Item #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleCustom(idx)}
                        className="text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
                      >
                        {item.isCustom ? '← Escolher do Catálogo' : '✍️ Escrever Produto Personalizado'}
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1">
                        {item.isCustom ? (
                          <input
                            type="text"
                            placeholder="Escreva o nome do produto (ex: Garrafão 20L Especial, Garrafa PET 1L...)"
                            value={item.customName || ''}
                            onChange={e => handleItemChange(idx, 'customName', e.target.value)}
                            className="w-full p-2 bg-[#111C38] border border-cyan-700/60 rounded-lg text-xs font-semibold text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500"
                          />
                        ) : (
                          <select
                            value={item.productId}
                            onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                            className="w-full p-2 bg-[#111C38] border border-[#1E2D56] rounded-lg text-xs font-medium text-white"
                          >
                            <option value="">-- Selecione o Produto / Vasilhame --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.isService ? 'Serviço' : `Estoque: ${p.currentStock} ${p.unit}`}) — {formatMoney(p.sellingPrice)}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            placeholder="Qtd..."
                            value={item.quantity}
                            onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full p-2 bg-[#111C38] border border-[#1E2D56] rounded-lg text-center font-bold text-white placeholder:text-slate-500"
                            title="Quantidade"
                          />
                        </div>

                        {item.isCustom && (
                          <div className="w-28">
                            <input
                              type="number"
                              placeholder="Preço (Kz)..."
                              value={item.unitPrice}
                              onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                              className="w-full p-2 bg-[#111C38] border border-[#1E2D56] rounded-lg text-right font-bold text-white placeholder:text-slate-500"
                              title="Preço Unitário"
                            />
                          </div>
                        )}

                        <div className="w-24 text-right font-black text-white shrink-0">
                          {formatMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {item.isCustom && (
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-300">
                        <input
                          type="checkbox"
                          id={`customReturnable-${idx}`}
                          checked={Boolean(item.isReturnableBottle)}
                          onChange={e => handleItemChange(idx, 'isReturnableBottle', e.target.checked)}
                          className="rounded border-[#1E2D56] text-cyan-500 bg-[#111C38] cursor-pointer"
                        />
                        <label htmlFor={`customReturnable-${idx}`} className="cursor-pointer">
                          Este item é garrafão de 20L retornável (adiciona ao saldo de garrafões em posse do cliente)
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottle Tracking Section (if any returnable bottle is in order) */}
          {bottlesDeliveredCount > 0 && (
            <div className="p-4 bg-[#0B132B] border border-[#203D7A] rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>Movimentação de Garrafões 20L Vidaline</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Cheios a entregar neste pedido: <strong className="text-white">{bottlesDeliveredCount} garrafões</strong>.
              </p>

              <div className="flex items-center gap-4 pt-1">
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Quantos garrafões vazios o cliente está devolvendo agora?
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Digite a quantidade recolhida..."
                    value={bottlesCollected}
                    onChange={e => setBottlesCollected(e.target.value)}
                    className="w-full p-2 bg-[#111C38] border border-[#1E2D56] rounded-lg font-bold text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-medium block">Variação no cliente:</span>
                  <span className={`text-sm font-black ${(bottlesDeliveredCount - (Number(bottlesCollected) || 0)) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {bottlesDeliveredCount - (Number(bottlesCollected) || 0) >= 0 ? `+${bottlesDeliveredCount - (Number(bottlesCollected) || 0)}` : bottlesDeliveredCount - (Number(bottlesCollected) || 0)} un
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-200 block mb-1">Forma de Pagamento: *</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">-- Selecione a Forma de Pagamento --</option>
                <option value="dinheiro">Dinheiro à Vista</option>
                <option value="tpa">TPA / Multicaixa</option>
                <option value="transferencia">Transferência Bancária</option>
                <option value="multicaixa_express">Multicaixa Express</option>
                <option value="a_prazo">A Prazo (Conta a Receber)</option>
              </select>
            </div>

            {paymentMethod === 'a_prazo' ? (
              <div>
                <label className="font-bold text-slate-200 block mb-1">Data de Vencimento:</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs font-medium text-white"
                />
              </div>
            ) : (
              <div>
                <label className="font-bold text-slate-200 block mb-1">Desconto Comercial (Kz):</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 Kz"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs font-medium text-white placeholder:text-slate-500"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="font-bold text-slate-200 block mb-1">Observações de Entrega / Motorista:</label>
            <input
              type="text"
              placeholder="Ex: Entregar na portaria 2 com motorista João..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white placeholder:text-slate-500"
            />
          </div>

          {/* Total Box */}
          <div className="p-3.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl flex items-center justify-between">
            <span className="text-sm font-black text-slate-300">VALOR TOTAL DO PEDIDO:</span>
            <span className="text-xl font-black text-cyan-400">{formatMoney(total)}</span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1E2D56]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-300 bg-[#162752] border border-[#233B78] hover:bg-[#1E3672] rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] active:bg-[#075985] rounded-xl shadow-md shadow-sky-900/40 transition-all cursor-pointer"
            >
              Confirmar Venda & Baixar Estoque
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
