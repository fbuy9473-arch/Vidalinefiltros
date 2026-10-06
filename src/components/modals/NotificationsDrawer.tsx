import React from 'react';
import {
  X,
  Bell,
  AlertTriangle,
  Clock,
  Droplets,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { AppNotification } from '../../types';
import { storageService } from '../../services/storage';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  if (!isOpen) return null;

  const notifications = storageService.getNotifications();

  const handleMarkAllRead = () => {
    storageService.markAllNotificationsAsRead();
  };

  const handleClickItem = (n: AppNotification) => {
    storageService.markNotificationAsRead(n.id);
    if (n.type === 'alerta_estoque') {
      onNavigateTab('estoque');
    } else if (n.type === 'conta_vencida') {
      onNavigateTab('financeiro');
    } else if (n.type === 'cliente_inativo') {
      onNavigateTab('crm');
    } else {
      onNavigateTab('dashboard');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#111C38] w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-[#1E2D56] text-slate-100">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#1E2D56] flex items-center justify-between bg-[#0B132B]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h2 className="font-extrabold text-sm text-white">Notificações & Alertas Operacionais</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
            >
              Marcar lidas
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-60" />
              <p>Nenhuma notificação pendente.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleClickItem(n)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  n.isRead
                    ? 'bg-[#0B132B] border-[#1E2D56] opacity-60 hover:opacity-100'
                    : n.type === 'alerta_estoque'
                    ? 'bg-rose-950/40 border-rose-800/80 hover:bg-rose-950/60'
                    : n.type === 'conta_vencida'
                    ? 'bg-amber-950/40 border-amber-800/80 hover:bg-amber-950/60'
                    : 'bg-[#162752] border-cyan-800/80 hover:bg-[#1C3268]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {n.type === 'alerta_estoque' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                    {n.type === 'conta_vencida' && <Clock className="w-4 h-4 text-amber-400 shrink-0" />}
                    {n.type === 'cliente_inativo' && <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />}
                    <h4 className="font-bold text-white">{n.title}</h4>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 shadow-xs shadow-cyan-400"></span>
                  )}
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                  <span>{n.date}</span>
                  <span className="font-semibold text-cyan-400 flex items-center gap-0.5">
                    Acessar Módulo →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
