/**
 * Capture screenshots for README
 * Usage: node screenshots/capture.mjs
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'https://buywise-compare-1.preview.emergentagent.com';
const CREDS = { email: 'demo@procureai.com', password: 'Demo@123' };

const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('📸 Capturing screenshots...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(30000);

  try {
    // Login
    await page.goto(BASE, { waitUntil: 'load', timeout: 60000 });
    await wait(3000);
    await page.fill('input[type="email"]', CREDS.email);
    await page.fill('input[type="password"]', CREDS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 30000 });
    await wait(3000);

    // 1. Dashboard
    await page.screenshot({ path: path.join(__dirname, 'dashboard.png'), fullPage: false });
    console.log('✅ dashboard.png');

    // 2. Search & Compare
    await page.click('[data-testid="nav-search"]');
    await wait(2000);
    try {
      await page.click('[data-testid="category-electronics"]', { timeout: 5000 });
      await wait(500);
    } catch {}
    try {
      const input = page.locator('[data-testid="search-input"] input, input[placeholder*="e.g"]').first();
      await input.fill('UltraBook Laptop');
      await wait(300);
      await page.click('[data-testid="search-submit-button"]');
      await wait(5000);
    } catch (e) { console.warn('search:', e.message); }
    await page.screenshot({ path: path.join(__dirname, 'search-compare.png'), fullPage: false });
    console.log('✅ search-compare.png');

    // 3. AI Explanation
    try {
      const whyBtn = page.locator('button:has-text("Why this"), button:has-text("why")').first();
      if (await whyBtn.isVisible({ timeout: 3000 })) {
        await whyBtn.click();
        await wait(2000);
        await page.screenshot({ path: path.join(__dirname, 'ai-explanation.png'), fullPage: false });
        console.log('✅ ai-explanation.png');
      }
    } catch { console.warn('skipped ai-explanation'); }

    // 4. Basket Optimization
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await wait(800);
    try {
      await page.click('[data-testid="mode-basket"]', { timeout: 3000 });
      await page.click('[data-testid="category-grocery"]', { timeout: 3000 });
      await wait(2000);
      await page.screenshot({ path: path.join(__dirname, 'basket-optimization.png'), fullPage: false });
      console.log('✅ basket-optimization.png');
    } catch { console.warn('skipped basket'); }

    // 5. Business Impact (matches nav order: Dashboard → Search → Business Impact)
    await page.click('[data-testid="nav-impact"]');
    await wait(3000);
    await page.screenshot({ path: path.join(__dirname, 'business-impact.png'), fullPage: false });
    console.log('✅ business-impact.png');

    // 6. ROI Calculator (scroll down on Business Impact page)
    await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'smooth' }));
    await wait(2000);
    await page.screenshot({ path: path.join(__dirname, 'roi-calculator.png'), fullPage: false });
    console.log('✅ roi-calculator.png');

    // 7. Analytics
    await page.click('[data-testid="nav-analytics"]');
    await wait(3000);
    await page.screenshot({ path: path.join(__dirname, 'analytics.png'), fullPage: false });
    console.log('✅ analytics.png');

    // 8. Search History
    await page.click('[data-testid="nav-history"]');
    await wait(3000);
    await page.screenshot({ path: path.join(__dirname, 'history.png'), fullPage: false });
    console.log('✅ history.png');

    // 9. Watchlist
    await page.click('[data-testid="nav-watchlist"]');
    await wait(3000);
    await page.screenshot({ path: path.join(__dirname, 'watchlist.png'), fullPage: false });
    console.log('✅ watchlist.png');

    // 10. Settings
    await page.click('[data-testid="nav-settings"]');
    await wait(3000);
    await page.screenshot({ path: path.join(__dirname, 'settings.png'), fullPage: false });
    console.log('✅ settings.png');

    // 11. Documentation
    await page.click('[data-testid="nav-docs"]');
    await wait(3000);
    await page.screenshot({ path: path.join(__dirname, 'docs.png'), fullPage: false });
    console.log('✅ docs.png');

  } catch (e) {
    console.error('Error:', e.message);
  }

  await browser.close();
  console.log('🎉 All screenshots captured in screenshots/ folder');
})();
