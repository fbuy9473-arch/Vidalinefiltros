import React, { useMemo, useState } from 'react';
import {
  Wallet,
  Landmark,
  FileText,
  CreditCard,
  AlertTriangle,
  Clock,
  UserX,
  Droplets,
  ArrowRight,
  ShoppingCart,
  UserPlus,
  ArrowDownCircle,
  PackagePlus,
  BarChart2,
  Package
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { storageService } from '../services/storage';
import { formatMoney, formatDate } from '../lib/formatters';

interface DashboardViewProps {
  onNavigateToTab: (tab: any) => void;
  onOpenNewSale: () => void;
  onOpenNewClient: () => void;
  onOpenNewPayable: () => void;
  onOpenAddStock: () => void;
  onOpenNotifications: () => void;
}

type Period = '7D' | '30D' | '3M' | '6M' | '12M';

const PERIOD_DAYS: Record<Period, number> = { '7D': 7, '30D': 30, '3M': 90, '6M': 180, '12M': 365 };
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const isoDay = (d: Date) => d.toISOString().split('T')[0];

const compactMoney = (v: number) =>
  Math.abs(v) >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : Math.abs(v) >= 1_000 ? `${Math.round(v / 1_000)}k` : String(v);

const CARD = 'bg-[#111C38] border border-[#1E2D56] rounded-2xl shadow-lg';

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="py-8 text-center text-xs text-slate-500">{children}</div>
);

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTab,
  onOpenNewSale,
  onOpenNewClient,
  onOpenNewPayable,
  onOpenAddStock
}) => {
  const [period, setPeriod] = useState<Period>('7D');

  const user = storageService.getCurrentUser();
  const orders = storageService.getOrders().filter(o => o.orderStatus !== 'cancelado');
  const customers = storageService.getCustomers();
  const products = storageService.getProducts();
  const receivables = storageService.getReceivables();
  const payables = storageService.getPayables();
  const cash = storageService.getCashTransactions();
  const audit = storageService.getAuditLogs();

  const today = isoDay(new Date());
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 19 ? 'Boa tarde' : 'Boa noite';

  // ---- KPIs
  const revenueToday = orders.filter(o => o.date === today).reduce((s, o) => s + o.total, 0);
  const ordersToday = orders.filter(o => o.date === today).length;
  const cashBalance = storageService.getCurrentCashBalance();
  const openReceivables = receivables.filter(r => r.status !== 'pago' && r.status !== 'cancelado' && r.remainingAmount > 0);
  const receivablesTotal = openReceivables.reduce((s, r) => s + r.remainingAmount, 0);
  const overdueReceivables = openReceivables.filter(r => r.dueDate < today);
  const openPayables = payables.filter(p => p.status !== 'pago' && p.status !== 'cancelado');
  const payablesTotal = openPayables.reduce((s, p) => s + p.amount, 0);
  const overduePayables = openPayables.filter(p => p.dueDate < today);

  // ---- cash flow
  const cashFlowData = useMemo(() => {
    const days = PERIOD_DAYS[period];
    const monthly = days > 31;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const buckets = new Map<string, { label: string; entradas: number; saidas: number }>();
    const cursor = new Date(start);
    while (cursor <= new Date()) {
      const key = monthly ? isoDay(cursor).slice(0, 7) : isoDay(cursor);
      if (!buckets.has(key)) {
        buckets.set(key, {
          label: monthly ? `${MONTHS[cursor.getMonth()]}/${String(cursor.getFullYear()).slice(2)}` : `${String(cursor.getDate()).padStart(2, '0')} ${MONTHS[cursor.getMonth()]}`,
          entradas: 0,
          saidas: 0
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const startIso = isoDay(start);
    let balance = 0;
    for (const t of cash) {
      if (t.date < startIso) balance += t.type === 'entrada' ? t.amount : -t.amount;
      else {
        const b = buckets.get(monthly ? t.date.slice(0, 7) : t.date);
        if (b) {
          if (t.type === 'entrada') b.entradas += t.amount;
          else b.saidas += t.amount;
        }
      }
    }
    return [...buckets.values()].map(b => {
      balance += b.entradas - b.saidas;
      return { ...b, saldo: balance };
    });
  }, [cash, period]);

  const periodIn = cashFlowData.reduce((s, b) => s + b.entradas, 0);
  const periodOut = cashFlowData.reduce((s, b) => s + b.saidas, 0);

  // ---- commercial performance (current month)
  const monthPrefix = today.slice(0, 7);
  const monthOrders = orders.filter(o => o.date.startsWith(monthPrefix));
  const b2bTotal = monthOrders.filter(o => o.customerType === 'B2B').reduce((s, o) => s + o.total, 0);
  const b2cTotal = monthOrders.filter(o => o.customerType === 'B2C').reduce((s, o) => s + o.total, 0);
  const weekBuckets = [
    { period: '1-7', b2b: 0, b2c: 0 },
    { period: '8-14', b2b: 0, b2c: 0 },
    { period: '15-21', b2b: 0, b2c: 0 },
    { period: '22+', b2b: 0, b2c: 0 }
  ];
  for (const o of monthOrders) {
    const day = Number(o.date.slice(8, 10));
    const w = weekBuckets[day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3];
    if (o.customerType === 'B2B') w.b2b += o.total;
    else w.b2c += o.total;
  }

  // ---- rankings
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; units: number; total: number }>();
    for (const o of orders) {
      for (const it of o.items) {
        const cur = map.get(it.productId) ?? { name: it.productName, units: 0, total: 0 };
        cur.units += it.quantity;
        cur.total += it.subtotal;
        map.set(it.productId, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  }, [orders]);

  const topClients = [...customers].filter(c => c.totalPurchased > 0).sort((a, b) => b.totalPurchased - a.totalPurchased).slice(0, 5);

  // ---- attention items
  const lowStock = products.filter(p => !p.isService && p.currentStock <= p.minStock);
  const inactiveClients = customers.filter(c => {
    if (c.status === 'cliente_inativo') return true;
    if (!c.lastPurchaseDate) return false;
    return (Date.now() - new Date(c.lastPurchaseDate).getTime()) / 86_400_000 > 30;
  });
  const bottlesOut = customers.reduce((s, c) => s + c.bottlesInPossession, 0);

  const attention = [
    { show: lowStock.length > 0, icon: AlertTriangle, tone: 'text-rose-400 bg-rose-950/50', title: 'Estoque abaixo do mínimo', sub: `${lowStock.length} item(ns)`, tab: 'estoque' },
    { show: overdueReceivables.length > 0, icon: Clock, tone: 'text-amber-400 bg-amber-950/40', title: 'Contas a receber em atraso', sub: `${overdueReceivables.length} · ${formatMoney(overdueReceivables.reduce((s, r) => s + r.remainingAmount, 0))}`, tab: 'financeiro' },
    { show: overduePayables.length > 0, icon: CreditCard, tone: 'text-orange-400 bg-orange-950/40', title: 'Contas a pagar em atraso', sub: `${overduePayables.length} · ${formatMoney(overduePayables.reduce((s, p) => s + p.amount, 0))}`, tab: 'financeiro' },
    { show: inactiveClients.length > 0, icon: UserX, tone: 'text-sky-400 bg-sky-950/40', title: 'Clientes inativos (+30 dias)', sub: `${inactiveClients.length} cliente(s)`, tab: 'crm' },
    { show: bottlesOut > 0, icon: Droplets, tone: 'text-cyan-400 bg-cyan-950/40', title: 'Vasilhames em posse de clientes', sub: `${bottlesOut} unidade(s)`, tab: 'estoque' }
  ].filter(a => a.show);

  const quickActions = [
    { label: 'Nova venda', icon: ShoppingCart, onClick: onOpenNewSale },
    { label: 'Novo cliente', icon: UserPlus, onClick: onOpenNewClient },
    { label: 'Receber pagamento', icon: ArrowDownCircle, onClick: () => onNavigateToTab('financeiro') },
    { label: 'Nova despesa', icon: CreditCard, onClick: onOpenNewPayable },
    { label: 'Entrada de estoque', icon: PackagePlus, onClick: onOpenAddStock },
    { label: 'Relatórios', icon: BarChart2, onClick: () => onNavigateToTab('relatorios') }
  ];

  const kpis = [
    { label: 'Receita do dia', value: formatMoney(revenueToday), sub: `${ordersToday} pedido(s) hoje`, icon: Wallet, tab: 'vendas' },
    { label: 'Saldo de caixa', value: formatMoney(cashBalance), sub: 'Entradas − saídas', icon: Landmark, tab: 'financeiro' },
    { label: 'A receber', value: formatMoney(receivablesTotal), sub: overdueReceivables.length ? `${overdueReceivables.length} em atraso` : `${openReceivables.length} em aberto`, icon: FileText, tab: 'financeiro' },
    { label: 'A pagar', value: formatMoney(payablesTotal), sub: overduePayables.length ? `${overduePayables.length} em atraso` : `${openPayables.length} em aberto`, icon: CreditCard, tab: 'financeiro' }
  ];

  const tooltipStyle = { background: '#0B132B', border: '1px solid #1E2D56', borderRadius: 12, fontSize: 12 };
  const hasCash = cash.length > 0;
  const hasMonthSales = monthOrders.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6 text-slate-100 min-w-0">
      {/* Greeting */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight break-words">
            {greeting}, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Aqui está o desempenho da empresa hoje.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* MAIN COLUMN */}
        <div className="xl:col-span-8 2xl:col-span-9 space-y-4 sm:space-y-6 min-w-0">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {kpis.map(k => (
              <button
                key={k.label}
                onClick={() => onNavigateToTab(k.tab)}
                className={`${CARD} p-3.5 sm:p-5 text-left hover:border-sky-600/60 transition-colors cursor-pointer min-w-0`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] sm:text-xs text-slate-400 font-medium">{k.label}</span>
                    <h3 className="text-base sm:text-2xl font-bold text-white mt-1 tracking-tight truncate">{k.value}</h3>
                  </div>
                  <div className="hidden sm:flex w-10 h-10 shrink-0 rounded-xl bg-[#162752] border border-[#233870] items-center justify-center text-sky-400">
                    <k.icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-2 truncate">{k.sub}</p>
              </button>
            ))}
          </div>

          {/* Cash flow */}
          <div className={`${CARD} p-4 sm:p-5`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-white">Fluxo de caixa</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Entradas <span className="text-emerald-400 font-semibold">{formatMoney(periodIn)}</span> · Saídas{' '}
                  <span className="text-rose-400 font-semibold">{formatMoney(periodOut)}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-1 bg-[#0B132B] p-1 rounded-xl border border-[#1E2D56] self-start">
                {(Object.keys(PERIOD_DAYS) as Period[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${period === p ? 'bg-[#0284C7] text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {hasCash ? (
              <div className="h-56 sm:h-72 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cashFlowData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#1A284D" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={16} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={compactMoney} width={40} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#34D399" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="saidas" name="Saídas" stroke="#FB7185" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#38BDF8" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty>Ainda não há movimentos de caixa. Registe vendas e despesas para ver o fluxo aqui.</Empty>
            )}
          </div>

          {/* Performance + rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className={`${CARD} p-4 sm:p-5 min-w-0`}>
              <h2 className="text-base font-bold text-white">Desempenho comercial</h2>
              <p className="text-xs text-slate-400 mt-0.5 mb-3">Mês atual</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl bg-[#0B132B] border border-[#1E2D56] p-3 min-w-0">
                  <p className="text-[11px] text-sky-400 font-bold">B2B</p>
                  <p className="text-sm font-bold text-white truncate">{formatMoney(b2bTotal)}</p>
                </div>
                <div className="rounded-xl bg-[#0B132B] border border-[#1E2D56] p-3 min-w-0">
                  <p className="text-[11px] text-purple-400 font-bold">B2C</p>
                  <p className="text-sm font-bold text-white truncate">{formatMoney(b2cTotal)}</p>
                </div>
              </div>
              {hasMonthSales ? (
                <div className="h-40 -ml-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekBuckets} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <XAxis dataKey="period" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={compactMoney} width={36} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} cursor={{ fill: '#162752' }} />
                      <Bar dataKey="b2b" name="B2B" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="b2c" name="B2C" fill="#A78BFA" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty>Sem vendas neste mês.</Empty>
              )}
            </div>

            <div className={`${CARD} p-4 sm:p-5 min-w-0`}>
              <h2 className="text-base font-bold text-white mb-3">Mais vendidos</h2>
              {topProducts.length === 0 ? (
                <Empty>Cadastre produtos e registe vendas.</Empty>
              ) : (
                <ul className="space-y-3">
                  {topProducts.map((p, i) => (
                    <li key={p.name + i} className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 shrink-0 rounded-lg bg-[#162752] text-sky-300 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-400">{p.units} vendido(s)</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 shrink-0">{formatMoney(p.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`${CARD} p-4 sm:p-5 min-w-0`}>
              <h2 className="text-base font-bold text-white mb-3">Maiores clientes</h2>
              {topClients.length === 0 ? (
                <Empty>Os clientes com compras aparecem aqui.</Empty>
              ) : (
                <ul className="space-y-3">
                  {topClients.map(c => (
                    <li key={c.id} className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-700 text-white text-[11px] font-bold flex items-center justify-center">
                        {c.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{c.name}</p>
                        <p className="text-[11px] text-slate-400">{c.type} · {c.totalOrders} pedido(s)</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 shrink-0">{formatMoney(c.totalPurchased)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* SIDE COLUMN */}
        <div className="xl:col-span-4 2xl:col-span-3 space-y-4 sm:space-y-6 min-w-0">
          <div className={`${CARD} p-4 sm:p-5`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">Requer atenção</h2>
              {attention.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold">{attention.length}</span>
              )}
            </div>
            {attention.length === 0 ? (
              <Empty>Tudo em ordem por agora.</Empty>
            ) : (
              <ul className="space-y-2">
                {attention.map(a => (
                  <li key={a.title}>
                    <button
                      onClick={() => onNavigateToTab(a.tab)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#162752] text-left cursor-pointer transition-colors"
                    >
                      <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${a.tone}`}>
                        <a.icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-white truncate">{a.title}</span>
                        <span className="block text-[11px] text-slate-400 truncate">{a.sub}</span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`${CARD} p-4 sm:p-5`}>
            <h2 className="text-base font-bold text-white mb-3">Ações rápidas</h2>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map(q => (
                <button
                  key={q.label}
                  onClick={q.onClick}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#0B132B] border border-[#1E2D56] hover:border-sky-600/60 hover:bg-[#162752] text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <q.icon className="w-5 h-5 text-sky-400" />
                  <span className="text-[10px] sm:text-[11px] font-semibold text-center leading-tight">{q.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`${CARD} p-4 sm:p-5`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">Atividade recente</h2>
              <button onClick={() => onNavigateToTab('auditoria')} className="text-xs text-sky-400 hover:text-sky-300 cursor-pointer">Ver tudo</button>
            </div>
            {audit.length === 0 ? (
              <Empty>Sem atividade registada.</Empty>
            ) : (
              <ul className="space-y-3">
                {audit.slice(0, 6).map(l => (
                  <li key={l.id} className="flex items-start gap-3 min-w-0">
                    <span className="w-8 h-8 shrink-0 rounded-lg bg-[#162752] text-sky-400 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{l.action}</p>
                      <p className="text-[11px] text-slate-400 break-words">{l.details}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{l.user} · {formatDate(l.timestamp.split(' ')[0])}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
