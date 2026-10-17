# ERP SQLite · front

App de web components (vanilla, sin framework) sobre el kit
[iswc-root](https://github.com/Jeff-Aporta/is-webcomponents), creada con `create-iswc-app`.
Consume el API del repo hermano [`api`](../api) (login y usuarios DER, db-admin).

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

`deno task vendor:api` copia `../api/dist/cdn/front.ts`; con el API publicado se pinea por CDN:
`ERP_API_SDK=https://cdn.jsdelivr.net/gh/<owner>/<repo-api>@<sha40>/dist/cdn/front.ts deno task vendor:api`.

## Despliegue

Es estático: en el VPS se clona en `/opt/erp-sqlite/front` y nginx lo sirve junto al API con el
snippet `deploy/nginx-erp-sqlite.conf` del repo `api` (que además bloquea `src/`, `tests/`, `specs/`…).

```bash
git clone <este repo> /opt/erp-sqlite/front     # dist/cdn va versionado: no hay build en el VPS
```
