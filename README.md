# Vidaline - Sistema de Gestão ERP & CRM

Frontend React + servidor Express com login próprio e base de dados **Supabase (Postgres)**.

## Configuração

1. Crie um projeto em https://supabase.com.
2. Em **Project Settings > Database > Connection string**, escolha **Session pooler** e copie a URL.
3. Cole-a em `DATABASE_URL` no ficheiro `.env` (veja `.env.example`), com a senha do banco.
4. `npm install` e depois `npm run dev` → http://localhost:3000

No primeiro arranque o servidor cria as tabelas (com RLS ativado) e a conta de administrador
`admin@vidaline.co.ao` (senha `ADMIN_PASSWORD` do `.env`, ou `admin123` se não definida — altere-a!).

## Base de dados

Tabelas criadas automaticamente (todas com RLS ativo; o acesso é só pelo servidor):
`users`, `sessions`, `customers`, `suppliers`, `products`, `orders` + `order_items`, `receivables`, `payables`,
`cash_transactions`, `inventory_movements`, `bottle_customer_movements`, `bottle_audit`, `audit_logs`, `notifications`.
As relações (cliente → pedido → itens → contas a receber → caixa, produto → movimentos, etc.) são chaves estrangeiras reais.
O esquema está em `server/schema.ts`.

Produção: `npm run build` e `npm start`.
