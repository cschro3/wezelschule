import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createLocalRuntime, OWNER, sha256 } from './local-runtime.mjs';
const command = process.argv[2] ?? 'start';
if (!['setup', 'start'].includes(command)) throw new Error('Use setup or start.');
if (+process.versions.node.split('.')[0] < 24) throw new Error('Node.js 24 or newer is required.');
const port = 3000, origin = 'http://localhost:3000';
const runtime = await createLocalRuntime({ origin, stateDirectory: process.env.WEZEL_LOCAL_TEST_DIRECTORY || resolve('.local-test') });
if (command === 'setup') {
  console.log('Schulwebsite lokal vorbereitet. Vorhandene lokale Konten und Inhalte bleiben erhalten.');
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
  const html = body => '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Schulredaktion · Johann Karl Wezel Östertal</title><style>@font-face{font-family:Inter;src:url(/fonts/Inter-latin-variable.woff2) format("woff2");font-display:swap}*{box-sizing:border-box}body{background:#f7f9fc;color:#18243a;font:16px/1.65 Inter,system-ui;margin:0}header{border-bottom:1px solid #dce2ec;background:white;padding:22px max(24px,calc((100vw - 1160px)/2));display:flex;gap:24px;align-items:center;justify-content:space-between}header img{width:240px;max-width:52vw;height:auto;display:block}a{color:inherit}main{max-width:1160px;margin:64px auto;padding:0 24px;display:grid;grid-template-columns:1fr 1.2fr;gap:40px}.intro{background:#101d35;color:white;border-radius:16px;padding:40px}.intro img{width:270px;max-width:100%;height:auto}.intro h1{font-size:clamp(28px,4vw,44px);line-height:1.15;margin:36px 0 20px}.intro p{color:#d6dfee}.eyebrow{color:#c7f36b;font-weight:700;letter-spacing:.13em;font-size:12px}.card{background:white;border:1px solid #dce2ec;border-radius:16px;padding:36px}.card h2{font-size:28px;line-height:1.2;margin:0 0 18px}.button,button{display:inline-flex;justify-content:center;align-items:center;background:#c7f36b;color:#101d35;text-decoration:none;border:0;padding:14px 20px;border-radius:8px;font:inherit;font-weight:700;cursor:pointer;min-height:48px}.secondary{background:#e9eef7}.actions{display:flex;gap:12px;flex-wrap:wrap;margin:26px 0}li{margin:16px 0}ol{padding-left:22px}form{margin:24px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f7f9fc;padding:20px}details{border-top:1px solid #dce2ec;margin-top:28px;padding-top:20px;color:#526078;font-size:14px}@media(max-width:720px){main{grid-template-columns:1fr;margin:28px auto;gap:20px}.intro,.card{padding:26px}.intro h1{margin-top:24px}.intro img{width:230px}header{padding:18px 24px}header a:last-child{font-size:13px}}</style><header><a href="/"><img src="/api/files/573e7210-7adc-4910-a6d8-635adbbe7e5b" alt="Johann Karl Wezel Östertal – Startseite"></a><a href="/">Zur Schulwebsite →</a></header><main><section class="intro"><span class="eyebrow">WEZEL NEXT · SCHULREDAKTION</span><h1>Eure Schule.<br>Eure Website.</h1><p>Logo, Seiten, Bilder und Termine gemeinsam pflegen.</p><p>Die Schulwebsite kannst du direkt ansehen. Für den geschützten Redaktionsbereich richtest du einmal deinen persönlichen Zugang auf diesem Rechner ein.</p><div class="actions"><a class="button" href="/">Schulwebsite öffnen →</a></div></section><section class="card">' + body + '<details><summary>Informationen zur lokalen Arbeitskopie</summary><p>Die Gestaltung und öffentlichen Texte stammen aus dem vorhandenen WEZEL-NEXT-Projekt. Benutzerkonten, Passwörter und MFA werden auf diesem Rechner neu eingerichtet. Die bisherige Website und ihre Daten bleiben unverändert. E-Mails landen ausschließlich im lokalen Testpostausgang.</p></details></section></main></html>';
  const server = createServer(async (req, res) => {
    try {
      const allowed = new Set(['localhost:3000', '127.0.0.1:3000', '[::1]:3000']);
      if (!allowed.has(req.headers.host)) { res.writeHead(403); return res.end('Unsupported host.'); }
      const url = new URL(req.url, origin);
      if (url.origin !== origin && !allowed.has(url.host)) { res.writeHead(403); return res.end('Unsupported target.'); }
      res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex, nofollow'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'same-origin');
      // Native POST forms need a non-opaque same-origin Origin. no-referrer
      // would make browser navigations send Origin: null; never allow that.
      if (url.pathname.startsWith('/__local')) {
        res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; font-src 'self'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        const operator = (req.headers.cookie ?? '').split(';').some(x => x.trim() === 'wezel_local_operator=' + operatorToken);
        if (url.pathname === '/__local/operator' && req.method === 'POST') {
          if (req.headers.origin !== origin) { res.writeHead(403); return res.end('Origin rejected.'); }
          res.setHeader('Set-Cookie', 'wezel_local_operator=' + operatorToken + '; Path=/__local; HttpOnly; SameSite=Strict');
          res.writeHead(303, { Location: '/__local' }); return res.end();
        }
        if (url.pathname === '/__local/restore-school' && req.method === 'POST') {
          if (!operator || req.headers.origin !== origin) { res.writeHead(403); return res.end('Ungültige Anfrageherkunft.'); }
          const enrolled = await runtime.db.prepare('SELECT id FROM auth_users WHERE id=?').bind(OWNER.id).first();
          if (enrolled) {
            const response = await runtime.mf.dispatchFetch(origin + '/api/security/status', { headers: { Cookie: req.headers.cookie || '' } });
            const status = await response.json();
            if (!status.user?.mfa || status.user.role !== 'SYSTEM_ADMIN') { res.writeHead(403); return res.end(html('<h2>Bitte zuerst anmelden.</h2><p>Zum Wiederherstellen der Gestaltung ist dein lokaler Administratorzugang mit MFA erforderlich.</p><a href="/login">Zur Anmeldung</a>')); }
          }
          await runtime.restoreSchool(); runtime.restoreSchoolAvailable = false;
          res.writeHead(303, { Location: '/__local' }); return res.end();
        }
        if (req.method !== 'GET') { res.writeHead(405); return res.end(); }
        if (!operator) return res.end(html('<h2>Redaktionszugang einrichten.</h2><p>Lege dein eigenes Passwort fest und aktiviere anschließend die Anmeldung mit Authenticator. Dein lokales Konto erhält Zugriff auf den vorhandenen Website-Designer und das CMS.</p><form method="post" action="/__local/operator"><button>Redaktionszugang einrichten →</button></form><p>Bereits eingerichtet? <a href="/login">Zur Anmeldung</a></p>'));
        if (url.pathname === '/__local/mail') return res.end(html('<h2>Lokaler Testpostausgang</h2><p>Nur im Arbeitsspeicher; nach einem Neustart leer. Keine echte Nachricht wurde versandt.</p>' + runtime.mailbox.map(m => '<article><h3>' + escape(m.subject) + '</h3><p>' + escape(m.to.join(', ')) + '</p><pre>' + escape(m.text) + '</pre></article>').join('') + '<p><a href="/__local">Zurück</a></p>'));
        const token = await initialInvitation();
        const restore = runtime.restoreSchoolAvailable ? '<h3>Originalgestaltung laden</h3><p>Hier sind bereits lokale Designänderungen gespeichert. Vor dem Laden der Originalgestaltung wird eine lokale Inhaltskopie angelegt. Dein Konto und MFA bleiben erhalten.</p><form method="post" action="/__local/restore-school"><button class="secondary">Originalgestaltung wiederherstellen</button></form>' : '';
        return res.end(html('<h2>Dein Zugang zur Schulredaktion.</h2>' + restore + '<ol><li>' + (token ? '<a href="/login?mode=invite#token=' + token + '">Eigenes Passwort festlegen</a>' : 'Das lokale Administratorkonto ist bereits eingerichtet.') + '</li><li><a href="/login">Mit admin@wezel.invalid anmelden</a></li><li><a href="/account/security">TOTP-MFA einrichten und Wiederherstellungscodes privat sichern</a></li><li><a href="/admin">Adminbereich</a> · <a href="/admin/design">Website-Designer</a> · <a href="/admin/calendar/import">Kalenderimport</a></li></ol><p><a href="/">Website ansehen</a> · <a href="/__local/mail">Lokaler Testpostausgang</a></p>'));
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
  server.listen(port, '127.0.0.1', () => console.log('Local test ready: ' + origin + '/'));
  server.on('error', async error => { console.error(error.code === 'EADDRINUSE' ? 'Port already in use. Stop the other local test first.' : 'Local listener failed.'); await runtime.dispose(); process.exitCode = 1; });
  async function stop() { server.close(); await runtime.dispose(); process.exit(); }
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
}

