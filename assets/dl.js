// assets/dl.js — íconos de la app: SOLO configuración de rutas (`deno task icons`, corre dentro de `build`).
// Baja a assets/iconify/<set>/<nombre>.svg los íconos que usa la app (sin mapa) y poda los que ya nadie usa.
// En ejecución <iswc-icon> busca: localStorage → <html data-icons> (la web PUBLICADA de la app: deno.json →
// iswc.host + assets/iconify/, lo declara el registrador) → API de Iconify. Si un ícono no estaba publicado,
// la consola dice `[iswc-icon] falta en local: <set>:<nombre>`: ese id va en `extra` y se corre `deno task icons`.
// Herramienta ONLINE del kit, siempre @main (la tarea `icons` lleva --reload del origen: Deno cachea los módulos remotos).
import { descargarIconos } from 'https://raw.githubusercontent.com/Jeff-Aporta/is-webcomponents/main/dist/cdn/vendor-distributions/client/tools/download-iconify.mjs';

await descargarIconos({
  raiz: new URL('..', import.meta.url),
  roots: ['index.html', 'src', 'view'],
  // ids que el barrido no ve: armados en ejecución o pintados por los componentes del kit (layout común).
  extra: [
    'mdi:account', 'mdi:check', 'mdi:chevron-down', 'mdi:close-circle', 'mdi:information-outline', 'mdi:loading',
    'mdi:login', 'mdi:logout', 'mdi:menu', 'mdi:weather-night', 'mdi:weather-sunny',
  ],
});
