import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { storageService } from '../services/storage';
import { formatDate } from '../lib/formatters';

export const AuditLogsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const logs = storageService.getAuditLogs();

  const filteredLogs = logs.filter(l =>
    l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.entity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111C38] p-5 rounded-2xl border border-[#1E2D56] shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Logs de Auditoria & Conformidade
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              Imutabilidade Ativa
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Registro cronológico e rastreabilidade de todas as ações críticas executadas no sistema Vidaline.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por usuário, ação ou entidade..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B132B] border-b border-[#1E2D56] text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Data & Hora</th>
                <th className="p-3.5">Usuário Responsável</th>
                <th className="p-3.5">Entidade</th>
                <th className="p-3.5">Ação Executada</th>
                <th className="p-3.5">Detalhes da Transação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A284D] text-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-[#162752] transition-colors">
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(l.timestamp).toLocaleString('pt-AO')}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-white">{l.user}</p>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{l.userRole}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#162752] text-sky-300 border border-[#233A70] font-mono font-semibold">
                        {l.entity}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-white">{l.action}</span>
                    </td>
                    <td className="p-3.5 text-slate-300 font-medium">
                      {l.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
