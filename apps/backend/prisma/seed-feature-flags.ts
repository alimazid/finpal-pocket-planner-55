import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const featureFlags = [
  {
    key: 'MENU_CLEAR_TRANSACTIONS',
    name: 'Clear All Transactions',
    description: 'Show/hide the "Clear All Transactions" menu item',
    isEnabled: true,
  },
  {
    key: 'MENU_CLEAR_BUDGETS',
    name: 'Clear All Budgets',
    description: 'Show/hide the "Clear All Budgets" menu item',
    isEnabled: true,
  },
  {
    key: 'MENU_EXPORT_DATA',
    name: 'Export All Data',
    description: 'Show/hide the "Export All Data" menu item',
    isEnabled: true,
  },
  {
    key: 'MENU_PERIOD_SELECTION',
    name: 'Period Selection',
    description: 'Show/hide the "Period Selection" menu item',
    isEnabled: true,
  },
  {
    key: 'MENU_GMAIL_INTEGRATION',
    name: 'Gmail Integration',
    description: 'Show/hide the "Gmail Integration" menu item',
    isEnabled: true,
  },
  {
    key: 'MENU_THEME_TOGGLE',
    name: 'Theme Toggle',
    description: 'Show/hide the "Light/Dark Theme" menu item',
    isEnabled: true,
  },
  {
    key: 'MENU_LANGUAGE_SELECTION',
    name: 'Language Selection',
    description: 'Show/hide the "Select Language" menu item',
    isEnabled: true,
  },
  {
    key: 'MENU_SIGN_OUT',
    name: 'Sign Out',
    description: 'Show/hide the "Sign Out" menu item',
    isEnabled: true,
  },
];

async function seedFeatureFlags() {
  console.log('Seeding feature flags...');

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {
        name: flag.name,
        description: flag.description,
        // Don't update isEnabled to preserve current state
      },
      create: flag,
    });
  }

  console.log('Feature flags seeded successfully!');
}

async function main() {
  await seedFeatureFlags();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });