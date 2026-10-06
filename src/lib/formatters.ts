export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0
  }).format(amount).replace('AOA', 'Kz');
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
}

export function getCustomerStatusLabel(status: string): string {
  const map: Record<string, string> = {
    lead: 'Lead',
    contactado: 'Contactado',
    qualificado: 'Qualificado',
    proposta_enviada: 'Proposta Enviada',
    negociacao: 'Negociação',
    cliente: 'Cliente Ativo',
    cliente_recorrente: 'Cliente Recorrente',
    cliente_inativo: 'Cliente Inativo',
    perdido: 'Perdido',
    novo: 'Novo Cliente',
    primeiro_pedido: 'Primeiro Pedido'
  };
  return map[status] || status;
}

export function getCustomerStatusBadgeClass(status: string): string {
  switch (status) {
    case 'cliente_recorrente':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'cliente':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'primeiro_pedido':
    case 'novo':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'negociacao':
    case 'proposta_enviada':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'qualificado':
    case 'contactado':
    case 'lead':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'cliente_inativo':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'perdido':
      return 'bg-slate-100 text-slate-500 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getOrderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    rascunho: 'Rascunho',
    confirmado: 'Confirmado',
    em_preparacao: 'Em Preparação',
    em_entrega: 'Em Entrega',
    entregue: 'Entregue',
    cancelado: 'Cancelado'
  };
  return map[status] || status;
}

export function getOrderStatusBadgeClass(status: string): string {
  switch (status) {
    case 'entregue':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'em_entrega':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'em_preparacao':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'confirmado':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'rascunho':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'cancelado':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getPaymentMethodLabel(method: string): string {
  const map: Record<string, string> = {
    dinheiro: 'Dinheiro à Vista',
    tpa: 'TPA / Multicaixa',
    transferencia: 'Transferência Bancária',
    multicaixa_express: 'Multicaixa Express',
    a_prazo: 'A Prazo (Conta a Receber)'
  };
  return map[method] || method;
}
