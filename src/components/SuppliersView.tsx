import React, { useState } from 'react';
import {
  Building2,
  Phone,
  Mail,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  Calendar,
  FileText
} from 'lucide-react';
import { storageService } from '../services/storage';
import { Supplier } from '../types';
import { formatMoney } from '../lib/formatters';
import { NewSupplierModal } from './modals/NewSupplierModal';
import { NewPayableModal } from './modals/NewPayableModal';

export const SuppliersView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [selectedSupplierForExpense, setSelectedSupplierForExpense] = useState<string | null>(null);

  const suppliers = storageService.getSuppliers();
  const payables = storageService.getPayables();

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.nif && s.nif.includes(searchTerm))
  );

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111C38] p-5 rounded-2xl border border-[#1E2D56] shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Fornecedores & Parceiros de Suprimento
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Gestão de matérias-primas: garrafões vazios 20L, tampas, lacres, rótulos e manutenção industrial.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar fornecedor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <button
            onClick={() => setIsNewSupplierOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Fornecedor</span>
          </button>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(sup => {
          const supplierPayables = payables.filter(p => p.supplierId === sup.id || p.supplierName.toLowerCase() === sup.name.toLowerCase());
          const pendingAmount = supplierPayables
            .filter(p => p.status !== 'pago')
            .reduce((sum, p) => sum + p.amount, 0);

          return (
            <div key={sup.id} className="bg-[#111C38] p-5 rounded-2xl border border-[#1E2D56] shadow-lg space-y-4 hover:border-sky-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-white">{sup.name}</h3>
                    <p className="text-xs text-cyan-400 font-mono">NIF: {sup.nif || 'Não informado'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#162752] text-sky-400 border border-[#233A70]">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.phone}</span>
                  </div>
                  {sup.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sup.email}</span>
                    </div>
                  )}
                  {sup.address && (
                    <p className="text-slate-400 text-[11px] pt-1">{sup.address}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#1E2D56] grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0B132B] p-2.5 rounded-xl border border-[#1E2D56]">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Comprado:</span>
                    <span className="font-black text-white">{formatMoney(sup.totalPurchased)}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${pendingAmount > 0 ? 'bg-amber-950/40 border-amber-800 text-amber-300' : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'}`}>
                    <span className="text-[10px] uppercase font-bold block">A Pagar:</span>
                    <span className="font-black">{formatMoney(pendingAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1E2D56]">
                <button
                  onClick={() => setSelectedSupplierForExpense(sup.name)}
                  className="w-full py-2 text-xs font-bold text-amber-300 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/80 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lançar Compra / Despesa</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <NewSupplierModal
        isOpen={isNewSupplierOpen}
        onClose={() => setIsNewSupplierOpen(false)}
        onSupplierCreated={() => setIsNewSupplierOpen(false)}
      />

      {selectedSupplierForExpense && (
        <NewPayableModal
          isOpen={!!selectedSupplierForExpense}
          initialSupplierName={selectedSupplierForExpense}
          onClose={() => setSelectedSupplierForExpense(null)}
          onPayableCreated={() => setSelectedSupplierForExpense(null)}
        />
      )}
    </div>
  );
};
