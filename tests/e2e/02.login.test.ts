// 02.login.test.ts — puerta de acceso (Stagehand DETERMINISTA, sin LLM ni API real). Caja negra.
//
//   W-LOG-10   sin sesión, la app muestra el login (y no la bienvenida)
//   W-LOG-11   si el API no responde bien, el login muestra el error y no entra
//   W-LOG-12   con sesión, «Salir» cierra la sesión y vuelve al login
//
// El servidor de e2e es estático (sin /api): /api/login responde 404. El login real contra DER lo
// cubre el e2e del repo `api`; la lógica de sesión, tests/vistas/sesion.test.ts.
import { definirPruebas } from '../../src/vendor/iswc-root/tools/pruebas.ts';
import { abrir, conSesionDePrueba, enSombra, esperar } from '../../scripts/gate/e2e/harness.ts';

let s: Awaited<ReturnType<typeof abrir>>;
const vista = () => document.querySelector('erp-app')?.shadowRoot?.querySelector('main')?.getAttribute('data-vista') ?? '';
const login = () => document.querySelector('erp-app')?.shadowRoot?.querySelector('erp-login')?.shadowRoot?.querySelector('iswc-login') ?? null;

export default definirPruebas([
  {
    nombre: 'login W-LOG-10 sin sesión se ve el login',
    categoria: 'what',
    async correr({ eq, expect }) {
      await esperar(s.page, () => !!document.querySelector('erp-app')?.shadowRoot?.querySelector('main'), 30_000);
      eq('vista', await s.page.evaluate(vista, undefined), 'login');
      await esperar(s.page, () => !!login());
      expect('iswc-login montado', await s.page.evaluate(() => !!login(), undefined));
      expect('sin botón Salir', !(await enSombra(s.page, ['erp-app', '#salir'])));
    },
  },
  {
    nombre: 'login W-LOG-11 un error del API se muestra y no entra',
    categoria: 'what',
    async correr({ eq, expect }) {
      // El contrato de <iswc-login> es su evento de envío: se emite como lo haría el formulario.
      await s.page.evaluate(() => {
        login()?.dispatchEvent(new CustomEvent('iswc-login-submit', {
          detail: { username: 'admin', password: 'cualquiera', remember: false },
          bubbles: true, composed: true,
        }));
      }, undefined);
      await esperar(s.page, () => !!login()?.getAttribute('error'));
      eq('mensaje', await s.page.evaluate(() => login()?.getAttribute('error'), undefined), 'Error del servidor (404)');
      eq('sigue en login', await s.page.evaluate(vista, undefined), 'login');
      expect('nada guardado', await s.page.evaluate(() => sessionStorage.getItem('erp:sesion') === null, undefined));
    },
  },
  {
    nombre: 'login W-LOG-12 Salir cierra la sesión y vuelve al login',
    categoria: 'what',
    async correr({ eq, expect }) {
      await conSesionDePrueba(s.page);
      await esperar(s.page, () => document.querySelector('erp-app')?.shadowRoot?.querySelector('main')?.getAttribute('data-vista') === 'hola', 30_000);
      expect('usuario en la barra', String(await enSombra(s.page, ['erp-app', '.usuario'], 'text')).includes('Prueba e2e'));
      await enSombra(s.page, ['erp-app', '#salir', 'button'], 'click');
      await esperar(s.page, () => document.querySelector('erp-app')?.shadowRoot?.querySelector('main')?.getAttribute('data-vista') === 'login');
      eq('vista', await s.page.evaluate(vista, undefined), 'login');
      expect('sesión borrada', await s.page.evaluate(() => sessionStorage.getItem('erp:sesion') === null, undefined));
    },
  },
], {
  antes: async () => { s = await abrir('index.html'); },
  despues: async () => { await s?.cerrar(); },
});
