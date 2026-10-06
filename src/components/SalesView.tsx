import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  Truck,
  Droplets,
  Printer,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus } from '../types';
import { storageService } from '../services/storage';
import { formatMoney, formatDate, getOrderStatusBadgeClass, getOrderStatusLabel, getPaymentMethodLabel } from '../lib/formatters';

interface SalesViewProps {
  onOpenNewSale: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ onOpenNewSale }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const orders = storageService.getOrders();

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || o.orderStatus === statusFilter;
    const matchesType = typeFilter === 'todos' || o.customerType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const paidSales = orders.filter(o => o.paymentStatus === 'pago').reduce((sum, o) => sum + o.total, 0);
  const pendingSales = orders.filter(o => o.paymentStatus === 'pendente').reduce((sum, o) => sum + o.remainingAmount, 0);

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111C38] p-5 rounded-2xl border border-[#1E2D56] shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Vendas & Expedição de Água
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Emissão de pedidos, controle de entregas de garrafões e faturamento integrado.
          </p>
        </div>

        <button
          onClick={onOpenNewSale}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] active:bg-[#0284C7] rounded-xl transition-all shadow-md shadow-sky-900/40 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Criar Novo Pedido</span>
        </button>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] shadow-lg">
          <span className="text-xs text-slate-400 font-medium">Volume Total de Vendas</span>
          <p className="text-xl font-black text-white mt-1">{formatMoney(totalSales)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{orders.length} pedidos emitidos</p>
        </div>

        <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] shadow-lg">
          <span className="text-xs text-slate-400 font-medium">Recebido / Liquidado</span>
          <p className="text-xl font-black text-emerald-400 mt-1">{formatMoney(paidSales)}</p>
          <p className="text-xs text-emerald-400/80 font-medium mt-0.5">Entradas em caixa confirmadas</p>
        </div>

        <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] shadow-lg">
          <span className="text-xs text-slate-400 font-medium">A Receber (A Prazo)</span>
          <p className="text-xl font-black text-amber-400 mt-1">{formatMoney(pendingSales)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Contas de crédito ativas</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código (ex: PED-1024) ou nome do cliente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-slate-300 font-medium cursor-pointer"
          >
            <option value="todos">Todos os Status</option>
            <option value="confirmado">Confirmado</option>
            <option value="em_preparacao">Em Preparação</option>
            <option value="em_entrega">Em Entrega</option>
            <option value="entregue">Entregue</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-slate-300 font-medium cursor-pointer"
          >
            <option value="todos">B2B & B2C</option>
            <option value="B2B">Apenas B2B</option>
            <option value="B2C">Apenas B2C</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B132B] border-b border-[#1E2D56] text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Pedido</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Comercial</th>
                <th className="p-3.5">Data</th>
                <th className="p-3.5 text-center">Vasilhames 20L</th>
                <th className="p-3.5">Pagamento</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Valor Total</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A284D] text-slate-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Nenhum pedido encontrado com os critérios pesquisados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-[#162752] transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5 font-mono font-bold text-cyan-400 group-hover:text-cyan-300">
                      {order.code}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{order.customerName}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#162752] text-sky-300 border border-[#233A70]">
                          {order.customerType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{order.items.length} itens no pedido</p>
                    </td>
                    <td className="p-3.5 text-slate-300">{order.commercialRep}</td>
                    <td className="p-3.5 text-slate-300">{formatDate(order.date)}</td>
                    <td className="p-3.5 text-center">
                      {order.bottlesDeliveredQty > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-[#142347] px-2 py-0.5 rounded border border-[#203D7A]">
                          <Droplets className="w-3 h-3 text-cyan-400" />
                          +{order.bottlesDeliveredQty} / -{order.bottlesCollectedQty}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-slate-200 capitalize">
                        {order.paymentMethod.replace('_', ' ')}
                      </span>
                      <p className={`text-[10px] font-bold ${order.paymentStatus === 'pago' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {order.paymentStatus.toUpperCase()}
                      </p>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getOrderStatusBadgeClass(order.orderStatus)}`}>
                        {getOrderStatusLabel(order.orderStatus)}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-white">
                      {formatMoney(order.total)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-[#1C2C5E] rounded-lg transition-colors cursor-pointer"
                        title="Ver Comprovativo / Fatura"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal / Printable Receipt */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#1E2D56] flex items-center justify-between bg-[#0B132B]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Comprovativo de Venda: {selectedOrder.code}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Printable Content */}
            <div className="p-6 space-y-4 text-xs">
              {/* Company Branding */}
              <div className="text-center pb-3 border-b border-dashed border-[#1E2D56]">
                <h2 className="text-lg font-black text-white tracking-tight">VIDALINE ÁGUAS, LDA</h2>
                <p className="text-[11px] text-slate-400">NIF: 5410982312 · Luanda, Angola</p>
                <p className="text-[11px] text-slate-400">Serviço de Entrega & Distribuição de Água</p>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-2 bg-[#0B132B] p-3 rounded-xl border border-[#1E2D56]">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Cliente:</span>
                  <p className="font-bold text-white">{selectedOrder.customerName}</p>
                  <p className="text-slate-400">{selectedOrder.customerType}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Data & Comercial:</span>
                  <p className="font-medium text-slate-200">{formatDate(selectedOrder.date)}</p>
                  <p className="text-slate-400">{selectedOrder.commercialRep}</p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <p className="font-bold text-slate-300 uppercase text-[10px] tracking-wider mb-2">Itens Fornecidos:</p>
                <div className="border border-[#1E2D56] rounded-xl overflow-hidden divide-y divide-[#1E2D56] bg-[#0B132B]">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="p-2.5 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-white">{item.productName}</p>
                        <p className="text-slate-400 text-[11px]">{item.quantity} un × {formatMoney(item.unitPrice)}</p>
                      </div>
                      <span className="font-bold text-white">{formatMoney(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottles section */}
              {selectedOrder.bottlesDeliveredQty > 0 && (
                <div className="p-3 bg-[#142347] border border-[#203D7A] rounded-xl text-cyan-300 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-xs">Movimentação de Vasilhames:</span>
                    <p className="text-[11px] text-cyan-400">Entregues cheios: {selectedOrder.bottlesDeliveredQty} | Recolhidos vazios: {selectedOrder.bottlesCollectedQty}</p>
                  </div>
                  <Droplets className="w-5 h-5 text-cyan-400" />
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-[#1E2D56] text-right">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>{formatMoney(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Desconto:</span>
                    <span>-{formatMoney(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-white pt-1 border-t border-[#1E2D56]">
                  <span>Total Final:</span>
                  <span>{formatMoney(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-slate-400">Condição:</span>
                  <span className="font-bold text-white">{getPaymentMethodLabel(selectedOrder.paymentMethod)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 border-t border-[#1E2D56] bg-[#0B132B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <select
                  value={selectedOrder.orderStatus}
                  onChange={e => {
                    const newSt = e.target.value as OrderStatus;
                    storageService.updateOrderStatus(selectedOrder.id, newSt);
                    setSelectedOrder({ ...selectedOrder, orderStatus: newSt });
                  }}
                  className="px-2.5 py-1.5 bg-[#111C38] border border-[#1E2D56] rounded-lg font-bold text-cyan-300 cursor-pointer text-xs"
                >
                  <option value="confirmado">Status: Confirmado</option>
                  <option value="em_preparacao">Status: Em Preparação</option>
                  <option value="em_entrega">Status: Em Entrega</option>
                  <option value="entregue">Status: Entregue</option>
                  <option value="cancelado">Status: Cancelado</option>
                </select>

                {selectedOrder.orderStatus !== 'cancelado' && (
                  <button
                    onClick={() => {
                      if (confirm(`Deseja cancelar a venda ${selectedOrder.code} e devolver o estoque?`)) {
                        storageService.cancelOrder(selectedOrder.id);
                        setSelectedOrder(null);
                      }
                    }}
                    className="px-2.5 py-1.5 font-bold text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 rounded-lg cursor-pointer"
                  >
                    Cancelar Venda
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-[#162752] border border-[#233B78] hover:bg-[#1E3672] rounded-lg cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
