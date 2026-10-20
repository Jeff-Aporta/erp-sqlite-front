// 00.bienvenida.test.ts — caso base e2e (Stagehand DETERMINISTA, sin LLM): la app arranca, muestra la
// bienvenida y el modal se abre y se cierra como lo haría un usuario. Caja negra: solo lo que se ve.
//
//   W-PLAT-12  la app arranca sin errores de consola y queda marcada como lista
//   W-CAT-02   con sesión se ve el panel «Bases de datos» con los accesos a Consola SQL y Catálogo
//   W-CAT-03   la sección «Consola SQL» de la barra común abre la consola sin dejar «Bases»
//   W-ICO-04   los íconos de la bienvenida se piden a la carpeta local de la app, no a la API de Iconify
//
// La bienvenida exige sesión: se entra con una sesión de prueba (la vista no llama al API).
import { definirPruebas } from '../../src/vendor/iswc-root/tools/pruebas.ts';
import { abrir, conSesionDePrueba, enSombra, esperar } from '../../scripts/gate/e2e/harness.ts';

let s: Awaited<ReturnType<typeof abrir>>;
const HOLA = ['erp-app', 'erp-hola'];

export default definirPruebas([
  {
    nombre: 'bienvenida W-PLAT-12 la app arranca lista y sin errores de consola',
    categoria: 'what',
    async correr({ expect }) {
      // Con el CDN en frío (primer pedido de un SHA recién publicado) el watchdog de 6 s puede marcar la
      // página como lista antes de montar el shell: se espera a que monte (afirmado abajo), no se asume.
      await esperar(s.page, () => !!document.querySelector('erp-app')?.shadowRoot?.querySelector('iswc-app-shell'), 30_000).catch(() => undefined);
      expect('marcada como lista', await s.page.evaluate(() => document.documentElement.hasAttribute('data-app-ready'), undefined));
      expect('shell montado', (await enSombra(s.page, ['erp-app', 'iswc-app-shell'])) === true);
      expect('sin errores de consola', s.errores().length === 0, s.errores().join(' | '));
    },
  },
  {
    nombre: 'bienvenida W-CAT-02 con sesión se ve el panel «Bases de datos» con sus accesos',
    categoria: 'what',
    async correr({ eq, expect }) {
      await esperar(s.page, () => !!document.querySelector('erp-app')?.shadowRoot?.querySelector('erp-hola')?.shadowRoot?.querySelector('.titulo'), 30_000);
      eq('título', await enSombra(s.page, [...HOLA, '.titulo'], 'text'), 'Bases de datos');
      expect('acceso a la Consola SQL', (await enSombra(s.page, [...HOLA, '#consola'])) === true);
      expect('acceso al Catálogo', (await enSombra(s.page, [...HOLA, '#catalogo'])) === true);
    },
  },
  {
    nombre: 'bienvenida W-CAT-03 la sección «Consola SQL» de la barra abre la consola sin dejar «Bases»',
    categoria: 'what',
    async correr({ eq }) {
      await s.page.evaluate(() => {
        const g = globalThis as { __abiertos?: string[] };
        g.__abiertos = [];
        for (const ev of ['erp-open-consola', 'erp-open-catalogo']) globalThis.addEventListener(ev, () => g.__abiertos!.push(ev));
        const nav = document.querySelector('erp-app')?.shadowRoot?.querySelector('iswc-app-nav');
        const tab = [...(nav?.shadowRoot?.querySelectorAll('[role="tab"]') ?? [])].find((t) => t.textContent?.includes('Consola SQL')) as HTMLElement | undefined;
        tab?.click();
      }, undefined);
      await esperar(s.page, () => ((globalThis as { __abiertos?: string[] }).__abiertos ?? []).length > 0);
      eq('abrió la consola', await s.page.evaluate(() => (globalThis as { __abiertos?: string[] }).__abiertos, undefined), ['erp-open-consola']);
      eq('pestaña activa', await s.page.evaluate(() => (document.querySelector('erp-app')?.shadowRoot?.querySelector('iswc-app-nav') as unknown as { rows?: Array<{ value?: string }> } | null)?.rows?.[0]?.value, undefined), 'bases');
    },
  },
  {
    nombre: 'bienvenida W-ICO-04 los íconos se piden a la web publicada de la app (data-icons) y se pintan',
    categoria: 'what',
    async correr({ expect, saltar }) {
      const resolvedor = await s.page.evaluate(() => !!(globalThis as { __iswcIcons?: unknown }).__iswcIcons, undefined);
      if (!resolvedor) saltar('el kit pineado aún no trae el resolvedor con data-icons: sube el pin');
      const base = await s.page.evaluate(() => document.documentElement.dataset.icons ?? '', undefined);
      expect('data-icons absoluto que termina en assets/iconify/', /^https?:\/\/.+\/assets\/iconify\/$/.test(base), base);
      await esperar(s.page, () => {
        const hola = document.querySelector('erp-app')?.shadowRoot?.querySelector('erp-hola')?.shadowRoot;
        const iconos = [...(hola?.querySelectorAll('.acc iswc-icon') ?? [])];
        return iconos.length === 2 && iconos.every((i) => !!i.shadowRoot?.querySelector('svg'));
      });
      const guardados = await s.page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('iswc:icon:')).length, undefined);
      expect('los SVG quedan en localStorage (iswc:icon:*)', guardados > 0, String(guardados));
    },
  },
], {
  antes: async () => { s = await abrir('index.html'); await conSesionDePrueba(s.page); },
  despues: async () => { await s?.cerrar(); },
});
