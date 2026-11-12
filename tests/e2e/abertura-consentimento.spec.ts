import { expect, test } from '@playwright/test';

// Rodada soluções (Vitor, 12/11): the home opening must play whole on a first visit, and the LGPD
// notice shows only after it, keeps the choice and loads the analytics beacon only after "Accept".

const probe = () => {
  const w = window as unknown as { __ab: { max: number; mergulha: boolean } };
  w.__ab = { max: 0, mergulha: false };
  document.addEventListener('DOMContentLoaded', () => {
    const ab = document.querySelector('[data-abertura]');
    const v = ab?.querySelector('video');
    if (!ab || !v) return;
    v.addEventListener('timeupdate', () => (w.__ab.max = Math.max(w.__ab.max, v.currentTime)));
    // Chrome and Safari fire 'stalled' on a clip already downloaded: it used to cut the opening at 3 s.
    v.addEventListener('playing', () => setTimeout(() => v.dispatchEvent(new Event('stalled')), 800), { once: true });
    new MutationObserver(() => ab.classList.contains('mergulha') && (w.__ab.mergulha = true)).observe(ab, { attributes: true });
  });
};

test('opening: plays whole despite a spurious "stalled", a tap on it does not skip, "Pular" does', async ({
  page,
  browser,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'clip codec');
  test.setTimeout(60_000);
  await page.addInitScript(probe);
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/lk-abre/);
  await page.mouse.click(300, 300);
  await page.waitForFunction(() => !document.documentElement.classList.contains('lk-abre'), null, { timeout: 30_000 });
  const r = await page.evaluate(() => (window as unknown as { __ab: { max: number; mergulha: boolean } }).__ab);
  expect(r.max).toBeGreaterThan(4.4);
  expect(r.mergulha).toBe(true);

  const ctx = await browser.newContext();
  const p2 = await ctx.newPage();
  await p2.goto(page.url());
  await expect(p2.locator('html')).toHaveClass(/lk-abre/);
  await p2.locator('[data-pular]').click();
  await expect(p2.locator('html')).not.toHaveClass(/lk-abre/);
  await ctx.close();
});

test('opening: a refused autoplay keeps the poster with a play button instead of skipping', async ({ page }) => {
  await page.addInitScript(() => {
    // A refused autoplay refuses both paths: play() and the autoplay attribute.
    HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('blocked', 'NotAllowedError'));
    Object.defineProperty(HTMLMediaElement.prototype, 'autoplay', { set() {}, get: () => false });
  });
  await page.goto('/');
  await expect(page.locator('[data-tocar]')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('html')).toHaveClass(/lk-abre/);
});

test('consent: never over the opening; the choice is kept; "Cookie preferences" reopens it', async ({ page }) => {
  const beacon: string[] = [];
  await page.route(/cloudflareinsights\.com/, (r) => {
    beacon.push(r.request().url());
    return r.abort();
  });
  const bar = page.locator('[data-consent]');
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/lk-abre/);
  await expect(bar).toBeHidden();
  await page.locator('[data-pular]').click();
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute('role', 'region');
  expect(beacon).toHaveLength(0);
  await bar.locator('[data-consent-choice="recusado"]').click();
  await expect(bar).toBeHidden();
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('lk-consentimento'))) ?? '{}').valor).toBe('recusado');
  await page.goto('/recognition');
  await expect(bar).toBeHidden();
  expect(beacon).toHaveLength(0);
  await page.locator('[data-consent-open]').click();
  await expect(bar).toBeVisible();
  await expect(bar.locator('[data-consent-choice="aceito"]')).toBeFocused();
  await bar.locator('[data-consent-choice="aceito"]').click();
  await expect(bar).toBeHidden();
  // The beacon exists only in builds with an analytics token; there it loads right after "Accept".
  const token = await page.locator('[data-consent]').getAttribute('data-token');
  if (token) await expect.poll(() => beacon.length).toBeGreaterThan(0);
});

test('consent at 360 px: above the shortcut bar, nothing shifts', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => {
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[])
        if (!e.hadRecentInput) w.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  const page = await ctx.newPage();
  await page.goto('/?sem-abertura');
  await expect(page.locator('[data-consent]')).toBeVisible();
  await page.waitForTimeout(800);
  const [consent, shortcut] = await Promise.all(
    ['[data-consent]', '[data-barra]'].map((s) => page.locator(s).evaluate((e) => e.getBoundingClientRect().toJSON())),
  );
  expect(consent.bottom).toBeLessThanOrEqual(shortcut.top + 1);
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.01);
  await ctx.close();
});
