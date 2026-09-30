import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, '..', '.wpp_auth');

const PORT = process.env.GATEWAY_PORT || 3001;

let isConnected = false;
let qrCodeDataUrl = null;
let rawQr = null;
let connectedPhone = null;
let sock = null;

async function startWhatsAppSocket() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
    version: [2, 3000, 1015901307],
    isLatest: true,
  }));

  console.log(`[WA-GATEWAY] Using WhatsApp Web version v${version.join('.')}`);

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('Desktop'),
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    getMessage: async () => undefined,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      rawQr = qr;
      try {
        qrCodeDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
        console.log('[WA-GATEWAY] New QR code generated. Scan via WhatsApp -> Linked Devices.');
      } catch (err) {
        console.error('[WA-GATEWAY] Error generating QR data URL', err);
      }
    }

    if (connection === 'close') {
      isConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`[WA-GATEWAY] Connection closed (statusCode: ${statusCode}). Reconnecting: ${shouldReconnect}`);

      if (statusCode === DisconnectReason.loggedOut) {
        console.log('[WA-GATEWAY] Device logged out. Clearing authentication keys...');
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        } catch (e) {}
        connectedPhone = null;
        qrCodeDataUrl = null;
      }

      if (shouldReconnect) {
        setTimeout(startWhatsAppSocket, 3000);
      } else {
        setTimeout(startWhatsAppSocket, 2000);
      }
    } else if (connection === 'open') {
      isConnected = true;
      qrCodeDataUrl = null;
      rawQr = null;
      connectedPhone = sock?.user?.id ? sock.user.id.split(':')[0] : 'Salon Business Phone';
      console.log(`[WA-GATEWAY] 🟢 WhatsApp Gateway Connected successfully! Linked Phone: +${connectedPhone}`);
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    // Optionally log incoming messages or replies from customers
    if (m.type === 'notify') {
      for (const msg of m.messages) {
        if (!msg.key.fromMe && msg.message?.conversation) {
          const from = msg.key.remoteJid ? msg.key.remoteJid.replace('@s.whatsapp.net', '') : 'Unknown';
          console.log(`[WA-GATEWAY] 📩 Received customer reply from +${from}: "${msg.message.conversation}"`);
        }
      }
    }
  });
}

// Format phone number to WhatsApp JID format: e.g. 917894376562@s.whatsapp.net
function formatJid(phoneStr) {
  if (!phoneStr) return null;
  let digits = phoneStr.replace(/\D/g, '');
  if (digits.length === 10) {
    digits = '91' + digits; // Default Indian country code
  }
  return `${digits}@s.whatsapp.net`;
}

// Mini HTTP Server for REST API
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // GET /status
  if (req.method === 'GET' && url.pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        isConnected,
        phone: connectedPhone,
        qrCode: qrCodeDataUrl,
      })
    );
    return;
  }

  // POST /send
  if (req.method === 'POST' && url.pathname === '/send') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { phone, message } = JSON.parse(body || '{}');

        if (!phone || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing required fields: phone, message' }));
          return;
        }

        if (!isConnected || !sock) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: 'WhatsApp gateway is not currently connected. Please scan QR code first.',
            })
          );
          return;
        }

        const jid = formatJid(phone);
        if (!jid) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid phone number format' }));
          return;
        }

        let targetJid = jid;
        try {
          const results = await sock.onWhatsApp(jid);
          if (Array.isArray(results) && results.length > 0 && results[0]?.exists) {
            targetJid = results[0].jid;
          }
        } catch (vErr) {
          // Non-blocking fallback
        }

        console.log(`[WA-GATEWAY] 🚀 Sending background WhatsApp message to ${targetJid}...`);
        const sent = await sock.sendMessage(targetJid, { text: message });
        console.log(`[WA-GATEWAY] ✓ Message sent successfully to ${targetJid} (Msg ID: ${sent?.key?.id})`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            messageId: sent?.key?.id,
            to: targetJid,
          })
        );
      } catch (err) {
        console.error('[WA-GATEWAY] Failed to send message', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message || 'Failed to dispatch WhatsApp message' }));
      }
    });
    return;
  }

  // POST /reset (logout)
  if (req.method === 'POST' && url.pathname === '/reset') {
    try {
      if (sock) {
        await sock.logout().catch(() => {});
      }
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      isConnected = false;
      connectedPhone = null;
      qrCodeDataUrl = null;
      setTimeout(startWhatsAppSocket, 1000);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Session reset. New QR code generating...' }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[WA-GATEWAY] REST Gateway API listening on http://127.0.0.1:${PORT}`);
  startWhatsAppSocket();
});
