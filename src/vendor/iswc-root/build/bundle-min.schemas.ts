// @vendor iswc-root@aebd1850cde940e967076675ab422c7116c9909b dist/cdn/build/bundle-min.schemas.ts
// No editar: se cambia en el kit y se descarga con `deno task vendor:iswc`.
/**
 * bundle-min.ts — Zod schemas para los tipos extraídos de este módulo.
 *
 * Generado por `scripts/migrate-zod.py`. Refinar manualmente las
 * entradas marcadas con TODO cuando se quiera validación runtime.
 */
import { z } from "zod";
import type { Plugin } from "esbuild";

export const BundleMinJsOptionsSchema = z.object({
  entry: z.string(),
  outfile: z.string(),
  plugins: z.array(z.custom<Plugin>()).optional(),
  banner: z.string().optional(),
  define: z.record(z.string(), z.string()).optional(),
  external: z.array(z.string()).optional(),
  format: z.union([z.literal('esm'), z.literal('iife'), z.literal('cjs')]).optional(),
  target: z.string().optional(),
});
export type BundleMinJsOptions = z.infer<typeof BundleMinJsOptionsSchema>;


export const BundleLoaderOptionsSchema = BundleMinJsOptionsSchema.pick({
  entry: true, outfile: true, plugins: true, banner: true, external: true,
}).extend({
  catalog: z.unknown(),
  hashes: z.record(z.string(), z.string()),
  sha: z.string().optional(),
});
export type BundleLoaderOptions = z.infer<typeof BundleLoaderOptionsSchema>;

