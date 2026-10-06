import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Search,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Lock,
  UserCheck,
  X
} from 'lucide-react';
import { SystemUser, UserRole } from '../types';
import { storageService } from '../services/storage';

interface AdminEmployeesViewProps {
  currentUser: SystemUser;
}

export const AdminEmployeesView: React.FC<AdminEmployeesViewProps> = ({
  currentUser
}) => {
  const [users, setUsers] = useState<SystemUser[]>(storageService.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Form State - ALL FIELDS EMPTY WITHOUT PRE-DETERMINED VALUES
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('');
  const [roleTitle, setRoleTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Deletion Modal State
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refreshUsers = () => {
    setUsers(storageService.getUsers());
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Por favor, informe o nome completo do funcionário.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Por favor, informe o e-mail do funcionário.');
      return;
    }

    if (!role) {
      setErrorMsg('Selecione o perfil de acesso no sistema para o funcionário.');
      return;
    }

    if (!roleTitle.trim()) {
      setErrorMsg('Por favor, informe o cargo ou título da função.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A palavra-passe inicial deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      const newUser = await storageService.addUser({
        password,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role as UserRole,
        roleTitle: roleTitle.trim(),
        phone: phone.trim() || undefined,
        department: department.trim() || undefined
      });

      // Clear form
      setName('');
      setEmail('');
      setRole('');
      setRoleTitle('');
      setPhone('');
      setDepartment('');
      setPassword('');
      setIsAddingUser(false);
      refreshUsers();

      setSuccessMsg(
        `Funcionário "${newUser.name}" cadastrado com sucesso! Perfil: ${newUser.roleTitle} (${
          newUser.role === 'admin' ? 'Acesso Administrativo' : 'Acesso Operacional - Sem acesso ao Admin'
        }).`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar funcionário.');
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setDeleteError(null);

    const result = await storageService.deleteUser(userToDelete.id);
    if (!result.success) {
      setDeleteError(result.error || 'Erro ao eliminar funcionário.');
      return;
    }

    setSuccessMsg(`Funcionário "${userToDelete.name}" foi removido do sistema com sucesso.`);
    setUserToDelete(null);
    refreshUsers();
  };

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.roleTitle.toLowerCase().includes(term) ||
      (u.department && u.department.toLowerCase().includes(term))
    );
  });

  const totalEmployees = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const operationalCount = users.filter(u => u.role !== 'admin').length;

  return (
    <div className="space-y-6 pb-12 text-slate-100 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-[#111C38] p-5 sm:p-6 rounded-2xl border border-[#1E2D56] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Gestão de Funcionários & Controlo de Acesso
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Acesso Restrito ao Admin
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Crie e elimine contas de funcionários da Vidaline. Os funcionários com perfis operacionais
              (Comercial, Financeiro, Armazém ou Gestor) <strong>não têm acesso nem visualizam</strong> esta
              aba de Administração no menu.
            </p>
          </div>
        </div>

        <button
          id="btn-adicionar-funcionario"
          onClick={() => {
            setIsAddingUser(!isAddingUser);
            setErrorMsg(null);
          }}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-lg shrink-0 ${
            isAddingUser
              ? 'bg-[#162752] text-slate-300 border border-[#233A70] hover:bg-[#1E3672]'
              : 'bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sky-900/30'
          }`}
        >
          {isAddingUser ? (
            <>
              <X className="w-4 h-4" />
              <span>Fechar Formulário</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>+ Novo Funcionário</span>
            </>
          )}
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#162752] text-sky-400 border border-[#233A70]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Total de Colaboradores</span>
            <span className="text-xl font-black text-white">{totalEmployees}</span>
          </div>
        </div>

        <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Administradores (Acesso Total)</span>
            <span className="text-xl font-black text-amber-400">{adminCount}</span>
          </div>
        </div>

        <div className="bg-[#111C38] p-4 rounded-xl border border-[#1E2D56] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Operacionais (Sem Acesso Admin)</span>
            <span className="text-xl font-black text-cyan-300">{operationalCount}</span>
          </div>
        </div>
      </div>

      {/* Form: Cadastrar Novo Funcionário (Completely clean inputs without preset values) */}
      {isAddingUser && (
        <div className="bg-[#111C38] rounded-2xl border border-cyan-500/40 shadow-2xl p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-98 duration-150">
          <div className="border-b border-[#1E2D56] pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-extrabold">Formulário de Cadastro de Funcionário</h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Todos os campos podem ser preenchidos livremente
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome Completo */}
              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Nome Completo do Funcionário: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Digite o nome completo..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>

              {/* Email */}
              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  E-mail Corporativo: *
                </label>
                <input
                  type="email"
                  required
                  placeholder="exemplo@vidaline.co.ao..."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Perfil de Acesso (Role) */}
              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Perfil de Acesso no Sistema: *
                </label>
                <select
                  required
                  value={role}
                  onChange={e => {
                    const selectedRole = e.target.value;
                    setRole(selectedRole);
                    // Provide automatic roleTitle suggestion only if empty
                    if (!roleTitle) {
                      if (selectedRole === 'comercial') setRoleTitle('Operador Comercial & Vendas');
                      else if (selectedRole === 'financeiro') setRoleTitle('Técnico de Contabilidade & Caixa');
                      else if (selectedRole === 'estoque') setRoleTitle('Operador de Armazém & Logística');
                      else if (selectedRole === 'gestor') setRoleTitle('Gestor de Operações');
                      else if (selectedRole === 'admin') setRoleTitle('Administrador do Sistema');
                    }
                  }}
                  className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-medium text-white focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">-- Selecione o Perfil de Acesso --</option>
                  <option value="comercial">Comercial & Vendas (Sem acesso ao Admin)</option>
                  <option value="financeiro">Financeiro & Tesouraria (Sem acesso ao Admin)</option>
                  <option value="estoque">Armazém & Vasilhames (Sem acesso ao Admin)</option>
                  <option value="gestor">Gestão Geral & Operações (Sem acesso ao Admin)</option>
                  <option value="admin">Administrador Geral (Acesso Completo ao Admin)</option>
                </select>
              </div>

              {/* Cargo / Título */}
              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Cargo / Título da Função: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Motorista de Distribuição / Faturista / Operador..."
                  value={roleTitle}
                  onChange={e => setRoleTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Palavra-passe */}
              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Palavra-passe inicial: *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Telefone / WhatsApp:
                </label>
                <input
                  type="text"
                  placeholder="Ex: 923 000 000..."
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>

              {/* Departamento */}
              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Departamento / Setor de Trabalho:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Distribuição, Envasamento, Vendas, Escritório..."
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>
            </div>

            {/* Informative Security Box */}
            <div className="p-3 rounded-xl bg-[#0B132B] border border-[#1E2D56] flex items-start gap-2.5 text-[11px] text-slate-400">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Regra de Isolamento de Acessos:</strong>
                Se você cadastrar o funcionário com o perfil <strong>Comercial, Financeiro, Armazém ou Gestor</strong>,
                ele terá permissões apenas para operar os módulos do seu setor. O menu de <strong>Funcionários & Admin</strong>
                ficará totalmente invisível e bloqueado para ele.
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E2D56]">
              <button
                type="button"
                onClick={() => {
                  setIsAddingUser(false);
                  setErrorMsg(null);
                }}
                className="px-4 py-2 font-semibold text-slate-300 bg-[#162752] border border-[#233B78] hover:bg-[#1E3672] rounded-xl cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl transition-all cursor-pointer shadow-md shadow-sky-900/40"
              >
                Cadastrar Funcionário
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employee List Section */}
      <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#1E2D56] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B132B]/50">
          <div>
            <h3 className="font-extrabold text-base text-white">Quadro de Funcionários Vidaline</h3>
            <p className="text-xs text-slate-400">Gestão de identidades ativas e privilégios no sistema</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar funcionário..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Table of Employees */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1E2D56] bg-[#0B132B] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Colaborador</th>
                <th className="p-3.5">Cargo / Título</th>
                <th className="p-3.5">Setor / Contacto</th>
                <th className="p-3.5 text-center">Nível de Acesso</th>
                <th className="p-3.5 text-center">Permissão Admin</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D56]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Nenhum colaborador encontrado com os termos pesquisados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isCurrent = user.id === currentUser.id;
                  const isAdmin = user.role === 'admin';
                  const initials = user.name
                    .split(' ')
                    .filter(Boolean)
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-[#16244A]/50 transition-colors ${
                        isCurrent ? 'bg-[#12224A]/40' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                              isAdmin
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-[#1E3672] text-cyan-300 border-cyan-500/30'
                            }`}
                          >
                            {initials || 'FU'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-xs">{user.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-700 text-[9px] font-bold">
                                  Você (Ativo)
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cargo / Título */}
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-200 block">{user.roleTitle}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          ID: {user.id}
                        </span>
                      </td>

                      {/* Departamento & Telefone */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          {user.department && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {user.department}
                            </span>
                          )}
                          {user.phone && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {user.phone}
                            </span>
                          )}
                          {!user.department && !user.phone && (
                            <span className="text-slate-500 text-[11px] italic">Não informado</span>
                          )}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            isAdmin
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : user.role === 'comercial'
                              ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                              : user.role === 'financeiro'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : user.role === 'estoque'
                              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                              : 'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Admin Access Status */}
                      <td className="p-3.5 text-center">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-700/50 text-[10px] font-semibold">
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                            Acesso Total
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-medium">
                            <Lock className="w-3 h-3 text-slate-500" />
                            Sem Acesso Admin
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Delete Button */}
                          <button
                            type="button"
                            disabled={isCurrent}
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteError(null);
                            }}
                            title={
                              isCurrent
                                ? 'Não pode eliminar a sua própria conta ativa'
                                : `Eliminar funcionário ${user.name}`
                            }
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed text-slate-500 border-slate-700'
                                : 'text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 border-rose-800/40'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#111C38] rounded-2xl border border-rose-800/60 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100">
            <div className="px-6 py-4 border-b border-[#1E2D56] flex items-center justify-between bg-[#0B132B]">
              <div className="flex items-center gap-3 text-rose-400 font-extrabold">
                <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <span>Eliminar Funcionário</span>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#162752] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <p className="text-slate-300">
                Tem certeza que deseja eliminar o seguinte funcionário do sistema?
              </p>

              <div className="p-3.5 bg-[#0B132B] rounded-xl border border-[#1E2D56] space-y-1">
                <p className="font-extrabold text-white text-sm">{userToDelete.name}</p>
                <p className="text-slate-400">{userToDelete.roleTitle} ({userToDelete.email})</p>
                <p className="text-cyan-400 font-mono text-[11px]">Perfil: {userToDelete.role}</p>
              </div>

              <p className="text-[11px] text-rose-300/80">
                Atenção: Esta ação removerá imediatamente o acesso do colaborador ao sistema. Os registros e pedidos criados por ele permanecerão salvos no histórico com seu identificador para auditoria.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E2D56]">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 font-semibold text-slate-300 bg-[#162752] border border-[#233B78] hover:bg-[#1E3672] rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all cursor-pointer shadow-md shadow-rose-950"
                >
                  Confirmar Eliminação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
