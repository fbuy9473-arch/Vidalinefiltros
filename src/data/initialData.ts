import {
  Customer,
  Product,
  Order,
  Receivable,
  Payable,
  CashTransaction,
  InventoryMovement,
  BottleAudit,
  BottleCustomerMovement,
  Supplier,
  AuditLog,
  AppNotification,
  SystemUser
} from '../types';

export const INITIAL_USERS: SystemUser[] = [
  {
    id: 'usr-admin-master',
    name: 'Administrador Geral',
    email: 'admin@vidaline.co.ao',
    role: 'admin',
    roleTitle: 'Administrador Geral'
  }
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_RECEIVABLES: Receivable[] = [];

export const INITIAL_PAYABLES: Payable[] = [];

export const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = [];

export const INITIAL_INVENTORY_MOVEMENTS: InventoryMovement[] = [];

export const INITIAL_BOTTLE_AUDIT: BottleAudit = {
  inStock: 0,
  emptyInStock: 0,
  withCustomers: 0,
  inTransit: 0,
  damaged: 0,
  lost: 0
};

export const INITIAL_BOTTLE_CUSTOMER_MOVEMENTS: BottleCustomerMovement[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
