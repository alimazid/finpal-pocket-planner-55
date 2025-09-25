import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding currencies...');
  
  // Seed currencies
  const currencies = [
    {
      code: 'DOP',
      displayAlias: 'RD',
      name: 'Dominican Peso',
      sortOrder: 1,
      isActive: true,
    },
    {
      code: 'USD',
      displayAlias: 'US',
      name: 'US Dollar',
      sortOrder: 2,
      isActive: true,
    },
    {
      code: 'EUR',
      displayAlias: 'EU',
      name: 'Euro',
      sortOrder: 3,
      isActive: true,
    },
  ];

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: currency,
      create: currency,
    });
  }

  console.log('💱 Seeding exchange rates...');
  
  // Seed exchange rates (all pairs)
  const exchangeRates = [
    // DOP to other currencies
    { fromCurrency: 'DOP', toCurrency: 'USD', rate: 0.01587 },
    { fromCurrency: 'DOP', toCurrency: 'EUR', rate: 0.0162 },

    // USD to other currencies
    { fromCurrency: 'USD', toCurrency: 'DOP', rate: 63 },
    { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92 },
    
    // EUR to other currencies
    { fromCurrency: 'EUR', toCurrency: 'DOP', rate: 61.7 },
    { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.087 },
  ];

  for (const rate of exchangeRates) {
    await prisma.exchangeRate.upsert({
      where: {
        fromCurrency_toCurrency: {
          fromCurrency: rate.fromCurrency,
          toCurrency: rate.toCurrency,
        },
      },
      update: {
        rate: rate.rate,
        isActive: true,
      },
      create: {
        fromCurrency: rate.fromCurrency,
        toCurrency: rate.toCurrency,
        rate: rate.rate,
        isActive: true,
      },
    });
  }

  console.log('🚩 Seeding feature flags...');

  // Seed feature flags
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
      description: 'Show/hide the "Light/Dark Theme" toggle menu item',
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

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {
        name: flag.name,
        description: flag.description,
        isEnabled: flag.isEnabled,
      },
      create: flag,
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });