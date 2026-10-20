---
name: erp-app
description: Shell de ERP SQLite. Úsalo una sola vez, en index.html; monta la barra y el shell de la vista activa.
---

# `<erp-app>`

Armazón de la app sobre el **layout común del kit** (el mismo en todas las apps iswc):
`<iswc-app-shell>` con `<iswc-app-nav>` (secciones), `<iswc-session-menu>` (sesión) y
`<iswc-theme-toggle>` en la barra, y debajo el shell de la vista activa. La app solo conoce el shell
de cada vista; las vistas se registran en `kit-tags.ts`. Sin sesión vigente
(`src/js/dominio/sesion.ts`) la vista es `login` y la barra ofrece «Entrar» (dropdown); un login,
logout o 401 del API la repinta sola.

## Comportamiento

- Sin sesión: la barra muestra «Entrar»; el envío del dropdown llama a `entrar()` y un error del
  API se ve en el propio panel. La vista `login` (pantalla completa) queda como alternativa
  equivalente (mismo `entrar()`), útil en móvil y para el autocompletado del navegador.
- Con sesión: la barra muestra el nombre del usuario; «Cerrar sesión» llama a `salir()` y vuelve a
  la vista `login`. Las pestañas «Consola SQL» y «Catálogo» abren sus paneles sin dejar «Bases».

## Anatomía

```
<erp-app>
  #shadow-root
    <iswc-app-shell brand="ERP SQLite" logo="mdi:database">
      <iswc-app-nav slot="nav">                  ← solo con sesión: Bases · Consola SQL · Catálogo
      <iswc-session-menu slot="actions">         ← «Entrar» | usuario + «Cerrar sesión»
      <iswc-theme-toggle slot="actions" scope="root">
      <div class="vista" part="vista" data-vista="login|hola">
        <erp-login> | <erp-hola>                 ← shell de la vista activa
```

## Atributos observados

<!-- exclude: Atributos observados -->

## Props

| Prop | Tipo | Default | Qué hace |
| --- | --- | --- | --- |
| `vista` | `string` | `"hola"` | Vista activa con sesión; una clave sin shell (o `login`) cae en `hola`. |

## Eventos

<!-- exclude: Eventos -->

## Slots

<!-- exclude: Slots -->

## Ejemplos

```html
<erp-app></erp-app>
<script type="module">
  document.querySelector('erp-app').props = { vista: 'hola' };
</script>
```
