import type { IncomingMessage, ServerResponse } from 'node:http';
import app, { ensureReady } from '../server.ts';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await ensureReady();
  } catch (err) {
    console.error('[db]', (err as Error).message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Base de dados indisponível.' }));
    return;
  }
  (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
