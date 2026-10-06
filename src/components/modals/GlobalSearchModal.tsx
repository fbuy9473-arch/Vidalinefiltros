import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Users,
  ShoppingCart,
  Package,
  ArrowRight,
  TrendingDown,
  Building2
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { Customer, Order, Product } from '../../types';
import { formatMoney } from '../../lib/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onSelectOrder: (order: Order) => void;
  onNavigateTab: (tab: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  onSelectOrder,
  onNavigateTab
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const customers = storageService.getCustomers();
  const orders = storageService.getOrders();
  const products = storageService.getProducts();

  const q = query.toLowerCase().trim();

  const matchedCustomers = q
    ? customers.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.nif && c.nif.includes(q)) ||
        c.neighborhood.toLowerCase().includes(q) ||
        c.phone.includes(q)
      ).slice(0, 4)
    : [];

  const matchedOrders = q
    ? orders.filter(o =>
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchedProducts = q
    ? products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const hasResults = matchedCustomers.length > 0 || matchedOrders.length > 0 || matchedProducts.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        {/* Search input header */}
        <div className="p-4 border-b border-[#1E2D56] flex items-center gap-3 bg-[#0B132B]">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Pesquise por clientes, NIF, pedidos (ex: PED-1024), garrafões..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-slate-500 focus:outline-hidden"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4 text-xs">
          {!query ? (
            <div className="text-center py-8 text-slate-400">
              Digite para buscar em tempo real clientes, pedidos ou garrafões...
            </div>
          ) : !hasResults ? (
            <div className="text-center py-8 text-slate-400">
              Nenhum resultado encontrado para "{query}".
            </div>
          ) : (
            <>
              {/* Clientes */}
              {matchedCustomers.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-2">
                    Clientes & Empresas
                  </span>
                  <div className="space-y-1">
                    {matchedCustomers.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onSelectCustomer(c);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#162752] text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0B132B] border border-[#1E2D56] group-hover:border-cyan-700 text-cyan-400 flex items-center justify-center">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-cyan-300">{c.name}</p>
                            <p className="text-[11px] text-slate-400">{c.type} · {c.neighborhood} · {c.bottlesInPossession} garrafões</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pedidos */}
              {matchedOrders.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-2">
                    Vendas & Pedidos
                  </span>
                  <div className="space-y-1">
                    {matchedOrders.map(o => (
                      <button
                        key={o.id}
                        onClick={() => {
                          onSelectOrder(o);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#162752] text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0B132B] border border-[#1E2D56] group-hover:border-cyan-700 text-cyan-400 flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-cyan-300">{o.code} — {o.customerName}</p>
                            <p className="text-[11px] text-slate-400">{o.date} · {formatMoney(o.total)}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Produtos */}
              {matchedProducts.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-2">
                    Estoque & Produtos
                  </span>
                  <div className="space-y-1">
                    {matchedProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onNavigateTab('estoque');
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#162752] text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0B132B] border border-[#1E2D56] group-hover:border-cyan-700 text-cyan-400 flex items-center justify-center">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-cyan-300">{p.name}</p>
                            <p className="text-[11px] text-slate-400">Estoque: {p.currentStock} {p.unit} · {formatMoney(p.sellingPrice)}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
