# view/hola — vista de ejemplo

Vista autocontenida del estándar iswc-foundation. Reemplázala por la primera vista real de
ERP SQLite (o renómbrala) siguiendo `specs/iswc/nueva-vista.md`.

```
view/hola/
├── index.html          ← la vista sola (QA aislado), mismo kit y pin que la app
├── README.md           ← alcance y contrato (este archivo)
├── demo/index.html     ← cada sub-pieza aislada con datos de muestra
├── components/         ← <tag>.ts + .scss + .md + .json, y all.ts (barril de la vista)
└── utils/              ← dominio sin DOM (bienvenida.ts): importable y probable sin navegador
```

| Dentro | Fuera |
| --- | --- |
| Bienvenida (portada, tarjetas, modal) y el título `<erp-hola-mundo>` | Navegación (la decide `<erp-app>`) |

- **Shell**: `<erp-hola>`; la app solo conoce el shell (`SHELLS` en `erp-app.ts`).
- **Registro**: `VIEW_TAGS.hola` en `src/js/kit-tags.ts`.
- **Pruebas**: en `tests/vistas/` (unitarias de `utils/`) y `tests/e2e/` (UI con Stagehand).
- Una vista no importa componentes de otra; lo compartido sube a `src/js/components/erp/`.
