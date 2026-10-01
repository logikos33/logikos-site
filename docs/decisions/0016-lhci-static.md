**Lighthouse CI mede o dist/ com o servidor estático do próprio LHCI** — o astro preview do Astro 7 é singleton e travava a coleta; reverter: collect.startServerCommand em lighthouserc.cjs.
