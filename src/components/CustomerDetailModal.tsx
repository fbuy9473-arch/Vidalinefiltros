import React, { useState } from 'react';
import {
  X,
  Building2,
  User,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Droplets,
  Clock,
  Plus,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Customer } from '../types';
import { storageService } from '../services/storage';
import { formatMoney, formatDate, getCustomerStatusBadgeClass, getCustomerStatusLabel, getOrderStatusBadgeClass, getOrderStatusLabel } from '../lib/formatters';

interface CustomerDetailModalProps {
  customer: Customer | null;
  onClose: () => void;
  onOpenNewSaleForCustomer: (customer: Customer) => void;
  onRecordBottleReturn: (customer: Customer) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  onClose,
  onOpenNewSaleForCustomer,
  onRecordBottleReturn
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'compras' | 'vasilhames' | 'financeiro' | 'timeline'>('compras');

  if (!customer) return null;

  const orders = storageService.getOrders().filter(o => o.customerId === customer.id);
  const receivables = storageService.getReceivables().filter(r => r.customerId === customer.id);
  const bottleMovements = storageService.getBottleCustomerMovements().filter(b => b.customerId === customer.id);

  // Timeline events generated dynamically from customer lifecycle
  const timelineEvents = [
    ...(customer.lastPurchaseDate ? [{
      date: customer.lastPurchaseDate,
      title: 'Último Pedido Concluído',
      desc: `Pedido entregue com sucesso e vasilhames movimentados.`,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-950 border border-emerald-700'
    }] : []),
    ...(orders.slice(0, 3).map(o => ({
      date: o.date,
      title: `Venda ${o.code} Registada`,
      desc: `Total de ${formatMoney(o.total)} (${o.items.length} itens) via ${o.paymentMethod.replace('_', ' ')}.`,
      icon: FileText,
      color: 'text-cyan-400 bg-cyan-950 border border-cyan-700'
    }))),
    {
      date: customer.createdAt,
      title: `Cliente Cadastrado no Sistema`,
      desc: `Registo inicial por ${customer.commercialRep || 'Administrador'}.`,
      icon: Calendar,
      color: 'text-slate-300 bg-slate-800 border border-slate-700'
    }
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E2D56] flex items-start justify-between bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm border border-[#233A70] ${
              customer.type === 'B2B' ? 'bg-[#162752] text-cyan-400' : 'bg-[#0284C7] text-white'
            }`}>
              {customer.type === 'B2B' ? <Building2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">{customer.name}</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#162752] text-sky-300 border border-[#233A70]">
                  {customer.type}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getCustomerStatusBadgeClass(customer.status)}`}>
                  {getCustomerStatusLabel(customer.status)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {customer.sector ? `${customer.sector} · ` : ''}{customer.neighborhood}, {customer.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenNewSaleForCustomer(customer)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl shadow-md shadow-sky-900/40 transition-colors cursor-pointer"
            >
              + Nova Venda
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#162752] rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#0B132B] border border-[#1E2D56]">
              <span className="text-[11px] text-slate-400 font-medium">Total Comprado</span>
              <p className="text-base font-black text-white mt-0.5">{formatMoney(customer.totalPurchased)}</p>
              <p className="text-[10px] text-slate-400">{customer.totalOrders} pedidos realizados</p>
            </div>

            <div className="p-3 rounded-xl bg-[#0B132B] border border-[#1E2D56]">
              <span className="text-[11px] text-slate-400 font-medium">Ticket Médio</span>
              <p className="text-base font-black text-white mt-0.5">{formatMoney(customer.averageTicket)}</p>
              <p className="text-[10px] text-slate-400">Por fornecimento</p>
            </div>

            <div className="p-3 rounded-xl bg-[#0B132B] border border-[#203D7A]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-cyan-400 font-bold">Garrafões em Posse</span>
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-base font-black text-cyan-300 mt-0.5">{customer.bottlesInPossession} unidades</p>
              <p className="text-[10px] text-slate-400">Entregues: {customer.bottlesDelivered} | Devolvidos: {customer.bottlesReturned}</p>
            </div>

            <div className={`p-3 rounded-xl border ${customer.debtAmount > 0 ? 'bg-rose-950/30 border-rose-800' : 'bg-emerald-950/30 border-emerald-800'}`}>
              <span className="text-[11px] font-medium text-slate-400">Dívida Atual</span>
              <p className={`text-base font-black mt-0.5 ${customer.debtAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatMoney(customer.debtAmount)}
              </p>
              <p className="text-[10px] text-slate-400">Limite: {formatMoney(customer.creditLimit)}</p>
            </div>
          </div>

          {/* Contact and address quick bar */}
          <div className="p-3.5 rounded-xl bg-[#0B132B] border border-[#1E2D56] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Contacto & WhatsApp:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-white">{customer.phone}</span>
                <a
                  href={`https://wa.me/${customer.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold text-[10px] hover:bg-emerald-900"
                >
                  WhatsApp →
                </a>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Endereço / Localização:</span>
              <p className="font-semibold text-slate-300 mt-0.5 truncate">{customer.address}, {customer.neighborhood}</p>
            </div>

            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Comercial & Condições:</span>
              <p className="font-semibold text-slate-300 mt-0.5">{customer.commercialRep} · {customer.paymentTerm.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Subtabs Header */}
          <div className="flex items-center gap-2 border-b border-[#1E2D56] text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('compras')}
              className={`pb-2 px-3 transition-colors cursor-pointer ${
                activeSubTab === 'compras'
                  ? 'border-b-2 border-cyan-400 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Histórico de Pedidos ({orders.length})
            </button>

            <button
              onClick={() => setActiveSubTab('vasilhames')}
              className={`pb-2 px-3 transition-colors cursor-pointer ${
                activeSubTab === 'vasilhames'
                  ? 'border-b-2 border-cyan-400 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Controle de Vasilhames Retornáveis ({customer.bottlesInPossession} em posse)
            </button>

            <button
              onClick={() => setActiveSubTab('financeiro')}
              className={`pb-2 px-3 transition-colors cursor-pointer ${
                activeSubTab === 'financeiro'
                  ? 'border-b-2 border-cyan-400 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Contas & Pagamentos ({receivables.length})
            </button>

            <button
              onClick={() => setActiveSubTab('timeline')}
              className={`pb-2 px-3 transition-colors cursor-pointer ${
                activeSubTab === 'timeline'
                  ? 'border-b-2 border-cyan-400 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Timeline de Atividades
            </button>
          </div>

          {/* Subtab: Compras */}
          {activeSubTab === 'compras' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-[#0B132B] rounded-xl border border-dashed border-[#1E2D56]">
                  Nenhum pedido registado ainda para este cliente.
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="p-3.5 rounded-xl border border-[#1E2D56] bg-[#0B132B] hover:bg-[#162752] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-cyan-400">{order.code}</span>
                        <span className="text-xs text-slate-400">{formatDate(order.date)}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.2 rounded-full border ${getOrderStatusBadgeClass(order.orderStatus)}`}>
                          {getOrderStatusLabel(order.orderStatus)}
                        </span>
                      </div>
                      <span className="font-extrabold text-sm text-white">{formatMoney(order.total)}</span>
                    </div>

                    <div className="mt-2 text-xs text-slate-300 space-y-1">
                      {order.items.map((it, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{it.quantity}x {it.productName}</span>
                          <span className="font-medium text-slate-200">{formatMoney(it.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#1E2D56] flex items-center justify-between text-[11px] text-slate-400">
                      <span>Forma de pagamento: {order.paymentMethod.replace('_', ' ')}</span>
                      {order.bottlesDeliveredQty > 0 && (
                        <span className="text-cyan-400 font-medium">
                          {order.bottlesDeliveredQty} garrafões entregues / {order.bottlesCollectedQty} recolhidos
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Subtab: Vasilhames */}
          {activeSubTab === 'vasilhames' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0B132B] border border-[#203D7A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-cyan-300">Saldo de Vasilhames 20L Vidaline</h4>
                  <p className="text-xs text-slate-400">
                    O cliente possui atualmente <strong className="font-extrabold text-white">{customer.bottlesInPossession} garrafões</strong> de água retornáveis em sua posse.
                  </p>
                </div>
                {customer.bottlesInPossession > 0 && (
                  <button
                    onClick={() => onRecordBottleReturn(customer)}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl transition-all shadow-md cursor-pointer self-start sm:self-auto"
                  >
                    Registar Devolução / Recolha
                  </button>
                )}
              </div>

              <div className="border border-[#1E2D56] rounded-xl overflow-x-auto bg-[#0B132B]">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="bg-[#070B18] text-slate-400 font-semibold border-b border-[#1E2D56]">
                    <tr>
                      <th className="p-3">Data</th>
                      <th className="p-3">Tipo de Movimento</th>
                      <th className="p-3 text-center">Quantidade</th>
                      <th className="p-3 text-center">Saldo em Posse</th>
                      <th className="p-3">Registado Por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2D56] text-slate-200">
                    {bottleMovements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">
                          Nenhuma movimentação de vasilhame individual registrada.
                        </td>
                      </tr>
                    ) : (
                      bottleMovements.map(bm => (
                        <tr key={bm.id}>
                          <td className="p-3 text-slate-400">{formatDate(bm.date)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              bm.type === 'entrega' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}>
                              {bm.type === 'entrega' ? 'Entrega de Cheios' : 'Recolha de Vazios'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-white">{bm.quantity} un</td>
                          <td className="p-3 text-center font-bold text-cyan-300">{bm.balanceAfter} un</td>
                          <td className="p-3 text-slate-400">{bm.registeredBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subtab: Financeiro */}
          {activeSubTab === 'financeiro' && (
            <div className="space-y-3">
              {receivables.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-[#0B132B] rounded-xl border border-dashed border-[#1E2D56]">
                  Nenhuma conta a receber pendente para este cliente.
                </div>
              ) : (
                receivables.map(rec => (
                  <div key={rec.id} className="p-3.5 rounded-xl border border-[#1E2D56] bg-[#0B132B] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-cyan-400">{rec.orderCode}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          rec.status === 'pago' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          rec.status === 'vencido' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {rec.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Vencimento: {formatDate(rec.dueDate)}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-sm text-white">{formatMoney(rec.amount)}</p>
                      {rec.remainingAmount > 0 && (
                        <p className="text-xs text-rose-400 font-semibold">
                          Resta: {formatMoney(rec.remainingAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Subtab: Timeline */}
          {activeSubTab === 'timeline' && (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1E2D56]">
              {timelineEvents.map((evt, idx) => {
                const Icon = evt.icon;
                return (
                  <div key={idx} className="relative flex items-start gap-3">
                    <div className={`absolute -left-6 w-5 h-5 rounded-full ${evt.color} flex items-center justify-center ring-4 ring-[#111C38]`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-white">{evt.title}</h5>
                        <span className="text-[10px] text-slate-400">{formatDate(evt.date)}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{evt.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2D56] bg-[#0B132B] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-[#162752] border border-[#233B78] hover:bg-[#1E3672] rounded-xl cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
