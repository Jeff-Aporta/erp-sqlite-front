// @vendor iswc-root@c08f58a5a048a396b7eeca23cb222b267bdf8ac6+local dist/cdn/build/asset-url.schemas.ts
// No editar: se cambia en el kit y se descarga con `deno task vendor:iswc`.
/**
 * asset-url.ts — Zod schemas para los tipos extraídos de este módulo.
 *
 * Generado por `scripts/migrate-zod.py`. Refinar manualmente las
 * entradas marcadas con TODO cuando se quiera validación runtime.
 */
import { z } from "zod";

export const LoaderGlobalSchema = z.object({
  iswcLoader: z.object({
  assetUrl: z.function({ input: [z.string()], output: z.string() }).optional(),
}).optional(),
});
export type LoaderGlobal = z.infer<typeof LoaderGlobalSchema>;

