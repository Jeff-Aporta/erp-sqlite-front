/** all.ts — barril de la vista `login` → `dist/cdn/view/login/components/all.min.js`. Hijos antes que el shell. */
import { setCssBase } from '../../../src/js/base/componente.js';

setCssBase(new URL('../../../', import.meta.url).href);

await import('./erp-login.js');
