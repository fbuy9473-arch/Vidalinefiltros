import React, { useState } from 'react';
import {
  Users,
  Building2,
  User,
  Plus,
  Search,
  Filter,
  Phone,
  MessageSquare,
  AlertCircle,
  Clock,
  Droplets,
  Calendar,
  CheckCircle,
  Kanban,
  ListFilter,
  CreditCard,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Customer, CustomerType, CustomerStatus } from '../types';
import { storageService } from '../services/storage';
import { formatMoney, formatDate, getCustomerStatusBadgeClass, getCustomerStatusLabel } from '../lib/formatters';

interface CrmViewProps {
  onSelectCustomer: (customer: Customer) => void;
  onOpenNewClient: (defaultType?: CustomerType, defaultStatus?: CustomerStatus) => void;
  initialTab?: 'b2b' | 'b2c' | 'kanban' | 'inativos';
}

export const CrmView: React.FC<CrmViewProps> = ({
  onSelectCustomer,
  onOpenNewClient,
  initialTab = 'b2b'
}) => {
  const [activeTab, setActiveTab] = useState<'b2b' | 'b2c' | 'kanban' | 'inativos'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('todos');

  const customers = storageService.getCustomers();

  // Inactive customers calculation (last purchase > 30 days ago or status 'cliente_inativo')
  const now = new Date();
  const inactiveCustomers = customers.filter(c => {
    if (c.status === 'cliente_inativo') return true;
    if (!c.lastPurchaseDate) return false;
    const lastDate = new Date(c.lastPurchaseDate);
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    return diffDays > 30;
  });

  // Filtered lists
  const b2bList = customers.filter(c => {
    if (c.type !== 'B2B') return false;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.nif && c.nif.includes(searchTerm)) ||
      c.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'todos' || c.sector === sectorFilter;
    return matchesSearch && matchesSector;
  });

  const b2cList = customers.filter(c => {
    if (c.type !== 'B2C') return false;
    return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);
  });

  // Unique sectors for filter dropdown
  const availableSectors = Array.from(new Set(customers.filter(c => c.sector).map(c => c.sector!)));

  // Kanban stages
  const kanbanStages: { id: CustomerStatus; title: string; color: string }[] = [
    { id: 'lead', title: 'Leads', color: 'border-slate-500' },
    { id: 'contactado', title: 'Contactados', color: 'border-blue-400' },
    { id: 'qualificado', title: 'Qualificados', color: 'border-cyan-400' },
    { id: 'proposta_enviada', title: 'Proposta Enviada', color: 'border-amber-400' },
    { id: 'negociacao', title: 'Negociação', color: 'border-orange-400' },
    { id: 'cliente', title: 'Clientes Ativos', color: 'border-emerald-500' },
    { id: 'cliente_recorrente', title: 'Recorrentes', color: 'border-teal-400' },
    { id: 'cliente_inativo', title: 'Inativos (+30d)', color: 'border-rose-400' },
  ];

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111C38] p-5 rounded-2xl border border-[#1E2D56] shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            CRM Comercial Vidaline
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Gestão 360° de contas corporativas (B2B), clientes residenciais (B2C), funil de vendas e retenção.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenNewClient('B2B')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-xl border border-[#3B82F6]/50 transition-all cursor-pointer shadow-md"
          >
            <Building2 className="w-3.5 h-3.5 text-sky-300" />
            <span>+ Cliente B2B</span>
          </button>
          <button
            onClick={() => onOpenNewClient('B2C')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl transition-all cursor-pointer shadow-md shadow-sky-900/40"
          >
            <User className="w-3.5 h-3.5" />
            <span>+ Cliente B2C</span>
          </button>
        </div>
      </div>

      {/* Inactive Alert Banner */}
      {inactiveCustomers.length > 0 && (
        <div className="bg-[#2A141A] border border-[#63222E] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-200 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-300">
                Alerta de Retenção: {inactiveCustomers.length} clientes não compram água há mais de 30 dias!
              </p>
              <p className="text-xs text-rose-400">
                Estes clientes possuem garrafões da Vidaline em posse e necessitam de contacto comercial ativo para reposição.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('inativos')}
            className="text-xs font-bold px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shrink-0 cursor-pointer shadow-md"
          >
            Ver Lista de Inativos
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2D56] pb-3">
        <div className="flex items-center gap-2 max-w-full overflow-x-auto pb-1 [&>button]:shrink-0 [&>button]:whitespace-nowrap">
          <button
            onClick={() => setActiveTab('b2b')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'b2b'
                ? 'bg-[#1D4ED8] text-white shadow-md border border-[#3B82F6]/60'
                : 'bg-[#111C38] text-slate-400 hover:text-white hover:bg-[#162752] border border-[#1E2D56]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>B2B Corporativo ({customers.filter(c => c.type === 'B2B').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('b2c')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'b2c'
                ? 'bg-[#0284C7] text-white shadow-md border border-sky-400/50'
                : 'bg-[#111C38] text-slate-400 hover:text-white hover:bg-[#162752] border border-[#1E2D56]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>B2C Residencial ({customers.filter(c => c.type === 'B2C').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'kanban'
                ? 'bg-[#4F46E5] text-white shadow-md border border-indigo-400/50'
                : 'bg-[#111C38] text-slate-400 hover:text-white hover:bg-[#162752] border border-[#1E2D56]'
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>Funil de Vendas (Kanban)</span>
          </button>

          <button
            onClick={() => setActiveTab('inativos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'inativos'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-[#111C38] text-rose-400 hover:bg-rose-950/30 border border-[#1E2D56]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Inativos (+30d) ({inactiveCustomers.length})</span>
          </button>
        </div>

        {/* Search Input for Lists */}
        {activeTab !== 'kanban' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nome, bairro..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            {activeTab === 'b2b' && (
              <select
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-[#0B132B] border border-[#1E2D56] rounded-xl text-slate-300"
              >
                <option value="todos">Todos os Setores</option>
                {availableSectors.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* TAB CONTENT: B2B Table */}
      {activeTab === 'b2b' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111C38] p-4 rounded-xl border border-[#1E2D56]">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Gestão de Leads & Clientes Corporativos (B2B)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Empresas, clínicas, restaurantes e condomínios abastecidos com garrafões 20L
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenNewClient('B2B', 'lead')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Novo Lead B2B</span>
              </button>
              <button
                onClick={() => onOpenNewClient('B2B', 'cliente')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-xl border border-blue-500/50 transition-all cursor-pointer shadow-md"
              >
                <Building2 className="w-3.5 h-3.5 text-sky-300" />
                <span>+ Novo Cliente B2B</span>
              </button>
            </div>
          </div>

          <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B132B] border-b border-[#1E2D56] text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Empresa / NIF</th>
                    <th className="p-3.5">Setor & Bairro</th>
                    <th className="p-3.5">Contacto Principal</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Total Comprado</th>
                    <th className="p-3.5 text-center">Garrafões 20L</th>
                    <th className="p-3.5 text-right">Dívida Atual</th>
                    <th className="p-3.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A284D] text-slate-200">
                  {b2bList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#162752] text-sky-400 flex items-center justify-center border border-[#233B78]">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-200">Nenhum registro B2B encontrado.</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-md">
                              Adicione novos leads e empresas para gerir propostas comerciais, contratos e abastecimento.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() => onOpenNewClient('B2B', 'lead')}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Adicionar Novo Lead B2B</span>
                            </button>
                            <button
                              onClick={() => onOpenNewClient('B2B', 'cliente')}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-xl border border-blue-500/50 shadow-md transition-all cursor-pointer"
                            >
                              <Building2 className="w-3.5 h-3.5 text-sky-300" />
                              <span>Adicionar Cliente B2B</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                  b2bList.map(cust => (
                    <tr
                      key={cust.id}
                      onClick={() => onSelectCustomer(cust)}
                      className="hover:bg-[#162752] transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cust.name}</span>
                        </div>
                        {cust.nif && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            NIF: {cust.nif}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#162752] text-cyan-300 border border-[#233B78]">
                          {cust.sector || 'Geral'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {cust.neighborhood}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-200">{cust.contactPerson || '-'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{cust.phone}</div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${getCustomerStatusBadgeClass(cust.status)}`}>
                          {getCustomerStatusLabel(cust.status)}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-bold text-white">
                        {formatMoney(cust.totalPurchased)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-md ${
                          cust.bottlesInPossession > 0 ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60' : 'text-slate-400'
                        }`}>
                          <Droplets className="w-3 h-3 text-cyan-400" />
                          {cust.bottlesInPossession} un
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {cust.debtAmount > 0 ? (
                          <span className="font-bold text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-800/50">
                            {formatMoney(cust.debtAmount)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium">Em dia</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCustomer(cust);
                          }}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-[#1C2C5E] rounded-lg transition-colors cursor-pointer"
                          title="Ver Ficha 360°"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* TAB CONTENT: B2C Table */}
      {activeTab === 'b2c' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111C38] p-4 rounded-xl border border-[#1E2D56]">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Gestão de Leads & Clientes Residenciais (B2C)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Famílias, clientes residenciais e entregas pontuais de água mineralizada
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenNewClient('B2C', 'lead')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Novo Lead B2C</span>
              </button>
              <button
                onClick={() => onOpenNewClient('B2C', 'cliente')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl transition-all cursor-pointer shadow-md shadow-sky-900/40"
              >
                <User className="w-3.5 h-3.5" />
                <span>+ Novo Cliente B2C</span>
              </button>
            </div>
          </div>

          <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B132B] border-b border-[#1E2D56] text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Cliente Residencial</th>
                    <th className="p-3.5">Bairro / Localização</th>
                    <th className="p-3.5">Contacto</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Total Gasto</th>
                    <th className="p-3.5 text-center">Garrafões em Casa</th>
                    <th className="p-3.5 text-right">Última Compra</th>
                    <th className="p-3.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A284D] text-slate-200">
                  {b2cList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#0F2F3B] text-cyan-400 flex items-center justify-center border border-cyan-800/60">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-200">Nenhum registro B2C encontrado.</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-md">
                              Adicione novos contatos residenciais e famílias para registar pedidos de água e controlo de vasilhames.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() => onOpenNewClient('B2C', 'lead')}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Adicionar Novo Lead B2C</span>
                            </button>
                            <button
                              onClick={() => onOpenNewClient('B2C', 'cliente')}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl shadow-md transition-all cursor-pointer"
                            >
                              <User className="w-3.5 h-3.5" />
                              <span>Adicionar Cliente B2C</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                  b2cList.map(cust => (
                    <tr
                      key={cust.id}
                      onClick={() => onSelectCustomer(cust)}
                      className="hover:bg-[#162752] transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cust.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-300 font-medium">{cust.neighborhood}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{cust.address}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-200">{cust.phone}</div>
                        {cust.email && <div className="text-[10px] text-slate-400">{cust.email}</div>}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${getCustomerStatusBadgeClass(cust.status)}`}>
                          {getCustomerStatusLabel(cust.status)}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-bold text-white">
                        {formatMoney(cust.totalPurchased)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-md ${
                          cust.bottlesInPossession > 0 ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60' : 'text-slate-400'
                        }`}>
                          <Droplets className="w-3 h-3 text-cyan-400" />
                          {cust.bottlesInPossession} un
                        </span>
                      </td>
                      <td className="p-3.5 text-right text-slate-300">
                        {cust.lastPurchaseDate ? formatDate(cust.lastPurchaseDate) : 'Nunca'}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCustomer(cust);
                          }}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-[#1C2C5E] rounded-lg transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* TAB CONTENT: Inactive Retention List */}
      {activeTab === 'inativos' && (
        <div className="space-y-4">
          <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] overflow-hidden shadow-xl">
            <div className="p-4 bg-[#141F3D] border-b border-[#1E2D56] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Clientes em Risco de Evasão (Churn)
                </h3>
                <p className="text-xs text-slate-400">
                  Prioridade para contato telefónico e oferta de reposição de água Vidaline.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/70 text-rose-400 border border-rose-800">
                {inactiveCustomers.length} Inativos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B132B] border-b border-[#1E2D56] text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="p-3.5">Cliente / Segmento</th>
                    <th className="p-3.5">Telefone / Bairro</th>
                    <th className="p-3.5 text-center">Garrafões em Posse</th>
                    <th className="p-3.5 text-right">Última Compra</th>
                    <th className="p-3.5 text-right">Dias Sem Comprar</th>
                    <th className="p-3.5 text-center">Ação Recomendada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A284D] text-slate-200">
                  {inactiveCustomers.map(cust => {
                    const diff = cust.lastPurchaseDate
                      ? Math.floor((now.getTime() - new Date(cust.lastPurchaseDate).getTime()) / (1000 * 3600 * 24))
                      : 999;

                    return (
                      <tr
                        key={cust.id}
                        onClick={() => onSelectCustomer(cust)}
                        className="hover:bg-[#162752] transition-colors cursor-pointer"
                      >
                        <td className="p-3.5 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            {cust.type === 'B2B' ? <Building2 className="w-3.5 h-3.5 text-sky-400" /> : <User className="w-3.5 h-3.5 text-cyan-400" />}
                            <span>{cust.name}</span>
                          </div>
                          <span className="text-[10px] font-normal text-slate-400">
                            {cust.type} {cust.sector ? `· ${cust.sector}` : ''}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-cyan-300">{cust.phone}</div>
                          <div className="text-[10px] text-slate-400">{cust.neighborhood}</div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-xs text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800">
                            <Droplets className="w-3 h-3 text-rose-400" />
                            {cust.bottlesInPossession} un
                          </span>
                        </td>
                        <td className="p-3.5 text-right text-slate-300">
                          {cust.lastPurchaseDate ? formatDate(cust.lastPurchaseDate) : 'Nunca comprou'}
                        </td>
                        <td className="p-3.5 text-right font-bold text-rose-400">
                          {diff === 999 ? 'N/A' : `${diff} dias`}
                        </td>
                        <td className="p-3.5 text-center">
                          <a
                            href={`tel:${cust.phone}`}
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-md transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Ligar Agora</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Kanban Pipeline */}
      {activeTab === 'kanban' && (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-4 min-w-[1300px] items-start">
            {kanbanStages.map(stage => {
              const stageClients = customers.filter(c => c.status === stage.id);
              return (
                <div
                  key={stage.id}
                  className="w-72 bg-[#0E1730] rounded-2xl border border-[#1E2D56] p-3 shrink-0 shadow-lg flex flex-col max-h-[700px]"
                >
                  <div className={`flex items-center justify-between pb-2 mb-2 border-b-2 ${stage.color}`}>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {stage.title}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#162752] text-sky-300 rounded-full border border-[#233A70]">
                      {stageClients.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                    {stageClients.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-700/50 rounded-xl">
                        Nenhum cliente
                      </div>
                    ) : (
                      stageClients.map(c => (
                        <div
                          key={c.id}
                          onClick={() => onSelectCustomer(c)}
                          className="bg-[#142042] p-3 rounded-xl border border-[#223566] hover:border-cyan-500/60 shadow-md hover:shadow-lg transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-[#1A2D5E] text-cyan-300">
                              {c.type}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Droplets className="w-2.5 h-2.5 text-cyan-400" />
                              {c.bottlesInPossession} un
                            </span>
                          </div>

                          <h5 className="font-bold text-xs text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                            {c.name}
                          </h5>

                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {c.neighborhood}
                          </p>

                          <div className="mt-2 pt-2 border-t border-[#1E2E59] flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">Total:</span>
                            <span className="font-bold text-white">{formatMoney(c.totalPurchased)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
