import { expect, test } from '@playwright/test';

// Rodada soluções (Vitor, 12/11): the home opening must play whole on a first visit, and the LGPD
// notice shows only after it, keeps the choice and loads the analytics beacon only after "Accept".

/** Records when the opening became visible, whether it dove in, and when it closed. */
const probe = () => {
  const w = window as unknown as { __ab: { shown: number; mergulha: boolean; closed: number } };
  w.__ab = { shown: 0, mergulha: false, closed: 0 };
  document.addEventListener('DOMContentLoaded', () => {
    const ab = document.querySelector('[data-abertura]');
    if (!ab) return;
    w.__ab.shown = performance.now();
    new MutationObserver(() => ab.classList.contains('mergulha') && (w.__ab.mergulha = true)).observe(ab, { attributes: true });
    new MutationObserver(() => {
      if (!document.documentElement.classList.contains('lk-abre') && !w.__ab.closed) w.__ab.closed = performance.now();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  });
};
type Ab = { shown: number; mergulha: boolean; closed: number };

// Vitor (12/11): on clients' iPhones the opening vanished at once. It must never close before 4 s
// unless "Pular" was pressed — whatever the autoplay policy says (it is an image now, not a video).
test('opening: never closes before 4 s without "Pular", even with media autoplay refused; it ends in the dive', async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('blocked', 'NotAllowedError'));
  });
  await page.addInitScript(probe);
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/lk-abre/);
  // A tap on the overlay is not a skip.
  await page.mouse.click(300, 300);
  await page.waitForFunction(() => !document.documentElement.classList.contains('lk-abre'), null, { timeout: 30_000 });
  const r = await page.evaluate(() => (window as unknown as { __ab: Ab }).__ab);
  expect(r.closed - r.shown, 'opening closed before 4 s without "Pular"').toBeGreaterThan(4000);
  expect(r.mergulha).toBe(true);
});

test('opening: blocked sessionStorage plays it instead of skipping; "Pular" and Esc end it', async ({ browser }) => {
  for (const how of ['pular', 'esc'] as const) {
    const ctx = await browser.newContext();
    await ctx.addInitScript(() => {
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError');
        },
      });
    });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/lk-abre/);
    if (how === 'pular') await page.locator('[data-pular]').click();
    else await page.keyboard.press('Escape');
    await expect(page.locator('html')).not.toHaveClass(/lk-abre/);
    await ctx.close();
  }
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

test('CRM visit notice (?r=OP-…): nothing before "Accept"; accepting later in the session sends it once', async ({ page }) => {
  const avisos: string[] = [];
  await page.route('**/api/crm/marco', (r) => {
    avisos.push(r.request().postData() ?? '');
    return r.fulfill({ status: 204 });
  });
  await page.goto('/?sem-abertura&r=OP-0042');
  await expect(page.locator('[data-consent]')).toBeVisible();
  await page.goto('/cases');
  await page.waitForTimeout(500);
  expect(avisos, 'sent before acceptance').toHaveLength(0);
  await page.locator('[data-consent-choice="aceito"]').click();
  await expect.poll(() => avisos.length).toBe(1);
  expect(avisos[0]).toContain('"op":"OP-0042"');
  await page.goto('/recognition');
  await page.waitForTimeout(500);
  expect(avisos).toHaveLength(1);
});
