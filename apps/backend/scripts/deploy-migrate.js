/**
 * Deploy migration script for Pocket Planner backend.
 * Runs on every deploy (idempotent) — after prisma migrations, before server start.
 *
 * Encrypts existing unencrypted OAuth tokens in the Account table.
 *
 * Uses plain Node.js (no TypeScript) so it runs directly in the Docker container.
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Inline crypto functions (mirrors src/utils/crypto.utils.ts)
// ---------------------------------------------------------------------------
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string');
  }
  return Buffer.from(key, 'hex');
}

function encrypt(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function isEncrypted(value) {
  if (!value || typeof value !== 'string') return false;
  return /^[a-f0-9]{24}:[a-f0-9]{32}:[a-f0-9]+$/.test(value);
}

// ---------------------------------------------------------------------------
// Migration: encrypt existing Account tokens
// ---------------------------------------------------------------------------
async function main() {
  console.log('🔄 Running deploy migration...');

  if (!process.env.ENCRYPTION_KEY) {
    console.log('⚠️  ENCRYPTION_KEY not set, skipping encryption migration');
    return;
  }

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('=== Encrypting existing Account tokens ===');

    const accounts = await prisma.account.findMany({
      where: {
        OR: [
          { access_token: { not: null } },
          { refresh_token: { not: null } },
          { id_token: { not: null } },
        ],
      },
    });

    let encrypted = 0;
    for (const account of accounts) {
      const updates = {};
      if (account.access_token && !isEncrypted(account.access_token)) {
        updates.access_token = encrypt(account.access_token);
      }
      if (account.refresh_token && !isEncrypted(account.refresh_token)) {
        updates.refresh_token = encrypt(account.refresh_token);
      }
      if (account.id_token && !isEncrypted(account.id_token)) {
        updates.id_token = encrypt(account.id_token);
      }

      if (Object.keys(updates).length > 0) {
        await prisma.account.update({ where: { id: account.id }, data: updates });
        encrypted++;
      }
    }

    console.log(`  Accounts encrypted: ${encrypted}/${accounts.length}`);
    console.log('✅ Deploy migration complete');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('❌ Deploy migration failed:', e.message);
  // Don't exit(1) — allow server to start even if migration fails
});
