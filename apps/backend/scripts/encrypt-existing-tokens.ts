/**
 * Migration script to encrypt existing OAuth tokens in the Account table.
 * Run with: npx tsx scripts/encrypt-existing-tokens.ts
 *
 * Requires ENCRYPTION_KEY env var (64-char hex string).
 * Idempotent: skips values that are already encrypted.
 */
import { PrismaClient } from '@prisma/client';
import { encrypt, isEncrypted } from '../src/utils/crypto.utils.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting token encryption migration...');

  const accounts = await prisma.account.findMany({
    where: {
      OR: [
        { access_token: { not: null } },
        { refresh_token: { not: null } },
        { id_token: { not: null } },
      ],
    },
  });

  console.log(`Found ${accounts.length} accounts with tokens`);

  let encrypted = 0;
  let skipped = 0;

  for (const account of accounts) {
    const updates: Record<string, string> = {};

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
      await prisma.account.update({
        where: { id: account.id },
        data: updates,
      });
      encrypted++;
      console.log(`  Encrypted tokens for account ${account.id} (provider: ${account.provider})`);
    } else {
      skipped++;
    }
  }

  console.log(`\nMigration complete: ${encrypted} accounts encrypted, ${skipped} already encrypted/skipped`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
