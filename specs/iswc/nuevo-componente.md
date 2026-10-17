---
name: nuevo-componente
description: Crear un componente erp-* en una app iswc. Úsala cada vez que nace una pieza visible nueva o se migra una existente al estándar.
---

# Nuevo componente `erp-<x>`

Referencia viva: `<erp-hola>` (`view/hola/components/`). Copia su forma.

## 1. Antes de escribir

0. **Todo es componente**: cualquier estructura de UI (figura, fila de metadatos, pie, paginador, caja vacía) es un componente; nunca HTML suelto en vistas, renders ni `index.html`.
1. ¿El kit ya lo resuelve? Busca la intención en [`kit/catalog.md`](kit/catalog.md) y [`kit/reference.md`](kit/reference.md) (intención → componente). Botones, campos, diálogos, tablas, toasts, iconos, formatos: **siempre `iswc-*`**. Un `erp-*` traduce datos de la app a esos controles.
2. ¿Dónde vive? Si lo usa una sola vista → `view/<vista>/components/`; si lo usan varias → `src/js/components/erp/`. Una vista no importa componentes de otra.
3. Escribe su WHAT en la spec fundación (`specs/foundation/20-…` o la del dominio) con IDs `[W-CAT-NN]`.

## 2. Los cuatro archivos hermanos (mismo nombre base, misma carpeta)

| Archivo | Contenido |
| --- | --- |
| `erp-<x>.ts` | Lógica de pintado y eventos. Nada de CSS dentro. Lógica de dominio en `utils/` |
| `erp-<x>.scss` | Estilos: `@use "tokens" as t; @use "mixins" as m;`, colores solo `--iswc-*`, anidado, `prefers-reduced-motion` si anima |
| `erp-<x>.md` | Ficha: front matter `name`/`description` y H2 exactos `Anatomía`, `Atributos observados`, `Props`, `Eventos`, `Slots`, `Ejemplos` (excluir con `<!-- exclude: X -->`; Anatomía nunca) |
| `erp-<x>.json` | Playground `iswc-preview/v1` (ver [`demo-componente.md`](demo-componente.md)) |

## 3. El `.ts`

```ts
import { crearComponente, define, emitir, html } from '../../../src/js/base/componente.js';
import type { ErpXProps } from '../../../src/js/consts/schemas/componentes.schemas.js';

const ErpX = crearComponente<ErpXProps>(import.meta.url, 'erp-x', { /* defaults */ }, (root, props, host) => {
  root.append(html`<iswc-button oniswc-click=${() => emitir(host, 'erp-x-accion', { /* detail */ })}>…</iswc-button>`);
});
define('erp-x', ErpX);
```

- El string del tag en `define` es exactamente el nombre del archivo.
- Eventos `erp-<dominio>-<acción>` con `emitir` (bubbles + composed), `detail` mínimo.
- Clase a mano (sin `crearComponente`): `precargarCss` al importar, `adoptCss(root, import.meta.url, '<tag>')` tras cada pintado y `adoptarPropsTardias(this)` al final de `connectedCallback`.

## 4. Props con Zod

1. Schema en `src/js/consts/schemas/componentes.schemas.ts`: `export const ErpXPropsSchema = z.object({...})` y su `type … = z.infer<…>`.
2. Registro en `src/js/base/props-registro.ts`: `registrarClaves('erp-x', ErpXPropsSchema)`.
3. Datos de fuera (API, URL, almacenamiento): `safeParse`, nunca `as`.

## 5. Registro (una vez)

- `src/js/kit-tags.ts`: en `APP_TAGS` (transversal) o en `VIEW_TAGS.<vista>`. Si usa un `iswc-*` nuevo, añádelo a `KIT_TAGS`.
- Barril: `import('./erp-x.js')` en el `all.ts` de su carpeta (hijos antes que el shell).
- Galería: su línea en `view/demo/manifest.json`, con demo y playground (`controls`); el guardián de demos falla si falta.
- ¿Es general (sin dominio de la app)? Marca en su `.json`: `"reuso": { "candidato": "iswc-root", "motivo": "…", "propuesta": "iswc-…" }`.

## 6. Cierre

Pruebas WHAT de su comportamiento (`tests/componentes/` o `tests/vistas/`, formato común) y
`deno task test:all` en verde. Actualiza la spec (`W2H.md`).
