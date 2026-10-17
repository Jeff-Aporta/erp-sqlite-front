---
name: erp-app
description: Shell de ERP SQLite. Úsalo una sola vez, en index.html; monta la barra y el shell de la vista activa.
---

# `<erp-app>`

Armazón de la app: barra superior (marca, usuario, «Salir» y conmutador de tema) y, debajo, el
shell de la vista activa. La app solo conoce el shell de cada vista; las vistas se registran en
`kit-tags.ts`. Sin sesión vigente (`src/js/dominio/sesion.ts`) la vista es siempre `login`; un
login, logout o 401 del API la repinta sola.

## Anatomía

```
<erp-app>
  #shadow-root
    <header part="barra">
      <strong class="marca">ERP SQLite</strong>
      <span part="usuario">           ← solo con sesión
      <iswc-button id="salir">        ← solo con sesión
      <iswc-theme-toggle scope="root">
    <main part="vista" data-vista="login|hola">
      <erp-login> | <erp-hola>        ← shell de la vista activa
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
