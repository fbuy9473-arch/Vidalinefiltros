import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { storageService } from '../services/storage';
import { Receivable, Payable, CashTransaction } from '../types';
import { formatMoney, formatDate, getPaymentMethodLabel } from '../lib/formatters';

interface FinanceViewProps {
  onOpenReceivePayment: (receivable: Receivable) => void;
  onOpenNewPayable: () => void;
  initialTab?: 'caixa' | 'receber' | 'pagar' | 'dre';
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  onOpenReceivePayment,
  onOpenNewPayable,
  initialTab = 'caixa'
}) => {
  const [activeTab, setActiveTab] = useState<'caixa' | 'receber' | 'pagar' | 'dre'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');

  const currentCash = storageService.getCurrentCashBalance();
  const cashTransactions = storageService.getCashTransactions();
  const receivables = storageService.getReceivables();
  const payables = storageService.getPayables();
  const orders = storageService.getOrders();

  // Metrics
  const totalReceivables = receivables.reduce((sum, r) => sum + r.remainingAmount, 0);
  const overdueReceivables = receivables.filter(r => r.status === 'vencido');
  const overdueReceivablesAmount = overdueReceivables.reduce((sum, r) => sum + r.remainingAmount, 0);

  const totalPayables = payables
    .filter(p => p.status === 'pendente' || p.status === 'vencido')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalSalesRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalExpensesPaid = payables.filter(p => p.status === 'pago').reduce((sum, p) => sum + p.amount, 0);

  // Simplified DRE calculation
  const dreGrossRevenue = totalSalesRevenue;
  const dreProductionCosts = payables
    .filter(p => p.costCenter === 'producao')
    .reduce((sum, p) => sum + p.amount, 0) || 450000;
  const dreGrossMargin = dreGrossRevenue - dreProductionCosts;

  const dreLogistics = payables.filter(p => p.costCenter === 'logistica').reduce((sum, p) => sum + p.amount, 0);
  const dreCommercial = payables.filter(p => p.costCenter === 'comercial' || p.costCenter === 'marketing').reduce((sum, p) => sum + p.amount, 0);
  const dreAdmin = payables.filter(p => p.costCenter === 'administracao' || p.costCenter === 'operacoes').reduce((sum, p) => sum + p.amount, 0);
  const dreTotalOperatingExpenses = dreLogistics + dreCommercial + dreAdmin;
  const dreNetProfit = dreGrossMargin - dreTotalOperatingExpenses;

  // Filtered lists
  const filteredTransactions = cashTransactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReceivables = receivables.filter(r =>
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.orderCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayables = payables.filter(p =>
    p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111C38] p-5 rounded-2xl border border-[#1E2D56] shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Gestão Financeira & Fluxo de Caixa
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Liquidez diária, controle rigoroso de contas a receber (crédito aos clientes) e contas a pagar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewPayable}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl transition-all shadow-md shadow-sky-900/40 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nova Despesa / Conta a Pagar</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Saldo Líquido em Caixa</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-400">{formatMoney(currentCash)}</p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400/80 font-semibold mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Disponibilidade imediata</span>
          </div>
        </div>

        <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Total a Receber (Clientes)</span>
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-white">{formatMoney(totalReceivables)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {receivables.filter(r => r.status !== 'pago').length} faturas pendentes
          </p>
        </div>

        <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Contas Vencidas (Em Atraso)</span>
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-rose-400">{formatMoney(overdueReceivablesAmount)}</p>
          <p className="text-[11px] text-rose-400 font-semibold mt-1">
            {overdueReceivables.length} contas requerem cobrança
          </p>
        </div>

        <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Total a Pagar (Despesas)</span>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-amber-400">{formatMoney(totalPayables)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Insumos, combustíveis, água e salários
          </p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2D56] pb-3">
        <div className="flex items-center gap-2 max-w-full overflow-x-auto pb-1 [&>button]:shrink-0 [&>button]:whitespace-nowrap">
          <button
            onClick={() => setActiveTab('caixa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'caixa'
                ? 'bg-[#1D4ED8] text-white shadow-md border border-blue-400/50'
                : 'bg-[#111C38] text-slate-400 hover:text-white hover:bg-[#162752] border border-[#1E2D56]'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Livro Caixa ({cashTransactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('receber')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'receber'
                ? 'bg-[#0284C7] text-white shadow-md border border-sky-400/50'
                : 'bg-[#111C38] text-slate-400 hover:text-white hover:bg-[#162752] border border-[#1E2D56]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Contas a Receber ({receivables.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pagar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pagar'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-[#111C38] text-slate-400 hover:text-white hover:bg-[#162752] border border-[#1E2D56]'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Contas a Pagar ({payables.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dre')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dre'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-[#111C38] text-slate-400 hover:text-white hover:bg-[#162752] border border-[#1E2D56]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>DRE Simplificada Vidaline</span>
          </button>
        </div>

        {activeTab !== 'dre' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar lançamentos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: Livro Caixa */}
      {activeTab === 'caixa' && (
        <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B132B] border-b border-[#1E2D56] text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Data</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Descrição</th>
                  <th className="p-3.5">Categoria & Centro</th>
                  <th className="p-3.5">Meio de Pagamento</th>
                  <th className="p-3.5 text-right">Valor</th>
                  <th className="p-3.5 text-right">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A284D] text-slate-200">
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-[#162752] transition-colors">
                    <td className="p-3.5 text-slate-400">{formatDate(t.date)}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        t.type === 'entrada'
                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950/70 text-rose-400 border border-rose-800'
                      }`}>
                        {t.type === 'entrada' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {t.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-white">{t.description}</td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-200">{t.category}</span>
                      {t.costCenter && (
                        <p className="text-[11px] text-slate-400 capitalize">{t.costCenter}</p>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-300">{getPaymentMethodLabel(t.paymentMethod)}</td>
                    <td className={`p-3.5 text-right font-black ${t.type === 'entrada' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.type === 'entrada' ? '+' : '-'}{formatMoney(t.amount)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-white">
                      {formatMoney(t.balanceAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Contas a Receber */}
      {activeTab === 'receber' && (
        <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B132B] border-b border-[#1E2D56] text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Pedido</th>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Vencimento</th>
                  <th className="p-3.5 text-right">Valor Total</th>
                  <th className="p-3.5 text-right">Valor Pago</th>
                  <th className="p-3.5 text-right">Saldo Restante</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A284D] text-slate-200">
                {filteredReceivables.map(r => (
                  <tr key={r.id} className="hover:bg-[#162752] transition-colors">
                    <td className="p-3.5 font-bold font-mono text-cyan-400">{r.orderCode}</td>
                    <td className="p-3.5 font-semibold text-white">{r.customerName}</td>
                    <td className="p-3.5">
                      <span className={r.status === 'vencido' ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {formatDate(r.dueDate)}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-white">{formatMoney(r.amount)}</td>
                    <td className="p-3.5 text-right text-emerald-400 font-medium">{formatMoney(r.paidAmount)}</td>
                    <td className="p-3.5 text-right font-black text-rose-400">{formatMoney(r.remainingAmount)}</td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        r.status === 'pago'
                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                          : r.status === 'vencido'
                          ? 'bg-rose-950/70 text-rose-400 border border-rose-800'
                          : 'bg-amber-950/70 text-amber-400 border border-amber-800'
                      }`}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {r.status !== 'pago' && (
                        <button
                          onClick={() => onOpenReceivePayment(r)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer shadow-md"
                        >
                          Liquidar / Receber
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Contas a Pagar */}
      {activeTab === 'pagar' && (
        <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B132B] border-b border-[#1E2D56] text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Fornecedor / Beneficiário</th>
                  <th className="p-3.5">Descrição</th>
                  <th className="p-3.5">Categoria & Centro</th>
                  <th className="p-3.5">Vencimento</th>
                  <th className="p-3.5 text-right">Valor</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A284D] text-slate-200">
                {filteredPayables.map(p => (
                  <tr key={p.id} className="hover:bg-[#162752] transition-colors">
                    <td className="p-3.5 font-bold text-white">{p.supplierName}</td>
                    <td className="p-3.5 text-slate-200">{p.description}</td>
                    <td className="p-3.5">
                      <span className="font-semibold text-white capitalize">{p.category}</span>
                      <p className="text-[11px] text-slate-400 capitalize">{p.costCenter}</p>
                    </td>
                    <td className="p-3.5 text-slate-300">{formatDate(p.dueDate)}</td>
                    <td className="p-3.5 text-right font-black text-amber-400">{formatMoney(p.amount)}</td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        p.status === 'pago' ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800' : 'bg-amber-950/70 text-amber-400 border border-amber-800'
                      }`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {p.status !== 'pago' ? (
                        <button
                          onClick={() => {
                            storageService.payPayable(p.id);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors cursor-pointer shadow-md"
                        >
                          Pagar Despesa
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-bold">Pago em {formatDate(p.paymentDate || '')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DRE Simplificada */}
      {activeTab === 'dre' && (
        <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] p-6 shadow-xl max-w-3xl space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-white">Demonstração do Resultado do Exercício (DRE)</h2>
            <p className="text-xs text-slate-400">Apuração de receitas operacionais, custos e margem líquida do negócio de água mineralizada</p>
          </div>

          <div className="divide-y divide-[#1E2D56] text-xs">
            {/* Receita Bruta */}
            <div className="py-3 flex justify-between items-center bg-[#142347] px-3 rounded-lg font-bold text-white border border-[#203D7A]">
              <span className="text-sm font-black text-cyan-300">(+) RECEITA BRUTA DE VENDAS</span>
              <span className="text-sm font-black text-cyan-300">{formatMoney(dreGrossRevenue)}</span>
            </div>

            {/* Custos Diretos de Produção */}
            <div className="py-3 flex justify-between items-center text-slate-300 px-3">
              <span>(-) Custos de Produção / Filtração & Envasamento</span>
              <span className="text-rose-400 font-semibold">-{formatMoney(dreProductionCosts)}</span>
            </div>

            {/* Margem Bruta */}
            <div className="py-3 flex justify-between items-center bg-[#0B132B] px-3 rounded-lg font-bold text-white border border-[#1E2D56]">
              <span>(=) MARGEM BRUTA OPERACIONAL</span>
              <span className="font-extrabold text-white">{formatMoney(dreGrossMargin)}</span>
            </div>

            {/* Despesas Operacionais */}
            <div className="py-2.5 flex justify-between items-center text-slate-300 px-3">
              <span>(-) Despesas com Frota e Logística de Entrega</span>
              <span className="text-rose-400">-{formatMoney(dreLogistics)}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center text-slate-300 px-3">
              <span>(-) Despesas Comerciais e Marketing</span>
              <span className="text-rose-400">-{formatMoney(dreCommercial)}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center text-slate-300 px-3">
              <span>(-) Despesas Administrativas, Energia e Telecomunicações</span>
              <span className="text-rose-400">-{formatMoney(dreAdmin)}</span>
            </div>

            {/* Resultado Líquido */}
            <div className="py-4 flex justify-between items-center bg-emerald-950/50 px-3 rounded-lg font-black text-white mt-2 border border-emerald-800/60">
              <div>
                <span className="text-sm font-black text-emerald-300">(=) RESULTADO LÍQUIDO DO PERÍODO</span>
                <p className="text-[11px] text-emerald-400 font-normal">Margem líquida de rentabilidade Vidaline</p>
              </div>
              <span className="text-base font-black text-emerald-400">{formatMoney(dreNetProfit)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
