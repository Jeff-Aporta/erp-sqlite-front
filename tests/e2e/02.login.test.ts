// 02.login.test.ts — layout común y sesión (Stagehand DETERMINISTA, sin LLM ni API real). Caja negra.
//
//   W-SHELL-01  la app usa el layout común del kit (barra del kit, sin barra propia)
//   W-LOG-10    sin sesión: la barra ofrece «Entrar» y la vista es el login (W-SHELL-04)
//   W-SHELL-02  sin sesión se puede iniciar sesión desde la barra; un error del API se ve allí y no entra
//   W-LOG-11    un error del API en la pantalla de login se muestra y no entra
//   W-SHELL-03  con sesión se ve el usuario y las secciones; «Cerrar sesión» borra la sesión y vuelve al login
//
// El servidor de e2e es estático (sin /api): POST /api/login responde 4xx (405). El login real contra DER lo
// cubre el e2e del repo `api` (y la verificación en el VPS); la lógica de sesión, tests/vistas/sesion.test.ts.
// Los envíos se emiten con el evento de contrato del kit (`iswc-login-submit`), como lo haría el formulario.
import { definirPruebas } from '../../src/vendor/iswc-root/tools/pruebas.ts';
import { abrir, conSesionDePrueba, enSombra, esperar } from '../../scripts/gate/e2e/harness.ts';

let s: Awaited<ReturnType<typeof abrir>>;
// page.evaluate serializa solo la función (sin cierres): las rutas se repiten inline.
const vista = () => document.querySelector('erp-app')?.shadowRoot?.querySelector('[data-vista]')?.getAttribute('data-vista') ?? '';

export default definirPruebas([
  {
    nombre: 'login W-SHELL-01 la app usa el layout común del kit',
    categoria: 'what',
    async correr({ eq, expect }) {
      await esperar(s.page, () => !!document.querySelector('erp-app')?.shadowRoot?.querySelector('iswc-app-shell')?.shadowRoot, 30_000);
      const r = await s.page.evaluate(() => {
        const app = document.querySelector('erp-app')?.shadowRoot;
        const shell = app?.querySelector('iswc-app-shell');
        return {
          marca: shell?.getAttribute('brand') ?? '',
          sesion: app?.querySelector('iswc-session-menu')?.getAttribute('slot') ?? '',
          tema: app?.querySelector('iswc-theme-toggle')?.getAttribute('slot') ?? '',
          barraPropia: !!app?.querySelector('header'),
          kit: !!customElements.get('iswc-app-shell') && !!customElements.get('iswc-session-menu') && !!customElements.get('iswc-app-nav'),
        };
      }, undefined);
      eq('marca', r.marca, 'ERP SQLite');
      eq('sesión en acciones', r.sesion, 'actions');
      eq('tema en acciones', r.tema, 'actions');
      expect('sin barra propia', !r.barraPropia);
      expect('tags del kit registrados', r.kit);
    },
  },
  {
    nombre: 'login W-LOG-10 sin sesión la barra ofrece Entrar y se ve el login',
    categoria: 'what',
    async correr({ eq, expect }) {
      eq('vista', await s.page.evaluate(vista, undefined), 'login');
      await esperar(s.page, () => !!document.querySelector('erp-app')?.shadowRoot?.querySelector('erp-login')?.shadowRoot?.querySelector('iswc-login'));
      const r = await s.page.evaluate(() => {
        const menu = document.querySelector('erp-app')?.shadowRoot?.querySelector('iswc-session-menu');
        const login = menu?.shadowRoot?.querySelector('iswc-login-dropdown') as HTMLElement | null | undefined;
        return { logged: !!menu?.hasAttribute('logged'), entrarVisible: !!login && !login.hidden };
      }, undefined);
      expect('sin sesión en la barra', !r.logged);
      expect('«Entrar» visible en la barra', r.entrarVisible);
    },
  },
  {
    nombre: 'login W-SHELL-02 desde la barra: un error del API se ve en el panel y no entra',
    categoria: 'what',
    async correr({ eq, expect }) {
      await s.page.evaluate(() => {
        const menu = document.querySelector('erp-app')?.shadowRoot?.querySelector('iswc-session-menu');
        menu?.shadowRoot?.querySelector('iswc-login-dropdown')?.dispatchEvent(new CustomEvent('iswc-login-submit', {
          detail: { mode: 'password', username: 'admin', password: 'cualquiera', remember: false },
          bubbles: true, composed: true,
        }));
      }, undefined);
      await esperar(s.page, () => !!(document.querySelector('erp-app')?.shadowRoot?.querySelector('iswc-session-menu') as unknown as { error?: string } | null)?.error);
      const error = String(await s.page.evaluate(() => (document.querySelector('erp-app')?.shadowRoot?.querySelector('iswc-session-menu') as unknown as { error?: string } | null)?.error, undefined));
      expect('muestra el status HTTP, no «sin conexión»', /^Error del servidor \(4\d\d\)$/.test(error), error);
      eq('sigue en login', await s.page.evaluate(vista, undefined), 'login');
      expect('nada guardado', await s.page.evaluate(() => sessionStorage.getItem('erp:sesion') === null && localStorage.getItem('erp:sesion') === null, undefined));
    },
  },
  {
    nombre: 'login W-LOG-11 un error del API en la pantalla de login se muestra y no entra',
    categoria: 'what',
    async correr({ eq, expect }) {
      await s.page.evaluate(() => {
        document.querySelector('erp-app')?.shadowRoot?.querySelector('erp-login')?.shadowRoot?.querySelector('iswc-login')?.dispatchEvent(new CustomEvent('iswc-login-submit', {
          detail: { username: 'admin', password: 'cualquiera', remember: false },
          bubbles: true, composed: true,
        }));
      }, undefined);
      await esperar(s.page, () => !!document.querySelector('erp-app')?.shadowRoot?.querySelector('erp-login')?.shadowRoot?.querySelector('iswc-login')?.getAttribute('error'));
      const error = String(await s.page.evaluate(() => document.querySelector('erp-app')?.shadowRoot?.querySelector('erp-login')?.shadowRoot?.querySelector('iswc-login')?.getAttribute('error'), undefined));
      expect('muestra el status HTTP, no «sin conexión»', /^Error del servidor \(4\d\d\)$/.test(error), error);
      eq('sigue en login', await s.page.evaluate(vista, undefined), 'login');
      expect('nada guardado', await s.page.evaluate(() => sessionStorage.getItem('erp:sesion') === null, undefined));
    },
  },
  {
    nombre: 'login W-SHELL-03 con sesión se ve el usuario y «Cerrar sesión» vuelve al login',
    categoria: 'what',
    async correr({ eq, expect }) {
      await conSesionDePrueba(s.page);
      await esperar(s.page, () => document.querySelector('erp-app')?.shadowRoot?.querySelector('[data-vista]')?.getAttribute('data-vista') === 'hola', 30_000);
      const r = await s.page.evaluate(() => {
        const app = document.querySelector('erp-app')?.shadowRoot;
        const menu = app?.querySelector('iswc-session-menu');
        const nav = app?.querySelector('iswc-app-nav') as unknown as { rows?: Array<{ tabs: Array<{ label: string }> }> } | null;
        return {
          logged: !!menu?.hasAttribute('logged'),
          nombre: menu?.shadowRoot?.querySelector('[part~="profile-name"]')?.textContent?.trim() ?? '',
          secciones: (nav?.rows?.[0]?.tabs ?? []).map((t) => t.label),
        };
      }, undefined);
      expect('sesión abierta en la barra', r.logged);
      eq('nombre del usuario', r.nombre, 'Prueba e2e');
      eq('secciones', r.secciones, ['Bases', 'Consola SQL', 'Catálogo']);
      // «Cerrar sesión» es un item del menú del kit: se pulsa como lo haría el usuario.
      await s.page.evaluate(() => {
        const menu = document.querySelector('erp-app')?.shadowRoot?.querySelector('iswc-session-menu') as (HTMLElement & { show(): void }) | null;
        menu?.show();
        (menu?.shadowRoot?.querySelector('[part~="logout"]')?.shadowRoot?.querySelector('[part~="base"]') as HTMLElement | null)?.click();
      }, undefined);
      await esperar(s.page, () => document.querySelector('erp-app')?.shadowRoot?.querySelector('[data-vista]')?.getAttribute('data-vista') === 'login');
      eq('vista', await s.page.evaluate(vista, undefined), 'login');
      expect('sesión borrada', await s.page.evaluate(() => sessionStorage.getItem('erp:sesion') === null, undefined));
      expect('la barra vuelve a «Entrar»', !(await enSombra(s.page, ['erp-app', 'iswc-session-menu[logged]'])));
    },
  },
], {
  antes: async () => { s = await abrir('index.html'); },
  despues: async () => { await s?.cerrar(); },
});
