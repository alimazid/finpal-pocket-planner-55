// screenshot-mobile.js - Capture mobile screenshots for waitlist
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();
  
  // ─── LOGIN ───────────────────────────────────────────────────────────────
  console.log('Navigating to auth page...');
  await page.goto('http://localhost:8080/auth');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  await page.fill('#signin-email', 'demo@pocketpenny.site');
  await page.fill('#signin-password', 'demo123');
  
  const loginBtn = await page.locator('button[type="submit"]').first();
  await loginBtn.click();
  
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  console.log('Logged in, at dashboard');
  
  // ─── SCREENSHOT 1: Budget Creation Wizard ────────────────────────────────
  console.log('Opening budget wizard...');
  
  // Click the add budget button (opens the BudgetWizard)
  try {
    const addBudgetBtn = page.locator('button').filter({ hasText: /add budget|agregar|presupuesto|\+/i }).first();
    const isVisible = await addBudgetBtn.isVisible();
    if (isVisible) {
      await addBudgetBtn.click();
    }
  } catch (e) {
    console.log('Could not find add budget button by text, trying alternative...');
  }
  
  await page.waitForTimeout(2000);
  
  // Check if wizard opened - look for "Budget Name" or "Nombre del Presupuesto" input
  const budgetNameInput = page.locator('input[placeholder*="Comestibles"], input[placeholder*="Groceries"], input[placeholder*="ej"]').first();
  const wizardOpen = await budgetNameInput.isVisible().catch(() => false);
  
  if (wizardOpen) {
    // Fill in realistic data: Supermercado budget
    await budgetNameInput.fill('Supermercado');
    
    // Fill amount
    const amountInput = page.locator('input[placeholder*="500"], input[type="number"]').first();
    const amountVisible = await amountInput.isVisible().catch(() => false);
    if (amountVisible) {
      await amountInput.fill('12000');
    }
    await page.waitForTimeout(1000);
    console.log('Wizard filled with data');
  } else {
    console.log('Wizard not open, screenshot as-is');
  }
  
  await page.screenshot({ 
    path: '/tmp/screenshot-budget-creation.png', 
    fullPage: false 
  });
  console.log('Budget creation screenshot saved');
  
  // ─── SCREENSHOT 2: Transaction Search ────────────────────────────────────
  console.log('Navigating to transaction search...');
  
  // Close any open modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  
  // Scroll down to find the "Transacciones Recientes" section
  // Use evaluate to scroll to the transaction list
  await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.textContent && el.textContent.includes('Transacciones Recientes')) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        break;
      }
    }
  });
  await page.waitForTimeout(1000);
  
  // Find search input - may have different placeholder
  const searchInputSelectors = [
    'input[placeholder*="buscar" i]',
    'input[placeholder*="search" i]',
    'input[placeholder*="Buscar" i]',
    'input[type="search"]',
    'input[placeholder*="transaccion" i]',
    'input[placeholder*="filtrar" i]',
  ];
  
  let searchInput = null;
  for (const selector of searchInputSelectors) {
    const el = page.locator(selector).first();
    const visible = await el.isVisible().catch(() => false);
    if (visible) {
      searchInput = el;
      console.log('Found search input with selector:', selector);
      break;
    }
  }
  
  if (!searchInput) {
    // Debug: list all inputs
    const inputs = await page.locator('input').all();
    console.log('All inputs on page:', inputs.length);
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await inputs[i].getAttribute('placeholder');
      const visible = await inputs[i].isVisible().catch(() => false);
      if (visible) console.log(`  Input ${i}: placeholder="${placeholder}"`);
    }
    
    // Try first visible input that's not email/password
    for (const input of inputs) {
      const visible = await input.isVisible().catch(() => false);
      const type = await input.getAttribute('type');
      if (visible && type !== 'email' && type !== 'password') {
        searchInput = input;
        break;
      }
    }
  }
  
  if (searchInput) {
    // Scroll into view first
    await searchInput.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await searchInput.click();
    await searchInput.fill('Super');
    await page.waitForTimeout(2000);
    console.log('Search filled with "Super"');
    
    // Now scroll to show the search results
    await searchInput.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  } else {
    console.log('No search input found');
    // Scroll to middle of page
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(1000);
  }
  
  await page.screenshot({ 
    path: '/tmp/screenshot-transaction-search.png', 
    fullPage: false 
  });
  console.log('Transaction search screenshot saved');
  
  await browser.close();
  console.log('Done!');
})().catch(async (e) => {
  console.error('Error:', e);
  process.exit(1);
});
