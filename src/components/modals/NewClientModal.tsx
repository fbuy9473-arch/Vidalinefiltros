import React, { useState } from 'react';
import {
  X,
  Building2,
  User,
  Phone,
  MessageSquare,
  MapPin,
  CreditCard,
  Droplets,
  AlertCircle
} from 'lucide-react';
import { CustomerType, CustomerStatus } from '../../types';
import { storageService } from '../../services/storage';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: CustomerType;
  defaultStatus?: CustomerStatus;
  onClientCreated: () => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'B2B',
  defaultStatus,
  onClientCreated
}) => {
  const [type, setType] = useState<CustomerType>(defaultType);
  const [status, setStatus] = useState<CustomerStatus>(defaultStatus || (defaultType === 'B2B' ? 'lead' : 'cliente'));
  const [name, setName] = useState('');
  const [nif, setNif] = useState('');
  const [sector, setSector] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<number | string>('');
  const [paymentTerm, setPaymentTerm] = useState('');
  const [initialBottles, setInitialBottles] = useState<number | string>('');
  const [commercialRep, setCommercialRep] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('O nome do lead ou empresa é obrigatório.');
      return;
    }

    const currentUserName = storageService.getCurrentUser().name;
    const bottlesNum = Number(initialBottles) || 0;
    const creditNum = Number(creditLimit) || 0;

    try {
      const newCust = storageService.addCustomer({
        type,
        name: name.trim(),
        nif: type === 'B2B' ? (nif.trim() || undefined) : undefined,
        sector: type === 'B2B' ? (sector || undefined) : undefined,
        contactPerson: type === 'B2B' ? (contactPerson.trim() || undefined) : undefined,
        phone: phone.trim() || '+244 9xx xxx xxx',
        whatsapp: whatsapp.trim() || phone.trim() || '+244 9xx xxx xxx',
        email: email.trim() || '',
        address: address.trim() || (neighborhood ? `${neighborhood}, Luanda` : 'Luanda'),
        city: 'Luanda',
        neighborhood: neighborhood || 'Luanda',
        status: status || 'cliente',
        commercialRep: commercialRep.trim() || currentUserName || 'Representante Comercial',
        creditLimit: type === 'B2B' ? creditNum : 0,
        paymentTerm: (type === 'B2B' && paymentTerm ? paymentTerm : 'a_vista') as any
      });

      if (bottlesNum > 0) {
        storageService.updateCustomer(newCust.id, {
          bottlesInPossession: bottlesNum,
          bottlesDelivered: bottlesNum
        });
      }

      onClientCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E2D56] flex items-center justify-between bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#162752] text-cyan-400 border border-[#233A70]">
              {type === 'B2B' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Cadastrar Novo {status.startsWith('cliente') ? 'Cliente' : 'Lead'} {type === 'B2B' ? 'Corporativo (B2B)' : 'Residencial (B2C)'}
              </h2>
              <p className="text-xs text-slate-400">Adicionar registro comercial ao sistema Vidaline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#162752] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type & Status Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Tipo de Cliente:</label>
              <div className="flex items-center p-1 bg-[#0B132B] rounded-xl border border-[#1E2D56]">
                <button
                  type="button"
                  onClick={() => setType('B2B')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    type === 'B2B'
                      ? 'bg-[#0284C7] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  B2B (Empresa)
                </button>
                <button
                  type="button"
                  onClick={() => setType('B2C')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    type === 'B2C'
                      ? 'bg-[#0284C7] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  B2C (Residencial)
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Estágio / Status Comercial:</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as CustomerStatus)}
                className="w-full p-2 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-medium text-white cursor-pointer"
              >
                <option value="lead">Lead Inicial (Prospecção)</option>
                <option value="contactado">Lead Contactado</option>
                <option value="qualificado">Lead Qualificado</option>
                <option value="proposta_enviada">Proposta Enviada</option>
                <option value="negociacao">Em Negociação</option>
                <option value="cliente">Cliente Ativo</option>
                <option value="cliente_recorrente">Cliente Recorrente</option>
                <option value="cliente_inativo">Inativo</option>
              </select>
            </div>
          </div>

          {/* Name & NIF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-200 block mb-1">
                {type === 'B2B' ? 'Razão Social / Nome da Empresa:' : 'Nome Completo:'} *
              </label>
              <input
                type="text"
                required
                placeholder={type === 'B2B' ? 'Ex: Hotel Presidente Luanda' : 'Ex: Dra. Ana Luísa Sousa'}
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {type === 'B2B' && (
              <div>
                <label className="font-bold text-slate-200 block mb-1">NIF (Identificação Fiscal):</label>
                <input
                  type="text"
                  placeholder="Ex: 5410982312"
                  value={nif}
                  onChange={e => setNif(e.target.value)}
                  className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>
            )}

            {type === 'B2B' && (
              <div>
                <label className="font-bold text-slate-200 block mb-1">Setor de Atividade:</label>
                <select
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-medium text-white"
                >
                  <option value="">-- Selecione o Setor de Atividade --</option>
                  <option value="Restaurante">Restaurante & Gastronomia</option>
                  <option value="Hotelaria">Hotelaria & Turismo</option>
                  <option value="Clínica">Clínica & Hospitalar</option>
                  <option value="Escritório">Escritório & Corporativo</option>
                  <option value="Escola">Escola & Universidade</option>
                  <option value="Ginásio">Ginásio & Fitness</option>
                  <option value="Construção">Construção & Engenharia</option>
                  <option value="Comércio">Comércio Geral</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            )}

            {type === 'B2B' && (
              <div>
                <label className="font-bold text-slate-200 block mb-1">Pessoa de Contacto:</label>
                <input
                  type="text"
                  placeholder="Ex: Sr. Manuel (Compras)"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500"
                />
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-200 block mb-1">Telefone Principal: *</label>
              <input
                type="text"
                placeholder="Ex: 923 000 000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-medium text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-200 block mb-1">WhatsApp (p/ Pedidos e Cobrança):</label>
              <input
                type="text"
                placeholder="Ex: 923 000 000"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-medium text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-200 block mb-1">Bairro / Município:</label>
              <select
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-medium text-white"
              >
                <option value="">-- Selecione o Bairro / Município --</option>
                <option value="Talatona">Talatona</option>
                <option value="Maianga">Maianga</option>
                <option value="Miramar">Miramar</option>
                <option value="Alvalade">Alvalade</option>
                <option value="Ingombota">Ingombota</option>
                <option value="Viana">Viana</option>
                <option value="Kilamba">Centralidade do Kilamba</option>
                <option value="Benfica">Benfica</option>
                <option value="Camama">Camama</option>
                <option value="Cazenga">Cazenga</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-200 block mb-1">Endereço de Entrega:</label>
              <input
                type="text"
                placeholder="Rua, Edifício, Nº de Porta..."
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Financial Conditions (if B2B), Bottles & Rep */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {type === 'B2B' && (
              <div>
                <label className="font-bold text-slate-200 block mb-1">Limite de Crédito (Kz):</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  placeholder="Ex: 100000"
                  value={creditLimit}
                  onChange={e => setCreditLimit(e.target.value)}
                  className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-bold text-white placeholder:text-slate-500"
                />
              </div>
            )}

            {type === 'B2B' && (
              <div>
                <label className="font-bold text-slate-200 block mb-1">Prazo de Pagamento:</label>
                <select
                  value={paymentTerm}
                  onChange={e => setPaymentTerm(e.target.value)}
                  className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-medium text-white"
                >
                  <option value="">-- Selecione o Prazo --</option>
                  <option value="a_vista">À Vista</option>
                  <option value="7_dias">7 Dias</option>
                  <option value="15_dias">15 Dias</option>
                  <option value="30_dias">30 Dias</option>
                </select>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-200 block mb-1">Garrafões 20L Iniciais em Posse:</label>
              <input
                type="number"
                min="0"
                placeholder="0 garrafões..."
                value={initialBottles}
                onChange={e => setInitialBottles(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl font-bold text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-200 block mb-1">Representante Comercial Responsável:</label>
            <input
              type="text"
              placeholder="Digite o nome do comercial responsável..."
              value={commercialRep}
              onChange={e => setCommercialRep(e.target.value)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-white placeholder:text-slate-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#1E2D56]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-300 bg-[#162752] border border-[#233B78] hover:bg-[#1E3672] rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl transition-all cursor-pointer shadow-md shadow-sky-900/40"
            >
              {status.startsWith('cliente') ? 'Salvar Cliente' : 'Salvar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
