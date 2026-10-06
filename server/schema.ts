import type pg from 'pg';

// ---------------------------------------------------------------------------
// Relational schema for the business data. Each "collection" is an array of
// objects on the client; here every one maps to a real table with typed columns
// and foreign keys. Properties that are not mapped to a column are preserved in
// the `extra` JSONB column, so no data is ever dropped.
// ---------------------------------------------------------------------------

type ColType = 'text' | 'num' | 'bool' | 'date' | 'json';

interface Col {
  key: string;   // property name on the client object
  col: string;   // column name
  type: ColType;
  ref?: string;  // foreign key -> table(id)
  idx: boolean;
}

interface Spec {
  name: string;  // collection name used by the API
  table: string;
  cols: Col[];
}

const snake = (k: string) => k.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
const f = (key: string, type: ColType = 'text', o: { col?: string; ref?: string; idx?: boolean } = {}): Col => ({
  key,
  col: o.col ?? snake(key),
  type,
  ref: o.ref,
  idx: !!(o.idx || o.ref)
});

export const SPECS: Spec[] = [
  {
    name: 'suppliers', table: 'suppliers', cols: [
      f('name'), f('nif'), f('category'), f('contactPerson'), f('phone'), f('whatsapp'), f('email'), f('address'),
      f('productsSupplied', 'json'), f('totalPurchased', 'num'), f('totalPaid', 'num'), f('debtAmount', 'num')
    ]
  },
  {
    name: 'customers', table: 'customers', cols: [
      f('type', 'text', { idx: true }), f('name'), f('nif'), f('sector'), f('companyType'), f('contactPerson'), f('contactRole'),
      f('phone'), f('whatsapp'), f('email'), f('website'), f('address'), f('city'), f('neighborhood'),
      f('status', 'text', { idx: true }), f('commercialRep'), f('createdAt', 'date'), f('lastPurchaseDate', 'date'),
      f('totalPurchased', 'num'), f('totalOrders', 'num'), f('averageTicket', 'num'), f('debtAmount', 'num'),
      f('creditLimit', 'num'), f('paymentTerm'), f('bottlesDelivered', 'num'), f('bottlesReturned', 'num'),
      f('bottlesInPossession', 'num'), f('notes')
    ]
  },
  {
    name: 'products', table: 'products', cols: [
      f('sku', 'text', { idx: true }), f('name'), f('category'), f('unit'), f('costPrice', 'num'), f('sellingPrice', 'num'),
      f('currentStock', 'num'), f('minStock', 'num'), f('maxStock', 'num'), f('isReturnableBottle', 'bool'), f('isService', 'bool'),
      f('supplierId', 'text', { ref: 'suppliers' }), f('description'), f('status')
    ]
  },
  {
    name: 'orders', table: 'orders', cols: [
      f('code', 'text', { idx: true }), f('customerId', 'text', { ref: 'customers' }), f('customerName'), f('customerType'),
      f('commercialRep'), f('date', 'date', { idx: true }), f('subtotal', 'num'), f('discount', 'num'), f('total', 'num'),
      f('paymentMethod'), f('paymentStatus', 'text', { idx: true }), f('orderStatus', 'text', { idx: true }),
      f('paidAmount', 'num'), f('remainingAmount', 'num'), f('notes'),
      f('bottlesDeliveredQty', 'num'), f('bottlesCollectedQty', 'num')
    ]
  },
  {
    name: 'receivables', table: 'receivables', cols: [
      f('orderId', 'text', { ref: 'orders' }), f('orderCode'), f('customerId', 'text', { ref: 'customers' }), f('customerName'),
      f('amount', 'num'), f('paidAmount', 'num'), f('remainingAmount', 'num'), f('dueDate', 'date', { idx: true }),
      f('paymentDate', 'date'), f('paymentMethod'), f('status', 'text', { idx: true })
    ]
  },
  {
    name: 'payables', table: 'payables', cols: [
      f('supplierId', 'text', { ref: 'suppliers' }), f('supplierName'), f('category'), f('costCenter'), f('description'),
      f('amount', 'num'), f('dueDate', 'date', { idx: true }), f('paymentDate', 'date'), f('paymentMethod'),
      f('status', 'text', { idx: true }), f('notes')
    ]
  },
  {
    name: 'cash', table: 'cash_transactions', cols: [
      f('date', 'date', { idx: true }), f('type'), f('category'), f('costCenter'), f('description'), f('amount', 'num'),
      f('paymentMethod'), f('relatedOrderId', 'text', { ref: 'orders' }), f('relatedPayableId', 'text', { ref: 'payables' }),
      f('relatedReceivableId', 'text', { ref: 'receivables' }), f('balanceAfter', 'num')
    ]
  },
  {
    name: 'movements', table: 'inventory_movements', cols: [
      f('date', 'date', { idx: true }), f('productId', 'text', { ref: 'products' }), f('productName'), f('type'),
      f('quantity', 'num'), f('previousStock', 'num'), f('newStock', 'num'), f('reason'), f('performedBy'),
      f('orderId', 'text', { ref: 'orders' })
    ]
  },
  {
    name: 'bottle_movements', table: 'bottle_customer_movements', cols: [
      f('date', 'date', { idx: true }), f('customerId', 'text', { ref: 'customers' }), f('customerName'),
      f('orderId', 'text', { ref: 'orders' }), f('type'), f('quantity', 'num'), f('balanceAfter', 'num'), f('registeredBy')
    ]
  },
  {
    name: 'audit', table: 'audit_logs', cols: [
      f('timestamp', 'text', { idx: true }), f('user', 'text', { col: 'user_name' }), f('userRole'), f('action'), f('entity'),
      f('recordId'), f('details'), f('previousValue'), f('newValue')
    ]
  },
  {
    name: 'notifications', table: 'notifications', cols: [
      f('date', 'text'), f('type'), f('title'), f('message'), f('priority'), f('isRead', 'bool'), f('linkToTab')
    ]
  },
  // Single-row table holding the returnable-bottle totals (exposed to the client as kv "bottles").
  {
    name: 'bottle_audit', table: 'bottle_audit', cols: [
      f('inStock', 'num'), f('emptyInStock', 'num'), f('withCustomers', 'num'),
      f('inTransit', 'num'), f('damaged', 'num'), f('lost', 'num')
    ]
  }
];

const SPEC_BY_NAME = new Map(SPECS.map(s => [s.name, s]));
export const COLLECTION_NAMES = new Set(SPECS.filter(s => s.name !== 'bottle_audit').map(s => s.name));
export const KV_NAMES = new Set(['bottles']);
const BOTTLES_ROW_ID = 'main';

// Child table: the line items of each order.
const ITEM_COLS = [
  f('productId', 'text', { ref: 'products' }), f('productName'), f('unitPrice', 'num'),
  f('quantity', 'num'), f('subtotal', 'num'), f('isReturnableBottle', 'bool')
];

const q = (id: string) => `"${id}"`;
const PG_TYPE: Record<ColType, string> = { text: 'TEXT', num: 'NUMERIC', bool: 'BOOLEAN', date: 'DATE', json: 'JSONB' };
const ARR_TYPE: Record<ColType, string> = { text: 'text[]', num: 'numeric[]', bool: 'boolean[]', date: 'text[]', json: 'text[]' };
const CAST: Record<ColType, string> = { text: '', num: '', bool: '', date: '::date', json: '::jsonb' };

// ------------------------------------------------------------------ DDL
export async function createSchema(pool: pg.Pool) {
  for (const s of SPECS) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${q(s.table)} (
        "id" TEXT PRIMARY KEY,
        "ord" INTEGER NOT NULL DEFAULT 0,
        ${s.cols.map(c => `${q(c.col)} ${PG_TYPE[c.type]}`).join(',\n        ')},
        "extra" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "db_created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "db_updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
    // Columns added in later versions of the schema.
    for (const c of s.cols) await pool.query(`ALTER TABLE ${q(s.table)} ADD COLUMN IF NOT EXISTS ${q(c.col)} ${PG_TYPE[c.type]}`);
    await pool.query(`CREATE INDEX IF NOT EXISTS ${q(`idx_${s.table}_ord`)} ON ${q(s.table)} ("ord")`);
    for (const c of s.cols.filter(c => c.idx)) {
      await pool.query(`CREATE INDEX IF NOT EXISTS ${q(`idx_${s.table}_${c.col}`)} ON ${q(s.table)} (${q(c.col)})`);
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "order_items" (
      "id" BIGSERIAL PRIMARY KEY,
      "order_id" TEXT NOT NULL,
      "position" INTEGER NOT NULL,
      ${ITEM_COLS.map(c => `${q(c.col)} ${PG_TYPE[c.type]}`).join(',\n      ')}
    )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_order_items_order" ON "order_items" ("order_id")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_order_items_product" ON "order_items" ("product_id")`);

  // Foreign keys are DEFERRABLE: a sync request writes several tables in one
  // transaction and the references are checked on commit.
  const fks: { table: string; col: string; ref: string; cascade?: boolean }[] = [
    ...SPECS.flatMap(s => s.cols.filter(c => c.ref).map(c => ({ table: s.table, col: c.col, ref: c.ref! }))),
    { table: 'order_items', col: 'order_id', ref: 'orders', cascade: true },
    { table: 'order_items', col: 'product_id', ref: 'products' }
  ];
  for (const fk of fks) {
    const name = `fk_${fk.table}_${fk.col}`;
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN
          ALTER TABLE ${q(fk.table)} ADD CONSTRAINT ${q(name)} FOREIGN KEY (${q(fk.col)})
            REFERENCES ${q(fk.ref)} ("id") ${fk.cascade ? 'ON DELETE CASCADE ' : ''}DEFERRABLE INITIALLY DEFERRED;
        END IF;
      END $$;`);
  }
}

export const DATA_TABLES = [...SPECS.map(s => s.table), 'order_items'];

// ------------------------------------------------------------------ row mapping
function toDb(c: Col, v: unknown): unknown {
  if (v === undefined || v === null) return null;
  switch (c.type) {
    case 'num': { const n = Number(v); return Number.isFinite(n) ? n : null; }
    case 'bool': return Boolean(v);
    case 'date': return v === '' ? null : String(v);
    case 'json': return JSON.stringify(v);
    default: return c.ref && v === '' ? null : String(v);
  }
}

const selectList = (s: Spec) =>
  s.cols.map(c => {
    const e = c.type === 'num' ? `${q(c.col)}::float8` : c.type === 'date' ? `to_char(${q(c.col)}, 'YYYY-MM-DD')` : q(c.col);
    return `${e} AS ${q(c.col)}`;
  }).join(', ');

function fromDb(s: Spec, r: Record<string, any>) {
  const obj: Record<string, any> = { ...(r.extra || {}), id: r.id };
  for (const c of s.cols) if (r[c.col] !== null && r[c.col] !== undefined) obj[c.key] = r[c.col];
  return obj;
}

// ------------------------------------------------------------------ read
export async function readAll(pool: pg.Pool) {
  const collections: Record<string, any[]> = {};
  const kv: Record<string, unknown> = {};

  for (const s of SPECS) {
    const { rows } = await pool.query(`SELECT "id", "extra", ${selectList(s)} FROM ${q(s.table)} ORDER BY "ord" ASC, "db_created_at" ASC`);
    const mapped = rows.map(r => fromDb(s, r));
    if (s.name === 'bottle_audit') {
      const main = mapped.find(r => r.id === BOTTLES_ROW_ID);
      if (main) { const { id, ...rest } = main; kv.bottles = rest; }
    } else {
      collections[s.name] = mapped;
    }
  }

  const items = await pool.query(
    `SELECT "order_id", "product_id", "product_name", "unit_price"::float8 AS "unit_price", "quantity"::float8 AS "quantity",
            "subtotal"::float8 AS "subtotal", "is_returnable_bottle"
     FROM "order_items" ORDER BY "order_id", "position"`
  );
  const byOrder = new Map<string, any[]>();
  for (const r of items.rows) {
    const it: Record<string, any> = {};
    for (const c of ITEM_COLS) if (r[c.col] !== null) it[c.key] = r[c.col];
    (byOrder.get(r.order_id) ?? byOrder.set(r.order_id, []).get(r.order_id)!).push(it);
  }
  for (const o of collections.orders) o.items = byOrder.get(o.id) ?? [];

  return { collections, kv };
}

// ------------------------------------------------------------------ write
async function upsertRows(c: pg.PoolClient, s: Spec, rows: any[]) {
  if (!rows.length) return;
  const { rows: m } = await c.query(`SELECT COALESCE(MAX("ord"), -1) AS m FROM ${q(s.table)}`);
  const start = Number(m[0].m) + 1;
  const known = new Set(['id', ...s.cols.map(x => x.key), ...(s.name === 'orders' ? ['items'] : [])]);

  const colNames = ['id', 'ord', ...s.cols.map(x => x.col), 'extra'];
  const arrays: unknown[][] = [
    rows.map(r => r.id),
    rows.map((_, i) => start + i),
    ...s.cols.map(col => rows.map(r => toDb(col, r[col.key]))),
    rows.map(r => JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !known.has(k)))))
  ];
  const types = ['text[]', 'integer[]', ...s.cols.map(x => ARR_TYPE[x.type]), 'text[]'];
  const selectExprs = [
    'x."id"', 'x."ord"',
    ...s.cols.map(x => `x.${q(x.col)}${CAST[x.type]}`),
    'x."extra"::jsonb'
  ];
  const updates = [...s.cols.map(x => x.col), 'extra'].map(n => `${q(n)} = EXCLUDED.${q(n)}`).concat('"db_updated_at" = now()');

  await c.query(
    `INSERT INTO ${q(s.table)} (${colNames.map(q).join(', ')})
     SELECT ${selectExprs.join(', ')}
     FROM unnest(${types.map((t, i) => `$${i + 1}::${t}`).join(', ')}) AS x(${colNames.map(q).join(', ')})
     ON CONFLICT ("id") DO UPDATE SET ${updates.join(', ')}`,
    arrays
  );

  if (s.name === 'orders') {
    const ids = rows.map(r => r.id);
    await c.query('DELETE FROM "order_items" WHERE "order_id" = ANY($1::text[])', [ids]);
    const flat = rows.flatMap(r => (Array.isArray(r.items) ? r.items : []).map((it: any, i: number) => ({ orderId: r.id, pos: i, it })));
    if (flat.length) {
      await c.query(
        `INSERT INTO "order_items" ("order_id", "position", ${ITEM_COLS.map(x => q(x.col)).join(', ')})
         SELECT * FROM unnest($1::text[], $2::integer[], ${ITEM_COLS.map((x, i) => `$${i + 3}::${ARR_TYPE[x.type]}`).join(', ')})`,
        [flat.map(x => x.orderId), flat.map(x => x.pos), ...ITEM_COLS.map(col => flat.map(x => toDb(col, x.it[col.key])))]
      );
    }
  }
}

interface SyncPayload {
  collections?: Record<string, { upserts?: any[]; deletes?: unknown[]; order?: unknown[] }>;
  kv?: Record<string, unknown>;
}

export function validateSync(p: SyncPayload): string | null {
  for (const [name, d] of Object.entries(p.collections ?? {})) {
    if (!COLLECTION_NAMES.has(name)) return `Coleção desconhecida: ${name}`;
    if (!d || (d.upserts && !Array.isArray(d.upserts)) || (d.deletes && !Array.isArray(d.deletes)) || (d.order && !Array.isArray(d.order))) {
      return 'Pedido inválido.';
    }
    if ((d.upserts ?? []).some(r => !r || typeof r.id !== 'string')) return 'Todos os registos precisam de um id.';
  }
  for (const key of Object.keys(p.kv ?? {})) if (!KV_NAMES.has(key)) return `Chave desconhecida: ${key}`;
  return null;
}

/** Applies a sync payload. Must run inside a transaction (the caller owns BEGIN/COMMIT). */
export async function applySync(c: pg.PoolClient, p: SyncPayload) {
  await c.query('SET CONSTRAINTS ALL DEFERRED');

  // Parents first so rows are inserted in dependency order.
  for (const s of SPECS) {
    const d = p.collections?.[s.name];
    if (!d) continue;
    // If the same id appears twice in a batch, the last one wins.
    const rows = [...new Map<string, any>((d.upserts ?? []).map(r => [r.id, r])).values()];
    await upsertRows(c, s, rows);
    if (d.deletes?.length) {
      await c.query(`DELETE FROM ${q(s.table)} WHERE "id" = ANY($1::text[])`, [d.deletes.map(String)]);
    }
    if (d.order?.length) {
      await c.query(
        `UPDATE ${q(s.table)} t SET "ord" = x."ord" FROM unnest($1::text[], $2::integer[]) AS x("id", "ord") WHERE t."id" = x."id"`,
        [d.order.map(String), d.order.map((_, i) => i)]
      );
    }
  }

  if (p.kv && 'bottles' in p.kv && p.kv.bottles && typeof p.kv.bottles === 'object') {
    await upsertRows(c, SPEC_BY_NAME.get('bottle_audit')!, [{ ...(p.kv.bottles as object), id: BOTTLES_ROW_ID }]);
  }
}

/** One-off import of the previous generic `records`/`kv` tables (JSON documents), if they still exist. */
export async function migrateLegacy(pool: pg.Pool) {
  const { rows } = await pool.query(`SELECT to_regclass('public.records') AS r, to_regclass('public.kv') AS k`);
  if (!rows[0].r) return;
  const legacy = await pool.query('SELECT collection, data FROM records ORDER BY collection, ord');
  const collections: Record<string, { upserts: any[] }> = {};
  for (const r of legacy.rows) (collections[r.collection] ??= { upserts: [] }).upserts.push(r.data);
  const kv: Record<string, unknown> = {};
  if (rows[0].k) for (const r of (await pool.query('SELECT key, data FROM kv')).rows) kv[r.key] = r.data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await applySync(client, { collections, kv });
    // Keep original ordering (applySync assigned ord in insertion order, which already matches).
    await client.query('DROP TABLE IF EXISTS records, kv');
    await client.query('COMMIT');
    console.log(`[db] Dados antigos migrados para as novas tabelas (${legacy.rowCount} registos).`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
