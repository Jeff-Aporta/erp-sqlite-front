# view/login — puerta de acceso

Vista que `<erp-app>` monta mientras no hay sesión. La sesión es la de DER identity del repo
`api` (JWT por header `Authorization`, bloqueo por intentos, auditoría de sesiones).

```
view/login/
├── index.html          ← la vista sola (QA aislado), mismo kit y pin que la app
├── README.md           ← este archivo
├── demo/index.html     ← login sin y con aviso
└── components/         ← erp-login.{ts,scss,md,json} + all.ts
```

| Dentro | Fuera |
| --- | --- |
| Formulario de acceso y errores del API (401, 429) | Validar credenciales (es del server) |
| Aviso informativo (`props.aviso`) | Guardar el token (lo hace `src/js/dominio/sesion.ts`) |
| | Navegar tras el login (lo decide `<erp-app>` con `alCambiar`) |

- **Shell**: `<erp-login>`; envuelve `<iswc-login>` del kit (no se reinventa el formulario).
- **Registro**: `VIEW_TAGS.login` en `src/js/kit-tags.ts`; `iswc-login` en `KIT_TAGS`.
- **Pruebas**: `tests/vistas/sesion.test.ts` (dominio, fetch falso) y `tests/e2e/02.login.test.ts`.
