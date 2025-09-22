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