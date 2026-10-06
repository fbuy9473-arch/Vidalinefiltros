import {
  Customer,
  Product,
  Order,
  OrderStatus,
  Receivable,
  Payable,
  CashTransaction,
  InventoryMovement,
  InventoryMovementType,
  BottleAudit,
  BottleCustomerMovement,
  Supplier,
  AuditLog,
  AppNotification,
  SystemUser,
  UserRole,
  PaymentMethod
} from '../types';

import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_RECEIVABLES,
  INITIAL_PAYABLES,
  INITIAL_CASH_TRANSACTIONS,
  INITIAL_INVENTORY_MOVEMENTS,
  INITIAL_BOTTLE_AUDIT,
  INITIAL_BOTTLE_CUSTOMER_MOVEMENTS,
  INITIAL_SUPPLIERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from '../data/initialData';

import { apiRequest, ApiError, getToken, setToken, setUnauthorizedHandler } from './api';

// Keys double as the server-side collection / kv names.
const STORAGE_KEYS = {
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  RECEIVABLES: 'receivables',
  PAYABLES: 'payables',
  CASH: 'cash',
  MOVEMENTS: 'movements',
  BOTTLES: 'bottles', // single object (kv)
  BOTTLE_MOVEMENTS: 'bottle_movements',
  SUPPLIERS: 'suppliers',
  AUDIT: 'audit',
  NOTIFICATIONS: 'notifications'
};

export type SyncStatus = 'idle' | 'syncing' | 'error';

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeToStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Unique even when several records are created in the same millisecond.
function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function notifyListeners() {
  listeners.forEach(fn => fn());
}

// ---------------------------------------------------------------------------
// In-memory cache, hydrated from the server database after login. Every write
// updates the cache synchronously (so the UI stays instant) and is then pushed
// to the server as an incremental diff.
// ---------------------------------------------------------------------------
let cache: Record<string, any> = {};
let users: SystemUser[] = [];
let authUser: SystemUser | null = null;

// What the server is known to hold: id -> serialized row (+ id order) per collection.
const synced: Record<string, { rows: Map<string, string>; order: string[] }> = {};
const syncedKv: Record<string, string> = {};
const dirty = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;
let flushPromise: Promise<void> | null = null;
let syncStatus: SyncStatus = 'idle';

function setSyncStatus(s: SyncStatus) {
  if (syncStatus === s) return;
  syncStatus = s;
  notifyListeners();
}

function getStored<T>(key: string, fallback: T): T {
  const value = cache[key];
  return value === undefined ? fallback : structuredClone(value);
}

function setStored<T>(key: string, value: T): void {
  cache[key] = structuredClone(value);
  dirty.add(key);
  scheduleFlush(30);
  notifyListeners();
}

function scheduleFlush(delay: number) {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, delay);
}

// Single-flight: callers (e.g. logout) can await the in-flight sync; the loop below
// also picks up anything that became dirty while it was running.
function flush(): Promise<void> {
  flushTimer = null;
  if (flushPromise) return flushPromise;
  if (!authUser) return Promise.resolve();
  flushPromise = runFlush().finally(() => {
    flushPromise = null;
    if (dirty.size > 0 && authUser && syncStatus !== 'error') scheduleFlush(0); // changed after the last loop check
  });
  return flushPromise;
}

async function runFlush() {
  flushing = true;
  setSyncStatus('syncing');
  try {
    while (dirty.size > 0) {
      // One atomic request with every changed collection (the server checks references on commit).
      const keys = [...dirty];
      dirty.clear();

      const collections: Record<string, { upserts: any[]; deletes: string[]; order?: string[] }> = {};
      const kv: Record<string, unknown> = {};
      const nextSynced: Record<string, { rows: Map<string, string>; order: string[] }> = {};
      const nextKv: Record<string, string> = {};

      for (const key of keys) {
        const value = cache[key];
        if (!Array.isArray(value)) {
          const json = JSON.stringify(value);
          if (syncedKv[key] !== json) {
            kv[key] = value;
            nextKv[key] = json;
          }
          continue;
        }

        const prev = synced[key] ?? { rows: new Map<string, string>(), order: [] };
        const rows = new Map<string, string>();
        const upserts: any[] = [];
        for (const row of value) {
          const json = JSON.stringify(row);
          rows.set(row.id, json);
          if (prev.rows.get(row.id) !== json) upserts.push(row);
        }
        const deletes = [...prev.rows.keys()].filter(id => !rows.has(id));
        const order = value.map((r: any) => r.id as string);
        const orderChanged =
          order.length !== prev.order.length || order.some((id: string, i: number) => id !== prev.order[i]);

        if (upserts.length === 0 && deletes.length === 0 && !orderChanged) continue;
        collections[key] = { upserts, deletes, ...(orderChanged ? { order } : {}) };
        nextSynced[key] = { rows, order };
      }

      if (Object.keys(collections).length === 0 && Object.keys(kv).length === 0) continue;
      try {
        await apiRequest('PUT', '/sync', { collections, kv });
      } catch (err) {
        keys.forEach(k => dirty.add(k));
        throw err;
      }
      Object.assign(synced, nextSynced);
      Object.assign(syncedKv, nextKv);
    }
    setSyncStatus('idle');
  } catch (err) {
    console.error('Falha ao sincronizar com o servidor', err);
    setSyncStatus('error');
    if (!(err instanceof ApiError && err.status === 401)) scheduleFlush(4000);
  } finally {
    flushing = false;
  }
}

function applyServerState(data: { user: SystemUser; users: SystemUser[]; collections: Record<string, any[]>; kv: Record<string, any> }) {
  const next: Record<string, any> = {};
  for (const [name, rows] of Object.entries(data.collections)) {
    next[name] = rows;
    synced[name] = {
      rows: new Map(rows.map(r => [r.id as string, JSON.stringify(r)])),
      order: rows.map(r => r.id as string)
    };
  }
  for (const [key, value] of Object.entries(data.kv)) {
    next[key] = value;
    syncedKv[key] = JSON.stringify(value);
  }
  cache = next;
  users = data.users;
  authUser = data.user;
}

// Poll the server so changes made by other employees show up.
let pollTimer: ReturnType<typeof setInterval> | null = null;
let lastSnapshot = '';

async function refreshFromServer() {
  if (!authUser || flushing || dirty.size > 0) return;
  try {
    const data = await apiRequest('GET', '/bootstrap');
    if (flushing || dirty.size > 0) return; // local edits happened meanwhile
    const snapshot = JSON.stringify(data);
    if (snapshot === lastSnapshot) return;
    lastSnapshot = snapshot;
    applyServerState(data);
    notifyListeners();
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 401)) console.error('Falha ao atualizar dados', err);
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(refreshFromServer, 15000);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

function clearSession() {
  stopPolling();
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  setToken(null);
  authUser = null;
  users = [];
  cache = {};
  dirty.clear();
  lastSnapshot = '';
  for (const k of Object.keys(synced)) delete synced[k];
  for (const k of Object.keys(syncedKv)) delete syncedKv[k];
  syncStatus = 'idle';
  notifyListeners();
}

setUnauthorizedHandler(clearSession);

async function loadSession(): Promise<SystemUser> {
  const data = await apiRequest('GET', '/bootstrap');
  lastSnapshot = JSON.stringify(data);
  applyServerState(data);
  startPolling();
  notifyListeners();
  return data.user;
}

export const storageService = {
  subscribeToStore(listener: Listener) {
    return subscribeToStore(listener);
  },

  // AUTH
  async login(email: string, password: string): Promise<SystemUser> {
    const { token } = await apiRequest<{ token: string; user: SystemUser }>('POST', '/auth/login', { email, password });
    setToken(token);
    try {
      return await loadSession();
    } catch (err) {
      clearSession();
      throw err;
    }
  },

  /** Resumes a stored session. Returns null when there is none (or it expired). */
  async restoreSession(): Promise<SystemUser | null> {
    if (!getToken()) return null;
    try {
      return await loadSession();
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) throw err; // server offline: keep the token
      clearSession();
      return null;
    }
  },

  async logout() {
    try {
      await flush();
      await apiRequest('POST', '/auth/logout');
    } catch {
      /* ignore - the local session is discarded either way */
    }
    clearSession();
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiRequest('POST', '/auth/change-password', { currentPassword, newPassword });
  },

  isAuthenticated(): boolean {
    return authUser !== null;
  },

  getSyncStatus(): SyncStatus {
    return syncStatus;
  },

  retrySync() {
    scheduleFlush(0);
  },

  getCurrentUser(): SystemUser {
    return authUser ?? { id: '', name: 'Sem sessão', email: '', role: 'comercial', roleTitle: '' };
  },

  getUsers(): SystemUser[] {
    return users;
  },

  async addUser(user: Omit<SystemUser, 'id'> & { password: string }): Promise<SystemUser> {
    const { user: created } = await apiRequest<{ user: SystemUser }>('POST', '/users', user);
    users = [...users, created];
    notifyListeners();
    this.addAuditLog(
      'Criação de Funcionário',
      'users',
      created.id,
      `Cadastrado funcionário ${created.name} (${created.roleTitle || created.role}) - Perfil: ${created.role}`
    );
    return created;
  },

  async deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    const userToDelete = users.find(u => u.id === id);
    try {
      await apiRequest('DELETE', `/users/${id}`);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro ao eliminar funcionário.' };
    }
    users = users.filter(u => u.id !== id);
    notifyListeners();
    this.addAuditLog(
      'Eliminação de Funcionário',
      'users',
      id,
      `Eliminado funcionário ${userToDelete?.name ?? id} (${userToDelete?.roleTitle ?? ''}) do quadro da empresa`
    );
    return { success: true };
  },

  // CUSTOMERS
  getCustomers(): Customer[] {
    return getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },

  addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'totalPurchased' | 'totalOrders' | 'averageTicket' | 'debtAmount' | 'bottlesDelivered' | 'bottlesReturned' | 'bottlesInPossession'>): Customer {
    const customers = this.getCustomers();
    const newCustomer: Customer = {
      ...customer,
      id: uid('cli'),
      createdAt: new Date().toISOString().split('T')[0],
      totalPurchased: 0,
      totalOrders: 0,
      averageTicket: 0,
      debtAmount: 0,
      bottlesDelivered: 0,
      bottlesReturned: 0,
      bottlesInPossession: 0
    };

    setStored(STORAGE_KEYS.CUSTOMERS, [newCustomer, ...customers]);
    this.addAuditLog('Criação de Cliente', 'customers', newCustomer.id, `Cadastrado cliente ${newCustomer.name} (${newCustomer.type})`);
    return newCustomer;
  },

  updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return null;

    const oldName = customers[index].name;
    const updated = { ...customers[index], ...updates };
    customers[index] = updated;

    setStored(STORAGE_KEYS.CUSTOMERS, customers);
    this.addAuditLog('Atualização de Cliente', 'customers', id, `Atualizado cadastro de ${oldName}`);
    return updated;
  },

  // PRODUCTS
  getProducts(): Product[] {
    return getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },

  /** Distinct categories already used by products (shown as suggestions when creating new ones). */
  getProductCategories(): string[] {
    return [...new Set<string>(this.getProducts().map(p => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
  },

  addProduct(product: Omit<Product, 'id'>): Product {
    const products = this.getProducts();
    const newProd: Product = {
      ...product,
      id: uid('prod')
    };
    setStored(STORAGE_KEYS.PRODUCTS, [...products, newProd]);
    this.addAuditLog('Cadastro de Produto', 'products', newProd.id, `Criado produto ${newProd.name} (${newProd.sku})`);
    return newProd;
  },

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const old = products[index];
    const updated = { ...old, ...updates };
    products[index] = updated;
    setStored(STORAGE_KEYS.PRODUCTS, products);

    if (updates.sellingPrice && updates.sellingPrice !== old.sellingPrice) {
      this.addAuditLog(
        'Alteração de Preço',
        'products',
        id,
        `Preço do produto ${old.name} alterado`,
        `${old.sellingPrice.toLocaleString()} Kz`,
        `${updates.sellingPrice.toLocaleString()} Kz`
      );
    } else {
      this.addAuditLog('Edição de Produto', 'products', id, `Atualizado produto ${old.name}`);
    }

    return updated;
  },

  // ORDERS & SALES (The core integration rule)
  getOrders(): Order[] {
    return getStored<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },

  createSale(data: {
    customerId: string;
    items: { productId: string; quantity: number; unitPrice?: number }[];
    paymentMethod: PaymentMethod;
    discount?: number;
    notes?: string;
    bottlesDeliveredQty?: number;
    bottlesCollectedQty?: number;
  }): { success: boolean; order?: Order; error?: string } {
    const customers = this.getCustomers();
    const products = this.getProducts();
    const customer = customers.find(c => c.id === data.customerId);

    if (!customer) {
      return { success: false, error: 'Cliente não encontrado.' };
    }

    // Check stock for all items first (Rule 6: No negative stock)
    for (const item of data.items) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) {
        return { success: false, error: `Produto ID ${item.productId} não encontrado.` };
      }
      if (!prod.isService && prod.currentStock < item.quantity) {
        return { 
          success: false, 
          error: `Estoque insuficiente para "${prod.name}". Solicitado: ${item.quantity}, Disponível: ${prod.currentStock}` 
        };
      }
    }

    const user = this.getCurrentUser();
    const today = new Date().toISOString().split('T')[0];
    const orderCount = this.getOrders().length + 1025;
    const orderCode = `PED-${orderCount}`;

    // Build items with subtotals
    let subtotal = 0;
    let totalBottlesDelivered = 0;

    const orderItems = data.items.map(item => {
      const prod = products.find(p => p.id === item.productId)!;
      const unitPrice = item.unitPrice ?? prod.sellingPrice;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      if (prod.isReturnableBottle) {
        totalBottlesDelivered += item.quantity;
      }

      return {
        productId: prod.id,
        productName: prod.name,
        unitPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        isReturnableBottle: prod.isReturnableBottle
      };
    });

    const discount = data.discount || 0;
    const total = Math.max(0, subtotal - discount);

    const isPaid = data.paymentMethod !== 'a_prazo';
    const paidAmount = isPaid ? total : 0;
    const remainingAmount = isPaid ? 0 : total;

    const bottlesDelivered = data.bottlesDeliveredQty !== undefined ? data.bottlesDeliveredQty : totalBottlesDelivered;
    const bottlesCollected = data.bottlesCollectedQty || 0;

    const newOrder: Order = {
      id: uid('ord'),
      code: orderCode,
      customerId: customer.id,
      customerName: customer.name,
      customerType: customer.type,
      commercialRep: user.name,
      date: today,
      items: orderItems,
      subtotal,
      discount,
      total,
      paymentMethod: data.paymentMethod,
      paymentStatus: isPaid ? 'pago' : 'pendente',
      orderStatus: 'entregue',
      paidAmount,
      remainingAmount,
      notes: data.notes,
      bottlesDeliveredQty: bottlesDelivered,
      bottlesCollectedQty: bottlesCollected
    };

    // 1. Save Order
    const orders = this.getOrders();
    setStored(STORAGE_KEYS.ORDERS, [newOrder, ...orders]);

    // 2. Deduct inventory & create stock movements (Rule 1 & 5)
    const updatedProducts = [...products];
    const movements = this.getInventoryMovements();
    const newMovements: InventoryMovement[] = [];

    for (const item of orderItems) {
      const prodIdx = updatedProducts.findIndex(p => p.id === item.productId);
      if (prodIdx !== -1 && !updatedProducts[prodIdx].isService) {
        const prod = updatedProducts[prodIdx];
        const prev = prod.currentStock;
        const next = prev - item.quantity;
        updatedProducts[prodIdx] = { ...prod, currentStock: next };

        newMovements.push({
          id: uid('mov'),
          date: today,
          productId: prod.id,
          productName: prod.name,
          type: 'venda',
          quantity: -item.quantity,
          previousStock: prev,
          newStock: next,
          reason: `Venda ${orderCode} (${customer.name})`,
          performedBy: user.name,
          orderId: newOrder.id
        });

        // Trigger stock alert if under minimum
        if (next <= prod.minStock) {
          this.addNotification({
            type: 'alerta_estoque',
            title: `Estoque Baixo: ${prod.name}`,
            message: `O estoque atual baixou para ${next} unidades (mínimo: ${prod.minStock}).`,
            priority: next === 0 ? 'alta' : 'media',
            linkToTab: 'estoque'
          });
        }
      }
    }
    setStored(STORAGE_KEYS.PRODUCTS, updatedProducts);
    setStored(STORAGE_KEYS.MOVEMENTS, [...newMovements, ...movements]);

    // 3. Update customer metrics & returnable bottles
    const netBottleChange = bottlesDelivered - bottlesCollected;
    const newDebt = customer.debtAmount + remainingAmount;
    const newTotalPurchased = customer.totalPurchased + total;
    const newOrdersCount = customer.totalOrders + 1;
    const newAvgTicket = Math.round(newTotalPurchased / newOrdersCount);

    const updatedCustomer: Customer = {
      ...customer,
      lastPurchaseDate: today,
      totalPurchased: newTotalPurchased,
      totalOrders: newOrdersCount,
      averageTicket: newAvgTicket,
      debtAmount: newDebt,
      bottlesDelivered: customer.bottlesDelivered + bottlesDelivered,
      bottlesReturned: customer.bottlesReturned + bottlesCollected,
      bottlesInPossession: Math.max(0, customer.bottlesInPossession + netBottleChange),
      status: customer.status === 'lead' || customer.status === 'proposta_enviada' || customer.status === 'novo' ? 'cliente' : customer.status
    };

    const custIndex = customers.findIndex(c => c.id === customer.id);
    customers[custIndex] = updatedCustomer;
    setStored(STORAGE_KEYS.CUSTOMERS, customers);

    // Record Bottle movement
    if (bottlesDelivered > 0 || bottlesCollected > 0) {
      const bottleAudit = this.getBottleAudit();
      const newBottleAudit: BottleAudit = {
        ...bottleAudit,
        inStock: Math.max(0, bottleAudit.inStock - bottlesDelivered),
        emptyInStock: bottleAudit.emptyInStock + bottlesCollected,
        withCustomers: bottleAudit.withCustomers + netBottleChange
      };
      setStored(STORAGE_KEYS.BOTTLES, newBottleAudit);

      const bottleCustomerMovements = this.getBottleCustomerMovements();
      const bmov: BottleCustomerMovement = {
        id: uid('bmov'),
        date: today,
        customerId: customer.id,
        customerName: customer.name,
        orderId: newOrder.id,
        type: bottlesDelivered > 0 ? 'entrega' : 'recolha_devolucao',
        quantity: bottlesDelivered > 0 ? bottlesDelivered : bottlesCollected,
        balanceAfter: updatedCustomer.bottlesInPossession,
        registeredBy: user.name
      };
      setStored(STORAGE_KEYS.BOTTLE_MOVEMENTS, [bmov, ...bottleCustomerMovements]);
    }

    // 4. Financial integration (Rule 2 & 3)
    if (!isPaid) {
      // Create Conta a Receber
      const receivables = this.getReceivables();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (customer.paymentTerm === '60_dias' ? 60 : customer.paymentTerm === '30_dias' ? 30 : 15));

      const newRec: Receivable = {
        id: uid('rec'),
        orderId: newOrder.id,
        orderCode: newOrder.code,
        customerId: customer.id,
        customerName: customer.name,
        amount: total,
        paidAmount: 0,
        remainingAmount: total,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pendente'
      };
      setStored(STORAGE_KEYS.RECEIVABLES, [newRec, ...receivables]);
    } else {
      // Immediate Cash inflow (Fluxo de caixa)
      this.addCashTransaction({
        date: today,
        type: 'entrada',
        category: customer.type === 'B2B' ? 'Venda B2B' : 'Venda B2C',
        costCenter: 'comercial',
        description: `Recebimento ${orderCode} - ${customer.name}`,
        amount: total,
        paymentMethod: data.paymentMethod,
        relatedOrderId: newOrder.id
      });
    }

    // 5. Audit Log (Rule 8)
    this.addAuditLog(
      'Criação de Venda',
      'orders',
      newOrder.id,
      `Venda ${orderCode} confirmada para ${customer.name} no valor de ${total.toLocaleString()} Kz`
    );

    return { success: true, order: newOrder };
  },

  updateOrderStatus(orderId: string, status: OrderStatus): { success: boolean; error?: string } {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return { success: false, error: 'Pedido não encontrado.' };

    const old = orders[index];
    if (old.orderStatus === status) return { success: true };

    const updated = { ...old, orderStatus: status };
    orders[index] = updated;
    setStored(STORAGE_KEYS.ORDERS, orders);

    this.addAuditLog(
      'Atualização de Status de Pedido',
      'orders',
      orderId,
      `Status do pedido ${old.code} alterado de ${old.orderStatus} para ${status}`
    );

    return { success: true };
  },

  cancelOrder(orderId: string): { success: boolean; error?: string } {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return { success: false, error: 'Pedido não encontrado.' };

    const old = orders[index];
    if (old.orderStatus === 'cancelado') return { success: true };

    // Restore stock for items
    const products = this.getProducts();
    old.items.forEach(item => {
      const pIndex = products.findIndex(p => p.id === item.productId);
      if (pIndex !== -1 && !products[pIndex].isService) {
        products[pIndex].currentStock += item.quantity;
      }
    });
    setStored(STORAGE_KEYS.PRODUCTS, products);

    // If customer bottle possession was updated, revert bottles delivered
    if (old.bottlesDeliveredQty > 0) {
      const customers = this.getCustomers();
      const cIndex = customers.findIndex(c => c.id === old.customerId);
      if (cIndex !== -1) {
        customers[cIndex].bottlesInPossession = Math.max(0, customers[cIndex].bottlesInPossession - old.bottlesDeliveredQty);
        setStored(STORAGE_KEYS.CUSTOMERS, customers);
      }
    }

    orders[index] = { ...old, orderStatus: 'cancelado' };
    setStored(STORAGE_KEYS.ORDERS, orders);

    this.addAuditLog(
      'Cancelamento de Pedido',
      'orders',
      orderId,
      `Pedido ${old.code} cancelado com estorno de estoque.`
    );

    return { success: true };
  },

  // RECEIVABLES (Contas a Receber)
  getReceivables(): Receivable[] {
    return getStored<Receivable[]>(STORAGE_KEYS.RECEIVABLES, INITIAL_RECEIVABLES);
  },

  receivePayment(receivableId: string, amount: number, paymentMethod: PaymentMethod = 'transferencia'): { success: boolean; error?: string } {
    const receivables = this.getReceivables();
    const index = receivables.findIndex(r => r.id === receivableId);
    if (index === -1) return { success: false, error: 'Conta não encontrada.' };

    const rec = receivables[index];
    if (amount <= 0 || amount > rec.remainingAmount) {
      return { success: false, error: 'Valor de pagamento inválido.' };
    }

    const today = new Date().toISOString().split('T')[0];
    const newPaid = rec.paidAmount + amount;
    const newRemaining = rec.remainingAmount - amount;
    const newStatus = newRemaining === 0 ? 'pago' : 'parcialmente_pago';

    receivables[index] = {
      ...rec,
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      status: newStatus,
      paymentDate: today,
      paymentMethod
    };
    setStored(STORAGE_KEYS.RECEIVABLES, receivables);

    // Rule 3: Add to Cash Flow
    this.addCashTransaction({
      date: today,
      type: 'entrada',
      category: 'Recebimento de Clientes',
      costCenter: 'comercial',
      description: `Liquidação ${rec.orderCode} - ${rec.customerName}`,
      amount,
      paymentMethod,
      relatedReceivableId: rec.id
    });

    // Update customer debt
    const customers = this.getCustomers();
    const custIndex = customers.findIndex(c => c.id === rec.customerId);
    if (custIndex !== -1) {
      const c = customers[custIndex];
      customers[custIndex] = {
        ...c,
        debtAmount: Math.max(0, c.debtAmount - amount)
      };
      setStored(STORAGE_KEYS.CUSTOMERS, customers);
    }

    // Update Order payment status if full
    const orders = this.getOrders();
    const ordIndex = orders.findIndex(o => o.id === rec.orderId);
    if (ordIndex !== -1) {
      const ord = orders[ordIndex];
      orders[ordIndex] = {
        ...ord,
        paidAmount: ord.paidAmount + amount,
        remainingAmount: Math.max(0, ord.remainingAmount - amount),
        paymentStatus: newRemaining === 0 ? 'pago' : 'parcialmente_pago'
      };
      setStored(STORAGE_KEYS.ORDERS, orders);
    }

    this.addAuditLog(
      'Recebimento Financeiro',
      'receivables',
      rec.id,
      `Recebido ${amount.toLocaleString()} Kz referente a ${rec.orderCode} (${rec.customerName})`
    );

    return { success: true };
  },

  // PAYABLES (Contas a Pagar)
  getPayables(): Payable[] {
    return getStored<Payable[]>(STORAGE_KEYS.PAYABLES, INITIAL_PAYABLES);
  },

  addPayable(payable: Omit<Payable, 'id' | 'status'>): Payable {
    const payables = this.getPayables();
    const newPayable: Payable = {
      ...payable,
      id: uid('pay'),
      status: 'pendente'
    };
    setStored(STORAGE_KEYS.PAYABLES, [newPayable, ...payables]);
    this.addAuditLog('Criação de Despesa', 'payables', newPayable.id, `Cadastrada despesa ${newPayable.description} (${newPayable.amount.toLocaleString()} Kz)`);
    return newPayable;
  },

  payPayable(payableId: string): { success: boolean; error?: string } {
    const payables = this.getPayables();
    const index = payables.findIndex(p => p.id === payableId);
    if (index === -1) return { success: false, error: 'Despesa não encontrada.' };

    const pay = payables[index];
    const today = new Date().toISOString().split('T')[0];

    payables[index] = {
      ...pay,
      status: 'pago',
      paymentDate: today
    };
    setStored(STORAGE_KEYS.PAYABLES, payables);

    // Rule 4: Paid expense reflects in cash flow
    this.addCashTransaction({
      date: today,
      type: 'saida',
      category: pay.category,
      costCenter: pay.costCenter,
      description: `Pagamento: ${pay.description}`,
      amount: pay.amount,
      paymentMethod: pay.paymentMethod,
      relatedPayableId: pay.id
    });

    this.addAuditLog('Pagamento de Despesa', 'payables', pay.id, `Pago ${pay.amount.toLocaleString()} Kz para ${pay.supplierName}`);
    return { success: true };
  },

  // CASH FLOW
  getCashTransactions(): CashTransaction[] {
    return getStored<CashTransaction[]>(STORAGE_KEYS.CASH, INITIAL_CASH_TRANSACTIONS);
  },

  getCurrentCashBalance(): number {
    const txs = this.getCashTransactions();
    let balance = 0;
    for (const tx of txs) {
      if (tx.type === 'entrada') balance += tx.amount;
      else balance -= tx.amount;
    }
    return balance;
  },

  addCashTransaction(data: Omit<CashTransaction, 'id' | 'balanceAfter'>): CashTransaction {
    const txs = this.getCashTransactions();
    const currentBalance = this.getCurrentCashBalance();
    const balanceAfter = data.type === 'entrada' ? currentBalance + data.amount : currentBalance - data.amount;

    const newTx: CashTransaction = {
      ...data,
      id: uid('tx'),
      balanceAfter
    };

    setStored(STORAGE_KEYS.CASH, [newTx, ...txs]);
    return newTx;
  },

  // INVENTORY & BOTTLES
  getInventoryMovements(): InventoryMovement[] {
    return getStored<InventoryMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_INVENTORY_MOVEMENTS);
  },

  addInventoryStock(productId: string, quantity: number, reason: string): { success: boolean; error?: string } {
    if (quantity <= 0) return { success: false, error: 'Quantidade deve ser maior que zero.' };

    const products = this.getProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) return { success: false, error: 'Produto não encontrado.' };

    const prod = products[index];
    const prev = prod.currentStock;
    const next = prev + quantity;
    products[index] = { ...prod, currentStock: next };
    setStored(STORAGE_KEYS.PRODUCTS, products);

    const user = this.getCurrentUser();
    const today = new Date().toISOString().split('T')[0];
    const mov: InventoryMovement = {
      id: uid('mov'),
      date: today,
      productId: prod.id,
      productName: prod.name,
      type: 'entrada',
      quantity,
      previousStock: prev,
      newStock: next,
      reason,
      performedBy: user.name
    };

    const movements = this.getInventoryMovements();
    setStored(STORAGE_KEYS.MOVEMENTS, [mov, ...movements]);

    this.addAuditLog('Entrada de Estoque', 'inventory', prod.id, `Entrada de ${quantity} un para ${prod.name}`);
    return { success: true };
  },

  addInventoryMovement(data: { productId: string; type: InventoryMovementType; quantity: number; reason: string }): { success: boolean; error?: string } {
    if (data.quantity <= 0) return { success: false, error: 'Quantidade deve ser maior que zero.' };

    const products = this.getProducts();
    const index = products.findIndex(p => p.id === data.productId);
    if (index === -1) return { success: false, error: 'Produto não encontrado.' };

    const prod = products[index];
    if (prod.isService) return { success: false, error: 'Serviços não têm controle de estoque.' };
    const prev = prod.currentStock;
    const isOut = data.type === 'saida' || data.type === 'venda' || data.type === 'perda';
    const next = isOut ? Math.max(0, prev - data.quantity) : prev + data.quantity;
    
    products[index] = { ...prod, currentStock: next };
    setStored(STORAGE_KEYS.PRODUCTS, products);

    const user = this.getCurrentUser();
    const today = new Date().toISOString().split('T')[0];
    const mov: InventoryMovement = {
      id: uid('mov'),
      date: today,
      productId: prod.id,
      productName: prod.name,
      type: data.type,
      quantity: isOut ? -data.quantity : data.quantity,
      previousStock: prev,
      newStock: next,
      reason: data.reason,
      performedBy: user.name
    };

    const movements = this.getInventoryMovements();
    setStored(STORAGE_KEYS.MOVEMENTS, [mov, ...movements]);

    this.addAuditLog('Movimentação de Estoque', 'inventory', prod.id, `${data.type}: ${data.quantity} un para ${prod.name} (${data.reason})`);
    return { success: true };
  },

  getBottleAudit(): BottleAudit {
    return getStored<BottleAudit>(STORAGE_KEYS.BOTTLES, INITIAL_BOTTLE_AUDIT);
  },

  getBottleCustomerMovements(): BottleCustomerMovement[] {
    return getStored<BottleCustomerMovement[]>(STORAGE_KEYS.BOTTLE_MOVEMENTS, INITIAL_BOTTLE_CUSTOMER_MOVEMENTS);
  },

  recordCustomerBottleReturn(customerId: string, quantity: number, notes?: string): { success: boolean; error?: string } {
    if (quantity <= 0) return { success: false, error: 'Quantidade deve ser maior que zero.' };

    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    if (index === -1) return { success: false, error: 'Cliente não encontrado.' };

    const customer = customers[index];
    if (customer.bottlesInPossession < quantity) {
      return { 
        success: false, 
        error: `Cliente possui apenas ${customer.bottlesInPossession} garrafões em posse.` 
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const user = this.getCurrentUser();

    // Update customer
    const newReturned = customer.bottlesReturned + quantity;
    const newPossession = Math.max(0, customer.bottlesInPossession - quantity);
    customers[index] = {
      ...customer,
      bottlesReturned: newReturned,
      bottlesInPossession: newPossession
    };
    setStored(STORAGE_KEYS.CUSTOMERS, customers);

    // Update Bottle Audit
    const bottleAudit = this.getBottleAudit();
    const newAudit: BottleAudit = {
      ...bottleAudit,
      emptyInStock: bottleAudit.emptyInStock + quantity,
      withCustomers: Math.max(0, bottleAudit.withCustomers - quantity)
    };
    setStored(STORAGE_KEYS.BOTTLES, newAudit);

    // Record movement
    const bmovs = this.getBottleCustomerMovements();
    const bmov: BottleCustomerMovement = {
      id: uid('bmov'),
      date: today,
      customerId: customer.id,
      customerName: customer.name,
      type: 'recolha_devolucao',
      quantity,
      balanceAfter: newPossession,
      registeredBy: user.name
    };
    setStored(STORAGE_KEYS.BOTTLE_MOVEMENTS, [bmov, ...bmovs]);

    this.addAuditLog(
      'Devolução de Vasilhames',
      'bottles',
      customer.id,
      `Recolha de ${quantity} garrafões vazios de ${customer.name}. Restam em posse: ${newPossession}`
    );

    return { success: true };
  },

  recordBottleReturn(customerId: string, quantity: number, notes?: string) {
    return this.recordCustomerBottleReturn(customerId, quantity, notes);
  },

  // SUPPLIERS
  getSuppliers(): Supplier[] {
    return getStored<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  },

  addSupplier(supplier: Omit<Supplier, 'id' | 'totalPurchased' | 'totalPaid' | 'debtAmount' | 'contactPerson' | 'whatsapp' | 'productsSupplied'> & Partial<Pick<Supplier, 'contactPerson' | 'whatsapp' | 'productsSupplied'>>): Supplier {
    const suppliers = this.getSuppliers();
    const newSup: Supplier = {
      contactPerson: '',
      whatsapp: '',
      productsSupplied: [],
      ...supplier,
      id: uid('sup'),
      totalPurchased: 0,
      totalPaid: 0,
      debtAmount: 0
    };
    setStored(STORAGE_KEYS.SUPPLIERS, [newSup, ...suppliers]);
    this.addAuditLog('Cadastro de Fornecedor', 'suppliers', newSup.id, `Novo fornecedor ${newSup.name}`);
    return newSup;
  },

  // AUDIT LOGS
  getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
  },

  addAuditLog(action: string, entity: string, recordId: string, details: string, previousValue?: string, newValue?: string) {
    const logs = this.getAuditLogs();
    const user = this.getCurrentUser();
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    const newLog: AuditLog = {
      id: uid('aud'),
      timestamp,
      user: user.name,
      userRole: user.role,
      action,
      entity,
      recordId,
      details,
      previousValue,
      newValue
    };

    setStored(STORAGE_KEYS.AUDIT, [newLog, ...logs.slice(0, 150)]); // keep latest 150
  },

  // NOTIFICATIONS
  getNotifications(): AppNotification[] {
    return getStored<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  addNotification(notif: Omit<AppNotification, 'id' | 'date' | 'isRead'>) {
    const list = this.getNotifications();
    const now = new Date();
    const date = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newNotif: AppNotification = {
      ...notif,
      id: uid('notif'),
      date,
      isRead: false
    };

    setStored(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...list]);
  },

  markNotificationAsRead(id: string) {
    const list = this.getNotifications();
    const updated = list.map(n => n.id === id ? { ...n, isRead: true } : n);
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  markAllNotificationsAsRead() {
    const list = this.getNotifications();
    const updated = list.map(n => ({ ...n, isRead: true }));
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
  }
};
