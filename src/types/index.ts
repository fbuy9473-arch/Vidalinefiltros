export type CustomerType = 'B2B' | 'B2C';

export type CustomerStatus = 
  | 'lead' 
  | 'contactado' 
  | 'qualificado' 
  | 'proposta_enviada' 
  | 'negociacao' 
  | 'cliente' 
  | 'cliente_recorrente' 
  | 'cliente_inativo' 
  | 'perdido'
  | 'novo'
  | 'primeiro_pedido';

export interface CustomerInteraction {
  id: string;
  customerId: string;
  date: string;
  type: 'ligacao' | 'whatsapp' | 'email' | 'reuniao' | 'visita' | 'pedido';
  notes: string;
  performedBy: string;
}

export interface Customer {
  id: string;
  type: CustomerType;
  name: string;
  nif?: string;
  sector?: string;
  companyType?: string;
  contactPerson?: string;
  contactRole?: string;
  phone: string;
  whatsapp: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  neighborhood: string;
  status: CustomerStatus;
  commercialRep: string;
  createdAt: string;
  lastPurchaseDate?: string;
  totalPurchased: number;
  totalOrders: number;
  averageTicket: number;
  debtAmount: number;
  creditLimit: number;
  paymentTerm: 'a_vista' | '15_dias' | '30_dias' | '60_dias';
  bottlesDelivered: number;
  bottlesReturned: number;
  bottlesInPossession: number;
  notes?: string;
}

/** Free text: the user creates their own categories. */
export type ProductCategory = string;
export type ProductUnit = string;

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  unit: ProductUnit;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  isReturnableBottle: boolean;
  /** Services (e.g. delivery, installation) are sold without stock control. */
  isService?: boolean;
  supplierId?: string;
  description?: string;
  status: 'ativo' | 'inativo' | 'descontinuado';
}

export type OrderStatus = 'rascunho' | 'confirmado' | 'em_preparacao' | 'em_entrega' | 'entregue' | 'cancelado';
export type PaymentStatus = 'pendente' | 'parcialmente_pago' | 'pago' | 'cancelado';
export type PaymentMethod = 'dinheiro' | 'tpa' | 'transferencia' | 'multicaixa_express' | 'a_prazo';

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  isReturnableBottle: boolean;
}

export interface Order {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  commercialRep: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paidAmount: number;
  remainingAmount: number;
  notes?: string;
  bottlesDeliveredQty: number;
  bottlesCollectedQty: number;
}

export interface Receivable {
  id: string;
  orderId: string;
  orderCode: string;
  customerId: string;
  customerName: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  status: 'pendente' | 'parcialmente_pago' | 'pago' | 'vencido' | 'cancelado';
}

export type ExpenseCategory = 
  | 'salarios' 
  | 'transporte' 
  | 'combustivel' 
  | 'energia' 
  | 'agua' 
  | 'internet' 
  | 'marketing' 
  | 'manutencao' 
  | 'materia_prima' 
  | 'embalagens' 
  | 'impostos' 
  | 'aluguel' 
  | 'equipamentos' 
  | 'outros';

export type CostCenter = 
  | 'producao' 
  | 'logistica' 
  | 'comercial' 
  | 'marketing' 
  | 'administracao' 
  | 'operacoes';

export interface Payable {
  id: string;
  supplierId?: string;
  supplierName: string;
  category: ExpenseCategory;
  costCenter: CostCenter;
  description: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  notes?: string;
}

export interface CashTransaction {
  id: string;
  date: string;
  type: 'entrada' | 'saida';
  category: string;
  costCenter?: CostCenter;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  relatedOrderId?: string;
  relatedPayableId?: string;
  relatedReceivableId?: string;
  balanceAfter: number;
}

export type InventoryMovementType = 
  | 'entrada' 
  | 'saida' 
  | 'venda' 
  | 'devolucao' 
  | 'ajuste' 
  | 'perda' 
  | 'transferencia';

export interface InventoryMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: InventoryMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  orderId?: string;
}

export interface BottleAudit {
  inStock: number;
  emptyInStock: number;
  withCustomers: number;
  inTransit: number;
  damaged: number;
  lost: number;
}

export interface BottleCustomerMovement {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  type: 'entrega' | 'recolha_devolucao' | 'perda_declarada';
  quantity: number;
  balanceAfter: number;
  registeredBy: string;
}

export interface Supplier {
  id: string;
  name: string;
  nif: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  category?: string;
  productsSupplied: string[];
  totalPurchased: number;
  totalPaid: number;
  debtAmount: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  entity: string;
  recordId: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export interface AppNotification {
  id: string;
  date: string;
  type: 'alerta_estoque' | 'conta_vencida' | 'novo_pedido' | 'pagamento' | 'cliente_inativo';
  title: string;
  message: string;
  priority: 'baixa' | 'media' | 'alta';
  isRead: boolean;
  linkToTab?: string;
}

export type UserRole = 'admin' | 'financeiro' | 'comercial' | 'estoque' | 'gestor';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  phone?: string;
  department?: string;
  createdAt?: string;
}
