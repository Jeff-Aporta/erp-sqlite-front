# 20 — Componentes, vistas y kit

> Alcance: cómo se define un componente `erp-*`, cómo se registra, cómo se define una vista
> y el catálogo de componentes y vistas. Fuera: build y pines (spec `10`).

## 1. Propósito (WHAT)

La app es una única página hecha de piezas con nombre propio (`<erp-…>`) sobre el kit
iswc-root. Cada pieza muestra una parte concreta, recibe datos (atributos o `props`) y avisa hacia
arriba con eventos `erp-…`; se ve igual en claro y oscuro; tiene una ficha (`.md`) y un
ejemplo vivo en la galería.

## 2. Requisitos WHAT

- [W-COMP-01] Toda pieza visible es un elemento `erp-<algo>`; encapsula su DOM y sus estilos y nunca se ve sin estilos, ni un frame.
- [W-COMP-02] `props` mezcla lo nuevo con lo anterior; asignado antes de registrar el tag, no se pierde.
- [W-COMP-03] Una clave de `props` o un atributo que la pieza no conoce se avisa por consola con el tag y la clave; la pieza no falla.
- [W-COMP-04] Los eventos de una pieza suben por el documento atravesando el shadow DOM.
- [W-COMP-05] Todo color sale del tema activo (tokens del kit); con «reducir movimiento» nada anima.
- [W-COMP-06] Cada pieza aparece en la galería (`view/demo/`) con un ejemplo vivo y «cuándo usarla / cuándo no».
- [W-ICO-01] Todo ícono que la app pinta, y todo ícono de lo que consume (kit y otras apps), está en la propia app (`assets/`): se carga en local y se ve aunque la API de Iconify no responda.
- [W-ICO-02] El mapa de íconos dice qué hay en local y dónde está publicada la app (`host`).
- [W-ICO-03] `<iswc-icon>` carga en local lo que el mapa lista; todo lo demás (o si el archivo local falla) sale de la API de Iconify. No hay otras rutas.
- [W-VIEW-01] Cada dominio es una vista con un único shell; la app solo conoce el shell. Se abre sola (`/view/<v>/index.html`) y tiene demo (`/view/<v>/demo/`).

### Catálogo

**`<erp-app>` — shell** `[W-CAT-01]`: la app usa el **layout común del kit** (`<iswc-app-shell>` con marca «ERP SQLite», el mismo de todas las apps iswc, pineado al SHA de la app): barra con la marca, las secciones, la sesión y el conmutador de tema; debajo, el shell de la vista activa. `props = { vista }` (`"hola"` por defecto; una vista sin shell cae en `hola`).

- [W-SHELL-01] La app usa el layout común del kit: la barra es `<iswc-app-shell>` con `<iswc-session-menu>` y `<iswc-theme-toggle>` en las acciones; no hay barra propia.
- [W-SHELL-02] Sin sesión, la barra ofrece «Entrar» y desde ahí se inicia sesión (mismas credenciales DER que la pantalla de login). Un error del API se ve en el panel de la barra y no entra.
- [W-SHELL-03] Con sesión, la barra muestra el nombre del usuario y las secciones (Bases, Consola SQL, Catálogo); «Cerrar sesión» borra la sesión y vuelve al login.
- [W-SHELL-04] Sin sesión la vista es la pantalla de login (alternativa equivalente al dropdown, útil en móvil y para el autocompletado del navegador).

**`<erp-hola-mundo>` — título** `[W-CAT-04]`: un título «Hola mundo». Sin props, atributos ni eventos. Es el molde mínimo de un componente.

**`<erp-hola>` — panel (shell de `hola`)** `[W-CAT-02]`: con sesión, panel «Bases de datos» con las bases SQLite que administra el API (tablas, vistas y tamaño de cada una) y los accesos «Consola SQL» y «Catálogo». Si el API falla, el panel lo dice en un aviso.

**Secciones de la barra** `[W-CAT-03]`: «Consola SQL» y «Catálogo» (en `<iswc-app-nav>`) abren su panel encima de «Bases», que sigue siendo la sección activa.

## 3. Guía HOW WEAK

- [HW-COMP-01] El componente solo pinta y emite; la lógica vive en `utils/` (vista) o `src/js/` (compartida).
- [HW-COMP-02] Repintar entero es aceptable; si rompe foco o scroll, repintado parcial.

## 4. Contratos HOW STRONG

- [HS-COMP-01] Cuatro archivos hermanos por componente: `<tag>.ts`, `<tag>.scss`, `<tag>.md` (H2 exactos: Anatomía, Atributos observados, Props, Eventos, Slots, Ejemplos; excluir con `<!-- exclude: X -->`, Anatomía nunca), `<tag>.json` (`iswc-preview/v1`).
- [HS-COMP-02] Registro: el tag se declara una vez en `src/js/kit-tags.ts` (`APP_TAGS` transversales en `src/js/components/erp/`; `VIEW_TAGS.<vista>` en `view/<vista>/components/`), su línea en `view/demo/manifest.json` y, si tiene `props`, su schema Zod en `componentes.schemas.ts` registrado en `props-registro.ts`.
- [HS-COMP-03] Base: `crearComponente`/`define`/`emitir`/`html`/`adoptCss`/`precargarCss`/`adoptarPropsTardias` de `src/js/base/componente.ts`.
- [HS-ICO-01] Íconos: ids Iconify literales `set:nombre` en el código (`icon="mdi:home"`, `icono: 'mdi:home'`); un id armado en ejecución va en `extra` de `assets/dl.js`. `deno task icons` (dentro de `build`) baja a `assets/iconify/<set>/<nombre>.svg` los íconos de la app (sin mapa; los que pintan por dentro los componentes del kit van en `extra`). El registrador del build declara `<html data-icons>` = `deno.json` → `iswc.host` + `assets/iconify/` (URL absoluta): `<iswc-icon>` resuelve localStorage → esa base → API, y si un ícono no estaba publicado avisa `[iswc-icon] falta en local: <id>`. `assets/dl.js` solo lleva rutas e importa la herramienta online del kit (@main).
- [HS-VIEW-01] Vista: `index.html`, `README.md`, `demo/index.html`, `components/` (+ `all.ts`), `utils/`.

## 5. Casos borde y errores

- [W-ICO-05] Sin red al construir, `deno task icons` no rompe el build: conserva los íconos que ya están y avisa. Un id que no existe en Iconify se reporta y no entra al mapa.

- [W-COMP-07] Un componente sin hoja o fuera del registro no se carga: los guardianes lo detectan antes de publicar.

## 6. Pruebas (WHAT / HOW WEAK)

- [W-COMP-08] Cada componente registrado tiene sus 4 archivos, su `.md` declara las 6 secciones y su `.json` valida contra `iswc-preview/v1`.
- [W-COMP-09] El dominio de la bienvenida (`view/hola/utils/bienvenida`) se prueba sin navegador (`tests/vistas/bienvenida`).
- [W-ICO-04] Los íconos de la app están en `assets/iconify/` [W-ICO-01], `deno.json` declara `iswc.host` [W-ICO-02] y el registrador declara `<html data-icons>` (`tests/iconos`); en e2e, la bienvenida tiene `data-icons` absoluto, pinta sus íconos y los deja en localStorage `iswc:icon:*` (`tests/e2e/00.bienvenida`).
- [W-SHELL-05] E2E de [W-SHELL-01]…[W-SHELL-04] (`tests/e2e/02.login`).
- [W-COMP-10] E2E: la app arranca, el panel muestra «Bases de datos» con sus accesos y la sección «Consola SQL» de la barra abre la consola (`tests/e2e/00.bienvenida`).

## 7. Notas

Sin notas.
