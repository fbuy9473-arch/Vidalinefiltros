export const POSTGRESQL_DDL_SCHEMA = `-- ==============================================================================
-- SISTEMA DE GESTÃO INTEGRADO VIDALINE (ERP + CRM)
-- Schema Oficial PostgreSQL / Supabase
-- Autor: Vidaline Architecture Team
-- Data: 2026-08-28
-- ==============================================================================

-- 1. EXTENSÕES & CONFIGURAÇÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS DE DOMÍNIO
CREATE TYPE user_role AS ENUM ('admin', 'financeiro', 'comercial', 'estoque', 'gestor');
CREATE TYPE customer_type AS ENUM ('B2B', 'B2C');
CREATE TYPE customer_status AS ENUM (
  'lead', 'contactado', 'qualificado', 'proposta_enviada', 'negociacao',
  'cliente', 'cliente_recorrente', 'cliente_inativo', 'perdido', 'novo', 'primeiro_pedido'
);
CREATE TYPE payment_method AS ENUM ('dinheiro', 'tpa', 'transferencia', 'multicaixa_express', 'a_prazo');
CREATE TYPE payment_status AS ENUM ('pendente', 'parcialmente_pago', 'pago', 'cancelado');
CREATE TYPE order_status AS ENUM ('rascunho', 'confirmado', 'em_preparacao', 'em_entrega', 'entregue', 'cancelado');
CREATE TYPE inventory_movement_type AS ENUM ('entrada', 'saida', 'venda', 'devolucao', 'ajuste', 'perda', 'transferencia');
CREATE TYPE expense_category AS ENUM (
  'salarios', 'transporte', 'combustivel', 'energia', 'agua', 'internet',
  'marketing', 'manutencao', 'materia_prima', 'embalagens', 'impostos', 'aluguel', 'equipamentos', 'outros'
);
CREATE TYPE cost_center AS ENUM ('producao', 'logistica', 'comercial', 'marketing', 'administracao', 'operacoes');

-- 3. TABELA: USERS & PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'comercial',
  phone VARCHAR(50),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA: CLIENTES (B2B E B2C)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type customer_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  nif VARCHAR(30) UNIQUE,
  sector VARCHAR(100),
  company_type VARCHAR(100),
  contact_person VARCHAR(255),
  contact_role VARCHAR(100),
  phone VARCHAR(50) NOT NULL,
  whatsapp VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Luanda',
  neighborhood VARCHAR(100) NOT NULL,
  status customer_status NOT NULL DEFAULT 'lead',
  commercial_rep_id UUID REFERENCES profiles(id),
  credit_limit NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  payment_term VARCHAR(50) NOT NULL DEFAULT 'a_vista',
  total_purchased NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total_orders INT NOT NULL DEFAULT 0,
  average_ticket NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  debt_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  bottles_delivered INT NOT NULL DEFAULT 0,
  bottles_returned INT NOT NULL DEFAULT 0,
  bottles_in_possession INT NOT NULL DEFAULT 0,
  last_purchase_date DATE,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_customers_type_status ON customers(type, status);
CREATE INDEX idx_customers_neighborhood ON customers(neighborhood);
CREATE INDEX idx_customers_last_purchase ON customers(last_purchase_date);

-- 5. TABELA: INTERAÇÕES CRM
CREATE TABLE customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL,
  notes TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABELA: FORNECEDORES
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  nif VARCHAR(30) UNIQUE,
  contact_person VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  whatsapp VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  total_purchased NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total_paid NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  debt_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA: PRODUTOS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'un',
  cost_price NUMERIC(15,2) NOT NULL,
  selling_price NUMERIC(15,2) NOT NULL,
  current_stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 10,
  max_stock INT NOT NULL DEFAULT 1000,
  is_returnable_bottle BOOLEAN NOT NULL DEFAULT FALSE,
  supplier_id UUID REFERENCES suppliers(id),
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_stock_non_negative CHECK (current_stock >= 0)
);
CREATE INDEX idx_products_sku ON products(sku);

-- 8. TABELA: VENDAS E PEDIDOS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  commercial_rep_id UUID REFERENCES profiles(id),
  subtotal NUMERIC(15,2) NOT NULL,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(15,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pendente',
  order_status order_status NOT NULL DEFAULT 'confirmado',
  paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  remaining_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  bottles_delivered_qty INT NOT NULL DEFAULT 0,
  bottles_collected_qty INT NOT NULL DEFAULT 0,
  notes TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- 9. TABELA: ITENS DA VENDA
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  subtotal NUMERIC(15,2) NOT NULL,
  is_returnable_bottle BOOLEAN NOT NULL DEFAULT FALSE
);

-- 10. TABELA: MOVIMENTAÇÕES DE ESTOQUE (AUDITORIA)
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  movement_type inventory_movement_type NOT NULL,
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reason TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES profiles(id),
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TABELA: MOVIMENTAÇÃO DE VASILHAMES POR CLIENTE
CREATE TABLE bottle_customer_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  movement_type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  balance_after INT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TABELA: CONTAS A RECEBER
CREATE TABLE receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  amount NUMERIC(15,2) NOT NULL,
  paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  remaining_amount NUMERIC(15,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  payment_method payment_method,
  status VARCHAR(30) NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_receivables_due_date ON receivables(due_date);

-- 13. TABELA: CONTAS A PAGAR (DESPESAS)
CREATE TABLE payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name VARCHAR(255) NOT NULL,
  category expense_category NOT NULL,
  cost_center cost_center NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  payment_method payment_method NOT NULL DEFAULT 'transferencia',
  status VARCHAR(30) NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payables_due_date ON payables(due_date);

-- 14. TABELA: TRANSAÇÕES DE FLUXO DE CAIXA
CREATE TABLE cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('entrada', 'saida')),
  category VARCHAR(100) NOT NULL,
  cost_center cost_center,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  payment_method payment_method NOT NULL,
  balance_after NUMERIC(15,2) NOT NULL,
  related_order_id UUID REFERENCES orders(id),
  related_payable_id UUID REFERENCES payables(id),
  related_receivable_id UUID REFERENCES receivables(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. TABELA: AUDIT LOGS (AUDITORIA GERAL)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  record_id VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Exemplo de RLS para Administrador e Gestor (Acesso Total)
CREATE POLICY "Admins e Gestores possuem acesso completo" ON customers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'gestor')
    )
  );

-- Comercial tem acesso de leitura e escrita a clientes e vendas
CREATE POLICY "Comercial acessa clientes e vendas" ON customers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'gestor', 'comercial')
    )
  );

-- Financeiro acessa dados financeiros
CREATE POLICY "Financeiro acessa contas e caixa" ON cash_transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'gestor', 'financeiro')
    )
  );
`;
