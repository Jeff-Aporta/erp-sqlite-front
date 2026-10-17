/**
 * vendor-api.ts — copia el SDK del API (`front.ts`, solo tipos + fetch) a `src/js/api/front.ts`.
 *
 *   deno task vendor:api                       # CDN pineado: deno.json → erp.apiSha
 *   deno task vendor:api --sha=<sha40>         # sube el pin y re-vendoriza
 *   deno task vendor:api --local               # desde ../erp-sqlite-api (checkout del monorepo, sin publicar)
 *   ERP_API_SDK=<url|ruta> deno task vendor:api
 *
 * Fuente publicada: https://cdn.jsdelivr.net/gh/Jeff-Aporta/erp-sqlite-api@<sha40>/dist/cdn/front.ts
 */
import { dirname, fromFileUrl, join } from 'jsr:@std/path@1';

const REPO = 'Jeff-Aporta/erp-sqlite-api';
const raiz = join(dirname(fromFileUrl(import.meta.url)), '..', '..');
const destino = join(raiz, 'src', 'js', 'api', 'front.ts');
const rutaConfig = join(raiz, 'deno.json');
const arg = (n: string) => Deno.args.find((a) => a === `--${n}` || a.startsWith(`--${n}=`));

const config = JSON.parse(await Deno.readTextFile(rutaConfig));
const shaNuevo = arg('sha')?.split('=')[1];
if (shaNuevo !== undefined && !/^[0-9a-f]{40}$/.test(shaNuevo)) throw new Error('vendor:api: --sha debe ser un SHA de 40 hex');
const sha: string | undefined = shaNuevo ?? config.erp?.apiSha;

const fuente = Deno.env.get('ERP_API_SDK')
  ?? (arg('local') ? join(raiz, '..', 'erp-sqlite-api', 'dist', 'cdn', 'front.ts') : null)
  ?? (sha ? `https://cdn.jsdelivr.net/gh/${REPO}@${sha}/dist/cdn/front.ts` : null);
if (!fuente) throw new Error('vendor:api: falta el pin (deno.json → erp.apiSha) o --sha=<sha40>');

const remoto = /^https?:\/\//.test(fuente);
const texto = remoto
  ? await (async () => {
    const r = await fetch(fuente);
    if (!r.ok) throw new Error(`vendor:api: ${fuente} → HTTP ${r.status}`);
    return await r.text();
  })()
  : await Deno.readTextFile(fuente);

if (!/export function createClient\(/.test(texto)) throw new Error(`vendor:api: ${fuente} no parece el SDK (falta createClient)`);

await Deno.mkdir(dirname(destino), { recursive: true });
const cabecera = `// @vendor ${new Date().toISOString()} ${remoto ? fuente : 'erp-sqlite-api (checkout local, sin publicar)'}\n`;
await Deno.writeTextFile(destino, cabecera + texto.replace(/^\/\/ @vendor .*\n/, ''));

if (shaNuevo && shaNuevo !== config.erp?.apiSha) {
  // Edición textual: conserva el formato compacto de deno.json (no se re-serializa entero).
  const crudo = await Deno.readTextFile(rutaConfig);
  const nuevo = /"apiSha":\s*"[0-9a-f]*"/.test(crudo)
    ? crudo.replace(/"apiSha":\s*"[0-9a-f]*"/, `"apiSha": "${shaNuevo}"`)
    : crudo.replace(/\n}\s*$/, `,\n  "erp": { "apiSha": "${shaNuevo}" }\n}\n`);
  await Deno.writeTextFile(rutaConfig, nuevo);
}
console.log(`[vendor:api] ${fuente} → src/js/api/front.ts (${texto.length} bytes)`);
