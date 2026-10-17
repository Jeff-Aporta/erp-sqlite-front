/** all.ts — barril de la vista `hola` → `dist/cdn/view/hola/components/all.min.js`. Hijos antes que el shell. */
import { setCssBase } from '../../../src/js/base/componente.js';

setCssBase(new URL('../../../', import.meta.url).href);

await import('./erp-hola-mundo.js');
await import('./erp-hola.js');
