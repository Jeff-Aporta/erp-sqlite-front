/**
 * componentes.schemas.ts — forma de las `props` de cada componente y tipos auxiliares de la base.
 *
 * Regla: los tipos salen de `z.infer<>`; no hay `type`/`interface` sueltos fuera de `*.schemas.ts`.
 * Datos que vienen de fuera (API, URL, almacenamiento) se PARSEAN con su schema (`safeParse`),
 * nunca se castean con `as`.
 */
import { z } from '../../base/zod.js';

/** `<erp-app>`: el shell. Recibe la vista activa. */
export const ErpAppPropsSchema = z.object({
  vista: z.string().default('hola'),
});
export type ErpAppProps = z.infer<typeof ErpAppPropsSchema>;

/** `<erp-hola>`: pantalla de bienvenida. `modal` abre/cierra el modal. */
export const ErpHolaPropsSchema = z.object({
  modal: z.boolean().default(false),
});
export type ErpHolaProps = z.infer<typeof ErpHolaPropsSchema>;

/** Tarjeta de la portada (dominio de la vista `hola`). */
export const CaracteristicaSchema = z.object({ icono: z.string(), titulo: z.string().min(1), texto: z.string().min(1) });
export type Caracteristica = z.infer<typeof CaracteristicaSchema>;

/** Comando para empezar, con su propósito. */
export const PasoInicioSchema = z.object({ comando: z.string().min(1), para: z.string().min(1) });
export type PasoInicio = z.infer<typeof PasoInicioSchema>;

/** `<erp-login>`: puerta de acceso. `aviso` es un mensaje informativo (p. ej. «sesión expirada»). */
export const ErpLoginPropsSchema = z.object({
  aviso: z.string().default(''),
});
export type ErpLoginProps = z.infer<typeof ErpLoginPropsSchema>;

/** Sesión guardada en el navegador (token de DER identity). Se parsea al leerla: viene de fuera. */
export const SesionSchema = z.object({
  token: z.string().min(20),
  expira: z.string().min(1),
  usuario: z.object({ iusuario: z.string(), nombre: z.string() }),
  recordar: z.boolean(),
});
export type Sesion = z.infer<typeof SesionSchema>;

/** Base (`componente.ts`): atributos e hijos del helper `el()`. */
export type Atributos = Record<string, unknown>;
export type Hijos = Array<Node | string | null | undefined> | Node | string | null | undefined;
