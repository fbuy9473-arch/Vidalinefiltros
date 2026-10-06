import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  DollarSign,
  Package,
  Building2,
  BarChart3,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Clock,
  Droplets
} from 'lucide-react';
import { UserRole } from '../types';

export type TabType = 
  | 'dashboard'
  | 'crm'
  | 'vendas'
  | 'financeiro'
  | 'estoque'
  | 'fornecedores'
  | 'relatorios'
  | 'auditoria'
  | 'admin';

interface SidebarProps {
  /** Mobile drawer state (the sidebar is always visible from the lg breakpoint up). */
  isOpen?: boolean;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  userRole: UserRole;
  badgeCounts?: {
    stockAlerts?: number;
    overdueReceivables?: number;
    inactiveClients?: number;
  };
  currentUserName?: string;
  currentUserRoleTitle?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  activeTab,
  onSelectTab,
  userRole,
  badgeCounts,
  currentUserName = '',
  currentUserRoleTitle = ''
}) => {
  const stockAlerts = badgeCounts?.stockAlerts || 0;
  const overdueReceivables = badgeCounts?.overdueReceivables || 0;
  const inactiveClients = badgeCounts?.inactiveClients || 0;
  return (
    <aside
      className={`fixed left-0 top-[4.5rem] z-50 h-[calc(100dvh-4.5rem)] w-64 max-w-[85vw] transform transition-transform duration-200 lg:static lg:z-auto lg:h-[calc(100vh-4.5rem)] lg:max-w-none lg:translate-x-0 bg-[#0B132B] text-slate-300 flex flex-col shrink-0 border-r border-[#172344] select-none overflow-y-auto custom-scrollbar ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-3 space-y-4 flex-1">
        {/* Top: Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-[#1E40AF]/80 text-white border border-[#3B82F6]/60 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
              : 'text-slate-300 hover:text-white hover:bg-[#131F3F]'
          }`}
        >
          <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-sky-400' : 'text-slate-400'}`} />
          <span>Dashboard Geral</span>
        </button>

        {/* Group: COMERCIAL & CLIENTES */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            COMERCIAL & CLIENTES
          </div>
          <button
            onClick={() => onSelectTab('vendas')}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'vendas'
                ? 'bg-[#1E40AF]/80 text-white border border-[#3B82F6]/60 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#131F3F]'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className={`w-4 h-4 ${activeTab === 'vendas' ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>Vendas & Pedidos</span>
            </div>
          </button>

          <button
            onClick={() => onSelectTab('crm')}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'crm'
                ? 'bg-[#1E40AF]/80 text-white border border-[#3B82F6]/60 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#131F3F]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className={`w-4 h-4 ${activeTab === 'crm' ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>Clientes & CRM</span>
            </div>
            {inactiveClients > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-700">
                {inactiveClients}
              </span>
            )}
          </button>
        </div>

        {/* Group: GESTÃO OPERACIONAL */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            OPERAÇÕES & ESTOQUE
          </div>
          <button
            onClick={() => onSelectTab('estoque')}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'estoque'
                ? 'bg-[#1E40AF]/80 text-white border border-[#3B82F6]/60 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#131F3F]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Package className={`w-4 h-4 ${activeTab === 'estoque' ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>Estoque & Garrafões</span>
            </div>
            {stockAlerts > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-900/60 text-rose-300 border border-rose-700">
                {stockAlerts}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('fornecedores')}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'fornecedores'
                ? 'bg-[#1E40AF]/80 text-white border border-[#3B82F6]/60 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#131F3F]'
            }`}
          >
            <Building2 className={`w-4 h-4 ${activeTab === 'fornecedores' ? 'text-sky-400' : 'text-slate-400'}`} />
            <span>Fornecedores</span>
          </button>
        </div>

        {/* Group: CONTROLADORIA & FINANCEIRO */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            CONTROLADORIA & DRE
          </div>
          <button
            onClick={() => onSelectTab('financeiro')}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'financeiro'
                ? 'bg-[#1E40AF]/80 text-white border border-[#3B82F6]/60 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#131F3F]'
            }`}
          >
            <div className="flex items-center gap-3">
              <DollarSign className={`w-4 h-4 ${activeTab === 'financeiro' ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>Financeiro & Caixa</span>
            </div>
            {overdueReceivables > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-900/60 text-amber-300 border border-amber-700">
                {overdueReceivables}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('relatorios')}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'relatorios'
                ? 'bg-[#1E40AF]/80 text-white border border-[#3B82F6]/60 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#131F3F]'
            }`}
          >
            <BarChart3 className={`w-4 h-4 ${activeTab === 'relatorios' ? 'text-sky-400' : 'text-slate-400'}`} />
            <span>Relatórios & BI</span>
          </button>
        </div>

        {/* Group: GOVERNANÇA & SISTEMA */}
        <div className="space-y-1 pt-2 border-t border-[#172344]">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            GOVERNANÇA & SISTEMA
          </div>
          <button
            onClick={() => onSelectTab('auditoria')}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'auditoria'
                ? 'bg-[#1E40AF]/80 text-white border border-[#3B82F6]/60 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#131F3F]'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activeTab === 'auditoria' ? 'text-sky-400' : 'text-slate-400'}`} />
            <span>Auditoria & Logs</span>
          </button>
        </div>

        {/* Group: ADMINISTRAÇÃO & EQUIPA (Exclusivo Administradores) */}
        {userRole === 'admin' && (
          <div className="space-y-1 pt-2 border-t border-[#172344]">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span>ADMINISTRAÇÃO</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-extrabold">
                RESTRITO
              </span>
            </div>
            <button
              id="sidebar-nav-admin"
              onClick={() => onSelectTab('admin')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-amber-600/80 text-white border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'text-amber-300/90 hover:text-white hover:bg-[#131F3F] border border-amber-500/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className={`w-4 h-4 ${activeTab === 'admin' ? 'text-white' : 'text-amber-400'}`} />
                <span>Funcionários & Admin</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* User Profile Card at the Bottom */}
      <div className="p-3 border-t border-[#172344] bg-[#0A1024]">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-[#1A2E60] border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
              {currentUserName.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0B132B]"></span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{currentUserName}</p>
            <p className="text-[10px] text-slate-400 truncate">{currentUserRoleTitle}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
