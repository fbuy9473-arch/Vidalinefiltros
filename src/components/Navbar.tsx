import React from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  Calendar,
  Menu,
  ChevronDown,
  LogOut,
  KeyRound
} from 'lucide-react';
import { SystemUser } from '../types';
import { VidalineLogo } from './VidalineLogo';

interface NavbarProps {
  currentUser: SystemUser;
  onLogout: () => void;
  onChangePassword: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenNewSale: () => void;
  unreadNotificationsCount: number;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onChangePassword,
  onOpenSearch,
  onOpenNotifications,
  onOpenNewSale,
  unreadNotificationsCount,
  onToggleSidebar
}) => {
  return (
    <header className="h-18 bg-[#0B132B] border-b border-[#1A2649] sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between gap-2">
      {/* Left: Brand Logo & Hamburger */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile / Desktop Toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
          title="Menu"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo */}
        <span className="hidden sm:block"><VidalineLogo size="md" /></span>
        <span className="sm:hidden"><VidalineLogo size="sm" variant="icon-only" /></span>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-xl mx-4 lg:mx-8 hidden md:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-400 bg-[#121D3A] hover:bg-[#162447] rounded-xl border border-[#1E2D54] transition-all cursor-pointer group shadow-inner"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <span className="text-slate-400">Pesquisar clientes, pedidos, produtos...</span>
          </div>
          <kbd className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-[#0B132B] border border-[#233560] rounded-md">
            CTRL + K
          </kbd>
        </button>
      </div>

      {/* Right Side: Date Selector, Notifications, + Nova Venda, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
        {/* Mobile search button */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 text-slate-300 hover:bg-slate-800 rounded-xl"
          title="Pesquisar"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Date Selector Dropdown Button */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-[#121D3A] border border-[#1E2D54] rounded-xl cursor-pointer hover:bg-[#17254A] transition-colors">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Hoje, {new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </div>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
          title="Notificações e Alertas"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-[#0B132B]">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Primary Action Button: + Nova Venda */}
        <button
          id="btn-nova-venda-header"
          onClick={onOpenNewSale}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] active:scale-98 rounded-xl shadow-lg shadow-sky-900/30 transition-all cursor-pointer"
          aria-label="Nova venda"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Nova Venda</span>
        </button>

        {/* Profile Avatar / RBAC Switcher */}
        <div className="relative group">
          <button type="button" aria-label="Perfil" className="flex items-center gap-2 cursor-pointer p-0.5 rounded-full hover:ring-2 hover:ring-cyan-500/50 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center text-xs font-black shadow-md border-2 border-sky-400/40">
              {currentUser.name
                .split(' ')
                .filter(Boolean)
                .map(n => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'US'}
            </div>
          </button>

          {/* Profile dropdown (opens on hover, or on tap/focus for touch devices) */}
          <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-[#111C38] border border-[#1E2D56] rounded-xl shadow-2xl p-2 hidden group-hover:block group-focus-within:block z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-700/60 mb-1">
              <p className="text-xs font-bold text-white">{currentUser.name}</p>
              <p className="text-[10px] text-cyan-400 font-medium capitalize">{currentUser.roleTitle}</p>
              {currentUser.role === 'admin' ? (
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Administrador (Acesso Total)
                </span>
              ) : (
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  Operador (Sem Acesso Admin)
                </span>
              )}
            </div>
            <button
              onClick={onChangePassword}
              className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs text-slate-300 hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              Alterar palavra-passe
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs text-rose-300 hover:bg-rose-950/50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Terminar sessão
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
