/**
 * vendor-api.ts — copia el SDK del API (`front.ts`, solo tipos + fetch) a `src/js/api/front.ts`.
 *
 *   deno task vendor:api                       # desde el repo hermano ../api (checkout local)
 *   ERP_API_SDK=<url|ruta> deno task vendor:api
 *
 * Con el API publicado, la fuente es su CDN pineado por SHA, p. ej.
 * https://cdn.jsdelivr.net/gh/<owner>/erp-sqlite-api@<sha40>/dist/cdn/front.ts
 */
import { dirname, fromFileUrl, join } from 'jsr:@std/path@1';

const raiz = join(dirname(fromFileUrl(import.meta.url)), '..', '..');
const fuente = Deno.env.get('ERP_API_SDK') ?? join(raiz, '..', 'api', 'dist', 'cdn', 'front.ts');
const destino = join(raiz, 'src', 'js', 'api', 'front.ts');

const texto = /^https?:\/\//.test(fuente)
  ? await (async () => {
    const r = await fetch(fuente);
    if (!r.ok) throw new Error(`vendor:api: ${fuente} → HTTP ${r.status}`);
    return await r.text();
  })()
  : await Deno.readTextFile(fuente);

if (!/export function createClient\(/.test(texto)) throw new Error(`vendor:api: ${fuente} no parece el SDK (falta createClient)`);

await Deno.mkdir(dirname(destino), { recursive: true });
const cabecera = `// @vendor ${new Date().toISOString()} ${/^https?:/.test(fuente) ? fuente : 'erp-sqlite/api (checkout local)'}\n`;
await Deno.writeTextFile(destino, cabecera + texto.replace(/^\/\/ @vendor .*\n/, ''));
console.log(`[vendor:api] ${fuente} → src/js/api/front.ts (${texto.length} bytes)`);
