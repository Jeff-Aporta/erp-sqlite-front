---
name: erp-hola
description: Pantalla de bienvenida de ERP SQLite (shell de la vista `hola`). Úsala como referencia de un shell de vista hecho con piezas del kit, con un modal.
---

# `<erp-hola>`

Portada de la app: cejilla, título `<erp-hola-mundo>`, lema, botón «Ver cómo está hecha»,
chips y cuatro tarjetas con las piezas del estándar. El botón abre un modal con la regla de los
cuatro archivos y los comandos para empezar. Datos en `../utils/bienvenida.ts`.

## Anatomía

```
<erp-hola>
  #shadow-root
    <section part="hero">
      <p class="kicker">
      <erp-hola-mundo id="titulo">
      <p class="lede">
      <iswc-button id="abrir-modal">Ver cómo está hecha</iswc-button>
      <iswc-tag> ×4
    <div part="tarjetas">
      <iswc-card> ×4                     ← caracteristicas()
    <iswc-dialog id="modal" label="Cómo está hecha">
      <iswc-callout> · <iswc-code lang="bash">   ← guionInicio()
      <iswc-button slot="footer" id="cerrar-modal">Entendido</iswc-button>
```

## Atributos observados

<!-- exclude: Atributos observados -->

## Props

| Prop | Tipo | Default | Qué hace |
| --- | --- | --- | --- |
| `modal` | `boolean` | `false` | Abre (`true`) o cierra el modal. Cambiarla solo toca el modal (repintado parcial). |

## Eventos

| Evento | `detail` | Cuándo |
| --- | --- | --- |
| `erp-hola-modal` | `{ abierto: boolean }` | Al abrir con el botón y al cerrarse el modal (Entendido, Esc o clic fuera). |

## Slots

<!-- exclude: Slots -->

## Ejemplos

```html
<erp-hola></erp-hola>
<script type="module">
  const hola = document.querySelector('erp-hola');
  hola.addEventListener('erp-hola-modal', (e) => console.log('modal', e.detail.abierto));
  hola.props = { modal: true }; // abre el modal desde fuera
</script>
```
