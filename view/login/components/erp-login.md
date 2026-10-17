---
name: erp-login
description: Puerta de acceso de la app. Envuelve <iswc-login> y lo conecta a la sesión DER (login, 401, 429).
---

# `<erp-login>`

Shell de la vista `login`. Pinta `<iswc-login>` del kit y traduce su `iswc-login-submit` a
`entrar()` de `src/js/dominio/sesion.ts`. Los errores del API (credenciales, bloqueo por
intentos) se muestran en el propio `<iswc-login>` con su atributo `error`.

## Anatomía

```
<erp-login>
  #shadow-root
    <iswc-login part="login" heading="ERP SQLite" provider="DER">
```

## Atributos observados

<!-- exclude: Atributos observados -->

## Props

| Prop | Tipo | Default | Uso |
| --- | --- | --- | --- |
| `aviso` | string | `''` | Mensaje informativo (p. ej. «Tu sesión expiró»). |

## Eventos

| Evento | `detail` | Cuándo |
| --- | --- | --- |
| `erp-login-ok` | `{ usuario: { iusuario, nombre } }` | Login correcto; la sesión ya quedó guardada. |

## Slots

<!-- exclude: Slots -->

## Ejemplos

```html
<erp-login></erp-login>
```
