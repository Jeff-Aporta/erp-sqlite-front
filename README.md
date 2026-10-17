# erp-sqlite-front

App de web components (vanilla, sin framework) sobre el kit
[iswc-root](https://github.com/Jeff-Aporta/is-webcomponents), creada con `create-iswc-app`.
Consume [`erp-sqlite-api`](https://github.com/Jeff-Aporta/erp-sqlite-api) (login y usuarios DER, db-admin).

```bash
deno install
deno task build
deno task serve        # http://127.0.0.1:4200/
deno task test:all     # gate: build, check, pin, salud, e2e
```

- Galería de componentes: `/view/demo/`. Vistas aisladas: `/view/login/`, `/view/hola/`.
- Agentes: [`AGENTS.md`](AGENTS.md). Specs: [`specs/`](specs/README.md).

## Login y sesión

| Pieza | Dónde |
|---|---|
| SDK del API (tipos + fetch) | `src/js/api/front.ts` — vendorizado con `deno task vendor:api`, no editar |
| Sesión (token, Recordar, 401, logout) | `src/js/dominio/sesion.ts` |
| Puerta de acceso | `view/login/` → `<erp-login>` envuelve `<iswc-login>` del kit |
| Enrutado por sesión | `<erp-app>`: sin sesión vigente la vista es `login` |

El API se busca en el mismo origen (`/api`); otro origen: `<meta name="erp-api" content="https://host/api">`.
DER autentica solo por `Authorization: Bearer`: el token va en `sessionStorage` (o `localStorage`
con «Recordar»). La seguridad real es del API (401/429); el front solo evita pantallas inútiles.

El SDK se toma del CDN del API, pineado en `deno.json` → `erp.apiSha`:

```bash
deno task vendor:api                    # re-vendoriza el pin actual
deno task vendor:api --sha=<sha40>      # sube el pin al commit publicado de erp-sqlite-api
deno task vendor:api --local            # desde ../erp-sqlite-api sin publicar (solo para probar)
```

## Despliegue

Submódulo `app/erp-sqlite-front/` del monorepo [`erp-sqlite`](https://github.com/Jeff-Aporta/erp-sqlite). Es
estático (`dist/cdn` va versionado: no hay build en el VPS); nginx lo sirve desde
`/opt/erp-sqlite/app/erp-sqlite-front` junto al API, con el snippet `deploy/nginx-erp-sqlite.conf` del monorepo.
