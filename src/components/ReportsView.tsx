import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  PieChart,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  Clock
} from 'lucide-react';
import { storageService } from '../services/storage';
import { formatMoney, formatDate } from '../lib/formatters';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<'vendas' | 'financeiro' | 'vasilhames' | 'clientes'>('vendas');

  const orders = storageService.getOrders();
  const customers = storageService.getCustomers();
  const products = storageService.getProducts();
  const payables = storageService.getPayables();
  const receivables = storageService.getReceivables();
  const bottleAudit = storageService.getBottleAudit();

  // Export CSV Helper
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSalesCSV = () => {
    let csv = 'Código;Cliente;Tipo;Data;Total (Kz);Forma Pagamento;Status Pagamento;Status Pedido;Garrafões Entregues\n';
    orders.forEach(o => {
      csv += `"${o.code}";"${o.customerName}";"${o.customerType}";"${o.date}";${o.total};"${o.paymentMethod}";"${o.paymentStatus}";"${o.orderStatus}";${o.bottlesDeliveredQty}\n`;
    });
    downloadCSV(csv, `vidaline_vendas_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportFinanceCSV = () => {
    let csv = 'Tipo;Descricao;Valor (Kz);Vencimento;Status;Entidade\n';
    receivables.forEach(r => {
      csv += `"Receber";"Pedido ${r.orderCode}";${r.amount};"${r.dueDate}";"${r.status}";"${r.customerName}"\n`;
    });
    payables.forEach(p => {
      csv += `"Pagar";"${p.description}";${p.amount};"${p.dueDate}";"${p.status}";"${p.supplierName}"\n`;
    });
    downloadCSV(csv, `vidaline_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportClientsCSV = () => {
    let csv = 'Nome;Tipo;Setor;Bairro;Telefone;Total Comprado (Kz);Total Pedidos;Garrafões em Posse;Dívida (Kz);Status\n';
    customers.forEach(c => {
      csv += `"${c.name}";"${c.type}";"${c.sector || ''}";"${c.neighborhood}";"${c.phone}";${c.totalPurchased};${c.totalOrders};${c.bottlesInPossession};${c.debtAmount};"${c.status}"\n`;
    });
    downloadCSV(csv, `vidaline_clientes_crm_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111C38] p-5 rounded-2xl border border-[#1E2D56] shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Relatórios Operacionais & Inteligência (BI)
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Demonstrativos analíticos, curva de vendas, auditoria de ativos e exportação para Excel / CSV.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={
              reportType === 'vendas'
                ? handleExportSalesCSV
                : reportType === 'financeiro'
                ? handleExportFinanceCSV
                : handleExportClientsCSV
            }
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 bg-[#162752] hover:bg-[#1C3268] border border-[#233B78] rounded-xl transition-all cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Exportar Relatório Ativo (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1E2D56] pb-3 text-xs font-bold">
        <button
          onClick={() => setReportType('vendas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            reportType === 'vendas'
              ? 'bg-[#1D4ED8] text-white shadow-md border border-blue-400/50'
              : 'bg-[#111C38] text-slate-400 hover:text-white hover:bg-[#162752] border border-[#1E2D56]'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Vendas & Faturamento</span>
        </button>

        <button
          onClick={() => setReportType('financeiro')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            reportType === 'financeiro'
              ? 'bg-[#0284C7] text-white shadow-md border border-sky-400/50'
              : 'bg-[#111C38] text-slate-400 hover:text-white hover:bg-[#162752] border border-[#1E2D56]'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financeiro & Inadimplência</span>
        </button>

        <button
          onClick={() => setReportType('vasilhames')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            reportType === 'vasilhames'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#111C38] text-slate-400 hover:text-white hover:bg-[#162752] border border-[#1E2D56]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Auditoria de Garrafões</span>
        </button>

        <button
          onClick={() => setReportType('clientes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            reportType === 'clientes'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-[#111C38] text-slate-400 hover:text-white hover:bg-[#162752] border border-[#1E2D56]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clientes & LTV</span>
        </button>
      </div>

      {/* REPORT 1: VENDAS */}
      {reportType === 'vendas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] shadow-lg">
              <span className="text-xs text-slate-400 font-medium">Receita B2B (Corporativo)</span>
              <p className="text-xl font-black text-white mt-1">
                {formatMoney(orders.filter(o => o.customerType === 'B2B').reduce((s, o) => s + o.total, 0))}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Empresas, hotéis e clínicas</p>
            </div>

            <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] shadow-lg">
              <span className="text-xs text-slate-400 font-medium">Receita B2C (Residencial)</span>
              <p className="text-xl font-black text-white mt-1">
                {formatMoney(orders.filter(o => o.customerType === 'B2C').reduce((s, o) => s + o.total, 0))}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Consumidor final e condomínios</p>
            </div>

            <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] shadow-lg">
              <span className="text-xs text-slate-400 font-medium">Ticket Médio Geral</span>
              <p className="text-xl font-black text-white mt-1">
                {formatMoney(Math.round(orders.reduce((s, o) => s + o.total, 0) / Math.max(1, orders.length)))}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Média por pedido despachado</p>
            </div>
          </div>

          <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] p-4 shadow-xl">
            <h3 className="font-bold text-sm text-white mb-3">Resumo Detalhado de Vendas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B132B] text-slate-400 font-semibold border-b border-[#1E2D56]">
                  <tr>
                    <th className="p-2.5">Código</th>
                    <th className="p-2.5">Cliente</th>
                    <th className="p-2.5">Segmento</th>
                    <th className="p-2.5">Data</th>
                    <th className="p-2.5">Forma Pagto</th>
                    <th className="p-2.5 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A284D] text-slate-200">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-[#162752]">
                      <td className="p-2.5 font-bold font-mono text-cyan-400">{o.code}</td>
                      <td className="p-2.5 text-white">{o.customerName}</td>
                      <td className="p-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-[#162752] text-sky-300 border border-[#233A70]">
                          {o.customerType}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-300">{formatDate(o.date)}</td>
                      <td className="p-2.5 capitalize text-slate-300">{o.paymentMethod.replace('_', ' ')}</td>
                      <td className="p-2.5 text-right font-bold text-white">{formatMoney(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: FINANCEIRO */}
      {reportType === 'financeiro' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] shadow-lg">
              <span className="text-xs text-slate-400 font-medium">Índice de Inadimplência</span>
              <p className="text-xl font-black text-rose-400 mt-1">
                {formatMoney(receivables.filter(r => r.status === 'vencido').reduce((s, r) => s + r.remainingAmount, 0))}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Contas vencidas em atraso</p>
            </div>

            <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] shadow-lg">
              <span className="text-xs text-slate-400 font-medium">Total de Contas a Pagar</span>
              <p className="text-xl font-black text-amber-400 mt-1">
                {formatMoney(payables.reduce((s, p) => s + p.amount, 0))}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Despesas operacionais e insumos</p>
            </div>

            <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] shadow-lg">
              <span className="text-xs text-slate-400 font-medium">Eficiência de Cobrança</span>
              <p className="text-xl font-black text-emerald-400 mt-1">88.4%</p>
              <p className="text-xs text-emerald-400/80 font-medium mt-0.5">Taxa de recebimento no prazo</p>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: VASILHAMES */}
      {reportType === 'vasilhames' && (() => {
        const totalBottles = bottleAudit.inStock + bottleAudit.emptyInStock + bottleAudit.withCustomers + bottleAudit.inTransit + bottleAudit.damaged + bottleAudit.lost;
        const damagedOrLost = bottleAudit.damaged + bottleAudit.lost;
        return (
          <div className="bg-[#111C38] p-6 rounded-2xl border border-[#1E2D56] shadow-xl space-y-4 text-xs">
            <h3 className="font-extrabold text-white text-base">Auditoria Físico-Financeira de Garrafões 20L</h3>
            <p className="text-slate-400">
              Cada vasilhame possui custo médio de reposição de <strong className="text-white">3.500 Kz</strong>. O patrimônio total investido em vasilhames é de <strong className="text-cyan-400">{formatMoney(totalBottles * 3500)}</strong>.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#0B132B] border border-[#1E2D56]">
                <span className="text-slate-400 block font-medium">Total de Garrafões</span>
                <p className="text-lg font-black text-white mt-1">{totalBottles} un</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0B132B] border border-cyan-800/40">
                <span className="text-cyan-400 block font-medium">No Armazém</span>
                <p className="text-lg font-black text-cyan-300 mt-1">{bottleAudit.inStock + bottleAudit.emptyInStock} un</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0B132B] border border-sky-800/40">
                <span className="text-sky-400 block font-medium">Com Clientes</span>
                <p className="text-lg font-black text-sky-300 mt-1">{bottleAudit.withCustomers} un</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0B132B] border border-rose-800/40">
                <span className="text-rose-400 block font-medium">Perdas / Avarias</span>
                <p className="text-lg font-black text-rose-300 mt-1">{damagedOrLost} un</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* REPORT 4: CLIENTES */}
      {reportType === 'clientes' && (
        <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] p-4 shadow-xl">
          <h3 className="font-bold text-sm text-white mb-3">Ranking de Faturamento por Cliente (LTV)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B132B] text-slate-400 font-semibold border-b border-[#1E2D56]">
                <tr>
                  <th className="p-2.5">Cliente</th>
                  <th className="p-2.5">Tipo</th>
                  <th className="p-2.5">Bairro</th>
                  <th className="p-2.5 text-center">Pedidos</th>
                  <th className="p-2.5 text-center">Garrafões em Posse</th>
                  <th className="p-2.5 text-right">LTV (Total Comprado)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A284D] text-slate-200">
                {[...customers].sort((a, b) => b.totalPurchased - a.totalPurchased).map(c => (
                  <tr key={c.id} className="hover:bg-[#162752]">
                    <td className="p-2.5 font-bold text-white">{c.name}</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-[#162752] text-sky-300 border border-[#233A70]">
                        {c.type}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-300">{c.neighborhood}</td>
                    <td className="p-2.5 text-center text-slate-300">{c.totalOrders}</td>
                    <td className="p-2.5 text-center font-bold text-cyan-400">{c.bottlesInPossession} un</td>
                    <td className="p-2.5 text-right font-black text-white">{formatMoney(c.totalPurchased)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
