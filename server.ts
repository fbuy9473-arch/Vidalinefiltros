import 'dotenv/config';
import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import pg from 'pg';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applySync, createSchema, DATA_TABLES, migrateLegacy, readAll, validateSync } from './server/schema.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;

// ---------------------------------------------------------------- database (Supabase Postgres)
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    '\n[db] DATABASE_URL não definida.\n' +
    'No Supabase: Project Settings > Database > Connection string > "Session pooler" e copie a URL para o .env:\n' +
    '  DATABASE_URL="postgresql://postgres.xxxx:SUA_SENHA@aws-0-xx.pooler.supabase.com:5432/postgres"\n'
  );
  process.exit(1);
}
const isLocalDb = /@(localhost|127\.0\.0\.1)[:/]/.test(DATABASE_URL);
const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
  max: process.env.VERCEL ? 1 : 5
});
pool.on('error', err => console.error('[db] erro no pool', err));

// Bump whenever server/schema.ts changes so existing databases get updated on the next start.
const SCHEMA_VERSION = 2;

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      seq BIGSERIAL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      role_title TEXT NOT NULL,
      phone TEXT,
      department TEXT,
      created_at TEXT NOT NULL,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at BIGINT NOT NULL
    );
  `);
  // Creating ~15 tables over the network takes a while, so it only runs when the schema
  // version stored in the database is older than the one in the code.
  await pool.query('CREATE TABLE IF NOT EXISTS schema_meta (id INTEGER PRIMARY KEY, version INTEGER NOT NULL)');
  await pool.query('ALTER TABLE schema_meta ENABLE ROW LEVEL SECURITY');
  const meta = await pool.query('SELECT version FROM schema_meta WHERE id = 1');
  if ((meta.rows[0]?.version ?? 0) >= SCHEMA_VERSION) return;

  await createSchema(pool);
  await migrateLegacy(pool);
  // Supabase exposes the public schema through its REST API (anon key). Enabling RLS
  // with no policies blocks that path; this server connects as the table owner, which
  // bypasses RLS, so the app keeps working.
  for (const t of ['users', 'sessions', ...DATA_TABLES]) await pool.query(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY`);
  await pool.query(
    'INSERT INTO schema_meta (id, version) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET version = EXCLUDED.version',
    [SCHEMA_VERSION]
  );
}

const ROLES = new Set(['admin', 'financeiro', 'comercial', 'estoque', 'gestor']);

async function transaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Express 4 does not forward rejected promises to the error handler.
const h = (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { fn(req, res).catch(next); };

// ---------------------------------------------------------------- auth helpers
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

interface UserRow {
  id: string; name: string; email: string; role: string; role_title: string;
  phone: string | null; department: string | null; created_at: string; password_hash: string;
}

function publicUser(u: UserRow) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    roleTitle: u.role_title,
    phone: u.phone ?? undefined,
    department: u.department ?? undefined,
    createdAt: u.created_at
  };
}

// First run: create the administrator account.
async function seedAdmin() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM users');
  if (rows[0].n > 0) return;
  const email = (process.env.ADMIN_EMAIL || 'admin@vidaline.co.ao').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  await pool.query(
    `INSERT INTO users (id, name, email, role, role_title, created_at, password_hash)
     VALUES ('usr-admin-master', 'Administrador Geral', $1, 'admin', 'Administrador Geral', $2, $3)`,
    [email, new Date().toISOString().split('T')[0], hashPassword(password)]
  );
  console.log(`\n[auth] Conta de administrador criada: ${email} / ${process.env.ADMIN_PASSWORD ? '(ADMIN_PASSWORD do .env)' : password}`);
  if (!process.env.ADMIN_PASSWORD) console.log('[auth] Altere a palavra-passe após o primeiro acesso.\n');
}

type AuthedRequest = Request & { user: UserRow; tokenHash: string };

// Resolves the session from the Bearer token; sends the 401 itself and returns false on failure.
async function authenticate(req: Request, res: Response): Promise<boolean> {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Sessão não iniciada.' });
    return false;
  }
  const tokenHash = sha256(token);
  const { rows } = await pool.query(
    `SELECT u.*, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1`,
    [tokenHash]
  );
  const row = rows[0];
  if (!row || Number(row.expires_at) < Date.now()) {
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
    res.status(401).json({ error: 'Sessão expirada. Inicie sessão novamente.' });
    return false;
  }
  (req as AuthedRequest).user = row;
  (req as AuthedRequest).tokenHash = tokenHash;
  return true;
}

const authed = (fn: (req: AuthedRequest, res: Response) => Promise<unknown>): RequestHandler =>
  h(async (req, res) => {
    if (await authenticate(req, res)) await fn(req as AuthedRequest, res);
  });

const adminOnly = (fn: (req: AuthedRequest, res: Response) => Promise<unknown>): RequestHandler =>
  authed(async (req, res) => {
    if (req.user.role !== 'admin') {
      return void res.status(403).json({ error: 'Apenas administradores podem executar esta ação.' });
    }
    await fn(req, res);
  });

// Naive in-memory brute-force protection: 8 failures / 15 min per email+ip.
const failures = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
function isLocked(key: string) {
  const f = failures.get(key);
  if (!f) return false;
  if (Date.now() - f.first > WINDOW_MS) { failures.delete(key); return false; }
  return f.count >= 8;
}
function registerFailure(key: string) {
  const f = failures.get(key);
  if (!f || Date.now() - f.first > WINDOW_MS) failures.set(key, { count: 1, first: Date.now() });
  else f.count++;
}

// ---------------------------------------------------------------- app
const app = express();
app.use(express.json({ limit: '10mb' }));

const api = express.Router();
// Data must never be served from a (revalidated) browser cache.
api.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

api.post('/auth/login', h(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const key = `${email}|${req.ip}`;
  if (isLocked(key)) {
    return void res.status(429).json({ error: 'Demasiadas tentativas. Tente novamente dentro de 15 minutos.' });
  }
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0] as UserRow | undefined;
  // Verify against a dummy hash when the user is unknown to keep timing similar.
  const ok = user ? verifyPassword(password, user.password_hash) : (verifyPassword(password, hashPassword('x')), false);
  if (!user || !ok) {
    registerFailure(key);
    return void res.status(401).json({ error: 'E-mail ou palavra-passe incorretos.' });
  }
  failures.delete(key);
  const token = crypto.randomBytes(32).toString('hex');
  await pool.query('DELETE FROM sessions WHERE expires_at < $1', [Date.now()]);
  await pool.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [sha256(token), user.id, Date.now() + SESSION_TTL_MS]);
  res.json({ token, user: publicUser(user) });
}));

api.post('/auth/logout', authed(async (req, res) => {
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [req.tokenHash]);
  res.json({ success: true });
}));

api.post('/auth/change-password', authed(async (req, res) => {
  const current = String(req.body?.currentPassword || '');
  const next = String(req.body?.newPassword || '');
  if (next.length < 6) return void res.status(400).json({ error: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' });
  if (!verifyPassword(current, req.user.password_hash)) {
    return void res.status(400).json({ error: 'A palavra-passe atual está incorreta.' });
  }
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashPassword(next), req.user.id]);
  // Invalidate all other sessions of this user.
  await pool.query('DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2', [req.user.id, req.tokenHash]);
  res.json({ success: true });
}));

api.get('/bootstrap', authed(async (req, res) => {
  const { collections, kv } = await readAll(pool);
  const users = (await pool.query('SELECT * FROM users ORDER BY seq')).rows.map(publicUser);
  res.json({ user: publicUser(req.user), users, collections, kv });
}));

// Incremental sync, applied atomically: per collection the upserted rows, deleted ids and
// (optionally) the new id order, plus key/value singletons such as "bottles".
api.put('/sync', authed(async (req, res) => {
  const error = validateSync(req.body || {});
  if (error) return void res.status(400).json({ error });
  await transaction(c => applySync(c, req.body));
  res.json({ success: true });
}));

api.post('/users', adminOnly(async (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  const role = String(b.role || '');
  const roleTitle = String(b.roleTitle || '').trim();
  if (!name || !email || !roleTitle) return void res.status(400).json({ error: 'Nome, e-mail e cargo são obrigatórios.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return void res.status(400).json({ error: 'E-mail inválido.' });
  if (!ROLES.has(role)) return void res.status(400).json({ error: 'Perfil de acesso inválido.' });
  if (password.length < 6) return void res.status(400).json({ error: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
  if ((await pool.query('SELECT 1 FROM users WHERE email = $1', [email])).rowCount) {
    return void res.status(409).json({ error: 'Já existe um funcionário com este e-mail.' });
  }
  const id = `usr-${Date.now()}`;
  const createdAt = new Date().toISOString().split('T')[0];
  const { rows } = await pool.query(
    `INSERT INTO users (id, name, email, role, role_title, phone, department, created_at, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [id, name, email, role, roleTitle, b.phone || null, b.department || null, createdAt, hashPassword(password)]
  );
  res.status(201).json({ user: publicUser(rows[0]) });
}));

api.delete('/users/:id', adminOnly(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  const target = rows[0] as UserRow | undefined;
  if (!target) return void res.status(404).json({ error: 'Funcionário não encontrado.' });
  if (target.id === req.user.id) {
    return void res.status(400).json({ error: 'Não é permitido eliminar o utilizador com a sessão atualmente aberta.' });
  }
  if (target.role === 'admin') {
    const { rows: c } = await pool.query("SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin'");
    if (c[0].n <= 1) {
      return void res.status(400).json({ error: 'Operação bloqueada: O sistema deve manter pelo menos um Administrador Geral ativo.' });
    }
  }
  await pool.query('DELETE FROM users WHERE id = $1', [target.id]);
  res.json({ success: true });
}));

api.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
api.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api]', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.use('/api', api);

let ready: Promise<void> | null = null;
export function ensureReady() {
  return (ready ??= (async () => {
    await initDb();
    await seedAdmin();
  })().catch(err => { ready = null; throw err; }));
}

async function start() {
  try {
    await ensureReady();
  } catch (err) {
    console.error('[db] Não foi possível ligar/preparar a base de dados:', (err as Error).message);
    process.exit(1);
  }

  if (IS_PROD) {
    const dist = path.join(__dirname, 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vidaline em http://localhost:${PORT} (${IS_PROD ? 'produção' : 'desenvolvimento'}) — base de dados: ${isLocalDb ? 'Postgres local' : 'Supabase'}`);
  });
}

if (!process.env.VERCEL) start();

export default app;
