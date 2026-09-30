import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const PORT = process.env.PORT || 3000;
const GATEWAY_PORT = process.env.GATEWAY_PORT || 3001;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  PRIZM Salon Production Orchestrator');
console.log(`  Web Port: ${PORT} | Gateway Port: ${GATEWAY_PORT}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. Start WhatsApp Gateway on port 3001
const gatewayProcess = spawn('node', ['server/whatsapp-gateway.mjs'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, PORT: GATEWAY_PORT.toString() },
});

gatewayProcess.on('error', (err) => {
  console.error('[PROD] Failed to start WhatsApp Gateway:', err);
});

// 2. Start Next.js on port 3000
const nextProcess = spawn('npx', ['next', 'start', '-p', PORT.toString()], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, PORT: PORT.toString() },
});

nextProcess.on('error', (err) => {
  console.error('[PROD] Failed to start Next.js application:', err);
});

// Graceful shutdown
function shutdown() {
  console.log('\n[PROD] Shutting down PRIZM Salon services...');
  try { gatewayProcess.kill('SIGTERM'); } catch (e) {}
  try { nextProcess.kill('SIGTERM'); } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
