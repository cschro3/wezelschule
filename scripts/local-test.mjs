import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createLocalRuntime, OWNER, sha256 } from './local-runtime.mjs';
const command = process.argv[2] ?? 'start';
if (!['setup', 'start'].includes(command)) throw new Error('Use setup or start.');
if (+process.versions.node.split('.')[0] < 24) throw new Error('Node.js 24 or newer is required.');
const managed = process.argv.includes('--managed-preview');
if (managed && process.env.SITES_MANAGED_LINUX_CONTAINER !== '1') throw new Error('Managed preview flag is reserved for the Sites preview daemon.');
const port = managed ? 5173 : 3000, origin = managed ? 'http://terminal.local:5173' : 'http://localhost:3000';
const runtime = await createLocalRuntime({ origin, stateDirectory: process.env.WEZEL_LOCAL_TEST_DIRECTORY || resolve('.local-test') });
if (command === 'setup') {
  console.log('Local synthetic D1/R2 initialized; existing local data retained. No hosted resources were contacted.');
  await runtime.dispose();
} else {
  const operatorToken = randomBytes(32).toString('hex');
  let setupToken;
  async function initialInvitation() {
    if (await runtime.db.prepare('SELECT id FROM auth_users WHERE id=?').bind(OWNER.id).first()) return null;
    if (!setupToken) {
      setupToken = randomBytes(32).toString('hex');
      await runtime.db.prepare('DELETE FROM auth_invitations WHERE user_id=?').bind(OWNER.id).run();
      const now = Date.now();
      await runtime.db.prepare('INSERT INTO auth_invitations(id,user_id,token_hash,created_by,created_at,expires_at) VALUES (?,?,?,?,?,?)').bind('local-first-setup', OWNER.id, sha256(setupToken), OWNER.id, now, now + 86400000).run();
    }
    return setupToken;
  }
  const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const html = body => '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>WEZEL NEXT – Lokaler Test</title><style>body{background:#101d35;color:#f7f9fc;font:17px/1.6 system-ui;margin:0;padding:clamp(24px,6vw,80px)}main{max-width:850px;margin:auto}a{color:#c7f36b}button{background:#c7f36b;border:0;padding:16px 22px;border-radius:8px;font:inherit;cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#18243a;padding:20px}li{margin:12px 0}</style><main><h1>WEZEL NEXT · Lokaler Test</h1><p>Nur synthetische Daten. Eigene lokale D1-/R2-Dateien. Kein externer Mailversand.</p>' + body + '</main></html>';
  const server = createServer(async (req, res) => {
    try {
      const allowed = new Set(managed ? ['terminal.local:5173', 'localhost:5173', '127.0.0.1:5173'] : ['localhost:3000', '127.0.0.1:3000', '[::1]:3000']);
      if (!allowed.has(req.headers.host)) { res.writeHead(403); return res.end('Unsupported host.'); }
      const url = new URL(req.url, origin);
      if (url.origin !== origin && !allowed.has(url.host)) { res.writeHead(403); return res.end('Unsupported target.'); }
      res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex, nofollow'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer');
      if (url.pathname.startsWith('/__local')) {
        res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        const operator = (req.headers.cookie ?? '').split(';').some(x => x.trim() === 'wezel_local_operator=' + operatorToken);
        if (url.pathname === '/__local/operator' && req.method === 'POST') {
          if (req.headers.origin !== origin) { res.writeHead(403); return res.end('Origin rejected.'); }
          res.setHeader('Set-Cookie', 'wezel_local_operator=' + operatorToken + '; Path=/__local; HttpOnly; SameSite=Strict');
          res.writeHead(303, { Location: '/__local' }); return res.end();
        }
        if (req.method !== 'GET') { res.writeHead(405); return res.end(); }
        if (!operator) return res.end(html('<p>Öffne die lokale Verwaltung bewusst auf diesem Rechner. Sie enthält den einmaligen Einrichtungslink und den lokalen Testpostausgang.</p><form method="post" action="/__local/operator"><button>Lokale Testverwaltung öffnen</button></form>'));
        if (url.pathname === '/__local/mail') return res.end(html('<h2>Lokaler Testpostausgang</h2><p>Nur im Arbeitsspeicher; nach einem Neustart leer. Keine echte Nachricht wurde versandt.</p>' + runtime.mailbox.map(m => '<article><h3>' + escape(m.subject) + '</h3><p>' + escape(m.to.join(', ')) + '</p><pre>' + escape(m.text) + '</pre></article>').join('') + '<p><a href="/__local">Zurück</a></p>'));
        const token = await initialInvitation();
        return res.end(html('<ol><li>' + (token ? '<a href="/login?mode=invite#token=' + token + '">Eigenes lokales Administratorpasswort einrichten</a>' : 'Das lokale Administratorkonto ist bereits eingerichtet.') + '</li><li><a href="/login">Mit admin@wezel.invalid anmelden</a></li><li><a href="/account/security">TOTP-MFA einrichten und Wiederherstellungscodes privat sichern</a></li><li><a href="/admin">Adminbereich</a> · <a href="/admin/design">Website-Designer</a> · <a href="/admin/calendar/import">Kalenderimport</a></li></ol><p><a href="/">Website ansehen</a> · <a href="/__local/mail">Lokaler Testpostausgang</a></p>'));
      }
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 16 * 1024 * 1024) { res.writeHead(413); return res.end('Request too large.'); } chunks.push(chunk); }
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (v !== undefined && !k.startsWith('oai-authenticated-') && !['host', 'connection', 'content-length', 'transfer-encoding', 'cf-connecting-ip', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto'].includes(k)) headers.set(k, Array.isArray(v) ? v.join(',') : v);
      headers.set('cf-connecting-ip', '127.0.0.1');
      const response = await runtime.mf.dispatchFetch(origin + url.pathname + url.search, { method: req.method, headers: Object.fromEntries(headers), ...(size ? { body: Buffer.concat(chunks) } : {}), redirect: 'manual' });
      res.statusCode = response.status;
      for (const [k, v] of response.headers) if (!['set-cookie', 'transfer-encoding', 'content-length', 'content-encoding'].includes(k)) res.setHeader(k, v);
      const cookies = response.headers.getSetCookie(); if (cookies.length) res.setHeader('Set-Cookie', cookies);
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) { console.error('Local request failed:', error.name); if (!res.headersSent) res.writeHead(500); res.end('Lokaler Test: Anfrage fehlgeschlagen.'); }
  });
  server.requestTimeout = 30000;
  server.listen(port, managed ? '0.0.0.0' : '127.0.0.1', () => console.log('Local test ready: ' + origin + '/__local'));
  server.on('error', async error => { console.error(error.code === 'EADDRINUSE' ? 'Port already in use. Stop the other local test first.' : 'Local listener failed.'); await runtime.dispose(); process.exitCode = 1; });
  async function stop() { server.close(); await runtime.dispose(); process.exit(); }
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
}
