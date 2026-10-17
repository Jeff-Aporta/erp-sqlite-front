// sesion.test.ts — dominio de la sesión (sin navegador), sobre lo PUBLICADO en dist/cdn, con un API falso.
//
//   W-LOG-01   login correcto guarda la sesión (sessionStorage; con «Recordar», localStorage) y manda el Bearer
//   W-LOG-02   credenciales malas (401) y bloqueo (429) no guardan nada y dan un mensaje legible
//   W-LOG-03   un 401 en una llamada autenticada cierra la sesión local y avisa el cambio
//   W-LOG-04   lo guardado vencido o corrupto se descarta al arrancar
//   W-LOG-05   salir avisa al API y limpia aunque el API falle
import { definirPruebas } from '../../src/vendor/iswc-root/tools/pruebas.ts';

const CLAVE = 'erp:sesion';
const futuro = () => new Date(Date.now() + 3_600_000).toISOString();
const TOKEN = 'eyJhbGciOiJIUzM4NCJ9.prueba.firma-de-prueba';

type Llamada = { metodo: string; ruta: string; auth: string | null };
let llamadas: Llamada[] = [];
let respuesta: (ruta: string) => { status: number; body?: unknown } = () => ({ status: 200 });

const fetchFalso: typeof fetch = async (input, init) => {
  const ruta = new URL(String(input)).pathname;
  const auth = new Headers(init?.headers).get('authorization');
  llamadas.push({ metodo: init?.method ?? 'GET', ruta, auth });
  const r = respuesta(ruta);
  return new Response(r.body === undefined ? null : JSON.stringify(r.body), { status: r.status });
};

const limpiar = () => { sessionStorage.clear(); localStorage.removeItem(CLAVE); llamadas = []; };
limpiar();
const S = await import('../../dist/cdn/js/dominio/sesion.js');
const nuevo = () => S.configurar({ baseUrl: 'http://api.test/api', fetch: fetchFalso });
const okLogin = () => ({ status: 200, body: { token: TOKEN, tipo: 'Bearer', expira: futuro(), usuario: { iusuario: '1', nombre: 'Admin' } } });

export default definirPruebas([
  {
    nombre: 'sesion W-LOG-01 login guarda la sesión y usa el Bearer',
    categoria: 'what',
    async correr({ eq, expect }) {
      limpiar(); nuevo();
      respuesta = (r) => (r.endsWith('/login') ? okLogin() : { status: 200, body: { databases: [] } });
      const s = await S.entrar('admin', 'secreta123', false);
      eq('usuario', s.usuario.nombre, 'Admin');
      expect('en sessionStorage', sessionStorage.getItem(CLAVE) !== null);
      expect('no en localStorage', localStorage.getItem(CLAVE) === null);
      await S.api((c: { databases(): Promise<unknown> }) => c.databases());
      eq('Bearer en la llamada protegida', llamadas.at(-1)?.auth, `Bearer ${TOKEN}`);
      eq('login sin Bearer', llamadas[0]?.auth, null);

      limpiar(); nuevo();
      await S.entrar('admin', 'secreta123', true);
      expect('con Recordar: localStorage', localStorage.getItem(CLAVE) !== null && sessionStorage.getItem(CLAVE) === null);
      nuevo();
      eq('sobrevive a recargar', S.sesion()?.usuario.nombre, 'Admin');
      limpiar();
    },
  },
  {
    nombre: 'sesion W-LOG-02 401 y 429 no guardan nada y dan mensaje',
    categoria: 'what',
    async correr({ eq, expect }) {
      for (const [status, texto] of [[401, 'Usuario o contraseña incorrectos'], [429, 'Demasiados intentos: espera unos minutos']] as const) {
        limpiar(); nuevo();
        respuesta = () => ({ status, body: { error: 'x' } });
        let error: unknown = null;
        await S.entrar('admin', 'mala', false).catch((e: unknown) => { error = e; });
        eq(`mensaje ${status}`, S.mensajeError(error), texto);
        expect(`sin sesión tras ${status}`, S.sesion() === null && sessionStorage.getItem(CLAVE) === null);
      }
      eq('400 muestra el texto de DER', S.mensajeError(await (async () => {
        respuesta = () => ({ status: 400, body: { error: 'Usuario requerido' } });
        return await S.entrar('', '', false).catch((e: unknown) => e);
      })()), 'Usuario requerido');
      eq('sin red', S.mensajeError(new TypeError('fetch failed')), 'No se pudo contactar el servidor');
    },
  },
  {
    nombre: 'sesion W-LOG-03 un 401 autenticado cierra la sesión y avisa',
    categoria: 'what',
    async correr({ eq, expect }) {
      limpiar(); nuevo();
      respuesta = (r) => (r.endsWith('/login') ? okLogin() : { status: 401, body: { error: 'Token revocado' } });
      await S.entrar('admin', 'secreta123', false);
      const avisos: unknown[] = [];
      const quitar = S.alCambiar((s: unknown) => avisos.push(s));
      const fallo = await S.api((c: { databases(): Promise<unknown> }) => c.databases()).then(() => null, (e: unknown) => e);
      quitar();
      expect('propaga el error', fallo !== null);
      expect('sesión cerrada', S.sesion() === null && sessionStorage.getItem(CLAVE) === null);
      eq('avisó una vez con null', avisos, [null]);
    },
  },
  {
    nombre: 'sesion W-LOG-04 descarta lo vencido o corrupto',
    categoria: 'what',
    correr({ expect }) {
      limpiar();
      sessionStorage.setItem(CLAVE, JSON.stringify({ token: TOKEN, expira: '2000-01-01T00:00:00Z', usuario: { iusuario: '1', nombre: 'A' }, recordar: false }));
      nuevo();
      expect('vencida → null', S.sesion() === null && sessionStorage.getItem(CLAVE) === null);
      sessionStorage.setItem(CLAVE, '{no es json');
      nuevo();
      expect('corrupta → null', S.sesion() === null && sessionStorage.getItem(CLAVE) === null);
      sessionStorage.setItem(CLAVE, JSON.stringify({ token: 'corto', expira: futuro() }));
      nuevo();
      expect('forma inválida → null', S.sesion() === null);
      limpiar();
    },
  },
  {
    nombre: 'sesion W-LOG-05 salir avisa al API y limpia aunque falle',
    categoria: 'what',
    async correr({ eq, expect }) {
      for (const [todas, ruta] of [[false, '/api/logout'], [true, '/api/logout/all']] as const) {
        limpiar(); nuevo();
        respuesta = (r) => (r.endsWith('/login') ? okLogin() : { status: 500 });
        await S.entrar('admin', 'secreta123', false);
        await S.salir(todas);
        eq(`llamó ${ruta}`, `${llamadas.at(-1)?.metodo} ${llamadas.at(-1)?.ruta}`, `DELETE ${ruta}`);
        expect(`limpio tras 500 (${ruta})`, S.sesion() === null && sessionStorage.getItem(CLAVE) === null);
      }
    },
  },
]);
