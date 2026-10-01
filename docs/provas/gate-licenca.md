# Prova do gate de licença

Executada em 01/10/2026 no contêiner da rodada (Node 22.22.0, pnpm 10.28.0). Os dois commits descartáveis ficaram no branch local `descartavel/prova-gate-licenca`, apagado depois da prova (não existem no histórico de `main`).

## 1. Dependência GPL direta em `dependencies` — commit descartável `7d385e5`

Pacote: `@wordpress/escape-html@3.56.0` (GPL-2.0-or-later).

```text
> logikos-site@0.1.0 gate:license /home/user/logikos-site
> node scripts/license-gate.mjs
license-gate: dev-only exception @img/sharp-libvips-linux-x64 (LGPL-3.0-or-later) — LGPL-3.0-or-later — wrangler → miniflare → sharp (local emulation of the Images binding). Dynamic library in a local dev server; never bundled or deployed.
license-gate: dev-only exception @img/sharp-libvips-linuxmusl-x64 (LGPL-3.0-or-later) — LGPL-3.0-or-later — same path as above (musl build).
license-gate: 4 served package(s): @fontsource-variable/inter (OFL-1.1), @fontsource-variable/jetbrains-mono (OFL-1.1), @fontsource-variable/space-grotesk (OFL-1.1), @wordpress/escape-html (GPL-2.0-or-later)
license-gate: 755 package(s) in the whole tree checked against the copyleft denylist.
license-gate: FAIL
SERVED  @wordpress/escape-html: GPL-2.0-or-later (not in allowlist)
 ELIFECYCLE  Command failed with exit code 1.
gate_exit=1
```

## 2. GPL só em `devDependencies`, mas importada num script do navegador — commit descartável `0716638`

Mostra que o gate mede o bundle real (plugin `scripts/lib/served-packages.ts`), não só o `package.json`.

```text
> logikos-site@0.1.0 gate:license /home/user/logikos-site
> node scripts/license-gate.mjs
license-gate: 4 served package(s): @fontsource-variable/inter (OFL-1.1), @fontsource-variable/jetbrains-mono (OFL-1.1), @fontsource-variable/space-grotesk (OFL-1.1), @wordpress/escape-html (GPL-2.0-or-later)
license-gate: 755 package(s) in the whole tree checked against the copyleft denylist.
license-gate: FAIL
SERVED  @wordpress/escape-html: GPL-2.0-or-later (not in allowlist)
 ELIFECYCLE  Command failed with exit code 1.
gate_exit=1
```

## 3. Depois de remover (main `9a16ab1`)

```text
> logikos-site@0.1.0 gate:license /home/user/logikos-site
> node scripts/license-gate.mjs
license-gate: dev-only exception @img/sharp-libvips-linux-x64 (LGPL-3.0-or-later) — LGPL-3.0-or-later — wrangler → miniflare → sharp (local emulation of the Images binding). Dynamic library in a local dev server; never bundled or deployed.
license-gate: dev-only exception @img/sharp-libvips-linuxmusl-x64 (LGPL-3.0-or-later) — LGPL-3.0-or-later — same path as above (musl build).
license-gate: 3 served package(s): @fontsource-variable/inter (OFL-1.1), @fontsource-variable/jetbrains-mono (OFL-1.1), @fontsource-variable/space-grotesk (OFL-1.1)
license-gate: 754 package(s) in the whole tree checked against the copyleft denylist.
license-gate: PASS
gate_exit=0
```
