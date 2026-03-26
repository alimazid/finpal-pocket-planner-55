// seed-demo.js - Create demo user with transactions and budgets
const { PrismaClient } = require('./node_modules/.prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://finpal:finpal123@localhost:5434/pocketpenny'
    }
  }
});

async function seed() {
  console.log('Starting seed...');

  // Create demo user (passwordHash for "demo123" using bcrypt-compatible hash)
  // Using a pre-computed bcrypt hash for "demo123"
  const user = await prisma.user.upsert({
    where: { email: 'demo@pocketpenny.site' },
    update: { name: 'Demo User' },
    create: {
      email: 'demo@pocketpenny.site',
      name: 'Demo User',
      passwordHash: '$2a$10$jguRMG7PVBtpaYzL.tHhWullxv20c/t8WYLJHtNzX3OTbnUW9NIgW', // "demo123"
      emailVerified: new Date(),
    }
  });
  console.log('User created:', user.id);

  // Create user preferences
  await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      language: 'spanish',
      periodType: 'calendar_month',
      defaultCurrency: 'DOP',
    }
  });

  // Create budget categories
  const categories = [
    { name: 'Supermercado', sortOrder: 1 },
    { name: 'Transporte', sortOrder: 2 },
    { name: 'Restaurantes', sortOrder: 3 },
    { name: 'Entretenimiento', sortOrder: 4 },
    { name: 'Servicios', sortOrder: 5 },
    { name: 'Salud', sortOrder: 6 },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const category = await prisma.budgetCategory.upsert({
      where: { userId_name: { userId: user.id, name: cat.name } },
      update: {},
      create: {
        userId: user.id,
        name: cat.name,
        sortOrder: cat.sortOrder,
      }
    });
    createdCategories.push(category);
    console.log('Category created:', category.name, category.id);
  }

  // Create budgets for current month (March 2026)
  const currentYear = 2026;
  const currentMonth = 3;
  const budgetAmounts = {
    'Supermercado': { amount: 12000, spent: 8500 },
    'Transporte': { amount: 5000, spent: 3200 },
    'Restaurantes': { amount: 6000, spent: 4100 },
    'Entretenimiento': { amount: 3000, spent: 1500 },
    'Servicios': { amount: 4500, spent: 4200 },
    'Salud': { amount: 2000, spent: 600 },
  };

  for (const cat of createdCategories) {
    const budgetData = budgetAmounts[cat.name];
    if (budgetData) {
      await prisma.budget.upsert({
        where: {
          userId_categoryId_targetYear_targetMonth: {
            userId: user.id,
            categoryId: cat.id,
            targetYear: currentYear,
            targetMonth: currentMonth,
          }
        },
        update: { amount: budgetData.amount, spent: budgetData.spent, currency: 'DOP' },
        create: {
          userId: user.id,
          categoryId: cat.id,
          amount: budgetData.amount,
          spent: budgetData.spent,
          currency: 'DOP',
          targetYear: currentYear,
          targetMonth: currentMonth,
        }
      });
    }
  }
  console.log('Budgets created');

  // Create transactions for the past 30 days
  const transactions = [
    { description: 'Super Nacional - Compras semanales', amount: 3200, category: 'Supermercado', date: new Date('2026-03-18'), type: 'expense', currency: 'DOP' },
    { description: 'La Sirena - Artículos del hogar', amount: 1850, category: 'Supermercado', date: new Date('2026-03-15'), type: 'expense', currency: 'DOP' },
    { description: 'Jumbo - Compras mensuales', amount: 3450, category: 'Supermercado', date: new Date('2026-03-10'), type: 'expense', currency: 'DOP' },
    { description: 'OMSA - Pasaje bus', amount: 50, category: 'Transporte', date: new Date('2026-03-19'), type: 'expense', currency: 'DOP' },
    { description: 'Uber - Santo Domingo', amount: 450, category: 'Transporte', date: new Date('2026-03-17'), type: 'expense', currency: 'DOP' },
    { description: 'Gasolina - Shell Piantini', amount: 2700, category: 'Transporte', date: new Date('2026-03-12'), type: 'expense', currency: 'DOP' },
    { description: 'El Conuco - Almuerzo', amount: 1200, category: 'Restaurantes', date: new Date('2026-03-18'), type: 'expense', currency: 'DOP' },
    { description: 'Marrakech - Cena', amount: 2100, category: 'Restaurantes', date: new Date('2026-03-14'), type: 'expense', currency: 'DOP' },
    { description: 'Pat e Palo - Comida', amount: 800, category: 'Restaurantes', date: new Date('2026-03-11'), type: 'expense', currency: 'DOP' },
    { description: 'Blue Mall - Cine', amount: 750, category: 'Entretenimiento', date: new Date('2026-03-16'), type: 'expense', currency: 'DOP' },
    { description: 'Spotify Premium', amount: 450, category: 'Entretenimiento', date: new Date('2026-03-01'), type: 'expense', currency: 'DOP' },
    { description: 'Netflix', amount: 300, category: 'Entretenimiento', date: new Date('2026-03-01'), type: 'expense', currency: 'DOP' },
    { description: 'EDENORTE - Luz eléctrica', amount: 2800, category: 'Servicios', date: new Date('2026-03-05'), type: 'expense', currency: 'DOP' },
    { description: 'CAASD - Agua', amount: 450, category: 'Servicios', date: new Date('2026-03-05'), type: 'expense', currency: 'DOP' },
    { description: 'Altice Internet', amount: 950, category: 'Servicios', date: new Date('2026-03-02'), type: 'expense', currency: 'DOP' },
    { description: 'Farmacia Carol - Medicamentos', amount: 600, category: 'Salud', date: new Date('2026-03-13'), type: 'expense', currency: 'DOP' },
    { description: 'Salario mensual', amount: 85000, category: null, date: new Date('2026-03-01'), type: 'income', currency: 'DOP' },
  ];

  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: tx.amount,
        description: tx.description,
        category: tx.category,
        date: tx.date,
        type: tx.type,
        currency: tx.currency,
      }
    });
  }
  console.log('Transactions created:', transactions.length);

  // Add currencies
  const currencies = [
    { code: 'DOP', displayAlias: 'RD$', name: 'Peso Dominicano', sortOrder: 1 },
    { code: 'USD', displayAlias: 'US$', name: 'Dólar Americano', sortOrder: 2 },
  ];

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {},
      create: currency,
    });
  }

  // Add exchange rates
  await prisma.exchangeRate.upsert({
    where: { fromCurrency_toCurrency: { fromCurrency: 'USD', toCurrency: 'DOP' } },
    update: { rate: 60.5 },
    create: { fromCurrency: 'USD', toCurrency: 'DOP', rate: 60.5 },
  });
  await prisma.exchangeRate.upsert({
    where: { fromCurrency_toCurrency: { fromCurrency: 'DOP', toCurrency: 'USD' } },
    update: { rate: 0.01653 },
    create: { fromCurrency: 'DOP', toCurrency: 'USD', rate: 0.01653 },
  });

  console.log('Seed completed successfully!');
  console.log('Login with: demo@pocketpenny.site');
  
  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
