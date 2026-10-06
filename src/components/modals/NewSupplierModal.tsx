import React, { useState } from 'react';
import { X, Building2, Plus, AlertCircle, Phone, Mail, MapPin } from 'lucide-react';
import { storageService } from '../../services/storage';

interface NewSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierCreated: () => void;
}

export const NewSupplierModal: React.FC<NewSupplierModalProps> = ({
  isOpen,
  onClose,
  onSupplierCreated
}) => {
  const [name, setName] = useState('');
  const [nif, setNif] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('O nome do fornecedor é obrigatório.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('O número de telefone é obrigatório.');
      return;
    }

    try {
      storageService.addSupplier({
        name: name.trim(),
        nif: nif.trim() || '5400000000',
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim() || 'Luanda, Angola',
        category: category.trim() || 'Geral'
      });

      onSupplierCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar fornecedor.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111C38] rounded-2xl border border-[#1E2D56] shadow-2xl w-full max-w-md max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        <div className="px-6 py-4 border-b border-[#1E2D56] flex items-center justify-between bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#162752] text-sky-400 border border-[#233A70]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Cadastrar Novo Fornecedor</h2>
              <p className="text-xs text-slate-400">Fornecimento de embalagens, tampas e insumos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#162752] rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-200 block mb-1">Nome / Empresa: *</label>
            <input
              type="text"
              placeholder="Ex: Embalagens Plásticas de Luanda, Lda"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-200 block mb-1">NIF:</label>
              <input
                type="text"
                placeholder="Ex: 5418920192"
                value={nif}
                onChange={e => setNif(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-200 block mb-1">Telefone: *</label>
              <input
                type="text"
                placeholder="+244 923 000 000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-200 block mb-1">E-mail:</label>
              <input
                type="email"
                placeholder="contacto@fornecedor.co.ao"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-200 block mb-1">Categoria de Suprimento:</label>
              <input
                type="text"
                placeholder="Ex: Garrafões, Tampas, Rótulos"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-200 block mb-1">Endereço:</label>
            <input
              type="text"
              placeholder="Viana, Pólo Industrial, Luanda"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full p-2.5 bg-[#0B132B] border border-[#1E2D56] rounded-xl text-xs text-white"
            />
          </div>

          <div className="pt-3 border-t border-[#1E2D56] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Salvar Fornecedor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
