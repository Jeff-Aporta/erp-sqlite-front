> **Estado (2026-10-17):** este spec nació antes de separar los repos. Hoy: el server es el repo
> `../api` (DER por CDN) y esta app es el front (`create-iswc-app`, prefijo `erp-`, decisión abierta 5
> resuelta). El SDK se vendoriza en `src/js/api/front.ts` y **la auth es solo por Bearer, no cookie**
> (regla 4 del §2 superada). Fases 0–2 hechas; fase 3: login hecho, falta el navegador de objetos.

# Administrador SQLite — especificación bajo el stack

> Objetivo: reemplazar la UI hecha a mano por una app `iswc-base` (front Deno + web components)
> consumiendo un server Deno con DER, sin reinventar nada que ya exista en ISWC o DER.
>
> Este documento manda sobre la implementación. La guía HeidiSQL es referencia funcional,
> no tecnológica: se simplifica y ajusta al stack.

## 1. Reparto de responsabilidades

```
┌─────────────────────────────┐      ┌──────────────────────────────┐
│ SERVER (Deno)               │      │ FRONT (app iswc-base)        │
│                             │      │                              │
│ DER: entidades fijas        │      │ view/<v>/ + <isw-*> + iswc-* │
│  - catalogos, historial,    │      │                              │
│    consultas guardadas      │◄────►│ vendor/front.ts (SDK client) │
│  - identity + permissions   │ CDN  │                              │
│                             │      │ SOLO web components          │
│ db-admin (genérico):        │      │ sin HTML suelto              │
│  - introspección sqlite     │      │ sin framework, sin build     │
│  - lectura/escritura filas  │      │ reusar SIEMPRE iswc-*        │
│  - ejecución SQL controlada │      │                              │
└─────────────────────────────┘      └──────────────────────────────┘
```

### Por qué hay dos capas en el server

| Capa | Qué modela | Herramienta |
|---|---|---|
| **DER** | Entidades **fijas** del dominio (lista de DBs, historial, queries guardadas, usuarios) | `defineEntity` + `ServerController` |
| **db-admin** | Esquema **arbitrario** de cada `.sqlite` (tablas que el usuario crea) | controller genérico con introspección |

DER no sirve para tablas dinámicas (no conoces el schema en compile time). Por eso el admin
usa DER para el catálogo y un controller genérico para el contenido de cada archivo.

## 2. Contrato `front.ts` (server → CDN → vendor)

El server publica en `dist/cdn/front.ts` (y `.js`) un **SDK de cliente** que el front vendoriza:

```ts
// front.ts — tipos + controllers de fetch, sin lógica de UI
export const API = {
  login:            (u: string, p: string) => POST("/api/login", { usuario: u, password: p }),
  logout:           () => DELETE("/api/logout"),
  me:               () => GET("/api/permisos"),

  // catálogo
  databases:        () => GET("/api/databases"),
  database:         (db) => GET(`/api/databases/${db}`),
  createDatabase:   (nombre) => POST("/api/databases", { nombre }),
  deleteDatabase:   (db) => DELETE(`/api/databases/${db}`),
  vacuum:           (db) => POST(`/api/databases/${db}/vacuum`),
  integrityCheck:   (db) => POST(`/api/databases/${db}/integrity`),
  stats:            (db) => GET(`/api/databases/${db}/stats`),

  // objetos
  objects:          (db) => GET(`/api/databases/${db}/objects`),   // tables|views|indexes|triggers
  columns:          (db, tabla) => GET(`/api/databases/${db}/${tabla}/columns`),

  // filas (grid)
  rows:             (db, tabla, q) => POST(`/api/databases/${db}/${tabla}/rows`, q),
  updateRow:        (db, tabla, q) => PATCH(`/api/databases/${db}/${tabla}/rows`, q),
  insertRow:        (db, tabla, fila) => POST(`/api/databases/${db}/${tabla}/row`, fila),
  deleteRow:        (db, tabla, q) => DELETE(`/api/databases/${db}/${tabla}/row`, q),
  truncate:         (db, tabla) => POST(`/api/databases/${db}/${tabla}/truncate`),

  // schema
  alterTable:       (db, tabla, cambios) => PUT(`/api/databases/${db}/${tabla}/schema`, cambios),
  previewSql:       (db, cambios) => POST(`/api/databases/${db}/schema/preview`, cambios),

  // SQL libre
  query:            (db, sql) => POST(`/api/databases/${db}/query`, { sql }),
  history:          () => GET("/api/queries/history"),

  // import/export
  export:           (db, tabla, formato) => GET(`/api/databases/${db}/export?tabla=..&formato=..`),
  import:           (db, tabla, formato, datos) => POST(`/api/databases/${db}/import`, { tabla, formato, datos }),
};
```

Reglas del contrato:

1. **Tipos Zod** en el server; el front importa el `.ts` vendorizado, no re-declara tipos.
2. Todo pasa por `ClientController`/fetch del SDK: nada de `fetch` suelto en componentes.
3. El SDK no conoce la UI; no importa `iswc-*`.
4. La cookie JWT viaja sola (`credentials: include`); el front no toca tokens.

## 3. Features → componentes ISWC (reusar, no reinventar)

### 3.1 Navegador de objetos

| Necesidad | Componente |
|---|---|
| Panel lateral + contenido | `iswc-split-panel` |
| Árbol tablas/vistas/índices/triggers | `iswc-tree-view` + `iswc-tree` + `iswc-tree-item` |
| Filtro rápido | `iswc-input` (o `iswc-command-palette` para búsqueda global) |
| Menú por objeto | `iswc-context-menu` + `iswc-dropdown`/`iswc-dropdown-item` |
| Iconos de tipo | `iswc-icon` (`mdi:table`, `mdi:view-dashboard`, `mdi:key`, `mdi:flash`) |
| Contadores | `iswc-badge` |
| Confirmaciones destructivas | `iswc-confirm-modal` / `iswc-confirm-delete` |

### 3.2 Cuadrícula de datos

| Necesidad | Componente |
|---|---|
| Grid con filas/columnas | `iswc-data-grid` (o `iswc-ag-grid` si se requiere virtualización) |
| Edición inline | `iswc-inline-edit` (unido a `iswc-data-grid`) |
| Paginación y tamaño de lote | `iswc-pager` + `iswc-select` |
| Filtros por columna | `iswc-select` (operador) + `iswc-input` (valor) |
| Ordenamiento | API de `iswc-data-grid` (sort por columna) |
| NULL / datetime / JSON | `iswc-format` (`type=date|number|json`), `iswc-tag` para NULL |
| Carga | `iswc-skeleton` + `iswc-loading-overlay` |
| Feedback | `iswc-toast` |
| Ayuda contextual | `iswc-tooltip` |

### 3.3 Consola SQL multi-pestaña

| Necesidad | Componente |
|---|---|
| Pestañas | `iswc-tab-group` + `iswc-tab` + `iswc-tab-panel` |
| Editor con resaltado | `iswc-code` (syntax highlight + `pre.code`) |
| Historial | `iswc-dropdown` con `iswc-dropdown-item` |
| Ejecutar selección | `iswc-button` + selección del `iswc-code` |
| Copiar | `iswc-copy-button` |
| Resultado | `iswc-data-grid` reutilizado |

### 3.4 Diseñador de esquema

| Necesidad | Componente |
|---|---|
| Formulario de columnas | `iswc-form` + `iswc-input` + `iswc-select` + `iswc-switch` + `iswc-checkbox` |
| Lista de columnas editable | `iswc-data-grid` en modo edición |
| Vista previa SQL | `iswc-code` |
| Confirmación | `iswc-dialog` + `iswc-confirm-modal` |

### 3.5 Import / Export

| Necesidad | Componente |
|---|---|
| Elegir archivo | `iswc-dropzone` / `iswc-file-input` |
| Previsualizar CSV | `iswc-csv-view` (edición: `iswc-csv-edit`) |
| Previsualizar Excel | `iswc-spreadsheet` |
| Descargar | `iswc-button` + blob del SDK |

### 3.6 Utilidades SQLite

| Necesidad | Componente |
|---|---|
| Tamaño, encoding, journal, FK | `iswc-meta-list` + `iswc-stat` + `iswc-format-bytes` |
| VACUUM con progreso | `iswc-button` + `iswc-progress-bar` |
| integrity_check | `iswc-callout` (resultado) + `iswc-dialog` |
| Avisos | `iswc-callout` |

**Regla:** si un feature necesita algo que el catálogo ya trae, se usa el tag. Solo se crea
`<prefijo>-*` para lo específico del dominio (p. ej. `<isw-db-tree>` que compone `iswc-tree-view`).

## 4. Estructura de la app front

```
isw-sqlite-admin/                 # creada con create-iswc-app
  deno.json
  vendor.json
  src/js/
    kit-tags.ts                   # KIT_TAGS + APP_TAGS + VIEW_TAGS
    consts/schemas/*.schemas.ts   # Zod del dominio
  src/components/
    db-tree/                      # <isw-db-tree>  (.ts .scss .md .json)
    db-grid/                      # <isw-db-grid>
    db-console/                   # <isw-db-console>
    db-schema/                    # <isw-db-schema>
    db-tools/                     # <isw-db-tools>
    login-form/                   # <isw-login-form>
  view/
    admin/                        # vista principal (split-panel)
    login/
    demo/                         # galería
  public/
```

## 5. Fases de implementación

| Fase | Entregable | Criterio de aceptación |
|---|---|---|
| 0 | Esquema DER del catálogo + `/api/login` con identity | `curl` devuelve JWT y `/api/permisos` responde |
| 1 | `db-admin` genérico: `/objects`, `/columns`, `/rows`, `/stats` | Postman/curl lista tablas de `demo.sqlite` |
| 2 | `front.ts` build a `dist/cdn` | El `.js` se importa desde el front vendorizado |
| 3 | App `create-iswc-app` + login + navegador de objetos | Login real y árbol de tablas en pantalla |
| 4 | Grid con paginación, orden y filtros | Editar una celda persiste en SQLite |
| 5 | Consola SQL multi-pestaña + historial | `SELECT` y `PRAGMA` desde la UI |
| 6 | Schema designer + preview SQL | Añadir columna con `ALTER TABLE` |
| 7 | Import/Export (CSV/JSON/SQL) | Exportar tabla y reimportarla |
| 8 | VACUUM, integrity, stats | Botón VACUUM reduce el archivo |
| 9 | Borrar el front a mano actual | `public/` viejo eliminado |

## 6. Decisiones abiertas

1. **`iswc-data-grid` vs `iswc-ag-grid`**: ¿el grid aguanta edición inline nativa o hay que componer `iswc-inline-edit`?
2. **Ejecución SQL libre**: ¿se permite DDL/DML arbitrario o solo `SELECT`/`PRAGMA` con lista blanca?
3. **Aislamiento por tenant**: ¿un proceso Deno por `.sqlite` o el mismo proceso abre/cierra por request?
4. **`front.ts`**: ¿un solo SDK para todas las apps o uno por dominio?
5. **Prefijo**: ¿`isw-` (como ISW-ClientesIS) o uno nuevo para el admin?
