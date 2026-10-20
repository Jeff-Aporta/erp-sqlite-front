/**
 * <erp-app> — shell de la app sobre el layout COMÚN del kit (todas las apps iswc usan el mismo):
 *
 *   <iswc-app-shell brand="ERP SQLite">       barra fija + vista con scroll propio
 *     <iswc-app-nav slot="nav">               secciones (solo con sesión)
 *     <iswc-session-menu slot="actions">      sin sesión: «Entrar» (dropdown); con sesión: usuario + salir
 *     <iswc-theme-toggle slot="actions">
 *     <div class="vista" data-vista>          shell de la vista activa
 *
 * El kit no autentica: `iswc-login-submit` → `entrar()` y `iswc-logout` → `salir()` de
 * `dominio/sesion.ts`. Sin sesión vigente la vista es `login` (pantalla completa, fallback del
 * dropdown): el front no protege datos (eso lo hace el API con 401), solo evita pantallas inútiles.
 */
import { crearComponente, define, html } from '../../base/componente.js';
import type { ErpAppProps } from '../../consts/schemas/componentes.schemas.js';
import { alCambiar, entrar, mensajeError, salir, sesion } from '../../dominio/sesion.js';

/** Vista → tag del shell de esa vista (cada vista tiene UN shell). */
const SHELLS: Record<string, string> = { hola: 'erp-hola', login: 'erp-login' };

/**
 * Secciones de la barra. `bases` es la vista `hola`; Consola SQL y Catálogo son paneles de esa
 * vista que se abren con su evento de window (no cambian la pestaña activa).
 */
const SECCIONES = [
  { id: 'bases', label: 'Bases', icon: 'mdi:database' },
  { id: 'consola', label: 'Consola SQL', icon: 'mdi:console', evento: 'erp-open-consola' },
  { id: 'catalogo', label: 'Catálogo', icon: 'mdi:database-search', evento: 'erp-open-catalogo' },
] as const;

type Nav = HTMLElement & { rows: unknown };
type Menu = HTMLElement & { error: string; loading: boolean; reset(): void };
type Envio = { mode?: string; username?: string; password?: string; remember?: boolean };

/** Apps montadas: un cambio de sesión (login, logout, 401) las repinta. */
const montadas = new Set<HTMLElement & { props: Partial<ErpAppProps> }>();
alCambiar(() => { for (const app of montadas) if (app.isConnected) app.props = {}; else montadas.delete(app); });

const ErpApp = crearComponente<ErpAppProps>(import.meta.url, 'erp-app', { vista: 'hola' }, (root, props, host) => {
  montadas.add(host as HTMLElement & { props: Partial<ErpAppProps> });
  const s = sesion();
  const vista = !s ? 'login' : props.vista !== 'login' && SHELLS[props.vista] ? props.vista : 'hola';
  const shell = document.createElement(SHELLS[vista]!);

  let enviando = false;
  const enviar = async (e: Event) => {
    const menu = e.currentTarget as Menu;
    const d = (e as CustomEvent<Envio>).detail ?? {};
    if (enviando || d.mode === 'token') return; // DER solo acepta usuario + contraseña
    enviando = true;
    menu.error = '';
    menu.loading = true;
    try {
      await entrar(String(d.username ?? '').trim(), String(d.password ?? ''), !!d.remember);
      // `alCambiar` repinta la app con la sesión abierta.
    } catch (err) {
      menu.error = mensajeError(err);
    } finally {
      menu.loading = false;
      enviando = false;
    }
  };

  const seleccionar = (e: Event) => {
    const id = (e as CustomEvent<{ id?: string }>).detail?.id;
    const sec = SECCIONES.find((x) => x.id === id);
    if (!sec || !('evento' in sec)) return;
    e.preventDefault(); // la pestaña activa sigue siendo «Bases»: el panel se abre encima
    globalThis.dispatchEvent(new Event(sec.evento));
  };

  root.append(html`
    <iswc-app-shell brand="ERP SQLite" logo="mdi:database" part="shell">
      ${s ? html`<iswc-app-nav slot="nav" id="nav" oniswc-nav-select=${seleccionar}></iswc-app-nav>` : null}
      <iswc-theme-toggle slot="actions" scope="root" id="tema"></iswc-theme-toggle>
      <div class="vista" part="vista" data-vista=${vista}>${shell}</div>
    </iswc-app-shell>
  `);

  // WORKAROUND kit @7ee7b872: el <iswc-login> interno del session-menu (vía <iswc-login-dropdown>) se mejora
  // ya conectado; su attributeChangedCallback (compact, password-toggle) corre antes de connectedCallback, que es
  // donde construye su DOM, y lanza «Cannot set properties of undefined (setting 'textContent')». Se crea
  // suelto, se fuerza el upgrade de todo su árbol de sombra DESCONECTADO (allí ese callback no pinta) y luego se
  // inserta. Reportado al kit; quitar cuando iswc-login lo corrija.
  const tema = root.querySelector('#tema');
  const montarSesion = () => {
    if (!tema?.isConnected) return; // la app se repintó mientras se esperaba el tag
    const menu = document.createElement('iswc-session-menu');
    menu.id = 'sesion';
    menu.slot = 'actions';
    if (s) {
      menu.setAttribute('logged', '');
      menu.setAttribute('name', s.usuario.nombre || s.usuario.iusuario);
      menu.setAttribute('subtitle', `Usuario ${s.usuario.iusuario}`);
    }
    menu.addEventListener('iswc-login-submit', enviar);
    menu.addEventListener('iswc-logout', () => void salir());
    // Dos pasadas: la primera crea el árbol del login-dropdown; la segunda mejora el <iswc-login> que éste clonó.
    customElements.upgrade(menu);
    customElements.upgrade(menu);
    tema.before(menu);
  };
  if (customElements.get('iswc-session-menu')) montarSesion();
  else void customElements.whenDefined('iswc-session-menu').then(montarSesion);

  const nav = root.querySelector<Nav>('#nav');
  if (nav) {
    nav.rows = [{ id: 'seccion', label: 'Secciones', value: 'bases', tabs: SECCIONES.map(({ id, label, icon }) => ({ id, label, icon })) }];
  }
});

define('erp-app', ErpApp);
