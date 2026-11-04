import mongoose from 'mongoose';
import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongodProcess = null;

function isPortOpen(host, port, timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = false;

    socket.setTimeout(timeout);
    socket.once('connect', () => {
      status = true;
      socket.destroy();
      resolve(true);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

function findMongodBinary() {
  const possiblePaths = [
    'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
    'mongod',
  ];

  for (const p of possiblePaths) {
    if (p === 'mongod' || fs.existsSync(p)) {
      return p;
    }
  }
  return 'mongod';
}

async function ensureLocalMongoRunning(port = 27017) {
  const isOpen = await isPortOpen('127.0.0.1', port);
  if (isOpen) {
    console.log(`[Database] Port ${port} is active, connecting to existing MongoDB...`);
    return true;
  }

  console.log(`[Database] No MongoDB listening on port ${port}. Attempting to launch local mongod...`);
  const mongodBin = findMongodBinary();
  const dbPath = path.resolve(__dirname, '../data/db');

  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  try {
    mongodProcess = spawn(mongodBin, ['--dbpath', dbPath, '--bind_ip', '127.0.0.1', '--port', String(port)], {
      stdio: 'inherit',
      detached: false,
    });

    mongodProcess.on('error', (err) => {
      console.warn('[Database] Failed to spawn mongod process:', err.message);
    });

    // Wait up to 10 seconds for MongoDB to start
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await isPortOpen('127.0.0.1', port)) {
        console.log('[Database] Local mongod started successfully.');
        return true;
      }
    }
  } catch (err) {
    console.warn('[Database] Error while trying to start local mongod:', err.message);
  }

  return false;
}

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/localify';

  // If local URI, try to ensure mongod is up
  if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
    const portMatch = uri.match(/:(\d+)/);
    const port = portMatch ? parseInt(portMatch[1], 10) : 27017;
    await ensureLocalMongoRunning(port);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database] MongoDB Connection Error: ${error.message}`);
    console.error('[Database] Please verify MongoDB is running or configure MONGODB_URI in .env');
    process.exit(1);
  }
};

// Graceful exit handler
process.on('SIGINT', () => {
  if (mongodProcess) {
    mongodProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (mongodProcess) {
    mongodProcess.kill();
  }
  process.exit(0);
});
