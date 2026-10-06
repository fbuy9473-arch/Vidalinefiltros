import React, { useState } from 'react';
import {
  Package,
  Droplets,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RotateCcw,
  Search,
  CheckCircle2,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { storageService } from '../services/storage';
import { Product, InventoryMovement } from '../types';
import { formatMoney, formatDate } from '../lib/formatters';
import { NewProductModal } from './modals/NewProductModal';

interface InventoryViewProps {
  onOpenAddStock: (product?: Product) => void;
  initialTab?: 'produtos' | 'vasilhames' | 'movimentacoes';
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenAddStock,
  initialTab = 'produtos'
}) => {
  const [activeTab, setActiveTab] = useState<'produtos' | 'vasilhames' | 'movimentacoes'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);

  const products = storageService.getProducts();
  const bottleAudit = storageService.getBottleAudit();
  const movements = storageService.getInventoryMovements();

  const lowStockProducts = products.filter(p => !p.isService && p.currentStock <= p.minStock);
  const categories = storageService.getProductCategories();

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'todos' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111C38] p-5 rounded-2xl border border-[#1E2D56] shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Estoque & Vasilhames Retornáveis
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Gestão física de produtos acabados, insumos de envasamento e rastreio de garrafões 20L em circulação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewProductOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 bg-[#162752] hover:bg-[#1E3672] border border-[#233B78] rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Cadastrar Novo Produto</span>
          </button>
          <button
            onClick={() => onOpenAddStock()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl transition-all shadow-md shadow-sky-900/40 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Entrada de Estoque / Produção</span>
          </button>
        </div>
      </div>

      {/* Critical Bottle Circulation Architecture Card (Vidaline Core Asset) */}
      <div className="bg-gradient-to-r from-[#0C152F] via-[#102047] to-[#0A1633] text-white p-6 rounded-2xl border border-[#1E3260] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white">Censo dos Garrafões 20L Retornáveis (Ativo Circulante)</h2>
              <p className="text-xs text-slate-400">Total do patrimônio físico de vasilhames da Vidaline</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/30 self-start sm:self-auto">
            Total Ativo: {bottleAudit.inStock + bottleAudit.emptyInStock + bottleAudit.withCustomers + bottleAudit.inTransit + bottleAudit.damaged + bottleAudit.lost} garrafões
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#111C38] border border-[#1E2D56] p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Cheios no Armazém</span>
            <p className="text-xl font-black text-cyan-400 mt-1">{bottleAudit.inStock} un</p>
            <p className="text-[10px] text-slate-400">Prontos p/ entrega imediata</p>
          </div>

          <div className="bg-[#111C38] border border-[#1E2D56] p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Vazios no Armazém</span>
            <p className="text-xl font-black text-slate-200 mt-1">{bottleAudit.emptyInStock} un</p>
            <p className="text-[10px] text-slate-400">Aguardando lavagem & envasamento</p>
          </div>

          <div className="bg-[#111C38] border border-[#1E2D56] p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Com Clientes (Em Posse)</span>
            <p className="text-xl font-black text-sky-400 mt-1">{bottleAudit.withCustomers} un</p>
            <p className="text-[10px] text-slate-400">Distribuídos em B2B e B2C</p>
          </div>

          <div className="bg-[#111C38] border border-[#1E2D56] p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Perdas / Danificados</span>
            <p className="text-xl font-black text-rose-400 mt-1">{bottleAudit.damaged + bottleAudit.lost} un</p>
            <p className="text-[10px] text-rose-300/80">Descartados por quebra</p>
          </div>
        </div>
      </div>

      {/* Low stock alert banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-[#2A141A] border border-[#63222E] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-200 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-300">
                Atenção: {lowStockProducts.length} itens estão abaixo do estoque mínimo de segurança!
              </p>
              <p className="text-xs text-rose-400">
                Itens como <span className="font-semibold">{lowStockProducts.map(p => p.name).join(', ')}</span> requerem nova ordem de produção ou compra de insumos.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenAddStock(lowStockProducts[0])}
            className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shrink-0 cursor-pointer transition-colors shadow-md"
          >
            Repor Estoque
          </button>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2D56] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('produtos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'produtos'
                ? 'bg-[#1D4ED8] text-white shadow-md border border-blue-400/50'
                : 'bg-[#111C38] text-slate-400 hover:text-white hover:bg-[#162752] border border-[#1E2D56]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produtos & Insumos ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('movimentacoes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'movimentacoes'
                ? 'bg-[#0284C7] text-white shadow-md border border-sky-400/50'
                : 'bg-[#111C38] text-slate-400 hover:text-white hover:bg-[#162752] border border-[#1E2D56]'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Auditoria de Movimentações ({movements.length})</span>
          </button>
        </div>

        {activeTab === 'produtos' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nome ou SKU..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-[#0B132B] border border-[#1E2D56] rounded-xl text-slate-300 cursor-pointer"
            >
              <option value="todos">Todas Categorias</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB: Produtos & Insumos */}
      {activeTab === 'produtos' && (
        <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B132B] border-b border-[#1E2D56] text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">SKU / Código</th>
                  <th className="p-3.5">Produto / Insumo</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5 text-right">Preço de Custo</th>
                  <th className="p-3.5 text-right">Preço de Venda</th>
                  <th className="p-3.5 text-center">Estoque Atual</th>
                  <th className="p-3.5 text-center">Status Mínimo</th>
                  <th className="p-3.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A284D] text-slate-200">
                {filteredProducts.map(p => {
                  const isLow = !p.isService && p.currentStock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-[#162752] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-cyan-400">{p.sku}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-white">{p.name}</p>
                        <p className="text-[11px] text-slate-400">{p.description}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="capitalize px-2 py-0.5 rounded-md bg-[#162752] text-sky-300 border border-[#233A70] font-medium">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-right text-slate-300">{formatMoney(p.costPrice)}</td>
                      <td className="p-3.5 text-right font-bold text-white">
                        {p.sellingPrice > 0 ? formatMoney(p.sellingPrice) : 'Uso interno'}
                      </td>
                      <td className="p-3.5 text-center">
                        {p.isService ? (
                          <span className="text-slate-400">Serviço</span>
                        ) : (
                        <span className={`inline-block px-2.5 py-1 rounded-lg font-black text-sm ${
                          isLow ? 'bg-rose-950/70 text-rose-400 border border-rose-800' : 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                        }`}>
                          {p.currentStock} {p.unit}
                        </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {p.isService ? (
                          <span className="text-slate-500">—</span>
                        ) : isLow ? (
                          <span className="text-rose-400 font-bold flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Abaixo do Mín. ({p.minStock})
                          </span>
                        ) : (
                          <span className="text-slate-400">OK (Mín: {p.minStock})</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {!p.isService && (
                        <button
                          onClick={() => onOpenAddStock(p)}
                          className="px-2.5 py-1 text-xs font-semibold bg-[#162752] hover:bg-sky-600 hover:text-white text-sky-300 border border-[#233A70] rounded-lg transition-colors cursor-pointer"
                        >
                          + Ajustar / Entrada
                        </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Movimentações */}
      {activeTab === 'movimentacoes' && (
        <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B132B] border-b border-[#1E2D56] text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Data</th>
                  <th className="p-3.5">Produto</th>
                  <th className="p-3.5">Tipo de Movimento</th>
                  <th className="p-3.5 text-center">Qtd</th>
                  <th className="p-3.5 text-center">Estoque Anterior → Novo</th>
                  <th className="p-3.5">Motivo / Pedido</th>
                  <th className="p-3.5">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A284D] text-slate-200">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-[#162752] transition-colors">
                    <td className="p-3.5 text-slate-400">{formatDate(m.date)}</td>
                    <td className="p-3.5 font-bold text-white">{m.productName}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        m.type === 'entrada' || m.type === 'devolucao'
                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950/70 text-rose-400 border border-rose-800'
                      }`}>
                        {m.type === 'entrada' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {m.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-black text-white">{m.quantity}</td>
                    <td className="p-3.5 text-center font-mono text-slate-300">
                      {m.previousStock} → <span className="font-bold text-cyan-400">{m.newStock}</span>
                    </td>
                    <td className="p-3.5 text-slate-300">{m.reason}</td>
                    <td className="p-3.5 text-slate-400 font-medium">{m.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NewProductModal
        isOpen={isNewProductOpen}
        onClose={() => setIsNewProductOpen(false)}
        onProductCreated={() => {
          // re-render will be triggered by storage change, but we can close modal
          setIsNewProductOpen(false);
        }}
      />
    </div>
  );
};
