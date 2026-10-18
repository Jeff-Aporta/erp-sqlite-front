/**
 * <erp-hola> — panel principal (shell de la vista por defecto).
 *
 * Lista las bases SQLite administradas (GET /api/db-admin/databases) y sus estadísticas
 * (GET /api/db-admin/{db}/stats). Todo con piezas del kit: <iswc-card>, <iswc-spinner>,
 * <iswc-callout>, <iswc-button>. El token sale de la sesión (sesion().token).
 */
import { crearComponente, define } from '../../../src/js/base/componente.js';
import { sesion } from '../../../src/js/dominio/sesion.js';

interface Bd { nombre: string; tablas?: number; vistas?: number; bytes?: number; }
interface Props { bds: Bd[]; cargando: boolean; error?: string; }

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const fmt = (n: number) => (n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB');

const ErpHola = crearComponente<Props>(
  import.meta.url,
  'erp-hola',
  { bds: [], cargando: true },
  (root, props, host) => {
    const h = host as unknown as { _cargado?: boolean };
    if (!h._cargado) { h._cargado = true; setTimeout(() => void cargar(host as HTMLElement & { props: Partial<Props> }), 0); }

    if (props.cargando) {
      root.innerHTML = '<section class="panel" part="panel"><div class="cargando"><iswc-spinner></iswc-spinner> Cargando bases…</div></section>';
      return;
    }
    const cards = (props.bds ?? []).map((b) => `
      <iswc-card>
        <span slot="header">${esc(b.nombre)}</span>
        <div class="stats">
          <div class="stat"><strong>${b.tablas ?? '—'}</strong><span>tablas</span></div>
          <div class="stat"><strong>${b.vistas ?? '—'}</strong><span>vistas</span></div>
          <div class="stat"><strong>${b.bytes != null ? esc(fmt(b.bytes)) : '—'}</strong><span>tamaño</span></div>
        </div>
      </iswc-card>`).join('');

    root.innerHTML = `
      <section class="panel" part="panel">
        <header class="panel-head">
          <h1 class="titulo">Bases de datos</h1>
          <p class="lede">Bases SQLite administradas por el API. Reusa el kit <code>iswc</code>.</p>
        <div class="acc"><iswc-button id="consola" color="brand" variant="filled"><iswc-icon slot="start" icon="mdi:console"></iswc-icon> Consola SQL</iswc-button></div>
        </header>
        ${props.error ? `<iswc-callout color="danger">${esc(props.error)}</iswc-callout>` : ''}
        <div class="grid">${cards || '<p class="vacio">No hay bases todavía.</p>'}</div>
      </section>
      <erp-consola></erp-consola>`;
    this.querySelector('#consola')?.addEventListener('iswc-click', () => { window.dispatchEvent(new Event('erp-open-consola')); });
  },
);

async function cargar(host: HTMLElement & { props: Partial<Props> }) {
  const s = sesion();
  if (!s) { host.props = { bds: [], cargando: false }; return; }
  const H = { authorization: 'Bearer ' + s.token };
  try {
    const r = await fetch('/api/db-admin/databases', { headers: H });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json() as { databases: string[] };
    const bds = await Promise.all((j.databases ?? []).map(async (nombre) => {
      try {
        const st = await (await fetch('/api/db-admin/' + encodeURIComponent(nombre) + '/stats', { headers: H })).json() as { tables?: number; views?: number; sizeBytes?: number };
        return { nombre, tablas: st.tables, vistas: st.views, bytes: st.sizeBytes };
      } catch { return { nombre }; }
    }));
    host.props = { bds, cargando: false };
  } catch (e) {
    host.props = { bds: [], cargando: false, error: (e as Error).message };
  }
}

define('erp-hola', ErpHola);
