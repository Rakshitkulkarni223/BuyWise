/**
 * ProcureAI — Demo Video Recorder
 *
 * Records a full walkthrough with Netflix-style captions.
 * Usage:  node demo/record-demo.mjs
 * Output: demo/procureai-demo.webm
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE = 'https://buywise-compare-1.preview.emergentagent.com';
const CREDS = { email: 'demo@procureai.com', password: 'Demo@123' };
const VIDEO_DIR = path.resolve(__dirname);

/* ── Caption overlay ── */
async function caption(page, text, ms = 3500) {
  try {
    await page.evaluate(({ text, ms }) => {
      let el = document.getElementById('__cap');
      if (!el) {
        el = document.createElement('div');
        el.id = '__cap';
        Object.assign(el.style, {
          position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
          zIndex: '999999', background: 'rgba(0,0,0,0.85)', color: '#fff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '17px', fontWeight: '600', padding: '12px 28px', borderRadius: '10px',
          textAlign: 'center', maxWidth: '80vw', lineHeight: '1.45', letterSpacing: '0.2px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.5)', transition: 'opacity 0.35s', opacity: '0',
          pointerEvents: 'none',
        });
        document.body.appendChild(el);
      }
      el.textContent = text;
      el.style.opacity = '1';
      setTimeout(() => { el.style.opacity = '0'; }, ms - 350);
    }, { text, ms });
    await wait(ms);
  } catch (e) { console.warn('caption:', e.message); }
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ── Navigate via sidebar ── */
async function nav(page, testid) {
  try {
    await page.click(`[data-testid="${testid}"]`);
    await wait(2500);
  } catch {
    console.warn(`nav fallback for ${testid}`);
  }
}

/* ══════════════════════════════════════════════
   MAIN FLOW
   ══════════════════════════════════════════════ */
(async () => {
  console.log('🎬 Starting ProcureAI demo recording...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    /* ── 1. LOGIN ── */
    await page.goto(BASE, { waitUntil: 'load', timeout: 60000 });
    await wait(5000);
    await caption(page, '🔐 Logging in to ProcureAI with secure credentials', 3500);

    await page.fill('input[type="email"]', CREDS.email);
    await wait(500);
    await page.fill('input[type="password"]', CREDS.password);
    await wait(500);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 30000 });
    await wait(3000);

    /* ── 2. DASHBOARD ── */
    await caption(page, '📊 Home Dashboard — Real-time procurement KPIs, savings estimates, and AI insights', 5000);
    await wait(2000);
    await page.evaluate(() => window.scrollTo({ top: 350, behavior: 'smooth' }));
    await wait(2500);
    await caption(page, '🤖 AI Insights — Smart suggestions generated from your procurement patterns', 4500);
    await wait(2000);

    // Date range filter
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await wait(1000);
    await caption(page, '📅 Date Range Filter — Instantly view KPIs for any period (7/30/90 days or custom)', 4500);
    try {
      await page.locator('button:has-text("Last 30 days")').click({ timeout: 3000 });
      await wait(3000);
      await caption(page, '✅ All metrics, charts, and insights dynamically update to the selected period', 4500);
      await page.locator('button:has-text("All Time")').click({ timeout: 3000 });
      await wait(2000);
    } catch { /* skip */ }

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await wait(1000);

    /* ── 3. SEARCH & COMPARE ── */
    await caption(page, '🔍 Search & Compare — The core of ProcureAI', 3000);
    await nav(page, 'nav-search');
    await wait(1500);

    await caption(page, '🔍 One search queries Amazon, Flipkart, and more — replacing hours of manual comparison', 4500);

    // Pick electronics category
    try {
      await page.click('[data-testid="category-electronics"]', { timeout: 5000 });
      await wait(1000);
    } catch { /* first category auto-selected */ }

    // Type query into search suggestions input
    try {
      const input = page.locator('[data-testid="search-input"] input, input[placeholder*="e.g"]').first();
      await input.click();
      await input.fill('');
      await wait(300);
      await input.type('UltraBook Laptop', { delay: 90 });
      await wait(1200);
      await caption(page, '⌨️ Smart autocomplete suggests products as you type', 3000);
      await wait(1500);
    } catch (e) { console.warn('search input:', e.message); }

    // Submit search
    try {
      await page.click('[data-testid="search-submit-button"]');
      await wait(6000);
    } catch (e) { console.warn('search submit:', e.message); }

    await caption(page, '🏆 AI Recommendation — Best supplier identified with confidence score and estimated savings', 5000);
    await page.evaluate(() => window.scrollTo({ top: 350, behavior: 'smooth' }));
    await wait(2500);

    // "Why this recommendation?" panel
    try {
      const whyBtn = page.locator('button:has-text("Why this"), button:has-text("why")').first();
      if (await whyBtn.isVisible({ timeout: 3000 })) {
        await whyBtn.click();
        await wait(2000);
        await caption(page, '🧠 Explainable AI — Radar chart shows factor scores: price, delivery, rating, discount', 5000);
        await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
        await wait(2500);
        await caption(page, '📊 Supplier Scoreboard — Every vendor ranked with weighted scores out of 100', 4500);
        await wait(2500);
      }
    } catch { /* skip */ }

    // Scroll to comparison table & watchlist
    await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'smooth' }));
    await wait(2000);
    await caption(page, '� Full comparison table — Sort by price, rating, delivery. Export as CSV or PDF', 5000);
    await wait(2000);

    // Add first product to watchlist
    try {
      const eyeBtn = page.locator('button[title="Add to watchlist"]').first();
      if (await eyeBtn.isVisible({ timeout: 3000 })) {
        await eyeBtn.click();
        await wait(1000);
        await caption(page, '👁️ Product added to Watchlist — Set target prices and track across sessions', 4000);
        await wait(1500);
      }
    } catch { /* skip */ }

    await wait(1000);

    /* ── 4. BASKET OPTIMISER ── */
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await wait(1000);
    try {
      await page.click('[data-testid="mode-basket"]', { timeout: 3000 });
      await wait(1000);
      await page.click('[data-testid="category-grocery"]', { timeout: 3000 });
      await wait(1500);
      await caption(page, '🛒 Basket Optimiser — Buy multiple items? AI finds the cheapest way to split across suppliers', 5500);
      await wait(3000);
      await caption(page, '� Split Plan vs Consolidate — AI decides: buy from multiple vendors or one for best value', 5000);
      await wait(2500);
    } catch { /* skip */ }

    /* ── 5. BUSINESS IMPACT ── */
    await caption(page, '� Business Impact — Measuring real procurement transformation', 3500);
    await nav(page, 'nav-impact');
    await wait(2500);
    await caption(page, '� Six key metrics: Total Savings, Hours Saved, AI Accuracy, Efficiency Score & more', 5500);
    await page.evaluate(() => window.scrollTo({ top: 350, behavior: 'smooth' }));
    await wait(2500);

    // Date range on impact page
    try {
      await page.locator('button:has-text("Last 30 days")').click({ timeout: 3000 });
      await wait(3000);
      await caption(page, '📅 Filter by date — See business impact for any period at a glance', 4000);
      await page.locator('button:has-text("All Time")').click({ timeout: 3000 });
      await wait(2000);
    } catch { /* skip */ }

    // Scroll to Before vs After
    await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'smooth' }));
    await wait(2000);
    await caption(page, '⚡ Before vs After — 8-step manual process (45 min) → 5-step AI workflow (3 min) = 93% faster', 5500);
    await wait(3000);

    // Scroll to ROI Calculator
    await page.evaluate(() => window.scrollTo({ top: 1100, behavior: 'smooth' }));
    await wait(2000);
    await caption(page, '🧮 ROI Calculator — Input your team size, hourly cost, and purchases to project savings', 5500);

    // Interact with a slider
    try {
      const slider = page.locator('input[type="range"]').first();
      if (await slider.isVisible({ timeout: 2000 })) {
        await slider.fill('500');
        await wait(2000);
        await caption(page, '� Real-time projections: Monthly hours saved, salary savings, and annual cost reduction', 5000);
        await wait(2000);
      }
    } catch { /* skip */ }

    await wait(1500);

    /* ── 6. ANALYTICS ── */
    await caption(page, '📈 Analytics — Deep-dive into spending patterns and supplier performance', 3500);
    await nav(page, 'nav-analytics');
    await caption(page, '📈 Visual charts: Spend Trend, Category Breakdown, Supplier Usage, Savings over time', 5500);
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
    await wait(3000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await wait(1500);

    /* ── 7. HISTORY ── */
    await caption(page, '📜 Search History — Every successful procurement search, automatically logged', 3500);
    await nav(page, 'nav-history');
    await caption(page, '📜 Browse past searches, expand basket details — paginated at 15 per page', 4500);
    await wait(3000);

    /* ── 8. WATCHLIST ── */
    await caption(page, '👁️ Price Watchlist — Monitor products and get notified when prices drop', 3500);
    await nav(page, 'nav-watchlist');
    await wait(2000);
    await caption(page, '🎯 Set target prices for any product — items hitting target are highlighted green', 4500);
    await wait(3000);

    /* ── 9. SETTINGS ── */
    await caption(page, '⚙️ Settings — Customize ProcureAI for your business type', 3000);
    await nav(page, 'nav-settings');
    await caption(page, '⚙️ Weight Profiles: Balanced, Startup, Hospital, Restaurant — AI adapts to your priorities', 5000);
    await wait(3000);

    /* ── 10. DOCS ── */
    await caption(page, '📖 Built-in Documentation — No external wiki needed', 3000);
    await nav(page, 'nav-docs');
    await caption(page, '📖 General guide for business users + Developer API reference with code examples', 5000);
    await wait(3000);

    // Toggle dark mode
    try {
      const themeBtn = page.locator('button[title="Toggle theme"], button:has-text("🌙"), button:has-text("☀")').first();
      if (await themeBtn.isVisible({ timeout: 2000 })) {
        await themeBtn.click();
        await wait(2000);
        await caption(page, '🌙 Dark Mode — Full theme system with CSS variables for seamless switching', 4500);
        await wait(2500);
      }
    } catch { /* skip */ }

    /* ── OUTRO ── */
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await wait(1000);
    await caption(page, '✨ ProcureAI — Transforming procurement with AI. 93% faster. Smarter decisions. Real savings.', 6000);
    await wait(3500);

  } catch (e) {
    console.error('Demo error:', e.message);
  }

  await context.close();
  await browser.close();

  console.log('✅ Demo recorded! Check demo/ folder for the .webm file.');
})();
